import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get('entities')
  @ApiOperation({ summary: 'Distinct entity names seen in the audit log (ADMIN only) — for filter UIs' })
  distinctEntities() {
    return this.service.distinctEntities();
  }

  @Get()
  @ApiOperation({ summary: 'List audit logs (ADMIN only)' })
  findAll(@Query() { page = 1, limit = 10, entity, search }: FilterAuditLogsDto) {
    return this.service.findAll(page, limit, entity, search);
  }
}
