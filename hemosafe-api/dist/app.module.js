"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const ioredis_1 = require("@nestjs-modules/ioredis");
const config_validation_1 = require("./config/config.validation");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const hospitals_module_1 = require("./modules/hospitals/hospitals.module");
const blood_banks_module_1 = require("./modules/blood-banks/blood-banks.module");
const blood_bags_module_1 = require("./modules/blood-bags/blood-bags.module");
const donors_module_1 = require("./modules/donors/donors.module");
const patients_module_1 = require("./modules/patients/patients.module");
const prescriptions_module_1 = require("./modules/prescriptions/prescriptions.module");
const reservations_module_1 = require("./modules/reservations/reservations.module");
const transfers_module_1 = require("./modules/transfers/transfers.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const statistics_module_1 = require("./modules/statistics/statistics.module");
const sync_module_1 = require("./modules/sync/sync.module");
const health_module_1 = require("./modules/health/health.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: config_validation_1.validate,
                cache: true,
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    throttlers: [
                        { ttl: 60_000, limit: cfg.get('RATE_LIMIT_MAX', 120) },
                    ],
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    type: 'single',
                    url: cfg.get('REDIS_URL', 'redis://localhost:6379'),
                }),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            hospitals_module_1.HospitalsModule,
            blood_banks_module_1.BloodBanksModule,
            blood_bags_module_1.BloodBagsModule,
            donors_module_1.DonorsModule,
            patients_module_1.PatientsModule,
            prescriptions_module_1.PrescriptionsModule,
            reservations_module_1.ReservationsModule,
            transfers_module_1.TransfersModule,
            notifications_module_1.NotificationsModule,
            statistics_module_1.StatisticsModule,
            sync_module_1.SyncModule,
            health_module_1.HealthModule,
            audit_logs_module_1.AuditLogsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map