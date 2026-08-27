import { TUNER_COPY, DETECT, noteToFreq } from '../../../settings/tuner.config';
import { showToast } from '../toast.js';
import { midiToPitchClass } from './notesUtil.js';
import {
  state,
  getGroup,
  getString,
  getPreset,
  getProfile,
  setInstrument,
  setPreset,
  setString,
  setStringCount,
  setCustomStringCount,
  setMode,
  setAutoAdvance,
  setAutoIdentify,
  setMaterial,
  setA4,
  restore
} from './tunerState.js';
import { createAudioEngine } from './audioEngine.js';
import {
  createPitchDetector,
  createCentsSmoother,
  createNoteStabilizer
} from './pitchDetector.js';
import { createSafetyMonitor } from './safetyMonitor.js';
import { createUi } from './uiBindings.js';

const WORK_WINDOW = DETECT.WORK_WINDOW;

let initialized = false;
let engine = null;
let detector = null;
let smoother = null;
let noteStab = null;
let safety = null;
let ui = null;
let rafId = null;
let lastTick = 0;
let reducedMotion = false;
let lowPower = false;
let lockedSince = 0;
/* Auto string identification hysteresis (guided mode): a locked reading
   near ANOTHER string's target must persist before the selection follows. */
let autoIdCandidate = null;
let autoIdCandidateSince = 0;
const workBuf = new Float32Array(WORK_WINDOW);

function targetFreq(string) {
  if (state.instrumentId === 'drums') return string.freq;
  return noteToFreq(string.midi, state.a4);
}

function resetPipeline() {
  detector.reset();
  smoother.reset();
  noteStab.reset();
  safety.reset();
  lockedSince = 0;
  autoIdCandidate = null;
  autoIdCandidateSince = 0;
  lastGood = null;
  lastGoodAt = 0;
  holdCandidateMidi = null;
  holdCandidateSince = 0;
  holdCandidateFrames = 0;
  clipRun = 0;
  polyRun = 0;
}

/* Pluck-and-follow: nearest string whose target sits within AUTO_ID_CENTS of
   the confident reading. Only near-exact matches qualify, so an out-of-tune
   pluck can never hijack the selection. */
function findAutoIdString(freq) {
  const strings = getPreset().strings;
  let best = null;
  let bestCents = Infinity;
  for (let i = 0; i < strings.length; i++) {
    const target = targetFreq(strings[i]);
    if (!(target > 0)) continue;
    const cents = Math.abs(1200 * Math.log2(freq / target));
    if (cents < bestCents) {
      bestCents = cents;
      best = i;
    }
  }
  return best !== null && bestCents <= DETECT.AUTO_ID_CENTS ? best : null;
}

function autoIdTick(freq, trusted, nowMs) {
  if (!state.autoIdentify || state.mode !== 'guided' || state.instrumentId === 'drums') return;
  // Only fully locked readings may steer string selection; weak/unlocked
  // frames pause evaluation without cancelling confirmation progress.
  if (!trusted) return;
  const match = findAutoIdString(freq);
  if (match === null || match === state.stringIndex) {
    autoIdCandidate = null;
    return;
  }
  if (autoIdCandidate === match) {
    if (nowMs - autoIdCandidateSince >= DETECT.AUTO_ID_HOLD_MS) {
      autoIdCandidate = null;
      autoIdCandidateSince = 0;
      setString(match);
      // Light pipeline refresh — keep detector lock, drop stale smoothing.
      smoother.reset();
      noteStab.reset();
      safety.reset();
      lockedSince = 0;
      lastGood = null;
      lastGoodAt = 0;
      holdCandidateMidi = null;
      holdCandidateSince = 0;
      holdCandidateFrames = 0;
      ui.renderFigure();
      ui.pulseActivePeg();
    }
  } else {
    autoIdCandidate = match;
    autoIdCandidateSince = nowMs;
  }
}

function getPresetInternal() {
  const group = getGroup();
  return group.presets[state.presetIndex] || group.presets[0];
}

function autoAdvanceTick(cents, locked, nowMs) {
  if (!state.autoAdvance || state.mode !== 'guided') {
    lockedSince = 0;
    return;
  }
  if (Math.abs(cents) <= DETECT.IN_TUNE_CENTS && locked) {
    if (!lockedSince) {
      lockedSince = nowMs;
    } else if (nowMs - lockedSince >= DETECT.AUTO_ADVANCE_LOCK_MS) {
      const preset = getPresetInternal();
      const next = (state.stringIndex + 1) % preset.strings.length;
      setString(next);
      resetPipeline();
      ui.renderFigure();
      showToast(TUNER_COPY.autoAdvanced(preset.strings[next].note), 'success');
    }
  } else {
    lockedSince = 0;
  }
}

/* Latched display state — the last confident reading is kept on screen
   indefinitely (the "forever" hold requested) instead of blanking between
   plucks. Silent / transient / low-confidence frames never overwrite it;
   only a new *locked* pitch that proves itself over HOLD_MIN_MS +
   HOLD_CONFIRM_FRAMES can replace it. This implements the "stay in the
   spot ... backed by the next audio" contract and debounces sympathetic
   resonance tails that otherwise flicker the note label. */
let lastGood = null;
let lastGoodAt = 0;
let holdCandidateMidi = null;
let holdCandidateSince = 0;
let holdCandidateFrames = 0;
let clipRun = 0;
let polyRun = 0;

function holdFrame() {
  if (!lastGood) {
    ui.updateReading({ status: 'silent' });
    return;
  }
  ui.updateReading(Object.assign({}, lastGood, { held: true }));
}

function handleReading(r, nowMs) {
  const chromatic = state.mode === 'chromatic';

  // A fresh pluck after a gap: measure this attack clean, don't blend it
  // with cents smoothed from the previous note's decaying resonance.
  // Also clear the hold-candidate so the new pitch is evaluated from scratch.
  if (r.onset) {
    smoother.reset();
    noteStab.reset();
    autoIdCandidate = null;
    holdCandidateMidi = null;
    holdCandidateSince = 0;
    holdCandidateFrames = 0;
  }

  if (r.status !== 'ok') {
    // Transient/quiet frames: never blank — just keep showing where we were.
    if (r.status === 'transient' || r.status === 'silent') {
      holdFrame();
      return;
    }
    // clipped / polyphonic are actionable messages but flicker badly when
    // they alternate with good frames — require a short persistent run
    // before swapping the readout over to them. While un-persisted we hold
    // the latched note instead of blanking.
    if (r.status === 'clipped') clipRun++; else clipRun = 0;
    if (r.status === 'polyphonic') polyRun++; else polyRun = 0;
    const persisted = Math.max(clipRun, polyRun) >= DETECT.MESSAGE_PERSIST_FRAMES;
    if (!persisted && lastGood) {
      ui.updateReading(Object.assign({}, lastGood, { held: true }));
    } else if (persisted) {
      // Persisted actionable message: show it, but do NOT clear lastGood
      // so that when the message clears the previous note reappears.
      // We keep lastGood intact for the hold.
      ui.updateReading({ status: r.status });
    } else {
      holdFrame();
    }
    return;
  }

  clipRun = 0;
  polyRun = 0;

  // Quality gate 1: resonance-tail / noise guard — weak frames never
  // overwrite the held value, they just keep the display latched.
  if (r.conf < DETECT.UNRELIABLE_CONF) {
    holdFrame();
    return;
  }

  // Quality gate 2: "skip the start" — only *locked* pitches are trusted
  // to replace the latched display. Unlocked estimates (attack residue,
  // octave wobble before the detector stabilises) are discarded and the
  // previous note stays put. This is the user-requested "proper identification"
  // guarantee. The exception is the very first note after silence (lastGood
  // null) where we still require lock to avoid showing the attack itself.
  if (!r.locked) {
    holdFrame();
    return;
  }

  const midi = Math.round(69 + 12 * Math.log2(r.freq / state.a4));

  // Stabilise the note label so boundary flicker (A <-> A#) doesn't jitter
  // the readout or the free-mode rail. The stabiliser already enforces
  // LABEL_HYSTERESIS_MS (160ms) before the label can swap.
  const stableMidi = noteStab.update(midi, nowMs);

  // Quality gate 3: latched note-change debounce. A newly stabilised MIDI
  // that differs from the currently displayed note must prove itself over
  // HOLD_MIN_MS and HOLD_CONFIRM_FRAMES consecutive locked frames before
  // it overwrites the latched display. This prevents sympathetic resonance
  // or a single noisy frame from hijacking the readout, and implements the
  // "stay for a bit ... backed by the next audio" contract.
  if (lastGood && typeof lastGood.midi === 'number' && stableMidi !== lastGood.midi) {
    if (holdCandidateMidi !== stableMidi) {
      holdCandidateMidi = stableMidi;
      holdCandidateSince = nowMs;
      holdCandidateFrames = 1;
      holdFrame();
      return;
    }
    holdCandidateFrames++;
    const timeOk = nowMs - holdCandidateSince >= DETECT.HOLD_MIN_MS;
    const framesOk = holdCandidateFrames >= DETECT.HOLD_CONFIRM_FRAMES;
    if (!(timeOk && framesOk)) {
      holdFrame();
      return;
    }
    // Candidate confirmed — fall through to accept it and clear candidate.
    holdCandidateMidi = null;
    holdCandidateSince = 0;
    holdCandidateFrames = 0;
  } else if (lastGood && typeof lastGood.midi === 'number' && stableMidi === lastGood.midi) {
    // Same note as currently held: clear any pending candidate and allow
    // continuous cents tracking for tuning.
    holdCandidateMidi = null;
    holdCandidateSince = 0;
    holdCandidateFrames = 0;
  } else if (!lastGood) {
    // First note after silence: no extra hold delay, but still required lock
    // (already ensured above). Clear candidate.
    holdCandidateMidi = null;
  }

  const reading = {
    status: 'ok',
    freq: 0,
    cents: 0,
    rawCents: 0,
    color: null,
    zone: null,
    detectedNote: '--',
    detectedOctave: 0,
    nearestName: '',
    target: null,
    locked: r.locked,
    held: false,
    midi: stableMidi
  };

  reading.freq = r.freq;
  reading.detectedNote = midiToPitchClass(stableMidi);
  reading.detectedOctave = Math.floor(stableMidi / 12) - 1;

  // Pluck-and-follow runs before the target is resolved so this same frame
  // is already measured against the string it just identified.
  autoIdTick(r.freq, r.locked, nowMs);
  const target = getString();
  reading.target = target;

  const rawCents = chromatic
    ? Math.round(1200 * Math.log2(r.freq / noteToFreq(stableMidi, state.a4)))
    : Math.round(1200 * Math.log2(r.freq / targetFreq(target)));
  reading.rawCents = rawCents;

  const smoothed = smoother.push(rawCents, r.locked);
  reading.cents = smoothed.cents;

  if (chromatic) {
    reading.nearestName = reading.detectedNote + reading.detectedOctave;
    lastGood = Object.assign({}, reading);
    lastGoodAt = nowMs;
    ui.updateReading(reading);
    return;
  }

  const safetyResult = safety.update(smoothed.cents, rawCents, getProfile(), nowMs, r.locked);
  reading.zone = safetyResult.zone;
  reading.color = safetyResult.color;

  lastGood = Object.assign({}, reading);
  lastGoodAt = nowMs;

  autoAdvanceTick(smoothed.cents, r.locked, nowMs);
  ui.updateReading(reading);
}

function detectionLoop(ts) {
  if (!state.listening) {
    rafId = null;
    return;
  }
  rafId = requestAnimationFrame(detectionLoop);
  const interval = reducedMotion || lowPower ? 100 : 50;
  if (ts - lastTick < interval) return;
  lastTick = ts;
  if (document.hidden) return;
  if (!engine.takeFresh()) return;
  const size = engine.readLatest(workBuf);
  if (size < 2048) return;
  const r = detector.process(workBuf, size, engine.sampleRate, ts);
  handleReading(r, ts);
}

async function micPermissionState() {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const st = await navigator.permissions.query({ name: 'microphone' });
      return st.state;
    }
  } catch (e) {}
  return 'unknown';
}

async function onMicToggle() {
  if (state.starting) return;
  if (state.listening) {
    stopMic();
    return;
  }
  state.starting = true;
  ui.setMicState(false, true);
  try {
    await engine.start();
    resetPipeline();
    state.starting = false;
    ui.setMicState(true, false);
    if (engine.bluetooth) showToast(TUNER_COPY.btMic, 'warning');
    lastTick = 0;
    rafId = requestAnimationFrame(detectionLoop);
  } catch (err) {
    state.starting = false;
    ui.setMicState(false, false);
    const name = err && err.name;
    if (err && err.code === 'unsupported') {
      ui.showMicWarning(TUNER_COPY.micUnsupported);
    } else if (name === 'NotReadableError' || name === 'TrackStartError') {
      ui.showMicWarning('Microphone is busy in another app. Close it and try again.');
      showToast('Microphone is busy in another app.', 'warning');
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
      showToast(TUNER_COPY.micNotFound, 'warning');
    } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
      // Default to site-level denial (user clicked "Block" or the padlock is set to deny).
      // Only escalate to OS-blocked message if the Permissions API explicitly says 'granted'
      // (meaning the browser allowed it but the OS intercepted it). Treat 'prompt', 'denied',
      // and 'unknown' all as user-level denial — the padlock message is always actionable.
      const permState = await micPermissionState();
      const msg = permState === 'granted' ? TUNER_COPY.micSystemBlocked : TUNER_COPY.micDenied;
      ui.showMicWarning(msg);
      showToast(msg, 'warning');
    } else {
      ui.showMicWarning(TUNER_COPY.micSystemBlocked);
      showToast(TUNER_COPY.micSystemBlocked, 'warning');
    }
  }
}

function stopMic() {
  state.listening = false;
  state.starting = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  engine.stop();
  resetPipeline();
  ui.setMicState(false, false);
}

function onInstrumentChange(id) {
  setInstrument(id);
  stopMic();
  ui.renderTopbar();
  ui.renderInstrumentRow();
  ui.renderFigure();
  ui.resetReadout();
  if (ui.resetFilter) ui.resetFilter();
  if (ui.clearSearch) ui.clearSearch();
  ui.renderTuningList('');
}

function onPresetSelect(index) {
  setPreset(index);
  resetPipeline();
  ui.renderTopbar();
  ui.renderFigure();
  ui.resetReadout();
}

function onStringSelect(index) {
  setString(index);
  resetPipeline();
  ui.renderFigure();
}

function onStringCountSelect(count) {
  const ok = setStringCount(count);
  if (!ok) return;
  resetPipeline();
  ui.renderTopbar();
  ui.renderFigure();
  ui.resetReadout();
  if (ui.resetFilter) ui.resetFilter();
  if (ui.clearSearch) ui.clearSearch();
  ui.renderTuningList('');
}

function onCustomStringCount(count) {
  const ok = setCustomStringCount(count);
  if (!ok) {
    showToast('Enter a string count between 3 and 12', 'warning');
    return;
  }
  resetPipeline();
  ui.renderTopbar();
  ui.renderFigure();
  ui.resetReadout();
  if (ui.resetFilter) ui.resetFilter();
  if (ui.clearSearch) ui.clearSearch();
  ui.renderTuningList('');
  showToast(`Custom ${count}-string tuning active`, 'success');
}

function onModeSelect(mode) {
  setMode(mode);
  // Mic stays alive across mode switches — only an instrument change
  // restarts capture (different profile/layout).
  resetPipeline();
  ui.renderTopbar();
  ui.renderFigure();
  ui.resetReadout();
}

function onAutoAdvanceToggle(enabled) {
  setAutoAdvance(enabled);
  lockedSince = 0;
}

function onAutoIdToggle(enabled) {
  setAutoIdentify(enabled);
  autoIdCandidate = null;
}

function onMaterialSelect(id) {
  setMaterial(id);
  safety.reset();
  ui.renderTopbar();
  ui.resetReadout();
}

function onA4Select(hz) {
  setA4(hz);
  resetPipeline();
  ui.renderA4();
}

function stopEverything() {
  if (state.listening || state.starting) stopMic();
}

function clearStaleMediaSession() {
  try {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try { navigator.mediaSession.metadata = null; } catch {}
      try { navigator.mediaSession.playbackState = 'none'; } catch {}
      try { navigator.mediaSession.setActionHandler('play', null); } catch {}
      try { navigator.mediaSession.setActionHandler('pause', null); } catch {}
      try { navigator.mediaSession.setActionHandler('stop', null); } catch {}
    }
  } catch {}
}

export function initTuner() {
  if (initialized) return;
  initialized = true;

  // Tuner must not show a playback notification — clear any stale session
  clearStaleMediaSession();

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lowPower = document.documentElement.classList.contains('low-power-mode');

  restore();
  engine = createAudioEngine();
  // Unplugged/OS-revoked mics fire MediaStreamTrack 'ended' — surface it as
  // an actionable state instead of a stuck LISTENING readout.
  engine.onMicLost(() => {
    if (state.listening || state.starting) {
      stopMic();
      showToast(TUNER_COPY.micLost, 'warning');
    }
  });
  detector = createPitchDetector();
  smoother = createCentsSmoother();
  noteStab = createNoteStabilizer();
  safety = createSafetyMonitor();
  ui = createUi({
    onMicToggle,
    onInstrumentChange,
    onPresetSelect,
    onStringSelect,
    onStringCountSelect,
    onCustomStringCount,
    onModeSelect,
    onAutoAdvanceToggle,
    onAutoIdToggle,
    onMaterialSelect,
    onA4Select
  });
  ui.init();

  window.addEventListener('pagehide', stopEverything);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      engine.suspend();
      // Fully stop the rAF loop while hidden instead of spinning no-op ticks.
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else if (state.listening) {
      engine.resume();
      if (rafId === null) {
        lastTick = 0;
        rafId = requestAnimationFrame(detectionLoop);
      }
    }
  });
}
