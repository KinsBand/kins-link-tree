/* ==========================================================================
   KINS Metronome — AudioWorklet click generator ('kins-click').
   Loads via ctx.audioWorklet.addModule(METRO_TIMING.workletUrl).
   Runs on the audio rendering thread: scheduling and synthesis are immune
   to ALL main-thread stalls (GC, layout, long tasks). The main thread
   stays authoritative for config; this side renders.

   The audio clock never stops while the context runs, so there is no
   "re-sync": the grid is continuous across tab switches and interruptions.
   Musical position lives in MetroClock (copied verbatim from
   src/scripts/controllers/metronome/metroClock.js — worklet modules are
   served unbundled; tests/metronome asserts the copies match).

   Protocol (main -> worklet):
     { type:'sounds', sounds:[{id,type,freq,accentFreq,decay,gain}] }
     { type:'sound',  id }
     { type:'start',  bpm, perBeat, beatsPerBar, tiers? }
     { type:'stop' }
     { type:'bpm',    bpm }                 // phase-preserving, immediate
     { type:'opts',   perBeat?, beatsPerBar? } // next beat / next bar
     { type:'tiers',  tiers:[...] }
     { type:'preview', soundId?, tier? }

   Protocol (worklet -> main):
     { type:'beat', time, n, bar, beatInBar, isAccent, tier, isBeatStart }
       time = audio-clock seconds at which the click sounds
   ========================================================================== */

/* Render-quantum blocks scheduled ahead of playback. process() runs every
   128 frames (~2.7ms @48k); two blocks is ample slack and keeps tempo
   changes immediate. */
var WORKLET_AHEAD_BLOCKS = 2;

/* Click tail length past the exponential-decay endpoint, seconds */
var WORKLET_TAIL_SEC = 0.01;
var MAX_ACTIVE_VOICES = 16;

/* First click after start lands this far ahead (mirrors
   METRO_TIMING.startOffsetSec) so it never fires before the graph runs. */
var WORKLET_START_OFFSET_SEC = 0.08;

/* Soft-knee ceiling: continuous at the knee and asymptotic to 1.0, so
   overlapping voices can never exceed digital full scale. */
var WORKLET_LIMIT_KNEE = 0.8;

/* Release ramp applied to ringing voices on stop: truncating a mid-decay
   click pops; a 3ms fade lands every voice at true zero instead. */
var WORKLET_RELEASE_SEC = 0.003;

var WORKLET_TIERS = ['low', 'mid', 'high'];

/* METRO-CLOCK:BEGIN */
class MetroClock {
  constructor() {
    this.event = { time: 0, bar: 0, beatInBar: 0, sub: 0, isBeatStart: true, tier: 'mid', isAccent: false, n: 0 };
    this.reset(0, {});
  }

  reset(time, cfg) {
    const c = cfg || {};
    this.bpm = MetroClock.validBpm(c.bpm) ? c.bpm : 120;
    this.perBeat = MetroClock.validCount(c.perBeat) ? Math.round(c.perBeat) : 1;
    this.beatsPerBar = MetroClock.validCount(c.beatsPerBar) ? Math.round(c.beatsPerBar) : 4;
    this.tiers = Array.isArray(c.tiers) ? c.tiers.slice() : [];
    this.bar = 0;
    this.beat = 0;
    this.sub = 0;
    this.nextTime = time;
    this.lastTime = -Infinity;
    this.count = 0;
    this.pendingPerBeat = 0;
    this.pendingBeatsPerBar = 0;
    this.pendingTiers = null;
  }

  static validBpm(v) { return typeof v === 'number' && v > 0 && v < 2000; }
  static validCount(v) { return typeof v === 'number' && v >= 1 && v <= 64; }

  interval() { return 60 / this.bpm / this.perBeat; }

  /* Emit the click at nextTime and advance. Returns a reused object:
     copy fields out before calling next() again. */
  next() {
    const e = this.event;
    const tier = this.tiers[this.beat] || 'mid';
    e.time = this.nextTime;
    e.bar = this.bar;
    e.beatInBar = this.beat;
    e.sub = this.sub;
    e.isBeatStart = this.sub === 0;
    e.tier = tier;
    e.isAccent = e.isBeatStart && tier === 'high';
    e.n = ++this.count;
    this.lastTime = this.nextTime;
    this.nextTime += this.interval();
    this.sub++;
    if (this.sub >= this.perBeat) {
      this.sub = 0;
      if (this.pendingPerBeat) { this.perBeat = this.pendingPerBeat; this.pendingPerBeat = 0; }
      this.beat++;
      if (this.beat >= this.beatsPerBar) {
        this.beat = 0;
        this.bar++;
        this.applyPendingMeter();
      }
    }
    return e;
  }

  setBpm(bpm, now) {
    if (!MetroClock.validBpm(bpm) || bpm === this.bpm) return;
    /* Anchor on the last emitted click when it is still in the future
       (already committed to the output) so the rescale is exact. */
    const anchor = Math.max(now, this.lastTime);
    if (this.nextTime > anchor) this.nextTime = anchor + (this.nextTime - anchor) * (this.bpm / bpm);
    this.bpm = bpm;
  }

  setPerBeat(value) {
    if (!MetroClock.validCount(value)) return;
    const n = Math.round(value);
    if (n === (this.pendingPerBeat || this.perBeat)) return;
    if (n === this.perBeat) { this.pendingPerBeat = 0; return; }
    if (this.sub === 0) { this.perBeat = n; this.pendingPerBeat = 0; }
    else this.pendingPerBeat = n;
  }

  setMeter(value) {
    if (!MetroClock.validCount(value)) return;
    const n = Math.round(value);
    if (n === (this.pendingBeatsPerBar || this.beatsPerBar)) return;
    if (n === this.beatsPerBar) {
      this.pendingBeatsPerBar = 0;
      if (this.pendingTiers) { this.tiers = this.pendingTiers; this.pendingTiers = null; }
      return;
    }
    this.pendingBeatsPerBar = n;
    if (this.beat === 0 || (this.beat === 1 && this.sub === 0)) {
      this.applyPendingMeter();
      if (this.beat >= this.beatsPerBar) { this.beat = 0; this.bar++; }
    }
  }

  setTiers(tiers) {
    if (!Array.isArray(tiers)) return;
    if (this.pendingBeatsPerBar) this.pendingTiers = tiers.slice();
    else this.tiers = tiers.slice();
  }

  applyPendingMeter() {
    if (this.pendingBeatsPerBar) { this.beatsPerBar = this.pendingBeatsPerBar; this.pendingBeatsPerBar = 0; }
    if (this.pendingTiers) { this.tiers = this.pendingTiers; this.pendingTiers = null; }
  }

  /* Phase-preserving catch-up after a stall: advance whole clicks until
     nextTime >= time, jumping whole bars in bulk after a long gap. */
  skipTo(time) {
    let steps = 0;
    while (this.nextTime < time) {
      if (++steps > 256 && this.beat === 0 && this.sub === 0 && !this.pendingPerBeat) {
        const barSec = this.beatsPerBar * 60 / this.bpm;
        const bars = Math.floor((time - this.nextTime) / barSec);
        if (bars > 0) { this.nextTime += bars * barSec; this.bar += bars; this.count += bars * this.beatsPerBar * this.perBeat; }
        steps = 0;
        if (this.nextTime >= time) break;
      }
      this.next();
    }
  }

  snapshot() {
    return {
      bpm: this.bpm, perBeat: this.perBeat, beatsPerBar: this.beatsPerBar, tiers: this.tiers,
      bar: this.bar, beat: this.beat, sub: this.sub, nextTime: this.nextTime, lastTime: this.lastTime,
      count: this.count, pendingPerBeat: this.pendingPerBeat, pendingBeatsPerBar: this.pendingBeatsPerBar,
      pendingTiers: this.pendingTiers
    };
  }

  restore(s) {
    this.bpm = s.bpm; this.perBeat = s.perBeat; this.beatsPerBar = s.beatsPerBar; this.tiers = s.tiers;
    this.bar = s.bar; this.beat = s.beat; this.sub = s.sub; this.nextTime = s.nextTime; this.lastTime = s.lastTime;
    this.count = s.count; this.pendingPerBeat = s.pendingPerBeat; this.pendingBeatsPerBar = s.pendingBeatsPerBar;
    this.pendingTiers = s.pendingTiers;
  }
}
/* METRO-CLOCK:END */
class KinsClickProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'accentGain', defaultValue: 0.8, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'beatGain', defaultValue: 0.6, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'subGain', defaultValue: 0.4, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ];
  }

  constructor() {
    super();
    this.playing = false;
    this.clock = new MetroClock();
    this.soundId = null;
    this.sounds = {};
    this.buffers = new Map(); /* "<id>:<accent>:<tier>" -> Float32Array */
    this.cachedSampleRate = sampleRate;
    this.releaseFrames = Math.max(32, Math.round(WORKLET_RELEASE_SEC * sampleRate));
    /* Fixed voice pool: no allocation while rendering */
    this.voices = [];
    for (var i = 0; i < MAX_ACTIVE_VOICES; i++) {
      this.voices.push({ active: false, frame: 0, buf: null, role: 'beat', releaseFrame: -1, age: 0 });
    }
    this.voiceAge = 0;

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
        this.prewarm();
        break;
      case 'sound':
        if (typeof m.id === 'string') this.soundId = m.id;
        this.prewarm();
        break;
      case 'start':
        this.clock.reset(currentTime + WORKLET_START_OFFSET_SEC, {
          bpm: m.bpm, perBeat: m.perBeat, beatsPerBar: m.beatsPerBar, tiers: m.tiers
        });
        /* Fresh run: hard-drop voices still ringing from a previous run */
        for (var v = 0; v < this.voices.length; v++) this.voices[v].active = false;
        this.playing = true;
        break;
      case 'stop':
        this.playing = false;
        this.releaseVoices();
        break;
      case 'bpm':
        this.clock.setBpm(m.bpm, currentTime);
        break;
      case 'opts':
        if (typeof m.perBeat === 'number') this.clock.setPerBeat(m.perBeat);
        if (typeof m.beatsPerBar === 'number') this.clock.setMeter(m.beatsPerBar);
        break;
      case 'tiers':
        this.clock.setTiers(m.tiers);
        break;
      case 'preview':
        var previewSound = (m.soundId && this.sounds[m.soundId]) || this.currentSound();
        var previewTier = m.tier || 'mid';
        var previewAccent = previewTier === 'high';
        this.addVoice(Math.round(currentTime * sampleRate), this.getBuffer(previewSound, previewAccent, previewTier), previewAccent ? 'accent' : 'beat');
        break;
    }
  }

  currentSound() {
    return this.sounds[this.soundId] ||
      this.sounds[Object.keys(this.sounds)[0]] ||
      { id: 'click', type: 'square', freq: 1100, accentFreq: 1750, decay: 0.04, gain: 0.5 };
  }

  /* Render every buffer the current sound can need when the sound is
     chosen, never inside the process() call that must play the click. */
  prewarm() {
    var sound = this.currentSound();
    for (var i = 0; i < WORKLET_TIERS.length; i++) {
      this.getBuffer(sound, false, WORKLET_TIERS[i]);
    }
    this.getBuffer(sound, true, 'high');
  }

  addVoice(frame, buf, role) {
    var slot = null;
    var oldest = null;
    for (var i = 0; i < this.voices.length; i++) {
      var v = this.voices[i];
      if (!v.active) { slot = v; break; }
      if (!oldest || v.age < oldest.age) oldest = v;
    }
    /* Pool full: steal the oldest voice rather than dropping the click */
    if (!slot) slot = oldest;
    slot.active = true;
    slot.frame = frame;
    slot.buf = buf;
    slot.role = role;
    slot.releaseFrame = -1;
    slot.age = ++this.voiceAge;
  }

  releaseVoices() {
    var now = Math.round(currentTime * sampleRate);
    for (var i = 0; i < this.voices.length; i++) {
      var v = this.voices[i];
      if (v.active && v.releaseFrame < 0) v.releaseFrame = now;
    }
  }

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

    var attackSamples = Math.max(2, Math.round(0.0008 * sampleRate)); // 0.8ms smooth cosine attack ramp
    var fadeN = Math.min(n, Math.max(2, Math.round(0.002 * sampleRate))); // 2ms tail fade
    var decayRate = 7.5 / decay; // smoothly decays to -65dB at decay time

    var soundId = sound.id || 'click';
    var TWO_PI = 2 * Math.PI;
    var phase1 = 0;
    var phase2 = 0;

    for (var i = 0; i < n; i++) {
      var tSec = i / sampleRate;
      var instFreq = freq;
      var mixA = 1, mixB = 0, harmMul = 2;

      if (soundId === 'click' || soundId === 'classic-click') {
        instFreq = freq * (1 + 1.2 * Math.exp(-tSec / 0.0035));
        mixA = 0.75; mixB = 0.25; harmMul = 2;
      } else if (soundId === 'woodblock') {
        mixA = 0.78; mixB = 0.22; harmMul = 2.76;
      } else if (soundId === 'beep' || soundId === 'digital-beep') {
        mixA = 0.92; mixB = 0.08; harmMul = 2;
      } else if (soundId === 'rimshot' || soundId === 'rim-click') {
        instFreq = freq * (1 + 1.6 * Math.exp(-tSec / 0.002));
        mixA = 0.7; mixB = 0.3; harmMul = 1.62;
      } else if (soundId === 'cowbell') {
        mixA = 0.58; mixB = 0.42; harmMul = 1.45;
      } else if (soundId === 'voice-count') {
        mixA = 0.84; mixB = 0.16; harmMul = 1.98;
      } else if (soundId === 'tick') {
        instFreq = freq * (1 + 0.95 * Math.exp(-tSec / 0.0018));
        mixA = 0.70; mixB = 0.30; harmMul = 2;
      } else if (soundId === 'synth-pluck' || soundId === 'synthpluck') {
        instFreq = freq * (1 + 0.65 * Math.exp(-tSec / 0.006));
        mixA = 0.62; mixB = 0.38; harmMul = 2.5;
      } else if (soundId === 'bell') {
        mixA = 0.56; mixB = 0.44; harmMul = 2.76;
      } else if (soundId === 'claves') {
        mixA = 0.78; mixB = 0.22; harmMul = 1.91;
      } else if (soundId === 'kick') {
        instFreq = freq * (1 + 2.0 * Math.exp(-tSec / 0.018));
        mixA = 0.88; mixB = 0.12; harmMul = 1;
      } else if (soundId === 'hihat' || soundId === 'hi-hat') {
        mixA = 0.38; mixB = 0.62; harmMul = 1.52;
      }

      /* Dual independent phase accumulators prevent phase tearing across wraps */
      phase1 += (TWO_PI * instFreq) / sampleRate;
      if (phase1 >= TWO_PI) phase1 -= TWO_PI;
      phase2 += (TWO_PI * instFreq * harmMul) / sampleRate;
      if (phase2 >= TWO_PI) phase2 -= TWO_PI;
      var wave = mixA * Math.sin(phase1) + mixB * Math.sin(phase2);

      if (soundId !== 'click' && soundId !== 'classic-click' && soundId !== 'woodblock' && soundId !== 'beep' && soundId !== 'digital-beep' &&
          soundId !== 'rimshot' && soundId !== 'rim-click' && soundId !== 'cowbell' && soundId !== 'voice-count' && soundId !== 'tick' &&
          soundId !== 'synth-pluck' && soundId !== 'synthpluck' && soundId !== 'bell' && soundId !== 'claves' && soundId !== 'kick' &&
          soundId !== 'hihat' && soundId !== 'hi-hat') {
        if (sound.type === 'sine') wave = Math.sin(phase1);
        else if (sound.type === 'triangle') wave = (2 / Math.PI) * Math.asin(Math.sin(phase1));
        else wave = 0.8 * Math.sin(phase1) + 0.2 * Math.sin(phase2);
      }

      /* Continuous C1 envelope: attack seamlessly joins decay at 1.0 without step drop */
      var env = 0;
      if (i < attackSamples) {
        env = 0.5 * (1 - Math.cos((Math.PI * i) / attackSamples));
      } else {
        var tDecay = (i - attackSamples) / sampleRate;
        env = Math.exp(-decayRate * tDecay);
      }

      buf[i] = wave * peak * env;
    }

    for (var j = 0; j < fadeN; j++) {
      var fadeGain = 0.5 * (1 + Math.cos((Math.PI * j) / fadeN));
      buf[n - fadeN + j] *= fadeGain;
    }

    this.buffers.set(key, buf);
    return buf;
  }

  schedule() {
    var horizon = currentTime + (128 / sampleRate) * WORKLET_AHEAD_BLOCKS;
    var clock = this.clock;
    /* A context suspended mid-run resumes with the cursor in the past:
       skip the missed clicks while keeping bar phase, never burst them. */
    if (clock.nextTime < currentTime - 0.1) clock.skipTo(currentTime);
    var sound = this.currentSound();
    while (clock.nextTime < horizon) {
      var e = clock.next();
      if (e.tier !== 'mute') {
        var role = e.isAccent ? 'accent' : (e.isBeatStart ? 'beat' : 'sub');
        this.addVoice(Math.round(e.time * sampleRate), this.getBuffer(sound, e.isAccent, e.tier), role);
      }
      this.port.postMessage({
        type: 'beat',
        time: e.time,
        n: e.n,
        bar: e.bar,
        beatInBar: e.beatInBar,
        isAccent: e.isAccent,
        tier: e.tier,
        isBeatStart: e.isBeatStart
      });
    }
  }

  process(inputs, outputs, parameters) {
    var out = outputs[0][0];
    if (!out) return true;
    if (this.playing) this.schedule();
    out.fill(0);

    /* k-rate role gains: one value per 128-frame block */
    var accentG = parameters.accentGain ? parameters.accentGain[0] : 0.8;
    var beatG = parameters.beatGain ? parameters.beatGain[0] : 0.6;
    var subG = parameters.subGain ? parameters.subGain[0] : 0.4;
    var blockStart = Math.round(currentTime * sampleRate);
    var relN = this.releaseFrames;
    var any = false;

    for (var i = 0; i < this.voices.length; i++) {
      var a = this.voices[i];
      if (!a.active) continue;
      var offset = a.frame - blockStart;
      if (offset >= out.length) { any = true; continue; }
      var srcStart = offset < 0 ? -offset : 0;
      var dstStart = offset > 0 ? offset : 0;
      var n = Math.min(a.buf.length - srcStart, out.length - dstStart);
      if (n <= 0) { a.active = false; a.buf = null; continue; }
      any = true;
      var roleG = a.role === 'accent' ? accentG : (a.role === 'beat' ? beatG : subG);
      if (a.releaseFrame >= 0) {
        for (var j = 0; j < n; j++) {
          var df = blockStart + dstStart + j - a.releaseFrame;
          if (df >= relN) { a.active = false; break; }
          var g = df < 0 ? 1 : 1 - df / relN;
          out[dstStart + j] += a.buf[srcStart + j] * g * roleG;
        }
      } else {
        for (var k = 0; k < n; k++) out[dstStart + k] += a.buf[srcStart + k] * roleG;
      }
      if (srcStart + n >= a.buf.length) { a.active = false; }
      if (!a.active) a.buf = null;
    }

    if (any) {
      for (var s = 0; s < out.length; s++) {
        var val = out[s];
        if (val > WORKLET_LIMIT_KNEE || val < -WORKLET_LIMIT_KNEE) {
          var over = Math.abs(val) - WORKLET_LIMIT_KNEE;
          var shaped = WORKLET_LIMIT_KNEE + (1 - WORKLET_LIMIT_KNEE) * Math.tanh(over / (1 - WORKLET_LIMIT_KNEE));
          out[s] = val < 0 ? -shaped : shaped;
        }
      }
    }
    return true;
  }
}

registerProcessor('kins-click', KinsClickProcessor);
