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
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_decorator_1 = require("../decorators/audit.decorator");
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    constructor(prisma, reflector) {
        this.prisma = prisma;
        this.reflector = reflector;
        this.logger = new common_1.Logger(AuditInterceptor_1.name);
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            return next.handle();
        }
        const entity = this.reflector.get(audit_decorator_1.AUDIT_ENTITY_KEY, context.getHandler()) ??
            req.path.split('/').filter(Boolean)[2] ??
            'unknown';
        const user = req.user;
        const action = `${req.method} ${req.path}`;
        return next.handle().pipe((0, rxjs_1.tap)({
            next: async (body) => {
                try {
                    await this.prisma.auditLog.create({
                        data: {
                            userId: user?.sub ?? null,
                            role: user?.role ?? null,
                            action,
                            entity,
                            entityId: body?.id ?? null,
                            newValue: body,
                            ipAddress: req.ip,
                            userAgent: req.headers['user-agent'] ?? null,
                        },
                    });
                }
                catch (err) {
                    this.logger.error('Audit log write failed', err);
                }
            },
        }));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        core_1.Reflector])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map