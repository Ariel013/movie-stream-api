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
exports.PrescriptionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PrescriptionsRepository = class PrescriptionsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(where) {
        return this.prisma.prescription.findMany({ where });
    }
    findById(id) {
        return this.prisma.prescription.findUnique({
            where: { id },
            include: {
                patient: true,
                physician: true,
                bloodType: true,
                reservations: {
                    take: 5,
                },
            },
        });
    }
    create(data) {
        return this.prisma.prescription.create({ data });
    }
    markFulfilled(id) {
        return this.prisma.prescription.update({
            where: { id },
            data: {
                isFulfilled: true,
                fulfilledAt: new Date(),
            },
        });
    }
    findUnfulfilled(hospitalId) {
        return this.prisma.prescription.findMany({
            where: {
                isFulfilled: false,
                ...(hospitalId ? { hospitalId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PrescriptionsRepository = PrescriptionsRepository;
exports.PrescriptionsRepository = PrescriptionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrescriptionsRepository);
//# sourceMappingURL=prescriptions.repository.js.map