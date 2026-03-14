import {
  Controller, Get, Post, Patch, Body, Param,
  Query, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BloodBagsService } from './blood-bags.service';
import { CreateBloodBagDto } from './dto/create-blood-bag.dto';
import { FilterBloodBagsDto } from './dto/filter-blood-bags.dto';
import { DiscardBloodBagDto } from './dto/discard-blood-bag.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuditEntity } from '../../common/decorators/audit.decorator';

@ApiTags('blood-bags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'blood-bags', version: '1' })
export class BloodBagsController {
  constructor(private readonly service: BloodBagsService) {}

  @Get()
  @ApiOperation({ summary: 'List blood bags with filters (FEFO order)' })
  findAll(@Query() dto: FilterBloodBagsDto, @CurrentUser() actor: JwtPayload) {
    return this.service.findAll(dto, actor);
  }

  @Get('expiring-soon')
  @ApiOperation({ summary: 'Bags expiring within 48h (triggers FEFO alerts)' })
  expiringSoon(@CurrentUser() actor: JwtPayload) {
    return this.service.expiringSoon(actor);
  }

  @Get('stock-summary/:bloodBankId')
  @ApiOperation({ summary: 'Available bag count per blood type for a bank' })
  stockSummary(
    @Param('bloodBankId', ParseUUIDPipe) bloodBankId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.stockSummary(bloodBankId, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single blood bag with movement history' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.findOne(id, actor);
  }

  @Post()
  @Roles(UserRole.BLOOD_BANK, UserRole.ADMIN)
  @AuditEntity('blood_bags')
  @ApiOperation({ summary: 'Register a new blood bag (BLOOD_BANK / ADMIN)' })
  create(@Body() dto: CreateBloodBagDto, @CurrentUser() actor: JwtPayload) {
    return this.service.create(dto, actor);
  }

  @Patch(':id/discard')
  @Roles(UserRole.BLOOD_BANK, UserRole.ADMIN)
  @AuditEntity('blood_bags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a bag as discarded with reason' })
  discard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DiscardBloodBagDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.discard(id, dto, actor);
  }
}
