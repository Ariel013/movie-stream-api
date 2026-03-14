import { NotificationsRepository } from './repository/notifications.repository';
import type { FilterNotificationsDto } from './dto/filter-notifications.dto';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class NotificationsService {
    private readonly repo;
    private readonly logger;
    constructor(repo: NotificationsRepository);
    findAll(actor: JwtPayload, dto: FilterNotificationsDto): Promise<import("./repository/notifications.repository").PaginatedNotifications>;
    countUnread(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<number>;
    markRead(id: string, actor: JwtPayload): Promise<{
        success: boolean;
    }>;
    markAllRead(actor: JwtPayload): Promise<{
        updated: number;
    }>;
    createForUser(dto: CreateNotificationDto): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        id: string;
        createdAt: Date;
        userId: string;
        body: string;
        isRead: boolean;
        readAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue;
    } | undefined>;
    onReservationCreated(payload: {
        bloodBankId: string;
        code: string;
    }): Promise<void>;
    onReservationConfirmed(payload: {
        id: string;
        code: string;
        requestedBy: string;
    }): Promise<void>;
    onReservationExpired(payload: {
        id: string;
        code: string;
        requestedBy: string;
    }): Promise<void>;
    onReservationDelivered(payload: {
        id: string;
        code: string;
        bloodBankId: string;
    }): Promise<void>;
    onBagsExpiringSoon(payload: Array<{
        bloodBankId: string;
        id: string;
    }>): Promise<void>;
}
