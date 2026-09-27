import { METRO_GAIN, METRO_SOUNDS, METRO_TIMING } from '../../../settings/metronome.config';
import { getSound } from './metroState.js';
import { MetroClock } from './metroClock.js';

/* KINS Metronome click engine — two paths behind one API.

   WORKLET PATH (default where supported): an AudioWorkletProcessor runs
   the whole scheduler + synthesiser on the audio rendering thread. It is
   immune to ANY main-thread stall, so the click literally cannot stutter
   or skip because of GC/layout/JS work. Config travels via port messages
   (gains via AudioParam); beat events travel
   back for the visual queue. Pipeline enforces bounded headroom with
   oversampled soft-limiting.

   LEGACY PATH (fallback): the classic lookahead scheduler ("A Tale of
   Two Clocks") with a registry of every scheduled source, so tempo /
   subdivision / time-signature changes FLUSH unplayed clicks, rewind the
   clock to the first flushed click and re-schedule under the new config.

   Both paths track musical position with MetroClock (metroClock.js):
   explicit bar/beat/sub counters, phase-preserving tempo changes,
   subdivision changes on the next beat and meter changes on the next bar,
   so live edits never shift the grid or double a downbeat.

   Both paths share: rAF visual-beat drain locked to ctx.currentTime,
   accent haptics fired from the drain (never from drifted setTimeouts),
   and an 'interrupted' state bridge (iOS phone call / screen lock) that
   reports honestly and auto-resumes when the OS allows.

   Gain staging (spec § Gain Staging):
     Accent 0.80 (-1.94dB) | Beat 0.60 (-4.44dB) | Sub 0.40 (-7.96dB)
     Summed sub-mix 0.707 (-3.01dB) -> Compressor threshold -6dB 1ms attack
     50ms release -> WaveShaper tanh k=1.2 4x oversampled -> Master 0.90

   Zero-allocation: worklet synthesis pre-allocates 16-voice pool and PCM
   tables; legacy path reuses scheduled-source registry without per-tick
   churn beyond unavoidable oscillator allocation (fallback only).
*/
export function createMetroEngine() {
  let ctx = null;
  let masterGain = null;
  let softClipper = null;
  let hpFilter = null;

  /* Worklet path */
  let workletNode = null;
  let usingWorklet = false;

  /* Legacy path timers */
  let schedulerTimer = null;
  let uiRafId = null;
  let metroWorker = null;
  let workerAvailable = false;

  /* Scheduling cursor + bookkeeping (legacy owns these; worklet mirrors
     them internally) */
  const clock = new MetroClock(); /* legacy path position; worklet owns its own copy */
  let scheduledTotal = 0;/* all clicks scheduled since start */

  /* Run config captured per start/change so loops never read DOM or
     module state mid-run */
  let runPerBeat = 1;
  let runBeatsPerBar = 4;
  let runVibrate = false;
  let runBeatTiers = ['mid', 'mid', 'mid', 'mid'];

  /* Shared mutable ref owned by this module, updated by index.js */
  const runRef = { bpm: 120, playing: false };

  /* Visual events awaiting their audible moment: { time, beatInBar, isAccent, tier } */
  const visualQueue = [];
  let onVisualBeat = null;
  let onInterruption = null;

  /* Registry of scheduled-but-maybe-unplayed clicks (legacy only):
     enables instant cancel on stop/tempo change. `snap` is the clock state
     before the click was emitted, so a flush can rewind exactly. */
  const pendingSources = []; /* { osc, gain, time, snap } — osc null for muted beats */

  /* iOS-style interruption bridge */
  let interruptedPending = false;

  let backgroundSilenceEl = null;

  /* Scheduler health stats (?metrodebug=1 reads these) */
  let tickCount = 0;
  let lastTickDeltaMs = 0;
  let maxTickDeltaMs = 0;
  let lastTickPerf = 0;
  let firedBeats = 0;
  let masterRestoreTimeout = null;

  function safeCall(fn, arg) {
    if (!fn) return;
    try { fn(arg); } catch (e) {}
  }

  /* Equal-power subdivision attenuation: G_sub(N)=min(1, 1/sqrt(N)) */
  function getSubdivisionScale(N) {
    const n = Math.max(1, N);
    return Math.min(1.0, 1.0 / Math.sqrt(n));
  }

  /* Generate transparent soft-knee limiter curve:
     Linear pass-through (|x| <= knee) with zero harmonic distortion;
     smooth asymptotic tanh compression (|x| > knee) up to 1.0. */
  function generateSoftKneeCurve(samples, knee = 0.8) {
    const curve = new Float32Array(samples);
    const denom = samples - 1;
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / denom - 1;
      const absX = Math.abs(x);
      if (absX <= knee) {
        curve[i] = x;
      } else {
        const over = absX - knee;
        const shaped = knee + (1 - knee) * Math.tanh(over / (1 - knee));
        curve[i] = x < 0 ? -shaped : shaped;
      }
    }
    return curve;
  }

  function setupDynamicsPipeline() {
    // 0. DC Blocker HPF 30Hz — removes accumulated DC from summed tails
    try {
      hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.setValueAtTime(30, ctx.currentTime);
      hpFilter.Q.setValueAtTime(0.707, ctx.currentTime);
    } catch (e) {
      hpFilter = null;
    }
    // 1. Transparent 4x Oversampled Soft-Knee Peak Limiter (linear below 0.80)
    // Replaces the aggressive 1ms compressor which was crushing transients and causing distortion
    try {
      softClipper = ctx.createWaveShaper();
      softClipper.curve = generateSoftKneeCurve(1024, 0.8);
      softClipper.oversample = '4x';
    } catch (e) {
      softClipper = null;
    }
    // 2. Master Linear Gain 0.90 (-0.92 dBFS true peak safety)
    masterGain = ctx.createGain();
    try { masterGain.gain.setValueAtTime(METRO_GAIN.master, ctx.currentTime); } catch (e) { masterGain.gain.value = METRO_GAIN.master; }
  }

  function initMetroWorker() {
    if (metroWorker || workerAvailable) return;
    try {
      const url = METRO_TIMING.workerUrl || '/worklets/metro-worker.js';
      metroWorker = new Worker(url);
      metroWorker.onmessage = (e) => {
        if (e.data === 'tick') schedulerTick();
      };
      metroWorker.onerror = () => {
        try { metroWorker.terminate(); } catch (e2) {}
        metroWorker = null;
        workerAvailable = false;
        /* Worker died (404 offline / script error) AFTER ensureSchedulerTimer
           already took the worker branch — without this the legacy scheduler
           would silently lose its only clock and playback would go mute.
           Re-run the timer selection so the main-thread interval takes over. */
        if (runRef.playing && !usingWorklet) {
          ensureSchedulerTimer();
          schedulerTick();
        }
      };
      try { metroWorker.postMessage({ interval: METRO_TIMING.schedulerIntervalMs }); } catch (e) {}
      workerAvailable = true;
    } catch (e) {
      metroWorker = null;
      workerAvailable = false;
    }
  }

  let unlockHandler = null;
  function setupUnlockProtocol() {
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    const unlock = async () => {
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (e) {}
      }
      // CoreAudio hardware unlock priming buffer (1-sample silent)
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        // Also tickle master chain to ensure graph is hot
        if (masterGain) {
          const now = ctx.currentTime;
          // tiny inaudible blip to force hardware path open — will be masked
          try { masterGain.gain.setValueAtTime(masterGain.gain.value, now); } catch (e) {}
        }
      } catch (e) {}
      unlockEvents.forEach(evt => document.removeEventListener(evt, unlock, true));
    };
    unlockEvents.forEach(evt => document.addEventListener(evt, unlock, true));
    unlockHandler = { events: unlockEvents, fn: unlock };
    // Also attempt immediate resume if already gesture-unlocked
    if (ctx && ctx.state === 'suspended') {
      // No-op until gesture; handler will fire.
    }
  }

  function setupBackgroundSilence() {
    // Secondary silent HTML5 audio loop to keep iOS background audio session alive
    try {
      if (backgroundSilenceEl) return;
      const el = document.createElement('audio');
      el.loop = true;
      el.autoplay = false;
      el.muted = false;
      el.volume = 0.0;
      el.setAttribute('playsinline', '');
      // 1-sec silent WAV data URI (PCM 8k mono)
      el.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      el.style.display = 'none';
      document.body.appendChild(el);
      backgroundSilenceEl = el;
      // Play only when backgroundPlay is enabled and metronome is playing (managed in start/stop)
    } catch (e) {}
  }

  function playBackgroundSilence() {
    if (!backgroundSilenceEl) setupBackgroundSilence();
    if (backgroundSilenceEl) {
      try { const p = backgroundSilenceEl.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    }
  }
  function pauseBackgroundSilence() {
    if (backgroundSilenceEl) {
      try { backgroundSilenceEl.pause(); } catch (e) {}
    }
  }

  /* ---------- context bootstrap ---------- */

  async function ensureContext() {
    if (ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    /* Native device rate: forcing 48k makes 44.1k hardware resample */
    try { ctx = new AudioCtx({ latencyHint: 'interactive' }); } catch (e) { return false; }
    /* First run: start resuming synchronously, still inside the gesture,
       before the worklet module load yields */
    if (ctx.state === 'suspended') {
      try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    }

    setupDynamicsPipeline();
    attachStateHandler();
    setupUnlockProtocol();
    setupBackgroundSilence();
    initMetroWorker();

    // Wire: hpFilter -> softClipper -> masterGain -> destination
    try {
      if (hpFilter && softClipper) {
        hpFilter.connect(softClipper);
        softClipper.connect(masterGain);
      } else if (hpFilter) {
        hpFilter.connect(masterGain);
      } else if (softClipper) {
        softClipper.connect(masterGain);
      }
      masterGain.connect(ctx.destination);
    } catch (e) {
      try { masterGain.connect(ctx.destination); } catch (e2) {}
    }

    /* Prefer the AudioWorklet path; fall back silently to the hardened
       legacy scheduler if the module can't load (old browser, offline). */
    usingWorklet = false;
    if (ctx.audioWorklet) {
      try {
        await ctx.audioWorklet.addModule(METRO_TIMING.workletUrl);
        workletNode = new AudioWorkletNode(ctx, METRO_TIMING.workletName, {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [1]
        });
        {
          workletNode.port.onmessage = onWorkletMessage;
          /* Worklet path: connect DIRECTLY to masterGain, bypassing the
             HPF → Compressor → WaveShaper chain. The worklet already has
             its own tanh soft-limiter at 0.8 knee; the external compressor
             (-6dB threshold, 6:1 ratio, 1ms attack) was crushing transient
             punch and causing the muffled/distorted sound. The compression
             chain is kept wired for the legacy oscillator fallback path. */
          try {
            workletNode.connect(masterGain);
          } catch (e) { try { workletNode.connect(ctx.destination); } catch (e2) {} }
          // Send sound tables
          postToWorklet({
            type: 'sounds',
            sounds: METRO_SOUNDS.map((s) => ({
              id: s.id, type: s.type, freq: s.freq,
              accentFreq: s.accentFreq, decay: s.decay, gain: s.gain
            }))
          });
          try {
            if (workletNode.parameters.has('accentGain')) workletNode.parameters.get('accentGain').setValueAtTime(METRO_GAIN.accent, ctx.currentTime);
            if (workletNode.parameters.has('beatGain')) workletNode.parameters.get('beatGain').setValueAtTime(METRO_GAIN.beat, ctx.currentTime);
            if (workletNode.parameters.has('subGain')) workletNode.parameters.get('subGain').setValueAtTime(METRO_GAIN.sub, ctx.currentTime);
          } catch (e) {}
          usingWorklet = true;
        }
      } catch (e) {
        usingWorklet = false;
        workletNode = null;
        // Legacy path: oscillators feed hpFilter -> softClipper -> masterGain
      }
    }

    return true;
  }

  function postToWorklet(msg) {
    if (!workletNode) return;
    try { workletNode.port.postMessage(msg); } catch (e) {}
  }

  function onWorkletMessage(e) {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'beat') {
      if (visualQueue.length >= METRO_TIMING.maxVisualQueueLen) visualQueue.shift();
      visualQueue.push({ time: d.time, bar: d.bar, beatInBar: d.beatInBar, isAccent: !!d.isAccent, tier: d.tier || 'mid', isBeatStart: d.isBeatStart !== false,
        muted: !!d.muted, mutePhase: d.mutePhase || null, mutePhaseBar: d.mutePhaseBar || 0, mutePhaseLength: d.mutePhaseLength || 0 });
      scheduledTotal = d.n || scheduledTotal + 1;
    }
  }

  function attachStateHandler() {
    ctx.onstatechange = () => {
      const st = ctx.state;
      if (st === 'interrupted') {
        interruptedPending = runRef.playing;
        if (interruptedPending) safeCall(onInterruption, 'interrupted');
        try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
      } else if (st === 'running' && interruptedPending) {
        interruptedPending = false;
        safeCall(onInterruption, 'resumed');
      } else if (st === 'suspended') {
        if (runRef.playing) {
          // Attempt resume quickly
          try { ctx.resume(); } catch (e) {}
        }
      }
    };
    // Also listen for devicechange? Not needed
  }

  /* ---------- legacy path internals ---------- */

  function scheduleClick(time, isAccent, startsABeat, tier, snap) {
    const entry = { osc: null, gain: null, time, snap };
    pendingSources.push(entry);
    scheduledTotal++;
    if (tier === 'mute') return;
    const sound = getSound();
    let t = time;
    if (ctx && t <= ctx.currentTime) t = ctx.currentTime + 0.001;
    const tt = tier || 'mid';
    const ratio = tt === 'low' ? 0.75 : (tt === 'high' ? 1.5 : 1);
    const baseFreq = isAccent ? sound.accentFreq : sound.freq;
    const freq = baseFreq * ratio;
    let nominalGain;
    if (isAccent) nominalGain = METRO_GAIN.accent;
    else if (startsABeat) nominalGain = METRO_GAIN.beat;
    else nominalGain = METRO_GAIN.sub * getSubdivisionScale(runPerBeat);
    const peakGain = Math.max(METRO_GAIN.epsilon, Math.min(1, nominalGain * (Math.max(METRO_GAIN.epsilon, sound.gain) / 0.5)));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound.type === 'square' ? 'triangle' : sound.type;
    osc.frequency.setValueAtTime(freq, t);

    const epsilon = METRO_GAIN.epsilon;
    gain.gain.setValueAtTime(epsilon, t);
    gain.gain.exponentialRampToValueAtTime(peakGain, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(epsilon, t + sound.decay);
    osc.connect(gain);
    try {
      if (hpFilter) gain.connect(hpFilter);
      else if (softClipper) gain.connect(softClipper);
      else gain.connect(masterGain);
    } catch (e) { gain.connect(masterGain); }
    osc.start(t);
    osc.stop(t + sound.decay + 0.02);
    entry.osc = osc;
    entry.gain = gain;
  }

  function prunePending() {
    if (!ctx) return;
    const cutoff = ctx.currentTime - 0.2;
    while (pendingSources.length && pendingSources[0].time < cutoff) {
      pendingSources.shift();
    }
  }

  function cancelSource(entry, now) {
    if (!entry.osc) return;
    try {
      // De-click: cancelAndHold then 3ms exponential to epsilon
      try {
        entry.gain.gain.cancelAndHoldAtTime(now);
      } catch (e) {
        try { entry.gain.gain.cancelScheduledValues(now); } catch (e2) {}
      }
      const held = Math.max(0.0001, entry.gain.gain.value);
      entry.gain.gain.setValueAtTime(held, now);
      entry.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.003);
      entry.osc.stop(now + 0.005);
      entry.osc.onended = () => {
        try { entry.osc.disconnect(); entry.gain.disconnect(); } catch (e) {}
      };
    } catch (e) {}
  }

  /* Cancel every scheduled click later than now + guardSec and rewind the
     clock to the first one, so the caller's config change re-schedules
     from exactly that grid position. */
  function flushFrom(guardSec) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const cutoff = now + guardSec;
    let firstIdx = -1;
    for (let i = 0; i < pendingSources.length; i++) {
      if (pendingSources[i].time > cutoff) { firstIdx = i; break; }
    }
    if (firstIdx === -1) return;
    clock.restore(pendingSources[firstIdx].snap);
    scheduledTotal -= pendingSources.length - firstIdx;
    for (let i = firstIdx; i < pendingSources.length; i++) cancelSource(pendingSources[i], now);
    pendingSources.length = firstIdx;
    while (visualQueue.length && visualQueue[visualQueue.length - 1].time > cutoff) {
      visualQueue.pop();
    }
  }

  function schedulerTick() {
    if (!ctx || !runRef.playing || usingWorklet) return;
    if (ctx.state !== 'running') return;
    const pn = performance.now();
    lastTickDeltaMs = lastTickPerf ? pn - lastTickPerf : 0;
    if (lastTickDeltaMs > maxTickDeltaMs) maxTickDeltaMs = lastTickDeltaMs;
    lastTickPerf = pn;
    tickCount++;

    prunePending();
    const aheadSec = (typeof document !== 'undefined' && document.hidden)
      ? METRO_TIMING.hiddenScheduleAheadSec
      : METRO_TIMING.scheduleAheadSec;
    /* Behind the horizon (long tab freeze / OS suspension): skip the
       missed clicks with bar phase preserved instead of bursting them. */
    if (clock.nextTime < ctx.currentTime - METRO_TIMING.resyncGraceSec) {
      clock.skipTo(ctx.currentTime);
    }
    while (clock.nextTime < ctx.currentTime + aheadSec) {
      const snap = clock.snapshot();
      const e = clock.next();
      scheduleClick(e.time, e.isAccent, e.isBeatStart, e.muted ? 'mute' : e.tier, snap);
      visualQueue.push({ time: e.time, bar: e.bar, beatInBar: e.beatInBar, isAccent: e.isAccent, tier: e.tier, isBeatStart: e.isBeatStart,
        muted: e.muted, mutePhase: e.mutePhase, mutePhaseBar: e.mutePhaseBar, mutePhaseLength: e.mutePhaseLength });
    }
  }

  function ensureSchedulerTimer() {
    if (metroWorker && workerAvailable) {
      lastTickPerf = 0;
      try { metroWorker.postMessage('start'); } catch (e) {}
      return;
    }
    if (schedulerTimer === null) {
      lastTickPerf = 0;
      schedulerTimer = setInterval(schedulerTick, METRO_TIMING.schedulerIntervalMs);
    }
  }

  function clearSchedulerTimer() {
    if (metroWorker && workerAvailable) {
      try { metroWorker.postMessage('stop'); } catch (e) {}
    }
    if (schedulerTimer !== null) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  }

  /* ---------- visual sync (both paths) ---------- */

  function uiLoop() {
    drainVisualQueue();
    if (!runRef.playing) {
      uiRafId = null;
      return;
    }
    uiRafId = requestAnimationFrame(uiLoop);
  }

  function ensureUiLoop() {
    if (uiRafId === null) uiRafId = requestAnimationFrame(uiLoop);
  }

  function drainVisualQueue() {
    if (!ctx) return;
    const now = ctx.currentTime;
    let fired = 0;
    while (visualQueue.length && visualQueue[0].time <= now + METRO_TIMING.visualDrainLeadSec) {
      if (fired >= METRO_TIMING.maxVisualPerFrame) break;
      const evt = visualQueue.shift();
      if (evt.time < now - METRO_TIMING.staleVisualSec) continue;
      fired++;
      firedBeats++;
      safeCall(onVisualBeat, evt);
      if (evt.isAccent && runVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(12); } catch (e) {}
      }
    }
  }

  /* ---------- public API ---------- */

  async function start(opts) {
    /* Resume inside the user gesture, before any await: strict autoplay
       policies (iOS Safari) drop the activation once we yield. */
    if (ctx && ctx.state !== 'running') {
      try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    }
    const ok = await ensureContext();
    if (!ok) {
      const err = new Error('unsupported');
      err.code = 'unsupported';
      throw err;
    }

    runRef.bpm = opts.bpm;
    runPerBeat = opts.perBeat;
    runBeatsPerBar = opts.beatsPerBar;
    runVibrate = opts.vibrate;
    if (Array.isArray(opts.tiers)) runBeatTiers = [...opts.tiers];
    onVisualBeat = opts.onVisualBeat || null;
    onInterruption = opts.onInterruption || null;

    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (e) {}
      // Prime silent buffer synchronously within gesture stack if still suspended
      if (ctx.state === 'suspended') {
        try {
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
          await ctx.resume();
        } catch (e) {}
      }
    }
    if (ctx.state !== 'running') {
      const err = new Error('audio-blocked');
      err.code = 'blocked';
      throw err;
    }

    visualQueue.length = 0;
    scheduledTotal = 0;
    firedBeats = 0;
    tickCount = 0;
    lastTickDeltaMs = 0;
    maxTickDeltaMs = 0;
    interruptedPending = false;
    if (masterRestoreTimeout) { clearTimeout(masterRestoreTimeout); masterRestoreTimeout = null; }
    try {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(METRO_GAIN.master, ctx.currentTime);
    } catch (e) {}
    runRef.playing = true;
    // Background silence for iOS
    if (typeof document !== 'undefined' && runRef.playing) {
      try {
        const bgEnabled = (() => {
          try { return localStorage.getItem('kins-metro-backgroundPlay') === '1'; } catch (e) { return false; }
        })();
        if (bgEnabled) playBackgroundSilence();
      } catch (e) {}
    }

    if (usingWorklet && workletNode) {
      postToWorklet({ type: 'sound', id: getSound().id });
      postToWorklet({
        type: 'start',
        bpm: runRef.bpm,
        perBeat: runPerBeat,
        beatsPerBar: runBeatsPerBar,
        tiers: runBeatTiers
      });
      try {
        const now = ctx.currentTime;
        workletNode.parameters.get('accentGain').setValueAtTime(METRO_GAIN.accent, now);
        workletNode.parameters.get('beatGain').setValueAtTime(METRO_GAIN.beat, now);
        workletNode.parameters.get('subGain').setValueAtTime(METRO_GAIN.sub * getSubdivisionScale(runPerBeat), now);
      } catch (e) {}
    } else {
      pendingSources.length = 0;
      clock.reset(ctx.currentTime + METRO_TIMING.startOffsetSec, {
        bpm: runRef.bpm, perBeat: runPerBeat, beatsPerBar: runBeatsPerBar, tiers: runBeatTiers
      });
      ensureSchedulerTimer();
      schedulerTick();
    }
    ensureUiLoop();
  }

  function stop() {
    runRef.playing = false;
    interruptedPending = false;
    pauseBackgroundSilence();
    clearSchedulerTimer();
    if (usingWorklet && workletNode && ctx) {
      postToWorklet({ type: 'stop' });
    } else if (ctx) {
      /* Explicit stop: cancel every click that has not started yet */
      const now = ctx.currentTime;
      for (let i = 0; i < pendingSources.length; i++) {
        if (pendingSources[i].time > now) cancelSource(pendingSources[i], now);
      }
      pendingSources.length = 0;
    }
    if (ctx && masterGain) {
      try {
        const now = ctx.currentTime;
        const g = masterGain.gain;
        try { g.cancelAndHoldAtTime(now); } catch (e) { try { g.cancelScheduledValues(now); } catch (e2) {} }
        const held = Math.max(METRO_GAIN.epsilon, g.value);
        g.setValueAtTime(held, now);
        g.exponentialRampToValueAtTime(METRO_GAIN.epsilon, now + 0.003);
        if (masterRestoreTimeout) clearTimeout(masterRestoreTimeout);
        masterRestoreTimeout = setTimeout(() => {
          masterRestoreTimeout = null;
          if (!ctx) return;
          try {
            if (!runRef.playing) {
              g.cancelScheduledValues(ctx.currentTime);
              g.setValueAtTime(METRO_GAIN.master, ctx.currentTime);
            }
          } catch (e) {}
        }, 12);
      } catch (e) {
        try {
          masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.001);
          if (masterRestoreTimeout) clearTimeout(masterRestoreTimeout);
          masterRestoreTimeout = setTimeout(() => {
            masterRestoreTimeout = null;
            if (!ctx) return;
            try { masterGain.gain.setValueAtTime(METRO_GAIN.master, ctx.currentTime); } catch (e2) {}
          }, 12);
        } catch (e3) {}
      }
    }
    if (uiRafId !== null) {
      cancelAnimationFrame(uiRafId);
      uiRafId = null;
    }
    visualQueue.length = 0;
  }

  /* Live changes. Tempo is phase-preserving and immediate; subdivision
     lands on the next beat and meter on the next bar (MetroClock). */
  function updateBpm(bpm) {
    runRef.bpm = bpm;
    if (usingWorklet && workletNode) {
      postToWorklet({ type: 'bpm', bpm });
      return;
    }
    if (runRef.playing && ctx) {
      flushFrom(METRO_TIMING.changeGuardSec);
      clock.setBpm(bpm, ctx.currentTime);
      schedulerTick();
    }
  }

  function updateOptions(opts) {
    const msg = { type: 'opts' };
    if (typeof opts.perBeat === 'number') { runPerBeat = opts.perBeat; msg.perBeat = opts.perBeat; }
    if (typeof opts.beatsPerBar === 'number') { runBeatsPerBar = opts.beatsPerBar; msg.beatsPerBar = opts.beatsPerBar; }
    if (typeof opts.vibrate === 'boolean') runVibrate = opts.vibrate;
    if (msg.perBeat === undefined && msg.beatsPerBar === undefined) return;
    if (usingWorklet && workletNode) {
      if (msg.perBeat !== undefined) {
        try {
          workletNode.parameters.get('subGain').setValueAtTime(METRO_GAIN.sub * getSubdivisionScale(msg.perBeat), ctx.currentTime);
        } catch (e) {}
      }
      postToWorklet(msg);
      return;
    }
    if (runRef.playing && ctx) {
      flushFrom(METRO_TIMING.changeGuardSec);
      if (msg.perBeat !== undefined) clock.setPerBeat(msg.perBeat);
      if (msg.beatsPerBar !== undefined) clock.setMeter(msg.beatsPerBar);
      schedulerTick();
    }
  }

  function updateTiers(tiers) {
    if (Array.isArray(tiers)) runBeatTiers = [...tiers];
    if (usingWorklet) {
      postToWorklet({ type: 'tiers', tiers: runBeatTiers });
      return;
    }
    if (runRef.playing && ctx) {
      flushFrom(METRO_TIMING.changeGuardSec);
      clock.setTiers(runBeatTiers);
      schedulerTick();
    }
  }

  /* Coach "inner clock": alternating audible / muted bars rendered
     click-exactly by the clock (no volume ramps, so the first click of a
     muted bar never leaks and the first audible click is never faded).
     program = { audible, muted, random } bars, or null to end. */
  function setMuteProgram(program) {
    if (usingWorklet && workletNode) {
      postToWorklet({ type: 'muteProgram', program: program || null });
      return;
    }
    if (runRef.playing && ctx) {
      flushFrom(METRO_TIMING.changeGuardSec);
      clock.setMuteProgram(program || null);
      schedulerTick();
    }
  }

  async function previewClick(tierId, soundId) {
    if (tierId === 'mute') return;
    const sound = (soundId ? METRO_SOUNDS.find((s) => s.id === soundId) : null) || getSound();
    const ok = await ensureContext();
    if (!ok || !ctx) return;
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (e) {}
    }
    if (ctx.state !== 'running') return;

    // Use worklet directly when available for 100% identical clean sound synthesis
    if (usingWorklet && workletNode) {
      postToWorklet({ type: 'preview', soundId: sound.id, tier: tierId || 'mid' });
      return;
    }

    const t = tierId || 'mid';
    const ratio = t === 'low' ? 0.75 : (t === 'high' ? 1.5 : 1);
    const freq = sound.freq * ratio;
    const peakGain = Math.max(METRO_GAIN.epsilon, Math.min(0.6, 0.50 * (Math.max(METRO_GAIN.epsilon, sound.gain) / 0.5)));
    const time = ctx.currentTime + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound.type === 'square' ? 'triangle' : sound.type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(METRO_GAIN.epsilon, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(METRO_GAIN.epsilon, time + sound.decay);
    osc.connect(gain);
    try {
      if (hpFilter) gain.connect(hpFilter);
      else if (softClipper) gain.connect(softClipper);
      else gain.connect(masterGain);
    } catch (e) { gain.connect(masterGain); }
    osc.start(time);
    osc.stop(time + sound.decay + 0.02);
  }

  function updateSound(id) {
    if (usingWorklet) postToWorklet({ type: 'sound', id });
  }

  function setVolume(value) {
    if (!masterGain || !ctx) return;
    const target = Math.max(0.00001, Math.min(1, value * METRO_GAIN.master));
    try { masterGain.gain.setTargetAtTime(target, ctx.currentTime, 0.015); } catch (e) { try { masterGain.gain.value = target; } catch (e2) {} }
  }

  function suspend() {
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  function resume() {
    if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    }
  }

  /* Called after a tab returns to view or the OS ends an interruption.
     The audio clock is continuous, so the grid is never re-seated (that
     used to skip a beat and restart the bar): the worklet and the legacy
     scheduler both skip missed clicks with bar phase preserved. Only
     visual events that went stale while hidden are dropped. */
  function sync() {
    if (!ctx || !runRef.playing) return;
    if (!usingWorklet) schedulerTick();
    while (visualQueue.length && visualQueue[0].time < ctx.currentTime - METRO_TIMING.staleVisualSec) {
      visualQueue.shift();
    }
  }

  function getDebugState() {
    return {
      mode: usingWorklet ? 'worklet' : 'legacy',
      ctxState: ctx ? ctx.state : 'none',
      playing: runRef.playing,
      bpm: runRef.bpm,
      pendingSources: usingWorklet ? -1 : pendingSources.length,
      visualQueued: visualQueue.length,
      nextClickInMs: (!usingWorklet && ctx && runRef.playing && clock.nextTime > ctx.currentTime)
        ? Math.round((clock.nextTime - ctx.currentTime) * 1000)
        : -1,
      ticks: tickCount,
      lastTickDeltaMs: Math.round(lastTickDeltaMs),
      maxTickDeltaMs: Math.round(maxTickDeltaMs),
      scheduledTotal,
      firedBeats
    };
  }

  /* Full teardown — releases every hardware/system resource this engine
     owns. Browsers cap live AudioContexts (~6); without closing the ctx,
     repeated init/teardown cycles eventually make `new AudioContext()`
     throw and the metronome dies permanently. */
  function destroy() {
    try { stop(); } catch (e) {}
    if (metroWorker) {
      try { metroWorker.terminate(); } catch (e) {}
      metroWorker = null;
    }
    workerAvailable = false;
    if (masterRestoreTimeout) {
      clearTimeout(masterRestoreTimeout);
      masterRestoreTimeout = null;
    }
    if (unlockHandler) {
      try {
        unlockHandler.events.forEach((evt) => document.removeEventListener(evt, unlockHandler.fn, true));
      } catch (e) {}
      unlockHandler = null;
    }
    if (backgroundSilenceEl) {
      try { backgroundSilenceEl.pause(); } catch (e) {}
      try { backgroundSilenceEl.removeAttribute('src'); } catch (e) {}
      try { backgroundSilenceEl.remove(); } catch (e) {}
      backgroundSilenceEl = null;
    }
    if (ctx && ctx.state !== 'closed') {
      try {
        const p = ctx.close();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
    }
    ctx = null;
    masterGain = null;
    softClipper = null;
    hpFilter = null;
    workletNode = null;
    usingWorklet = false;
    pendingSources.length = 0;
    visualQueue.length = 0;
  }

  return {
    start,
    stop,
    updateBpm,
    updateOptions,
    updateTiers,
    setMuteProgram,
    previewClick,
    updateSound,
    setVolume,
    suspend,
    resume,
    sync,
    destroy,
    getDebugState,
    get playing() { return runRef.playing; },
    get mode() { return usingWorklet ? 'worklet' : 'legacy'; }
  };
}
