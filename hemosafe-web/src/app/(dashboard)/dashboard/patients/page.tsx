'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import api from '@/shared/lib/api';

interface Patient {
  id: string;
  nationalId: string | null;
  firstName: string;
  lastName: string;
  dob: string | null;
  medicalRecordNo: string | null;
  isActive: boolean;
  createdAt: string;
  bloodType: { label: string } | null;
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  return String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)));
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [showModal, setShowModal]   = useState(false);
  const [bloodTypes, setBloodTypes] = useState<{ id: string; label: string; aboGroup: string; rhFactor: string }[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', nationalId: '', medicalRecordNo: '', dob: '', aboGroup: 'O', rhFactor: 'POSITIVE' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/patients'),
      api.get('/blood-bags/types'),
    ]).then(([pRes, tRes]) => {
      setPatients(pRes.data.data ?? []);
      setBloodTypes(tRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    if (activeFilter === 'ACTIVE' && !p.isActive) return false;
    if (activeFilter === 'INACTIVE' && p.isActive) return false;
    const q = search.toLowerCase();
    if (q && !`${p.firstName} ${p.lastName}`.toLowerCase().includes(q) &&
        !(p.nationalId ?? '').toLowerCase().includes(q) &&
        !(p.medicalRecordNo ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  const handleAdd = async () => {
    const bt = bloodTypes.find((t) => t.aboGroup === form.aboGroup && t.rhFactor === form.rhFactor);
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post('/patients', {
        firstName:      form.firstName,
        lastName:       form.lastName,
        nationalId:     form.nationalId || undefined,
        medicalRecordNo: form.medicalRecordNo || undefined,
        dob:            form.dob || undefined,
        bloodTypeId:    bt?.id,
      });
      setPatients((prev) => [res.data.data, ...prev]);
      setShowModal(false);
      setForm({ firstName: '', lastName: '', nationalId: '', medicalRecordNo: '', dob: '', aboGroup: 'O', rhFactor: 'POSITIVE' });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitError(typeof msg === 'string' ? msg : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <TopBar title="Patients" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Registre des patients</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Suivi des patients nécessitant des transfusions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Ajouter un patient
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total patients', count: patients.length,                         icon: 'person',          color: 'text-secondary' },
            { label: 'Actifs',        count: patients.filter((p) => p.isActive).length, icon: 'personal_injury', color: 'text-primary' },
            { label: 'Inactifs',      count: patients.filter((p) => !p.isActive).length, icon: 'person_off',    color: 'text-on-surface-variant' },
          ].map((s) => (
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
              placeholder="Rechercher par nom, ID national ou dossier médical..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveFilter(s)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${activeFilter === s ? 'gradient-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
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
                  <th className="px-6 py-4 text-left">Dossier médical</th>
                  <th className="px-6 py-4 text-left">Nom complet</th>
                  <th className="px-6 py-4 text-left">Groupe sanguin</th>
                  <th className="px-6 py-4 text-left">Âge</th>
                  <th className="px-6 py-4 text-left">ID national</th>
                  <th className="px-6 py-4 text-left">Statut</th>
                  <th className="px-6 py-4 text-left">Enregistré le</th>
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
                    <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">Aucun patient trouvé.</td>
                  </tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{p.medicalRecordNo ?? '—'}</td>
                    <td className="px-6 py-4 font-medium text-on-surface">{p.firstName} {p.lastName}</td>
                    <td className="px-6 py-4">
                      {p.bloodType ? (
                        <span className="flex items-center gap-1.5 font-bold text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {p.bloodType.label}
                        </span>
                      ) : <span className="text-on-surface-variant text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{calcAge(p.dob)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{p.nationalId ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${p.isActive ? 'bg-tertiary-fixed/40 text-tertiary' : 'bg-surface-container text-on-surface-variant'}`}>
                        {p.isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {new Date(p.createdAt).toLocaleDateString('fr-CI')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs font-bold text-primary hover:underline">Voir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-on-surface font-headline">Ajouter un patient</h3>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
              </button>
            </div>
            <div className="space-y-4">
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
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">ID national</label>
                  <input
                    value={form.nationalId}
                    onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
                    placeholder="NI-XXXX"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">N° dossier médical</label>
                  <input
                    value={form.medicalRecordNo}
                    onChange={(e) => setForm((f) => ({ ...f, medicalRecordNo: e.target.value }))}
                    placeholder="MRN-XXXXX"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date de naissance</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                onClick={handleAdd}
                disabled={submitting || !form.firstName || !form.lastName}
                className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
              >
                {submitting ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
