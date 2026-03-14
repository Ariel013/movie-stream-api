import { NotificationType } from '@prisma/client';
export declare class CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
}
