'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/shared/components/TopBar';
import api from '@/shared/lib/api';
import { useAuthStore } from '@/shared/store/auth.store';

interface NearbyBank {
  id: string;
  name: string;
  address: string;
  distance_m: number;
}

interface Reservation {
  id: string;
  code: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'EXPIRED' | 'CANCELLED';
  urgency: string;
  quantity: number;
  expiresAt: string;
  bloodType: { label: string };
  bloodBank: { name: string };
}

// Abidjan centre — fallback only, used when the hospital itself has no
// registered position yet (see the lat/lng-on-create fix; older facilities
// created before that fix may still be missing one).
const DEFAULT_LAT = 5.355;
const DEFAULT_LNG = -4.008;

export function HospitalDashboard() {
  const facilityId = useAuthStore((s) => s.user?.facilityId);
  const [nearbyBanks, setNearbyBanks] = useState<NearbyBank[]>([]);
  const [activeRes, setActiveRes]     = useState<Reservation[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const resolveOrigin = facilityId
      ? api.get(`/hospitals/${facilityId}`)
          .then((res) => {
            const h = res.data.data;
            return h?.lat != null && h?.lng != null
              ? { lat: h.lat, lng: h.lng }
              : { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
          })
          .catch(() => ({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }))
      : Promise.resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

    resolveOrigin.then((origin) => {
      Promise.all([
        api.get('/blood-banks/nearby', { params: { ...origin, radiusKm: 100 } }),
        api.get('/reservations'),
      ]).then(([banksRes, resRes]) => {
        setNearbyBanks((banksRes.data.data ?? []).slice(0, 3));
        const all: Reservation[] = resRes.data.data ?? [];
        setActiveRes(all.filter((r) => ['PENDING', 'CONFIRMED', 'DISPATCHED'].includes(r.status)));
      }).finally(() => setLoading(false));
    });
  }, [facilityId]);

  const isUrgent = (r: Reservation) =>
    r.urgency === 'EMERGENCY' || (new Date(r.expiresAt).getTime() - Date.now()) < 3 * 3600 * 1000;

  return (
    <div>
      <TopBar />

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-10">

        {/* Hero search */}
        <section className="relative bg-surface-container-low rounded-3xl p-10 overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold text-on-surface font-headline mb-2">Portail hospitalier</h2>
            <p className="text-on-surface-variant mb-8 font-medium">Accès en temps réel au réseau national de sang.</p>
            <div className="flex flex-col md:flex-row gap-3 bg-surface-container-lowest p-3 rounded-2xl shadow-xl shadow-primary/5">
              <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <span className="material-symbols-outlined text-primary">search</span>
                <input
                  className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm font-medium placeholder:text-on-surface-variant/60"
                  placeholder="Rechercher un groupe sanguin ou composant..."
                  type="text"
                />
              </div>
              <Link
                href="/dashboard/blood-search"
                className="gradient-primary px-8 py-3 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                Rechercher
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none flex items-start justify-end pt-4 pr-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '300px', lineHeight: 1 }}>bloodtype</span>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-8">

          {/* Left column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">

            {/* Emergency Hub */}
            <div className="gradient-primary rounded-3xl p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <span className="material-symbols-outlined filled text-white">emergency</span>
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md">
                    <span className="text-[10px] font-bold tracking-widest uppercase">Haute priorité</span>
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold font-headline mb-2">Urgence</h3>
                <p className="text-white/80 text-sm mb-8 leading-relaxed">
                  Lancez une réservation d'urgence vers toutes les banques disponibles dans un rayon de 50 km.
                </p>
                <Link
                  href="/dashboard/blood-search"
                  className="w-full flex items-center justify-center gap-2 bg-white/20 border border-white/30 text-white font-bold py-3 rounded-2xl hover:bg-white/30 transition-colors text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">flash_on</span>
                  Réservation d'urgence
                </Link>
              </div>
              <span
                className="material-symbols-outlined absolute -bottom-10 -right-10 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-700"
                style={{ fontSize: '200px' }}
              >
                sensors
              </span>
            </div>

            {/* Stats summary */}
            <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-on-surface font-headline tracking-tight">Mes réservations</h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <span className="material-symbols-outlined animate-spin text-[20px] text-on-surface-variant/40">refresh</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'En attente',  count: activeRes.filter((r) => r.status === 'PENDING').length,    color: 'text-amber-600' },
                    { label: 'Confirmées',  count: activeRes.filter((r) => r.status === 'CONFIRMED').length,  color: 'text-tertiary' },
                    { label: 'Expédiées',   count: activeRes.filter((r) => r.status === 'DISPATCHED').length, color: 'text-secondary' },
                    { label: 'Actives',     count: activeRes.length,                                          color: 'text-on-surface' },
                  ].map((s) => (
                    <div key={s.label} className="bg-surface-container-lowest rounded-xl p-3 text-center">
                      <p className={`text-xl font-extrabold font-headline ${s.color}`}>{s.count}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/reservations" className="flex items-center justify-center gap-1 text-xs font-bold text-primary hover:underline pt-2">
                Voir toutes les réservations
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </Link>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* Nearby Banks */}
            <div className="bg-surface-container-low rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-on-surface font-headline tracking-tight">Banques à proximité</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Banques dans un rayon de 100 km</p>
                </div>
                <Link href="/dashboard/blood-search" className="bg-surface-container-lowest px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant/10 shadow-sm hover:bg-white transition-colors">
                  RECHERCHE AVANCÉE
                </Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
                </div>
              ) : nearbyBanks.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-8">Aucune banque à proximité.</p>
              ) : (
                <div className="space-y-3">
                  {nearbyBanks.map((bank) => (
                    <div key={bank.id} className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined filled text-white text-[22px]">bloodtype</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface">{bank.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full text-tertiary bg-tertiary-fixed/30">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Disponible
                            </span>
                            <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">distance</span>
                              {(bank.distance_m / 1000).toFixed(1)} km
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/blood-search`}
                        className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Reservations */}
            <div className="bg-surface-container-low rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-on-surface font-headline tracking-tight">Réservations actives</h3>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary-fixed animate-pulse" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    {activeRes.length} actives
                  </span>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
                </div>
              ) : activeRes.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-8">Aucune réservation active.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeRes.slice(0, 4).map((r) => {
                    const urgent = isUrgent(r);
                    return (
                      <div
                        key={r.id}
                        className={`bg-surface-container-lowest p-6 rounded-2xl border-l-4 shadow-sm relative overflow-hidden ${urgent ? 'border-primary' : 'border-surface-dim'}`}
                      >
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${urgent ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {r.code}
                              </p>
                              <p className="text-lg font-extrabold text-on-surface font-headline">{r.bloodType.label}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : r.status === 'CONFIRMED' ? 'bg-tertiary-fixed/40 text-tertiary' : 'bg-secondary-container text-secondary'}`}>
                              {r.status}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mb-4">{r.bloodBank.name}</p>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
                            <span className="text-xs font-medium text-on-surface-variant">{r.quantity} poche{r.quantity > 1 ? 's' : ''}</span>
                            <Link
                              href={`/dashboard/reservations/${r.id}`}
                              className={`text-xs font-bold underline underline-offset-4 ${urgent ? 'text-primary' : 'text-on-surface-variant'}`}
                            >
                              Détails
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
