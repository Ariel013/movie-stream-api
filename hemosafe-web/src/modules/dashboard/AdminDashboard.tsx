'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/shared/lib/api';

interface NationalSummary {
  bagsByStatus: Record<string, number>;
  totalDonors: number;
  totalHospitals: number;
  totalBloodBanks: number;
  reservationsByStatus: Record<string, number>;
  bagsByBloodType: Array<{ bloodType: string; status: string; count: number }>;
}

interface TrendRow {
  day: string;
  status: string;
  count: number;
}

const BT_ORDER = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export function AdminDashboard() {
  const [summary, setSummary]   = useState<NationalSummary | null>(null);
  const [trends, setTrends]     = useState<{ day: string; reservations: number; completed: number }[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/statistics/national'),
      api.get('/statistics/reservation-trends', { params: { days: 7 } }),
    ]).then(([sumRes, trendRes]) => {
      setSummary(sumRes.data.data);

      // Aggregate trend rows into per-day totals
      const rows: TrendRow[] = trendRes.data.data ?? [];
      const dayMap: Record<string, { reservations: number; completed: number }> = {};
      for (const r of rows) {
        if (!dayMap[r.day]) dayMap[r.day] = { reservations: 0, completed: 0 };
        dayMap[r.day].reservations += r.count;
        if (r.status === 'DELIVERED') dayMap[r.day].completed += r.count;
      }
      const sorted = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, vals]) => ({
          day: new Date(day).toLocaleDateString('fr-CI', { weekday: 'short' }),
          ...vals,
        }));
      setTrends(sorted);
    }).finally(() => setLoading(false));
  }, []);

  const available  = summary?.bagsByStatus?.['AVAILABLE']  ?? 0;
  const expired    = summary?.bagsByStatus?.['EXPIRED']     ?? 0;
  const todayRes   = Object.values(summary?.reservationsByStatus ?? {}).reduce((s, n) => s + n, 0);

  const STATS = [
    { label: 'Hôpitaux',          value: loading ? '…' : String(summary?.totalHospitals ?? 0),  icon: 'domain',     iconBg: 'bg-secondary-container', iconColor: 'text-secondary', alert: false },
    { label: 'Banques de sang',    value: loading ? '…' : String(summary?.totalBloodBanks ?? 0), icon: 'water_drop', iconBg: 'bg-primary-fixed',       iconColor: 'text-primary', alert: false },
    { label: 'Poches disponibles', value: loading ? '…' : available.toLocaleString('fr'),        icon: 'inventory',  iconBg: 'bg-tertiary-fixed',      iconColor: 'text-tertiary', alert: false },
    { label: 'Total réservations', value: loading ? '…' : todayRes.toLocaleString('fr'),         icon: 'schedule',   iconBg: 'bg-secondary-container', iconColor: 'text-secondary', alert: false },
    { label: 'Expirations',        value: loading ? '…' : String(expired),                       icon: 'warning',    iconBg: 'bg-primary-container',   iconColor: 'text-on-primary', alert: expired > 0 },
  ];

  // Top blood types by available bags
  const availByType: Record<string, number> = {};
  for (const row of summary?.bagsByBloodType ?? []) {
    if (row.status === 'AVAILABLE') availByType[row.bloodType] = (availByType[row.bloodType] ?? 0) + row.count;
  }
  const totalAvailBags = Object.values(availByType).reduce((s, n) => s + n, 0) || 1;
  const topBloodTypes = BT_ORDER
    .map((bt) => ({ type: bt, pct: ((availByType[bt] ?? 0) / totalAvailBags * 100).toFixed(1) + '%', count: availByType[bt] ?? 0 }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div>
      <TopBar />

      <section className="p-10 space-y-10 max-w-7xl mx-auto w-full">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col justify-between ${s.alert ? 'border-t-4 border-primary' : ''}`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${s.alert ? 'text-primary' : 'text-on-surface-variant'}`}>
                {s.label}
              </span>
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-extrabold ${s.alert ? 'text-primary' : 'text-on-surface'}`}>{s.value}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  <span className={`material-symbols-outlined text-sm ${s.iconColor}`}>{s.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-8">

          {/* Line chart */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl ambient-shadow flex flex-col" style={{ minHeight: 360 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold font-headline">Performance opérationnelle</h3>
                <p className="text-xs text-on-surface-variant">Réservations vs. Livrées (7 derniers jours)</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-medium">Réservations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-[10px] font-medium">Livrées</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              {trends.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-on-surface-variant text-sm">
                  {loading ? 'Chargement…' : 'Pas encore de données sur 7 jours.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba30" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '12px', fontSize: 12 }} />
                    <Line type="monotone" dataKey="reservations" stroke="#af101a" strokeWidth={2.5} dot={false} name="Réservations" />
                    <Line type="monotone" dataKey="completed"    stroke="#4c616c" strokeWidth={2.5} dot={false} strokeDasharray="4" name="Livrées" />
                    <Legend wrapperStyle={{ display: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Demand Distribution */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl ambient-shadow flex flex-col">
            <h3 className="text-lg font-bold font-headline mb-2">Distribution de la demande</h3>
            <p className="text-xs text-on-surface-variant mb-8">Groupes sanguins les plus demandés</p>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-[14px] border-primary flex items-center justify-center relative">
                <div className="absolute inset-[-14px] rounded-full border-[14px] border-secondary border-t-transparent border-l-transparent transform rotate-45" />
                <div className="text-center">
                  <span className="text-2xl font-extrabold text-on-surface font-headline">{topBloodTypes[0]?.type ?? 'O+'}</span>
                  <p className="text-[10px] font-bold text-on-surface-variant">{topBloodTypes[0]?.pct ?? '0%'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              {topBloodTypes.map((b) => (
                <div key={b.type} className="flex justify-between items-center p-2 rounded-lg bg-surface-container-low">
                  <span className="text-xs font-bold bg-surface-variant text-primary px-2 py-0.5 rounded-full">{b.type}</span>
                  <span className="text-xs font-bold text-on-surface">{b.count} poches · {b.pct}</span>
                </div>
              ))}
              {topBloodTypes.length === 0 && !loading && (
                <p className="text-xs text-on-surface-variant text-center py-4">Pas de données disponibles.</p>
              )}
            </div>
          </div>

          {/* Stock by blood type horizontal bars */}
          <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl ambient-shadow">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold font-headline">Stock par groupe sanguin</h3>
              <a href="/dashboard/stock" className="text-xs font-bold text-primary flex items-center gap-1">
                Voir le stock
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
              </div>
            ) : (
              <div className="space-y-4">
                {BT_ORDER.filter((bt) => availByType[bt] > 0).slice(0, 6).map((bt, i) => {
                  const count = availByType[bt] ?? 0;
                  const pct   = ((count / totalAvailBags) * 100).toFixed(0);
                  return (
                    <div key={bt} className="space-y-2">
                      <div className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${i > 0 ? 'text-on-surface-variant' : ''}`}>
                        <span>{bt}</span>
                        <span>{count} poches</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {BT_ORDER.filter((bt) => availByType[bt] > 0).length === 0 && (
                  <p className="text-xs text-on-surface-variant text-center py-8">Aucun stock disponible pour l'instant.</p>
                )}
              </div>
            )}
          </div>

          {/* Network Map placeholder */}
          <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden flex flex-col">
            <div className="p-8">
              <h3 className="text-lg font-bold font-headline">Carte du réseau</h3>
              <p className="text-xs text-on-surface-variant">Statut des établissements en direct</p>
            </div>
            <div className="flex-1 bg-surface-variant relative min-h-[200px]">
              <div className="absolute inset-0 bg-surface-container-high opacity-40" />
              <div className="absolute top-1/4 left-1/3">
                <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse absolute" />
                </div>
              </div>
              <div className="absolute top-1/2 left-2/3 w-4 h-4 bg-tertiary rounded-full border-2 border-white shadow-lg" />
              <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg" />
              <div className="absolute bottom-4 right-4 bg-surface-container-lowest p-3 rounded-lg ambient-shadow border border-outline-variant/10 max-w-[160px]">
                <p className="text-[10px] font-bold mb-1">CNTS Abidjan</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  <span className="text-[9px] text-on-surface-variant">Stock optimal</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <a href="/dashboard/map" className="bg-surface-container-lowest/90 backdrop-blur text-xs font-bold text-primary px-4 py-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container transition-colors">
                  Ouvrir la carte nationale →
                </a>
              </div>
            </div>
          </div>

          {/* Reservations status breakdown */}
          <div className="col-span-12 bg-surface-container-lowest rounded-xl ambient-shadow p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold font-headline">Répartition des réservations</h3>
              <a href="/dashboard/reservations" className="text-xs font-bold text-primary flex items-center gap-1">
                Voir toutes
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { key: 'PENDING',    label: 'En attente',  color: 'bg-amber-100 text-amber-700' },
                  { key: 'CONFIRMED',  label: 'Confirmées',  color: 'bg-tertiary-fixed/40 text-tertiary' },
                  { key: 'DISPATCHED', label: 'Expédiées',   color: 'bg-secondary-container text-secondary' },
                  { key: 'DELIVERED',  label: 'Livrées',     color: 'bg-surface-container text-on-surface-variant' },
                  { key: 'EXPIRED',    label: 'Expirées',    color: 'bg-surface-dim text-on-surface-variant' },
                  { key: 'CANCELLED',  label: 'Annulées',    color: 'bg-error-container text-on-error-container' },
                ].map((s) => (
                  <div key={s.key} className="bg-surface-container-low rounded-xl p-4 text-center space-y-2">
                    <p className="text-2xl font-extrabold font-headline text-on-surface">
                      {summary?.reservationsByStatus?.[s.key] ?? 0}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
