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
exports.BloodBanksRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
const BLOOD_BANK_INCLUDE = {
    region: { select: { id: true, name: true, code: true } },
    users: { select: { id: true, email: true, role: true, firstName: true, lastName: true } },
};
let BloodBanksRepository = class BloodBanksRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(regionId) {
        return this.prisma.facility.findMany({
            where: {
                type: client_1.FacilityType.BLOOD_BANK,
                ...(regionId && { regionId }),
            },
            include: BLOOD_BANK_INCLUDE,
            orderBy: { name: 'asc' },
        });
    }
    findById(id) {
        return this.prisma.facility.findFirst({
            where: { id, type: client_1.FacilityType.BLOOD_BANK },
            include: BLOOD_BANK_INCLUDE,
        });
    }
    create(data) {
        return this.prisma.facility.create({
            data: { ...data, type: client_1.FacilityType.BLOOD_BANK },
            include: BLOOD_BANK_INCLUDE,
        });
    }
    update(id, data) {
        return this.prisma.facility.update({
            where: { id },
            data,
            include: BLOOD_BANK_INCLUDE,
        });
    }
    async stockSummary(bankId) {
        const rows = await this.prisma.$queryRaw `
      SELECT
        bt.label   AS label,
        bb.status  AS status,
        COUNT(bb.id) AS count
      FROM blood_bags bb
      JOIN blood_types bt ON bt.id = bb.blood_type_id
      WHERE bb.blood_bank_id = ${bankId}::uuid
      GROUP BY bt.label, bb.status
      ORDER BY bt.label, bb.status
    `;
        return rows.map((r) => ({
            bloodType: r.label,
            status: r.status,
            count: Number(r.count),
        }));
    }
    nearby(lat, lng, radiusKm) {
        const radiusMetres = radiusKm * 1000;
        return this.prisma.$queryRaw `
      SELECT
        f.id,
        f.name,
        f.code,
        f.address,
        ST_Distance(
          f.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM facilities f
      WHERE f.type = 'BLOOD_BANK'
        AND f.is_active = TRUE
        AND f.location IS NOT NULL
        AND ST_DWithin(
          f.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMetres}
        )
      ORDER BY distance_m ASC
    `;
    }
};
exports.BloodBanksRepository = BloodBanksRepository;
exports.BloodBanksRepository = BloodBanksRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BloodBanksRepository);
//# sourceMappingURL=blood-banks.repository.js.map