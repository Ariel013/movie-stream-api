/**
 * Offline-aware mutation helpers.
 *
 * Each function:
 *   1. Writes the change to IndexedDB immediately (optimistic).
 *   2. Enqueues a sync operation with the correct priority.
 *   3. Returns the local record so the UI can update instantly.
 *
 * When the network is available, sync-engine.ts flushes the queue.
 * When offline, the local state persists across page refreshes.
 */

import { db, LocalReservation, LocalBloodBag, LocalPatient } from './db';
import { enqueue, uuidv4 } from './sync-engine';

// ─── Reservation ─────────────────────────────────────────────────────────────

export interface CreateReservationInput {
  bloodBankId: string;
  hospitalId: string;
  bloodTypeId: string;
  aboGroup: string;
  rhFactor: string;
  quantity: number;
  urgency: 'ROUTINE' | 'EMERGENCY';
  prescriptionId?: string;
  notes?: string;
}

/**
 * Creates a reservation locally and queues it for server sync.
 * EMERGENCY reservations use priority=0 (sent first in queue).
 */
export async function createReservationOffline(
  input: CreateReservationInput,
): Promise<LocalReservation> {
  const id = uuidv4();
  const priority = input.urgency === 'EMERGENCY' ? 0 : 1;

  const local: LocalReservation = {
    id,
    bloodBankId: input.bloodBankId,
    hospitalId: input.hospitalId,
    bloodTypeId: input.bloodTypeId,
    aboGroup: input.aboGroup,
    rhFactor: input.rhFactor,
    quantity: input.quantity,
    urgency: input.urgency,
    status: 'PENDING',
    isDraft: true,
  };

  await db.reservations.add(local);

  await enqueue({
    method: 'POST',
    endpoint: '/reservations',
    payload: { ...input, clientId: id }, // clientId lets server echo back the same UUID
    entityType: 'reservation',
    entityId: id,
    priority,
  });

  return local;
}

// ─── Blood Stock ──────────────────────────────────────────────────────────────

export interface UpdateStockInput {
  id: string;
  patch: Partial<Pick<LocalBloodBag, 'status' | 'volumeMl'>>;
}

/**
 * Patches a blood bag locally and enqueues a PATCH to the server.
 * Multiple rapid offline edits to the same bag are collapsed into one
 * operation by the deduplication logic in enqueue().
 */
export async function updateStockOffline(input: UpdateStockInput): Promise<LocalBloodBag | null> {
  const existing = await db.blood_stock.get(input.id);
  if (!existing) return null;

  const updated: LocalBloodBag = { ...existing, ...input.patch };
  await db.blood_stock.put(updated);

  await enqueue({
    method: 'PATCH',
    endpoint: `/blood-bags/${input.id}`,
    payload: input.patch,
    entityType: 'blood_bag',
    entityId: input.id,
    priority: 1,
  });

  return updated;
}

/**
 * Registers a new blood bag locally (e.g. donation intake while offline).
 */
export interface RegisterBagInput {
  aboGroup: string;
  rhFactor: string;
  volumeMl: number;
  expiresAt: string;
  bloodBankId: string;
  donorId?: string;
}

export async function registerBagOffline(input: RegisterBagInput): Promise<LocalBloodBag> {
  const id = uuidv4();
  const local: LocalBloodBag = {
    id,
    code: `BAG-DRAFT-${id.slice(0, 8).toUpperCase()}`,
    aboGroup: input.aboGroup,
    rhFactor: input.rhFactor,
    volumeMl: input.volumeMl,
    expiresAt: input.expiresAt,
    status: 'AVAILABLE',
    bloodBankId: input.bloodBankId,
    serverVersion: '',
    syncedAt: 0,
  };

  await db.blood_stock.add(local);

  await enqueue({
    method: 'POST',
    endpoint: '/blood-bags',
    payload: { ...input, clientId: id },
    entityType: 'blood_bag',
    entityId: id,
    priority: 1,
  });

  return local;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface UpdatePatientInput {
  id: string;
  patch: Partial<Pick<LocalPatient, 'status' | 'diagnosis' | 'physician'>>;
}

/**
 * Updates patient info locally and queues a PATCH.
 * Multiple edits to the same patient while offline are collapsed (deduped).
 */
export async function updatePatientOffline(input: UpdatePatientInput): Promise<LocalPatient | null> {
  const existing = await db.patients.get(input.id);
  if (!existing) return null;

  const updated: LocalPatient = { ...existing, ...input.patch, isDraft: true };
  await db.patients.put(updated);

  await enqueue({
    method: 'PATCH',
    endpoint: `/patients/${input.id}`,
    payload: input.patch,
    entityType: 'patient',
    entityId: input.id,
    priority: 2, // low — patient info is not time-critical
  });

  return updated;
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  bloodType: string;
  diagnosis: string;
  physician: string;
  hospitalId: string;
}

export async function createPatientOffline(input: CreatePatientInput): Promise<LocalPatient> {
  const id = uuidv4();
  const local: LocalPatient = {
    id,
    code: `PAT-DRAFT-${id.slice(0, 6).toUpperCase()}`,
    firstName: input.firstName,
    lastName: input.lastName,
    bloodType: input.bloodType,
    diagnosis: input.diagnosis,
    physician: input.physician,
    status: 'ACTIVE',
    admittedAt: new Date().toISOString().split('T')[0],
    isDraft: true,
  };

  await db.patients.add(local);

  await enqueue({
    method: 'POST',
    endpoint: '/patients',
    payload: { ...input, clientId: id },
    entityType: 'patient',
    entityId: id,
    priority: 2,
  });

  return local;
}
