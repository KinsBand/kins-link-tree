import {
  SHEET_INSTRUMENTS,
  METRO_SHEET_CONFIG
} from '../../../settings/metronome.config';
import {
  metroState,
  setSheetForSong,
  getSheetForSong,
  setSheetFollow,
  setSheetLoop,
  setSheetInstrument
} from './metroState.js';

const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs';
const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs';
const ALPHATAB_URL = 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.4/dist/alphaTab.js';

const COPY = {
  noSong: 'SELECT A SETLIST SONG',
  emptyTitle: (inst) => `NO ${inst} SHEET YET`,
  emptySub: 'Upload your own tab or sheet — PDF, Guitar Pro or MusicXML.',
  awaitingReview: 'UPLOADED — AWAITING REVIEW',
  rendering: 'RENDERING…',
  failed: 'COULD NOT RENDER THIS FILE'
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

export function createSheetController(options) {
  callbacks = options || {};

  function init(refs) {
    ui = refs.ui;
    els = refs;
    bindUi();
    applyPersistedToggles();
    if (!currentEntry && !hasAnyLocalSheets()) {
      hideStrip();
    } else {
      revealStrip();
      renderForCurrentSong();
    }
  }

  function hasAnyLocalSheets() {
    try {
      return Object.keys(metroState.sheetMap || {}).length > 0;
    } catch (e) {
      return false;
    }
  }

  function revealStrip() {
    stripRevealed = true;
    if (els.strip) els.strip.hidden = false;
    if (els.toggles) els.toggles.hidden = false;
  }

  function hideStrip() {
    stripRevealed = false;
    if (els.strip) els.strip.hidden = true;
    if (els.toggles) els.toggles.hidden = true;
  }

  function bindUi() {
    if (els.uploadBtn && !els.uploadBtn.dataset.bound) {
      els.uploadBtn.dataset.bound = '1';
      els.uploadBtn.addEventListener('click', () => {
        if (els.fileInput) els.fileInput.click();
      });
    }
    if (els.instrumentUploadLabel && !els.instrumentUploadLabel.dataset.bound) {
      els.instrumentUploadLabel.dataset.bound = '1';
      els.instrumentUploadLabel.addEventListener('click', (e) => {
        e.preventDefault();
        if (els.instrumentFileInput) els.instrumentFileInput.click();
      });
    }
    [els.fileInput, els.instrumentFileInput].forEach((input) => {
      if (input && !input.dataset.bound) {
        input.dataset.bound = '1';
        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          if (file) handleFileSelected(file);
          input.value = '';
        });
      }
    });
    if (els.followBtn && !els.followBtn.dataset.bound) {
      els.followBtn.dataset.bound = '1';
      els.followBtn.addEventListener('click', () => toggleFollow());
    }
    if (els.loopBtn && !els.loopBtn.dataset.bound) {
      els.loopBtn.dataset.bound = '1';
      els.loopBtn.addEventListener('click', () => toggleLoop());
    }
    if (els.clearBtn && !els.clearBtn.dataset.bound) {
      els.clearBtn.dataset.bound = '1';
      els.clearBtn.addEventListener('click', () => {
        if (callbacks.onSheetClear) callbacks.onSheetClear();
      });
    }
    if (els.instrumentClearBtn && !els.instrumentClearBtn.dataset.bound) {
      els.instrumentClearBtn.dataset.bound = '1';
      els.instrumentClearBtn.addEventListener('click', () => {
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
  }

  function toggleFollow() {
    const next = setSheetFollow(!metroState.sheetFollow);
    renderToggleStates();
    if (!next) stopFollowScroll();
    else if (metroState.playing) startFollowScroll();
    if (callbacks.onSheetToast) callbacks.onSheetToast(next ? 'Follow on — sheet scrolls with the click' : 'Follow off');
  }

  function toggleLoop() {
    const next = setSheetLoop(!metroState.sheetLoop);
    renderToggleStates();
    if (callbacks.onSheetToast) callbacks.onSheetToast(next ? 'Loop on' : 'Loop off');
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
    updateHeader();
    if (!stripRevealed && (entry || hasAnyLocalSheets())) revealStrip();
    renderForCurrentSong();
    if (ui && typeof ui.renderInstrumentPicker === 'function') ui.renderInstrumentPicker();
  }

  function getCurrentSongKey() {
    return currentSongKey;
  }

  function updateHeader() {
    const instDef = SHEET_INSTRUMENTS.find((s) => s.id === metroState.sheetInstrument) || SHEET_INSTRUMENTS[0];
    if (els.title) {
      if (currentEntry && currentEntry.title) {
        els.title.textContent = `${currentEntry.title} — ${instDef.label}`;
      } else {
        els.title.textContent = `${COPY.noSong} — ${instDef.label}`;
      }
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

  function renderForCurrentSong() {
    updateHeader();
    const myGen = gen();
    const track = trackEl();
    if (!track) return;
    stopFollowScroll();
    track.textContent = '';
    const entry = activeEntry();

    if (els.clearBtn) els.clearBtn.hidden = !entry;

    if (!entry) {
      renderEmpty(track);
      return;
    }

    if (entry.source === 'local' && entry.objectUrl) {
      lastObjectUrl = entry.objectUrl;
      renderFile(entry.objectUrl, entry, myGen);
      return;
    }

    if (entry.storagePath) {
      renderCloud(entry, myGen);
      return;
    }

    renderEmpty(track, COPY.awaitingReview);
  }

  function renderEmpty(track, overrideTitle) {
    const instDef = SHEET_INSTRUMENTS.find((s) => s.id === metroState.sheetInstrument) || SHEET_INSTRUMENTS[0];
    const empty = document.createElement('div');
    empty.className = 'kins-sheet-empty';
    const icon = document.createElement('i');
    icon.className = instDef.icon;
    icon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('strong');
    title.textContent = overrideTitle || COPY.emptyTitle(instDef.label);
    const sub = document.createElement('span');
    sub.textContent = COPY.emptySub;
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'metro-setlist-empty-cta brutal-press';
    cta.innerHTML = '<i class="fa-solid fa-file-arrow-up"></i> UPLOAD SHEET';
    cta.addEventListener('click', () => {
      if (els.fileInput) els.fileInput.click();
    });
    empty.appendChild(icon);
    empty.appendChild(title);
    empty.appendChild(sub);
    empty.appendChild(cta);
    track.appendChild(empty);
  }

  async function renderCloud(entry, myGen) {
    renderEmpty(trackEl(), COPY.awaitingReview);
    try {
      const url = cloudPublicUrl(entry.storagePath);
      const res = await fetch(url, { method: 'HEAD' });
      if (isStale(myGen)) return;
      if (res.ok) {
        renderFile(url, entry, myGen);
      }
    } catch (e) {}
  }

  function cloudPublicUrl(storagePath) {
    const base = (metroState.__supabaseUrl || '').replace(/\/$/, '');
    if (!base) return storagePath.replace(/^pending\//, 'approved/');
    return `${base}/storage/v1/object/public/${METRO_SHEET_CONFIG.bucket}/${storagePath.replace(/^pending\//, 'approved/')}`;
  }

  async function handleFileSelected(file) {
    const ext = extOf(file.name);
    if (METRO_SHEET_CONFIG.allowedExt.indexOf(ext) === -1) {
      if (callbacks.onSheetToast) callbacks.onSheetToast('Unsupported file — use PDF, GP, GP5, XML or MusicXML', 'error');
      return;
    }
    if (file.size > METRO_SHEET_CONFIG.maxBytes) {
      if (callbacks.onSheetToast) callbacks.onSheetToast('File too large — 15 MB max', 'error');
      return;
    }
    if (!currentSongKey) {
      if (callbacks.onSheetToast) callbacks.onSheetToast('Load a setlist song first — then upload its sheet', 'warning');
      return;
    }

    const url = URL.createObjectURL(file);
    trackObjectUrl(url);
    const record = {
      name: file.name,
      mime: file.type || '',
      size: file.size,
      instrument: metroState.sheetInstrument,
      source: 'local',
      objectUrl: url,
      uploadedAt: Date.now()
    };
    setSheetForSong(currentSongKey, metroState.sheetInstrument, {
      name: record.name,
      mime: record.mime,
      size: record.size,
      instrument: record.instrument,
      source: 'local-session',
      uploadedAt: record.uploadedAt
    });
    revealStrip();
    renderForCurrentSong();
    if (callbacks.onSheetUploadedLocal) callbacks.onSheetUploadedLocal(record);

    const songKeyAtSend = currentSongKey;
    const instrumentAtSend = metroState.sheetInstrument;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('instrument', instrumentAtSend);
      fd.append('songKey', songKeyAtSend);
      fd.append('title', currentEntry && currentEntry.title ? currentEntry.title : '');
      const res = await fetch('/api/sheet-upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'success') {
        if (data.sheet && data.sheet.storagePath) {
          setSheetForSong(songKeyAtSend, instrumentAtSend, {
            name: record.name,
            mime: record.mime,
            size: record.size,
            instrument: instrumentAtSend,
            source: 'cloud',
            storagePath: data.sheet.storagePath,
            uploadedAt: Date.now()
          });
        }
        if (callbacks.onSheetToast) callbacks.onSheetToast(data.message || 'Sheet received', 'success');
      } else {
        if (callbacks.onSheetToast) callbacks.onSheetToast((data && data.message) || 'Upload failed — kept locally for this session', 'warning');
      }
    } catch (err) {
      if (callbacks.onSheetToast) callbacks.onSheetToast('Upload failed — kept locally for this session', 'warning');
    }
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

  function loadAlphaTab() {
    if (alphaTabLoaded && window.alphaTab) return Promise.resolve(window.alphaTab);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-alphatab]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.alphaTab));
        existing.addEventListener('error', reject);
        return;
      }
      const s = document.createElement('script');
      s.src = ALPHATAB_URL;
      s.async = true;
      s.dataset.alphatab = '1';
      s.onload = () => { alphaTabLoaded = true; resolve(window.alphaTab); };
      s.onerror = () => reject(new Error('alphaTab failed to load'));
      document.head.appendChild(s);
    });
  }

  async function renderFile(url, entry, myGen) {
    const track = trackEl();
    if (!track) return;
    track.textContent = '';
    const loading = document.createElement('div');
    loading.className = 'kins-sheet-empty';
    loading.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><strong>${COPY.rendering}</strong>`;
    track.appendChild(loading);

    try {
      if (isPdf(entry)) {
        await renderPdf(url, track, myGen);
      } else {
        await renderNotation(url, track, myGen);
      }
      if (!isStale(myGen)) {
        cacheTrackMetrics();
        if (metroState.sheetFollow && metroState.playing) startFollowScroll();
      }
    } catch (err) {
      if (isStale(myGen)) return;
      track.textContent = '';
      const errBox = document.createElement('div');
      errBox.className = 'kins-sheet-error';
      errBox.textContent = COPY.failed;
      track.appendChild(errBox);
      if (callbacks.onSheetToast) callbacks.onSheetToast('Could not render that file — is it a valid sheet?', 'error');
    }
  }

  async function renderPdf(url, track, myGen) {
    const pdfjs = await ensurePdfJs();
    if (isStale(myGen)) return;
    const buf = await fetch(url).then((r) => r.arrayBuffer());
    if (isStale(myGen)) return;
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    if (isStale(myGen)) return;
    track.textContent = '';
    const pages = Math.min(doc.numPages, 12);
    for (let i = 1; i <= pages; i++) {
      if (isStale(myGen)) return;
      const page = await doc.getPage(i);
      if (isStale(myGen)) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const targetH = window.matchMedia('(max-width: 380px)').matches ? 92 : 108;
      const scale = targetH / baseViewport.height;
      const viewport = page.getViewport({ scale: scale * 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.height = `${targetH}px`;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (isStale(myGen)) return;
      const card = document.createElement('div');
      card.className = 'kins-sheet-page';
      const head = document.createElement('div');
      head.className = 'kins-sheet-page-head';
      const label = document.createElement('span');
      label.textContent = `P${String(i).padStart(2, '0')}`;
      const num = document.createElement('span');
      num.className = 'kins-sheet-page-num';
      num.textContent = `${i}/${doc.numPages}`;
      head.appendChild(label);
      head.appendChild(num);
      card.appendChild(head);
      card.appendChild(canvas);
      track.appendChild(card);
    }
    if (doc.numPages > pages) {
      const more = document.createElement('div');
      more.className = 'kins-sheet-empty';
      more.textContent = `+${doc.numPages - pages} more pages`;
      track.appendChild(more);
    }
  }

  async function renderNotation(url, track, myGen) {
    const alphaTab = await loadAlphaTab();
    if (isStale(myGen) || !alphaTab) throw new Error('no alphatab');
    track.textContent = '';
    const card = document.createElement('div');
    card.className = 'kins-sheet-page';
    card.style.maxWidth = 'none';
    card.style.width = '1600px';
    const head = document.createElement('div');
    head.className = 'kins-sheet-page-head';
    const label = document.createElement('span');
    const instDef = SHEET_INSTRUMENTS.find((s) => s.id === metroState.sheetInstrument) || SHEET_INSTRUMENTS[0];
    label.textContent = instDef.label;
    const num = document.createElement('span');
    num.className = 'kins-sheet-page-num';
    num.textContent = entry && entry.name ? extOf(entry.name).replace('.', '').toUpperCase() : '';
    head.appendChild(label);
    head.appendChild(num);
    const holder = document.createElement('div');
    holder.style.width = '1596px';
    holder.style.height = '300px';
    holder.style.overflow = 'hidden';
    holder.style.background = '#fff';
    card.appendChild(head);
    card.appendChild(holder);
    track.appendChild(card);

    const settings = {
      file: url,
      player: null,
      notation: {
        mode: 0
      },
      display: {
        scale: 0.8,
        layoutMode: 0
      }
    };
    /* eslint-disable-next-line no-new */
    new alphaTab.AlphaTabApi(holder, settings);
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
    if (followEnabled()) startFollowScroll();
  }

  function onPlaybackStopped() {
    stopFollowScroll();
  }

  function onBeat() {
    if (!followRaf && followEnabled() && metroState.playing) startFollowScroll();
  }

  function clearCurrentSheet() {
    if (!currentSongKey) {
      if (callbacks.onSheetToast) callbacks.onSheetToast('No song loaded — nothing to clear', 'info');
      return;
    }
    const entry = activeEntry();
    if (!entry) {
      if (callbacks.onSheetToast) callbacks.onSheetToast(`No ${metroState.sheetInstrument.toUpperCase()} sheet for this song`, 'info');
      return;
    }
    setSheetForSong(currentSongKey, metroState.sheetInstrument, null);
    renderForCurrentSong();
    if (callbacks.onSheetToast) callbacks.onSheetToast('Sheet cleared for this song + instrument', 'success');
  }

  function selectInstrument(id) {
    const next = setSheetInstrument(id);
    const def = SHEET_INSTRUMENTS.find((s) => s.id === next) || SHEET_INSTRUMENTS[0];
    renderInstrumentButton();
    renderForCurrentSong();
    if (ui && typeof ui.renderInstrumentPicker === 'function') ui.renderInstrumentPicker();
    if (callbacks.onSheetToast) callbacks.onSheetToast(`${def.label} version selected`, 'success');
    return next;
  }

  function renderInstrumentButton() {
    const def = SHEET_INSTRUMENTS.find((s) => s.id === metroState.sheetInstrument) || SHEET_INSTRUMENTS[0];
    if (els.instrumentLabel) els.instrumentLabel.textContent = def.shortLabel;
    if (els.instrumentIcon) els.instrumentIcon.className = def.icon;
  }

  function teardown() {
    stopFollowScroll();
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
    handleFileSelected,
    toggleFollow,
    toggleLoop,
    selectInstrument,
    renderInstrumentButton,
    renderToggleStates,
    clearCurrentSheet,
    onBeat,
    onPlaybackStarted,
    onPlaybackStopped,
    teardown,
    set supabaseUrl(v) { metroState.__supabaseUrl = v; }
  };
}
