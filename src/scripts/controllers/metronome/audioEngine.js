import { METRO_SOUNDS, METRO_TIMING } from '../../../settings/metronome.config';
import { getSound } from './metroState.js';

/* KINS Metronome click engine — two paths behind one API.

   WORKLET PATH (default where supported): an AudioWorkletProcessor runs
   the whole scheduler + synthesiser on the audio rendering thread. It is
   immune to ANY main-thread stall, so the click literally cannot stutter
   or skip because of GC/layout/JS work. Config travels in via port
   messages; beat events travel back for the visual queue.

   LEGACY PATH (fallback): the classic lookahead scheduler ("A Tale of
   Two Clocks") hardened beyond the original version — 0.3s lookahead,
   a registry of every scheduled source so tempo/subdivision/time-signature
   changes FLUSH unplayed clicks and land immediately (instead of up to a
   full lookahead later), explicit stop cancellation (no ghost beat), and
   scheduling gated on ctx.state === 'running'.

   Both paths share: rAF visual-beat drain locked to ctx.currentTime,
   accent haptics fired from the drain (never from drifted setTimeouts),
   and an 'interrupted' state bridge (iOS phone call / screen lock) that
   reports honestly and auto-resumes when the OS allows. */
export function createMetroEngine() {
  let ctx = null;
  let masterGain = null;

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
  let runAccentFirst = true;
  let runVibrate = false;

  /* Shared mutable ref owned by this module, updated by index.js */
  const runRef = { bpm: 120, playing: false };

  /* Visual events awaiting their audible moment: { time, beatInBar, isAccent } */
  const visualQueue = [];
  let onVisualBeat = null;
  let onInterruption = null;

  /* Registry of scheduled-but-maybe-unplayed clicks (legacy only):
     enables instant cancel on stop/tempo change */
  const pendingSources = []; /* { osc, gain, time, startsABeat } */

  /* iOS-style interruption bridge */
  let interruptedPending = false;

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

  /* ---------- context bootstrap ---------- */

  async function ensureContext() {
    if (ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    ctx = new AudioCtx({ latencyHint: 'interactive' });
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
    attachStateHandler();

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
        workletNode.port.onmessage = onWorkletMessage;
        workletNode.connect(masterGain);
        postToWorklet({
          type: 'sounds',
          sounds: METRO_SOUNDS.map((s) => ({
            id: s.id, type: s.type, freq: s.freq,
            accentFreq: s.accentFreq, decay: s.decay, gain: s.gain
          }))
        });
        usingWorklet = true;
      } catch (e) {
        usingWorklet = false;
        workletNode = null;
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
    if (d && d.type === 'beat') {
      visualQueue.push({ time: d.time, beatInBar: d.beatInBar, isAccent: !!d.isAccent });
      scheduledTotal = d.n || scheduledTotal + 1;
    }
  }

  function attachStateHandler() {
    /* 'interrupted' = outside force paused the hardware (phone call,
       screen lock on iOS). currentTime freezes, so the schedule cursor
       stays valid across the gap. Ask to resume now — per spec the
       promise settles once the interruption ends. */
    ctx.onstatechange = () => {
      const st = ctx.state;
      if (st === 'interrupted') {
        interruptedPending = runRef.playing;
        if (interruptedPending) safeCall(onInterruption, 'interrupted');
        try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
      } else if (st === 'running' && interruptedPending) {
        interruptedPending = false;
        safeCall(onInterruption, 'resumed');
      }
    };
  }

  /* ---------- legacy path internals ---------- */

  function scheduleClick(time, isAccent, startsABeat) {
    const sound = getSound();
    const freq = isAccent ? sound.accentFreq : sound.freq;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound.type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(sound.gain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + sound.decay);
    osc.connect(gain);
    gain.connect(masterGain);
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
    try { entry.osc.stop(now); } catch (e) {}
    try { entry.osc.disconnect(); entry.gain.disconnect(); } catch (e) {}
  }

  /* Cancel every scheduled click further than guardSec in the future and
     roll the counters back so the cursor restarts there at the CURRENT
     run settings. Used by tempo/subdivision/time-signature changes (so
     they land immediately instead of one lookahead late) and by stop()
     (so no ghost beat rings out). */
  function flushFrom(guardSec) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const cutoff = now + guardSec;
    let idx = -1;
    for (let i = 0; i < pendingSources.length; i++) {
      if (pendingSources[i].time > cutoff) { idx = i; break; }
    }
    if (idx === -1) {
      /* Nothing beyond the guard — just make sure the cursor isn't sitting
         inside the guard window where a rescheduled click would fire late */
      if (nextClickTime < now + guardSec) nextClickTime = now + guardSec;
      return;
    }
    const doomed = pendingSources.splice(idx);
    const resumeAt = doomed[0].time;
    for (let i = 0; i < doomed.length; i++) {
      cancelSource(doomed[i], now);
      clickCounter--;
      if (doomed[i].startsABeat) beatCounter--;
    }
    /* visual queue is time-ordered; drop the suffix matching the cancels */
    while (visualQueue.length && visualQueue[visualQueue.length - 1].time > cutoff) {
      visualQueue.pop();
    }
    if (clickCounter < 0) clickCounter = 0;
    if (beatCounter < 0) beatCounter = 0;
    nextClickTime = Math.max(resumeAt, now + guardSec);
  }

  function schedulerTick() {
    if (!ctx || !runRef.playing || usingWorklet) return;
    if (ctx.state !== 'running') return; /* never schedule against a frozen clock */
    const pn = performance.now();
    lastTickDeltaMs = lastTickPerf ? pn - lastTickPerf : 0;
    if (lastTickDeltaMs > maxTickDeltaMs) maxTickDeltaMs = lastTickDeltaMs;
    lastTickPerf = pn;
    tickCount++;

    prunePending();
    const clickDur = 60 / runRef.bpm / runPerBeat;
    while (nextClickTime < ctx.currentTime + METRO_TIMING.scheduleAheadSec) {
      /* perBeat ∈ {1, 1.5, 2, 3, 4, 6, 8} — modulo checks are FP-exact */
      const startsABeat = Math.abs(clickCounter % runPerBeat) < 1e-9;
      /* The beat this click belongs to: the one it opens, or the one
         already in progress. Derived from beatCounter — NOT recomputed
         from clickCounter/perBeat — so changing subdivision mid-bar can
         never jump the bar position. */
      const soundingBeat = startsABeat ? beatCounter : beatCounter - 1;
      const beatInBar = ((Math.max(0, soundingBeat) % runBeatsPerBar) + runBeatsPerBar) % runBeatsPerBar;
      const isAccent = runAccentFirst && startsABeat && beatInBar === 0;
      scheduleClick(nextClickTime, isAccent, startsABeat);
      visualQueue.push({ time: nextClickTime, beatInBar, isAccent });
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
    while (visualQueue.length && visualQueue[0].time <= now + METRO_TIMING.visualDrainLeadSec) {
      const evt = visualQueue.shift();
      firedBeats++;
      safeCall(onVisualBeat, evt);
      if (evt.isAccent && runVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(12); } catch (e) {}
      }
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
    onVisualBeat = opts.onVisualBeat || null;
    onInterruption = opts.onInterruption || null;

    /* Autoplay policy / blocked contexts: resume must complete before we
       seed the cursor, otherwise clicks land on a stale timeline. */
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (e) {}
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

    if (usingWorklet) {
      postToWorklet({ type: 'sound', id: getSound().id });
      postToWorklet({
        type: 'start',
        bpm: runRef.bpm,
        perBeat: runPerBeat,
        beatsPerBar: runBeatsPerBar,
        accentFirst: runAccentFirst
      });
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
    if (usingWorklet) {
      postToWorklet({ type: 'stop' });
    } else if (ctx) {
      flushFrom(METRO_TIMING.stopFlushGuardSec);
      pendingSources.length = 0;
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
  }

  function updateBpm(bpm) {
    runRef.bpm = bpm;
    if (usingWorklet) {
      postToWorklet({ type: 'bpm', bpm });
      return;
    }
    if (runRef.playing && ctx) {
      flushFrom(METRO_TIMING.changeGuardSec);
      schedulerTick(); /* refill the window immediately at the new tempo */
    }
  }

  function updateOptions(opts) {
    if (typeof opts.perBeat === 'number') runPerBeat = opts.perBeat;
    if (typeof opts.beatsPerBar === 'number') runBeatsPerBar = opts.beatsPerBar;
    if (typeof opts.accentFirst === 'boolean') runAccentFirst = opts.accentFirst;
    if (typeof opts.vibrate === 'boolean') runVibrate = opts.vibrate;
    if (usingWorklet) {
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

  /* Sound can be swapped live in both paths; the worklet needs a message,
     the legacy path reads it per-click at schedule time. */
  function updateSound(id) {
    if (usingWorklet) postToWorklet({ type: 'sound', id });
  }

  function setVolume(value) {
    if (!masterGain || !ctx) return;
    masterGain.gain.setTargetAtTime(Math.max(0.0001, value), ctx.currentTime, 0.02);
  }

  function suspend() {
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  function resume() {
    if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
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
    start, /* async — awaits context/resume; rejects with err.code 'unsupported'|'blocked' */
    stop,
    updateBpm,
    updateOptions,
    updateSound,
    setVolume,
    suspend,
    resume,
    getDebugState,
    get playing() { return runRef.playing; },
    get mode() { return usingWorklet ? 'worklet' : 'legacy'; }
  };
}
