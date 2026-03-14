import {
  Injectable, ForbiddenException, Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── National summary ───────────────────────────────────────────────────────

  async nationalSummary() {
    const [
      bagsByStatus,
      totalDonors,
      totalHospitals,
      totalBloodBanks,
      reservationsByStatus,
      bagsByBloodType,
    ] = await Promise.all([
      this.prisma.bloodBag.groupBy({
        by:     ['status'],
        _count: { id: true },
      }),
      this.prisma.donor.count(),
      this.prisma.facility.count({ where: { type: 'HOSPITAL', isActive: true } }),
      this.prisma.facility.count({ where: { type: 'BLOOD_BANK', isActive: true } }),
      this.prisma.reservation.groupBy({
        by:     ['status'],
        _count: { id: true },
      }),
      this._bagsByBloodType({}),
    ]);

    return {
      bagsByStatus:        this._groupCountMap(bagsByStatus, 'status'),
      totalDonors,
      totalHospitals,
      totalBloodBanks,
      reservationsByStatus: this._groupCountMap(reservationsByStatus, 'status'),
      bagsByBloodType,
    };
  }

  // ── Regional summary ───────────────────────────────────────────────────────

  async regionalSummary(regionId: string) {
    const facilityIds = await this._facilityIdsInRegion(regionId);

    const [
      bagsByStatus,
      totalDonors,
      totalHospitals,
      totalBloodBanks,
      reservationsByStatus,
      bagsByBloodType,
    ] = await Promise.all([
      this.prisma.bloodBag.groupBy({
        by:     ['status'],
        where:  { bloodBankId: { in: facilityIds } },
        _count: { id: true },
      }),
      this.prisma.donor.count({ where: { registeredBankId: { in: facilityIds } } }),
      this.prisma.facility.count({ where: { type: 'HOSPITAL',    regionId, isActive: true } }),
      this.prisma.facility.count({ where: { type: 'BLOOD_BANK',  regionId, isActive: true } }),
      this.prisma.reservation.groupBy({
        by:     ['status'],
        where:  { bloodBankId: { in: facilityIds } },
        _count: { id: true },
      }),
      this._bagsByBloodType({ bloodBankId: { in: facilityIds } }),
    ]);

    return {
      regionId,
      bagsByStatus:         this._groupCountMap(bagsByStatus, 'status'),
      totalDonors,
      totalHospitals,
      totalBloodBanks,
      reservationsByStatus: this._groupCountMap(reservationsByStatus, 'status'),
      bagsByBloodType,
    };
  }

  // ── Facility stock ─────────────────────────────────────────────────────────

  async facilityStock(facilityId: string, actor: JwtPayload) {
    if (
      actor.role === UserRole.BLOOD_BANK &&
      actor.facilityId !== facilityId
    ) {
      throw new ForbiddenException('Blood banks can only view their own stock');
    }
    if (actor.role === UserRole.HOSPITAL) {
      throw new ForbiddenException('Hospitals cannot access facility stock details');
    }

    const bagsByBloodType = await this._bagsByBloodType({ bloodBankId: facilityId });
    const totals = await this.prisma.bloodBag.groupBy({
      by:     ['status'],
      where:  { bloodBankId: facilityId },
      _count: { id: true },
    });

    return {
      facilityId,
      bagsByStatus:  this._groupCountMap(totals, 'status'),
      bagsByBloodType,
    };
  }

  // ── Donor stats ────────────────────────────────────────────────────────────

  async donorStats() {
    // Top donors by donation count
    const topDonors = await this.prisma.donor.findMany({
      orderBy: { donationCount: 'desc' },
      take:    10,
      select: {
        id:            true,
        firstName:     true,
        lastName:      true,
        donationCount: true,
        bloodType:     { select: { label: true } },
      },
    });

    // Donation trends: last 12 months grouped by month
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const donationTrends = await this.prisma.$queryRaw<
      Array<{ month: string; count: bigint }>
    >`
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

  // ── Reservation trends ─────────────────────────────────────────────────────

  async reservationTrends(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.prisma.$queryRaw<
      Array<{ day: string; status: string; count: bigint }>
    >`
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
      day:    r.day,
      status: r.status,
      count:  Number(r.count),
    }));
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _bagsByBloodType(where: Record<string, unknown>) {
    const grouped = await this.prisma.bloodBag.groupBy({
      by:     ['bloodTypeId', 'status'],
      where:  where as any,
      _count: { id: true },
    });

    // Resolve blood type labels
    const typeIds = [...new Set(grouped.map((r) => r.bloodTypeId))];
    const types   = await this.prisma.bloodType.findMany({
      where:  { id: { in: typeIds } },
      select: { id: true, label: true },
    });
    const typeMap = Object.fromEntries(types.map((t) => [t.id, t.label]));

    return grouped.map((r) => ({
      bloodType: typeMap[r.bloodTypeId] ?? r.bloodTypeId,
      status:    r.status,
      count:     r._count.id,
    }));
  }

  private async _facilityIdsInRegion(regionId: string): Promise<string[]> {
    const facilities = await this.prisma.facility.findMany({
      where:  { regionId, type: 'BLOOD_BANK' },
      select: { id: true },
    });
    return facilities.map((f) => f.id);
  }

  /** Converts groupBy result array into a plain object keyed by the grouping field. */
  private _groupCountMap(
    rows: Array<Record<string, any>>,
    key: string,
  ): Record<string, number> {
    return Object.fromEntries(
      rows.map((r) => [r[key], r._count.id as number]),
    );
  }
}
