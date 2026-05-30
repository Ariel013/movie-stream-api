import { BloodBagsService } from './blood-bags.service';
import { CreateBloodBagDto } from './dto/create-blood-bag.dto';
import { FilterBloodBagsDto } from './dto/filter-blood-bags.dto';
import { DiscardBloodBagDto } from './dto/discard-blood-bag.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class BloodBagsController {
    private readonly service;
    constructor(service: BloodBagsService);
    listBloodTypes(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        aboGroup: import(".prisma/client").$Enums.AboGroup;
        rhFactor: import(".prisma/client").$Enums.RhFactor;
        label: string;
    }[]>;
    findAll(dto: FilterBloodBagsDto, actor: JwtPayload): Promise<{
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
                id: string;
                name: string;
                code: string;
            };
        } & {
            id: string;
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
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    expiringSoon(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<({
        bloodType: {
            label: string;
        };
        bloodBank: {
            name: string;
        };
    } & {
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    stockSummary(bloodBankId: string, actor: JwtPayload): import(".prisma/client").Prisma.GetBloodBagGroupByPayload<{
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
    findOne(id: string, actor: JwtPayload): Promise<{
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
        screening: {
            id: string;
            donorId: string;
            screenedBy: string | null;
            screenedAt: Date;
            hemoglobinGDl: import("@prisma/client/runtime/library").Decimal | null;
            bloodPressure: string | null;
            weightKg: import("@prisma/client/runtime/library").Decimal | null;
            temperatureC: import("@prisma/client/runtime/library").Decimal | null;
            isPassed: boolean;
            notes: string | null;
        } | null;
        bloodBank: {
            id: string;
            name: string;
            code: string;
        };
        stockMovements: {
            id: string;
            createdAt: Date;
            notes: string | null;
            bloodBagId: string;
            movementType: import(".prisma/client").$Enums.MovementType;
            fromStatus: import(".prisma/client").$Enums.BagStatus;
            toStatus: import(".prisma/client").$Enums.BagStatus;
            performedBy: string | null;
            reservationId: string | null;
            transferId: string | null;
        }[];
    } & {
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateBloodBagDto, actor: JwtPayload): Promise<{
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
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    discard(id: string, dto: DiscardBloodBagDto, actor: JwtPayload): Promise<{
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
    }>;
}
