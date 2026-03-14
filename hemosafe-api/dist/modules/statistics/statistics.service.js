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
var StatisticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let StatisticsService = StatisticsService_1 = class StatisticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StatisticsService_1.name);
    }
    async nationalSummary() {
        const [bagsByStatus, totalDonors, totalHospitals, totalBloodBanks, reservationsByStatus, bagsByBloodType,] = await Promise.all([
            this.prisma.bloodBag.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            this.prisma.donor.count(),
            this.prisma.facility.count({ where: { type: 'HOSPITAL', isActive: true } }),
            this.prisma.facility.count({ where: { type: 'BLOOD_BANK', isActive: true } }),
            this.prisma.reservation.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            this._bagsByBloodType({}),
        ]);
        return {
            bagsByStatus: this._groupCountMap(bagsByStatus, 'status'),
            totalDonors,
            totalHospitals,
            totalBloodBanks,
            reservationsByStatus: this._groupCountMap(reservationsByStatus, 'status'),
            bagsByBloodType,
        };
    }
    async regionalSummary(regionId) {
        const facilityIds = await this._facilityIdsInRegion(regionId);
        const [bagsByStatus, totalDonors, totalHospitals, totalBloodBanks, reservationsByStatus, bagsByBloodType,] = await Promise.all([
            this.prisma.bloodBag.groupBy({
                by: ['status'],
                where: { bloodBankId: { in: facilityIds } },
                _count: { id: true },
            }),
            this.prisma.donor.count({ where: { registeredBankId: { in: facilityIds } } }),
            this.prisma.facility.count({ where: { type: 'HOSPITAL', regionId, isActive: true } }),
            this.prisma.facility.count({ where: { type: 'BLOOD_BANK', regionId, isActive: true } }),
            this.prisma.reservation.groupBy({
                by: ['status'],
                where: { bloodBankId: { in: facilityIds } },
                _count: { id: true },
            }),
            this._bagsByBloodType({ bloodBankId: { in: facilityIds } }),
        ]);
        return {
            regionId,
            bagsByStatus: this._groupCountMap(bagsByStatus, 'status'),
            totalDonors,
            totalHospitals,
            totalBloodBanks,
            reservationsByStatus: this._groupCountMap(reservationsByStatus, 'status'),
            bagsByBloodType,
        };
    }
    async facilityStock(facilityId, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK &&
            actor.facilityId !== facilityId) {
            throw new common_1.ForbiddenException('Blood banks can only view their own stock');
        }
        if (actor.role === client_1.UserRole.HOSPITAL) {
            throw new common_1.ForbiddenException('Hospitals cannot access facility stock details');
        }
        const bagsByBloodType = await this._bagsByBloodType({ bloodBankId: facilityId });
        const totals = await this.prisma.bloodBag.groupBy({
            by: ['status'],
            where: { bloodBankId: facilityId },
            _count: { id: true },
        });
        return {
            facilityId,
            bagsByStatus: this._groupCountMap(totals, 'status'),
            bagsByBloodType,
        };
    }
    async donorStats() {
        const topDonors = await this.prisma.donor.findMany({
            orderBy: { donationCount: 'desc' },
            take: 10,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                donationCount: true,
                bloodType: { select: { label: true } },
            },
        });
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const donationTrends = await this.prisma.$queryRaw `
      SELECT
        TO_CHAR(DATE_TRUNC('month', collected_at), 'YYYY-MM') AS month,
        COUNT(*)                                               AS count
      FROM blood_bags
      WHERE collected_at >= ${twelveMonthsAgo}
        AND donor_id IS NOT NULL
      GROUP BY DATE_TRUNC('month', collected_at)
      ORDER BY DATE_TRUNC('month', collected_at)
    `;
        return {
            topDonors,
            donationTrends: donationTrends.map((r) => ({
                month: r.month,
                count: Number(r.count),
            })),
        };
    }
    async reservationTrends(days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const rows = await this.prisma.$queryRaw `
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
        status,
        COUNT(*)                                              AS count
      FROM reservations
      WHERE created_at >= ${since}
      GROUP BY DATE_TRUNC('day', created_at), status
      ORDER BY DATE_TRUNC('day', created_at), status
    `;
        return rows.map((r) => ({
            day: r.day,
            status: r.status,
            count: Number(r.count),
        }));
    }
    async _bagsByBloodType(where) {
        const grouped = await this.prisma.bloodBag.groupBy({
            by: ['bloodTypeId', 'status'],
            where: where,
            _count: { id: true },
        });
        const typeIds = [...new Set(grouped.map((r) => r.bloodTypeId))];
        const types = await this.prisma.bloodType.findMany({
            where: { id: { in: typeIds } },
            select: { id: true, label: true },
        });
        const typeMap = Object.fromEntries(types.map((t) => [t.id, t.label]));
        return grouped.map((r) => ({
            bloodType: typeMap[r.bloodTypeId] ?? r.bloodTypeId,
            status: r.status,
            count: r._count.id,
        }));
    }
    async _facilityIdsInRegion(regionId) {
        const facilities = await this.prisma.facility.findMany({
            where: { regionId, type: 'BLOOD_BANK' },
            select: { id: true },
        });
        return facilities.map((f) => f.id);
    }
    _groupCountMap(rows, key) {
        return Object.fromEntries(rows.map((r) => [r[key], r._count.id]));
    }
};
exports.StatisticsService = StatisticsService;
exports.StatisticsService = StatisticsService = StatisticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatisticsService);
//# sourceMappingURL=statistics.service.js.map