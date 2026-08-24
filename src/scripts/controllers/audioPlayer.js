import { showToast } from './toast.js';
import { getITunesTrackData, loadAlbumArt, INSPIRED_ARTISTS_DATA, INSPIRATION_TRACKS, prefetchTrackArtwork, ITUNES_CACHE } from './inspirationVault.js';

let isPlayingAudio = false;
let currentPlayingTrack = null;
let hasTransitionedToActive = false;

// Realistic Web Audio API Vinyl Scratch Synthesizer
class VinylScratchSynthesizer {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.oscNode = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const crackle = Math.random() > 0.994 ? (Math.random() * 1.8 - 0.9) : 0;
      output[i] = white * 0.12 + crackle;
    }
    this.noiseBuffer = noiseBuffer;
  }

  playNeedleDrop() {
    this.playVinylNeedleSpinUp();
  }

  playVinylNeedleSpinUp() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;

      // 1. Mechanical stylus contact thump (needle physically landing on vinyl groove)
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(190, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(26, now + 0.08);

      thumpGain.gain.setValueAtTime(0.22, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.ctx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.09);

      // 2. Diamond stylus micro-click impact
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'sawtooth';
      clickOsc.frequency.setValueAtTime(3600, now);
      clickOsc.frequency.exponentialRampToValueAtTime(500, now + 0.02);

      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // 3. Vinyl groove surface friction & rising acceleration whoosh (from 0 to 33 RPM)
      if (this.noiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;

        const spinFilter = this.ctx.createBiquadFilter();
        spinFilter.type = 'bandpass';
        spinFilter.frequency.setValueAtTime(280, now);
        spinFilter.frequency.exponentialRampToValueAtTime(3400, now + 0.7);
        spinFilter.Q.setValueAtTime(2.8, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.14, now + 0.06);
        noiseGain.gain.setValueAtTime(0.10, now + 0.45);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        noiseSrc.connect(spinFilter);
        spinFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + 0.9);
      }

      // 4. Turntable motor torque low-frequency whirr acceleration
      const motorOsc = this.ctx.createOscillator();
      const motorGain = this.ctx.createGain();
      motorOsc.type = 'sawtooth';
      motorOsc.frequency.setValueAtTime(42, now);
      motorOsc.frequency.exponentialRampToValueAtTime(130, now + 0.65);

      const motorFilter = this.ctx.createBiquadFilter();
      motorFilter.type = 'lowpass';
      motorFilter.frequency.setValueAtTime(160, now);

      motorGain.gain.setValueAtTime(0.001, now);
      motorGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
      motorGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      motorOsc.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(this.ctx.destination);
      motorOsc.start(now);
      motorOsc.stop(now + 0.8);
    } catch (e) {
      console.warn('Vinyl spin-up audio error:', e);
    }
  }

  playVinylNeedleSpinDown(durationMs = 600) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const durationSec = durationMs / 1000;

      // 1. Stylus needle lift pop / friction unstick sound right as pausing begins
      const liftPopOsc = this.ctx.createOscillator();
      const liftPopGain = this.ctx.createGain();
      liftPopOsc.type = 'triangle';
      liftPopOsc.frequency.setValueAtTime(260, now);
      liftPopOsc.frequency.exponentialRampToValueAtTime(40, now + 0.055);

      liftPopGain.gain.setValueAtTime(0.18, now);
      liftPopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      liftPopOsc.connect(liftPopGain);
      liftPopGain.connect(this.ctx.destination);
      liftPopOsc.start(now);
      liftPopOsc.stop(now + 0.065);

      // 2. Vinyl groove friction decelerating downward in frequency & speed
      if (this.noiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;

        const brakeFilter = this.ctx.createBiquadFilter();
        brakeFilter.type = 'bandpass';
        brakeFilter.frequency.setValueAtTime(2900, now);
        brakeFilter.frequency.exponentialRampToValueAtTime(140, now + durationSec);
        brakeFilter.Q.setValueAtTime(2.6, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.14, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

        noiseSrc.connect(brakeFilter);
        brakeFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + durationSec + 0.05);
      }

      // 3. Motor spin-down deceleration hum
      const motorOsc = this.ctx.createOscillator();
      const motorGain = this.ctx.createGain();
      motorOsc.type = 'sawtooth';
      motorOsc.frequency.setValueAtTime(115, now);
      motorOsc.frequency.exponentialRampToValueAtTime(22, now + durationSec);

      const motorFilter = this.ctx.createBiquadFilter();
      motorFilter.type = 'lowpass';
      motorFilter.frequency.setValueAtTime(140, now);

      motorGain.gain.setValueAtTime(0.04, now);
      motorGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      motorOsc.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(this.ctx.destination);
      motorOsc.start(now);
      motorOsc.stop(now + durationSec + 0.05);

      // 4. Subtle diamond stylus disengage click at standstill
      setTimeout(() => {
        try {
          if (!this.ctx) return;
          const stopNow = this.ctx.currentTime;
          const clickOsc = this.ctx.createOscillator();
          const clickGain = this.ctx.createGain();
          clickOsc.type = 'triangle';
          clickOsc.frequency.setValueAtTime(110, stopNow);
          clickOsc.frequency.exponentialRampToValueAtTime(30, stopNow + 0.04);

          clickGain.gain.setValueAtTime(0.10, stopNow);
          clickGain.gain.exponentialRampToValueAtTime(0.001, stopNow + 0.04);

          clickOsc.connect(clickGain);
          clickGain.connect(this.ctx.destination);
          clickOsc.start(stopNow);
          clickOsc.stop(stopNow + 0.05);
        } catch (e) {}
      }, Math.max(0, durationMs - 40));
    } catch (e) {
      console.warn('Vinyl spin-down audio error:', e);
    }
  }

  startScratch() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this.isPlaying) return;

      const now = this.ctx.currentTime;

      // Master Scratch Output Bus
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, now);

      // Resonant Turntable Platter Bandpass Filter (Formant character)
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(1400, now);
      this.filterNode.Q.setValueAtTime(4.8, now);

      // Vinyl Surface Crackle & Friction Noise Node
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = this.noiseBuffer;
      this.noiseNode.loop = true;
      this.noiseNode.connect(this.filterNode);

      // Primary DJ Scratch Carrier Oscillator
      this.oscNode = this.ctx.createOscillator();
      this.oscNode.type = 'sawtooth';
      this.oscNode.frequency.setValueAtTime(260, now);

      // Sub-harmonic FM Modulator (Adds gritty vinyl friction texture)
      this.modNode = this.ctx.createOscillator();
      this.modNode.type = 'triangle';
      this.modNode.frequency.setValueAtTime(45, now);

      this.modGain = this.ctx.createGain();
      this.modGain.gain.setValueAtTime(35, now);
      this.modNode.connect(this.modGain);
      this.modGain.connect(this.oscNode.frequency);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.35, now);
      this.oscNode.connect(oscGain);
      oscGain.connect(this.filterNode);

      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.noiseNode.start(now);
      this.oscNode.start(now);
      this.modNode.start(now);
      this.isPlaying = true;
      this.lastVelocity = 0;
    } catch (e) {
      console.warn('Start scratch error:', e);
    }
  }

  updateScratch(velocity) {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const speed = Math.abs(velocity);
    const direction = velocity >= 0 ? 1 : -1;
    const isHardScratch = speed > 0.25;

    // Detect sudden direction reversal for classic DJ "wicka" chirp pop
    if (this.lastVelocity && Math.sign(velocity) !== Math.sign(this.lastVelocity) && speed > 0.18) {
      this.playScratchChirp(direction);
    }
    this.lastVelocity = velocity;

    // Dynamic output gain based on velocity
    const targetGain = isHardScratch
      ? Math.min(0.65, 0.15 + speed * 0.45)
      : Math.min(0.28, Math.max(0.02, speed * 0.22));

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.012);

    // DJ formant frequency sweep based on scrubbing speed & direction
    let targetFreq = direction > 0
      ? (320 + Math.pow(speed, 0.9) * 1100)
      : (190 + Math.pow(speed, 0.9) * 750);
    targetFreq = Math.min(3800, Math.max(80, targetFreq));

    this.oscNode.frequency.cancelScheduledValues(now);
    this.oscNode.frequency.setTargetAtTime(targetFreq, now, 0.012);

    // Dynamic bandpass filter center sweep
    const filterFreq = Math.min(6800, Math.max(600, 1100 + speed * 2400));
    this.filterNode.frequency.cancelScheduledValues(now);
    this.filterNode.frequency.setTargetAtTime(filterFreq, now, 0.012);
    this.filterNode.Q.setTargetAtTime(isHardScratch ? 6.2 : 3.5, now, 0.02);

    if (this.modGain) {
      this.modGain.gain.setTargetAtTime(Math.min(120, 20 + speed * 80), now, 0.015);
    }

    if (this.noiseNode && this.noiseNode.playbackRate) {
      const rate = Math.min(3.5, Math.max(0.3, speed * 1.2));
      this.noiseNode.playbackRate.setTargetAtTime(rate, now, 0.012);
    }
  }

  playScratchChirp(direction = 1) {
    try {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chirpOsc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();
      const chirpFilter = this.ctx.createBiquadFilter();

      chirpOsc.type = 'sawtooth';
      chirpFilter.type = 'bandpass';
      chirpFilter.Q.setValueAtTime(5.5, now);

      if (direction > 0) {
        chirpOsc.frequency.setValueAtTime(450, now);
        chirpOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.045);
        chirpFilter.frequency.setValueAtTime(900, now);
        chirpFilter.frequency.exponentialRampToValueAtTime(2800, now + 0.045);
      } else {
        chirpOsc.frequency.setValueAtTime(1200, now);
        chirpOsc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
        chirpFilter.frequency.setValueAtTime(2600, now);
        chirpFilter.frequency.exponentialRampToValueAtTime(800, now + 0.045);
      }

      chirpGain.gain.setValueAtTime(0.35, now);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      chirpOsc.connect(chirpFilter);
      chirpFilter.connect(chirpGain);
      chirpGain.connect(this.ctx.destination);

      chirpOsc.start(now);
      chirpOsc.stop(now + 0.05);
    } catch (e) {}
  }

  stopScratch() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.gainNode) {
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      }
      setTimeout(() => {
        if (this.noiseNode) {
          try { this.noiseNode.stop(); } catch (e) {}
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        if (this.oscNode) {
          try { this.oscNode.stop(); } catch (e) {}
          this.oscNode.disconnect();
          this.oscNode = null;
        }
        if (this.modNode) {
          try { this.modNode.stop(); } catch (e) {}
          this.modNode.disconnect();
          this.modNode = null;
        }
        this.isPlaying = false;
      }, 80);
    } catch (e) {
      this.isPlaying = false;
    }
  }
}

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

function invalidateVinylThumbCache() {
  cachedVinylThumbs = null;
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

let vinylDecelAnimId = null;

export function startVinylSpin(startSpeed = 0.25) {
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
  const vinylStylusWrapper = document.getElementById('vinylStylusWrapper');
  const audioBarTime = document.getElementById('audioBarTime');

  const streamDrawerPanel = document.getElementById('streamDrawerPanel');
  const streamDrawerSongName = document.getElementById('streamDrawerSongName');
  const streamLinkSpotify = document.getElementById('streamLinkSpotify');
  const streamLinkApple = document.getElementById('streamLinkApple');
  const streamLinkYoutube = document.getElementById('streamLinkYoutube');
  const streamLinkAmazon = document.getElementById('streamLinkAmazon');
  const streamLinkSoundcloud = document.getElementById('streamLinkSoundcloud');
  const streamLinkDeezer = document.getElementById('streamLinkDeezer');
  const streamLinkTidal = document.getElementById('streamLinkTidal');
  const streamLinkBandcamp = document.getElementById('streamLinkBandcamp');
  const streamLinkAudiomack = document.getElementById('streamLinkAudiomack');
  const streamLinkQobuz = document.getElementById('streamLinkQobuz');

  const vinylScratchSynth = new VinylScratchSynthesizer();
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

    featured.forEach(async (item, index) => {
      const imgEl = elements[index];
      if (!imgEl) return;
      try {
        const meta = await getITunesTrackData(item.artist, item.title);
        if (meta && meta.artworkUrl) {
          await loadAlbumArt(imgEl, meta.artworkUrl, meta.rawArtworkUrl);
          const fallback = imgEl.parentElement ? imgEl.parentElement.querySelector('.stack-fallback-icon') : null;
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
    setStylusPosition(pct);
    if (audioBarTime) {
      audioBarTime.textContent = `${formatTime(currentTime)} / 0:30`;
    }
  }

  // Stylus slides via compositor-friendly translateX (px derived from the cached section rect)
  function setStylusPosition(pct) {
    if (!vinylStylusWrapper) return;
    let rect = cachedMusicSectionRect;
    if (!rect || rect.width === 0) {
      const musicSection = document.getElementById('deckMusicSection');
      if (!musicSection) return;
      rect = musicSection.getBoundingClientRect();
      cachedMusicSectionRect = rect;
    }
    const x = rect.width * (Math.min(100, Math.max(0, pct)) / 100);
    vinylStylusWrapper.style.transform = `translateX(${x - 11}px)`;
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
    const rect = cachedMusicSectionRect;
    if (!rect || rect.width === 0) return;

    const pctRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pct = pctRatio * 100;
    const duration = 30;
    const newTime = pctRatio * duration;

    if (isFinite(newTime)) {
      vaultAudioPlayer.currentTime = newTime;
    }

    if (audioBarTimelineProgress) audioBarTimelineProgress.style.transform = `scaleX(${pctRatio})`;
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

    vinylScratchSynth.playNeedleDrop();
    vinylScratchSynth.startScratch();
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

    // Dynamic turntablist DJ scratch audio synthesis
    vinylScratchSynth.updateScratch(velocity);

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

    vinylScratchSynth.stopScratch();

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

  function updateStreamLinks(trackObj) {
    if (!trackObj) return;
    const query = encodeURIComponent(`${trackObj.artist || 'Kins'} ${trackObj.title}`);
    if (streamDrawerSongName) streamDrawerSongName.textContent = `"${trackObj.title}"`;

    if (streamLinkSpotify) streamLinkSpotify.href = `https://open.spotify.com/search/${query}`;
    if (streamLinkApple) streamLinkApple.href = `https://music.apple.com/us/search?term=${query}`;
    if (streamLinkYoutube) streamLinkYoutube.href = `https://music.youtube.com/search?q=${query}`;
    if (streamLinkAmazon) streamLinkAmazon.href = `https://music.amazon.com/search/${query}`;
    if (streamLinkSoundcloud) streamLinkSoundcloud.href = `https://soundcloud.com/search?q=${query}`;
    if (streamLinkDeezer) streamLinkDeezer.href = `https://www.deezer.com/search/${query}`;
    if (streamLinkTidal) streamLinkTidal.href = `https://listen.tidal.com/search?q=${query}`;
    if (streamLinkBandcamp) streamLinkBandcamp.href = `https://bandcamp.com/search?q=${query}`;
    if (streamLinkAudiomack) streamLinkAudiomack.href = `https://audiomack.com/search?q=${query}`;
    if (streamLinkQobuz) streamLinkQobuz.href = `https://www.qobuz.com/search?q=${query}`;
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

  function cancelFade() {
    if (currentFadeInterval) {
      clearInterval(currentFadeInterval);
      currentFadeInterval = null;
    }
  }

  function fadeAudioVolume(startVol, targetVol, durationMs) {
    return new Promise((resolve) => {
      if (!vaultAudioPlayer) return resolve();
      cancelFade();

      vaultAudioPlayer.volume = Math.max(0, Math.min(1, startVol));
      if (durationMs <= 0 || startVol === targetVol) {
        vaultAudioPlayer.volume = Math.max(0, Math.min(1, targetVol));
        return resolve();
      }

      const stepMs = 40;
      const totalSteps = Math.max(1, Math.floor(durationMs / stepMs));
      const delta = (targetVol - startVol) / totalSteps;
      let currentStep = 0;

      currentFadeInterval = setInterval(() => {
        currentStep++;
        const newVol = startVol + (delta * currentStep);
        if (currentStep >= totalSteps) {
          if (vaultAudioPlayer) vaultAudioPlayer.volume = Math.max(0, Math.min(1, targetVol));
          cancelFade();
          resolve();
        } else {
          if (vaultAudioPlayer) vaultAudioPlayer.volume = Math.max(0, Math.min(1, newVol));
        }
      }, stepMs);
    });
  }

  function fadeOutAudio(durationMs = 2200) {
    if (!vaultAudioPlayer || vaultAudioPlayer.paused) return Promise.resolve();
    isFadingOut = true;
    const currentVol = vaultAudioPlayer.volume;
    return fadeAudioVolume(currentVol, 0, durationMs);
  }

  function fadeInAudio(durationMs = 1800, targetVol = 1.0) {
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
    return mixQueue.shift();
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
  }

  function rampVinylSpeedUp(durationMs = 580, startRate = 0.35) {
    if (!vaultAudioPlayer) return;
    cancelVinylSpeedRamp();

    try {
      vaultAudioPlayer.preservesPitch = false;
      if (vaultAudioPlayer.mozPreservesPitch !== undefined) vaultAudioPlayer.mozPreservesPitch = false;
      if (vaultAudioPlayer.webkitPreservesPitch !== undefined) vaultAudioPlayer.webkitPreservesPitch = false;
    } catch (e) {}

    vaultAudioPlayer.playbackRate = startRate;
    const startTime = performance.now();
    const stepMs = 25;

    vinylSpeedInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Realistic turntable torque spin-up curve
      const currentRate = startRate + (1.0 - startRate) * Math.pow(progress, 1.35);

      if (vaultAudioPlayer) {
        vaultAudioPlayer.playbackRate = Math.min(1.0, parseFloat(currentRate.toFixed(3)));
      }

      if (progress >= 1) {
        cancelVinylSpeedRamp();
        if (vaultAudioPlayer) {
          vaultAudioPlayer.playbackRate = 1.0;
        }
      }
    }, stepMs);
  }

  function rampVinylSpeedDown(durationMs = 550, endRate = 0.12) {
    return new Promise((resolve) => {
      if (!vaultAudioPlayer) return resolve();
      cancelVinylSpeedRamp();

      try {
        vaultAudioPlayer.preservesPitch = false;
        if (vaultAudioPlayer.mozPreservesPitch !== undefined) vaultAudioPlayer.mozPreservesPitch = false;
        if (vaultAudioPlayer.webkitPreservesPitch !== undefined) vaultAudioPlayer.webkitPreservesPitch = false;
      } catch (e) {}

      const startRate = vaultAudioPlayer.playbackRate || 1.0;
      const startTime = performance.now();
      const stepMs = 25;

      vinylSpeedInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Realistic turntable motor brake deceleration curve
        const currentRate = startRate - (startRate - endRate) * Math.pow(progress, 1.25);

        if (vaultAudioPlayer) {
          vaultAudioPlayer.playbackRate = Math.max(endRate, parseFloat(currentRate.toFixed(3)));
        }

        if (progress >= 1) {
          cancelVinylSpeedRamp();
          if (vaultAudioPlayer) {
            vaultAudioPlayer.playbackRate = endRate;
          }
          resolve();
        }
      }, stepMs);
    });
  }

  function triggerNeedleDropAndSpinUp(isResume = false) {
    if (vinylScratchSynth) {
      vinylScratchSynth.playVinylNeedleSpinUp();
    }
    startVinylSpin(isResume ? 0.45 : 0.25);
    rampVinylSpeedUp(isResume ? 480 : 580, isResume ? 0.48 : 0.35);

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

    // 1. Play vinyl surface deceleration & brake noise
    if (vinylScratchSynth) {
      vinylScratchSynth.playVinylNeedleSpinDown(durationMs);
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

    // 3. Audio pitch wind-down and volume fade-out simultaneously
    const speedPromise = rampVinylSpeedDown(durationMs, 0.12);
    const fadePromise = fadeOutAudio(durationMs);

    await Promise.all([speedPromise, fadePromise]);

    // Superseded by a resume/newer transition — leave playback alone
    if (stopGeneration !== vinylStopGeneration) return;

    if (vaultAudioPlayer) {
      vaultAudioPlayer.pause();
      vaultAudioPlayer.playbackRate = 1.0;
    }

    if (morphToSquare) {
      isPlayingAudio = false;
      stopTimelineAnimation();
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
    if (vinylScratchSynth) {
      vinylScratchSynth.init();
      if (vinylScratchSynth.ctx && vinylScratchSynth.ctx.state === 'suspended') {
        vinylScratchSynth.ctx.resume().catch(() => {});
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
            showToast(`Now Playing: "${trackObj.title}" by ${trackObj.artist}`);
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
    if (document.hidden && isPlayingAudio) {
      fadeOutAndPauseCleanly(600);
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
      if (vinylScratchSynth) {
        try {
          vinylScratchSynth.init();
          if (vinylScratchSynth.ctx && vinylScratchSynth.ctx.state === 'suspended') {
            vinylScratchSynth.ctx.resume().catch(() => {});
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
