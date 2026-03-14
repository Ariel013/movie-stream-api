import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchSyncDto, SyncOperationDto } from './dto/batch-sync.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';

export interface OperationResult {
  operationId: string;
  status: 'applied' | 'duplicate' | 'conflict' | 'error';
  errorCode?: number;
  errorMessage?: string;
  data?: unknown;
}

export interface PullResponse {
  stock: unknown[];
  reservations: unknown[];
  patients: unknown[];
  notifications: unknown[];
  serverTime: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly IDEM_PREFIX = 'idem:';
  private readonly IDEM_TTL    = 86_400;

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Processes a batch of offline-queued operations.
   * Each operation is idempotent (checked by operationId in Redis).
   * Returns per-operation results so the client can selectively delete
   * from its local sync queue.
   */
  async processBatch(dto: BatchSyncDto, actorId: string): Promise<OperationResult[]> {
    const results: OperationResult[] = [];

    for (const op of dto.operations) {
      const result = await this.processOne(op, actorId);
      results.push(result);
    }

    return results;
  }

  private async processOne(op: SyncOperationDto, actorId: string): Promise<OperationResult> {
    const redisKey = `${this.IDEM_PREFIX}${op.operationId}`;

    // Idempotency check
    const cached = await this.redis.get(redisKey);
    if (cached) {
      return { operationId: op.operationId, status: 'duplicate', data: JSON.parse(cached) };
    }

    try {
      const data = await this.dispatch(op, actorId);

      // Cache the result for 24h
      await this.redis.set(redisKey, JSON.stringify(data), 'EX', this.IDEM_TTL);

      return { operationId: op.operationId, status: 'applied', data };
    } catch (err: unknown) {
      const code = (err as { status?: number })?.status ?? 500;
      const msg  = (err as Error)?.message ?? 'Unknown error';

      // 409 Conflict — client needs to pull the latest state
      if (code === 409) {
        return { operationId: op.operationId, status: 'conflict', errorCode: 409, errorMessage: msg };
      }

      this.logger.error(`[SyncBatch] Operation ${op.operationId} failed: ${msg}`);
      return { operationId: op.operationId, status: 'error', errorCode: code, errorMessage: msg };
    }
  }

  /**
   * Routes the operation to the correct Prisma action based on
   * the endpoint + method. Handles the three offline-capable entities:
   * reservations, blood_bags, patients.
   */
  private async dispatch(op: SyncOperationDto, actorId: string): Promise<unknown> {
    const path = op.endpoint.replace(/^\/api\/v\d+/, ''); // normalize

    // ── Reservation ──────────────────────────────────────────────────────────
    if (path.startsWith('/reservations')) {
      if (op.method === 'POST') {
        const p = op.payload as {
          bloodBankId: string; hospitalId: string; bloodTypeId: string;
          quantity: number; urgency: string; clientId?: string;
        };
        return this.prisma.reservation.create({
          data: {
            code:        `RES-${Date.now()}`,
            bloodBank:   { connect: { id: p.bloodBankId } },
            hospital:    { connect: { id: p.hospitalId } },
            bloodType:   { connect: { id: p.bloodTypeId } },
            requester:   { connect: { id: actorId } },
            quantity:    p.quantity,
            urgency:     p.urgency as 'ROUTINE' | 'EMERGENCY',
            status:      'PENDING',
          },
        });
      }
    }

    // ── Blood Bag ─────────────────────────────────────────────────────────────
    if (path.startsWith('/blood-bags')) {
      const idMatch = path.match(/\/blood-bags\/([a-f0-9-]+)/);
      if (op.method === 'POST') {
        const p = op.payload as {
          aboGroup: string; rhFactor: string; volumeMl: number;
          expiresAt: string; bloodBankId: string; bloodTypeId: string;
        };
        return this.prisma.bloodBag.create({
          data: {
            code:        `BAG-${Date.now()}`,
            bloodBank:   { connect: { id: p.bloodBankId } },
            bloodType:   { connect: { id: p.bloodTypeId } },
            volumeMl:    p.volumeMl,
            expiresAt:   new Date(p.expiresAt),
            collectedAt: new Date(),
          },
        });
      }
      if ((op.method === 'PATCH' || op.method === 'PUT') && idMatch) {
        const p = op.payload as { status?: string; volumeMl?: number };
        return this.prisma.bloodBag.update({
          where: { id: idMatch[1] },
          data:  p as Record<string, unknown>,
        });
      }
    }

    // ── Patient ───────────────────────────────────────────────────────────────
    if (path.startsWith('/patients')) {
      const idMatch = path.match(/\/patients\/([a-f0-9-]+)/);
      if (op.method === 'POST') {
        const p = op.payload as {
          firstName: string; lastName: string; bloodTypeId?: string;
          nationalId?: string; medicalRecordNo?: string; hospitalId: string;
        };
        return this.prisma.patient.create({
          data: {
            firstName:      p.firstName,
            lastName:       p.lastName,
            hospital:       { connect: { id: p.hospitalId } },
            ...(p.bloodTypeId    && { bloodType:      { connect: { id: p.bloodTypeId } } }),
            ...(p.nationalId     && { nationalId:     p.nationalId }),
            ...(p.medicalRecordNo && { medicalRecordNo: p.medicalRecordNo }),
          },
        });
      }
      if ((op.method === 'PATCH' || op.method === 'PUT') && idMatch) {
        const p = op.payload as { status?: string; diagnosis?: string; physician?: string };
        return this.prisma.patient.update({
          where: { id: idMatch[1] },
          data:  p as Record<string, unknown>,
        });
      }
    }

    throw new Error(`Unsupported sync operation: ${op.method} ${path}`);
  }

  // ─── Pull sync ─────────────────────────────────────────────────────────────

  /**
   * Returns all records changed since the given timestamp for the requested
   * scopes. The client merges these into its IndexedDB using server-wins.
   */
  async pull(
    since: Date | null,
    scopes: string[],
    facilityId: string,
  ): Promise<PullResponse> {
    const where = since ? { updatedAt: { gt: since } } : {};

    const [stock, reservations, patients, notifications] = await Promise.all([
      scopes.includes('stock')
        ? this.prisma.bloodBag.findMany({ where: { bloodBankId: facilityId, ...where }, take: 500 })
        : [],

      scopes.includes('reservations')
        ? this.prisma.reservation.findMany({
            where: { OR: [{ hospitalId: facilityId }, { bloodBankId: facilityId }], ...where },
            take: 200,
          })
        : [],

      scopes.includes('patients')
        ? this.prisma.patient.findMany({ where: { hospitalId: facilityId, ...where }, take: 500 })
        : [],

      scopes.includes('notifications')
        ? this.prisma.notification.findMany({
            where: { userId: facilityId, ...(since ? { createdAt: { gt: since } } : {}) },
            take: 100,
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    return {
      stock,
      reservations,
      patients,
      notifications,
      serverTime: new Date().toISOString(),
    };
  }
}
