import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request): Promise<import("./auth.service").AuthTokens>;
    refresh(user: JwtPayload & {
        refreshToken: string;
    }): Promise<import("./auth.service").AuthTokens>;
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
}
