import {
  TUNER_INSTRUMENTS,
  TUNER_STRING_GAUGES,
  DEFAULT_INSTRUMENT,
  MATERIAL_PROFILES,
  INSTRUMENT_MATERIALS,
  INSTRUMENT_STRING_COUNTS,
  DEFAULT_STRING_COUNTS,
  A4_REFERENCE,
  noteToFreq
} from '../../../settings/tuner.config.ts';
import { midiToNoteName } from './notesUtil.js';

const KEYS = {
  instrument: 'kins-tuner-instrument',
  presetPrefix: 'kins-tuner-preset-',
  presetIdPrefix: 'kins-tuner-preset-id-',
  customPrefix: 'kins-tuner-custom-',
  stringsPrefix: 'kins-tuner-strings-',
  mode: 'kins-tuner-mode',
  autoAdvance: 'kins-tuner-auto-advance',
  autoId: 'kins-tuner-auto-id',
  materialPrefix: 'kins-tuner-material-',
  a4: 'kins-tuner-a4'
};

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeCustomString(midi, a4) {
  return {
    label: 'String ' + midiToNoteName(midi),
    note: midiToNoteName(midi),
    freq: Math.round(noteToFreq(midi, a4) * 100) / 100,
    midi
  };
}

/* Standard-tuning generators for arbitrary string counts.
   Extensions follow real-world practice: extra LOW strings descend in
   fourths below the lowest standard string, extra HIGH strings ascend in
   fourths above the highest standard string. */
const GUITAR_BASE = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
const GUITAR_LOW_EXT = [35, 30, 25, 20, 15, 10]; // B1 F#1 C#1 G#0 D#0 A#0
const BASS_BASE = [28, 33, 38, 43]; // E1 A1 D2 G2

function generateStandardStrings(instrumentId, count, a4) {
  if (instrumentId === 'bass') {
    if (count <= 4) return BASS_BASE.slice(4 - count).map((m) => makeCustomString(m, a4));
    if (count === 5) return [23, ...BASS_BASE].map((m) => makeCustomString(m, a4)); // + B0
    // >5: alternate extra lows below B0 (F#0, C#0, ...) and highs above C3 (F3, ...)
    const lowExt = [23, 18, 13, 8];
    const highExt = [48, 53, 58, 63];
    const extras = count - BASS_BASE.length;
    const lows = lowExt.slice(0, Math.min(Math.ceil(extras / 2), lowExt.length)).reverse();
    const highs = highExt.slice(0, Math.max(0, Math.min(count - BASS_BASE.length - lows.length, highExt.length)));
    return [...lows, ...BASS_BASE, ...highs].slice(0, count).map((m) => makeCustomString(m, a4));
  }
  // Guitar (electric / acoustic)
  if (count === 12) {
    // 12-string acoustic: 6 courses doubled (octave/unison)
    // E2/E3 A2/A3 D3/D4 G3/G4 B3/B3 E4/E4 -> 12 notes
    const twelve = [40, 52, 45, 57, 50, 62, 55, 67, 59, 59, 64, 64];
    return twelve.slice(0, count).map((m) => makeCustomString(m, a4));
  }
  if (count === 6) return GUITAR_BASE.map((m) => makeCustomString(m, a4));
  if (count < 6) return GUITAR_BASE.slice(6 - count).map((m) => makeCustomString(m, a4));
  // >6: prepend low strings in fourths below E2 (B1, F#1, C#1, ...)
  let mids = [...GUITAR_BASE];
  let idx = 0;
  while (mids.length < count) {
    const low = GUITAR_LOW_EXT[idx] ?? GUITAR_LOW_EXT[GUITAR_LOW_EXT.length - 1] - 5 * (idx - GUITAR_LOW_EXT.length + 1);
    mids.unshift(low);
    idx++;
  }
  return mids.slice(0, count).map((m) => makeCustomString(m, a4));
}

export const state = {
  deviceId: '',
  inputChannel: 0,
  tolerance: 3,
  instrumentId: DEFAULT_INSTRUMENT,
  presetIndex: 0,
  stringIndex: 0,
  stringCount: 6,
  mode: 'guided',
  stringLabel: 'notes',
  autoAdvance: false,
  autoIdentify: true,
  materialId: 'avg',
  a4: A4_REFERENCE,
  listening: false,
  starting: false,
  customPreset: null
};

export function getGroup() {
  return TUNER_INSTRUMENTS.find((g) => g.id === state.instrumentId) || TUNER_INSTRUMENTS[0];
}

export function getPreset() {
  if (state.customPreset && state.customPreset.strings.length === state.stringCount) {
    return state.customPreset;
  }
  const group = getGroup();
  return group.presets[state.presetIndex] || group.presets[0];
}

export function getString() {
  const preset = getPreset();
  return preset.strings[state.stringIndex] || preset.strings[0];
}

function createCustomPreset(count) {
  const strings = generateStandardStrings(state.instrumentId, count, state.a4);
  return {
    id: `custom-${state.instrumentId}-${count}`,
    name: `Custom ${count}-String`,
    category: 'standard',
    strings
  };
}

export function getProfile() {
  if (state.materialId === 'off') return null;
  return MATERIAL_PROFILES[state.materialId] || MATERIAL_PROFILES.avg;
}

export function materialOptions() {
  return INSTRUMENT_MATERIALS[state.instrumentId] || [];
}

export function isAvgMaterial() {
  return state.materialId === 'avg';
}

export function stringCountOptions() {
  return INSTRUMENT_STRING_COUNTS[state.instrumentId] || [];
}

export function currentStringCount() {
  if (state.customPreset && state.customPreset.strings.length === state.stringCount && state.instrumentId !== 'drums') {
    return state.customPreset.strings.length;
  }
  const preset = getPreset();
  if (preset && preset.strings && preset.strings.length > 0 && state.instrumentId !== 'drums') {
    return preset.strings.length;
  }
  return state.stringCount || DEFAULT_STRING_COUNTS[state.instrumentId] || 6;
}

export function isCustomCount(count) {
  const options = stringCountOptions();
  return !options.includes(count) && Number.isInteger(count) && count >= 1 && count <= 12;
}

export function setStringCount(count) {
  const options = stringCountOptions();
  if (options.includes(count)) {
    state.customPreset = null;
    state.stringCount = count;
    storageSet(KEYS.stringsPrefix + state.instrumentId, String(count));
    storageSet(KEYS.customPrefix + state.instrumentId, '0');
    const group = getGroup();
    const matchingIdx = group.presets.findIndex((p) => p.strings.length === count);
    if (matchingIdx !== -1) {
      state.presetIndex = matchingIdx;
      state.stringIndex = 0;
      storageSet(KEYS.presetPrefix + state.instrumentId, String(state.presetIndex));
      storageSet(KEYS.presetIdPrefix + state.instrumentId, group.presets[matchingIdx].id);
    }
    return true;
  }
  // Custom count (e.g., 9+ for electric, 7-9 for acoustic)
  if (isCustomCount(count)) {
    return setCustomStringCount(count);
  }
  return false;
}

export function setCustomStringCount(count) {
  const parsed = Number(count);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) return false;
  // Allow any 1-12 as custom, even if in options (treat as custom if explicitly requested)
  state.stringCount = parsed;
  state.stringIndex = 0;
  state.customPreset = createCustomPreset(parsed);
  storageSet(KEYS.stringsPrefix + state.instrumentId, String(parsed));
  storageSet(KEYS.customPrefix + state.instrumentId, '1');
  // do not change presetIndex; customPreset takes precedence
  return true;
}

export function setInstrument(id) {
  const group = TUNER_INSTRUMENTS.find((g) => g.id === id);
  if (!group) return;
  state.instrumentId = group.id;

  const validCounts = INSTRUMENT_STRING_COUNTS[group.id] || [];
  const savedCount = Number(storageGet(KEYS.stringsPrefix + group.id));
  const isSavedCustom = group.id !== 'drums' && Number.isInteger(savedCount) && savedCount >= 1 && savedCount <= 12 &&
    (!validCounts.includes(savedCount) || storageGet(KEYS.customPrefix + group.id) === '1');
  if (isSavedCustom) {
    state.stringCount = savedCount;
    state.customPreset = createCustomPreset(savedCount);
    state.presetIndex = 0;
    state.stringIndex = 0;
  } else {
    state.customPreset = null;
    state.stringCount = validCounts.includes(savedCount) ? savedCount : (DEFAULT_STRING_COUNTS[group.id] || 6);
    const savedPreset = Number(storageGet(KEYS.presetPrefix + group.id));
    const savedId = storageGet(KEYS.presetIdPrefix + group.id);
    const stableIndex = group.presets.findIndex(preset => preset.id === savedId);
    let presetIdx = stableIndex >= 0 ? stableIndex : Number.isInteger(savedPreset) ? clamp(savedPreset, 0, group.presets.length - 1) : 0;
    if (validCounts.length > 0 && group.presets[presetIdx] && group.presets[presetIdx].strings.length !== state.stringCount) {
      const alignedIdx = group.presets.findIndex((p) => p.strings.length === state.stringCount);
      if (alignedIdx !== -1) presetIdx = alignedIdx;
    }
    state.presetIndex = presetIdx;
    state.stringIndex = 0;
    if (group.presets[state.presetIndex]) {
      state.stringCount = group.presets[state.presetIndex].strings.length;
      storageSet(KEYS.presetIdPrefix + group.id, group.presets[state.presetIndex].id);
    }
  }

  const savedMaterial = storageGet(KEYS.materialPrefix + group.id);
  const options = materialOptions();
  state.materialId = options.includes(savedMaterial) ? savedMaterial : 'avg';

  storageSet(KEYS.instrument, group.id);
  if (validCounts.length || isSavedCustom) storageSet(KEYS.stringsPrefix + group.id, String(state.stringCount));
  if (options.length) storageSet(KEYS.materialPrefix + group.id, state.materialId);
}

export function setPreset(index) {
  if (!Number.isInteger(index)) return;
  const group = getGroup();
  state.presetIndex = clamp(index, 0, group.presets.length - 1);
  state.stringIndex = 0;
  state.customPreset = null;
  const preset = group.presets[state.presetIndex];
  if (preset && preset.strings && preset.strings.length > 0 && state.instrumentId !== 'drums') {
    state.stringCount = preset.strings.length;
    storageSet(KEYS.stringsPrefix + state.instrumentId, String(state.stringCount));
  }
  storageSet(KEYS.presetPrefix + state.instrumentId, String(state.presetIndex));
  storageSet(KEYS.presetIdPrefix + state.instrumentId, preset.id);
  storageSet(KEYS.customPrefix + state.instrumentId, '0');
}

export function setString(index) {
  if (!Number.isInteger(index)) return;
  const preset = getPreset();
  state.stringIndex = clamp(index, 0, preset.strings.length - 1);
}

export function setMode(mode) {
  state.mode = ['chromatic', 'ear'].includes(mode) ? mode : 'guided';
  storageSet(KEYS.mode, state.mode);
}

export function setAutoAdvance(enabled) {
  state.autoAdvance = !!enabled;
  storageSet(KEYS.autoAdvance, state.autoAdvance ? '1' : '0');
}

export function setAutoIdentify(enabled) {
  state.autoIdentify = !!enabled;
  storageSet(KEYS.autoId, state.autoIdentify ? '1' : '0');
}

export function setMaterial(id) {
  state.materialId = id;
  if (materialOptions().length) {
    storageSet(KEYS.materialPrefix + state.instrumentId, id);
  }
}

export function setA4(hz) {
  const parsed = Number(hz);
  state.a4 = Number.isFinite(parsed) && parsed >= 410 && parsed <= 470 ? Math.round(parsed * 10) / 10 : A4_REFERENCE;
  storageSet(KEYS.a4, String(state.a4));
  if (state.customPreset) {
    state.customPreset = createCustomPreset(state.stringCount);
  }
}

export function restore() {
  setStringLabel(storageGet('kins-tuner-string-label'));
  setA4(storageGet(KEYS.a4) ?? A4_REFERENCE);
  state.tolerance = storageGet('kins-tuner-tolerance') === '1' ? 1 : 3;
  const savedInstrument = storageGet(KEYS.instrument);
  if (TUNER_INSTRUMENTS.some((g) => g.id === savedInstrument)) {
    setInstrument(savedInstrument);
  } else {
    setInstrument(DEFAULT_INSTRUMENT);
    storageSet(KEYS.instrument, state.instrumentId);
  }
  setMode(storageGet(KEYS.mode));
  setAutoAdvance(storageGet(KEYS.autoAdvance) === '1');
  // Auto string identification defaults ON — only an explicit opt-out persists.
  state.autoIdentify = storageGet(KEYS.autoId) !== '0';

}


export function setTolerance(value) {
  state.tolerance = Number(value) === 1 ? 1 : 3;
  storageSet('kins-tuner-tolerance', String(state.tolerance));
}

export function setStringLabel(value) {
  state.stringLabel = ['notes', 'number', 'gauge'].includes(value) ? value : 'notes';
  storageSet('kins-tuner-string-label', state.stringLabel);
}

export function getStringGauges() {
  const count = currentStringCount();
  const base = TUNER_STRING_GAUGES[state.instrumentId]?.[count] || [];
  let saved = [];
  try { saved = JSON.parse(storageGet(`kins-tuner-gauges-${state.instrumentId}-${count}`) || '[]'); } catch {}
  return Array.from({ length: count }, (_, index) => {
    const value = Array.isArray(saved) ? saved[index] : null;
    if (Number.isFinite(value) && value > 0 && value <= 200) return value;
    return base[index] ?? null;
  });
}

export function setStringGauge(index, value) {
  const gauges = getStringGauges();
  const parsed = Number(value);
  if (!Number.isInteger(index) || index < 0 || index >= gauges.length || !Number.isFinite(parsed) || parsed <= 0 || parsed > 200) return false;
  gauges[index] = parsed;
  storageSet(`kins-tuner-gauges-${state.instrumentId}-${gauges.length}`, JSON.stringify(gauges));
  return true;
}
