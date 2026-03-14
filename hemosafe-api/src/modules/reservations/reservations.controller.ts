import {
  Controller, Get, Post, Patch, Body, Param,
  Query, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { SearchBloodDto } from './dto/search-blood.dto';
import { VerifyBagDto } from './dto/verify-bag.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuditEntity } from '../../common/decorators/audit.decorator';

@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'reservations', version: '1' })
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  // ── Search ─────────────────────────────────────────────────────────────────

  @Post('search')
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find nearby blood banks with available stock (PostGIS search)',
    description:
      'Returns blood banks sorted by distance (nearest first) that have ' +
      'at least `quantity` bags of the requested blood type. ' +
      'Use the result to choose a blood bank before creating a reservation.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of blood banks with distance and available count',
  })
  search(@Body() dto: SearchBloodDto) {
    return this.service.searchNearbyBlood(dto);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List reservations (scoped by role)' })
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.service.findAll(actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full reservation details with allocated bags' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.findOne(id, actor);
  }

  @Post()
  @Roles(UserRole.HOSPITAL, UserRole.ADMIN)
  @AuditEntity('reservations')
  @ApiOperation({
    summary: 'Create reservation — atomically allocates bags with FEFO + FOR UPDATE',
    description:
      'Runs inside a REPEATABLE READ transaction with:\n' +
      '1. Advisory lock on (bankId, bloodTypeId) — prevents deadlocks\n' +
      '2. SELECT FOR UPDATE SKIP LOCKED — row-level bag locking\n' +
      '3. FEFO ordering (soonest expiry allocated first)\n' +
      '4. EMERGENCY requests allow partial fill\n' +
      'Reservation expires after 24 hours if not collected.',
  })
  @ApiResponse({ status: 201, description: 'Reservation created with bags allocated' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  create(@Body() dto: CreateReservationDto, @CurrentUser() actor: JwtPayload) {
    return this.service.create(dto, actor);
  }

  // ── Status transitions ─────────────────────────────────────────────────────

  @Patch(':id/status')
  @AuditEntity('reservations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transition reservation status (FSM-guarded)',
    description:
      'Valid transitions:\n' +
      '• PENDING    → CONFIRMED  (BLOOD_BANK)\n' +
      '• CONFIRMED  → DISPATCHED (BLOOD_BANK)\n' +
      '• DISPATCHED → DELIVERED  (HOSPITAL) — marks bags DISTRIBUTED\n' +
      '• PENDING/CONFIRMED → CANCELLED (any) — releases bags to AVAILABLE\n' +
      'Invalid transitions return 400.',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReservationStatusDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.updateStatus(id, dto, actor);
  }

  // ── Bag verification ───────────────────────────────────────────────────────

  @Post(':id/verify-bag')
  @Roles(UserRole.BLOOD_BANK, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a bag barcode belongs to this reservation (pickup check)',
    description:
      'Blood bank staff scans each bag barcode before handing over to the patient. ' +
      'Returns { valid, bagId, message }.',
  })
  verifyBag(
    @Param('id', ParseUUIDPipe) reservationId: string,
    @Body() dto: VerifyBagDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.verifyBag(reservationId, dto, actor);
  }
}
