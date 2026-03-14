import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';

/** Validates the refresh token sent in the Authorization header. */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload & { refreshToken: string }> {
    const authHeader   = req.headers.authorization;
    const refreshToken = authHeader?.split(' ')[1];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    return { ...payload, refreshToken };
  }
}
