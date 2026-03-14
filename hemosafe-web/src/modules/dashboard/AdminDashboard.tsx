'use client';

import { TopBar } from '@/shared/components/TopBar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const operationalData = [
  { day: 'Mon', bags: 420, reservations: 38 },
  { day: 'Tue', bags: 380, reservations: 42 },
  { day: 'Wed', bags: 510, reservations: 55 },
  { day: 'Thu', bags: 475, reservations: 61 },
  { day: 'Fri', bags: 530, reservations: 48 },
  { day: 'Sat', bags: 290, reservations: 29 },
  { day: 'Sun', bags: 210, reservations: 18 },
];

const bloodTypeData = [
  { name: 'O+', value: 32 },
  { name: 'A+', value: 26 },
  { name: 'B+', value: 18 },
  { name: 'AB+', value: 10 },
  { name: 'O-', value: 6 },
  { name: 'A-', value: 5 },
  { name: 'B-', value: 2 },
  { name: 'AB-', value: 1 },
];

const BLOOD_COLORS = ['#af101a', '#d32f2f', '#e57373', '#ef9a9a', '#006357', '#4c616c', '#7ad7c6', '#b4cad6'];

const hospitalInflow = [
  { name: 'St. Mary', bags: 120 },
  { name: 'City Gen.', bags: 95 },
  { name: 'Eastside', bags: 78 },
  { name: 'North Med', bags: 64 },
  { name: 'Central', bags: 52 },
];

const recentActivity = [
  { id: 1, text: 'Reservation #9831 confirmed – O+ × 4 bags', time: '2 min ago', type: 'success' },
  { id: 2, text: 'Stock alert: AB- critically low at City Central', time: '8 min ago', type: 'error' },
  { id: 3, text: 'Transfer #447 dispatched – North Medical', time: '15 min ago', type: 'info' },
  { id: 4, text: 'New hospital registered: Riverside Clinic', time: '1 hr ago', type: 'info' },
  { id: 5, text: '14 bags expired – auto-discarded', time: '2 hr ago', type: 'warning' },
  { id: 6, text: 'Donor screening batch #203 completed', time: '3 hr ago', type: 'success' },
];

const STATS = [
  { label: 'Total Hospitals', value: '142', icon: 'local_hospital', color: 'text-secondary' },
  { label: 'Blood Banks', value: '38', icon: 'bloodtype', color: 'text-tertiary' },
  { label: 'Bags Available', value: '4,821', icon: 'inventory_2', color: 'text-primary' },
  { label: "Today's Reservations", value: '112', icon: 'event_upcoming', color: 'text-secondary' },
  { label: 'Expired Items', value: '14', icon: 'warning', color: 'text-primary', highlight: true },
];

const activityColors: Record<string, string> = {
  success: 'bg-tertiary',
  error: 'bg-primary',
  warning: 'bg-amber-500',
  info: 'bg-secondary',
};

export function AdminDashboard() {
  return (
    <div>
      <TopBar title="Admin Dashboard" />

      <div className="p-8 max-w-[1400px] mx-auto space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border ${s.highlight ? 'border-primary/30 bg-error-container/30' : 'border-outline-variant/10'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`material-symbols-outlined text-[22px] ${s.color}`}>{s.icon}</span>
                {s.highlight && (
                  <span className="text-[9px] font-bold text-primary bg-error-container px-2 py-0.5 rounded-full uppercase">Alert</span>
                )}
              </div>
              <p className={`text-3xl font-extrabold font-headline ${s.highlight ? 'text-primary' : 'text-on-surface'}`}>
                {s.value}
              </p>
              <p className="text-xs text-on-surface-variant mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Operational performance – line chart */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-on-surface font-headline">Operational Performance</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">Weekly bags & reservations</p>
              </div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-error-container/30 px-3 py-1 rounded-full">
                This Week
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={operationalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beba30" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '12px', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="bags" stroke="#af101a" strokeWidth={2.5} dot={false} name="Bags" />
                <Line type="monotone" dataKey="reservations" stroke="#006357" strokeWidth={2.5} dot={false} name="Reservations" />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Demand distribution – donut chart */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-1">Demand Distribution</h3>
            <p className="text-xs text-on-surface-variant font-medium mb-4">By blood type</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={bloodTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {bloodTypeData.map((_, i) => (
                    <Cell key={i} fill={BLOOD_COLORS[i % BLOOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '10px', fontSize: 11 }}
                  formatter={(v, n) => [`${v}%`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              {bloodTypeData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BLOOD_COLORS[i] }} />
                  <span className="text-[10px] text-on-surface-variant">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hospital inflow – bar chart */}
          <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <h3 className="font-extrabold text-on-surface font-headline mb-1">Hospital Inflow</h3>
            <p className="text-xs text-on-surface-variant font-medium mb-4">Top 5 requesting facilities</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hospitalInflow} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4beba30" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#5b403d' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e4beba', borderRadius: '10px', fontSize: 11 }}
                />
                <Bar dataKey="bags" fill="#af101a" radius={[0, 6, 6, 0]} name="Bags Requested" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity feed */}
          <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-on-surface font-headline">Recent Activity</h3>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest cursor-pointer hover:underline">View All</span>
            </div>
            <div className="space-y-5">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activityColors[item.type]}`} />
                  <div>
                    <p className="text-sm text-on-surface font-medium leading-snug">{item.text}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-bold uppercase">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
