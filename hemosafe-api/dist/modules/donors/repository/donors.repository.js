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
exports.DonorsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let DonorsRepository = class DonorsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(where) {
        return this.prisma.donor.findMany({ where });
    }
    findById(id) {
        return this.prisma.donor.findUnique({
            where: { id },
            include: {
                bloodType: true,
                registeredBank: true,
                screenings: {
                    take: 5,
                    orderBy: { screenedAt: 'desc' },
                },
            },
        });
    }
    create(data) {
        return this.prisma.donor.create({ data });
    }
    update(id, data) {
        return this.prisma.donor.update({ where: { id }, data });
    }
    markIneligible(id, reason) {
        return this.prisma.donor.update({
            where: { id },
            data: {
                isEligible: false,
                ineligibilityReason: reason,
            },
        });
    }
    findEligible() {
        return this.prisma.donor.findMany({
            where: { isEligible: true },
        });
    }
};
exports.DonorsRepository = DonorsRepository;
exports.DonorsRepository = DonorsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DonorsRepository);
//# sourceMappingURL=donors.repository.js.map