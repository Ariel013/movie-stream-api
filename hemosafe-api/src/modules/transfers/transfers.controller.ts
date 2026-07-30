import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuditEntity } from '../../common/decorators/audit.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'transfers', version: '1' })
export class TransfersController {
  constructor(private readonly service: TransfersService) {}

  @Get()
  @ApiOperation({ summary: 'List transfers visible to the authenticated user' })
  findAll(@Query() { page = 1, limit = 10 }: PaginationQueryDto, @CurrentUser() actor: JwtPayload) {
    return this.service.findAll(actor, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer details' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.findOne(id, actor);
  }

  @Post()
  @Roles(UserRole.BLOOD_BANK, UserRole.ADMIN)
  @AuditEntity('transfers')
  @ApiOperation({ summary: 'Initiate a blood bag transfer (BLOOD_BANK / ADMIN)' })
  create(@Body() dto: CreateTransferDto, @CurrentUser() actor: JwtPayload) {
    return this.service.create(dto, actor);
  }

  @Patch(':id/status')
  @AuditEntity('transfers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Advance transfer status (FSM). ' +
      'INITIATED→IN_TRANSIT (initiator bank). IN_TRANSIT→RECEIVED (recipient bank).',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransferStatusDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.updateStatus(id, dto, actor);
  }

  @Delete(':id/cancel')
  @AuditEntity('transfers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an INITIATED transfer (initiating bank only)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.cancel(id, actor);
  }
}
