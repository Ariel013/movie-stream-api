import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class DonorsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(where?: Prisma.DonorWhereInput): Prisma.PrismaPromise<({
        bloodType: {
            label: string;
        };
    } & {
        id: string;
        nationalId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        bloodTypeId: string;
        phone: string | null;
        email: string | null;
        isEligible: boolean;
        ineligibilityReason: string | null;
        lastDonationAt: Date | null;
        donationCount: number;
        registeredBankId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findById(id: string): Prisma.Prisma__DonorClient<({
        bloodType: {
            id: string;
            aboGroup: import(".prisma/client").$Enums.AboGroup;
            rhFactor: import(".prisma/client").$Enums.RhFactor;
            label: string;
            compatibleDonor: string[];
        };
        registeredBank: {
            id: string;
            phone: string | null;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            type: import(".prisma/client").$Enums.FacilityType;
            code: string;
            address: string;
            regionId: string;
            isActive: boolean;
        } | null;
        screenings: {
            id: string;
            screenedAt: Date;
            donorId: string;
            screenedBy: string | null;
            hemoglobinGDl: Prisma.Decimal | null;
            bloodPressure: string | null;
            weightKg: Prisma.Decimal | null;
            temperatureC: Prisma.Decimal | null;
            isPassed: boolean;
            notes: string | null;
        }[];
    } & {
        id: string;
        nationalId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        bloodTypeId: string;
        phone: string | null;
        email: string | null;
        isEligible: boolean;
        ineligibilityReason: string | null;
        lastDonationAt: Date | null;
        donationCount: number;
        registeredBankId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.DonorCreateInput): Prisma.Prisma__DonorClient<{
        id: string;
        nationalId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        bloodTypeId: string;
        phone: string | null;
        email: string | null;
        isEligible: boolean;
        ineligibilityReason: string | null;
        lastDonationAt: Date | null;
        donationCount: number;
        registeredBankId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Prisma.DonorUpdateInput): Prisma.Prisma__DonorClient<{
        id: string;
        nationalId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        bloodTypeId: string;
        phone: string | null;
        email: string | null;
        isEligible: boolean;
        ineligibilityReason: string | null;
        lastDonationAt: Date | null;
        donationCount: number;
        registeredBankId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    markIneligible(id: string, reason: string): Prisma.Prisma__DonorClient<{
        id: string;
        nationalId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        bloodTypeId: string;
        phone: string | null;
        email: string | null;
        isEligible: boolean;
        ineligibilityReason: string | null;
        lastDonationAt: Date | null;
        donationCount: number;
        registeredBankId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findEligible(): Prisma.PrismaPromise<{
        id: string;
        nationalId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        bloodTypeId: string;
        phone: string | null;
        email: string | null;
        isEligible: boolean;
        ineligibilityReason: string | null;
        lastDonationAt: Date | null;
        donationCount: number;
        registeredBankId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
