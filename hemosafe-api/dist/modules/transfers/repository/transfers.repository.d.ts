import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class TransfersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(where: Prisma.TransferWhereInput): Prisma.PrismaPromise<({
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
    findById(id: string): Prisma.Prisma__TransferClient<({
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.TransferCreateInput): Prisma.Prisma__TransferClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Prisma.TransferUpdateInput): Prisma.Prisma__TransferClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
