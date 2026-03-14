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
var BloodBagsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloodBagsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const blood_bags_repository_1 = require("./repository/blood-bags.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
let BloodBagsService = BloodBagsService_1 = class BloodBagsService {
    constructor(repo, prisma, events) {
        this.repo = repo;
        this.prisma = prisma;
        this.events = events;
        this.logger = new common_1.Logger(BloodBagsService_1.name);
    }
    findAll(dto, actor) {
        const where = this.buildWhere(dto, actor);
        return this.repo.findAll(where, dto.page ?? 1, dto.limit ?? 20);
    }
    async findOne(id, actor) {
        const bag = await this.repo.findById(id);
        if (!bag)
            throw new common_1.NotFoundException(`Blood bag ${id} not found`);
        this.assertBankAccess(actor, bag.bloodBankId);
        return bag;
    }
    stockSummary(bloodBankId, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK && actor.facilityId !== bloodBankId) {
            throw new common_1.ForbiddenException('Access denied to another blood bank');
        }
        return this.repo.stockSummary(bloodBankId);
    }
    expiringSoon(actor) {
        const bankId = actor.role === client_1.UserRole.BLOOD_BANK ? actor.facilityId ?? undefined : undefined;
        return this.repo.expiringSoon(bankId);
    }
    async create(dto, actor) {
        if (actor.role === client_1.UserRole.HOSPITAL) {
            throw new common_1.ForbiddenException('Hospitals cannot register blood bags');
        }
        const bloodBankId = actor.role === client_1.UserRole.BLOOD_BANK
            ? actor.facilityId
            : dto.bloodBankId;
        if (!bloodBankId) {
            throw new common_1.BadRequestException('bloodBankId is required for ADMIN');
        }
        if (new Date(dto.expiresAt) <= new Date(dto.collectedAt)) {
            throw new common_1.BadRequestException('expiresAt must be after collectedAt');
        }
        const bag = await this.repo.create({
            code: dto.code,
            volumeMl: dto.volumeMl,
            collectedAt: new Date(dto.collectedAt),
            expiresAt: new Date(dto.expiresAt),
            bloodType: { connect: { id: dto.bloodTypeId } },
            bloodBank: { connect: { id: bloodBankId } },
            ...(dto.donorId && { donor: { connect: { id: dto.donorId } } }),
            ...(dto.screeningId && { screening: { connect: { id: dto.screeningId } } }),
        });
        await this.prisma.stockMovement.create({
            data: {
                bloodBagId: bag.id,
                movementType: 'RECEIVED',
                fromStatus: 'AVAILABLE',
                toStatus: 'AVAILABLE',
                performedBy: actor.sub,
            },
        });
        return bag;
    }
    async discard(id, dto, actor) {
        const bag = await this.repo.findById(id);
        if (!bag)
            throw new common_1.NotFoundException(`Blood bag ${id} not found`);
        this.assertBankAccess(actor, bag.bloodBankId);
        if (bag.status === client_1.BagStatus.DISTRIBUTED || bag.status === client_1.BagStatus.DISCARDED) {
            throw new common_1.BadRequestException(`Cannot discard a bag with status ${bag.status}`);
        }
        return this.prisma.transaction(async (tx) => {
            const updated = await tx.bloodBag.update({
                where: { id },
                data: { status: client_1.BagStatus.DISCARDED, discardedReason: dto.reason },
            });
            await tx.stockMovement.create({
                data: {
                    bloodBagId: id,
                    movementType: 'DISCARDED',
                    fromStatus: bag.status,
                    toStatus: client_1.BagStatus.DISCARDED,
                    performedBy: actor.sub,
                    notes: dto.reason,
                },
            });
            return updated;
        });
    }
    async markExpiredBags() {
        const expired = await this.prisma.$queryRaw `
      UPDATE blood_bags
      SET    status = 'EXPIRED'
      WHERE  status = 'AVAILABLE'
        AND  expires_at < NOW()
      RETURNING id, blood_bank_id
    `;
        if (expired.length > 0) {
            this.logger.warn(`Marked ${expired.length} bags as EXPIRED`);
            this.events.emit('bags.expired', expired);
        }
    }
    async alertNearExpiry() {
        const bags = await this.repo.expiringSoon();
        if (bags.length > 0) {
            this.events.emit('bags.expiring-soon', bags);
        }
    }
    buildWhere(dto, actor) {
        const where = {};
        if (dto.aboGroup)
            where['aboGroup'] = dto.aboGroup;
        if (dto.rhFactor)
            where['rhFactor'] = dto.rhFactor;
        if (dto.status)
            where['status'] = dto.status;
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            where['bloodBankId'] = actor.facilityId;
        }
        else if (dto.bloodBankId) {
            where['bloodBankId'] = dto.bloodBankId;
        }
        return where;
    }
    assertBankAccess(actor, bloodBankId) {
        if (actor.role === client_1.UserRole.BLOOD_BANK && actor.facilityId !== bloodBankId) {
            throw new common_1.ForbiddenException('Access to bag of another blood bank denied');
        }
    }
};
exports.BloodBagsService = BloodBagsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BloodBagsService.prototype, "markExpiredBags", null);
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BloodBagsService.prototype, "alertNearExpiry", null);
exports.BloodBagsService = BloodBagsService = BloodBagsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [blood_bags_repository_1.BloodBagsRepository,
        prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], BloodBagsService);
//# sourceMappingURL=blood-bags.service.js.map