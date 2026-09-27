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
export const TUNER_INSTRUMENT_SHORT_LABELS: Record<TunerInstrumentId, string> = {
  electric: 'Elec.', acoustic: 'Acous.', bass: 'Bass', drums: 'Drums',
};

// Example gauges in thousandths of an inch, ordered lowest to highest string.
// Users can replace these with the gauges fitted to their instrument.
export const TUNER_STRING_GAUGES: Record<Exclude<TunerInstrumentId, 'drums'>, Record<number, number[]>> = {
  electric: {
    1: [10], 2: [13, 10], 3: [17, 13, 10],
    4: [30, 17, 13, 10], 5: [42, 30, 17, 13, 10],
    6: [52, 42, 30, 17, 13, 10],
    7: [64, 52, 42, 30, 17, 13, 10],
    8: [74, 64, 52, 42, 30, 17, 13, 10],
    9: [90, 74, 64, 52, 42, 30, 17, 13, 10],
    10: [105, 90, 74, 64, 52, 42, 30, 17, 13, 10],
    11: [120, 105, 90, 74, 64, 52, 42, 30, 17, 13, 10],
    // Paired courses follow the 12-string tuning generator's order.
    12: [46, 26, 36, 18, 26, 12, 17, 8, 13, 13, 10, 10],
  },
  acoustic: {
    1: [12], 2: [16, 12], 3: [24, 16, 12],
    4: [32, 24, 16, 12], 5: [42, 32, 24, 16, 12],
    6: [53, 42, 32, 24, 16, 12],
    7: [65, 53, 42, 32, 24, 16, 12],
    8: [80, 65, 53, 42, 32, 24, 16, 12],
    9: [95, 80, 65, 53, 42, 32, 24, 16, 12],
    10: [110, 95, 80, 65, 53, 42, 32, 24, 16, 12],
    11: [125, 110, 95, 80, 65, 53, 42, 32, 24, 16, 12],
    12: [47, 27, 39, 18, 30, 12, 23, 8, 14, 14, 10, 10],
  },
  bass: {
    1: [45], 2: [65, 45], 3: [85, 65, 45],
    4: [105, 85, 65, 45], 5: [130, 105, 85, 65, 45],
    6: [130, 105, 85, 65, 45, 32],
    7: [145, 130, 105, 85, 65, 45, 32],
    8: [145, 130, 105, 85, 65, 45, 32, 25],
    9: [165, 145, 130, 105, 85, 65, 45, 32, 25],
    10: [165, 145, 130, 105, 85, 65, 45, 32, 25, 20],
    11: [185, 165, 145, 130, 105, 85, 65, 45, 32, 25, 20],
    12: [185, 165, 145, 130, 105, 85, 65, 45, 32, 25, 20, 16],
  },
};

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

/* In-tune tolerance choices (± cents). 3 is the default. */
export const TUNER_TOLERANCES = [0.5, 1, 2, 3, 5] as const;
export const DEFAULT_TUNER_TOLERANCE = 3;

export const A4_CALIBRATION: readonly number[] = [415, 432, 440, 442, 443];

export function noteToFreq(midi: number, a4: number = A4_REFERENCE): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

const TUNER_STRINGS = {
  'G#0': { label: 'Low G#', note: 'G#0', midi: 20 },
  A0: { label: 'Low A', note: 'A0', midi: 21 },
  Bb0: { label: 'Low Bb', note: 'Bb0', midi: 22 },
  'A#0': { label: 'Low A#', note: 'A#0', midi: 22 },
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
  Gb4: { label: '1st (Gb)', note: 'Gb4', midi: 66 },
  'F#4': { label: '1st (F#)', note: 'F#4', midi: 66 },
  G4: { label: '1st (G)', note: 'G4', midi: 67 },
  'G#4': { label: '1st (G#)', note: 'G#4', midi: 68 },
  Ab4: { label: '1st (Ab)', note: 'Ab4', midi: 68 },
  A4: { label: '1st (A)', note: 'A4', midi: 69 },
  'A#4': { label: '1st (A#)', note: 'A#4', midi: 70 },
  Bb4: { label: '1st (Bb)', note: 'Bb4', midi: 70 },
  B4: { label: '1st (B)', note: 'B4', midi: 71 }
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
  guitarPreset('a-standard', 'A Standard', 'standard', ['A1', 'D2', 'G2', 'C3', 'E3', 'A3']),
  guitarPreset('ab-standard', 'Ab Standard (G#)', 'standard', ['Ab1', 'Db2', 'Gb2', 'B2', 'Db3', 'Gb3']),
  guitarPreset('g-standard', 'G Standard', 'standard', ['G1', 'C2', 'F2', 'Bb2', 'D3', 'G3']),
  guitarPreset('fsharp-standard', 'F# Standard (Gb)', 'standard', ['F#1', 'B1', 'E2', 'A2', 'C#3', 'F#3']),
  guitarPreset('f-standard', 'F Standard', 'standard', ['F1', 'Bb1', 'Eb2', 'Ab2', 'C3', 'F3']),
  guitarPreset('f-up', 'F Standard (Half-Step Up)', 'standard', ['F2', 'Bb2', 'Eb3', 'Ab3', 'C4', 'F4']),
  guitarPreset('fsharp-up', 'F# Standard (Up)', 'standard', ['F#2', 'B2', 'E3', 'A3', 'C#4', 'F#4']),
  guitarPreset('terz', 'Terz (G Standard Up)', 'standard', ['G2', 'C3', 'F3', 'Bb3', 'D4', 'G4']),
  guitarPreset('ab-up', 'Ab Standard (Up)', 'standard', ['G#2', 'C#3', 'F#3', 'B3', 'D#4', 'G#4']),
  guitarPreset('a-up', 'A Standard (Requinto)', 'standard', ['A2', 'D3', 'G3', 'C4', 'E4', 'A4']),
  guitarPreset('bb-up', 'Bb Standard (Up)', 'standard', ['A#2', 'D#3', 'G#3', 'C#4', 'F4', 'A#4'])
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
  guitarPreset('drop-eb', 'Drop Eb (D#)', 'standard', ['Eb1', 'Bb1', 'Eb2', 'Ab2', 'C3', 'F3']),
  guitarPreset('drop-d1', 'Drop D1 (Octave)', 'standard', ['D1', 'A1', 'D2', 'G2', 'B2', 'E3']),
  guitarPreset('drop-db1', 'Drop C#1 / Db1', 'standard', ['C#1', 'G#1', 'C#2', 'F#2', 'A#2', 'D#3']),
  guitarPreset('drop-c1', 'Drop C1 (Octave)', 'standard', ['C1', 'G1', 'C2', 'F2', 'A2', 'D3']),
  guitarPreset('drop-csharp-stdvar', 'Drop C# in Standard Var', 'standard', ['C#2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-c-stdvar', 'Drop C in Standard Var', 'standard', ['C2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-b-stdvar', 'Drop B in Standard Var', 'standard', ['B1', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-b-e', 'Drop B-E (Tool)', 'standard', ['B1', 'E2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-a-stdvar', 'Drop A in Standard Var', 'standard', ['A1', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-a-dstd', 'Drop A in D Standard', 'standard', ['A1', 'G1', 'C2', 'F2', 'A2', 'D3']),
  guitarPreset('drop-g-cstd', 'Drop G in C Standard', 'standard', ['G1', 'F1', 'A#1', 'D#2', 'G2', 'C3']),
  guitarPreset('double-drop-csharp', 'Double Drop C#', 'standard', ['C#2', 'G#2', 'C#3', 'F#3', 'A#3', 'C#4']),
  guitarPreset('double-drop-c', 'Double Drop C', 'standard', ['C2', 'G2', 'C3', 'F3', 'A3', 'C4']),
  guitarPreset('double-drop-b', 'Double Drop B', 'standard', ['B1', 'F#2', 'B2', 'E3', 'G#3', 'B3']),
  guitarPreset('double-drop-bb', 'Double Drop Bb', 'standard', ['A#1', 'F2', 'A#2', 'D#3', 'G3', 'A#3']),
  guitarPreset('double-drop-a', 'Double Drop A', 'standard', ['A1', 'E2', 'A2', 'D3', 'F#3', 'A3']),
  guitarPreset('double-drop-ab', 'Double Drop Ab', 'standard', ['Ab1', 'Eb2', 'Ab2', 'Db3', 'F3', 'Ab3']),
  guitarPreset('double-drop-g', 'Double Drop G', 'standard', ['G1', 'D2', 'G2', 'C3', 'E3', 'G3']),
  guitarPreset('double-drop-fsharp', 'Double Drop F#', 'standard', ['F#1', 'C#2', 'F#2', 'B2', 'D#3', 'F#3']),
  guitarPreset('double-drop-f', 'Double Drop F', 'standard', ['F1', 'C2', 'F2', 'Bb2', 'D3', 'F3']),
  guitarPreset('double-drop-e', 'Double Drop E', 'standard', ['E1', 'B1', 'E2', 'A2', 'C#3', 'E3']),
  guitarPreset('double-drop-eb', 'Double Drop Eb', 'standard', ['Eb1', 'Bb1', 'Eb2', 'Ab2', 'C3', 'Eb3']),
  guitarPreset('double-drop-d', 'Double Drop D (Neil Young)', 'standard', ['D2', 'A2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('double-drop-d1', 'Double Drop D1 (Octave)', 'standard', ['D1', 'A1', 'D2', 'G2', 'B2', 'D3'])
];

const GUITAR_6_OPEN: TunerPreset[] = [
  guitarPreset('open-g', 'Open G', 'open', ['D2', 'G2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('open-d', 'Open D', 'open', ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']),
  guitarPreset('open-e', 'Open E', 'open', ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']),
  guitarPreset('open-c', 'Open C', 'open', ['C2', 'G2', 'C3', 'G3', 'C4', 'E4']),
  guitarPreset('open-a', 'Open A', 'open', ['E2', 'A2', 'E3', 'A3', 'C#4', 'E4']),
  guitarPreset('open-dm', 'Open Dm', 'open', ['D2', 'A2', 'D3', 'F3', 'A3', 'D4']),
  guitarPreset('open-em', 'Open Em', 'open', ['E2', 'B2', 'E3', 'G3', 'B3', 'E4']),
  guitarPreset('open-gm', 'Open Gm', 'open', ['D2', 'G2', 'D3', 'G3', 'Bb3', 'D4']),
  guitarPreset('open-b', 'Open B', 'open', ['B1', 'F#2', 'B2', 'F#3', 'B3', 'D#4']),
  guitarPreset('open-b-alt', 'Open B (Alt)', 'open', ['F#2', 'B2', 'D#3', 'F#3', 'B3', 'D#4']),
  guitarPreset('open-c-overtones', 'Open C Overtones (CCGCEG)', 'open', ['C2', 'C2', 'G2', 'C3', 'E3', 'G3']),
  guitarPreset('open-c-english', 'Open C (English Guitar)', 'open', ['C2', 'E2', 'G2', 'C3', 'E3', 'G3']),
  guitarPreset('open-d-richards', 'Open D (Richards / Jumpin Jack Flash)', 'open', ['D2', 'A2', 'D3', 'A3', 'D4', 'D4']),
  guitarPreset('open-csharp', 'Open C# / Db Major', 'open', ['C#2', 'G#2', 'C#3', 'F3', 'G#3', 'C#4']),
  guitarPreset('open-e-dropped', 'Open E Dropped Variant (EG#BEBE)', 'open', ['E2', 'G#2', 'B2', 'E3', 'B3', 'E4']),
  guitarPreset('open-f', 'Open F (Cotten / Levee Breaks)', 'open', ['F2', 'A2', 'C3', 'F3', 'C4', 'F4']),
  guitarPreset('open-f-alt', 'Open F Alt (CFCFAC)', 'open', ['C2', 'F2', 'C3', 'F3', 'A3', 'C4']),
  guitarPreset('open-f-mason', 'Open F (Dave Mason FF CFAC)', 'open', ['F2', 'F2', 'C3', 'F3', 'A3', 'C4']),
  guitarPreset('open-fsharp', 'Open F#', 'open', ['F#2', 'A#2', 'C#3', 'F#3', 'C#4', 'F#4']),
  guitarPreset('facgce-mathrock', 'FACGCE (Math Rock)', 'open', ['F2', 'A2', 'C3', 'G3', 'C4', 'E4']),
  guitarPreset('wax-wings', 'FACGCE down 1.5 (Wax Wings)', 'open', ['D2', 'F#2', 'A2', 'E3', 'A3', 'C#4']),
  guitarPreset('open-g-overtones', 'Open G Overtones (GGDBGD)', 'open', ['G2', 'G2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('open-g-slack', 'Open G Slack-Key / Dobro (GBDGBD)', 'open', ['G2', 'B2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('cross-a', 'Cross-Note A (Open Am)', 'open', ['E2', 'A2', 'E3', 'A3', 'C4', 'E4']),
  guitarPreset('cross-a-alt', 'Cross-Note A Alt (EACEAE)', 'open', ['E2', 'A2', 'C3', 'E3', 'A3', 'E4']),
  guitarPreset('cross-c', 'Cross-Note C (Open Cm)', 'open', ['C2', 'G2', 'C3', 'G3', 'C4', 'Eb4']),
  guitarPreset('cross-c-overtones', 'Cross-Note C Overtones', 'open', ['C2', 'C2', 'G2', 'C3', 'Eb3', 'G3']),
  guitarPreset('cross-c-seventh', 'Cross-Note C Overtones 7th', 'open', ['C2', 'C2', 'G2', 'C3', 'Eb3', 'Ab3']),
  guitarPreset('cross-f', 'Cross-Note F (Rare)', 'open', ['F2', 'Ab2', 'C3', 'F3', 'C4', 'F4']),
  guitarPreset('cross-f-alt', 'Cross-Note F Alt (Collins)', 'open', ['F2', 'C3', 'F3', 'Ab3', 'C4', 'F4']),
  guitarPreset('sitar-a', 'Sitar A', 'open', ['E2', 'A2', 'E3', 'A3', 'E4', 'A4'])
];

const GUITAR_6_ARTIST: TunerPreset[] = [
  // Joni Mitchell family — verified via jonimitchell.com/tuningpatterns + web research
  guitarPreset('joni-hejira', 'Joni Mitchell: Hejira (CGDFCE)', 'artist', ['C2', 'G2', 'D3', 'F3', 'C4', 'E4']),
  guitarPreset('joni-sweet-bird', 'Joni Mitchell: Sweet Bird (CGDGBD)', 'artist', ['C2', 'G2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('joni-both-sides', 'Joni Mitchell: Both Sides Now / Big Yellow Taxi (Open E)', 'artist', ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']),
  guitarPreset('joni-coyote', 'Joni Mitchell: Coyote (CGDFCE alt)', 'artist', ['C2', 'G2', 'D3', 'F3', 'C4', 'E4']),
  guitarPreset('joni-helpless', 'Joni Mitchell: Help Me / Chelsea Morning variant (DADGAD capo)', 'artist', ['D2', 'A2', 'D3', 'G3', 'A3', 'D4']),
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
  guitarPreset('nashville', 'Nashville High-Strung', 'artist', ['E3', 'A3', 'D4', 'G4', 'B3', 'E4']),
  guitarPreset('asus2', 'Asus2 Modal', 'artist', ['E2', 'A2', 'B2', 'E3', 'A3', 'E4']),
  guitarPreset('asus4', 'Asus4 Modal (Graham)', 'artist', ['E2', 'A2', 'D3', 'E3', 'A3', 'E4']),
  guitarPreset('bb-modal', 'Bb Modal (Young)', 'artist', ['Bb1', 'F2', 'Bb2', 'Eb3', 'G3', 'Bb3']),
  guitarPreset('bsus4', 'Bsus4 (Sevendust)', 'artist', ['B1', 'F#2', 'B2', 'E3', 'F#3', 'B3']),
  guitarPreset('badd9', 'Badd9 (Townsend)', 'artist', ['B1', 'F#2', 'C#3', 'F#3', 'B3', 'D#4']),
  guitarPreset('csus4-9', 'Csus4+9 (Simpson/Wilcox)', 'artist', ['C2', 'G2', 'C3', 'F3', 'C4', 'D4']),
  guitarPreset('csus4', 'Csus4 (Renbourn)', 'artist', ['C2', 'G2', 'C3', 'F3', 'G3', 'C4']),
  guitarPreset('csharpsus4', 'C#sus4', 'artist', ['C#2', 'G#2', 'C#3', 'F#3', 'G#3', 'C#4']),
  guitarPreset('esus2', 'Esus2', 'artist', ['E2', 'B2', 'E3', 'F#3', 'B3', 'E4']),
  guitarPreset('esus4', 'Esus4 (EBEABE)', 'artist', ['E2', 'B2', 'E3', 'A3', 'B3', 'E4']),
  guitarPreset('esus4-alt', 'Esus4 Alt (EABEBE)', 'artist', ['E2', 'A2', 'B2', 'E3', 'B3', 'E4']),
  guitarPreset('e7sus4', 'E7sus4 (Sheeran)', 'artist', ['E2', 'A2', 'D3', 'E3', 'B3', 'E4']),
  guitarPreset('bruce-palmer', 'Bruce Palmer Modal (EEEEBE)', 'artist', ['E2', 'E2', 'E3', 'E3', 'B3', 'E4']),
  guitarPreset('e-modal', 'E Modal (EBEEBE)', 'artist', ['E2', 'B2', 'E3', 'E3', 'B3', 'E4']),
  guitarPreset('eebbbb', 'Soundgarden Modal (EEBBBB)', 'artist', ['E2', 'E2', 'B2', 'B2', 'B2', 'B3']),
  guitarPreset('drakes-drone', 'Drake\'s Drone (BEBEBE)', 'artist', ['B1', 'E2', 'B2', 'E3', 'B3', 'E4']),
  guitarPreset('gsus2', 'Gsus2 Modal', 'artist', ['D2', 'G2', 'D3', 'G3', 'A3', 'D4']),
  guitarPreset('gsus4', 'Gsus4 (DGDGCD Sawmill)', 'artist', ['D2', 'G2', 'D3', 'G3', 'C4', 'D4']),
  guitarPreset('gsus4-alt', 'Gsus4 Alt (GCDGCD Swervedriver)', 'artist', ['G2', 'C3', 'D3', 'G3', 'C4', 'D4']),
  guitarPreset('badd4', 'B add4 (TTNG / Bon Iver)', 'artist', ['E2', 'B2', 'D#3', 'F#3', 'B3', 'E4']),
  guitarPreset('c6-jimmy-page', 'C6 (Page / Bron-Yr-Aur)', 'artist', ['C2', 'A2', 'C3', 'G3', 'C4', 'E4']),
  guitarPreset('c6-9', 'C6/9', 'artist', ['C2', 'G2', 'C3', 'E3', 'A3', 'D4']),
  guitarPreset('cmaj11', 'Cmaj11 (4th of July)', 'artist', ['C2', 'F2', 'C3', 'G3', 'B3', 'E4']),
  guitarPreset('cmadd4', 'Cm add4 (TTNG)', 'artist', ['C2', 'F2', 'C3', 'G3', 'C4', 'D#4']),
  guitarPreset('open-page', 'Open Page / Csus2 (Rain Song)', 'artist', ['D2', 'G2', 'C3', 'G3', 'C4', 'D4']),
  guitarPreset('dm7', 'Dm7', 'artist', ['D2', 'A2', 'D3', 'F3', 'A3', 'C4']),
  guitarPreset('dm9', 'Dm9', 'artist', ['D2', 'A2', 'D3', 'F3', 'C4', 'E4']),
  guitarPreset('dmadd9', 'Dm add9 (Opeth)', 'artist', ['D2', 'A2', 'D3', 'F3', 'A3', 'E4']),
  guitarPreset('dadd9', 'Dadd9 (José González)', 'artist', ['D2', 'A2', 'D3', 'F#3', 'A3', 'E4']),
  guitarPreset('d6', 'D6', 'artist', ['D2', 'A2', 'D3', 'F#3', 'B3', 'D4']),
  guitarPreset('d7', 'D7', 'artist', ['D2', 'A2', 'D3', 'F#3', 'A3', 'C4']),
  guitarPreset('dmaj7', 'Dmaj7', 'artist', ['D2', 'A2', 'D3', 'F#3', 'A3', 'C#4']),
  guitarPreset('dsharp-m-add24', 'D#m add2/4 (TTNG)', 'artist', ['F2', 'G#2', 'D#3', 'F#3', 'A#3', 'D#4']),
  guitarPreset('em7-c', 'Em7/C (Soundgarden / Thompson)', 'artist', ['C2', 'G2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('fmaj9', 'Fmaj9 (Never Meant)', 'artist', ['F2', 'A2', 'C3', 'G3', 'C4', 'E4']),
  guitarPreset('g6', 'G6 (Soundgarden)', 'artist', ['D2', 'G2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('g7', 'G7', 'artist', ['D2', 'G2', 'D3', 'G3', 'B3', 'F4']),
  guitarPreset('gmaj7', 'Gmaj7', 'artist', ['D2', 'G2', 'D3', 'F#3', 'B3', 'D4']),
  guitarPreset('bbmaj7', 'Bbmaj7 (Rare)', 'artist', ['A#1', 'F2', 'A#2', 'D3', 'A3', 'D4']),
  guitarPreset('gadd4', 'Gadd4 (Like Suicide)', 'artist', ['D2', 'G2', 'D3', 'G3', 'B3', 'C4']),
  guitarPreset('em11', 'Em11 (Guinnevere)', 'artist', ['E2', 'B2', 'D3', 'G3', 'A3', 'D4']),
  guitarPreset('major-seconds', 'Major Seconds (Compact)', 'artist', ['C2', 'D2', 'E2', 'F#2', 'G#2', 'A#2']),
  guitarPreset('major-seconds-alt', 'Major Seconds Alt', 'artist', ['C#2', 'D#2', 'F2', 'G2', 'A2', 'B2']),
  guitarPreset('minor-thirds', 'Minor Thirds (Diminished)', 'artist', ['C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3']),
  guitarPreset('major-thirds-e', 'Major Thirds (E G# C)', 'artist', ['E2', 'G#2', 'C3', 'E3', 'G#3', 'C4']),
  guitarPreset('aug-fourths', 'Augmented Fourths / Tritone', 'artist', ['C2', 'F#2', 'C3', 'F#3', 'C4', 'F#4']),
  guitarPreset('aug-fourths-alt', 'Augmented Fourths Alt (BFbfbf)', 'artist', ['B1', 'F2', 'B2', 'F3', 'B3', 'F4']),
  guitarPreset('all-fifths', 'All Fifths Mandoguitar (CGDAEB)', 'artist', ['C2', 'G2', 'D3', 'A3', 'E4', 'B4']),
  guitarPreset('all-fifths-alt', 'All Fifths Alt (GDAEBF#)', 'artist', ['G1', 'D2', 'A2', 'E3', 'B3', 'F#4']),
  guitarPreset('daddad', 'DADDAD (Papa-Papa)', 'artist', ['D2', 'A2', 'D3', 'D3', 'A3', 'D4']),
  guitarPreset('cello-std', 'Cello + Standard (CGDABE)', 'artist', ['C2', 'G2', 'D3', 'A3', 'B3', 'E4']),
  guitarPreset('karnivool', 'Karnivool (BF#BGBE)', 'artist', ['B1', 'F#2', 'B2', 'G3', 'B3', 'E4']),
  guitarPreset('karnivool-alt', 'Karnivool Alt (BF#Bf#BE)', 'artist', ['B1', 'F#2', 'B2', 'F#3', 'B3', 'E4']),
  guitarPreset('mi-compose', 'Mi-Composé (Soukous)', 'artist', ['E2', 'A2', 'D4', 'G3', 'B3', 'E4']),
  guitarPreset('iris', 'Iris (Goo Goo Dolls)', 'artist', ['B2', 'D3', 'D3', 'D3', 'D4', 'D4']),
  guitarPreset('sleeping-ute', 'Sleeping Ute (Grizzly Bear)', 'artist', ['E2', 'A2', 'C#3', 'F#3', 'A3', 'C#4']),
  guitarPreset('mr-tom', 'Mr.Tom (DFAEF#A)', 'artist', ['D2', 'F#2', 'A2', 'E3', 'F#3', 'A3']),
  guitarPreset('liberty', 'Liberty Partial-Capo (Reid)', 'artist', ['E2', 'A2', 'D3', 'G3', 'C4', 'E4']),
  guitarPreset('converge', 'Converge (Jane Doe)', 'artist', ['C2', 'G2', 'C3', 'F3', 'G#3', 'C4']),
  guitarPreset('converge-alt', 'Converge Alt (Axe to Fall)', 'artist', ['C2', 'F#2', 'C3', 'F#3', 'A3', 'C4']),
  guitarPreset('el-ten-eleven', 'El Ten Eleven (EADG#BE)', 'artist', ['E2', 'A2', 'D3', 'G#3', 'B3', 'E4']),
  guitarPreset('staind', 'Staind (AbDbAbDbGbBb)', 'artist', ['Ab1', 'Db2', 'Ab2', 'Db3', 'Gb3', 'Bb3']),
  guitarPreset('staind-alt', 'Staind Alt (Price to Play)', 'artist', ['Gb1', 'Db2', 'Ab2', 'Db3', 'Gb3', 'Bb3']),
  guitarPreset('lute', 'Renaissance Lute (EADf#be)', 'artist', ['E2', 'A2', 'D3', 'F#3', 'B3', 'E4']),
  guitarPreset('balalaika', 'Balalaika (EADEEA)', 'artist', ['E2', 'A2', 'D3', 'E3', 'E3', 'A3']),
  guitarPreset('cittern', 'Cittern (CGCGCG)', 'artist', ['C2', 'G2', 'C3', 'G3', 'C4', 'G4']),
  guitarPreset('dobro', 'Dobro (GBDGBD)', 'artist', ['G2', 'B2', 'D3', 'G3', 'B3', 'D4']),
  // Additional artist tunings — Sonic Youth, Nick Drake, Led Zeppelin, Soundgarden
  guitarPreset('sonic-fsharp', 'Sonic Youth: F#F#F#F#EB (Starpower)', 'artist', ['F#2', 'F#2', 'F#2', 'F#2', 'E3', 'B3']),
  guitarPreset('sonic-ggddd', 'Sonic Youth: GGDDD#D (Bull in the Heather)', 'artist', ['G2', 'G2', 'D3', 'D3', 'D#3', 'D4']),
  guitarPreset('nick-drake-cgcfce', 'Nick Drake: CGCFCE (Place To Be)', 'artist', ['C2', 'G2', 'C3', 'F3', 'C4', 'E4']),
  guitarPreset('nick-drake-dadgad', 'Nick Drake: DADGAD capo variant', 'artist', ['D2', 'A2', 'D3', 'G3', 'A3', 'D4']),
  guitarPreset('zeppelin-dadgad', 'Led Zeppelin: DADGAD (Kashmir)', 'artist', ['D2', 'A2', 'D3', 'G3', 'A3', 'D4']),
  guitarPreset('zeppelin-c6', 'Led Zeppelin: CACGCE (Bron-Yr-Aur)', 'artist', ['C2', 'A2', 'C3', 'G3', 'C4', 'E4']),
  guitarPreset('soundgarden-ebebbb', 'Soundgarden: EEBBBB (Rusty Cage alt)', 'artist', ['E2', 'E2', 'B2', 'B2', 'B2', 'B3'])
];

const GUITAR_5_PRESETS: TunerPreset[] = [
  guitarPreset('open-g-5', 'Open G (Keith Richards 5-string)', 'open', ['G2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('standard-low-5', 'Standard (Low 5)', 'standard', ['E2', 'A2', 'D3', 'G3', 'B3']),
  guitarPreset('standard-high-5', 'Standard (High 5)', 'standard', ['A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-d-5', 'Drop D (5-string)', 'standard', ['D2', 'A2', 'D3', 'G3', 'B3']),
  guitarPreset('high-c-5', 'High C (All Fourths)', 'artist', ['E2', 'A2', 'D3', 'G3', 'C4']),
  guitarPreset('celloblaster', 'Celloblaster / Guitello (CGDAE)', 'artist', ['C2', 'G2', 'D3', 'A3', 'E4']),
  guitarPreset('baritone-5', 'Baritone 5 (EADF#B)', 'standard', ['E2', 'A2', 'D3', 'F#3', 'B3']),
  guitarPreset('baritone-5-alt', 'Baritone 5 Alt (EAC#F#B)', 'standard', ['E2', 'A2', 'C#3', 'F#3', 'B3']),
  guitarPreset('open-eb5', 'Open Eb5 Power Chord', 'open', ['Eb2', 'Bb2', 'Eb3', 'Bb3', 'Eb4']),
  guitarPreset('jacob-collier', 'Jacob Collier Mirrored (DAEAD)', 'artist', ['D2', 'A2', 'E3', 'A3', 'D4'])
];

const GUITAR_7_PRESETS: TunerPreset[] = [
  guitarPreset('7-standard', 'Standard (7-String B)', 'standard', ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-drop-a', 'Drop A (7-string)', 'standard', ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-eb', 'Half-Step Down (Bb)', 'standard', ['Bb1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  guitarPreset('7-d-standard', 'D Standard (7)', 'standard', ['A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('7-choro', 'Standard Choro (CEADGBE)', 'standard', ['C2', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-thirds', 'Thirds (EG#CEG#CE)', 'artist', ['E2', 'G#2', 'C3', 'E3', 'G#3', 'C4', 'E4']),
  guitarPreset('7-all-fourths', 'All Fourths (7)', 'artist', ['B1', 'E2', 'A2', 'D3', 'G3', 'C4', 'F4']),
  guitarPreset('7-russian', 'Russian Open G (DGBDgbd)', 'open', ['D2', 'G2', 'B2', 'D3', 'G3', 'B3', 'D4']),
  guitarPreset('7-open-c', 'Open C + Low G (Townsend)', 'open', ['G1', 'C2', 'G2', 'C3', 'G3', 'C4', 'E4']),
  guitarPreset('7-ab-standard', 'Ab Standard (7)', 'standard', ['G#1', 'C#2', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  guitarPreset('7-g-standard', 'G Standard (7)', 'standard', ['G1', 'C2', 'F2', 'A#2', 'D#3', 'G3', 'C4']),
  guitarPreset('7-fsharp-standard', 'F# Standard (7)', 'standard', ['F#1', 'B1', 'E2', 'A2', 'D3', 'F#3', 'B3']),
  guitarPreset('7-f-standard', 'F Standard (7)', 'standard', ['F1', 'A#1', 'D#2', 'G#2', 'C#3', 'F3', 'A#3']),
  guitarPreset('7-e-standard', 'E Standard (7)', 'standard', ['E1', 'A1', 'D2', 'G2', 'C3', 'E3', 'A3']),
  guitarPreset('7-eb-standard', 'Eb Standard (7)', 'standard', ['D#1', 'G#1', 'C#2', 'F#2', 'B2', 'D#3', 'G#3']),
  guitarPreset('7-d-std-low', 'D Standard (7, low D)', 'standard', ['D1', 'G1', 'C2', 'F2', 'A#2', 'D3', 'G3']),
  guitarPreset('7-csharp-standard', 'C# Standard (7)', 'standard', ['C#1', 'F#1', 'B1', 'E2', 'A2', 'C#3', 'F#3']),
  guitarPreset('7-c-standard', 'C Standard (7)', 'standard', ['C1', 'F1', 'A#1', 'D#2', 'G#2', 'C3', 'F3']),
  guitarPreset('7-octave', 'Octave Down (7)', 'standard', ['B0', 'E1', 'A1', 'D2', 'G2', 'B2', 'E3']),
  guitarPreset('7-high-a', 'High A (Breau / Galbraith)', 'artist', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4']),
  guitarPreset('7-c-up', 'C Standard Up Half (Rendini)', 'standard', ['C2', 'F2', 'A#2', 'D#3', 'G3', 'C4', 'F4']),
  guitarPreset('7-csharp-up', 'C# Standard Up (Borland)', 'standard', ['C#2', 'F#2', 'B2', 'E3', 'A3', 'C#4', 'F#4']),
  guitarPreset('7-drop-gsharp', 'Drop G# (7)', 'standard', ['G#1', 'D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4']),
  guitarPreset('7-drop-g', 'Drop G (7)', 'standard', ['G1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('7-drop-fsharp', 'Drop F# (7)', 'standard', ['F#1', 'C#2', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  guitarPreset('7-drop-f', 'Drop F (7)', 'standard', ['F1', 'C2', 'F2', 'A#2', 'D#3', 'G3', 'C4']),
  guitarPreset('7-drop-e1', 'Drop E1 (7)', 'standard', ['E1', 'B1', 'E2', 'A2', 'D3', 'F#3', 'B3']),
  guitarPreset('7-drop-eb', 'Drop Eb (7)', 'standard', ['D#1', 'A#1', 'D#2', 'G#2', 'C#3', 'F3', 'A#3']),
  guitarPreset('7-drop-d1', 'Drop D1 (7)', 'standard', ['D1', 'A1', 'D2', 'G2', 'C3', 'E3', 'A3']),
  guitarPreset('7-drop-db1', 'Drop Db1 (7)', 'standard', ['C#1', 'G#1', 'C#2', 'F#2', 'B2', 'D#3', 'G#3']),
  guitarPreset('7-drop-c1', 'Drop C1 (7)', 'standard', ['C1', 'G1', 'C2', 'F2', 'A#2', 'D3', 'G3']),
  guitarPreset('7-drop-b0', 'Drop B0 (7)', 'standard', ['B0', 'F#1', 'B1', 'E2', 'A2', 'C#3', 'F#3']),
  guitarPreset('7-drop-bb0', 'Drop Bb0 (7)', 'standard', ['A#0', 'F1', 'A#1', 'D#2', 'G#2', 'C3', 'F3']),
  guitarPreset('7-drop-a0', 'Drop A0 (7)', 'standard', ['A0', 'E1', 'A1', 'D2', 'G2', 'B2', 'E3']),
  guitarPreset('7-drop-d-double', 'Drop D Doubled (Some Kind of Monster)', 'standard', ['D2', 'D3', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-drop-d-b', 'Drop D + B (CAFO / Racecar)', 'standard', ['B1', 'D2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-drop-d-a', 'Drop D + A (Dir En Grey)', 'standard', ['A1', 'D2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('7-g-bb', 'G + Bb Standard (Crystal Lake)', 'standard', ['G1', 'A#1', 'D#2', 'G#2', 'C#3', 'F3', 'A#3']),
  guitarPreset('7-fsharp-dsharp', 'F# + D# Standard (Ragnarok)', 'standard', ['F#1', 'D#1', 'G#1', 'C#2', 'F#2', 'A#2', 'D#3'])
];

const GUITAR_8_PRESETS: TunerPreset[] = [
  guitarPreset('8-standard', 'Standard (8-String F#)', 'standard', ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('8-drop-e', 'Drop E (8-string)', 'standard', ['E1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('8-eb', 'Half-Step Down (8)', 'standard', ['F1', 'Bb1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  guitarPreset('8-f-drop-ab', 'F + Drop Ab (8)', 'standard', ['F1', 'Ab1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  guitarPreset('8-e-standard', 'E Standard (8)', 'standard', ['E1', 'A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('8-eb-standard', 'Eb Standard (8)', 'standard', ['Eb1', 'Ab1', 'Db2', 'Gb2', 'B2', 'E3', 'Ab3', 'Db4']),
  guitarPreset('8-d-standard', 'D Standard (8)', 'standard', ['D1', 'G1', 'C2', 'F2', 'A#2', 'D#3', 'G3', 'C4']),
  guitarPreset('8-db-standard', 'Db Standard (8)', 'standard', ['Db1', 'Gb1', 'B1', 'E2', 'A2', 'Db3', 'Gb3', 'B3']),
  guitarPreset('8-high-a', 'High A (Brahms Guitar)', 'artist', ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4']),
  guitarPreset('8-all-fourths', 'All Fourths (8)', 'artist', ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'C4', 'F4']),
  guitarPreset('8-drop-fsharp', 'Drop F# (8)', 'standard', ['F#1', 'C#2', 'F#2', 'B2', 'E3', 'A3', 'C#4', 'F#4']),
  guitarPreset('8-drop-f', 'Drop F (8)', 'standard', ['F1', 'C2', 'F2', 'A#2', 'D#3', 'G#3', 'C4', 'F4']),
  guitarPreset('8-drop-a-e', 'Drop A + E (DOOM / Rings of Saturn)', 'standard', ['E1', 'A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('8-drop-e-a', 'Drop E + A Var (Infant Annihilator)', 'standard', ['E1', 'A1', 'E2', 'A2', 'D3', 'F#3', 'B3', 'E4']),
  guitarPreset('8-drop-eb', 'Drop Eb (8)', 'standard', ['Eb1', 'Bb1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  guitarPreset('8-ion-dissonance', 'Ion Dissonance Var (D# shape)', 'standard', ['D#1', 'G#1', 'C#2', 'F#2', 'C#3', 'F#3', 'A#3', 'D#4']),
  guitarPreset('8-drop-eb-ab', 'Drop Eb + Ab (Meshuggah)', 'standard', ['Eb1', 'Ab1', 'Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']),
  guitarPreset('8-drop-d', 'Drop D (8)', 'standard', ['D1', 'A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('8-drop-d-g', 'Drop D + G Var (E.M.M.P.)', 'standard', ['D1', 'G1', 'D2', 'G2', 'C3', 'E3', 'A3', 'D4']),
  guitarPreset('8-drop-csharp', 'Drop C# (8)', 'standard', ['C#1', 'G#1', 'C#2', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  guitarPreset('8-drop-c', 'Drop C (8)', 'standard', ['C1', 'G1', 'C2', 'F2', 'A#2', 'D#3', 'G3', 'C4']),
  guitarPreset('8-drop-csharp-a', 'Drop C# + A (New Eden)', 'standard', ['C#1', 'A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('8-drop-csharp-b', 'Drop C# + B (Hell Below)', 'standard', ['C#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('8-drop-e-open', 'Drop E Open (Tony Danza)', 'open', ['E1', 'B1', 'E2', 'B2', 'E3', 'F#3', 'B3', 'E4']),
  guitarPreset('8-drop-a-sharp-x2', 'Drop A# + A# (Spasm)', 'standard', ['A#1', 'A#1', 'D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'])
];

const GUITAR_9_PRESETS: TunerPreset[] = [
  guitarPreset('9-standard', 'Standard (9-String C#)', 'standard', ['C#1', 'F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('9-drop-e', 'Drop E (9-string)', 'standard', ['B0', 'E1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('9-c1', 'C1 Standard (9)', 'standard', ['C1', 'F1', 'A#1', 'D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4']),
  guitarPreset('9-b0', 'B0 Standard (9)', 'standard', ['B0', 'E1', 'A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('9-bb0', 'Bb0 Standard (9)', 'standard', ['A#0', 'D#1', 'G#1', 'C#2', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  guitarPreset('9-a0', 'A0 Standard (9)', 'standard', ['A0', 'D1', 'G1', 'C2', 'F2', 'A#2', 'D#3', 'G3', 'C4']),
  guitarPreset('9-high-a', 'High A (9)', 'artist', ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4']),
  guitarPreset('9-drop-b', 'Drop B (Scallon / Baena)', 'standard', ['B0', 'F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('9-dd-bb', 'Double Drop Bb (9)', 'standard', ['A#0', 'F1', 'A#1', 'D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4']),
  guitarPreset('9-dd-a', 'Double Drop A (9)', 'standard', ['A0', 'E1', 'A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('9-drop-a', 'Drop A (9)', 'standard', ['A0', 'E1', 'A1', 'D2', 'G2', 'C3', 'F3', 'A3', 'D4']),
  guitarPreset('9-dd-gsharp', 'Double Drop G# (Carthage)', 'standard', ['G#0', 'D#1', 'G#1', 'C#2', 'F#2', 'B2', 'E3', 'G#3', 'C#4']),
  guitarPreset('9-drop-f', 'Drop F (Anzu)', 'standard', ['F1', 'C2', 'F2', 'A#2', 'D#3', 'G#3', 'C4', 'F4', 'A#4']),
  guitarPreset('9-drop-f-var', 'Drop F Var (One Minute Winter)', 'standard', ['F1', 'C2', 'F2', 'C3', 'F3', 'A#3', 'D#4', 'G3', 'C4']),
  guitarPreset('9-atb', 'After The Burial (9)', 'standard', ['C#1', 'F1', 'A#1', 'D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'])
];

const GUITAR_10_PRESETS: TunerPreset[] = [
  guitarPreset('10-yepes', 'Yepes Standard (Classical 10)', 'standard', ['F#1', 'G#1', 'A#1', 'C2', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('10-fourths', 'Standard Continued Fourths (10)', 'standard', ['G#0', 'C#1', 'F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('10-high-a', 'High A (10)', 'artist', ['C#1', 'F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4']),
  guitarPreset('10-bass-guitar', 'Bass + Guitar Hybrid (Septor 1030)', 'artist', ['E1', 'A1', 'D2', 'G2', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'])
];

const ACOUSTIC_12_PRESETS: TunerPreset[] = [
  guitarPreset('12-standard', 'Standard (12-String)', 'standard', ['E2', 'E3', 'A2', 'A3', 'D3', 'D4', 'G3', 'G4', 'B3', 'B3', 'E4', 'E4']),
  guitarPreset('12-drop-d', 'Drop D (12-String)', 'standard', ['D2', 'D3', 'A2', 'A3', 'D3', 'D4', 'G3', 'G4', 'B3', 'B3', 'E4', 'E4']),
  guitarPreset('12-double-drop-d', 'Double Drop D (12-String)', 'standard', ['D2', 'D3', 'A2', 'A3', 'D3', 'D4', 'G3', 'G4', 'B3', 'B3', 'D4', 'D4']),
  guitarPreset('12-open-g', 'Open G (12-String)', 'open', ['D2', 'D3', 'G2', 'G3', 'D3', 'D4', 'G3', 'G4', 'B3', 'B3', 'D4', 'D4']),
  guitarPreset('12-open-d', 'Open D (12-String)', 'open', ['D2', 'D3', 'A2', 'A3', 'D3', 'D4', 'F#3', 'F#4', 'A3', 'A3', 'D4', 'D4']),
  guitarPreset('12-open-c', 'Open C (12-String)', 'open', ['C2', 'C3', 'G2', 'G3', 'C3', 'C4', 'G3', 'G4', 'C4', 'C4', 'E4', 'E4']),
  guitarPreset('12-dadgad', 'DADGAD (12-String Celtic)', 'artist', ['D2', 'D3', 'A2', 'A3', 'D3', 'D4', 'G3', 'G4', 'A3', 'A3', 'D4', 'D4']),
  guitarPreset('12-eb-standard', 'Half-Step Down (12-String Eb)', 'standard', ['Eb2', 'Eb3', 'Ab2', 'Ab3', 'Db3', 'Db4', 'Gb3', 'Gb4', 'Bb3', 'Bb3', 'Eb4', 'Eb4']),
  guitarPreset('12-d-standard', 'D Standard (12-String)', 'standard', ['D2', 'D3', 'G2', 'G3', 'C3', 'C4', 'F3', 'F4', 'A3', 'A3', 'D4', 'D4'])
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
  ...GUITAR_9_PRESETS,
  ...GUITAR_10_PRESETS
];

const BASS_4_PRESETS: TunerPreset[] = [
  guitarPreset('bass-standard', 'Standard (E A D G)', 'standard', ['E1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-eb', 'Half-Step Down (Eb)', 'standard', ['Eb1', 'Ab1', 'Db2', 'Gb2']),
  guitarPreset('bass-d', 'D Standard (D G C F)', 'standard', ['D1', 'G1', 'C2', 'F2']),
  guitarPreset('bass-csharp-standard', 'C# Standard (C# F# B E)', 'standard', ['C#1', 'F#1', 'B1', 'E2']),
  guitarPreset('bass-c-standard', 'C Standard (C F Bb Eb)', 'standard', ['C1', 'F1', 'Bb1', 'Eb2']),
  guitarPreset('bass-b-standard', 'B Standard (B E A D)', 'standard', ['B0', 'E1', 'A1', 'D2']),
  guitarPreset('bass-bb-standard', 'Bb Standard (Bb Eb Ab Db)', 'standard', ['Bb0', 'Eb1', 'Ab1', 'Db2']),
  guitarPreset('bass-a-standard', 'A Standard (A D G C)', 'standard', ['A0', 'D1', 'G1', 'C2']),
  guitarPreset('bass-ab-standard', 'Ab Standard (Ab Db Gb B)', 'standard', ['G#0', 'Db1', 'Gb1', 'B1']),
  guitarPreset('bass-g-standard', 'G Standard (G C F Bb)', 'standard', ['G1', 'C2', 'F2', 'Bb2']),
  guitarPreset('bass-fsharp-standard', 'F# Standard (F# B E A)', 'standard', ['F#1', 'B1', 'E2', 'A2']),
  guitarPreset('bass-f-standard', 'F Standard (F Bb Eb Ab)', 'standard', ['F1', 'Bb1', 'Eb2', 'Ab2']),
  guitarPreset('bass-drop-d', 'Drop D (D A D G)', 'standard', ['D1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-drop-csharp', 'Drop C# (C# G# C# F#)', 'standard', ['C#1', 'G#1', 'C#2', 'F#2']),
  guitarPreset('bass-drop-c', 'Drop C (C G C F)', 'standard', ['C1', 'G1', 'C2', 'F2']),
  guitarPreset('bass-drop-b', 'Drop B (B F# B E)', 'standard', ['B0', 'F#1', 'B1', 'E2']),
  guitarPreset('bass-drop-bb', 'Drop Bb (Bb F Bb Eb)', 'standard', ['Bb0', 'F1', 'Bb1', 'Eb2']),
  guitarPreset('bass-drop-a', 'Drop A (A E A D)', 'standard', ['A0', 'E1', 'A1', 'D2']),
  guitarPreset('bass-drop-ab', 'Drop Ab (Ab Eb Ab Db)', 'standard', ['G#0', 'Eb1', 'G#1', 'Db2']),
  guitarPreset('bass-drop-g', 'Drop G (G D G C)', 'standard', ['G1', 'D2', 'G2', 'C3']),
  guitarPreset('bass-drop-fsharp', 'Drop F# (F# C# F# B)', 'standard', ['F#1', 'C#2', 'F#2', 'B2']),
  guitarPreset('bass-drop-f', 'Drop F (F C F Bb)', 'standard', ['F1', 'C2', 'F2', 'Bb2']),
  guitarPreset('bass-drop-eb', 'Drop Eb (Eb Bb Eb Ab)', 'standard', ['Eb1', 'Bb1', 'Eb2', 'Ab2']),
  guitarPreset('bass-bead', 'B Standard (B E A D) – 5-string set on 4', 'standard', ['B0', 'E1', 'A1', 'D2']),
  guitarPreset('bass-piccolo', 'Piccolo (E A D G – octave up)', 'standard', ['E2', 'A2', 'D3', 'G3']),
  // Bass open tunings (adapted from guitar open tunings for 4-string)
  guitarPreset('bass-open-g', 'Open G (D G D G)', 'open', ['D1', 'G1', 'D2', 'G2']),
  guitarPreset('bass-open-d', 'Open D (D A D F#)', 'open', ['D1', 'A1', 'D2', 'F#2']),
  guitarPreset('bass-open-e', 'Open E (E B E G#)', 'open', ['E1', 'B1', 'E2', 'G#2']),
  guitarPreset('bass-open-c', 'Open C (C G C E)', 'open', ['C1', 'G1', 'C2', 'E2']),
  guitarPreset('bass-open-a', 'Open A (E A E A)', 'open', ['E1', 'A1', 'E2', 'A2']),
  // Bass artist / alternate tunings
  guitarPreset('bass-fifths', 'Fifths / Cello (C G D A)', 'artist', ['C1', 'G1', 'D2', 'A2']),
  guitarPreset('bass-drop-dadg', 'Tool-style DADG', 'artist', ['D1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-tenor', 'Tenor Bass (A D G C)', 'artist', ['A1', 'D2', 'G2', 'C3'])
];

const BASS_5_PRESETS: TunerPreset[] = [
  guitarPreset('bass-5-standard', 'Standard (B E A D G)', 'standard', ['B0', 'E1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-5-eb', 'Half-Step Down (Bb Eb Ab Db Gb)', 'standard', ['Bb0', 'Eb1', 'Ab1', 'Db2', 'Gb2']),
  guitarPreset('bass-5-d-standard', 'D Standard (D G C F A)', 'standard', ['D1', 'G1', 'C2', 'F2', 'A2']),
  guitarPreset('bass-5-csharp-standard', 'C# Standard (C# F# B E G#)', 'standard', ['C#1', 'F#1', 'B1', 'E2', 'G#2']),
  guitarPreset('bass-5-c-standard', 'C Standard (C F Bb Eb G)', 'standard', ['C1', 'F1', 'Bb1', 'Eb2', 'G2']),
  guitarPreset('bass-5-bb-standard', 'Bb Standard (Bb Eb Ab Db F)', 'standard', ['Bb0', 'Eb1', 'Ab1', 'Db2', 'F2']),
  guitarPreset('bass-5-a-standard', 'A Standard (A D G C F)', 'standard', ['A0', 'D1', 'G1', 'C2', 'F2']),
  guitarPreset('bass-5-ab-standard', 'Ab Standard (Ab Db Gb B Eb)', 'standard', ['G#0', 'Db1', 'Gb1', 'B1', 'Eb2']),
  guitarPreset('bass-5-g-standard', 'G Standard (G C F Bb Eb)', 'standard', ['G1', 'C2', 'F2', 'Bb2', 'Eb3']),
  guitarPreset('bass-5-drop-a', 'Drop A (A E A D G)', 'standard', ['A0', 'E1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-5-drop-g', 'Drop G (G D G C F)', 'standard', ['G1', 'D2', 'G2', 'C3', 'F3']),
  guitarPreset('bass-5-drop-fsharp', 'Drop F# (F# C# F# B E)', 'standard', ['F#1', 'C#2', 'F#2', 'B2', 'E3']),
  guitarPreset('bass-5-drop-e', 'Drop E (E B E A D)', 'standard', ['E1', 'B1', 'E2', 'A2', 'D3']),
  guitarPreset('bass-5-drop-d', 'Drop D (D A D G B)', 'standard', ['D1', 'A1', 'D2', 'G2', 'B2']),
  guitarPreset('bass-5-drop-c', 'Drop C (C G C F A)', 'standard', ['C1', 'G1', 'C2', 'F2', 'A2']),
  guitarPreset('bass-5-high-c', 'Tenor / High C (E A D G C)', 'standard', ['E1', 'A1', 'D2', 'G2', 'C3']),
  guitarPreset('bass-5-high-c-drop', 'Tenor Drop D (D A D G C)', 'standard', ['D1', 'A1', 'D2', 'G2', 'C3']),
  // Bass 5 open tunings
  guitarPreset('bass-5-open-g', 'Open G (D G D G B)', 'open', ['D1', 'G1', 'D2', 'G2', 'B2']),
  guitarPreset('bass-5-open-d', 'Open D (D A D F# A)', 'open', ['D1', 'A1', 'D2', 'F#2', 'A2']),
  guitarPreset('bass-5-open-c', 'Open C (C G C E G)', 'open', ['C1', 'G1', 'C2', 'E2', 'G2']),
  // Bass 5 artist
  guitarPreset('bass-5-fifths', 'Fifths (C G D A E)', 'artist', ['C1', 'G1', 'D2', 'A2', 'E3']),
  guitarPreset('bass-5-low-a', 'Low A (A E A D G)', 'artist', ['A0', 'E1', 'A1', 'D2', 'G2'])
];

const BASS_6_PRESETS: TunerPreset[] = [
  guitarPreset('bass-6-standard', 'Standard (B E A D G C)', 'standard', ['B0', 'E1', 'A1', 'D2', 'G2', 'C3']),
  guitarPreset('bass-6-eb', 'Half-Step Down (Bb Eb Ab Db Gb Bb)', 'standard', ['Bb0', 'Eb1', 'Ab1', 'Db2', 'Gb2', 'Bb2']),
  guitarPreset('bass-6-d-standard', 'D Standard (D G C F A D)', 'standard', ['D1', 'G1', 'C2', 'F2', 'A2', 'D3']),
  guitarPreset('bass-6-c-standard', 'C Standard (C F Bb Eb G C)', 'standard', ['C1', 'F1', 'Bb1', 'Eb2', 'G2', 'C3']),
  guitarPreset('bass-6-bb-standard', 'Bb Standard (Bb Eb Ab Db Gb C)', 'standard', ['Bb0', 'Eb1', 'Ab1', 'Db2', 'Gb2', 'C3']),
  guitarPreset('bass-6-a-standard', 'A Standard (A D G C F A)', 'standard', ['A0', 'D1', 'G1', 'C2', 'F2', 'A3']),
  guitarPreset('bass-6-drop-a', 'Drop A (A E A D G C)', 'standard', ['A0', 'E1', 'A1', 'D2', 'G2', 'C3']),
  guitarPreset('bass-6-drop-g', 'Drop G (G D G C F A)', 'standard', ['G1', 'D2', 'G2', 'C3', 'F3', 'A3']),
  guitarPreset('bass-6-drop-f', 'Drop F (F C F Bb Eb G)', 'standard', ['F1', 'C2', 'F2', 'Bb2', 'Eb3', 'G3']),
  guitarPreset('bass-vi', 'Bass VI (E A D G B E – octave below guitar)', 'standard', ['E1', 'A1', 'D2', 'G2', 'B2', 'E3']),
  guitarPreset('bass-vi-drop-d', 'Bass VI Drop D (D A D G B E)', 'standard', ['D1', 'A1', 'D2', 'G2', 'B2', 'E3']),
  // 6-string open tunings
  guitarPreset('bass-6-open-g', 'Open G (D G D G B D)', 'open', ['D1', 'G1', 'D2', 'G2', 'B2', 'D3']),
  guitarPreset('bass-6-open-d', 'Open D (D A D F# A D)', 'open', ['D1', 'A1', 'D2', 'F#2', 'A2', 'D3']),
  guitarPreset('bass-6-open-c', 'Open C (C G C G C E)', 'open', ['C1', 'G1', 'C2', 'G3', 'C3', 'E3']),
  // 6-string artist
  guitarPreset('bass-6-fifths', 'Fifths (C G D A E B)', 'artist', ['C1', 'G1', 'D2', 'A2', 'E3', 'B3']),
  guitarPreset('bass-6-chordal', 'Chordal (E A D G B E) — Stanley Clarke', 'artist', ['E1', 'A1', 'D2', 'G2', 'B2', 'E3'])
];

const BASS_PRESETS: TunerPreset[] = [
  ...BASS_4_PRESETS,
  ...BASS_5_PRESETS,
  ...BASS_6_PRESETS
];

/** Expand existing musical voicings without inventing artist attributions.
 * Native IDs/order stay stable; derived patterns are deduplicated by exact pitches.
 * Low-first/high-first extensions use fourths within A0–C7. Short setups use
 * contiguous subsets. Twelve-string guitars use octave/unison paired courses.
 */
function completeStringCatalog(native: TunerPreset[], sources: TunerPreset[], pairedGuitar: boolean): TunerPreset[] {
  const result = [...native];
  const signatures = new Set(native.map(p => p.strings.map(s => s.midi).join(',')));
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function add(source: TunerPreset, notes: number[], kind: string) {
    if (notes.some(midi => midi < 21 || midi > 96)) return;
    const signature = notes.join(',');
    if (signatures.has(signature)) return;
    signatures.add(signature);
    result.push({
      id: `adapted-${notes.length}-${source.id}-${kind}`,
      name: `${source.name} · adapted (${kind.replaceAll('-', ' ')})`,
      category: source.category,
      strings: notes.map((midi, index) => ({
        midi, note: names[midi % 12] + (Math.floor(midi / 12) - 1),
        label: `String ${notes.length - index}`, freq: Math.round(noteToFreq(midi) * 100) / 100,
      })),
    });
  }
  for (let count = 1; count <= 12; count++) {
    for (const source of sources) {
      const base = source.strings.map(s => s.midi);
      if (count <= base.length) {
        for (let offset = 0; offset <= base.length - count; offset++) {
          add(source, base.slice(offset, offset + count), count === base.length ? 'voicing' : `subset-${offset + 1}-to-${offset + count}`);
        }
      } else if (pairedGuitar && count === 12 && base.length === 6) {
        add(source, base.flatMap((midi, index) => [midi, index < 4 ? midi + 12 : midi]), 'paired-courses');
      } else {
        for (const direction of ['low', 'high']) {
          const notes = [...base];
          while (notes.length < count) {
            const low = Math.min(...notes) - 5, high = Math.max(...notes) + 5;
            if (direction === 'low' && low >= 21 || high > 96) {
              if (low < 21) break;
              notes.unshift(low);
            } else notes.push(high);
          }
          if (notes.length === count) add(source, notes, `${direction}-first-extension`);
        }
      }
    }
  }
  return result;
}
const SHARED_GUITAR_NATIVE = [...new Map([...ELECTRIC_PRESETS, ...ACOUSTIC_PRESETS].map(p => [p.id, p])).values()];
const SHARED_GUITAR_CATALOG = completeStringCatalog(SHARED_GUITAR_NATIVE, SHARED_GUITAR_NATIVE.filter(p => p.strings.length === 6), true);
// Guitar-inspired bass voicings are explicitly identified and transposed an octave.
const BASS_GUITAR_VOICINGS: TunerPreset[] = SHARED_GUITAR_NATIVE.filter(p => p.strings.length === 6).map(p => ({
  ...p, id: `guitar-voicing-${p.id}`, name: `Guitar voicing: ${p.name}`,
  strings: p.strings.map(s => ({ ...s, midi: s.midi - 12 })),
}));
const COMPLETE_BASS_CATALOG = completeStringCatalog(BASS_PRESETS, [...BASS_PRESETS, ...BASS_GUITAR_VOICINGS], false);

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
  electric: Array.from({ length: 12 }, (_, index) => index + 1),
  acoustic: Array.from({ length: 12 }, (_, index) => index + 1),
  bass: Array.from({ length: 12 }, (_, index) => index + 1),
  drums: []
};
// Every supported count has a selectable catalog, including unusual setups.

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
    dropdownLabel: 'Electric',
    icon: 'electric',
    blurb: 'Solid-body electric. Light fretting-hand pressure — gripping the neck sharpens the reading.',
    presets: SHARED_GUITAR_CATALOG
  },
  {
    id: 'acoustic',
    label: 'ACOUSTIC',
    dropdownLabel: 'Acoustic',
    icon: 'acoustic',
    blurb: 'Steel-string acoustic. Tap a peg to pick a string, pluck it loud and let it ring.',
    presets: SHARED_GUITAR_CATALOG
  },
  {
    id: 'bass',
    label: 'BASS',
    dropdownLabel: 'Bass',
    icon: 'bass',
    blurb: 'Low strings need patience — let each note ring fully so the detector locks on the fundamental.',
    presets: COMPLETE_BASS_CATALOG
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
    hint: 'Safe for any string.'
  },
  plainSteel: {
    id: 'plainSteel',
    label: 'Plain Steel (.009–.013)',
    shortLabel: 'STEEL',
    warnUp: 2.5,
    dangerUp: 3.5,
    warnDown: -2.5,
    deadDown: -4.0,
    hint: 'Plain unwound strings.'
  },
  nickelWound: {
    id: 'nickelWound',
    label: 'Nickel / Steel Wound',
    shortLabel: 'NICKEL',
    warnUp: 2.0,
    dangerUp: 3.0,
    warnDown: -2.5,
    deadDown: -4.0,
    hint: 'Wound electric strings.'
  },
  bronzeWound: {
    id: 'bronzeWound',
    label: 'Bronze Acoustic Wound',
    shortLabel: 'BRONZE',
    warnUp: 2.0,
    dangerUp: 3.0,
    warnDown: -2.5,
    deadDown: -4.0,
    hint: 'Wound acoustic strings.'
  },
  bassNickel: {
    id: 'bassNickel',
    label: 'Bass Nickel Wound',
    shortLabel: 'BASS',
    warnUp: 2.5,
    dangerUp: 3.5,
    warnDown: -2.5,
    deadDown: -4.5,
    hint: 'Bass guitar strings.'
  }
};

export const INSTRUMENT_MATERIALS: Record<TunerInstrumentId, string[]> = {
  acoustic: ['avg', 'bronzeWound', 'plainSteel'],
  electric: ['avg', 'plainSteel', 'nickelWound'],
  bass: ['avg', 'bassNickel'],
  drums: []
};

/* --------------------------------------------------------------------------
   Fixed-window YIN, audio-time tracking and presentation thresholds
   -------------------------------------------------------------------------- */
export const DETECT = {
  ANALYSIS_HOP_MS: 25,
  ANALYSIS_WINDOW_MS: 128,
  ACQUIRE_MS: 75,
  RESULT_GAP_MS: 150,
  TRACK_JUMP_CENTS: 80,
  SMOOTH_MS: 65,
  STALE_CLEAR_MS: 1500,
  MIN_DETECT_HZ: 26,
  MAX_DETECT_HZ: 2160,
  RMS_WAKE: 0.008,
  RMS_RELEASE: 0.003,
  CLIP_LEVEL: 0.98,
  CLIP_RATIO: 0.005,
  // CMNDF acceptance relaxes slightly for decaying single notes.
  YIN_THRESHOLD: 0.1,
  YIN_THRESH_MAX: 0.18,
  YIN_ADAPT_FULL_RMS: 0.03,
  CONF_LOCK: 0.82,
  // Band-limiting before YIN: rumble/DC high-pass and a low-pass above the
  // highest detectable fundamental.
  PREFILTER_HP_HZ: 22,
  PREFILTER_LP_HZ: 2600,
  // Low-SNR fallback: the earliest dip within this CMNDF distance of the
  // deepest one, accepted only with clarity >= WEAK_CONF and when it
  // continues the previous reading within WEAK_TRACK_CENTS.
  WEAK_DIP_SLACK: 0.06,
  WEAK_CONF: 0.5,
  WEAK_TRACK_CENTS: 20,
  // Note label keeps its note until the pitch is this far from it (> 50).
  NOTE_HOLD_CENTS: 60,
  CONFIRM_MS: 2000,
  CONFIRM_MAX_GAP_MS: 75,
  // Once inside ±tolerance, confirmation holds until |cents| exceeds
  // tolerance + min(this, tolerance / 2), so jitter at the edge cannot
  // restart the dwell.
  CONFIRM_EXIT_MARGIN_CENTS: 1.5,
  AUTO_ADVANCE_DEBOUNCE_MS: 400,
  AUTO_ID_CENTS: 150,
  AUTO_ID_SEPARATION_CENTS: 50,
  AUTO_ID_HOLD_MS: 150,
  WATCHDOG_MS: 100,
  INTERRUPTED_MS: 2000,
  FINE_CENTS_RANGE: 10,
  METER_FINE_CENTS: 50,
  METER_MAX_CENTS: 650,
  METER_CORE_SPLIT: 0.68,
  RING_SAMPLES: 32768,
  WORK_WINDOW: 16384,
  WORKLET_CHUNK: 512,
  // Capture buffers in flight between worklet and worker (~256 ms @ 48k).
  WORKLET_POOL: 24,
  // Worker pacing: wall-clock gap after an analysis before the next one,
  // so chunks queued behind a slow analysis are absorbed, not re-analysed.
  MIN_WALL_GAP_MS: 5,
  // Mains hum: a strong lock within HUM_TOLERANCE_HZ of 50/60 Hz (or 2x/3x)
  // held for HUM_CONFIRM_MS with level steady within HUM_MAX_LEVEL_RATIO
  // enables notches at the first HUM_HARMONICS multiples.
  HUM_TOLERANCE_HZ: 0.2,
  HUM_CONFIRM_MS: 1500,
  HUM_MAX_LEVEL_RATIO: 1.6,
  HUM_HARMONICS: 6,
  HUM_NOTCH_Q: 30
} as const;

export const TUNER_COPY = {
  tapToStart: 'TAP TO START TUNING',
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
  micLost: 'Microphone disconnected — tap START TUNING to reconnect.',
  micBlockedHeader: 'Microphone permission is disabled for this site. Enable it in your browser\'s site settings, then reload.',
  audioPrivate: 'Audio never leaves your device.',
  wrongOctave: 'That pitch belongs to another string — check the pegs.',
  breakageAvg: 'Breakage risk — unsafe for most strings. Tap MATERIAL if you know yours.',
  breakageKnown: 'Snap risk — ease off. Limits shown for your string material.',
  deadLoose: 'Way too low — the string will be unplayably loose here.',
  stress: 'Repeated over-tightening detected. Back off and let the string rest.',
  btMic: 'Bluetooth mic detected — headset audio is too narrow to tune reliably. Use your device mic.',
  lowMicWarning: 'Phone mics roll off below ~40 Hz — kick and floor tom readings may be unreliable.',
  autoAdvanced: (name: string) => `Tuned — next up: ${name}`
};
