'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';

type FacilityType = 'HOSPITAL' | 'BLOOD_BANK';

interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  city: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  totalBeds?: number;
  stockLevel?: number;
}

const MOCK: Facility[] = [
  { id: '1', name: 'St. Mary General Hospital', type: 'HOSPITAL', city: 'Algiers', address: '12 Rue Didouche Mourad', phone: '+213 21 23 45 67', email: 'contact@stmary.dz', isActive: true, totalBeds: 420 },
  { id: '2', name: 'City Central Blood Bank', type: 'BLOOD_BANK', city: 'Algiers', address: '8 Avenue Pasteur', phone: '+213 21 67 89 01', email: 'info@citycentral-bb.dz', isActive: true, stockLevel: 403 },
  { id: '3', name: 'Eastside Medical Storage', type: 'BLOOD_BANK', city: 'Oran', address: '45 Rue Ibn Khaldoun', phone: '+213 41 12 34 56', email: 'eastside@bb.dz', isActive: true, stockLevel: 187 },
  { id: '4', name: 'North Regional Blood Bank', type: 'BLOOD_BANK', city: 'Constantine', address: '3 Boulevard de l\'Indépendance', phone: '+213 31 56 78 90', email: 'north@bb.dz', isActive: true, stockLevel: 92 },
  { id: '5', name: 'Riverside Clinic', type: 'HOSPITAL', city: 'Oran', address: '22 Avenue des Frères Benali', phone: '+213 41 98 76 54', email: 'riverside@clinic.dz', isActive: true, totalBeds: 180 },
  { id: '6', name: 'Central Polyclinic', type: 'HOSPITAL', city: 'Annaba', address: '7 Rue du 1er Novembre', phone: '+213 38 11 22 33', email: 'central@poly.dz', isActive: false, totalBeds: 95 },
];

export default function DirectoryPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [tab, setTab] = useState<'ALL' | 'HOSPITAL' | 'BLOOD_BANK'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = MOCK.filter((f) => {
    if (tab !== 'ALL' && f.type !== tab) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <TopBar title="Directory" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">National Directory</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">All registered hospitals and blood banks</p>
          </div>
          {role === 'ADMIN' && (
            <button className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Register Facility
            </button>
          )}
        </div>

        {/* Tabs + search */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1">
            {(['ALL', 'HOSPITAL', 'BLOOD_BANK'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${tab === t ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {t === 'ALL' ? 'All' : t === 'HOSPITAL' ? 'Hospitals' : 'Blood Banks'}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              placeholder="Search by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <div key={f.id} className={`bg-surface-container-lowest rounded-2xl p-6 ambient-shadow border ${f.isActive ? 'border-outline-variant/10' : 'border-outline-variant/30 opacity-70'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.type === 'BLOOD_BANK' ? 'gradient-primary' : 'bg-secondary/10'}`}>
                    <span className={`material-symbols-outlined filled text-[20px] ${f.type === 'BLOOD_BANK' ? 'text-white' : 'text-secondary'}`}>
                      {f.type === 'BLOOD_BANK' ? 'bloodtype' : 'local_hospital'}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${f.type === 'BLOOD_BANK' ? 'bg-error-container/50 text-primary' : 'bg-secondary-container/50 text-secondary'}`}>
                      {f.type === 'BLOOD_BANK' ? 'Blood Bank' : 'Hospital'}
                    </span>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${f.isActive ? 'bg-tertiary animate-pulse' : 'bg-surface-dim'}`} title={f.isActive ? 'Active' : 'Inactive'} />
              </div>

              <h3 className="font-bold text-on-surface mb-1">{f.name}</h3>
              <p className="text-xs text-on-surface-variant mb-4">{f.city} · {f.address}</p>

              <div className="space-y-2">
                <a href={`tel:${f.phone}`} className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  {f.phone}
                </a>
                <a href={`mailto:${f.email}`} className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                  {f.email}
                </a>
                {f.type === 'BLOOD_BANK' && f.stockLevel !== undefined && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-[14px] text-primary">inventory_2</span>
                    <span className="font-bold text-primary">{f.stockLevel} bags available</span>
                  </div>
                )}
                {f.type === 'HOSPITAL' && f.totalBeds !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">bed</span>
                    {f.totalBeds} beds
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase ${f.isActive ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                  {f.isActive ? 'Active' : 'Inactive'}
                </span>
                <button className="text-xs font-bold text-primary hover:underline">View Details</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-30">search_off</span>
              <p className="mt-4 font-medium">No facilities found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
