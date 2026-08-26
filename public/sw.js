const CACHE_NAME = 'kins-link-bio-v32';

// Small, stable shell assets only. Heavy media (new.png) is NOT precached —
// it competes with first-load bandwidth and is runtime-cached on first view.
const PRECACHE_ASSETS = [
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-maskable-192x192.png',
  './icon-maskable-512x512.png',
  './apple-touch-icon.png',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './favicon.ico',
  './followers.json'
];

// Same-origin path prefixes eligible for runtime caching.
// /api/ is deliberately excluded so authenticated responses are never cached.
// /tuner-worklet.js and /worklets/click-worklet.js make the tuner and
// metronome fully offline-capable (all audio DSP runs locally; the pages
// themselves cache via the network-first HTML handler).
const RUNTIME_CACHEABLE_PREFIXES = ['/_astro/', '/icons/', '/noise-tile.png', '/tuner-worklet.js', '/worklets/click-worklet.js'];

// Versioned third-party CDNs safe to cache-first (URLs change when versions bump).
const CDN_CACHE_RULES = [
  { host: 'fonts.googleapis.com', cacheName: 'kins-cdn-fonts-css-v1' },
  { host: 'fonts.gstatic.com', cacheName: 'kins-cdn-fonts-files-v1' },
  { host: 'cdnjs.cloudflare.com', cacheName: 'kins-cdn-cdnjs-v1' }
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          fetch(asset, { cache: 'no-cache' }).then((response) => {
            if (response.ok) {
              return cache.put(asset, response);
            }
          }).catch(() => {})
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && !k.startsWith('kins-cdn-')).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isRuntimeCacheable(url) {
  return RUNTIME_CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function matchCdnRule(url) {
  return CDN_CACHE_RULES.find((rule) => url.hostname === rule.host) || null;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip non-http/https requests
  if (!url.protocol.startsWith('http')) return;

  // CRITICAL: Never intercept media, range headers, or external audio CDN streams in Service Worker.
  // Intercepting media in SW breaks byte-range requests (HTTP 206) in WebKit/Safari and Chrome on HTTPS/Vercel.
  if (
    request.destination === 'audio' ||
    request.destination === 'video' ||
    request.headers.has('range') ||
    url.hostname.includes('apple.com') ||
    url.hostname.includes('mzstatic.com') ||
    /\.(mp3|m4a|aac|wav|ogg|flac|mp4|webm)$/i.test(url.pathname)
  ) {
    return; // Direct native browser network pass-through
  }

  // Never intercept API calls — responses may contain auth/session data
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-first for versioned CDN assets (Google Fonts, cdnjs FontAwesome).
  // Makes offline mode work with full iconography + webfonts.
  const cdnRule = matchCdnRule(url);
  if (cdnRule) {
    event.respondWith(
      caches.open(cdnRule.cacheName).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          // Opaque responses (no-cors) are fine for static CDN assets
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          return new Response('', { status: 504, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // Network-First for HTML navigation requests to always show live edits
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Stale-While-Revalidate for same-origin static assets (allow-listed prefixes only)
  if (url.origin !== self.location.origin || !isRuntimeCacheable(url)) {
    return; // pass through uncached
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
