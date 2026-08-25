import {
  METRO_BPM,
  METRO_COPY,
  METRO_SETLIST
} from '../../../settings/metronome.config';
import { showToast } from '../toast.js';
import {
  metroState,
  restore,
  clampBpm,
  getTimeSignature,
  getSubdivision,
  setBpm,
  setTimeSignature,
  setCustomTimeSig,
  setSubdivision,
  setSound,
  setVolume,
  setAccentFirst,
  setFlash,
  setVibrate,
  setBeatStyle,
  setCoachTab,
  setCoachInner,
  setCoachSpeed,
  setCoachRhythm,
  setCoachPrimer,
  setMidiDeviceId
} from './metroState.js';
import { createMetroEngine } from './audioEngine.js';
import { createUi } from './uiBindings.js';
import { createCoachEngine } from './coachEngine.js';
import { createSheetController } from './sheetController.js';
import { connectMidi, selectMidiInput, disconnectMidi, isMidiSupported } from './midiManager.js';
import { METRO_SUBDIVISIONS } from '../../../settings/metronome.config';

let initialized = false;
let engine = null;
let ui = null;
let coachEngine = null;
let sheetController = null;
/* Bumped by every start attempt and every stop — captured by in-flight
   async starts so a rapid toggle/stop while the audio context is still
   resuming can never resurrect a stale run */
let startGeneration = 0;

/* Tap tempo: average of the last few inter-tap intervals inside a 2s window */
const TAP_WINDOW_MS = 2000;
const TAP_MAX_SAMPLES = 5;
const tapTimes = [];

function onVisualBeat(evt) {
  ui.renderBeat(evt.beatInBar);
  if (sheetController) sheetController.onBeat();
  if (coachEngine && coachEngine.isRunning()) {
    coachEngine.handleBeat(evt.beatInBar, evt.isAccent);
  }
}

function onAudioInterruption(state) {
  /* OS-level pause (iOS call / screen lock). The engine auto-resumes when
     the OS allows; report honestly either way instead of faking playback. */
  if (state === 'interrupted') showToast(METRO_COPY.audioInterrupted, 'warning');
  else if (state === 'resumed') showToast(METRO_COPY.audioResumed, 'success');
}

async function startMetronome() {
  if (metroState.playing || metroState.starting) return false;
  metroState.starting = true;
  const gen = ++startGeneration;
  try {
    await engine.start({
      bpm: metroState.bpm,
      perBeat: getSubdivision().perBeat,
      beatsPerBar: getTimeSignature().beatsPerBar,
      accentFirst: metroState.accentFirst,
      vibrate: metroState.vibrate,
      onVisualBeat,
      onInterruption: onAudioInterruption
    });
    if (gen !== startGeneration) {
      /* stopped or re-toggled while the context was resuming — never
         surface a run the user already cancelled */
      try { engine.stop(); } catch (e) {}
      return false;
    }
    engine.setVolume(metroState.volume);
    metroState.playing = true;
  } catch (err) {
    if (gen !== startGeneration) return false;
    metroState.playing = false;
    if (err && err.code === 'unsupported') {
      showToast(METRO_COPY.webAudioUnsupported, 'warning');
    } else if (err && err.code === 'blocked') {
      showToast(METRO_COPY.audioBlocked, 'warning');
    } else {
      showToast('Metronome failed to start — try again.', 'warning');
    }
  } finally {
    metroState.starting = false;
  }
  ui.renderPlayState(metroState.playing);
  if (sheetController && metroState.playing) sheetController.onPlaybackStarted();
  return metroState.playing;
}

function stopMetronome() {
  /* Invalidate any in-flight async start BEFORE anything else so a stop
     racing a resuming context can never resurrect the run */
  startGeneration++;
  if (!metroState.playing && !engine.playing) {
    metroState.playing = false;
    ui.renderPlayState(false);
    ui.resetBeatIndicator();
    if (sheetController) sheetController.onPlaybackStopped();
    return;
  }
  engine.stop();
  metroState.playing = false;
  ui.renderPlayState(false);
  ui.resetBeatIndicator();
  if (sheetController) sheetController.onPlaybackStopped();
}

function onPlayToggle() {
  if (metroState.playing) {
    stopMetronome();
  } else {
    void startMetronome();
  }
}

function applyBpm(next, source = 'user') {
  const didChange = setBpm(next);
  if (didChange) {
    engine.updateBpm(metroState.bpm);
    ui.renderBpm();
    if (source !== 'setlist' && source !== 'undo' && source !== 'coach' && source !== 'init') {
      ui.notifyBpmChangedFromUser(metroState.bpm);
    }
  }
}

function onBpmStep(delta) {
  applyBpm(metroState.bpm + delta, 'user');
}

function onBpmSet(value) {
  applyBpm(value, 'user');
}

function onTapTempo() {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > TAP_WINDOW_MS) {
    tapTimes.length = 0;
  }
  tapTimes.push(now);
  if (tapTimes.length > TAP_MAX_SAMPLES) tapTimes.shift();
  if (tapTimes.length < 2) return;
  let sum = 0;
  for (let i = 1; i < tapTimes.length; i++) {
    sum += tapTimes[i] - tapTimes[i - 1];
  }
  const avg = sum / (tapTimes.length - 1);
  applyBpm(60000 / avg, 'user');
}

function onTsSelect(index) {
  if (!setTimeSignature(index)) return;
  engine.updateOptions({ beatsPerBar: getTimeSignature().beatsPerBar });
  ui.rebuildBeatDots();
  ui.renderPills();
  ui.renderSheetDisplays();
  ui.renderChipStates();
  ui.resetBeatIndicator();
}

function onCustomTsSelect(beats, unit) {
  if (!setCustomTimeSig(beats, unit)) return;
  engine.updateOptions({ beatsPerBar: getTimeSignature().beatsPerBar });
  ui.rebuildBeatDots();
  ui.renderPills();
  ui.renderSheetDisplays();
  ui.renderChipStates();
  ui.resetBeatIndicator();
  showToast(`Time signature set to ${beats}/${unit}`, 'success');
}

function onSubSelect(index) {
  if (!setSubdivision(index)) return;
  engine.updateOptions({ perBeat: getSubdivision().perBeat });
  ui.renderPills();
  ui.renderSheetDisplays();
  ui.renderChipStates();
}

function onSoundSelect(id) {
  if (setSound(id)) {
    engine.updateSound(id); /* worklet path needs the new sound pushed */
    ui.renderChipStates();
  }
}

function onVolumeChange(value, persist) {
  setVolume(value, persist !== false);
  engine.setVolume(value);
}

function onAccentToggle(enabled) {
  setAccentFirst(enabled);
  engine.updateOptions({ accentFirst: !!enabled });
}

function onFlashToggle(enabled) {
  setFlash(enabled);
}

function onVibrateToggle(enabled) {
  setVibrate(enabled);
  engine.updateOptions({ vibrate: !!enabled });
}

function onBeatStyleChange(style) {
  setBeatStyle(style);
  ui.renderBeatStyle();
  ui.rebuildBeatDots();
  ui.resetBeatIndicator();
}

function onSetlistSelect(arg) {
  let entry = null;
  if (arg && typeof arg === 'object' && typeof arg.bpm === 'number' && typeof arg.title === 'string') {
    entry = arg;
  } else if (typeof arg === 'number') {
    entry = METRO_SETLIST[arg] || null;
  }
  if (!entry) return;
  applyBpm(entry.bpm, 'setlist');
  ui.showTopbarTitle(entry);
  if (sheetController) sheetController.setCurrentSong(entry);
  closeAnySheet();
  showToast(METRO_COPY.setlistLoaded(entry.bpm, entry.title), 'success');
}

function onInstrumentOpen() {
  ui.openSheet(ui.panelInstrument, ui.instrumentBtn);
}

function onInstrumentSelect(id) {
  if (!sheetController) return;
  sheetController.selectInstrument(id);
  setTimeout(() => closeAnySheet(), 350);
}

function onSheetClear() {
  if (sheetController) sheetController.clearCurrentSheet();
}

function onTopbarUndo(entry) {
  if (!entry) return;
  ui.setRestoringFlag(true);
  applyBpm(entry.bpm, 'undo');
  ui.showTopbarTitle(entry);
  setTimeout(() => ui.setRestoringFlag(false), 60);
  showToast(`Restored ${entry.bpm} BPM — ${entry.title}`, 'success');
}

function onInfoHelp(key) {
  const msg = METRO_COPY[key];
  if (msg) showToast(msg, 'info');
}

function closeAnySheet() {
  if (ui.isSheetOpen) ui.closeSheet();
}

function stopEverything() {
  ui.clearRepeat();
  if (coachEngine && coachEngine.isRunning()) {
    coachEngine.stop();
    ui.exitCoachLive();
  }
  /* ALWAYS restore the user's volume — the inner-clock trainer mutes the
     master gain, and any stop path that leaves it at 0 makes the next
     start silently broken (mute-leak fix) */
  engine.setVolume(metroState.volume);
  if (metroState.playing || engine.playing) stopMetronome();
}

// ---------- Coach bridge ----------

function onCoachTabChange(tabId) {
  setCoachTab(tabId);
}

function onCoachInnerChange(patch) {
  setCoachInner(patch);
  ui.renderCoachInner();
}

function onCoachSpeedChange(patch) {
  setCoachSpeed(patch);
  ui.renderCoachSpeed();
}

function onCoachRhythmChange(patch) {
  setCoachRhythm(patch);
  ui.renderCoachRhythm();
}

function onCoachPrimerChange(patch) {
  setCoachPrimer(patch);
  ui.renderCoachPrimer();
}

async function onCoachStart(tabId) {
  setCoachTab(tabId);
  ui.selectCoachTab(tabId);
  // ensure metronome is playing for audible trainers; primer may be silent but still keep clock
  if (!metroState.playing) {
    const ok = await startMetronome();
    if (!ok) {
      showToast('Start failed — check audio permissions', 'error');
      return;
    }
  }
  if (coachEngine) {
    coachEngine.start(tabId);
    ui.enterCoachLive(tabId);
    const snap = coachEngine.getLive();
    if (snap) ui.renderCoachLive(snap);
    showToast(`${tabId.replace('-',' ')} live — stay on pulse`, 'success');
  }
}

function onCoachStop() {
  if (coachEngine) coachEngine.stop();
  ui.exitCoachLive();
  engine.setVolume(metroState.volume);
  stopMetronome();
  showToast('Training stopped', 'info');
}

function onCoachExpand() {
  // open menu back up — keep live running, just reopen coach sheet for editing
  ui.openSheet(ui.panelCoach, ui.coachBtn);
  showToast('Coach settings — live keeps running', 'info');
}

function onCoachTick(snapshot) {
  ui.renderCoachLive(snapshot);
}

function applyCoachBpm(bpm) {
  if (setBpm(bpm, true)) {
    engine.updateBpm(metroState.bpm);
    ui.renderBpm();
  } else {
    engine.updateBpm(metroState.bpm);
  }
}

function applyCoachSubdivision(id) {
  const idx = METRO_SUBDIVISIONS.findIndex((s) => s.id === id);
  if (idx !== -1) {
    if (setSubdivision(idx)) {
      engine.updateOptions({ perBeat: METRO_SUBDIVISIONS[idx].perBeat });
      ui.renderPills();
      ui.renderSheetDisplays();
      ui.renderChipStates();
    } else {
      engine.updateOptions({ perBeat: METRO_SUBDIVISIONS[idx].perBeat });
      ui.renderChipStates();
    }
  }
}

function setCoachMuted(muted) {
  if (muted) engine.setVolume(0);
  else engine.setVolume(metroState.volume);
}

function onPrimerTap(time) {
  /* Taps only count inside a live tempo-primer session. The old implicit
     auto-start here could silently spin up a session from a MIDI pad hit
     with no UI feedback and no audio running — removed. */
  const liveSnap = coachEngine ? coachEngine.getLive() : null;
  if (!coachEngine || !coachEngine.isRunning() || !liveSnap || liveSnap.tabId !== 'tempo-primer') {
    return;
  }
  const result = coachEngine.handlePrimerTap(time);
  const snap = coachEngine.getLive();
  if (snap) ui.renderCoachLive(snap);
  if (result) {
    showToast(`${result.grade}: ${result.recalled} BPM (Δ ${result.delta>0?'+':''}${result.delta})`, result.grade==='PERFECT' || result.grade==='GREAT' ? 'success' : 'info');
  }
}

function onPrimerRetry() {
  if (coachEngine) {
    coachEngine.primerRetry();
    const snap = coachEngine.getLive();
    ui.renderCoachLive(snap);
  }
}

function onPrimerNewTarget() {
  if (coachEngine) {
    const nt = coachEngine.primerNewTarget();
    if (nt) {
      setCoachPrimer({ target: nt });
      ui.renderCoachPrimer();
      const snap = coachEngine.getLive();
      ui.renderCoachLive(snap);
      showToast(`New target: ${nt} BPM`, 'info');
    }
  }
}

async function onMidiConnect() {
  if (!isMidiSupported()) {
    showToast(METRO_COPY.midiNoSupport, 'error');
    return;
  }
  const res = await connectMidi(metroState.midiDeviceId);
  if (res && res.status === 'connected') showToast(`MIDI connected: ${res.activeId}`, 'success');
  else if (res && res.status === 'no-inputs') showToast('No MIDI inputs found — connect a pad', 'warning');
  else if (res && res.status === 'error') showToast('MIDI connect failed', 'error');
  ui.renderMidiState(res || { status: metroState.midiStatus });
  ui.renderCoachPrimer();
}

function onMidiDisconnect() {
  disconnectMidi();
  showToast('MIDI disconnected', 'info');
  ui.renderMidiState({ status: 'disconnected', inputs: [], activeId: null });
  ui.renderCoachPrimer();
}

function onMidiSelect(id) {
  const ok = selectMidiInput(id);
  if (ok) {
    showToast('MIDI input selected', 'success');
    ui.renderCoachPrimer();
  }
}

export function initMetronome() {
  if (initialized) return;
  initialized = true;

  restore();
  engine = createMetroEngine();
  try {
    if (new URLSearchParams(window.location.search).has('metrodebug')) {
      window.__metroDebug = () => engine.getDebugState();
      initDebugOverlay(() => engine.getDebugState());
    }
  } catch (e) {}
  coachEngine = createCoachEngine({
    onCoachTick,
    applyBpm: applyCoachBpm,
    applySubdivision: applyCoachSubdivision,
    setMuted: setCoachMuted
  });
  sheetController = createSheetController({
    onSheetToast: (msg, kind) => showToast(msg, kind || 'info'),
    onSheetClear,
    onSheetUploadedLocal: null
  });
  ui = createUi({
    onPlayToggle,
    onTapTempo,
    onBpmStep,
    onBpmSet,
    onTsOpen: () => ui.openSheet(ui.panelTs, ui.tsPill),
    onSubOpen: () => ui.openSheet(ui.panelSub, ui.subPill),
    onSetlistOpen: () => ui.openSheet(ui.panelSetlist, ui.setlistBtn),
    onSettingsOpen: () => ui.openSheet(ui.panelSettings, ui.settingsBtn),
    onCoachOpen: () => ui.openSheet(ui.panelCoach, ui.coachBtn),
    onTsSelect,
    onCustomTsSelect,
    onSubSelect,
    onSoundSelect,
    onVolumeChange,
    onAccentToggle,
    onFlashToggle,
    onVibrateToggle,
    onBeatStyleChange,
    onSetlistSelect,
    onInfoHelp,
    onCoachTabChange,
    onCoachInnerChange,
    onCoachSpeedChange,
    onCoachRhythmChange,
    onCoachPrimerChange,
    onCoachStart,
    onCoachStop,
    onCoachExpand,
    onPrimerTap,
    onPrimerRetry,
    onPrimerNewTarget,
    onMidiConnect,
    onMidiDisconnect,
    onMidiSelect,
    onTopbarUndo,
    onInstrumentOpen,
    onInstrumentSelect,
    onSheetClear
  });
  ui.init();

  sheetController.init({
    ui,
    strip: document.getElementById('metroSheetStrip'),
    track: document.getElementById('metroSheetTrack'),
    title: document.getElementById('metroSheetStripTitle'),
    bpmBadge: document.getElementById('metroSheetStripBpm'),
    uploadBtn: document.getElementById('metroSheetStripUpload'),
    fileInput: document.getElementById('metroSheetFileInput'),
    toggles: document.getElementById('metroSheetToggles'),
    followBtn: document.getElementById('metroSheetFollowBtn'),
    loopBtn: document.getElementById('metroSheetLoopBtn'),
    clearBtn: document.getElementById('metroSheetClearBtn'),
    instrumentLabel: document.getElementById('metroInstrumentLabel'),
    instrumentIcon: document.getElementById('metroInstrumentIcon'),
    instrumentUploadLabel: document.querySelector('.metro-instrument-upload'),
    instrumentFileInput: document.getElementById('metroInstrumentFileInput'),
    instrumentClearBtn: document.getElementById('metroInstrumentClearBtn')
  });
  try {
    const sb = (import.meta && import.meta.env && import.meta.env.PUBLIC_SUPABASE_URL) || '';
    if (sb) sheetController.supabaseUrl = sb;
  } catch (e) {}
  sheetController.renderInstrumentButton();

  window.addEventListener('pagehide', stopEverything);
  window.addEventListener('pagehide', () => {
    if (sheetController) sheetController.teardown();
  });
  document.addEventListener('visibilitychange', () => {
    /* Background tabs throttle timers to ~1s which destroys the lookahead
       schedule — stop honestly instead of letting the click break up.
       stopEverything also restores user volume, so an inner-clock MUTED
       phase can never leak into the next run (mute-leak fix). */
    if (document.hidden) stopEverything();
  });
  window.addEventListener('kins:midi-tap', (e) => {
    const t = e.detail && e.detail.time ? e.detail.time : performance.now();
    onPrimerTap(t);
  });
}

/* ---------- metrodebug diagnostics chip ----------
   Dev-only scheduler health readout next to the window.__metroDebug test
   hook. Deliberately inline-styled and self-contained so it ships zero
   bytes to prod CSS; unreachable without ?metrodebug=1. */
function initDebugOverlay(getState) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;background:#000;color:#F2FD43;'
    + 'font:11px/1.6 ui-monospace,monospace;padding:6px 10px;border:2px solid #F2FD43;'
    + 'border-radius:4px;pointer-events:none;white-space:pre;margin:0;';
  document.body.appendChild(el);
  const render = () => {
    let s;
    try { s = getState(); } catch (e) { return; }
    if (!s) return;
    const inflight = Math.max(0, s.scheduledTotal - s.firedBeats);
    el.textContent =
      `mode=${s.mode} ctx=${s.ctxState} playing=${s.playing} bpm=${s.bpm}\n` +
      `sched=${s.scheduledTotal} fired=${s.firedBeats} inflight=${inflight}\n` +
      `pendSrc=${s.pendingSources} visQ=${s.visualQueued} nextIn=${s.nextClickInMs}ms\n` +
      `tickD=${s.lastTickDeltaMs}ms maxD=${s.maxTickDeltaMs}ms n=${s.ticks}`;
  };
  render();
  setInterval(() => { if (!document.hidden) render(); }, 250);
}
