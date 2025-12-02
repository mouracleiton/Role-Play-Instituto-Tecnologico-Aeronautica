/**
 * Service Worker for ITA RP Game
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'ita-rp-game-v2';
const DYNAMIC_CACHE = 'ita-rp-dynamic-v2';

// Get base path from service worker scope (handles GitHub Pages subdirectory)
const getBasePath = () => {
  const scope = self.registration?.scope || self.location.href;
  const url = new URL(scope);
  // Return pathname without trailing slash, then add it back
  return url.pathname.replace(/\/$/, '') + '/';
};

// Assets to cache on install (relative to base path)
const getStaticAssets = () => {
  const base = getBasePath();
  return [
    base,
    base + 'index.html',
    base + 'manifest.json',
    base + 'icons/icon-72x72.png',
    base + 'icons/icon-96x96.png',
    base + 'icons/icon-128x128.png',
    base + 'icons/icon-144x144.png',
    base + 'icons/icon-152x152.png',
    base + 'icons/icon-192x192.png',
    base + 'icons/icon-384x384.png',
    base + 'icons/icon-512x512.png',
  ];
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        const assets = getStaticAssets();
        console.log('[SW] Assets to cache:', assets);
        return cache.addAll(assets);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          // Update cache in background (stale-while-revalidate)
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const responseClone = networkResponse.clone();
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => cache.put(request, responseClone));
                }
              })
              .catch(() => {
                // Network failed, but we served from cache
              })
          );
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed and not in cache
            // Return offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match(getBasePath());
            }

            // Return empty response for other requests
            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-study-progress') {
    event.waitUntil(syncStudyProgress());
  }

  if (event.tag === 'sync-achievements') {
    event.waitUntil(syncAchievements());
  }
});

async function syncStudyProgress() {
  try {
    // Get pending sync data from IndexedDB
    const pendingData = await getPendingSyncData('study-progress');

    if (pendingData && pendingData.length > 0) {
      // In a real app, this would sync to a server
      console.log('[SW] Syncing study progress:', pendingData);

      // Clear pending data after successful sync
      await clearPendingSyncData('study-progress');
    }
  } catch (error) {
    console.error('[SW] Failed to sync study progress:', error);
    throw error; // Retry sync later
  }
}

async function syncAchievements() {
  try {
    const pendingData = await getPendingSyncData('achievements');

    if (pendingData && pendingData.length > 0) {
      console.log('[SW] Syncing achievements:', pendingData);
      await clearPendingSyncData('achievements');
    }
  } catch (error) {
    console.error('[SW] Failed to sync achievements:', error);
    throw error;
  }
}

// IndexedDB helpers for background sync
function getPendingSyncData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ita-rp-sync', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }

      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

function clearPendingSyncData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ita-rp-sync', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const base = getBasePath();
  let data = {
    title: 'ITA RP Game',
    body: 'Você tem uma notificação!',
    icon: base + 'icons/icon-192x192.png',
    badge: base + 'icons/icon-72x72.png',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || [],
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const base = getBasePath();

  // Handle action buttons
  if (event.action === 'study') {
    event.waitUntil(
      clients.openWindow(base + '?page=disciplines')
    );
    return;
  }

  if (event.action === 'challenges') {
    event.waitUntil(
      clients.openWindow(base + '?page=challenges')
    );
    return;
  }

  // Default: open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return clients.openWindow(base);
      })
  );
});

console.log('[SW] Service Worker loaded');
