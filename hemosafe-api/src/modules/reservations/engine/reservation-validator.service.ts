import {
  Injectable, BadRequestException, ConflictException,
  ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, UrgencyLevel } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';

/** Raw DB row returned by the bag-count query */
export interface AvailableBagRow {
  id:           string;
  code:         string;
  expires_at:   Date;
  volume_ml:    number;
  blood_bank_id: string;
  blood_type_id: string;
}

/**
 * Validates all business rules for reservation creation and status transitions.
 * Centralising rules here keeps the engine service focused on allocation logic.
 */
@Injectable()
export class ReservationValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Pre-allocation checks ──────────────────────────────────────────────────

  async assertBloodBankExists(bloodBankId: string): Promise<void> {
    const bank = await this.prisma.facility.findFirst({
      where: { id: bloodBankId, type: 'BLOOD_BANK', isActive: true },
      select: { id: true },
    });
    if (!bank) {
      throw new NotFoundException(`Blood bank ${bloodBankId} not found or inactive`);
    }
  }

  async assertBloodTypeExists(bloodTypeId: string): Promise<void> {
    const bt = await this.prisma.bloodType.findUnique({
      where: { id: bloodTypeId },
      select: { id: true },
    });
    if (!bt) {
      throw new NotFoundException(`Blood type ${bloodTypeId} not found`);
    }
  }

  async assertPrescriptionValid(
    prescriptionId: string,
    hospitalId: string,
    bloodTypeId: string,
    quantity: number,
  ): Promise<void> {
    const rx = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      select: {
        hospitalId: true,
        bloodTypeId: true,
        quantity: true,
        isFulfilled: true,
        expiresAt: true,
      },
    });

    if (!rx) throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    if (rx.isFulfilled) throw new ConflictException('Prescription is already fulfilled');
    if (rx.hospitalId !== hospitalId) {
      throw new ForbiddenException('Prescription belongs to a different hospital');
    }
    if (rx.bloodTypeId !== bloodTypeId) {
      throw new BadRequestException(
        'Reservation blood type does not match prescription blood type',
      );
    }
    if (rx.expiresAt && rx.expiresAt < new Date()) {
      throw new BadRequestException('Prescription has expired');
    }
  }

  /**
   * Validate available bag count AFTER acquiring the row-level lock.
   * Handles EMERGENCY partial-fill: allows fewer bags than requested.
   */
  assertSufficientStock(
    bags: AvailableBagRow[],
    requestedQty: number,
    urgency: UrgencyLevel,
  ): AvailableBagRow[] {
    if (urgency === UrgencyLevel.EMERGENCY) {
      // Emergency: fill as many as available (even 1 bag)
      if (bags.length === 0) {
        throw new ConflictException(
          'No available bags of requested blood type — even for emergency',
        );
      }
      return bags; // partial fill is acceptable
    }

    if (bags.length < requestedQty) {
      throw new ConflictException(
        `Insufficient stock. Requested: ${requestedQty}, available: ${bags.length}`,
      );
    }
    return bags;
  }

  // ── FSM transition rules ────────────────────────────────────────────────────

  private readonly FSM: Record<ReservationStatus, ReservationStatus[]> = {
    PENDING:    [ReservationStatus.CONFIRMED,  ReservationStatus.CANCELLED],
    CONFIRMED:  [ReservationStatus.DISPATCHED, ReservationStatus.CANCELLED],
    DISPATCHED: [ReservationStatus.DELIVERED],
    DELIVERED:  [],
    EXPIRED:    [],
    CANCELLED:  [],
  };

  assertFsmTransition(current: ReservationStatus, next: ReservationStatus): void {
    const allowed = this.FSM[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transition ${current} → ${next} is not allowed. ` +
        `Valid next states: [${allowed.join(', ') || 'none'}]`,
      );
    }
  }

  assertRoleForTransition(
    actor: JwtPayload,
    to: ReservationStatus,
  ): void {
    const bankTransitions = new Set<ReservationStatus>([
      ReservationStatus.CONFIRMED,
      ReservationStatus.DISPATCHED,
    ]);
    const hospitalTransitions = new Set<ReservationStatus>([
      ReservationStatus.DELIVERED,
      ReservationStatus.CANCELLED,
    ]);

    if (bankTransitions.has(to) && actor.role !== 'BLOOD_BANK' && actor.role !== 'ADMIN') {
      throw new ForbiddenException(`Only BLOOD_BANK can set status to ${to}`);
    }

    if (to === ReservationStatus.DELIVERED && actor.role !== 'HOSPITAL' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only HOSPITAL can mark as DELIVERED');
    }
  }

  assertCancelReasonProvided(reason: string | undefined): void {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        'cancelReason is required (min 5 chars) when cancelling a reservation',
      );
    }
  }

  assertNotExpired(expiresAt: Date): void {
    if (expiresAt < new Date()) {
      throw new ConflictException(
        'Reservation has expired (24h TTL). Please create a new reservation.',
      );
    }
  }
}
