import { BagStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class BloodBagsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(where: Prisma.BloodBagWhereInput, page: number, limit: number): Promise<{
        data: ({
            bloodType: {
                aboGroup: import(".prisma/client").$Enums.AboGroup;
                rhFactor: import(".prisma/client").$Enums.RhFactor;
                label: string;
            };
            donor: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            bloodBank: {
                name: string;
                id: string;
                code: string;
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(id: string): Prisma.Prisma__BloodBagClient<({
        bloodType: {
            aboGroup: import(".prisma/client").$Enums.AboGroup;
            rhFactor: import(".prisma/client").$Enums.RhFactor;
            label: string;
        };
        donor: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        stockMovements: {
            id: string;
            createdAt: Date;
            bloodBagId: string;
            movementType: import(".prisma/client").$Enums.MovementType;
            fromStatus: import(".prisma/client").$Enums.BagStatus;
            toStatus: import(".prisma/client").$Enums.BagStatus;
            performedBy: string | null;
            reservationId: string | null;
            transferId: string | null;
            notes: string | null;
        }[];
        screening: {
            id: string;
            donorId: string;
            notes: string | null;
            screenedBy: string | null;
            screenedAt: Date;
            hemoglobinGDl: Prisma.Decimal | null;
            bloodPressure: string | null;
            weightKg: Prisma.Decimal | null;
            temperatureC: Prisma.Decimal | null;
            isPassed: boolean;
        } | null;
        bloodBank: {
            name: string;
            id: string;
            code: string;
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    findByCode(code: string): Prisma.Prisma__BloodBagClient<({
        bloodType: {
            aboGroup: import(".prisma/client").$Enums.AboGroup;
            rhFactor: import(".prisma/client").$Enums.RhFactor;
            label: string;
        };
        donor: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        bloodBank: {
            name: string;
            id: string;
            code: string;
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.BloodBagCreateInput): Prisma.Prisma__BloodBagClient<{
        bloodType: {
            aboGroup: import(".prisma/client").$Enums.AboGroup;
            rhFactor: import(".prisma/client").$Enums.RhFactor;
            label: string;
        };
        donor: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        bloodBank: {
            name: string;
            id: string;
            code: string;
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    updateStatus(id: string, status: BagStatus, extra?: Partial<Prisma.BloodBagUpdateInput>): Prisma.Prisma__BloodBagClient<{
        bloodType: {
            aboGroup: import(".prisma/client").$Enums.AboGroup;
            rhFactor: import(".prisma/client").$Enums.RhFactor;
            label: string;
        };
        donor: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        bloodBank: {
            name: string;
            id: string;
            code: string;
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    stockSummary(bloodBankId: string): Prisma.GetBloodBagGroupByPayload<{
        by: "bloodTypeId"[];
        where: {
            bloodBankId: string;
            status: "AVAILABLE";
            expiresAt: {
                gt: Date;
            };
        };
        _count: {
            id: true;
        };
    }>;
    expiringSoon(bloodBankId?: string): Prisma.PrismaPromise<({
        bloodType: {
            label: string;
        };
        bloodBank: {
            name: string;
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
    })[]>;
}
