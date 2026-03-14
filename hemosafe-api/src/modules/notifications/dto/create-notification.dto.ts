import { NotificationType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Internal DTO — used only by event listeners and service-to-service calls.
 * Not exposed via the REST API.
 */
export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
