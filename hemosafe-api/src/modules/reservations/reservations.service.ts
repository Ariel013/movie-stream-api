import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationStatus, UserRole } from '@prisma/client';
import { ReservationEngineService } from './engine/reservation-engine.service';
import { GeoSearchService } from './engine/geo-search.service';
import { ReservationsRepository } from './repository/reservations.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReservationDto } from './dto/create-reservation.dto';
import type { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import type { SearchBloodDto } from './dto/search-blood.dto';
import type { VerifyBagDto } from './dto/verify-bag.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

/**
 * ReservationsService
 * ===================
 * Thin orchestrator — delegates all heavy lifting to:
 *  - ReservationEngineService  (allocation, transitions, expiry)
 *  - GeoSearchService          (PostGIS proximity search)
 *  - ReservationsRepository    (read queries)
 *
 * Responsibilities here are limited to:
 *  - Role-based data scoping (hospital/bank/admin visibility)
 *  - Mapping DTO fields to engine input
 *  - Scheduling the expiry cron
 */
@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly engine: ReservationEngineService,
    private readonly geoSearch: GeoSearchService,
    private readonly repo: ReservationsRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Search ─────────────────────────────────────────────────────────────────

  searchNearbyBlood(dto: SearchBloodDto) {
    return this.geoSearch.findNearbyWithStock(
      dto.lat,
      dto.lng,
      dto.radiusKm ?? 50,
      dto.bloodTypeId,
      dto.quantity,
    );
  }

  /** Nationwide blood-bank overview for the network map — aggregate counts only. */
  networkMap() {
    return this.geoSearch.nationalOverview();
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  findAll(actor: JwtPayload, page: number, limit: number, status?: ReservationStatus, search?: string) {
    return this.repo.findAll(this.scopeWhere(actor), page, limit, status, search);
  }

  async findOne(id: string, actor: JwtPayload) {
    const r = await this.repo.findById(id);
    if (!r) throw new NotFoundException(`Reservation ${id} not found`);
    this.assertAccess(actor, r);
    return r;
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(dto: CreateReservationDto, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot create reservations');
    }

    const hospitalId = actor.role === UserRole.HOSPITAL
      ? actor.facilityId!
      : (dto as any).hospitalId;

    if (!hospitalId) {
      throw new ForbiddenException('hospitalId is required for ADMIN');
    }

    // aboGroup / rhFactor live on BloodType, not on the reservation itself —
    // cross-check against bloodTypeId so a caller can't request a mismatched pair.
    const bloodType = await this.prisma.bloodType.findUnique({
      where: { id: dto.bloodTypeId },
      select: { aboGroup: true, rhFactor: true },
    });
    if (!bloodType) {
      throw new NotFoundException(`Blood type ${dto.bloodTypeId} not found`);
    }
    if (bloodType.aboGroup !== dto.aboGroup || bloodType.rhFactor !== dto.rhFactor) {
      throw new BadRequestException(
        `aboGroup/rhFactor (${dto.aboGroup}${dto.rhFactor}) does not match bloodTypeId`,
      );
    }

    return this.engine.allocate({
      hospitalId,
      bloodBankId:    dto.bloodBankId,
      bloodTypeId:    dto.bloodTypeId,
      quantity:       dto.quantity,
      urgency:        dto.urgency,
      prescriptionId: dto.prescriptionId,
      notes:          dto.notes,
      requestedBy:    actor.sub,
    });
  }

  // ── Status transition ──────────────────────────────────────────────────────

  async updateStatus(
    id: string,
    dto: UpdateReservationStatusDto,
    actor: JwtPayload,
  ) {
    const reservation = await this.repo.findById(id);
    if (!reservation) throw new NotFoundException(`Reservation ${id} not found`);
    this.assertAccess(actor, reservation);

    return this.engine.transition(id, dto.status, actor, dto.cancelReason);
  }

  // ── Bag verification at pickup ─────────────────────────────────────────────

  verifyBag(reservationId: string, dto: VerifyBagDto, actor: JwtPayload) {
    return this.engine.verifyBagForPickup(reservationId, dto.bagCode, actor);
  }

  // ── Scheduled: expiry cron ─────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async runExpiryJob() {
    const count = await this.engine.expireStaleReservations();
    if (count > 0) {
      this.logger.warn(`Expiry cron: processed ${count} stale reservation(s)`);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private scopeWhere(actor: JwtPayload) {
    if (actor.role === UserRole.ADMIN)      return {};
    if (actor.role === UserRole.HOSPITAL)   return { hospitalId:  actor.facilityId! };
    if (actor.role === UserRole.BLOOD_BANK) return { bloodBankId: actor.facilityId! };
    return {};
  }

  private assertAccess(
    actor: JwtPayload,
    r: { hospitalId: string; bloodBankId: string },
  ) {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.HOSPITAL   && r.hospitalId  !== actor.facilityId) {
      throw new ForbiddenException('Access denied to this reservation');
    }
    if (actor.role === UserRole.BLOOD_BANK && r.bloodBankId !== actor.facilityId) {
      throw new ForbiddenException('Access denied to this reservation');
    }
  }
}
