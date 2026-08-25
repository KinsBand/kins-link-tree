/* ==========================================================================
   KINS Tuner — single source of truth (settings rule: no hardcoded dupes
   in controllers). Presets, categories, string-safety material profiles,
   A4 calibration, detection-pipeline thresholds and all user-facing copy.
   ========================================================================== */

export interface TunerString {
  label: string;
  note: string;
  freq: number;
  midi: number;
}

export type TunerCategory = 'standard' | 'open' | 'artist' | 'kit';

export interface TunerPreset {
  id: string;
  name: string;
  category: TunerCategory;
  strings: TunerString[];
}

export type TunerInstrumentId = 'acoustic' | 'electric' | 'bass' | 'drums';

export type TunerMode = 'guided' | 'chromatic';

export interface InstrumentTuningGroup {
  id: TunerInstrumentId;
  label: string;
  dropdownLabel: string;
  icon: 'acoustic' | 'drums' | 'electric' | 'bass';
  blurb: string;
  presets: TunerPreset[];
}

export interface MaterialProfile {
  id: string;
  label: string;
  shortLabel: string;
  /* Offsets in semitones from target: warn/danger above, warn/dead below */
  warnUp: number;
  dangerUp: number;
  warnDown: number;
  deadDown: number;
  hint: string;
}

export const A4_REFERENCE = 440;

export const A4_CALIBRATION: readonly number[] = [415, 432, 440, 442, 443];

export function noteToFreq(midi: number, a4: number = A4_REFERENCE): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

const TUNER_STRINGS = {
  A0: { label: 'Low A', note: 'A0', midi: 21 },
  Bb0: { label: 'Low Bb', note: 'Bb0', midi: 22 },
  B0: { label: '5th/6th (B)', note: 'B0', midi: 23 },
  C1: { label: 'Low C', note: 'C1', midi: 24 },
  'C#1': { label: 'Low C#', note: 'C#1', midi: 25 },
  Db1: { label: 'Low Db', note: 'Db1', midi: 25 },
  D1: { label: '4th (D)', note: 'D1', midi: 26 },
  'D#1': { label: 'Low D#', note: 'D#1', midi: 27 },
  Eb1: { label: '4th (Eb)', note: 'Eb1', midi: 27 },
  E1: { label: '4th (E)', note: 'E1', midi: 28 },
  F1: { label: 'Low F', note: 'F1', midi: 29 },
  Gb1: { label: 'Low Gb', note: 'Gb1', midi: 30 },
  'F#1': { label: 'Low F#', note: 'F#1', midi: 30 },
  G1: { label: '3rd (G)', note: 'G1', midi: 31 },
  'G#1': { label: '3rd (G#)', note: 'G#1', midi: 32 },
  Ab1: { label: '3rd (Ab)', note: 'Ab1', midi: 32 },
  A1: { label: '3rd (A)', note: 'A1', midi: 33 },
  'A#1': { label: 'Low A#', note: 'A#1', midi: 34 },
  Bb1: { label: 'Low Bb', note: 'Bb1', midi: 34 },
  B1: { label: '2nd (B)', note: 'B1', midi: 35 },
  C2: { label: '6th (C)', note: 'C2', midi: 36 },
  'C#2': { label: '6th (C#)', note: 'C#2', midi: 37 },
  Db2: { label: '3rd (Db)', note: 'Db2', midi: 37 },
  D2: { label: '6th (D)', note: 'D2', midi: 38 },
  'D#2': { label: '6th (D#)', note: 'D#2', midi: 39 },
  Eb2: { label: '6th (Eb)', note: 'Eb2', midi: 39 },
  E2: { label: '6th (E)', note: 'E2', midi: 40 },
  F2: { label: '1st (F)', note: 'F2', midi: 41 },
  Gb2: { label: '2nd (Gb)', note: 'Gb2', midi: 42 },
  'F#2': { label: '5th (F#)', note: 'F#2', midi: 42 },
  G2: { label: '1st/5th (G)', note: 'G2', midi: 43 },
  'G#2': { label: '5th (G#)', note: 'G#2', midi: 44 },
  Ab2: { label: '5th (Ab)', note: 'Ab2', midi: 44 },
  A2: { label: '5th (A)', note: 'A2', midi: 45 },
  'A#2': { label: '4th (A#)', note: 'A#2', midi: 46 },
  Bb2: { label: '4th (Bb)', note: 'Bb2', midi: 46 },
  B2: { label: '2nd (B)', note: 'B2', midi: 47 },
  C3: { label: '1st/4th (C)', note: 'C3', midi: 48 },
  'C#3': { label: '4th (C#)', note: 'C#3', midi: 49 },
  Db3: { label: '4th (Db)', note: 'Db3', midi: 49 },
  D3: { label: '4th (D)', note: 'D3', midi: 50 },
  'D#3': { label: '4th (D#)', note: 'D#3', midi: 51 },
  Eb3: { label: '4th (Eb)', note: 'Eb3', midi: 51 },
  E3: { label: '4th (E)', note: 'E3', midi: 52 },
  F3: { label: '3rd (F)', note: 'F3', midi: 53 },
  Gb3: { label: '3rd (Gb)', note: 'Gb3', midi: 54 },
  'F#3': { label: '3rd (F#)', note: 'F#3', midi: 54 },
  G3: { label: '3rd (G)', note: 'G3', midi: 55 },
  'G#3': { label: '2nd (G#)', note: 'G#3', midi: 56 },
  Ab3: { label: '2nd (Ab)', note: 'Ab3', midi: 56 },
  A3: { label: '2nd (A)', note: 'A3', midi: 57 },
  'A#3': { label: '2nd (A#)', note: 'A#3', midi: 58 },
  Bb3: { label: '2nd (Bb)', note: 'Bb3', midi: 58 },
  B3: { label: '2nd (B)', note: 'B3', midi: 59 },
  C4: { label: '1st (C)', note: 'C4', midi: 60 },
  'C#4': { label: '1st (C#)', note: 'C#4', midi: 61 },
  Db4: { label: '1st (Db)', note: 'Db4', midi: 61 },
  D4: { label: '1st (D)', note: 'D4', midi: 62 },
  'D#4': { label: '1st (D#)', note: 'D#4', midi: 63 },
  Eb4: { label: '1st (Eb)', note: 'Eb4', midi: 63 },
  E4: { label: '1st (E)', note: 'E4', midi: 64 },
  F4: { label: '1st (F)', note: 'F4', midi: 65 },
  G4: { label: '1st (G)', note: 'G4', midi: 67 }
} as const;

type StdName = keyof typeof TUNER_STRINGS;

function s(name: StdName): TunerString {
  const def = TUNER_STRINGS[name];
  return { label: def.label, note: def.note, freq: Math.round(noteToFreq(def.midi) * 100) / 100, midi: def.midi };
}

function guitarPreset(id: string, name: string, category: TunerCategory, names: StdName[]): TunerPreset {
  return { id, name, category, strings: names.map(s) };
}

// 6-string: Standard & detuned (same P4-P4-P4-M3-P4, lower pitch)
const GUITAR_6_STANDARD: TunerPreset[] = [
  guitarPreset('standard', 'Standard', 'standard', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('eb-standard', 'Half-Step Down (Eb)', 'standard', ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  guitarPreset('d-standard', 'Full-Step Down (D)', 'standard', ['D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('csharp-standard', 'C# Standard (Db)', 'standard', ['C#2', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  guitarPreset('c-standard', 'C Standard', 'standard', ['C2', 'F2', 'Bb2', 'Eb3', 'G3', 'C4']),
  guitarPreset('b-standard', 'B Standard (Baritone)', 'standard', ['B1', 'E2', 'A2', 'D3', 'F#3', 'B3']),
  guitarPreset('a-standard', 'A Standard', 'standard', ['A1', 'D2', 'G2', 'C3', 'E3', 'A3'])
];

const GUITAR_6_DROP: TunerPreset[] = [
  guitarPreset('drop-d', 'Drop D', 'standard', ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-csharp', 'Drop C#', 'standard', ['C#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4']),
  guitarPreset('drop-c', 'Drop C', 'standard', ['C2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('drop-b', 'Drop B', 'standard', ['B1', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  guitarPreset('drop-bb', 'Drop Bb', 'standard', ['Bb1', 'F2', 'Bb2', 'Eb3', 'G3', 'C4']),
  guitarPreset('drop-a', 'Drop A', 'standard', ['A1', 'E2', 'A2', 'D3', 'F#3', 'B3']),
  guitarPreset('drop-ab', 'Drop Ab', 'standard', ['Ab1', 'Eb2', 'Ab2', 'Db3', 'F3', 'Bb3']),
  guitarPreset('drop-g', 'Drop G', 'standard', ['G1', 'D2', 'G2', 'C3', 'E3', 'A3']),
  guitarPreset('drop-fsharp', 'Drop F#', 'standard', ['F#1', 'C#2', 'F#2', 'B2', 'D#3', 'G#3']),
  guitarPreset('drop-f', 'Drop F', 'standard', ['F1', 'C2', 'F2', 'Bb2', 'D3', 'G3']),
  guitarPreset('drop-e', 'Drop E', 'standard', ['E1', 'B1', 'E2', 'A2', 'C#3', 'F#3']),
  guitarPreset('double-drop-d', 'Double Drop D', 'standard', ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'])
];

const GUITAR_6_OPEN: TunerPreset[] = [
  guitarPreset('open-g', 'Open G', 'open', ['D2', 'G2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('open-d', 'Open D', 'open', ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']),
  guitarPreset('open-e', 'Open E', 'open', ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']),
  guitarPreset('open-c', 'Open C', 'open', ['C2', 'G2', 'C3', 'G3', 'C4', 'E4']),
  guitarPreset('open-a', 'Open A', 'open', ['E2', 'A2', 'E3', 'A3', 'C#4', 'E4']),
  guitarPreset('open-dm', 'Open Dm', 'open', ['D2', 'A2', 'D3', 'F3', 'A3', 'D4']),
  guitarPreset('open-em', 'Open Em', 'open', ['E2', 'B2', 'E3', 'G3', 'B3', 'E4']),
  guitarPreset('open-gm', 'Open Gm', 'open', ['D2', 'G2', 'D3', 'G3', 'Bb3', 'D4'])
];

const GUITAR_6_ARTIST: TunerPreset[] = [
  guitarPreset('dadgad', 'DADGAD (Celtic / D Modal)', 'artist', ['D2', 'A2', 'D3', 'G3', 'A3', 'D4']),
  guitarPreset('dsus2', 'Dsus2', 'artist', ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('orkny', 'Orkney (CGCGCD)', 'artist', ['C2', 'G2', 'C3', 'G3', 'C4', 'D4']),
  guitarPreset('cgdgad', 'CGDGAD (Celtic)', 'artist', ['C2', 'G2', 'D3', 'G3', 'A3', 'D4']),
  guitarPreset('pipe-cello', 'Pipe / Cello (C G C G C D)', 'artist', ['C2', 'G2', 'C3', 'G3', 'C4', 'D4']),
  guitarPreset('nst', 'NST (New Standard C G D A E G)', 'artist', ['C2', 'G2', 'D3', 'A3', 'E4', 'G4']),
  guitarPreset('all-fourths', 'All Fourths (E A D G C F)', 'artist', ['E2', 'A2', 'D3', 'G3', 'C4', 'F4']),
  guitarPreset('major-thirds', 'Major Thirds (C E G#)', 'artist', ['C2', 'E2', 'G#2', 'C3', 'E3', 'G#3']),
  guitarPreset('ostrich', 'Ostrich (All E)', 'artist', ['E2', 'E2', 'E3', 'E3', 'E3', 'E3']),
  guitarPreset('c6', 'C6 Slack (C A C E G A)', 'artist', ['C2', 'A2', 'C3', 'E3', 'G3', 'A3']),
  guitarPreset('nashville', 'Nashville High-Strung', 'artist', ['E3', 'A3', 'D4', 'G4', 'B3', 'E4'])
];

const GUITAR_5_PRESETS: TunerPreset[] = [
  guitarPreset('open-g-5', 'Open G (Keith Richards 5-string)', 'open', ['G2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('standard-low-5', 'Standard (Low 5)', 'standard', ['E2', 'A2', 'D3', 'G3', 'B3']),
  guitarPreset('standard-high-5', 'Standard (High 5)', 'standard', ['A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-d-5', 'Drop D (5-string)', 'standard', ['D2', 'A2', 'D3', 'G3', 'B3'])
];

const GUITAR_7_PRESETS: TunerPreset[] = [
  guitarPreset('7-standard', 'Standard (7-String B)', 'standard', ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-drop-a', 'Drop A (7-string)', 'standard', ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-eb', 'Half-Step Down (Bb)', 'standard', ['Bb1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  guitarPreset('7-d-standard', 'D Standard (7)', 'standard', ['A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4'])
];

const GUITAR_8_PRESETS: TunerPreset[] = [
  guitarPreset('8-standard', 'Standard (8-String F#)', 'standard', ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('8-drop-e', 'Drop E (8-string)', 'standard', ['E1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('8-eb', 'Half-Step Down (8)', 'standard', ['F1', 'Bb1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'])
];

const GUITAR_9_PRESETS: TunerPreset[] = [
  guitarPreset('9-standard', 'Standard (9-String C#)', 'standard', ['C#1', 'F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('9-drop-e', 'Drop E (9-string)', 'standard', ['B0', 'E1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'])
];

const ACOUSTIC_12_PRESETS: TunerPreset[] = [
  guitarPreset('12-standard', 'Standard (12-String)', 'standard', ['E2', 'E3', 'A2', 'A3', 'D3', 'D4', 'G3', 'G4', 'B3', 'B3', 'E4', 'E4'])
];

const ACOUSTIC_PRESETS: TunerPreset[] = [
  ...GUITAR_6_STANDARD,
  ...GUITAR_6_DROP,
  ...GUITAR_6_OPEN,
  ...GUITAR_6_ARTIST,
  ...GUITAR_5_PRESETS,
  ...ACOUSTIC_12_PRESETS
];

const ELECTRIC_PRESETS: TunerPreset[] = [
  ...GUITAR_6_STANDARD,
  ...GUITAR_6_DROP,
  ...GUITAR_6_OPEN,
  ...GUITAR_6_ARTIST,
  ...GUITAR_5_PRESETS,
  ...GUITAR_7_PRESETS,
  ...GUITAR_8_PRESETS,
  ...GUITAR_9_PRESETS
];

const BASS_4_PRESETS: TunerPreset[] = [
  guitarPreset('bass-standard', 'Standard (E A D G)', 'standard', ['E1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-eb', 'Half-Step Down (Eb)', 'standard', ['Eb1', 'Ab1', 'Db2', 'Gb2']),
  guitarPreset('bass-d', 'D Standard (D G C F)', 'standard', ['D1', 'G1', 'C2', 'F2']),
  guitarPreset('bass-c-standard', 'C Standard (C F Bb Eb)', 'standard', ['C1', 'F1', 'Bb1', 'Eb2']),
  guitarPreset('bass-drop-d', 'Drop D (D A D G)', 'standard', ['D1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-drop-c', 'Drop C (C G C F)', 'standard', ['C1', 'G1', 'C2', 'F2']),
  guitarPreset('bass-drop-b', 'Drop B (B F# B E)', 'standard', ['B0', 'F#1', 'B1', 'E2']),
  guitarPreset('bass-drop-a', 'Drop A (A E A D)', 'standard', ['A0', 'E1', 'A1', 'D2']),
  guitarPreset('bass-bead', 'B Standard (B E A D) – 5-string set on 4', 'standard', ['B0', 'E1', 'A1', 'D2']),
  guitarPreset('bass-piccolo', 'Piccolo (E A D G – octave up)', 'standard', ['E2', 'A2', 'D3', 'G3'])
];

const BASS_5_PRESETS: TunerPreset[] = [
  guitarPreset('bass-5-standard', 'Standard (B E A D G)', 'standard', ['B0', 'E1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-5-drop-a', 'Drop A (A E A D G)', 'standard', ['A0', 'E1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-5-high-c', 'Tenor / High C (E A D G C)', 'standard', ['E1', 'A1', 'D2', 'G2', 'C3']),
  guitarPreset('bass-5-eb', 'Half-Step Down (Bb)', 'standard', ['Bb0', 'Eb1', 'Ab1', 'Db2', 'Gb2']),
  guitarPreset('bass-5-d-standard', 'D Standard (D G C F A)', 'standard', ['D1', 'G1', 'C2', 'F2', 'A2']),
  guitarPreset('bass-5-c-standard', 'C Standard (C F Bb Eb G)', 'standard', ['C1', 'F1', 'Bb1', 'Eb2', 'G2'])
];

const BASS_6_PRESETS: TunerPreset[] = [
  guitarPreset('bass-6-standard', 'Standard (B E A D G C)', 'standard', ['B0', 'E1', 'A1', 'D2', 'G2', 'C3']),
  guitarPreset('bass-6-drop-a', 'Drop A (A E A D G C)', 'standard', ['A0', 'E1', 'A1', 'D2', 'G2', 'C3']),
  guitarPreset('bass-vi', 'Bass VI (E A D G B E – octave below guitar)', 'standard', ['E1', 'A1', 'D2', 'G2', 'B2', 'E3'])
];

const BASS_PRESETS: TunerPreset[] = [
  ...BASS_4_PRESETS,
  ...BASS_5_PRESETS,
  ...BASS_6_PRESETS
];

const DRUM_KIT_PRESET: TunerPreset = {
  id: 'kit-reference',
  name: 'Standard Kit Reference',
  category: 'kit',
  strings: [
    { label: 'Kick', note: '~50 Hz', freq: 50, midi: 31 },
    { label: 'Snare', note: '~185 Hz', freq: 185, midi: 54 },
    { label: 'Rack Tom', note: '~110 Hz', freq: 110, midi: 45 },
    { label: 'Floor Tom', note: '~80 Hz', freq: 80, midi: 39 }
  ]
};

export const INSTRUMENT_STRING_COUNTS: Record<TunerInstrumentId, number[]> = {
  electric: [6, 7, 8, 9],
  acoustic: [6, 12],
  bass: [4, 5, 6],
  drums: []
};
// Custom string counts (10+ for electric, 7-9 for acoustic) handled via Custom field in tunerState
// 5-string presets remain in library but are not primary string-range options

export const DEFAULT_STRING_COUNTS: Record<TunerInstrumentId, number> = {
  electric: 6,
  acoustic: 6,
  bass: 4,
  drums: 0
};

export const TUNER_INSTRUMENTS: InstrumentTuningGroup[] = [
  {
    id: 'electric',
    label: 'ELECTRIC',
    dropdownLabel: 'Electric Guitar',
    icon: 'electric',
    blurb: 'Solid-body electric. Light fretting-hand pressure — gripping the neck sharpens the reading.',
    presets: ELECTRIC_PRESETS
  },
  {
    id: 'acoustic',
    label: 'ACOUSTIC',
    dropdownLabel: 'Acoustic Guitar',
    icon: 'acoustic',
    blurb: 'Steel-string acoustic. Tap a peg to pick a string, pluck it loud and let it ring.',
    presets: ACOUSTIC_PRESETS
  },
  {
    id: 'bass',
    label: 'BASS',
    dropdownLabel: 'Bass Guitar',
    icon: 'bass',
    blurb: 'Low strings need patience — let each note ring fully so the detector locks on the fundamental.',
    presets: BASS_PRESETS
  },
  {
    id: 'drums',
    label: 'DRUMS',
    dropdownLabel: 'Drums',
    icon: 'drums',
    blurb: 'Tap a drum, tap the meter, then tap near the lug and match by ear — top and bottom heads relative to each other.',
    presets: [DRUM_KIT_PRESET]
  }
];

export const DEFAULT_INSTRUMENT: TunerInstrumentId = 'electric';

export const TUNER_CATEGORY_LABELS: Record<TunerCategory, string> = {
  standard: 'STANDARD & ALTERNATE',
  open: 'OPEN TUNINGS (SLIDE & FINGERSTYLE)',
  artist: 'ARTIST & REGIONAL TUNINGS',
  kit: 'KIT REFERENCE'
};

export const TUNER_CATEGORY_ORDER: TunerCategory[] = ['standard', 'open', 'artist', 'kit'];

/* --------------------------------------------------------------------------
   String-safety material profiles (research-derived, semitones from target).
   avg = universal default: violin steel binds upward, bass binds downward,
   +3 st sits below empirical 75%-of-break for every common steel class.
   -------------------------------------------------------------------------- */
export const MATERIAL_PROFILES: Record<string, MaterialProfile> = {
  avg: {
    id: 'avg',
    label: 'Average — Safe Default',
    shortLabel: 'AVG',
    warnUp: 2.0,
    dangerUp: 3.0,
    warnDown: -2.5,
    deadDown: -4.0,
    hint: 'Conservative limits that work for any common string set.'
  },
  plainSteel: {
    id: 'plainSteel',
    label: 'Plain Steel (.009–.013)',
    shortLabel: 'STEEL',
    warnUp: 2.5,
    dangerUp: 3.5,
    warnDown: -2.5,
    deadDown: -4.0,
    hint: 'Unwound electric-style plain strings.'
  },
  nickelWound: {
    id: 'nickelWound',
    label: 'Nickel / Steel Wound',
    shortLabel: 'NICKEL',
    warnUp: 2.0,
    dangerUp: 3.0,
    warnDown: -2.5,
    deadDown: -4.0,
    hint: 'Wound electric sets.'
  },
  bronzeWound: {
    id: 'bronzeWound',
    label: 'Bronze Acoustic Wound',
    shortLabel: 'BRONZE',
    warnUp: 2.0,
    dangerUp: 3.0,
    warnDown: -2.5,
    deadDown: -4.0,
    hint: 'Acoustic wound sets — ~3 st is the practical limit.'
  },
  bassNickel: {
    id: 'bassNickel',
    label: 'Bass Nickel Wound',
    shortLabel: 'BASS',
    warnUp: 2.5,
    dangerUp: 3.5,
    warnDown: -2.5,
    deadDown: -4.5,
    hint: 'Electric bass, round or flatwound.'
  }
};

export const INSTRUMENT_MATERIALS: Record<TunerInstrumentId, string[]> = {
  acoustic: ['avg', 'bronzeWound', 'plainSteel'],
  electric: ['avg', 'plainSteel', 'nickelWound'],
  bass: ['avg', 'bassNickel'],
  drums: []
};

/* --------------------------------------------------------------------------
   Detection pipeline thresholds (YIN + HPS hybrid — see controller modules)
   -------------------------------------------------------------------------- */
export const DETECT = {
  MIN_DETECT_HZ: 28,
  MAX_DETECT_HZ: 2100,
  RMS_WAKE: 0.005,
  RMS_RELEASE: 0.002,
  ATTACK_FREEZE_MS: 100,
  CLIP_LEVEL: 0.98,
  CLIP_RATIO: 0.005,
  YIN_THRESHOLD: 0.1,
  HPS_HARMONICS: 5,
  SUBHARMONIC_RATIO: 0.2,
  POLYPHONY_PEAK_RATIO: 0.3,
  POLYPHONY_MAX: 2,
  MEDIAN_WINDOW: 5,
  EMA_ALPHA: 0.2,
  OCTAVE_JUMP_CENTS: 600,
  OCTAVE_JUMP_FRAMES: 3,
  CONF_LOCK: 0.8,
  CONF_LOCK_FRAMES: 5,
  CONF_UNLOCK: 0.55,
  CONF_SILENT_FRAMES: 8,
  JITTER_CENTS: 3,
  IN_TUNE_CENTS: 5,
  AUTO_ADVANCE_LOCK_MS: 1500,
  LABEL_HYSTERESIS_CENTS: 50,
  LABEL_HYSTERESIS_MS: 80,
  RING_SAMPLES: 8192,
  WORK_WINDOW: 6144,
  WORKLET_CHUNK: 1024
} as const;

export const TUNER_COPY = {
  tapToStart: 'TAP TO START TUNING',
  tapToStop: 'TAP TO STOP',
  startTuner: 'START TUNING',
  stopTuner: 'STOP TUNING',
  starting: 'STARTING MIC…',
  listening: 'LISTENING…',
  inTune: 'TUNED',
  tooFlat: 'TOO LOW',
  tooSharp: 'TOO HIGH',
  playOneString: 'Play one string at a time',
  tooLoud: 'Too loud — back off from the mic',
  micUnsupported: 'This browser does not support microphone input.',
  micDenied: 'Microphone permission is blocked for this site. Click the padlock icon in the address bar, set Microphone to Allow, then tap START TUNING again.',
  micSystemBlocked: 'Your system is blocking microphone access. Check your OS privacy settings (Windows: Settings > Privacy > Microphone — allow desktop apps) and your browser mic list, then try again.',
  micNotFound: 'No microphone was detected. Connect or enable a mic, then tap START TUNING again.',
  micBlockedHeader: 'Microphone permission is disabled for this site. Enable it in your browser\'s site settings, then reload.',
  audioPrivate: 'Audio never leaves your device.',
  wrongOctave: 'That pitch belongs to another string — check the pegs.',
  breakageAvg: 'Breakage risk — unsafe for most strings. Tap MATERIAL if you know yours.',
  breakageKnown: 'Snap risk — ease off. Limits shown for your string material.',
  deadLoose: 'Way too low — the string will be unplayably loose here.',
  stress: 'Repeated over-tightening detected. Back off and let the string rest.',
  btMic: 'Bluetooth mic detected — headset audio is too narrow to tune reliably. Use your device mic.',
  lowMicWarning: 'Phone mics roll off below ~40 Hz — kick and floor tom readings may be unreliable.',
  autoAdvanced: (name: string) => `Tuned — next up: ${name}`,
  stringSelected: (name: string) => `Targeting ${name}`,
  resumeNeeded: 'Tap to resume tuning'
};
