import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateDonorDto } from './dto/create-donor.dto';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { DonorsService } from './donors.service';
export declare class DonorsController {
    private readonly donorsService;
    constructor(donorsService: DonorsService);
    findAll(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<({
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
    findOne(id: string, actor: JwtPayload): Promise<{
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
            hemoglobinGDl: import("@prisma/client/runtime/library").Decimal | null;
            bloodPressure: string | null;
            weightKg: import("@prisma/client/runtime/library").Decimal | null;
            temperatureC: import("@prisma/client/runtime/library").Decimal | null;
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
    }>;
    create(dto: CreateDonorDto, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__DonorClient<{
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
    update(id: string, dto: Partial<CreateDonorDto>, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__DonorClient<{
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
    createScreening(dto: CreateScreeningDto, actor: JwtPayload): Promise<{
        id: string;
        screenedAt: Date;
        donorId: string;
        screenedBy: string | null;
        hemoglobinGDl: import("@prisma/client/runtime/library").Decimal | null;
        bloodPressure: string | null;
        weightKg: import("@prisma/client/runtime/library").Decimal | null;
        temperatureC: import("@prisma/client/runtime/library").Decimal | null;
        isPassed: boolean;
        notes: string | null;
    }>;
}
