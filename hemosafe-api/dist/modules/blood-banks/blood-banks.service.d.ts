import { BloodBanksRepository } from './repository/blood-banks.repository';
import type { CreateBloodBankDto } from './dto/create-blood-bank.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class BloodBanksService {
    private readonly repo;
    constructor(repo: BloodBanksRepository);
    findAll(regionId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        region: {
            name: string;
            id: string;
            code: string;
        };
        users: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            firstName: string;
            lastName: string;
        }[];
    } & {
        name: string;
        type: import(".prisma/client").$Enums.FacilityType;
        email: string | null;
        id: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string;
        regionId: string;
    })[]>;
    findOne(id: string): Promise<{
        region: {
            name: string;
            id: string;
            code: string;
        };
        users: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            firstName: string;
            lastName: string;
        }[];
    } & {
        name: string;
        type: import(".prisma/client").$Enums.FacilityType;
        email: string | null;
        id: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string;
        regionId: string;
    }>;
    create(dto: CreateBloodBankDto, actor: JwtPayload): Promise<{
        region: {
            name: string;
            id: string;
            code: string;
        };
        users: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            firstName: string;
            lastName: string;
        }[];
    } & {
        name: string;
        type: import(".prisma/client").$Enums.FacilityType;
        email: string | null;
        id: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string;
        regionId: string;
    }>;
    update(id: string, dto: Partial<CreateBloodBankDto>, actor: JwtPayload): Promise<{
        region: {
            name: string;
            id: string;
            code: string;
        };
        users: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            firstName: string;
            lastName: string;
        }[];
    } & {
        name: string;
        type: import(".prisma/client").$Enums.FacilityType;
        email: string | null;
        id: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string;
        regionId: string;
    }>;
    stockSummary(bankId: string, actor: JwtPayload): Promise<import("./repository/blood-banks.repository").StockSummaryRow[]>;
    nearby(lat: number, lng: number, radiusKm: number): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        code: string;
        address: string;
        distance_m: number;
    }[]>;
}
