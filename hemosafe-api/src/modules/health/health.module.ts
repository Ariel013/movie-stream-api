import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
