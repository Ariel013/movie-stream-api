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
exports.GeoSearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let GeoSearchService = class GeoSearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findNearbyWithStock(lat, lng, radiusKm, bloodTypeId, minCount = 1) {
        const radiusMetres = radiusKm * 1000;
        const rows = await this.prisma.$queryRaw `
      WITH bank_stock AS (
        SELECT
          bb.blood_bank_id,
          COUNT(bb.id)::int          AS available_count,
          MIN(bb.expires_at)         AS next_expires_at
        FROM blood_bags bb
        WHERE bb.blood_type_id = ${bloodTypeId}::uuid
          AND bb.status        = 'AVAILABLE'
          AND bb.expires_at    > NOW()
        GROUP BY bb.blood_bank_id
        HAVING COUNT(bb.id) >= ${minCount}
      )
      SELECT
        f.id,
        f.name,
        f.address,
        ST_Y(f.location::geometry)                                        AS lat,
        ST_X(f.location::geometry)                                        AS lng,
        ROUND(
          (ST_Distance(
            f.location,
            ST_MakePoint(${lng}, ${lat})::geography
          ) / 1000.0)::numeric, 2
        )                                                                  AS "distanceKm",
        s.available_count                                                  AS "availableCount",
        s.next_expires_at                                                  AS "nextExpiresAt"
      FROM facilities f
      JOIN bank_stock s ON s.blood_bank_id = f.id
      WHERE f.type      = 'BLOOD_BANK'
        AND f.is_active = TRUE
        AND ST_DWithin(
              f.location,
              ST_MakePoint(${lng}, ${lat})::geography,
              ${radiusMetres}
            )
      ORDER BY f.location <-> ST_MakePoint(${lng}, ${lat})::geography ASC
    `;
        return rows;
    }
    async nationalAvailabilityMap() {
        return this.prisma.$queryRaw `
      SELECT
        f.id                           AS "bankId",
        f.name                         AS "bankName",
        ST_Y(f.location::geometry)     AS lat,
        ST_X(f.location::geometry)     AS lng,
        bt.label                       AS "bloodTypeLabel",
        COUNT(bb.id)::int              AS "availableCount"
      FROM facilities f
      JOIN blood_bags  bb ON bb.blood_bank_id  = f.id
      JOIN blood_types bt ON bt.id             = bb.blood_type_id
      WHERE f.type      = 'BLOOD_BANK'
        AND f.is_active = TRUE
        AND bb.status   = 'AVAILABLE'
        AND bb.expires_at > NOW()
      GROUP BY f.id, f.name, f.location, bt.label
      ORDER BY f.name, bt.label
    `;
    }
};
exports.GeoSearchService = GeoSearchService;
exports.GeoSearchService = GeoSearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GeoSearchService);
//# sourceMappingURL=geo-search.service.js.map