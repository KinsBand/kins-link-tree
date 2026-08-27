/* ==========================================================================
   KINS Metronome — AudioWorklet click generator ('kins-click').
   Loads via ctx.audioWorklet.addModule('/worklets/click-worklet.js').
   Runs on the audio rendering thread: scheduling and synthesis are immune
   to ALL main-thread stalls (GC, layout, long tasks), which is the only
   design that guarantees the metronome never stutters or skips a beat.
   The main thread stays authoritative for config; this side renders.

   Protocol (main -> worklet):
      { type:'sounds', sounds:[{id,type,freq,accentFreq,decay,gain}] }
      { type:'sound',  id }
      { type:'start',  bpm, perBeat, beatsPerBar, accentFirst, tiers? }
      { type:'stop' }
      { type:'bpm',    bpm }                       // takes effect next click
      { type:'opts',   perBeat?, beatsPerBar?, accentFirst? }
      { type:'tiers',  tiers:[...] }
      { type:'sync',   offsetSec }                 // re-seat cursor after an
                                                   // interruption/background
                                                   // gap (counters preserved)
   Protocol (worklet -> main):
     { type:'beat', time, beatInBar, isAccent, tier } // time = audio-clock secs
     { type:'stats', scheduled }

   NOTE: worklet modules cannot import site config — the beat math below
   intentionally mirrors src/scripts/controllers/metronome/audioEngine.js.
   ========================================================================== */

/* Render-quantum blocks to keep pre-rendered ahead of playback. The audio
   thread calls process() every 128 frames (~2.7ms @48k), so a two-block
   horizon is ample slack without delaying tempo changes. */
var WORKLET_AHEAD_BLOCKS = 2;

/* Click tail length past the exponential-decay endpoint, seconds */
var WORKLET_TAIL_SEC = 0.01;
var MAX_ACTIVE_VOICES = 32;

/* Soft-knee ceiling. The transfer curve is continuous at the knee
   (output == input at |x| = KNEE), so crossing it never steps the
   waveform, and asymptotic to 1.0 so overlapping voices can never
   exceed digital full scale. */
var WORKLET_LIMIT_KNEE = 0.8;

/* Release ramp applied to ringing voices on stop/sync: truncating a
   mid-decay click hard-cuts the waveform and pops; a ~4ms cosine-ish
   fade lands every voice at true zero instead. */
var WORKLET_RELEASE_SEC = 0.004;

class KinsClickProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.playing = false;
    this.bpm = 120;
    this.perBeat = 1;
    this.beatsPerBar = 4;
    this.accentFirst = true;
    this.beatTiers = ['mid', 'mid', 'mid', 'mid'];
    /* Scheduling cursor on the audio clock (seconds) + beat bookkeeping.
       Mirrors the legacy scheduler: clickCounter advances every click,
       beatCounter only on downbeats so subdivision changes can never jump
       the bar position. */
    this.nextClickTime = 0;
    this.clickCounter = 0;
    this.beatCounter = 0;
    this.scheduledTotal = 0;
    this.soundId = null;
    this.sounds = {};
    this.buffers = new Map(); /* "<id>:<accent>:<tier>" -> Float32Array */
    this.active = [];         /* [{frame, buf}] sorted implicitly by push order */
    this.releaseFrame = -1;   /* absolute frame from which voices fade out; -1 = off */
    this.releaseFrames = Math.max(32, Math.round(WORKLET_RELEASE_SEC * sampleRate));
    this.cachedSampleRate = sampleRate;
    this._phase = 0;          /* phase-integrated synth accumulator */

    var self = this;
    this.port.onmessage = function (e) { self.onMessage(e.data); };
  }

  onMessage(m) {
    if (!m || typeof m !== 'object') return;
    switch (m.type) {
      case 'sounds':
        this.sounds = {};
        var list = Array.isArray(m.sounds) ? m.sounds : [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && list[i].id) this.sounds[list[i].id] = list[i];
        }
        this.buffers.clear();
        break;
      case 'sound':
        if (typeof m.id === 'string') this.soundId = m.id;
        break;
      case 'start':
        this.bpm = m.bpm || 120;
        this.perBeat = m.perBeat || 1;
        this.beatsPerBar = m.beatsPerBar || 4;
        this.accentFirst = !!m.accentFirst;
        if (Array.isArray(m.tiers)) this.beatTiers = m.tiers;
        this.clickCounter = 0;
        this.beatCounter = 0;
        this.nextClickTime = currentTime + 0.08; /* mirrors startOffsetSec */
        this.releaseVoices();
        this.playing = true;
        break;
      case 'stop':
        this.playing = false;
        this.releaseVoices();
        break;
      case 'tiers':
        if (Array.isArray(m.tiers)) this.beatTiers = m.tiers;
        break;
      case 'sync':
        /* Resume-after-interruption/background: jump the cursor to a fresh
           point on the current clock instead of scheduling missed clicks in
           the past (they would all fire at once as a distorted burst). Beat
           counters are preserved so the bar position never jumps. Ringing
           voices release over ~4ms rather than being truncated mid-wave. */
        var offset = (typeof m.offsetSec === 'number' && m.offsetSec > 0) ? m.offsetSec : 0.08;
        if (this.playing) {
          this.releaseVoices();
          this.nextClickTime = currentTime + offset;
        }
        break;
      case 'bpm':
        if (typeof m.bpm === 'number' && m.bpm > 0) this.bpm = m.bpm;
        break;
      case 'opts':
        if (typeof m.perBeat === 'number' && m.perBeat > 0) this.perBeat = m.perBeat;
        if (typeof m.beatsPerBar === 'number' && m.beatsPerBar > 0) this.beatsPerBar = m.beatsPerBar;
        if (typeof m.accentFirst === 'boolean') this.accentFirst = m.accentFirst;
        break;
    }
  }

  currentSound() {
    return this.sounds[this.soundId] ||
      this.sounds[Object.keys(this.sounds)[0]] ||
      { id: 'click', type: 'square', freq: 1100, accentFreq: 1750, decay: 0.04, gain: 0.5 };
  }

  /* Start a short fade-out on everything currently ringing. The earliest
     release wins so repeated stop/start cycles can't extend or restart it;
     process() clears it once no voices remain. */
  releaseVoices() {
    if (this.active.length && this.releaseFrame < 0) {
      this.releaseFrame = Math.round(currentTime * sampleRate);
    }
  }

  /* Pre-render one click into a Float32Array:
     - Band-limited multi-harmonic acoustic modeling for each timbre
     - Phase-integrated pitch sweeps (true exponential glide — evaluating
       sin(2π·f(t)·t) directly would superimpose f'(t)·t onto the
       instantaneous frequency and warp the sweep into a warble)
     - Smooth 0.75ms cosine attack ramp (completely eliminates DC step pop)
     - Exponential decay envelope
     - Smooth 2ms cosine fade-out at the tail (guarantees landing at true zero) */
  getBuffer(sound, accent, tier) {
    if (this.cachedSampleRate !== sampleRate) {
      this.buffers.clear();
      this.cachedSampleRate = sampleRate;
    }

    var t = tier || 'mid';
    var key = sound.id + ':' + (accent ? 1 : 0) + ':' + t;
    var hit = this.buffers.get(key);
    if (hit) return hit;

    var ratio = t === 'low' ? 0.75 : (t === 'high' ? 1.5 : 1);
    var baseFreq = accent ? sound.accentFreq : sound.freq;
    var freq = baseFreq * ratio;
    var peak = Math.max(0.0001, sound.gain) * (accent ? 1.15 : 1.0);
    var decay = Math.max(0.005, sound.decay);
    var totalSec = decay + WORKLET_TAIL_SEC;
    var n = Math.max(32, Math.ceil(totalSec * sampleRate));
    var buf = new Float32Array(n);

    var attackN = Math.max(2, Math.round(0.00075 * sampleRate)); // 0.75ms cosine ramp
    var lnRatio = Math.log(0.0005 / peak);
    var fadeN = Math.min(n, Math.max(2, Math.round(0.002 * sampleRate))); // 2ms tail fade

    var soundId = sound.id || 'click';
    var TWO_PI = 2 * Math.PI;

    for (var i = 0; i < n; i++) {
      var tSec = i / sampleRate;
      var instFreq = freq;   /* instantaneous frequency for this sample */
      var mixA = 1, mixB = 0, harmMul = 2;

      if (soundId === 'click' || soundId === 'classic-click') {
        // Mechanical Wood Metronome: snappy pitch-swept transient + wood resonance
        instFreq = freq * (1 + 1.2 * Math.exp(-tSec / 0.0035));
        mixA = 0.75; mixB = 0.25; harmMul = 2;
      } else if (soundId === 'woodblock') {
        // Resonant Woodblock: fundamental + hollow 2.76x wood resonance mode
        mixA = 0.78; mixB = 0.22; harmMul = 2.76;
      } else if (soundId === 'beep' || soundId === 'digital-beep') {
        // Studio Sine Pulse: pure fundamental with gentle 2nd harmonic roundness
        mixA = 0.92; mixB = 0.08; harmMul = 2;
      } else if (soundId === 'rimshot' || soundId === 'rim-click') {
        // Drum Stick / Rimshot: crisp transient with fast secondary harmonic burst
        instFreq = freq * (1 + 1.6 * Math.exp(-tSec / 0.002));
        mixA = 0.7; mixB = 0.3; harmMul = 1.62;
      } else if (soundId === 'cowbell') {
        // 808-Style Metallic Percussion: dual metal modes
        mixA = 0.58; mixB = 0.42; harmMul = 1.45;
      } else if (soundId === 'voice-count') {
        // Voice Count: warm vocal-like tone — fundamental + soft 2nd harmonic, no sweep
        // Mild formant-ish mix; tier ratio already moves pitch for low/mid/high; mute handled upstream
        mixA = 0.84; mixB = 0.16; harmMul = 1.98;
      } else if (soundId === 'tick') {
        // Tick: ultra-crisp bright tick with very fast pitch snap
        instFreq = freq * (1 + 0.95 * Math.exp(-tSec / 0.0018));
        mixA = 0.70; mixB = 0.30; harmMul = 2;
      } else if (soundId === 'synth-pluck' || soundId === 'synthpluck') {
        // Synth Pluck: modern pluck with fast pitch fall + bright overtone shimmer
        instFreq = freq * (1 + 0.65 * Math.exp(-tSec / 0.006));
        mixA = 0.62; mixB = 0.38; harmMul = 2.5;
      } else if (soundId === 'bell') {
        // Bell: large bell — long metallic shimmer with inharmonic partial
        mixA = 0.56; mixB = 0.44; harmMul = 2.76;
      } else if (soundId === 'claves') {
        // Claves: high wooden strike — sharp, hollow
        mixA = 0.78; mixB = 0.22; harmMul = 1.91;
      } else if (soundId === 'kick') {
        // Kick: deep thump with strong downward sweep (starts ~3x, falls to fundamental)
        instFreq = freq * (1 + 2.0 * Math.exp(-tSec / 0.018));
        mixA = 0.88; mixB = 0.12; harmMul = 1;
      } else if (soundId === 'hihat' || soundId === 'hi-hat') {
        // Hi-Hat: closed metallic sizzle — high, airy, very short
        mixA = 0.38; mixB = 0.62; harmMul = 1.52;
      }

      /* Accumulate phase from the per-sample angular increment so sweeps
         glide exactly as designed; wrap keeps the accumulator precise. */
      this._phase += (TWO_PI * instFreq) / sampleRate;
      if (this._phase > TWO_PI) this._phase -= TWO_PI;
      var wave = mixA * Math.sin(this._phase) + mixB * Math.sin(harmMul * this._phase);

      if (soundId !== 'click' && soundId !== 'classic-click' && soundId !== 'woodblock' && soundId !== 'beep' && soundId !== 'digital-beep' &&
          soundId !== 'rimshot' && soundId !== 'rim-click' && soundId !== 'cowbell' && soundId !== 'voice-count' && soundId !== 'tick' &&
          soundId !== 'synth-pluck' && soundId !== 'synthpluck' && soundId !== 'bell' && soundId !== 'claves' && soundId !== 'kick' &&
          soundId !== 'hihat' && soundId !== 'hi-hat') {
        // Fallback to waveform by type
        if (sound.type === 'sine') wave = Math.sin(this._phase);
        else if (sound.type === 'triangle') wave = (2 / Math.PI) * Math.asin(Math.sin(this._phase));
        else wave = 0.8 * Math.sin(this._phase) + 0.2 * Math.sin(3 * this._phase); // band-limited square approx
      }

      // Cosine attack envelope + exponential decay
      var env = 0;
      if (i < attackN) {
        env = 0.5 * (1 - Math.cos((Math.PI * i) / attackN));
      } else if (tSec < decay) {
        env = Math.exp(lnRatio * (tSec / decay));
      } else {
        env = 0.0005;
      }

      buf[i] = wave * peak * env;
    }
    this._phase = 0;

    // Smooth cosine fade-out across the last fadeN samples: gain runs 1 → 0
    // so the buffer terminates at true zero with no end-of-click tick.
    for (var j = 0; j < fadeN; j++) {
      var fadeGain = 0.5 * (1 + Math.cos((Math.PI * j) / fadeN));
      buf[n - fadeN + j] *= fadeGain;
    }

    this.buffers.set(key, buf);
    return buf;
  }

  schedule() {
    var horizon = currentTime + (128 / sampleRate) * WORKLET_AHEAD_BLOCKS;
    while (this.playing && this.nextClickTime < horizon) {
      var startsABeat = Math.abs(this.clickCounter % this.perBeat) < 1e-9;
      var beatIndex = this.beatCounter - (startsABeat ? 0 : 1);
      if (beatIndex < 0) beatIndex = 0;
      var beatInBar = ((beatIndex % this.beatsPerBar) + this.beatsPerBar) % this.beatsPerBar;
      var isAccent = this.accentFirst && startsABeat && beatInBar === 0;
      var tier = (this.beatTiers && this.beatTiers[beatInBar]) || 'mid';
      // Mute tier + voice-count: visual beat still fires but no worklet audio (voice handled via main-thread Web Speech)
      var curSound = this.currentSound();
      var isVoice = curSound && curSound.id === 'voice-count';
      if (tier !== 'mute' && !isVoice) {
        var buf = this.getBuffer(curSound, isAccent, tier);
        if (this.active.length < MAX_ACTIVE_VOICES) {
          this.active.push({ frame: this.nextClickTime * sampleRate, buf: buf });
        }
      }

      this.scheduledTotal++;
      this.port.postMessage({
        type: 'beat',
        time: this.nextClickTime,
        n: this.scheduledTotal,
        beatInBar: beatInBar,
        isAccent: isAccent,
        tier: tier,
        isBeatStart: startsABeat
      });
      if (startsABeat) this.beatCounter++;
      this.clickCounter++;
      this.nextClickTime += 60 / this.bpm / this.perBeat;
    }
  }

  process(inputs, outputs) {
    var out = outputs[0][0];
    if (!out) return true;
    if (this.playing) this.schedule();
    out.fill(0);

    if (this.active.length) {
      var blockStart = currentTime * sampleRate;
      var relStart = this.releaseFrame;
      var relN = this.releaseFrames;
      for (var i = this.active.length - 1; i >= 0; i--) {
        var a = this.active[i];
        var offset = Math.round(a.frame) - blockStart;
        if (offset >= out.length) continue; /* still ahead */
        var end = offset + a.buf.length;
        if (end <= 0) { this.active.splice(i, 1); continue; } /* finished */
        var srcStart = offset < 0 ? -offset : 0;
        var dstStart = offset > 0 ? offset : 0;
        var n = Math.min(a.buf.length - srcStart, out.length - dstStart);
        if (relStart >= 0) {
          /* Release window active: every voice fades linearly to zero
             over relN frames from relStart, so stop/sync never truncate
             a mid-decay waveform (which pops). */
          for (var j = 0; j < n; j++) {
            var df = blockStart + dstStart + j - relStart;
            if (df >= relN) break; /* remainder of this block is silent */
            var g = df < 0 ? 1 : 1 - df / relN;
            out[dstStart + j] += a.buf[srcStart + j] * g;
          }
        } else {
          for (var k = 0; k < n; k++) out[dstStart + k] += a.buf[srcStart + k];
        }
        if (srcStart + n >= a.buf.length) this.active.splice(i, 1);
      }
      if (!this.active.length) this.releaseFrame = -1;

      // Continuous soft-knee ceiling: output == input at the knee, then
      // asymptotic to 1.0, so overlap never clips AND crossing the knee
      // never steps the waveform (the old hard tanh swap crackled).
      for (var s = 0; s < out.length; s++) {
        var val = out[s];
        if (val > WORKLET_LIMIT_KNEE || val < -WORKLET_LIMIT_KNEE) {
          var over = Math.abs(val) - WORKLET_LIMIT_KNEE;
          var shaped = WORKLET_LIMIT_KNEE + (1 - WORKLET_LIMIT_KNEE) * Math.tanh(over / (1 - WORKLET_LIMIT_KNEE));
          out[s] = val < 0 ? -shaped : shaped;
        }
      }
    } else if (this.releaseFrame >= 0) {
      this.releaseFrame = -1;
    }

    return true; /* stay alive even while silent so start() is instant */
  }
}

registerProcessor('kins-click', KinsClickProcessor);
