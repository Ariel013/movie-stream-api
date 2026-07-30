import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchSyncDto, SyncOperationDto } from './dto/batch-sync.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { ReservationsService } from '../reservations/reservations.service';
import { BloodBagsService } from '../blood-bags/blood-bags.service';
import { PatientsService } from '../patients/patients.service';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

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
    private readonly reservationsService: ReservationsService,
    private readonly bloodBagsService: BloodBagsService,
    private readonly patientsService: PatientsService,
  ) {}

  /**
   * Processes a batch of offline-queued operations.
   * Each operation is idempotent (checked by operationId in Redis).
   * Returns per-operation results so the client can selectively delete
   * from its local sync queue.
   */
  async processBatch(dto: BatchSyncDto, actor: JwtPayload): Promise<OperationResult[]> {
    const results: OperationResult[] = [];

    for (const op of dto.operations) {
      const result = await this.processOne(op, actor);
      results.push(result);
    }

    return results;
  }

  private async processOne(op: SyncOperationDto, actor: JwtPayload): Promise<OperationResult> {
    const redisKey = `${this.IDEM_PREFIX}${op.operationId}`;

    // Idempotency check
    const cached = await this.redis.get(redisKey);
    if (cached) {
      return { operationId: op.operationId, status: 'duplicate', data: JSON.parse(cached) };
    }

    try {
      const data = await this.dispatch(op, actor);

      // Cache the result for 24h
      await this.redis.set(redisKey, JSON.stringify(data), 'EX', this.IDEM_TTL);

      return { operationId: op.operationId, status: 'applied', data };
    } catch (err: unknown) {
      const code = err instanceof HttpException
        ? err.getStatus()
        : (err as { status?: number })?.status ?? 500;
      const msg = (err as Error)?.message ?? 'Unknown error';

      // 409 Conflict — client needs to pull the latest state
      if (code === 409) {
        return { operationId: op.operationId, status: 'conflict', errorCode: 409, errorMessage: msg };
      }

      this.logger.error(`[SyncBatch] Operation ${op.operationId} failed: ${msg}`);
      return { operationId: op.operationId, status: 'error', errorCode: code, errorMessage: msg };
    }
  }

  /**
   * Routes the operation to the correct service based on the endpoint + method,
   * exactly like the equivalent online HTTP endpoint would. This is deliberate:
   * offline-queued mutations must go through the same RBAC, facility-scoping,
   * and business validation (stock locking, FEFO allocation, etc.) as the live
   * API — no shortcuts, since these write the same medical/stock data.
   */
  private async dispatch(op: SyncOperationDto, actor: JwtPayload): Promise<unknown> {
    const path = op.endpoint.replace(/^\/api\/v\d+/, ''); // normalize

    // ── Reservation ──────────────────────────────────────────────────────────
    if (path.startsWith('/reservations')) {
      if (op.method === 'POST') {
        const p = op.payload as {
          bloodBankId: string; bloodTypeId: string;
          aboGroup: 'A' | 'B' | 'AB' | 'O'; rhFactor: 'POSITIVE' | 'NEGATIVE';
          quantity: number; urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
          prescriptionId?: string; notes?: string;
          hospitalId?: string; // only honoured for ADMIN — same rule as the online endpoint
        };
        return this.reservationsService.create(
          {
            bloodBankId:    p.bloodBankId,
            bloodTypeId:    p.bloodTypeId,
            aboGroup:       p.aboGroup,
            rhFactor:       p.rhFactor,
            quantity:       p.quantity,
            urgency:        p.urgency,
            prescriptionId: p.prescriptionId,
            notes:          p.notes,
            ...(p.hospitalId && { hospitalId: p.hospitalId }),
          } as any,
          actor,
        );
      }
    }

    // ── Blood Bag ─────────────────────────────────────────────────────────────
    if (path.startsWith('/blood-bags')) {
      const idMatch = path.match(/\/blood-bags\/([a-f0-9-]+)/);
      if (op.method === 'POST') {
        const p = op.payload as {
          code?: string;
          aboGroup: 'A' | 'B' | 'AB' | 'O'; rhFactor: 'POSITIVE' | 'NEGATIVE';
          volumeMl: number; collectedAt?: string; expiresAt: string;
          bloodBankId?: string; bloodTypeId: string;
          donorId?: string; screeningId?: string;
        };
        return this.bloodBagsService.create(
          {
            code:        p.code ?? `BAG-${Date.now()}`,
            aboGroup:    p.aboGroup,
            rhFactor:    p.rhFactor,
            bloodTypeId: p.bloodTypeId,
            bloodBankId: p.bloodBankId,
            donorId:     p.donorId,
            screeningId: p.screeningId,
            volumeMl:    p.volumeMl,
            collectedAt: p.collectedAt ?? new Date().toISOString(),
            expiresAt:   p.expiresAt,
          } as any,
          actor,
        );
      }
      if ((op.method === 'PATCH' || op.method === 'PUT') && idMatch) {
        // The online API only exposes a discard mutation for existing bags —
        // no generic status/field PATCH. Mirror that: offline can only discard.
        const p = op.payload as { status?: string; reason?: string };
        if (p.status === 'DISCARDED') {
          return this.bloodBagsService.discard(
            idMatch[1],
            { reason: p.reason ?? 'Discarded via offline sync' },
            actor,
          );
        }
        throw Object.assign(
          new Error(`Unsupported offline blood-bag update (status=${p.status})`),
          { status: 400 },
        );
      }
    }

    // ── Patient ───────────────────────────────────────────────────────────────
    if (path.startsWith('/patients')) {
      const idMatch = path.match(/\/patients\/([a-f0-9-]+)/);
      if (op.method === 'POST') {
        const p = op.payload as {
          firstName: string; lastName: string; bloodTypeId?: string;
          nationalId?: string; medicalRecordNo?: string; dob?: string;
          hospitalId?: string; // only honoured for ADMIN — same rule as the online endpoint
        };
        return this.patientsService.create(
          {
            firstName:       p.firstName,
            lastName:        p.lastName,
            bloodTypeId:     p.bloodTypeId,
            nationalId:      p.nationalId,
            medicalRecordNo: p.medicalRecordNo,
            dob:             p.dob,
            ...(p.hospitalId && { hospitalId: p.hospitalId }),
          },
          actor,
        );
      }
      if ((op.method === 'PATCH' || op.method === 'PUT') && idMatch) {
        const p = op.payload as {
          firstName?: string; lastName?: string; bloodTypeId?: string;
          nationalId?: string; medicalRecordNo?: string; dob?: string;
        };
        return this.patientsService.update(idMatch[1], p, actor);
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
    userId: string,
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
            where: { userId, ...(since ? { createdAt: { gt: since } } : {}) },
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
