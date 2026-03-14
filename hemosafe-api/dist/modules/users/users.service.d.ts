import { UsersRepository } from './repository/users.repository';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class UsersService {
    private readonly repo;
    constructor(repo: UsersRepository);
    findAll(actor: JwtPayload): Promise<{
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
    findOne(id: string, actor: JwtPayload): Promise<{
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
    }>;
    create(dto: CreateUserDto, actor: JwtPayload): Promise<{
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
    }>;
    update(id: string, dto: UpdateUserDto, actor: JwtPayload): Promise<{
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
    }>;
    deactivate(id: string, actor: JwtPayload): Promise<{
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
    }>;
    private assertFacilityAccess;
}
