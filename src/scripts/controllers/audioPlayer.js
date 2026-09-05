import { showToast } from './toast.js';
import { getITunesTrackData, loadAlbumArt, INSPIRED_ARTISTS_DATA, INSPIRATION_TRACKS, prefetchTrackArtwork, ITUNES_CACHE } from './inspirationVault.js';
import { VinylGrooveEngine } from './vinylGrooveEngine.js';

let isPlayingAudio = false;
let currentPlayingTrack = null;
let hasTransitionedToActive = false;

// --- Unified 60/120 FPS Vinyl Dynamics & Multi-Instance Sync Engine ---
let globalVinylAngle = 0;
let vinylAngularVelocity = 0;      // 0.0 to 1.0 multiplier of 120 deg/s (33 RPM)
let targetAngularVelocity = 0;     // 1.0 when playing, 0.0 when stopped/paused
let lastVinylFrameTime = performance.now();
let isDeceleratingToStop = false;
let stopTimeoutId = null;

// Cache the rotating thumbs so the per-frame sync never calls querySelectorAll.
// Invalidate whenever play state classes change (notifyPlaybackState fires on every transition).
let cachedVinylThumbs = null;

export function invalidateVinylThumbCache() {
  cachedVinylThumbs = null;
}

export function getCurrentVinylAngle() {
  return globalVinylAngle;
}

function getCachedVinylThumbs() {
  if (!cachedVinylThumbs) {
    cachedVinylThumbs = Array.from(
      document.querySelectorAll('.music-card.is-playing .music-card-thumb, .music-card.is-decelerating .music-card-thumb')
    );
  }
  return cachedVinylThumbs;
}

export function syncVinylInstances(angleDeg, isRoundDisc = true) {
  const formattedAngle = (angleDeg % 360).toFixed(2);
  const audioBarIconBox = document.getElementById('audioBarIconBox');

  // 1. Update Persistent Bottom Dock Vinyl
  if (audioBarIconBox) {
    audioBarIconBox.style.transform = `rotate(${formattedAngle}deg)`;
    if (isRoundDisc) {
      audioBarIconBox.classList.add('is-vinyl-disc');
    } else {
      audioBarIconBox.classList.remove('is-vinyl-disc');
    }
  }

  // 2. Update Active & Decelerating Playing Cards in Inspiration Vault
  const thumbs = getCachedVinylThumbs();
  for (let i = 0; i < thumbs.length; i++) {
    const thumb = thumbs[i];
    thumb.style.transform = `rotate(${formattedAngle}deg)`;
    if (isRoundDisc) {
      thumb.classList.add('is-vinyl-disc');
    } else {
      thumb.classList.remove('is-vinyl-disc');
    }
  }
}

// Expose for vault's off-screen sync without requiring a static import (keeps audioPlayer lazy)
if (typeof window !== 'undefined') {
  window.getCurrentVinylAngle = getCurrentVinylAngle;
  window.invalidateVinylThumbCache = invalidateVinylThumbCache;
  window.syncVinylInstances = syncVinylInstances;
}

let vinylDecelAnimId = null;

export function startVinylSpin(startSpeed = 0.25) {
  // Skip stale thumbs for the previous track when switching tracks before the
  // previous visual decel/rotation finished - otherwise the global sync would
  // keep the old card spinning alongside the new one -> stacking.
  clearTimeout(stopTimeoutId);
  if (vinylDecelAnimId) {
    cancelAnimationFrame(vinylDecelAnimId);
    vinylDecelAnimId = null;
  }
  isDeceleratingToStop = false;
  targetAngularVelocity = 1.0;
  if (vinylAngularVelocity < 0.15) {
    vinylAngularVelocity = startSpeed;
  }
  lastVinylFrameTime = performance.now();

  const audioBarIconBox = document.getElementById('audioBarIconBox');
  if (audioBarIconBox) {
    audioBarIconBox.classList.remove('vinyl-spin-decelerate');
    audioBarIconBox.classList.add('is-vinyl-disc');
  }
  const activeCards = document.querySelectorAll('.music-card.is-playing .music-card-thumb, .music-card.is-decelerating .music-card-thumb');
  activeCards.forEach((thumb) => {
    const card = thumb.closest('.music-card');
    const title = card && card.dataset ? card.dataset.songTitle : null;
    // Don't resurrect a stale thumb for the previous track when switching tracks
    // before the previous visual decel finished. The previous card will be retired
    // locally by InspirationVault's updateCardStates (wasPlaying/wasDecelerating).
    // Without this guard the global sync would keep it spinning -> stacking.
    if (currentPlayingTrack && title && title !== currentPlayingTrack.title) {
      // For the specific case of interrupting a global decel, wasDecelerating is true,
      // but also for a mid-play switch (no decel yet) we still want to skip stale
      // is-playing thumbs - otherwise startVinylSpin would re-add is-vinyl-disc to the
      // old card right before updateCardStates removes is-playing.
      return;
    }
    thumb.classList.remove('vinyl-spin-decelerate');
    thumb.classList.add('is-vinyl-disc');
  });
  invalidateVinylThumbCache();

  if (window._startTimelineAnimation) window._startTimelineAnimation();
}

export function stopVinylSpin(morphToSquare = true, durationMs = 550) {
  // If already at standstill (not spinning and not decelerating), ensure clean square state
  if (vinylAngularVelocity <= 0.001 && targetAngularVelocity === 0 && !isDeceleratingToStop && (globalVinylAngle % 360) === 0) {
    syncVinylInstances(0, !morphToSquare);
    return;
  }

  // If already decelerating to stop, let current deceleration cycle finish cleanly
  if (isDeceleratingToStop) {
    return;
  }

  clearTimeout(stopTimeoutId);
  if (vinylDecelAnimId) {
    cancelAnimationFrame(vinylDecelAnimId);
    vinylDecelAnimId = null;
  }

  targetAngularVelocity = 0;
  isDeceleratingToStop = true;

  // Mark all active cards so they participate in deceleration
  const activeCards = document.querySelectorAll('.music-card.is-playing, .music-card.is-decelerating');
  activeCards.forEach(card => card.classList.add('is-decelerating'));
  invalidateVinylThumbCache();

  const startAngle = globalVinylAngle;
  // Calculate forward coasting target: always rotate forward to nearest 360° (0°)
  const normalizedStart = ((startAngle % 360) + 360) % 360;
  let distToUpright = 360 - normalizedStart;
  if (distToUpright === 360) distToUpright = 0;
  if (vinylAngularVelocity > 0.4 && distToUpright < 90) {
    distToUpright += 360;
  }
  const targetAngle = startAngle + distToUpright;
  const startTime = performance.now();

  function stepDecel(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);

    // Quintic ease-out deceleration curve: natural turntable friction coasting to standstill
    const easeOut = 1 - Math.pow(1 - progress, 3.4);
    const currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
    globalVinylAngle = currentAngle;

    // Morph shape from circle to curved square in the second half of coasting
    const isDisc = !morphToSquare || progress < 0.45;
    syncVinylInstances(globalVinylAngle, isDisc);

    if (progress < 1) {
      vinylDecelAnimId = requestAnimationFrame(stepDecel);
    } else {
      globalVinylAngle = 0;
      vinylAngularVelocity = 0;
      isDeceleratingToStop = false;
      vinylDecelAnimId = null;

      const audioBarIconBox = document.getElementById('audioBarIconBox');
      if (audioBarIconBox) {
        audioBarIconBox.style.transform = 'rotate(0deg)';
        audioBarIconBox.classList.remove('is-vinyl-disc', 'vinyl-spin-anim', 'vinyl-spin-decelerate');
      }

      document.querySelectorAll('.music-card').forEach(card => {
        card.classList.remove('is-decelerating', 'is-playing');
        const thumb = card.querySelector('.music-card-thumb');
        if (thumb) {
          thumb.style.transform = 'rotate(0deg)';
          thumb.classList.remove('is-vinyl-disc', 'vinyl-spin-anim', 'vinyl-spin-decelerate');
        }
      });

      invalidateVinylThumbCache();
    }
  }

  vinylDecelAnimId = requestAnimationFrame(stepDecel);
}

export function stopVinylSpinSmoothly(element, shouldSpin, durationMs = 600) {
  if (shouldSpin) {
    startVinylSpin(0.25);
  } else {
    stopVinylSpin(true, durationMs);
  }
}

function formatTime(seconds, isTotalDuration = false) {
  if (isNaN(seconds) || seconds < 0) return isTotalDuration ? '0:30' : '0:00';
  if (isTotalDuration) return '0:30';
  let secs = Math.floor(seconds);
  if (secs > 30) secs = 30;
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
}

function getAllInspiredTracks() {
  if (Array.isArray(INSPIRATION_TRACKS) && INSPIRATION_TRACKS.length > 0) {
    return INSPIRATION_TRACKS;
  }
  const tracks = [];
  const seen = new Set();
  if (!INSPIRED_ARTISTS_DATA) return tracks;
  Object.values(INSPIRED_ARTISTS_DATA).forEach(artistObj => {
    if (artistObj.pages) {
      artistObj.pages.forEach(page => {
        page.forEach(track => {
          const key = `${track.artist} - ${track.title}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            tracks.push(track);
          }
        });
      });
    }
  });
  return tracks;
}

export function initAudioPlayer() {
  const bottomAudioBar = document.getElementById('bottomAudioBar');
  const deckIdleView = document.getElementById('deckIdleView');
  const deckActiveView = document.getElementById('deckActiveView');
  const idlePlayBtn = document.getElementById('idlePlayBtn');

  const audioBarTitle = document.getElementById('audioBarTitle');
  const audioBarArtist = document.getElementById('audioBarArtist');
  const audioBarToggleBtn = document.getElementById('audioBarToggleBtn');
  const audioBarStreamBtn = document.getElementById('audioBarStreamBtn');
  const audioBarCoverImg = document.getElementById('audioBarCoverImg');
  const audioBarFallbackIcon = document.getElementById('audioBarFallbackIcon');
  const audioBarIconBox = document.getElementById('audioBarIconBox');
  const vaultAudioPlayer = document.getElementById('vaultAudioPlayer');

  const audioBarTimelineProgress = document.getElementById('audioBarTimelineProgress');
  const grooveRailTrack = document.getElementById('grooveRailTrack');
  const deckTimelineGroove = document.getElementById('deckTimelineGroove');
  const audioPlayerAnnouncer = document.getElementById('audioPlayerAnnouncer');
  const vinylStylusWrapper = document.getElementById('vinylStylusWrapper');
  const audioBarTime = document.getElementById('audioBarTime');

  const streamDrawerPanel = document.getElementById('streamDrawerPanel');
  const streamDrawerSongName = document.getElementById('streamDrawerSongName');
  const streamDrawerSongBtn = document.getElementById('streamDrawerSongBtn');
  const streamDrawerCopyIcon = document.getElementById('streamDrawerCopyIcon');
  const streamLinkSpotify = document.getElementById('streamLinkSpotify');
  const streamLinkApple = document.getElementById('streamLinkApple');
  const streamLinkYoutube = document.getElementById('streamLinkYoutube');
  const streamLinkAmazon = document.getElementById('streamLinkAmazon');
  const streamLinkSoundcloud = document.getElementById('streamLinkSoundcloud');
  const streamLinkBandcamp = document.getElementById('streamLinkBandcamp');

  // Tactile Mobile Haptic Feedback calibrated to song groove density
  function triggerHaptic(type = 'click') {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    const hapticStyle = vinylGrooveEngine?.currentProfile?.hapticType || 'medium';
    try {
      if (type === 'click') {
        navigator.vibrate(12);
      } else if (type === 'needle') {
        if (hapticStyle === 'heavy') navigator.vibrate([18, 25, 12]);
        else if (hapticStyle === 'light') navigator.vibrate([8, 10, 6]);
        else navigator.vibrate([14, 18, 10]);
      } else if (type === 'scrub') {
        if (hapticStyle === 'heavy') navigator.vibrate(8);
        else if (hapticStyle === 'light') navigator.vibrate(3);
        else navigator.vibrate(5);
      }
    } catch (e) {}
  }

  const vinylGrooveEngine = new VinylGrooveEngine();
  let isScrubbing = false;
  let lastX = 0;
  let lastTime = 0;
  let animFrameId = null;

  // Load stacked album covers in the idle view on initialization
  async function loadStackedAlbumCovers() {
    const cover1 = document.getElementById('stackCover1');
    const cover2 = document.getElementById('stackCover2');
    const cover3 = document.getElementById('stackCover3');

    const featured = [
      { artist: 'The Cure', title: 'Just Like Heaven' },
      { artist: 'Weezer', title: 'Do You Wanna Get High?' },
      { artist: 'Pulp', title: 'Common People' }
    ];

    const elements = [cover1, cover2, cover3];

    elements.forEach((imgEl) => {
      if (!imgEl) return;
      const fallback = imgEl.parentElement ? imgEl.parentElement.querySelector('.stack-fallback-icon') : null;
      if (imgEl.src && !imgEl.classList.contains('hidden')) {
        if (fallback) fallback.style.display = 'none';
      }
    });

    featured.forEach(async (item, index) => {
      const imgEl = elements[index];
      if (!imgEl) return;
      const fallback = imgEl.parentElement ? imgEl.parentElement.querySelector('.stack-fallback-icon') : null;
      try {
        const meta = await getITunesTrackData(item.artist, item.title);
        if (meta && meta.artworkUrl) {
          await loadAlbumArt(imgEl, meta.artworkUrl, meta.rawArtworkUrl);
          if (fallback) fallback.style.display = 'none';
        }
      } catch (err) {
        console.warn('Failed to load stacked album cover:', err);
      }
    });
  }

  loadStackedAlbumCovers();

  let cachedMusicSectionRect = null;

  function updateCachedMusicSectionRect() {
    const musicSection = document.getElementById('deckMusicSection');
    if (musicSection) {
      cachedMusicSectionRect = musicSection.getBoundingClientRect();
    }
  }

  window.addEventListener('resize', updateCachedMusicSectionRect, { passive: true });

  function showActiveView() {
    if (hasTransitionedToActive) return;
    hasTransitionedToActive = true;

    const deckMusicSection = document.getElementById('deckMusicSection');

    if (deckIdleView) deckIdleView.classList.add('hidden');
    if (deckActiveView) deckActiveView.classList.remove('hidden');

    if (deckMusicSection) {
      deckMusicSection.classList.remove('is-transitioning');
      requestAnimationFrame(() => {
        deckMusicSection.classList.add('is-transitioning');
      });
    }

    updateCachedMusicSectionRect();

    setTimeout(() => {
      if (deckMusicSection) deckMusicSection.classList.remove('is-transitioning');
      if (vinylStylusWrapper) {
        vinylStylusWrapper.classList.add('stylus-visible');
      }
    }, 450);
  }

  function showIdleView() {
    hasTransitionedToActive = false;
    const deckMusicSection = document.getElementById('deckMusicSection');
    if (deckMusicSection) deckMusicSection.classList.remove('is-transitioning');
    if (deckIdleView) deckIdleView.classList.remove('hidden');
    if (deckActiveView) deckActiveView.classList.add('hidden');
    if (vinylStylusWrapper) vinylStylusWrapper.classList.remove('stylus-visible');
  }

  function notifyPlaybackState() {
    window.dispatchEvent(new CustomEvent('trackPlaybackStateChanged', {
      detail: { track: currentPlayingTrack, isPlaying: isPlayingAudio }
    }));
    // External listeners (e.g. gig map rows) may have toggled is-playing classes — refresh cache
    invalidateVinylThumbCache();
  }

  let endingStartTime = 0;
  let endingStartCurrentTime = 0;
  const ENDING_DURATION_MS = 2400;

  function updateTimelineUI() {
    if (!vaultAudioPlayer || isScrubbing) return;
    const duration = 30;
    let currentTime = Math.min(30, Math.max(0, vaultAudioPlayer.currentTime || 0));

    // During the ending crossfade, smoothly interpolate the time counter, progress, and stylus to 30.0s
    if (isEndingSong) {
      const elapsed = performance.now() - endingStartTime;
      const progress = Math.min(1, elapsed / ENDING_DURATION_MS);
      currentTime = endingStartCurrentTime + (30 - endingStartCurrentTime) * Math.pow(progress, 0.92);
      currentTime = Math.min(30, Math.max(0, currentTime));
    }

    const pct = Math.min(100, Math.max(0, (currentTime / duration) * 100));

    if (audioBarTimelineProgress) audioBarTimelineProgress.style.transform = `scaleX(${pct / 100})`;
    if (grooveRailTrack) grooveRailTrack.style.transform = `scaleX(${pct / 100})`;
    setStylusPosition(pct);
    if (audioBarTime) {
      audioBarTime.textContent = `${formatTime(currentTime)} / 0:30`;
    }
  }

  // Stylus slides via compositor-friendly translateX (px derived strictly from inner clientWidth)
  function setStylusPosition(pct) {
    if (!vinylStylusWrapper) return;
    const musicSection = document.getElementById('deckMusicSection');
    if (!musicSection) return;

    // clientWidth is the exact inner width between borders (where left: 0 is anchored)
    const trackWidth = musicSection.clientWidth;
    if (!trackWidth || trackWidth <= 0) return;

    const clampedPct = Math.min(100, Math.max(0, pct));
    const needleX = trackWidth * (clampedPct / 100);

    // Exactly centers the 22px stylus needle (offset 11px) on needleX
    vinylStylusWrapper.style.transform = `translateX(${needleX - 11}px)`;

    if (deckTimelineGroove) {
      const curSec = Math.round((clampedPct / 100) * 30);
      deckTimelineGroove.setAttribute('aria-valuenow', curSec.toString());
      deckTimelineGroove.setAttribute('aria-valuetext', `${formatTime(curSec)} of 0:30`);
    }
  }

  function runVinylPhysicsStep(now) {
    if (!lastVinylFrameTime) lastVinylFrameTime = now;
    const dt = Math.min(50, Math.max(1, now - lastVinylFrameTime));
    lastVinylFrameTime = now;

    // Smooth exponential acceleration / deceleration momentum
    const lerpRate = targetAngularVelocity > vinylAngularVelocity ? 0.005 : 0.007;
    const lerp = Math.min(1, dt * lerpRate);
    vinylAngularVelocity += (targetAngularVelocity - vinylAngularVelocity) * lerp;

    if (vinylAngularVelocity > 0.004) {
      // 360 deg per 3.0s = 120 deg/s standard 33 RPM velocity
      const dAngle = (120 * dt / 1000) * vinylAngularVelocity;
      globalVinylAngle += dAngle;
      syncVinylInstances(globalVinylAngle, true);
      return true;
    } else {
      vinylAngularVelocity = 0;
      return false;
    }
  }

  function renderPlaybackLoop(now = performance.now()) {
    if (isPlayingAudio && vaultAudioPlayer && !isScrubbing) {
      updateTimelineUI();
      checkAutoFadeOut();
    }

    const isSpinning = runVinylPhysicsStep(now);

    if (isPlayingAudio || isSpinning || isDeceleratingToStop) {
      animFrameId = requestAnimationFrame(renderPlaybackLoop);
    } else {
      animFrameId = null;
    }
  }

  function startTimelineAnimation() {
    lastVinylFrameTime = performance.now();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderPlaybackLoop);
  }

  function stopTimelineAnimation() {
    if (animFrameId && !isDeceleratingToStop) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }
  window._startTimelineAnimation = startTimelineAnimation;

  function seekToPosition(clientX) {
    if (!vaultAudioPlayer) return;
    const musicSection = document.getElementById('deckMusicSection');
    if (!musicSection) return;

    const rect = musicSection.getBoundingClientRect();
    const borderLeft = musicSection.clientLeft || 3;
    const trackWidth = musicSection.clientWidth || (rect.width - 6);
    if (!trackWidth || trackWidth <= 0) return;

    const innerX = clientX - (rect.left + borderLeft);
    const pctRatio = Math.max(0, Math.min(1, innerX / trackWidth));
    const pct = pctRatio * 100;
    const duration = 30;
    const newTime = pctRatio * duration;

    if (isFinite(newTime)) {
      vaultAudioPlayer.currentTime = newTime;
    }

    if (audioBarTimelineProgress) audioBarTimelineProgress.style.transform = `scaleX(${pctRatio})`;
    if (grooveRailTrack) grooveRailTrack.style.transform = `scaleX(${pctRatio})`;
    setStylusPosition(pct);
    if (audioBarTime) {
      audioBarTime.textContent = `${formatTime(newTime)} / 0:30`;
    }
  }

  let activePointerId = null;

  function handleScrubStart(clientX, target, pointerId = null) {
    if (!target || !target.closest) return false;
    if (target.closest('button, #floatingGigPillBtn, .tab-gigmap, .gig-soon-diagonal-banner') || !currentPlayingTrack) {
      return false;
    }

    isScrubbing = true;
    cancelVinylSpeedRamp();
    activePointerId = pointerId;
    updateCachedMusicSectionRect();
    if (bottomAudioBar) bottomAudioBar.classList.add('is-scrubbing');
    document.body.classList.add('is-scrubbing');

    lastX = clientX;
    lastTime = performance.now();
    lastVinylFrameTime = performance.now();

    vinylGrooveEngine.playNeedleDrop();
    const curTime = vaultAudioPlayer ? (vaultAudioPlayer.currentTime || 0) : 0;
    const normPos = Math.max(0, Math.min(1, curTime / 30));
    vinylGrooveEngine.startScratch(curTime, normPos);
    triggerHaptic('needle');
    seekToPosition(clientX);
    return true;
  }

  function handleScrubMove(clientX) {
    if (!isScrubbing) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    const dx = clientX - lastX;
    const velocity = dx / dt;

    lastX = clientX;
    lastTime = now;
    lastVinylFrameTime = now;

    // Direct rotational seek mapping: forward scrub rotates forward, backward scrub reverses rotation
    const scrubAngleDelta = dx * 1.8;
    globalVinylAngle += scrubAngleDelta;
    syncVinylInstances(globalVinylAngle, true);

    if (vinylStylusWrapper) {
      if (velocity > 0.03) {
        vinylStylusWrapper.classList.add('tilt-forward');
        vinylStylusWrapper.classList.remove('tilt-backward');
      } else if (velocity < -0.03) {
        vinylStylusWrapper.classList.add('tilt-backward');
        vinylStylusWrapper.classList.remove('tilt-forward');
      }
    }

    // Dynamic dual-layer song-specific groove scratch & inner groove distortion
    const curTime = vaultAudioPlayer ? (vaultAudioPlayer.currentTime || 0) : 0;
    const normPos = Math.max(0, Math.min(1, curTime / 30));
    vinylGrooveEngine.updateScratch(velocity, curTime, normPos);
    triggerHaptic('scrub');

    seekToPosition(clientX);
  }

  function handleScrubEnd() {
    if (!isScrubbing) return;
    isScrubbing = false;
    activePointerId = null;
    if (bottomAudioBar) bottomAudioBar.classList.remove('is-scrubbing');
    document.body.classList.remove('is-scrubbing');

    if (vinylStylusWrapper) {
      vinylStylusWrapper.classList.remove('tilt-forward', 'tilt-backward');
    }

    vinylGrooveEngine.stopScratch();

    if (vaultAudioPlayer) {
      vaultAudioPlayer.playbackRate = 1.0;
      try {
        vaultAudioPlayer.preservesPitch = true;
        if (vaultAudioPlayer.mozPreservesPitch !== undefined) vaultAudioPlayer.mozPreservesPitch = true;
        if (vaultAudioPlayer.webkitPreservesPitch !== undefined) vaultAudioPlayer.webkitPreservesPitch = true;
      } catch (e) {}

      const duration = 30;
      if (vaultAudioPlayer.currentTime >= duration - 0.05) {
        vaultAudioPlayer.currentTime = duration;
        isPlayingAudio = false;
        targetAngularVelocity = 0;
        stopTimelineAnimation();
        updateTimelineUI();
        updateToggleBtnState(false);
        return;
      }
    }

    // Resume standard playback rotation velocity upon seek release smoothly
    if (isPlayingAudio) {
      targetAngularVelocity = 1.0;
      vinylAngularVelocity = Math.max(0.7, vinylAngularVelocity);
      startTimelineAnimation();
    }
  }

  // Interactive Timeline Scrubbing with pointer & mobile touch support
  // Pointer moves are rAF-coalesced; the non-passive touchmove is attached only while scrubbing
  let pendingScrubX = null;
  let scrubRafId = null;

  function scheduleScrubMove(clientX) {
    pendingScrubX = clientX;
    if (scrubRafId !== null) return;
    scrubRafId = requestAnimationFrame(() => {
      scrubRafId = null;
      if (isScrubbing && pendingScrubX !== null) {
        handleScrubMove(pendingScrubX);
        pendingScrubX = null;
      }
    });
  }

  function onWindowTouchMove(e) {
    if (!isScrubbing) return;
    if (e.touches && e.touches.length > 0) {
      e.preventDefault();
      scheduleScrubMove(e.touches[0].clientX);
    }
  }

  function attachScrubTouchListeners() {
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
  }

  function detachScrubTouchListeners() {
    window.removeEventListener('touchmove', onWindowTouchMove);
    if (scrubRafId !== null) {
      cancelAnimationFrame(scrubRafId);
      scrubRafId = null;
    }
    pendingScrubX = null;
  }

  if (bottomAudioBar) {
    // 1. Mouse & Desktop Pointer Events
    bottomAudioBar.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // Handled directly with touchstart for zero-lag mobile tracking
      if (handleScrubStart(e.clientX, e.target, e.pointerId)) {
        try { bottomAudioBar.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (isScrubbing && e.pointerType !== 'touch') {
        scheduleScrubMove(e.clientX);
      }
    }, { passive: true });

    window.addEventListener('pointerup', (e) => {
      if (isScrubbing && e.pointerType !== 'touch') {
        try { if (e && e.pointerId) bottomAudioBar.releasePointerCapture(e.pointerId); } catch (err) {}
        handleScrubEnd();
      }
    });

    // 2. Direct Touch Event Handlers for Mobile WebKit & Android Chrome
    bottomAudioBar.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        if (handleScrubStart(touch.clientX, e.target)) {
          e.preventDefault();
          attachScrubTouchListeners();
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (isScrubbing) handleScrubEnd();
      detachScrubTouchListeners();
    }, { passive: true });

    window.addEventListener('touchcancel', (e) => {
      if (isScrubbing) handleScrubEnd();
      detachScrubTouchListeners();
    }, { passive: true });
  }

  function cleanSearchQuery(artist, title) {
    const cleanTitle = (title || '')
      .replace(/\s*[\(\[](?:(?:\d{4}\s+)?(?:re)?master(?:ed)?|live|deluxe|bonus|mono|stereo|anniversary|expanded|edition|version)[^\)\]]*[\)\]]/gi, '')
      .replace(/\s*-\s*(?:(?:\d{4}\s+)?(?:re)?master(?:ed)?|live|mono|stereo).*/gi, '')
      .trim();
    const cleanArtist = (artist || 'Kins').trim();
    return encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
  }

  function updateStreamLinks(trackObj) {
    if (!trackObj) return;
    const query = cleanSearchQuery(trackObj.artist, trackObj.title);
    if (streamDrawerSongName) streamDrawerSongName.textContent = `"${trackObj.title}"`;

    if (streamLinkSpotify) streamLinkSpotify.href = `https://open.spotify.com/search/${query}`;
    if (streamLinkApple) streamLinkApple.href = `https://music.apple.com/us/search?term=${query}`;
    if (streamLinkYoutube) streamLinkYoutube.href = `https://music.youtube.com/search?q=${query}`;
    if (streamLinkAmazon) streamLinkAmazon.href = `https://music.amazon.com/search/${query}`;
    if (streamLinkSoundcloud) streamLinkSoundcloud.href = `https://soundcloud.com/search?q=${query}`;
    if (streamLinkBandcamp) streamLinkBandcamp.href = `https://bandcamp.com/search?q=${query}`;
  }

  async function copySongInfoToClipboard() {
    const rawSong = streamDrawerSongName?.textContent?.replace(/^["']|["']$/g, '').trim();
    const artistName = (currentPlayingTrack && currentPlayingTrack.artist) ? currentPlayingTrack.artist.trim() : 'Kins';
    const songTitle = (currentPlayingTrack && currentPlayingTrack.title) ? currentPlayingTrack.title.trim() : (rawSong || 'Track');

    const copyText = `${songTitle} by ${artistName}`;

    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(copyText);
        copied = true;
      } catch (err) {}
    }

    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = copyText;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (err) {}
    }

    triggerHaptic('click');

    if (streamDrawerSongBtn) {
      streamDrawerSongBtn.classList.add('is-copied');
      if (streamDrawerCopyIcon) {
        streamDrawerCopyIcon.className = 'fa-solid fa-check copy-hint-icon';
      }
      setTimeout(() => {
        if (streamDrawerSongBtn) streamDrawerSongBtn.classList.remove('is-copied');
        if (streamDrawerCopyIcon) streamDrawerCopyIcon.className = 'fa-regular fa-copy copy-hint-icon';
      }, 1800);
    }

    showToast(`Copied: "${songTitle}" by ${artistName}`);
  }

  if (streamDrawerSongBtn) {
    streamDrawerSongBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copySongInfoToClipboard();
    });
  }

  function updateMediaSession(trackObj, coverUrl) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !trackObj) return;
    try {
      const artwork = [];
      if (coverUrl) {
        artwork.push({ src: coverUrl, sizes: '300x300', type: 'image/webp' });
        artwork.push({ src: coverUrl, sizes: '512x512', type: 'image/webp' });
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackObj.title,
        artist: `${trackObj.artist || 'Kins'} (KINS Inspiration)`,
        album: 'KINS Studio Inspiration Vault',
        artwork: artwork.length > 0 ? artwork : undefined
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioBarToggleBtn) audioBarToggleBtn.click();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioBarToggleBtn) audioBarToggleBtn.click();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextMixSong();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playNextMixSong();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (vaultAudioPlayer && details.seekTime !== undefined) {
          vaultAudioPlayer.currentTime = Math.min(30, Math.max(0, details.seekTime));
          updateTimelineUI();
        }
      });
      navigator.mediaSession.playbackState = 'playing';
    } catch (e) {}
  }

  function updateMediaSessionState(playing) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    } catch (e) {}
  }

  function toggleStreamDrawer(forceOpen) {
    if (!streamDrawerPanel || !audioBarStreamBtn) return;
    const shouldOpen = forceOpen !== undefined ? forceOpen : streamDrawerPanel.classList.contains('hidden');

    if (shouldOpen) {
      if (currentPlayingTrack) updateStreamLinks(currentPlayingTrack);
      streamDrawerPanel.classList.remove('hidden');
      requestAnimationFrame(() => {
        streamDrawerPanel.classList.add('active-drawer');
        audioBarStreamBtn.classList.add('active');
        document.body.classList.add('stream-panel-open');
      });
    } else {
      streamDrawerPanel.classList.remove('active-drawer');
      audioBarStreamBtn.classList.remove('active');
      document.body.classList.remove('stream-panel-open');
      setTimeout(() => {
        if (!audioBarStreamBtn.classList.contains('active')) {
          streamDrawerPanel.classList.add('hidden');
        }
      }, 300);
    }
  }

  function updateToggleBtnState(playing, loading = false) {
    if (!audioBarToggleBtn) return;

    const currentIsPause = audioBarToggleBtn.querySelector('.fa-pause') !== null;
    const currentIsSpinner = audioBarToggleBtn.querySelector('.fa-circle-notch') !== null;

    if (loading && !currentIsSpinner) {
      audioBarToggleBtn.classList.remove('icon-morph');
      audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
    } else if (!loading && (currentIsPause !== playing || currentIsSpinner)) {
      audioBarToggleBtn.classList.remove('icon-morph');
      audioBarToggleBtn.innerHTML = `<i class="fa-solid ${playing ? 'fa-pause' : 'fa-play'}"></i>`;
      requestAnimationFrame(() => {
        audioBarToggleBtn.classList.add('icon-morph');
        setTimeout(() => audioBarToggleBtn.classList.remove('icon-morph'), 350);
      });
    }

    if (vinylStylusWrapper) {
      if (playing) {
        vinylStylusWrapper.classList.add('is-playing');
        vinylStylusWrapper.classList.remove('is-paused');
      } else {
        vinylStylusWrapper.classList.remove('is-playing');
        vinylStylusWrapper.classList.add('is-paused');
      }
    }

    if (playing) {
      document.body.classList.add('is-audio-playing');
    } else {
      document.body.classList.remove('is-audio-playing');
    }

    if (audioBarIconBox) {
      stopVinylSpinSmoothly(audioBarIconBox, playing);
    }

    updateMediaSessionState(playing);
    notifyPlaybackState();
  }

  function setMiniPlayerCover(url) {
    if (url && audioBarCoverImg) {
      loadAlbumArt(audioBarCoverImg, url).then(() => {
        if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'none';
      }).catch(() => {
        if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'flex';
      });
    } else if (audioBarCoverImg) {
      audioBarCoverImg.src = '';
      audioBarCoverImg.classList.add('hidden');
      if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'flex';
    }
  }

  let currentFadeInterval = null;
  let isFadingOut = false;
  let isEndingSong = false;
  let isTransitioningTrack = false;
  let mixQueue = [];
  let autoMixTimeout = null;

  let currentFadeRaf = null;

  function cancelFade() {
    if (currentFadeInterval) {
      clearInterval(currentFadeInterval);
      currentFadeInterval = null;
    }
    if (currentFadeRaf !== null) {
      cancelAnimationFrame(currentFadeRaf);
      currentFadeRaf = null;
    }
    isFadingOut = false;
  }

  function fadeAudioVolume(startVol, targetVol, durationMs, expectedStopGeneration = null) {
    return new Promise((resolve) => {
      if (!vaultAudioPlayer) return resolve();
      cancelFade();

      try {
        vaultAudioPlayer.volume = Math.max(0, Math.min(1, startVol));
      } catch (e) {
        return resolve();
      }

      if (durationMs <= 0 || startVol === targetVol) {
        try {
          vaultAudioPlayer.volume = Math.max(0, Math.min(1, targetVol));
        } catch (e) {}
        return resolve();
      }

      const startTime = performance.now();

      function step(now) {
        if (expectedStopGeneration !== null && expectedStopGeneration !== vinylStopGeneration) {
          cancelFade();
          return resolve();
        }

        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Smooth sine ease curve for natural acoustic volume roll-off
        const ease = Math.sin((progress * Math.PI) / 2);
        const newVol = startVol + (targetVol - startVol) * ease;

        try {
          if (vaultAudioPlayer) {
            vaultAudioPlayer.volume = Math.max(0, Math.min(1, newVol));
          }
        } catch (e) {}

        if (progress < 1) {
          currentFadeRaf = requestAnimationFrame(step);
        } else {
          try {
            if (vaultAudioPlayer) {
              vaultAudioPlayer.volume = Math.max(0, Math.min(1, targetVol));
            }
          } catch (e) {}
          currentFadeRaf = null;
          isFadingOut = false;
          resolve();
        }
      }

      currentFadeRaf = requestAnimationFrame(step);
    });
  }

  function fadeOutAudio(durationMs = 450, expectedStopGen = null) {
    if (!vaultAudioPlayer || vaultAudioPlayer.paused) return Promise.resolve();
    isFadingOut = true;
    let currentVol = 1.0;
    try {
      currentVol = typeof vaultAudioPlayer.volume === 'number' ? vaultAudioPlayer.volume : 1.0;
    } catch (e) {}
    return fadeAudioVolume(currentVol, 0, durationMs, expectedStopGen);
  }

  function fadeInAudio(durationMs = 1200, targetVol = 1.0) {
    if (!vaultAudioPlayer) return Promise.resolve();
    isFadingOut = false;
    isEndingSong = false;
    return fadeAudioVolume(0, targetVol, durationMs);
  }

  function checkAutoFadeOut() {
    if (!vaultAudioPlayer || isScrubbing || !isPlayingAudio || isEndingSong || isTransitioningTrack) return;
    const duration = vaultAudioPlayer.duration || 30;
    if (duration && duration > 5) {
      const timeLeft = duration - vaultAudioPlayer.currentTime;
      // Start smooth continuous transition 2.4s before track ends
      if (timeLeft <= 2.4 && timeLeft > 0.3) {
        isEndingSong = true;
        endingStartTime = performance.now();
        endingStartCurrentTime = vaultAudioPlayer.currentTime || 27.5;

        triggerVinylSpinDownAndStop(ENDING_DURATION_MS, false).then(() => {
          isEndingSong = false;
          if (!isScrubbing) {
            setTimeout(() => {
              playNextMixSong();
            }, 250);
          }
        });
      }
    }
  }

  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  let secondaryPreloadAudio = null;

  function prebufferUpcomingTrack(track) {
    if (!track) return;
    try {
      if (!secondaryPreloadAudio && typeof Audio !== 'undefined') {
        secondaryPreloadAudio = new Audio();
        secondaryPreloadAudio.muted = true;
      }
      if (track.previewUrl && secondaryPreloadAudio) {
        const secureUrl = track.previewUrl.replace(/^http:\/\//i, 'https://');
        if (secondaryPreloadAudio.src !== secureUrl) {
          secondaryPreloadAudio.preload = 'auto';
          secondaryPreloadAudio.src = secureUrl;
          secondaryPreloadAudio.load();
        }
      }
    } catch (e) {}

    // Pre-cache upcoming artwork in memory
    const cover = track.coverUrl || track.artworkUrl;
    if (cover && typeof Image !== 'undefined') {
      const img = new Image();
      img.decoding = 'async';
      img.src = cover;
    }
  }

  function peekNextTrack() {
    if (mixQueue.length === 0) {
      const all = getAllInspiredTracks();
      if (all.length === 0) return null;
      mixQueue = shuffleArray(all);
      if (currentPlayingTrack && mixQueue.length > 1 && mixQueue[0].title === currentPlayingTrack.title) {
        mixQueue.push(mixQueue.shift());
      }
    }
    return mixQueue.length > 0 ? mixQueue[0] : null;
  }

  function getNextMixTrack() {
    if (mixQueue.length === 0) {
      const all = getAllInspiredTracks();
      if (all.length === 0) return null;
      mixQueue = shuffleArray(all);
      // Ensure we don't repeat the currently playing track immediately if queue has multiple songs
      if (currentPlayingTrack && mixQueue.length > 1 && mixQueue[0].title === currentPlayingTrack.title) {
        mixQueue.push(mixQueue.shift());
      }
    }
    const next = mixQueue.shift();
    // Look ahead to pre-buffer the track following this one
    const upcoming = peekNextTrack();
    if (upcoming) {
      prebufferUpcomingTrack(upcoming);
    }
    return next;
  }

  function playNextMixSong() {
    clearTimeout(autoMixTimeout);
    const nextTrack = getNextMixTrack();
    if (nextTrack && window.playTrackPreview) {
      window.playTrackPreview(nextTrack);
    }
  }

  function startAutoMix() {
    clearTimeout(autoMixTimeout);
    const allTracks = getAllInspiredTracks();
    if (allTracks.length === 0) return;
    mixQueue = shuffleArray(allTracks);
    const firstTrack = mixQueue.shift();
    const secondTrack = peekNextTrack();
    if (secondTrack) {
      prebufferUpcomingTrack(secondTrack);
    }
    if (firstTrack && window.playTrackPreview) {
      window.playTrackPreview(firstTrack);
      showToast(`Auto-Mix Started: "${firstTrack.title}"`);
    }
  }

  // Click on idle view triggers auto-mix through all tracks
  if (deckIdleView) {
    deckIdleView.addEventListener('click', (e) => {
      e.stopPropagation();
      startAutoMix();
    });
  }

  if (idlePlayBtn) {
    idlePlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startAutoMix();
    });
  }

  let vinylSpeedInterval = null;

  function cancelVinylSpeedRamp() {
    if (vinylSpeedInterval) {
      clearInterval(vinylSpeedInterval);
      vinylSpeedInterval = null;
    }
    if (vaultAudioPlayer) {
      vaultAudioPlayer.playbackRate = 1.0;
      try {
        vaultAudioPlayer.preservesPitch = true;
        if (vaultAudioPlayer.mozPreservesPitch !== undefined) vaultAudioPlayer.mozPreservesPitch = true;
        if (vaultAudioPlayer.webkitPreservesPitch !== undefined) vaultAudioPlayer.webkitPreservesPitch = true;
      } catch (e) {}
    }
  }

  // Strictly preserve 1.0x playback rate for audio while visual rotation accelerates smoothly
  function rampVinylSpeedUp() {
    cancelVinylSpeedRamp();
  }

  function rampVinylSpeedDown() {
    cancelVinylSpeedRamp();
    return Promise.resolve();
  }

  function triggerNeedleDropAndSpinUp(isResume = false) {
    if (vinylGrooveEngine) {
      vinylGrooveEngine.playVinylNeedleSpinUp();
    }
    startVinylSpin(isResume ? 0.45 : 0.25);
    cancelVinylSpeedRamp();

    if (vaultAudioPlayer) {
      vaultAudioPlayer.playbackRate = 1.0;
      try {
        vaultAudioPlayer.preservesPitch = true;
        if (vaultAudioPlayer.mozPreservesPitch !== undefined) vaultAudioPlayer.mozPreservesPitch = true;
        if (vaultAudioPlayer.webkitPreservesPitch !== undefined) vaultAudioPlayer.webkitPreservesPitch = true;
      } catch (e) {}
    }

    if (vinylStylusWrapper) {
      vinylStylusWrapper.classList.remove('needle-drop-bounce');
      void vinylStylusWrapper.offsetWidth; // force reflow
      vinylStylusWrapper.classList.add('needle-drop-bounce');
      setTimeout(() => {
        if (vinylStylusWrapper) vinylStylusWrapper.classList.remove('needle-drop-bounce');
      }, 450);
    }
  }

  // Bumped whenever playback resumes (or a newer stop begins). Any in-flight
  // spin-down whose generation is stale must NOT call pause() — this kills the
  // rapid-toggle race where the old fade-out silently killed resumed playback.
  let vinylStopGeneration = 0;

  async function triggerVinylSpinDownAndStop(durationMs = 550, morphToSquare = true) {
    if (!vaultAudioPlayer || vaultAudioPlayer.paused) return;
    const stopGeneration = ++vinylStopGeneration;

    // 1. Play procedural vinyl surface deceleration & brake noise
    if (vinylGrooveEngine) {
      vinylGrooveEngine.playVinylNeedleSpinDown(durationMs);
    }

    // 2. Animate stylus tonearm disengage lift
    if (vinylStylusWrapper) {
      vinylStylusWrapper.classList.add('tilt-backward');
      setTimeout(() => {
        if (vinylStylusWrapper) vinylStylusWrapper.classList.remove('tilt-backward');
      }, durationMs);
    }

    if (morphToSquare) {
      stopVinylSpin(true, durationMs);
    }

    // 3. Silky smooth, stutter-free volume fade-out:
    // Strictly preserve playbackRate = 1.0 so WebKit/Blink resamplers NEVER stutter or glitch.
    // Smoothly ramp volume down to 0 via requestAnimationFrame over durationMs.
    cancelVinylSpeedRamp();

    await fadeOutAudio(durationMs, stopGeneration);

    // Superseded by a resume/newer transition — leave playback alone
    if (stopGeneration !== vinylStopGeneration) return;

    if (vaultAudioPlayer) {
      vaultAudioPlayer.pause();
      try {
        vaultAudioPlayer.volume = 1.0;
        vaultAudioPlayer.playbackRate = 1.0;
      } catch (e) {}
    }

    if (morphToSquare) {
      isPlayingAudio = false;
      stopTimelineAnimation();
      updateMediaSessionState(false);
    }
  }

  function triggerSongChangeWipe() {
    const deckMusicSection = document.getElementById('deckMusicSection');
    if (!deckMusicSection) return;

    deckMusicSection.classList.remove('is-song-changing');
    void deckMusicSection.offsetWidth; // force reflow
    deckMusicSection.classList.add('is-song-changing');

    // Needle lift micro-interaction on song change
    if (vinylStylusWrapper) {
      vinylStylusWrapper.classList.add('tilt-backward');
      setTimeout(() => {
        if (vinylStylusWrapper) vinylStylusWrapper.classList.remove('tilt-backward');
      }, 450);
    }

    setTimeout(() => {
      if (deckMusicSection) deckMusicSection.classList.remove('is-song-changing');
    }, 850);
  }

  let currentTransitionId = 0;

  window.playTrackPreview = async function(trackObj) {
    if (!trackObj || !trackObj.title) return;
    clearTimeout(autoMixTimeout);
    const transitionId = ++currentTransitionId;

    // 0. Synchronously unlock Web Audio API context on mobile touch/click
    if (vinylGrooveEngine) {
      vinylGrooveEngine.init();
      if (vinylGrooveEngine.ctx && vinylGrooveEngine.ctx.state === 'suspended') {
        vinylGrooveEngine.ctx.resume().catch(() => {});
      }
    }

    // 1. Handling PAUSE & RESUME of the currently playing track
    if (currentPlayingTrack && currentPlayingTrack.title === trackObj.title) {
      isPlayingAudio = !isPlayingAudio;
      if (isPlayingAudio) {
        // Invalidate any in-flight spin-down so its fade can't kill this resume
        vinylStopGeneration++;
        cancelFade();
        cancelVinylSpeedRamp();
        triggerHaptic('click');
        updateToggleBtnState(true);
        triggerNeedleDropAndSpinUp(true);
        if (vaultAudioPlayer) {
          vaultAudioPlayer.volume = 1.0;
          vaultAudioPlayer.playbackRate = 1.0;
          vaultAudioPlayer.play().catch((err) => {
            console.warn('Resume play failed:', err);
          });
          startTimelineAnimation();
        }
        showToast(`Resumed: "${trackObj.title}"`);
      } else {
        triggerHaptic('click');
        updateToggleBtnState(false);
        showToast(`Paused: "${trackObj.title}"`);
        await triggerVinylSpinDownAndStop(450, true);
      }
      return;
    }

    // 2. Synchronously check if previewUrl and artwork are already available
    let previewUrl = trackObj.previewUrl;
    let coverUrl = trackObj.coverUrl || trackObj.artworkUrl;

    if (!previewUrl || !coverUrl) {
      const cacheKey = `${trackObj.artist} - ${trackObj.title}`.toLowerCase().trim();
      const cached = ITUNES_CACHE.get(cacheKey);
      if (cached) {
        if (cached.previewUrl) {
          previewUrl = cached.previewUrl;
          trackObj.previewUrl = previewUrl;
        }
        if (cached.artworkUrl) {
          coverUrl = cached.artworkUrl;
          trackObj.coverUrl = coverUrl;
          trackObj.artworkUrl = coverUrl;
        }
      }
    }

    // Helper to start playback once preview URL and cover are ready
    function startTrackPlayback(pUrl, cUrl) {
      if (transitionId !== currentTransitionId) return;

      if (!hasTransitionedToActive) {
        showActiveView();
      } else {
        triggerSongChangeWipe();
      }

      currentPlayingTrack = trackObj;
      updateStreamLinks(currentPlayingTrack);
      if (vinylGrooveEngine) {
        vinylGrooveEngine.loadTrack(currentPlayingTrack);
      }

      if (audioBarTitle) {
        audioBarTitle.textContent = trackObj.title;
        audioBarTitle.classList.remove('is-scrolling');
        requestAnimationFrame(() => {
          const parent = audioBarTitle.parentElement;
          if (parent && audioBarTitle.scrollWidth > parent.clientWidth + 2) {
            const scrollDist = -(audioBarTitle.scrollWidth - parent.clientWidth + 16);
            audioBarTitle.style.setProperty('--scroll-dist', `${scrollDist}px`);
            audioBarTitle.classList.add('is-scrolling');
          }
        });
      }
      if (audioBarArtist) audioBarArtist.textContent = trackObj.artist || 'Kins';
      setMiniPlayerCover(cUrl || null);

      // Reset timeline progress and transitions for incoming track
      if (audioBarTimelineProgress) {
        audioBarTimelineProgress.style.transition = '';
        audioBarTimelineProgress.style.transform = 'scaleX(0)';
      }
      if (grooveRailTrack) {
        grooveRailTrack.style.transition = '';
        grooveRailTrack.style.transform = 'scaleX(0)';
      }
      if (vinylStylusWrapper) {
        vinylStylusWrapper.style.transition = '';
        vinylStylusWrapper.style.transform = 'translateX(-11px)';
      }
      if (audioBarTime) {
        audioBarTime.textContent = '0:00 / 0:30';
      }

      if (vaultAudioPlayer && pUrl) {
        const secureUrl = pUrl.replace(/^http:\/\//i, 'https://');
        if (vaultAudioPlayer.src !== secureUrl) {
          vaultAudioPlayer.src = secureUrl;
        }
        vaultAudioPlayer.playbackRate = 1.0;
        vaultAudioPlayer.volume = 1.0;
        try {
          vaultAudioPlayer.preservesPitch = true;
          vaultAudioPlayer.mozPreservesPitch = true;
          vaultAudioPlayer.webkitPreservesPitch = true;
        } catch (e) {}

        const playPromise = vaultAudioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (transitionId !== currentTransitionId) return;
            try {
              triggerNeedleDropAndSpinUp(false);
            } catch (e) {}
            isTransitioningTrack = false;
            isPlayingAudio = true;
            startTimelineAnimation();
            updateToggleBtnState(true);
            updateMediaSession(trackObj, cUrl);
            if (audioPlayerAnnouncer) {
              audioPlayerAnnouncer.textContent = `Now playing: ${trackObj.title} by ${trackObj.artist || 'Kins'}`;
            }
            showToast(`Now Playing: "${trackObj.title}" by ${trackObj.artist}`);
            const upcoming = peekNextTrack();
            if (upcoming) {
              prebufferUpcomingTrack(upcoming);
            }
          }).catch(err => {
            if (transitionId !== currentTransitionId) return;
            console.warn('Playback error:', err);
            isTransitioningTrack = false;
            isPlayingAudio = false;
            stopTimelineAnimation();
            updateToggleBtnState(false);
            showToast(`Unable to play preview for "${trackObj.title}"`);
            autoMixTimeout = setTimeout(() => {
              playNextMixSong();
            }, 1500);
          });
        }
      } else {
        isTransitioningTrack = false;
        isPlayingAudio = false;
        stopTimelineAnimation();
        updateToggleBtnState(false);
        showToast(`Audio preview unavailable for "${trackObj.title}"`);
        autoMixTimeout = setTimeout(() => {
          playNextMixSong();
        }, 1500);
      }
    }

    // FAST-PATH: If previewUrl is available synchronously, play IMMEDIATELY within user-gesture context!
    if (previewUrl) {
      isTransitioningTrack = true;
      startTrackPlayback(previewUrl, coverUrl);
      return;
    }

    // ASYNC FALLBACK: If previewUrl is not yet loaded, prime the audio element first, then fetch metadata
    isTransitioningTrack = true;
    if (vaultAudioPlayer) {
      try {
        vaultAudioPlayer.load();
      } catch (e) {}
    }

    const meta = await getITunesTrackData(trackObj.artist, trackObj.title);
    if (meta) {
      if (meta.previewUrl) {
        previewUrl = meta.previewUrl;
        trackObj.previewUrl = previewUrl;
      }
      if (meta.artworkUrl) {
        coverUrl = meta.artworkUrl;
        trackObj.coverUrl = coverUrl;
        trackObj.artworkUrl = coverUrl;
      }
    }

    if (transitionId !== currentTransitionId) return;
    startTrackPlayback(previewUrl, coverUrl);
  };

  if (vaultAudioPlayer) {
    vaultAudioPlayer.addEventListener('play', () => {
      isPlayingAudio = true;
      startTimelineAnimation();
      updateToggleBtnState(true);
    });

    vaultAudioPlayer.addEventListener('pause', () => {
      isPlayingAudio = false;
      stopTimelineAnimation();
      updateToggleBtnState(false);
    });

    vaultAudioPlayer.addEventListener('ended', () => {
      if (isScrubbing) return;
      isPlayingAudio = false;
      stopTimelineAnimation();
      updateTimelineUI();
      updateToggleBtnState(false);
      // Auto-mix through to the next song continuously with DJ breather
      autoMixTimeout = setTimeout(() => {
        playNextMixSong();
      }, 400);
    });

    vaultAudioPlayer.addEventListener('timeupdate', updateTimelineUI);
    vaultAudioPlayer.addEventListener('loadedmetadata', updateTimelineUI);
  }

  if (audioBarStreamBtn) {
    audioBarStreamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStreamDrawer();
    });
  }

  if (audioBarToggleBtn) {
    audioBarToggleBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      triggerHaptic('click');
      if (!currentPlayingTrack) {
        startAutoMix();
        return;
      }
      isPlayingAudio = !isPlayingAudio;
      if (isPlayingAudio) {
        // Invalidate any in-flight spin-down so its fade can't kill this resume
        vinylStopGeneration++;
        cancelFade();
        cancelVinylSpeedRamp();
        updateToggleBtnState(true);
        triggerNeedleDropAndSpinUp(true);
        if (vaultAudioPlayer) {
          vaultAudioPlayer.volume = 1.0;
          vaultAudioPlayer.playbackRate = 1.0;
          vaultAudioPlayer.play().catch(() => {});
          startTimelineAnimation();
        }
        showToast(`Resumed: "${currentPlayingTrack.title}"`, 'music');
      } else {
        updateToggleBtnState(false);
        showToast(`Paused: "${currentPlayingTrack.title}"`, 'music');
        await triggerVinylSpinDownAndStop(450, true);
      }
    });
  }

  let isExitFading = false;

  async function fadeOutAndPauseCleanly(durationMs = 600) {
    if (!isPlayingAudio || !vaultAudioPlayer || isExitFading) return;
    isExitFading = true;
    try {
      const stopGeneration = ++vinylStopGeneration;
      if (typeof fadeOutAudio === 'function') {
        await fadeOutAudio(durationMs);
      }
      // User resumed/toggled while we were fading — don't pause out from under them
      if (stopGeneration !== vinylStopGeneration) return;
      if (vaultAudioPlayer) {
        vaultAudioPlayer.pause();
        vaultAudioPlayer.playbackRate = 1.0;
        vaultAudioPlayer.volume = 1.0;
      }
      cancelVinylSpeedRamp();
      isPlayingAudio = false;
      updateToggleBtnState(false);
      stopTimelineAnimation();
      updateTimelineUI();
    } catch (e) {
      if (vaultAudioPlayer) vaultAudioPlayer.pause();
    } finally {
      isExitFading = false;
    }
  }

  function pauseAudioCleanly() {
    if (!isPlayingAudio) return;
    cancelVinylSpeedRamp();
    if (vinylGrooveEngine) vinylGrooveEngine.stopScratch();
    isPlayingAudio = false;
    updateToggleBtnState(false);
    if (vaultAudioPlayer) {
      vaultAudioPlayer.pause();
      vaultAudioPlayer.playbackRate = 1.0;
      vaultAudioPlayer.volume = 1.0;
    }
    stopTimelineAnimation();
    updateTimelineUI();
  }

  window.pauseAudioPlayback = pauseAudioCleanly;

  // 1. Smooth fade-out audio when leaving website, switching tabs, minimizing browser, or locking screen
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      if (isPlayingAudio) {
        fadeOutAndPauseCleanly(600);
      }
    } else {
      if (isPlayingAudio) {
        startTimelineAnimation();
      }
    }
  });

  window.addEventListener('pagehide', () => {
    if (isPlayingAudio) {
      fadeOutAndPauseCleanly(450);
    }
  });

  window.addEventListener('beforeunload', () => {
    if (isPlayingAudio) {
      fadeOutAndPauseCleanly(400);
    }
  });

  document.addEventListener('astro:before-swap', () => {
    if (isPlayingAudio) {
      fadeOutAndPauseCleanly(450);
    }
  });

  // Desktop Keyboard Shortcuts (Space to play/pause, Arrows to seek, N for next song, M for mute, S for streaming)
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
      if (document.body.classList.contains('modal-open')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (audioBarToggleBtn) {
          audioBarToggleBtn.click();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (vaultAudioPlayer && currentPlayingTrack) {
          vaultAudioPlayer.currentTime = Math.max(0, (vaultAudioPlayer.currentTime || 0) - 5);
          updateTimelineUI();
          triggerHaptic('scrub');
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (vaultAudioPlayer && currentPlayingTrack) {
          vaultAudioPlayer.currentTime = Math.min(30, (vaultAudioPlayer.currentTime || 0) + 5);
          updateTimelineUI();
          triggerHaptic('scrub');
        }
      } else if (e.code === 'KeyN') {
        e.preventDefault();
        playNextMixSong();
        triggerHaptic('click');
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        toggleStreamDrawer();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (vaultAudioPlayer) {
          vaultAudioPlayer.muted = !vaultAudioPlayer.muted;
          showToast(vaultAudioPlayer.muted ? 'Audio Muted' : 'Audio Unmuted', 'music');
        }
      }
    });
  }

  initKeyboardShortcuts();

  // 2. Smooth fade-out audio when clicking external links (e.g. Spotify, Apple Music, social channels)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    const href = link.href.trim();
    const isExternal = link.target === '_blank' || 
                      (!href.startsWith(window.location.origin) && !href.startsWith('#') && !href.startsWith('javascript:'));

    if (isExternal && isPlayingAudio) {
      fadeOutAndPauseCleanly(650);
    }
  }, { capture: true });

  // 3. One-time gesture listener to unlock Web Audio API & HTML5 Audio on mobile
  function initAudioUnlock() {
    const unlock = () => {
      if (vinylGrooveEngine) {
        try {
          vinylGrooveEngine.init();
          if (vinylGrooveEngine.ctx && vinylGrooveEngine.ctx.state === 'suspended') {
            vinylGrooveEngine.ctx.resume().catch(() => {});
          }
        } catch (e) {}
      }
    };

    window.addEventListener('touchstart', unlock, { capture: true, once: true, passive: true });
    window.addEventListener('touchend', unlock, { capture: true, once: true, passive: true });
    window.addEventListener('pointerdown', unlock, { capture: true, once: true, passive: true });
    window.addEventListener('click', unlock, { capture: true, once: true, passive: true });
  }

  initAudioUnlock();

  // Immediate prefetch of all inspiration tracks on page load so 30s previews & artwork load instantly
  try {
    const allTracks = getAllInspiredTracks();
    if (allTracks && allTracks.length > 0) {
      prefetchTrackArtwork(allTracks);
    }
  } catch (e) {}
}
