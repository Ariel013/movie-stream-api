'use client';

import { useOffline } from '@/shared/hooks/useOffline';
import clsx from 'clsx';

/**
 * Floating offline indicator widget.
 *
 * States:
 *   online + no pending   → invisible (unobtrusive)
 *   online + syncing      → blue "Syncing..." badge
 *   online + pending > 0  → amber "N pending" badge with Sync Now button
 *   offline               → red "Offline" banner with pending count
 *   failed > 0            → red badge "N failed — Action required"
 */
export function OfflineIndicator() {
  const { isOffline, isSyncing, pendingOps, failedOps, sync, lastSyncResult } = useOffline();

  const isVisible = isOffline || isSyncing || pendingOps > 0 || failedOps > 0;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {/* Failed ops alert */}
      {failedOps > 0 && (
        <div className="flex items-center gap-3 bg-error-container border border-primary/30 text-on-surface rounded-2xl px-4 py-3 shadow-xl ambient-shadow max-w-xs">
          <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">error</span>
          <div>
            <p className="text-xs font-bold text-on-surface">
              {failedOps} operation{failedOps > 1 ? 's' : ''} failed
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Action required — check logs</p>
          </div>
        </div>
      )}

      {/* Main offline / sync banner */}
      <div
        className={clsx(
          'glass rounded-2xl shadow-xl ambient-shadow border transition-all duration-300',
          'flex items-center gap-3 px-4 py-3',
          isOffline
            ? 'border-primary/30 bg-error-container/80'
            : isSyncing
              ? 'border-secondary/30 bg-secondary-container/60'
              : 'border-outline-variant/30 bg-surface-container-lowest/90',
        )}
      >
        {/* Status dot */}
        <div
          className={clsx(
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
            isOffline ? 'bg-primary animate-pulse' : isSyncing ? 'bg-secondary animate-pulse' : 'bg-amber-500 animate-pulse',
          )}
        />

        {/* Text */}
        <div className="min-w-0">
          {isOffline ? (
            <>
              <p className="text-xs font-bold text-on-surface">Offline mode</p>
              {pendingOps > 0 && (
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {pendingOps} action{pendingOps > 1 ? 's' : ''} queued
                </p>
              )}
            </>
          ) : isSyncing ? (
            <p className="text-xs font-bold text-on-surface">Syncing…</p>
          ) : (
            <>
              <p className="text-xs font-bold text-on-surface">
                {pendingOps} pending sync
              </p>
              {lastSyncResult && (
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Last: {lastSyncResult.succeeded} ok · {lastSyncResult.failed} err
                </p>
              )}
            </>
          )}
        </div>

        {/* Action button */}
        {!isOffline && !isSyncing && pendingOps > 0 && (
          <button
            onClick={sync}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface whitespace-nowrap"
          >
            Sync Now
          </button>
        )}

        {isSyncing && (
          <span className="material-symbols-outlined text-secondary text-[18px] animate-spin flex-shrink-0">
            refresh
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Inline sync status badge (for use inside page headers) ──────────────────

export function SyncBadge() {
  const { isOffline, isSyncing, pendingOps } = useOffline();

  if (!isOffline && !isSyncing && pendingOps === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-tertiary-container/10 text-tertiary rounded-full">
        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
        <span className="text-xs font-semibold">System Online</span>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container text-primary rounded-full">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-semibold">Offline{pendingOps > 0 ? ` · ${pendingOps} queued` : ''}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container text-secondary rounded-full">
        <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
        <span className="text-xs font-semibold">Syncing…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      <span className="text-xs font-semibold">{pendingOps} pending</span>
    </div>
  );
}
