const CACHE_NAME = 'kins-link-bio-v33';

// Small, stable shell assets only. Heavy media (new.png) is NOT precached —
// it competes with first-load bandwidth and is runtime-cached on first view.
const PRECACHE_ASSETS = [
  './',
  './manifest.json',
  './offline.html',
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-maskable-192x192.png',
  './icon-maskable-512x512.png',
  './apple-touch-icon.png',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './favicon.ico',
  './followers.json',
  './noise-tile.png',
  './tuner-worklet.js',
  './worklets/click-worklet.js',
  './worklets/metro-worker.js'
];

const CRITICAL_ASSETS = new Set(['./', './manifest.json', './offline.html']);

// Same-origin path prefixes eligible for runtime caching.
// /api/ is deliberately excluded so authenticated responses are never cached.
const RUNTIME_CACHEABLE_PREFIXES = ['/_astro/', '/icons/', '/noise-tile.png', '/tuner-worklet.js', '/worklets/click-worklet.js', '/worklets/metro-worker.js'];

// Versioned third-party CDNs safe to cache-first (URLs change when versions bump).
const CDN_CACHE_RULES = [
  { host: 'fonts.googleapis.com', cacheName: 'kins-cdn-fonts-css-v1' },
  { host: 'fonts.gstatic.com', cacheName: 'kins-cdn-fonts-files-v1' },
  { host: 'cdnjs.cloudflare.com', cacheName: 'kins-cdn-cdnjs-v1' }
];

const pwaChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pwa-cache-channel') : null;
let lastProgress = { completed: 0, total: PRECACHE_ASSETS.length, percent: 0, version: CACHE_NAME };

function broadcastProgress(data) {
  if (data && typeof data.percent === 'number') {
    lastProgress = {
      completed: data.completed ?? 0,
      total: data.total ?? PRECACHE_ASSETS.length,
      percent: data.percent,
      version: CACHE_NAME
    };
  }
  if (pwaChannel) {
    try {
      pwaChannel.postMessage(data);
    } catch (e) {}
  }
  // Also post back to active client windows including uncontrolled first-load clients
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      try {
        client.postMessage(data);
      } catch (e) {}
    });
  }).catch(() => {});
}

async function precacheWithProgress(customList = null) {
  const cache = await caches.open(CACHE_NAME);
  const assetsToCache = Array.isArray(customList) && customList.length > 0
    ? Array.from(new Set([...PRECACHE_ASSETS, ...customList]))
    : PRECACHE_ASSETS;

  const total = assetsToCache.length;
  const failures = [];
  let completed = 0;
  let lastPost = 0;

  const post = (force = false, extra = {}) => {
    const now = Date.now();
    if (!force && now - lastPost < 90) return;
    lastPost = now;
    const percent = Math.min(100, Math.round((completed / total) * 100));
    broadcastProgress({
      type: 'DOWNLOAD_PROGRESS',
      completed,
      total,
      percent,
      stage: 1,
      version: CACHE_NAME,
      ...extra
    });
  };

  post(true, { percent: 5 });

  for (const url of assetsToCache) {
    try {
      // cache: 'reload' bypasses the HTTP cache — never store a stale 304.
      const req = new Request(url, { cache: 'reload' });
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        await cache.put(url, res.clone());
      } else if (CRITICAL_ASSETS.has(url)) {
        throw new Error(`Failed HTTP ${res ? res.status : 'network'} for critical asset ${url}`);
      }
    } catch (error) {
      failures.push(url);
      console.warn(`[SW] Precache non-fatal/fatal for ${url}:`, error);
      if (CRITICAL_ASSETS.has(url)) {
        broadcastProgress({ type: 'DOWNLOAD_ERROR', url, error: String(error), stage: 1 });
      }
    }
    completed += 1;
    post();
  }

  post(true, { percent: 100 });
  broadcastProgress({
    type: 'DOWNLOAD_COMPLETE',
    total,
    failures,
    percent: 100,
    stage: 1,
    version: CACHE_NAME
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(precacheWithProgress());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && !k.startsWith('kins-cdn-')).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() => {
      broadcastProgress({ type: 'SW_ACTIVATED', version: CACHE_NAME });
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  const msgType = event.data.type || event.data;

  switch (msgType) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATUS':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: 'CACHE_STATUS',
          ...lastProgress,
          version: CACHE_NAME
        });
      }
      break;

    case 'TRIGGER_ASSET_CACHE':
      precacheWithProgress(event.data.assets).catch((err) => {
        console.warn('[SW] Manual asset cache trigger error:', err);
      });
      break;
  }
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

  // Network-First for HTML navigation requests to always show live edits with offline fallback
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
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(request)) ||
            (await cache.match('./')) ||
            (await cache.match('./index.html')) ||
            (await cache.match('./offline.html')) ||
            new Response('Offline - Kins Official', { status: 503, headers: { 'Content-Type': 'text/plain' } })
          );
        })
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
