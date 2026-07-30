import {
  Controller, Get, Post, Patch, Body, Param,
  Query, ParseUUIDPipe, UseGuards, ParseFloatPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BloodBanksService } from './blood-banks.service';
import { CreateBloodBankDto } from './dto/create-blood-bank.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuditEntity } from '../../common/decorators/audit.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('blood-banks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'blood-banks', version: '1' })
export class BloodBanksController {
  constructor(private readonly service: BloodBanksService) {}

  @Get()
  @ApiOperation({ summary: 'List blood banks, optionally filtered by region' })
  @ApiQuery({ name: 'regionId', required: false, type: String })
  findAll(
    @Query('regionId') regionId: string | undefined,
    @Query() { page = 1, limit = 10 }: PaginationQueryDto,
  ) {
    return this.service.findAll(regionId, page, limit);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find blood banks within a radius using PostGIS' })
  @ApiQuery({ name: 'lat',      required: true, type: Number })
  @ApiQuery({ name: 'lng',      required: true, type: Number })
  @ApiQuery({ name: 'radiusKm', required: true, type: Number })
  nearby(
    @Query('lat',      ParseFloatPipe) lat:      number,
    @Query('lng',      ParseFloatPipe) lng:      number,
    @Query('radiusKm', ParseFloatPipe) radiusKm: number,
  ) {
    return this.service.nearby(lat, lng, radiusKm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blood bank details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/stock')
  @ApiOperation({
    summary: 'Stock summary for a blood bank. BLOOD_BANK sees own only; ADMIN sees all.',
  })
  stockSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.stockSummary(id, actor);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @AuditEntity('blood-banks')
  @ApiOperation({ summary: 'Create a blood bank (ADMIN only)' })
  create(@Body() dto: CreateBloodBankDto, @CurrentUser() actor: JwtPayload) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @AuditEntity('blood-banks')
  @ApiOperation({ summary: 'Update a blood bank (ADMIN only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateBloodBankDto>,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.update(id, dto, actor);
  }
}
