import {
  METRO_BPM,
  METRO_COPY,
  METRO_SETLIST,
  METRO_TIME_SIGNATURES,
  METRO_SUBDIVISIONS
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
  setKeepAwake,
  setBackgroundPlay,
  setBeatStyle,
  cycleBeatTier,
  resetBeatTiers,
  resetLevelColors,
  syncBeatTiersLength,
  setCoachTab,
  setCoachInner,
  setCoachSpeed,
  setCoachRhythm,
  setCoachPrimer,
  setMidiDeviceId,
  getSetlistById
} from './metroState.js';
import { createMetroEngine } from './audioEngine.js';
import { createUi } from './uiBindings.js';
import { createCoachEngine } from './coachEngine.js';
import { createMediaSessionManager } from './mediaSessionManager.js';
import { connectMidi, selectMidiInput, disconnectMidi, isMidiSupported } from './midiManager.js';

let initialized = false;
let engine = null;
let ui = null;
let coachEngine = null;
let media = null;
/* Bumped by every start attempt and every stop — captured by in-flight
   async starts so a rapid toggle/stop while the audio context is still
   resuming can never resurrect a stale run */
let startGeneration = 0;

/* Tap tempo: average of the last few inter-tap intervals inside a 2s window */
const TAP_WINDOW_MS = 2000;
const TAP_MAX_SAMPLES = 5;
const tapTimes = [];

function onVisualBeat(evt) {
  ui.renderBeat(evt.beatInBar, evt.tier);
  if (coachEngine && coachEngine.isRunning()) {
    coachEngine.handleBeat(evt.beatInBar, evt.isAccent, evt.isBeatStart);
  }

  // Handle bar progression and transitions on downbeat (beatInBar === 0).
  // Guard with isBeatStart so subdivisions (multiple clicks per beat)
  // don't advance the bar counter multiple times per physical beat.
  if (evt.isBeatStart !== false && evt.beatInBar === 0 && (metroState.activeSetlist || metroState.activeSong)) {
    handlePlaybackBarProgress();
  }
}

function handlePlaybackBarProgress() {
  const song = metroState.activeSong;
  if (!song) return;

  // 1. If currently in count-in (1-bar count-in)
  if (metroState.isCountIn) {
    metroState.isCountIn = false;
    metroState.currentSectionIdx = 0;
    metroState.currentSectionBar = 1;
    if (song.structure && song.structure.length > 0) {
      applySectionParameters(song.structure[0], song);
    }
    ui.renderTopbarPlayback();
    ui.renderSetlistDeck();
    return;
  }

  // 2. If song has structure
  if (song.structure && song.structure.length > 0) {
    const secIdx = metroState.currentSectionIdx || 0;
    const sec = song.structure[secIdx];
    if (!sec) return;

    if (metroState.currentSectionBar >= (Number(sec.bars) || 8)) {
      // Section completed! Advance section
      if (secIdx < song.structure.length - 1) {
        metroState.currentSectionIdx = secIdx + 1;
        metroState.currentSectionBar = 1;
        applySectionParameters(song.structure[metroState.currentSectionIdx], song);
      } else {
        // Last section of the song completed!
        handleSongCompletion();
      }
    } else {
      metroState.currentSectionBar++;
      ui.renderTopbarPlayback();
    }
  }
}

function handleSongCompletion() {
  if (metroState.activeSetlist && Array.isArray(metroState.activeSetlist.songs)) {
    const nextSongIdx = (metroState.activeSetlistSongIdx || 0) + 1;
    if (nextSongIdx < metroState.activeSetlist.songs.length) {
      // Advance to next song in setlist
      metroState.activeSetlistSongIdx = nextSongIdx;
      metroState.activeSong = metroState.activeSetlist.songs[nextSongIdx];
      startActiveSongPlayback();
    } else {
      // Setlist complete!
      stopMetronome();
      metroState.activeSetlist = null;
      metroState.activeSong = null;
      ui.renderTopbarPlayback();
      ui.renderSetlistDeck();
      showToast('Setlist complete!', 'success');
    }
  } else {
    // Single song complete!
    stopMetronome();
    metroState.activeSong = null;
    ui.renderTopbarPlayback();
    ui.renderSetlistDeck();
    showToast('Song complete!', 'success');
  }
}

function onAudioInterruption(state) {
  /* OS-level pause (iOS call / screen lock). The engine auto-resumes when
     the OS allows; report honestly either way instead of faking playback. */
  if (state === 'interrupted') {
    showToast(METRO_COPY.audioInterrupted, 'warning');
    if (media) media.markPaused();
    releaseWakeLock();
  } else if (state === 'resumed') {
    showToast(METRO_COPY.audioResumed, 'success');
    /* The clock jumped across the interruption — re-seat the schedule
       cursor and drop now-stale visual events so nothing bursts late. */
    engine.sync();
    if (media) media.activate(mediaSessionSnapshot());
    void reacquireWakeLock();
  }
}

/* ---------- OS media session (notification / lock-screen controls) ---------- */

function mediaSessionSnapshot() {
  return {
    bpm: metroState.bpm,
    timeSigLabel: getTimeSignature().label,
    onPlay: () => { void startMetronome(); },
    onPause: () => stopMetronome(),
    onStop: () => stopMetronome()
  };
}

/* ---------- Screen Wake Lock ("KEEP SCREEN ON") ----------

   Held only while playing AND the user opted in. The OS releases the lock
   on tab hide / screen lock — the sentinel's 'release' listener clears it
   so visibilitychange can re-acquire cleanly when we come back. */
let wakeLockSentinel = null;

function wakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

async function acquireWakeLockWithFeedback() {
  if (!wakeLockSupported()) return false;
  if (wakeLockSentinel) return true;
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
    return true;
  } catch (err) {
    wakeLockSentinel = null;
    if (err && err.name === 'NotSupportedError') {
      setKeepAwake(false);
      showToast(METRO_COPY.keepAwakeUnsupported, 'warning');
      ui.renderSettingsControls();
    }
    /* NotAllowedError = document not visible etc. — retried on visible */
    return false;
  }
}

async function reacquireWakeLock() {
  if (metroState.keepAwake && metroState.playing) await acquireWakeLockWithFeedback();
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    const sentinel = wakeLockSentinel;
    wakeLockSentinel = null;
    try { sentinel.release(); } catch (e) {}
  }
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
      tiers: metroState.beatTiers,
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
    if (media) media.activate(mediaSessionSnapshot());
    void reacquireWakeLock();
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
  return metroState.playing;
}

function stopMetronome() {
  /* Invalidate any in-flight async start BEFORE anything else so a stop
     racing a resuming context can never resurrect the run */
  startGeneration++;
  if (coachEngine && coachEngine.isRunning()) {
    coachEngine.stop();
    ui.exitCoachLive();
    engine.setVolume(metroState.volume);
  }
  if (!metroState.playing && !engine.playing) {
    metroState.playing = false;
    ui.renderPlayState(false);
    ui.resetBeatIndicator();
    return;
  }
  engine.stop();
  metroState.playing = false;
  ui.renderPlayState(false);
  ui.resetBeatIndicator();
  if (media) media.deactivate();
  releaseWakeLock();
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
    if (media) media.update(metroState.bpm, getTimeSignature().label);
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
  syncBeatTiersLength(getTimeSignature().beatsPerBar);
  engine.updateOptions({ beatsPerBar: getTimeSignature().beatsPerBar });
  engine.updateTiers(metroState.beatTiers);
  if (media) media.update(metroState.bpm, getTimeSignature().label);
  ui.rebuildBeatDots();
  ui.renderPills();
  ui.renderSheetDisplays();
  ui.renderChipStates();
  ui.resetBeatIndicator();
}

function onCustomTsSelect(beats, unit) {
  if (!setCustomTimeSig(beats, unit)) return;
  syncBeatTiersLength(getTimeSignature().beatsPerBar);
  engine.updateOptions({ beatsPerBar: getTimeSignature().beatsPerBar });
  engine.updateTiers(metroState.beatTiers);
  if (media) media.update(metroState.bpm, getTimeSignature().label);
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
    if (!metroState.playing && !engine.playing) {
      void engine.previewClick('mid', id);
    }
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

function onKeepAwakeToggle(enabled) {
  setKeepAwake(enabled);
  if (!enabled) {
    releaseWakeLock();
    return;
  }
  if (!wakeLockSupported()) {
    setKeepAwake(false);
    showToast(METRO_COPY.keepAwakeUnsupported, 'warning');
    ui.renderSettingsControls();
    return;
  }
  /* Wake Lock requires a visible document — while playing and visible we
     can acquire right away; otherwise startMetronome / visibilitychange
     will pick it up on the next play or return-to-visible. */
  if (metroState.playing && !document.hidden) void acquireWakeLockWithFeedback();
}

function onBackgroundToggle(enabled) {
  setBackgroundPlay(enabled);
}

function onBeatStyleChange(style) {
  setBeatStyle(style);
  ui.renderBeatStyle();
  ui.rebuildBeatDots();
  ui.resetBeatIndicator();
}

async function onPlaySetlist(setlistId) {
  const setlist = getSetlistById(setlistId);
  if (!setlist || !setlist.songs || setlist.songs.length === 0) {
    showToast('This setlist has no songs', 'warning');
    return;
  }
  // Mutual exclusion: cannot start setlist while a single song is active — require exit
  if (metroState.activeSong && !metroState.activeSetlist) {
    showToast('Exit current song playback first', 'warning');
    return;
  }
  stopEverything();
  metroState.activeSetlist = setlist;
  metroState.activeSetlistSongIdx = 0;
  metroState.activeSong = setlist.songs[0];

  await startActiveSongPlayback();
}

async function onPlaySong(song) {
  if (!song) return;
  // Mutual exclusion: cannot start single song while setlist is active — require exit
  if (metroState.activeSetlist) {
    showToast('Exit current setlist playback first', 'warning');
    return;
  }
  stopEverything();
  metroState.activeSetlist = null;
  metroState.activeSetlistSongIdx = 0;
  metroState.activeSong = song;

  await startActiveSongPlayback();
}

function onExitPlayback() {
  const wasSetlist = !!metroState.activeSetlist;
  const wasSong = !!metroState.activeSong;
  if (!wasSetlist && !wasSong) {
    showToast('Nothing to exit', 'info');
    return;
  }
  stopEverything();
  metroState.activeSetlist = null;
  metroState.activeSetlistSongIdx = 0;
  metroState.activeSong = null;
  metroState.currentSectionIdx = 0;
  metroState.currentSectionBar = 1;
  metroState.isCountIn = false;
  ui.renderTopbarPlayback();
  ui.renderSetlistDeck();
  showToast(wasSetlist ? 'Exited setlist playback' : 'Exited song playback', 'info');
}

async function startActiveSongPlayback() {
  const song = metroState.activeSong;
  if (!song) return;

  // Handle 1-bar count-in
  if (song.countIn) {
    metroState.isCountIn = true;
    metroState.currentSectionIdx = 0;
    metroState.currentSectionBar = 1;
  } else {
    metroState.isCountIn = false;
    metroState.currentSectionIdx = 0;
    metroState.currentSectionBar = 1;
  }

  // Set BPM and Time Sig for initial song / section
  const initialBpm = (song.structure && song.structure.length > 0 && song.structure[0].bpm) ? song.structure[0].bpm : song.bpm;
  const initialTs = (song.structure && song.structure.length > 0 && song.structure[0].timeSig) ? song.structure[0].timeSig : (song.timeSig || '4-4');

  applyBpm(initialBpm, 'setlist');
  if (initialTs) {
    const tsIdx = METRO_TIME_SIGNATURES.findIndex((ts) => ts.id === initialTs || ts.label === initialTs);
    if (tsIdx !== -1) {
      onTsSelect(tsIdx);
    }
  }

  ui.renderTopbarPlayback();
  ui.renderSetlistDeck();
  closeAnySheet();

  if (!metroState.playing) {
    await startMetronome();
  }
  /* metroState.bpm is the clamped value — initialBpm may be undefined for
     songs with no bpm and must never render as "undefined BPM" */
  showToast(`Playing “${song.title}” (${metroState.bpm} BPM)`, 'success');
}

function applySectionParameters(sec, song) {
  const targetBpm = sec.bpm || song.bpm;
  const targetTs = sec.timeSig || song.timeSig || '4-4';
  applyBpm(targetBpm, 'section');
  if (targetTs) {
    const tsIdx = METRO_TIME_SIGNATURES.findIndex((ts) => ts.id === targetTs || ts.label === targetTs);
    if (tsIdx !== -1) {
      onTsSelect(tsIdx);
    }
  }
  ui.renderTopbarPlayback();
  ui.renderSetlistDeck();
  showToast(`Section: ${sec.name} (${metroState.bpm} BPM)`, 'info');
}

function onPrevSong() {
  if (!metroState.activeSetlist || metroState.activeSetlistSongIdx <= 0) return;
  metroState.activeSetlistSongIdx--;
  metroState.activeSong = metroState.activeSetlist.songs[metroState.activeSetlistSongIdx];
  void startActiveSongPlayback();
}

function onNextSong() {
  if (!metroState.activeSetlist || metroState.activeSetlistSongIdx >= metroState.activeSetlist.songs.length - 1) return;
  metroState.activeSetlistSongIdx++;
  metroState.activeSong = metroState.activeSetlist.songs[metroState.activeSetlistSongIdx];
  void startActiveSongPlayback();
}

function onPrevSection() {
  const song = metroState.activeSong;
  if (!song || !song.structure || song.structure.length === 0) return;
  if ((metroState.currentSectionIdx || 0) <= 0) return;
  metroState.currentSectionIdx--;
  metroState.currentSectionBar = 1;
  metroState.isCountIn = false;
  applySectionParameters(song.structure[metroState.currentSectionIdx], song);
}

function onNextSection() {
  const song = metroState.activeSong;
  if (!song || !song.structure || song.structure.length === 0) return;
  if ((metroState.currentSectionIdx || 0) >= song.structure.length - 1) return;
  metroState.currentSectionIdx++;
  metroState.currentSectionBar = 1;
  metroState.isCountIn = false;
  applySectionParameters(song.structure[metroState.currentSectionIdx], song);
}

function onSetlistSelect(arg) {
  let entry = null;
  if (arg && typeof arg === 'object' && typeof arg.bpm === 'number' && typeof arg.title === 'string') {
    entry = arg;
  } else if (typeof arg === 'number') {
    entry = METRO_SETLIST[arg] || null;
  }
  if (!entry) return;
  if (coachEngine && coachEngine.isRunning()) {
    coachEngine.stop();
    ui.exitCoachLive();
    engine.setVolume(metroState.volume);
  }
  applyBpm(entry.bpm, 'setlist');

  // If entry specifies time signature, apply it
  if (entry.timeSig) {
    const tsIdx = METRO_TIME_SIGNATURES.findIndex((ts) => ts.id === entry.timeSig || ts.label === entry.timeSig);
    if (tsIdx !== -1) {
      onTsSelect(tsIdx);
    }
  }

  ui.showTopbarTitle(entry);
  closeAnySheet();
  showToast(METRO_COPY.setlistLoaded(entry.bpm, entry.title), 'success');
}

function onTierCycle(beatIndex) {
  const nextTier = cycleBeatTier(beatIndex);
  engine.updateTiers(metroState.beatTiers);
  void engine.previewClick(nextTier);
  ui.updateBeatDotTier(beatIndex, nextTier);
}

function onResetPitchMap() {
  resetBeatTiers();
  engine.updateTiers(metroState.beatTiers);
  ui.rebuildBeatDots();
  showToast(METRO_COPY.pitchMapResetToast || 'Pitch map reset to default', 'info');
}

function onTopbarUndo(entry) {
  if (!entry) return;
  if (coachEngine && coachEngine.isRunning()) {
    coachEngine.stop();
    ui.exitCoachLive();
    engine.setVolume(metroState.volume);
  }
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
    if (media) media.update(metroState.bpm, getTimeSignature().label);
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

function onMidiTapEvent(e) {
  const t = e.detail && e.detail.time ? e.detail.time : performance.now();
  onPrimerTap(t);
}

function onVisibilityChange() {
  if (document.hidden) {
    /* PLAY IN BACKGROUND off (default): background tabs throttle timers
       to ~1s which destroys the legacy lookahead schedule — stop
       honestly instead of letting the click break up. stopEverything
       also restores user volume, so an inner-clock MUTED phase can
       never leak into the next run (mute-leak fix).
       ON: keep running — the worklet path is immune to main-thread
       stalls and the legacy path widens its lookahead while hidden. */
    if (!metroState.backgroundPlay) stopEverything();
  } else if (metroState.playing || engine.playing) {
    /* Back in view: the context may have been suspended/interrupted by
       the OS, and the schedule cursor may predate the gap. Resume,
       re-seat the cursor, drop stale visual events, refresh media +
       wake lock state. */
    engine.resume();
    engine.sync();
    if (media) {
      if (metroState.playing) media.activate(mediaSessionSnapshot());
      else media.deactivate();
    }
    void reacquireWakeLock();
  }
}

export function initMetronome() {
  if (initialized) return;
  initialized = true;

  restore();
  engine = createMetroEngine();
  media = createMediaSessionManager();
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
  ui = createUi({
    getCurrentBpm: () => metroState.bpm,
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
    onKeepAwakeToggle,
    onBackgroundToggle,
    onBeatStyleChange,
    onSetlistSelect,
    onPlaySetlist,
    onPlaySong,
    onPrevSong,
    onPrevSection,
    onNextSection,
    onNextSong,
    onExitPlayback,
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
    onTierCycle,
    onResetPitchMap
  });
  ui.init();

  /* Named module-scope handlers so teardownMetronome can detach them —
     document/window objects survive Astro view-transition swaps, so
     anonymous listeners here would stack on every re-init. */
  window.addEventListener('pagehide', stopEverything);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('kins:midi-tap', onMidiTapEvent);
}

/* bfcache-safe pause: pagehide fires for back/forward navigations too,
   where the page (and this module's DOM wiring) will be restored intact.
   Stop audible playback but keep the controller alive — a full teardown
   here would double-bind every listener when the restored page re-inits. */
export function suspendForPageHide() {
  try { stopEverything(); } catch (e) {}
}

export function teardownMetronome() {
  stopEverything();
  disconnectMidi();
  /* Detach global listeners registered by initMetronome + ui.init() —
     document/window outlive view-transition swaps. */
  window.removeEventListener('pagehide', stopEverything);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('kins:midi-tap', onMidiTapEvent);
  if (ui && typeof ui.destroy === 'function') {
    try { ui.destroy(); } catch (e) {}
  }
  if (engine && typeof engine.destroy === 'function') {
    try { engine.destroy(); } catch (e) {}
  }
  /* engine.ctx was never reachable on the old API, so this close() was
     dead code and every init cycle leaked a full AudioContext (browsers
     cap ~6 → metronome permanently dead). engine.destroy() now closes
     the context, clears the hardware-check interval and terminates the
     scheduler worker. */
  engine = null;
  ui = null;
  coachEngine = null;
  media = null;
  initialized = false;
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
