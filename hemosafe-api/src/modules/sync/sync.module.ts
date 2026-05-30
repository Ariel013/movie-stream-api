import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@Module({
  imports:     [RedisModule],
  controllers: [SyncController],
  providers:   [SyncService, IdempotencyInterceptor],
  exports:     [SyncService],
})
export class SyncModule {}
