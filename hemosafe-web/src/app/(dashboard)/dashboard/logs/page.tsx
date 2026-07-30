'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import api from '@/shared/lib/api';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  role: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
}

const ACTION_STYLES: Record<string, string> = {
  POST:   'bg-tertiary-fixed/40 text-tertiary',
  PATCH:  'bg-secondary-container text-secondary',
  PUT:    'bg-secondary-container text-secondary',
  DELETE: 'bg-error-container text-on-error-container',
};

function extractMethod(action: string): string {
  return action.split(' ')[0] ?? action;
}

const PAGE_SIZE = 10;

export default function LogsPage() {
  const [logs, setLogs]               = useState<AuditLog[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [entities, setEntities]       = useState<string[]>(['ALL']);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchLogs = () => {
    setLoading(true);
    api.get('/audit-logs', {
      params: {
        page,
        limit: PAGE_SIZE,
        ...(entityFilter !== 'ALL' && { entity: entityFilter }),
        ...(search.trim() && { search: search.trim() }),
      },
    })
      .then((res) => {
        const result = res.data.data;
        setLogs(result.data ?? []);
        setTotal(result.total ?? 0);
      })
      .catch(() => { setLogs([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter, search]);

  // Entity list fetched once, independent of pagination — so the filter pills
  // don't shift around as you page through the log (unlike deriving them from
  // whatever happens to be on the current page).
  useEffect(() => {
    api.get('/audit-logs/entities').then((res) => setEntities(['ALL', ...(res.data.data ?? [])]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [entityFilter, search]);

  return (
    <div>
      <TopBar title="Journaux d'audit" />
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface font-headline">Journaux d'audit</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">Enregistrement immuable de toutes les actions système</p>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 ambient-shadow flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              placeholder="Rechercher par acteur, entité ou action..."
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
                  <th className="px-6 py-4 text-left">Horodatage</th>
                  <th className="px-6 py-4 text-left">Méthode</th>
                  <th className="px-6 py-4 text-left">Entité</th>
                  <th className="px-6 py-4 text-left">ID entité</th>
                  <th className="px-6 py-4 text-left">Acteur</th>
                  <th className="px-6 py-4 text-left">Rôle</th>
                  <th className="px-6 py-4 text-left">IP</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center font-sans">
                      <span className="material-symbols-outlined animate-spin text-[24px] text-on-surface-variant/40">refresh</span>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant font-sans">
                      Aucun journal ne correspond à vos filtres.
                    </td>
                  </tr>
                ) : logs.map((log) => {
                  const method = extractMethod(log.action);
                  const actor  = log.user ? `${log.user.firstName} ${log.user.lastName}` : '—';
                  return (
                    <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('fr-CI')}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-sans ${ACTION_STYLES[method] ?? 'bg-surface-container text-on-surface-variant'}`}>
                          {method}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs font-sans font-medium text-on-surface">{log.entity}</td>
                      <td className="px-6 py-3 text-xs text-primary font-bold">{log.entityId ?? '—'}</td>
                      <td className="px-6 py-3 text-xs font-sans text-on-surface whitespace-nowrap">{actor}</td>
                      <td className="px-6 py-3">
                        <span className="text-[10px] font-sans font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                          {log.role ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-on-surface-variant">{log.ipAddress ?? '—'}</td>
                      <td className="px-6 py-3 text-xs font-sans text-on-surface-variant truncate max-w-[200px]" title={log.action}>
                        {log.action}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
              <p className="text-xs text-on-surface-variant">
                Page {page} sur {totalPages} · {total} résultat{total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
