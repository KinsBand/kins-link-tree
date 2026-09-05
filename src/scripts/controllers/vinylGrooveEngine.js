/**
 * Vinyl Groove Acoustic Engine (Web Audio API)
 *
 * Simulates the physical physics and acoustics of a diamond stylus needle dragging
 * across micro-grooves of a real vinyl record:
 *
 * 1. Layer 1 (Granular Audio Slicing): Decodes the song's audio buffer and plays
 *    micro-slices forward/backward (proportional to scrub velocity and direction),
 *    yielding real reverse slipmat vinyl scratches of the actual vocals/instruments.
 * 2. Layer 2 (Song-Specific Groove Fingerprint): Synthesizes mechanical PVC friction,
 *    tonal resonance locked to the song's musical key, groove excursion depth, and
 *    vinyl pressing weight (180g vs 120g vs 7").
 * 3. Radial Physics (Inner Groove Distortion): As the needle moves from the outer rim (0s)
 *    to the inner label (30s), linear speed drops from 50 cm/s to 20 cm/s, darkening
 *    the filter cutoff and introducing authentic "pinch-effect" harmonic warmth.
 */

export const SONG_GROOVE_PROFILES = {
  'the-cure-just-like-heaven': {
    key: 'A',
    tonicFreq: 220,
    vinylWeight: 140,
    grooveExcursion: 'medium',
    grit: 0.32,
    brightness: 1.35,
    crackleRate: 0.995,
    hapticType: 'crisp',
    character: 'jangle-chorus-sheen'
  },
  'sonic-youth-unmade-bed': {
    key: 'F#',
    tonicFreq: 185,
    vinylWeight: 180,
    grooveExcursion: 'heavy',
    grit: 0.88,
    brightness: 0.85,
    crackleRate: 0.991,
    hapticType: 'heavy',
    character: 'raw-noise-fuzz'
  },
  'weezer-do-you-wanna-get-high': {
    key: 'Eb',
    tonicFreq: 155,
    vinylWeight: 180,
    grooveExcursion: 'heavy',
    grit: 0.92,
    brightness: 0.78,
    crackleRate: 0.990,
    hapticType: 'heavy',
    character: 'sludge-fuzz-growl'
  },
  'pulp-common-people': {
    key: 'C',
    tonicFreq: 130.8,
    vinylWeight: 120,
    grooveExcursion: 'medium',
    grit: 0.45,
    brightness: 1.15,
    crackleRate: 0.994,
    hapticType: 'crisp',
    character: 'disco-punk-snap'
  },
  'the-sundays-cry': {
    key: 'D',
    tonicFreq: 146.8,
    vinylWeight: 120,
    grooveExcursion: 'fine',
    grit: 0.22,
    brightness: 1.40,
    crackleRate: 0.997,
    hapticType: 'light',
    character: 'dream-pop-air'
  },
  'supergrass-shes-so-loose': {
    key: 'G',
    tonicFreq: 196,
    vinylWeight: 140,
    grooveExcursion: 'medium',
    grit: 0.38,
    brightness: 1.10,
    crackleRate: 0.995,
    hapticType: 'medium',
    character: 'warm-acoustic-strum'
  },
  'the-cure-a-letter-to-elise': {
    key: 'A',
    tonicFreq: 220,
    vinylWeight: 140,
    grooveExcursion: 'medium',
    grit: 0.30,
    brightness: 1.25,
    crackleRate: 0.996,
    hapticType: 'crisp',
    character: 'lush-postpunk-melancholy'
  },
  'david-bowie-starman': {
    key: 'F',
    tonicFreq: 174.6,
    vinylWeight: 140,
    grooveExcursion: 'medium',
    grit: 0.28,
    brightness: 1.30,
    crackleRate: 0.996,
    hapticType: 'crisp',
    character: 'glam-cosmic-chime'
  },
  'player-baby-come-back': {
    key: 'Eb',
    tonicFreq: 155.6,
    vinylWeight: 140,
    grooveExcursion: 'medium-heavy',
    grit: 0.32,
    brightness: 1.05,
    crackleRate: 0.994,
    hapticType: 'medium',
    character: 'silky-rhodes-bass-groove'
  },
  'the-stone-roses-i-wanna-be-adored': {
    key: 'E',
    tonicFreq: 164.8,
    vinylWeight: 140,
    grooveExcursion: 'heavy',
    grit: 0.40,
    brightness: 1.15,
    crackleRate: 0.995,
    hapticType: 'medium',
    character: 'madchester-hypnotic-drone'
  },
  'talking-heads-once-in-a-lifetime': {
    key: 'D',
    tonicFreq: 146.8,
    vinylWeight: 140,
    grooveExcursion: 'medium-heavy',
    grit: 0.35,
    brightness: 1.25,
    crackleRate: 0.995,
    hapticType: 'crisp',
    character: 'talking-heads-afrobeat-funk'
  },
  'ween-ocean-man': {
    key: 'E',
    tonicFreq: 164.8,
    vinylWeight: 120,
    grooveExcursion: 'medium',
    grit: 0.28,
    brightness: 1.35,
    crackleRate: 0.996,
    hapticType: 'crisp',
    character: 'oceanic-psych-bounce'
  },
  'the-clash-london-calling': {
    key: 'E',
    tonicFreq: 164.8,
    vinylWeight: 180,
    grooveExcursion: 'heavy',
    grit: 0.55,
    brightness: 1.10,
    crackleRate: 0.993,
    hapticType: 'heavy',
    character: 'clash-reggae-punk-growl'
  },
  'talking-heads-this-must-be-the-place-naive-melody': {
    key: 'G',
    tonicFreq: 196,
    vinylWeight: 140,
    grooveExcursion: 'medium',
    grit: 0.25,
    brightness: 1.25,
    crackleRate: 0.996,
    hapticType: 'crisp',
    character: 'new-wave-analog-synth-bounce'
  },
  'tame-impala-the-less-i-know-the-better': {
    key: 'F#',
    tonicFreq: 185,
    vinylWeight: 180,
    grooveExcursion: 'heavy',
    grit: 0.65,
    brightness: 1.20,
    crackleRate: 0.993,
    hapticType: 'heavy',
    character: 'aussie-psych-fuzz-bass'
  },
  'kins-signature': {
    key: 'E',
    tonicFreq: 164.8,
    vinylWeight: 160,
    grooveExcursion: 'medium-heavy',
    grit: 0.52,
    brightness: 1.15,
    crackleRate: 0.993,
    hapticType: 'medium',
    character: 'neo-psychedelic-gold'
  }
};

/**
 * Deterministically generates an authentic acoustic groove profile for any arbitrary song
 */
export function deriveGrooveProfile(artist = 'Kins', title = 'Track') {
  const normKey = `${(artist || '').toLowerCase().trim()}-${(title || '').toLowerCase().trim()}`
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (SONG_GROOVE_PROFILES[normKey]) {
    return { ...SONG_GROOVE_PROFILES[normKey], id: normKey };
  }

  let hash = 0;
  const seed = `${artist} - ${title}`.toLowerCase();
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const keys = [
    { key: 'C', freq: 130.81 },
    { key: 'D', freq: 146.83 },
    { key: 'Eb', freq: 155.56 },
    { key: 'E', freq: 164.81 },
    { key: 'F', freq: 174.61 },
    { key: 'F#', freq: 185.00 },
    { key: 'G', freq: 196.00 },
    { key: 'Ab', freq: 207.65 },
    { key: 'A', freq: 220.00 },
    { key: 'Bb', freq: 233.08 },
    { key: 'B', freq: 246.94 }
  ];
  const keyObj = keys[absHash % keys.length];

  const weights = [120, 140, 160, 180];
  const weight = weights[(absHash >> 3) % weights.length];

  const grit = 0.25 + ((absHash >> 5) % 65) / 100;
  const brightness = 0.80 + ((absHash >> 8) % 50) / 100;

  return {
    id: normKey,
    key: keyObj.key,
    tonicFreq: keyObj.freq,
    vinylWeight: weight,
    grooveExcursion: grit > 0.65 ? 'heavy' : (grit > 0.4 ? 'medium' : 'fine'),
    grit: parseFloat(grit.toFixed(2)),
    brightness: parseFloat(brightness.toFixed(2)),
    crackleRate: grit > 0.6 ? 0.991 : (grit > 0.4 ? 0.994 : 0.996),
    hapticType: grit > 0.65 ? 'heavy' : (grit > 0.4 ? 'medium' : 'crisp'),
    character: 'procedural-groove'
  };
}

// In-memory audio buffer cache to eliminate repeated network fetches & decodes
const AUDIO_BUFFER_CACHE = new Map();

export class VinylGrooveEngine {
  constructor() {
    this.ctx = null;
    this.currentTrack = null;
    this.currentProfile = deriveGrooveProfile('Kins', 'Inspiration');
    this.decodedBuffer = null;
    this.isDecoding = false;

    // Audio Graph Nodes
    this.masterGain = null;
    this.formantFilter = null;
    this.radialFilter = null;
    this.carrierOsc = null;
    this.modOsc = null;
    this.modGain = null;
    this.noiseNode = null;
    this.noiseBuffer = null;
    this.excursionOsc = null;
    this.excursionGain = null;

    // Granular Song Slicing State
    this.granularSource = null;
    this.granularGain = null;
    this.lastGranularSliceTime = 0;
    this.lastGranularDirection = 0;

    this.isPlaying = false;
    this.lastVelocity = 0;
    this.lastScrubTime = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.buildNoiseBuffer();
  }

  buildNoiseBuffer() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds of seamless noise
    const noiseBuf = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuf.getChannelData(0);

    const crackleRate = this.currentProfile?.crackleRate || 0.994;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const isCrackle = Math.random() > crackleRate;
      const crackle = isCrackle ? (Math.random() * 2.2 - 1.1) : 0;
      data[i] = white * 0.12 + crackle;
    }
    this.noiseBuffer = noiseBuf;
  }

  /**
   * Loads a new track, derives its acoustic groove profile, and asynchronously
   * pre-buffers the audio waveform into memory for instant granular scrubbing.
   */
  async loadTrack(trackObj) {
    if (!trackObj) return;
    this.currentTrack = trackObj;
    this.currentProfile = deriveGrooveProfile(trackObj.artist, trackObj.title);

    // Refresh noise buffer with the song's specific crackle rate
    this.buildNoiseBuffer();

    const previewUrl = trackObj.previewUrl;
    if (!previewUrl) {
      this.decodedBuffer = null;
      return;
    }

    const secureUrl = previewUrl.replace(/^http:\/\//i, 'https://');
    if (AUDIO_BUFFER_CACHE.has(secureUrl)) {
      this.decodedBuffer = AUDIO_BUFFER_CACHE.get(secureUrl);
      return;
    }

    this.init();
    if (!this.ctx) return;

    this.isDecoding = true;
    try {
      const resp = await fetch(secureUrl, { mode: 'cors' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuf = await resp.arrayBuffer();
      if (!this.ctx) return;
      const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
      AUDIO_BUFFER_CACHE.set(secureUrl, audioBuf);
      if (this.currentTrack && this.currentTrack.previewUrl === previewUrl) {
        this.decodedBuffer = audioBuf;
      }
    } catch (e) {
      // CORS or network failure: Layer 2 procedural modeling seamlessly takes over
      this.decodedBuffer = null;
    } finally {
      this.isDecoding = false;
    }
  }

  playNeedleDrop() {
    this.playVinylNeedleSpinUp();
  }

  playVinylNeedleSpinUp() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const now = this.ctx.currentTime;
      const profile = this.currentProfile;

      // 1. Mechanical stylus contact thump scaled to vinyl weight (180g = deeper, 120g = tighter)
      const baseWeightFactor = (profile.vinylWeight || 140) / 140;
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(190 * (1 / baseWeightFactor), now);
      thumpOsc.frequency.exponentialRampToValueAtTime(24, now + 0.08);

      thumpGain.gain.setValueAtTime(0.24 * baseWeightFactor, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.ctx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.09);

      // 2. Diamond stylus micro-click impact
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'sawtooth';
      clickOsc.frequency.setValueAtTime(3600 * profile.brightness, now);
      clickOsc.frequency.exponentialRampToValueAtTime(500, now + 0.02);

      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // 3. Vinyl groove surface friction & acceleration whoosh
      if (this.noiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;

        const spinFilter = this.ctx.createBiquadFilter();
        spinFilter.type = 'bandpass';
        spinFilter.frequency.setValueAtTime(280, now);
        spinFilter.frequency.exponentialRampToValueAtTime(3200 * profile.brightness, now + 0.7);
        spinFilter.Q.setValueAtTime(2.8 + profile.grit, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.14 * (0.8 + profile.grit * 0.4), now + 0.06);
        noiseGain.gain.setValueAtTime(0.10, now + 0.45);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        noiseSrc.connect(spinFilter);
        spinFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + 0.9);
      }
    } catch (e) {
      console.warn('Vinyl spin-up audio error:', e);
    }
  }

  playVinylNeedleSpinDown(durationMs = 550) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const now = this.ctx.currentTime;
      const durationSec = durationMs / 1000;
      const profile = this.currentProfile;

      // 1. Stylus needle lift pop
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

      // 2. Vinyl groove friction decelerating downward in frequency
      if (this.noiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;

        const brakeFilter = this.ctx.createBiquadFilter();
        brakeFilter.type = 'bandpass';
        brakeFilter.frequency.setValueAtTime(2900 * profile.brightness, now);
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
    } catch (e) {
      console.warn('Vinyl spin-down audio error:', e);
    }
  }

  /**
   * Initializes real-time dual-layer scrubbing:
   * Sets up procedural formant filters tuned to the song's musical key,
   * sets initial radial lowpass based on distance from record center.
   */
  startScratch(timeSec = 0, normalizedPos = 0) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      if (this.isPlaying) return;

      const now = this.ctx.currentTime;
      const profile = this.currentProfile;

      // Master Output Gain Bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);

      // Radial Physics Filter (Inner Groove Distortion / Pinch Effect)
      // Outer rim (0.0): 7500Hz bright. Inner label (1.0): 4200Hz warm & compressed.
      this.radialFilter = this.ctx.createBiquadFilter();
      this.radialFilter.type = 'lowpass';
      const initialRadialCutoff = (7200 - normalizedPos * 2800) * profile.brightness;
      this.radialFilter.frequency.setValueAtTime(Math.max(1200, initialRadialCutoff), now);
      this.radialFilter.Q.setValueAtTime(1.2 + normalizedPos * 1.5, now);

      // Formant Bandpass Filter locked to Song's Key Resonance
      this.formantFilter = this.ctx.createBiquadFilter();
      this.formantFilter.type = 'bandpass';
      const initialFormant = (profile.tonicFreq * 4.5) * profile.brightness;
      this.formantFilter.frequency.setValueAtTime(initialFormant, now);
      this.formantFilter.Q.setValueAtTime(4.0 + profile.grit * 2.5, now);

      // Vinyl Surface Crackle / Friction Noise
      if (this.noiseBuffer) {
        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = this.noiseBuffer;
        this.noiseNode.loop = true;
        this.noiseNode.connect(this.formantFilter);
      }

      // Primary DJ Scratch Carrier Oscillator (Tuned to Song's Musical Tonic)
      this.carrierOsc = this.ctx.createOscillator();
      this.carrierOsc.type = profile.grit > 0.6 ? 'sawtooth' : 'triangle';
      this.carrierOsc.frequency.setValueAtTime(profile.tonicFreq, now);

      // Sub-harmonic Excursion Modulator (Low-End Lateral Groove Excursion)
      this.excursionOsc = this.ctx.createOscillator();
      this.excursionOsc.type = 'triangle';
      this.excursionOsc.frequency.setValueAtTime(profile.tonicFreq * 0.5, now);

      this.excursionGain = this.ctx.createGain();
      this.excursionGain.gain.setValueAtTime(profile.grit * 45, now);
      this.excursionOsc.connect(this.excursionGain);
      this.excursionGain.connect(this.carrierOsc.frequency);

      const carrierGain = this.ctx.createGain();
      carrierGain.gain.setValueAtTime(0.32, now);
      this.carrierOsc.connect(carrierGain);
      carrierGain.connect(this.formantFilter);

      this.formantFilter.connect(this.radialFilter);
      this.radialFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      if (this.noiseNode) this.noiseNode.start(now);
      this.carrierOsc.start(now);
      this.excursionOsc.start(now);

      this.isPlaying = true;
      this.lastVelocity = 0;
      this.lastScrubTime = performance.now();
    } catch (e) {
      console.warn('Start scratch error:', e);
    }
  }

  /**
   * Real-time scrub update:
   * Modulates procedural friction & key formant, applies radial inner-groove distortion,
   * and triggers bidirectional granular audio slices of the actual song.
   */
  updateScratch(velocity, timeSec = 0, normalizedPos = 0) {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const speed = Math.abs(velocity);
    const direction = velocity >= 0 ? 1 : -1;
    const profile = this.currentProfile;
    const isHardScratch = speed > 0.25;

    // Detect direction reversal for authentic DJ "wicka" chirp pop
    if (this.lastVelocity && Math.sign(velocity) !== Math.sign(this.lastVelocity) && speed > 0.16) {
      this.playScratchChirp(direction);
    }
    this.lastVelocity = velocity;

    // 1. Master Output Gain
    const targetGain = isHardScratch
      ? Math.min(0.65, 0.14 + speed * (0.42 + profile.grit * 0.15))
      : Math.min(0.28, Math.max(0.02, speed * 0.22));

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.012);

    // 2. Carrier Frequency: Scales with speed while anchored to the song's musical key!
    const keyHarmonic = profile.tonicFreq;
    const speedMultiplier = Math.pow(speed, 0.88);
    const targetFreq = direction > 0
      ? (keyHarmonic + speedMultiplier * (keyHarmonic * 3.8))
      : (keyHarmonic * 0.75 + speedMultiplier * (keyHarmonic * 2.6));

    this.carrierOsc.frequency.cancelScheduledValues(now);
    this.carrierOsc.frequency.setTargetAtTime(
      Math.min(3600, Math.max(70, targetFreq)),
      now,
      0.012
    );

    // 3. Radial Physics (Inner Groove Distortion / Linear Speed Variation)
    // As needle approaches label (normalizedPos -> 1.0):
    // Linear groove velocity drops, causing high-frequency rolloff & harmonic pinch
    const clampedPos = Math.min(1, Math.max(0, normalizedPos));
    const radialCutoff = (7400 - clampedPos * 3000) * profile.brightness;
    this.radialFilter.frequency.cancelScheduledValues(now);
    this.radialFilter.frequency.setTargetAtTime(
      Math.min(9000, Math.max(1000, radialCutoff)),
      now,
      0.015
    );
    this.radialFilter.Q.setTargetAtTime(1.2 + clampedPos * 1.8 + profile.grit, now, 0.02);

    // 4. Formant Filter Sweep (Song key and grit character)
    const filterFreq = Math.min(6800, Math.max(600, (keyHarmonic * 4) + speed * 2200 * profile.brightness));
    this.formantFilter.frequency.cancelScheduledValues(now);
    this.formantFilter.frequency.setTargetAtTime(filterFreq, now, 0.012);
    this.formantFilter.Q.setTargetAtTime(isHardScratch ? 6.2 : 3.5, now, 0.02);

    // 5. Excursion / Bass Rumble
    if (this.excursionGain) {
      const targetExcursion = (profile.grit * 50) * (1 + speed * 1.5);
      this.excursionGain.gain.setTargetAtTime(Math.min(140, targetExcursion), now, 0.015);
    }

    // 6. Surface Noise Friction Speed
    if (this.noiseNode && this.noiseNode.playbackRate) {
      const rate = Math.min(3.5, Math.max(0.3, speed * 1.25));
      this.noiseNode.playbackRate.setTargetAtTime(rate, now, 0.012);
    }

    // 7. Layer 1: Granular Audio Snippet Playback (Actual Song Audio!)
    this.triggerGranularSongSlice(velocity, timeSec);
  }

  /**
   * Layer 1 Granular Audio Engine:
   * Slices a micro-window of the real song audio buffer around the current timestamp.
   * Plays forward when velocity > 0, and reversed when velocity < 0 (real DJ slipmat back-spin)!
   */
  triggerGranularSongSlice(velocity, timeSec) {
    if (!this.decodedBuffer || !this.ctx || Math.abs(velocity) < 0.05) return;

    const nowMs = performance.now();
    // Throttle granular slice creation to 75ms intervals for 60fps mobile budget
    if (nowMs - this.lastGranularSliceTime < 75) return;
    this.lastGranularSliceTime = nowMs;

    const direction = velocity >= 0 ? 1 : -1;
    const speed = Math.abs(velocity);
    const audioCtx = this.ctx;
    const buffer = this.decodedBuffer;
    const duration = buffer.duration;

    const sliceDuration = 0.28; // 280ms micro-window
    const clampedCenterTime = Math.max(0, Math.min(duration - sliceDuration, timeSec));
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(clampedCenterTime * sampleRate);
    const numSamples = Math.floor(sliceDuration * sampleRate);

    if (startSample + numSamples > buffer.length) return;

    try {
      const sliceBuf = audioCtx.createBuffer(
        buffer.numberOfChannels,
        numSamples,
        sampleRate
      );

      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const srcData = buffer.getChannelData(ch);
        const destData = sliceBuf.getChannelData(ch);

        if (direction < 0) {
          // Backward Scratch: Reverse the audio waveform samples for authentic back-spin!
          for (let i = 0; i < numSamples; i++) {
            destData[i] = srcData[startSample + numSamples - 1 - i];
          }
        } else {
          // Forward Scratch: Forward audio slice
          for (let i = 0; i < numSamples; i++) {
            destData[i] = srcData[startSample + i];
          }
        }
      }

      const now = audioCtx.currentTime;
      const sliceSrc = audioCtx.createBufferSource();
      sliceSrc.buffer = sliceBuf;

      // Pitch is proportional to scrub velocity!
      const pitchRate = Math.min(2.4, Math.max(0.4, speed * 1.45));
      sliceSrc.playbackRate.setValueAtTime(pitchRate, now);

      const sliceGain = audioCtx.createGain();
      const vol = Math.min(0.38, 0.10 + speed * 0.35);

      // Clean cosine crossfade envelope (12ms attack, 12ms decay) to prevent clicks
      sliceGain.gain.setValueAtTime(0.001, now);
      sliceGain.gain.linearRampToValueAtTime(vol, now + 0.015);
      sliceGain.gain.setValueAtTime(vol, now + (sliceDuration / pitchRate) - 0.02);
      sliceGain.gain.linearRampToValueAtTime(0.001, now + (sliceDuration / pitchRate));

      sliceSrc.connect(sliceGain);
      if (this.radialFilter) {
        sliceGain.connect(this.radialFilter);
      } else {
        sliceGain.connect(audioCtx.destination);
      }

      sliceSrc.start(now);
      sliceSrc.stop(now + (sliceDuration / pitchRate) + 0.01);
    } catch (err) {}
  }

  /**
   * Authentic DJ Scratch Chirp Pop on rapid direction reversal
   */
  playScratchChirp(direction = 1) {
    try {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const profile = this.currentProfile;

      const chirpOsc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();
      const chirpFilter = this.ctx.createBiquadFilter();

      chirpOsc.type = 'sawtooth';
      chirpFilter.type = 'bandpass';
      chirpFilter.Q.setValueAtTime(5.5, now);

      const tonic = profile.tonicFreq;
      if (direction > 0) {
        chirpOsc.frequency.setValueAtTime(tonic * 2, now);
        chirpOsc.frequency.exponentialRampToValueAtTime(tonic * 6, now + 0.045);
        chirpFilter.frequency.setValueAtTime(tonic * 4, now);
        chirpFilter.frequency.exponentialRampToValueAtTime(tonic * 12, now + 0.045);
      } else {
        chirpOsc.frequency.setValueAtTime(tonic * 5.5, now);
        chirpOsc.frequency.exponentialRampToValueAtTime(tonic * 1.5, now + 0.045);
        chirpFilter.frequency.setValueAtTime(tonic * 11, now);
        chirpFilter.frequency.exponentialRampToValueAtTime(tonic * 3.5, now + 0.045);
      }

      chirpGain.gain.setValueAtTime(0.32, now);
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
      if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      }
      setTimeout(() => {
        if (this.noiseNode) {
          try { this.noiseNode.stop(); } catch (e) {}
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        if (this.carrierOsc) {
          try { this.carrierOsc.stop(); } catch (e) {}
          this.carrierOsc.disconnect();
          this.carrierOsc = null;
        }
        if (this.excursionOsc) {
          try { this.excursionOsc.stop(); } catch (e) {}
          this.excursionOsc.disconnect();
          this.excursionOsc = null;
        }
        this.isPlaying = false;
      }, 70);
    } catch (e) {
      this.isPlaying = false;
    }
  }

  teardown() {
    this.stopScratch();
    if (this.ctx && this.ctx.state !== 'closed') {
      try { this.ctx.close(); } catch (e) {}
      this.ctx = null;
    }
  }
}
