/**
 * HEMOSAFE Service Worker
 *
 * Responsibilities:
 *   1. Background Sync — replay the sync queue when the browser
 *      regains connectivity, even if the app tab is closed.
 *   2. Offline shell caching — cache the app shell so the UI
 *      loads instantly and works without a network.
 *
 * Background Sync tag: 'hemosafe-sync'
 * The tag is registered by the app whenever it enqueues an operation.
 * The browser fires the 'sync' event when connectivity is confirmed.
 */

const CACHE_NAME   = 'hemosafe-shell-v1';
const SYNC_TAG     = 'hemosafe-sync';

// App shell assets to pre-cache (add built asset hashes in production)
const SHELL_URLS = ['/', '/auth/login', '/dashboard'];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  // Take control immediately without waiting for old SW to expire
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// ─── Fetch — network-first for API, cache-first for shell ────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls or external resources
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: serve shell from cache, fall back to network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }),
  );
});

// ─── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(triggerClientSync());
  }
});

/**
 * Tell the active app client to run its sync engine.
 * We post a message rather than re-implementing the sync logic here,
 * so that the single source of truth (sync-engine.ts) is always used.
 */
async function triggerClientSync() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

  if (clients.length > 0) {
    // App is open — delegate to the app's sync engine
    clients[0].postMessage({ type: 'HEMOSAFE_SYNC_REQUESTED' });
  } else {
    // App is closed — perform a minimal push using stored tokens
    await runBackgroundPush();
  }
}

/**
 * Minimal background push when no window is open.
 * Reads the auth token from IDB meta and calls the batch sync endpoint.
 */
async function runBackgroundPush() {
  // Open IndexedDB directly in the SW context
  let db;
  try {
    db = await openDB();
  } catch {
    return; // IDB not available
  }

  const tokenRow = await idbGet(db, 'meta', 'accessToken');
  if (!tokenRow) return;

  const ops = await idbGetAll(db, 'sync_queue');
  if (!ops.length) return;

  // Sort by priority then createdAt
  ops.sort((a, b) =>
    a.priority !== b.priority ? a.priority - b.priority : a.createdAt - b.createdAt,
  );

  // Best-effort batch call
  try {
    await fetch('/api/v1/sync/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenRow.value}`,
      },
      body: JSON.stringify({ operations: ops.slice(0, 20) }), // max 20 per batch
    });
  } catch {
    // Will retry on next Background Sync trigger
  }
}

// ─── Minimal IndexedDB helpers for SW context ─────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('hemosafe_v2', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbGet(db, storeName, key) {
  return new Promise((resolve) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => resolve(null);
  });
}

function idbGetAll(db, storeName) {
  return new Promise((resolve) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror   = () => resolve([]);
  });
}

// ─── Push notifications (future) ──────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'HEMOSAFE', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'HEMOSAFE', {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: payload.tag ?? 'hemosafe-notif',
      data: payload.data,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/dashboard/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    }),
  );
});
