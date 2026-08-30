/**
 * PWA Install & Lifecycle Controller — Production Single Source of Truth for:
 * 1. Runtime Display Context & Multi-platform standalone/installed detection.
 * 2. 2-Stage Installation State Machine (InstallFlow) & prompt orchestration.
 * 3. Real-time Service Worker BroadcastChannel & MessageChannel status replay.
 *
 * @typedef {'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' | 'window-controls-overlay'} DisplayContext
 * @typedef {'initializing' | 'unavailable' | 'available' | 'prompting' | 'accepted' | 'installed' | 'dismissed' | 'ios-instructions'} InstallPhase
 * @typedef {{ phase: InstallPhase, displayContext: DisplayContext, platform?: string }} InstallFlowState
 */
import { showToast } from './toast.js';
import { safeSet, safeGet } from '../utils/safeStorage.js';

export const CACHE_NAME = 'kins-link-bio-v33';
export const FLAG_KEY = 'app:pwa-installed';

const MODE_QUERIES = [
  ['window-controls-overlay', '(display-mode: window-controls-overlay)'],
  ['fullscreen', '(display-mode: fullscreen)'],
  ['minimal-ui', '(display-mode: minimal-ui)'],
  ['standalone', '(display-mode: standalone)'],
];

/**
 * Returns current rendering display mode across all engines.
 * Order matters: window-controls-overlay also matches standalone.
 * @returns {DisplayContext}
 */
export function getDisplayContext() {
  if (typeof window === 'undefined') return 'browser';

  for (const [mode, query] of MODE_QUERIES) {
    if (window.matchMedia(query).matches) return mode;
  }

  if (typeof navigator !== 'undefined' && 'standalone' in navigator && navigator.standalone === true) {
    return 'standalone';
  }

  // Fallback URL parameter set in manifest.json (e.g., "start_url": "/?mode=standalone")
  if (new URLSearchParams(window.location.search).get('mode') === 'standalone') {
    return 'standalone';
  }

  return 'browser';
}

export function isStandaloneLike(mode = getDisplayContext()) {
  return mode !== 'browser';
}

export function isRunningAsPWA() {
  if (typeof window === 'undefined') return false;
  const isMQ = isStandaloneLike();
  const isIos = typeof navigator !== 'undefined' && 'standalone' in navigator && navigator.standalone === true;
  const isTWA = typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
  const isParam = new URLSearchParams(window.location.search).get('mode') === 'standalone';
  return Boolean(isMQ || isIos || isTWA || isParam);
}

export function isStandalone() {
  return isRunningAsPWA();
}

/** iPadOS 13+ detection via maxTouchPoints */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Subscribe to display mode changes with legacy Safari addListener fallback.
 * @param {(mode: DisplayContext) => void} cb
 * @returns {() => void}
 */
export function watchDisplayContext(cb) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb(getDisplayContext());
  const mqls = MODE_QUERIES.map(([, query]) => window.matchMedia(query));

  for (const mql of mqls) {
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
    }
  }

  return () => {
    for (const mql of mqls) {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', handler);
      } else if (typeof mql.removeListener === 'function') {
        mql.removeListener(handler);
      }
    }
  };
}

export async function isRelatedWebAppInstalled() {
  if (typeof navigator === 'undefined' || !('getInstalledRelatedApps' in navigator)) return false;
  try {
    const apps = await navigator.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.length > 0;
  } catch {
    return false;
  }
}

export async function detectActualInstalledState() {
  if (isRunningAsPWA()) return true;

  // If a deferred install prompt is present, the browser explicitly considers the app uninstalled
  if (getDeferredPrompt()) {
    installStore.clearInstalled();
    return false;
  }

  // Native related web app registry check (Chromium/Edge/Android)
  if (await isRelatedWebAppInstalled()) return true;
  
  // Cache and storage verification layer
  try {
    if (typeof window !== 'undefined' && installStore.isMarkedInstalled()) {
      if ('caches' in window) {
        const hasCache = await caches.has(CACHE_NAME);
        if (hasCache) {
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          if (keys && keys.length > 0) {
            return true;
          }
        }
      }
      // If marked in localStorage but cache was cleared/purged, clean up flag
      installStore.clearInstalled();
    }
  } catch {}

  return false;
}

export async function getDetailedInstallState() {
  const isStandalone = isRunningAsPWA();
  const isIos = isIOS();
  const hasPrompt = Boolean(getDeferredPrompt());
  const isRelatedInstalled = !hasPrompt && (await isRelatedWebAppInstalled());
  
  let isCached = false;
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const hasCache = await caches.has(CACHE_NAME);
      if (hasCache) {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        isCached = Boolean(keys && keys.length > 0);
      }
    }
  } catch {}

  if (!isCached && !isStandalone && !isRelatedInstalled) {
    installStore.clearInstalled();
  }

  const isInstalled = !hasPrompt && (isStandalone || isRelatedInstalled || (installStore.isMarkedInstalled() && isCached));

  return {
    isInstalled,
    isStandalone,
    isIOS: isIos,
    isCached,
    hasPrompt,
    displayContext: getDisplayContext(),
  };
}

export const installStore = {
  markInstalled() {
    safeSet(FLAG_KEY, String(Date.now()));
    safeSet('kins_pwa_downloaded', 'true');
  },
  clearInstalled() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(FLAG_KEY);
        localStorage.removeItem('kins_pwa_downloaded');
      }
    } catch {}
  },
  isMarkedInstalled() {
    return safeGet(FLAG_KEY) !== null || safeGet('kins_pwa_downloaded') === 'true';
  },
};

export async function clearOfflineAppCache() {
  installStore.clearInstalled();
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      await caches.delete(CACHE_NAME);
    }
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kins:pwa-uninstalled'));
    window.dispatchEvent(new CustomEvent('kins:pwa-available'));
  }
}

let deferredInstallPrompt = (typeof window !== 'undefined' && window.__kinsDeferredInstallPrompt) || null;
let syncChannel = null;

export function getDeferredPrompt() {
  return deferredInstallPrompt || (typeof window !== 'undefined' ? window.__kinsDeferredInstallPrompt : null) || null;
}

/**
 * 2-Stage Installation Flow State Machine Manager.
 */
export class InstallFlow {
  #state = { phase: 'initializing', displayContext: getDisplayContext() };
  #prompt = null;
  #listeners = new Set();

  constructor() {
    this.#init();
  }

  get state() {
    return this.#state;
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    fn(this.#state);
    return () => void this.#listeners.delete(fn);
  }

  async install() {
    if (this.#state.phase === 'ios-instructions') return;
    if (!this.#prompt) return;

    this.#set({ phase: 'prompting' });

    try {
      await this.#prompt.prompt();
      const choice = await this.#prompt.userChoice;
      this.#prompt = null;
      if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;

      if (choice && choice.outcome === 'accepted') {
        this.#set({ phase: 'accepted', platform: choice.platform });
      } else {
        this.#set({ phase: 'dismissed', platform: choice?.platform });
      }
    } catch (error) {
      this.#prompt = null;
      this.#set({ phase: 'unavailable' });
      console.warn('[PWA] Prompt execution failed:', error);
    }
  }

  #init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.#prompt = event;
      deferredInstallPrompt = event;
      window.__kinsDeferredInstallPrompt = event;
      this.#set({ phase: 'available', platform: event.platforms?.[0] });
      window.dispatchEvent(new CustomEvent('kins:pwa-available', { detail: { prompt: event } }));
    });

    window.addEventListener('appinstalled', () => {
      installStore.markInstalled();
      this.#prompt = null;
      deferredInstallPrompt = null;
      if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;
      this.#set({ phase: 'installed' });
      window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
      showToast('🎉 Kins App installed on your device!', 'success');
    });

    watchDisplayContext((displayContext) => {
      this.#set({ displayContext });
      if (isStandaloneLike(displayContext) && !installStore.isMarkedInstalled()) {
        installStore.markInstalled();
        this.#set({ phase: 'installed' });
        window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
      }
    });

    // Initial evaluation
    if (isStandaloneLike(this.#state.displayContext)) {
      installStore.markInstalled();
      this.#set({ phase: 'installed' });
    } else if (isIOS()) {
      this.#set({ phase: 'ios-instructions' });
    } else if (installStore.isMarkedInstalled()) {
      this.#set({ phase: 'installed' });
    } else {
      window.setTimeout(() => {
        if (this.#state.phase === 'initializing') {
          this.#set({ phase: 'unavailable' });
        }
      }, 4000);
    }
  }

  #set(partial) {
    this.#state = { ...this.#state, ...partial };
    for (const fn of this.#listeners) fn(this.#state);
  }
}

export function initPwaChannel(onProgress) {
  if (typeof window === 'undefined') return null;

  if (!syncChannel && typeof BroadcastChannel !== 'undefined') {
    try {
      syncChannel = new BroadcastChannel('pwa-cache-channel');
      syncChannel.onmessage = (event) => {
        if (!event.data) return;
        if (event.data.type === 'DOWNLOAD_PROGRESS' || event.data.type === 'DOWNLOAD_COMPLETE' || event.data.type === 'CACHE_PROGRESS' || event.data.type === 'CACHE_COMPLETE') {
          if (onProgress) onProgress(event.data);
          window.dispatchEvent(new CustomEvent('kins:pwa-progress', { detail: event.data }));
        }
      };
    } catch (err) {
      console.warn('[PWA] BroadcastChannel init error:', err);
    }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (!event.data) return;
      if (event.data.type === 'DOWNLOAD_PROGRESS' || event.data.type === 'DOWNLOAD_COMPLETE' || event.data.type === 'CACHE_PROGRESS' || event.data.type === 'CACHE_COMPLETE') {
        if (onProgress) onProgress(event.data);
        window.dispatchEvent(new CustomEvent('kins:pwa-progress', { detail: event.data }));
      }
    });
  }

  return syncChannel;
}

export function requestCacheStatus() {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  try {
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => {
      const status = e.data;
      if (status && (status.type === 'CACHE_STATUS' || status.type === 'DOWNLOAD_PROGRESS')) {
        window.dispatchEvent(new CustomEvent('kins:pwa-progress', { detail: status }));
      }
    };
    navigator.serviceWorker.controller.postMessage({ type: 'GET_CACHE_STATUS' }, [channel.port2]);
  } catch (e) {}
}

export async function cacheCoreAssets(onProgress) {
  const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';
  const assetUrls = [
    `${baseUrl}/`,
    `${baseUrl}/manifest.json`,
    `${baseUrl}/offline.html`,
    `${baseUrl}/new.png`,
    `${baseUrl}/kins-logo-new.png`,
    `${baseUrl}/followers.json`,
    `${baseUrl}/noise-tile.png`,
    `${baseUrl}/tuner-worklet.js`,
    `${baseUrl}/worklets/click-worklet.js`,
    `${baseUrl}/worklets/metro-worker.js`,
  ];

  if (typeof document !== 'undefined') {
    document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((el) => {
      const src = el.href || el.src;
      if (src && !assetUrls.includes(src) && !src.startsWith('chrome-extension')) {
        assetUrls.push(src);
      }
    });
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_ASSET_CACHE',
        assets: assetUrls,
      });
    } catch (e) {}
  }

  // Client-side resilient fallback caching
  const total = assetUrls.length;
  let completed = 0;
  let totalBytes = 0;
  const start = performance.now();

  let cacheStorage = null;
  try {
    if ('caches' in window) {
      cacheStorage = await caches.open(CACHE_NAME);
    }
  } catch (e) {}

  for (const url of assetUrls) {
    try {
      const response = await fetch(url, { cache: 'reload' });
      if (response && response.ok) {
        const clone = response.clone();
        if (cacheStorage) {
          await cacheStorage.put(url, clone).catch(() => {});
        }
        if (response.body && typeof ReadableStream !== 'undefined') {
          try {
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) totalBytes += value.length;
            }
          } catch {
            try {
              const blob = await response.blob();
              totalBytes += blob.size;
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('[PWA] Fallback cache error for:', url, err);
    }

    completed += 1;
    const percent = Math.min(98, Math.round((completed / total) * 100));
    const elapsed = (performance.now() - start) / 1000;
    const speed = elapsed > 0 ? totalBytes / elapsed : 0;
    const avg = completed > 0 ? totalBytes / completed : 0;
    const remaining = total - completed;
    const estRemaining = remaining * avg;
    const eta = speed > 0 ? Math.max(1, Math.ceil(estRemaining / speed)) : 1;

    const progressData = { percent, eta, completed, total, totalBytes, stage: 1 };
    if (onProgress) onProgress(progressData);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kins:pwa-progress', { detail: progressData }));
    }
  }

  const finalProgress = { percent: 100, eta: 0, completed: total, total, totalBytes, stage: 1 };
  if (onProgress) onProgress(finalProgress);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kins:pwa-progress', { detail: finalProgress }));
  }

  await new Promise((r) => setTimeout(r, 220));
}

export async function promptInstall() {
  const promptEvent = getDeferredPrompt();
  if (!promptEvent) return null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredInstallPrompt = null;
    if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;
    return choice && choice.outcome ? choice.outcome : null;
  } catch (err) {
    console.warn('[PWA] Prompt error:', err);
    return null;
  }
}

export async function installPwa({ onProgress } = {}) {
  initPwaChannel(onProgress);

  if (isRunningAsPWA()) {
    showToast('✓ Kins App is already running in standalone mode & offline ready!', 'success');
    return { status: 'already-installed' };
  }

  const promptEvent = getDeferredPrompt();
  let promptOutcome = null;

  if (promptEvent) {
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      deferredInstallPrompt = null;
      if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;
      promptOutcome = choice?.outcome || null;
    } catch (e) {
      console.warn('[PWA] Prompt error:', e);
    }
  }

  await cacheCoreAssets(onProgress);
  installStore.markInstalled();

  if (promptOutcome === 'accepted') {
    showToast('🎉 Kins App installed to your device!', 'success');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
    }
    return { status: 'installed' };
  }

  if (promptOutcome === 'dismissed') {
    showToast('✓ Kins App downloaded & cached offline!', 'success');
    return { status: 'dismissed' };
  }

  if (isIOS()) {
    showToast("📱 Download complete! Tap Safari Share (↑) → 'Add to Home Screen' (+)", 'success');
    return { status: 'ios-manual' };
  }

  showToast('🎉 Kins App is 100% downloaded and ready for offline use!', 'success');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
  }
  return { status: 'cached' };
}

// Global Lifecycle Listener Bindings
if (typeof window !== 'undefined') {
  initPwaChannel();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.__kinsDeferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('kins:pwa-available', { detail: { prompt: e } }));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;
    installStore.markInstalled();
    window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
    showToast('🎉 Kins App installed on your device!', 'success');
  });

  watchDisplayContext((mode) => {
    if (isStandaloneLike(mode)) {
      installStore.markInstalled();
      window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
    }
  });
}
