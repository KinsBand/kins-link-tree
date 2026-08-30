import type { ChordData } from '../components/theory/ChordCard.astro';

export type { ChordData };

export interface ScaleItem {
  id: string;
  name: string;
  type: string;
  formula: string;
  notes: string;
  fretPattern: string;
}

export interface CagedItem {
  id?: string;
  name: string;
  formula: string;
  notes: string;
}

export interface IntervalItem {
  name: string;
  formula: string;
  notes: string;
}

export interface TuningItem {
  name: string;
  formula: string;
  notes: string;
  pitches: number[];
}

export interface RudimentItem {
  id: string;
  name: string;
  type: string;
  formula: string;
  notes: string;
  sticking: string;
  accent: string;
}

export interface MeterItem {
  name: string;
  formula: string;
  notes: string;
}

export interface PolyrhythmItem {
  name: string;
  formula: string;
  notes: string;
}

export interface GrooveItem {
  id?: string;
  name: string;
  formula: string;
  notes: string;
}

export interface SubdivisionItem {
  name: string;
  formula: string;
  notes: string;
}

export interface TheoryCategory<T = any> {
  id: string;
  title: string;
  icon: string;
  badge: string;
  chip: string;
  subfilters?: string[];
  items?: T[];
}

export interface CircleKeyData {
  key: string;
  minor: string;
  acc: string;
}

// =============================================================================
// CIRCLE OF FIFTHS DATA
// =============================================================================
export const circleOfFifthsData: CircleKeyData[] = [
  { key: 'C', minor: 'Am', acc: '0 Sharps / 0 Flats' },
  { key: 'G', minor: 'Em', acc: '1 Sharp (F♯)' },
  { key: 'D', minor: 'Bm', acc: '2 Sharps (F♯, C♯)' },
  { key: 'A', minor: 'F♯m', acc: '3 Sharps (F♯, C♯, G♯)' },
  { key: 'E', minor: 'C♯m', acc: '4 Sharps (F♯, C♯, G♯, D♯)' },
  { key: 'B', minor: 'G♯m', acc: '5 Sharps (F♯, C♯, G♯, D♯, A♯)' },
  { key: 'F♯ / G♭', minor: 'D♯m / E♭m', acc: '6 Sharps / 6 Flats' },
  { key: 'D♭', minor: 'B♭m', acc: '5 Flats (B♭, E♭, A♭, D♭, G♭)' },
  { key: 'A♭', minor: 'Fm', acc: '4 Flats (B♭, E♭, A♭, D♭)' },
  { key: 'E♭', minor: 'Cm', acc: '3 Flats (B♭, E♭, A♭)' },
  { key: 'B♭', minor: 'Gm', acc: '2 Flats (B♭, E♭)' },
  { key: 'F', minor: 'Dm', acc: '1 Flat (B♭)' },
];

// =============================================================================
// GUITAR THEORY CATEGORIES DATA
// =============================================================================
export const guitarCategories: TheoryCategory[] = [
  {
    id: 'guitar-fretboard-hero',
    title: 'Interactive Fretboard & Chord Box Sandbox',
    icon: 'fa-solid fa-guitar',
    badge: 'Visual Sandbox',
    chip: 'fretboard',
  },
  {
    id: 'guitar-scales',
    title: 'Scales & Modes',
    icon: 'fa-solid fa-music',
    badge: 'Melody & Soloing',
    chip: 'scales',
    subfilters: ['all', 'pentatonic', 'blues', 'modes', 'major-minor'],
    items: [
      { id: 'pentatonic-minor', name: 'Minor Pentatonic', type: 'pentatonic', formula: '1 - ♭3 - 4 - 5 - ♭7', notes: 'The cornerstone rock, blues, and metal soloing scale.', fretPattern: 'Root on Low E (Fret 5 for A) • Box 1 shape across all 6 strings' },
      { id: 'pentatonic-major', name: 'Major Pentatonic', type: 'pentatonic', formula: '1 - 2 - 3 - 5 - 6', notes: 'Sweet, soulful sound for southern rock, country, and pop.', fretPattern: 'Root on Low E (Fret 5 for A) • Sweet major 3rd & 6th intervals' },
      { id: 'blues', name: 'Blues Scale', type: 'blues', formula: '1 - ♭3 - 4 - ♭5 - 5 - ♭7', notes: 'Minor pentatonic with the gritty diminished 5th (blue note).', fretPattern: 'Root on Low E • Blue note on A string (fret 6) & G string (fret 8)' },
      { id: 'major', name: 'Major Scale (Ionian)', type: 'major-minor', formula: '1 - 2 - 3 - 4 - 5 - 6 - 7', notes: 'Diatonic root of all western harmony (W - W - H - W - W - W - H).', fretPattern: 'Root on Low E (Fret 8 for C) • 3 notes per string form' },
      { id: 'natural-minor', name: 'Natural Minor (Aeolian)', type: 'major-minor', formula: '1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7', notes: 'Relative minor to major scale (W - H - W - W - H - W - W).', fretPattern: 'Root on Low E (Fret 5 for A) • Dark, melancholic tonality' },
      { id: 'dorian', name: 'Dorian Mode', type: 'modes', formula: '1 - 2 - ♭3 - 4 - 5 - 6 - ♭7', notes: 'Minor scale with a bright natural 6th (Funk, Santana, Jam rock).', fretPattern: 'Root on Low E (Fret 5 for A) • Natural 6th replaces flat 6th' },
      { id: 'mixolydian', name: 'Mixolydian Mode', type: 'modes', formula: '1 - 2 - 3 - 4 - 5 - 6 - ♭7', notes: 'Major scale with flat 7th (AC/DC, Grateful Dead, classic rock).', fretPattern: 'Root on Low E (Fret 5 for A) • Dominant 7th chord pairing' },
    ] as ScaleItem[],
  },
  {
    id: 'guitar-chords',
    title: 'Chord Charts & Construction',
    icon: 'fa-solid fa-layer-group',
    badge: 'Harmony & Rhythm',
    chip: 'chords',
    subfilters: ['all', 'open', 'barre', '7ths', 'power'],
    items: [
      // --- POWER CHORDS ---
      {
        id: 'g5',
        name: 'G5 Power Chord',
        shortName: 'G5',
        type: 'power',
        formula: '1 - 5 (G - D)',
        notes: 'Root on Low E (Fret 3) • 3-note rock & punk staple',
        baseFret: 3,
        frets: [3, 5, 5, '✕', '✕', '✕'],
        fingers: [1, 3, 4, null, null, null],
        mutePattern: '3 - 5 - 5 - ✕ - ✕ - ✕',
      },
      {
        id: 'e5',
        name: 'E5 Power Chord',
        shortName: 'E5',
        type: 'power',
        formula: '1 - 5 (E - B)',
        notes: 'Open Low E root • Lowest and heaviest open power chord',
        baseFret: 1,
        frets: [0, 2, 2, '✕', '✕', '✕'],
        fingers: [null, 1, 2, null, null, null],
        mutePattern: '◯ - 2 - 2 - ✕ - ✕ - ✕',
      },
      {
        id: 'a5',
        name: 'A5 Power Chord',
        shortName: 'A5',
        type: 'power',
        formula: '1 - 5 (A - E)',
        notes: 'Open A root on 5th string • Classic hard rock riff foundation',
        baseFret: 1,
        frets: ['✕', 0, 2, 2, '✕', '✕'],
        fingers: [null, null, 1, 2, null, null],
        mutePattern: '✕ - ◯ - 2 - 2 - ✕ - ✕',
      },
      {
        id: 'd5',
        name: 'D5 Power Chord',
        shortName: 'D5',
        type: 'power',
        formula: '1 - 5 (D - A)',
        notes: 'Open D root on 4th string • High punchy power chord',
        baseFret: 1,
        frets: ['✕', '✕', 0, 2, 3, '✕'],
        fingers: [null, null, null, 1, 2, null],
        mutePattern: '✕ - ✕ - ◯ - 2 - 3 - ✕',
      },
      {
        id: 'c5',
        name: 'C5 Power Chord',
        shortName: 'C5',
        type: 'power',
        formula: '1 - 5 (C - G)',
        notes: 'Root on 5th string (Fret 3) • Movable A-shape power chord',
        baseFret: 3,
        frets: ['✕', 3, 5, 5, '✕', '✕'],
        fingers: [null, 1, 3, 4, null, null],
        mutePattern: '✕ - 3 - 5 - 5 - ✕ - ✕',
      },
      {
        id: 'f5',
        name: 'F5 Power Chord',
        shortName: 'F5',
        type: 'power',
        formula: '1 - 5 (F - C)',
        notes: 'Root on Low E (Fret 1) • Heavy half-step rock tension',
        baseFret: 1,
        frets: [1, 3, 3, '✕', '✕', '✕'],
        fingers: [1, 3, 4, null, null, null],
        mutePattern: '1 - 3 - 3 - ✕ - ✕ - ✕',
      },

      // --- OPEN CHORDS ---
      {
        id: 'c-major',
        name: 'C Major (Open)',
        shortName: 'C',
        type: 'open',
        formula: '1 - 3 - 5 (C - E - G)',
        notes: 'Muted 6th string, open 1st & 3rd strings.',
        baseFret: 1,
        frets: ['✕', 3, 2, 0, 1, 0],
        fingers: [null, 3, 2, null, 1, null],
        mutePattern: '✕ - 3 - 2 - ◯ - 1 - ◯',
      },
      {
        id: 'g-major',
        name: 'G Major (Open)',
        shortName: 'G',
        type: 'open',
        formula: '1 - 3 - 5 (G - B - D)',
        notes: 'Full 6-string acoustic resonance with root on 6th string.',
        baseFret: 1,
        frets: [3, 2, 0, 0, 0, 3],
        fingers: [2, 1, null, null, null, 3],
        mutePattern: '3 - 2 - ◯ - ◯ - ◯ - 3',
      },
      {
        id: 'd-major',
        name: 'D Major (Open)',
        shortName: 'D',
        type: 'open',
        formula: '1 - 3 - 5 (D - F♯ - A)',
        notes: 'Mute low E & A strings; root on open 4th string.',
        baseFret: 1,
        frets: ['✕', 0, 2, 2, 2, 0],
        fingers: [null, null, null, 1, 3, 2],
        mutePattern: '✕ - ✕ - ◯ - 2 - 3 - 2',
      },
      {
        id: 'a-major',
        name: 'A Major (Open)',
        shortName: 'A',
        type: 'open',
        formula: '1 - 3 - 5 (A - C♯ - E)',
        notes: 'Mute low E string; 3 fingers clustered on fret 2.',
        baseFret: 1,
        frets: ['✕', 0, 2, 2, 2, 0],
        fingers: [null, null, 1, 2, 3, null],
        mutePattern: '✕ - ◯ - 2 - 2 - 2 - ◯',
      },
      {
        id: 'e-major',
        name: 'E Major (Open)',
        shortName: 'E',
        type: 'open',
        formula: '1 - 3 - 5 (E - G♯ - B)',
        notes: 'Full 6-string bright major; lowest open root on guitar.',
        baseFret: 1,
        frets: [0, 2, 2, 1, 0, 0],
        fingers: [null, 2, 3, 1, null, null],
        mutePattern: '◯ - 2 - 2 - 1 - ◯ - ◯',
      },
      {
        id: 'a-minor',
        name: 'A Minor (Open)',
        shortName: 'Am',
        type: 'open',
        formula: '1 - ♭3 - 5 (A - C - E)',
        notes: 'Mute low E string; root on open 5th string.',
        baseFret: 1,
        frets: ['✕', 0, 2, 2, 1, 0],
        fingers: [null, null, 2, 3, 1, null],
        mutePattern: '✕ - ◯ - 2 - 2 - 1 - ◯',
      },
      {
        id: 'e-minor',
        name: 'E Minor (Open)',
        shortName: 'Em',
        type: 'open',
        formula: '1 - ♭3 - 5 (E - G - B)',
        notes: 'Heavy 6-string minor chord; lowest open root on guitar.',
        baseFret: 1,
        frets: [0, 2, 2, 0, 0, 0],
        fingers: [null, 2, 3, null, null, null],
        mutePattern: '◯ - 2 - 2 - ◯ - ◯ - ◯',
      },
      {
        id: 'd-minor',
        name: 'D Minor (Open)',
        shortName: 'Dm',
        type: 'open',
        formula: '1 - ♭3 - 5 (D - F - A)',
        notes: 'Mute low E & A strings; melancholic open minor voicing.',
        baseFret: 1,
        frets: ['✕', '✕', 0, 2, 3, 1],
        fingers: [null, null, null, 2, 3, 1],
        mutePattern: '✕ - ✕ - ◯ - 2 - 3 - 1',
      },

      // --- BARRE CHORDS ---
      {
        id: 'f-barre',
        name: 'F Major (Barre E-Shape)',
        shortName: 'F',
        type: 'barre',
        formula: '1 - 3 - 5 (F - A - C)',
        notes: 'Full 1st-fret index finger barre across all 6 strings.',
        baseFret: 1,
        frets: [1, 3, 3, 2, 1, 1],
        fingers: [1, 3, 4, 2, 1, 1],
        barre: { fret: 1, fromString: 6, toString: 1, finger: 1 },
        mutePattern: '1 - 3 - 3 - 2 - 1 - 1',
      },
      {
        id: 'bm-barre',
        name: 'B Minor (Barre A-Shape)',
        shortName: 'Bm',
        type: 'barre',
        formula: '1 - ♭3 - 5 (B - D - F♯)',
        notes: '2nd-fret index barre on 5 strings; root on 5th string.',
        baseFret: 2,
        frets: ['✕', 2, 4, 4, 3, 2],
        fingers: [null, 1, 3, 4, 2, 1],
        barre: { fret: 2, fromString: 5, toString: 1, finger: 1 },
        mutePattern: '✕ - 2 - 4 - 4 - 3 - 2',
      },
      {
        id: 'b-barre',
        name: 'B Major (Barre A-Shape)',
        shortName: 'B',
        type: 'barre',
        formula: '1 - 3 - 5 (B - D♯ - F♯)',
        notes: '2nd-fret index barre on 5 strings with 3-finger triple fret on 4.',
        baseFret: 2,
        frets: ['✕', 2, 4, 4, 4, 2],
        fingers: [null, 1, 2, 3, 4, 1],
        barre: { fret: 2, fromString: 5, toString: 1, finger: 1 },
        mutePattern: '✕ - 2 - 4 - 4 - 4 - 2',
      },
      {
        id: 'fsharp-minor',
        name: 'F♯ Minor (Barre E-Shape)',
        shortName: 'F♯m',
        type: 'barre',
        formula: '1 - ♭3 - 5 (F♯ - A - C♯)',
        notes: '2nd-fret full barre across 6 strings with ring & pinky on fret 4.',
        baseFret: 2,
        frets: [2, 4, 4, 2, 2, 2],
        fingers: [1, 3, 4, 1, 1, 1],
        barre: { fret: 2, fromString: 6, toString: 1, finger: 1 },
        mutePattern: '2 - 4 - 4 - 2 - 2 - 2',
      },

      // --- 7TH CHORDS ---
      {
        id: 'a7',
        name: 'A7 Dominant (Open)',
        shortName: 'A7',
        type: '7ths',
        formula: '1 - 3 - 5 - ♭7 (A - C♯ - E - G)',
        notes: 'Classic blues turnaround and tension chord.',
        baseFret: 1,
        frets: ['✕', 0, 2, 0, 2, 0],
        fingers: [null, null, 2, null, 3, null],
        mutePattern: '✕ - ◯ - 2 - ◯ - 2 - ◯',
      },
      {
        id: 'e7',
        name: 'E7 Dominant (Open)',
        shortName: 'E7',
        type: '7ths',
        formula: '1 - 3 - 5 - ♭7 (E - G♯ - B - D)',
        notes: 'Heavy 6-string open dominant blues tension chord.',
        baseFret: 1,
        frets: [0, 2, 0, 1, 0, 0],
        fingers: [null, 2, null, 1, null, null],
        mutePattern: '◯ - 2 - ◯ - 1 - ◯ - ◯',
      },
      {
        id: 'd7',
        name: 'D7 Dominant (Open)',
        shortName: 'D7',
        type: '7ths',
        formula: '1 - 3 - 5 - ♭7 (D - F♯ - A - C)',
        notes: 'Mute low E & A; triangular open dominant shape.',
        baseFret: 1,
        frets: ['✕', '✕', 0, 2, 1, 2],
        fingers: [null, null, null, 2, 1, 3],
        mutePattern: '✕ - ✕ - ◯ - 2 - 1 - 2',
      },
      {
        id: 'cmaj7',
        name: 'Cmaj7 (Open)',
        shortName: 'Cmaj7',
        type: '7ths',
        formula: '1 - 3 - 5 - 7 (C - E - G - B)',
        notes: 'Dreamy, lush jazz and indie pop harmony.',
        baseFret: 1,
        frets: ['✕', 3, 2, 0, 0, 0],
        fingers: [null, 3, 2, null, null, null],
        mutePattern: '✕ - 3 - 2 - ◯ - ◯ - ◯',
      },
      {
        id: 'amin7',
        name: 'A Minor 7 (Open)',
        shortName: 'Am7',
        type: '7ths',
        formula: '1 - ♭3 - 5 - ♭7 (A - C - E - G)',
        notes: 'Smooth, warm minor 7th harmony.',
        baseFret: 1,
        frets: ['✕', 0, 2, 0, 1, 0],
        fingers: [null, null, 2, null, 1, null],
        mutePattern: '✕ - ◯ - 2 - ◯ - 1 - ◯',
      },
    ] as ChordData[],
  },
  {
    id: 'guitar-caged',
    title: 'CAGED System & Fretboard',
    icon: 'fa-solid fa-shapes',
    badge: 'Neck Landmark',
    chip: 'caged',
    items: [
      { id: 'c-shape', name: 'C Shape Position', formula: 'Root on 5th string', notes: 'Connects to D Shape behind it, A Shape ahead of it.' },
      { id: 'a-shape', name: 'A Shape Position', formula: 'Root on 5th string', notes: 'Standard barre chord shape; common soloing launchpad.' },
      { id: 'g-shape', name: 'G Shape Position', formula: 'Root on 6th string', notes: 'Wide fret span; excellent arpeggio extension shape.' },
      { id: 'e-shape', name: 'E Shape Position', formula: 'Root on 6th string', notes: 'Primary 6th-string root barre chord and minor pentatonic box 1.' },
      { id: 'd-shape', name: 'D Shape Position', formula: 'Root on 4th string', notes: 'Upper-register chord voicing and screaming lead box.' },
      { id: 'octaves', name: 'Octave Jump Rules', formula: 'Str 6 → Str 4 (+2 frets) • Str 5 → Str 3 (+2 frets)', notes: 'Instant fretboard navigation landmarks across B-string shift.' },
    ] as CagedItem[],
  },
  {
    id: 'guitar-intervals',
    title: 'Intervals & Harmony',
    icon: 'fa-solid fa-circle-nodes',
    badge: 'Ear & Theory',
    chip: 'intervals',
    items: [
      { name: 'Minor 2nd / Major 2nd', formula: '1 semitone / 2 semitones', notes: 'Half step (clashing tension) / Whole step (scale motion).' },
      { name: 'Minor 3rd / Major 3rd', formula: '3 semitones / 4 semitones', notes: 'Defines minor (sad/dark) vs major (happy/bright) tonality.' },
      { name: 'Perfect 4th / Tritone', formula: '5 semitones / 6 semitones (♭5)', notes: 'Suspension / Diminished 5th tension (the "Devil\'s Interval").' },
      { name: 'Perfect 5th / Octave', formula: '7 semitones / 12 semitones', notes: 'Power chord foundation / Complete 12-semitone pitch cycle.' },
      { name: 'Circle of Fifths', formula: 'C - G - D - A - E - B - F♯ - D♭ - A♭ - E♭ - B♭ - F', notes: 'Key signatures, modulation paths, and chord progression maps.' },
    ] as IntervalItem[],
  },
  {
    id: 'guitar-tunings',
    title: 'Alternate Tunings & Voicings',
    icon: 'fa-solid fa-sliders',
    badge: 'Tuning Guide',
    chip: 'tunings',
    items: [
      { name: 'Standard Tuning (EADGBE)', formula: 'E2 - A2 - D3 - G3 - B3 - E4', notes: 'Universal tuning; 4ths between strings with major 3rd on G-B.', pitches: [82.41, 110.0, 146.83, 196.0, 246.94, 329.63] },
      { name: 'Drop D (DADGBE)', formula: 'D2 - A2 - D3 - G3 - B3 - E4', notes: 'One-finger power chords with deep heavy rock bass extension.', pitches: [73.42, 110.0, 146.83, 196.0, 246.94, 329.63] },
      { name: 'DADGAD (Modal Celtic)', formula: 'D2 - A2 - D3 - G3 - A3 - D4', notes: 'Open modal resonance for folk, acoustic, and Led Zeppelin riffs.', pitches: [73.42, 110.0, 146.83, 196.0, 220.0, 293.66] },
      { name: 'Open G (DGDGBD)', formula: 'D2 - G2 - D3 - G3 - B3 - D4', notes: 'Keith Richards / Rolling Stones & slide blues standard.', pitches: [73.42, 98.0, 146.83, 196.0, 246.94, 293.66] },
      { name: 'Half-Step Down (E♭ Standard)', formula: 'E♭2 - A♭2 - D♭3 - G♭3 - B♭3 - E♭4', notes: 'Jimi Hendrix, Stevie Ray Vaughan, reduced string tension.', pitches: [77.78, 103.83, 138.59, 185.0, 233.08, 311.13] },
    ] as TuningItem[],
  },
];

// =============================================================================
// DRUM THEORY CATEGORIES DATA
// =============================================================================
export const drumCategories: TheoryCategory[] = [
  {
    id: 'drum-grid-hero',
    title: 'Interactive 16-Step Beat Grid & Sticking Sandbox',
    icon: 'fa-solid fa-drum',
    badge: 'Visual Sandbox',
    chip: 'drum-grid',
  },
  {
    id: 'drum-rudiments',
    title: 'Essential Rudiments & Sticking',
    icon: 'fa-solid fa-drumstick-bite',
    badge: 'Sticking & Hands',
    chip: 'rudiments',
    subfilters: ['all', 'rolls', 'diddles', 'flams-drags'],
    items: [
      { id: 'single-stroke', name: 'Single Stroke Roll', type: 'rolls', formula: 'R L R L | R L R L', notes: 'Fundamental speed, endurance, and dynamic control building block.', sticking: 'R-L-R-L-R-L-R-L', accent: 'Even velocity' },
      { id: 'double-stroke', name: 'Double Stroke Roll', type: 'rolls', formula: 'R R L L | R R L L', notes: 'Bounce control, buzz rolls, and fast open-handed fills.', sticking: 'R-R-L-L-R-R-L-L', accent: 'Snap on 2nd stroke' },
      { id: 'paradiddle', name: 'Single Paradiddle', type: 'diddles', formula: 'R L R R | L R L L', notes: 'Combines singles and doubles; alternates lead hand across bars.', sticking: 'R-L-R-R-L-R-L-L', accent: '> on strokes 1 & 5' },
      { id: 'double-paradiddle', name: 'Double Paradiddle', type: 'diddles', formula: 'R L R L R R | L R L R L L', notes: '6-stroke diddle perfect for 6/8 and triplet groove accents.', sticking: 'R-L-R-L-R-R-L-R-L-R-L-L', accent: 'Triplet swing' },
      { id: 'flam', name: 'Flam', type: 'flams-drags', formula: 'lR | rL', notes: 'Grace note preceding primary downbeat accent for thick texture.', sticking: 'lR-rL', accent: 'Grace note 2" / Accent 10"' },
      { id: 'drag', name: 'Drag / Ruff', type: 'flams-drags', formula: 'llR | rrL', notes: 'Two quick bounce grace notes sliding into the accented downbeat.', sticking: 'llR-rrL', accent: 'Tight double grace' },
      { id: 'paradiddle-diddle', name: 'Paradiddle-Diddle', type: 'diddles', formula: 'R L R R L L | R L R R L L', notes: 'Smooth 6-stroke roll alternative for modern jazz, funk, and gospel.', sticking: 'R-L-R-R-L-L', accent: 'Lead hand stays on Right' },
    ] as RudimentItem[],
  },
  {
    id: 'drum-meter',
    title: 'Time Signatures & Meter',
    icon: 'fa-solid fa-stopwatch',
    badge: 'Time & Pulse',
    chip: 'meter',
    items: [
      { name: '4/4 Common Time', formula: '4 quarter notes per bar', notes: 'Backbeat on 2 & 4; rock, pop, funk standard pulse.' },
      { name: '3/4 Waltz Meter', formula: '3 quarter notes per bar', notes: 'Strong accent on beat 1; dance waltz and ballad meter.' },
      { name: '6/8 Compound Duple', formula: '6 eighth notes (2 dotted pulses)', notes: 'Counted 1-2-3, 4-5-6; pulses on 1 & 4 (slow rock / blues).' },
      { name: '7/8 Odd Meter', formula: '7 eighth notes per bar', notes: 'Grouped 2+2+3 or 3+2+2; prog rock and Balkan dance rhythm.' },
      { name: '5/4 Odd Meter', formula: '5 quarter notes per bar', notes: 'Grouped 3+2 or 2+3 (Dave Brubeck "Take Five", Mission Impossible).' },
      { name: '12/8 Blues Shuffle', formula: '12 eighth notes (4 triplets)', notes: 'Heavy four-pulse triplet groove for Chicago blues and soul.' },
    ] as MeterItem[],
  },
  {
    id: 'drum-polyrhythms',
    title: 'Polyrhythms & Independence',
    icon: 'fa-solid fa-code-fork',
    badge: 'Coordination',
    chip: 'polyrhythms',
    items: [
      { name: '3 against 2 (3:2)', formula: 'Mnemonic: "Not Dif-fi-cult"', notes: 'Hand 1 plays 3 even pulses while Hand 2 plays 2 across same measure.' },
      { name: '4 against 3 (4:3)', formula: 'Mnemonic: "Pass the Gol-den But-ter"', notes: 'Cross-rhythm tension creating shifting downbeats.' },
      { name: '4-Way Limb Independence', formula: 'RH (Ride) + LH (Snare) + RF (Kick) + LF (Hi-Hat)', notes: 'Isolating all 4 limbs across different rhythmic subdivisions.' },
      { name: 'Ostinato Foot Overlays', formula: 'Repeating bass/hi-hat pattern with soloing hands', notes: 'Samba foot pattern or jazz swing pedal ostinato.' },
    ] as PolyrhythmItem[],
  },
  {
    id: 'drum-grooves',
    title: 'Groove Templates & Feels',
    icon: 'fa-solid fa-sliders',
    badge: 'Styles & Pocket',
    chip: 'grooves',
    items: [
      { id: 'rock-8', name: 'Standard 8th Rock Beat', formula: 'Kick on 1 & 3 | Snare on 2 & 4 | Hi-Hat on 8ths', notes: 'The driving backbone of modern rock and pop drumming.' },
      { id: 'funk-16', name: '16th Funk Pocket', formula: 'Syncopated kick & ghost snares on "e" and "a"', notes: 'Tower of Power / Clyde Stubblefield tight funk groove.' },
      { id: 'jazz-swing', name: 'Jazz Swing Ride Pattern', formula: '1, 2-and, 3, 4-and ("spang-a-lang")', notes: 'Hi-hat pedal chicks on 2 & 4 with feathering kick drum.' },
      { id: 'purdie-shuffle', name: 'Half-Time Shuffle (Purdie)', formula: 'Triplet ghost snares with half-time backbeat on 3', notes: 'Bernard Purdie / Toto "Rosanna" legendary shuffle groove.' },
      { id: 'bossa-nova', name: 'Bossa Nova / Latin', formula: 'Cross-stick clave pattern over steady kick 8ths', notes: 'Smooth Brazilian syncopation with delicate hi-hat control.' },
    ] as GrooveItem[],
  },
  {
    id: 'drum-subdivisions',
    title: 'Subdivisions & Dynamics',
    icon: 'fa-solid fa-wave-square',
    badge: 'Accents & Feel',
    chip: 'subdivisions',
    items: [
      { name: 'Quarter Notes (1/4)', formula: '1 - 2 - 3 - 4', notes: 'Primary pulse reference and metronome click anchor.' },
      { name: '8th Notes (1/8)', formula: '1 & 2 & 3 & 4 &', notes: 'Straight standard subdivisions.' },
      { name: '16th Notes (1/16)', formula: '1 e & a 2 e & a 3 e & a 4 e & a', notes: 'Double-speed groove subdivisions for funk and hi-hat rolls.' },
      { name: '8th Triplets', formula: '1-trip-let 2-trip-let 3-trip-let 4-trip-let', notes: '3 notes per quarter-note pulse; swing and shuffle foundation.' },
      { name: 'Ghost Notes vs Accents', formula: 'Ghost (1-2" drop) vs Accent (8-12" whip)', notes: 'Dynamic height contrast that transforms mechanical beats into music.' },
    ] as SubdivisionItem[],
  },
];
