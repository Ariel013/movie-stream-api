import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { NotificationsRepository } from './repository/notifications.repository';
import type { FilterNotificationsDto } from './dto/filter-notifications.dto';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly repo: NotificationsRepository) {}

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
  async onReservationCreated(payload: { bloodBankId: string; code: string }) {
    // Notify blood bank staff — in a real app you'd look up all bank users
    // Here we record on the facility's user list; simplest approach: emit per user
    // This event payload comes from ReservationsService which emits the reservation object
    this.logger.debug(`[event] reservation.created → code=${(payload as any).code}`);
    // Notification creation handled at the bank level by querying users (omitted here to
    // avoid circular imports; the controller layer or a dedicated listener module wires this)
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
  async onReservationDelivered(payload: { id: string; code: string; bloodBankId: string }) {
    this.logger.debug(`[event] reservation.delivered → code=${(payload as any).code}`);
    // Notify blood bank — in production, resolve blood bank manager user IDs here
  }

  @OnEvent('bags.expiring-soon')
  async onBagsExpiringSoon(payload: Array<{ bloodBankId: string; id: string }>) {
    this.logger.debug(`[event] bags.expiring-soon → ${payload.length} bag(s)`);
    // In production: group by bloodBankId and notify each bank's staff users
  }
}
