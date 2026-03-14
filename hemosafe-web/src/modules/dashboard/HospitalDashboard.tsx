'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/shared/components/TopBar';

const nearbyBanks = [
  { id: '1', name: 'City Central Blood Bank', distance: '2.4 km', bloodType: 'A Positive', units: 12, status: 'available' },
  { id: '2', name: 'Eastside Medical Storage', distance: '5.8 km', bloodType: 'O Negative', units: 4, status: 'transit' },
  { id: '3', name: 'North Regional Bank', distance: '9.1 km', bloodType: 'B Positive', units: 7, status: 'available' },
];

const activeReservations = [
  { id: 'R-772-A', bloodType: 'AB NEGATIVE', qty: '450ml × 2', expiresIn: '14:22:05', urgent: true },
  { id: 'R-103-B', bloodType: 'O POSITIVE', qty: '500ml × 5', expiresIn: '02:15:58', urgent: false },
  { id: 'R-211-C', bloodType: 'A POSITIVE', qty: '350ml × 3', expiresIn: '08:41:12', urgent: false },
];

const alerts = [
  { type: 'success', title: 'Unit Dispatched', desc: 'Order #9822 (O+) is en route from City Central.', time: '2 mins ago' },
  { type: 'info', title: 'System Update', desc: 'Database sync scheduled for 03:00 AM.', time: '1 hour ago' },
  { type: 'warning', title: 'Reservation Expiring', desc: 'Unit B-22 expires in 45 minutes.', time: '2 hours ago' },
];

export function HospitalDashboard() {
  const [bloodType, setBloodType] = useState('O POSITIVE');

  return (
    <div>
      <TopBar title="Hospital Resource Portal" />

      <div className="p-8 max-w-[1400px] mx-auto space-y-8">

        {/* Hero search */}
        <section className="relative bg-surface-container-low rounded-3xl p-10 overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold text-on-surface font-headline mb-2">
              Hospital Resource Portal
            </h2>
            <p className="text-on-surface-variant mb-8 font-medium">
              Real-time inventory access across the National Blood Network.
            </p>
            <div className="flex flex-col md:flex-row gap-3 bg-surface-container-lowest p-3 rounded-2xl shadow-xl shadow-primary/5">
              <div className="flex-1 flex items-center gap-3 px-4 py-2 border-r border-outline-variant/20">
                <span className="material-symbols-outlined text-primary">search</span>
                <input
                  className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:text-on-surface-variant/60"
                  placeholder="Search blood types or components..."
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 border-r border-outline-variant/20 min-w-[160px]">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">water_drop</span>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-bold appearance-none cursor-pointer"
                >
                  {['O POSITIVE', 'O NEGATIVE', 'A POSITIVE', 'A NEGATIVE', 'B POSITIVE', 'B NEGATIVE', 'AB POSITIVE', 'AB NEGATIVE'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Link
                href="/dashboard/blood-search"
                className="gradient-primary px-8 py-3 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Find Now
              </Link>
            </div>
          </div>
          {/* Decorative icon */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '300px' }}>bloodtype</span>
          </div>
        </section>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            {/* Emergency hub */}
            <div className="gradient-primary rounded-3xl p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <span className="material-symbols-outlined filled text-white">emergency</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 bg-white/20 rounded-full backdrop-blur-md">
                    High Priority
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold font-headline mb-2">Emergency Hub</h3>
                <p className="text-white/80 text-sm mb-8 leading-relaxed">
                  Broadcast an urgent request to all available units in the 50 km radius.
                </p>
                <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/20">
                  <span className="font-bold text-sm">Signal Status</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-white/60 uppercase">Ready</span>
                    <div className="w-12 h-6 bg-white/20 rounded-full relative cursor-pointer p-1">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-white/10 group-hover:rotate-0 transition-transform duration-700" style={{ fontSize: '200px' }}>
                sensors
              </span>
            </div>

            {/* Recent alerts */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-on-surface font-headline">Recent Alerts</h3>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest cursor-pointer hover:underline">View All</span>
              </div>
              <div className="space-y-5">
                {alerts.map((a, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'success' ? 'bg-tertiary' : a.type === 'warning' ? 'bg-amber-500' : 'bg-surface-dim'}`} />
                    <div>
                      <p className="text-sm font-bold text-on-surface">{a.title}</p>
                      <p className="text-xs text-on-surface-variant">{a.desc}</p>
                      <p className={`text-[10px] font-bold mt-1 uppercase ${a.type === 'success' ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {a.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">

            {/* Nearby inventory */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-on-surface font-headline">Nearby Inventory</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Network nodes within 15 km</p>
                </div>
                <button className="bg-surface-container px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                  REFRESH MAP
                </button>
              </div>
              <div className="space-y-3">
                {nearbyBanks.map((bank) => (
                  <div key={bank.id} className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined filled text-white text-[20px]">bloodtype</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{bank.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full ${bank.status === 'available' ? 'text-tertiary bg-tertiary-fixed/30' : 'text-on-surface-variant bg-surface-dim/50'}`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {bank.status === 'available' ? 'check_circle' : 'local_shipping'}
                            </span>
                            {bank.status === 'available' ? 'Available' : 'In Transit'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">distance</span>
                            {bank.distance}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-on-surface uppercase">{bank.bloodType}</p>
                        <p className="text-[10px] text-on-surface-variant">{bank.units} Units Ready</p>
                      </div>
                      <Link
                        href={`/dashboard/blood-search?bankId=${bank.id}`}
                        className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active reservations */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-on-surface font-headline">Active Reservations</h3>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary-fixed animate-pulse" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    {activeReservations.length} Active Orders
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeReservations.map((r) => (
                  <div
                    key={r.id}
                    className={`bg-surface-container-low p-5 rounded-2xl border-l-4 ${r.urgent ? 'border-primary' : 'border-surface-dim'} relative overflow-hidden`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${r.urgent ? 'text-primary' : 'text-on-surface-variant'}`}>
                          Batch #{r.id}
                        </p>
                        <p className="text-base font-extrabold text-on-surface font-headline">{r.bloodType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Expires In</p>
                        <p className={`text-sm font-mono font-bold ${r.urgent ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {r.expiresIn}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                      <span className="text-xs font-medium text-on-surface-variant">Qty: {r.qty}</span>
                      <Link href={`/dashboard/reservations/${r.id}`} className={`text-xs font-bold underline underline-offset-4 ${r.urgent ? 'text-primary' : 'text-on-surface-variant'}`}>
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
