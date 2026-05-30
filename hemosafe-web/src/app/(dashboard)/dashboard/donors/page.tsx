'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import api from '@/shared/lib/api';

interface Donor {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string | null;
  email: string | null;
  isEligible: boolean;
  ineligibilityReason: string | null;
  lastDonationAt: string | null;
  donationCount: number;
  bloodType: { label: string };
}

const STATUS_STYLE: Record<string, string> = {
  ELIGIBLE:   'bg-tertiary-fixed/40 text-tertiary',
  INELIGIBLE: 'bg-error-container text-on-error-container',
};

function getDonorStatus(d: Donor): string {
  return d.isEligible ? 'ELIGIBLE' : 'INELIGIBLE';
}

function calcAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

export default function DonorsPage() {
  const [donors, setDonors]             = useState<Donor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE'>('ALL');
  const [search, setSearch]             = useState('');
  const [showModal, setShowModal]       = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', phone: '', nationalId: '',
    bloodTypeId: '', aboGroup: 'O', rhFactor: 'POSITIVE',
  });
  const [bloodTypes, setBloodTypes]   = useState<{ id: string; label: string; aboGroup: string; rhFactor: string }[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/donors'),
      api.get('/blood-bags/types'),
    ]).then(([donorsRes, typesRes]) => {
      setDonors(donorsRes.data.data ?? []);
      setBloodTypes(typesRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = donors.filter((d) => {
    const status = getDonorStatus(d);
    if (statusFilter !== 'ALL' && status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !d.nationalId.toLowerCase().includes(q) && !`${d.firstName} ${d.lastName}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const eligible   = donors.filter((d) => d.isEligible).length;
  const ineligible = donors.length - eligible;

  const handleRegister = async () => {
    const bt = bloodTypes.find((t) => t.aboGroup === form.aboGroup && t.rhFactor === form.rhFactor);
    if (!bt) { setSubmitError('Groupe sanguin introuvable.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post('/donors', {
        nationalId:  form.nationalId,
        firstName:   form.firstName,
        lastName:    form.lastName,
        dob:         form.dob,
        phone:       form.phone || undefined,
        bloodTypeId: bt.id,
      });
      setDonors((prev) => [res.data.data, ...prev]);
      setShowModal(false);
      setForm({ firstName: '', lastName: '', dob: '', phone: '', nationalId: '', bloodTypeId: '', aboGroup: 'O', rhFactor: 'POSITIVE' });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitError(typeof msg === 'string' ? msg : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <TopBar title="Donneurs" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Gestion des donneurs</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Suivi et gestion des donneurs de sang</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Enregistrer un donneur
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total donneurs',   value: donors.length, icon: 'group',          color: 'text-secondary' },
            { label: 'Éligibles',        value: eligible,      icon: 'check_circle',   color: 'text-tertiary' },
            { label: 'Non éligibles',    value: ineligible,    icon: 'cancel',         color: 'text-primary'  },
            { label: 'Dons effectués',   value: donors.reduce((s, d) => s + d.donationCount, 0), icon: 'favorite', color: 'text-secondary' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border border-outline-variant/10 flex items-center gap-4">
              <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
              <div>
                <p className="text-2xl font-extrabold font-headline text-on-surface">{s.value}</p>
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
              placeholder="Rechercher par identifiant ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['ALL', 'ELIGIBLE', 'INELIGIBLE'] as const).map((s) => (
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
                  <th className="px-6 py-4 text-left">Identifiant</th>
                  <th className="px-6 py-4 text-left">Nom complet</th>
                  <th className="px-6 py-4 text-left">Groupe sanguin</th>
                  <th className="px-6 py-4 text-left">Âge</th>
                  <th className="px-6 py-4 text-left">Dernier don</th>
                  <th className="px-6 py-4 text-left">Nb. dons</th>
                  <th className="px-6 py-4 text-left">Statut</th>
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
                    <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">Aucun donneur trouvé.</td>
                  </tr>
                ) : filtered.map((d) => {
                  const status = getDonorStatus(d);
                  return (
                    <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{d.nationalId}</td>
                      <td className="px-6 py-4 font-medium text-on-surface">{d.firstName} {d.lastName}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 font-bold text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {d.bloodType.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{calcAge(d.dob)}</td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {d.lastDonationAt ? new Date(d.lastDonationAt).toLocaleDateString('fr-CI') : '—'}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{d.donationCount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLE[status]}`}>{status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-bold text-primary hover:underline">Voir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-on-surface font-headline">Enregistrer un donneur</h3>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">ID national</label>
                <input
                  value={form.nationalId}
                  onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
                  placeholder="NI-XXXX-XXX"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Prénom</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nom</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date de naissance</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+225 07 XX XX XX XX"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
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
              {submitError && <p className="text-xs text-error font-medium">{submitError}</p>}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-bold text-sm hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRegister}
                disabled={submitting || !form.firstName || !form.lastName || !form.dob || !form.nationalId}
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
