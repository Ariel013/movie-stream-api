"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const { status, message, error } = this.resolve(exception);
        const body = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (status >= 500) {
            this.logger.error(`${request.method} ${request.url} → ${status}`, exception instanceof Error ? exception.stack : String(exception));
        }
        else {
            this.logger.warn(`${request.method} ${request.url} → ${status}: ${message}`);
        }
        response.status(status).json(body);
    }
    resolve(exception) {
        if (exception instanceof common_1.HttpException) {
            const res = exception.getResponse();
            return {
                status: exception.getStatus(),
                message: typeof res === 'object' && 'message' in res
                    ? res.message
                    : exception.message,
                error: exception.name,
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.handlePrismaError(exception);
        }
        if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            return {
                status: common_1.HttpStatus.BAD_REQUEST,
                message: 'Database validation error',
                error: 'Bad Request',
            };
        }
        return {
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
            error: 'Internal Server Error',
        };
    }
    handlePrismaError(e) {
        switch (e.code) {
            case 'P2002':
                return {
                    status: common_1.HttpStatus.CONFLICT,
                    message: `Duplicate value: ${e.meta?.target?.join(', ')}`,
                    error: 'Conflict',
                };
            case 'P2025':
                return {
                    status: common_1.HttpStatus.NOT_FOUND,
                    message: 'Record not found',
                    error: 'Not Found',
                };
            case 'P2003':
                return {
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Related record not found',
                    error: 'Bad Request',
                };
            case 'P2034':
                return {
                    status: common_1.HttpStatus.CONFLICT,
                    message: 'Transaction conflict, please retry',
                    error: 'Conflict',
                };
            default:
                return {
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error',
                    error: 'Internal Server Error',
                };
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map