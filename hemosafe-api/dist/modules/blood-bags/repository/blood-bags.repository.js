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
exports.BloodBagsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const BAG_INCLUDE = {
    bloodType: { select: { label: true, aboGroup: true, rhFactor: true } },
    donor: { select: { id: true, firstName: true, lastName: true } },
    bloodBank: { select: { id: true, name: true, code: true } },
};
let BloodBagsRepository = class BloodBagsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(where, page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.prisma.$transaction([
            this.prisma.bloodBag.findMany({
                where,
                include: BAG_INCLUDE,
                orderBy: { expiresAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.bloodBag.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    findById(id) {
        return this.prisma.bloodBag.findUnique({
            where: { id },
            include: {
                ...BAG_INCLUDE,
                stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
                screening: true,
            },
        });
    }
    findByCode(code) {
        return this.prisma.bloodBag.findUnique({ where: { code }, include: BAG_INCLUDE });
    }
    create(data) {
        return this.prisma.bloodBag.create({ data, include: BAG_INCLUDE });
    }
    updateStatus(id, status, extra) {
        return this.prisma.bloodBag.update({
            where: { id },
            data: { status, ...extra },
            include: BAG_INCLUDE,
        });
    }
    stockSummary(bloodBankId) {
        return this.prisma.bloodBag.groupBy({
            by: ['bloodTypeId'],
            where: { bloodBankId, status: 'AVAILABLE', expiresAt: { gt: new Date() } },
            _count: { id: true },
        });
    }
    expiringSoon(bloodBankId) {
        const in48h = new Date(Date.now() + 48 * 3600 * 1000);
        return this.prisma.bloodBag.findMany({
            where: {
                status: 'AVAILABLE',
                expiresAt: { lte: in48h, gt: new Date() },
                ...(bloodBankId && { bloodBankId }),
            },
            include: { bloodType: { select: { label: true } }, bloodBank: { select: { name: true } } },
            orderBy: { expiresAt: 'asc' },
        });
    }
};
exports.BloodBagsRepository = BloodBagsRepository;
exports.BloodBagsRepository = BloodBagsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BloodBagsRepository);
//# sourceMappingURL=blood-bags.repository.js.map