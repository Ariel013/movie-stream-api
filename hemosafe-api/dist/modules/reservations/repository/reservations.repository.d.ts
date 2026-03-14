import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class ReservationsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(where: Prisma.ReservationWhereInput): Prisma.PrismaPromise<({
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
    findById(id: string): Prisma.Prisma__ReservationClient<({
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    findByCode(code: string): Prisma.Prisma__ReservationClient<({
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.ReservationCreateInput): Prisma.Prisma__ReservationClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Prisma.ReservationUpdateInput): Prisma.Prisma__ReservationClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findExpired(): Prisma.PrismaPromise<({
        reservationBags: {
            bloodBagId: string;
            reservationId: string;
            allocatedAt: Date;
        }[];
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
}
