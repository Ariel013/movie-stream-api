import { PrismaService } from '../../../prisma/prisma.service';
export interface BloodBankResult {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    distanceKm: number;
    availableCount: number;
    nextExpiresAt: Date | null;
}
export declare class GeoSearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findNearbyWithStock(lat: number, lng: number, radiusKm: number, bloodTypeId: string, minCount?: number): Promise<BloodBankResult[]>;
    nationalAvailabilityMap(): Promise<Array<{
        bankId: string;
        bankName: string;
        lat: number;
        lng: number;
        bloodTypeLabel: string;
        availableCount: number;
    }>>;
}
