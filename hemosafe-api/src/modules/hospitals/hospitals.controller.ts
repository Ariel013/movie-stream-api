import {
  Controller, Get, Post, Patch, Body, Param,
  Query, ParseUUIDPipe, UseGuards, ParseFloatPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuditEntity } from '../../common/decorators/audit.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('hospitals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'hospitals', version: '1' })
export class HospitalsController {
  constructor(private readonly service: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'List hospitals, optionally filtered by region' })
  @ApiQuery({ name: 'regionId', required: false, type: String })
  findAll(
    @Query('regionId') regionId: string | undefined,
    @Query() { page = 1, limit = 10 }: PaginationQueryDto,
  ) {
    return this.service.findAll(regionId, page, limit);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find hospitals within a radius using PostGIS' })
  @ApiQuery({ name: 'lat',      required: true,  type: Number })
  @ApiQuery({ name: 'lng',      required: true,  type: Number })
  @ApiQuery({ name: 'radiusKm', required: true,  type: Number })
  nearby(
    @Query('lat',      ParseFloatPipe) lat:      number,
    @Query('lng',      ParseFloatPipe) lng:      number,
    @Query('radiusKm', ParseFloatPipe) radiusKm: number,
  ) {
    return this.service.nearby(lat, lng, radiusKm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @AuditEntity('hospitals')
  @ApiOperation({ summary: 'Create a hospital (ADMIN only)' })
  create(@Body() dto: CreateHospitalDto, @CurrentUser() actor: JwtPayload) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @AuditEntity('hospitals')
  @ApiOperation({ summary: 'Update a hospital (ADMIN only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateHospitalDto>,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.update(id, dto, actor);
  }
}
