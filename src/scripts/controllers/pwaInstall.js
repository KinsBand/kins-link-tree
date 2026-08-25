/**
 * PWA Install helper — single source for offline download + native prompt.
 * Keeps CACHE_NAME in sync with public/sw.js and handles deferredInstallPrompt.
 */
import { showToast } from './toast.js';

const CACHE_NAME = 'kins-link-bio-v30';

let deferredInstallPrompt = (typeof window !== 'undefined' && window.__kinsDeferredInstallPrompt) || null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.__kinsDeferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('kins:pwa-available'));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.__kinsDeferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent('kins:pwa-installed'));
    try {
      localStorage.setItem('kins_pwa_downloaded', 'true');
    } catch {}
    showToast('🎉 Kins App installed successfully!', 'success');
  });
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
  );
}

export function getDeferredPrompt() {
  return deferredInstallPrompt || (typeof window !== 'undefined' ? window.__kinsDeferredInstallPrompt : null) || null;
}

export async function cacheCoreAssets(onProgress) {
  const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';
  const assetUrls = [
    `${baseUrl}/`,
    `${baseUrl}/manifest.json`,
    `${baseUrl}/new.png`,
    `${baseUrl}/kins-logo-new.png`,
    `${baseUrl}/followers.json`,
  ];

  // Gather linked stylesheets/scripts for complete offline shell
  document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((el) => {
    const src = el.href || el.src;
    if (src && !assetUrls.includes(src) && !src.startsWith('chrome-extension')) {
      assetUrls.push(src);
    }
  });

  const total = assetUrls.length;
  let completed = 0;
  let totalBytes = 0;
  const start = performance.now();

  let cacheStorage = null;
  try {
    if ('caches' in window) {
      cacheStorage = await caches.open(CACHE_NAME);
    }
  } catch {}

  for (const url of assetUrls) {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (response && response.ok) {
        const clone = response.clone();
        if (cacheStorage) {
          await cacheStorage.put(url, clone).catch(() => {});
        }
        // Drain body to measure bytes without double-fetching
        if (response.body && typeof ReadableStream !== 'undefined') {
          try {
            const reader = response.body.getReader();
            // eslint-disable-next-line no-constant-condition
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
        } else {
          try {
            const blob = await response.blob();
            totalBytes += blob.size;
          } catch {}
        }
      }
    } catch (err) {
      console.warn('PWA cache fetch:', url, err);
    }

    completed += 1;
    const percent = Math.min(98, Math.round((completed / total) * 100));
    const elapsed = (performance.now() - start) / 1000;
    const speed = elapsed > 0 ? totalBytes / elapsed : 0;
    const avg = completed > 0 ? totalBytes / completed : 0;
    const remaining = total - completed;
    const estRemaining = remaining * avg;
    const eta = speed > 0 ? Math.max(1, Math.ceil(estRemaining / speed)) : 1;

    if (onProgress) {
      onProgress({ percent, eta, completed, total, totalBytes });
    }
  }

  if (onProgress) {
    onProgress({ percent: 100, eta: 0, completed: total, total, totalBytes });
  }

  // Small settle so progress bar animates to 100% visibly
  await new Promise((r) => setTimeout(r, 220));
}

export async function promptInstall() {
  const promptEvent = getDeferredPrompt();
  if (!promptEvent) return null;
  try {
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredInstallPrompt = null;
    if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;
    return choice && choice.outcome ? choice.outcome : null;
  } catch (err) {
    console.warn('PWA prompt error:', err);
    return null;
  }
}

/**
 * Full install flow: cache assets → store flag → trigger native prompt if available.
 * Returns { status: 'already-installed' | 'installed' | 'dismissed' | 'cached' | 'ios-manual' }
 */
export async function installPwa({ onProgress } = {}) {
  if (isStandalone()) {
    showToast('✓ Kins App is already installed & offline ready!', 'success');
    return { status: 'already-installed' };
  }

  await cacheCoreAssets(onProgress);

  try {
    localStorage.setItem('kins_pwa_downloaded', 'true');
  } catch {}

  const outcome = await promptInstall();

  if (outcome === 'accepted') {
    showToast('🎉 Kins App installed to your device!', 'success');
    return { status: 'installed' };
  }
  if (outcome === 'dismissed') {
    showToast('✓ Kins App downloaded & cached offline!', 'success');
    return { status: 'dismissed' };
  }

  // No prompt available — fallback
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIos) {
    showToast("📱 Download complete! Tap Share (↑) → 'Add to Home Screen' (+) in Safari", 'success');
    return { status: 'ios-manual' };
  }
  showToast('🎉 Kins App is 100% downloaded and ready for offline use!', 'success');
  return { status: 'cached' };
}
