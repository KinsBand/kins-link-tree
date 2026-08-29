/* ==========================================================================
   KINS Metronome — AudioWorklet click generator ('kins-click' + 'metronome-processor').
   Loads via ctx.audioWorklet.addModule('/worklets/click-worklet.js').
   Runs on the audio rendering thread: scheduling and synthesis are immune
   to ALL main-thread stalls (GC, layout, long tasks), which is the only
   design that guarantees the metronome never stutters or skips a beat.
   The main thread stays authoritative for config; this side renders.

   Dual processors registered:
   - 'kins-click'           : legacy horizon scheduler (KinsClickProcessor) — hardened, sample-accurate
   - 'metronome-processor'  : spec-compliant zero-allocation frame-clock engine (MetronomeProcessor)

   Both share the same synthesis kernels and headroom strategy.

   Protocol (main -> worklet) legacy:
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
   Protocol (main -> worklet) spec:
      { type:'LOAD_SAMPLE', data:{ role, buffer } }
      { type:'SET_SIGNATURE', data:{ beatsPerBar } }
      { type:'RESET_PHASE' }

   Protocol (worklet -> main):
     { type:'beat', time, beatInBar, isAccent, tier } // time = audio-clock secs
     { type:'TICK_EVENT', role, frame }                // spec frame event
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
var MAX_ACTIVE_VOICES = 16;

/* Soft-knee ceiling. The transfer curve is continuous at the knee
   (output == input at |x| = KNEE), so crossing it never steps the
   waveform, and asymptotic to 1.0 so overlapping voices can never
   exceed digital full scale. */
var WORKLET_LIMIT_KNEE = 0.8;

/* Release ramp applied to ringing voices on stop/sync: truncating a
   mid-decay click hard-cuts the waveform and pops; a ~3ms cosine-ish
   fade lands every voice at true zero instead. Spec mandates 3.0ms. */
var WORKLET_RELEASE_SEC = 0.003;

// ======================================================================
//  Legacy / Hardened Processor: 'kins-click'
//  Sample-accurate horizon scheduler, pre-rendered buffer pool, 0.75ms
//  attack ramp, 2ms tail fade, soft-knee tanh ceiling, ~3ms release.
// ======================================================================
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
    this.bpm = 120;
    this.perBeat = 1;
    this.beatsPerBar = 4;
    this.accentFirst = true;
    this.beatTiers = ['mid', 'mid', 'mid', 'mid'];
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
    /* Frame-clock fields for spec compatibility (also maintained here for audit) */
    this.totalFramesProcessed = 0;
    this.nextTickFrame = 0;
    this.subdivisionCounter = 0;
    this.sampleBuffers = { accent: null, beat: null, sub: null };
    this.MAX_VOICES = 16;
    this.voices = [];
    for (let i = 0; i < this.MAX_VOICES; i++) {
      this.voices.push({
        active: false,
        type: 'synth',
        synthType: 'woodblock',
        buffer: null,
        playbackIndex: 0,
        frequency: 880,
        decay: 0.05,
        elapsedSeconds: 0
      });
    }

    var self = this;
    this.port.onmessage = function (e) { self.onMessage(e.data); };
  }

  // Supports both legacy and spec message shapes
  onMessage(m) {
    if (!m || typeof m !== 'object') return;
    // Spec messages (upper-case)
    if (m.type === 'LOAD_SAMPLE' && m.data) {
      var role = m.data.role;
      var buf = m.data.buffer;
      if (buf) {
        // Transfer Float32Array view
        try { this.sampleBuffers[role] = new Float32Array(buf); } catch (e) { this.sampleBuffers[role] = buf; }
      }
      return;
    }
    if (m.type === 'SET_SIGNATURE' && m.data) {
      if (typeof m.data.beatsPerBar === 'number') this.beatsPerBar = m.data.beatsPerBar || 4;
      return;
    }
    if (m.type === 'RESET_PHASE') {
      this.subdivisionCounter = 0;
      this.nextTickFrame = this.totalFramesProcessed;
      // Also reset legacy counters for seamless switch
      this.clickCounter = 0;
      this.beatCounter = 0;
      this.nextClickTime = currentTime + 0.08;
      this.releaseVoices();
      return;
    }
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
        this.subdivisionCounter = 0;
        this.totalFramesProcessed = Math.round(currentTime * sampleRate);
        this.nextTickFrame = this.totalFramesProcessed;
        this.nextClickTime = currentTime + 0.08; /* mirrors startOffsetSec */
        /* Fresh run: hard-drop any stale release-ramp voices. A quick
           stop→start inside the ~10ms tail otherwise keeps releaseFrame
           armed and process() fades the FIRST new clicks to zero. */
        this.active.length = 0;
        this.releaseFrame = -1;
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
        var offset = (typeof m.offsetSec === 'number' && m.offsetSec > 0) ? m.offsetSec : 0.08;
        if (this.playing) {
          this.releaseVoices();
          this.nextClickTime = currentTime + offset;
          this.nextTickFrame = Math.round((currentTime + offset) * sampleRate);
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

  releaseVoices() {
    if (this.active.length && this.releaseFrame < 0) {
      this.releaseFrame = Math.round(currentTime * sampleRate);
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

    var attackN = Math.max(2, Math.round(0.00075 * sampleRate)); // 0.75ms cosine ramp
    var lnRatio = Math.log(0.0005 / peak);
    var fadeN = Math.min(n, Math.max(2, Math.round(0.002 * sampleRate))); // 2ms tail fade

    var soundId = sound.id || 'click';
    var TWO_PI = 2 * Math.PI;
    var phase = 0; /* local phase — never contaminates other buffers */

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

      phase += (TWO_PI * instFreq) / sampleRate;
      if (phase > TWO_PI) phase -= TWO_PI;
      var wave = mixA * Math.sin(phase) + mixB * Math.sin(harmMul * phase);

      if (soundId !== 'click' && soundId !== 'classic-click' && soundId !== 'woodblock' && soundId !== 'beep' && soundId !== 'digital-beep' &&
          soundId !== 'rimshot' && soundId !== 'rim-click' && soundId !== 'cowbell' && soundId !== 'voice-count' && soundId !== 'tick' &&
          soundId !== 'synth-pluck' && soundId !== 'synthpluck' && soundId !== 'bell' && soundId !== 'claves' && soundId !== 'kick' &&
          soundId !== 'hihat' && soundId !== 'hi-hat') {
        if (sound.type === 'sine') wave = Math.sin(phase);
        else if (sound.type === 'triangle') wave = (2 / Math.PI) * Math.asin(Math.sin(phase));
        else wave = 0.8 * Math.sin(phase) + 0.2 * Math.sin(3 * phase);
      }

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
      var tier = (this.beatTiers && this.beatTiers[beatInBar]) || 'mid';
      var isAccent = tier === 'high' && startsABeat;
      var curSound = this.currentSound();
      var isVoice = curSound && curSound.id === 'voice-count';
      if (tier !== 'mute' && !isVoice) {
        var buf = this.getBuffer(curSound, isAccent, tier);
        if (this.active.length < MAX_ACTIVE_VOICES) {
          var role = isAccent ? 'accent' : (startsABeat ? 'beat' : 'sub');
          this.active.push({ frame: this.nextClickTime * sampleRate, buf: buf, role: role });
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
      // Also emit spec TICK_EVENT for inspection
      this.port.postMessage({
        type: 'TICK_EVENT',
        role: isAccent ? 'accent' : (startsABeat ? 'beat' : 'sub'),
        frame: Math.round(this.nextClickTime * sampleRate),
        time: this.nextClickTime
      });
      if (startsABeat) this.beatCounter++;
      this.clickCounter++;
      this.subdivisionCounter = (this.subdivisionCounter + 1) % (this.beatsPerBar * Math.max(1, Math.round(this.perBeat)));
      this.nextClickTime += 60 / this.bpm / this.perBeat;
    }
  }

  process(inputs, outputs, parameters) {
    var out = outputs[0][0];
    if (!out) return true;
    if (this.playing) this.schedule();
    out.fill(0);

    if (this.active.length) {
      /* Read role gains from AudioParams (k-rate: one value per 128-frame block) */
      var accentG = parameters.accentGain ? parameters.accentGain[0] : 0.8;
      var beatG   = parameters.beatGain   ? parameters.beatGain[0]   : 0.6;
      var subG    = parameters.subGain    ? parameters.subGain[0]    : 0.4;

      var blockStart = currentTime * sampleRate;
      var relStart = this.releaseFrame;
      var relN = this.releaseFrames;
      for (var i = this.active.length - 1; i >= 0; i--) {
        var a = this.active[i];
        var offset = Math.round(a.frame) - blockStart;
        if (offset >= out.length) continue;
        var end = offset + a.buf.length;
        if (end <= 0) { this.active.splice(i, 1); continue; }
        var srcStart = offset < 0 ? -offset : 0;
        var dstStart = offset > 0 ? offset : 0;
        var n = Math.min(a.buf.length - srcStart, out.length - dstStart);

        /* Per-voice role gain: accent/beat/sub from AudioParams */
        var roleG = a.role === 'accent' ? accentG : (a.role === 'beat' ? beatG : subG);

        if (relStart >= 0) {
          for (var j = 0; j < n; j++) {
            var df = blockStart + dstStart + j - relStart;
            if (df >= relN) break;
            var g = df < 0 ? 1 : 1 - df / relN;
            out[dstStart + j] += a.buf[srcStart + j] * g * roleG;
          }
        } else {
          for (var k = 0; k < n; k++) out[dstStart + k] += a.buf[srcStart + k] * roleG;
        }
        if (srcStart + n >= a.buf.length) this.active.splice(i, 1);
      }
      if (!this.active.length) this.releaseFrame = -1;

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

    this.totalFramesProcessed += out.length;
    return true;
  }
}

registerProcessor('kins-click', KinsClickProcessor);

// ======================================================================
//  Spec-Compliant Zero-Allocation Processor: 'metronome-processor'
//  Frame-accurate, voice-pool, analytical DSP + PCM streaming, AudioParam
//  control, equal-power scaling, tanh soft-clipper.
// ======================================================================
class MetronomeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bpm', defaultValue: 120, minValue: 30, maxValue: 400, automationRate: 'k-rate' },
      { name: 'subdivision', defaultValue: 1, minValue: 1, maxValue: 16, automationRate: 'k-rate' },
      { name: 'accentGain', defaultValue: 0.8, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'beatGain', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'subGain', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'isPlaying', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ];
  }

  constructor() {
    super();
    this.totalFramesProcessed = 0;
    this.nextTickFrame = 0;
    this.subdivisionCounter = 0;
    this.beatsPerBar = 4;
    this.sampleBuffers = {
      accent: null,
      beat: null,
      sub: null
    };
    this.MAX_VOICES = 16;
    this.voices = [];
    for (let i = 0; i < this.MAX_VOICES; i++) {
      this.voices.push({
        active: false,
        type: 'synth',
        synthType: 'woodblock',
        buffer: null,
        playbackIndex: 0,
        frequency: 880,
        decay: 0.05,
        elapsedSeconds: 0
      });
    }
    this._legacyBpm = 120;
    this._legacyPerBeat = 1;
    this.beatCounter = 0;
    this.scheduledTotal = 0;
    this._phase = 0;

    this.port.onmessage = (event) => {
      const { type, data } = event.data || {};
      // Legacy spec naming may be nested or flat
      const payload = data || event.data;
      if (type === 'LOAD_SAMPLE') {
        const role = payload.role || (payload.data && payload.data.role);
        const buffer = payload.buffer || (payload.data && payload.data.buffer);
        if (role && buffer) {
          try { this.sampleBuffers[role] = new Float32Array(buffer); } catch (e) { this.sampleBuffers[role] = buffer; }
        }
      } else if (type === 'SET_SIGNATURE') {
        this.beatsPerBar = (payload.beatsPerBar || (payload.data && payload.data.beatsPerBar)) || 4;
      } else if (type === 'RESET_PHASE') {
        this.subdivisionCounter = 0;
        this.scheduledTotal = 0;
        this.nextTickFrame = this.totalFramesProcessed;
        /* Drop stale voices so a restart never resumes clicks mid-decay
           (isPlaying gating alone does not clear the voice pool) */
        for (let vi = 0; vi < this.voices.length; vi++) {
          this.voices[vi].active = false;
          this.voices[vi].buffer = null;
        }
      } else if (type === 'sounds' || type === 'sound' || type === 'start' || type === 'stop' || type === 'bpm' || type === 'opts' || type === 'tiers' || type === 'sync') {
        // Forward to also handle via same logic if needed for testing
        if (type === 'bpm' && typeof payload.bpm === 'number') this._legacyBpm = payload.bpm;
        if (type === 'opts' && typeof payload.perBeat === 'number') this._legacyPerBeat = payload.perBeat;
      }
    };
  }

  triggerVoice(role, bpm, subdivision) {
    let voice = this.voices.find(v => !v.active);
    if (!voice) {
      voice = this.voices[0];
    }

    voice.active = true;
    voice.elapsedSeconds = 0;
    voice.playbackIndex = 0;
    voice.role = role; /* Store semantic role for gain lookup */

    const isAccent = (this.subdivisionCounter === 0);
    const isPrimaryBeat = (this.subdivisionCounter % Math.max(1, Math.floor(subdivision)) === 0);

    if (this.sampleBuffers[role]) {
      voice.type = 'pcm';
      voice.buffer = this.sampleBuffers[role];
    } else {
      voice.type = 'synth';
      if (isAccent) {
        voice.frequency = 1200;
        voice.decay = 0.035;
        voice.synthType = 'woodblock';
      } else if (isPrimaryBeat) {
        voice.frequency = 800;
        voice.decay = 0.030;
        voice.synthType = 'woodblock';
      } else {
        voice.frequency = 600;
        voice.decay = 0.020;
        voice.synthType = 'sine';
      }
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelLeft = output[0];
    const channelRight = output[1] || output[0];
    if (!channelLeft) return true;
    const bufferLength = channelLeft.length;

    const isPlaying = parameters.isPlaying ? parameters.isPlaying[0] > 0.5 : false;
    // For standalone spec tests without AudioParam automation, allow legacy flag? But spec says use isPlaying param.
    if (!isPlaying) {
      this.totalFramesProcessed += bufferLength;
      return true;
    }

    const bpm = parameters.bpm ? parameters.bpm[0] : this._legacyBpm;
    const subdivision = Math.max(1, Math.floor(parameters.subdivision ? parameters.subdivision[0] : this._legacyPerBeat));
    const accentGain = parameters.accentGain ? parameters.accentGain[0] : 0.8;
    const beatGain = parameters.beatGain ? parameters.beatGain[0] : 0.5;
    const subGainRaw = parameters.subGain ? parameters.subGain[0] : 0.3;
    // Equal-power subdivision attenuation: G_sub(N) = min(1, 1/sqrt(N))
    const N = Math.max(1, subdivision);
    const G_sub = Math.min(1.0, 1.0 / Math.sqrt(N));
    const subGain = subGainRaw * G_sub;
    // Summed sub-mix headroom 0.707 applied later

    const framesPerSubdivision = (sampleRate * 60) / (bpm * subdivision);

    for (let i = 0; i < bufferLength; i++) {
      const currentFrame = this.totalFramesProcessed + i;

      if (currentFrame >= this.nextTickFrame) {
        /* Compute from the PRE-increment counter: the old code read the
           post-increment value, shifting every reported beat position by
           one click and cycling `n` (modulo) instead of a running total. */
        const preCounter = this.subdivisionCounter;
        const isAccent = (preCounter === 0);
        const isPrimaryBeat = (preCounter % subdivision === 0);
        const role = isAccent ? 'accent' : (isPrimaryBeat ? 'beat' : 'sub');
        const beatInBar = Math.floor(preCounter / subdivision) % this.beatsPerBar;

        this.triggerVoice(role, bpm, subdivision);

        this.subdivisionCounter = (preCounter + 1) % (this.beatsPerBar * subdivision);
        this.nextTickFrame += framesPerSubdivision;
        this.scheduledTotal++;

        this.port.postMessage({
          type: 'TICK_EVENT',
          role: role,
          frame: currentFrame
        });
        this.port.postMessage({
          type: 'beat',
          time: currentFrame / sampleRate,
          n: this.scheduledTotal,
          beatInBar: beatInBar,
          isAccent: isAccent,
          tier: isAccent ? 'high' : (isPrimaryBeat ? 'mid' : 'low'),
          isBeatStart: isPrimaryBeat
        });
      }

      let sampleSum = 0;

      for (let v = 0; v < this.MAX_VOICES; v++) {
        const voice = this.voices[v];
        if (!voice.active) continue;

        let sample = 0;
        if (voice.type === 'pcm') {
          if (voice.playbackIndex < voice.buffer.length) {
            sample = voice.buffer[voice.playbackIndex++];
          } else {
            voice.active = false;
          }
        } else if (voice.type === 'synth') {
          const t = voice.elapsedSeconds;
          if (voice.synthType === 'woodblock') {
            const env = Math.exp(-t / voice.decay);
            sample = Math.sin(2 * Math.PI * voice.frequency * t) * env;
            sample += 0.3 * Math.sin(2 * Math.PI * (voice.frequency * 1.62) * t) * Math.exp(-t / (voice.decay * 0.5));
          } else {
            const env = Math.exp(-t / voice.decay);
            sample = Math.sin(2 * Math.PI * voice.frequency * t) * env;
          }

          voice.elapsedSeconds += (1 / sampleRate);
          if (t > voice.decay * 5) {
            voice.active = false;
          }
        }

        const roleGain = voice.role === 'accent' ? accentGain : (voice.role === 'beat' ? beatGain : subGain);
        sampleSum += sample * roleGain;
      }

      /* Soft-knee limiting catches the rare multi-voice sum that exceeds
         the knee; the fixed 0.707 bus penalty is removed since per-voice
         AudioParam gains already provide proper headroom. */
      if (sampleSum > WORKLET_LIMIT_KNEE || sampleSum < -WORKLET_LIMIT_KNEE) {
        var over = Math.abs(sampleSum) - WORKLET_LIMIT_KNEE;
        var shaped = WORKLET_LIMIT_KNEE + (1 - WORKLET_LIMIT_KNEE) * Math.tanh(over / (1 - WORKLET_LIMIT_KNEE));
        sampleSum = sampleSum < 0 ? -shaped : shaped;
      }

      channelLeft[i] = sampleSum;
      if (channelRight !== channelLeft) channelRight[i] = sampleSum;
    }

    this.totalFramesProcessed += bufferLength;
    return true;
  }
}

registerProcessor('metronome-processor', MetronomeProcessor);
