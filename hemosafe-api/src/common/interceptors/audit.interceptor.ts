import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler, Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_ENTITY_KEY } from '../decorators/audit.decorator';

/**
 * Appends an immutable AuditLog row for every mutating request.
 * Handlers can opt-in with @AuditEntity('entity_name') to set the entity label.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next.handle();
    }

    const entity =
      this.reflector.get<string>(AUDIT_ENTITY_KEY, context.getHandler()) ??
      req.path.split('/').filter(Boolean)[2] ??
      'unknown';

    const user   = (req as any).user;
    const action = `${req.method} ${req.path}`;

    return next.handle().pipe(
      tap({
        next: async (body: Record<string, unknown>) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                userId:    user?.sub  ?? null,
                role:      user?.role ?? null,
                action,
                entity,
                entityId:  (body as any)?.id ?? null,
                newValue:  body as any,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] ?? null,
              },
            });
          } catch (err) {
            this.logger.error('Audit log write failed', err);
          }
        },
      }),
    );
  }
}
