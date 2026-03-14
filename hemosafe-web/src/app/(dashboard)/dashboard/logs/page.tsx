'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actor: string;
  actorRole: string;
  ip: string;
  createdAt: string;
  details?: string;
}

const MOCK_LOGS: AuditLog[] = [
  { id: '1', action: 'CREATE', entity: 'Reservation', entityId: 'RES-0041', actor: 'Dr. Amara Boulkroune', actorRole: 'HOSPITAL', ip: '192.168.1.42', createdAt: '2026-03-13 09:22:14', details: 'O+ × 4 bags' },
  { id: '2', action: 'UPDATE', entity: 'BloodBag', entityId: 'BAG-2024-003', actor: 'Julian Vance', actorRole: 'BLOOD_BANK', ip: '10.0.0.5', createdAt: '2026-03-13 09:18:02', details: 'Status → RESERVED' },
  { id: '3', action: 'DELETE', entity: 'BloodBag', entityId: 'BAG-2024-005', actor: 'System', actorRole: 'ADMIN', ip: '127.0.0.1', createdAt: '2026-03-13 03:00:00', details: 'Auto-expire cron job' },
  { id: '4', action: 'CREATE', entity: 'Donor', entityId: 'DON-2245', actor: 'Fatima Chaoui', actorRole: 'BLOOD_BANK', ip: '10.0.0.8', createdAt: '2026-03-13 08:45:30', details: 'New donor registered' },
  { id: '5', action: 'LOGIN', entity: 'User', entityId: 'USR-0012', actor: 'Admin User', actorRole: 'ADMIN', ip: '41.200.10.55', createdAt: '2026-03-13 08:30:00', details: 'Successful login' },
  { id: '6', action: 'UPDATE', entity: 'Reservation', entityId: 'RES-0039', actor: 'Julian Vance', actorRole: 'BLOOD_BANK', ip: '10.0.0.5', createdAt: '2026-03-13 08:12:55', details: 'Status PENDING → CONFIRMED' },
];

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-tertiary-fixed/40 text-tertiary',
  UPDATE: 'bg-secondary-container text-secondary',
  DELETE: 'bg-error-container text-on-error-container',
  LOGIN: 'bg-surface-container text-on-surface-variant',
  LOGOUT: 'bg-surface-container text-on-surface-variant',
};

export default function LogsPage() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const entities = ['ALL', ...Array.from(new Set(MOCK_LOGS.map((l) => l.entity)))];

  const filtered = MOCK_LOGS.filter((l) => {
    if (entityFilter !== 'ALL' && l.entity !== entityFilter) return false;
    if (search && !l.actor.toLowerCase().includes(search.toLowerCase()) && !l.entityId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <TopBar title="Audit Logs" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface font-headline">Audit Logs</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">Immutable record of all system actions</p>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 ambient-shadow flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              placeholder="Search by actor or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {entities.map((e) => (
              <button
                key={e}
                onClick={() => setEntityFilter(e)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${entityFilter === e ? 'gradient-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Log table */}
        <div className="bg-surface-container-lowest rounded-3xl ambient-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Timestamp</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Entity</th>
                  <th className="px-6 py-4 text-left">Entity ID</th>
                  <th className="px-6 py-4 text-left">Actor</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">IP</th>
                  <th className="px-6 py-4 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-mono">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-3 text-xs text-on-surface-variant whitespace-nowrap">{log.createdAt}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-sans ${ACTION_STYLES[log.action] ?? 'bg-surface-container text-on-surface-variant'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs font-sans font-medium text-on-surface">{log.entity}</td>
                    <td className="px-6 py-3 text-xs text-primary font-bold">{log.entityId}</td>
                    <td className="px-6 py-3 text-xs font-sans text-on-surface whitespace-nowrap">{log.actor}</td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] font-sans font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-on-surface-variant">{log.ip}</td>
                    <td className="px-6 py-3 text-xs font-sans text-on-surface-variant">{log.details ?? '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant font-sans">
                      No logs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
