import { TUNER_COPY, DETECT, noteToFreq } from '../../../settings/tuner.config.ts';
import { showToast } from '../toast.js';
import { midiToPitchClass } from './notesUtil.js';
import { state, getString, getPreset, setInstrument, setPreset, setString, setStringCount,
  setCustomStringCount, setMode, setAutoAdvance, setAutoIdentify, setMaterial, setA4, restore } from './tunerState.js';
import { createAudioEngine } from './audioEngine.js';
import { createCentsSmoother, createNoteStabilizer } from './pitchDetector.js';
import { createTuningConfirmation } from './confirmation.js';
import { createUi } from './uiBindings.js';
import { createReferenceTone } from './referenceTone.js';
import { createDrumWorkflow } from './drumWorkflow.js';

let initialized = false, engine = null, ui = null, worker = null, events = null;
let drums = null;
let sessionId = 0, revision = 0, busy = false, watchdog = null;
let workBuf = new Float32Array(DETECT.WORK_WINDOW);
let lastAnalysis = -Infinity, lastPacketAt = 0, lastGood = null, lastGoodAt = 0;
let autoCandidate = null, autoSince = 0, pendingAdvance = null;
let completed = new Set();
const smoother = createCentsSmoother();
const noteStab = createNoteStabilizer();
const confirmation = createTuningConfirmation();
const referenceTone = createReferenceTone(status => ui?.setReferenceStatus(status));

function targetFreq(string) { return state.instrumentId === 'drums' ? string.freq : noteToFreq(string.midi, state.a4); }
function resetPipeline() {
  revision++; smoother.reset(); noteStab.reset(); confirmation.reset();
  lastGood = null; lastGoodAt = 0; autoCandidate = null; pendingAdvance = null;
  completed.clear();
  ui?.updateProgress?.(0, false);
}
function holdReading(status = 'silent') {
  confirmation.reset(); autoCandidate = null; pendingAdvance = null;
  ui?.updateProgress?.(0, false);
  if (lastGood && performance.now() - lastGoodAt < DETECT.STALE_CLEAR_MS && status === 'silent') {
    ui.updateReading({ ...lastGood, held: true });
  } else ui?.updateReading({ status });
}
function identifyString(freq, time) {
  if (!state.autoIdentify || state.autoAdvance || state.mode !== 'guided') return;
  const matches = getPreset().strings.map((string, index) => ({ index, distance: Math.abs(1200 * Math.log2(freq / targetFreq(string))) })).sort((a,b) => a.distance-b.distance);
  const best = matches[0];
  if (!best || best.distance > DETECT.AUTO_ID_CENTS || best.index === state.stringIndex || (matches[1] && matches[1].distance - best.distance < DETECT.AUTO_ID_SEPARATION_CENTS)) { autoCandidate = null; return; }
  if (autoCandidate !== best.index) { autoCandidate = best.index; autoSince = time; return; }
  if (time - autoSince < DETECT.AUTO_ID_HOLD_MS) return;
  setString(best.index); autoCandidate = null; smoother.reset(); confirmation.reset();
  lastGood = null; ui.renderFigure();
}
function handleReading(reading) {
  if (state.instrumentId === 'drums') { drums?.update(reading); return; }
  const time = reading.timestamp;
  if (reading.status !== 'ok' || !reading.locked) {
    holdReading(reading.status === 'clipped' || reading.status === 'uncertain' ? reading.status : 'silent');
    return;
  }
  identifyString(reading.freq, time);
  const midi = Math.round(69 + 12 * Math.log2(reading.freq / state.a4));
  const stableMidi = noteStab.update(midi, time);
  if (stableMidi !== midi) { holdReading(); return; }
  const chromatic = state.mode === 'chromatic';
  const target = getString();
  const targetHz = chromatic ? noteToFreq(midi, state.a4) : targetFreq(target);
  if (targetHz < DETECT.MIN_DETECT_HZ || targetHz > DETECT.MAX_DETECT_HZ) { holdReading('out-of-range'); return; }
  const rawCents = 1200 * Math.log2(reading.freq / targetHz);
  if (lastGood?.midi !== midi) smoother.reset();
  const cents = smoother.push(rawCents, true, time).cents;
  const dwell = confirmation.update({ time, cents: rawCents, tolerance: state.tolerance ?? 3, trusted: true, targetId: String(targetHz) });
  const output = { status: 'ok', freq: reading.freq, cents, rawCents, locked: true, held: false,
    detectedNote: midiToPitchClass(midi), detectedOctave: Math.floor(midi / 12) - 1,
    nearestName: midiToPitchClass(midi) + (Math.floor(midi / 12) - 1), target, midi,
    confirmed: !chromatic && dwell.confirmed, inRange: Math.abs(rawCents) <= (state.tolerance ?? 3), zone: Math.abs(rawCents) > 600 && !chromatic ? 'wrong-octave' : null };
  lastGood = output; lastGoodAt = performance.now();
  ui.updateReading(output); ui.updateProgress?.(chromatic ? 0 : dwell.progress, output.confirmed);
  if (!dwell.confirmed) pendingAdvance = null;
  if (!chromatic && dwell.confirmed) {
    completed.add(state.stringIndex);
    if (state.autoAdvance && !pendingAdvance) pendingAdvance = { index: state.stringIndex, at: time };
  }
  if (pendingAdvance && state.autoAdvance && dwell.confirmed && time - pendingAdvance.at >= DETECT.AUTO_ADVANCE_DEBOUNCE_MS) {
    const strings = getPreset().strings;
    const next = strings.findIndex((_, index) => !completed.has(index));
    pendingAdvance = null;
    if (next < 0) { setAutoAdvance(false); showToast('All strings checked — play through once more.', 'success'); return; }
    if (Math.abs(1200 * Math.log2(targetFreq(strings[next]) / targetHz)) < 1) {
      setAutoAdvance(false); pendingAdvance = null;
      showToast('Unison course: select and pluck the next string separately.', 'info');
      return;
    }
    setString(next); confirmation.reset(); smoother.reset(); noteStab.reset(); lastGood = null;
    ui.renderFigure(); ui.resetReadout(); ui.updateProgress?.(0, false);
    showToast(TUNER_COPY.autoAdvanced(strings[next].note), 'success');
  }
}
function dispatchAnalysis() {
  lastPacketAt = performance.now();
  if (!state.listening || busy || !worker || engine.sampleTime - lastAnalysis < DETECT.ANALYSIS_HOP_MS) return;
  const size = engine.readLatest(workBuf);
  if (size < Math.ceil(2 * engine.sampleRate / DETECT.MIN_DETECT_HZ) + 2) return;
  lastAnalysis = engine.sampleTime; busy = true;
  worker.postMessage({ samples: workBuf, size, rate: engine.sampleRate, time: lastAnalysis, epoch: engine.epoch, revision,
    instrument: state.instrumentId, targetHz: drums?.target() }, [workBuf.buffer]);
}
function stopMic() {
  sessionId++; state.listening = false; state.starting = false;
  engine?.stop(); worker?.terminate(); worker = null; busy = false;
  if (watchdog !== null) clearInterval(watchdog); watchdog = null;
  workBuf = new Float32Array(DETECT.WORK_WINDOW);
  resetPipeline(); ui?.setMicState(false, false);
  drums?.setListening(false);
}
async function onMicToggle() {
  referenceTone.stop(); drums?.stopReference();
  if (state.mode === 'ear' && state.instrumentId !== 'drums') return;
  if (state.listening || state.starting) { stopMic(); return; }
  const targetHz = targetFreq(getString());
  if (state.instrumentId !== 'drums' && state.mode === 'guided' && (targetHz < DETECT.MIN_DETECT_HZ || targetHz > DETECT.MAX_DETECT_HZ)) {
    ui.showMicWarning(`This target is reference only. Select a target between ${DETECT.MIN_DETECT_HZ} and ${DETECT.MAX_DETECT_HZ} Hz, or use Chromatic mode.`); return;
  }
  const id = ++sessionId;
  state.starting = true; ui.setMicState(false, true);
  try {
    worker = new Worker(new URL('./pitchWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (id !== sessionId) return;
      busy = false; workBuf = data.samples;
      if (data.revision !== revision || data.epoch !== engine.epoch) return;
      if (engine.sampleTime - data.reading.timestamp > DETECT.RESULT_GAP_MS) { holdReading(); return; }
      handleReading(data.reading);
    };
    worker.onerror = () => { if (id === sessionId) { stopMic(); ui.showMicWarning('Audio analysis stopped. Tap Start tuning to retry.'); } };
    await engine.start({ deviceId: state.deviceId, channel: state.inputChannel });
    if (id !== sessionId || !initialized) return;
    resetPipeline(); lastAnalysis = -Infinity; lastPacketAt = performance.now();
    ui.setMicState(true, false);
    if (state.instrumentId === 'drums') drums?.setListening(true);
    ui.refreshInputs?.();
    watchdog = setInterval(() => {
      if (!engine.running || performance.now() - lastPacketAt > DETECT.INTERRUPTED_MS) { stopMic(); ui.showMicWarning('Microphone interrupted — tap Start tuning to reconnect.'); }
      else if (performance.now() - lastPacketAt > DETECT.RESULT_GAP_MS) holdReading();
    }, DETECT.WATCHDOG_MS);
  } catch (error) {
    if (id !== sessionId || !initialized) return;
    stopMic();
    const message = error.name === 'NotAllowedError' ? TUNER_COPY.micDenied
      : error.name === 'NotFoundError' ? TUNER_COPY.micNotFound
      : error.name === 'NotReadableError' ? 'Microphone is busy in another app. Close it and retry.'
      : error.code === 'worklet-unavailable' ? 'This browser could not start audio processing. Update your browser and retry.'
      : error.code === 'unsupported' ? TUNER_COPY.micUnsupported
      : 'Microphone could not start. Check your input and tap Start tuning to retry.';
    ui.showMicWarning(message);
  }
}

function strumSelection() {
  if (state.instrumentId === 'drums') return;
  if (state.listening || state.starting) stopMic();
  const strings = getPreset().strings;
  // Illustration coordinates remain available while the tuning picker is open.
  const pegs = [...document.querySelectorAll('#tunerFigure .tuner-peg')].map(peg => {
    const hit = peg.querySelector('.art-hit-target');
    return { index: Number(peg.getAttribute('data-string-index')), x: Number(hit?.getAttribute('x')), y: Number(hit?.getAttribute('y')) };
  }).sort((a, b) => a.y - b.y || a.x - b.x);
  const notes = pegs.map(peg => strings[peg.index]?.midi).filter(Number.isFinite);
  if (notes.length) referenceTone.playSequence(state.instrumentId, notes, state.a4).catch(() => showToast('Reference recordings could not play. Tap a string to retry.', 'error'));
}

function onInstrumentChange(id) {
  referenceTone.stop();
  if ((id === 'drums' || state.instrumentId === 'drums') && (state.listening || state.starting)) stopMic();
  setInstrument(id);
  drums?.show(id === 'drums');
  resetPipeline();
  ui.renderTopbar();
  ui.renderInstrumentRow();
  ui.renderFigure();
  ui.resetReadout();
  if (ui.resetFilter) ui.resetFilter();
  if (ui.clearSearch) ui.clearSearch();
  ui.renderTuningList('');
  strumSelection();
}

function onPresetSelect(index) {
  referenceTone.stop();
  setPreset(index);
  resetPipeline();
  ui.renderTopbar();
  ui.renderFigure();
  ui.resetReadout();
  strumSelection();
}

function onStringSelect(index) {
  const playReference = state.instrumentId !== 'drums' && !state.listening && !state.starting;
  setAutoIdentify(false);
  setAutoAdvance(false);
  setString(index);
  resetPipeline();
  ui.renderFigure();
  if (playReference) referenceTone.play(state.instrumentId, getString().midi, state.a4).catch(() => showToast('Recording could not load. Check your connection and tap the peg to retry.', 'error'));
}

function onStringCountSelect(count) {
  referenceTone.stop();
  const ok = setStringCount(count);
  if (!ok) return;
  resetPipeline();
  ui.renderTopbar();
  ui.renderFigure();
  ui.resetReadout();
  if (ui.resetFilter) ui.resetFilter();
  if (ui.clearSearch) ui.clearSearch();
  ui.renderTuningList('');
  strumSelection();
}

function onCustomStringCount(count) {
  referenceTone.stop();
  const ok = setCustomStringCount(count);
  if (!ok) {
    showToast('Enter a string count between 1 and 12', 'warning');
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
  strumSelection();
}

function onModeSelect(mode) {
  referenceTone.stop();
  if (mode === 'ear') stopMic();
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
  resetPipeline();
}

function onAutoIdToggle(enabled) {
  setAutoIdentify(enabled);
  autoCandidate = null;
}

function onMaterialSelect(id) {
  setMaterial(id);
  confirmation.reset();
  ui.renderTopbar();
  ui.resetReadout();
}

function onA4Select(hz) {
  referenceTone.stop();
  setA4(hz);
  resetPipeline();
  ui.renderA4();
  ui.renderFigure();
  ui.resetReadout();
}


export function initTuner() {
  if (initialized || !document.getElementById('tunerView')) return;
  initialized = true; events = new AbortController(); restore();
  engine = createAudioEngine();
  engine.onSamples(dispatchAnalysis);
  engine.onMicLost(() => { stopMic(); ui.showMicWarning(TUNER_COPY.micLost); });
  ui = createUi({ onMicToggle, onInstrumentChange, onPresetSelect, onStringSelect, onStringCountSelect,
    onCustomStringCount, onModeSelect, onAutoAdvanceToggle, onAutoIdToggle, onMaterialSelect, onA4Select,
    onInputChange() { if (state.listening || state.starting) stopMic(); resetPipeline(); } });
  ui.init();
  drums = createDrumWorkflow(resetPipeline, () => {
    if (state.listening || state.starting) stopMic();
  });
  drums.show(state.instrumentId === 'drums');
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { referenceTone.stop(); drums?.stopReference(); }
    if (document.hidden && (state.listening || state.starting)) { stopMic(); ui.showMicWarning('Tuning paused. Tap Start tuning when you return.'); }
  }, { signal: events.signal });
  window.addEventListener('pagehide', teardownTuner, { signal: events.signal });
}
export function teardownTuner() {
  if (!initialized) return;
  initialized = false; referenceTone.destroy(); stopMic(); events?.abort();
  drums?.destroy(); drums = null;
  ui?.destroy?.(); ui = null; engine = null;
}
