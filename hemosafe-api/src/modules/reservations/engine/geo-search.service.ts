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
   * Nationwide blood-bank overview for the network map — one row per
   * (bank, blood type) pair, including banks/types with zero stock (CROSS JOIN +
   * LEFT JOIN, not INNER JOIN) so a bank never silently disappears from the map
   * just because it's out of a given type. Only ever exposes aggregate counts,
   * never individual bag records — same confidentiality boundary as
   * findNearbyWithStock. Banks without a persisted `location` (see the known
   * lat/lng-dropped-on-create gap) are excluded — nothing to plot on a map.
   */
  private async rawNationalOverview(): Promise<
    Array<{
      bankId:    string;
      bankName:  string;
      address:   string;
      lat:       number;
      lng:       number;
      bloodType: string;
      count:     number;
    }>
  > {
    return this.prisma.$queryRaw`
      SELECT
        f.id                                                     AS "bankId",
        f.name                                                   AS "bankName",
        f.address                                                AS address,
        ST_Y(f.location::geometry)                                AS lat,
        ST_X(f.location::geometry)                                AS lng,
        bt.label                                                  AS "bloodType",
        COUNT(bb.id) FILTER (
          WHERE bb.status = 'AVAILABLE' AND bb.expires_at > NOW()
        )::int                                                    AS count
      FROM facilities f
      CROSS JOIN blood_types bt
      LEFT JOIN blood_bags bb
        ON bb.blood_bank_id = f.id AND bb.blood_type_id = bt.id
      WHERE f.type      = 'BLOOD_BANK'
        AND f.is_active = TRUE
        AND f.location IS NOT NULL
      GROUP BY f.id, f.name, f.address, f.location, bt.label
      ORDER BY f.name, bt.label
    `;
  }

  /** Groups the flat (bank, bloodType) rows into one entry per bank for the map. */
  async nationalOverview(): Promise<
    Array<{
      id:             string;
      name:           string;
      address:        string;
      lat:            number;
      lng:            number;
      availableCount: number;
      stockByType:    Record<string, number>;
    }>
  > {
    const rows = await this.rawNationalOverview();
    const byBank = new Map<string, {
      id: string; name: string; address: string; lat: number; lng: number;
      availableCount: number; stockByType: Record<string, number>;
    }>();

    for (const row of rows) {
      let entry = byBank.get(row.bankId);
      if (!entry) {
        entry = {
          id: row.bankId, name: row.bankName, address: row.address,
          lat: row.lat, lng: row.lng, availableCount: 0, stockByType: {},
        };
        byBank.set(row.bankId, entry);
      }
      entry.stockByType[row.bloodType] = row.count;
      entry.availableCount += row.count;
    }

    return [...byBank.values()];
  }
}
