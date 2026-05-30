import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthTokens extends Tokens {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        facilityId: string | null;
        facilityName: string | null;
    };
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    private readonly ACCESS_EXPIRES_SEC;
    private readonly REFRESH_EXPIRES_SEC;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    login(dto: LoginDto, ip: string): Promise<AuthTokens>;
    refresh(userId: string, rawRefreshToken: string): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        phone: string | null;
        facilityId: string | null;
        lastLoginAt: Date | null;
        facility: {
            id: string;
            type: import(".prisma/client").$Enums.FacilityType;
            name: string;
        } | null;
    }>;
    private generateTokens;
}
export {};
