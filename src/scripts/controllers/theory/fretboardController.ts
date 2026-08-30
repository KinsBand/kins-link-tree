/**
 * KINS GUITAR FRETBOARD CONTROLLER
 * Progressive neck calculation, realistic headstock, bone nut,
 * gauged strings (wound Low E/A/D and plain steel), crowned nickel fretwires,
 * mother-of-pearl inlays, plucking vibration animation, and interval degree toggle.
 */
import { playGuitarPluck } from './theoryAudio';

export const FRET_NOTES = [
  ['E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E'],
  ['B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  ['G', 'Ab', 'A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G'],
  ['D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'C#', 'D'],
  ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A'],
  ['E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E'],
];

export const STRING_BASE_FREQS = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41];
export const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E'];
export const STRING_OCTAVES = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
export const STRING_GAUGES = [1.2, 1.5, 1.8, 2.3, 2.8, 3.4];
export const FRET_WIDTHS = [48, 72, 68, 64, 60, 56, 53, 50, 47, 44, 41, 38, 36];
export const CHROMATIC_SCALE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export function getFretFreq(strIndex: number, fret: number): number {
  const base = STRING_BASE_FREQS[strIndex];
  return base * Math.pow(2, fret / 12);
}

export const SCALES_DATA: Record<string, { name: string; intervals: number[]; degrees: Record<number, string> }> = {
  'pentatonic-minor': { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10], degrees: { 0: 'R', 3: '♭3', 5: '4', 7: '5', 10: '♭7' } },
  'pentatonic-major': { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9], degrees: { 0: 'R', 2: '2', 4: '3', 7: '5', 9: '6' } },
  'blues': { name: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10], degrees: { 0: 'R', 3: '♭3', 5: '4', 6: '♭5', 7: '5', 10: '♭7' } },
  'natural-minor': { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10], degrees: { 0: 'R', 2: '2', 3: '♭3', 5: '4', 7: '5', 8: '♭6', 10: '♭7' } },
  'major': { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11], degrees: { 0: 'R', 2: '2', 4: '3', 5: '4', 7: '5', 9: '6', 11: '7' } },
  'dorian': { name: 'Dorian Mode', intervals: [0, 2, 3, 5, 7, 9, 10], degrees: { 0: 'R', 2: '2', 3: '♭3', 5: '4', 7: '5', 9: '6', 10: '♭7' } },
  'mixolydian': { name: 'Mixolydian Mode', intervals: [0, 2, 4, 5, 7, 9, 10], degrees: { 0: 'R', 2: '2', 4: '3', 5: '4', 7: '5', 9: '6', 10: '♭7' } },
};

export const CHORDS_DATA: Record<string, { name: string; root: string; frets: (number | string)[]; labels: string[]; desc: string }> = {
  'g5': { name: 'G5 Power Chord', root: 'G', frets: [3, 5, 5, '✕', '✕', '✕'], labels: ['R', '5', 'R', '✕', '✕', '✕'], desc: '3-note heavy rock/punk power chord on Low E (Fret 3).' },
  'e5': { name: 'E5 Power Chord', root: 'E', frets: [0, 2, 2, '✕', '✕', '✕'], labels: ['R', '5', 'R', '✕', '✕', '✕'], desc: 'Heavy open Low E power chord; lowest open root on guitar.' },
  'a5': { name: 'A5 Power Chord', root: 'A', frets: ['✕', 0, 2, 2, '✕', '✕'], labels: ['✕', 'R', '5', 'R', '✕', '✕'], desc: 'Open A string power chord; cornerstone hard rock riff shape.' },
  'd5': { name: 'D5 Power Chord', root: 'D', frets: ['✕', '✕', 0, 2, 3, '✕'], labels: ['✕', '✕', 'R', '5', 'R', '✕'], desc: 'Open D string punchy power chord.' },
  'c5': { name: 'C5 Power Chord', root: 'C', frets: ['✕', 3, 5, 5, '✕', '✕'], labels: ['✕', 'R', '5', 'R', '✕', '✕'], desc: 'Movable 5th-string root power chord (Fret 3 for C).' },
  'f5': { name: 'F5 Power Chord', root: 'F', frets: [1, 3, 3, '✕', '✕', '✕'], labels: ['R', '5', 'R', '✕', '✕', '✕'], desc: 'Low E root (Fret 1) heavy half-step rock power chord.' },
  'c-major': { name: 'C Major', root: 'C', frets: ['✕', 3, 2, 0, 1, 0], labels: ['✕', 'R', '3', '5', 'R', '3'], desc: 'Open C Major chord with muted Low E string.' },
  'g-major': { name: 'G Major', root: 'G', frets: [3, 2, 0, 0, 0, 3], labels: ['R', '3', '5', 'R', '3', 'R'], desc: 'Open G Major chord across all 6 strings.' },
  'd-major': { name: 'D Major', root: 'D', frets: ['✕', '✕', 0, 2, 3, 2], labels: ['✕', '✕', 'R', '5', 'R', '3'], desc: 'Open D Major chord with muted Low E and A strings.' },
  'a-major': { name: 'A Major', root: 'A', frets: ['✕', 0, 2, 2, 2, 0], labels: ['✕', 'R', '5', 'R', '3', '5'], desc: 'Open A Major chord with 3-finger cluster on fret 2.' },
  'e-major': { name: 'E Major', root: 'E', frets: [0, 2, 2, 1, 0, 0], labels: ['R', '5', 'R', '3', '5', 'R'], desc: 'Open E Major chord on lowest open string.' },
  'a-minor': { name: 'A Minor', root: 'A', frets: ['✕', 0, 2, 2, 1, 0], labels: ['✕', 'R', '5', 'R', '♭3', '5'], desc: 'Open A Minor chord with muted Low E string.' },
  'e-minor': { name: 'E Minor', root: 'E', frets: [0, 2, 2, 0, 0, 0], labels: ['R', '5', 'R', '♭3', '5', 'R'], desc: 'Open E Minor chord on lowest open string.' },
  'd-minor': { name: 'D Minor', root: 'D', frets: ['✕', '✕', 0, 2, 3, 1], labels: ['✕', '✕', 'R', '5', 'R', '♭3'], desc: 'Melancholic open D minor voicing.' },
  'f-barre': { name: 'F Major (Barre)', root: 'F', frets: [1, 3, 3, 2, 1, 1], labels: ['R', '5', 'R', '3', '5', 'R'], desc: 'Full 1st fret index barre across 6 strings (E-shape).' },
  'bm-barre': { name: 'B Minor (Barre)', root: 'B', frets: ['✕', 2, 4, 4, 3, 2], labels: ['✕', 'R', '5', 'R', '♭3', '5'], desc: '2nd fret index barre on 5 strings (A-shape).' },
  'b-barre': { name: 'B Major (Barre)', root: 'B', frets: ['✕', 2, 4, 4, 4, 2], labels: ['✕', 'R', '5', 'R', '3', '5'], desc: '2nd fret index barre on 5 strings (A-major shape).' },
  'fsharp-minor': { name: 'F♯ Minor (Barre)', root: 'F♯', frets: [2, 4, 4, 2, 2, 2], labels: ['R', '5', 'R', '♭3', '5', 'R'], desc: '2nd fret full index barre across 6 strings (E-minor shape).' },
  'a7': { name: 'A7 Dominant', root: 'A', frets: ['✕', 0, 2, 0, 2, 0], labels: ['✕', 'R', '5', '♭7', '3', '5'], desc: 'Blues turnaround open dominant 7th.' },
  'e7': { name: 'E7 Dominant', root: 'E', frets: [0, 2, 0, 1, 0, 0], labels: ['R', '5', '♭7', '3', '5', 'R'], desc: 'Open dominant 7th blues tension chord.' },
  'd7': { name: 'D7 Dominant', root: 'D', frets: ['✕', '✕', 0, 2, 1, 2], labels: ['✕', '✕', 'R', '5', '♭7', '3'], desc: 'Open dominant 7th chord.' },
  'cmaj7': { name: 'Cmaj7', root: 'C', frets: ['✕', 3, 2, 0, 0, 0], labels: ['✕', 'R', '3', '5', '7', '3'], desc: 'Lush major 7th acoustic harmony.' },
  'amin7': { name: 'A Minor 7', root: 'A', frets: ['✕', 0, 2, 0, 1, 0], labels: ['✕', 'R', '5', '♭7', '♭3', '5'], desc: 'Smooth, warm minor 7th harmony.' },
};

export const CAGED_DATA: Record<string, { name: string; frets: (number | string)[]; labels: string[]; desc: string }> = {
  'c-shape': { name: 'C Shape Position', frets: ['✕', 3, 2, 0, 1, 0], labels: ['✕', 'R', '3', '5', 'R', '3'], desc: 'Root on 5th string (Fret 3 for C).' },
  'a-shape': { name: 'A Shape Position', frets: ['✕', 0, 2, 2, 2, 0], labels: ['✕', 'R', '5', 'R', '3', '5'], desc: 'Root on 5th string (Fret 0 for A / Fret 3 for C).' },
  'g-shape': { name: 'G Shape Position', frets: [3, 2, 0, 0, 0, 3], labels: ['R', '3', '5', 'R', '3', 'R'], desc: 'Root on 6th string (Fret 3 for G).' },
  'e-shape': { name: 'E Shape Position', frets: [0, 2, 2, 1, 0, 0], labels: ['R', '5', 'R', '3', '5', 'R'], desc: 'Root on 6th string (Fret 0 for E / Fret 8 for C).' },
  'd-shape': { name: 'D Shape Position', frets: ['✕', '✕', 0, 2, 3, 2], labels: ['✕', '✕', 'R', '5', 'R', '3'], desc: 'Root on 4th string (Fret 0 for D / Fret 10 for C).' },
};

export class GuitarFretboardController {
  private currentFretMode: string = 'scales';
  private currentFretLabelMode: string = 'degree';
  private currentRoot: string = 'A';
  private currentScaleKey: string = 'pentatonic-minor';
  private currentChordKey: string = 'c-major';
  private currentCagedKey: string = 'e-shape';

  private fretModeSelector: HTMLElement | null = null;
  private fretLabelSelector: HTMLElement | null = null;
  private guitarRootGroup: HTMLElement | null = null;
  private guitarRootPills: HTMLElement | null = null;
  private guitarPresetLabel: HTMLElement | null = null;
  private guitarPresetPills: HTMLElement | null = null;
  private guitarFretboardCanvas: HTMLElement | null = null;
  private guitarFretSummary: HTMLElement | null = null;
  private guitarStrumBtn: HTMLElement | null = null;

  public init(): void {
    this.fretModeSelector = document.getElementById('fretModeSelector');
    this.fretLabelSelector = document.getElementById('fretLabelSelector');
    this.guitarRootGroup = document.getElementById('guitarRootGroup');
    this.guitarRootPills = document.getElementById('guitarRootPills');
    this.guitarPresetLabel = document.getElementById('guitarPresetLabel');
    this.guitarPresetPills = document.getElementById('guitarPresetPills');
    this.guitarFretboardCanvas = document.getElementById('guitarFretboardCanvas');
    this.guitarFretSummary = document.getElementById('guitarFretSummary');
    this.guitarStrumBtn = document.getElementById('guitarStrumBtn');

    this.bindEvents();
    this.renderControls();
    this.renderFretboard();
  }

  private bindEvents(): void {
    if (this.fretModeSelector) {
      this.fretModeSelector.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.sub-pill-btn');
        if (!btn) return;
        this.fretModeSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFretMode = btn.getAttribute('data-fret-mode') || 'scales';
        this.renderControls();
        this.renderFretboard();
      });
    }

    if (this.fretLabelSelector) {
      this.fretLabelSelector.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.sub-pill-btn');
        if (!btn) return;
        this.fretLabelSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFretLabelMode = btn.getAttribute('data-fret-label') || 'degree';
        this.renderFretboard();
      });
    }

    if (this.guitarRootPills) {
      this.guitarRootPills.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.fret-pill-btn');
        if (!btn) return;
        this.guitarRootPills?.querySelectorAll('.fret-pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentRoot = btn.getAttribute('data-root') || 'A';
        this.renderFretboard();
      });
    }

    if (this.guitarStrumBtn) {
      this.guitarStrumBtn.addEventListener('click', () => this.playCurrentStrum());
    }
  }

  public renderControls(): void {
    if (!this.guitarPresetPills) return;
    this.guitarPresetPills.innerHTML = '';

    if (this.currentFretMode === 'scales') {
      if (this.guitarRootGroup) this.guitarRootGroup.hidden = false;
      if (this.guitarPresetLabel) this.guitarPresetLabel.textContent = 'SCALE:';
      Object.keys(SCALES_DATA).forEach((key) => {
        const item = SCALES_DATA[key];
        const btn = document.createElement('button');
        btn.className = `fret-pill-btn ${key === this.currentScaleKey ? 'active' : ''} brutal-press`;
        btn.textContent = item.name;
        btn.addEventListener('click', () => {
          this.currentScaleKey = key;
          this.guitarPresetPills?.querySelectorAll('.fret-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderFretboard();
        });
        this.guitarPresetPills?.appendChild(btn);
      });
    } else if (this.currentFretMode === 'chords') {
      if (this.guitarRootGroup) this.guitarRootGroup.hidden = true;
      if (this.guitarPresetLabel) this.guitarPresetLabel.textContent = 'CHORD:';
      Object.keys(CHORDS_DATA).forEach((key) => {
        const item = CHORDS_DATA[key];
        const btn = document.createElement('button');
        btn.className = `fret-pill-btn ${key === this.currentChordKey ? 'active' : ''} brutal-press`;
        btn.textContent = item.name;
        btn.addEventListener('click', () => {
          this.currentChordKey = key;
          this.guitarPresetPills?.querySelectorAll('.fret-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderFretboard();
        });
        this.guitarPresetPills?.appendChild(btn);
      });
    } else if (this.currentFretMode === 'caged') {
      if (this.guitarRootGroup) this.guitarRootGroup.hidden = true;
      if (this.guitarPresetLabel) this.guitarPresetLabel.textContent = 'SHAPE:';
      Object.keys(CAGED_DATA).forEach((key) => {
        const item = CAGED_DATA[key];
        const btn = document.createElement('button');
        btn.className = `fret-pill-btn ${key === this.currentCagedKey ? 'active' : ''} brutal-press`;
        btn.textContent = item.name;
        btn.addEventListener('click', () => {
          this.currentCagedKey = key;
          this.guitarPresetPills?.querySelectorAll('.fret-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderFretboard();
        });
        this.guitarPresetPills?.appendChild(btn);
      });
    }
  }

  public renderFretboard(): void {
    if (!this.guitarFretboardCanvas) return;

    let html = '<div class="fretboard-neck-assembly">';

    // 1. Headstock with string pegs & nut indicators
    html += '<div class="fretboard-headstock">';
    html += '<div class="headstock-brand-tag">KINS</div>';
    html += '<div class="headstock-strings-col">';
    for (let s = 5; s >= 0; s--) {
      const strIdx = 5 - s;
      let nutBadge = '◯';
      let nutClass = 'open-str';
      if (this.currentFretMode === 'chords') {
        const chord = CHORDS_DATA[this.currentChordKey];
        const strFret = chord.frets[strIdx];
        if (strFret === '✕') {
          nutBadge = '✕';
          nutClass = 'mute-str';
        } else if (strFret === 0) {
          nutBadge = '◯';
          nutClass = 'open-str';
        } else {
          nutBadge = STRING_NAMES[strIdx];
          nutClass = 'fretted-str';
        }
      } else if (this.currentFretMode === 'caged') {
        const shape = CAGED_DATA[this.currentCagedKey];
        const strFret = shape.frets[strIdx];
        if (strFret === '✕') {
          nutBadge = '✕';
          nutClass = 'mute-str';
        } else if (strFret === 0) {
          nutBadge = '◯';
          nutClass = 'open-str';
        } else {
          nutBadge = STRING_NAMES[strIdx];
          nutClass = 'fretted-str';
        }
      } else {
        nutBadge = STRING_NAMES[strIdx];
        nutClass = 'fretted-str';
      }
      html += `
        <div class="headstock-peg-slot">
          <span class="peg-octave-tag">${STRING_OCTAVES[strIdx]}</span>
          <span class="headstock-nut-indicator ${nutClass}">${nutBadge}</span>
        </div>`;
    }
    html += '</div></div>';

    // 2. Realistic 3D Bone Nut
    html += '<div class="fretboard-bone-nut"><span class="nut-bevel-top"></span><span class="nut-bevel-body"></span></div>';

    // 3. Rosewood Neck Body (Frets 0 to 12)
    html += '<div class="fretboard-neck-body">';
    html += '<div class="neck-edge-binding neck-edge-top">';
    for (let f = 0; f <= 12; f++) {
      const hasDot = [3, 5, 7, 9].includes(f);
      const is12 = f === 12;
      html += `<div class="binding-fret-slot fret-w-${f}" style="--slot-w: ${FRET_WIDTHS[f]}px;">${hasDot ? '<span class="binding-side-dot"></span>' : ''}${is12 ? '<span class="binding-side-dot-double"><i></i><i></i></span>' : ''}</div>`;
    }
    html += '</div>';

    // Frets Grid
    html += '<div class="neck-frets-grid">';
    for (let f = 0; f <= 12; f++) {
      const isSingleInlay = [3, 5, 7, 9].includes(f);
      const isDoubleInlay = f === 12;
      html += `<div class="fret-column fret-col-${f}" style="--fret-w: ${FRET_WIDTHS[f]}px;"><div class="fret-num-stamp">${f === 0 ? 'OPEN' : f}</div>`;
      for (let s = 5; s >= 0; s--) {
        const strIdx = 5 - s;
        const noteOnFret = FRET_NOTES[s][f];
        const noteFreq = getFretFreq(strIdx, f);
        let dotHtml = '';
        const isWound = strIdx >= 3;
        if (this.currentFretMode === 'scales') {
          const scale = SCALES_DATA[this.currentScaleKey];
          const rootIdx = CHROMATIC_SCALE.indexOf(this.currentRoot);
          const noteIdx = CHROMATIC_SCALE.indexOf(noteOnFret);
          const interval = (noteIdx - rootIdx + 12) % 12;
          if (scale.intervals.includes(interval)) {
            const deg = scale.degrees[interval];
            const isRoot = interval === 0;
            const displayText = this.currentFretLabelMode === 'note' ? noteOnFret : (isRoot ? 'R' : deg);
            dotHtml = `<button type="button" class="fret-note-dot ${isRoot ? 'is-root' : 'is-scale'} brutal-press" data-freq="${noteFreq.toFixed(2)}" data-str-idx="${strIdx}" title="${noteOnFret} (${deg}) — Click to pluck">${displayText}</button>`;
          }
        } else if (this.currentFretMode === 'chords') {
          const chord = CHORDS_DATA[this.currentChordKey];
          const chordFret = chord.frets[strIdx];
          const chordLabel = chord.labels[strIdx];
          if (chordFret === f && chordFret !== '✕') {
            const isRoot = chordLabel === 'R';
            const displayText = this.currentFretLabelMode === 'note' ? noteOnFret : chordLabel;
            dotHtml = `<button type="button" class="fret-note-dot ${isRoot ? 'is-root' : 'is-chord'} brutal-press" data-freq="${noteFreq.toFixed(2)}" data-str-idx="${strIdx}" title="${noteOnFret} (${chordLabel}) — Click to pluck">${displayText}</button>`;
          }
        } else if (this.currentFretMode === 'caged') {
          const shape = CAGED_DATA[this.currentCagedKey];
          const shapeFret = shape.frets[strIdx];
          const shapeLabel = shape.labels[strIdx];
          if (shapeFret === f && shapeFret !== '✕') {
            const isRoot = shapeLabel === 'R';
            const displayText = this.currentFretLabelMode === 'note' ? noteOnFret : shapeLabel;
            dotHtml = `<button type="button" class="fret-note-dot ${isRoot ? 'is-root' : 'is-chord'} brutal-press" data-freq="${noteFreq.toFixed(2)}" data-str-idx="${strIdx}" title="${noteOnFret} (${shapeLabel}) — Click to pluck">${displayText}</button>`;
          }
        }
        html += `<div class="fret-cell-slot"><span class="fret-string-wire ${isWound ? 'is-wound-string' : 'is-plain-string'}" data-str-idx="${strIdx}" style="--gauge: ${STRING_GAUGES[strIdx]}px;"></span>${dotHtml}</div>`;
      }
      if (isSingleInlay) html += '<div class="fretboard-pearl-inlay-single" aria-hidden="true"></div>';
      else if (isDoubleInlay) html += '<div class="fretboard-pearl-inlay-double" aria-hidden="true"><span></span><span></span></div>';
      if (f > 0) html += '<div class="fret-wire-crown" aria-hidden="true"></div>';
      html += '</div>';
    }
    html += '</div><div class="neck-edge-binding neck-edge-bottom"></div></div></div>';
    this.guitarFretboardCanvas.innerHTML = html;

    this.guitarFretboardCanvas.querySelectorAll('.fret-note-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const freq = parseFloat(dot.getAttribute('data-freq') || '0');
        const strIdx = parseInt(dot.getAttribute('data-str-idx') || '0', 10);
        if (freq > 0) playGuitarPluck(freq, 2.0, 0, 0.85, strIdx);
      });
    });

    if (this.guitarFretSummary) {
      if (this.currentFretMode === 'scales') {
        const s = SCALES_DATA[this.currentScaleKey];
        this.guitarFretSummary.textContent = `${this.currentRoot} ${s.name} • Formula: ${Object.values(s.degrees).join(' - ')}`;
      } else if (this.currentFretMode === 'chords') {
        const c = CHORDS_DATA[this.currentChordKey];
        this.guitarFretSummary.textContent = `${c.name} • ${c.desc}`;
      } else if (this.currentFretMode === 'caged') {
        const g = CAGED_DATA[this.currentCagedKey];
        this.guitarFretSummary.textContent = `${g.name} • ${g.desc}`;
      }
    }
  }

  public playCurrentStrum(): void {
    if (this.currentFretMode === 'chords') {
      this.playChordStrum(this.currentChordKey);
    } else if (this.currentFretMode === 'caged') {
      const shape = CAGED_DATA[this.currentCagedKey];
      let delay = 0;
      for (let s = 0; s < 6; s++) {
        const f = shape.frets[s];
        if (f !== '✕' && typeof f === 'number') {
          const freq = getFretFreq(s, f);
          playGuitarPluck(freq, 2.2, delay, 0.85, s);
          delay += 0.045;
        }
      }
    } else {
      const dots = Array.from(document.querySelectorAll('.fret-note-dot')) as HTMLElement[];
      const noteList = dots
        .map((d) => ({
          freq: parseFloat(d.getAttribute('data-freq') || '0'),
          strIdx: parseInt(d.getAttribute('data-str-idx') || '0', 10),
        }))
        .filter((n) => n.freq > 0);
      const uniqueNotes = [];
      const seen = new Set();
      noteList
        .sort((a, b) => a.freq - b.freq)
        .forEach((n) => {
          if (!seen.has(Math.round(n.freq))) {
            seen.add(Math.round(n.freq));
            uniqueNotes.push(n);
          }
        });
      uniqueNotes.slice(0, 10).forEach((n, idx) => {
        playGuitarPluck(n.freq, 1.4, idx * 0.12, 0.85, n.strIdx);
      });
    }
  }

  public playChordStrum(chordKey: string): void {
    const chord = CHORDS_DATA[chordKey];
    if (!chord) return;
    let delay = 0;
    for (let s = 0; s < 6; s++) {
      const f = chord.frets[s];
      if (f !== '✕' && f !== 'x' && typeof f === 'number') {
        const freq = getFretFreq(s, f);
        playGuitarPluck(freq, 2.2, delay, 0.85, s);
        delay += 0.045;
      }
    }
  }

  public loadScale(id: string): void {
    if (SCALES_DATA[id]) {
      this.currentFretMode = 'scales';
      this.currentScaleKey = id;
      this.fretModeSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => {
        if (b.getAttribute('data-fret-mode') === 'scales') b.classList.add('active');
        else b.classList.remove('active');
      });
      this.renderControls();
      this.renderFretboard();
      document.querySelector('[data-category-id="guitar-fretboard-hero"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public loadChord(id: string): void {
    if (CHORDS_DATA[id]) {
      this.currentFretMode = 'chords';
      this.currentChordKey = id;
      this.fretModeSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => {
        if (b.getAttribute('data-fret-mode') === 'chords') b.classList.add('active');
        else b.classList.remove('active');
      });
      this.renderControls();
      this.renderFretboard();
      document.querySelector('[data-category-id="guitar-fretboard-hero"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public loadCaged(id: string): void {
    if (CAGED_DATA[id]) {
      this.currentFretMode = 'caged';
      this.currentCagedKey = id;
      this.fretModeSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => {
        if (b.getAttribute('data-fret-mode') === 'caged') b.classList.add('active');
        else b.classList.remove('active');
      });
      this.renderControls();
      this.renderFretboard();
      document.querySelector('[data-category-id="guitar-fretboard-hero"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
