// Service Worker for VOLATILITY ANALYZER V.1.0
const CACHE_NAME = 'volatility-analyzer-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://raw.githubusercontent.com/Samday68/Foto-raflar/refs/heads/main/D354DBAF-3EC7-4B5F-ABC1-8EF876797DAA.jpeg',
  'https://raw.githubusercontent.com/Samday68/Foto-raflar/refs/heads/main/B3F65E6D-3FB0-45E3-A46A-7E788A46DEC7.jpeg'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip WebSocket connections
  if (event.request.url.startsWith('ws://') || event.request.url.startsWith('wss://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If network fails and no cache, return offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New market data available',
    icon: 'https://raw.githubusercontent.com/Samday68/Foto-raflar/refs/heads/main/D354DBAF-3EC7-4B5F-ABC1-8EF876797DAA.jpeg',
    badge: 'https://raw.githubusercontent.com/Samday68/Foto-raflar/refs/heads/main/D354DBAF-3EC7-4B5F-ABC1-8EF876797DAA.jpeg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Analyzer'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Volatility Analyzer', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'close') {
    notification.close();
  } else {
    event.waitUntil(
      clients.matchAll({
        type: 'window'
      }).then(clientList => {
        for (const client of clientList) {
          if (client.url === './' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
    );
  }
  notification.close();
});

// Function to sync data when back online
async function syncData() {
  // Implement data synchronization logic here
  console.log('Syncing data...');
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-market-data') {
      event.waitUntil(updateMarketData());
    }
  });
}

async function updateMarketData() {
  // Implement periodic data update
  console.log('Updating market data...');
}

// Message handling from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_NEW_ASSET') {
    caches.open(CACHE_NAME).then(cache => {
      cache.add(event.data.url);
    });
  }
});
