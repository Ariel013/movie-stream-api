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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let NotificationsRepository = class NotificationsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    _findMany(where, skip, take) {
        return this.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    }
    async findAll(userId, isRead, page, limit) {
        const where = { userId };
        if (isRead !== undefined)
            where.isRead = isRead;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this._findMany(where, skip, limit),
            this.prisma.notification.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    findById(id) {
        return this.prisma.notification.findUnique({ where: { id } });
    }
    create(data) {
        return this.prisma.notification.create({ data });
    }
    async markRead(id, userId) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    markAllRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    countUnread(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
};
exports.NotificationsRepository = NotificationsRepository;
exports.NotificationsRepository = NotificationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsRepository);
//# sourceMappingURL=notifications.repository.js.map