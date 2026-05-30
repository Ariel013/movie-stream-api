import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRole, BagStatus } from '@prisma/client';
import { BloodBagsRepository } from './repository/blood-bags.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBloodBagDto } from './dto/create-blood-bag.dto';
import type { FilterBloodBagsDto } from './dto/filter-blood-bags.dto';
import type { DiscardBloodBagDto } from './dto/discard-blood-bag.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BloodBagsService {
  private readonly logger = new Logger(BloodBagsService.name);

  constructor(
    private readonly repo: BloodBagsRepository,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Reference data ─────────────────────────────────────────────────────────

  listBloodTypes() {
    return this.prisma.bloodType.findMany({
      select: { id: true, label: true, aboGroup: true, rhFactor: true },
      orderBy: [{ aboGroup: 'asc' }, { rhFactor: 'desc' }],
    });
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  findAll(dto: FilterBloodBagsDto, actor: JwtPayload) {
    const where = this.buildWhere(dto, actor);
    return this.repo.findAll(where, dto.page ?? 1, dto.limit ?? 20);
  }

  async findOne(id: string, actor: JwtPayload) {
    const bag = await this.repo.findById(id);
    if (!bag) throw new NotFoundException(`Blood bag ${id} not found`);
    this.assertBankAccess(actor, bag.bloodBankId);
    return bag;
  }

  stockSummary(bloodBankId: string, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK && actor.facilityId !== bloodBankId) {
      throw new ForbiddenException('Access denied to another blood bank');
    }
    return this.repo.stockSummary(bloodBankId);
  }

  expiringSoon(actor: JwtPayload) {
    const bankId = actor.role === UserRole.BLOOD_BANK ? actor.facilityId ?? undefined : undefined;
    return this.repo.expiringSoon(bankId);
  }

  // ── Commands ───────────────────────────────────────────────────────────────

  async create(dto: CreateBloodBagDto, actor: JwtPayload) {
    if (actor.role === UserRole.HOSPITAL) {
      throw new ForbiddenException('Hospitals cannot register blood bags');
    }

    const bloodBankId = actor.role === UserRole.BLOOD_BANK
      ? actor.facilityId!
      : dto.bloodBankId;                    // ADMIN must supply bloodBankId in DTO

    if (!bloodBankId) {
      throw new BadRequestException('bloodBankId is required for ADMIN');
    }

    if (new Date(dto.expiresAt) <= new Date(dto.collectedAt)) {
      throw new BadRequestException('expiresAt must be after collectedAt');
    }

    // aboGroup / rhFactor live on the BloodType model, not BloodBag — connect via bloodTypeId
    const bag = await this.repo.create({
      code:       dto.code,
      volumeMl:   dto.volumeMl,
      collectedAt: new Date(dto.collectedAt),
      expiresAt:  new Date(dto.expiresAt),
      bloodType:  { connect: { id: dto.bloodTypeId } },
      bloodBank:  { connect: { id: bloodBankId } },
      ...(dto.donorId    && { donor:    { connect: { id: dto.donorId } } }),
      ...(dto.screeningId && { screening: { connect: { id: dto.screeningId } } }),
    });

    // Record initial RECEIVED movement
    await this.prisma.stockMovement.create({
      data: {
        bloodBagId:   bag.id,
        movementType: 'RECEIVED',
        fromStatus:   'AVAILABLE',   // entering system as AVAILABLE
        toStatus:     'AVAILABLE',
        performedBy:  actor.sub,
      },
    });

    return bag;
  }

  async discard(id: string, dto: DiscardBloodBagDto, actor: JwtPayload) {
    const bag = await this.repo.findById(id);
    if (!bag) throw new NotFoundException(`Blood bag ${id} not found`);
    this.assertBankAccess(actor, bag.bloodBankId);

    if (bag.status === BagStatus.DISTRIBUTED || bag.status === BagStatus.DISCARDED) {
      throw new BadRequestException(`Cannot discard a bag with status ${bag.status}`);
    }

    return this.prisma.transaction(async (tx) => {
      const updated = await tx.bloodBag.update({
        where: { id },
        data:  { status: BagStatus.DISCARDED, discardedReason: dto.reason },
      });
      await tx.stockMovement.create({
        data: {
          bloodBagId:   id,
          movementType: 'DISCARDED',
          fromStatus:   bag.status,
          toStatus:     BagStatus.DISCARDED,
          performedBy:  actor.sub,
          notes:        dto.reason,
        },
      });
      return updated;
    });
  }

  // ── Scheduled jobs ─────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async markExpiredBags() {
    const expired = await this.prisma.$queryRaw<Array<{ id: string; blood_bank_id: string }>>`
      UPDATE blood_bags
      SET    status = 'EXPIRED'
      WHERE  status = 'AVAILABLE'
        AND  expires_at < NOW()
      RETURNING id, blood_bank_id
    `;

    if (expired.length > 0) {
      this.logger.warn(`Marked ${expired.length} bags as EXPIRED`);
      this.events.emit('bags.expired', expired);
    }
  }

  @Cron('0 8 * * *')   // daily at 08:00
  async alertNearExpiry() {
    const bags = await this.repo.expiringSoon();
    if (bags.length > 0) {
      this.events.emit('bags.expiring-soon', bags);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildWhere(dto: FilterBloodBagsDto, actor: JwtPayload) {
    const where: Record<string, unknown> = {};
    if (dto.aboGroup)    where['aboGroup']    = dto.aboGroup;
    if (dto.rhFactor)    where['rhFactor']    = dto.rhFactor;
    if (dto.status)      where['status']      = dto.status;

    if (actor.role === UserRole.BLOOD_BANK) {
      where['bloodBankId'] = actor.facilityId;
    } else if (dto.bloodBankId) {
      where['bloodBankId'] = dto.bloodBankId;
    }
    return where;
  }

  private assertBankAccess(actor: JwtPayload, bloodBankId: string) {
    if (actor.role === UserRole.BLOOD_BANK && actor.facilityId !== bloodBankId) {
      throw new ForbiddenException('Access to bag of another blood bank denied');
    }
  }
}
