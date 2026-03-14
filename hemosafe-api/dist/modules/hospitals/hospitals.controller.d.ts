import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class HospitalsController {
    private readonly service;
    constructor(service: HospitalsService);
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
    nearby(lat: number, lng: number, radiusKm: number): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        code: string;
        address: string;
        distance_m: number;
    }[]>;
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
    create(dto: CreateHospitalDto, actor: JwtPayload): Promise<{
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
    update(id: string, dto: Partial<CreateHospitalDto>, actor: JwtPayload): Promise<{
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
}
