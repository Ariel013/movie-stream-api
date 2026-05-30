'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TopBar } from '@/shared/components/TopBar';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-surface-container-low">
      <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant/40">refresh</span>
    </div>
  ),
});

const BLOOD_BANKS = [
  { id: '1', name: 'Centre National de Transfusion Sanguine', address: 'Bd de la Corniche, Abidjan (Plateau)', distanceKm: 0.0, available: 524, status: 'online', lat: 5.321,  lng: -4.017 },
  { id: '2', name: 'Banque de Sang CHU de Cocody',            address: 'Av. Christiani, Cocody, Abidjan',         distanceKm: 8.2,  available: 312, status: 'online', lat: 5.359,  lng: -3.988 },
  { id: '3', name: 'Banque de Sang CHU de Treichville',       address: 'Av. Giscard d\'Estaing, Treichville',    distanceKm: 4.1,  available: 178, status: 'online', lat: 5.296,  lng: -4.011 },
  { id: '4', name: 'Banque de Sang CHR de Bouaké',            address: 'Av. du Général de Gaulle, Bouaké',       distanceKm: 340,  available: 89,  status: 'low',    lat: 7.691,  lng: -5.031 },
  { id: '5', name: 'Banque de Sang CHR de San-Pédro',         address: 'Cité Bac, San-Pédro',                    distanceKm: 360,  available: 34,  status: 'critical', lat: 4.748, lng: -6.636 },
  { id: '6', name: 'Banque de Sang CHR de Korhogo',           address: 'Rue du Commerce, Korhogo',               distanceKm: 625,  available: 61,  status: 'low',    lat: 9.458,  lng: -5.629 },
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

        {/* Map area — explicit height required for Leaflet to render */}
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 64px)' }}>
          <LeafletMap
            banks={filtered}
            selectedId={selected}
            onSelect={(id) => setSelected(id === selected ? null : id)}
          />

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-xl p-3 shadow text-xs text-gray-600 flex items-center gap-4">
            {[
              { label: 'Operational', color: 'bg-tertiary' },
              { label: 'Low Stock',   color: 'bg-amber-500' },
              { label: 'Critical',    color: 'bg-primary' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
