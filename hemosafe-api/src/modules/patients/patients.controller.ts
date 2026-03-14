import {
  Body,
  Controller,
  Delete,
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
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.patientsService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.patientsService.findOne(id, actor);
  }

  @Post()
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  create(@Body() dto: CreatePatientDto, @CurrentUser() actor: JwtPayload) {
    return this.patientsService.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePatientDto>,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.patientsService.update(id, dto, actor);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.patientsService.deactivate(id, actor);
  }
}
