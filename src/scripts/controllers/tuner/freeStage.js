import { noteToFreq } from '../../../settings/tuner.config.ts';
import { noteLetter } from './notesUtil.js';

const HISTORY_MS = 4000;
const RANGE_CENTS = 50;   // dial and trace span ±50 ct
const SWEEP_DEG = 60;     // ±50 ct maps to ±60° on the dial
const HUB = { x: 120, y: 130 }, RADIUS = 100;

function arcPoint(deg, r) {
  const a = deg * Math.PI / 180;
  return [HUB.x + r * Math.sin(a), HUB.y - r * Math.cos(a)];
}

function ordinal(n) {
  const suffix = n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
  return n + suffix;
}

/** Free (chromatic) mode stage: arc dial, 4 s pitch trace, nearest string.
 * Renders only transform/opacity/text changes plus one canvas redraw per
 * reading; decorative (aria-hidden) — announcements go through the status
 * line. */
export function createFreeStage() {
  const root = document.getElementById('tunerFreeStage');
  if (!root) return null;
  const dial = document.getElementById('tunerFreeDial');
  const needle = document.getElementById('tunerFreeNeedle');
  const zone = document.getElementById('tunerFreeZone');
  const note = document.getElementById('tunerFreeNote');
  const octave = document.getElementById('tunerFreeOctave');
  const centsEl = document.getElementById('tunerFreeCents');
  const hz = document.getElementById('tunerFreeHz');
  const nearest = document.getElementById('tunerFreeString');
  const canvas = document.getElementById('tunerFreeTrace');
  const ctx = canvas?.getContext('2d') || null;
  const history = [];
  let colors = null, colorsKey = '';
  let width = 0, height = 0, dpr = 1;
  let lastText = new Map();
  let layoutTolerance = 3;

  function text(el, value) {
    if (!el || lastText.get(el) === value) return;
    lastText.set(el, value);
    el.textContent = value;
  }

  function palette() {
    const key = document.documentElement.getAttribute('data-theme') || '';
    if (colors && key === colorsKey) return colors;
    const css = getComputedStyle(root);
    const read = (name) => css.getPropertyValue(name).trim();
    colors = { line: read('--tuner-free-needle'), grid: read('--tuner-free-tick'), band: read('--tuner-target-zone-fill'), inTune: read('--tuner-target-zone-border') };
    colorsKey = key;
    return colors;
  }

  function resize() {
    if (!canvas || root.hidden) return;
    dpr = Math.min(3, window.devicePixelRatio || 1);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    draw(history.length ? history[history.length - 1].t : 0);
  }

  function layout(tolerance) {
    if (!zone) return;
    const deg = Math.min(RANGE_CENTS, tolerance) / RANGE_CENTS * SWEEP_DEG;
    const [x1, y1] = arcPoint(-deg, RADIUS), [x2, y2] = arcPoint(deg, RADIUS);
    zone.setAttribute('d', `M${x1.toFixed(2)},${y1.toFixed(2)} A${RADIUS},${RADIUS} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}`);
    layoutTolerance = tolerance;
    resize();
  }

  function draw(now) {
    if (!ctx || !width || !height) return;
    const c = palette();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const mid = height / 2, scale = (height / 2 - 6) / RANGE_CENTS;
    ctx.fillStyle = c.band;
    const band = Math.max(1, layoutTolerance * scale);
    ctx.fillRect(0, mid - band, width, band * 2);
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(width, mid); ctx.stroke();
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let pen = false;
    for (const point of history) {
      const x = width - (now - point.t) / HISTORY_MS * width;
      if (point.cents === null || x < 0) { pen = false; continue; }
      const y = mid - Math.max(-RANGE_CENTS, Math.min(RANGE_CENTS, point.cents)) * scale;
      if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      pen = true;
    }
    ctx.stroke();
  }

  function record(now, cents) {
    history.push({ t: now, cents });
    while (history.length && now - history[0].t > HISTORY_MS) history.shift();
    draw(now);
  }

  function setNeedle(cents) {
    const clamped = Math.max(-RANGE_CENTS, Math.min(RANGE_CENTS, cents));
    needle.style.transform = `rotate(${(clamped / RANGE_CENTS * SWEEP_DEG).toFixed(2)}deg)`;
  }

  function nearestString(freq, preset, a4) {
    if (!preset?.strings?.length) return 'Nearest string —';
    let best = null;
    preset.strings.forEach((string, index) => {
      if (!Number.isFinite(string.midi)) return;
      const cents = 1200 * Math.log2(freq / noteToFreq(string.midi, a4));
      if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { cents, index, string };
    });
    if (!best || Math.abs(best.cents) > 150) return 'Nearest string —';
    const number = preset.strings.length - best.index;
    const offset = Math.round(best.cents);
    return `${noteLetter(best.string.note)} · ${ordinal(number)} string ${offset > 0 ? '+' : ''}${offset} ct`;
  }

  return {
    show(visible) {
      root.hidden = !visible;
      if (visible) resize();
    },
    layout,
    resize,
    update(reading, now, { preset, a4 }) {
      dial.dataset.state = reading.inRange ? 'in-tune' : 'locked';
      setNeedle(reading.cents);
      text(note, reading.detectedNote);
      text(octave, String(reading.detectedOctave));
      const rounded = Math.abs(reading.cents) < 0.05 ? 0 : reading.cents;
      text(centsEl, reading.inRange ? 'In tune' : `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)} ct ${rounded < 0 ? 'flat' : 'sharp'}`);
      text(hz, reading.freq.toFixed(2) + ' Hz');
      text(nearest, nearestString(reading.freq, preset, a4));
      record(now, reading.cents);
    },
    hold(now) {
      if (dial.dataset.state !== 'idle') dial.dataset.state = 'held';
      record(now, null);
    },
    idle(now, message = 'Play one note') {
      dial.dataset.state = 'idle';
      setNeedle(0);
      text(note, '--'); text(octave, ''); text(centsEl, message);
      text(hz, '-- Hz'); text(nearest, 'Nearest string —');
      if (now !== undefined) record(now, null);
    },
    reset() {
      history.length = 0;
      this.idle();
      draw(0);
    }
  };
}
