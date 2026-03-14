import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class UsersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(where?: Prisma.UserWhereInput): Prisma.PrismaPromise<{
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        facilityId: string | null;
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }[]>;
    findById(id: string): Prisma.Prisma__UserClient<{
        facility: {
            name: string;
            type: import(".prisma/client").$Enums.FacilityType;
            id: string;
        } | null;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        facilityId: string | null;
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    findByEmail(email: string): Prisma.Prisma__UserClient<{
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        facilityId: string | null;
        id: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        mfaSecret: string | null;
        refreshToken: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.UserCreateInput): Prisma.Prisma__UserClient<{
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        facilityId: string | null;
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Prisma.UserUpdateInput): Prisma.Prisma__UserClient<{
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        facilityId: string | null;
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deactivate(id: string): Prisma.Prisma__UserClient<{
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        facilityId: string | null;
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
