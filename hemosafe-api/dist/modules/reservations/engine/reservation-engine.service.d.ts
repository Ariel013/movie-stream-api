import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservationStatus, UrgencyLevel } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { LockingService } from './locking.service';
import { ReservationValidatorService } from './reservation-validator.service';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';
export interface AllocateInput {
    hospitalId: string;
    bloodBankId: string;
    bloodTypeId: string;
    quantity: number;
    urgency: UrgencyLevel;
    prescriptionId?: string;
    notes?: string;
    requestedBy: string;
}
export interface ConfirmPickupInput {
    reservationId: string;
    actor: JwtPayload;
}
export declare class ReservationEngineService {
    private readonly prisma;
    private readonly locking;
    private readonly validator;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, locking: LockingService, validator: ReservationValidatorService, events: EventEmitter2);
    allocate(input: AllocateInput): Promise<({
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
    transition(reservationId: string, nextStatus: ReservationStatus, actor: JwtPayload, cancelReason?: string): Promise<{
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
    expireStaleReservations(): Promise<number>;
    verifyBagForPickup(reservationId: string, bagCode: string, actor: JwtPayload): Promise<{
        valid: boolean;
        bagId: string;
        message: string;
    }>;
    private loadReservation;
}
