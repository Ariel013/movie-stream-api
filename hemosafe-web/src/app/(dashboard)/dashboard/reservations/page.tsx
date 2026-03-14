'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

interface Reservation {
  id: string;
  code: string;
  bloodType: string;
  quantity: number;
  hospital: string;
  bloodBank: string;
  status: ReservationStatus;
  urgency: 'ROUTINE' | 'EMERGENCY';
  expiresAt: string;
  createdAt: string;
}

const MOCK: Reservation[] = [
  { id: '1', code: 'RES-0041', bloodType: 'O+', quantity: 4, hospital: 'St. Mary General', bloodBank: 'City Central', status: 'PENDING', urgency: 'EMERGENCY', expiresAt: '2026-03-14 09:22', createdAt: '2026-03-13 09:22' },
  { id: '2', code: 'RES-0039', bloodType: 'AB-', quantity: 2, hospital: 'Riverside Clinic', bloodBank: 'North Regional', status: 'CONFIRMED', urgency: 'ROUTINE', expiresAt: '2026-03-14 08:10', createdAt: '2026-03-13 08:10' },
  { id: '3', code: 'RES-0037', bloodType: 'A+', quantity: 6, hospital: 'City Hospital', bloodBank: 'Eastside Medical', status: 'DISPATCHED', urgency: 'ROUTINE', expiresAt: '2026-03-14 07:44', createdAt: '2026-03-13 07:44' },
  { id: '4', code: 'RES-0035', bloodType: 'B+', quantity: 3, hospital: 'Central Polyclinic', bloodBank: 'City Central', status: 'DELIVERED', urgency: 'ROUTINE', expiresAt: '2026-03-13 06:00', createdAt: '2026-03-12 06:00' },
  { id: '5', code: 'RES-0033', bloodType: 'O-', quantity: 1, hospital: 'St. Mary General', bloodBank: 'North Regional', status: 'CANCELLED', urgency: 'ROUTINE', expiresAt: '2026-03-12 05:30', createdAt: '2026-03-11 05:30' },
];

const STATUS_STYLES: Record<ReservationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-tertiary-fixed/40 text-tertiary',
  DISPATCHED: 'bg-secondary-container text-secondary',
  DELIVERED: 'bg-surface-container text-on-surface-variant',
  CANCELLED: 'bg-error-container text-on-error-container',
};

const FILTER_OPTIONS: (ReservationStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

export default function ReservationsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [filter, setFilter] = useState<ReservationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = MOCK.filter((r) => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    if (search && !r.code.toLowerCase().includes(search.toLowerCase()) && !r.hospital.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <TopBar title="Reservations" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        {/* Header actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Reservations</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage all blood reservation orders</p>
          </div>
          {role === 'HOSPITAL' && (
            <a href="/dashboard/blood-search" className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Reservation
            </a>
          )}
        </div>

        {/* Filters + search */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 ambient-shadow flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              placeholder="Search by reference or hospital..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${filter === s ? 'gradient-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-3xl ambient-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Reference</th>
                  <th className="px-6 py-4 text-left">Hospital</th>
                  <th className="px-6 py-4 text-left">Blood Bank</th>
                  <th className="px-6 py-4 text-left">Blood Type</th>
                  <th className="px-6 py-4 text-left">Qty</th>
                  <th className="px-6 py-4 text-left">Urgency</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Expires</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{r.code}</td>
                    <td className="px-6 py-4 font-medium text-on-surface">{r.hospital}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{r.bloodBank}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-on-surface">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {r.bloodType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{r.quantity} bags</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${r.urgency === 'EMERGENCY' ? 'bg-error-container text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{r.expiresAt}</td>
                    <td className="px-6 py-4 text-right">
                      <a href={`/dashboard/reservations/${r.id}`} className="text-xs font-bold text-primary hover:underline">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant">
                      No reservations match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
