import { NotificationsService } from './notifications.service';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    findAll(actor: JwtPayload, dto: FilterNotificationsDto): Promise<import("./repository/notifications.repository").PaginatedNotifications>;
    countUnread(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<number>;
    markAllRead(actor: JwtPayload): Promise<{
        updated: number;
    }>;
    markRead(id: string, actor: JwtPayload): Promise<{
        success: boolean;
    }>;
}
