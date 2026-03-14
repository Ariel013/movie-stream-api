import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { Request, Response } from 'express';

/**
 * Idempotency Interceptor
 *
 * Reads the `X-Idempotency-Key` header (a UUID generated client-side).
 * For each unique key:
 *   - First call  → execute handler, store response in Redis (TTL 24h)
 *   - Replay call → return cached response immediately (HTTP 200)
 *
 * This guarantees that offline-queued mutations cannot be applied twice
 * even if the client retries after an ambiguous failure (5xx / timeout).
 *
 * Only active on mutating methods (POST, PUT, PATCH, DELETE).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly TTL_SECONDS = 86_400; // 24 hours
  private readonly KEY_PREFIX  = 'idem:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = ctx.switchToHttp().getRequest<Request>();

    // Only intercept mutating methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next.handle();
    }

    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

    // No key provided — pass through normally
    if (!idempotencyKey) {
      return next.handle();
    }

    const redisKey = `${this.KEY_PREFIX}${idempotencyKey}`;

    // Check for a cached response
    const cached = await this.redis.get(redisKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { statusCode: number; body: unknown };
      const res = ctx.switchToHttp().getResponse<Response>();
      res.status(parsed.statusCode);
      // Return cached body as a completed observable
      return of(parsed.body);
    }

    // Mark as in-flight (lock) to prevent concurrent replays
    const lock = await this.redis.set(
      `${redisKey}:lock`,
      '1',
      'EX',
      30,   // 30-second lock
      'NX',
    );

    if (!lock) {
      // Another request with the same key is currently in-flight
      throw new HttpException(
        'A request with this idempotency key is already in progress',
        HttpStatus.CONFLICT,
      );
    }

    return next.handle().pipe(
      tap({
        next: async (body) => {
          const res = ctx.switchToHttp().getResponse<Response>();
          const statusCode = res.statusCode || 200;
          // Cache the successful response
          await this.redis.set(
            redisKey,
            JSON.stringify({ statusCode, body }),
            'EX',
            this.TTL_SECONDS,
          );
          await this.redis.del(`${redisKey}:lock`);
        },
        error: async () => {
          // On error, release the lock so the client can retry
          await this.redis.del(`${redisKey}:lock`);
        },
      }),
    );
  }
}
