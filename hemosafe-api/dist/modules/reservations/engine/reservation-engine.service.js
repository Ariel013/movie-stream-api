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
var ReservationEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationEngineService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const nanoid_1 = require("nanoid");
const prisma_service_1 = require("../../../prisma/prisma.service");
const locking_service_1 = require("./locking.service");
const reservation_validator_service_1 = require("./reservation-validator.service");
let ReservationEngineService = ReservationEngineService_1 = class ReservationEngineService {
    constructor(prisma, locking, validator, events) {
        this.prisma = prisma;
        this.locking = locking;
        this.validator = validator;
        this.events = events;
        this.logger = new common_1.Logger(ReservationEngineService_1.name);
    }
    async allocate(input) {
        const { hospitalId, bloodBankId, bloodTypeId, quantity, urgency, prescriptionId, notes, requestedBy, } = input;
        await Promise.all([
            this.validator.assertBloodBankExists(bloodBankId),
            this.validator.assertBloodTypeExists(bloodTypeId),
        ]);
        if (prescriptionId) {
            await this.validator.assertPrescriptionValid(prescriptionId, hospitalId, bloodTypeId, quantity);
        }
        const reservation = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `
          SELECT pg_advisory_xact_lock(
            hashtext(${bloodBankId} || ':' || ${bloodTypeId})::bigint
          )
        `;
            this.logger.debug(`Advisory lock acquired: bank=${bloodBankId} type=${bloodTypeId}`);
            const bags = await tx.$queryRaw `
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
            const allocatedBags = this.validator.assertSufficientStock(bags, quantity, urgency);
            const bagIds = allocatedBags.map((b) => b.id);
            const actualQty = bagIds.length;
            this.logger.debug(`Allocated ${actualQty}/${quantity} bags: [${bagIds.join(', ')}]`);
            await tx.$executeRaw `
          UPDATE blood_bags
          SET    status     = 'RESERVED',
                 updated_at = NOW()
          WHERE  id = ANY(${bagIds}::uuid[])
        `;
            const code = `RES-${new Date().getFullYear()}-${(0, nanoid_1.nanoid)(6).toUpperCase()}`;
            const reservationRow = await tx.reservation.create({
                data: {
                    code,
                    quantity: actualQty,
                    urgency,
                    notes,
                    hospital: { connect: { id: hospitalId } },
                    bloodBank: { connect: { id: bloodBankId } },
                    bloodType: { connect: { id: bloodTypeId } },
                    requester: { connect: { id: requestedBy } },
                    ...(prescriptionId && {
                        prescription: { connect: { id: prescriptionId } },
                    }),
                },
                select: { id: true, code: true, expiresAt: true, status: true },
            });
            await tx.reservationBag.createMany({
                data: bagIds.map((bloodBagId) => ({
                    reservationId: reservationRow.id,
                    bloodBagId,
                })),
            });
            await tx.stockMovement.createMany({
                data: bagIds.map((bloodBagId) => ({
                    bloodBagId,
                    movementType: client_1.MovementType.RESERVED,
                    fromStatus: client_1.BagStatus.AVAILABLE,
                    toStatus: client_1.BagStatus.RESERVED,
                    performedBy: requestedBy,
                    reservationId: reservationRow.id,
                })),
            });
            return reservationRow;
        }, {
            isolationLevel: 'RepeatableRead',
            maxWait: 5_000,
            timeout: 10_000,
        });
        const full = await this.loadReservation(reservation.id);
        this.events.emit('reservation.created', full);
        this.logger.log(`Reservation ${reservation.code} created — ` +
            `${reservation.status}, expires ${reservation.expiresAt.toISOString()}`);
        return full;
    }
    async transition(reservationId, nextStatus, actor, cancelReason) {
        const reservation = await this.loadReservation(reservationId);
        if (!reservation) {
            throw new common_1.ConflictException(`Reservation ${reservationId} not found`);
        }
        this.validator.assertFsmTransition(reservation.status, nextStatus);
        this.validator.assertRoleForTransition(actor, nextStatus);
        if (nextStatus === client_1.ReservationStatus.CANCELLED) {
            this.validator.assertCancelReasonProvided(cancelReason);
        }
        if (reservation.status !== client_1.ReservationStatus.EXPIRED &&
            nextStatus !== client_1.ReservationStatus.CANCELLED) {
            this.validator.assertNotExpired(reservation.expiresAt);
        }
        const bagIds = reservation.reservationBags.map((rb) => rb.bloodBagId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const now = new Date();
            const baseUpdate = { status: nextStatus };
            if (nextStatus === client_1.ReservationStatus.CONFIRMED)
                baseUpdate['confirmedAt'] = now;
            if (nextStatus === client_1.ReservationStatus.DISPATCHED)
                baseUpdate['dispatchedAt'] = now;
            if (nextStatus === client_1.ReservationStatus.DELIVERED)
                baseUpdate['deliveredAt'] = now;
            if (nextStatus === client_1.ReservationStatus.CANCELLED) {
                baseUpdate['cancelledAt'] = now;
                baseUpdate['cancelReason'] = cancelReason;
            }
            if (nextStatus === client_1.ReservationStatus.CANCELLED) {
                await tx.$executeRaw `
          UPDATE blood_bags
          SET    status     = 'AVAILABLE',
                 updated_at = NOW()
          WHERE  id = ANY(${bagIds}::uuid[])
            AND  status = 'RESERVED'
        `;
                await tx.stockMovement.createMany({
                    data: bagIds.map((bloodBagId) => ({
                        bloodBagId,
                        movementType: client_1.MovementType.RELEASED,
                        fromStatus: client_1.BagStatus.RESERVED,
                        toStatus: client_1.BagStatus.AVAILABLE,
                        performedBy: actor.sub,
                        reservationId,
                        notes: cancelReason,
                    })),
                });
            }
            if (nextStatus === client_1.ReservationStatus.DELIVERED) {
                await tx.$executeRaw `
          UPDATE blood_bags
          SET    status     = 'DISTRIBUTED',
                 updated_at = NOW()
          WHERE  id = ANY(${bagIds}::uuid[])
            AND  status = 'RESERVED'
        `;
                await tx.stockMovement.createMany({
                    data: bagIds.map((bloodBagId) => ({
                        bloodBagId,
                        movementType: client_1.MovementType.DISTRIBUTED,
                        fromStatus: client_1.BagStatus.RESERVED,
                        toStatus: client_1.BagStatus.DISTRIBUTED,
                        performedBy: actor.sub,
                        reservationId,
                    })),
                });
                if (reservation.prescriptionId) {
                    await tx.prescription.update({
                        where: { id: reservation.prescriptionId },
                        data: { isFulfilled: true, fulfilledAt: now },
                    });
                }
            }
            return tx.reservation.update({
                where: { id: reservationId },
                data: baseUpdate,
                include: {
                    hospital: { select: { id: true, name: true } },
                    bloodBank: { select: { id: true, name: true } },
                    bloodType: { select: { label: true } },
                    reservationBags: {
                        include: { bloodBag: { select: { id: true, code: true, status: true } } },
                    },
                },
            });
        });
        this.events.emit(`reservation.${nextStatus.toLowerCase()}`, updated);
        this.logger.log(`Reservation ${updated.code} transitioned to ${nextStatus} by ${actor.sub}`);
        return updated;
    }
    async expireStaleReservations() {
        const stale = await this.prisma.reservation.findMany({
            where: {
                status: { in: [client_1.ReservationStatus.PENDING, client_1.ReservationStatus.CONFIRMED] },
                expiresAt: { lt: new Date() },
            },
            select: {
                id: true,
                code: true,
                hospitalId: true,
                reservationBags: { select: { bloodBagId: true } },
            },
        });
        if (stale.length === 0)
            return 0;
        this.logger.warn(`Processing ${stale.length} expired reservation(s)`);
        let expiredCount = 0;
        for (const r of stale) {
            try {
                const bagIds = r.reservationBags.map((rb) => rb.bloodBagId);
                await this.prisma.$transaction(async (tx) => {
                    if (bagIds.length > 0) {
                        await tx.$executeRaw `
              UPDATE blood_bags
              SET    status     = 'AVAILABLE',
                     updated_at = NOW()
              WHERE  id = ANY(${bagIds}::uuid[])
                AND  status = 'RESERVED'
            `;
                        await tx.stockMovement.createMany({
                            data: bagIds.map((bloodBagId) => ({
                                bloodBagId,
                                movementType: client_1.MovementType.RELEASED,
                                fromStatus: client_1.BagStatus.RESERVED,
                                toStatus: client_1.BagStatus.AVAILABLE,
                                notes: 'Auto-released: 24h TTL exceeded',
                            })),
                        });
                    }
                    await tx.reservation.update({
                        where: { id: r.id },
                        data: { status: client_1.ReservationStatus.EXPIRED },
                    });
                });
                this.events.emit('reservation.expired', {
                    id: r.id,
                    code: r.code,
                    hospitalId: r.hospitalId,
                });
                expiredCount++;
            }
            catch (err) {
                this.logger.error(`Failed to expire reservation ${r.id}`, err);
            }
        }
        if (expiredCount > 0) {
            this.logger.warn(`Expired ${expiredCount} reservation(s), released their bags`);
        }
        return expiredCount;
    }
    async verifyBagForPickup(reservationId, bagCode, actor) {
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
        if (bag.status !== client_1.BagStatus.RESERVED) {
            return {
                valid: false,
                bagId: bag.id,
                message: `Bag ${bagCode} has unexpected status: ${bag.status}`,
            };
        }
        return { valid: true, bagId: bag.id, message: 'Bag verified successfully' };
    }
    loadReservation(id) {
        return this.prisma.reservation.findUnique({
            where: { id },
            include: {
                hospital: { select: { id: true, name: true, code: true } },
                bloodBank: { select: { id: true, name: true, code: true } },
                bloodType: { select: { label: true } },
                requester: { select: { id: true, firstName: true, lastName: true } },
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
};
exports.ReservationEngineService = ReservationEngineService;
exports.ReservationEngineService = ReservationEngineService = ReservationEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        locking_service_1.LockingService,
        reservation_validator_service_1.ReservationValidatorService,
        event_emitter_1.EventEmitter2])
], ReservationEngineService);
//# sourceMappingURL=reservation-engine.service.js.map