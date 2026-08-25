import {
  METRO_BPM,
  METRO_TIME_SIGNATURES,
  METRO_SUBDIVISIONS,
  METRO_SOUNDS,
  METRO_STORAGE_KEYS,
  COACH_DEFAULTS,
  COACH_STORAGE_KEYS,
  SHEET_INSTRUMENTS,
  SHEET_STORAGE_KEYS
} from '../../../settings/metronome.config';

export const metroState = {
  bpm: METRO_BPM.default,
  timeSigIndex: 0,
  customTimeSig: null,
  subdivisionIndex: 0,
  soundId: METRO_SOUNDS[0].id,
  volume: 0.8,
  accentFirst: true,
  flash: false,
  vibrate: false,
  beatStyle: 'dots',
  playing: false,
  starting: false,
  coachTab: 'inner-clock',
  midiDeviceId: null,
  midiStatus: 'disconnected',
  coachInner: { ...COACH_DEFAULTS.innerClock },
  coachSpeed: { ...COACH_DEFAULTS.speedTrainer },
  coachRhythm: { ...COACH_DEFAULTS.rhythmStep, pattern: [...COACH_DEFAULTS.rhythmStep.pattern] },
  coachPrimer: { ...COACH_DEFAULTS.tempoPrimer },
  sheetInstrument: 'bass',
  sheetFollow: false,
  sheetLoop: false,
  sheetMap: {}
};

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

export function clampBpm(value) {
  return Math.min(METRO_BPM.max, Math.max(METRO_BPM.min, Math.round(value)));
}

export function getTimeSignature() {
  return metroState.customTimeSig || METRO_TIME_SIGNATURES[metroState.timeSigIndex] || METRO_TIME_SIGNATURES[0];
}

export function getSubdivision() {
  return METRO_SUBDIVISIONS[metroState.subdivisionIndex] || METRO_SUBDIVISIONS[0];
}

export function getSound() {
  return METRO_SOUNDS.find((s) => s.id === metroState.soundId) || METRO_SOUNDS[0];
}

export function setBpm(value, persist = true) {
  const next = clampBpm(value);
  if (next === metroState.bpm) return false;
  metroState.bpm = next;
  if (persist) storageSet(METRO_STORAGE_KEYS.bpm, String(next));
  return true;
}

export function setTimeSignature(index, persist = true) {
  if (index < 0 || index >= METRO_TIME_SIGNATURES.length) return false;
  metroState.timeSigIndex = index;
  metroState.customTimeSig = null;
  if (persist) storageSet(METRO_STORAGE_KEYS.timeSig, METRO_TIME_SIGNATURES[index].id);
  return true;
}

export function setCustomTimeSig(beats, unit, persist = true) {
  const b = Math.min(32, Math.max(1, Math.round(Number(beats) || 4)));
  const u = Math.min(32, Math.max(1, Math.round(Number(unit) || 4)));
  const matchIdx = METRO_TIME_SIGNATURES.findIndex((ts) => ts.beatsPerBar === b && ts.beatUnit === u);
  if (matchIdx !== -1) {
    metroState.timeSigIndex = matchIdx;
    metroState.customTimeSig = null;
    if (persist) storageSet(METRO_STORAGE_KEYS.timeSig, METRO_TIME_SIGNATURES[matchIdx].id);
  } else {
    metroState.timeSigIndex = -1;
    metroState.customTimeSig = {
      id: `${b}-${u}`,
      label: `${b}/${u}`,
      beatsPerBar: b,
      beatUnit: u
    };
    if (persist) storageSet(METRO_STORAGE_KEYS.timeSig, `custom:${b}-${u}`);
  }
  return true;
}

export function setSubdivision(index, persist = true) {
  if (index < 0 || index >= METRO_SUBDIVISIONS.length) return false;
  metroState.subdivisionIndex = index;
  if (persist) storageSet(METRO_STORAGE_KEYS.subdivision, METRO_SUBDIVISIONS[index].id);
  return true;
}

export function setSound(id, persist = true) {
  if (!METRO_SOUNDS.some((s) => s.id === id)) return false;
  metroState.soundId = id;
  if (persist) storageSet(METRO_STORAGE_KEYS.sound, id);
  return true;
}

export function setVolume(value, persist = true) {
  const next = Math.min(1, Math.max(0, value));
  metroState.volume = next;
  if (persist) storageSet(METRO_STORAGE_KEYS.volume, String(Math.round(next * 100)));
  return true;
}

export function setAccentFirst(enabled, persist = true) {
  metroState.accentFirst = !!enabled;
  if (persist) storageSet(METRO_STORAGE_KEYS.accent, metroState.accentFirst ? '1' : '0');
}

export function setFlash(enabled, persist = true) {
  metroState.flash = !!enabled;
  if (persist) storageSet(METRO_STORAGE_KEYS.flash, metroState.flash ? '1' : '0');
}

export function setVibrate(enabled, persist = true) {
  metroState.vibrate = !!enabled;
  if (persist) storageSet(METRO_STORAGE_KEYS.vibrate, metroState.vibrate ? '1' : '0');
}

export function setBeatStyle(style, persist = true) {
  const next = style === 'radial' ? 'radial' : 'dots';
  metroState.beatStyle = next;
  if (persist) storageSet(METRO_STORAGE_KEYS.beatStyle, next);
  return next;
}

export function setCoachTab(tabId, persist = true) {
  const valid = ['inner-clock', 'speed-trainer', 'rhythm-step', 'tempo-primer'];
  if (!valid.includes(tabId)) return false;
  metroState.coachTab = tabId;
  if (persist) storageSet(COACH_STORAGE_KEYS.activeTab, tabId);
  return true;
}

export function setCoachInner(patch, persist = true) {
  const cur = metroState.coachInner;
  if (typeof patch.audibleBars === 'number') cur.audibleBars = Math.min(16, Math.max(1, Math.round(patch.audibleBars)));
  if (typeof patch.mutedBars === 'number') cur.mutedBars = Math.min(16, Math.max(1, Math.round(patch.mutedBars)));
  if (typeof patch.random === 'boolean') cur.random = patch.random;
  if (persist) storageSet(COACH_STORAGE_KEYS.inner, JSON.stringify(cur));
  return true;
}

export function setCoachSpeed(patch, persist = true) {
  const cur = metroState.coachSpeed;
  if (typeof patch.start === 'number') {
    let next = clampBpm(patch.start);
    next = Math.min(300, Math.max(30, next));
    // enforce start <= target
    if (typeof patch.target === 'number') {
      // both provided together — clamp after
    } else if (next > cur.target) next = cur.target;
    cur.start = next;
  }
  if (typeof patch.target === 'number') {
    let next = clampBpm(patch.target);
    next = Math.min(300, Math.max(30, next));
    if (next < cur.start) next = cur.start;
    cur.target = next;
  }
  // if both changed, ensure ordering still holds (start <= target)
  if (cur.start > cur.target) {
    // if target was just updated, push start down; otherwise push target up
    if (typeof patch.target === 'number' && typeof patch.start !== 'number') cur.start = cur.target;
    else cur.target = cur.start;
  }
  if (typeof patch.step === 'number') cur.step = Math.min(50, Math.max(1, Math.round(patch.step)));
  if (typeof patch.everyBars === 'number') cur.everyBars = Math.min(16, Math.max(1, Math.round(patch.everyBars)));
  if (patch.unit === 'bars' || patch.unit === 'beats') cur.unit = patch.unit;
  if (typeof patch.repeat === 'boolean') cur.repeat = patch.repeat;
  if (persist) storageSet(COACH_STORAGE_KEYS.speed, JSON.stringify(cur));
  return true;
}

export function setCoachRhythm(patch, persist = true) {
  const cur = metroState.coachRhythm;
  if (Array.isArray(patch.pattern)) {
    const allowed = ['1-4', '1-4t', '1-8', '1-8t', '1-16', '1-16t', '1-32'];
    const next = patch.pattern.filter((id) => allowed.includes(id));
    if (next.length) cur.pattern = next;
  }
  if (typeof patch.everyBars === 'number') cur.everyBars = Math.min(32, Math.max(1, Math.round(patch.everyBars)));
  if (typeof patch.poly === 'boolean') cur.poly = patch.poly;
  if (patch.polyRatio === '3:2' || patch.polyRatio === '4:3') cur.polyRatio = patch.polyRatio;
  if (persist) storageSet(COACH_STORAGE_KEYS.rhythm, JSON.stringify(cur));
  return true;
}

export function setCoachPrimer(patch, persist = true) {
  const cur = metroState.coachPrimer;
  if (patch.difficulty && ['easy', 'medium', 'hard', 'expert'].includes(patch.difficulty)) cur.difficulty = patch.difficulty;
  if (typeof patch.target === 'number') cur.target = clampBpm(patch.target);
  if (persist) storageSet(COACH_STORAGE_KEYS.primer, JSON.stringify(cur));
  return true;
}

export function setMidiDeviceId(id, persist = true) {
  metroState.midiDeviceId = id || null;
  if (persist) {
    if (id) storageSet(COACH_STORAGE_KEYS.midiDevice, id);
    else try { localStorage.removeItem(COACH_STORAGE_KEYS.midiDevice); } catch (e) {}
  }
  return true;
}

export function setMidiStatus(status) {
  metroState.midiStatus = status;
}

export function setSheetInstrument(instrument, persist = true) {
  const allowed = SHEET_INSTRUMENTS.map((s) => s.id);
  const next = allowed.includes(instrument) ? instrument : 'bass';
  metroState.sheetInstrument = next;
  if (persist) storageSet(SHEET_STORAGE_KEYS.instrument, next);
  return next;
}

export function setSheetFollow(enabled, persist = true) {
  metroState.sheetFollow = !!enabled;
  if (persist) storageSet(SHEET_STORAGE_KEYS.follow, metroState.sheetFollow ? '1' : '0');
  return metroState.sheetFollow;
}

export function setSheetLoop(enabled, persist = true) {
  metroState.sheetLoop = !!enabled;
  if (persist) storageSet(SHEET_STORAGE_KEYS.loop, metroState.sheetLoop ? '1' : '0');
  return metroState.sheetLoop;
}

export function setSheetForSong(songKey, instrument, entry) {
  if (!songKey || typeof songKey !== 'string') return false;
  const allowed = SHEET_INSTRUMENTS.map((s) => s.id);
  const inst = allowed.includes(instrument) ? instrument : metroState.sheetInstrument;
  if (!metroState.sheetMap) metroState.sheetMap = {};
  if (!metroState.sheetMap[songKey]) metroState.sheetMap[songKey] = {};
  if (entry === null) {
    delete metroState.sheetMap[songKey][inst];
    if (Object.keys(metroState.sheetMap[songKey]).length === 0) deleteMetroSheetMapKey(songKey);
  } else {
    metroState.sheetMap[songKey][inst] = entry;
  }
  try { storageSet(SHEET_STORAGE_KEYS.perSong, JSON.stringify(metroState.sheetMap)); } catch (e) {}
  return true;
}

function deleteMetroSheetMapKey(key) {
  try { delete metroState.sheetMap[key]; } catch (e) {}
}

export function getSheetForSong(songKey, instrument) {
  if (!songKey || !metroState.sheetMap) return null;
  const inst = instrument || metroState.sheetInstrument;
  const bySong = metroState.sheetMap[songKey];
  if (!bySong) return null;
  return bySong[inst] || null;
}

export function clearSheetForSong(songKey) {
  if (!songKey || !metroState.sheetMap) return false;
  delete metroState.sheetMap[songKey];
  try { storageSet(SHEET_STORAGE_KEYS.perSong, JSON.stringify(metroState.sheetMap)); } catch (e) {}
  return true;
}

function indexOfId(list, id) {
  const idx = list.findIndex((item) => item.id === id);
  return idx === -1 ? 0 : idx;
}

export function restore() {
  const bpm = parseInt(storageGet(METRO_STORAGE_KEYS.bpm) || '', 10);
  if (!Number.isNaN(bpm)) metroState.bpm = clampBpm(bpm);
  const ts = storageGet(METRO_STORAGE_KEYS.timeSig);
  if (ts) {
    if (ts.startsWith('custom:')) {
      const parts = ts.replace('custom:', '').split('-');
      if (parts.length === 2) {
        setCustomTimeSig(parts[0], parts[1], false);
      }
    } else {
      metroState.timeSigIndex = indexOfId(METRO_TIME_SIGNATURES, ts);
      metroState.customTimeSig = null;
    }
  }
  const sub = storageGet(METRO_STORAGE_KEYS.subdivision);
  if (sub) metroState.subdivisionIndex = indexOfId(METRO_SUBDIVISIONS, sub);
  const sound = storageGet(METRO_STORAGE_KEYS.sound);
  if (sound) metroState.soundId = METRO_SOUNDS.some((s) => s.id === sound) ? sound : METRO_SOUNDS[0].id;
  const volume = parseInt(storageGet(METRO_STORAGE_KEYS.volume) || '', 10);
  if (!Number.isNaN(volume)) metroState.volume = Math.min(1, Math.max(0, volume / 100));
  metroState.accentFirst = storageGet(METRO_STORAGE_KEYS.accent) !== '0';
  metroState.flash = storageGet(METRO_STORAGE_KEYS.flash) === '1';
  metroState.vibrate = storageGet(METRO_STORAGE_KEYS.vibrate) === '1';
  const bs = storageGet(METRO_STORAGE_KEYS.beatStyle);
  metroState.beatStyle = bs === 'radial' ? 'radial' : 'dots';
  try {
    const tab = storageGet(COACH_STORAGE_KEYS.activeTab);
    if (tab && ['inner-clock','speed-trainer','rhythm-step','tempo-primer'].includes(tab)) metroState.coachTab = tab;
    const inner = JSON.parse(storageGet(COACH_STORAGE_KEYS.inner) || 'null');
    if (inner && typeof inner === 'object') {
      if (typeof inner.audibleBars === 'number') metroState.coachInner.audibleBars = Math.min(16, Math.max(1, Math.round(inner.audibleBars)));
      if (typeof inner.mutedBars === 'number') metroState.coachInner.mutedBars = Math.min(16, Math.max(1, Math.round(inner.mutedBars)));
      if (typeof inner.random === 'boolean') metroState.coachInner.random = inner.random;
    }
    const speed = JSON.parse(storageGet(COACH_STORAGE_KEYS.speed) || 'null');
    if (speed && typeof speed === 'object') {
      if (typeof speed.start === 'number') metroState.coachSpeed.start = Math.min(300, Math.max(30, clampBpm(speed.start)));
      if (typeof speed.target === 'number') metroState.coachSpeed.target = Math.min(300, Math.max(30, clampBpm(speed.target)));
      if (metroState.coachSpeed.start > metroState.coachSpeed.target) metroState.coachSpeed.start = metroState.coachSpeed.target;
      if (typeof speed.step === 'number') metroState.coachSpeed.step = Math.min(50, Math.max(1, Math.round(speed.step)));
      if (typeof speed.everyBars === 'number') metroState.coachSpeed.everyBars = Math.min(16, Math.max(1, Math.round(speed.everyBars)));
      if (speed.unit === 'bars' || speed.unit === 'beats') metroState.coachSpeed.unit = speed.unit;
      if (typeof speed.repeat === 'boolean') metroState.coachSpeed.repeat = speed.repeat;
    }
    const rhythm = JSON.parse(storageGet(COACH_STORAGE_KEYS.rhythm) || 'null');
    if (rhythm && typeof rhythm === 'object') {
      if (Array.isArray(rhythm.pattern) && rhythm.pattern.length) metroState.coachRhythm.pattern = rhythm.pattern.filter((x) => typeof x === 'string');
      if (typeof rhythm.everyBars === 'number') metroState.coachRhythm.everyBars = Math.min(32, Math.max(1, Math.round(rhythm.everyBars)));
      if (typeof rhythm.poly === 'boolean') metroState.coachRhythm.poly = rhythm.poly;
      if (rhythm.polyRatio === '3:2' || rhythm.polyRatio === '4:3') metroState.coachRhythm.polyRatio = rhythm.polyRatio;
    }
    const primer = JSON.parse(storageGet(COACH_STORAGE_KEYS.primer) || 'null');
    if (primer && typeof primer === 'object') {
      if (['easy','medium','hard','expert'].includes(primer.difficulty)) metroState.coachPrimer.difficulty = primer.difficulty;
      if (typeof primer.target === 'number') metroState.coachPrimer.target = clampBpm(primer.target);
    }
    const midiId = storageGet(COACH_STORAGE_KEYS.midiDevice);
    if (midiId) metroState.midiDeviceId = midiId;
    const sheetInst = storageGet(SHEET_STORAGE_KEYS.instrument);
    if (sheetInst && ['bass','electric','acoustic','drums'].includes(sheetInst)) metroState.sheetInstrument = sheetInst;
    metroState.sheetFollow = storageGet(SHEET_STORAGE_KEYS.follow) === '1';
    metroState.sheetLoop = storageGet(SHEET_STORAGE_KEYS.loop) === '1';
    try {
      const sheetMap = JSON.parse(storageGet(SHEET_STORAGE_KEYS.perSong) || 'null');
      if (sheetMap && typeof sheetMap === 'object') metroState.sheetMap = sheetMap;
    } catch (e) {}
  } catch (e) {}
}
