import {
  METRO_BPM,
  METRO_TIME_SIGNATURES,
  METRO_SUBDIVISIONS,
  METRO_SOUNDS,
  METRO_STORAGE_KEYS,
  COACH_DEFAULTS,
  COACH_STORAGE_KEYS,
  METRO_DEFAULT_SETLISTS,
  DEFAULT_BEAT_COLORS,
  SHEET_STORAGE_KEYS
} from '../../../settings/metronome.config';

const DEFAULT_SOUND_ID = (METRO_SOUNDS.find((s) => s.id === 'click') || METRO_SOUNDS[0]).id;
export const metroState = {
  bpm: METRO_BPM.default,
  timeSigIndex: 0,
  customTimeSig: null,
  subdivisionIndex: 0,
  soundId: DEFAULT_SOUND_ID,
  volume: 0.8,
  accentFirst: false,
  flash: false,
  vibrate: false,
  keepAwake: false,
  backgroundPlay: false,
  beatStyle: 'dots',
  beatTiers: ['mid', 'mid', 'mid', 'mid'],
  levelColors: { low: DEFAULT_BEAT_COLORS.low, mid: DEFAULT_BEAT_COLORS.mid, high: DEFAULT_BEAT_COLORS.high },
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
  sheetSync: false,
  sheetMap: {},
  setlists: [],
  activeSetlist: null,
  activeSetlistSongIdx: 0,
  activeSong: null,
  currentSectionIdx: 0,
  currentSectionBar: 1,
  isCountIn: false
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
  return METRO_SOUNDS.find((s) => s.id === metroState.soundId) || METRO_SOUNDS.find((s) => s.id === 'click') || METRO_SOUNDS[0];
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

export function setKeepAwake(enabled, persist = true) {
  metroState.keepAwake = !!enabled;
  if (persist) storageSet(METRO_STORAGE_KEYS.keepAwake, metroState.keepAwake ? '1' : '0');
}

export function setBackgroundPlay(enabled, persist = true) {
  metroState.backgroundPlay = !!enabled;
  if (persist) storageSet(METRO_STORAGE_KEYS.backgroundPlay, metroState.backgroundPlay ? '1' : '0');
}

export function setBeatStyle(style, persist = true) {
  const next = style === 'radial' ? 'radial' : 'dots';
  metroState.beatStyle = next;
  if (persist) storageSet(METRO_STORAGE_KEYS.beatStyle, next);
  return next;
}

const VALID_LEVEL_COLOR_TIERS = ['low', 'mid', 'high'];

function isValidHexColor(hex) {
  return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex.trim());
}

function hexToRgb(hex) {
  const h = hex.trim().replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getLevelColor(tier) {
  if (!VALID_LEVEL_COLOR_TIERS.includes(tier)) return DEFAULT_BEAT_COLORS.mid;
  const c = metroState.levelColors && metroState.levelColors[tier];
  return isValidHexColor(c) ? c.toUpperCase() : DEFAULT_BEAT_COLORS[tier];
}

export function setLevelColor(tier, hex, persist = true) {
  if (!VALID_LEVEL_COLOR_TIERS.includes(tier)) return null;
  if (!isValidHexColor(hex)) return null;
  const normalized = hex.trim().toUpperCase();
  if (!metroState.levelColors) metroState.levelColors = { ...DEFAULT_BEAT_COLORS };
  metroState.levelColors[tier] = normalized;
  if (persist) storageSet(METRO_STORAGE_KEYS.levelColors, JSON.stringify(metroState.levelColors));
  applyLevelColors();
  return normalized;
}

export function resetLevelColors(persist = true) {
  metroState.levelColors = { low: DEFAULT_BEAT_COLORS.low, mid: DEFAULT_BEAT_COLORS.mid, high: DEFAULT_BEAT_COLORS.high };
  if (persist) storageSet(METRO_STORAGE_KEYS.levelColors, JSON.stringify(metroState.levelColors));
  applyLevelColors();
  return { ...metroState.levelColors };
}

export function applyLevelColors() {
  try {
    const root = document.documentElement;
    if (!root) return;
    const colors = metroState.levelColors || DEFAULT_BEAT_COLORS;
    const tiers = ['low', 'mid', 'high'];
    tiers.forEach((tier) => {
      const hex = isValidHexColor(colors[tier]) ? colors[tier].toUpperCase() : DEFAULT_BEAT_COLORS[tier];
      root.style.setProperty(`--level-${tier}`, hex);
      root.style.setProperty(`--level-${tier}-text`, hex);
      root.style.setProperty(`--level-${tier}-active`, hex);
      root.style.setProperty(`--level-${tier}-bg`, hexToRgba(hex, 0.16));
      root.style.setProperty(`--level-${tier}-border`, hexToRgba(hex, 0.75));
      root.style.setProperty(`--level-${tier}-glow`, hexToRgba(hex, 0.35));
    });
  } catch (e) {}
}

const VALID_BEAT_TIERS = ['mute', 'low', 'mid', 'high'];

export function getBeatTier(index) {
  if (!Array.isArray(metroState.beatTiers)) return 'mid';
  const tier = metroState.beatTiers[index];
  return VALID_BEAT_TIERS.includes(tier) ? tier : 'mid';
}

export function setBeatTier(index, tierId, persist = true) {
  if (!Array.isArray(metroState.beatTiers)) metroState.beatTiers = [];
  syncBeatTiersLength(getTimeSignature().beatsPerBar, false);
  if (index < 0 || index >= metroState.beatTiers.length) return 'mid';
  const valid = VALID_BEAT_TIERS.includes(tierId) ? tierId : 'mid';
  metroState.beatTiers[index] = valid;
  if (persist) storageSet(METRO_STORAGE_KEYS.beatTiers, JSON.stringify(metroState.beatTiers));
  return valid;
}

export function cycleBeatTier(index, persist = true) {
  const cur = getBeatTier(index);
  const cycleMap = { mid: 'high', high: 'low', low: 'mute', mute: 'mid' };
  const next = cycleMap[cur] || 'mid';
  return setBeatTier(index, next, persist);
}

export function resetBeatTiers(persist = true) {
  const beats = getTimeSignature().beatsPerBar;
  metroState.beatTiers = new Array(beats).fill('mid');
  if (persist) storageSet(METRO_STORAGE_KEYS.beatTiers, JSON.stringify(metroState.beatTiers));
  return metroState.beatTiers;
}

export function syncBeatTiersLength(beatsPerBar, persist = true) {
  const targetLen = Math.max(1, beatsPerBar || 4);
  if (!Array.isArray(metroState.beatTiers)) metroState.beatTiers = [];
  while (metroState.beatTiers.length < targetLen) {
    metroState.beatTiers.push('mid');
  }
  if (metroState.beatTiers.length > targetLen) {
    metroState.beatTiers = metroState.beatTiers.slice(0, targetLen);
  }
  if (persist) storageSet(METRO_STORAGE_KEYS.beatTiers, JSON.stringify(metroState.beatTiers));
  return metroState.beatTiers;
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
  // Ensure direction exists for legacy persisted objects
  if (!cur.direction || (cur.direction !== 'asc' && cur.direction !== 'desc')) cur.direction = 'asc';
  // Handle direction toggle first — swap bounds if needed to keep range valid for new direction
  if (patch.direction === 'asc' || patch.direction === 'desc') {
    const newDir = patch.direction;
    if (newDir !== cur.direction) {
      // Swap start/target to preserve the same BPM range but reverse traversal
      if (newDir === 'asc' && cur.start > cur.target) {
        const tmp = cur.start; cur.start = cur.target; cur.target = tmp;
      } else if (newDir === 'desc' && cur.start < cur.target) {
        const tmp = cur.start; cur.start = cur.target; cur.target = tmp;
      }
      cur.direction = newDir;
    }
  }
  if (typeof patch.start === 'number') {
    let next = clampBpm(patch.start);
    next = Math.min(300, Math.max(30, next));
    cur.start = next;
  }
  if (typeof patch.target === 'number') {
    let next = clampBpm(patch.target);
    next = Math.min(300, Math.max(30, next));
    cur.target = next;
  }
  // Enforce ordering based on current direction: asc => start <= target, desc => start >= target
  if (cur.direction === 'asc' && cur.start > cur.target) {
    if (typeof patch.target === 'number' && typeof patch.start !== 'number') cur.start = cur.target;
    else if (typeof patch.start === 'number' && typeof patch.target !== 'number') cur.target = cur.start;
    else {
      // both supplied or toggle — clamp target up to start
      cur.target = cur.start;
    }
  } else if (cur.direction === 'desc' && cur.start < cur.target) {
    if (typeof patch.target === 'number' && typeof patch.start !== 'number') cur.start = cur.target;
    else if (typeof patch.start === 'number' && typeof patch.target !== 'number') cur.target = cur.start;
    else {
      cur.target = cur.start;
    }
  }
  if (typeof patch.step === 'number') cur.step = Math.min(100, Math.max(1, Math.round(patch.step)));
  if (typeof patch.everyBars === 'number') cur.everyBars = Math.min(999, Math.max(1, Math.round(patch.everyBars)));
  if (patch.unit === 'bars' || patch.unit === 'beats' || patch.unit === 'seconds') cur.unit = patch.unit;
  if (typeof patch.repeat === 'boolean') cur.repeat = patch.repeat;
  if (patch.direction === 'asc' || patch.direction === 'desc') cur.direction = patch.direction;
  // Final sanitize: if still inverted (legacy data), fix
  if (cur.direction === 'asc' && cur.start > cur.target) { const tmp = cur.start; cur.start = cur.target; cur.target = tmp; }
  if (cur.direction === 'desc' && cur.start < cur.target) { const tmp = cur.start; cur.start = cur.target; cur.target = tmp; }
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

export function setSheetSync(enabled, persist = true) {
  metroState.sheetSync = !!enabled;
  if (persist) storageSet(SHEET_STORAGE_KEYS.sync, metroState.sheetSync ? '1' : '0');
  return metroState.sheetSync;
}

export function setSheetForSong(songKey, instrument, entry) {
  if (!songKey || typeof songKey !== 'string') return false;
  const inst = instrument || metroState.sheetInstrument;
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
  if (sound) metroState.soundId = METRO_SOUNDS.some((s) => s.id === sound) ? sound : DEFAULT_SOUND_ID;
  const volume = parseInt(storageGet(METRO_STORAGE_KEYS.volume) || '', 10);
  if (!Number.isNaN(volume)) metroState.volume = Math.min(1, Math.max(0, volume / 100));
  metroState.accentFirst = storageGet(METRO_STORAGE_KEYS.accent) !== '0';
  metroState.flash = storageGet(METRO_STORAGE_KEYS.flash) === '1';
  metroState.vibrate = storageGet(METRO_STORAGE_KEYS.vibrate) === '1';
  metroState.keepAwake = storageGet(METRO_STORAGE_KEYS.keepAwake) === '1';
  metroState.backgroundPlay = storageGet(METRO_STORAGE_KEYS.backgroundPlay) === '1';
  const bs = storageGet(METRO_STORAGE_KEYS.beatStyle);
  metroState.beatStyle = bs === 'radial' ? 'radial' : 'dots';
  try {
    const rawTiers = storageGet(METRO_STORAGE_KEYS.beatTiers);
    if (rawTiers) {
      const parsed = JSON.parse(rawTiers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        metroState.beatTiers = parsed.map((t) => VALID_BEAT_TIERS.includes(t) ? t : 'mid');
      }
    }
  } catch (e) {}
  syncBeatTiersLength(getTimeSignature().beatsPerBar, false);
  // Restore custom beat colors (low/mid/high) — fallback to defaults if invalid
  try {
    const rawColors = storageGet(METRO_STORAGE_KEYS.levelColors);
    if (rawColors) {
      const parsed = JSON.parse(rawColors);
      if (parsed && typeof parsed === 'object') {
        ['low', 'mid', 'high'].forEach((tier) => {
          if (isValidHexColor(parsed[tier])) {
            metroState.levelColors[tier] = parsed[tier].toUpperCase();
          }
        });
      }
    }
  } catch (e) {}
  try { applyLevelColors(); } catch (e) {}
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
      if (speed.direction === 'asc' || speed.direction === 'desc') metroState.coachSpeed.direction = speed.direction;
      else metroState.coachSpeed.direction = metroState.coachSpeed.direction || 'asc';
      if (typeof speed.start === 'number') metroState.coachSpeed.start = Math.min(300, Math.max(30, clampBpm(speed.start)));
      if (typeof speed.target === 'number') metroState.coachSpeed.target = Math.min(300, Math.max(30, clampBpm(speed.target)));
      // Enforce ordering based on direction for legacy data
      if (metroState.coachSpeed.direction === 'asc' && metroState.coachSpeed.start > metroState.coachSpeed.target) {
        const tmp = metroState.coachSpeed.start; metroState.coachSpeed.start = metroState.coachSpeed.target; metroState.coachSpeed.target = tmp;
      } else if (metroState.coachSpeed.direction === 'desc' && metroState.coachSpeed.start < metroState.coachSpeed.target) {
        const tmp = metroState.coachSpeed.start; metroState.coachSpeed.start = metroState.coachSpeed.target; metroState.coachSpeed.target = tmp;
      }
      if (typeof speed.step === 'number') metroState.coachSpeed.step = Math.min(100, Math.max(1, Math.round(speed.step)));
      if (typeof speed.everyBars === 'number') metroState.coachSpeed.everyBars = Math.min(999, Math.max(1, Math.round(speed.everyBars)));
      if (speed.unit === 'bars' || speed.unit === 'beats' || speed.unit === 'seconds') metroState.coachSpeed.unit = speed.unit;
      if (typeof speed.repeat === 'boolean') metroState.coachSpeed.repeat = speed.repeat;
    }
    // Ensure direction default for fresh state
    if (!metroState.coachSpeed.direction || (metroState.coachSpeed.direction !== 'asc' && metroState.coachSpeed.direction !== 'desc')) metroState.coachSpeed.direction = 'asc';
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
    metroState.sheetFollow = storageGet(SHEET_STORAGE_KEYS.follow) === '1';
    metroState.sheetLoop = storageGet(SHEET_STORAGE_KEYS.loop) === '1';
    metroState.sheetSync = storageGet(SHEET_STORAGE_KEYS.sync) === '1';
    try {
      const sheetMap = JSON.parse(storageGet(SHEET_STORAGE_KEYS.perSong) || 'null');
      if (sheetMap && typeof sheetMap === 'object') metroState.sheetMap = sheetMap;
    } catch (e) {}
    loadSetlists();
  } catch (e) {}
}

export function loadSetlists() {
  try {
    const raw = storageGet(METRO_STORAGE_KEYS.setlists);
    if (!raw) {
      metroState.setlists = METRO_DEFAULT_SETLISTS.map((s) => JSON.parse(JSON.stringify(s)));
      return metroState.setlists;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      metroState.setlists = parsed;
    } else {
      metroState.setlists = METRO_DEFAULT_SETLISTS.map((s) => JSON.parse(JSON.stringify(s)));
    }
  } catch (e) {
    metroState.setlists = METRO_DEFAULT_SETLISTS.map((s) => JSON.parse(JSON.stringify(s)));
  }
  return metroState.setlists;
}

export function saveSetlists(persist = true) {
  if (persist) {
    try {
      storageSet(METRO_STORAGE_KEYS.setlists, JSON.stringify(metroState.setlists));
    } catch (e) {}
  }
  return metroState.setlists;
}

export function getSetlists() {
  if (!Array.isArray(metroState.setlists) || metroState.setlists.length === 0) {
    loadSetlists();
  }
  return metroState.setlists;
}

export function getSetlistById(id) {
  const list = getSetlists();
  return list.find((s) => s.id === id) || null;
}

export function upsertSetlist(setlistData) {
  if (!setlistData || !setlistData.name) return null;
  const list = getSetlists();
  const id = setlistData.id || `setlist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const songs = Array.isArray(setlistData.songs) ? setlistData.songs : [];
  const entry = {
    id,
    name: String(setlistData.name).trim().slice(0, 100) || 'Untitled Setlist',
    songs,
    updatedAt: Date.now(),
    createdAt: setlistData.createdAt || Date.now()
  };
  const idx = list.findIndex((s) => s.id === id);
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.unshift(entry);
  }
  saveSetlists(true);
  return entry;
}

export function deleteSetlist(id) {
  const list = getSetlists();
  const next = list.filter((s) => s.id !== id);
  metroState.setlists = next;
  saveSetlists(true);
  if (metroState.activeSetlist && metroState.activeSetlist.id === id) {
    metroState.activeSetlist = null;
    metroState.activeSetlistSongIdx = 0;
  }
  return true;
}
