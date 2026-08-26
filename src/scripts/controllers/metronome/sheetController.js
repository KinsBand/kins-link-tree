import { METRO_SHEET_CONFIG } from '../../../settings/metronome.config';
import {
  metroState,
  setSheetForSong,
  getSheetForSong,
  setSheetFollow,
  setSheetLoop,
  setSheetSync,
  getTimeSignature
} from './metroState.js';
import {
  getSheetFile,
  deleteSheetFile
} from './sheetStore.js';
import { scanScoreCanvas, cropRegion, countBars } from './pdfBarScanner.js';

const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs';
const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs';
const ALPHATAB_URL = 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.4/dist/alphaTab.js';
const OSMD_URL = 'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.9/build/opensheetmusicdisplay.min.js';

const SIG_PRESETS = [
  [4, 4], [3, 4], [2, 4], [6, 8], [7, 8], [5, 4], [9, 8], [12, 8]
];

const COPY = {
  noSong: 'SELECT A SETLIST SONG',
  emptyTitle: 'NO SHEET FOR THIS SONG',
  emptySub: 'Sheets live on this device only — none saved for this song yet.',
  rendering: 'RENDERING…',
  scanning: 'SCANNING BARS…',
  failed: 'COULD NOT RENDER THIS FILE',
  renderFail: 'Could not render that file — is it a valid sheet?',
  omrRunning: 'OMR RECOGNIZING…',
  omrHint: 'Full PDF note recognition: run the OMR bridge (tools/omr-server) — using barline scan for now',
  omrDone: (n) => `OMR complete — ${n} bars recognized`,
  nothingToClear: 'No song loaded — nothing to clear',
  nothingCleared: 'No sheet for this song',
  cleared: 'Sheet cleared for this song',
  syncOn: 'Score sync on — time signature follows the sheet',
  syncOff: 'Score sync off',
  syncNoBars: 'No barlines detected in this sheet — sync unavailable',
  followOn: 'Follow on — sheet scrolls with the click',
  followOff: 'Follow off',
  loopOn: 'Loop on',
  loopOff: 'Loop off',
  sigSetTo: (bar, n, d) => `Bar ${bar}+ set to ${n}/${d}`,
  sigPromptBeats: 'Beats per bar (1-32):',
  sigPromptUnit: 'Note value (2, 4, 8, 16, 32):',
  sigInvalid: 'Invalid time signature'
};

let els = null;
let ui = null;
let callbacks = {};
let currentEntry = null;
let currentSongKey = '';
let renderGen = 0;
let objectUrls = [];
let lastObjectUrl = null;
let followRaf = null;
let scrollPxPerBeat = 26;
let stripRevealed = false;
let pdfLibPromise = null;
let alphaTabLoaded = false;
let osmdLoaded = false;

let timeline = [];
let barCursor = -1;
let autoSigs = [];
let sigSections = [];
let sigPopover = null;
let omrBridgeOk = null;
let omrHintShown = false;

const OMR_BASE = String(METRO_SHEET_CONFIG.omrBridgeUrl || 'http://localhost:8787').replace(/\/+$/, '');

function extOf(name) {
  const lower = String(name || '').toLowerCase();
  const dot = lower.lastIndexOf('.');
  return dot === -1 ? '' : lower.slice(dot);
}

function isPdf(entry) {
  return extOf(entry && entry.name) === '.pdf' || (entry && entry.mime === 'application/pdf');
}

function trackEl() {
  return els && els.track;
}

function gen() {
  return ++renderGen;
}

function isStale(myGen) {
  return myGen !== renderGen;
}

function trackObjectUrl(url) {
  objectUrls.push(url);
  if (objectUrls.length > 12) {
    const old = objectUrls.shift();
    if (old && old !== lastObjectUrl) {
      try { URL.revokeObjectURL(old); } catch (e) {}
    }
  }
}

function sigForBar(i) {
  let sig = autoSigs[i] && autoSigs[i].n ? { n: autoSigs[i].n, d: autoSigs[i].d } : { n: 4, d: 4 };
  for (const s of sigSections) {
    if (s.fromBar <= i) sig = { n: s.n, d: s.d };
  }
  return sig;
}

export function createSheetController(options) {
  callbacks = options || {};

  function init(refs) {
    ui = refs.ui;
    els = refs;
    bindUi();
    applyPersistedToggles();
    if (!currentEntry) {
      hideStrip();
    } else {
      revealStrip();
      renderForCurrentSong();
    }
  }

  function revealStrip() {
    stripRevealed = true;
    if (els.strip) els.strip.hidden = false;
    if (els.toggles) els.toggles.hidden = false;
    const view = document.getElementById('metroView');
    if (view) view.classList.add('has-strip');
  }

  function hideStrip() {
    stripRevealed = false;
    if (els.strip) els.strip.hidden = true;
    if (els.toggles) els.toggles.hidden = true;
    const view = document.getElementById('metroView');
    if (view) view.classList.remove('has-strip');
  }

  function bindUi() {
    if (els.followBtn && !els.followBtn.dataset.bound) {
      els.followBtn.dataset.bound = '1';
      els.followBtn.addEventListener('click', () => toggleFollow());
    }
    if (els.loopBtn && !els.loopBtn.dataset.bound) {
      els.loopBtn.dataset.bound = '1';
      els.loopBtn.addEventListener('click', () => toggleLoop());
    }
    if (els.syncBtn && !els.syncBtn.dataset.bound) {
      els.syncBtn.dataset.bound = '1';
      els.syncBtn.addEventListener('click', () => toggleSync());
    }
    if (els.clearBtn && !els.clearBtn.dataset.bound) {
      els.clearBtn.dataset.bound = '1';
      els.clearBtn.addEventListener('click', () => {
        if (callbacks.onSheetClear) callbacks.onSheetClear();
      });
    }
    let resizeRaf = null;
    window.addEventListener('resize', () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        cacheTrackMetrics();
      });
    }, { passive: true });
  }

  function applyPersistedToggles() {
    renderToggleStates();
  }

  function renderToggleStates() {
    if (els.followBtn) {
      els.followBtn.setAttribute('aria-pressed', metroState.sheetFollow ? 'true' : 'false');
    }
    if (els.loopBtn) {
      els.loopBtn.setAttribute('aria-pressed', metroState.sheetLoop ? 'true' : 'false');
    }
    if (els.syncBtn) {
      els.syncBtn.setAttribute('aria-pressed', metroState.sheetSync ? 'true' : 'false');
    }
  }

  function toggleFollow() {
    const next = setSheetFollow(!metroState.sheetFollow);
    renderToggleStates();
    if (!next) stopFollowScroll();
    else if (metroState.playing) startFollowScroll();
    if (callbacks.onSheetToast) callbacks.onSheetToast(next ? COPY.followOn : COPY.followOff);
  }

  function toggleLoop() {
    const next = setSheetLoop(!metroState.sheetLoop);
    renderToggleStates();
    if (callbacks.onSheetToast) callbacks.onSheetToast(next ? COPY.loopOn : COPY.loopOff);
  }

  function toggleSync() {
    const next = setSheetSync(!metroState.sheetSync);
    renderToggleStates();
    if (next) {
      if (!timeline.length) {
        if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.syncNoBars, 'warning');
      } else {
        barCursor = -1;
        if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.syncOn, 'success');
      }
    } else {
      if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.syncOff, 'info');
    }
  }

  function songKeyFor(entry) {
    if (!entry) return '';
    if (entry.inspirationId) return entry.inspirationId;
    const t = String(entry.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return t.slice(0, 80);
  }

  function setCurrentSong(entry) {
    currentEntry = entry || null;
    currentSongKey = songKeyFor(entry);
    if (!currentEntry) {
      hideStrip();
    } else {
      updateHeader();
      revealStrip();
      renderForCurrentSong();
    }
  }

  function getCurrentSongKey() {
    return currentSongKey;
  }

  function updateHeader() {
    if (els.title) {
      els.title.textContent = currentEntry && currentEntry.title ? currentEntry.title : COPY.noSong;
    }
    if (els.bpmBadge) {
      if (currentEntry && typeof currentEntry.bpm === 'number') {
        els.bpmBadge.textContent = `${currentEntry.bpm} BPM`;
        els.bpmBadge.hidden = false;
      } else {
        els.bpmBadge.hidden = true;
      }
    }
  }

  function activeEntry() {
    if (!currentSongKey) return null;
    return getSheetForSong(currentSongKey, metroState.sheetInstrument);
  }

  function resetTimelineState() {
    timeline = [];
    barCursor = -1;
    autoSigs = [];
    sigSections = [];
    closeSigPopover();
    if (els.barChip) els.barChip.hidden = true;
  }

  function renderForCurrentSong() {
    updateHeader();
    const myGen = gen();
    const track = trackEl();
    if (!track) return;
    stopFollowScroll();
    resetTimelineState();
    track.textContent = '';
    const entry = activeEntry();

    if (els.clearBtn) els.clearBtn.hidden = !entry;

    if (!entry) {
      renderEmpty(track);
      return;
    }

    if (entry.sigSections && Array.isArray(entry.sigSections)) {
      sigSections = entry.sigSections.slice();
    }

    if (entry.objectUrl) {
      lastObjectUrl = entry.objectUrl;
      renderFile(entry.objectUrl, entry, myGen);
      return;
    }

    getSheetFile(currentSongKey, metroState.sheetInstrument)
      .then((rec) => {
        if (isStale(myGen)) return;
        if (!rec) {
          renderEmpty(track);
          return;
        }
        const url = URL.createObjectURL(rec.blob);
        trackObjectUrl(url);
        renderFile(url, { name: rec.name, mime: rec.mime, size: rec.size }, myGen);
      })
      .catch(() => {
        if (!isStale(myGen)) renderEmpty(track);
      });
  }

  function renderEmpty(track, overrideTitle) {
    const empty = document.createElement('div');
    empty.className = 'kins-sheet-empty';
    const title = document.createElement('strong');
    title.textContent = overrideTitle || COPY.emptyTitle;
    const sub = document.createElement('span');
    sub.textContent = COPY.emptySub;
    empty.appendChild(title);
    empty.appendChild(sub);
    track.appendChild(empty);
  }

  async function ensurePdfJs() {
    if (!pdfLibPromise) {
      pdfLibPromise = import(/* @vite-ignore */ PDFJS_URL).then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        return lib;
      });
    }
    return pdfLibPromise;
  }

  function loadScriptOnce(src, marker) {
    if (marker === 'alphatab' && alphaTabLoaded && window.alphaTab) return Promise.resolve(window.alphaTab);
    if (marker === 'osmd' && osmdLoaded && window.OpenSheetMusicDisplay) return Promise.resolve(window.OpenSheetMusicDisplay);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-${marker}]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(marker === 'alphatab' ? window.alphaTab : window.OpenSheetMusicDisplay));
        existing.addEventListener('error', reject);
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset[marker] = '1';
      s.onload = () => {
        if (marker === 'alphatab') alphaTabLoaded = true;
        else osmdLoaded = true;
        resolve(marker === 'alphatab' ? window.alphaTab : window.OpenSheetMusicDisplay);
      };
      s.onerror = () => reject(new Error(marker + ' failed to load'));
      document.head.appendChild(s);
    });
  }

  function offscreenHolder(width) {
    const holder = document.createElement('div');
    holder.style.position = 'fixed';
    holder.style.left = '-10000px';
    holder.style.top = '0';
    holder.style.width = width + 'px';
    holder.style.background = '#ffffff';
    holder.style.visibility = 'hidden';
    holder.style.pointerEvents = 'none';
    document.body.appendChild(holder);
    return holder;
  }

  function settle(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function buildBarCard(cropCanvas, label, sig, barIdx, sigEditable) {
    const card = document.createElement('div');
    card.className = 'kins-sheet-page kins-sheet-bar';
    card.dataset.bar = String(barIdx);
    const head = document.createElement('div');
    head.className = 'kins-sheet-page-head';
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    head.appendChild(labelEl);
    let sigEl;
    if (sigEditable) {
      sigEl = document.createElement('button');
      sigEl.type = 'button';
      sigEl.className = 'kins-sig-badge';
      sigEl.title = 'Set time signature from this bar';
      sigEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openSigPopover(barIdx, sigEl);
      });
    } else {
      sigEl = document.createElement('span');
      sigEl.className = 'kins-sig-badge kins-sig-badge--static';
    }
    sigEl.textContent = `${sig.n}/${sig.d}`;
    sigEl.dataset.bar = String(barIdx);
    head.appendChild(sigEl);
    card.appendChild(head);
    card.appendChild(cropCanvas);
    card.addEventListener('click', () => seekToBar(barIdx));
    return card;
  }

  function mountBars(bars, myGen) {
    const track = trackEl();
    if (!track || isStale(myGen)) return;
    track.textContent = '';
    timeline = [];
    bars.forEach((b, i) => {
      const sig = sigForBar(i);
      const card = buildBarCard(b.canvas, b.label, sig, i, b.sigEditable);
      track.appendChild(card);
      timeline.push({
        beatsPerBar: sig.n,
        beatUnit: sig.d,
        el: card
      });
    });
    if (els.barChip) els.barChip.hidden = timeline.length < 2;
    if (timeline.length >= 2) updateBarChip();
    cacheTrackMetrics();
    if (metroState.sheetSync && metroState.playing && timeline.length) {
      barCursor = -1;
    }
    if (metroState.sheetFollow && metroState.playing) startFollowScroll();
  }

  async function renderFile(url, entry, myGen) {
    const track = trackEl();
    if (!track) return;
    track.textContent = '';
    const loading = document.createElement('div');
    loading.className = 'kins-sheet-empty';
    loading.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><strong>${COPY.rendering}</strong><span>${COPY.scanning}</span>`;
    track.appendChild(loading);

    try {
      const ext = extOf(entry.name);
      let bars = [];
      let sigEditable = false;

      if (isPdf(entry)) {
        let omrBars = null;
        try {
          const blob = await fetch(url).then((r) => r.blob());
          if (!isStale(myGen)) {
            const pages = await tryOmerBridge(blob, loading, myGen);
            if (isStale(myGen)) return;
            if (pages) {
              const res = await buildOmerPageBars(pages, myGen);
              if (isStale(myGen)) return;
              if (res.bars.length >= 2) omrBars = res.bars;
            }
          }
        } catch (e) {}
        if (omrBars) {
          bars = omrBars;
          if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.omrDone(bars.length), 'success');
        } else {
          const res = await buildPdfBars(url, myGen);
          if (isStale(myGen)) return;
          if (res.bars.length >= 2) {
            bars = res.bars;
            sigEditable = true;
          } else if (res.pageCanvases && res.pageCanvases.length) {
            mountPageFallback(res.pageCanvases, myGen);
            return;
          } else {
            throw new Error('no pages');
          }
        }
      } else if (ext === '.gp' || ext === '.gp5') {
        const res = await buildAlphaTabBars(url, myGen);
        if (isStale(myGen)) return;
        bars = res.bars;
      } else {
        const res = await buildOsmdBars(url, myGen);
        if (isStale(myGen)) return;
        bars = res.bars;
      }

      mountBars(bars, myGen);
    } catch (err) {
      if (isStale(myGen)) return;
      track.textContent = '';
      const errBox = document.createElement('div');
      errBox.className = 'kins-sheet-error';
      errBox.textContent = COPY.failed;
      track.appendChild(errBox);
      if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.renderFail, 'error');
    }
  }

  async function omerBridgeHealthy() {
    if (omrBridgeOk !== null) return omrBridgeOk;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(`${OMR_BASE}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      omrBridgeOk = res.ok;
    } catch (e) {
      omrBridgeOk = false;
    }
    return omrBridgeOk;
  }

  async function tryOmerBridge(fileBlob, loadingEl, myGen) {
    const healthy = await omerBridgeHealthy();
    if (!healthy) {
      if (!omrHintShown) {
        omrHintShown = true;
        if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.omrHint, 'info');
      }
      return null;
    }
    if (loadingEl) {
      const strong = loadingEl.querySelector('strong');
      if (strong) strong.textContent = COPY.omrRunning;
    }
    const fd = new FormData();
    fd.append('file', fileBlob, 'sheet.pdf');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5 * 60 * 1000);
    try {
      const res = await fetch(`${OMR_BASE}/omr`, { method: 'POST', body: fd, signal: ctrl.signal });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      if (!data || data.status !== 'success' || !Array.isArray(data.pages) || !data.pages.length) return null;
      return data.pages;
    } finally {
      clearTimeout(t);
    }
  }

  async function buildOmerPageBars(xmlPages, myGen) {
    const all = [];
    const mergedSigs = [];
    for (const xml of xmlPages) {
      if (isStale(myGen)) return { bars: [] };
      let doc = null;
      try {
        doc = new DOMParser().parseFromString(xml, 'application/xml');
      } catch (e) {
        doc = null;
      }
      if (!doc || doc.querySelector('parsererror')) continue;
      const res = await buildOsmdBars(doc, myGen);
      if (isStale(myGen)) return { bars: [] };
      for (const b of res.bars) all.push(b);
      for (const s of autoSigs) mergedSigs.push(s);
    }
    if (!all.length) return { bars: [] };
    autoSigs = mergedSigs;
    all.forEach((b, i) => {
      b.label = `B${i + 1}`;
    });
    return { bars: all };
  }

  function mountPageFallback(pageCanvases, myGen) {
    const track = trackEl();
    if (!track || isStale(myGen)) return;
    track.textContent = '';
    timeline = [];
    pageCanvases.forEach((canvas, i) => {
      const card = document.createElement('div');
      card.className = 'kins-sheet-page';
      const head = document.createElement('div');
      head.className = 'kins-sheet-page-head';
      const label = document.createElement('span');
      label.textContent = `P${String(i + 1).padStart(2, '0')}`;
      head.appendChild(label);
      card.appendChild(head);
      card.appendChild(canvas);
      track.appendChild(card);
    });
    if (els.barChip) els.barChip.hidden = true;
    if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.syncNoBars, 'info');
    cacheTrackMetrics();
  }

  async function buildPdfBars(url, myGen) {
    const pdfjs = await ensurePdfJs();
    if (isStale(myGen)) return { bars: [], pageCanvases: [] };
    const buf = await fetch(url).then((r) => r.arrayBuffer());
    if (isStale(myGen)) return { bars: [], pageCanvases: [] };
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    if (isStale(myGen)) return { bars: [], pageCanvases: [] };
    const pages = Math.min(doc.numPages, 8);
    const bars = [];
    const pageCanvases = [];
    for (let p = 1; p <= pages; p++) {
      if (isStale(myGen)) return { bars: [], pageCanvases: [] };
      const page = await doc.getPage(p);
      if (isStale(myGen)) return { bars: [], pageCanvases: [] };
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 2400 / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale: scale * 1.6 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (isStale(myGen)) return { bars: [], pageCanvases: [] };
      pageCanvases.push(canvas);
      const scan = scanScoreCanvas(canvas);
      let barInPage = 0;
      for (const sys of scan.systems) {
        for (const span of sys.bars) {
          barInPage++;
          const crop = cropRegion(canvas, span.x0, sys.y0, span.x1, sys.y1);
          bars.push({ canvas: crop, label: `P${p}·B${barInPage}` });
          if (bars.length >= 120) break;
        }
        if (bars.length >= 120) break;
      }
    }
    return { bars, pageCanvases };
  }

  async function buildOsmdBars(source, myGen) {
    const OSMD = await loadScriptOnce(OSMD_URL, 'osmd');
    if (isStale(myGen)) return { bars: [] };
    const holder = offscreenHolder(2400);
    try {
      const osmd = new OSMD(holder, { autoResize: false, backend: 'canvas' });
      await osmd.load(source);
      if (isStale(myGen)) return { bars: [] };
      osmd.zoom = 0.6;
      osmd.render();
      await settle(80);
      if (isStale(myGen)) return { bars: [] };
      autoSigs = extractOsmdSignatures(osmd);
      const canvas = holder.querySelector('canvas');
      if (!canvas) throw new Error('osmd no canvas');
      return barsFromScan(canvas, myGen);
    } finally {
      holder.remove();
    }
  }

  function extractOsmdSignatures(osmd) {
    try {
      const sheet = osmd.sheet || osmd.Sheet;
      const sms = (sheet && (sheet.sourceMeasures || sheet.SourceMeasures)) || [];
      return sms.map((sm) => {
        const ts = sm && (sm.timeSignature || sm.TimeSignature || sm.sourceTimeSignature);
        if (ts && typeof ts.numerator === 'number' && typeof ts.denominator === 'number' && ts.numerator > 0 && ts.denominator > 0) {
          return { n: ts.numerator, d: ts.denominator };
        }
        return null;
      });
    } catch (e) {
      return [];
    }
  }

  async function buildAlphaTabBars(url, myGen) {
    const alphaTab = await loadScriptOnce(ALPHATAB_URL, 'alphatab');
    if (isStale(myGen)) return { bars: [] };
    const holder = offscreenHolder(1600);
    try {
      const api = new alphaTab.AlphaTabApi(holder, {
        file: url,
        player: null,
        display: { scale: 0.8 }
      });
      await waitForAlphaTabRender(api);
      if (isStale(myGen)) return { bars: [] };
      await settle(120);
      if (isStale(myGen)) return { bars: [] };
      const canvas = holder.querySelector('canvas');
      if (!canvas) throw new Error('alphatab no canvas');
      autoSigs = extractAlphaTabSignatures(api);
      return barsFromScan(canvas, myGen);
    } finally {
      holder.remove();
    }
  }

  function waitForAlphaTabRender(api) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      try {
        if (api.renderFinished && typeof api.renderFinished.on === 'function') {
          api.renderFinished.on(finish);
        }
      } catch (e) {}
      setTimeout(finish, 3000);
    });
  }

  function extractAlphaTabSignatures(api) {
    try {
      const score = api.score;
      if (!score || !score.tracks || !score.tracks.length) return [];
      const staves = score.tracks[0].staves || [];
      const staff = staves[0];
      if (!staff || !staff.bars) return [];
      return staff.bars.map((bar) => {
        const ts = bar && bar.timeSignature;
        if (ts && typeof ts.numerator === 'number' && ts.numerator > 0) {
          return { n: ts.numerator, d: typeof ts.denominator === 'number' && ts.denominator > 0 ? ts.denominator : 4 };
        }
        return null;
      });
    } catch (e) {
      return [];
    }
  }

  function barsFromScan(canvas, myGen) {
    const scan = scanScoreCanvas(canvas);
    if (isStale(myGen)) return { bars: [] };
    const bars = [];
    let idx = 0;
    for (const sys of scan.systems) {
      for (const span of sys.bars) {
        const crop = cropRegion(canvas, span.x0, sys.y0, span.x1, sys.y1);
        bars.push({ canvas: crop, label: `B${idx + 1}` });
        idx++;
        if (bars.length >= 120) break;
      }
      if (bars.length >= 120) break;
    }
    return { bars };
  }

  function seekToBar(i) {
    if (!timeline.length || i < 0 || i >= timeline.length) return;
    barCursor = i;
    applyBarCursor(true);
  }

  function applyBarCursor(force) {
    const bar = timeline[barCursor];
    if (!bar) return;
    const sig = sigForBar(barCursor);
    bar.beatsPerBar = sig.n;
    bar.beatUnit = sig.d;
    const cur = getTimeSignature();
    if (metroState.sheetSync && callbacks.onScoreTimeSignature) {
      if (force || cur.beatsPerBar !== sig.n || cur.beatUnit !== sig.d) {
        callbacks.onScoreTimeSignature(sig.n, sig.d);
      }
    }
    updateBarChip();
    if (metroState.sheetFollow && bar.el && els.track) {
      const track = els.track;
      const left = bar.el.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - 12;
      track.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }

  function updateBarChip() {
    if (!els.barChip) return;
    if (!timeline.length || barCursor < 0) {
      els.barChip.hidden = true;
      return;
    }
    const sig = sigForBar(barCursor);
    els.barChip.textContent = `BAR ${barCursor + 1}/${timeline.length} • ${sig.n}/${sig.d}`;
    els.barChip.hidden = false;
  }

  function rebuildSigLabels() {
    timeline.forEach((bar, i) => {
      const sig = sigForBar(i);
      bar.beatsPerBar = sig.n;
      bar.beatUnit = sig.d;
      const card = bar.el;
      if (card) {
        const badge = card.querySelector('.kins-sig-badge');
        if (badge) badge.textContent = `${sig.n}/${sig.d}`;
      }
    });
    updateBarChip();
  }

  function openSigPopover(barIdx, anchor) {
    closeSigPopover();
    const pop = document.createElement('div');
    pop.className = 'kins-sig-popover';
    const title = document.createElement('p');
    title.className = 'kins-sig-popover-title';
    title.textContent = `TIME SIG FROM BAR ${barIdx + 1}`;
    pop.appendChild(title);
    const row = document.createElement('div');
    row.className = 'kins-sig-popover-row';
    SIG_PRESETS.forEach(([n, d]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'metro-chip brutal-press';
      chip.textContent = `${n}/${d}`;
      chip.addEventListener('click', () => {
        applySigFromBar(barIdx, n, d);
      });
      row.appendChild(chip);
    });
    const custom = document.createElement('button');
    custom.type = 'button';
    custom.className = 'metro-chip brutal-press';
    custom.textContent = 'CUSTOM';
    custom.addEventListener('click', () => {
      const n = parseInt(window.prompt(COPY.sigPromptBeats, '4'), 10);
      if (Number.isNaN(n) || n < 1 || n > 32) {
        if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.sigInvalid, 'error');
        return;
      }
      const d = parseInt(window.prompt(COPY.sigPromptUnit, '4'), 10);
      if (Number.isNaN(d) || d < 1 || d > 32) {
        if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.sigInvalid, 'error');
        return;
      }
      applySigFromBar(barIdx, n, d);
    });
    row.appendChild(custom);
    pop.appendChild(row);
    document.body.appendChild(pop);
    const rect = anchor.getBoundingClientRect();
    const pw = Math.min(320, window.innerWidth - 16);
    pop.style.width = pw + 'px';
    const left = Math.min(Math.max(8, rect.left - pw / 2), window.innerWidth - pw - 8);
    const top = Math.max(8, rect.top - pop.offsetHeight - 10);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    sigPopover = pop;
    setTimeout(() => {
      document.addEventListener('pointerdown', onSigPopoverOutside, { capture: true });
      document.addEventListener('keydown', onSigPopoverKey, { capture: true });
    }, 0);
  }

  function onSigPopoverOutside(e) {
    if (sigPopover && !sigPopover.contains(e.target)) closeSigPopover();
  }

  function onSigPopoverKey(e) {
    if (e.key === 'Escape') closeSigPopover();
  }

  function closeSigPopover() {
    if (!sigPopover) return;
    const pop = sigPopover;
    sigPopover = null;
    document.removeEventListener('pointerdown', onSigPopoverOutside, { capture: true });
    document.removeEventListener('keydown', onSigPopoverKey, { capture: true });
    pop.remove();
  }

  function applySigFromBar(barIdx, n, d) {
    sigSections = sigSections.filter((s) => s.fromBar !== barIdx);
    sigSections.push({ fromBar: barIdx, n, d });
    sigSections.sort((a, b) => a.fromBar - b.fromBar);
    const entry = activeEntry();
    if (entry) {
      setSheetForSong(currentSongKey, metroState.sheetInstrument, {
        ...entry,
        sigSections: sigSections.slice()
      });
    }
    rebuildSigLabels();
    if (metroState.sheetSync && barCursor >= 0) applyBarCursor(true);
    closeSigPopover();
    if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.sigSetTo(barIdx + 1, n, d), 'success');
  }

  let metrics = { scrollWidth: 0, clientWidth: 0 };

  function cacheTrackMetrics() {
    const track = trackEl();
    if (!track) return;
    metrics.scrollWidth = track.scrollWidth;
    metrics.clientWidth = track.clientWidth;
  }

  function followEnabled() {
    return !!metroState.sheetFollow && !document.documentElement.classList.contains('low-power-mode');
  }

  function startFollowScroll() {
    if (followRaf) return;
    if (!followEnabled()) return;
    if (metroState.sheetSync && timeline.length > 1) return;
    cacheTrackMetrics();
    let lastTs = 0;
    const step = (ts) => {
      followRaf = null;
      if (!followEnabled() || !metroState.playing) return;
      const dt = lastTs ? Math.min(100, ts - lastTs) : 16;
      lastTs = ts;
      const track = trackEl();
      if (!track) return;
      const speed = (scrollPxPerBeat * (metroState.bpm / 60)) * (dt / 1000);
      const nextLeft = track.scrollLeft + speed;
      const maxLeft = track.scrollWidth - track.clientWidth;
      if (nextLeft >= maxLeft) {
        if (metroState.sheetLoop) {
          track.scrollLeft = 0;
        } else {
          track.scrollLeft = maxLeft;
          return;
        }
      } else {
        track.scrollLeft = nextLeft;
      }
      followRaf = requestAnimationFrame(step);
    };
    followRaf = requestAnimationFrame(step);
  }

  function stopFollowScroll() {
    if (followRaf) {
      cancelAnimationFrame(followRaf);
      followRaf = null;
    }
  }

  function onPlaybackStarted() {
    if (metroState.sheetSync && timeline.length > 1) {
      barCursor = -1;
      return;
    }
    if (followEnabled()) startFollowScroll();
  }

  function onPlaybackStopped() {
    stopFollowScroll();
  }

  function onBeat(beatInBar) {
    if (metroState.sheetSync && timeline.length > 1 && metroState.playing && beatInBar === 0) {
      if (barCursor < 0) {
        barCursor = 0;
      } else if (barCursor < timeline.length - 1) {
        barCursor++;
      } else if (metroState.sheetLoop) {
        barCursor = 0;
      }
      applyBarCursor();
    }
    if (!followRaf && followEnabled() && metroState.playing) startFollowScroll();
  }

  function clearCurrentSheet() {
    if (!currentSongKey) {
      if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.nothingToClear, 'info');
      return;
    }
    const entry = activeEntry();
    if (!entry) {
      if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.nothingCleared, 'info');
      return;
    }
    const songKey = currentSongKey;
    const instrument = metroState.sheetInstrument;
    setSheetForSong(songKey, instrument, null);
    deleteSheetFile(songKey, instrument).catch(() => {});
    renderForCurrentSong();
    if (callbacks.onSheetToast) callbacks.onSheetToast(COPY.cleared, 'success');
  }

  function teardown() {
    stopFollowScroll();
    closeSigPopover();
    objectUrls.forEach((u) => {
      try { URL.revokeObjectURL(u); } catch (e) {}
    });
    objectUrls = [];
  }

  return {
    init,
    setCurrentSong,
    getCurrentSongKey,
    renderForCurrentSong,
    toggleFollow,
    toggleLoop,
    toggleSync,
    renderToggleStates,
    clearCurrentSheet,
    onBeat,
    onPlaybackStarted,
    onPlaybackStopped,
    teardown,
    get timelineLength() { return timeline.length; }
  };
}
