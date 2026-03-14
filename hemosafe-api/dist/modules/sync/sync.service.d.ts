import { PrismaService } from '../../prisma/prisma.service';
import { BatchSyncDto } from './dto/batch-sync.dto';
import type { Redis } from 'ioredis';
export interface OperationResult {
    operationId: string;
    status: 'applied' | 'duplicate' | 'conflict' | 'error';
    errorCode?: number;
    errorMessage?: string;
    data?: unknown;
}
export interface PullResponse {
    stock: unknown[];
    reservations: unknown[];
    patients: unknown[];
    notifications: unknown[];
    serverTime: string;
}
export declare class SyncService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly IDEM_PREFIX;
    private readonly IDEM_TTL;
    constructor(prisma: PrismaService, redis: Redis);
    processBatch(dto: BatchSyncDto, actorId: string): Promise<OperationResult[]>;
    private processOne;
    private dispatch;
    pull(since: Date | null, scopes: string[], facilityId: string): Promise<PullResponse>;
}
