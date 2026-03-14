import { Injectable } from '@nestjs/common';
import { FacilityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const BLOOD_BANK_INCLUDE = {
  region: { select: { id: true, name: true, code: true } },
  users:  { select: { id: true, email: true, role: true, firstName: true, lastName: true } },
} satisfies Prisma.FacilityInclude;

export interface StockSummaryRow {
  bloodType: string;
  status:    string;
  count:     number;
}

@Injectable()
export class BloodBanksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(regionId?: string) {
    return this.prisma.facility.findMany({
      where: {
        type: FacilityType.BLOOD_BANK,
        ...(regionId && { regionId }),
      },
      include: BLOOD_BANK_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.facility.findFirst({
      where:   { id, type: FacilityType.BLOOD_BANK },
      include: BLOOD_BANK_INCLUDE,
    });
  }

  create(data: Omit<Prisma.FacilityCreateInput, 'type'>) {
    return this.prisma.facility.create({
      data:    { ...data, type: FacilityType.BLOOD_BANK },
      include: BLOOD_BANK_INCLUDE,
    });
  }

  update(id: string, data: Prisma.FacilityUpdateInput) {
    return this.prisma.facility.update({
      where:   { id },
      data,
      include: BLOOD_BANK_INCLUDE,
    });
  }

  /**
   * Returns available blood bag counts grouped by blood type for a given bank.
   * Uses a raw SQL query for a compact, indexed result.
   */
  async stockSummary(bankId: string): Promise<StockSummaryRow[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ label: string; status: string; count: bigint }>
    >`
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
      status:    r.status,
      count:     Number(r.count),
    }));
  }

  /**
   * Find blood banks within `radiusKm` kilometres of (lat, lng) using PostGIS.
   */
  nearby(lat: number, lng: number, radiusKm: number) {
    const radiusMetres = radiusKm * 1000;
    return this.prisma.$queryRaw<
      Array<{ id: string; name: string; code: string; address: string; distance_m: number }>
    >`
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
}
