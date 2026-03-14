import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler, Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req   = context.switchToHttp().getRequest<Request>();
    const res   = context.switchToHttp().getResponse<Response>();
    const start = Date.now();
    const { method, url, ip } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${method} ${url} ${res.statusCode} — ${Date.now() - start}ms [${ip}]`,
          );
        },
        error: (err) => {
          this.logger.error(
            `${method} ${url} ${err?.status ?? 500} — ${Date.now() - start}ms [${ip}]`,
          );
        },
      }),
    );
  }
}
