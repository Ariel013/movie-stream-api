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
exports.ReservationsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const RESERVATION_INCLUDE = {
    hospital: { select: { id: true, name: true, code: true } },
    bloodBank: { select: { id: true, name: true, code: true } },
    bloodType: { select: { label: true } },
    requester: { select: { id: true, firstName: true, lastName: true } },
    reservationBags: { include: { bloodBag: { select: { id: true, code: true, expiresAt: true } } } },
};
let ReservationsRepository = class ReservationsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(where) {
        return this.prisma.reservation.findMany({
            where,
            include: RESERVATION_INCLUDE,
            orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
        });
    }
    findById(id) {
        return this.prisma.reservation.findUnique({
            where: { id },
            include: RESERVATION_INCLUDE,
        });
    }
    findByCode(code) {
        return this.prisma.reservation.findUnique({ where: { code }, include: RESERVATION_INCLUDE });
    }
    create(data) {
        return this.prisma.reservation.create({ data, include: RESERVATION_INCLUDE });
    }
    update(id, data) {
        return this.prisma.reservation.update({ where: { id }, data, include: RESERVATION_INCLUDE });
    }
    findExpired() {
        return this.prisma.reservation.findMany({
            where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
                expiresAt: { lt: new Date() },
            },
            include: { reservationBags: true },
        });
    }
};
exports.ReservationsRepository = ReservationsRepository;
exports.ReservationsRepository = ReservationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReservationsRepository);
//# sourceMappingURL=reservations.repository.js.map