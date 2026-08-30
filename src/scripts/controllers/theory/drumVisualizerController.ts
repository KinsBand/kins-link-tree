/**
 * KINS DRUM MULTI-TIER VISUALIZER CONTROLLER
 * Tier 1: Interactive Drum Kit Pads with strike animations
 * Tier 2: Real-time 60fps Web Audio Spectrum & Waveform Scope Canvas
 * Tier 3: 16-Step LED Beat Grid Sequencer (Interactive click-to-edit)
 * Tier 4: Rudiment Sticking Trajectory Ribbon with stick height meters
 * Tier 5: Polyrhythm Orbital Dual-Phase Radar with revolving pointer
 */
import { playDrumSound, getTheoryAudioContext } from './theoryAudio';
import { getCurrentTheme } from '../themeController.js';

export const DRUM_GROOVES: Record<string, { name: string; desc: string; steps: number; grid: Record<string, number[]> }> = {
  'rock-8': {
    name: 'Standard 8th Rock',
    desc: 'Rock groove • Kick on 1 & 3, Snare on 2 & 4, Hi-Hat straight 8ths.',
    steps: 16,
    grid: {
      'Hi-Hat':  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      'Snare':   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      'Kick':    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      'Ghost SD':[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Ride':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  'funk-16': {
    name: '16th Funk Pocket',
    desc: 'Syncopated funk • Ghost notes on snare creating continuous dynamic drive.',
    steps: 16,
    grid: {
      'Hi-Hat':  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      'Snare':   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      'Kick':    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      'Ghost SD':[0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
      'Ride':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  'jazz-swing': {
    name: 'Jazz Ride Swing',
    desc: 'Swing feel ("spang-a-lang") • Feathered kick and ride cymbal chicks.',
    steps: 16,
    grid: {
      'Ride':    [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1],
      'Snare':   [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      'Hi-Hat':  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      'Kick':    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      'Ghost SD':[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  'purdie-shuffle': {
    name: 'Half-Time Purdie Shuffle',
    desc: 'Bernard Purdie shuffle • Triplets with backbeat on 3 and ghost rolls.',
    steps: 12,
    grid: {
      'Hi-Hat':  [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      'Snare':   [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      'Ghost SD':[0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      'Kick':    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      'Ride':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  'bossa-nova': {
    name: 'Bossa Nova / Latin',
    desc: 'Latin groove • Cross-stick syncopation over steady bass pulse.',
    steps: 16,
    grid: {
      'Hi-Hat':  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      'Snare':   [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      'Kick':    [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      'Ghost SD':[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Ride':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
};

export const DRUM_RUDIMENTS_FLOW: Record<string, { name: string; sticking: string[]; accents: number[] }> = {
  'single-stroke': { name: 'Single Stroke Roll', sticking: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'], accents: [1, 0, 0, 0, 1, 0, 0, 0] },
  'double-stroke': { name: 'Double Stroke Roll', sticking: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'], accents: [1, 0, 1, 0, 1, 0, 1, 0] },
  'paradiddle': { name: 'Single Paradiddle', sticking: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'], accents: [1, 0, 0, 0, 1, 0, 0, 0] },
  'double-paradiddle': { name: 'Double Paradiddle', sticking: ['R', 'L', 'R', 'L', 'R', 'R', 'L', 'R', 'L', 'R', 'L', 'L'], accents: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0] },
  'flam': { name: 'Flam Tap', sticking: ['lR', 'R', 'rL', 'L', 'lR', 'R', 'rL', 'L'], accents: [1, 0, 1, 0, 1, 0, 1, 0] },
  'drag': { name: 'Single Drag Tap', sticking: ['llR', 'L', 'rrL', 'R', 'llR', 'L', 'rrL', 'R'], accents: [1, 0, 1, 0, 1, 0, 1, 0] },
  'paradiddle-diddle': { name: 'Paradiddle-Diddle', sticking: ['R', 'L', 'R', 'R', 'L', 'L'], accents: [1, 0, 0, 0, 0, 0] },
};

export class DrumVisualizerController {
  private currentDrumMode: string = 'grid';
  private currentDrumGrooveKey: string = 'rock-8';
  private currentRudimentKey: string = 'paradiddle';
  private currentPolyMode: string = '3-2';
  private drumBpm: number = 110;
  private isDrumPlaying: boolean = false;
  private currentStepIdx: number = 0;
  private drumIntervalId: number | null = null;
  private scopeAnimFrameId: number | null = null;

  private drumModeSelector: HTMLElement | null = null;
  private drumPresetLabel: HTMLElement | null = null;
  private drumPresetPills: HTMLElement | null = null;
  private drumVisualCanvas: HTMLElement | null = null;
  private drumSummaryText: HTMLElement | null = null;
  private drumPlayToggleBtn: HTMLElement | null = null;
  private drumPlayIcon: HTMLElement | null = null;
  private drumPlayText: HTMLElement | null = null;
  private drumBpmDisplay: HTMLElement | null = null;
  private drumBpmMinus: HTMLElement | null = null;
  private drumBpmPlus: HTMLElement | null = null;

  public init(): void {
    this.drumModeSelector = document.getElementById('drumModeSelector');
    this.drumPresetLabel = document.getElementById('drumPresetLabel');
    this.drumPresetPills = document.getElementById('drumPresetPills');
    this.drumVisualCanvas = document.getElementById('drumVisualCanvas');
    this.drumSummaryText = document.getElementById('drumSummaryText');
    this.drumPlayToggleBtn = document.getElementById('drumPlayToggleBtn');
    this.drumPlayIcon = document.getElementById('drumPlayIcon');
    this.drumPlayText = document.getElementById('drumPlayText');
    this.drumBpmDisplay = document.getElementById('drumBpmDisplay');
    this.drumBpmMinus = document.getElementById('drumBpmMinus');
    this.drumBpmPlus = document.getElementById('drumBpmPlus');

    this.bindEvents();
    this.renderControls();
    this.renderVisual();
    this.initScope();
  }

  private bindEvents(): void {
    if (this.drumModeSelector) {
      this.drumModeSelector.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.sub-pill-btn');
        if (!btn) return;
        this.stopPlayback();
        this.drumModeSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDrumMode = btn.getAttribute('data-drum-mode') || 'grid';
        this.renderControls();
        this.renderVisual();
      });
    }

    if (this.drumBpmMinus) this.drumBpmMinus.addEventListener('click', () => this.updateBpm(-5));
    if (this.drumBpmPlus) this.drumBpmPlus.addEventListener('click', () => this.updateBpm(5));

    if (this.drumPlayToggleBtn) {
      this.drumPlayToggleBtn.addEventListener('click', () => {
        if (this.isDrumPlaying) this.stopPlayback();
        else this.startPlayback();
      });
    }

    document.querySelectorAll('.drum-pad-piece').forEach((pad) => {
      pad.addEventListener('click', () => {
        const piece = pad.getAttribute('data-drum-piece');
        if (piece) playDrumSound(piece);
      });
    });
  }

  public updateBpm(delta: number): void {
    this.drumBpm = Math.max(50, Math.min(220, this.drumBpm + delta));
    if (this.drumBpmDisplay) this.drumBpmDisplay.textContent = `${this.drumBpm} BPM`;
    if (this.isDrumPlaying) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  public renderControls(): void {
    if (!this.drumPresetPills) return;
    this.drumPresetPills.innerHTML = '';

    if (this.currentDrumMode === 'grid') {
      if (this.drumPresetLabel) this.drumPresetLabel.textContent = 'GROOVE STYLE:';
      Object.keys(DRUM_GROOVES).forEach((key) => {
        const item = DRUM_GROOVES[key];
        const btn = document.createElement('button');
        btn.className = `fret-pill-btn ${key === this.currentDrumGrooveKey ? 'active' : ''} brutal-press`;
        btn.textContent = item.name;
        btn.addEventListener('click', () => {
          this.stopPlayback();
          this.currentDrumGrooveKey = key;
          this.drumPresetPills?.querySelectorAll('.fret-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderVisual();
        });
        this.drumPresetPills?.appendChild(btn);
      });
    } else if (this.currentDrumMode === 'sticking') {
      if (this.drumPresetLabel) this.drumPresetLabel.textContent = 'RUDIMENT:';
      Object.keys(DRUM_RUDIMENTS_FLOW).forEach((key) => {
        const item = DRUM_RUDIMENTS_FLOW[key];
        const btn = document.createElement('button');
        btn.className = `fret-pill-btn ${key === this.currentRudimentKey ? 'active' : ''} brutal-press`;
        btn.textContent = item.name;
        btn.addEventListener('click', () => {
          this.stopPlayback();
          this.currentRudimentKey = key;
          this.drumPresetPills?.querySelectorAll('.fret-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderVisual();
        });
        this.drumPresetPills?.appendChild(btn);
      });
    } else if (this.currentDrumMode === 'polyrhythm') {
      if (this.drumPresetLabel) this.drumPresetLabel.textContent = 'RADAR RATIO:';
      [
        { id: '3-2', name: '3 against 2 (3:2)' },
        { id: '4-3', name: '4 against 3 (4:3)' },
      ].forEach((item) => {
        const btn = document.createElement('button');
        btn.className = `fret-pill-btn ${item.id === this.currentPolyMode ? 'active' : ''} brutal-press`;
        btn.textContent = item.name;
        btn.addEventListener('click', () => {
          this.stopPlayback();
          this.currentPolyMode = item.id;
          this.drumPresetPills?.querySelectorAll('.fret-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderVisual();
        });
        this.drumPresetPills?.appendChild(btn);
      });
    }
  }

  public renderVisual(): void {
    if (!this.drumVisualCanvas) return;

    if (this.currentDrumMode === 'grid') {
      const groove = DRUM_GROOVES[this.currentDrumGrooveKey];
      const stepCount = groove.steps;
      let html = '<div class="drum-grid-matrix-container">';

      html += '<div class="drum-matrix-row drum-matrix-header">';
      html += '<div class="drum-voice-label-col">VOICE</div>';
      for (let i = 0; i < stepCount; i++) {
        const beatNum = Math.floor(i / 4) + 1;
        const sub = ['1', 'e', '&', 'a'][i % 4];
        const isDownbeat = i % 4 === 0;
        html += `<div class="drum-step-cell header-cell ${isDownbeat ? 'is-downbeat' : ''}" data-step-col="${i}">
          <span class="step-num-top">${i + 1}</span>
          <span class="step-sub-name">${isDownbeat ? `<strong>${beatNum}</strong>` : sub}</span>
        </div>`;
      }
      html += '</div>';

      Object.keys(groove.grid).forEach((voice) => {
        const rowHits = groove.grid[voice];
        const voiceLower = voice.toLowerCase().includes('kick')
          ? 'kick'
          : voice.toLowerCase().includes('hi-hat')
          ? 'hihat'
          : voice.toLowerCase().includes('ride')
          ? 'ride'
          : voice.toLowerCase().includes('ghost')
          ? 'ghost'
          : 'snare';

        html += `<div class="drum-matrix-row" data-voice-name="${voice}">`;
        html += `<div class="drum-voice-label-col">
          <span class="voice-dot voice-${voiceLower}"></span>
          <strong>${voice}</strong>
        </div>`;

        for (let i = 0; i < stepCount; i++) {
          const hitVal = rowHits[i];
          const isHit = hitVal === 1;
          const isGhost = hitVal === 2 || (hitVal === 1 && voice.includes('Ghost'));
          const isDownbeat = i % 4 === 0;

          html += `
            <div
              class="drum-step-cell ${isDownbeat ? 'is-downbeat' : ''} ${isHit ? 'has-hit' : ''} ${isGhost ? 'has-ghost' : ''}"
              data-step-col="${i}"
              data-voice="${voice}"
              data-step-idx="${i}"
              role="button"
              tabindex="0"
              title="Step ${i + 1} (${voice}) — Click to toggle hit"
            >
              <span class="drum-hit-block ${isHit ? 'is-active' : ''} ${isGhost ? 'is-ghost' : ''}"></span>
            </div>`;
        }
        html += '</div>';
      });

      html += '</div>';
      this.drumVisualCanvas.innerHTML = html;
      if (this.drumSummaryText) this.drumSummaryText.textContent = `${groove.name} • ${groove.desc}`;

      this.drumVisualCanvas.querySelectorAll('.drum-step-cell[data-voice]').forEach((cell) => {
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          const voice = cell.getAttribute('data-voice');
          const stepIdx = parseInt(cell.getAttribute('data-step-idx') || '0', 10);
          if (!voice || !groove.grid[voice]) return;

          const currentVal = groove.grid[voice][stepIdx];
          let nextVal = 0;
          if (currentVal === 0) nextVal = 1;
          else if (currentVal === 1 && (voice === 'Snare' || voice === 'Ghost SD')) nextVal = 2;
          else nextVal = 0;

          groove.grid[voice][stepIdx] = nextVal;

          if (nextVal > 0) {
            const pieceType = voice.includes('Kick')
              ? 'kick'
              : voice.includes('Hi-Hat')
              ? 'hihat'
              : voice.includes('Ride')
              ? 'ride'
              : nextVal === 2 || voice.includes('Ghost')
              ? 'ghost'
              : 'snare';
            playDrumSound(pieceType);
          }

          this.renderVisual();
        });
      });
    } else if (this.currentDrumMode === 'sticking') {
      const r = DRUM_RUDIMENTS_FLOW[this.currentRudimentKey] || DRUM_RUDIMENTS_FLOW['paradiddle'];
      let html = `
        <div class="sticking-flow-container">
          <div class="sticking-meta-card">
            <span class="sticking-legend-badge badge-right">R = Right Hand (Downbeat)</span>
            <span class="sticking-legend-badge badge-left">L = Left Hand</span>
            <span class="sticking-legend-badge badge-accent">▼ = Accented Whip (10" height)</span>
          </div>
          <div class="sticking-flow-ribbon">`;

      r.sticking.forEach((hand, i) => {
        const isAccent = r.accents[i] === 1;
        const isRight = hand.includes('R');
        html += `
          <div class="sticking-note-card ${isAccent ? 'is-accented-card' : ''}" data-sticking-idx="${i}">
            <div class="sticking-accent-slot">${isAccent ? '<span class="stick-accent-glyph">▼</span>' : ''}</div>
            <div class="stick-trajectory-bar ${isAccent ? 'bar-accent' : 'bar-normal'}">
              <span class="stick-height-label">${isAccent ? '10"' : '3"'}</span>
            </div>
            <div class="sticking-badge ${isRight ? 'is-right' : 'is-left'}">${hand}</div>
            <span class="sticking-step-count">${i + 1}</span>
          </div>`;
      });
      html += '</div></div>';
      this.drumVisualCanvas.innerHTML = html;
      if (this.drumSummaryText) this.drumSummaryText.textContent = `${r.name} • Visual sticking alternation, dynamic stroke heights & accent whips.`;
    } else if (this.currentDrumMode === 'polyrhythm') {
      const p1 = this.currentPolyMode === '3-2' ? 3 : 4;
      const p2 = this.currentPolyMode === '3-2' ? 2 : 3;

      let html = `
        <div class="polyrhythm-radar-container">
          <div class="poly-radar-stage">
            <div class="radar-orbital-rings">
              <div class="radar-orbital-ring outer-orbit" style="--ring-nodes: ${p1};">
                <span class="orbit-badge">Pulse A (${p1} Beats)</span>
                ${Array.from({ length: p1 }, (_, i) => `<span class="orbit-node node-outer" style="--node-idx: ${i}; --total-nodes: ${p1};">${i + 1}</span>`).join('')}
              </div>
              <div class="radar-orbital-ring inner-orbit" style="--ring-nodes: ${p2};">
                <span class="orbit-badge">Pulse B (${p2} Beats)</span>
                ${Array.from({ length: p2 }, (_, i) => `<span class="orbit-node node-inner" style="--node-idx: ${i}; --total-nodes: ${p2};">${i + 1}</span>`).join('')}
              </div>
              <div class="radar-center-hub">
                <i class="fa-solid fa-crosshairs" aria-hidden="true"></i>
              </div>
            </div>
          </div>
          <div class="poly-interlock-timeline">
            <div class="poly-pulse-row">
              <span class="poly-voice-name">Outer (${p1} Hits):</span>
              <div class="poly-ticks-bar">
                ${Array.from({ length: p1 * 4 }, (_, i) => `<span class="poly-tick ${i % 4 === 0 ? 'is-pulse-a' : ''}"></span>`).join('')}
              </div>
            </div>
            <div class="poly-pulse-row">
              <span class="poly-voice-name">Inner (${p2} Hits):</span>
              <div class="poly-ticks-bar">
                ${Array.from({ length: p1 * 4 }, (_, i) => `<span class="poly-tick ${i % ((p1 * 4) / p2) === 0 ? 'is-pulse-b' : ''}"></span>`).join('')}
              </div>
            </div>
          </div>
          <div class="poly-mnemonic-footer">
            Mnemonic: <strong>"${this.currentPolyMode === '3-2' ? 'NOT DIF-FI-CULT' : 'PASS THE GOL-DEN BUT-TER'}"</strong> • Dual orbital phase synchronization.
          </div>
        </div>`;
      this.drumVisualCanvas.innerHTML = html;
      if (this.drumSummaryText) this.drumSummaryText.textContent = `${p1}:${p2} Polyrhythm • Dual-phase orbital radar with mathematical cross-pulse intersection.`;
    }
  }

  public initScope(): void {
    const canvas = document.getElementById('drumAudioScope') as HTMLCanvasElement | null;
    const statusBadge = document.getElementById('drumScopeStatus');
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const bufferLength = 32;
    const dataArray = new Uint8Array(bufferLength);
    let isScopeLive = false;

    const render = () => {
      this.scopeAnimFrameId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx2d.clearRect(0, 0, width, height);

      try {
        const { ctx, analyser } = getTheoryAudioContext();
        if (ctx && ctx.state === 'running' && analyser) {
          analyser.getByteFrequencyData(dataArray);
        } else {
          for (let i = 0; i < bufferLength; i++) dataArray[i] = 0;
        }
      } catch {
        for (let i = 0; i < bufferLength; i++) dataArray[i] = 0;
      }

      ctx2d.fillStyle = 'rgba(18, 18, 24, 0.95)';
      ctx2d.fillRect(0, 0, width, height);

      ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      ctx2d.moveTo(0, height / 2);
      ctx2d.lineTo(width, height / 2);
      ctx2d.stroke();

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength;

      if (avg > 8 && !isScopeLive) {
        isScopeLive = true;
        if (statusBadge) {
          statusBadge.textContent = 'LIVE ACTIVE';
          statusBadge.classList.add('is-live');
        }
      } else if (avg <= 8 && isScopeLive) {
        isScopeLive = false;
        if (statusBadge) {
          statusBadge.textContent = 'READY';
          statusBadge.classList.remove('is-live');
        }
      }

      const barWidth = (width / bufferLength) * 0.85;
      const barGap = (width / bufferLength) * 0.15;
      let x = barGap / 2;

      const isDarkTheme = getCurrentTheme() === 'dark';
      const primaryColor = isDarkTheme ? '#d4af37' : '#f2fd43';
      const secondaryColor = '#2ec4b6';
      const highColor = '#53fc18';

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        const barHeight = Math.max(3, (val / 255) * (height - 8));

        let barGrad = ctx2d.createLinearGradient(0, height, 0, height - barHeight);
        if (i < 10) {
          barGrad.addColorStop(0, primaryColor);
          barGrad.addColorStop(1, '#ff9f1c');
        } else if (i < 22) {
          barGrad.addColorStop(0, secondaryColor);
          barGrad.addColorStop(1, primaryColor);
        } else {
          barGrad.addColorStop(0, highColor);
          barGrad.addColorStop(1, secondaryColor);
        }

        ctx2d.fillStyle = barGrad;
        ctx2d.fillRect(x, height - barHeight - 2, barWidth, barHeight);

        if (val > 20) {
          ctx2d.fillStyle = '#ffffff';
          ctx2d.fillRect(x, height - barHeight - 4, barWidth, 2);
        }

        x += barWidth + barGap;
      }

      if (avg < 5) {
        ctx2d.strokeStyle = isDarkTheme ? 'rgba(212, 175, 55, 0.25)' : 'rgba(242, 253, 67, 0.25)';
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        const t = performance.now() * 0.003;
        for (let px = 0; px < width; px += 4) {
          const py = height / 2 + Math.sin(px * 0.04 + t) * 4 * Math.sin(t * 0.5);
          if (px === 0) ctx2d.moveTo(px, py);
          else ctx2d.lineTo(px, py);
        }
        ctx2d.stroke();
      }
    };

    render();
  }

  public startPlayback(): void {
    if (this.isDrumPlaying) return;
    this.isDrumPlaying = true;
    this.currentStepIdx = 0;
    if (this.drumPlayIcon) this.drumPlayIcon.className = 'fa-solid fa-stop';
    if (this.drumPlayText) this.drumPlayText.textContent = 'STOP';

    const groove = DRUM_GROOVES[this.currentDrumGrooveKey];
    const stepCount =
      this.currentDrumMode === 'grid'
        ? groove.steps
        : this.currentDrumMode === 'sticking'
        ? (DRUM_RUDIMENTS_FLOW[this.currentRudimentKey] || DRUM_RUDIMENTS_FLOW['paradiddle']).sticking.length
        : 12;
    const stepTimeMs = (60 / this.drumBpm / (stepCount === 12 ? 3 : 4)) * 1000;

    const stepTick = () => {
      if (!this.isDrumPlaying) return;

      if (this.currentDrumMode === 'grid') {
        document.querySelectorAll('.drum-step-cell.is-playing').forEach((c) => c.classList.remove('is-playing'));
        document.querySelectorAll(`.drum-step-cell[data-step-col="${this.currentStepIdx}"]`).forEach((c) => c.classList.add('is-playing'));

        Object.keys(groove.grid).forEach((voice) => {
          const hits = groove.grid[voice];
          const hitVal = hits[this.currentStepIdx];
          if (hitVal > 0) {
            const pieceType = voice.includes('Kick')
              ? 'kick'
              : voice.includes('Hi-Hat')
              ? 'hihat'
              : voice.includes('Ride')
              ? 'ride'
              : hitVal === 2 || voice.includes('Ghost')
              ? 'ghost'
              : 'snare';
            playDrumSound(pieceType);
          }
        });
      } else if (this.currentDrumMode === 'sticking') {
        const r = DRUM_RUDIMENTS_FLOW[this.currentRudimentKey] || DRUM_RUDIMENTS_FLOW['paradiddle'];
        document.querySelectorAll('.sticking-note-card.is-playing').forEach((c) => c.classList.remove('is-playing'));
        const currentCard = document.querySelector(`.sticking-note-card[data-sticking-idx="${this.currentStepIdx}"]`);
        if (currentCard) currentCard.classList.add('is-playing');

        const isAccent = r.accents[this.currentStepIdx] === 1;
        playDrumSound(isAccent ? 'snare' : 'ghost');
      } else if (this.currentDrumMode === 'polyrhythm') {
        const p2 = this.currentPolyMode === '3-2' ? 2 : 3;
        const isP1Hit = this.currentStepIdx % 4 === 0;
        const isP2Hit = this.currentStepIdx % (12 / p2) === 0;

        if (isP1Hit && isP2Hit) {
          playDrumSound('snare');
          playDrumSound('kick');
        } else if (isP1Hit) {
          playDrumSound('snare');
        } else if (isP2Hit) {
          playDrumSound('hihat');
        }
      }

      this.currentStepIdx = (this.currentStepIdx + 1) % stepCount;
    };

    stepTick();
    this.drumIntervalId = window.setInterval(stepTick, stepTimeMs);
  }

  public stopPlayback(): void {
    if (!this.isDrumPlaying) return;
    this.isDrumPlaying = false;
    if (this.drumIntervalId !== null) {
      clearInterval(this.drumIntervalId);
      this.drumIntervalId = null;
    }
    document.querySelectorAll('.drum-step-cell.is-playing, .sticking-note-card.is-playing').forEach((c) => c.classList.remove('is-playing'));
    if (this.drumPlayIcon) this.drumPlayIcon.className = 'fa-solid fa-play';
    if (this.drumPlayText) this.drumPlayText.textContent = 'PLAY';
  }

  public loadGroove(id: string): void {
    if (DRUM_GROOVES[id]) {
      this.currentDrumMode = 'grid';
      this.currentDrumGrooveKey = id;
      this.drumModeSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => {
        if (b.getAttribute('data-drum-mode') === 'grid') b.classList.add('active');
        else b.classList.remove('active');
      });
      this.renderControls();
      this.renderVisual();
      document.querySelector('[data-category-id="drum-grid-hero"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public loadRudiment(id: string): void {
    if (DRUM_RUDIMENTS_FLOW[id]) {
      this.currentDrumMode = 'sticking';
      this.currentRudimentKey = id;
      this.drumModeSelector?.querySelectorAll('.sub-pill-btn').forEach((b) => {
        if (b.getAttribute('data-drum-mode') === 'sticking') b.classList.add('active');
        else b.classList.remove('active');
      });
      this.renderControls();
      this.renderVisual();
      document.querySelector('[data-category-id="drum-grid-hero"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public teardown(): void {
    this.stopPlayback();
    if (this.scopeAnimFrameId !== null) {
      cancelAnimationFrame(this.scopeAnimFrameId);
      this.scopeAnimFrameId = null;
    }
  }
}
