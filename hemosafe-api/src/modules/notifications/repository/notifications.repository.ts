import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface PaginatedNotifications {
  data:  Awaited<ReturnType<NotificationsRepository['_findMany']>>;
  total: number;
  page:  number;
  limit: number;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Internal helper to keep the include consistent. */
  private _findMany(where: Prisma.NotificationWhereInput, skip: number, take: number) {
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findAll(
    userId: string,
    isRead: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedNotifications> {
    const where: Prisma.NotificationWhereInput = { userId };
    if (isRead !== undefined) where.isRead = isRead;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this._findMany(where, skip, limit),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where:  { id, userId },
      data:   { isRead: true, readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
