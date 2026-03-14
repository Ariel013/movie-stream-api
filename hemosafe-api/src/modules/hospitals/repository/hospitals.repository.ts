import { Injectable } from '@nestjs/common';
import { FacilityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const HOSPITAL_INCLUDE = {
  region: { select: { id: true, name: true, code: true } },
  users:  { select: { id: true, email: true, role: true, firstName: true, lastName: true } },
} satisfies Prisma.FacilityInclude;

@Injectable()
export class HospitalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(regionId?: string) {
    return this.prisma.facility.findMany({
      where: {
        type: FacilityType.HOSPITAL,
        ...(regionId && { regionId }),
      },
      include: HOSPITAL_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.facility.findFirst({
      where:   { id, type: FacilityType.HOSPITAL },
      include: HOSPITAL_INCLUDE,
    });
  }

  create(data: Omit<Prisma.FacilityCreateInput, 'type'>) {
    return this.prisma.facility.create({
      data:    { ...data, type: FacilityType.HOSPITAL },
      include: HOSPITAL_INCLUDE,
    });
  }

  update(id: string, data: Prisma.FacilityUpdateInput) {
    return this.prisma.facility.update({
      where:   { id },
      data,
      include: HOSPITAL_INCLUDE,
    });
  }

  /**
   * Find hospitals within `radiusKm` kilometres of (lat, lng).
   * Uses PostGIS ST_DWithin on the geography column.
   * The facilities table has an implicit `location` geography column
   * populated separately (raw SQL or migration).
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
      WHERE f.type = 'HOSPITAL'
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
