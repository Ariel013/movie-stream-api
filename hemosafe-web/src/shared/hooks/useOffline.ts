'use client';

import { useEffect, useState, useCallback } from 'react';
import { fullSync, pendingCount, failedCount, SyncResult } from '../offline/sync-engine';

export interface OfflineState {
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  pendingOps: number;
  failedOps: number;
  /** Manually trigger a sync (push + pull). */
  sync: () => Promise<void>;
}

/**
 * Tracks network state and drives automatic sync on reconnect.
 *
 * SSR-safe: navigator.onLine is only read inside useEffect (client only).
 */
export function useOffline(): OfflineState {
  const [isOffline, setIsOffline]           = useState(false); // safe default for SSR
  const [isSyncing, setIsSyncing]           = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [pendingOps, setPendingOps]         = useState(0);
  const [failedOps, setFailedOps]           = useState(0);

  const refreshCounts = useCallback(async () => {
    setPendingOps(await pendingCount());
    setFailedOps(await failedCount());
  }, []);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await fullSync();
      setLastSyncResult(result);
      await refreshCounts();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshCounts]);

  useEffect(() => {
    // Initialize from real navigator.onLine (only runs client-side)
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      // Auto-sync when connectivity returns
      sync();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count refresh
    refreshCounts();

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync, refreshCounts]);

  return { isOffline, isSyncing, lastSyncResult, pendingOps, failedOps, sync };
}
