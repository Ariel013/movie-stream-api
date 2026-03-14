import { UrgencyLevel } from '@prisma/client';
export declare class CreatePrescriptionDto {
    patientId: string;
    bloodTypeId: string;
    quantity: number;
    urgency: UrgencyLevel;
    clinicalNotes?: string;
    expiresAt?: string;
}
