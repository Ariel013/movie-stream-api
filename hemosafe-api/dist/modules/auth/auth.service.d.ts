import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
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
        lastLoginAt: Date | null;
    }>;
    private generateTokens;
}
