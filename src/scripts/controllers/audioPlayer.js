import { showToast } from './toast.js';
import { getITunesTrackData, loadAlbumArt, INSPIRED_ARTISTS_DATA, prefetchTrackArtwork } from './inspirationVault.js';

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

      thumpGain.gain.setValueAtTime(0.55, now);
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

      clickGain.gain.setValueAtTime(0.28, now);
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
        noiseGain.gain.linearRampToValueAtTime(0.32, now + 0.06);
        noiseGain.gain.setValueAtTime(0.24, now + 0.45);
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
      motorGain.gain.linearRampToValueAtTime(0.12, now + 0.1);
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

      liftPopGain.gain.setValueAtTime(0.48, now);
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
        noiseGain.gain.setValueAtTime(0.28, now);
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

      motorGain.gain.setValueAtTime(0.09, now);
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

          clickGain.gain.setValueAtTime(0.25, stopNow);
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

export function stopVinylSpinSmoothly(element, shouldSpin) {
  if (!element) return;

  if (shouldSpin) {
    element.classList.remove('vinyl-spin-decelerate');
    element.style.transform = '';
    element.classList.add('vinyl-spin-anim');
  } else {
    const isSpinning = element.classList.contains('vinyl-spin-anim') || 
                       element.classList.contains('spinning') || 
                       element.classList.contains('vinyl-spin-once');

    if (isSpinning || (element.style.transform && element.style.transform !== 'rotate(0deg)')) {
      let currentAngle = 0;
      try {
        const style = window.getComputedStyle(element);
        const transform = style.transform || style.webkitTransform;
        if (transform && transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          currentAngle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
          if (currentAngle < 0) currentAngle += 360;
        }
      } catch (e) {}

      // Remove active continuous spin classes and pin element at current exact angle
      element.classList.remove('vinyl-spin-anim', 'spinning', 'vinyl-spin-once');
      element.style.transform = `rotate(${currentAngle}deg)`;

      // Smoothly finish at the upright 360° (0°) position
      const remainder = currentAngle % 360;
      const extraDeg = 360 - remainder;
      const targetAngle = currentAngle + extraDeg;

      requestAnimationFrame(() => {
        element.classList.add('vinyl-spin-decelerate');
        element.style.transform = `rotate(${targetAngle}deg)`;

        setTimeout(() => {
          element.classList.remove('vinyl-spin-decelerate');
          element.style.transform = 'rotate(0deg)';
        }, 550);
      });
    } else {
      element.classList.remove('vinyl-spin-decelerate', 'vinyl-spin-anim', 'spinning');
      element.style.transform = 'rotate(0deg)';
    }
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
  }

  function updateTimelineUI() {
    if (!vaultAudioPlayer || isScrubbing) return;
    const duration = 30;
    const currentTime = Math.min(30, Math.max(0, vaultAudioPlayer.currentTime || 0));

    // Only when the track naturally reaches the end during auto-mix, visually complete to 100%
    if (isEndingSong) {
      if (audioBarTimelineProgress) audioBarTimelineProgress.style.width = `100%`;
      if (vinylStylusWrapper) vinylStylusWrapper.style.left = `100%`;
      if (audioBarTime) {
        audioBarTime.textContent = `0:30 / 0:30`;
      }
      return;
    }

    const pct = Math.min(100, Math.max(0, (currentTime / duration) * 100));

    if (audioBarTimelineProgress) audioBarTimelineProgress.style.width = `${pct}%`;
    if (vinylStylusWrapper) vinylStylusWrapper.style.left = `${pct}%`;
    if (audioBarTime) {
      audioBarTime.textContent = `${formatTime(currentTime)} / 0:30`;
    }
  }

  function renderPlaybackLoop() {
    if (isPlayingAudio && vaultAudioPlayer && !isScrubbing) {
      updateTimelineUI();
      checkAutoFadeOut();
      animFrameId = requestAnimationFrame(renderPlaybackLoop);
    }
  }

  function startTimelineAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderPlaybackLoop);
  }

  function stopTimelineAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function seekToPosition(clientX) {
    if (!vaultAudioPlayer) return;
    const musicSection = document.getElementById('deckMusicSection');
    const rect = musicSection ? musicSection.getBoundingClientRect() : cachedMusicSectionRect;
    if (!rect || rect.width === 0) return;

    const pctRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pct = pctRatio * 100;
    const duration = 30;
    const newTime = pctRatio * duration;

    if (isFinite(newTime)) {
      vaultAudioPlayer.currentTime = newTime;
    }

    if (audioBarTimelineProgress) audioBarTimelineProgress.style.width = `${pct}%`;
    if (vinylStylusWrapper) vinylStylusWrapper.style.left = `${pct}%`;
    if (audioBarTime) {
      audioBarTime.textContent = `${formatTime(newTime)} / 0:30`;
    }
  }

  function handleScrubStart(clientX, target) {
    if (!target || !target.closest) return false;
    if (target.closest('button, #floatingGigPillBtn, .tab-gigmap, .gig-soon-diagonal-banner') || !currentPlayingTrack) {
      return false;
    }

    isScrubbing = true;
    updateCachedMusicSectionRect();
    if (bottomAudioBar) bottomAudioBar.classList.add('is-scrubbing');

    lastX = clientX;
    lastTime = performance.now();

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

    // Dynamic pitch modulation on active audio track during aggressive scrubbing
    if (vaultAudioPlayer) {
      const speed = Math.abs(velocity);
      if (speed > 0.08) {
        try {
          vaultAudioPlayer.preservesPitch = false;
          if (vaultAudioPlayer.mozPreservesPitch !== undefined) vaultAudioPlayer.mozPreservesPitch = false;
          if (vaultAudioPlayer.webkitPreservesPitch !== undefined) vaultAudioPlayer.webkitPreservesPitch = false;
          vaultAudioPlayer.playbackRate = Math.min(2.8, Math.max(0.3, speed * 2.2));
        } catch (e) {}
      }
    }

    seekToPosition(clientX);
  }

  function handleScrubEnd() {
    if (!isScrubbing) return;
    isScrubbing = false;
    if (bottomAudioBar) bottomAudioBar.classList.remove('is-scrubbing');

    if (vinylStylusWrapper) {
      vinylStylusWrapper.classList.remove('tilt-forward', 'tilt-backward');
    }

    vinylScratchSynth.stopScratch();

    if (vaultAudioPlayer) {
      vaultAudioPlayer.playbackRate = 1.0;
      const duration = vaultAudioPlayer.duration || 30;
      if (vaultAudioPlayer.currentTime >= duration - 0.05) {
        vaultAudioPlayer.currentTime = duration;
        isPlayingAudio = false;
        stopTimelineAnimation();
        updateTimelineUI();
        updateToggleBtnState(false);
        return;
      }
    }

    if (isPlayingAudio) startTimelineAnimation();
  }

  // Interactive Timeline Scrubbing with pointer & mobile touch support
  if (bottomAudioBar) {
    bottomAudioBar.addEventListener('pointerdown', (e) => {
      if (handleScrubStart(e.clientX, e.target)) {
        try { bottomAudioBar.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });

    bottomAudioBar.addEventListener('pointermove', (e) => {
      if (isScrubbing) {
        handleScrubMove(e.clientX);
      }
    });

    bottomAudioBar.addEventListener('pointerup', (e) => {
      try { if (e && e.pointerId) bottomAudioBar.releasePointerCapture(e.pointerId); } catch (err) {}
      handleScrubEnd();
    });

    bottomAudioBar.addEventListener('pointercancel', (e) => {
      try { if (e && e.pointerId) bottomAudioBar.releasePointerCapture(e.pointerId); } catch (err) {}
      handleScrubEnd();
    });

    // Touch Event Handlers for Mobile WebKit & Android Chrome
    bottomAudioBar.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        if (handleScrubStart(touch.clientX, e.target)) {
          e.preventDefault();
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (isScrubbing && e.touches && e.touches.length > 0) {
        e.preventDefault();
        handleScrubMove(e.touches[0].clientX);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (isScrubbing) handleScrubEnd();
    }, { passive: true });

    window.addEventListener('touchcancel', () => {
      if (isScrubbing) handleScrubEnd();
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
      // Start smooth vinyl spin-down deceleration 2.2s before track finishes naturally
      if (timeLeft <= 2.2 && timeLeft > 0.3) {
        isEndingSong = true;
        // Smoothly animate the timeline progress and stylus to 100% completion
        if (audioBarTimelineProgress) {
          audioBarTimelineProgress.style.transition = 'width 1.8s ease-out';
          audioBarTimelineProgress.style.width = '100%';
        }
        if (vinylStylusWrapper) {
          vinylStylusWrapper.style.transition = 'left 1.8s ease-out';
          vinylStylusWrapper.style.left = '100%';
        }
        if (audioBarTime) {
          audioBarTime.textContent = '0:30 / 0:30';
        }

        triggerVinylSpinDownAndStop(1800).then(() => {
          if (audioBarTimelineProgress) audioBarTimelineProgress.style.transition = '';
          if (vinylStylusWrapper) vinylStylusWrapper.style.transition = '';
          isEndingSong = false;
          if (!isScrubbing) {
            // Buffer breather before spinning up into next song
            setTimeout(() => {
              playNextMixSong();
            }, 300);
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
      showToast(`🔀 Auto-Mix Started: "${firstTrack.title}"`);
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

  let playbackRateInterval = null;

  function cancelPlaybackRateRamp() {
    if (playbackRateInterval) {
      clearInterval(playbackRateInterval);
      playbackRateInterval = null;
    }
  }

  function rampAudioPlaybackRate(startRate = 0.42, targetRate = 1.0, durationMs = 700) {
    if (!vaultAudioPlayer) return;
    cancelPlaybackRateRamp();

    try {
      vaultAudioPlayer.preservesPitch = false;
      vaultAudioPlayer.mozPreservesPitch = false;
      vaultAudioPlayer.webkitPreservesPitch = false;
    } catch (e) {}

    vaultAudioPlayer.playbackRate = startRate;
    const stepMs = 30;
    const steps = Math.max(1, Math.floor(durationMs / stepMs));
    let step = 0;

    playbackRateInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      // Exponential power curve for realistic motor torque spin-up
      const currentRate = startRate + (targetRate - startRate) * Math.pow(progress, 1.6);

      if (step >= steps) {
        if (vaultAudioPlayer) vaultAudioPlayer.playbackRate = targetRate;
        cancelPlaybackRateRamp();
      } else {
        if (vaultAudioPlayer) vaultAudioPlayer.playbackRate = Math.min(targetRate, currentRate);
      }
    }, stepMs);
  }

  function rampAudioPlaybackRateDown(startRate = 1.0, endRate = 0.12, durationMs = 600) {
    return new Promise((resolve) => {
      if (!vaultAudioPlayer) return resolve();
      cancelPlaybackRateRamp();

      try {
        vaultAudioPlayer.preservesPitch = false;
        vaultAudioPlayer.mozPreservesPitch = false;
        vaultAudioPlayer.webkitPreservesPitch = false;
      } catch (e) {}

      vaultAudioPlayer.playbackRate = startRate;
      const stepMs = 30;
      const steps = Math.max(1, Math.floor(durationMs / stepMs));
      let step = 0;

      playbackRateInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        // Deceleration power curve: drops fast then smoothly winds to zero
        const currentRate = startRate - (startRate - endRate) * Math.pow(progress, 1.35);

        if (step >= steps) {
          if (vaultAudioPlayer) vaultAudioPlayer.playbackRate = endRate;
          cancelPlaybackRateRamp();
          resolve();
        } else {
          if (vaultAudioPlayer) vaultAudioPlayer.playbackRate = Math.max(endRate, currentRate);
        }
      }, stepMs);
    });
  }

  function triggerNeedleDropAndSpinUp(isResume = false) {
    if (vinylScratchSynth) {
      vinylScratchSynth.playVinylNeedleSpinUp();
    }
    // Ramps playback speed and pitch upwards just like a real turntable motor accelerating from stop
    rampAudioPlaybackRate(isResume ? 0.52 : 0.40, 1.0, isResume ? 550 : 750);

    if (vinylStylusWrapper) {
      vinylStylusWrapper.classList.remove('needle-drop-bounce');
      void vinylStylusWrapper.offsetWidth; // force reflow
      vinylStylusWrapper.classList.add('needle-drop-bounce');
      setTimeout(() => {
        if (vinylStylusWrapper) vinylStylusWrapper.classList.remove('needle-drop-bounce');
      }, 450);
    }
  }

  async function triggerVinylSpinDownAndStop(durationMs = 600) {
    if (!vaultAudioPlayer || vaultAudioPlayer.paused) return;

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

    // 3. Audio pitch wind-down and volume fade-out simultaneously
    const currentRate = vaultAudioPlayer.playbackRate || 1.0;
    const rampPromise = rampAudioPlaybackRateDown(currentRate, 0.12, durationMs);
    const fadePromise = fadeOutAudio(durationMs);

    await Promise.all([rampPromise, fadePromise]);

    if (vaultAudioPlayer) {
      vaultAudioPlayer.pause();
      vaultAudioPlayer.playbackRate = 1.0;
    }
    isPlayingAudio = false;
    stopTimelineAnimation();
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
        vinylStylusWrapper.classList.remove('tilt-backward');
      }, 450);
    }

    setTimeout(() => {
      deckMusicSection.classList.remove('is-song-changing');
    }, 850);
  }

  let currentTransitionId = 0;

  window.playTrackPreview = async function(trackObj) {
    if (!trackObj || !trackObj.title) return;
    clearTimeout(autoMixTimeout);
    const transitionId = ++currentTransitionId;

    // 1. Handling PAUSE & RESUME of the currently playing track
    if (currentPlayingTrack && currentPlayingTrack.title === trackObj.title) {
      isPlayingAudio = !isPlayingAudio;
      if (isPlayingAudio) {
        updateToggleBtnState(true);
        triggerNeedleDropAndSpinUp(true);
        if (vaultAudioPlayer) {
          vaultAudioPlayer.volume = 0;
          vaultAudioPlayer.play().catch(() => {});
          startTimelineAnimation();
          fadeInAudio(600, 1.0);
        }
        showToast(`Resumed: "${trackObj.title}"`);
      } else {
        updateToggleBtnState(false);
        showToast(`Paused: "${trackObj.title}"`);
        await triggerVinylSpinDownAndStop(550);
      }
      return;
    }

    // 2. Handling SWITCHING to a NEW track while already playing (or from idle)
    isTransitioningTrack = true;

    // Start fetching metadata / previewUrl in parallel immediately
    let previewUrl = trackObj.previewUrl;
    let coverUrl = trackObj.coverUrl || trackObj.artworkUrl;

    const fetchMetaPromise = (!previewUrl || !coverUrl)
      ? getITunesTrackData(trackObj.artist, trackObj.title).then(meta => {
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
        })
      : Promise.resolve();

    // If another track is currently playing, smoothly spin it down to a stop
    if (isPlayingAudio && vaultAudioPlayer && !vaultAudioPlayer.paused && vaultAudioPlayer.volume > 0.05) {
      await triggerVinylSpinDownAndStop(380);
    }

    // Wait for parallel metadata fetch to complete if it wasn't preloaded
    await fetchMetaPromise;

    // If another song was requested while we were waiting, abort this stale transition
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
    setMiniPlayerCover(coverUrl || null);

    // Reset timeline progress and transitions for incoming track
    if (audioBarTimelineProgress) {
      audioBarTimelineProgress.style.transition = '';
      audioBarTimelineProgress.style.width = '0%';
    }
    if (vinylStylusWrapper) {
      vinylStylusWrapper.style.transition = '';
      vinylStylusWrapper.style.left = '0%';
    }
    if (audioBarTime) {
      audioBarTime.textContent = '0:00 / 0:30';
    }

    if (vaultAudioPlayer && previewUrl) {
      vaultAudioPlayer.src = previewUrl;
      vaultAudioPlayer.volume = 0;
      vaultAudioPlayer.play().then(() => {
        if (transitionId !== currentTransitionId) return;
        triggerNeedleDropAndSpinUp(false);
        isTransitioningTrack = false;
        isPlayingAudio = true;
        startTimelineAnimation();
        updateToggleBtnState(true);
        fadeInAudio(1400, 1.0);
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
      if (!currentPlayingTrack) return;
      isPlayingAudio = !isPlayingAudio;
      if (isPlayingAudio) {
        updateToggleBtnState(true);
        triggerNeedleDropAndSpinUp(true);
        if (vaultAudioPlayer) {
          vaultAudioPlayer.volume = 0;
          vaultAudioPlayer.play().catch(() => {});
          startTimelineAnimation();
          fadeInAudio(600, 1.0);
        }
        showToast(`Resumed: "${currentPlayingTrack.title}"`, 'music');
      } else {
        updateToggleBtnState(false);
        showToast(`Paused: "${currentPlayingTrack.title}"`, 'music');
        await triggerVinylSpinDownAndStop(550);
      }
    });
  }

  // Background prefetch all inspiration tracks for instant 0ms switching
  setTimeout(() => {
    try {
      const allTracks = getAllInspiredTracks();
      if (allTracks && allTracks.length > 0) {
        prefetchTrackArtwork(allTracks);
      }
    } catch (e) {}
  }, 1200);
}
