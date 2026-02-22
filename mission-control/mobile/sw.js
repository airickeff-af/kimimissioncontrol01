/**
 * Mission Control Service Worker
 * Provides offline caching, background sync, and push notifications
 */

const CACHE_NAME = 'mission-control-v1';
const STATIC_CACHE = 'mission-control-static-v1';
const DYNAMIC_CACHE = 'mission-control-dynamic-v1';
const SYNC_QUEUE = 'sync-queue';

// Assets to cache on install
const STATIC_ASSETS = [
  '/mission-control/mobile/',
  '/mission-control/mobile/index.html',
  '/mission-control/mobile/style.css',
  '/mission-control/mobile/app.js',
  '/mission-control/mobile/manifest.json',
  '/mission-control/mobile/icons/icon-72x72.png',
  '/mission-control/mobile/icons/icon-96x96.png',
  '/mission-control/mobile/icons/icon-128x128.png',
  '/mission-control/mobile/icons/icon-144x144.png',
  '/mission-control/mobile/icons/icon-152x152.png',
  '/mission-control/mobile/icons/icon-192x192.png',
  '/mission-control/mobile/icons/icon-384x384.png',
  '/mission-control/mobile/icons/icon-512x512.png'
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/dashboard/,
  /\/api\/tasks/,
  /\/api\/agents/,
  /\/api\/alerts/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching (except for API calls handled separately)
  if (request.method !== 'GET' && !url.pathname.startsWith('/api/')) {
    return;
  }
  
  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Static assets - cache first, network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Everything else - stale while revalidate
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Background sync event
self.addEventListener('sync', (event) => {
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  } else if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  } else if (event.tag === 'sync-actions') {
    event.waitUntil(syncQueuedActions());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Mission Control',
      body: event.data.text(),
      icon: '/mission-control/mobile/icons/icon-192x192.png',
      badge: '/mission-control/mobile/icons/icon-72x72.png'
    };
  }
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/mission-control/mobile/icons/icon-192x192.png',
    badge: data.badge || '/mission-control/mobile/icons/icon-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Mission Control', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  let targetUrl = '/mission-control/mobile/';
  
  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        targetUrl = notificationData.url || '/mission-control/mobile/#dashboard';
        break;
      case 'approve':
        // Handle approve action
        event.waitUntil(handleApproveAction(notificationData));
        return;
      case 'dismiss':
        // Just close the notification
        return;
      default:
        targetUrl = '/mission-control/mobile/';
    }
  } else if (notificationData.url) {
    targetUrl = notificationData.url;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes('/mission-control/mobile/') && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'QUEUE_ACTION':
      event.waitUntil(queueAction(payload));
      break;
      
    case 'GET_QUEUE_STATUS':
      event.waitUntil(
        getQueuedActions().then((queue) => {
          event.ports[0].postMessage({ queue });
        })
      );
      break;
      
    case 'CLEAR_QUEUE':
      event.waitUntil(clearQueue());
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls));
      break;
  }
});

// ====================
// Caching Strategies
// ====================

async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
    });
  
  return cached || fetchPromise;
}

// ====================
// Helper Functions
// ====================

function isStaticAsset(pathname) {
  const staticExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.svg', '.woff', '.woff2'];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error('[SW] Failed to cache URL:', url, error);
    }
  });
  await Promise.all(promises);
}

// ====================
// Background Sync
// ====================

async function queueAction(action) {
  const db = await openDB();
  const tx = db.transaction(SYNC_QUEUE, 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE);
  
  await store.add({
    ...action,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: Date.now(),
    retries: 0
  });
  
  // Register for background sync if available
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-actions');
  }
  
  return tx.complete;
}

async function getQueuedActions() {
  const db = await openDB();
  const tx = db.transaction(SYNC_QUEUE, 'readonly');
  const store = tx.objectStore(SYNC_QUEUE);
  return store.getAll();
}

async function clearQueue() {
  const db = await openDB();
  const tx = db.transaction(SYNC_QUEUE, 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE);
  await store.clear();
  return tx.complete;
}

async function syncQueuedActions() {
  const actions = await getQueuedActions();
  
  for (const action of actions) {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method || 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action.payload)
      });
      
      if (response.ok) {
        // Remove from queue
        const db = await openDB();
        const tx = db.transaction(SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(SYNC_QUEUE);
        await store.delete(action.id);
        await tx.complete;
        
        // Notify clients
        await notifyClients('ACTION_SYNCED', { actionId: action.id });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('[SW] Failed to sync action:', action.id, error);
      
      // Increment retry count
      if (action.retries < 3) {
        const db = await openDB();
        const tx = db.transaction(SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(SYNC_QUEUE);
        action.retries++;
        await store.put(action);
        await tx.complete;
      }
    }
  }
}

async function syncTasks() {
  // Sync pending task updates
  await syncQueuedActions();
}

async function syncAlerts() {
  // Sync alert acknowledgments
  await syncQueuedActions();
}

async function handleApproveAction(data) {
  // Handle quick approve from notification
  if (data.taskId) {
    await queueAction({
      type: 'APPROVE_TASK',
      endpoint: `/api/tasks/${data.taskId}/approve`,
      method: 'POST',
      payload: { approvedVia: 'notification' }
    });
  }
}

// ====================
// IndexedDB Helper
// ====================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MissionControlDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE)) {
        db.createObjectStore(SYNC_QUEUE, { keyPath: 'id' });
      }
    };
  });
}

// ====================
// Client Communication
// ====================

async function notifyClients(type, data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({
      type,
      data,
      timestamp: Date.now()
    });
  }
}

// ====================
// Periodic Background Sync (if supported)
// ====================

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-briefing') {
    event.waitUntil(sendDailyBriefing());
  }
});

async function sendDailyBriefing() {
  // Fetch daily summary and show notification
  try {
    const response = await fetch('/api/daily-briefing');
    const data = await response.json();
    
    await self.registration.showNotification('Daily Briefing', {
      body: `You have ${data.pendingTasks} pending tasks and ${data.criticalAlerts} critical alerts.`,
      icon: '/mission-control/mobile/icons/icon-192x192.png',
      badge: '/mission-control/mobile/icons/icon-72x72.png',
      tag: 'daily-briefing',
      requireInteraction: false
    });
  } catch (error) {
    console.error('[SW] Failed to send daily briefing:', error);
  }
}