import type { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
interface CheckResult {
    status: 'ok' | 'error';
    latencyMs: number;
    error?: string;
}
export interface HealthReport {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: CheckResult;
        redis: CheckResult;
        memory: {
            heapUsedMb: number;
            heapTotalMb: number;
            rssMb: number;
        };
    };
}
export declare class HealthService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly version;
    private requestCount;
    private errorCount;
    private startedAt;
    constructor(prisma: PrismaService, redis: Redis);
    check(): Promise<HealthReport>;
    private checkDatabase;
    private checkRedis;
    getMetrics(): Promise<string>;
    incrementRequest(isError: boolean): void;
}
export {};
