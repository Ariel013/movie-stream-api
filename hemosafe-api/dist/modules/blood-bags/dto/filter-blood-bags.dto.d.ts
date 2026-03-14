import { AboGroup, BagStatus, RhFactor } from '@prisma/client';
export declare class FilterBloodBagsDto {
    aboGroup?: AboGroup;
    rhFactor?: RhFactor;
    status?: BagStatus;
    bloodBankId?: string;
    page?: number;
    limit?: number;
}
