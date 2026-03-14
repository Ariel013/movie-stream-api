"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("@nestjs-modules/ioredis");
const prisma_service_1 = require("../../prisma/prisma.service");
let HealthService = HealthService_1 = class HealthService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(HealthService_1.name);
        this.version = process.env.npm_package_version ?? '1.0.0';
        this.requestCount = 0;
        this.errorCount = 0;
        this.startedAt = Date.now();
    }
    async check() {
        const [db, cache] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
        ]);
        const mem = process.memoryUsage();
        const memory = {
            heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
            rssMb: Math.round(mem.rss / 1024 / 1024),
        };
        const allOk = db.status === 'ok' && cache.status === 'ok';
        const anyDown = db.status === 'error' || cache.status === 'error';
        const report = {
            status: anyDown ? 'error' : allOk ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            version: this.version,
            uptime: Math.floor((Date.now() - this.startedAt) / 1000),
            checks: { database: db, redis: cache, memory },
        };
        if (anyDown) {
            this.logger.warn('Health check failed', report);
            throw new common_1.ServiceUnavailableException(report);
        }
        return report;
    }
    async checkDatabase() {
        const t0 = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { status: 'ok', latencyMs: Date.now() - t0 };
        }
        catch (err) {
            return { status: 'error', latencyMs: Date.now() - t0, error: err.message };
        }
    }
    async checkRedis() {
        const t0 = Date.now();
        try {
            const pong = await this.redis.ping();
            if (pong !== 'PONG')
                throw new Error('Unexpected PING response');
            return { status: 'ok', latencyMs: Date.now() - t0 };
        }
        catch (err) {
            return { status: 'error', latencyMs: Date.now() - t0, error: err.message };
        }
    }
    async getMetrics() {
        const mem = process.memoryUsage();
        const uptime = Math.floor((Date.now() - this.startedAt) / 1000);
        const lines = [
            '# HELP process_uptime_seconds Time since the API process started',
            '# TYPE process_uptime_seconds gauge',
            `process_uptime_seconds ${uptime}`,
            '# HELP process_heap_used_bytes V8 heap used',
            '# TYPE process_heap_used_bytes gauge',
            `process_heap_used_bytes ${mem.heapUsed}`,
            '# HELP process_heap_total_bytes V8 heap total',
            '# TYPE process_heap_total_bytes gauge',
            `process_heap_total_bytes ${mem.heapTotal}`,
            '# HELP process_rss_bytes Resident Set Size',
            '# TYPE process_rss_bytes gauge',
            `process_rss_bytes ${mem.rss}`,
            '# HELP hemosafe_api_info API version info',
            '# TYPE hemosafe_api_info gauge',
            `hemosafe_api_info{version="${this.version}",node_version="${process.version}"} 1`,
        ];
        return lines.join('\n') + '\n';
    }
    incrementRequest(isError) {
        this.requestCount++;
        if (isError)
            this.errorCount++;
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Function])
], HealthService);
//# sourceMappingURL=health.service.js.map