import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { ReservationsModule } from '../reservations/reservations.module';
import { BloodBagsModule } from '../blood-bags/blood-bags.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports:     [RedisModule, ReservationsModule, BloodBagsModule, PatientsModule],
  controllers: [SyncController],
  providers:   [SyncService, IdempotencyInterceptor],
  exports:     [SyncService],
})
export class SyncModule {}
