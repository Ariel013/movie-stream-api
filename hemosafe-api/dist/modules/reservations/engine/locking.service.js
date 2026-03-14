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
var LockingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let LockingService = LockingService_1 = class LockingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(LockingService_1.name);
    }
    async acquireForAllocation(tx, bloodBankId, bloodTypeId) {
        const key = this.computeKey(bloodBankId, bloodTypeId);
        this.logger.debug(`Acquiring advisory lock key=${key} bank=${bloodBankId} type=${bloodTypeId}`);
        await tx.$queryRaw `SELECT pg_advisory_xact_lock(${key}::bigint)`;
    }
    async tryAcquireForAllocation(tx, bloodBankId, bloodTypeId) {
        const key = this.computeKey(bloodBankId, bloodTypeId);
        const rows = await tx.$queryRaw `
      SELECT pg_try_advisory_xact_lock(${key}::bigint) AS acquired
    `;
        return rows[0].acquired;
    }
    async acquireWithRetry(bloodBankId, bloodTypeId, maxRetries = 3, delayMs = 100) {
        const key = this.computeKey(bloodBankId, bloodTypeId);
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const rows = await this.prisma.$queryRaw `
        SELECT pg_try_advisory_xact_lock(${key}::bigint) AS acquired
      `;
            if (rows[0].acquired) {
                return async () => {
                };
            }
            this.logger.warn(`Lock contention attempt ${attempt}/${maxRetries} key=${key}`);
            await this.sleep(delayMs * attempt);
        }
        throw new common_1.ConflictException('Blood bank is handling too many concurrent requests. Please retry in a few seconds.');
    }
    computeKey(bloodBankId, bloodTypeId) {
        return `${bloodBankId}:${bloodTypeId}`;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.LockingService = LockingService;
exports.LockingService = LockingService = LockingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LockingService);
//# sourceMappingURL=locking.service.js.map