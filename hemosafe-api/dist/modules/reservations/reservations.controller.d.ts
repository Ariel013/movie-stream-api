import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { SearchBloodDto } from './dto/search-blood.dto';
import { VerifyBagDto } from './dto/verify-bag.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class ReservationsController {
    private readonly service;
    constructor(service: ReservationsService);
    search(dto: SearchBloodDto): Promise<import("./engine/geo-search.service").BloodBankResult[]>;
    findAll(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<({
        bloodType: {
            label: string;
        };
        bloodBank: {
            name: string;
            id: string;
            code: string;
        };
        reservationBags: ({
            bloodBag: {
                id: string;
                code: string;
                expiresAt: Date;
            };
        } & {
            bloodBagId: string;
            reservationId: string;
            allocatedAt: Date;
        })[];
        hospital: {
            name: string;
            id: string;
            code: string;
        };
        requester: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        bloodTypeId: string;
        bloodBankId: string;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        hospitalId: string;
        quantity: number;
        urgency: import(".prisma/client").$Enums.UrgencyLevel;
        prescriptionId: string | null;
        requestedBy: string;
        confirmedAt: Date | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    })[]>;
    findOne(id: string, actor: JwtPayload): Promise<{
        bloodType: {
            label: string;
        };
        bloodBank: {
            name: string;
            id: string;
            code: string;
        };
        reservationBags: ({
            bloodBag: {
                id: string;
                code: string;
                expiresAt: Date;
            };
        } & {
            bloodBagId: string;
            reservationId: string;
            allocatedAt: Date;
        })[];
        hospital: {
            name: string;
            id: string;
            code: string;
        };
        requester: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        bloodTypeId: string;
        bloodBankId: string;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        hospitalId: string;
        quantity: number;
        urgency: import(".prisma/client").$Enums.UrgencyLevel;
        prescriptionId: string | null;
        requestedBy: string;
        confirmedAt: Date | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    }>;
    create(dto: CreateReservationDto, actor: JwtPayload): Promise<({
        bloodType: {
            label: string;
        };
        bloodBank: {
            name: string;
            id: string;
            code: string;
        };
        reservationBags: ({
            bloodBag: {
                id: string;
                code: string;
                volumeMl: number;
                expiresAt: Date;
                status: import(".prisma/client").$Enums.BagStatus;
            };
        } & {
            bloodBagId: string;
            reservationId: string;
            allocatedAt: Date;
        })[];
        hospital: {
            name: string;
            id: string;
            code: string;
        };
        requester: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        bloodTypeId: string;
        bloodBankId: string;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        hospitalId: string;
        quantity: number;
        urgency: import(".prisma/client").$Enums.UrgencyLevel;
        prescriptionId: string | null;
        requestedBy: string;
        confirmedAt: Date | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    }) | null>;
    updateStatus(id: string, dto: UpdateReservationStatusDto, actor: JwtPayload): Promise<{
        bloodType: {
            label: string;
        };
        bloodBank: {
            name: string;
            id: string;
        };
        reservationBags: ({
            bloodBag: {
                id: string;
                code: string;
                status: import(".prisma/client").$Enums.BagStatus;
            };
        } & {
            bloodBagId: string;
            reservationId: string;
            allocatedAt: Date;
        })[];
        hospital: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        bloodTypeId: string;
        bloodBankId: string;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.ReservationStatus;
        notes: string | null;
        hospitalId: string;
        quantity: number;
        urgency: import(".prisma/client").$Enums.UrgencyLevel;
        prescriptionId: string | null;
        requestedBy: string;
        confirmedAt: Date | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    }>;
    verifyBag(reservationId: string, dto: VerifyBagDto, actor: JwtPayload): Promise<{
        valid: boolean;
        bagId: string;
        message: string;
    }>;
}
