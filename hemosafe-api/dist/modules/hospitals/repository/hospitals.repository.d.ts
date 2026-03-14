import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class HospitalsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(regionId?: string): Prisma.PrismaPromise<({
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
    findById(id: string): Prisma.Prisma__FacilityClient<({
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Omit<Prisma.FacilityCreateInput, 'type'>): Prisma.Prisma__FacilityClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Prisma.FacilityUpdateInput): Prisma.Prisma__FacilityClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    nearby(lat: number, lng: number, radiusKm: number): Prisma.PrismaPromise<{
        id: string;
        name: string;
        code: string;
        address: string;
        distance_m: number;
    }[]>;
}
