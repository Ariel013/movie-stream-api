export type AboGroup = 'A' | 'B' | 'AB' | 'O';
export type RhFactor = '+' | '-';
export type BloodType = `${AboGroup}${RhFactor}`;

export type BloodBagStatus = 'AVAILABLE' | 'RESERVED' | 'USED' | 'EXPIRED' | 'DISCARDED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
export type UrgencyLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface BloodBag {
  id: string;
  code: string;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  volumeMl: number;
  collectedAt: string;
  expiresAt: string;
  status: BloodBagStatus;
  bloodBankId: string;
  donorId: string | null;
}

export interface Reservation {
  id: string;
  code: string;
  hospitalId: string;
  bloodBankId: string;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  quantity: number;
  urgency: UrgencyLevel;
  status: ReservationStatus;
  requestedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
}

export interface BloodBankSummary {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  availableCount: number;
}

/** Compatibility map — key: donor type, value: compatible recipient types */
export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};
