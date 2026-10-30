/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/// <reference lib="webworker" />

// Service Worker for Crypto Vision News PWA
// Version: 2.0.0

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// How long network-first requests wait before serving a cached copy
const NETWORK_TIMEOUT_MS = 10000;

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon.svg',
  '/icons/maskable-icon.svg',
  '/apple-touch-icon.svg',
];

// API endpoints to cache with network-first strategy
const API_ROUTES = [
  '/api/news',
  '/api/news/latest',
  '/api/news/breaking',
  '/api/news/bitcoin',
  '/api/news/trending',
  '/api/sources',
  '/api/market',
];

// Cache duration settings (in seconds)
const CACHE_DURATIONS = {
  api: 5 * 60,        // 5 minutes for API responses
  static: 7 * 24 * 60 * 60, // 7 days for static assets
  images: 30 * 24 * 60 * 60, // 30 days for images
  dynamic: 24 * 60 * 60, // 24 hours for dynamic content
};

// Maximum items per cache
const MAX_CACHE_ITEMS = {
  api: 200,
  dynamic: 500,
  images: 300,
};

// Service Worker global scope

// ============================================
// Installation
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      console.log('[SW] Caching static assets');
      
      // Cache static assets one by one to handle failures gracefully
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
          console.log(`[SW] Cached: ${asset}`);
        } catch (error) {
          console.warn(`[SW] Failed to cache: ${asset}`, error);
        }
      }
      
      // Do NOT auto-skipWaiting here so updates can be controlled
      // via the SKIP_WAITING message from UpdatePrompt
    })()
  );
});

// ============================================
// Activation
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
      
      await Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('[SW] Service worker activated and controlling all clients');
    })()
  );
});

// ============================================
// Fetch Handler
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests and GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }
  
  // Skip caching for high-frequency low-value API calls
  if (url.pathname.startsWith('/api/clickbait') || url.pathname.startsWith('/api/analytics')) {
    return;
  }

  // Skip Next.js internal router requests — RSC payloads are deployment-specific
  // and must not be served from cache (stale RSC payload → broken soft navigation).
  if (
    url.searchParams.has('_rsc') ||
    url.searchParams.has('_next_router_state_tree') ||
    url.searchParams.has('_next_router_prefetch')
  ) {
    return;
  }
  
  // Fallback response when a strategy throws unexpectedly
  const fallback = (status, msg) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // Route to appropriate strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE, CACHE_DURATIONS.api).catch(() =>
        fallback(503, 'Service unavailable'),
      ),
    );
  } else if (isImageRequest(request)) {
    event.respondWith(
      cacheFirstStrategy(request, IMAGE_CACHE, CACHE_DURATIONS.images).catch(() =>
        createPlaceholderImage(),
      ),
    );
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(
      cacheFirstStrategy(request, STATIC_CACHE, CACHE_DURATIONS.static).catch(() =>
        fallback(503, 'Asset unavailable'),
      ),
    );
  } else if (isNavigationRequest(request)) {
    event.respondWith(
      networkFirstWithOfflineFallback(request).catch(() =>
        fallback(503, 'Offline'),
      ),
    );
  } else {
    event.respondWith(
      staleWhileRevalidate(request, DYNAMIC_CACHE).catch(() =>
        fallback(503, 'Service unavailable'),
      ),
    );
  }
});

// ============================================
// Caching Strategies
// ============================================

/**
 * Network First Strategy
 * Try network, fall back to cache, update cache on success
 */
async function networkFirstStrategy(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  const hasFallback = !!cachedResponse && !isCacheExpired(cachedResponse, maxAge);

  try {
    const networkResponse = await fetchNetworkFirst(request, hasFallback);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      
      // Add timestamp header for cache expiration
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-timestamp', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });
      
      await cache.put(request, modifiedResponse);
      await trimCache(cacheName, MAX_CACHE_ITEMS.api);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    if (hasFallback) {
      return cachedResponse;
    }
    
    // Return a JSON error response for API requests
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. Please check your connection.',
        cached: !!cachedResponse,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache First Strategy
 * Try cache first, fall back to network
 */
async function cacheFirstStrategy(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isCacheExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      try {
        const cache = await caches.open(cacheName);

        const headers = new Headers(networkResponse.headers);
        headers.set('sw-cache-timestamp', Date.now().toString());

        const modifiedResponse = new Response(networkResponse.clone().body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers,
        });

        await cache.put(request, modifiedResponse);

        if (cacheName === IMAGE_CACHE) {
          await trimCache(cacheName, MAX_CACHE_ITEMS.images);
        }
      } catch {
        // Ignore caching errors (opaque responses, null bodies, etc.)
      }
    }

    return networkResponse;
  } catch (error) {
    // Return cached even if expired, better than nothing
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return placeholder for images
    if (isImageRequest(request)) {
      return createPlaceholderImage();
    }

    // Return a proper error response instead of rejecting the FetchEvent promise
    return new Response('Resource unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached immediately, update cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Serve from cache immediately; revalidate in the background (fire-and-forget).
    // The floating promise is intentionally detached — suppress its rejection so
    // Chrome does not report it as an uncaught promise rejection.
    fetch(request)
      .then(async (networkResponse) => {
        if (!networkResponse.ok) return;
        try {
          const headers = new Headers(networkResponse.headers);
          headers.set('sw-cache-timestamp', Date.now().toString());
          const modifiedResponse = new Response(networkResponse.clone().body, {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers,
          });
          await cache.put(request, modifiedResponse);
          await trimCache(cacheName, MAX_CACHE_ITEMS.dynamic);
        } catch {
          // Ignore caching errors (opaque responses, null bodies, etc.)
        }
      })
      .catch(() => {}); // intentional no-op — background revalidation failure is silent
    return cachedResponse;
  }

  // Nothing in cache — fetch from network and cache on success.
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      try {
        const headers = new Headers(networkResponse.headers);
        headers.set('sw-cache-timestamp', Date.now().toString());
        const modifiedResponse = new Response(networkResponse.clone().body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers,
        });
        await cache.put(request, modifiedResponse);
        await trimCache(cacheName, MAX_CACHE_ITEMS.dynamic);
      } catch {
        // Ignore caching errors (opaque responses, null bodies, etc.)
      }
    }
    return networkResponse;
  } catch {
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Network First with Offline Fallback
 * For navigation requests
 */
async function networkFirstWithOfflineFallback(request) {
  const cachedResponse = await caches.match(request);

  try {
    const networkResponse = await fetchNetworkFirst(request, !!cachedResponse);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, checking cache:', request.url);
    
    // Try to return cached page
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fall back to offline page
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Last resort: return a basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Crypto Vision News</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fff; }
          .container { text-align: center; padding: 2rem; }
          h1 { color: #f7931a; }
          button { background: #f7931a; color: #000; border: none; padding: 1rem 2rem; font-size: 1rem; cursor: pointer; border-radius: 8px; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📡 You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      </body>
      </html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  );
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/splash/') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.svg' ||
    pathname === '/browserconfig.xml' ||
    /\.(css|js|woff|woff2|ttf|eot)$/i.test(pathname)
  );
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isCacheExpired(response, maxAge) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return false;
  
  const age = (Date.now() - parseInt(timestamp, 10)) / 1000;
  return age > maxAge;
}

/**
 * Give up on a slow network only when a cached copy can be served instead.
 * Without one, wait it out: a cold server start can take longer than the
 * timeout, and aborting would show an offline page to an online user.
 */
function fetchNetworkFirst(request, hasFallback) {
  return hasFallback ? fetchWithTimeout(request, NETWORK_TIMEOUT_MS) : fetch(request);
}

async function fetchWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Remove oldest entries first
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
    if (toDelete.length > 5) {
      console.log(`[SW] Trimmed ${toDelete.length} items from ${cacheName}`);
    }
  }
}

function createPlaceholderImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#1a1a1a"/>
    <text x="100" y="100" fill="#666" text-anchor="middle" font-family="system-ui" font-size="14">Image unavailable</text>
  </svg>`;
  
  return new Response(svg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}

// ============================================
// Push Notifications
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New crypto news available!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'crypto-news',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/',
        ...data,
      },
      actions: [
        {
          action: 'open',
          title: 'Read More',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Crypto Vision News', options)
    );
  } catch (error) {
    console.error('[SW] Error processing push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(url);
          }
          return;
        }
      }
      
      // Open new window
      await self.clients.openWindow(url);
    })()
  );
});

// ============================================
// Background Sync
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-news') {
    event.waitUntil(syncNews());
  }
});

async function syncNews() {
  try {
    console.log('[SW] Syncing news in background...');
    
    // Pre-cache latest news
    const cache = await caches.open(API_CACHE);
    
    for (const route of API_ROUTES) {
      try {
        const response = await fetch(route);
        if (response.ok) {
          await cache.put(route, response);
        }
      } catch (error) {
        console.warn(`[SW] Failed to sync: ${route}`);
      }
    }
    
    console.log('[SW] Background sync complete');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// ============================================
// Periodic Background Sync
// ============================================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'update-news') {
    event.waitUntil(syncNews());
  }
});

// ============================================
// Message Handler
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls, payload.cacheName || DYNAMIC_CACHE));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload?.cacheName));
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then((status) => {
        event.ports[0]?.postMessage(status);
      }));
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function cacheUrls(urls, cacheName) {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn(`[SW] Failed to cache: ${url}`);
      }
    })
  );
}

async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
    console.log(`[SW] Cleared cache: ${cacheName}`);
  } else {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log('[SW] Cleared all caches');
  }
}

async function getCacheStatus() {
  const keys = await caches.keys();
  const status = {};
  let totalEntries = 0;
  
  for (const key of keys) {
    const cache = await caches.open(key);
    const entries = await cache.keys();
    status[key] = entries.length;
    totalEntries += entries.length;
  }
  
  return {
    caches: status,
    totalEntries,
    version: CACHE_VERSION,
  };
}

console.log('[SW] Service worker loaded');
