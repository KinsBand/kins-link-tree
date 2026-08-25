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
  guitarPreset('dobro', 'Dobro (GBDGBD)', 'artist', ['G2', 'B2', 'D3', 'G3', 'B3', 'D4'])
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
  ...GUITAR_9_PRESETS,
  ...GUITAR_10_PRESETS
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
  /* Hold behaviour: keep the last confident reading on screen instead of
     blanking between plucks. Weak frames (resonance tails, noise) never
     overwrite the held value. */
  ONSET_GAP_MS: 350,
  UNRELIABLE_CONF: 0.32,
  MESSAGE_PERSIST_FRAMES: 3,
  /* Chromatic rail: cents falloff used to light neighbouring note pills */
  RAIL_RANGE_CENTS: 150,
  /* Meter scale: central ±FINE_CENTS linear core, then log-compressed out to
     MAX_CENTS so breakage/looseness thresholds fit visibly on the meter */
  METER_FINE_CENTS: 50,
  METER_MAX_CENTS: 650,
  METER_CORE_SPLIT: 0.68,
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
