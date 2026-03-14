import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { BagStatus, TransferStatus, UserRole } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { TransfersRepository } from './repository/transfers.repository';
import type { CreateTransferDto } from './dto/create-transfer.dto';
import type { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

/** Valid FSM transitions for transfers */
const TRANSFER_FSM: Record<TransferStatus, TransferStatus[]> = {
  INITIATED:  [TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED],
  IN_TRANSIT: [TransferStatus.RECEIVED],
  RECEIVED:   [],
  CANCELLED:  [],
};

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly repo: TransfersRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  findAll(actor: JwtPayload) {
    const where = this.buildWhere(actor);
    return this.repo.findAll(where);
  }

  async findOne(id: string, actor: JwtPayload) {
    const transfer = await this.repo.findById(id);
    if (!transfer) throw new NotFoundException(`Transfer ${id} not found`);
    this.assertAccess(actor, transfer);
    return transfer;
  }

  // ── Create (transactional) ─────────────────────────────────────────────────

  async create(dto: CreateTransferDto, actor: JwtPayload) {
    if (actor.role === UserRole.HOSPITAL) {
      throw new ForbiddenException('Hospitals cannot initiate blood bag transfers');
    }

    const fromBankId = actor.role === UserRole.BLOOD_BANK
      ? actor.facilityId!
      : (dto as any).fromBankId;          // ADMIN may specify source bank

    if (!fromBankId) {
      throw new BadRequestException('fromBankId is required for ADMIN');
    }

    if (fromBankId === dto.toBankId) {
      throw new BadRequestException('Source and destination blood banks must differ');
    }

    return this.prisma.transaction(async (tx) => {
      // 1. Verify all bags are AVAILABLE and belong to fromBank
      const bags = await tx.bloodBag.findMany({
        where: { id: { in: dto.bloodBagIds } },
        select: { id: true, status: true, bloodBankId: true },
      });

      if (bags.length !== dto.bloodBagIds.length) {
        const found = bags.map((b) => b.id);
        const missing = dto.bloodBagIds.filter((id) => !found.includes(id));
        throw new NotFoundException(`Blood bags not found: ${missing.join(', ')}`);
      }

      const notAvailable = bags.filter((b) => b.status !== BagStatus.AVAILABLE);
      if (notAvailable.length > 0) {
        throw new ConflictException(
          `Bags not in AVAILABLE status: ${notAvailable.map((b) => b.id).join(', ')}`,
        );
      }

      const wrongBank = bags.filter((b) => b.bloodBankId !== fromBankId);
      if (wrongBank.length > 0) {
        throw new ForbiddenException(
          `Bags do not belong to the source bank: ${wrongBank.map((b) => b.id).join(', ')}`,
        );
      }

      // 2. Mark bags as RESERVED
      await tx.bloodBag.updateMany({
        where: { id: { in: dto.bloodBagIds } },
        data:  { status: BagStatus.RESERVED },
      });

      // 3. Generate unique transfer code
      const code = `TRF-${new Date().getFullYear()}-${nanoid(5).toUpperCase()}`;

      // 4. Create the transfer with bag links
      const transfer = await tx.transfer.create({
        data: {
          code,
          fromBank:    { connect: { id: fromBankId } },
          toBank:      { connect: { id: dto.toBankId } },
          initiator:   { connect: { id: actor.sub } },
          reason:      dto.reason,
          transferBags: { create: dto.bloodBagIds.map((bloodBagId) => ({ bloodBagId })) },
        },
        include: { transferBags: true },
      });

      // 5. Record stock movements (TRANSFERRED type, AVAILABLE → RESERVED)
      await tx.stockMovement.createMany({
        data: dto.bloodBagIds.map((bloodBagId) => ({
          bloodBagId,
          movementType:  'TRANSFERRED' as const,
          fromStatus:    BagStatus.AVAILABLE,
          toStatus:      BagStatus.RESERVED,
          performedBy:   actor.sub,
          transferId:    transfer.id,
          notes:         dto.reason,
        })),
      });

      this.logger.log(`Transfer ${code} created with ${dto.bloodBagIds.length} bag(s)`);
      return transfer;
    });
  }

  // ── Update status (FSM-guarded) ────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateTransferStatusDto, actor: JwtPayload) {
    const transfer = await this.repo.findById(id);
    if (!transfer) throw new NotFoundException(`Transfer ${id} not found`);
    this.assertAccess(actor, transfer);

    const allowed = TRANSFER_FSM[transfer.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${transfer.status} to ${dto.status}. ` +
        `Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    // Role enforcement per transition
    if (dto.status === TransferStatus.IN_TRANSIT) {
      // Only the initiating bank (or ADMIN) can mark as IN_TRANSIT
      if (actor.role === UserRole.BLOOD_BANK && actor.facilityId !== transfer.fromBankId) {
        throw new ForbiddenException('Only the initiating bank can mark transfer as IN_TRANSIT');
      }
      if (actor.role === UserRole.HOSPITAL) {
        throw new ForbiddenException('Hospitals cannot update transfer status');
      }
    }

    if (dto.status === TransferStatus.RECEIVED) {
      // Only the recipient bank (or ADMIN) can mark as RECEIVED
      if (actor.role === UserRole.BLOOD_BANK && actor.facilityId !== transfer.toBankId) {
        throw new ForbiddenException('Only the recipient bank can mark transfer as RECEIVED');
      }
      if (actor.role === UserRole.HOSPITAL) {
        throw new ForbiddenException('Hospitals cannot update transfer status');
      }
    }

    return this.prisma.transaction(async (tx) => {
      const now = new Date();
      const data: Record<string, unknown> = { status: dto.status };

      if (dto.status === TransferStatus.IN_TRANSIT) {
        data['inTransitAt'] = now;
      }

      if (dto.status === TransferStatus.RECEIVED) {
        data['receivedAt'] = now;
        data['receiver']   = { connect: { id: actor.sub } };

        const bagIds = transfer.transferBags.map((tb) => tb.bloodBagId);

        // Update bags: AVAILABLE status at new blood bank
        await tx.bloodBag.updateMany({
          where: { id: { in: bagIds } },
          data:  { status: BagStatus.AVAILABLE, bloodBankId: transfer.toBankId },
        });

        // Record RECEIVED stock movements
        await tx.stockMovement.createMany({
          data: bagIds.map((bloodBagId) => ({
            bloodBagId,
            movementType:  'RECEIVED' as const,
            fromStatus:    BagStatus.RESERVED,
            toStatus:      BagStatus.AVAILABLE,
            performedBy:   actor.sub,
            transferId:    id,
          })),
        });
      }

      const updated = await tx.transfer.update({
        where: { id },
        data:  data as any,
        include: {
          fromBank:  { select: { id: true, name: true } },
          toBank:    { select: { id: true, name: true } },
          initiator: { select: { id: true, firstName: true, lastName: true } },
          receiver:  { select: { id: true, firstName: true, lastName: true } },
          transferBags: { include: { bloodBag: { include: { bloodType: { select: { label: true } } } } } },
        },
      });

      this.logger.log(`Transfer ${transfer.code} → ${dto.status}`);
      return updated;
    });
  }

  // ── Cancel (only INITIATED, only by initiator bank) ────────────────────────

  async cancel(id: string, actor: JwtPayload) {
    const transfer = await this.repo.findById(id);
    if (!transfer) throw new NotFoundException(`Transfer ${id} not found`);

    if (transfer.status !== TransferStatus.INITIATED) {
      throw new BadRequestException(
        `Only INITIATED transfers can be cancelled. Current status: ${transfer.status}`,
      );
    }

    if (actor.role === UserRole.BLOOD_BANK && actor.facilityId !== transfer.fromBankId) {
      throw new ForbiddenException('Only the initiating bank can cancel a transfer');
    }
    if (actor.role === UserRole.HOSPITAL) {
      throw new ForbiddenException('Hospitals cannot cancel transfers');
    }

    return this.prisma.transaction(async (tx) => {
      const bagIds = transfer.transferBags.map((tb) => tb.bloodBagId);

      // Return bags to AVAILABLE
      await tx.bloodBag.updateMany({
        where: { id: { in: bagIds } },
        data:  { status: BagStatus.AVAILABLE },
      });

      await tx.stockMovement.createMany({
        data: bagIds.map((bloodBagId) => ({
          bloodBagId,
          movementType:  'RELEASED' as const,
          fromStatus:    BagStatus.RESERVED,
          toStatus:      BagStatus.AVAILABLE,
          performedBy:   actor.sub,
          transferId:    id,
          notes:         'Transfer cancelled',
        })),
      });

      return tx.transfer.update({
        where: { id },
        data:  { status: TransferStatus.CANCELLED },
        include: {
          fromBank:     { select: { id: true, name: true } },
          toBank:       { select: { id: true, name: true } },
          transferBags: { include: { bloodBag: { include: { bloodType: { select: { label: true } } } } } },
        },
      });
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildWhere(actor: JwtPayload) {
    if (actor.role === UserRole.ADMIN) return {};
    if (actor.role === UserRole.BLOOD_BANK) {
      return {
        OR: [
          { fromBankId: actor.facilityId! },
          { toBankId:   actor.facilityId! },
        ],
      };
    }
    // HOSPITAL has no transfers but we scope to empty result rather than 403
    return { id: 'none' };
  }

  private assertAccess(
    actor: JwtPayload,
    transfer: { fromBankId: string; toBankId: string },
  ) {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.HOSPITAL) {
      throw new ForbiddenException('Hospitals do not have access to transfers');
    }
    if (
      actor.facilityId !== transfer.fromBankId &&
      actor.facilityId !== transfer.toBankId
    ) {
      throw new ForbiddenException('Access denied to this transfer');
    }
  }
}
