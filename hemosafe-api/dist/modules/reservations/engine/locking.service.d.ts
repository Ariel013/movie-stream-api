import { PrismaService } from '../../../prisma/prisma.service';
type Tx = Omit<PrismaService, 'transaction' | 'enableShutdownHooks' | '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;
export declare class LockingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    acquireForAllocation(tx: Tx, bloodBankId: string, bloodTypeId: string): Promise<void>;
    tryAcquireForAllocation(tx: Tx, bloodBankId: string, bloodTypeId: string): Promise<boolean>;
    acquireWithRetry(bloodBankId: string, bloodTypeId: string, maxRetries?: number, delayMs?: number): Promise<() => Promise<void>>;
    computeKey(bloodBankId: string, bloodTypeId: string): string;
    private sleep;
}
export {};
