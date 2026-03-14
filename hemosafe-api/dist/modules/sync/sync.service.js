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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ioredis_1 = require("@nestjs-modules/ioredis");
let SyncService = SyncService_1 = class SyncService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(SyncService_1.name);
        this.IDEM_PREFIX = 'idem:';
        this.IDEM_TTL = 86_400;
    }
    async processBatch(dto, actorId) {
        const results = [];
        for (const op of dto.operations) {
            const result = await this.processOne(op, actorId);
            results.push(result);
        }
        return results;
    }
    async processOne(op, actorId) {
        const redisKey = `${this.IDEM_PREFIX}${op.operationId}`;
        const cached = await this.redis.get(redisKey);
        if (cached) {
            return { operationId: op.operationId, status: 'duplicate', data: JSON.parse(cached) };
        }
        try {
            const data = await this.dispatch(op, actorId);
            await this.redis.set(redisKey, JSON.stringify(data), 'EX', this.IDEM_TTL);
            return { operationId: op.operationId, status: 'applied', data };
        }
        catch (err) {
            const code = err?.status ?? 500;
            const msg = err?.message ?? 'Unknown error';
            if (code === 409) {
                return { operationId: op.operationId, status: 'conflict', errorCode: 409, errorMessage: msg };
            }
            this.logger.error(`[SyncBatch] Operation ${op.operationId} failed: ${msg}`);
            return { operationId: op.operationId, status: 'error', errorCode: code, errorMessage: msg };
        }
    }
    async dispatch(op, actorId) {
        const path = op.endpoint.replace(/^\/api\/v\d+/, '');
        if (path.startsWith('/reservations')) {
            if (op.method === 'POST') {
                const p = op.payload;
                return this.prisma.reservation.create({
                    data: {
                        code: `RES-${Date.now()}`,
                        bloodBank: { connect: { id: p.bloodBankId } },
                        hospital: { connect: { id: p.hospitalId } },
                        bloodType: { connect: { id: p.bloodTypeId } },
                        requester: { connect: { id: actorId } },
                        quantity: p.quantity,
                        urgency: p.urgency,
                        status: 'PENDING',
                    },
                });
            }
        }
        if (path.startsWith('/blood-bags')) {
            const idMatch = path.match(/\/blood-bags\/([a-f0-9-]+)/);
            if (op.method === 'POST') {
                const p = op.payload;
                return this.prisma.bloodBag.create({
                    data: {
                        code: `BAG-${Date.now()}`,
                        bloodBank: { connect: { id: p.bloodBankId } },
                        bloodType: { connect: { id: p.bloodTypeId } },
                        volumeMl: p.volumeMl,
                        expiresAt: new Date(p.expiresAt),
                        collectedAt: new Date(),
                    },
                });
            }
            if ((op.method === 'PATCH' || op.method === 'PUT') && idMatch) {
                const p = op.payload;
                return this.prisma.bloodBag.update({
                    where: { id: idMatch[1] },
                    data: p,
                });
            }
        }
        if (path.startsWith('/patients')) {
            const idMatch = path.match(/\/patients\/([a-f0-9-]+)/);
            if (op.method === 'POST') {
                const p = op.payload;
                return this.prisma.patient.create({
                    data: {
                        firstName: p.firstName,
                        lastName: p.lastName,
                        hospital: { connect: { id: p.hospitalId } },
                        ...(p.bloodTypeId && { bloodType: { connect: { id: p.bloodTypeId } } }),
                        ...(p.nationalId && { nationalId: p.nationalId }),
                        ...(p.medicalRecordNo && { medicalRecordNo: p.medicalRecordNo }),
                    },
                });
            }
            if ((op.method === 'PATCH' || op.method === 'PUT') && idMatch) {
                const p = op.payload;
                return this.prisma.patient.update({
                    where: { id: idMatch[1] },
                    data: p,
                });
            }
        }
        throw new Error(`Unsupported sync operation: ${op.method} ${path}`);
    }
    async pull(since, scopes, facilityId) {
        const where = since ? { updatedAt: { gt: since } } : {};
        const [stock, reservations, patients, notifications] = await Promise.all([
            scopes.includes('stock')
                ? this.prisma.bloodBag.findMany({ where: { bloodBankId: facilityId, ...where }, take: 500 })
                : [],
            scopes.includes('reservations')
                ? this.prisma.reservation.findMany({
                    where: { OR: [{ hospitalId: facilityId }, { bloodBankId: facilityId }], ...where },
                    take: 200,
                })
                : [],
            scopes.includes('patients')
                ? this.prisma.patient.findMany({ where: { hospitalId: facilityId, ...where }, take: 500 })
                : [],
            scopes.includes('notifications')
                ? this.prisma.notification.findMany({
                    where: { userId: facilityId, ...(since ? { createdAt: { gt: since } } : {}) },
                    take: 100,
                    orderBy: { createdAt: 'desc' },
                })
                : [],
        ]);
        return {
            stock,
            reservations,
            patients,
            notifications,
            serverTime: new Date().toISOString(),
        };
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Function])
], SyncService);
//# sourceMappingURL=sync.service.js.map