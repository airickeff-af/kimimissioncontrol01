/**
 * Service Worker for Dashboard Caching
 * Implements aggressive caching strategy for static assets
 */

const CACHE_NAME = 'mission-control-v1';
const STATIC_CACHE = 'mc-static-v1';
const DYNAMIC_CACHE = 'mc-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/mission-control/dashboard/',
    '/mission-control/dashboard/index.html',
    '/mission-control/dashboard/css/critical.css',
    '/mission-control/dashboard/js/dashboard-optimizer.js',
    '/mission-control/dashboard/hq.html',
    '/mission-control/dashboard/token-tracker.html',
    '/mission-control/dashboard/task-board.html',
    '/mission-control/dashboard/data-viewer.html',
    '/mission-control/dashboard/logs-view.html'
];

// CDN resources to cache
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => console.log('[SW] Cache install error:', err))
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Strategy for HTML pages - Network first, fallback to cache
    if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Strategy for static assets - Cache first
    if (request.destination === 'style' || 
        request.destination === 'script' ||
        request.destination === 'font' ||
        request.destination === 'image') {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) {
                    // Return cached and update in background
                    fetch(request).then(response => {
                        caches.open(STATIC_CACHE).then(cache => {
                            cache.put(request, response);
                        });
                    }).catch(() => {});
                    return cached;
                }
                
                return fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(request, clone);
                    });
                    return response;
                });
            })
        );
        return;
    }
    
    // Default - Network with cache fallback
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});