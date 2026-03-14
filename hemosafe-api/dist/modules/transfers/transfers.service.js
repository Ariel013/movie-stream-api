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
var TransfersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const nanoid_1 = require("nanoid");
const prisma_service_1 = require("../../prisma/prisma.service");
const transfers_repository_1 = require("./repository/transfers.repository");
const TRANSFER_FSM = {
    INITIATED: [client_1.TransferStatus.IN_TRANSIT, client_1.TransferStatus.CANCELLED],
    IN_TRANSIT: [client_1.TransferStatus.RECEIVED],
    RECEIVED: [],
    CANCELLED: [],
};
let TransfersService = TransfersService_1 = class TransfersService {
    constructor(repo, prisma) {
        this.repo = repo;
        this.prisma = prisma;
        this.logger = new common_1.Logger(TransfersService_1.name);
    }
    findAll(actor) {
        const where = this.buildWhere(actor);
        return this.repo.findAll(where);
    }
    async findOne(id, actor) {
        const transfer = await this.repo.findById(id);
        if (!transfer)
            throw new common_1.NotFoundException(`Transfer ${id} not found`);
        this.assertAccess(actor, transfer);
        return transfer;
    }
    async create(dto, actor) {
        if (actor.role === client_1.UserRole.HOSPITAL) {
            throw new common_1.ForbiddenException('Hospitals cannot initiate blood bag transfers');
        }
        const fromBankId = actor.role === client_1.UserRole.BLOOD_BANK
            ? actor.facilityId
            : dto.fromBankId;
        if (!fromBankId) {
            throw new common_1.BadRequestException('fromBankId is required for ADMIN');
        }
        if (fromBankId === dto.toBankId) {
            throw new common_1.BadRequestException('Source and destination blood banks must differ');
        }
        return this.prisma.transaction(async (tx) => {
            const bags = await tx.bloodBag.findMany({
                where: { id: { in: dto.bloodBagIds } },
                select: { id: true, status: true, bloodBankId: true },
            });
            if (bags.length !== dto.bloodBagIds.length) {
                const found = bags.map((b) => b.id);
                const missing = dto.bloodBagIds.filter((id) => !found.includes(id));
                throw new common_1.NotFoundException(`Blood bags not found: ${missing.join(', ')}`);
            }
            const notAvailable = bags.filter((b) => b.status !== client_1.BagStatus.AVAILABLE);
            if (notAvailable.length > 0) {
                throw new common_1.ConflictException(`Bags not in AVAILABLE status: ${notAvailable.map((b) => b.id).join(', ')}`);
            }
            const wrongBank = bags.filter((b) => b.bloodBankId !== fromBankId);
            if (wrongBank.length > 0) {
                throw new common_1.ForbiddenException(`Bags do not belong to the source bank: ${wrongBank.map((b) => b.id).join(', ')}`);
            }
            await tx.bloodBag.updateMany({
                where: { id: { in: dto.bloodBagIds } },
                data: { status: client_1.BagStatus.RESERVED },
            });
            const code = `TRF-${new Date().getFullYear()}-${(0, nanoid_1.nanoid)(5).toUpperCase()}`;
            const transfer = await tx.transfer.create({
                data: {
                    code,
                    fromBank: { connect: { id: fromBankId } },
                    toBank: { connect: { id: dto.toBankId } },
                    initiator: { connect: { id: actor.sub } },
                    reason: dto.reason,
                    transferBags: { create: dto.bloodBagIds.map((bloodBagId) => ({ bloodBagId })) },
                },
                include: { transferBags: true },
            });
            await tx.stockMovement.createMany({
                data: dto.bloodBagIds.map((bloodBagId) => ({
                    bloodBagId,
                    movementType: 'TRANSFERRED',
                    fromStatus: client_1.BagStatus.AVAILABLE,
                    toStatus: client_1.BagStatus.RESERVED,
                    performedBy: actor.sub,
                    transferId: transfer.id,
                    notes: dto.reason,
                })),
            });
            this.logger.log(`Transfer ${code} created with ${dto.bloodBagIds.length} bag(s)`);
            return transfer;
        });
    }
    async updateStatus(id, dto, actor) {
        const transfer = await this.repo.findById(id);
        if (!transfer)
            throw new common_1.NotFoundException(`Transfer ${id} not found`);
        this.assertAccess(actor, transfer);
        const allowed = TRANSFER_FSM[transfer.status];
        if (!allowed.includes(dto.status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${transfer.status} to ${dto.status}. ` +
                `Allowed: ${allowed.join(', ') || 'none'}`);
        }
        if (dto.status === client_1.TransferStatus.IN_TRANSIT) {
            if (actor.role === client_1.UserRole.BLOOD_BANK && actor.facilityId !== transfer.fromBankId) {
                throw new common_1.ForbiddenException('Only the initiating bank can mark transfer as IN_TRANSIT');
            }
            if (actor.role === client_1.UserRole.HOSPITAL) {
                throw new common_1.ForbiddenException('Hospitals cannot update transfer status');
            }
        }
        if (dto.status === client_1.TransferStatus.RECEIVED) {
            if (actor.role === client_1.UserRole.BLOOD_BANK && actor.facilityId !== transfer.toBankId) {
                throw new common_1.ForbiddenException('Only the recipient bank can mark transfer as RECEIVED');
            }
            if (actor.role === client_1.UserRole.HOSPITAL) {
                throw new common_1.ForbiddenException('Hospitals cannot update transfer status');
            }
        }
        return this.prisma.transaction(async (tx) => {
            const now = new Date();
            const data = { status: dto.status };
            if (dto.status === client_1.TransferStatus.IN_TRANSIT) {
                data['inTransitAt'] = now;
            }
            if (dto.status === client_1.TransferStatus.RECEIVED) {
                data['receivedAt'] = now;
                data['receiver'] = { connect: { id: actor.sub } };
                const bagIds = transfer.transferBags.map((tb) => tb.bloodBagId);
                await tx.bloodBag.updateMany({
                    where: { id: { in: bagIds } },
                    data: { status: client_1.BagStatus.AVAILABLE, bloodBankId: transfer.toBankId },
                });
                await tx.stockMovement.createMany({
                    data: bagIds.map((bloodBagId) => ({
                        bloodBagId,
                        movementType: 'RECEIVED',
                        fromStatus: client_1.BagStatus.RESERVED,
                        toStatus: client_1.BagStatus.AVAILABLE,
                        performedBy: actor.sub,
                        transferId: id,
                    })),
                });
            }
            const updated = await tx.transfer.update({
                where: { id },
                data: data,
                include: {
                    fromBank: { select: { id: true, name: true } },
                    toBank: { select: { id: true, name: true } },
                    initiator: { select: { id: true, firstName: true, lastName: true } },
                    receiver: { select: { id: true, firstName: true, lastName: true } },
                    transferBags: { include: { bloodBag: { include: { bloodType: { select: { label: true } } } } } },
                },
            });
            this.logger.log(`Transfer ${transfer.code} → ${dto.status}`);
            return updated;
        });
    }
    async cancel(id, actor) {
        const transfer = await this.repo.findById(id);
        if (!transfer)
            throw new common_1.NotFoundException(`Transfer ${id} not found`);
        if (transfer.status !== client_1.TransferStatus.INITIATED) {
            throw new common_1.BadRequestException(`Only INITIATED transfers can be cancelled. Current status: ${transfer.status}`);
        }
        if (actor.role === client_1.UserRole.BLOOD_BANK && actor.facilityId !== transfer.fromBankId) {
            throw new common_1.ForbiddenException('Only the initiating bank can cancel a transfer');
        }
        if (actor.role === client_1.UserRole.HOSPITAL) {
            throw new common_1.ForbiddenException('Hospitals cannot cancel transfers');
        }
        return this.prisma.transaction(async (tx) => {
            const bagIds = transfer.transferBags.map((tb) => tb.bloodBagId);
            await tx.bloodBag.updateMany({
                where: { id: { in: bagIds } },
                data: { status: client_1.BagStatus.AVAILABLE },
            });
            await tx.stockMovement.createMany({
                data: bagIds.map((bloodBagId) => ({
                    bloodBagId,
                    movementType: 'RELEASED',
                    fromStatus: client_1.BagStatus.RESERVED,
                    toStatus: client_1.BagStatus.AVAILABLE,
                    performedBy: actor.sub,
                    transferId: id,
                    notes: 'Transfer cancelled',
                })),
            });
            return tx.transfer.update({
                where: { id },
                data: { status: client_1.TransferStatus.CANCELLED },
                include: {
                    fromBank: { select: { id: true, name: true } },
                    toBank: { select: { id: true, name: true } },
                    transferBags: { include: { bloodBag: { include: { bloodType: { select: { label: true } } } } } },
                },
            });
        });
    }
    buildWhere(actor) {
        if (actor.role === client_1.UserRole.ADMIN)
            return {};
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            return {
                OR: [
                    { fromBankId: actor.facilityId },
                    { toBankId: actor.facilityId },
                ],
            };
        }
        return { id: 'none' };
    }
    assertAccess(actor, transfer) {
        if (actor.role === client_1.UserRole.ADMIN)
            return;
        if (actor.role === client_1.UserRole.HOSPITAL) {
            throw new common_1.ForbiddenException('Hospitals do not have access to transfers');
        }
        if (actor.facilityId !== transfer.fromBankId &&
            actor.facilityId !== transfer.toBankId) {
            throw new common_1.ForbiddenException('Access denied to this transfer');
        }
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = TransfersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transfers_repository_1.TransfersRepository,
        prisma_service_1.PrismaService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map