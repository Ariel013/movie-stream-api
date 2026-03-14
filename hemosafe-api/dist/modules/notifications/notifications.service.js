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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const notifications_repository_1 = require("./repository/notifications.repository");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(repo) {
        this.repo = repo;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    findAll(actor, dto) {
        return this.repo.findAll(actor.sub, dto.isRead, dto.page ?? 1, dto.limit ?? 20);
    }
    countUnread(actor) {
        return this.repo.countUnread(actor.sub);
    }
    async markRead(id, actor) {
        const notification = await this.repo.findById(id);
        if (!notification)
            throw new common_1.NotFoundException(`Notification ${id} not found`);
        if (notification.userId !== actor.sub) {
            throw new common_1.ForbiddenException('You can only mark your own notifications as read');
        }
        await this.repo.markRead(id, actor.sub);
        return { success: true };
    }
    async markAllRead(actor) {
        const result = await this.repo.markAllRead(actor.sub);
        return { updated: result.count };
    }
    async createForUser(dto) {
        try {
            return await this.repo.create({
                user: { connect: { id: dto.userId } },
                type: dto.type,
                title: dto.title,
                body: dto.body,
                metadata: (dto.metadata ?? {}),
            });
        }
        catch (err) {
            this.logger.error(`Failed to create notification for user ${dto.userId}`, err);
        }
    }
    async onReservationCreated(payload) {
        this.logger.debug(`[event] reservation.created → code=${payload.code}`);
    }
    async onReservationConfirmed(payload) {
        this.logger.debug(`[event] reservation.confirmed → code=${payload.code}`);
        const reservation = payload;
        await this.createForUser({
            userId: reservation.requestedBy,
            type: client_1.NotificationType.RESERVATION_CONFIRMED,
            title: 'Reservation confirmed',
            body: `Your reservation ${reservation.code} has been confirmed by the blood bank.`,
            metadata: { reservationId: reservation.id },
        });
    }
    async onReservationExpired(payload) {
        this.logger.debug(`[event] reservation.expired → code=${payload.code}`);
        const reservation = payload;
        await this.createForUser({
            userId: reservation.requestedBy,
            type: client_1.NotificationType.RESERVATION_EXPIRED,
            title: 'Reservation expired',
            body: `Your reservation ${reservation.code} has expired and bags have been released.`,
            metadata: { reservationId: reservation.id },
        });
    }
    async onReservationDelivered(payload) {
        this.logger.debug(`[event] reservation.delivered → code=${payload.code}`);
    }
    async onBagsExpiringSoon(payload) {
        this.logger.debug(`[event] bags.expiring-soon → ${payload.length} bag(s)`);
    }
};
exports.NotificationsService = NotificationsService;
__decorate([
    (0, event_emitter_1.OnEvent)('reservation.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onReservationCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('reservation.confirmed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onReservationConfirmed", null);
__decorate([
    (0, event_emitter_1.OnEvent)('reservation.expired'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onReservationExpired", null);
__decorate([
    (0, event_emitter_1.OnEvent)('reservation.delivered'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onReservationDelivered", null);
__decorate([
    (0, event_emitter_1.OnEvent)('bags.expiring-soon'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onBagsExpiringSoon", null);
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_repository_1.NotificationsRepository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map