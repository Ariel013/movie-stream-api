import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface BloodBankResult {
  id:             string;
  name:           string;
  address:        string;
  lat:            number;
  lng:            number;
  distanceKm:     number;
  availableCount: number;
  nextExpiresAt:  Date | null;
}

/**
 * Geo-based blood bank search using PostGIS.
 *
 * Primary use-case: a hospital specifies a blood type, quantity, and its
 * own coordinates to receive a ranked list of nearby banks that can fulfil
 * the request. Results are ordered by distance, so the hospital's UI can
 * suggest the closest viable option first.
 *
 * PostGIS functions used:
 *  - ST_DWithin(geography, geography, metres)  → bounding filter (uses GIST index)
 *  - ST_Distance(geography, geography)         → exact distance in metres
 *  - <->  KNN operator                         → enables index-based ORDER BY distance
 */
@Injectable()
export class GeoSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find blood banks within radiusKm that have at least minCount available bags
   * of the requested blood type, ordered by distance (nearest first).
   *
   * @param lat         Requesting hospital latitude
   * @param lng         Requesting hospital longitude
   * @param radiusKm    Search radius in kilometres
   * @param bloodTypeId UUID of the requested blood type
   * @param minCount    Minimum bags required (default: 1)
   */
  async findNearbyWithStock(
    lat: number,
    lng: number,
    radiusKm: number,
    bloodTypeId: string,
    minCount = 1,
  ): Promise<BloodBankResult[]> {
    const radiusMetres = radiusKm * 1000;

    /*
     * Query breakdown:
     *
     * 1. CTE `bank_stock`: aggregate available bag count per bank for this blood type
     * 2. Main query: join facilities → bank_stock
     *    - ST_DWithin: bounding filter uses GIST index on facilities.location
     *    - ST_Distance: exact distance for display
     *    - <-> : KNN order (uses index, efficient even without explicit GIST sort)
     *    - HAVING available_count >= minCount: only banks that can fulfil request
     *    - ORDER BY distance ASC: nearest first
     */
    const rows = await this.prisma.$queryRaw<BloodBankResult[]>`
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

  /**
   * Nationwide blood availability summary — used by the admin dashboard map.
   * Returns one row per bank per blood type.
   */
  async nationalAvailabilityMap(): Promise<
    Array<{
      bankId:         string;
      bankName:       string;
      lat:            number;
      lng:            number;
      bloodTypeLabel: string;
      availableCount: number;
    }>
  > {
    return this.prisma.$queryRaw`
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
}
