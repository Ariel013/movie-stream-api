import { PrismaService } from '../../prisma/prisma.service';
export declare class AuditLogsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(limit?: number, skip?: number): Promise<{
        data: {
            id: string;
            user: {
                firstName: string;
                lastName: string;
            } | null;
            userId: string | null;
            role: import(".prisma/client").$Enums.UserRole | null;
            action: string;
            entity: string;
            entityId: string | null;
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
        }[];
        total: number;
        limit: number;
        skip: number;
    }>;
}
