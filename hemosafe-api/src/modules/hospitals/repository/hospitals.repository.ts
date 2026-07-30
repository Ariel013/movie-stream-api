import { Injectable } from '@nestjs/common';
import { FacilityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

// No `users` here on purpose — the staff directory of another facility is not
// public information; ADMIN can look it up via the properly-scoped GET /users.
const HOSPITAL_INCLUDE = {
  region: { select: { id: true, name: true, code: true } },
} satisfies Prisma.FacilityInclude;

@Injectable()
export class HospitalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(regionId: string | undefined, page: number, limit: number) {
    const where: Prisma.FacilityWhereInput = {
      type: FacilityType.HOSPITAL,
      ...(regionId && { regionId }),
    };
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.facility.findMany({
        where,
        include: HOSPITAL_INCLUDE,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.facility.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const hospital = await this.prisma.facility.findFirst({
      where:   { id, type: FacilityType.HOSPITAL },
      include: HOSPITAL_INCLUDE,
    });
    if (!hospital) return null;

    // `location` isn't a Prisma-modeled field (see schema.prisma comment on
    // Facility) — read back via raw SQL, same as it's written in setLocation().
    const [coords] = await this.prisma.$queryRaw<Array<{ lat: number | null; lng: number | null }>>`
      SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
      FROM facilities WHERE id = ${id}::uuid
    `;

    return { ...hospital, lat: coords?.lat ?? null, lng: coords?.lng ?? null };
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
