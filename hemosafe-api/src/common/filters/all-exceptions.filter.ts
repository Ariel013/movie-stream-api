import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException,
  HttpStatus, Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const request  = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { status, message, error } = this.resolve(exception);

    const body: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${status}: ${message}`);
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    // NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      return {
        status:  exception.getStatus(),
        message: typeof res === 'object' && 'message' in res
          ? (res as any).message
          : exception.message,
        error: exception.name,
      };
    }

    // Prisma known errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception);
    }

    // Prisma validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status:  HttpStatus.BAD_REQUEST,
        message: 'Database validation error',
        error:   'Bad Request',
      };
    }

    // Unknown / unhandled
    return {
      status:  HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error:   'Internal Server Error',
    };
  }

  private handlePrismaError(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002': // Unique constraint violation
        return {
          status:  HttpStatus.CONFLICT,
          message: `Duplicate value: ${(e.meta?.target as string[] | undefined)?.join(', ')}`,
          error:   'Conflict',
        };
      case 'P2025': // Record not found
        return {
          status:  HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error:   'Not Found',
        };
      case 'P2003': // Foreign key constraint
        return {
          status:  HttpStatus.BAD_REQUEST,
          message: 'Related record not found',
          error:   'Bad Request',
        };
      case 'P2034': // Transaction conflict (write skew)
        return {
          status:  HttpStatus.CONFLICT,
          message: 'Transaction conflict, please retry',
          error:   'Conflict',
        };
      default:
        return {
          status:  HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
          error:   'Internal Server Error',
        };
    }
  }
}
