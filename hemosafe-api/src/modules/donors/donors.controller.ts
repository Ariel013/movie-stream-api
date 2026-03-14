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
import { CreateDonorDto } from './dto/create-donor.dto';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { DonorsService } from './donors.service';

@ApiTags('donors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.donorsService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.donorsService.findOne(id, actor);
  }

  @Post()
  @Roles(UserRole.BLOOD_BANK, UserRole.ADMIN)
  create(@Body() dto: CreateDonorDto, @CurrentUser() actor: JwtPayload) {
    return this.donorsService.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDonorDto>,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.donorsService.update(id, dto, actor);
  }

  @Post('screenings')
  @Roles(UserRole.BLOOD_BANK, UserRole.ADMIN)
  createScreening(
    @Body() dto: CreateScreeningDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.donorsService.createScreening(dto, actor);
  }
}
