import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@nestjs-modules/ioredis';
import { validate } from './config/config.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { BloodBanksModule } from './modules/blood-banks/blood-banks.module';
import { BloodBagsModule } from './modules/blood-bags/blood-bags.module';
import { DonorsModule } from './modules/donors/donors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { SyncModule } from './modules/sync/sync.module';
import { HealthModule } from './modules/health/health.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      cache: true,
    }),

    // ── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: [
          { ttl: 60_000, limit: cfg.get<number>('RATE_LIMIT_MAX', 120) },
        ],
      }),
    }),

    // ── Scheduling (expiry cron, etc.) ───────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Event emitter (cross-module notifications) ───────────────────────────
    EventEmitterModule.forRoot(),

    // ── Redis ────────────────────────────────────────────────────────────────
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'single',
        url: cfg.get<string>('REDIS_URL', 'redis://localhost:6379'),
      }),
    }),

    // ── Prisma ──────────────────────────────────────────────────────────────
    PrismaModule,

    // ── Feature modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    HospitalsModule,
    BloodBanksModule,
    BloodBagsModule,
    DonorsModule,
    PatientsModule,
    PrescriptionsModule,
    ReservationsModule,
    TransfersModule,
    NotificationsModule,
    StatisticsModule,
    SyncModule,
    HealthModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
