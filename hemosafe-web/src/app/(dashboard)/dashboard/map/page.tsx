'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';

const BLOOD_BANKS = [
  { id: '1', name: 'City Central Blood Bank', address: '8 Avenue Pasteur, Algiers', distanceKm: 2.4, available: 403, status: 'online', lat: 36.7525, lng: 3.042 },
  { id: '2', name: 'Eastside Medical Storage', address: '45 Rue Ibn Khaldoun, Oran', distanceKm: 5.8, available: 187, status: 'online', lat: 35.697, lng: -0.625 },
  { id: '3', name: 'North Regional Blood Bank', address: '3 Bd de l\'Indépendance, Constantine', distanceKm: 9.1, available: 92, status: 'online', lat: 36.365, lng: 6.613 },
  { id: '4', name: 'Western Blood Centre', address: '12 Rue Larbi Tebessi, Tlemcen', distanceKm: 18.3, available: 55, status: 'low', lat: 34.878, lng: -1.315 },
  { id: '5', name: 'Southern Reserve Unit', address: '7 Route Nationale, Ghardaïa', distanceKm: 42.0, available: 28, status: 'critical', lat: 32.49, lng: 3.674 },
  { id: '6', name: 'Coastal Blood Bank', address: '4 Corniche, Annaba', distanceKm: 61.2, available: 143, status: 'online', lat: 36.897, lng: 7.748 },
];

const STATUS_DOT: Record<string, string> = {
  online: 'bg-tertiary animate-pulse',
  low: 'bg-amber-500 animate-pulse',
  critical: 'bg-primary animate-pulse',
};

const STATUS_LABEL: Record<string, string> = {
  online: 'Operational',
  low: 'Low Stock',
  critical: 'Critical',
};

export default function MapPage() {
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('ALL');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = BLOOD_BANKS.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedBank = BLOOD_BANKS.find((b) => b.id === selected);

  return (
    <div>
      <TopBar title="National Map" />
      <div className="flex h-[calc(100vh-64px)]">

        {/* Left panel */}
        <div className="w-80 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/10 flex flex-col">
          <div className="p-4 border-b border-outline-variant/10 space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                placeholder="Search blood banks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['ALL', 'O+', 'A+', 'B+', 'O-'].map((bt) => (
                <button
                  key={bt}
                  onClick={() => setBloodTypeFilter(bt)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${bloodTypeFilter === bt ? 'gradient-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-outline-variant/10">
            {filtered.map((bank) => (
              <div
                key={bank.id}
                onClick={() => setSelected(bank.id === selected ? null : bank.id)}
                className={`p-4 cursor-pointer transition-colors ${selected === bank.id ? 'bg-error-container/20 border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm text-on-surface leading-snug">{bank.name}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOT[bank.status]}`} />
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase">{STATUS_LABEL[bank.status]}</span>
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant mb-2">{bank.address}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">distance</span>
                    {bank.distanceKm} km
                  </span>
                  <span className={`text-[11px] font-bold ${bank.status === 'critical' ? 'text-primary' : bank.status === 'low' ? 'text-amber-600' : 'text-tertiary'}`}>
                    {bank.available} bags
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected bank detail */}
          {selectedBank && (
            <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low">
              <h3 className="font-bold text-sm text-on-surface mb-3">{selectedBank.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-surface-container-lowest rounded-lg p-2 text-center">
                  <p className="font-extrabold text-on-surface text-lg">{selectedBank.available}</p>
                  <p className="text-on-surface-variant">bags</p>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-2 text-center">
                  <p className="font-extrabold text-on-surface text-lg">{selectedBank.distanceKm}</p>
                  <p className="text-on-surface-variant">km away</p>
                </div>
              </div>
              <a href="/dashboard/blood-search" className="w-full gradient-primary text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-xs">
                <span className="material-symbols-outlined text-[16px]">search</span>
                Search & Reserve
              </a>
            </div>
          )}
        </div>

        {/* Map area */}
        <div className="flex-1 relative bg-surface-container-low flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-surface-container-lowest flex items-center justify-center mx-auto mb-4 ambient-shadow">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">map</span>
            </div>
            <p className="font-bold text-on-surface-variant">Interactive Leaflet Map</p>
            <p className="text-sm text-on-surface-variant/70 mt-1 max-w-xs">
              Blood bank locations with real-time stock indicators render here using react-leaflet + OpenStreetMap.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              {[
                { label: 'Operational', color: 'bg-tertiary' },
                { label: 'Low Stock', color: 'bg-amber-500' },
                { label: 'Critical', color: 'bg-primary' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <div className={`w-3 h-3 rounded-full ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Coordinate overlay for demo */}
          <div className="absolute top-4 right-4 bg-surface-container-lowest rounded-xl p-3 ambient-shadow text-xs text-on-surface-variant">
            <p className="font-bold text-on-surface mb-1">View Centre</p>
            <p>36.7525° N, 3.0420° E</p>
            <p className="mt-1">Zoom: 7 · {BLOOD_BANKS.length} markers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
