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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationValidatorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ReservationValidatorService = class ReservationValidatorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.FSM = {
            PENDING: [client_1.ReservationStatus.CONFIRMED, client_1.ReservationStatus.CANCELLED],
            CONFIRMED: [client_1.ReservationStatus.DISPATCHED, client_1.ReservationStatus.CANCELLED],
            DISPATCHED: [client_1.ReservationStatus.DELIVERED],
            DELIVERED: [],
            EXPIRED: [],
            CANCELLED: [],
        };
    }
    async assertBloodBankExists(bloodBankId) {
        const bank = await this.prisma.facility.findFirst({
            where: { id: bloodBankId, type: 'BLOOD_BANK', isActive: true },
            select: { id: true },
        });
        if (!bank) {
            throw new common_1.NotFoundException(`Blood bank ${bloodBankId} not found or inactive`);
        }
    }
    async assertBloodTypeExists(bloodTypeId) {
        const bt = await this.prisma.bloodType.findUnique({
            where: { id: bloodTypeId },
            select: { id: true },
        });
        if (!bt) {
            throw new common_1.NotFoundException(`Blood type ${bloodTypeId} not found`);
        }
    }
    async assertPrescriptionValid(prescriptionId, hospitalId, bloodTypeId, quantity) {
        const rx = await this.prisma.prescription.findUnique({
            where: { id: prescriptionId },
            select: {
                hospitalId: true,
                bloodTypeId: true,
                quantity: true,
                isFulfilled: true,
                expiresAt: true,
            },
        });
        if (!rx)
            throw new common_1.NotFoundException(`Prescription ${prescriptionId} not found`);
        if (rx.isFulfilled)
            throw new common_1.ConflictException('Prescription is already fulfilled');
        if (rx.hospitalId !== hospitalId) {
            throw new common_1.ForbiddenException('Prescription belongs to a different hospital');
        }
        if (rx.bloodTypeId !== bloodTypeId) {
            throw new common_1.BadRequestException('Reservation blood type does not match prescription blood type');
        }
        if (rx.expiresAt && rx.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Prescription has expired');
        }
    }
    assertSufficientStock(bags, requestedQty, urgency) {
        if (urgency === client_1.UrgencyLevel.EMERGENCY) {
            if (bags.length === 0) {
                throw new common_1.ConflictException('No available bags of requested blood type — even for emergency');
            }
            return bags;
        }
        if (bags.length < requestedQty) {
            throw new common_1.ConflictException(`Insufficient stock. Requested: ${requestedQty}, available: ${bags.length}`);
        }
        return bags;
    }
    assertFsmTransition(current, next) {
        const allowed = this.FSM[current];
        if (!allowed.includes(next)) {
            throw new common_1.BadRequestException(`Transition ${current} → ${next} is not allowed. ` +
                `Valid next states: [${allowed.join(', ') || 'none'}]`);
        }
    }
    assertRoleForTransition(actor, to) {
        const bankTransitions = new Set([
            client_1.ReservationStatus.CONFIRMED,
            client_1.ReservationStatus.DISPATCHED,
        ]);
        const hospitalTransitions = new Set([
            client_1.ReservationStatus.DELIVERED,
            client_1.ReservationStatus.CANCELLED,
        ]);
        if (bankTransitions.has(to) && actor.role !== 'BLOOD_BANK' && actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException(`Only BLOOD_BANK can set status to ${to}`);
        }
        if (to === client_1.ReservationStatus.DELIVERED && actor.role !== 'HOSPITAL' && actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only HOSPITAL can mark as DELIVERED');
        }
    }
    assertCancelReasonProvided(reason) {
        if (!reason || reason.trim().length < 5) {
            throw new common_1.BadRequestException('cancelReason is required (min 5 chars) when cancelling a reservation');
        }
    }
    assertNotExpired(expiresAt) {
        if (expiresAt < new Date()) {
            throw new common_1.ConflictException('Reservation has expired (24h TTL). Please create a new reservation.');
        }
    }
};
exports.ReservationValidatorService = ReservationValidatorService;
exports.ReservationValidatorService = ReservationValidatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReservationValidatorService);
//# sourceMappingURL=reservation-validator.service.js.map