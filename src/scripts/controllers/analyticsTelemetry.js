const TRACK_ATTR = 'data-track';
const CONTAINER_ATTR = 'data-track-container';

let initialized = false;

function sinkEvent(name, props) {
  try {
    if (typeof window.va === 'function') {
      window.va('event', Object.assign({ name }, props || {}));
    } else {
      window.vaq = window.vaq || [];
      window.vaq.push(['event', Object.assign({ name }, props || {})]);
    }
  } catch (_) {}
}

export function trackEvent(name, props) {
  if (!name) return;
  sinkEvent(String(name).slice(0, 80), props);
}

export function initAnalyticsTelemetry() {
  if (initialized) return;
  initialized = true;

  document.body.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target.closest(`[${TRACK_ATTR}]`) : null;
    if (!target) return;
    trackEvent(target.getAttribute(TRACK_ATTR) || '', {
      container: target.getAttribute(CONTAINER_ATTR) || undefined,
      path: location.pathname
    });
  }, { passive: true });
}
