// CommKit Service Worker v1.0
// Caches core assets for offline use
// API calls always go to network (require connectivity)

const CACHE_NAME = 'commkit-v1';
const STATIC_CACHE = 'commkit-static-v1';
const DYNAMIC_CACHE = 'commkit-dynamic-v1';

// Core files to cache immediately on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/frameworks.html',
  '/manifest.json',
  '/offline.html',
  // Google Fonts - cached for offline use
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400;1,9..144,600&family=Cabinet+Grotesk:wght@300;400;500;700;800&display=swap',
];

// ── Install ──
self.addEventListener('install', event => {
  console.log('[CommKit SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[CommKit SW] Caching core assets');
        // Cache what we can, don't fail on font issues
        return Promise.allSettled(
          CORE_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn('[CommKit SW] Failed to cache:', url, err);
          }))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──
self.addEventListener('activate', event => {
  console.log('[CommKit SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => {
            console.log('[CommKit SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls always go to network. Never cache generated responses.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: true,
            message: 'No internet connection. Please connect to generate responses.'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Google Fonts — cache first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Core app files — cache first, fallback to network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Revalidate in background
        fetch(request).then(response => {
          if (response && response.status === 200) {
            caches.open(STATIC_CACHE).then(cache => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache — fetch and cache
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        // Offline fallback
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// ── Background sync for feedback ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncFeedback());
  }
});

async function syncFeedback() {
  // In production: send queued feedback to analytics when back online
  console.log('[CommKit SW] Syncing queued feedback...');
}

// ── Push notifications (future) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new CommKit insight',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'commkit-notification',
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open CommKit' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification('CommKit', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      const url = event.notification.data?.url || '/';
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
