import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub:        string;    // user id
  email:      string;
  role:       UserRole;
  facilityId: string | null;
  iat?:       number;    // issued-at (present on decoded tokens, absent when signing)
  exp?:       number;    // expiry (present on decoded tokens, absent when signing)
}

/** Extracts the authenticated user payload from the JWT. */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user    = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
