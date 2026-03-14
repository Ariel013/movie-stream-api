'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';

type DonorStatus = 'ELIGIBLE' | 'DEFERRED' | 'INACTIVE';

interface Donor {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  bloodType: string;
  age: number;
  lastDonation: string;
  nextEligible: string;
  status: DonorStatus;
  phone: string;
}

const MOCK_DONORS: Donor[] = [
  { id: '1', code: 'DON-1042', firstName: 'Karim', lastName: 'Bensalem', bloodType: 'O+', age: 34, lastDonation: '2026-01-10', nextEligible: '2026-04-10', status: 'ELIGIBLE', phone: '+213 770 12 34 56' },
  { id: '2', code: 'DON-0831', firstName: 'Yasmine', lastName: 'Hadj-Ali', bloodType: 'A+', age: 28, lastDonation: '2026-02-20', nextEligible: '2026-05-20', status: 'ELIGIBLE', phone: '+213 661 98 76 54' },
  { id: '3', code: 'DON-2210', firstName: 'Mehdi', lastName: 'Touati', bloodType: 'AB-', age: 45, lastDonation: '2025-12-01', nextEligible: '2026-03-01', status: 'ELIGIBLE', phone: '+213 555 44 33 22' },
  { id: '4', code: 'DON-0994', firstName: 'Sarah', lastName: 'Benali', bloodType: 'B+', age: 31, lastDonation: '2026-03-01', nextEligible: '2026-06-01', status: 'DEFERRED', phone: '+213 779 88 77 66' },
  { id: '5', code: 'DON-0455', firstName: 'Nassim', lastName: 'Ferhat', bloodType: 'O-', age: 22, lastDonation: '2024-11-15', nextEligible: '2025-02-15', status: 'INACTIVE', phone: '+213 660 55 44 33' },
  { id: '6', code: 'DON-1873', firstName: 'Amina', lastName: 'Cherif', bloodType: 'A-', age: 39, lastDonation: '2026-02-10', nextEligible: '2026-05-10', status: 'ELIGIBLE', phone: '+213 770 99 88 77' },
];

const STATUS_STYLE: Record<DonorStatus, string> = {
  ELIGIBLE: 'bg-tertiary-fixed/40 text-tertiary',
  DEFERRED: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-surface-container text-on-surface-variant',
};

const SUMMARY = [
  { label: 'Total Donors', value: '1,247', icon: 'group', color: 'text-secondary' },
  { label: 'Active Donors', value: '892', icon: 'favorite', color: 'text-tertiary' },
  { label: 'This Month', value: '143', icon: 'calendar_month', color: 'text-primary' },
  { label: 'Eligible Now', value: '654', icon: 'check_circle', color: 'text-tertiary' },
];

export default function DonorsPage() {
  const [statusFilter, setStatusFilter] = useState<DonorStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = MOCK_DONORS.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !d.code.toLowerCase().includes(q) && !`${d.firstName} ${d.lastName}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div>
      <TopBar title="Donor Management" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Donor Management</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Track and manage blood donors</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Register Donor
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY.map((s) => (
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
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['ALL', 'ELIGIBLE', 'DEFERRED', 'INACTIVE'] as const).map((s) => (
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
                  <th className="px-6 py-4 text-left">Full Name</th>
                  <th className="px-6 py-4 text-left">Blood Type</th>
                  <th className="px-6 py-4 text-left">Age</th>
                  <th className="px-6 py-4 text-left">Last Donation</th>
                  <th className="px-6 py-4 text-left">Next Eligible</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{d.code}</td>
                    <td className="px-6 py-4 font-medium text-on-surface">{d.firstName} {d.lastName}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-on-surface">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {d.bloodType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{d.age}</td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{d.lastDonation}</td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{d.nextEligible}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_STYLE[d.status]}`}>{d.status}</span>
                    </td>
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

      {/* Register modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-on-surface font-headline">Register Donor</h3>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">First Name</label>
                  <input className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Last Name</label>
                  <input className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date of Birth</label>
                  <input type="date" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Gender</label>
                  <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">ABO Group</label>
                  <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {['O', 'A', 'B', 'AB'].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Rh Factor</label>
                  <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option>POSITIVE</option>
                    <option>NEGATIVE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Phone</label>
                <input type="tel" placeholder="+213 7XX XX XX XX" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Address</label>
                <input placeholder="Full address" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-bold text-sm hover:bg-surface-container transition-colors">Cancel</button>
              <button className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">Register Donor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
