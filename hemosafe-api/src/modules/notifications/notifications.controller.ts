import {
  Controller, Get, Patch, Param, Query,
  ParseUUIDPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated, filterable by read status)' })
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query() dto: FilterNotificationsDto,
  ) {
    return this.service.findAll(actor, dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count unread notifications for the current user' })
  countUnread(@CurrentUser() actor: JwtPayload) {
    return this.service.countUnread(actor);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@CurrentUser() actor: JwtPayload) {
    return this.service.markAllRead(actor);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.markRead(id, actor);
  }
}
