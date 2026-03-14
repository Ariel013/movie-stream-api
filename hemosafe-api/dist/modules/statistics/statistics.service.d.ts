import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class StatisticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    nationalSummary(): Promise<{
        bagsByStatus: Record<string, number>;
        totalDonors: number;
        totalHospitals: number;
        totalBloodBanks: number;
        reservationsByStatus: Record<string, number>;
        bagsByBloodType: {
            bloodType: string;
            status: import(".prisma/client").$Enums.BagStatus;
            count: number;
        }[];
    }>;
    regionalSummary(regionId: string): Promise<{
        regionId: string;
        bagsByStatus: Record<string, number>;
        totalDonors: number;
        totalHospitals: number;
        totalBloodBanks: number;
        reservationsByStatus: Record<string, number>;
        bagsByBloodType: {
            bloodType: string;
            status: import(".prisma/client").$Enums.BagStatus;
            count: number;
        }[];
    }>;
    facilityStock(facilityId: string, actor: JwtPayload): Promise<{
        facilityId: string;
        bagsByStatus: Record<string, number>;
        bagsByBloodType: {
            bloodType: string;
            status: import(".prisma/client").$Enums.BagStatus;
            count: number;
        }[];
    }>;
    donorStats(): Promise<{
        topDonors: {
            bloodType: {
                label: string;
            };
            id: string;
            firstName: string;
            lastName: string;
            donationCount: number;
        }[];
        donationTrends: {
            month: string;
            count: number;
        }[];
    }>;
    reservationTrends(days?: number): Promise<{
        day: string;
        status: string;
        count: number;
    }[]>;
    private _bagsByBloodType;
    private _facilityIdsInRegion;
    private _groupCountMap;
}
