import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    // Reject tokens explicitly revoked via /auth/logout, even if not yet expired —
    // JWTs are stateless by default, this blacklist is the only way to make
    // "logout" actually take effect before the token's natural 15 min expiry.
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && (await this.redis.get(`blacklist:${token}`))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      select: { id: true },
    });
    if (!user) throw new UnauthorizedException('User not found or inactive');
    return payload;
  }
}
