import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repository/notifications.repository';

@Module({
  controllers: [NotificationsController],
  providers:   [NotificationsService, NotificationsRepository],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
