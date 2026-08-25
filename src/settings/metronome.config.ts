/* ==========================================================================
   KINS Metronome — single source of truth (settings rule: no hardcoded
   dupes in controllers). BPM limits, time signatures, subdivisions,
   click sounds, setlist presets, coach-deck tabs and all user-facing copy.
   ========================================================================== */

export interface MetronomeTimeSignature {
  id: string;
  label: string;
  beatsPerBar: number;
  beatUnit: number;
}

export interface MetronomeSubdivision {
  id: string;
  label: string;
  displayBottom: string;
  /* Clicks per beat — 1.5 = quarter-note triplets (3 per 2 beats) */
  perBeat: number;
}

export interface MetronomeSound {
  id: string;
  label: string;
  type: OscillatorType;
  freq: number;
  accentFreq: number;
  decay: number;
  gain: number;
}

export type SetlistCategory = 'inspires' | 'covers' | 'originals' | 'custom';

export interface MetronomeSetlistEntry {
  title: string;
  artist: string;
  bpm: number;
  category: SetlistCategory;
  inspirationId?: string;
}

export interface CoachDeckTab {
  id: string;
  label: string;
  icon: string;
  blurb: string;
}

export const METRO_BPM = {
  min: 20,
  max: 300,
  default: 120,
  step: 1,
  /* Hold-to-repeat on the ± steppers */
  repeatDelayMs: 400,
  repeatRateMs: 60
} as const;

export const METRO_TIME_SIGNATURES: readonly MetronomeTimeSignature[] = [
  { id: '4-4', label: '4/4', beatsPerBar: 4, beatUnit: 4 },
  { id: '3-4', label: '3/4', beatsPerBar: 3, beatUnit: 4 },
  { id: '2-4', label: '2/4', beatsPerBar: 2, beatUnit: 4 },
  { id: '6-8', label: '6/8', beatsPerBar: 6, beatUnit: 8 },
  { id: '7-8', label: '7/8', beatsPerBar: 7, beatUnit: 8 },
  { id: '5-4', label: '5/4', beatsPerBar: 5, beatUnit: 4 },
  { id: '12-8', label: '12/8', beatsPerBar: 12, beatUnit: 8 },
  { id: '9-8', label: '9/8', beatsPerBar: 9, beatUnit: 8 }
];

export const METRO_SUBDIVISIONS: readonly MetronomeSubdivision[] = [
  { id: '1-4', label: '1/4', displayBottom: '4', perBeat: 1 },
  { id: '1-4t', label: '1/4T', displayBottom: '4T', perBeat: 1.5 },
  { id: '1-8', label: '1/8', displayBottom: '8', perBeat: 2 },
  { id: '1-8t', label: '1/8T', displayBottom: '8T', perBeat: 3 },
  { id: '1-16', label: '1/16', displayBottom: '16', perBeat: 4 },
  { id: '1-16t', label: '1/16T', displayBottom: '16T', perBeat: 6 },
  { id: '1-32', label: '1/32', displayBottom: '32', perBeat: 8 }
];

export const METRO_SOUNDS: readonly MetronomeSound[] = [
  { id: 'click', label: 'CLICK', type: 'square', freq: 1050, accentFreq: 1700, decay: 0.045, gain: 0.5 },
  { id: 'woodblock', label: 'BLOCK', type: 'triangle', freq: 850, accentFreq: 1250, decay: 0.07, gain: 0.7 },
  { id: 'beep', label: 'BEEP', type: 'sine', freq: 880, accentFreq: 1320, decay: 0.12, gain: 0.6 }
];

/* ── Setlist by category ───────────────────────────────────────────────
   Inspires = 1:1 mirror of INSPIRATION_TRACKS (inspirationVault.js) with
   verified studio BPMs. Source notes inline; half-time/doubles handled via
   canonical quarter-note pulse the metronome expects.
   Covers   = KINS_COVERS_DATA when populated (currently empty — owner supply)
   Originals = Kins original material (placeholder — coming soon)
   ─────────────────────────────────────────────────────────────────── */

export const METRO_SETLIST_INSPIRES: readonly MetronomeSetlistEntry[] = [
  // Charlie curation — grunge / britpop / noise
  { title: 'Turnip Farm', artist: 'Dinosaur Jr.', bpm: 147, category: 'inspires', inspirationId: 'turnip-farm' },
  { title: '(David Bowie I Love You) Since I Was Six', artist: 'The Brian Jonestown Massacre', bpm: 119, category: 'inspires', inspirationId: 'david-bowie-six' },
  { title: 'Underwear', artist: 'Pulp', bpm: 95, category: 'inspires', inspirationId: 'underwear' },
  { title: 'Unmade Bed', artist: 'Sonic Youth', bpm: 115, category: 'inspires', inspirationId: 'unmade-bed' },
  { title: "She's So Loose", artist: 'Supergrass', bpm: 156, category: 'inspires', inspirationId: 'shes-so-loose' },
  // Vivian curation — post-punk / dream pop / bedroom pop
  { title: 'A Letter to Elise', artist: 'The Cure', bpm: 150, category: 'inspires', inspirationId: 'letter-to-elise' },
  { title: 'Cry', artist: 'The Sundays', bpm: 155, category: 'inspires', inspirationId: 'cry' },
  { title: 'One Time', artist: 'beabadoobee', bpm: 79, category: 'inspires', inspirationId: 'one-time' },
  { title: 'Bluebeard', artist: 'Cocteau Twins', bpm: 95, category: 'inspires', inspirationId: 'bluebeard' },
  { title: 'A Night Like This', artist: 'The Cure', bpm: 122, category: 'inspires', inspirationId: 'night-like-this' },
  // Trai curation — art rock / lo-fi / indie
  { title: 'Heroes', artist: 'David Bowie', bpm: 112, category: 'inspires', inspirationId: 'heroes' },
  { title: 'Jane!', artist: 'The Long Faces', bpm: 146, category: 'inspires', inspirationId: 'jane' },
  { title: 'Mkultra Victim', artist: 'Negative XP', bpm: 160, category: 'inspires', inspirationId: 'negative-xp' },
  { title: 'Hello Juliet', artist: 'Clarion', bpm: 139, category: 'inspires', inspirationId: 'hello-juliet' },
  { title: 'Made in Japan', artist: 'Buck Owens & His Buckaroos', bpm: 130, category: 'inspires', inspirationId: 'made-in-japan' },
] as const;

export const METRO_SETLIST_COVERS: readonly MetronomeSetlistEntry[] = [
  // Populated when KINS_COVERS_DATA is supplied — see AGENTS.md §9 deferred item
] as const;

export const METRO_SETLIST_ORIGINALS: readonly MetronomeSetlistEntry[] = [
  // Kins original material — placeholder until release slate is locked
] as const;

export const METRO_SETLIST_CUSTOM: readonly MetronomeSetlistEntry[] = [] as const;

export const METRO_SETLIST_BY_CATEGORY: Record<SetlistCategory, readonly MetronomeSetlistEntry[]> = {
  inspires: METRO_SETLIST_INSPIRES,
  covers: METRO_SETLIST_COVERS,
  originals: METRO_SETLIST_ORIGINALS,
  custom: METRO_SETLIST_CUSTOM,
} as const;

/* Legacy alias — filtered views should use METRO_SETLIST_BY_CATEGORY.
   Kept so any stray import of METRO_SETLIST still resolves to inspires. */
export const METRO_SETLIST: readonly MetronomeSetlistEntry[] = METRO_SETLIST_INSPIRES;

export const METRO_COACH_TABS: readonly CoachDeckTab[] = [
  { id: 'inner-clock', label: 'INNER CLOCK', icon: 'fa-solid fa-heart-pulse', blurb: 'Automated mute cycles to build your internal timekeeping.' },
  { id: 'speed-trainer', label: 'SPEED TRAINER', icon: 'fa-solid fa-forward-fast', blurb: 'Ramp the tempo up bar by bar — hold time, don’t chase.' },
  { id: 'rhythm-step', label: 'RHYTHM STEP', icon: 'fa-solid fa-shoe-prints', blurb: 'Progressive subdivision shifts and polyrhythmic grids.' },
  { id: 'tempo-primer', label: 'TEMPO PRIMER', icon: 'fa-solid fa-stopwatch', blurb: 'Target tempo recall & micro-timing consistency trainer.' }
];

export type CoachDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const COACH_DEFAULTS = {
  innerClock: { audibleBars: 2, mutedBars: 2, random: false },
  speedTrainer: { start: 120, target: 180, step: 10, everyBars: 4, unit: 'bars' as const, repeat: false },
  rhythmStep: { pattern: ['1-4', '1-8', '1-16'] as string[], everyBars: 4, poly: false, polyRatio: '3:2' as const },
  tempoPrimer: { difficulty: 'easy' as CoachDifficulty, target: 120 }
} as const;

export const COACH_PRIMER_MAELZEL = [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 126, 132, 138, 144, 152, 160, 168, 176, 184, 192, 200, 208] as const;

export const COACH_STORAGE_KEYS = {
  inner: 'kins-metro-coach-inner',
  speed: 'kins-metro-coach-speed',
  rhythm: 'kins-metro-coach-rhythm',
  primer: 'kins-metro-coach-primer',
  activeTab: 'kins-metro-coach-tab',
  midiDevice: 'kins-metro-midi-device'
} as const;

/* Beat scheduling.
   Legacy path (no AudioWorklet): lookahead scheduler — "A Tale of Two
   Clocks". 25ms main-thread tick, 0.3s ahead on the audio clock so GC /
   layout stalls up to ~300ms cannot starve the schedule. Tempo & option
   changes flush already-scheduled clicks beyond changeGuardSec and
   reschedule at the new settings so they land immediately instead of up
   to one full lookahead later.
   Worklet path: scheduling runs inside the AudioWorkletProcessor on the
   audio rendering thread (immune to ALL main-thread stalls); these knobs
   only apply to the legacy fallback. */
export const METRO_TIMING = {
  schedulerIntervalMs: 25,
  scheduleAheadSec: 0.3,
  /* First click lands this long after start() so it never fires before
     the audio thread has picked up the graph */
  startOffsetSec: 0.08,
  /* Already-scheduled clicks closer than this to now are left alone when
     flushing on a tempo/option change (cancelling mid-playback artifacts) */
  changeGuardSec: 0.03,
  /* On explicit stop() everything further than this from now is cancelled */
  stopFlushGuardSec: 0.005,
  /* Visual beats fire this early on the rAF drain (frame quantisation slack) */
  visualDrainLeadSec: 0.02,
  /* AudioWorklet module (progressive enhancement over the legacy path) */
  workletName: 'kins-click',
  workletUrl: '/worklets/click-worklet.js'
} as const;

export const METRO_COPY = {
  tapHint: 'TAP TEMPO',
  tapReset: 'Tap tempo reset — keep tapping',
  setlistTitle: 'SETLIST',
  setlistSubtitle: 'Rehearsal standards — tap to load the tempo',
  setlistLoaded: (bpm: number, title: string) => `Tempo set to ${bpm} BPM — ${title}`,
  settingsTitle: 'SETTINGS',
  soundLabel: 'CLICK SOUND',
  volumeLabel: 'VOLUME',
  accentLabel: 'ACCENT FIRST BEAT',
  flashLabel: 'FLASH ON BEAT',
  vibrateLabel: 'VIBRATE ON BEAT',
  beatIndicatorLabel: 'BEAT INDICATOR STYLE',
  beatIndicatorDots: 'Dots',
  beatIndicatorRadial: 'Radial Bars',
  coachTitle: 'COACH DECK',
  coachComingSoon: 'Module in rehearsal — coming soon.',
  tsSheetTitle: 'TIME SIGNATURE',
  subSheetTitle: 'SUBDIVISION',
  infoTsBeats: 'Beats per bar — how many clicks before the pattern repeats.',
  infoTsUnit: 'Note value of each click — 4 = quarter notes, 8 = eighth notes.',
  infoSub: 'Subdivisions split every beat into smaller, even clicks.',
   webAudioUnsupported: 'Web Audio is not supported on this browser.',
   audioBlocked: 'Audio was blocked — press play again to start.',
   audioInterrupted: 'Audio interrupted — will resume automatically.',
   audioResumed: 'Audio resumed.',
  startedLabel: 'Stop metronome',
  stoppedLabel: 'Start metronome',
  coachInnerTitle: 'Mute Trainer',
  coachInnerBlurb: 'Automated mute cycles to build your internal timekeeping.',
  coachSpeedTitle: 'Speed Trainer',
  coachSpeedBlurb: 'Gradual tempo ramps at fixed bar intervals.',
  coachRhythmTitle: 'Rhythm & Subdivision Step',
  coachRhythmBlurb: 'Progressive subdivision shifts and polyrhythmic grids.',
  coachPrimerTitle: 'Internal Clock Primer',
  coachPrimerBlurb: 'Target tempo recall & micro-timing consistency trainer.',
  coachCycle: 'CYCLE',
  coachRandomDropouts: 'Random Dropouts',
  coachBarsAudibleMuted: 'Bars Audible & Muted',
  coachBpmRange: 'BPM Range (Start → Target)',
  coachStepIncrement: 'Step Increment',
  coachInterval: 'Interval',
  coachRepeat: 'Repeat',
  coachPolyGrid: 'Polyrhythmic Grid',
  coachSubdivisionPattern: 'Subdivision Pattern',
  coachChangeEvery: 'Change Every',
  coachStartSession: 'START TRAINING SESSION',
  coachStopSession: 'STOP SESSION',
  coachOpenSettings: 'Open coach settings',
  coachLive: 'LIVE',
  coachPhaseAudible: 'AUDIBLE',
  coachPhaseMuted: 'MUTED',
  coachNextPhase: 'Next',
  midiTitle: 'MIDI DEVICE',
  midiConnect: 'CONNECT MIDI',
  midiConnected: 'MIDI CONNECTED',
  midiNoSupport: 'Web MIDI not supported on this browser',
  midiTapHint: 'Tap 4 quarter notes at your recalled speed',
  midiHint: 'Any velocity note 35–81 triggers tap. Works with drum pads & keyboards.'
} as const;

export type MetroBeatIndicatorStyle = 'dots' | 'radial';

export type SheetInstrument = 'bass' | 'electric' | 'acoustic' | 'drums';

export interface SheetInstrumentDef {
  id: SheetInstrument;
  label: string;
  shortLabel: string;
  icon: string;
}

export const SHEET_INSTRUMENTS: readonly SheetInstrumentDef[] = [
  { id: 'bass', label: 'BASS', shortLabel: 'BASS', icon: 'fa-solid fa-guitar' },
  { id: 'electric', label: 'ELECTRIC', shortLabel: 'ELEC', icon: 'fa-solid fa-guitar' },
  { id: 'acoustic', label: 'ACOUSTIC', shortLabel: 'ACOU', icon: 'fa-solid fa-guitar' },
  { id: 'drums', label: 'DRUMS', shortLabel: 'DRUMS', icon: 'fa-solid fa-drum' }
] as const;

export const METRO_SHEET_CONFIG = {
  bucket: 'kins-sheets',
  maxBytes: 15 * 1024 * 1024, // 15 MB per file
  allowedExt: ['.pdf', '.gp', '.gp5', '.xml', '.musicxml', '.mxl'] as const,
  allowedMime: [
    'application/pdf',
    'application/x-pdf',
    'audio/x-guitar-pro',
    'application/x-guitar-pro',
    'application/octet-stream',
    'text/xml',
    'application/xml',
    'application/vnd.recordare.musicxml+xml',
    'application/vnd.recordare.musicxml',
    'application/x-musicxml'
  ] as const,
  stripHeight: 128 as const,
  stripHeightMobile: 96 as const
} as const;

export const SHEET_STORAGE_KEYS = {
  instrument: 'kins-metro-sheet-instrument',
  follow: 'kins-metro-sheet-follow',
  loop: 'kins-metro-sheet-loop',
  perSong: 'kins-metro-sheet-map'
} as const;

export const METRO_STORAGE_KEYS = {
  bpm: 'kins-metro-bpm',
  timeSig: 'kins-metro-timesig',
  subdivision: 'kins-metro-subdivision',
  sound: 'kins-metro-sound',
  volume: 'kins-metro-volume',
  accent: 'kins-metro-accent',
  flash: 'kins-metro-flash',
  vibrate: 'kins-metro-vibrate',
  beatStyle: 'kins-metro-beatStyle',
  customSetlist: 'kins-metro-custom-setlist'
} as const;
