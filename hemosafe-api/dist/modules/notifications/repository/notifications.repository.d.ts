import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export interface PaginatedNotifications {
    data: Awaited<ReturnType<NotificationsRepository['_findMany']>>;
    total: number;
    page: number;
    limit: number;
}
export declare class NotificationsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private _findMany;
    findAll(userId: string, isRead: boolean | undefined, page: number, limit: number): Promise<PaginatedNotifications>;
    findById(id: string): Prisma.Prisma__NotificationClient<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        id: string;
        createdAt: Date;
        userId: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
        metadata: Prisma.JsonValue;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.NotificationCreateInput): Prisma.Prisma__NotificationClient<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        id: string;
        createdAt: Date;
        userId: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
        metadata: Prisma.JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    markRead(id: string, userId: string): Promise<Prisma.BatchPayload>;
    markAllRead(userId: string): Prisma.PrismaPromise<Prisma.BatchPayload>;
    countUnread(userId: string): Prisma.PrismaPromise<number>;
}
