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
}
