'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';

interface StockItem {
  id: string;
  code: string;
  bloodType: string;
  aboGroup: string;
  rhFactor: string;
  volumeMl: number;
  status: 'AVAILABLE' | 'RESERVED' | 'DISTRIBUTED' | 'EXPIRED';
  expiresAt: string;
  donorCode: string;
  collectedAt: string;
}

const MOCK_STOCK: StockItem[] = [
  { id: '1', code: 'BAG-2024-001', bloodType: 'O+', aboGroup: 'O', rhFactor: 'POSITIVE', volumeMl: 450, status: 'AVAILABLE', expiresAt: '2026-03-28', donorCode: 'DON-1042', collectedAt: '2026-03-13' },
  { id: '2', code: 'BAG-2024-002', bloodType: 'A+', aboGroup: 'A', rhFactor: 'POSITIVE', volumeMl: 500, status: 'RESERVED', expiresAt: '2026-03-25', donorCode: 'DON-0831', collectedAt: '2026-03-12' },
  { id: '3', code: 'BAG-2024-003', bloodType: 'AB-', aboGroup: 'AB', rhFactor: 'NEGATIVE', volumeMl: 450, status: 'AVAILABLE', expiresAt: '2026-03-20', donorCode: 'DON-2210', collectedAt: '2026-03-11' },
  { id: '4', code: 'BAG-2024-004', bloodType: 'B+', aboGroup: 'B', rhFactor: 'POSITIVE', volumeMl: 350, status: 'AVAILABLE', expiresAt: '2026-03-16', donorCode: 'DON-0994', collectedAt: '2026-03-10' },
  { id: '5', code: 'BAG-2024-005', bloodType: 'O-', aboGroup: 'O', rhFactor: 'NEGATIVE', volumeMl: 450, status: 'EXPIRED', expiresAt: '2026-03-12', donorCode: 'DON-0455', collectedAt: '2026-03-05' },
  { id: '6', code: 'BAG-2024-006', bloodType: 'A-', aboGroup: 'A', rhFactor: 'NEGATIVE', volumeMl: 500, status: 'DISTRIBUTED', expiresAt: '2026-03-22', donorCode: 'DON-1873', collectedAt: '2026-03-08' },
];

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-tertiary-fixed/40 text-tertiary',
  RESERVED: 'bg-amber-100 text-amber-700',
  DISTRIBUTED: 'bg-secondary-container text-secondary',
  EXPIRED: 'bg-error-container text-on-error-container',
};

const SUMMARY = [
  { label: 'Available', count: 3, icon: 'check_circle', color: 'text-tertiary' },
  { label: 'Reserved', count: 1, icon: 'hourglass_top', color: 'text-amber-600' },
  { label: 'Distributed', count: 1, icon: 'local_shipping', color: 'text-secondary' },
  { label: 'Expired', count: 1, icon: 'cancel', color: 'text-primary' },
];

export default function StockPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = MOCK_STOCK.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (search && !s.code.toLowerCase().includes(search.toLowerCase()) && !s.bloodType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isExpiringSoon = (date: string) => {
    const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return daysLeft >= 0 && daysLeft <= 2;
  };

  return (
    <div>
      <TopBar title="Stock Management" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Blood Stock</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage blood bag inventory with FEFO ordering</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Register Blood Bag
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY.map((s) => (
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
              placeholder="Search by bag code or blood type..."
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
                  <th className="px-6 py-4 text-left">Bag Code</th>
                  <th className="px-6 py-4 text-left">Blood Type</th>
                  <th className="px-6 py-4 text-left">Volume</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Expires At</th>
                  <th className="px-6 py-4 text-left">Donor</th>
                  <th className="px-6 py-4 text-left">Collected</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((item) => (
                  <tr key={item.id} className={`hover:bg-surface-container-low/50 transition-colors ${item.status === 'EXPIRED' ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-on-surface">{item.code}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-on-surface">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {item.bloodType}
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
                        {item.expiresAt}
                        {isExpiringSoon(item.expiresAt) && (
                          <span className="ml-1.5 text-[9px] bg-error-container text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">Soon</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{item.donorCode}</td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{item.collectedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-xs font-bold text-primary hover:underline">View</button>
                        {item.status === 'AVAILABLE' && (
                          <button className="text-xs font-bold text-on-surface-variant hover:text-error hover:underline">Discard</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                      No stock items match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-on-surface font-headline">Register Blood Bag</h3>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
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
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Volume (mL)</label>
                <input type="number" defaultValue={450} className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Expiry Date</label>
                <input type="date" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Donor Code (optional)</label>
                <input type="text" placeholder="DON-XXXX" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-bold text-sm hover:bg-surface-container transition-colors">
                Cancel
              </button>
              <button className="flex-1 gradient-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                Register Bag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
