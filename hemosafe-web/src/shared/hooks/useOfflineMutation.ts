'use client';

import { useState, useCallback } from 'react';
import api from '../lib/api';
import { enqueue, EnqueueOptions } from '../offline/sync-engine';

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error' | 'queued';

export interface UseOfflineMutationResult<TData, TInput> {
  mutate: (input: TInput) => Promise<TData | null>;
  status: MutationStatus;
  /** True when the mutation was saved locally but not yet synced. */
  isQueued: boolean;
  error: string | null;
  reset: () => void;
}

export interface UseOfflineMutationOptions<TData, TInput> {
  /** Online path: called when network is available. */
  onlineFn: (input: TInput) => Promise<TData>;
  /** Offline path: writes to IndexedDB and enqueues. Returns local data. */
  offlineFn: (input: TInput) => Promise<TData>;
  /** Called after successful online mutation (e.g. invalidate TanStack Query cache). */
  onSuccess?: (data: TData) => void;
  onError?: (err: string) => void;
}

/**
 * A mutation hook that transparently handles offline mode:
 *
 *   - Online  → calls onlineFn (normal API call)
 *   - Offline → calls offlineFn (write to IndexedDB + enqueue)
 *
 * The UI always receives an immediate result regardless of connectivity.
 *
 * Usage:
 *   const { mutate, status, isQueued } = useOfflineMutation({
 *     onlineFn: (input) => api.post('/reservations', input).then(r => r.data.data),
 *     offlineFn: (input) => createReservationOffline(input),
 *   });
 */
export function useOfflineMutation<TData, TInput>(
  options: UseOfflineMutationOptions<TData, TInput>,
): UseOfflineMutationResult<TData, TInput> {
  const [status, setStatus] = useState<MutationStatus>('idle');
  const [error, setError]   = useState<string | null>(null);
  const [isQueued, setIsQueued] = useState(false);

  const mutate = useCallback(async (input: TInput): Promise<TData | null> => {
    setStatus('loading');
    setError(null);
    setIsQueued(false);

    if (navigator.onLine) {
      try {
        const data = await options.onlineFn(input);
        setStatus('success');
        options.onSuccess?.(data);
        return data;
      } catch (err: unknown) {
        // If online but request fails, fall back to offline path
        const isNetworkError = !(err as { response?: unknown })?.response;
        if (isNetworkError) {
          return await handleOffline(input);
        }
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Request failed';
        setStatus('error');
        setError(typeof msg === 'string' ? msg : 'Unknown error');
        options.onError?.(typeof msg === 'string' ? msg : 'Unknown error');
        return null;
      }
    } else {
      return await handleOffline(input);
    }

    async function handleOffline(input: TInput): Promise<TData | null> {
      try {
        const data = await options.offlineFn(input);
        setStatus('queued');
        setIsQueued(true);
        return data;
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? 'Offline save failed';
        setStatus('error');
        setError(msg);
        return null;
      }
    }
  }, [options]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setIsQueued(false);
  }, []);

  return { mutate, status, isQueued, error, reset };
}

// ─── Convenience wrapper for simple enqueue-only mutations ───────────────────

/**
 * Wraps a standard API call with offline fallback via direct enqueue.
 * Use when you don't need local IndexedDB storage (e.g. simple status update).
 */
export function useSimpleOfflineMutation<TData>(enqueueOpts: (input: unknown) => EnqueueOptions) {
  return useOfflineMutation<TData, unknown>({
    onlineFn: async (input) => {
      const opts = enqueueOpts(input);
      const res = await api.request({ method: opts.method, url: opts.endpoint, data: opts.payload });
      return res.data.data as TData;
    },
    offlineFn: async (input) => {
      await enqueue(enqueueOpts(input));
      return input as TData;
    },
  });
}
