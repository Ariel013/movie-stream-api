import {
  Injectable, Logger, ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BagStatus, MovementType, ReservationStatus, UrgencyLevel } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../../prisma/prisma.service';
import { LockingService } from './locking.service';
import { ReservationValidatorService, AvailableBagRow } from './reservation-validator.service';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';

export interface AllocateInput {
  hospitalId:      string;
  bloodBankId:     string;
  bloodTypeId:     string;
  quantity:        number;
  urgency:         UrgencyLevel;
  prescriptionId?: string;
  notes?:          string;
  requestedBy:     string;   // userId
}

export interface ConfirmPickupInput {
  reservationId: string;
  actor:         JwtPayload;
}

/**
 * ReservationEngineService
 * ========================
 * The core allocation engine for HEMOSAFE.
 *
 * Locking strategy (two layers):
 *
 *  Layer 1 — Advisory lock  (pg_advisory_xact_lock)
 *    Serialises concurrent requests for the same (bank, blood type) pair.
 *    Prevents deadlocks between parallel transactions that would otherwise
 *    compete for the same rows.
 *
 *  Layer 2 — SELECT FOR UPDATE SKIP LOCKED
 *    Locks the individual bag rows within the transaction.
 *    SKIP LOCKED ensures we never wait for rows held by another transaction.
 *    Combined with Layer 1, this is guaranteed to never block or deadlock.
 *
 * Transaction isolation: REPEATABLE READ
 *    Prevents non-repeatable reads; sufficient with our advisory lock.
 *    Lower overhead than SERIALIZABLE.
 */
@Injectable()
export class ReservationEngineService {
  private readonly logger = new Logger(ReservationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly locking: LockingService,
    private readonly validator: ReservationValidatorService,
    private readonly events: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ALLOCATE — create a reservation with atomic bag locking
  // ═══════════════════════════════════════════════════════════════════════════

  async allocate(input: AllocateInput) {
    const {
      hospitalId, bloodBankId, bloodTypeId,
      quantity, urgency, prescriptionId, notes, requestedBy,
    } = input;

    // ── Pre-flight checks (outside transaction — no lock needed) ──────────────
    await Promise.all([
      this.validator.assertBloodBankExists(bloodBankId),
      this.validator.assertBloodTypeExists(bloodTypeId),
    ]);

    if (prescriptionId) {
      await this.validator.assertPrescriptionValid(
        prescriptionId, hospitalId, bloodTypeId, quantity,
      );
    }

    // ── Core transaction ───────────────────────────────────────────────────────
    const reservation = await this.prisma.$transaction(
      async (tx) => {
        /*
         * STEP 1 — Advisory lock
         *
         * Serialises all concurrent requests for this (bank, blood type).
         * The lock is automatically released when this transaction ends.
         *
         * PostgreSQL hashtext() turns the composite key into a deterministic
         * int4 value. We cast to bigint for the advisory lock API.
         */
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${bloodBankId} || ':' || ${bloodTypeId})::bigint
          )
        `;

        this.logger.debug(
          `Advisory lock acquired: bank=${bloodBankId} type=${bloodTypeId}`,
        );

        /*
         * STEP 2 — SELECT FOR UPDATE SKIP LOCKED
         *
         * Lock exactly `quantity` rows (or all available for EMERGENCY partial-fill).
         * SKIP LOCKED: never waits — skips any row already locked by another tx.
         * ORDER BY expires_at ASC: FEFO (First Expired, First Out) to minimise waste.
         *
         * Why raw SQL here?
         *   Prisma's ORM layer does not expose SELECT ... FOR UPDATE.
         *   This is the only place we use $queryRaw in the engine.
         *   All other operations use typed Prisma client methods.
         */
        const bags = await tx.$queryRaw<AvailableBagRow[]>`
          SELECT
            id,
            code,
            expires_at,
            volume_ml,
            blood_bank_id,
            blood_type_id
          FROM blood_bags
          WHERE blood_bank_id = ${bloodBankId}::uuid
            AND blood_type_id = ${bloodTypeId}::uuid
            AND status        = 'AVAILABLE'
            AND expires_at    > NOW()
          ORDER BY expires_at ASC
          LIMIT ${quantity}
          FOR UPDATE SKIP LOCKED
        `;

        /*
         * STEP 3 — Validate stock (after locking)
         *
         * We validate AFTER acquiring the lock so the count is authoritative.
         * EMERGENCY requests accept a partial fill.
         */
        const allocatedBags = this.validator.assertSufficientStock(
          bags, quantity, urgency,
        );

        const bagIds = allocatedBags.map((b) => b.id);
        const actualQty = bagIds.length;

        this.logger.debug(
          `Allocated ${actualQty}/${quantity} bags: [${bagIds.join(', ')}]`,
        );

        /*
         * STEP 4 — Mark bags RESERVED
         *
         * updateMany is safe here because:
         *  - We hold FOR UPDATE locks on exactly these rows
         *  - No other transaction can touch them until we COMMIT
         */
        await tx.$executeRaw`
          UPDATE blood_bags
          SET    status     = 'RESERVED',
                 updated_at = NOW()
          WHERE  id = ANY(${bagIds}::uuid[])
        `;

        /*
         * STEP 5 — Create the reservation
         *
         * expires_at is set by the DB DEFAULT (NOW() + INTERVAL '24 hours').
         * Never compute TTL in application code — avoids clock skew issues.
         */
        const code = `RES-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

        const reservationRow = await tx.reservation.create({
          data: {
            code,
            quantity:   actualQty,
            urgency,
            notes,
            hospital:  { connect: { id: hospitalId } },
            bloodBank: { connect: { id: bloodBankId } },
            bloodType: { connect: { id: bloodTypeId } },
            requester: { connect: { id: requestedBy } },
            ...(prescriptionId && {
              prescription: { connect: { id: prescriptionId } },
            }),
          },
          select: { id: true, code: true, expiresAt: true, status: true },
        });

        /*
         * STEP 6 — Link bags to reservation (junction table)
         */
        await tx.reservationBag.createMany({
          data: bagIds.map((bloodBagId) => ({
            reservationId: reservationRow.id,
            bloodBagId,
          })),
        });

        /*
         * STEP 7 — Append stock movement audit entries
         *
         * createMany is fire-and-forget within the transaction.
         * Failures roll back with the parent transaction.
         */
        await tx.stockMovement.createMany({
          data: bagIds.map((bloodBagId) => ({
            bloodBagId,
            movementType:  MovementType.RESERVED,
            fromStatus:    BagStatus.AVAILABLE,
            toStatus:      BagStatus.RESERVED,
            performedBy:   requestedBy,
            reservationId: reservationRow.id,
          })),
        });

        return reservationRow;
        /*
         * COMMIT → advisory lock released automatically.
         * Bags are now RESERVED under reservationRow.id.
         */
      },
      {
        isolationLevel: 'RepeatableRead',  // prevents non-repeatable reads
        maxWait: 5_000,                    // ms to wait for connection from pool
        timeout:  10_000,                  // ms max for the entire transaction
      },
    );

    // ── Post-commit: load full response and emit event ─────────────────────
    const full = await this.loadReservation(reservation.id);
    this.events.emit('reservation.created', full);

    this.logger.log(
      `Reservation ${reservation.code} created — ` +
      `${reservation.status}, expires ${reservation.expiresAt.toISOString()}`,
    );

    return full;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS TRANSITION — FSM-guarded, handles bag lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  async transition(
    reservationId: string,
    nextStatus: ReservationStatus,
    actor: JwtPayload,
    cancelReason?: string,
  ) {
    // Load current state (no lock needed for read)
    const reservation = await this.loadReservation(reservationId);
    if (!reservation) {
      throw new ConflictException(`Reservation ${reservationId} not found`);
    }

    // FSM + role validation (throws on invalid)
    this.validator.assertFsmTransition(reservation.status, nextStatus);
    this.validator.assertRoleForTransition(actor, nextStatus);

    if (nextStatus === ReservationStatus.CANCELLED) {
      this.validator.assertCancelReasonProvided(cancelReason);
    }

    // Validate reservation has not expired for all active transitions
    if (
      reservation.status !== ReservationStatus.EXPIRED &&
      nextStatus !== ReservationStatus.CANCELLED
    ) {
      this.validator.assertNotExpired(reservation.expiresAt);
    }

    const bagIds = reservation.reservationBags.map((rb: any) => rb.bloodBagId);

    // Perform transition inside a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const baseUpdate: Record<string, unknown> = { status: nextStatus };

      // ── Timestamp tracking ───────────────────────────────────────────────
      if (nextStatus === ReservationStatus.CONFIRMED)  baseUpdate['confirmedAt']  = now;
      if (nextStatus === ReservationStatus.DISPATCHED) baseUpdate['dispatchedAt'] = now;
      if (nextStatus === ReservationStatus.DELIVERED)  baseUpdate['deliveredAt']  = now;
      if (nextStatus === ReservationStatus.CANCELLED) {
        baseUpdate['cancelledAt']  = now;
        baseUpdate['cancelReason'] = cancelReason;
      }

      // ── Bag lifecycle transitions ─────────────────────────────────────────

      if (nextStatus === ReservationStatus.CANCELLED) {
        /*
         * CANCEL: Release all reserved bags back to AVAILABLE.
         * Use raw UPDATE for performance (single statement instead of N updates).
         */
        await tx.$executeRaw`
          UPDATE blood_bags
          SET    status     = 'AVAILABLE',
                 updated_at = NOW()
          WHERE  id = ANY(${bagIds}::uuid[])
            AND  status = 'RESERVED'
        `;
        await tx.stockMovement.createMany({
          data: bagIds.map((bloodBagId: string) => ({
            bloodBagId,
            movementType:  MovementType.RELEASED,
            fromStatus:    BagStatus.RESERVED,
            toStatus:      BagStatus.AVAILABLE,
            performedBy:   actor.sub,
            reservationId,
            notes:         cancelReason,
          })),
        });
      }

      if (nextStatus === ReservationStatus.DELIVERED) {
        /*
         * DELIVERED: Mark bags as DISTRIBUTED — they have left the blood bank.
         * This is the final status for a bag (terminal, immutable).
         */
        await tx.$executeRaw`
          UPDATE blood_bags
          SET    status     = 'DISTRIBUTED',
                 updated_at = NOW()
          WHERE  id = ANY(${bagIds}::uuid[])
            AND  status = 'RESERVED'
        `;
        await tx.stockMovement.createMany({
          data: bagIds.map((bloodBagId: string) => ({
            bloodBagId,
            movementType:  MovementType.DISTRIBUTED,
            fromStatus:    BagStatus.RESERVED,
            toStatus:      BagStatus.DISTRIBUTED,
            performedBy:   actor.sub,
            reservationId,
          })),
        });

        // Mark prescription as fulfilled if linked
        if (reservation.prescriptionId) {
          await tx.prescription.update({
            where: { id: reservation.prescriptionId },
            data:  { isFulfilled: true, fulfilledAt: now },
          });
        }
      }

      // ── Update reservation row ────────────────────────────────────────────
      return tx.reservation.update({
        where: { id: reservationId },
        data:  baseUpdate as any,
        include: {
          hospital:  { select: { id: true, name: true } },
          bloodBank: { select: { id: true, name: true } },
          bloodType: { select: { label: true } },
          reservationBags: {
            include: { bloodBag: { select: { id: true, code: true, status: true } } },
          },
        },
      });
    });

    // Emit post-commit events
    this.events.emit(`reservation.${nextStatus.toLowerCase()}`, updated);

    this.logger.log(
      `Reservation ${updated.code} transitioned to ${nextStatus} by ${actor.sub}`,
    );

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPIRY — called by cron every 60 seconds
  // ═══════════════════════════════════════════════════════════════════════════

  async expireStaleReservations(): Promise<number> {
    /*
     * Find expired reservations in one read, then process each in its own
     * transaction. Using per-row transactions (not bulk) to:
     *  1. Limit lock scope — each transaction only locks its own bags
     *  2. Prevent one failed expiry from rolling back all others
     *  3. Keep transaction duration short (< 10ms per reservation)
     */
    const stale = await this.prisma.reservation.findMany({
      where: {
        status:    { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
        expiresAt: { lt: new Date() },
      },
      select: {
        id:              true,
        code:            true,
        hospitalId:      true,
        reservationBags: { select: { bloodBagId: true } },
      },
    });

    if (stale.length === 0) return 0;

    this.logger.warn(`Processing ${stale.length} expired reservation(s)`);

    let expiredCount = 0;
    for (const r of stale) {
      try {
        const bagIds = r.reservationBags.map((rb) => rb.bloodBagId);

        await this.prisma.$transaction(async (tx) => {
          // Release bags: RESERVED → AVAILABLE
          if (bagIds.length > 0) {
            await tx.$executeRaw`
              UPDATE blood_bags
              SET    status     = 'AVAILABLE',
                     updated_at = NOW()
              WHERE  id = ANY(${bagIds}::uuid[])
                AND  status = 'RESERVED'
            `;
            await tx.stockMovement.createMany({
              data: bagIds.map((bloodBagId) => ({
                bloodBagId,
                movementType: MovementType.RELEASED,
                fromStatus:   BagStatus.RESERVED,
                toStatus:     BagStatus.AVAILABLE,
                notes:        'Auto-released: 24h TTL exceeded',
              })),
            });
          }

          // Mark reservation expired
          await tx.reservation.update({
            where: { id: r.id },
            data:  { status: ReservationStatus.EXPIRED },
          });
        });

        this.events.emit('reservation.expired', {
          id:         r.id,
          code:       r.code,
          hospitalId: r.hospitalId,
        });

        expiredCount++;
      } catch (err) {
        // Log but do not re-throw — process remaining reservations
        this.logger.error(`Failed to expire reservation ${r.id}`, err);
      }
    }

    if (expiredCount > 0) {
      this.logger.warn(`Expired ${expiredCount} reservation(s), released their bags`);
    }

    return expiredCount;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BAG VERIFICATION — scan barcode at pickup
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verify that a scanned bag code belongs to the given reservation.
   * Used by blood bank staff at the pickup counter to validate each bag
   * before the patient leaves.
   */
  async verifyBagForPickup(
    reservationId: string,
    bagCode: string,
    actor: JwtPayload,
  ): Promise<{ valid: boolean; bagId: string; message: string }> {
    const bag = await this.prisma.bloodBag.findUnique({
      where: { code: bagCode },
      select: { id: true, status: true, bloodBankId: true },
    });

    if (!bag) {
      return { valid: false, bagId: '', message: `Bag code ${bagCode} not found` };
    }

    if (actor.role === 'BLOOD_BANK' && bag.bloodBankId !== actor.facilityId) {
      return { valid: false, bagId: bag.id, message: 'Bag does not belong to your blood bank' };
    }

    const link = await this.prisma.reservationBag.findUnique({
      where: {
        reservationId_bloodBagId: {
          reservationId,
          bloodBagId: bag.id,
        },
      },
    });

    if (!link) {
      return { valid: false, bagId: bag.id, message: `Bag ${bagCode} is not part of this reservation` };
    }

    if (bag.status !== BagStatus.RESERVED) {
      return {
        valid: false,
        bagId: bag.id,
        message: `Bag ${bagCode} has unexpected status: ${bag.status}`,
      };
    }

    return { valid: true, bagId: bag.id, message: 'Bag verified successfully' };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private loadReservation(id: string) {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        hospital:        { select: { id: true, name: true, code: true } },
        bloodBank:       { select: { id: true, name: true, code: true } },
        bloodType:       { select: { label: true } },
        requester:       { select: { id: true, firstName: true, lastName: true } },
        reservationBags: {
          include: {
            bloodBag: {
              select: { id: true, code: true, expiresAt: true, volumeMl: true, status: true },
            },
          },
        },
      },
    });
  }
}
