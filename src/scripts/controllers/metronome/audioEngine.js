import { METRO_SOUNDS, METRO_TIMING } from '../../../settings/metronome.config';
import { getSound } from './metroState.js';

/* KINS Metronome click engine — two paths behind one API.

   WORKLET PATH (default where supported): an AudioWorkletProcessor runs
   the whole scheduler + synthesiser on the audio rendering thread. It is
   immune to ANY main-thread stall, so the click literally cannot stutter
   or skip because of GC/layout/JS work. Config travels via AudioParam
   (bpm/subdivision/gains/isPlaying) + port messages; beat events travel
   back for the visual queue. Pipeline enforces bounded headroom with
   oversampled soft-limiting.

   LEGACY PATH (fallback): the classic lookahead scheduler ("A Tale of
   Two Clocks") hardened beyond the original version — 0.3s lookahead,
   a registry of every scheduled source so tempo/subdivision/time-signature
   changes FLUSH unplayed clicks and land immediately (instead of up to a
   full lookahead later), explicit stop cancellation (no ghost beat), and
   scheduling gated on ctx.state === 'running'.

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
  let compressor = null;
  let softClipper = null;

  /* Worklet path */
  let workletNode = null;
  let usingWorklet = false;

  /* Legacy path timers */
  let schedulerTimer = null;
  let uiRafId = null;

  /* Scheduling cursor + bookkeeping (legacy owns these; worklet mirrors
     them internally) */
  let nextClickTime = 0;
  let clickCounter = 0;
  let beatCounter = 0;   /* downbeats scheduled since start — bar position */
  let scheduledTotal = 0;/* all clicks scheduled since start */

  /* Run config captured per start/change so loops never read DOM or
     module state mid-run */
  let runPerBeat = 1;
  let runBeatsPerBar = 4;
  let runAccentFirst = false;
  let runVibrate = false;
  let runBeatTiers = ['mid', 'mid', 'mid', 'mid'];

  /* Shared mutable ref owned by this module, updated by index.js */
  const runRef = { bpm: 120, playing: false };

  /* Visual events awaiting their audible moment: { time, beatInBar, isAccent, tier } */
  const visualQueue = [];
  let onVisualBeat = null;
  let onInterruption = null;

  /* Registry of scheduled-but-maybe-unplayed clicks (legacy only):
     enables instant cancel on stop/tempo change */
  const pendingSources = []; /* { osc, gain, time, startsABeat } */

  /* iOS-style interruption bridge */
  let interruptedPending = false;

  /* Hardware adaptation */
  let hardwareSampleRate = 48000;
  let backgroundSilenceEl = null;

  /* Scheduler health stats (?metrodebug=1 reads these) */
  let tickCount = 0;
  let lastTickDeltaMs = 0;
  let maxTickDeltaMs = 0;
  let lastTickPerf = 0;
  let firedBeats = 0;

  function safeCall(fn, arg) {
    if (!fn) return;
    try { fn(arg); } catch (e) {}
  }

  /* Equal-power subdivision attenuation: G_sub(N)=min(1, 1/sqrt(N)) */
  function getSubdivisionScale(N) {
    const n = Math.max(1, N);
    return Math.min(1.0, 1.0 / Math.sqrt(n));
  }

  /* Generate tanh soft-clipper curve k=1.2 per spec */
  function generateTanhCurve(samples, k = 1.2) {
    const curve = new Float32Array(samples);
    const tanhK = Math.tanh(k);
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(k * x) / tanhK;
    }
    return curve;
  }

  function setupDynamicsPipeline() {
    // 1. Fast-Attack Dynamics Compressor for Macro Leveling (-6dB, 1ms attack, 50ms release)
    compressor = ctx.createDynamicsCompressor();
    try {
      compressor.threshold.setValueAtTime(-6.0, ctx.currentTime);
      compressor.knee.setValueAtTime(3.0, ctx.currentTime);
      compressor.ratio.setValueAtTime(6.0, ctx.currentTime);
      compressor.attack.setValueAtTime(0.001, ctx.currentTime);
      compressor.release.setValueAtTime(0.05, ctx.currentTime);
    } catch (e) {}
    // 2. 4x Oversampled Hyperbolic Tangent Soft Clipper knee -1.5dBFS
    try {
      softClipper = ctx.createWaveShaper();
      softClipper.curve = generateTanhCurve(1024, 1.2);
      softClipper.oversample = '4x';
    } catch (e) {
      softClipper = null;
    }
    // 3. Master Linear Gain 0.90 (-0.92 dBFS true peak safety)
    masterGain = ctx.createGain();
    try { masterGain.gain.setValueAtTime(0.90, ctx.currentTime); } catch (e) { masterGain.gain.value = 0.90; }

    // Wire: worklet/osc -> compressor -> softClipper -> masterGain -> destination
    // Legacy oscs connect to compressor input; worklet connects there too.
    // We keep a separate inputGain for legacy if needed, but connect logic is below.
  }

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

  function handleHardwareAdaptation() {
    // Monitor sampleRate divergence (Bluetooth A2DP 48k -> 44.1k etc.)
    // WebKit on iOS does not resample worklet graphs; we must rebuild context.
    try {
      const currentRate = ctx ? ctx.sampleRate : hardwareSampleRate;
      if (currentRate !== hardwareSampleRate) {
        // Divergence detected — teardown and rebuild on next start
        // If currently playing, attempt immediate recovery within 250ms
        if (runRef.playing) {
          const saved = { bpm: runRef.bpm, perBeat: runPerBeat, beatsPerBar: runBeatsPerBar, accentFirst: runAccentFirst, tiers: [...runBeatTiers] };
          const wasPlaying = true;
          // Teardown invalid context
          try { if (workletNode) workletNode.disconnect(); } catch (e) {}
          try { if (compressor) compressor.disconnect(); } catch (e) {}
          try { if (softClipper) softClipper.disconnect(); } catch (e) {}
          try { if (masterGain) masterGain.disconnect(); } catch (e) {}
          try { ctx.close(); } catch (e) {}
          ctx = null;
          masterGain = null;
          compressor = null;
          softClipper = null;
          workletNode = null;
          usingWorklet = false;
          hardwareSampleRate = currentRate;
          // Re-instantiate quickly
          ensureContext().then(() => {
            if (wasPlaying && ctx) {
              // Reload sample tables is not needed (synth only), re-post config
              if (usingWorklet) {
                postToWorklet({ type: 'sounds', sounds: METRO_SOUNDS.map(s => ({ id: s.id, type: s.type, freq: s.freq, accentFreq: s.accentFreq, decay: s.decay, gain: s.gain })) });
                postToWorklet({ type: 'sound', id: getSound().id });
                postToWorklet({ type: 'start', bpm: saved.bpm, perBeat: saved.perBeat, beatsPerBar: saved.beatsPerBar, accentFirst: saved.accentFirst, tiers: saved.tiers });
                try {
                  const isPlaying = workletNode.parameters.get('isPlaying');
                  isPlaying.setValueAtTime(1, ctx.currentTime);
                } catch (e) {}
              } else {
                nextClickTime = ctx.currentTime + METRO_TIMING.startOffsetSec;
                ensureSchedulerTimer();
                schedulerTick();
              }
            }
          });
        }
      }
    } catch (e) {}
  }

  /* Voice-count helper: speaks beat number 1..beatsPerBar with tier-adjusted pitch */
  function speakVoiceCount(beatInBar, tier, isAccent) {
    if (tier === 'mute') return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      const count = ((beatInBar % runBeatsPerBar) + runBeatsPerBar) % runBeatsPerBar + 1;
      const text = String(count);
      const utt = new SpeechSynthesisUtterance(text);
      const pitchMap = { low: 0.75, mid: 1.0, high: 1.45 };
      utt.pitch = pitchMap[tier] != null ? pitchMap[tier] : 1.0;
      if (isAccent) utt.pitch = Math.min(2, utt.pitch * 1.08);
      utt.volume = isAccent ? 1.0 : 0.95;
      const baseRate = Math.min(2.0, Math.max(0.9, runRef.bpm / 110));
      utt.rate = Math.min(2.2, baseRate * (runPerBeat > 1 ? 1.15 : 1));
      utt.lang = 'en-US';
      try { window.speechSynthesis.cancel(); } catch (e2) {}
      window.speechSynthesis.speak(utt);
    } catch (e) {}
  }

  /* ---------- context bootstrap ---------- */

  async function ensureContext() {
    if (ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      ctx = new AudioCtx({ latencyHint: 'interactive', sampleRate: 48000 });
    } catch (e) {
      try { ctx = new AudioCtx({ latencyHint: 'interactive' }); } catch (e2) { return false; }
    }
    hardwareSampleRate = ctx.sampleRate || 48000;

    setupDynamicsPipeline();
    attachStateHandler();
    setupUnlockProtocol();
    setupBackgroundSilence();

    // Connect dynamics chain: worklet/legacy -> compressor -> softClipper -> masterGain -> destination
    // We will connect workletNode to compressor input after creation; legacy oscs also connect to compressor.
    // For now, wire compressor -> softClipper -> masterGain -> destination
    try {
      if (softClipper) {
        compressor.connect(softClipper);
        softClipper.connect(masterGain);
      } else {
        compressor.connect(masterGain);
      }
      masterGain.connect(ctx.destination);
    } catch (e) {
      try { compressor.connect(ctx.destination); } catch (e2) { masterGain.connect(ctx.destination); }
    }

    /* Prefer the AudioWorklet path; fall back silently to the hardened
       legacy scheduler if the module can't load (old browser, offline). */
    usingWorklet = false;
    if (ctx.audioWorklet) {
      try {
        await ctx.audioWorklet.addModule(METRO_TIMING.workletUrl);
        // Try spec processor first, fallback to legacy name if needed
        let nodeCreated = false;
        try {
          workletNode = new AudioWorkletNode(ctx, 'metronome-processor', {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2]
          });
          nodeCreated = true;
        } catch (e) {
          // Fallback to kins-click if metronome-processor not registered
          workletNode = new AudioWorkletNode(ctx, METRO_TIMING.workletName, {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1]
          });
          nodeCreated = true;
        }
        if (nodeCreated && workletNode) {
          workletNode.port.onmessage = onWorkletMessage;
          // Connect through dynamics pipeline
          try { workletNode.connect(compressor); } catch (e) { workletNode.connect(masterGain); }
          // Send sound tables
          postToWorklet({
            type: 'sounds',
            sounds: METRO_SOUNDS.map((s) => ({
              id: s.id, type: s.type, freq: s.freq,
              accentFreq: s.accentFreq, decay: s.decay, gain: s.gain
            }))
          });
          // Also prime spec gains
          try {
            if (workletNode.parameters.has('accentGain')) workletNode.parameters.get('accentGain').setValueAtTime(0.80, ctx.currentTime);
            if (workletNode.parameters.has('beatGain')) workletNode.parameters.get('beatGain').setValueAtTime(0.60, ctx.currentTime);
            if (workletNode.parameters.has('subGain')) workletNode.parameters.get('subGain').setValueAtTime(0.40, ctx.currentTime);
          } catch (e) {}
          usingWorklet = true;
        }
      } catch (e) {
        usingWorklet = false;
        workletNode = null;
        // Legacy path: oscs will connect directly to compressor instead of masterGain
        // Already wired compressor->master->dest, so legacy path will feed compressor
      }
    }
    // If not using worklet, ensure legacy oscs feed compressor
    // (scheduleClick will connect to compressor if available, else masterGain)

    // Periodic hardware sampleRate check (Bluetooth route)
    try {
      setInterval(() => { if (ctx && runRef.playing) handleHardwareAdaptation(); }, 1000);
    } catch (e) {}

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
      visualQueue.push({ time: d.time, beatInBar: d.beatInBar, isAccent: !!d.isAccent, tier: d.tier || 'mid', isBeatStart: d.isBeatStart !== false });
      scheduledTotal = d.n || scheduledTotal + 1;
    } else if (d.type === 'TICK_EVENT') {
      // Spec TICK_EVENT also drives visual queue if beat not already queued (avoid double)
      // We already handle 'beat', so ignore duplicate unless 'beat' missing
      if (d.role && typeof d.frame === 'number' && visualQueue.length < METRO_TIMING.maxVisualQueueLen) {
        // No-op: beat message already queued; keep for debug
      }
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
        handleHardwareAdaptation();
      } else if (st === 'suspended') {
        // Could be Bluetooth route change; check sampleRate on next resume
        if (runRef.playing) {
          // Attempt resume quickly
          try { ctx.resume(); } catch (e) {}
        }
      }
    };
    // Also listen for devicechange? Not needed
  }

  /* ---------- legacy path internals ---------- */

  function scheduleClick(time, isAccent, startsABeat, tier) {
    if (tier === 'mute') return;
    const sound = getSound();
    if (sound.id === 'voice-count') {
      scheduledTotal++;
      return;
    }
    const t = tier || 'mid';
    const ratio = t === 'low' ? 0.75 : (t === 'high' ? 1.5 : 1);
    const baseFreq = isAccent ? sound.accentFreq : sound.freq;
    const freq = baseFreq * ratio;
    // Bounded headroom: accent 0.80, beat 0.60, sub 0.40 scaled by equal-power
    let nominalGain;
    if (isAccent) nominalGain = 0.80;
    else if (startsABeat) nominalGain = 0.60;
    else nominalGain = 0.40;
    // Apply equal-power subdivision scaling for non-accent subdivisions
    if (!isAccent && !startsABeat) {
      nominalGain *= getSubdivisionScale(runPerBeat);
    }
    // Also scale by sound's intrinsic gain normalized (sound.gain ~0.5) -> keep but clamp
    const peakGain = Math.max(0.0001, Math.min(1, nominalGain * (Math.max(0.0001, sound.gain) / 0.5)));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound.type;
    osc.frequency.setValueAtTime(freq, time);

    /* Anti-pop micro attack (0.75ms) + smooth exponential decay to epsilon 1e-4 */
    const epsilon = 0.0001;
    gain.gain.setValueAtTime(epsilon, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.0008);
    gain.gain.exponentialRampToValueAtTime(epsilon, time + sound.decay);
    osc.connect(gain);
    // Route through compressor for headroom, not direct to master
    try {
      if (compressor) gain.connect(compressor);
      else gain.connect(masterGain);
    } catch (e) { gain.connect(masterGain); }
    osc.start(time);
    osc.stop(time + sound.decay + 0.02);
    pendingSources.push({ osc, gain, time, startsABeat });
    scheduledTotal++;
  }

  function prunePending() {
    if (!ctx) return;
    const cutoff = ctx.currentTime - 0.2;
    while (pendingSources.length && pendingSources[0].time < cutoff) {
      pendingSources.shift();
    }
  }

  function cancelSource(entry, now) {
    try {
      // Spec-compliant de-click: cancelAndHold then 3ms exponential to epsilon
      try {
        entry.gain.gain.cancelAndHoldAtTime(now);
      } catch (e) {
        try { entry.gain.gain.cancelScheduledValues(now); } catch (e2) {}
      }
      const held = entry.gain.gain.value;
      entry.gain.gain.setValueAtTime(held, now);
      entry.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.003);
      entry.osc.stop(now + 0.005);
      setTimeout(() => {
        try { entry.osc.disconnect(); entry.gain.disconnect(); } catch (e) {}
      }, 10);
    } catch (e) {}
  }

  function flushFrom(guardSec, killUnstarted) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const cutoff = now + guardSec;
    const kept = [];
    let resumeAt = -1;
    for (let i = 0; i < pendingSources.length; i++) {
      const p = pendingSources[i];
      if (p.time > cutoff) {
        if (resumeAt === -1) resumeAt = p.time;
        cancelSource(p, now);
        clickCounter--;
        if (p.startsABeat) beatCounter--;
      } else if (killUnstarted && p.time > now) {
        cancelSource(p, now);
      } else {
        kept.push(p);
      }
    }
    pendingSources.length = 0;
    for (let i = 0; i < kept.length; i++) pendingSources.push(kept[i]);
    if (resumeAt !== -1) {
      while (visualQueue.length && visualQueue[visualQueue.length - 1].time > cutoff) {
        visualQueue.pop();
      }
      if (clickCounter < 0) clickCounter = 0;
      if (beatCounter < 0) beatCounter = 0;
      nextClickTime = Math.max(resumeAt, now + guardSec);
    } else {
      if (nextClickTime < now + guardSec) nextClickTime = now + guardSec;
    }
  }

  function skipMissedClick(clickDur) {
    const startsABeat = Math.abs(clickCounter % runPerBeat) < 1e-9;
    if (startsABeat) beatCounter++;
    clickCounter++;
    nextClickTime += clickDur;
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
    const clickDur = 60 / runRef.bpm / runPerBeat;
    while (nextClickTime < ctx.currentTime + aheadSec) {
      if (nextClickTime < ctx.currentTime - METRO_TIMING.resyncGraceSec) {
        skipMissedClick(clickDur);
        continue;
      }
      const startsABeat = Math.abs(clickCounter % runPerBeat) < 1e-9;
      const soundingBeat = startsABeat ? beatCounter : beatCounter - 1;
      const beatInBar = ((Math.max(0, soundingBeat) % runBeatsPerBar) + runBeatsPerBar) % runBeatsPerBar;
      const isAccent = runAccentFirst && startsABeat && beatInBar === 0;
      const tier = (runBeatTiers && runBeatTiers[beatInBar]) || 'mid';
      scheduleClick(nextClickTime, isAccent, startsABeat, tier);
      visualQueue.push({ time: nextClickTime, beatInBar, isAccent, tier, isBeatStart: startsABeat });
      nextClickTime += clickDur;
      clickCounter++;
      if (startsABeat) beatCounter++;
    }
  }

  function ensureSchedulerTimer() {
    if (schedulerTimer === null) {
      lastTickPerf = 0;
      schedulerTimer = setInterval(schedulerTick, METRO_TIMING.schedulerIntervalMs);
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
      try {
        const curSound = getSound();
        if (curSound && curSound.id === 'voice-count' && evt.tier !== 'mute' && evt.isBeatStart !== false) {
          speakVoiceCount(evt.beatInBar, evt.tier, !!evt.isAccent);
        }
      } catch (e2) {}
    }
  }

  /* ---------- public API ---------- */

  async function start(opts) {
    const ok = await ensureContext();
    if (!ok) {
      const err = new Error('unsupported');
      err.code = 'unsupported';
      throw err;
    }

    runRef.bpm = opts.bpm;
    runPerBeat = opts.perBeat;
    runBeatsPerBar = opts.beatsPerBar;
    runAccentFirst = opts.accentFirst;
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
    clickCounter = 0;
    beatCounter = 0;
    scheduledTotal = 0;
    firedBeats = 0;
    tickCount = 0;
    lastTickDeltaMs = 0;
    maxTickDeltaMs = 0;
    interruptedPending = false;
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
        accentFirst: runAccentFirst,
        tiers: runBeatTiers
      });
      // Also drive via AudioParams for spec path (k-rate)
      try {
        const now = ctx.currentTime;
        if (workletNode.parameters.has('bpm')) workletNode.parameters.get('bpm').setValueAtTime(runRef.bpm, now);
        if (workletNode.parameters.has('subdivision')) workletNode.parameters.get('subdivision').setValueAtTime(runPerBeat, now);
        if (workletNode.parameters.has('accentGain')) workletNode.parameters.get('accentGain').setValueAtTime(0.80, now);
        if (workletNode.parameters.has('beatGain')) workletNode.parameters.get('beatGain').setValueAtTime(0.60, now);
        if (workletNode.parameters.has('subGain')) {
          const gSub = 0.40 * getSubdivisionScale(runPerBeat);
          workletNode.parameters.get('subGain').setValueAtTime(gSub, now);
        }
        if (workletNode.parameters.has('isPlaying')) workletNode.parameters.get('isPlaying').setValueAtTime(1, now);
        // Spec RESET_PHASE
        workletNode.port.postMessage({ type: 'RESET_PHASE' });
      } catch (e) {}
    } else {
      nextClickTime = ctx.currentTime + METRO_TIMING.startOffsetSec;
      ensureSchedulerTimer();
      schedulerTick();
    }
    ensureUiLoop();
  }

  function stop() {
    runRef.playing = false;
    interruptedPending = false;
    pauseBackgroundSilence();
    if (usingWorklet && workletNode && ctx) {
      postToWorklet({ type: 'stop' });
      try {
        if (workletNode.parameters.has('isPlaying')) workletNode.parameters.get('isPlaying').setValueAtTime(0, ctx.currentTime);
      } catch (e) {}
      // Spec-compliant 3ms de-click on masterGain
      try {
        const now = ctx.currentTime;
        const g = masterGain.gain;
        g.cancelAndHoldAtTime(now);
        g.setValueAtTime(g.value, now);
        g.exponentialRampToValueAtTime(0.0001, now + 0.003);
        // Restore 0.90 after fade
        g.setValueAtTime(0.90, now + 0.004);
      } catch (e) {
        try { masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.001); setTimeout(() => { try { masterGain.gain.setValueAtTime(0.90, ctx.currentTime); } catch (e2) {} }, 10); } catch (e3) {}
      }
    } else if (ctx) {
      flushFrom(METRO_TIMING.stopFlushGuardSec, true);
      pendingSources.length = 0;
      try {
        const now = ctx.currentTime;
        const g = masterGain.gain;
        g.cancelAndHoldAtTime(now);
        g.setValueAtTime(g.value, now);
        g.exponentialRampToValueAtTime(0.0001, now + 0.003);
        g.setValueAtTime(0.90, now + 0.004);
      } catch (e) {}
    }
    if (schedulerTimer !== null) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
    if (uiRafId !== null) {
      cancelAnimationFrame(uiRafId);
      uiRafId = null;
    }
    visualQueue.length = 0;
    try { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  function updateBpm(bpm) {
    runRef.bpm = bpm;
    if (usingWorklet && workletNode) {
      // Prefer AudioParam (k-rate, no flood)
      try {
        if (workletNode.parameters.has('bpm')) {
          workletNode.parameters.get('bpm').setValueAtTime(bpm, ctx.currentTime);
          return;
        }
      } catch (e) {}
      postToWorklet({ type: 'bpm', bpm });
      return;
    }
    if (runRef.playing && ctx) {
      flushFrom(METRO_TIMING.changeGuardSec);
      schedulerTick();
    }
  }

  function updateOptions(opts) {
    if (typeof opts.perBeat === 'number') runPerBeat = opts.perBeat;
    if (typeof opts.beatsPerBar === 'number') runBeatsPerBar = opts.beatsPerBar;
    if (typeof opts.accentFirst === 'boolean') runAccentFirst = opts.accentFirst;
    if (typeof opts.vibrate === 'boolean') runVibrate = opts.vibrate;
    if (usingWorklet && workletNode) {
      // Drive subdivision via AudioParam if available (spec)
      try {
        let handled = false;
        if (typeof opts.perBeat === 'number' && workletNode.parameters.has('subdivision')) {
          workletNode.parameters.get('subdivision').setValueAtTime(opts.perBeat, ctx.currentTime);
          handled = true;
          // Also update subGain with equal-power scaling
          try {
            const gSub = 0.40 * getSubdivisionScale(opts.perBeat);
            if (workletNode.parameters.has('subGain')) workletNode.parameters.get('subGain').setValueAtTime(gSub, ctx.currentTime);
          } catch (e) {}
        }
        if (handled) {
          // Also forward opts for legacy compatibility
          postToWorklet({
            type: 'opts',
            perBeat: runPerBeat,
            beatsPerBar: runBeatsPerBar,
            accentFirst: runAccentFirst
          });
          return;
        }
      } catch (e) {}
      postToWorklet({
        type: 'opts',
        perBeat: runPerBeat,
        beatsPerBar: runBeatsPerBar,
        accentFirst: runAccentFirst
      });
      return;
    }
    if (runRef.playing && ctx) {
      flushFrom(METRO_TIMING.changeGuardSec);
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
      schedulerTick();
    }
  }

  async function previewClick(tierId, soundId) {
    if (tierId === 'mute') return;
    const sound = (soundId ? METRO_SOUNDS.find((s) => s.id === soundId) : null) || getSound();
    if (sound.id === 'voice-count') {
      const ok = await ensureContext();
      if (!ok || !ctx) return;
      if (ctx.state !== 'running') {
        try { await ctx.resume(); } catch (e) {}
      }
      speakVoiceCount(0, tierId || 'mid', false);
      return;
    }
    const ok = await ensureContext();
    if (!ok || !ctx) return;
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (e) {}
    }
    if (ctx.state !== 'running') return;
    const t = tierId || 'mid';
    const ratio = t === 'low' ? 0.75 : (t === 'high' ? 1.5 : 1);
    const freq = sound.freq * ratio;
    // Preview uses bounded gain (0.50 nominal) with headroom
    const peakGain = Math.max(0.0001, Math.min(0.6, 0.50 * (Math.max(0.0001, sound.gain) / 0.5)));
    const time = ctx.currentTime + 0.01;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound.type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.0008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + sound.decay);
    osc.connect(gain);
    try {
      if (compressor) gain.connect(compressor);
      else gain.connect(masterGain);
    } catch (e) { gain.connect(masterGain); }
    osc.start(time);
    osc.stop(time + sound.decay + 0.02);
  }

  function updateSound(id) {
    if (usingWorklet) postToWorklet({ type: 'sound', id });
    if (id !== 'voice-count') {
      try { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  function setVolume(value) {
    if (!masterGain || !ctx) return;
    const target = Math.max(0.00001, Math.min(1, value * 0.90)); // preserve 0.90 headroom
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

  function sync() {
    if (!ctx || !runRef.playing) return;
    handleHardwareAdaptation();
    if (usingWorklet) {
      postToWorklet({ type: 'sync', offsetSec: METRO_TIMING.startOffsetSec });
      try { workletNode.port.postMessage({ type: 'RESET_PHASE' }); } catch (e) {}
    } else if (nextClickTime < ctx.currentTime - METRO_TIMING.resyncGraceSec) {
      nextClickTime = ctx.currentTime + METRO_TIMING.startOffsetSec;
    }
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
      nextClickInMs: (!usingWorklet && ctx && runRef.playing && nextClickTime > ctx.currentTime)
        ? Math.round((nextClickTime - ctx.currentTime) * 1000)
        : -1,
      ticks: tickCount,
      lastTickDeltaMs: Math.round(lastTickDeltaMs),
      maxTickDeltaMs: Math.round(maxTickDeltaMs),
      scheduledTotal,
      firedBeats
    };
  }

  return {
    start,
    stop,
    updateBpm,
    updateOptions,
    updateTiers,
    previewClick,
    updateSound,
    setVolume,
    suspend,
    resume,
    sync,
    getDebugState,
    get playing() { return runRef.playing; },
    get mode() { return usingWorklet ? 'worklet' : 'legacy'; }
  };
}
