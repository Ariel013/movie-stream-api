'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';

type PatientStatus = 'ACTIVE' | 'STABLE' | 'DISCHARGED';

interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  bloodType: string;
  diagnosis: string;
  physician: string;
  status: PatientStatus;
  admittedAt: string;
  critical?: boolean;
}

const MOCK: Patient[] = [
  { id: '1', code: 'PAT-0081', firstName: 'Omar', lastName: 'Mansour', bloodType: 'O+', diagnosis: 'Trauma — MVA', physician: 'Dr. Khalida Brahim', status: 'ACTIVE', admittedAt: '2026-03-12', critical: true },
  { id: '2', code: 'PAT-0079', firstName: 'Leila', lastName: 'Zerhouni', bloodType: 'A-', diagnosis: 'Anemia — Aplastic', physician: 'Dr. Rafik Boualem', status: 'ACTIVE', admittedAt: '2026-03-10' },
  { id: '3', code: 'PAT-0077', firstName: 'Abdelkader', lastName: 'Mokrani', bloodType: 'B+', diagnosis: 'GI Bleed', physician: 'Dr. Naima Slimani', status: 'STABLE', admittedAt: '2026-03-08' },
  { id: '4', code: 'PAT-0074', firstName: 'Sonia', lastName: 'Hadj-Youcef', bloodType: 'AB+', diagnosis: 'Post-op — Cardiac', physician: 'Dr. Khalida Brahim', status: 'STABLE', admittedAt: '2026-03-05' },
  { id: '5', code: 'PAT-0070', firstName: 'Rachid', lastName: 'Boukhari', bloodType: 'O-', diagnosis: 'Hemophilia A', physician: 'Dr. Rafik Boualem', status: 'DISCHARGED', admittedAt: '2026-02-28' },
];

const STATUS_STYLE: Record<PatientStatus, string> = {
  ACTIVE: 'bg-error-container text-primary',
  STABLE: 'bg-tertiary-fixed/40 text-tertiary',
  DISCHARGED: 'bg-surface-container text-on-surface-variant',
};

const SUMMARY = [
  { label: 'Total Patients', value: '324', icon: 'person', color: 'text-secondary' },
  { label: 'Active Cases', value: '87', icon: 'personal_injury', color: 'text-primary' },
  { label: 'Transfusions Today', value: '12', icon: 'bloodtype', color: 'text-tertiary' },
  { label: 'Critical', value: '5', icon: 'warning', color: 'text-primary', alert: true },
];

export default function PatientsPage() {
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = MOCK.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !p.code.toLowerCase().includes(q) && !`${p.firstName} ${p.lastName}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div>
      <TopBar title="Patient Registry" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Patient Registry</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Track transfusion patients and their blood needs</p>
          </div>
          <button className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Patient
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY.map((s) => (
            <div key={s.label} className={`bg-surface-container-lowest rounded-2xl p-5 ambient-shadow border ${(s as { alert?: boolean }).alert ? 'border-primary/30' : 'border-outline-variant/10'} flex items-center gap-4`}>
              <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
              <div>
                <p className={`text-2xl font-extrabold font-headline ${(s as { alert?: boolean }).alert ? 'text-primary' : 'text-on-surface'}`}>{s.value}</p>
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
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'STABLE', 'DISCHARGED'] as const).map((s) => (
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
                  <th className="px-6 py-4 text-left">Code</th>
                  <th className="px-6 py-4 text-left">Patient Name</th>
                  <th className="px-6 py-4 text-left">Blood Type</th>
                  <th className="px-6 py-4 text-left">Diagnosis</th>
                  <th className="px-6 py-4 text-left">Physician</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Admitted</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{p.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {p.critical && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                        <span className="font-medium text-on-surface">{p.firstName} {p.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-on-surface">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {p.bloodType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{p.diagnosis}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{p.physician}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{p.admittedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs font-bold text-primary hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
