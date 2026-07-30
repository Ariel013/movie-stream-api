'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TopBar } from '@/shared/components/TopBar';
import api from '@/shared/lib/api';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-surface-container-low">
      <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant/40">refresh</span>
    </div>
  ),
});

interface BankOverview {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  availableCount: number;
  stockByType: Record<string, number>;
}

interface Bank extends BankOverview {
  status: 'online' | 'low' | 'critical';
}

const BT_ORDER = ['ALL', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const STATUS_DOT: Record<string, string> = {
  online: 'bg-tertiary animate-pulse',
  low: 'bg-amber-500 animate-pulse',
  critical: 'bg-primary animate-pulse',
};

const STATUS_LABEL: Record<string, string> = {
  online: 'Stock correct',
  low: 'Stock faible',
  critical: 'Stock critique',
};

// Mêmes seuils que le tableau de bord banque de sang, pour rester cohérent
// dans toute l'application.
function statusFor(count: number): Bank['status'] {
  if (count >= 50) return 'online';
  if (count >= 20) return 'low';
  return 'critical';
}

export default function MapPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('ALL');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api.get('/reservations/network-map')
      .then((res) => {
        const rows: BankOverview[] = res.data.data ?? [];
        setBanks(rows.map((b) => ({ ...b, status: statusFor(b.availableCount) })));
      })
      .catch(() => setError('Impossible de charger le réseau de banques de sang.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = banks.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (bloodTypeFilter !== 'ALL' && (b.stockByType[bloodTypeFilter] ?? 0) <= 0) return false;
    return true;
  });

  const selectedBank = banks.find((b) => b.id === selected);

  return (
    <div>
      <TopBar title="Carte nationale" />
      <div className="flex h-[calc(100vh-64px)]">

        {/* Left panel */}
        <div className="w-[420px] flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/10 flex flex-col">
          <div className="p-4 border-b border-outline-variant/10 space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                placeholder="Rechercher une banque de sang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {BT_ORDER.map((bt) => (
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
            {loading && (
              <div className="flex justify-center py-10">
                <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
              </div>
            )}

            {!loading && error && (
              <p className="p-4 text-xs text-primary text-center">{error}</p>
            )}

            {!loading && !error && filtered.length === 0 && (
              <p className="p-4 text-xs text-on-surface-variant text-center">
                Aucune banque de sang ne correspond à vos filtres.
              </p>
            )}

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
                <div className="flex items-center justify-end">
                  <span className={`text-[11px] font-bold ${bank.status === 'critical' ? 'text-primary' : bank.status === 'low' ? 'text-amber-600' : 'text-tertiary'}`}>
                    {bank.availableCount} poches
                    {bloodTypeFilter !== 'ALL' && ` (${bank.stockByType[bloodTypeFilter] ?? 0} en ${bloodTypeFilter})`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected bank detail */}
          {selectedBank && (
            <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low">
              <h3 className="font-bold text-sm text-on-surface mb-3">{selectedBank.name}</h3>
              <div className="grid grid-cols-4 gap-1.5 text-xs mb-4">
                {Object.entries(selectedBank.stockByType).map(([type, count]) => (
                  <div key={type} className="bg-surface-container-lowest rounded-lg p-2 text-center">
                    <p className="font-extrabold text-on-surface text-sm">{count}</p>
                    <p className="text-on-surface-variant text-[10px]">{type}</p>
                  </div>
                ))}
              </div>
              <a href="/dashboard/blood-search" className="w-full gradient-primary text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-xs">
                <span className="material-symbols-outlined text-[16px]">search</span>
                Rechercher & Réserver
              </a>
            </div>
          )}
        </div>

        {/* Map area — explicit height required for Leaflet to render */}
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 64px)' }}>
          <LeafletMap
            banks={filtered.map((b) => ({
              id: b.id, name: b.name, address: b.address,
              available: b.availableCount, status: b.status, lat: b.lat, lng: b.lng,
            }))}
            selectedId={selected}
            onSelect={(id) => setSelected(id === selected ? null : id)}
          />

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-xl p-3 shadow text-xs text-gray-600 flex items-center gap-4">
            {[
              { label: 'Stock correct (≥50)', color: 'bg-tertiary' },
              { label: 'Stock faible (≥20)',   color: 'bg-amber-500' },
              { label: 'Stock critique (<20)', color: 'bg-primary' },
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
