'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

interface TrendRow { day: string; status: string; count: number }

const BT_ORDER = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const COLORS    = ['#af101a', '#d32f2f', '#e57373', '#ef9a9a', '#006357', '#4c616c', '#7ad7c6', '#b4cad6'];

export default function StatisticsPage() {
  const [summary, setSummary] = useState<NationalSummary | null>(null);
  const [trends, setTrends]   = useState<{ day: string; reservations: number; completed: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/statistics/national'),
      api.get('/statistics/reservation-trends', { params: { days: 30 } }),
    ]).then(([sumRes, trendRes]) => {
      setSummary(sumRes.data.data);

      const rows: TrendRow[] = trendRes.data.data ?? [];
      const dayMap: Record<string, { reservations: number; completed: number }> = {};
      for (const r of rows) {
        if (!dayMap[r.day]) dayMap[r.day] = { reservations: 0, completed: 0 };
        dayMap[r.day].reservations += r.count;
        if (r.status === 'DELIVERED') dayMap[r.day].completed += r.count;
      }
      setTrends(
        Object.entries(dayMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, vals]) => ({
            day: new Date(day).toLocaleDateString('fr-CI', { day: '2-digit', month: '2-digit' }),
            ...vals,
          })),
      );
    }).finally(() => setLoading(false));
  }, []);

  const available  = summary?.bagsByStatus?.['AVAILABLE']    ?? 0;
  const reserved   = summary?.bagsByStatus?.['RESERVED']     ?? 0;
  const distributed = summary?.bagsByStatus?.['DISTRIBUTED'] ?? 0;
  const expired    = summary?.bagsByStatus?.['EXPIRED']      ?? 0;
  const totalBags  = available + reserved + distributed + expired || 1;
  const wastageRate = expired > 0 ? ((expired / totalBags) * 100).toFixed(1) + '%' : '0%';
  const totalRes   = Object.values(summary?.reservationsByStatus ?? {}).reduce((s, n) => s + n, 0);

  const KPIS = [
    { label: 'Hôpitaux actifs',    value: loading ? '…' : String(summary?.totalHospitals ?? 0),   icon: 'domain',        color: 'text-secondary' },
    { label: 'Banques de sang',    value: loading ? '…' : String(summary?.totalBloodBanks ?? 0),  icon: 'water_drop',    color: 'text-primary' },
    { label: 'Poches disponibles', value: loading ? '…' : available.toLocaleString('fr'),         icon: 'inventory',     color: 'text-tertiary' },
    { label: 'Donneurs enregistrés', value: loading ? '…' : (summary?.totalDonors ?? 0).toLocaleString('fr'), icon: 'group', color: 'text-secondary' },
    { label: 'Taux de perte',      value: loading ? '…' : wastageRate,                            icon: 'recycling',     color: 'text-amber-600', alert: expired > 0 },
    { label: 'Total réservations', value: loading ? '…' : totalRes.toLocaleString('fr'),          icon: 'schedule',      color: 'text-secondary' },
  ];

  // Blood type available distribution for pie chart
  const availByType: Record<string, number> = {};
  for (const row of summary?.bagsByBloodType ?? []) {
    if (row.status === 'AVAILABLE') availByType[row.bloodType] = (availByType[row.bloodType] ?? 0) + row.count;
  }
  const piData = BT_ORDER
    .map((bt) => ({ name: bt, value: availByType[bt] ?? 0 }))
    .filter((b) => b.value > 0);

  return (
    <div>
      <TopBar title="Statistiques" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-8">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Statistiques & Analytiques</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Aperçu des performances du réseau national de sang</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {KPIS.map((k) => (
            <div key={k.label} className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border ${'alert' in k && k.alert ? 'border-primary/30' : 'border-outline-variant/10'}`}>
              <span className={`material-symbols-outlined text-[22px] ${k.color}`}>{k.icon}</span>
              <p className={`text-2xl font-extrabold font-headline mt-2 ${'alert' in k && k.alert ? 'text-primary' : 'text-on-surface'}`}>{k.value}</p>
              <p className="text-xs font-bold text-on-surface mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* Daily reservation trend */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-1">Tendance des réservations</h3>
            <p className="text-xs text-on-surface-variant mb-4">30 derniers jours</p>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
              </div>
            ) : trends.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-on-surface-variant">
                Pas encore de données sur 30 jours.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4beba30" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5b403d' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '10px', fontSize: 11 }} />
                  <Line type="monotone" dataKey="reservations" stroke="#af101a" strokeWidth={2} dot={false} name="Réservations" />
                  <Line type="monotone" dataKey="completed"    stroke="#006357" strokeWidth={2} dot={false} strokeDasharray="4" name="Livrées" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Blood type distribution */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-1">Mix groupes sanguins</h3>
            <p className="text-xs text-on-surface-variant mb-4">Poches disponibles</p>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
              </div>
            ) : piData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-on-surface-variant">Aucun stock disponible.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={piData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                      {piData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '10px', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {piData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                      <span className="text-[10px] text-on-surface-variant">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reservation breakdown by status */}
          <div className="col-span-12 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-6">Répartition par statut</h3>
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

          {/* Stock breakdown */}
          <div className="col-span-12 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-6">Stock par groupe sanguin (disponible)</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
              </div>
            ) : (
              <div className="space-y-4">
                {BT_ORDER.filter((bt) => availByType[bt] > 0).map((bt) => {
                  const count = availByType[bt] ?? 0;
                  const pct   = ((count / (available || 1)) * 100).toFixed(0);
                  return (
                    <div key={bt} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                        <span>{bt}</span>
                        <span>{count} poches · {pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {BT_ORDER.filter((bt) => availByType[bt] > 0).length === 0 && (
                  <p className="text-xs text-on-surface-variant text-center py-4">Aucun stock disponible.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
