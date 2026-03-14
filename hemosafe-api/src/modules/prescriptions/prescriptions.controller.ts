import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.prescriptionsService.findAll(actor);
  }

  @Get('unfulfilled')
  findUnfulfilled(@CurrentUser() actor: JwtPayload) {
    return this.prescriptionsService.findUnfulfilled(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
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
  markFulfilled(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.prescriptionsService.markFulfilled(id, actor);
  }
}
