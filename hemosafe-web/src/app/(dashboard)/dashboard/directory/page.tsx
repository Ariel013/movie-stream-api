'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

type FacilityType = 'HOSPITAL' | 'BLOOD_BANK';

interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  region: { id: string; name: string; code: string };
}

export default function DirectoryPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<'ALL' | 'HOSPITAL' | 'BLOOD_BANK'>('ALL');
  const [search, setSearch]         = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/hospitals'),
      api.get('/blood-banks'),
    ]).then(([hRes, bRes]) => {
      const hospitals: Facility[] = (hRes.data.data ?? []).map((f: any) => ({ ...f, type: 'HOSPITAL' as const }));
      const banks: Facility[]     = (bRes.data.data ?? []).map((f: any) => ({ ...f, type: 'BLOOD_BANK' as const }));
      setFacilities([...hospitals, ...banks].sort((a, b) => a.name.localeCompare(b.name)));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = facilities.filter((f) => {
    if (tab !== 'ALL' && f.type !== tab) return false;
    const q = search.toLowerCase();
    if (q && !f.name.toLowerCase().includes(q) && !f.region.name.toLowerCase().includes(q) && !f.address.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div>
      <TopBar title="Annuaire" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Annuaire national</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Tous les hôpitaux et banques de sang enregistrés · {facilities.length} établissements
            </p>
          </div>
          {role === 'ADMIN' && (
            <button className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Ajouter un établissement
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
                {t === 'ALL' ? 'Tous' : t === 'HOSPITAL' ? 'Hôpitaux' : 'Banques de sang'}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              placeholder="Rechercher par nom ou région..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant/40">refresh</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((f) => (
              <div
                key={f.id}
                className={`bg-surface-container-lowest rounded-2xl p-6 ambient-shadow border ${f.isActive ? 'border-outline-variant/10' : 'border-outline-variant/30 opacity-70'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.type === 'BLOOD_BANK' ? 'gradient-primary' : 'bg-secondary/10'}`}>
                      <span className={`material-symbols-outlined filled text-[20px] ${f.type === 'BLOOD_BANK' ? 'text-white' : 'text-secondary'}`}>
                        {f.type === 'BLOOD_BANK' ? 'bloodtype' : 'local_hospital'}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${f.type === 'BLOOD_BANK' ? 'bg-error-container/50 text-primary' : 'bg-secondary-container/50 text-secondary'}`}>
                      {f.type === 'BLOOD_BANK' ? 'Banque de sang' : 'Hôpital'}
                    </span>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${f.isActive ? 'bg-tertiary animate-pulse' : 'bg-surface-dim'}`} title={f.isActive ? 'Actif' : 'Inactif'} />
                </div>

                <h3 className="font-bold text-on-surface mb-1">{f.name}</h3>
                <p className="text-xs text-on-surface-variant mb-4">{f.region.name} · {f.address}</p>

                <div className="space-y-2">
                  {f.phone && (
                    <a href={`tel:${f.phone}`} className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      {f.phone}
                    </a>
                  )}
                  {f.email && (
                    <a href={`mailto:${f.email}`} className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      {f.email}
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase ${f.isActive ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                    {f.isActive ? 'Actif' : 'Inactif'}
                  </span>
                  <button className="text-xs font-bold text-primary hover:underline">Voir détails</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] opacity-30">search_off</span>
                <p className="mt-4 font-medium">Aucun établissement trouvé.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
