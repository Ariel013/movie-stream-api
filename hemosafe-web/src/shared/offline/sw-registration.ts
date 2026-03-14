/**
 * Service Worker registration + Background Sync helpers.
 * Call `registerServiceWorker()` once in the root layout (client-side only).
 */

const SYNC_TAG = 'hemosafe-sync';

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[SW] Registered:', registration.scope);

    // Listen for sync requests from the SW (when app was in background)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'HEMOSAFE_SYNC_REQUESTED') {
        import('./sync-engine').then(({ fullSync }) => fullSync());
      }
    });
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
  }
}

/**
 * Registers a Background Sync tag so the browser will fire the 'sync' event
 * when connectivity is available (even if the tab is closed).
 * Call this every time a new operation is enqueued.
 */
export async function requestBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    // Background Sync API may not be available in all browsers
    if ('sync' in reg) {
      await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
        .sync.register(SYNC_TAG);
    }
  } catch {
    // Background Sync not supported — the online event handler will cover it
  }
}
