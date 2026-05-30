"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        this.ACCESS_EXPIRES_SEC = 15 * 60;
        this.REFRESH_EXPIRES_SEC = 7 * 24 * 3600;
    }
    async login(dto, ip) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { facility: { select: { name: true } } },
        });
        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Account is deactivated');
        }
        const tokens = await this.generateTokens(user);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
                lastLoginAt: new Date(),
            },
        });
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                facilityId: user.facilityId,
                facilityName: user.facility?.name ?? null,
            },
        };
    }
    async refresh(userId, rawRefreshToken) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { facility: { select: { name: true } } },
        });
        if (!user?.refreshToken || !user.isActive) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const matches = await bcrypt.compare(rawRefreshToken, user.refreshToken);
        if (!matches)
            throw new common_1.ForbiddenException('Invalid refresh token');
        const tokens = await this.generateTokens(user);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 10) },
        });
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                facilityId: user.facilityId,
                facilityName: user.facility?.name ?? null,
            },
        };
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
    async me(userId) {
        return this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true, email: true, role: true,
                firstName: true, lastName: true, phone: true,
                facilityId: true, lastLoginAt: true,
                facility: { select: { id: true, name: true, type: true } },
            },
        });
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            facilityId: user.facilityId,
        };
        const secret = this.config.getOrThrow('JWT_SECRET');
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret,
                expiresIn: this.ACCESS_EXPIRES_SEC,
            }),
            this.jwtService.signAsync(payload, {
                secret,
                expiresIn: this.REFRESH_EXPIRES_SEC,
            }),
        ]);
        return { accessToken, refreshToken, expiresIn: this.ACCESS_EXPIRES_SEC };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map