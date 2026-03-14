import {
  Controller, Get, Param, Query,
  ParseUUIDPipe, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'statistics', version: '1' })
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Get('national')
  @Roles(UserRole.ADMIN, UserRole.HOSPITAL)
  @ApiOperation({ summary: 'National blood-bank system summary (ADMIN, HOSPITAL)' })
  nationalSummary() {
    return this.service.nationalSummary();
  }

  @Get('regional/:regionId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Regional summary scoped to one region (ADMIN)' })
  regionalSummary(@Param('regionId', ParseUUIDPipe) regionId: string) {
    return this.service.regionalSummary(regionId);
  }

  @Get('facility/:facilityId/stock')
  @ApiOperation({
    summary: 'Stock summary for a specific blood bank. BLOOD_BANK sees own only. ADMIN sees all.',
  })
  facilityStock(
    @Param('facilityId', ParseUUIDPipe) facilityId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.facilityStock(facilityId, actor);
  }

  @Get('donors')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Top donors and donation trends (ADMIN)' })
  donorStats() {
    return this.service.donorStats();
  }

  @Get('reservation-trends')
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Lookback window in days (default 30)' })
  @ApiOperation({ summary: 'Reservations per day grouped by status' })
  reservationTrends(@Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.service.reservationTrends(d);
  }
}
