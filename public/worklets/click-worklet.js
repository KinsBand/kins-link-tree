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
     { type:'start',  bpm, perBeat, beatsPerBar, accentFirst }
     { type:'stop' }
     { type:'bpm',    bpm }                       // takes effect next click
     { type:'opts',   perBeat?, beatsPerBar?, accentFirst? }
   Protocol (worklet -> main):
     { type:'beat', time, beatInBar, isAccent }   // time = audio-clock secs
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

class KinsClickProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.playing = false;
    this.bpm = 120;
    this.perBeat = 1;
    this.beatsPerBar = 4;
    this.accentFirst = true;
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
    this.buffers = new Map(); /* "<id>:<accent>" -> Float32Array */
    this.active = [];         /* [{frame, buf}] sorted implicitly by push order */
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
      { id: 'click', type: 'square', freq: 1050, accentFreq: 1700, decay: 0.045, gain: 0.5 };
  }

  /* Pre-render one click into a Float32Array: waveform x exponential decay,
     with a sub-millisecond attack ramp to avoid a DC-step pop. Matches the
     oscillator path's envelope shape (peak -> 0.001 over `decay`). */
  getBuffer(sound, accent) {
    var key = sound.id + ':' + (accent ? 1 : 0);
    var hit = this.buffers.get(key);
    if (hit) return hit;
    var freq = accent ? sound.accentFreq : sound.freq;
    var peak = Math.max(0.0001, sound.gain);
    var decay = Math.max(0.005, sound.decay);
    var totalSec = decay + WORKLET_TAIL_SEC;
    var n = Math.max(32, Math.ceil(totalSec * sampleRate));
    var buf = new Float32Array(n);
    var w = 2 * Math.PI * freq;
    var attackN = Math.max(1, Math.round(0.0005 * sampleRate));
    var lnRatio = Math.log(0.001 / peak);
    var fadeN = Math.max(1, Math.round(0.002 * sampleRate));
    for (var i = 0; i < n; i++) {
      var t = i / sampleRate;
      var ph = (w * t) % (2 * Math.PI);
      var wave;
      if (sound.type === 'sine') wave = Math.sin(ph);
      else if (sound.type === 'triangle') wave = 2 / Math.PI * Math.asin(Math.sin(ph));
      else wave = ph < Math.PI ? 1 : -1; /* square (Web Audio default duty) */
      var env;
      if (i < attackN) env = i / attackN;
      else if (t < decay) env = Math.exp(lnRatio * (t / decay));
      else env = 0.001;
      buf[i] = wave * peak * env;
    }
    /* 2ms fade-out on the very end to land at true zero */
    for (var j = 0; j < fadeN; j++) {
      buf[n - 1 - j] *= j / fadeN;
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
      var buf = this.getBuffer(this.currentSound(), isAccent);
      this.active.push({ frame: this.nextClickTime * sampleRate, buf: buf });
      this.scheduledTotal++;
      this.port.postMessage({
        type: 'beat',
        time: this.nextClickTime,
        n: this.scheduledTotal,
        beatInBar: beatInBar,
        isAccent: isAccent
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
    }
    return true; /* stay alive even while silent so start() is instant */
  }
}

registerProcessor('kins-click', KinsClickProcessor);
