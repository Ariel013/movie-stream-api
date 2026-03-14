import { AboGroup, RhFactor } from '@prisma/client';
export declare class CreateBloodBagDto {
    code: string;
    aboGroup: AboGroup;
    rhFactor: RhFactor;
    bloodTypeId: string;
    bloodBankId?: string;
    donorId?: string;
    screeningId?: string;
    volumeMl: number;
    collectedAt: string;
    expiresAt: string;
}
