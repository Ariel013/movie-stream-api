/**
 * HEMOSAFE Offline Sync Engine
 *
 * Architecture:
 *
 *  ┌──────────────────────────────────────────────────────────┐
 *  │                     PUSH SYNC                            │
 *  │                                                          │
 *  │  SyncQueue (IndexedDB)                                   │
 *  │  ┌─────────────────────────────────────────────────┐    │
 *  │  │  priority=0 (EMERGENCY)  → sent first           │    │
 *  │  │  priority=1 (NORMAL)     → sent in order        │    │
 *  │  │  priority=2 (LOW)        → sent last            │    │
 *  │  └─────────────────────────────────────────────────┘    │
 *  │         │                                                │
 *  │         ▼                                                │
 *  │   Deduplication: collapse multiple updates for same      │
 *  │   (entityType, entityId) into single operation           │
 *  │         │                                                │
 *  │         ▼                                                │
 *  │   HTTP request with X-Idempotency-Key header             │
 *  │         │                                                │
 *  │   ┌─────┴──────┐                                        │
 *  │   │ 2xx        │ → delete from queue                     │
 *  │   │ 409        │ → conflict → resolve (server wins)      │
 *  │   │ 4xx perm.  │ → dead-letter (failed_ops)              │
 *  │   │ 5xx / net  │ → exponential backoff, retry            │
 *  │   └────────────┘                                        │
 *  │                                                          │
 *  └──────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────┐
 *  │                     PULL SYNC                            │
 *  │                                                          │
 *  │  GET /sync/pull?since=<lastSyncAt>&scopes=stock,res,...  │
 *  │  → server returns changed records since lastSyncAt       │
 *  │  → merged into local IndexedDB tables                    │
 *  │  → server wins on conflict (higher serverVersion wins)   │
 *  └──────────────────────────────────────────────────────────┘
 */

import {
  db,
  SyncOperation,
  SyncPriority,
  getLastSyncAt,
  setLastSyncAt,
  LocalBloodBag,
  LocalReservation,
  LocalPatient,
} from './db';
import api from '../lib/api';

// ─── Configuration ───────────────────────────────────────────────────────────

const MAX_RETRIES = 5;

/** Backoff schedule in ms: attempt 1→2s, 2→8s, 3→32s, 4→128s, 5→512s */
function backoffMs(retries: number): number {
  return Math.min(2 ** (retries + 1) * 1000, 600_000); // cap at 10 min
}

/** HTTP status codes that are permanent failures (no point retrying). */
const PERMANENT_FAILURE_CODES = new Set([400, 401, 403, 404, 422]);

// ─── UUID helper (no external dependency) ────────────────────────────────────

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Enqueue ─────────────────────────────────────────────────────────────────

export interface EnqueueOptions {
  method: SyncOperation['method'];
  endpoint: string;
  payload: unknown;
  entityType: string;
  entityId: string;
  priority?: SyncPriority;
}

/**
 * Adds a mutation to the sync queue.
 *
 * Deduplication rule:
 *   If an existing PATCH/PUT for the same (entityType, entityId) already exists
 *   in the queue, merge payload instead of adding a new entry. This avoids
 *   sending 50 stock updates when the user edits the same bag repeatedly offline.
 */
export async function enqueue(opts: EnqueueOptions): Promise<string> {
  const { method, endpoint, payload, entityType, entityId, priority = 1 } = opts;

  // Deduplication: collapse updates on the same entity
  if (method === 'PATCH' || method === 'PUT') {
    const existing = await db.sync_queue
      .where({ entityType, entityId })
      .filter((op) => op.method === method)
      .first();

    if (existing) {
      // Merge: last-write-wins on a field-by-field basis
      const merged = { ...(existing.payload as object), ...(payload as object) };
      await db.sync_queue.update(existing.id!, {
        payload: merged,
        priority: Math.min(existing.priority, priority) as SyncPriority,
        nextRetryAt: 0, // make it immediately eligible
      });
      return existing.operationId;
    }
  }

  const operationId = uuidv4();
  await db.sync_queue.add({
    operationId,
    method,
    endpoint,
    payload,
    entityType,
    entityId,
    priority,
    retries: 0,
    nextRetryAt: 0,
    createdAt: Date.now(),
  });

  return operationId;
}

// ─── Push sync (flush queue) ──────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncResult {
  succeeded: number;
  failed: number;
  retryLater: number;
}

let _isSyncing = false;

/**
 * Flushes all due operations from the sync queue, in priority order.
 * Safe to call concurrently — second call is a no-op if already running.
 */
export async function flushQueue(): Promise<SyncResult> {
  if (_isSyncing) return { succeeded: 0, failed: 0, retryLater: 0 };
  _isSyncing = true;

  const result: SyncResult = { succeeded: 0, failed: 0, retryLater: 0 };

  try {
    // Select operations that are due (nextRetryAt <= now), sorted by priority then createdAt
    const now = Date.now();
    const allOps = await db.sync_queue
      .where('nextRetryAt')
      .belowOrEqual(now)
      .toArray();

    // Sort: priority ASC (0 = EMERGENCY first), then createdAt ASC
    allOps.sort((a, b) =>
      a.priority !== b.priority ? a.priority - b.priority : a.createdAt - b.createdAt,
    );

    for (const op of allOps) {
      try {
        await api.request({
          method: op.method,
          url: op.endpoint,
          data: op.payload,
          headers: {
            'X-Idempotency-Key': op.operationId,
            'X-Client-Version': (op as SyncOperation & { entityVersion?: string }).entityVersion ?? '',
          },
        });

        await db.sync_queue.delete(op.id!);
        result.succeeded++;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status ?? 0;

        if (status === 409) {
          // Conflict: server has a newer version — resolve by fetching server state
          await resolveConflict(op);
          await db.sync_queue.delete(op.id!);
          result.succeeded++; // counted as handled
        } else if (PERMANENT_FAILURE_CODES.has(status)) {
          // Permanent failure — move to dead-letter
          await db.failed_ops.add({
            operationId: op.operationId,
            operation: op,
            errorCode: status,
            errorMessage: `Permanent HTTP ${status}`,
            failedAt: Date.now(),
          });
          await db.sync_queue.delete(op.id!);
          result.failed++;
        } else {
          // Transient failure (5xx, network error) — exponential backoff
          const retries = op.retries + 1;
          if (retries >= MAX_RETRIES) {
            await db.failed_ops.add({
              operationId: op.operationId,
              operation: op,
              errorCode: status,
              errorMessage: `Max retries (${MAX_RETRIES}) exceeded`,
              failedAt: Date.now(),
            });
            await db.sync_queue.delete(op.id!);
            result.failed++;
          } else {
            await db.sync_queue.update(op.id!, {
              retries,
              lastAttemptAt: Date.now(),
              nextRetryAt: Date.now() + backoffMs(retries),
            });
            result.retryLater++;
          }
        }
      }
    }
  } finally {
    _isSyncing = false;
  }

  return result;
}

// ─── Conflict resolution ──────────────────────────────────────────────────────

/**
 * Server-wins strategy:
 * Fetch the current server state for the conflicted entity and overwrite
 * the local IndexedDB record.
 */
async function resolveConflict(op: SyncOperation): Promise<void> {
  // Derive GET endpoint from the mutation endpoint
  // e.g. PATCH /blood-bags/abc → GET /blood-bags/abc
  const getEndpoint = op.endpoint.split('?')[0]; // strip query params

  try {
    const res = await api.get(getEndpoint);
    const serverData = res.data?.data ?? res.data;

    if (!serverData) return;

    switch (op.entityType) {
      case 'blood_bag':
        await db.blood_stock.put({
          ...(serverData as LocalBloodBag),
          syncedAt: Date.now(),
        });
        break;
      case 'reservation':
        await db.reservations.put({
          ...(serverData as LocalReservation),
          isDraft: false,
          syncedAt: Date.now(),
        });
        break;
      case 'patient':
        await db.patients.put({
          ...(serverData as LocalPatient),
          isDraft: false,
          syncedAt: Date.now(),
        });
        break;
    }

    console.warn(`[sync] Conflict resolved (server wins) — ${op.entityType}:${op.entityId}`);
  } catch {
    // Silently fail: the local data stays as-is. Will re-attempt on next sync.
  }
}

// ─── Pull sync ────────────────────────────────────────────────────────────────

export type PullScope = 'stock' | 'reservations' | 'patients' | 'notifications';

interface PullResponse {
  stock?: LocalBloodBag[];
  reservations?: LocalReservation[];
  patients?: LocalPatient[];
  notifications?: { id: string; type: string; title: string; body: string; createdAt: number }[];
  serverTime: string; // ISO
}

/**
 * Downloads records changed on the server since the last pull.
 * Merges them into IndexedDB using server-wins on version conflict.
 */
export async function pullSync(scopes: PullScope[] = ['stock', 'reservations', 'patients', 'notifications']): Promise<void> {
  const since = await getLastSyncAt('pull');

  let response: PullResponse;
  try {
    const res = await api.get('/sync/pull', {
      params: { since: since ? new Date(since).toISOString() : undefined, scopes: scopes.join(',') },
    });
    response = res.data.data as PullResponse;
  } catch {
    // Network error — skip pull, we'll try again next time
    return;
  }

  // Merge stock
  if (response.stock?.length) {
    await db.blood_stock.bulkPut(
      response.stock.map((b) => ({ ...b, syncedAt: Date.now() })),
    );
  }

  // Merge reservations (skip drafts — they're ours, not yet on server)
  if (response.reservations?.length) {
    const drafts = new Set((await db.reservations.where({ isDraft: 1 as unknown as boolean }).toArray()).map((r) => r.id));
    const toMerge = response.reservations
      .filter((r) => !drafts.has(r.id))
      .map((r) => ({ ...r, isDraft: false, syncedAt: Date.now() }));
    if (toMerge.length) await db.reservations.bulkPut(toMerge);
  }

  // Merge patients
  if (response.patients?.length) {
    const drafts = new Set((await db.patients.where({ isDraft: 1 as unknown as boolean }).toArray()).map((p) => p.id));
    const toMerge = response.patients
      .filter((p) => !drafts.has(p.id))
      .map((p) => ({ ...p, isDraft: false, syncedAt: Date.now() }));
    if (toMerge.length) await db.patients.bulkPut(toMerge);
  }

  // Merge notifications
  if (response.notifications?.length) {
    await db.notifications.bulkPut(
      response.notifications.map((n) => ({ ...n, body: n.body ?? '', isRead: false })),
    );
  }

  // Update last sync timestamp
  await setLastSyncAt('pull', new Date(response.serverTime).getTime());
}

// ─── Full sync (push then pull) ───────────────────────────────────────────────

export async function fullSync(): Promise<SyncResult> {
  const pushResult = await flushQueue();
  await pullSync();
  return pushResult;
}

// ─── Pending count helper ─────────────────────────────────────────────────────

export async function pendingCount(): Promise<number> {
  return db.sync_queue.count();
}

export async function failedCount(): Promise<number> {
  return db.failed_ops.count();
}
