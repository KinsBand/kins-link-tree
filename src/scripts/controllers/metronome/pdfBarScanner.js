/* Canvas score scanner — detects staff systems + barlines on any rendered
   score canvas (pdf.js page, OSMD output, alphaTab output) and crops
   per-bar regions. Pure pixel heuristics, no DOM queries. */

const DARK_LUMA = 140;
const MIN_ALPHA = 40;

function buildDarkMask(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const i = (row + x) * 4;
      if (img[i + 3] < MIN_ALPHA) continue;
      const lum = 0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2];
      if (lum < DARK_LUMA) mask[row + x] = 1;
    }
  }
  return mask;
}

function findStaffLines(mask, w, h) {
  const centers = [];
  const threshold = Math.max(40, Math.floor(w * 0.3));
  let runStart = -1;
  for (let y = 0; y < h; y++) {
    let count = 0;
    const row = y * w;
    for (let x = 0; x < w; x += 2) if (mask[row + x]) count++;
    const dense = count * 2 >= threshold;
    if (dense && runStart === -1) runStart = y;
    else if (!dense && runStart !== -1) {
      centers.push((runStart + y - 1) / 2);
      runStart = -1;
    }
  }
  if (runStart !== -1) centers.push((runStart + h - 1) / 2);
  return centers;
}

function groupSystems(lineCenters) {
  if (lineCenters.length < 2) return [];
  const gaps = [];
  for (let i = 1; i < lineCenters.length; i++) gaps.push(lineCenters[i] - lineCenters[i - 1]);
  const sorted = gaps.slice().sort((a, b) => a - b);
  const medianGap = sorted[Math.floor(sorted.length / 2)] || 12;
  const staffGapLimit = medianGap * 3;
  const systems = [];
  let group = [lineCenters[0]];
  for (let i = 1; i < lineCenters.length; i++) {
    const gap = lineCenters[i] - lineCenters[i - 1];
    if (gap <= staffGapLimit && group.length < 6) {
      group.push(lineCenters[i]);
    } else {
      if (group.length >= 3) systems.push(group);
      group = [lineCenters[i]];
    }
  }
  if (group.length >= 3) systems.push(group);
  return systems.map((lines) => ({
    top: lines[0],
    bottom: lines[lines.length - 1]
  }));
}

function findBarlines(mask, w, band, minRunRatio) {
  const y0 = Math.max(0, Math.floor(band.top));
  const y1 = Math.min(w ? mask.length / w - 1 : 0, Math.ceil(band.bottom));
  const inner = y1 - y0;
  if (inner < 8) return [];
  const need = Math.floor(inner * minRunRatio);
  const cols = [];
  for (let x = 0; x < w; x++) {
    let run = 0;
    let maxRun = 0;
    for (let y = y0; y <= y1; y++) {
      if (mask[y * w + x]) {
        run++;
        if (run > maxRun) maxRun = run;
      } else {
        run = 0;
      }
    }
    cols.push(maxRun >= need ? 1 : 0);
  }
  const clusters = [];
  let start = -1;
  for (let x = 0; x < w; x++) {
    if (cols[x] && start === -1) start = x;
    else if (!cols[x] && start !== -1) {
      clusters.push((start + x - 1) / 2);
      start = -1;
    }
  }
  if (start !== -1) clusters.push((start + w - 1) / 2);
  const merged = [];
  for (const c of clusters) {
    if (merged.length && c - merged[merged.length - 1] < 14) merged[merged.length - 1] = (merged[merged.length - 1] + c) / 2;
    else merged.push(c);
  }
  return merged;
}

function spansFromBoundaries(boundaries, w, minBarWidth) {
  const edges = [0, ...boundaries.filter((b) => b > 4 && b < w - 4), w];
  const spans = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const x0 = edges[i];
    const x1 = edges[i + 1];
    if (x1 - x0 < minBarWidth) {
      if (spans.length) spans[spans.length - 1].x1 = x1;
      continue;
    }
    spans.push({ x0: Math.round(x0), x1: Math.round(x1) });
  }
  return spans;
}

export function scanScoreCanvas(canvas, opts = {}) {
  const minBarWidth = opts.minBarWidth || 20;
  const minRunRatio = opts.minRunRatio || 0.78;
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return { systems: [] };
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const mask = buildDarkMask(ctx, w, h);
  const lines = findStaffLines(mask, w, h);
  const bands = groupSystems(lines);
  if (!bands.length) return { systems: [] };
  const pad = Math.max(14, (bands[0].bottom - bands[0].top) * 0.9);
  const systems = bands.map((band) => {
    const y0 = Math.max(0, Math.round(band.top - pad));
    const y1 = Math.min(h, Math.round(band.bottom + pad));
    const barlines = findBarlines(mask, w, band, minRunRatio);
    const bars = spansFromBoundaries(barlines, w, minBarWidth);
    return { y0, y1, bars };
  });
  return { systems };
}

export function cropRegion(canvas, x0, y0, x1, y1) {
  const cw = Math.max(1, x1 - x0);
  const ch = Math.max(1, y1 - y0);
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  return out;
}

export function countBars(scan) {
  return scan.systems.reduce((acc, s) => acc + s.bars.length, 0);
}
