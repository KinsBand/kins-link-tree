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

const ARTWORK_SIZES = [192, 512];

function isSupported() {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function createMediaSessionManager() {
  let active = false;
  let handlers = null;

  function buildMetadata(bpm, timeSigLabel) {
    if (typeof MediaMetadata === 'undefined') return undefined;
    return new MediaMetadata({
      title: METRO_COPY.mediaTitle,
      artist: `${bpm} BPM${timeSigLabel ? ` · ${timeSigLabel}` : ''}`,
      album: METRO_COPY.mediaAlbum,
      artwork: ARTWORK_SIZES.map((size) => ({
        src: `/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png'
      }))
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
      try {
        navigator.mediaSession.metadata = buildMetadata(opts.bpm, opts.timeSigLabel) || null;
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

    /* Live BPM/time-signature updates while playing */
    update(bpm, timeSigLabel) {
      if (!active || !isSupported()) return;
      try { navigator.mediaSession.metadata = buildMetadata(bpm, timeSigLabel) || null; } catch (e) {}
    },

    markPaused() {
      if (active) setPlaybackState('paused');
    },

    deactivate() {
      if (!isSupported()) return;
      active = false;
      handlers = null;
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
