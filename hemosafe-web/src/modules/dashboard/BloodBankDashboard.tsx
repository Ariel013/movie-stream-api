'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

interface StockRow {
  bloodType: string;
  status: string;
  count: number;
}

interface Reservation {
  id: string;
  code: string;
  status: string;
  urgency: string;
  quantity: number;
  createdAt: string;
  hospital: { id: string; name: string };
  bloodType: { label: string };
}

function stockLevel(count: number): { label: string; bg: string; color: string } {
  if (count >= 50) return { label: 'Stable',   bg: 'bg-tertiary/10',     color: 'text-tertiary' };
  if (count >= 20) return { label: 'Modéré',   bg: 'bg-orange-400/10',   color: 'text-orange-600' };
  return               { label: 'Critique', bg: 'bg-error-container', color: 'text-error' };
}

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1)  return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  return `il y a ${Math.floor(mins / 60)} h`;
}

const BLOOD_TYPE_ORDER = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export function BloodBankDashboard() {
  const facilityId = useAuthStore((s) => s.user?.facilityId);

  const [stockSummary, setStockSummary] = useState<StockRow[]>([]);
  const [pendingRes, setPendingRes]     = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);

  const [transitioning, setTransitioning] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    Promise.all([
      api.get(`/blood-banks/${facilityId}/stock`),
      api.get('/reservations'),
    ]).then(([stockRes, resRes]) => {
      setStockSummary(stockRes.data.data ?? []);
      const all: Reservation[] = resRes.data.data ?? [];
      setPendingRes(all.filter((r) => r.status === 'PENDING').slice(0, 5));
    }).finally(() => setLoading(false));
  }, [facilityId]);

  const confirm = async (id: string) => {
    setTransitioning(id);
    try {
      await api.patch(`/reservations/${id}/status`, { status: 'CONFIRMED' });
      setPendingRes((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setTransitioning(null);
    }
  };

  const cancel = async (id: string) => {
    setTransitioning(id);
    try {
      await api.patch(`/reservations/${id}/status`, { status: 'CANCELLED', cancelReason: 'Refusé depuis le tableau de bord' });
      setPendingRes((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setTransitioning(null);
    }
  };

  // Build blood type cards from stock summary (AVAILABLE only)
  const availableByType: Record<string, number> = {};
  for (const row of stockSummary) {
    if (row.status === 'AVAILABLE') availableByType[row.bloodType] = row.count;
  }

  const totalAvailable  = Object.values(availableByType).reduce((s, c) => s + c, 0);
  const totalReserved   = stockSummary.filter((r) => r.status === 'RESERVED').reduce((s, r) => s + r.count, 0);
  const totalExpired    = stockSummary.filter((r) => r.status === 'EXPIRED').reduce((s, r) => s + r.count, 0);

  const metrics = [
    { label: 'POCHES DISPONIBLES',  value: String(totalAvailable),            unit: 'unités', icon: 'inventory',       iconBg: 'bg-tertiary-fixed',     iconColor: 'text-tertiary', alert: false, alertBg: false },
    { label: 'RÉSERVATIONS EN COURS', value: String(pendingRes.length),       unit: 'en attente', icon: 'pending_actions', iconBg: 'bg-primary-fixed',  iconColor: 'text-primary', alert: pendingRes.length > 0, alertBg: false },
    { label: 'STOCK EXPIRÉ',         value: String(totalExpired).padStart(2, '0'), unit: 'unités', icon: 'warning',   iconBg: 'bg-error-container',    iconColor: 'text-error', alert: totalExpired > 0, alertBg: totalExpired > 0 },
  ];

  return (
    <div>
      <TopBar />

      <div className="p-10 space-y-10">

        {/* Header */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-2">
            <h2 className="text-3xl font-headline font-bold">Tableau de bord opérationnel</h2>
            <p className="text-on-surface-variant">Inventaire en temps réel et suivi des réservations.</p>
          </div>
          <div className="flex justify-end items-center">
            <Link
              href="/dashboard/stock"
              className="gradient-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Ajouter une poche</span>
            </Link>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={`p-6 rounded-xl flex items-center justify-between ${m.alertBg ? 'bg-error-container/30' : 'bg-surface-container-low'}`}
            >
              <div>
                <p className={`text-sm font-bold tracking-wider ${m.alertBg ? 'text-error' : 'text-on-surface-variant'}`}>{m.label}</p>
                <h3 className={`text-4xl font-headline font-bold mt-1 ${m.alert ? 'text-primary' : ''}`}>
                  {m.value} <span className="text-lg font-medium text-on-surface-variant">{m.unit}</span>
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.iconBg}`}>
                <span className={`material-symbols-outlined ${m.iconColor}`}>{m.icon}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Blood Type Stock Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-headline font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">opacity</span>
              Niveaux de stock par groupe
            </h3>
            <div className="flex gap-4">
              <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary" /> Stable</span>
              <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Modéré</span>
              <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Critique</span>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {BLOOD_TYPE_ORDER.map((bt) => {
                const qty   = availableByType[bt] ?? 0;
                const level = stockLevel(qty);
                return (
                  <div key={bt} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 text-center space-y-4">
                    <span className="text-2xl font-black font-headline text-primary">{bt}</span>
                    <div className="text-3xl font-bold">{qty}</div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${level.bg} ${level.color}`}>
                      {level.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending Reservations */}
        <section>
          <h3 className="text-xl font-headline font-bold flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">assignment_late</span>
            Demandes en attente de confirmation
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
            </div>
          ) : pendingRes.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-8 text-center text-on-surface-variant text-sm">
              Aucune demande en attente.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRes.map((r) => (
                <div key={r.id} className="bg-surface-container-low p-5 rounded-xl flex items-center justify-between group hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-surface-container-lowest font-black text-primary text-sm shadow-sm flex-shrink-0">
                      {r.bloodType.label}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{r.hospital.name}</h4>
                      <p className="text-xs text-on-surface-variant flex items-center gap-2">
                        <span>{r.quantity} poche{r.quantity > 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span className={`font-bold ${r.urgency === 'EMERGENCY' ? 'text-primary' : r.urgency === 'URGENT' ? 'text-amber-600' : ''}`}>{r.urgency}</span>
                        <span>·</span>
                        <span>{timeAgo(r.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/reservations/${r.id}`} className="px-3 py-2 text-xs font-bold bg-surface-container-lowest text-primary border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                      Voir
                    </Link>
                    <button
                      onClick={() => confirm(r.id)}
                      disabled={transitioning === r.id}
                      className="px-4 py-2 text-xs font-bold gradient-primary text-on-primary rounded-lg disabled:opacity-60"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => cancel(r.id)}
                      disabled={transitioning === r.id}
                      className="px-4 py-2 text-xs font-bold bg-surface-container-lowest text-on-surface-variant rounded-lg hover:text-error transition-colors"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
