import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';

/**
 * Thin read-through cache for expensive, frequently-polled aggregate queries
 * (dashboards, maps). Not for per-user or correctness-sensitive data — callers
 * decide the TTL based on how stale the data is allowed to be.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getOrSet<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch (err) {
      this.logger.warn(`Cache read failed for ${key}, falling back to source`, err as Error);
    }

    const fresh = await load();

    try {
      await this.redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Cache write failed for ${key}`, err as Error);
    }

    return fresh;
  }
}
