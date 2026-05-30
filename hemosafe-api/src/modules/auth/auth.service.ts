import {
  Injectable, UnauthorizedException, ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

interface Tokens {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

export interface AuthTokens extends Tokens {
  user: {
    id:           string;
    email:        string;
    firstName:    string;
    lastName:     string;
    role:         string;
    facilityId:   string | null;
    facilityName: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly ACCESS_EXPIRES_SEC  = 15 * 60;        // 15 min
  private readonly REFRESH_EXPIRES_SEC = 7 * 24 * 3600;  // 7 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { facility: { select: { name: true } } },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);

    // Persist hashed refresh token + last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
        lastLoginAt:  new Date(),
      },
    });

    return {
      ...tokens,
      user: {
        id:           user.id,
        email:        user.email,
        firstName:    user.firstName,
        lastName:     user.lastName,
        role:         user.role,
        facilityId:   user.facilityId,
        facilityName: user.facility?.name ?? null,
      },
    };
  }

  // ── Refresh ────────────────────────────────────────────────────────────────

  async refresh(userId: string, rawRefreshToken: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { facility: { select: { name: true } } },
    });

    if (!user?.refreshToken || !user.isActive) {
      throw new ForbiddenException('Access denied');
    }

    const matches = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!matches) throw new ForbiddenException('Invalid refresh token');

    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 10) },
    });

    return {
      ...tokens,
      user: {
        id:           user.id,
        email:        user.email,
        firstName:    user.firstName,
        lastName:     user.lastName,
        role:         user.role,
        facilityId:   user.facilityId,
        facilityName: user.facility?.name ?? null,
      },
    };
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ── Me ─────────────────────────────────────────────────────────────────────

  async me(userId: string) {
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async generateTokens(
    user: { id: string; email: string; role: string; facilityId: string | null },
  ): Promise<Tokens> {
    const payload: JwtPayload = {
      sub:        user.id,
      email:      user.email,
      role:       user.role as any,
      facilityId: user.facilityId,
    };

    const secret = this.config.getOrThrow<string>('JWT_SECRET');

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
}
