import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(@Query() { page = 1, limit = 10 }: PaginationQueryDto, @CurrentUser() actor: JwtPayload) {
    return this.prescriptionsService.findAll(actor, page, limit);
  }

  @Get('unfulfilled')
  findUnfulfilled(@Query() { page = 1, limit = 10 }: PaginationQueryDto, @CurrentUser() actor: JwtPayload) {
    return this.prescriptionsService.findUnfulfilled(actor, page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.prescriptionsService.findOne(id, actor);
  }

  @Post()
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  create(
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.prescriptionsService.create(dto, actor);
  }

  @Patch(':id/fulfill')
  markFulfilled(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.prescriptionsService.markFulfilled(id, actor);
  }
}
