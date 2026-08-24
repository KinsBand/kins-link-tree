export interface TunerString {
  label: string;
  note: string;
  freq: number;
  midi: number;
}

export interface TunerPreset {
  id: string;
  name: string;
  strings: TunerString[];
}

export interface InstrumentTuningGroup {
  id: 'acoustic' | 'electric' | 'bass' | 'drums';
  label: string;
  icon: string;
  blurb: string;
  presets: TunerPreset[];
}

export const A4_REFERENCE = 440;

export function noteToFreq(midi: number): number {
  return A4_REFERENCE * Math.pow(2, (midi - 69) / 12);
}

const TUNER_STRINGS = {
  E2: { label: '6th', note: 'E2', midi: 40 },
  A2: { label: '5th', note: 'A2', midi: 45 },
  D3: { label: '4th', note: 'D3', midi: 50 },
  G3: { label: '3rd', note: 'G3', midi: 55 },
  B3: { label: '2nd', note: 'B3', midi: 59 },
  E4: { label: '1st', note: 'E4', midi: 64 },
  Eb2: { label: '6th', note: 'Eb2', midi: 39 },
  Ab2: { label: '5th', note: 'Ab2', midi: 44 },
  Db3: { label: '4th', note: 'Db3', midi: 49 },
  Gb3: { label: '3rd', note: 'Gb3', midi: 54 },
  Bb3: { label: '2nd', note: 'Bb3', midi: 58 },
  Db4: { label: '1st', note: 'Db4', midi: 63 },
  D2: { label: '6th', note: 'D2', midi: 38 },
  E1: { label: '4th', note: 'E1', midi: 28 },
  A1: { label: '3rd', note: 'A1', midi: 33 },
  G2: { label: '1st', note: 'G2', midi: 43 },
  D1: { label: '4th', note: 'D1', midi: 26 },
  B0: { label: '5th (B)', note: 'B0', midi: 23 }
} as const;

type StdName = keyof typeof TUNER_STRINGS;

function s(name: StdName): TunerString {
  const def = TUNER_STRINGS[name];
  return { label: def.label, note: def.note, freq: Math.round(noteToFreq(def.midi) * 100) / 100, midi: def.midi };
}

function guitarPreset(id: string, name: string, names: StdName[]): TunerPreset {
  return { id, name, strings: names.map(s) };
}

const ACOUSTIC_PRESETS: TunerPreset[] = [
  guitarPreset('standard', 'Standard (E A D G B e)', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-d', 'Drop D (D A D G B e)', ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('half-step-down', 'Half Step Down (Eb)', ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Db4'])
];

const ELECTRIC_PRESETS: TunerPreset[] = [
  guitarPreset('standard', 'Standard (E A D G B e)', ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('drop-d', 'Drop D (D A D G B e)', ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']),
  guitarPreset('half-step-down', 'Half Step Down (Eb)', ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Db4'])
];

const BASS_PRESETS: TunerPreset[] = [
  guitarPreset('bass-4-standard', '4-String Standard (E A D G)', ['E1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-drop-d', '4-String Drop D (D A D G)', ['D1', 'A1', 'D2', 'G2']),
  guitarPreset('bass-5-standard', '5-String Standard (B E A D G)', ['B0', 'E1', 'A1', 'D2', 'G2'])
];

const DRUM_KIT_PRESET: TunerPreset = {
  id: 'kit-reference',
  name: 'Kit Reference Tones',
  strings: [
    { label: 'Kick Batter', note: '~50 Hz', freq: 50, midi: 31 },
    { label: 'Snare Batter', note: '~185 Hz', freq: 185, midi: 54 },
    { label: 'Rack Tom Top', note: '~110 Hz', freq: 110, midi: 45 },
    { label: 'Floor Tom Batter', note: '~80 Hz', freq: 80, midi: 39 }
  ]
};

export const TUNER_INSTRUMENTS: InstrumentTuningGroup[] = [
  {
    id: 'acoustic',
    label: 'Acoustic',
    icon: '🎸',
    blurb: 'Steel-string acoustic. Tune to the reference tone or use the mic — fresh strings stretch, so re-check after a few minutes.',
    presets: ACOUSTIC_PRESETS
  },
  {
    id: 'electric',
    label: 'Electric',
    icon: '⚡',
    blurb: 'Solid-body electric. Use light fretting-hand pressure when checking — gripping sharpens the reading.',
    presets: ELECTRIC_PRESETS
  },
  {
    id: 'bass',
    label: 'Bass',
    icon: '🎻',
    blurb: 'Electric bass. Low strings need patience — let each note ring fully so the detector locks on the fundamental.',
    presets: BASS_PRESETS
  },
  {
    id: 'drums',
    label: 'Drums',
    icon: '🥁',
    blurb: 'Drumheads are tuned by ear, not to exact pitches. Tap near each lug and match by ear until every lug sings the same reference tone — top and bottom heads tuned relative to each other.',
    presets: [DRUM_KIT_PRESET]
  }
];

export const TONE_GEN_MIN_HZ = 40;

export const TONE_GEN_MAX_HZ = 500;

export const TUNER_COPY = {
  micDenied: 'Microphone access was blocked. Allow mic permission in your browser settings, then press START MIC TUNING again.',
  inTune: 'IN TUNE',
  tooFlat: 'FLAT',
  tooSharp: 'SHARP',
  lowMicWarning: 'Phone mics roll off below ~40 Hz — for the low B use the reference tone and tune by octave/ear.'
};
