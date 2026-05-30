'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'EXPIRED' | 'CANCELLED';

interface Reservation {
  id: string;
  code: string;
  bloodType: { label: string };
  quantity: number;
  hospital: { id: string; name: string };
  bloodBank: { id: string; name: string };
  status: ReservationStatus;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  expiresAt: string;
  createdAt: string;
}

const STATUS_STYLES: Record<ReservationStatus, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  CONFIRMED:  'bg-tertiary-fixed/40 text-tertiary',
  DISPATCHED: 'bg-secondary-container text-secondary',
  DELIVERED:  'bg-surface-container text-on-surface-variant',
  EXPIRED:    'bg-surface-dim text-on-surface-variant',
  CANCELLED:  'bg-error-container text-on-error-container',
};

const URGENCY_STYLES: Record<string, string> = {
  ROUTINE:   'bg-surface-container text-on-surface-variant',
  URGENT:    'bg-amber-100 text-amber-700',
  EMERGENCY: 'bg-error-container text-primary',
};

const FILTER_OPTIONS: (ReservationStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

export default function ReservationsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<ReservationStatus | 'ALL'>('ALL');
  const [search, setSearch]             = useState('');

  useEffect(() => {
    api.get('/reservations')
      .then((res) => setReservations(res.data.data ?? []))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reservations.filter((r) => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    const q = search.toLowerCase();
    if (q && !r.code.toLowerCase().includes(q) && !r.hospital.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div>
      <TopBar title="Réservations" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Réservations</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Toutes les commandes de sang</p>
          </div>
          {role === 'HOSPITAL' && (
            <a href="/dashboard/blood-search" className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nouvelle réservation
            </a>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 ambient-shadow flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              placeholder="Rechercher par référence ou hôpital..."
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

        <div className="bg-surface-container-lowest rounded-3xl ambient-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Référence</th>
                  <th className="px-6 py-4 text-left">Hôpital</th>
                  <th className="px-6 py-4 text-left">Banque de sang</th>
                  <th className="px-6 py-4 text-left">Groupe</th>
                  <th className="px-6 py-4 text-left">Qté</th>
                  <th className="px-6 py-4 text-left">Urgence</th>
                  <th className="px-6 py-4 text-left">Statut</th>
                  <th className="px-6 py-4 text-left">Expire</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant">
                      Aucune réservation ne correspond à vos filtres.
                    </td>
                  </tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{r.code}</td>
                    <td className="px-6 py-4 font-medium text-on-surface">{r.hospital.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{r.bloodBank.name}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-on-surface">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {r.bloodType.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{r.quantity} poche{r.quantity > 1 ? 's' : ''}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${URGENCY_STYLES[r.urgency] ?? ''}`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {new Date(r.expiresAt).toLocaleString('fr-CI')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a href={`/dashboard/reservations/${r.id}`} className="text-xs font-bold text-primary hover:underline">
                        Voir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
