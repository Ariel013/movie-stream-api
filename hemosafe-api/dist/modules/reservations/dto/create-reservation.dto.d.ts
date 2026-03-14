import { AboGroup, RhFactor, UrgencyLevel } from '@prisma/client';
export declare class CreateReservationDto {
    bloodBankId: string;
    aboGroup: AboGroup;
    rhFactor: RhFactor;
    bloodTypeId: string;
    quantity: number;
    urgency: UrgencyLevel;
    prescriptionId?: string;
    notes?: string;
}
