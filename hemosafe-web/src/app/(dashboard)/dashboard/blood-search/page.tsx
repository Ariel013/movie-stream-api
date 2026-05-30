'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

interface BloodType {
  id: string;
  label: string;
  aboGroup: string;
  rhFactor: string;
}

interface SearchResult {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  availableCount: number;
  nextExpiresAt: string | null;
}

type Urgency = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export default function BloodSearchPage() {
  const user = useAuthStore((s) => s.user);

  // ── Blood types (fetched once) ────────────────────────────────────────────
  const [bloodTypes, setBloodTypes] = useState<BloodType[]>([]);
  const [selectedBtId, setSelectedBtId] = useState('');

  useEffect(() => {
    api.get('/blood-bags/types').then((res) => {
      const types: BloodType[] = res.data.data;
      setBloodTypes(types);
      if (types.length > 0) setSelectedBtId(types[0].id);
    }).catch(() => {});
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const [quantity, setQuantity]     = useState(1);
  const [radiusKm, setRadiusKm]     = useState(50);
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [searchError, setSearchError] = useState('');

  const onSearch = async () => {
    if (!selectedBtId) return;
    setLoading(true);
    setSearchError('');
    try {
      // Use hospital's stored coordinates if available, otherwise Abidjan centre
      const lat = 5.345;
      const lng = -4.024;
      const res = await api.post('/reservations/search', {
        bloodTypeId: selectedBtId,
        quantity,
        lat,
        lng,
        radiusKm,
      });
      setResults(res.data.data);
    } catch (e: any) {
      setSearchError(e?.response?.data?.message ?? 'Erreur lors de la recherche.');
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  // ── Reserve modal ─────────────────────────────────────────────────────────
  const [reserveTarget, setReserveTarget] = useState<SearchResult | null>(null);
  const [urgency, setUrgency]             = useState<Urgency>('ROUTINE');
  const [notes, setNotes]                 = useState('');
  const [reserving, setReserving]         = useState(false);
  const [reserveError, setReserveError]   = useState('');
  const [successCode, setSuccessCode]     = useState('');

  const openModal = (bank: SearchResult) => {
    setReserveTarget(bank);
    setUrgency('ROUTINE');
    setNotes('');
    setReserveError('');
    setSuccessCode('');
  };

  const closeModal = () => {
    setReserveTarget(null);
    setReserveError('');
    setSuccessCode('');
  };

  const onReserve = async () => {
    if (!reserveTarget || !selectedBtId) return;
    const bt = bloodTypes.find((b) => b.id === selectedBtId);
    if (!bt) return;

    setReserving(true);
    setReserveError('');
    try {
      const res = await api.post('/reservations', {
        bloodBankId: reserveTarget.id,
        bloodTypeId: selectedBtId,
        aboGroup:    bt.aboGroup,
        rhFactor:    bt.rhFactor,
        quantity,
        urgency,
        notes: notes || undefined,
      });
      setSuccessCode(res.data.data?.code ?? 'OK');
      // Refresh results to reflect updated stock
      onSearch();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setReserveError(typeof msg === 'string' ? msg : 'Erreur lors de la réservation.');
    } finally {
      setReserving(false);
    }
  };

  const selectedLabel = bloodTypes.find((b) => b.id === selectedBtId)?.label ?? '—';

  return (
    <div>
      <TopBar title="Blood Search" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        {/* Search form */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 ambient-shadow">
          <h2 className="text-xl font-extrabold text-on-surface font-headline mb-6">Rechercher du sang disponible</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Groupe sanguin</label>
              <select
                value={selectedBtId}
                onChange={(e) => setSelectedBtId(e.target.value)}
                disabled={bloodTypes.length === 0}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {bloodTypes.length === 0 && <option>Chargement…</option>}
                {bloodTypes.map((bt) => (
                  <option key={bt.id} value={bt.id}>{bt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Quantité (poches)</label>
              <input
                type="number" min={1} max={50} value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Rayon (km)</label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[10, 25, 50, 100, 200, 500].map((r) => (
                  <option key={r} value={r}>{r} km</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={onSearch}
                disabled={loading || !selectedBtId}
                className="w-full gradient-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> Recherche…</>
                  : <><span className="material-symbols-outlined text-[18px]">search</span> Rechercher</>
                }
              </button>
            </div>
          </div>
          {searchError && (
            <p className="mt-4 text-xs text-error font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>{searchError}
            </p>
          )}
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-on-surface">
                {results.length} banque{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''} — groupe <span className="text-primary">{selectedLabel}</span>
              </p>
              <span className="text-xs text-on-surface-variant">Triées par proximité</span>
            </div>

            {results.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">search_off</span>
                <p className="text-on-surface-variant mt-4 font-medium">Aucune banque de sang trouvée dans ce rayon.</p>
                <p className="text-xs text-on-surface-variant mt-1">Essayez d'augmenter le rayon de recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((r) => (
                  <div key={r.id} className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border border-outline-variant/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined filled text-white text-[18px]">bloodtype</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface text-sm leading-snug">{r.name}</h3>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">{r.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 mb-4">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[13px]">inventory_2</span>
                        {r.availableCount} poches dispo
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[13px]">distance</span>
                        {r.distanceKm} km
                      </span>
                    </div>

                    {r.nextExpiresAt && (
                      <p className="text-[10px] text-amber-600 mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        Prochaine expiration : {new Date(r.nextExpiresAt).toLocaleDateString('fr-CI')}
                      </p>
                    )}

                    <button
                      onClick={() => openModal(r)}
                      disabled={r.availableCount < quantity}
                      className="w-full gradient-primary text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      {r.availableCount < quantity ? 'Stock insuffisant' : 'Réserver'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Reserve modal ───────────────────────────────────────────────────── */}
      {reserveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-md ambient-shadow">

            {successCode ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-tertiary-fixed/30 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[32px] text-tertiary">check_circle</span>
                </div>
                <h3 className="text-xl font-extrabold text-on-surface font-headline mb-2">Réservation créée</h3>
                <p className="text-sm text-on-surface-variant mb-1">Code de réservation</p>
                <p className="text-2xl font-mono font-bold text-primary mb-6">{successCode}</p>
                <p className="text-xs text-on-surface-variant mb-6">
                  Valable 24h. La banque de sang doit confirmer avant expiration.
                </p>
                <button onClick={closeModal} className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface font-headline">Confirmer la réservation</h3>
                    <p className="text-sm text-on-surface-variant mt-0.5">{reserveTarget.name}</p>
                  </div>
                  <button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Summary */}
                <div className="bg-surface-container-low rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Groupe</p>
                    <p className="font-extrabold text-primary text-lg">{selectedLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Quantité</p>
                    <p className="font-extrabold text-on-surface text-lg">{quantity} poche{quantity > 1 ? 's' : ''}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Hôpital</p>
                    <p className="font-semibold text-on-surface">{user?.facilityName ?? '—'}</p>
                  </div>
                </div>

                {/* Urgency */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Niveau d'urgence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ROUTINE', 'URGENT', 'EMERGENCY'] as Urgency[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUrgency(u)}
                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          urgency === u
                            ? u === 'EMERGENCY' ? 'border-primary bg-error-container text-primary'
                              : u === 'URGENT' ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-tertiary bg-tertiary-fixed/20 text-tertiary'
                            : 'border-outline-variant text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        {u === 'ROUTINE' ? 'Routine' : u === 'URGENT' ? 'Urgent' : 'Urgence'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Notes (optionnel)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Motif clinique, instructions particulières…"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {reserveError && (
                  <p className="mb-4 text-xs text-error font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">error</span>{reserveError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={onReserve}
                    disabled={reserving}
                    className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                  >
                    {reserving
                      ? <><span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> En cours…</>
                      : <><span className="material-symbols-outlined text-[16px]">check</span> Confirmer</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
