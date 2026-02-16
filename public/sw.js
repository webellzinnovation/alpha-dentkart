const CACHE_NAME = 'alpha-dentkart-v1';
const RUNTIME_CACHE = 'alpha-dentkart-runtime';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/Alpha-dentkart-logo-600p.png',
  '/Alpha-dentkart-logo-icon.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/brands/
];

// Network timeout for mobile optimization
const NETWORK_TIMEOUT = 5000;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external resources
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_CACHE_URLS.some(path => url.pathname === path)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle images with stale-while-revalidate strategy
  if (url.pathname.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default to network
  event.respondWith(
    fetchWithTimeout(request).catch(() => {
      // Return cached version if network fails
      return caches.match(request);
    })
  );
});

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    // Try network first with timeout
    const response = await fetchWithTimeout(request);
    
    // Cache successful responses
    if (response.ok) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('🌐 Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetchWithTimeout(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🌐 Cache miss and network failed:', request.url);
    throw error;
  }
}

// Stale-while-revalidate strategy for images
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh version
  const networkPromise = fetchWithTimeout(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    networkPromise; // Continue network request in background
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return networkPromise || new Response('Image not available', { status: 404 });
}

// Fetch with timeout for mobile optimization
function fetchWithTimeout(request, timeout = NETWORK_TIMEOUT) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync-products') {
    event.waitUntil(syncProducts());
  }
});

async function syncProducts() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const pendingRequests = await cache.keys().filter(key => 
      key.url.includes('/api/products') && key.url.includes('pending')
    );
    
    for (const request of pendingRequests) {
      try {
        await fetch(request);
        await cache.delete(request);
        console.log('✅ Synced pending request:', request.url);
      } catch (error) {
        console.error('❌ Failed to sync:', request.url, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New update from Alpha Dentkart',
    icon: '/Alpha-dentkart-logo-icon.png',
    badge: '/Alpha-dentkart-logo-icon.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore Offers',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Alpha Dentkart', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Performance monitoring
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    const startTime = performance.now();
    
    event.waitUntil(
      (async () => {
        try {
          await fetch(event.request);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Log slow API calls
          if (duration > 1000) {
            console.log(`⚠️ Slow API call: ${event.request.url} took ${duration.toFixed(2)}ms`);
          }
        } catch (error) {
          console.error(`❌ API call failed: ${event.request.url}`, error);
        }
      })()
    );
  }
});