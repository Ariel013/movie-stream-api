'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useForm } from 'react-hook-form';
import api from '@/shared/lib/api';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

interface SearchResult {
  bankId: string;
  bankName: string;
  address: string;
  distanceKm: number;
  availableCount: number;
  bloodTypeLabel: string;
  lat: number;
  lng: number;
}

interface SearchForm {
  bloodTypeId: string;
  quantity: number;
  lat: number;
  lng: number;
  radiusKm: number;
}

// Mock results for UI demo
const MOCK_RESULTS: SearchResult[] = [
  { bankId: '1', bankName: 'City Central Blood Bank', address: '12 Avenue de la République', distanceKm: 2.4, availableCount: 14, bloodTypeLabel: 'O+', lat: 36.7, lng: 3.1 },
  { bankId: '2', bankName: 'Eastside Medical Storage', address: '8 Rue Ibn Khaldoun', distanceKm: 5.8, availableCount: 7, bloodTypeLabel: 'O+', lat: 36.73, lng: 3.15 },
  { bankId: '3', bankName: 'North Regional Blood Bank', address: '45 Boulevard Zighout Youcef', distanceKm: 9.1, availableCount: 3, bloodTypeLabel: 'O+', lat: 36.76, lng: 3.08 },
];

export default function BloodSearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBank, setSelectedBank] = useState<SearchResult | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SearchForm>({
    defaultValues: { quantity: 1, radiusKm: 50, lat: 36.7525, lng: 3.042 },
  });

  const onSearch = async (data: SearchForm) => {
    setLoading(true);
    try {
      const res = await api.post('/reservations/search', data);
      setResults(res.data.data);
    } catch {
      // Use mock data for demo
      setResults(MOCK_RESULTS);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div>
      <TopBar title="Blood Search" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        {/* Search form */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 ambient-shadow">
          <h2 className="text-xl font-extrabold text-on-surface font-headline mb-6">Find Available Blood</h2>
          <form onSubmit={handleSubmit(onSearch)} className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Blood Type</label>
              <select
                {...register('bloodTypeId', { required: true })}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Quantity (bags)</label>
              <input
                type="number"
                min={1}
                max={50}
                {...register('quantity', { required: true, min: 1, max: 50 })}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Search Radius (km)</label>
              <select
                {...register('radiusKm')}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[10, 25, 50, 100, 200].map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> Searching...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">search</span> Search</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="grid grid-cols-12 gap-6">
            {/* Results list */}
            <div className="col-span-12 lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-on-surface">{results.length} blood banks found</p>
                <span className="text-xs text-on-surface-variant">Sorted by proximity</span>
              </div>
              {results.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">search_off</span>
                  <p className="text-on-surface-variant mt-4 font-medium">No blood banks found in this area.</p>
                  <p className="text-xs text-on-surface-variant mt-1">Try increasing the search radius.</p>
                </div>
              ) : (
                results.map((r) => (
                  <div
                    key={r.bankId}
                    onClick={() => setSelectedBank(r)}
                    className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow cursor-pointer border-2 transition-all ${selectedBank?.bankId === r.bankId ? 'border-primary' : 'border-transparent hover:border-outline-variant'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined filled text-white text-[18px]">bloodtype</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface text-sm">{r.bankName}</h3>
                          <p className="text-[11px] text-on-surface-variant">{r.address}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded-full">
                        {r.availableCount} bags
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/10">
                      <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px]">distance</span>
                        {r.distanceKm} km away
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="text-xs font-bold text-primary gradient-primary text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Map placeholder */}
            <div className="col-span-12 lg:col-span-7">
              <div className="bg-surface-container-lowest rounded-3xl overflow-hidden ambient-shadow" style={{ height: '500px' }}>
                <div className="h-full flex flex-col items-center justify-center bg-surface-container-low">
                  <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30">map</span>
                  <p className="text-on-surface-variant font-medium mt-4">Interactive map loads here</p>
                  <p className="text-xs text-on-surface-variant/70 mt-1">Leaflet map with blood bank markers</p>
                  {selectedBank && (
                    <div className="mt-6 bg-surface-container-lowest rounded-2xl p-4 mx-8 text-center">
                      <p className="text-sm font-bold text-on-surface">{selectedBank.bankName}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{selectedBank.availableCount} bags · {selectedBank.distanceKm} km</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
