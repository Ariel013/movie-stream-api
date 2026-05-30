'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

interface BloodType {
  id: string;
  label: string;
  aboGroup: string;
  rhFactor: string;
}

interface StockItem {
  id: string;
  code: string;
  volumeMl: number;
  status: 'AVAILABLE' | 'RESERVED' | 'DISTRIBUTED' | 'EXPIRED' | 'DISCARDED';
  expiresAt: string;
  collectedAt: string;
  bloodType: { label: string; aboGroup: string; rhFactor: string };
  donor: { id: string; firstName: string; lastName: string } | null;
}

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE:   'bg-tertiary-fixed/40 text-tertiary',
  RESERVED:    'bg-amber-100 text-amber-700',
  DISTRIBUTED: 'bg-secondary-container text-secondary',
  EXPIRED:     'bg-error-container text-on-error-container',
  DISCARDED:   'bg-surface-container text-on-surface-variant',
};

export default function StockPage() {
  const role = useAuthStore((s) => s.user?.role);

  const [bags, setBags]               = useState<StockItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch]           = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add form state
  const [bloodTypes, setBloodTypes]   = useState<BloodType[]>([]);
  const [form, setForm] = useState({
    code: '', aboGroup: 'O', rhFactor: 'POSITIVE', volumeMl: 450,
    collectedAt: new Date().toISOString().slice(0, 10),
    expiresAt: '',
  });
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchBags = () => {
    setLoading(true);
    api.get('/blood-bags', { params: { limit: 100 } })
      .then((res) => {
        const result = res.data.data;
        setBags(result.data ?? []);
        setTotal(result.total ?? 0);
      })
      .catch(() => { setBags([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBags();
    api.get('/blood-bags/types').then((res) => setBloodTypes(res.data.data ?? []));
  }, []);

  const filtered = bags.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !s.code.toLowerCase().includes(q) && !s.bloodType.label.toLowerCase().includes(q)) return false;
    return true;
  });

  const isExpiringSoon = (date: string) => {
    const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return daysLeft >= 0 && daysLeft <= 2;
  };

  const summary = [
    { label: 'Disponibles',  count: bags.filter((b) => b.status === 'AVAILABLE').length,   icon: 'check_circle',   color: 'text-tertiary' },
    { label: 'Réservées',    count: bags.filter((b) => b.status === 'RESERVED').length,     icon: 'hourglass_top',  color: 'text-amber-600' },
    { label: 'Distribuées',  count: bags.filter((b) => b.status === 'DISTRIBUTED').length,  icon: 'local_shipping', color: 'text-secondary' },
    { label: 'Expirées',     count: bags.filter((b) => b.status === 'EXPIRED').length,      icon: 'cancel',         color: 'text-primary' },
  ];

  const handleRegister = async () => {
    const bt = bloodTypes.find((t) => t.aboGroup === form.aboGroup && t.rhFactor === form.rhFactor);
    if (!bt) { setSubmitError('Groupe sanguin introuvable.'); return; }
    if (!form.code.trim()) { setSubmitError('Le code poche est requis.'); return; }
    if (!form.expiresAt) { setSubmitError('La date d\'expiration est requise.'); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/blood-bags', {
        code:         form.code.trim(),
        aboGroup:     form.aboGroup,
        rhFactor:     form.rhFactor,
        bloodTypeId:  bt.id,
        volumeMl:     form.volumeMl,
        collectedAt:  new Date(form.collectedAt).toISOString(),
        expiresAt:    new Date(form.expiresAt).toISOString(),
      });
      setShowAddModal(false);
      setForm({ code: '', aboGroup: 'O', rhFactor: 'POSITIVE', volumeMl: 450, collectedAt: new Date().toISOString().slice(0, 10), expiresAt: '' });
      fetchBags();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitError(typeof msg === 'string' ? msg : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <TopBar title="Gestion du stock" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Stock sanguin</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Inventaire des poches · {total} au total · FEFO
            </p>
          </div>
          {(role === 'BLOOD_BANK' || role === 'ADMIN') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Enregistrer une poche
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border border-outline-variant/10 flex items-center gap-4">
              <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
              <div>
                <p className="text-2xl font-extrabold font-headline text-on-surface">{s.count}</p>
                <p className="text-xs text-on-surface-variant">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 ambient-shadow flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              placeholder="Rechercher par code ou groupe sanguin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'AVAILABLE', 'RESERVED', 'DISTRIBUTED', 'EXPIRED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${statusFilter === s ? 'gradient-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-3xl ambient-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Code poche</th>
                  <th className="px-6 py-4 text-left">Groupe sanguin</th>
                  <th className="px-6 py-4 text-left">Volume</th>
                  <th className="px-6 py-4 text-left">Statut</th>
                  <th className="px-6 py-4 text-left">Expire le</th>
                  <th className="px-6 py-4 text-left">Donneur</th>
                  <th className="px-6 py-4 text-left">Collecté le</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">Aucune poche ne correspond à vos filtres.</td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className={`hover:bg-surface-container-low/50 transition-colors ${item.status === 'EXPIRED' ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{item.code}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-on-surface">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {item.bloodType.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{item.volumeMl} mL</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLE[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs ${isExpiringSoon(item.expiresAt) ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                        {new Date(item.expiresAt).toLocaleDateString('fr-CI')}
                        {isExpiringSoon(item.expiresAt) && (
                          <span className="ml-1.5 text-[9px] bg-error-container text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">Bientôt</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">
                      {item.donor ? `${item.donor.firstName} ${item.donor.lastName}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {new Date(item.collectedAt).toLocaleDateString('fr-CI')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-xs font-bold text-primary hover:underline">Voir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-on-surface font-headline">Enregistrer une poche</h3>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Code poche</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="BAG-2026-XXXXX"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Groupe ABO</label>
                  <select
                    value={form.aboGroup}
                    onChange={(e) => setForm((f) => ({ ...f, aboGroup: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {['O', 'A', 'B', 'AB'].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Rhésus</label>
                  <select
                    value={form.rhFactor}
                    onChange={(e) => setForm((f) => ({ ...f, rhFactor: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="POSITIVE">POSITIF</option>
                    <option value="NEGATIVE">NÉGATIF</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Volume (mL)</label>
                <input
                  type="number"
                  value={form.volumeMl}
                  onChange={(e) => setForm((f) => ({ ...f, volumeMl: Number(e.target.value) }))}
                  min={100}
                  max={600}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date de collecte</label>
                  <input
                    type="date"
                    value={form.collectedAt}
                    onChange={(e) => setForm((f) => ({ ...f, collectedAt: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date d'expiration</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              {submitError && <p className="text-xs text-error font-medium">{submitError}</p>}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-bold text-sm hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRegister}
                disabled={submitting}
                className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
