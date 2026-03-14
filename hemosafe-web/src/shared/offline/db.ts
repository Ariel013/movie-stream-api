import Dexie, { type Table } from 'dexie';

// ─── Domain entities stored locally ────────────────────────────────────────

export interface LocalBloodBag {
  id: string;
  code: string;
  aboGroup: string;
  rhFactor: string;
  volumeMl: number;
  expiresAt: string;
  status: 'AVAILABLE' | 'RESERVED' | 'DISTRIBUTED' | 'EXPIRED';
  bloodBankId: string;
  /** Server-side updatedAt (ISO string) — used for conflict detection. */
  serverVersion: string;
  syncedAt: number;       // local timestamp of last successful sync
}

export interface LocalReservation {
  id: string;             // UUID (pre-generated client-side for offline creations)
  code?: string;          // assigned by server, empty until synced
  bloodBankId: string;
  hospitalId: string;
  bloodTypeId: string;
  aboGroup: string;
  rhFactor: string;
  quantity: number;
  urgency: 'ROUTINE' | 'EMERGENCY';
  status: string;
  isDraft: boolean;       // true = created offline, not confirmed by server yet
  serverVersion?: string;
  syncedAt?: number;
}

export interface LocalPatient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  bloodType: string;
  diagnosis: string;
  physician: string;
  status: 'ACTIVE' | 'STABLE' | 'DISCHARGED';
  admittedAt: string;
  isDraft: boolean;
  serverVersion?: string;
  syncedAt?: number;
}

export interface LocalNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
}

export interface SyncMeta {
  key: string;
  value: string | number | null;
}

// ─── Sync queue ─────────────────────────────────────────────────────────────

export type SyncPriority = 0 | 1 | 2; // 0 = highest (EMERGENCY), 1 = normal, 2 = low

export interface SyncOperation {
  id?: number;              // auto-increment PK
  operationId: string;      // UUID, used as X-Idempotency-Key on the server
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  payload: unknown;
  /** Entity type for deduplication (e.g. 'patient', 'blood_bag', 'reservation'). */
  entityType: string;
  /** Entity id for deduplication — allows collapsing multiple updates to same entity. */
  entityId: string;
  priority: SyncPriority;
  retries: number;
  lastAttemptAt?: number;
  /** Exponential backoff: delay in ms before next retry. */
  nextRetryAt: number;
  createdAt: number;
}

// ─── Failed operations (dead-letter) ────────────────────────────────────────

export interface FailedOperation {
  id?: number;
  operationId: string;
  operation: SyncOperation;
  errorCode: number;         // HTTP status or 0 for network error
  errorMessage: string;
  failedAt: number;
}

// ─── Dexie DB class ─────────────────────────────────────────────────────────

class HemosafeDB extends Dexie {
  blood_stock!:    Table<LocalBloodBag>;
  reservations!:   Table<LocalReservation>;
  patients!:       Table<LocalPatient>;
  sync_queue!:     Table<SyncOperation>;
  failed_ops!:     Table<FailedOperation>;
  notifications!:  Table<LocalNotification>;
  meta!:           Table<SyncMeta>;

  constructor() {
    super('hemosafe_v2');

    this.version(1).stores({
      blood_stock:   'id, aboGroup, rhFactor, status, bloodBankId, expiresAt, syncedAt',
      reservations:  'id, status, isDraft, bloodBankId, hospitalId, urgency',
      patients:      'id, status, isDraft, syncedAt',
      sync_queue:    '++id, operationId, entityType, entityId, priority, nextRetryAt, createdAt',
      failed_ops:    '++id, operationId, failedAt',
      notifications: 'id, isRead, createdAt',
      meta:          'key',
    });
  }
}

export const db = new HemosafeDB();

// ─── Meta helpers ────────────────────────────────────────────────────────────

export async function getLastSyncAt(scope: string): Promise<number> {
  const row = await db.meta.get(`lastSyncAt:${scope}`);
  return (row?.value as number) ?? 0;
}

export async function setLastSyncAt(scope: string, ts: number): Promise<void> {
  await db.meta.put({ key: `lastSyncAt:${scope}`, value: ts });
}
