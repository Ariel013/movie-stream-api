import { db, SyncOperation } from './db';
import api from '../lib/api';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Enqueue a mutation to be replayed when connectivity is restored. */
export async function enqueue(
  op: Omit<SyncOperation, 'id' | 'operationId' | 'retries' | 'createdAt'>,
): Promise<void> {
  await db.sync_queue.add({
    ...op,
    operationId: uuidv4(),
    retries: 0,
    createdAt: Date.now(),
  });
}

const MAX_RETRIES = 5;

/** Flush all queued operations in order. Called when network comes back. */
export async function flushQueue(): Promise<void> {
  const ops = await db.sync_queue.orderBy('createdAt').toArray();

  for (const op of ops) {
    try {
      await api.request({
        method: op.method,
        url: op.endpoint,
        data: op.payload,
        headers: { 'X-Idempotency-Key': op.operationId },
      });
      await db.sync_queue.delete(op.id!);
    } catch {
      const retries = op.retries + 1;
      if (retries >= MAX_RETRIES) {
        await db.sync_queue.delete(op.id!);
        console.error('[sync] Dropping operation after max retries', op);
      } else {
        await db.sync_queue.update(op.id!, { retries });
      }
    }
  }
}
