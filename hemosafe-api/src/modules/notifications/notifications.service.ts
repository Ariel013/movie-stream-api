import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, UserRole } from '@prisma/client';
import { NotificationsRepository } from './repository/notifications.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { FilterNotificationsDto } from './dto/filter-notifications.dto';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  findAll(actor: JwtPayload, dto: FilterNotificationsDto) {
    return this.repo.findAll(
      actor.sub,
      dto.isRead,
      dto.page  ?? 1,
      dto.limit ?? 20,
    );
  }

  countUnread(actor: JwtPayload) {
    return this.repo.countUnread(actor.sub);
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async markRead(id: string, actor: JwtPayload) {
    const notification = await this.repo.findById(id);
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    if (notification.userId !== actor.sub) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }
    await this.repo.markRead(id, actor.sub);
    return { success: true };
  }

  async markAllRead(actor: JwtPayload) {
    const result = await this.repo.markAllRead(actor.sub);
    return { updated: result.count };
  }

  // ── Internal creator (called by event listeners) ───────────────────────────

  async createForUser(dto: CreateNotificationDto) {
    try {
      return await this.repo.create({
        user:     { connect: { id: dto.userId } },
        type:     dto.type,
        title:    dto.title,
        body:     dto.body,
        metadata: (dto.metadata ?? {}) as any,
      });
    } catch (err) {
      this.logger.error(`Failed to create notification for user ${dto.userId}`, err);
    }
  }

  // ── Event listeners ────────────────────────────────────────────────────────

  @OnEvent('reservation.created')
  async onReservationCreated(payload: {
    id: string; code: string; quantity: number;
    hospital: { name: string }; bloodBank: { id: string };
  }) {
    this.logger.debug(`[event] reservation.created → code=${payload.code}`);
    await this.notifyBankStaff(payload.bloodBank.id, {
      type:  NotificationType.SYSTEM,
      title: 'New reservation request',
      body:  `${payload.hospital.name} requested ${payload.quantity} bag(s) — reservation ${payload.code}.`,
      metadata: { reservationId: payload.id },
    });
  }

  @OnEvent('reservation.confirmed')
  async onReservationConfirmed(payload: {
    id: string;
    code: string;
    requestedBy: string;
  }) {
    this.logger.debug(`[event] reservation.confirmed → code=${(payload as any).code}`);
    const reservation = payload as any;
    await this.createForUser({
      userId: reservation.requestedBy,
      type:   NotificationType.RESERVATION_CONFIRMED,
      title:  'Reservation confirmed',
      body:   `Your reservation ${reservation.code} has been confirmed by the blood bank.`,
      metadata: { reservationId: reservation.id },
    });
  }

  @OnEvent('reservation.expired')
  async onReservationExpired(payload: { id: string; code: string; requestedBy: string }) {
    this.logger.debug(`[event] reservation.expired → code=${(payload as any).code}`);
    const reservation = payload as any;
    await this.createForUser({
      userId: reservation.requestedBy,
      type:   NotificationType.RESERVATION_EXPIRED,
      title:  'Reservation expired',
      body:   `Your reservation ${reservation.code} has expired and bags have been released.`,
      metadata: { reservationId: reservation.id },
    });
  }

  @OnEvent('reservation.delivered')
  async onReservationDelivered(payload: {
    id: string; code: string; bloodBank: { id: string };
  }) {
    this.logger.debug(`[event] reservation.delivered → code=${payload.code}`);
    await this.notifyBankStaff(payload.bloodBank.id, {
      type:  NotificationType.SYSTEM,
      title: 'Reservation delivered',
      body:  `Reservation ${payload.code} was picked up by the hospital.`,
      metadata: { reservationId: payload.id },
    });
  }

  @OnEvent('bags.expiring-soon')
  async onBagsExpiringSoon(payload: Array<{ id: string; code: string; bloodBankId: string }>) {
    this.logger.debug(`[event] bags.expiring-soon → ${payload.length} bag(s)`);

    const byBank = new Map<string, Array<{ id: string; code: string }>>();
    for (const bag of payload) {
      const list = byBank.get(bag.bloodBankId) ?? [];
      list.push({ id: bag.id, code: bag.code });
      byBank.set(bag.bloodBankId, list);
    }

    for (const [bloodBankId, bags] of byBank) {
      await this.notifyBankStaff(bloodBankId, {
        type:  NotificationType.BAG_EXPIRING_SOON,
        title: `${bags.length} bag(s) expiring within 48h`,
        body:  `Codes: ${bags.map((b) => b.code).join(', ')}`,
        metadata: { bagIds: bags.map((b) => b.id) },
      });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async notifyBankStaff(
    bloodBankId: string,
    payload: Omit<CreateNotificationDto, 'userId'>,
  ) {
    const staff = await this.prisma.user.findMany({
      where:  { facilityId: bloodBankId, role: UserRole.BLOOD_BANK, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      staff.map((u) => this.createForUser({ ...payload, userId: u.id })),
    );
  }
}
