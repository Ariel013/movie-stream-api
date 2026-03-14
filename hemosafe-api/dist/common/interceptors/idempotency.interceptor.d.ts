import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Redis } from 'ioredis';
export declare class IdempotencyInterceptor implements NestInterceptor {
    private readonly redis;
    private readonly TTL_SECONDS;
    private readonly KEY_PREFIX;
    constructor(redis: Redis);
    intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
}
