import { PrismaService } from '../../prisma/prisma.service';
import { TransfersRepository } from './repository/transfers.repository';
import type { CreateTransferDto } from './dto/create-transfer.dto';
import type { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class TransfersService {
    private readonly repo;
    private readonly prisma;
    private readonly logger;
    constructor(repo: TransfersRepository, prisma: PrismaService);
    findAll(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<({
        transferBags: ({
            bloodBag: {
                bloodType: {
                    label: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                bloodTypeId: string;
                donorId: string | null;
                screeningId: string | null;
                bloodBankId: string;
                volumeMl: number;
                collectedAt: Date;
                expiresAt: Date;
                status: import(".prisma/client").$Enums.BagStatus;
                discardedReason: string | null;
            };
        } & {
            bloodBagId: string;
            transferId: string;
        })[];
        fromBank: {
            name: string;
            id: string;
            code: string;
        };
        toBank: {
            name: string;
            id: string;
            code: string;
        };
        initiator: {
            id: string;
            firstName: string;
            lastName: string;
        };
        receiver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.TransferStatus;
        reason: string | null;
        fromBankId: string;
        toBankId: string;
        initiatedBy: string;
        receivedBy: string | null;
        initiatedAt: Date;
        inTransitAt: Date | null;
        receivedAt: Date | null;
    })[]>;
    findOne(id: string, actor: JwtPayload): Promise<{
        transferBags: ({
            bloodBag: {
                bloodType: {
                    label: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                bloodTypeId: string;
                donorId: string | null;
                screeningId: string | null;
                bloodBankId: string;
                volumeMl: number;
                collectedAt: Date;
                expiresAt: Date;
                status: import(".prisma/client").$Enums.BagStatus;
                discardedReason: string | null;
            };
        } & {
            bloodBagId: string;
            transferId: string;
        })[];
        fromBank: {
            name: string;
            id: string;
            code: string;
        };
        toBank: {
            name: string;
            id: string;
            code: string;
        };
        initiator: {
            id: string;
            firstName: string;
            lastName: string;
        };
        receiver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.TransferStatus;
        reason: string | null;
        fromBankId: string;
        toBankId: string;
        initiatedBy: string;
        receivedBy: string | null;
        initiatedAt: Date;
        inTransitAt: Date | null;
        receivedAt: Date | null;
    }>;
    create(dto: CreateTransferDto, actor: JwtPayload): Promise<{
        transferBags: {
            bloodBagId: string;
            transferId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.TransferStatus;
        reason: string | null;
        fromBankId: string;
        toBankId: string;
        initiatedBy: string;
        receivedBy: string | null;
        initiatedAt: Date;
        inTransitAt: Date | null;
        receivedAt: Date | null;
    }>;
    updateStatus(id: string, dto: UpdateTransferStatusDto, actor: JwtPayload): Promise<{
        transferBags: ({
            bloodBag: {
                bloodType: {
                    label: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                bloodTypeId: string;
                donorId: string | null;
                screeningId: string | null;
                bloodBankId: string;
                volumeMl: number;
                collectedAt: Date;
                expiresAt: Date;
                status: import(".prisma/client").$Enums.BagStatus;
                discardedReason: string | null;
            };
        } & {
            bloodBagId: string;
            transferId: string;
        })[];
        fromBank: {
            name: string;
            id: string;
        };
        toBank: {
            name: string;
            id: string;
        };
        initiator: {
            id: string;
            firstName: string;
            lastName: string;
        };
        receiver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.TransferStatus;
        reason: string | null;
        fromBankId: string;
        toBankId: string;
        initiatedBy: string;
        receivedBy: string | null;
        initiatedAt: Date;
        inTransitAt: Date | null;
        receivedAt: Date | null;
    }>;
    cancel(id: string, actor: JwtPayload): Promise<{
        transferBags: ({
            bloodBag: {
                bloodType: {
                    label: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                bloodTypeId: string;
                donorId: string | null;
                screeningId: string | null;
                bloodBankId: string;
                volumeMl: number;
                collectedAt: Date;
                expiresAt: Date;
                status: import(".prisma/client").$Enums.BagStatus;
                discardedReason: string | null;
            };
        } & {
            bloodBagId: string;
            transferId: string;
        })[];
        fromBank: {
            name: string;
            id: string;
        };
        toBank: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        code: string;
        status: import(".prisma/client").$Enums.TransferStatus;
        reason: string | null;
        fromBankId: string;
        toBankId: string;
        initiatedBy: string;
        receivedBy: string | null;
        initiatedAt: Date;
        inTransitAt: Date | null;
        receivedAt: Date | null;
    }>;
    private buildWhere;
    private assertAccess;
}
