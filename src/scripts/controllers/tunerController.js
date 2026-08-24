import {
  TUNER_INSTRUMENTS,
  TUNER_COPY,
  TONE_GEN_MIN_HZ,
  TONE_GEN_MAX_HZ
} from '../../settings/tuner.config';

const STORAGE_KEY_INSTRUMENT = 'kins-tuner-instrument';
const STORAGE_KEY_PRESET_PREFIX = 'kins-tuner-preset-';
const RMS_GATE = 0.008;
const CLARITY_GATE = 0.3;
const MIN_DETECT_HZ = 28;
const MAX_DETECT_HZ = 2100;
const IN_TUNE_CENTS = 5;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const state = {
  instrumentId: 'acoustic',
  presetIndex: 0,
  stringIndex: 0,
  audioCtx: null,
  analyser: null,
  micSourceNode: null,
  micStream: null,
  timeBuf: null,
  corrBuf: null,
  rafId: null,
  isDetecting: false,
  lastDetectTs: 0,
  toneOsc: null,
  toneGain: null,
  toneKind: null,
  isTonePlaying: false
};

let initialized = false;
let els = null;
let reducedMotion = false;

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function midiFromFreq(freq) {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

function noteName(midi) {
  return NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

function centsOff(freq, target) {
  return Math.floor(1200 * Math.log2(freq / target));
}

function activeGroup() {
  return TUNER_INSTRUMENTS.find((g) => g.id === state.instrumentId) || TUNER_INSTRUMENTS[0];
}

function activePreset() {
  const group = activeGroup();
  return group.presets[state.presetIndex] || group.presets[0];
}

function activeString() {
  const preset = activePreset();
  return preset.strings[state.stringIndex] || preset.strings[0];
}

function detectPitch(buf, sampleRate) {
  const n = buf.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / n);
  if (rms < RMS_GATE) return { freq: -1, clarity: 0 };

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_DETECT_HZ));
  const maxLag = Math.min(n - 4, Math.ceil(sampleRate / MIN_DETECT_HZ));
  if (maxLag <= minLag) return { freq: -1, clarity: 0 };

  if (!state.corrBuf || state.corrBuf.length < maxLag + 2) {
    state.corrBuf = new Float32Array(maxLag + 2);
  }
  const c = state.corrBuf;

  let c0 = 0;
  for (let i = 0; i < n; i += 2) c0 += buf[i] * buf[i];

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i += 2) sum += buf[i] * buf[i + lag];
    c[lag] = sum;
  }

  let globalMax = 0;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (c[lag] > globalMax) globalMax = c[lag];
  }
  if (globalMax <= 0 || c0 <= 0) return { freq: -1, clarity: 0 };

  let peakLag = -1;
  const peakThreshold = globalMax * 0.92;
  for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
    if (c[lag] > c[lag - 1] && c[lag] >= c[lag + 1] && c[lag] >= peakThreshold) {
      peakLag = lag;
      break;
    }
  }
  if (peakLag < 0) return { freq: -1, clarity: 0 };

  const clarity = c[peakLag] / c0;
  if (clarity < CLARITY_GATE) return { freq: -1, clarity };

  const x1 = c[peakLag - 1];
  const x2 = c[peakLag];
  const x3 = c[peakLag + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const refined = a !== 0 ? peakLag - b / (2 * a) : peakLag;
  const freq = sampleRate / refined;
  if (!(freq >= MIN_DETECT_HZ && freq <= MAX_DETECT_HZ)) return { freq: -1, clarity };
  return { freq, clarity };
}

function resetReadout() {
  if (!els) return;
  els.note.textContent = '--';
  els.freq.textContent = '-- Hz';
  els.status.textContent = 'Press START MIC TUNING, then play your loudest open string.';
  els.panel.classList.remove('in-tune', 'off-pitch');
  els.needle.style.transform = 'rotate(0deg)';
}

function updateReadout(result) {
  if (!result || result.freq < 0) {
    els.note.textContent = '--';
    els.freq.textContent = '-- Hz';
    els.status.textContent = state.isDetecting ? 'Listening...' : '';
    els.panel.classList.remove('in-tune', 'off-pitch');
    els.needle.style.transform = 'rotate(0deg)';
    return;
  }

  const target = activeString();
  const midi = midiFromFreq(result.freq);
  const cents = centsOff(result.freq, target.freq);

  els.note.textContent = noteName(midi);
  els.freq.textContent = result.freq.toFixed(1) + ' Hz';

  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    els.status.textContent = TUNER_COPY.inTune;
    els.panel.classList.add('in-tune');
    els.panel.classList.remove('off-pitch');
  } else {
    els.status.textContent = (cents < 0 ? TUNER_COPY.tooFlat : TUNER_COPY.tooSharp) + ' ' + Math.abs(cents) + '\u00A2';
    els.panel.classList.add('off-pitch');
    els.panel.classList.remove('in-tune');
  }

  const deg = (clamp(cents, -50, 50) / 50) * 45;
  els.needle.style.transform = 'rotate(' + deg + 'deg)';
}

function detectionLoop(ts) {
  if (!state.isDetecting) return;
  state.rafId = requestAnimationFrame(detectionLoop);
  const interval = reducedMotion ? 100 : 50;
  if (ts - state.lastDetectTs < interval) return;
  state.lastDetectTs = ts;
  if (document.hidden || !state.analyser || !state.timeBuf || !state.audioCtx) return;
  state.analyser.getFloatTimeDomainData(state.timeBuf);
  const result = detectPitch(state.timeBuf, state.audioCtx.sampleRate);
  updateReadout(result);
}

function setMicButton(active) {
  if (!els) return;
  els.micBtn.textContent = active ? 'STOP MIC TUNING' : 'START MIC TUNING';
}

function stopMic() {
  state.isDetecting = false;
  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  if (state.micStream) {
    state.micStream.getTracks().forEach((track) => track.stop());
    state.micStream = null;
  }
  if (state.micSourceNode) {
    try { state.micSourceNode.disconnect(); } catch (e) {}
    state.micSourceNode = null;
  }
  state.analyser = null;
  state.timeBuf = null;
  setMicButton(false);
  resetReadout();
}

async function startMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    els.micWarning.textContent = 'This browser does not support microphone input.';
    els.micWarning.hidden = false;
    return;
  }
  els.micWarning.hidden = true;
  try {
    state.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
  } catch (err) {
    console.error('KINS Tuner microphone error:', err);
    els.micWarning.textContent = TUNER_COPY.micDenied;
    els.micWarning.hidden = false;
    setMicButton(false);
    return;
  }
  ensureAudioCtx();
  stopTone();
  state.micSourceNode = state.audioCtx.createMediaStreamSource(state.micStream);
  state.analyser = state.audioCtx.createAnalyser();
  state.analyser.fftSize = 4096;
  state.micSourceNode.connect(state.analyser);
  state.timeBuf = new Float32Array(state.analyser.fftSize);
  state.isDetecting = true;
  setMicButton(true);
  state.lastDetectTs = 0;
  els.status.textContent = 'Listening...';
  state.rafId = requestAnimationFrame(detectionLoop);
}

function ensureAudioCtx() {
  if (!state.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new Ctx();
  }
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume().catch(() => {});
  }
  return state.audioCtx;
}

function stopTone() {
  const osc = state.toneOsc;
  const gain = state.toneGain;
  state.toneOsc = null;
  state.toneGain = null;
  state.toneKind = null;
  state.isTonePlaying = false;
  updateToneButtons();
  if (!osc || !gain || !state.audioCtx) return;
  try {
    const now = state.audioCtx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.stop(now + 0.1);
  } catch (e) {}
}

function startTone(kind, freq) {
  const ctx = ensureAudioCtx();
  stopTone();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.onended = () => {
    if (state.toneOsc === osc) {
      state.toneOsc = null;
      state.toneGain = null;
      state.toneKind = null;
      state.isTonePlaying = false;
      updateToneButtons();
    }
  };
  osc.start();
  state.toneOsc = osc;
  state.toneGain = gain;
  state.toneKind = kind;
  state.isTonePlaying = true;
  updateToneButtons();
}

function updateToneButtons() {
  if (!els) return;
  els.refBtn.textContent = state.toneKind === 'ref' ? 'STOP REFERENCE TONE' : 'PLAY REFERENCE TONE';
  els.toneToggleBtn.textContent = state.toneKind === 'manual' ? 'STOP MANUAL TONE' : 'PLAY MANUAL TONE';
}

function stopEverything() {
  stopTone();
  if (state.isDetecting) stopMic();
}

function renderPresetChips() {
  const group = activeGroup();
  els.presetRow.replaceChildren();
  group.presets.forEach((preset, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tuner-chip brutal-press' + (index === state.presetIndex ? ' active' : '');
    chip.setAttribute('data-track', 'tuner:preset_' + preset.id);
    chip.setAttribute('aria-pressed', index === state.presetIndex ? 'true' : 'false');
    chip.textContent = preset.name;
    chip.addEventListener('click', () => selectPreset(index));
    els.presetRow.appendChild(chip);
  });
}

function renderStringChips() {
  const preset = activePreset();
  els.stringRow.replaceChildren();
  preset.strings.forEach((string, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tuner-chip brutal-press' + (index === state.stringIndex ? ' active' : '');
    chip.setAttribute('data-track', 'tuner:string_' + string.note);
    chip.setAttribute('aria-pressed', index === state.stringIndex ? 'true' : 'false');
    chip.textContent = string.label + ' \u00B7 ' + string.note;
    chip.addEventListener('click', () => {
      state.stringIndex = index;
      renderStringChips();
    });
    els.stringRow.appendChild(chip);
  });
}

function applyInstrument(instrumentId, savedPresetIndex) {
  state.instrumentId = instrumentId;
  const group = activeGroup();

  els.tabs.forEach((tab) => {
    const isActive = tab.getAttribute('data-instrument') === instrumentId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  els.blurb.textContent = group.blurb;

  if (instrumentId === 'drums') {
    state.presetIndex = 0;
    state.stringIndex = 0;
    els.lowMicHint.textContent = TUNER_COPY.lowMicWarning;
    els.lowMicHint.hidden = false;
  } else {
    const saved = Number.parseInt(savedPresetIndex ?? '', 10);
    state.presetIndex = Number.isFinite(saved)
      ? clamp(saved, 0, group.presets.length - 1)
      : 0;
    state.stringIndex = 0;
    els.lowMicHint.hidden = true;
  }

  renderPresetChips();
  renderStringChips();
  resetReadout();
}

function selectInstrument(instrumentId, options) {
  const save = !options || options.save !== false;
  applyInstrument(
    instrumentId,
    storageGet(STORAGE_KEY_PRESET_PREFIX + instrumentId)
  );
  if (save) {
    storageSet(STORAGE_KEY_INSTRUMENT, instrumentId);
    storageSet(STORAGE_KEY_PRESET_PREFIX + instrumentId, String(state.presetIndex));
  }
}

function selectPreset(index) {
  state.presetIndex = index;
  state.stringIndex = 0;
  renderPresetChips();
  renderStringChips();
  storageSet(STORAGE_KEY_PRESET_PREFIX + state.instrumentId, String(index));
}

function cacheElements() {
  els = {
    panel: document.getElementById('tunerReadoutPanel'),
    needle: document.getElementById('tunerNeedle'),
    note: document.getElementById('tunerDetectedNote'),
    status: document.getElementById('tunerStatusLine'),
    freq: document.getElementById('tunerDetectedFreq'),
    lowMicHint: document.getElementById('tunerLowMicHint'),
    micBtn: document.getElementById('tunerMicBtn'),
    micWarning: document.getElementById('tunerMicWarning'),
    refBtn: document.getElementById('tunerPlayRefBtn'),
    toneSlider: document.getElementById('tunerToneSlider'),
    toneLabel: document.getElementById('tunerToneFreqLabel'),
    toneToggleBtn: document.getElementById('tunerToneToggleBtn'),
    presetRow: document.getElementById('tunerPresetRow'),
    stringRow: document.getElementById('tunerStringRow'),
    blurb: document.getElementById('tunerInstrumentBlurb'),
    tabs: Array.from(document.querySelectorAll('.tuner-tab-btn'))
  };
}

export function initTuner() {
  if (initialized) return;
  cacheElements();
  if (!els.panel || !els.micBtn || !els.needle) return;
  initialized = true;

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      selectInstrument(tab.getAttribute('data-instrument'));
    });
  });

  els.micBtn.addEventListener('click', () => {
    if (state.isDetecting) {
      stopMic();
    } else {
      startMic();
    }
  });

  els.refBtn.addEventListener('click', () => {
    if (state.toneKind === 'ref') {
      stopTone();
    } else {
      startTone('ref', activeString().freq);
    }
  });

  els.toneToggleBtn.addEventListener('click', () => {
    if (state.toneKind === 'manual') {
      stopTone();
    } else {
      startTone('manual', clamp(parseFloat(els.toneSlider.value) || 110, TONE_GEN_MIN_HZ, TONE_GEN_MAX_HZ));
    }
  });

  els.toneSlider.addEventListener('input', () => {
    const value = clamp(parseFloat(els.toneSlider.value) || 110, TONE_GEN_MIN_HZ, TONE_GEN_MAX_HZ);
    els.toneLabel.textContent = value + ' Hz';
    if (state.toneKind === 'manual' && state.toneOsc && state.audioCtx) {
      state.toneOsc.frequency.value = value;
    }
  });

  window.addEventListener('pagehide', stopEverything);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopEverything();
  });

  const savedInstrument = storageGet(STORAGE_KEY_INSTRUMENT);
  const isValid = TUNER_INSTRUMENTS.some((group) => group.id === savedInstrument);
  selectInstrument(isValid ? savedInstrument : TUNER_INSTRUMENTS[0].id, { save: false });
}
