import { TUNER_COPY, DETECT, noteToFreq } from '../../../settings/tuner.config';
import { showToast } from '../toast.js';
import {
  state,
  getGroup,
  getString,
  getProfile,
  setInstrument,
  setPreset,
  setString,
  setStringCount,
  setCustomStringCount,
  setMode,
  setAutoAdvance,
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

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
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

function handleReading(r, nowMs) {
  const chromatic = state.mode === 'chromatic';
  const target = getString();
  const reading = {
    status: r.status,
    freq: 0,
    cents: 0,
    rawCents: 0,
    color: null,
    zone: null,
    detectedNote: '--',
    detectedOctave: 0,
    nearestName: '',
    target,
    locked: r.locked
  };

  if (r.status !== 'ok') {
    smoother.reset();
    lockedSince = 0;
    ui.updateReading(reading);
    return;
  }

  const midi = Math.round(69 + 12 * Math.log2(r.freq / state.a4));
  reading.freq = r.freq;
  reading.detectedNote = NOTE_NAMES[((midi % 12) + 12) % 12];
  reading.detectedOctave = Math.floor(midi / 12) - 1;

  const rawCents = chromatic
    ? Math.round(1200 * Math.log2(r.freq / noteToFreq(midi, state.a4)))
    : Math.round(1200 * Math.log2(r.freq / targetFreq(target)));
  reading.rawCents = rawCents;

  const smoothed = smoother.push(rawCents);
  reading.cents = smoothed.cents;

  if (chromatic) {
    reading.nearestName = reading.detectedNote + reading.detectedOctave;
    ui.updateReading(reading);
    return;
  }

  const safetyResult = safety.update(smoothed.cents, rawCents, getProfile(), nowMs);
  reading.zone = safetyResult.zone;
  reading.color = safetyResult.color;

  const stableMidi = noteStab.update(midi, nowMs);
  reading.detectedNote = NOTE_NAMES[((stableMidi % 12) + 12) % 12];
  reading.detectedOctave = Math.floor(stableMidi / 12) - 1;

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
  stopMic();
  ui.renderTopbar();
  ui.renderFigure();
  ui.resetReadout();
}

function onAutoAdvanceToggle(enabled) {
  setAutoAdvance(enabled);
  lockedSince = 0;
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

export function initTuner() {
  if (initialized) return;
  initialized = true;

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lowPower = document.documentElement.classList.contains('low-power-mode');

  restore();
  engine = createAudioEngine();
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
    onMaterialSelect,
    onA4Select
  });
  ui.init();

  window.addEventListener('pagehide', stopEverything);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      engine.suspend();
    } else if (state.listening) {
      engine.resume();
    }
  });
}
