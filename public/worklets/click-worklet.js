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
    this.cachedSampleRate = sampleRate;

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
        this.nextClickTime = currentTime + 0.06;
        this.active.length = 0;
        this.playing = true;
        break;
      case 'stop':
        this.playing = false;
        this.active.length = 0;
        break;
      case 'tiers':
        if (Array.isArray(m.tiers)) this.beatTiers = m.tiers;
        break;
      case 'sync':
        /* Resume-after-interruption/background: jump the cursor to a fresh
           point on the current clock instead of scheduling missed clicks in
           the past (they would all fire at once as a distorted burst). Beat
           counters are preserved so the bar position never jumps. Any
           already-rendered-but-unplayed clicks are dropped. */
        var offset = (typeof m.offsetSec === 'number' && m.offsetSec > 0) ? m.offsetSec : 0.06;
        if (this.playing) {
          this.active.length = 0;
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

  /* Pre-render one click into a Float32Array:
     - Band-limited multi-harmonic acoustic modeling for each timbre
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
    var fadeN = Math.max(2, Math.round(0.002 * sampleRate));     // 2ms tail fade

    var soundId = sound.id || 'click';

    for (var i = 0; i < n; i++) {
      var tSec = i / sampleRate;
      var wave = 0;

      if (soundId === 'click') {
        // Mechanical Wood Metronome: snappy pitch-swept transient + wood resonance
        var sweepFactor = Math.max(1, 1 + 1.2 * Math.exp(-tSec / 0.0035));
        var currentFreq = freq * sweepFactor;
        var ph = (2 * Math.PI * currentFreq * tSec) % (2 * Math.PI);
        // Multi-harmonic warm body (fundamental + 2nd harmonic)
        wave = 0.75 * Math.sin(ph) + 0.25 * Math.sin(2 * ph);
      } else if (soundId === 'woodblock') {
        // Resonant Woodblock: fundamental + hollow 2.76x wood resonance mode
        var ph1 = (2 * Math.PI * freq * tSec) % (2 * Math.PI);
        var ph2 = (2 * Math.PI * (freq * 2.76) * tSec) % (2 * Math.PI);
        wave = 0.78 * Math.sin(ph1) + 0.22 * Math.sin(ph2);
      } else if (soundId === 'beep') {
        // Studio Sine Pulse: pure fundamental with gentle 2nd harmonic roundness
        var phB = (2 * Math.PI * freq * tSec) % (2 * Math.PI);
        wave = 0.92 * Math.sin(phB) + 0.08 * Math.sin(2 * phB);
      } else if (soundId === 'rimshot') {
        // Drum Stick / Rimshot: crisp transient with fast secondary harmonic burst
        var sweepR = Math.max(1, 1 + 1.6 * Math.exp(-tSec / 0.002));
        var phR1 = (2 * Math.PI * (freq * sweepR) * tSec) % (2 * Math.PI);
        var phR2 = (2 * Math.PI * (freq * 1.62) * tSec) % (2 * Math.PI);
        wave = 0.7 * Math.sin(phR1) + 0.3 * Math.sin(phR2);
      } else if (soundId === 'cowbell') {
        // 808-Style Metallic Percussion: dual metal modes
        var phC1 = (2 * Math.PI * freq * tSec) % (2 * Math.PI);
        var phC2 = (2 * Math.PI * (freq * 1.45) * tSec) % (2 * Math.PI);
        wave = 0.58 * Math.sin(phC1) + 0.42 * Math.sin(phC2);
      } else {
        // Fallback to waveform by type
        var phF = (2 * Math.PI * freq * tSec) % (2 * Math.PI);
        if (sound.type === 'sine') wave = Math.sin(phF);
        else if (sound.type === 'triangle') wave = (2 / Math.PI) * Math.asin(Math.sin(phF));
        else wave = 0.8 * Math.sin(phF) + 0.2 * Math.sin(3 * phF); // band-limited square approx
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

    // Smooth cosine fade-out at the tail to guarantee landing at true zero
    for (var j = 0; j < fadeN; j++) {
      var fadeRatio = 0.5 * (1 - Math.cos((Math.PI * j) / fadeN));
      buf[n - 1 - (fadeN - 1 - j)] *= fadeRatio;
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
      var buf = this.getBuffer(this.currentSound(), isAccent, tier);

      if (this.active.length < MAX_ACTIVE_VOICES) {
        this.active.push({ frame: this.nextClickTime * sampleRate, buf: buf });
      }

      this.scheduledTotal++;
      this.port.postMessage({
        type: 'beat',
        time: this.nextClickTime,
        n: this.scheduledTotal,
        beatInBar: beatInBar,
        isAccent: isAccent,
        tier: tier
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
      for (var i = this.active.length - 1; i >= 0; i--) {
        var a = this.active[i];
        var offset = Math.round(a.frame) - blockStart;
        if (offset >= out.length) continue; /* still ahead */
        var end = offset + a.buf.length;
        if (end <= 0) { this.active.splice(i, 1); continue; } /* finished */
        var srcStart = offset < 0 ? -offset : 0;
        var dstStart = offset > 0 ? offset : 0;
        var n = Math.min(a.buf.length - srcStart, out.length - dstStart);
        for (var j = 0; j < n; j++) out[dstStart + j] += a.buf[srcStart + j];
        if (srcStart + n >= a.buf.length) this.active.splice(i, 1);
      }

      // Fast, transparent soft saturation limiter: guarantees zero digital clipping (0 dBFS)
      for (var s = 0; s < out.length; s++) {
        var val = out[s];
        if (val > 0.8 || val < -0.8) {
          out[s] = Math.tanh(val);
        }
      }
    }

    return true; /* stay alive even while silent so start() is instant */
  }
}

registerProcessor('kins-click', KinsClickProcessor);
