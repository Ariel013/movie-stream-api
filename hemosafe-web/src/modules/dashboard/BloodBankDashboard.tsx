'use client';

import Link from 'next/link';
import { TopBar } from '@/shared/components/TopBar';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const stockLevels = [
  { name: 'O+', available: 142, reserved: 28, color: '#af101a' },
  { name: 'A+', available: 98, reserved: 14, color: '#d32f2f' },
  { name: 'B+', available: 76, reserved: 10, color: '#e57373' },
  { name: 'AB+', available: 34, reserved: 5, color: '#006357' },
  { name: 'O-', available: 19, reserved: 3, color: '#4c616c' },
  { name: 'A-', available: 22, reserved: 7, color: '#97f3e2' },
  { name: 'B-', available: 8, reserved: 2, color: '#b4cad6' },
  { name: 'AB-', available: 4, reserved: 1, color: '#7ad7c6' },
];

const weeklyInflow = [
  { day: 'Mon', donations: 24, distributed: 18 },
  { day: 'Tue', donations: 31, distributed: 22 },
  { day: 'Wed', donations: 18, distributed: 29 },
  { day: 'Thu', donations: 42, distributed: 35 },
  { day: 'Fri', donations: 38, distributed: 27 },
  { day: 'Sat', donations: 55, distributed: 20 },
  { day: 'Sun', donations: 12, distributed: 10 },
];

const pendingReservations = [
  { id: 'RES-0041', hospital: 'St. Mary General', bloodType: 'O+', qty: 4, urgency: 'EMERGENCY', createdAt: '3 min ago' },
  { id: 'RES-0039', hospital: 'Riverside Clinic', bloodType: 'AB-', qty: 2, urgency: 'ROUTINE', createdAt: '12 min ago' },
  { id: 'RES-0037', hospital: 'City Hospital', bloodType: 'A+', qty: 6, urgency: 'ROUTINE', createdAt: '28 min ago' },
];

const STATS = [
  { label: 'Total Stock', value: '403', icon: 'inventory_2', sub: 'bags available' },
  { label: "Today's Donations", value: '55', icon: 'favorite', sub: 'units collected' },
  { label: 'Pending Reservations', value: '12', icon: 'event_upcoming', sub: 'awaiting confirmation' },
  { label: 'Expiring Soon', value: '8', icon: 'warning', sub: 'within 48h', alert: true },
];

export function BloodBankDashboard() {
  return (
    <div>
      <TopBar title="Blood Bank Control" />

      <div className="p-8 max-w-[1400px] mx-auto space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border ${s.alert ? 'border-primary/30' : 'border-outline-variant/10'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-[22px] ${s.alert ? 'text-primary' : 'text-secondary'}`}>{s.icon}</span>
                {s.alert && <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
              </div>
              <p className={`text-3xl font-extrabold font-headline ${s.alert ? 'text-primary' : 'text-on-surface'}`}>{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
              <p className="text-[10px] text-on-surface-variant/70 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* Stock by blood type */}
          <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-on-surface font-headline">Current Stock</h3>
                <p className="text-xs text-on-surface-variant font-medium">By blood type</p>
              </div>
              <Link href="/dashboard/stock" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                Manage Stock
              </Link>
            </div>
            <div className="space-y-3">
              {stockLevels.map((s) => {
                const total = s.available + s.reserved;
                const pct = Math.round((s.available / Math.max(total, 1)) * 100);
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                        <span className="text-xs font-bold text-on-surface">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-on-surface font-bold">{s.available} avail.</span>
                        <span className="text-on-surface-variant">{s.reserved} reserved</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly area chart */}
          <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-on-surface font-headline">Weekly Flow</h3>
                <p className="text-xs text-on-surface-variant font-medium">Donations vs distributions</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyInflow}>
                <defs>
                  <linearGradient id="donations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#af101a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#af101a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="distributed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006357" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#006357" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beba30" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '12px', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="donations" stroke="#af101a" strokeWidth={2} fill="url(#donations)" name="Donations" />
                <Area type="monotone" dataKey="distributed" stroke="#006357" strokeWidth={2} fill="url(#distributed)" name="Distributed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pending reservations table */}
          <div className="col-span-12 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-on-surface font-headline">Pending Reservations</h3>
                <p className="text-xs text-on-surface-variant font-medium">Awaiting your confirmation</p>
              </div>
              <Link href="/dashboard/reservations" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="pb-3 text-left">Ref</th>
                    <th className="pb-3 text-left">Hospital</th>
                    <th className="pb-3 text-left">Blood Type</th>
                    <th className="pb-3 text-left">Qty</th>
                    <th className="pb-3 text-left">Urgency</th>
                    <th className="pb-3 text-left">Received</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {pendingReservations.map((r) => (
                    <tr key={r.id} className="group hover:bg-surface-container-low transition-colors">
                      <td className="py-4 font-mono text-xs font-bold text-on-surface">{r.id}</td>
                      <td className="py-4 font-medium text-on-surface">{r.hospital}</td>
                      <td className="py-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-bold text-on-surface">{r.bloodType}</span>
                        </span>
                      </td>
                      <td className="py-4 text-on-surface-variant font-medium">{r.qty} bags</td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${r.urgency === 'EMERGENCY' ? 'bg-error-container text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                          {r.urgency}
                        </span>
                      </td>
                      <td className="py-4 text-[11px] text-on-surface-variant">{r.createdAt}</td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-xs font-bold text-tertiary hover:underline">Confirm</button>
                          <button className="text-xs font-bold text-on-surface-variant hover:underline">Decline</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
