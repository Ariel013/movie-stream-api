'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const MONTHLY = [
  { month: 'Oct', donations: 712, distributions: 680 },
  { month: 'Nov', donations: 830, distributions: 795 },
  { month: 'Dec', donations: 620, distributions: 605 },
  { month: 'Jan', donations: 940, distributions: 888 },
  { month: 'Feb', donations: 875, distributions: 841 },
  { month: 'Mar', donations: 410, distributions: 390 },
];

const DAILY_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  reservations: Math.floor(80 + Math.random() * 60),
}));

const BLOOD_DIST = [
  { name: 'O+', value: 32 }, { name: 'A+', value: 26 }, { name: 'B+', value: 18 },
  { name: 'AB+', value: 10 }, { name: 'O-', value: 6 }, { name: 'A-', value: 5 },
  { name: 'B-', value: 2 }, { name: 'AB-', value: 1 },
];
const COLORS = ['#af101a', '#d32f2f', '#e57373', '#ef9a9a', '#006357', '#4c616c', '#7ad7c6', '#b4cad6'];

const TOP_HOSPITALS = [
  { name: 'St. Mary General', reservations: 342, bags: 1204, avgTime: '3.2h', satisfaction: '94%' },
  { name: 'City Hospital', reservations: 287, bags: 956, avgTime: '4.1h', satisfaction: '91%' },
  { name: 'Riverside Clinic', reservations: 198, bags: 672, avgTime: '5.0h', satisfaction: '88%' },
  { name: 'Central Polyclinic', reservations: 154, bags: 508, avgTime: '4.7h', satisfaction: '89%' },
  { name: 'North Medical', reservations: 122, bags: 394, avgTime: '3.8h', satisfaction: '93%' },
];

const KPIS = [
  { label: 'Total Donations', value: '8,441', icon: 'favorite', sub: 'all time', color: 'text-primary' },
  { label: 'Total Distributions', value: '7,892', icon: 'local_shipping', sub: 'all time', color: 'text-tertiary' },
  { label: 'Active Donors', value: '1,247', icon: 'group', sub: 'registered', color: 'text-secondary' },
  { label: 'Wastage Rate', value: '2.1%', icon: 'recycling', sub: 'expired / total', color: 'text-amber-600' },
  { label: 'Avg Wait Time', value: '4.2h', icon: 'schedule', sub: 'reservation→pickup', color: 'text-secondary' },
  { label: 'Critical Events', value: '14', icon: 'warning', sub: 'this month', color: 'text-primary', alert: true },
];

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last year'];

export default function StatisticsPage() {
  const [range, setRange] = useState('Last 30 days');

  return (
    <div>
      <TopBar title="Statistics & Analytics" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-8">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Statistics & Analytics</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">National blood network performance overview</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl p-1 ambient-shadow">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${range === r ? 'gradient-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {KPIS.map((k) => (
            <div key={k.label} className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border ${(k as { alert?: boolean }).alert ? 'border-primary/30' : 'border-outline-variant/10'}`}>
              <span className={`material-symbols-outlined text-[22px] ${k.color}`}>{k.icon}</span>
              <p className={`text-2xl font-extrabold font-headline mt-2 ${(k as { alert?: boolean }).alert ? 'text-primary' : 'text-on-surface'}`}>{k.value}</p>
              <p className="text-xs font-bold text-on-surface mt-0.5">{k.label}</p>
              <p className="text-[10px] text-on-surface-variant">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Monthly donations vs distributions */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-1">Monthly Volume</h3>
            <p className="text-xs text-on-surface-variant mb-4">Donations vs distributions</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beba30" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '12px', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="donations" fill="#af101a" radius={[4, 4, 0, 0]} name="Donations" />
                <Bar dataKey="distributions" fill="#006357" radius={[4, 4, 0, 0]} name="Distributions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Blood type distribution */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-1">Blood Type Mix</h3>
            <p className="text-xs text-on-surface-variant mb-4">Demand distribution %</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={BLOOD_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                  {BLOOD_DIST.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '10px', fontSize: 11 }} formatter={(v) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-1 mt-2">
              {BLOOD_DIST.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <span className="text-[10px] text-on-surface-variant">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily reservation trend */}
          <div className="col-span-12 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-1">Daily Reservation Trend</h3>
            <p className="text-xs text-on-surface-variant mb-4">Past 30 days</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={DAILY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beba30" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5b403d' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '10px', fontSize: 11 }} />
                <Line type="monotone" dataKey="reservations" stroke="#af101a" strokeWidth={2} dot={false} name="Reservations" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top hospitals table */}
          <div className="col-span-12 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-4">Top Requesting Hospitals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="pb-3 text-left">Hospital</th>
                    <th className="pb-3 text-right">Reservations</th>
                    <th className="pb-3 text-right">Bags Consumed</th>
                    <th className="pb-3 text-right">Avg Response</th>
                    <th className="pb-3 text-right">Satisfaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {TOP_HOSPITALS.map((h, i) => (
                    <tr key={h.name} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full gradient-primary text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="font-medium text-on-surface">{h.name}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-on-surface">{h.reservations}</td>
                      <td className="py-3 text-right text-on-surface-variant">{h.bags}</td>
                      <td className="py-3 text-right text-on-surface-variant">{h.avgTime}</td>
                      <td className="py-3 text-right">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-tertiary">{h.satisfaction}</span>
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
