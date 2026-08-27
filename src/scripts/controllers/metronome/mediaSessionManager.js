import { METRO_COPY } from '../../../settings/metronome.config';

/* KINS Metronome — OS media-session bridge.

   Publishes the running metronome to the platform media surface (Android
   notification / lock-screen controls, desktop media keys) so playback can
   be paused without returning to the tab, and so the browser treats the
   page as audible media instead of throttling it away in the background.

   Honest-state rule: playbackState mirrors the engine — 'playing' only
   while clicks are actually scheduled, 'paused' during an OS interruption,
   'none' once stopped. Handlers wire to real engine callbacks passed in
   from index.js; nothing here fakes or gates playback. */

const ARTWORK = [
  { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
];
/* Trailing debounce for live BPM/time-signature text updates. Stepper
   hold-repeat and slider drags fire applyBpm ~16x/s; assigning
   mediaSession.metadata makes the browser (re)fetch the artwork PNGs
   each time, so publish once when the value settles instead.
   We also MUTATE the existing MediaMetadata instance's title/artist
   when possible — recreating with artwork triggers a network (re)fetch
   and makes the OS notification visibly flash on Android. Mutating
   avoids both.
   Throttle ensures even rapid section changes (subdivisions, speed-trainer)
   can't make the notification flash more than once per throttle window. */
const UPDATE_DEBOUNCE_MS = 750;
const THROTTLE_MS = 1200;
const MIN_BPM_DELTA = 1;

function isSupported() {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

// Metronome + Tuner must NOT publish a Media Session notification.
// Previous work throttled/mutated updates but Chrome still (re)fetched
// artwork per assignment and flashed the notification per beat.
// User request: fully disable on these pages — no notification, no fetches.
const DISABLED_PATHS = ['/metronome', '/tuner'];
function isPathDisabled() {
  try {
    const p = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
    return DISABLED_PATHS.some((d) => p === d || p.startsWith(d + '/') || p.startsWith(d));
  } catch { return false; }
}
function isMediaSessionDisabled() {
  return isPathDisabled();
}

export function createMediaSessionManager() {
  if (isMediaSessionDisabled()) {
    // Return a no-op manager so callers (metronome/index.js, future tuner usage)
    // keep working but never touch navigator.mediaSession.
    // Also clear any stale session that might have been set before navigation.
    try {
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try { navigator.mediaSession.metadata = null; } catch {}
        try { navigator.mediaSession.playbackState = 'none'; } catch {}
        try { navigator.mediaSession.setActionHandler('play', null); } catch {}
        try { navigator.mediaSession.setActionHandler('pause', null); } catch {}
        try { navigator.mediaSession.setActionHandler('stop', null); } catch {}
      }
    } catch {}
    return {
      activate() {},
      update() {},
      markPaused() {},
      deactivate() {}
    };
  }
  let active = false;
  let handlers = null;
  let pendingUpdateTimer = null;
  let pendingArgs = null;
  let publishedKey = null;
  let metadataRef = null;
  let lastPublishMs = 0;
  let lastBpm = null;

  function publishMetadata(bpm, timeSigLabel) {
    try {
      if (typeof MediaMetadata === 'undefined') return;
      const artist = `${bpm} BPM${timeSigLabel ? ` · ${timeSigLabel}` : ''}`;
      const album = METRO_COPY.mediaAlbum;
      const title = METRO_COPY.mediaTitle;
      // If we already have a live MediaMetadata instance, mutate it in place.
      // Re-assigning `navigator.mediaSession.metadata = new MediaMetadata(...)`
      // with the same artwork URLs makes Chrome (re)fetch the PNGs and
      // visibly re-animate the Android media notification — per-beat
      // updates were causing 1k+ 304s and a flashing notification.
      // On browsers where mutation is read-only, we fall through to recreation
      // but the throttle above ensures this happens at most once per THROTTLE_MS.
      if (metadataRef && navigator.mediaSession.metadata === metadataRef) {
        try {
          metadataRef.title = title;
          metadataRef.artist = artist;
          metadataRef.album = album;
          // artwork is intentionally NOT touched — avoids network fetch/flash
          publishedKey = `${bpm}|${timeSigLabel || ''}`;
          lastPublishMs = Date.now();
          lastBpm = bpm;
          return;
        } catch (e) {
          // fall through to recreate if mutation is not supported
        }
      }
      const next = new MediaMetadata({
        title,
        artist,
        album,
        artwork: ARTWORK
      });
      navigator.mediaSession.metadata = next;
      metadataRef = next;
      publishedKey = `${bpm}|${timeSigLabel || ''}`;
      lastPublishMs = Date.now();
      lastBpm = bpm;
    } catch (e) {}
  }

  function clearPendingUpdate() {
    if (pendingUpdateTimer !== null) {
      clearTimeout(pendingUpdateTimer);
      pendingUpdateTimer = null;
    }
    pendingArgs = null;
  }

  function buildMetadata(bpm, timeSigLabel) {
    if (typeof MediaMetadata === 'undefined') return undefined;
    return new MediaMetadata({
      title: METRO_COPY.mediaTitle,
      artist: `${bpm} BPM${timeSigLabel ? ` · ${timeSigLabel}` : ''}`,
      album: METRO_COPY.mediaAlbum,
      artwork: ARTWORK
    });
  }

  function setPlaybackState(state) {
    if (!isSupported()) return;
    try { navigator.mediaSession.playbackState = state; } catch (e) {}
  }

  return {
    /* Called on every successful engine start. Re-registers handlers each
       run so a stale closure can never point at a dead run. */
    activate(opts) {
      if (!isSupported() || !opts) return;
      handlers = opts;
      active = true;
      clearPendingUpdate();
      try {
        publishMetadata(opts.bpm, opts.timeSigLabel);
        navigator.mediaSession.setActionHandler('play', () => {
          if (handlers && typeof handlers.onPlay === 'function') handlers.onPlay();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (handlers && typeof handlers.onPause === 'function') handlers.onPause();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          if (handlers && typeof handlers.onStop === 'function') handlers.onStop();
        });
        setPlaybackState('playing');
      } catch (e) {}
    },

    /* Live BPM/time-signature updates while playing — debounced and
       deduped so artwork is never refetched per stepper tick.
       Coalesces rapid calls (subdivisions / dial drag) and mutates the
       existing MediaMetadata when possible to avoid the Chrome artwork
       re-fetch + notification flash. Throttle guarantees at most one
       visible notification update per THROTTLE_MS even during section
       storms. */
    update(bpm, timeSigLabel) {
      if (!active || !isSupported()) return;
      const key = `${bpm}|${timeSigLabel || ''}`;
      if (key === publishedKey && pendingUpdateTimer === null && pendingArgs === null) return;
      // ignore tiny BPM jitter (<1) to avoid flash from floating math
      if (lastBpm !== null && Math.abs(bpm - lastBpm) < MIN_BPM_DELTA && key.split('|')[1] === (publishedKey ? publishedKey.split('|')[1] : null)) {
        // same timeSig and BPM delta <1 -> treat as duplicate
        if (pendingArgs === null) return;
      }
      if (pendingArgs && `${pendingArgs.bpm}|${pendingArgs.timeSigLabel || ''}` === key) return;
      clearPendingUpdate();
      pendingArgs = { bpm, timeSigLabel };
      const now = Date.now();
      const sinceLast = now - lastPublishMs;
      const delay = sinceLast < THROTTLE_MS ? Math.max(UPDATE_DEBOUNCE_MS, THROTTLE_MS - sinceLast) : UPDATE_DEBOUNCE_MS;
      pendingUpdateTimer = setTimeout(() => {
        const args = pendingArgs;
        pendingArgs = null;
        pendingUpdateTimer = null;
        if (!active || !args) return;
        const k = `${args.bpm}|${args.timeSigLabel || ''}`;
        if (k === publishedKey) return;
        publishMetadata(args.bpm, args.timeSigLabel);
      }, delay);
    },

    markPaused() {
      if (active) setPlaybackState('paused');
    },

    deactivate() {
      if (!isSupported()) return;
      active = false;
      handlers = null;
      clearPendingUpdate();
      publishedKey = null;
      metadataRef = null;
      pendingArgs = null;
      lastPublishMs = 0;
      lastBpm = null;
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
      } catch (e) {}
      try { navigator.mediaSession.metadata = null; } catch (e) {}
      setPlaybackState('none');
    }
  };
}
