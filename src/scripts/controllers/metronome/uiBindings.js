import {
  METRO_BPM,
  METRO_TIME_SIGNATURES,
  METRO_SUBDIVISIONS,
  METRO_SOUNDS,
  METRO_SETLIST,
  METRO_SETLIST_BY_CATEGORY,
  METRO_SETLIST_INSPIRES,
  METRO_COACH_TABS,
  METRO_COPY,
  COACH_DEFAULTS
} from '../../../settings/metronome.config';
import { showToast } from '../toast.js';
import { metroState, getTimeSignature, getSubdivision, getBeatTier } from './metroState.js';

export function createUi(callbacks) {
  const els = {};
  let beatDots = [];
  let radialSegs = [];
  let currentBeat = -1;
  let sheetOpen = false;
  let activePanel = null;
  let sheetTrigger = null;
  let coachTab = metroState.coachTab || METRO_COACH_TABS[0].id;
  let reducedMotion = false;
  let copyBadgeTimer = null;
  let repeatTimeout = null;
  let repeatInterval = null;
  let drag = null;
  let dragRafId = null;
  let coachLiveRunning = false;
  let coachLiveTab = null;
  let midiElsBound = false;
  let activeSetlistFilter = 'inspires';
  let lastSetlistEntry = null;
  let topbarTitleVisible = false;
  let topbarUndoVisible = false;
  let isRestoringFromUndo = false;
  let flashAlt = false;

  // custom + search state
  let customEntries = [];
  let setlistSearchQuery = '';
  let setlistSearchActive = false;
  let externalResults = [];
  let externalLoading = false;
  let externalSearchGen = 0;
  let searchDebounceTimer = null;
  let externalDebounceTimer = null;

  const NS = 'http://www.w3.org/2000/svg';

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function loadCustomEntries() {
    try {
      const raw = storageGet(METRO_STORAGE_KEYS.customSetlist);
      if (!raw) {
        customEntries = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        customEntries = [];
        return;
      }
      customEntries = parsed.filter((e) => e && typeof e.title === 'string' && typeof e.artist === 'string' && typeof e.bpm === 'number')
        .map((e) => ({
          title: String(e.title).trim().slice(0, 120),
          artist: String(e.artist).trim().slice(0, 120) || 'Unknown Artist',
          bpm: Math.min(300, Math.max(20, Math.round(Number(e.bpm) || 120))),
          category: 'custom',
          isCustom: true
        }));
    } catch (e) {
      customEntries = [];
    }
  }

  function saveCustomEntries() {
    try {
      storageSet(METRO_STORAGE_KEYS.customSetlist, JSON.stringify(customEntries));
    } catch (e) {}
  }

  function escHtmlShort(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }

  function q(id) {
    return document.getElementById(id);
  }

  function init() {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    els.dial = q('metroDial');
    els.bpmNum = q('metroBpmNum');
    els.bpmInput = q('metroBpmInput');
    els.beatDotsWrap = q('metroBeatDots');
    els.radialRing = q('metroRadialRing');
    els.bpmMinus = q('metroBpmMinus');
    els.bpmPlus = q('metroBpmPlus');
    els.tsPill = q('metroTsPill');
    els.tsPillLabel = q('metroTsPillLabel');
    els.subPill = q('metroSubPill');
    els.subPillLabel = q('metroSubPillLabel');
    els.setlistBtn = q('metroSetlistBtn');
    els.tapBtn = q('metroTapBtn');
    els.playBtn = q('metroPlayBtn');
    els.coachBtn = q('metroCoachBtn');
    els.settingsBtn = q('metroSettingsBtn');

    els.backdrop = q('metroSheetBackdrop');
    els.sheet = q('metroSheet');
    els.handle = q('metroSheetHandle');
    els.panelTs = q('metroPanelTs');
    els.panelSub = q('metroPanelSub');
    els.panelSetlist = q('metroPanelSetlist');
    els.panelSettings = q('metroPanelSettings');
    els.panelCoach = q('metroPanelCoach');

    els.tsBoxTop = q('metroTsBoxTop');
    els.tsBoxBottom = q('metroTsBoxBottom');
    els.tsGrid = q('metroTsGrid');
    els.tsInfoBeats = q('metroTsInfoBeats');
    els.tsInfoUnit = q('metroTsInfoUnit');

    els.subBoxTop = q('metroSubBoxTop');
    els.subBoxBottom = q('metroSubBoxBottom');
    els.subRow = q('metroSubRow');
    els.subInfo = q('metroSubInfo');

    els.setlistList = q('metroSetlistList');
    els.setlistFilters = q('metroSetlistFilters');
    els.setlistHeader = q('metroSetlistHeader');
    els.setlistSearchToggle = q('metroSetlistSearchToggle');
    els.setlistSearchWrap = q('metroSetlistSearchWrap');
    els.setlistSearchInput = q('metroSetlistSearchInput');
    els.setlistSearchClear = q('metroSetlistSearchClear');
    els.setlistCreateBtn = q('metroSetlistCreateBtn');
    els.setlistExternal = q('metroSetlistExternal');
    els.customFormWrap = q('metroCustomFormWrap');
    els.customCount = q('metroCustomCount');
    els.topbarCenter = q('metroTopbarCenter');
    els.topbarTitle = q('metroTopbarTitle');
    els.topbarUndo = q('metroTopbarUndo');
    if (els.topbarCenter) els.topbarCenter.hidden = true;

    els.soundRow = q('metroSoundRow');
    els.volume = q('metroVolume');
    els.volumeValue = q('metroVolumeValue');
    els.beatStyleRow = q('metroBeatStyleRow');
    els.flashToggle = q('metroFlashToggle');
    els.vibrateToggle = q('metroVibrateToggle');
    els.keepAwakeToggle = q('metroKeepAwakeToggle');
    els.backgroundToggle = q('metroBackgroundToggle');
    els.optionsInfo = q('metroOptionsInfo');
    els.pitchInfo = q('metroPitchInfo');
    els.midiInfo = q('metroMidiInfo');
    els.copyLinkBtn = q('metroCopyLinkBtn');
    els.copyBadge = q('metroCopyBadge');
    els.resetPitchBtn = q('metroResetPitchBtn');

    els.coachTablist = q('metroCoachTablist');
    els.coachPanelsWrap = q('metroCoachPanels');
    els.coachLive = q('metroCoachLive');
    els.coachLiveDock = q('metroCoachLiveDock');
    els.settingsScroll = q('metroSettingsScroll');

    // midi els
    els.midiSection = q('metroMidiSection');
    els.midiDot = q('metroMidiDot');
    els.midiStatusText = q('metroMidiStatusText');
    els.midiDeviceName = q('metroMidiDeviceName');
    els.midiSupportBadge = q('metroMidiSupportBadge');
    els.midiConnectBtn = q('metroMidiConnectBtn');
    els.midiConnectLabel = q('metroMidiConnectLabel');
    els.midiSelect = q('metroMidiSelect');

    buildBeatDots();
    buildRadialRing();
    buildTsGrid();
    buildSubRow();
    buildSetlist();
    buildSoundRow();
    buildCoachTabs();
    attachListeners();
    renderAll();
    // apply saved tab
    selectCoachTab(coachTab);
    bindMidiEvents();
    renderMidiState({ status: metroState.midiStatus || 'disconnected', inputs: [], activeId: metroState.midiDeviceId });
    if (typeof navigator !== 'undefined' && !navigator.requestMIDIAccess && els.midiStatusText) {
      renderMidiState({ status: 'unsupported', inputs: [] });
    }
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  function buildBeatDots() {
    if (!els.beatDotsWrap) return;
    els.beatDotsWrap.textContent = '';
    beatDots = [];
    const beats = getTimeSignature().beatsPerBar;
    for (let i = 0; i < beats; i++) {
      const dot = document.createElement('span');
      const tier = getBeatTier(i);
      dot.className = `metro-beat-dot brutal-press tier-${tier}`;
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.dataset.index = String(i);
      dot.dataset.tier = tier;
      dot.setAttribute('data-track', 'metronome:tier_cycle');
      dot.setAttribute('aria-label', METRO_COPY.beatTierAria ? METRO_COPY.beatTierAria(i + 1, tier) : `Beat ${i + 1} — pitch ${tier}`);
      const angle = (360 / beats) * i - 90;
      dot.style.transform = `rotate(${angle}deg) translateY(calc(var(--metro-dot-radius) * -1))`;
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (callbacks.onTierCycle) callbacks.onTierCycle(i);
      });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          if (callbacks.onTierCycle) callbacks.onTierCycle(i);
        }
      });
      els.beatDotsWrap.appendChild(dot);
      beatDots.push(dot);
    }
    if (metroState.beatStyle === 'radial') buildRadialRing();
  }

  function buildRadialRing() {
    if (!els.radialRing) return;
    els.radialRing.textContent = '';
    radialSegs = [];
    const beats = getTimeSignature().beatsPerBar;
    if (!beats || beats < 1) return;
    const cx = 100;
    const cy = 100;
    const r = 92;
    const gapDeg = beats === 1 ? 0 : 6;
    const segSpan = 360 / beats - gapDeg;

    const createSegPath = (i, start, end) => {
      const path = document.createElementNS(NS, 'path');
      const tier = getBeatTier(i);
      path.setAttribute('d', describeArc(cx, cy, r, start, end));
      path.setAttribute('class', `metro-radial-seg tier-${tier}`);
      path.setAttribute('role', 'button');
      path.setAttribute('tabindex', '0');
      path.dataset.index = String(i);
      path.dataset.tier = tier;
      path.setAttribute('data-track', 'metronome:tier_cycle');
      path.setAttribute('aria-label', METRO_COPY.beatTierAria ? METRO_COPY.beatTierAria(i + 1, tier) : `Beat ${i + 1} — pitch ${tier}`);
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        if (callbacks.onTierCycle) callbacks.onTierCycle(i);
      });
      path.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          if (callbacks.onTierCycle) callbacks.onTierCycle(i);
        }
      });
      return path;
    };

    if (beats === 1) {
      const p1 = createSegPath(0, 0, 179.999);
      els.radialRing.appendChild(p1);
      radialSegs.push(p1);
      const p2 = createSegPath(0, 180, 359.999);
      els.radialRing.appendChild(p2);
      radialSegs.push(p2);
      return;
    }
    for (let i = 0; i < beats; i++) {
      const step = 360 / beats;
      const start = i * step + gapDeg / 2;
      const end = start + segSpan;
      const path = createSegPath(i, start, end);
      els.radialRing.appendChild(path);
      radialSegs.push(path);
    }
  }

  function updateBeatDotTier(beatIndex, tier) {
    const t = tier || 'mid';
    const label = METRO_COPY.beatTierAria ? METRO_COPY.beatTierAria(beatIndex + 1, t) : `Beat ${beatIndex + 1} — pitch ${t}`;
    if (beatDots[beatIndex]) {
      const dot = beatDots[beatIndex];
      dot.dataset.tier = t;
      dot.classList.remove('tier-low', 'tier-mid', 'tier-high');
      dot.classList.add(`tier-${t}`);
      dot.setAttribute('aria-label', label);
    }
    radialSegs.forEach((seg) => {
      if (seg.dataset.index === String(beatIndex)) {
        seg.dataset.tier = t;
        seg.classList.remove('tier-low', 'tier-mid', 'tier-high');
        seg.classList.add(`tier-${t}`);
        seg.setAttribute('aria-label', label);
      }
    });
  }

  function buildTsGrid() {
    if (!els.tsGrid) return;
    METRO_TIME_SIGNATURES.forEach((ts, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'metro-chip brutal-press';
      chip.dataset.index = String(index);
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', 'false');
      chip.textContent = ts.label;
      chip.addEventListener('click', () => callbacks.onTsSelect(index));
      els.tsGrid.appendChild(chip);
    });
  }

  function buildSubRow() {
    if (!els.subRow) return;
    METRO_SUBDIVISIONS.forEach((sub, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'metro-sub-chip brutal-press';
      chip.dataset.index = String(index);
      chip.setAttribute('aria-pressed', 'false');
      const dot = document.createElement('span');
      dot.className = 'metro-sub-dot';
      dot.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'metro-sub-label';
      label.textContent = sub.label;
      chip.appendChild(dot);
      chip.appendChild(label);
      chip.addEventListener('click', () => callbacks.onSubSelect(index));
      els.subRow.appendChild(chip);
    });
  }

  function getAllEntriesForSearch() {
    const base = [
      ...METRO_SETLIST_INSPIRES,
      ...((METRO_SETLIST_BY_CATEGORY.covers) || []),
      ...((METRO_SETLIST_BY_CATEGORY.originals) || []),
    ];
    return [...base, ...customEntries];
  }

  function getFilteredSetlist() {
    // Search mode — search whole catalogue regardless of pill
    if (setlistSearchActive && setlistSearchQuery && setlistSearchQuery.length >= 1) {
      const q = setlistSearchQuery.toLowerCase();
      const all = getAllEntriesForSearch();
      return all.filter((e) => {
        const hay = `${e.title} ${e.artist} ${e.bpm}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (activeSetlistFilter === 'custom') {
      return customEntries;
    }
    const cat = activeSetlistFilter;
    if (cat && METRO_SETLIST_BY_CATEGORY[cat]) return METRO_SETLIST_BY_CATEGORY[cat];
    // custom handled above, fallback to inspires
    if (customEntries.length && cat === 'custom') return customEntries;
    return METRO_SETLIST_INSPIRES;
  }

  function highlightSearch(text, query) {
    if (!query) return escHtmlShort(text);
    const q = query.toLowerCase();
    const lower = String(text).toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return escHtmlShort(text);
    const before = escHtmlShort(String(text).slice(0, idx));
    const match = escHtmlShort(String(text).slice(idx, idx + q.length));
    const after = escHtmlShort(String(text).slice(idx + q.length));
    return `${before}<span class="metro-setlist-search-highlight">${match}</span>${after}`;
  }

  function renderSetlistList() {
    if (!els.setlistList) return;
    const entries = getFilteredSetlist();
    els.setlistList.textContent = '';

    const isSearching = setlistSearchActive && setlistSearchQuery.length > 0;

    if (!entries || entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'metro-setlist-empty';
      const isCovers = activeSetlistFilter === 'covers';
      const isOriginals = activeSetlistFilter === 'originals';
      const isCustom = activeSetlistFilter === 'custom';
      const icon = document.createElement('i');
      if (isSearching) icon.className = 'fa-solid fa-magnifying-glass metro-setlist-empty-icon';
      else if (isCustom) icon.className = 'fa-solid fa-star metro-setlist-empty-icon';
      else icon.className = isCovers
        ? 'fa-solid fa-compact-disc metro-setlist-empty-icon'
        : isOriginals
          ? 'fa-solid fa-music metro-setlist-empty-icon'
          : 'fa-solid fa-record-vinyl metro-setlist-empty-icon';
      icon.setAttribute('aria-hidden', 'true');
      const title = document.createElement('p');
      title.className = 'metro-setlist-empty-title';
      if (isSearching) title.textContent = `No matches for “${setlistSearchQuery}”`;
      else title.textContent = isCovers
        ? 'No covers yet'
        : isOriginals
          ? 'Originals coming soon'
          : isCustom
            ? 'No custom songs yet'
            : 'No tracks in this setlist';
      const sub = document.createElement('p');
      sub.className = 'metro-setlist-empty-sub';
      if (isSearching) sub.textContent = 'Try another title, artist or BPM. Scroll down for web results or create a custom song.';
      else sub.textContent = isCovers
        ? 'KINS covers will appear here once the catalogue lands. Tap Inspires to rehearse in the meantime.'
        : isOriginals
          ? 'KINS originals are in the oven — rehearse with Inspires tempos while you wait.'
          : isCustom
            ? 'Tap CREATE CUSTOM SONG above or add songs from search results. Your customs live here.'
            : 'Switch to another filter to find tempos.';
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'metro-setlist-empty-cta brutal-press';
      if (isSearching) {
        cta.innerHTML = '<i class="fa-solid fa-plus"></i> Create custom song';
        cta.addEventListener('click', () => openCustomForm(setlistSearchQuery));
      } else if (isCustom) {
        cta.innerHTML = '<i class="fa-solid fa-plus"></i> Create custom song';
        cta.addEventListener('click', () => openCustomForm(''));
      } else {
        cta.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Browse Inspires';
        cta.addEventListener('click', () => {
          if (activeSetlistFilter !== 'inspires') setActiveSetlistFilter('inspires');
        });
      }
      empty.appendChild(icon);
      empty.appendChild(title);
      empty.appendChild(sub);
      if (!isSearching && activeSetlistFilter !== 'inspires') empty.appendChild(cta);
      else if (isSearching || isCustom) empty.appendChild(cta);
      els.setlistList.appendChild(empty);
      // still show external section when searching even if local matches 0
      updateExternalVisibility();
      return;
    }

    entries.forEach((entry) => {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'metro-setlist-row-wrap';
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'metro-setlist-row brutal-press';
      row.dataset.title = entry.title;
      row.dataset.artist = entry.artist;
      row.dataset.bpm = String(entry.bpm);
      if (entry.inspirationId) row.dataset.inspirationId = entry.inspirationId;
      row.setAttribute('aria-label', `Load ${entry.bpm} BPM — ${entry.title} by ${entry.artist}`);
      const num = document.createElement('span');
      num.className = 'metro-setlist-bpm';
      num.textContent = `${entry.bpm}`;
      const text = document.createElement('span');
      text.className = 'metro-setlist-text';
      const title = document.createElement('span');
      title.className = 'metro-setlist-title';
      if (isSearching) title.innerHTML = highlightSearch(entry.title, setlistSearchQuery);
      else title.textContent = entry.title;
      // append custom badge if needed
      if (entry.category === 'custom' || entry.isCustom) {
        const badge = document.createElement('span');
        badge.className = 'metro-setlist-custom-badge';
        badge.textContent = 'CUSTOM';
        title.appendChild(badge);
      }
      const artist = document.createElement('span');
      artist.className = 'metro-setlist-artist';
      if (isSearching) artist.innerHTML = highlightSearch(entry.artist, setlistSearchQuery);
      else artist.textContent = entry.artist;
      text.appendChild(title);
      text.appendChild(artist);
      const load = document.createElement('span');
      load.className = 'metro-setlist-load';
      load.setAttribute('aria-hidden', 'true');
      load.textContent = 'SET';
      row.appendChild(num);
      row.appendChild(text);
      row.appendChild(load);
      row.addEventListener('click', () => {
        if (callbacks.onSetlistSelect) {
          callbacks.onSetlistSelect(entry);
        }
      });
      rowWrapper.appendChild(row);
      if (entry.category === 'custom' || entry.isCustom) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'metro-setlist-delete';
        del.setAttribute('aria-label', `Delete custom song ${entry.title}`);
        del.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteCustomEntry(entry);
        });
        rowWrapper.appendChild(del);
      }
      els.setlistList.appendChild(rowWrapper);
    });
    updateExternalVisibility();
  }

  function buildSetlist() {
    if (!els.setlistList) return;
    loadCustomEntries();
    renderSetlistFilters();
    renderSetlistList();
    bindSetlistSearch();
    updateCustomCountBadge();
    // close custom form initially
    if (els.customFormWrap) els.customFormWrap.hidden = true;
    if (els.setlistExternal) els.setlistExternal.hidden = true;
  }

  function updateCustomCountBadge() {
    if (!els.customCount) return;
    const n = customEntries.length;
    els.customCount.textContent = String(n);
    els.customCount.hidden = n === 0;
  }

  function renderSetlistFilters() {
    if (!els.setlistFilters) return;
    const buttons = els.setlistFilters.querySelectorAll('.metro-setlist-filter');
    buttons.forEach((btn) => {
      const f = btn.getAttribute('data-filter');
      const isActive = f === activeSetlistFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
      // update count badge where present
      const badge = btn.querySelector('.metro-setlist-filter-count');
      if (badge) {
        let count = 0;
        if (f === 'custom') count = customEntries.length;
        else {
          const entries = METRO_SETLIST_BY_CATEGORY[f] || [];
          count = entries.length;
        }
        badge.textContent = String(count);
        // for custom show only if >0, for others keep existing behavior
        if (f === 'custom') badge.hidden = count === 0;
        else badge.hidden = count === 0 && f !== 'inspires';
        // inspires always shows? keep 15 visible
        if (f === 'inspires') badge.hidden = false;
      } else if (f === 'covers' || f === 'originals') {
        // no badge element yet — fine, CSS handles empty
      }
      // attach once
      if (!btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => setActiveSetlistFilter(f));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const order = ['inspires', 'covers', 'originals', 'custom'];
            const idx = order.indexOf(activeSetlistFilter);
            let nextIdx = idx;
            if (e.key === 'ArrowRight') nextIdx = (idx + 1) % order.length;
            else nextIdx = (idx - 1 + order.length) % order.length;
            const nextBtn = els.setlistFilters.querySelector(`[data-filter="${order[nextIdx]}"]`);
            if (nextBtn) {
              setActiveSetlistFilter(order[nextIdx]);
              nextBtn.focus();
            }
          }
        });
      }
    });
  }

  function setActiveSetlistFilter(filter) {
    if (!['inspires', 'covers', 'originals', 'custom'].includes(filter)) return;
    if (filter === activeSetlistFilter && els.setlistList && els.setlistList.children.length && !setlistSearchActive) {
      // already active — still ensure visual sync
      renderSetlistFilters();
      return;
    }
    // if searching, clear search first? keep search query but switch pill visually; local list already filtered by search irrespective
    // To keep UX clear, when user taps a pill while searching we clear search
    if (setlistSearchActive && setlistSearchQuery) {
      clearSetlistSearch();
    }
    activeSetlistFilter = filter;
    renderSetlistFilters();
    renderSetlistList();
    closeCustomForm();
  }

  // ---------- Setlist search + external + custom ----------

  function bindSetlistSearch() {
    if (!els.setlistSearchToggle) return;
    if (els.setlistSearchToggle.dataset.bound) return;
    els.setlistSearchToggle.dataset.bound = '1';
    els.setlistSearchToggle.addEventListener('click', toggleSetlistSearch);
    if (els.setlistSearchInput) {
      els.setlistSearchInput.addEventListener('input', onSetlistSearchInput);
      els.setlistSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (setlistSearchQuery) {
            clearSetlistSearch();
            e.stopPropagation();
          } else {
            toggleSetlistSearch(false);
          }
        }
      });
    }
    if (els.setlistSearchClear) {
      els.setlistSearchClear.addEventListener('click', clearSetlistSearch);
    }
    if (els.setlistCreateBtn) {
      els.setlistCreateBtn.addEventListener('click', () => openCustomForm(setlistSearchQuery));
    }
  }

  function isSetlistSearchOpen() {
    return !!(els.setlistHeader && els.setlistHeader.classList.contains('search-open'));
  }

  function toggleSetlistSearch(force) {
    if (!els.setlistHeader || !els.setlistSearchToggle) return;
    const isOpen = isSetlistSearchOpen();
    const willOpen = typeof force === 'boolean' ? force : !isOpen;
    if (willOpen === isOpen) {
      els.setlistSearchToggle.setAttribute('aria-expanded', String(willOpen));
      return;
    }
    els.setlistHeader.classList.toggle('search-open', willOpen);
    els.setlistSearchToggle.setAttribute('aria-expanded', String(willOpen));
    // keep hidden inputs out of tab order while closed
    [els.setlistSearchInput, els.setlistSearchClear, els.setlistCreateBtn].forEach((el) => {
      if (el) el.tabIndex = willOpen ? 0 : -1;
    });
    if (willOpen) {
      if (els.setlistSearchWrap) els.setlistSearchWrap.setAttribute('aria-hidden', 'false');
      // focus input once the slide-in settles
      setTimeout(() => {
        if (!isSetlistSearchOpen()) return;
        if (els.setlistSearchInput) {
          els.setlistSearchInput.focus({ preventScroll: true });
          try { els.setlistSearchInput.select(); } catch (e) {}
        }
      }, 160);
    } else {
      if (els.setlistSearchWrap) els.setlistSearchWrap.setAttribute('aria-hidden', 'true');
      clearSetlistSearch();
      closeCustomForm();
      // return focus to the toggle so keyboard users aren't dropped
      try { els.setlistSearchToggle.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function clearSetlistSearch() {
    setlistSearchQuery = '';
    setlistSearchActive = false;
    if (els.setlistSearchInput) els.setlistSearchInput.value = '';
    if (els.setlistSearchClear) els.setlistSearchClear.hidden = true;
    externalResults = [];
    externalLoading = false;
    if (externalDebounceTimer) { clearTimeout(externalDebounceTimer); externalDebounceTimer = null; }
    if (searchDebounceTimer) { clearTimeout(searchDebounceTimer); searchDebounceTimer = null; }
    renderSetlistList();
    renderExternalResults();
    updateExternalVisibility();
  }

  function onSetlistSearchInput(e) {
    const val = (e.target && e.target.value) ? String(e.target.value) : '';
    setlistSearchQuery = val.trim();
    setlistSearchActive = setlistSearchQuery.length > 0;
    if (els.setlistSearchClear) els.setlistSearchClear.hidden = !setlistSearchQuery;
    // local filtering debounce
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      renderSetlistList();
    }, 120);
    // external search debounce
    if (externalDebounceTimer) clearTimeout(externalDebounceTimer);
    if (setlistSearchQuery.length >= 2) {
      externalDebounceTimer = setTimeout(() => {
        performExternalSearch(setlistSearchQuery);
      }, 350);
    } else {
      externalResults = [];
      externalLoading = false;
      renderExternalResults();
      updateExternalVisibility();
    }
  }

  function updateExternalVisibility() {
    if (!els.setlistExternal) return;
    const hasQuery = setlistSearchActive && setlistSearchQuery.length >= 2;
    const hasExternal = externalResults.length > 0 || externalLoading;
    // show external section only when searching with query >=2, even if local results exist — per spec we always offer web fallback
    if (hasQuery) {
      els.setlistExternal.hidden = false;
      // if not yet loaded, trigger loading placeholder via render
      if (!hasExternal && !externalLoading) {
        // keep visible but empty; render will show hint
      }
    } else {
      els.setlistExternal.hidden = true;
    }
  }

  async function performExternalSearch(query) {
    const gen = ++externalSearchGen;
    externalLoading = true;
    renderExternalResults();
    updateExternalVisibility();
    try {
      // iTunes Search API — completely free, unlimited, no key, CORS allowed
      // search by song title + optional artist (user typed full query; API does fuzzy)
      const term = encodeURIComponent(query);
      // entity=song&limit 8, media=music
      const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=8&media=music`;
      const res = await fetch(url);
      if (gen !== externalSearchGen) return;
      if (!res.ok) throw new Error('itunes failed');
      const data = await res.json();
      const results = (data.results || []).map((item) => ({
        title: item.trackName || item.collectionName || 'Unknown Title',
        artist: item.artistName || 'Unknown Artist',
        artwork: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '200x200') : '',
        previewUrl: item.previewUrl || '',
        trackId: item.trackId || null,
        collectionName: item.collectionName || ''
      }));
      externalResults = results;
    } catch (err) {
      console.warn('[metronome] iTunes search failed', err);
      externalResults = [];
    } finally {
      if (gen !== externalSearchGen) return;
      externalLoading = false;
      renderExternalResults();
      updateExternalVisibility();
    }
  }

  function renderExternalResults() {
    if (!els.setlistExternal) return;
    els.setlistExternal.textContent = '';
    if (!setlistSearchActive || setlistSearchQuery.length < 2) {
      els.setlistExternal.hidden = true;
      return;
    }
    const head = document.createElement('div');
    head.className = 'metro-setlist-external-head';
    if (externalLoading) {
      head.innerHTML = '<span><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> SEARCHING WEB…</span>';
      els.setlistExternal.appendChild(head);
      const loading = document.createElement('div');
      loading.className = 'metro-setlist-loading';
      loading.innerHTML = '<i class="fa-solid fa-spinner" aria-hidden="true"></i> Finding songs via iTunes…';
      els.setlistExternal.appendChild(loading);
      els.setlistExternal.hidden = false;
      return;
    }
    if (externalResults.length === 0) {
      head.innerHTML = '<span>WEB RESULTS — no external matches</span><span style="font-size:0.62rem;color:#71717a">Try artist + title</span>';
      els.setlistExternal.appendChild(head);
      const hint = document.createElement('p');
      hint.className = 'metro-setlist-empty-sub';
      hint.style.textAlign = 'center';
      hint.style.margin = '6px auto';
      hint.style.maxWidth = '28ch';
      hint.textContent = 'No web results for this query. Try a broader title or tap CREATE CUSTOM SONG to add it manually.';
      els.setlistExternal.appendChild(hint);
      els.setlistExternal.hidden = false;
      return;
    }
    head.innerHTML = `<span>WEB RESULTS — iTunes (BPM on add)</span><span style="font-size:0.62rem;color:#a1a1aa">${externalResults.length} songs</span>`;
    els.setlistExternal.appendChild(head);
    externalResults.forEach((item) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'metro-setlist-external-row brutal-press';
      row.setAttribute('aria-label', `Add ${item.title} by ${item.artist} to custom setlist`);
      const img = document.createElement('img');
      img.className = 'metro-setlist-external-art';
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      if (item.artwork) {
        img.src = item.artwork;
      } else {
        img.style.display = 'none';
      }
      img.onerror = () => { img.style.display = 'none'; };
      const text = document.createElement('span');
      text.className = 'metro-setlist-external-text';
      const title = document.createElement('span');
      title.className = 'metro-setlist-external-title';
      title.textContent = item.title;
      const artist = document.createElement('span');
      artist.className = 'metro-setlist-external-artist';
      artist.textContent = item.artist;
      text.appendChild(title);
      text.appendChild(artist);
      const add = document.createElement('span');
      add.className = 'metro-setlist-external-add';
      add.setAttribute('aria-hidden', 'true');
      add.innerHTML = '<i class="fa-solid fa-plus"></i> ADD';
      row.appendChild(img);
      row.appendChild(text);
      row.appendChild(add);
      row.addEventListener('click', () => fetchBpmAndAddCustom(item));
      els.setlistExternal.appendChild(row);
    });
    els.setlistExternal.hidden = false;
  }

  async function fetchBpmAndAddCustom(item) {
    const title = sanitizeForCustom(item.title);
    const artist = sanitizeForCustom(item.artist);
    if (!title) {
      showToast('Could not read song title', 'error');
      return;
    }
    // optimistic toast
    showToast(`Fetching BPM for “${title}”…`, 'info');
    try {
      // free unlimited BPM endpoint — no key required
      const u = `/api/song-bpm?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
      const res = await fetch(u);
      const data = await res.json().catch(() => ({}));
      let bpm = data && typeof data.bpm === 'number' ? data.bpm : null;
      if (!bpm || bpm < 20 || bpm > 300) {
        // deterministic hash fallback already provided by endpoint, but if endpoint fails we also hash
        bpm = hashBpm(title, artist);
      }
      const entry = { title, artist: artist || 'Unknown Artist', bpm: clampBpmLocal(bpm), category: 'custom', isCustom: true };
      addCustomEntry(entry, true);
      if (data && data.source === 'estimated') {
        showToast(`Added “${title}” at ${entry.bpm} BPM (estimated — tweak if needed)`, 'success');
      } else {
        showToast(`Added “${title}” at ${entry.bpm} BPM • ${data.source || 'BPM'}`, 'success');
      }
    } catch (err) {
      console.warn('[metronome] bpm fetch failed', err);
      const bpm = hashBpm(title, artist);
      const entry = { title, artist: artist || 'Unknown Artist', bpm, category: 'custom', isCustom: true };
      addCustomEntry(entry, true);
      showToast(`Added “${title}” at ${bpm} BPM (estimated)`, 'warning');
    }
  }

  function sanitizeForCustom(s) {
    return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 120);
  }
  function clampBpmLocal(n) {
    return Math.min(300, Math.max(20, Math.round(Number(n) || 120)));
  }
  function hashBpm(title, artist) {
    const str = `${title.toLowerCase().trim()}::${artist.toLowerCase().trim()}`;
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    h = Math.abs(h);
    return 70 + (h % 110);
  }

  function addCustomEntry(entry, switchToCustom) {
    // dedupe by title+artist case-insensitive
    const key = `${entry.title.toLowerCase()}::${entry.artist.toLowerCase()}`;
    const exists = customEntries.some((e) => `${e.title.toLowerCase()}::${e.artist.toLowerCase()}` === key);
    if (exists) {
      showToast(`“${entry.title}” is already in CUSTOM`, 'info');
      if (switchToCustom) setActiveSetlistFilter('custom');
      return;
    }
    customEntries.push(entry);
    saveCustomEntries();
    updateCustomCountBadge();
    renderSetlistFilters();
    if (switchToCustom) {
      activeSetlistFilter = 'custom';
      // clear search but keep pill active so user sees item
      clearSetlistSearch();
      // ensure search toggle stays closed? keep as is but ensure list shows
      renderSetlistFilters();
      renderSetlistList();
    } else {
      renderSetlistList();
    }
    // also clear external results highlighting?
    // inject directly into list if current filter is custom
  }

  function deleteCustomEntry(entry) {
    const before = customEntries.length;
    customEntries = customEntries.filter((e) => !(e.title === entry.title && e.artist === entry.artist && e.bpm === entry.bpm));
    // fallback fuzzy if exact bpm mismatch (user edited)
    if (customEntries.length === before) {
      customEntries = customEntries.filter((e) => !(e.title === entry.title && e.artist === entry.artist));
    }
    saveCustomEntries();
    updateCustomCountBadge();
    renderSetlistFilters();
    renderSetlistList();
    showToast(`Removed “${entry.title}” from CUSTOM`, 'info');
    if (customEntries.length === 0 && activeSetlistFilter === 'custom') {
      // keep on custom but show empty state
    }
  }

  function openCustomForm(prefillTitle) {
    if (!els.customFormWrap) return;
    // Build form fresh each open to avoid stale listeners
    els.customFormWrap.textContent = '';
    const form = document.createElement('form');
    form.className = 'metro-custom-form';
    form.setAttribute('novalidate', '');
    form.innerHTML = `
      <div class="metro-custom-form-head">
        <p class="metro-custom-form-title">CREATE CUSTOM SONG</p>
        <button type="button" class="metro-custom-form-close" aria-label="Close form"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      </div>
      <div class="metro-custom-field">
        <label class="metro-custom-label" for="metroCustomTitle">TITLE *</label>
        <input class="metro-custom-input" id="metroCustomTitle" type="text" maxlength="120" placeholder="e.g. Everlong" required autocomplete="off" />
        <span class="metro-custom-error" id="metroCustomTitleErr" hidden></span>
      </div>
      <div class="metro-custom-field">
        <label class="metro-custom-label" for="metroCustomArtist">ARTIST *</label>
        <input class="metro-custom-input" id="metroCustomArtist" type="text" maxlength="120" placeholder="e.g. Foo Fighters" required autocomplete="off" />
        <span class="metro-custom-error" id="metroCustomArtistErr" hidden></span>
      </div>
      <div class="metro-custom-field">
        <label class="metro-custom-label" for="metroCustomBpm">BPM (20–300) *</label>
        <input class="metro-custom-input" id="metroCustomBpm" type="number" inputmode="numeric" min="20" max="300" step="1" placeholder="e.g. 158" required />
        <span class="metro-custom-error" id="metroCustomBpmErr" hidden></span>
      </div>
      <div class="metro-custom-actions">
        <button type="button" class="metro-custom-cancel brutal-press" id="metroCustomCancel">CANCEL</button>
        <button type="submit" class="metro-custom-submit brutal-press" id="metroCustomSubmit"><i class="fa-solid fa-plus"></i> ADD TO CUSTOM</button>
      </div>
    `;
    els.customFormWrap.appendChild(form);
    els.customFormWrap.hidden = false;

    const titleInput = form.querySelector('#metroCustomTitle');
    const artistInput = form.querySelector('#metroCustomArtist');
    const bpmInput = form.querySelector('#metroCustomBpm');
    const titleErr = form.querySelector('#metroCustomTitleErr');
    const artistErr = form.querySelector('#metroCustomArtistErr');
    const bpmErr = form.querySelector('#metroCustomBpmErr');

    // prefill
    if (prefillTitle) {
      // if prefill contains " - " or " by ", try split; else treat as title
      const q = String(prefillTitle).trim();
      if (q) {
        // naive: if user searched "artist title" we can't split reliably, just fill title
        titleInput.value = q.slice(0, 120);
      }
    }

    const closeBtn = form.querySelector('.metro-custom-form-close');
    const cancelBtn = form.querySelector('#metroCustomCancel');
    const onClose = () => closeCustomForm();
    if (closeBtn) closeBtn.addEventListener('click', onClose);
    if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.preventDefault(); onClose(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      const t = sanitizeForCustom(titleInput.value);
      const a = sanitizeForCustom(artistInput.value);
      const b = clampBpmLocal(parseInt(bpmInput.value, 10));
      const rawB = bpmInput.value.trim();

      // validate
      if (!t) {
        titleErr.textContent = 'Title is required';
        titleErr.hidden = false;
        titleInput.classList.add('metro-custom-input--error');
        ok = false;
      } else {
        titleErr.hidden = true;
        titleInput.classList.remove('metro-custom-input--error');
      }
      if (!a) {
        artistErr.textContent = 'Artist is required';
        artistErr.hidden = false;
        artistInput.classList.add('metro-custom-input--error');
        ok = false;
      } else {
        artistErr.hidden = true;
        artistInput.classList.remove('metro-custom-input--error');
      }
      const parsed = parseInt(rawB, 10);
      if (!rawB || Number.isNaN(parsed) || parsed < 20 || parsed > 300) {
        bpmErr.textContent = 'Enter BPM between 20 and 300';
        bpmErr.hidden = false;
        bpmInput.classList.add('metro-custom-input--error');
        ok = false;
      } else {
        bpmErr.hidden = true;
        bpmInput.classList.remove('metro-custom-input--error');
      }
      if (!ok) return;

      const entry = { title: t, artist: a, bpm: b, category: 'custom', isCustom: true };
      addCustomEntry(entry, true);
      closeCustomForm();
      showToast(`Created “${t}” at ${b} BPM — in CUSTOM`, 'success');
    });

    // focus title
    setTimeout(() => { try { titleInput.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }

  function closeCustomForm() {
    if (!els.customFormWrap) return;
    els.customFormWrap.hidden = true;
    els.customFormWrap.textContent = '';
  }

  // ---------- Topbar setlist title / undo ----------
  function setTopbarCenterVisible(visible) {
    if (!els.topbarCenter) return;
    els.topbarCenter.hidden = !visible;
  }

  function showTopbarTitle(entry) {
    if (!els.topbarTitle || !els.topbarUndo) return;
    if (!entry || typeof entry.title !== 'string') return;
    lastSetlistEntry = entry;
    els.topbarTitle.textContent = entry.title;
    // full tooltip for accessibility — artist + BPM
    try { els.topbarTitle.title = `${entry.title} — ${entry.artist} • ${entry.bpm} BPM`; } catch (e) {}
    els.topbarTitle.hidden = false;
    els.topbarUndo.hidden = true;
    topbarTitleVisible = true;
    topbarUndoVisible = false;
    setTopbarCenterVisible(true);
  }

  function hideTopbarTitleShowUndo() {
    if (!els.topbarTitle || !els.topbarUndo) return;
    if (!topbarTitleVisible) return;
    if (!lastSetlistEntry) return;
    els.topbarTitle.hidden = true;
    els.topbarUndo.hidden = false;
    topbarTitleVisible = false;
    topbarUndoVisible = true;
    setTopbarCenterVisible(true);
  }

  function handleTopbarUndo() {
    if (!lastSetlistEntry) return;
    const entry = lastSetlistEntry;
    isRestoringFromUndo = true;
    if (callbacks.onTopbarUndo) {
      callbacks.onTopbarUndo(entry);
    }
    // flag cleared on next tick by index after it reshows title;
    // fallback auto-clear in case callback doesn't
    setTimeout(() => { isRestoringFromUndo = false; }, 50);
  }

  function notifyBpmChangedFromUser(newBpm) {
    if (isRestoringFromUndo) return;
    if (!topbarTitleVisible) return;
    if (!lastSetlistEntry) return;
    if (newBpm === lastSetlistEntry.bpm) return;
    hideTopbarTitleShowUndo();
  }

  function buildSoundRow() {
    if (!els.soundRow) return;
    METRO_SOUNDS.forEach((sound) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'metro-chip brutal-press';
      chip.dataset.sound = sound.id;
      chip.setAttribute('aria-pressed', 'false');
      chip.textContent = sound.label;
      chip.addEventListener('click', () => callbacks.onSoundSelect(sound.id));
      els.soundRow.appendChild(chip);
    });
  }

  // ---------- Coach editors ----------

  function escHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }

  function buildCoachTabs() {
    if (!els.coachTablist || !els.coachPanelsWrap) return;
    els.coachTablist.textContent = '';
    els.coachPanelsWrap.textContent = '';
    METRO_COACH_TABS.forEach((tab, index) => {
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = 'metro-coach-tab brutal-press';
      tabBtn.dataset.tab = tab.id;
      tabBtn.id = `metroCoachTab-${tab.id}`;
      tabBtn.setAttribute('role', 'tab');
      tabBtn.setAttribute('aria-selected', 'false');
      tabBtn.setAttribute('aria-controls', `metroCoachPanel-${tab.id}`);
      tabBtn.textContent = tab.label;
      tabBtn.addEventListener('click', () => selectCoachTab(tab.id));
      els.coachTablist.appendChild(tabBtn);

      const panel = document.createElement('div');
      panel.className = 'metro-coach-panel';
      panel.dataset.tabpanel = tab.id;
      panel.id = `metroCoachPanel-${tab.id}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `metroCoachTab-${tab.id}`);
      panel.hidden = true;
      // editor content
      if (tab.id === 'inner-clock') panel.appendChild(buildInnerClockEditor());
      else if (tab.id === 'speed-trainer') panel.appendChild(buildSpeedTrainerEditor());
      else if (tab.id === 'rhythm-step') panel.appendChild(buildRhythmStepEditor());
      else if (tab.id === 'tempo-primer') panel.appendChild(buildTempoPrimerEditor());
      els.coachPanelsWrap.appendChild(panel);
    });
    if (els.coachLive) {
      els.coachLive.textContent = '';
      els.coachLive.hidden = true;
    }
    if (els.coachLiveDock) {
      els.coachLiveDock.textContent = '';
      els.coachLiveDock.hidden = true;
    }
    if (els.coachBtn) els.coachBtn.hidden = false;
  }

  const INNER_RATIO_PRESETS = [
    { a: 1, m: 1, label: '1+1' },
    { a: 2, m: 1, label: '2+1' },
    { a: 3, m: 1, label: '3+1' },
    { a: 2, m: 2, label: '2+2' },
    { a: 4, m: 2, label: '4+2' },
    { a: 4, m: 4, label: '4+4' },
    { a: 6, m: 2, label: '6+2' },
    { a: 7, m: 1, label: '7+1' },
    { a: 8, m: 4, label: '8+4' },
    { a: 8, m: 8, label: '8+8' },
    { a: 12, m: 4, label: '12+4' },
    { a: 15, m: 1, label: '15+1' }
  ];

  function buildInnerClockEditor() {
    const wrap = document.createElement('div');
    wrap.className = 'metro-coach-card';
    wrap.style.width = '100%';
    const head = document.createElement('div');
    head.className = 'metro-coach-head';
    const t = document.createElement('p');
    t.className = 'metro-coach-card-title';
    t.textContent = METRO_COPY.coachInnerTitle;
    const b = document.createElement('p');
    b.className = 'metro-coach-card-blurb';
    b.textContent = METRO_COPY.coachInnerBlurb;
    head.appendChild(t); head.appendChild(b);

    const cycle = document.createElement('div');
    cycle.className = 'metro-coach-cycle';
    cycle.id = 'coachInnerCycle';
    cycle.style.flexWrap = 'nowrap';
    cycle.style.justifyContent = 'flex-start';
    cycle.style.overflowX = 'auto';
    cycle.style.whiteSpace = 'nowrap';

    // 2-Col independent sliders for Audible Bars & Muted Bars
    const gridBars = document.createElement('div');
    gridBars.className = 'metro-coach-two-col';

    // Audible Bars Field
    const colAudible = document.createElement('div');
    colAudible.className = 'metro-coach-field';
    const labAudible = document.createElement('div');
    labAudible.className = 'metro-coach-field-label';
    const aVal = metroState.coachInner.audibleBars;
    labAudible.innerHTML = `<span>AUDIBLE BARS</span><strong id="coachInnerAudibleLabel">${aVal} ${aVal === 1 ? 'Bar' : 'Bars'}</strong>`;

    const audibleSliderWrap = createCoachSliderWrap({
      id: 'coachInnerAudible',
      min: 1,
      max: 16,
      step: 1,
      value: aVal,
      ariaLabel: 'Audible bars count',
      steppers: false,
      onInput: (v) => {
        const val = Math.round(v);
        if (callbacks.onCoachInnerChange) callbacks.onCoachInnerChange({ audibleBars: val });
        const lab = document.getElementById('coachInnerAudibleLabel');
        if (lab) lab.textContent = `${val} ${val === 1 ? 'Bar' : 'Bars'}`;
        renderCoachInnerCycleOnly();
      },
      onChange: () => {
        renderCoachInner();
      }
    });
    colAudible.appendChild(labAudible);
    colAudible.appendChild(audibleSliderWrap);

    // Muted Bars Field
    const colMuted = document.createElement('div');
    colMuted.className = 'metro-coach-field';
    const labMuted = document.createElement('div');
    labMuted.className = 'metro-coach-field-label';
    const mVal = metroState.coachInner.mutedBars;
    labMuted.innerHTML = `<span>MUTED BARS</span><strong id="coachInnerMutedLabel">${mVal} ${mVal === 1 ? 'Bar' : 'Bars'}</strong>`;

    const mutedSliderWrap = createCoachSliderWrap({
      id: 'coachInnerMuted',
      min: 1,
      max: 16,
      step: 1,
      value: mVal,
      ariaLabel: 'Muted bars count',
      steppers: false,
      onInput: (v) => {
        const val = Math.round(v);
        if (callbacks.onCoachInnerChange) callbacks.onCoachInnerChange({ mutedBars: val });
        const lab = document.getElementById('coachInnerMutedLabel');
        if (lab) lab.textContent = `${val} ${val === 1 ? 'Bar' : 'Bars'}`;
        renderCoachInnerCycleOnly();
      },
      onChange: () => {
        renderCoachInner();
      }
    });
    colMuted.appendChild(labMuted);
    colMuted.appendChild(mutedSliderWrap);

    gridBars.appendChild(colAudible);
    gridBars.appendChild(colMuted);

    // Cycle Balance Presets (Single horizontal scrolling row)
    const fieldPresets = document.createElement('div');
    fieldPresets.className = 'metro-coach-field';
    const labPresets = document.createElement('div');
    labPresets.className = 'metro-coach-field-label';
    labPresets.innerHTML = `<span>CYCLE BALANCE PRESETS</span>`;

    const presetRow = document.createElement('div');
    presetRow.className = 'metro-coach-preset-row';
    presetRow.id = 'coachInnerPresetRow';

    INNER_RATIO_PRESETS.forEach((p) => {
      const qBtn = document.createElement('button');
      qBtn.type = 'button';
      qBtn.className = 'metro-coach-mini-chip brutal-press';
      qBtn.textContent = p.label;
      qBtn.dataset.audible = String(p.a);
      qBtn.dataset.muted = String(p.m);
      qBtn.style.padding = '5px 12px';
      qBtn.style.fontSize = '0.72rem';
      if (p.a === metroState.coachInner.audibleBars && p.m === metroState.coachInner.mutedBars) {
        qBtn.classList.add('active');
      }
      qBtn.addEventListener('click', () => {
        if (callbacks.onCoachInnerChange) callbacks.onCoachInnerChange({ audibleBars: p.a, mutedBars: p.m });
        renderCoachInner();
      });
      presetRow.appendChild(qBtn);
    });

    fieldPresets.appendChild(labPresets);
    fieldPresets.appendChild(presetRow);

    // Random Dropouts active-state button toggle
    const isRandom = !!metroState.coachInner.random;
    const randomBtn = document.createElement('button');
    randomBtn.type = 'button';
    randomBtn.id = 'coachInnerRandomBtn';
    randomBtn.className = 'metro-coach-toggle-btn brutal-press' + (isRandom ? ' active' : '');
    randomBtn.setAttribute('aria-pressed', isRandom ? 'true' : 'false');
    randomBtn.innerHTML = `<i class="fa-solid fa-shuffle" aria-hidden="true"></i> <span>${escHtml(METRO_COPY.coachRandomDropouts)}</span>`;
    randomBtn.addEventListener('click', () => {
      const nextRandom = !metroState.coachInner.random;
      if (callbacks.onCoachInnerChange) callbacks.onCoachInnerChange({ random: nextRandom });
      renderCoachInner();
    });

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'metro-coach-cta brutal-press';
    cta.dataset.coachStart = 'inner-clock';
    cta.innerHTML = '<i class="fa-solid fa-play"></i> ' + escHtml(METRO_COPY.coachStartSession);
    cta.addEventListener('click', () => { if (callbacks.onCoachStart) callbacks.onCoachStart('inner-clock'); });

    wrap.appendChild(head);
    wrap.appendChild(cycle);
    wrap.appendChild(gridBars);
    wrap.appendChild(fieldPresets);
    wrap.appendChild(randomBtn);
    wrap.appendChild(cta);
    return wrap;
  }

  function updateRangeTrackFill(rangeEl, min, max, val) {
    if (!rangeEl) return;
    const num = typeof val === 'number' ? val : (parseFloat(rangeEl.value) || min);
    const pct = Math.min(100, Math.max(0, ((num - min) / (max - min)) * 100));
    rangeEl.style.setProperty('--pct', `${pct}%`);
  }

  function createCoachSliderWrap({
    id,
    min,
    max,
    step = 1,
    value,
    ariaLabel = '',
    steppers = true,
    onInput,
    onChange
  }) {
    const wrap = document.createElement('div');
    wrap.className = 'metro-coach-slider-wrap' + (steppers ? '' : ' metro-coach-slider-wrap--clean');

    const trackBox = document.createElement('div');
    trackBox.className = 'metro-coach-track-box';

    const input = document.createElement('input');
    input.type = 'range';
    input.id = id;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.className = 'metro-coach-range';
    input.setAttribute('aria-label', ariaLabel || id);
    updateRangeTrackFill(input, min, max, value);

    input.addEventListener('input', () => {
      const v = parseFloat(input.value) || min;
      updateRangeTrackFill(input, min, max, v);
      if (onInput) onInput(v);
    });

    input.addEventListener('change', () => {
      const v = parseFloat(input.value) || min;
      updateRangeTrackFill(input, min, max, v);
      if (onChange) onChange(v);
    });

    trackBox.appendChild(input);

    if (steppers) {
      const btnMinus = document.createElement('button');
      btnMinus.type = 'button';
      btnMinus.className = 'metro-coach-step-btn brutal-press';
      btnMinus.setAttribute('aria-label', `Decrease ${ariaLabel || id}`);
      btnMinus.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';

      const btnPlus = document.createElement('button');
      btnPlus.type = 'button';
      btnPlus.className = 'metro-coach-step-btn brutal-press';
      btnPlus.setAttribute('aria-label', `Increase ${ariaLabel || id}`);
      btnPlus.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';

      const stepDelta = (delta) => {
        const cur = parseFloat(input.value) || min;
        const next = Math.min(max, Math.max(min, cur + delta * step));
        if (next !== cur) {
          input.value = String(next);
          updateRangeTrackFill(input, min, max, next);
          if (onInput) onInput(next);
          if (onChange) onChange(next);
        }
      };

      btnMinus.addEventListener('click', (e) => {
        e.preventDefault();
        stepDelta(-1);
      });

      btnPlus.addEventListener('click', (e) => {
        e.preventDefault();
        stepDelta(1);
      });

      wrap.appendChild(btnMinus);
      wrap.appendChild(trackBox);
      wrap.appendChild(btnPlus);
    } else {
      wrap.appendChild(trackBox);
    }

    return wrap;
  }

  function buildSpeedTrainerEditor() {
    const wrap = document.createElement('div');
    wrap.className = 'metro-coach-card';
    wrap.style.width = '100%';
    wrap.style.alignItems = 'stretch';
    wrap.style.textAlign = 'left';

    const head = document.createElement('div');
    head.className = 'metro-coach-head';
    const t = document.createElement('p');
    t.className = 'metro-coach-card-title';
    t.textContent = METRO_COPY.coachSpeedTitle;
    const b = document.createElement('p');
    b.className = 'metro-coach-card-blurb';
    b.textContent = METRO_COPY.coachSpeedBlurb;
    head.appendChild(t);
    head.appendChild(b);

    const cycle = document.createElement('div');
    cycle.className = 'metro-coach-cycle';
    cycle.id = 'coachSpeedCycle';

    // 2-Col independent sliders for Start Tempo & Target Tempo (presets removed)
    const gridRange = document.createElement('div');
    gridRange.className = 'metro-coach-two-col';

    const colStart = document.createElement('div');
    colStart.className = 'metro-coach-field';
    const labStart = document.createElement('div');
    labStart.className = 'metro-coach-field-label';
    labStart.innerHTML = `<span>START TEMPO</span><strong id="coachSpeedStartVal">${metroState.coachSpeed.start} BPM</strong>`;

    const startSliderWrap = createCoachSliderWrap({
      id: 'coachSpeedStart',
      min: 30,
      max: 300,
      step: 1,
      value: metroState.coachSpeed.start,
      ariaLabel: 'Workout start BPM',
      steppers: false,
      onInput: (v) => {
        const startBpm = Math.round(v);
        let targetBpm = metroState.coachSpeed.target;
        if (startBpm > targetBpm) targetBpm = startBpm;
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ start: startBpm, target: targetBpm });
        const lab = document.getElementById('coachSpeedStartVal');
        if (lab) lab.textContent = `${startBpm} BPM`;
        const tLab = document.getElementById('coachSpeedTargetVal');
        if (tLab) tLab.textContent = `${targetBpm} BPM`;
        const tSlider = document.getElementById('coachSpeedTarget');
        if (tSlider) {
          tSlider.value = String(targetBpm);
          updateRangeTrackFill(tSlider, 30, 300, targetBpm);
        }
        renderCoachSpeedSummaryOnly();
      },
      onChange: () => {
        renderCoachSpeed();
      }
    });
    colStart.appendChild(labStart);
    colStart.appendChild(startSliderWrap);

    const colTarget = document.createElement('div');
    colTarget.className = 'metro-coach-field';
    const labTarget = document.createElement('div');
    labTarget.className = 'metro-coach-field-label';
    labTarget.innerHTML = `<span>TARGET TEMPO</span><strong id="coachSpeedTargetVal">${metroState.coachSpeed.target} BPM</strong>`;

    const targetSliderWrap = createCoachSliderWrap({
      id: 'coachSpeedTarget',
      min: 30,
      max: 300,
      step: 1,
      value: metroState.coachSpeed.target,
      ariaLabel: 'Workout target BPM',
      steppers: false,
      onInput: (v) => {
        const targetBpm = Math.round(v);
        let startBpm = metroState.coachSpeed.start;
        if (targetBpm < startBpm) startBpm = targetBpm;
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ start: startBpm, target: targetBpm });
        const lab = document.getElementById('coachSpeedTargetVal');
        if (lab) lab.textContent = `${targetBpm} BPM`;
        const sLab = document.getElementById('coachSpeedStartVal');
        if (sLab) sLab.textContent = `${startBpm} BPM`;
        const sSlider = document.getElementById('coachSpeedStart');
        if (sSlider) {
          sSlider.value = String(startBpm);
          updateRangeTrackFill(sSlider, 30, 300, startBpm);
        }
        renderCoachSpeedSummaryOnly();
      },
      onChange: () => {
        renderCoachSpeed();
      }
    });
    colTarget.appendChild(labTarget);
    colTarget.appendChild(targetSliderWrap);

    gridRange.appendChild(colStart);
    gridRange.appendChild(colTarget);

    // Step Increment & Change Every X (2-Col clean sliders)
    const gridStep = document.createElement('div');
    gridStep.className = 'metro-coach-two-col';

    const colStep = document.createElement('div');
    colStep.className = 'metro-coach-field';
    const labStep = document.createElement('div');
    labStep.className = 'metro-coach-field-label';
    labStep.innerHTML = `<span>STEP INCREMENT</span><strong id="coachSpeedStepVal">+${metroState.coachSpeed.step} BPM</strong>`;
    const stepWrap = createCoachSliderWrap({
      id: 'coachSpeedStep',
      min: 1,
      max: 50,
      step: 1,
      value: metroState.coachSpeed.step,
      ariaLabel: 'Step increment BPM',
      steppers: false,
      onInput: (v) => {
        const val = Math.round(v);
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ step: val });
        const stVal = document.getElementById('coachSpeedStepVal');
        if (stVal) stVal.textContent = `+${val} BPM`;
        renderCoachSpeedSummaryOnly();
      },
      onChange: () => {
        renderCoachSpeed();
      }
    });
    colStep.appendChild(labStep);
    colStep.appendChild(stepWrap);

    const colInt = document.createElement('div');
    colInt.className = 'metro-coach-field';
    const labInt = document.createElement('div');
    labInt.className = 'metro-coach-field-label';
    labInt.innerHTML = `<span>CHANGE EVERY</span><strong id="coachSpeedEveryVal">${metroState.coachSpeed.everyBars} ${metroState.coachSpeed.unit === 'bars' ? 'Bars' : 'Beats'}</strong>`;

    const intWrap = createCoachSliderWrap({
      id: 'coachSpeedEvery',
      min: 1,
      max: 32,
      step: 1,
      value: metroState.coachSpeed.everyBars,
      ariaLabel: 'Interval amount',
      steppers: false,
      onInput: (v) => {
        const val = Math.round(v);
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ everyBars: val });
        const evLab = document.getElementById('coachSpeedEveryVal');
        if (evLab) evLab.textContent = `${val} ${metroState.coachSpeed.unit === 'bars' ? (val === 1 ? 'Bar' : 'Bars') : (val === 1 ? 'Beat' : 'Beats')}`;
        renderCoachSpeedSummaryOnly();
      },
      onChange: () => {
        renderCoachSpeed();
      }
    });
    colInt.appendChild(labInt);
    colInt.appendChild(intWrap);

    gridStep.appendChild(colStep);
    gridStep.appendChild(colInt);

    // Row split: Repeat toggle on left, Unit toggle (BARS / BEATS) on right
    const rowSplit = document.createElement('div');
    rowSplit.className = 'metro-coach-row-split';

    const isRepeat = !!metroState.coachSpeed.repeat;
    const repeatBtn = document.createElement('button');
    repeatBtn.type = 'button';
    repeatBtn.id = 'coachSpeedRepeatBtn';
    repeatBtn.className = 'metro-coach-toggle-btn brutal-press' + (isRepeat ? ' active' : '');
    repeatBtn.setAttribute('aria-pressed', isRepeat ? 'true' : 'false');
    repeatBtn.innerHTML = `<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> <span>${escHtml(METRO_COPY.coachRepeat)}</span>`;
    repeatBtn.style.flex = '1 1 auto';
    repeatBtn.style.maxWidth = '220px';
    repeatBtn.addEventListener('click', () => {
      const nextRepeat = !metroState.coachSpeed.repeat;
      if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ repeat: nextRepeat });
      renderCoachSpeed();
    });

    const unitToggle = document.createElement('div');
    unitToggle.className = 'metro-unit-toggle';
    unitToggle.id = 'coachSpeedUnitToggle';
    unitToggle.setAttribute('role', 'radiogroup');
    unitToggle.setAttribute('aria-label', 'Interval unit');

    const btnBars = document.createElement('button');
    btnBars.type = 'button';
    btnBars.className = `metro-unit-btn ${metroState.coachSpeed.unit === 'bars' ? 'active' : ''}`;
    btnBars.textContent = 'BARS';
    btnBars.dataset.unit = 'bars';

    const btnBeats = document.createElement('button');
    btnBeats.type = 'button';
    btnBeats.className = `metro-unit-btn ${metroState.coachSpeed.unit === 'beats' ? 'active' : ''}`;
    btnBeats.textContent = 'BEATS';
    btnBeats.dataset.unit = 'beats';

    const handleUnitSelect = (unit) => {
      if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ unit });
      btnBars.classList.toggle('active', unit === 'bars');
      btnBeats.classList.toggle('active', unit === 'beats');
      renderCoachSpeed();
    };

    btnBars.addEventListener('click', () => handleUnitSelect('bars'));
    btnBeats.addEventListener('click', () => handleUnitSelect('beats'));

    unitToggle.appendChild(btnBars);
    unitToggle.appendChild(btnBeats);

    rowSplit.appendChild(repeatBtn);
    rowSplit.appendChild(unitToggle);

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'metro-coach-cta brutal-press';
    cta.dataset.coachStart = 'speed-trainer';
    cta.innerHTML = '<i class="fa-solid fa-play"></i> ' + escHtml(METRO_COPY.coachStartSession);
    cta.addEventListener('click', () => { if (callbacks.onCoachStart) callbacks.onCoachStart('speed-trainer'); });

    wrap.appendChild(head);
    wrap.appendChild(cycle);
    wrap.appendChild(gridRange);
    wrap.appendChild(gridStep);
    wrap.appendChild(rowSplit);
    wrap.appendChild(cta);
    return wrap;
  }

  function buildRhythmStepEditor() {
    const wrap=document.createElement('div');
    wrap.className='metro-coach-card'; wrap.style.width='100%'; wrap.style.alignItems='stretch'; wrap.style.textAlign='left';
    const head=document.createElement('div'); head.className='metro-coach-head';
    const t=document.createElement('p'); t.className='metro-coach-card-title'; t.textContent=METRO_COPY.coachRhythmTitle;
    const b=document.createElement('p'); b.className='metro-coach-card-blurb'; b.textContent=METRO_COPY.coachRhythmBlurb;
    head.appendChild(t); head.appendChild(b);
    const cycle=document.createElement('div'); cycle.className='metro-coach-cycle'; cycle.id='coachRhythmCycle';

    const patField=document.createElement('div'); patField.className='metro-coach-field';
    const patLabel=document.createElement('div'); patLabel.className='metro-coach-field-label'; patLabel.innerHTML=`<span>${escHtml(METRO_COPY.coachSubdivisionPattern)}</span>`;
    const patRow=document.createElement('div'); patRow.className='metro-coach-pill-row mono'; patRow.id='coachRhythmPatternRow';
    patRow.style.display = 'flex';
    patRow.style.flexWrap = 'nowrap';
    patRow.style.overflowX = 'auto';
    patRow.style.overflowY = 'hidden';
    patRow.style.gap = '8px';
    patRow.style.padding = '4px 2px 8px';
    patRow.style.webkitOverflowScrolling = 'touch';
    const subs = ['1-4','1-4t','1-8','1-8t','1-16','1-16t','1-32'];
    const labels = {'1-4':'1/4','1-4t':'1/4T','1-8':'1/8','1-8t':'1/8T','1-16':'1/16','1-16t':'1/16T','1-32':'1/32'};
    subs.forEach(id => {
      const btn=document.createElement('button'); btn.type='button'; btn.className='metro-coach-mini-chip brutal-press'; btn.dataset.sub=id; btn.textContent=labels[id]||id;
      btn.style.flex = '0 0 auto';
      btn.style.minWidth = '64px';
      btn.style.minHeight = '36px';
      const active = metroState.coachRhythm.pattern.includes(id);
      if (active) btn.classList.add('active');
      btn.addEventListener('click', () => {
        let pat = metroState.coachRhythm.pattern.slice();
        if (pat.includes(id)) {
          if (pat.length <= 1) { showToast('Keep at least one subdivision', 'info'); return; }
          pat = pat.filter(x=>x!==id);
        } else {
          pat.push(id);
        }
        if (callbacks.onCoachRhythmChange) callbacks.onCoachRhythmChange({ pattern: pat });
        // update UI
        patRow.querySelectorAll('.metro-coach-mini-chip').forEach(c=> {
          const isActive = pat.includes(c.dataset.sub);
          c.classList.toggle('active', isActive);
        });
        renderCoachRhythm();
      });
      patRow.appendChild(btn);
    });
    patField.appendChild(patLabel); patField.appendChild(patRow);

    const everyField=document.createElement('div'); everyField.className='metro-coach-field';
    const everyLabelRow=document.createElement('div'); everyLabelRow.className='metro-coach-field-label'; everyLabelRow.innerHTML=`<span>${escHtml(METRO_COPY.coachChangeEvery)}</span><strong id="coachRhythmEveryLabel">${metroState.coachRhythm.everyBars} Bars</strong>`;
    const everySliderWrap = createCoachSliderWrap({
      id: 'coachRhythmEvery',
      min: 1,
      max: 32,
      step: 1,
      value: metroState.coachRhythm.everyBars,
      ariaLabel: 'Change every bars',
      onInput: (v) => {
        const val = Math.round(v);
        if (callbacks.onCoachRhythmChange) callbacks.onCoachRhythmChange({ everyBars: val });
        const evLab = document.getElementById('coachRhythmEveryLabel');
        if (evLab) evLab.textContent = `${val} Bars`;
        const cyc = document.getElementById('coachRhythmCycle');
        if (cyc) {
          const pat = metroState.coachRhythm.pattern.map((id) => labels[id] || id).join(' → ');
          cyc.innerHTML = `<span>${escHtml(METRO_COPY.coachCycle)}:</span> <strong>${escHtml(pat)} (${val} BARS)</strong>`;
        }
      },
      onChange: () => {
        renderCoachRhythm();
      }
    });

    const quickBarRow = document.createElement('div');
    quickBarRow.className = 'metro-coach-pill-row';
    quickBarRow.style.marginTop = '4px';
    [2, 4, 8, 16].forEach((bars) => {
      const qBtn = document.createElement('button');
      qBtn.type = 'button';
      qBtn.className = 'metro-coach-mini-chip brutal-press';
      qBtn.textContent = `${bars} BARS`;
      qBtn.style.padding = '4px 10px';
      qBtn.style.fontSize = '0.7rem';
      qBtn.addEventListener('click', () => {
        if (callbacks.onCoachRhythmChange) callbacks.onCoachRhythmChange({ everyBars: bars });
        renderCoachRhythm();
      });
      quickBarRow.appendChild(qBtn);
    });

    everyField.appendChild(everyLabelRow);
    everyField.appendChild(everySliderWrap);
    everyField.appendChild(quickBarRow);

    const polyRow=document.createElement('label'); polyRow.className='metro-toggle';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.id='coachRhythmPoly'; cb.checked=!!metroState.coachRhythm.poly;
    const track=document.createElement('span'); track.className='metro-toggle-track'; track.setAttribute('aria-hidden','true'); const knob=document.createElement('span'); knob.className='metro-toggle-knob'; track.appendChild(knob);
    const txt=document.createElement('span'); txt.className='metro-toggle-text'; txt.textContent=METRO_COPY.coachPolyGrid;
    polyRow.appendChild(cb); polyRow.appendChild(track); polyRow.appendChild(txt);
    cb.addEventListener('change', () => { if (callbacks.onCoachRhythmChange) callbacks.onCoachRhythmChange({ poly: cb.checked }); });

    const cta=document.createElement('button'); cta.type='button'; cta.className='metro-coach-cta brutal-press'; cta.dataset.coachStart='rhythm-step'; cta.innerHTML='<i class="fa-solid fa-play"></i> ' + escHtml(METRO_COPY.coachStartSession);
    cta.addEventListener('click', () => { if (callbacks.onCoachStart) callbacks.onCoachStart('rhythm-step'); });

    wrap.appendChild(head); wrap.appendChild(cycle); wrap.appendChild(patField); wrap.appendChild(everyField); wrap.appendChild(polyRow); wrap.appendChild(cta);
    return wrap;
  }

  function buildTempoPrimerEditor() {
    const wrap=document.createElement('div');
    wrap.className='metro-coach-card'; wrap.style.width='100%'; wrap.style.alignItems='stretch'; wrap.style.textAlign='left';
    const head=document.createElement('div'); head.className='metro-coach-head';
    const t=document.createElement('p'); t.className='metro-coach-card-title'; t.textContent=METRO_COPY.coachPrimerTitle;
    const b=document.createElement('p'); b.className='metro-coach-card-blurb'; b.textContent=METRO_COPY.coachPrimerBlurb;
    head.appendChild(t); head.appendChild(b);
    const cycle=document.createElement('div'); cycle.className='metro-coach-cycle'; cycle.id='coachPrimerCycle'; cycle.innerHTML=`<span>${escHtml(METRO_COPY.coachCycle)}:</span> <strong>4-HIT UNASSISTED RECALL</strong>`;

    const diffGrid=document.createElement('div'); diffGrid.className='metro-coach-diff-grid'; diffGrid.id='coachPrimerDiffGrid';
    const diffs=[
      {id:'easy', label:'Easy', sub:'Multiples of 10'},
      {id:'medium', label:'Medium', sub:'Multiples of 5'},
      {id:'hard', label:'Hard', sub:'Maelzel Markings'},
      {id:'expert', label:'Expert', sub:'Exact 1-BPM'}
    ];
    diffs.forEach(d=>{
      const btn=document.createElement('button'); btn.type='button'; btn.className='metro-coach-diff-btn brutal-press'; btn.dataset.diff=d.id;
      if (metroState.coachPrimer.difficulty===d.id) btn.classList.add('active');
      const title=document.createElement('span'); title.className='metro-coach-diff-btn-title'; title.textContent=d.label;
      const sub=document.createElement('span'); sub.className='metro-coach-diff-btn-sub'; sub.textContent=d.sub;
      btn.appendChild(title); btn.appendChild(sub);
      btn.addEventListener('click', ()=>{
        if (callbacks.onCoachPrimerChange) callbacks.onCoachPrimerChange({ difficulty: d.id });
        diffGrid.querySelectorAll('.metro-coach-diff-btn').forEach(x=>x.classList.toggle('active', x.dataset.diff===d.id));
        renderCoachPrimer();
      });
      diffGrid.appendChild(btn);
    });
    const diffBlurb=document.createElement('p'); diffBlurb.id='coachPrimerDiffBlurb'; diffBlurb.style.margin='0'; diffBlurb.style.fontFamily='var(--font-secondary)'; diffBlurb.style.fontSize='0.72rem'; diffBlurb.style.fontWeight='700'; diffBlurb.style.color='#D8B244'; diffBlurb.style.textAlign='center';
    diffBlurb.textContent='Builds foundational internal tempo memory';

    const tapArea=document.createElement('button'); tapArea.type='button'; tapArea.className='metro-coach-tap-area brutal-press'; tapArea.id='coachPrimerTapArea';
    const tapTitle=document.createElement('span'); tapTitle.className='metro-coach-tap-title'; tapTitle.textContent='TAP HERE OR HIT MIDI DRUM PAD';
    const tapSub=document.createElement('span'); tapSub.className='metro-coach-tap-sub'; tapSub.id='coachPrimerTapSub'; tapSub.textContent=METRO_COPY.midiTapHint;
    const midiBadge=document.createElement('span'); midiBadge.id='coachPrimerMidiBadge'; midiBadge.style.fontSize='0.62rem'; midiBadge.style.color='#a1a1aa'; midiBadge.style.display='none'; midiBadge.textContent='● MIDI connected';
    tapArea.appendChild(tapTitle); tapArea.appendChild(tapSub); tapArea.appendChild(midiBadge);
    tapArea.addEventListener('click', ()=> {
      if (callbacks.onPrimerTap) callbacks.onPrimerTap(performance.now());
    });
    tapArea.addEventListener('pointerdown', (e)=>{ e.preventDefault(); });

    const cta=document.createElement('button'); cta.type='button'; cta.className='metro-coach-cta brutal-press'; cta.dataset.coachStart='tempo-primer'; cta.innerHTML='<i class="fa-solid fa-play"></i> ' + escHtml(METRO_COPY.coachStartSession);
    cta.addEventListener('click', () => { if (callbacks.onCoachStart) callbacks.onCoachStart('tempo-primer'); });

    wrap.appendChild(head); wrap.appendChild(cycle); wrap.appendChild(diffGrid); wrap.appendChild(diffBlurb); wrap.appendChild(tapArea); wrap.appendChild(cta);
    return wrap;
  }

  function selectCoachTab(tabId) {
    coachTab = tabId;
    if (metroState) metroState.coachTab = tabId;
    if (callbacks.onCoachTabChange) callbacks.onCoachTabChange(tabId);
    const tabs = els.coachTablist ? els.coachTablist.querySelectorAll('.metro-coach-tab') : [];
    tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === tabId ? 'true' : 'false'));
    if (els.coachPanelsWrap) {
      els.coachPanelsWrap.querySelectorAll('.metro-coach-panel').forEach((p) => {
        const isActive = p.dataset.tabpanel === tabId;
        p.hidden = isActive ? false : true;
      });
    }
    // dock live is outside sheet — never hide panels because of live; editors stay accessible when sheet reopened
    if (tabId === 'inner-clock') renderCoachInner();
    else if (tabId === 'speed-trainer') renderCoachSpeed();
    else if (tabId === 'rhythm-step') renderCoachRhythm();
    else if (tabId === 'tempo-primer') renderCoachPrimer();
  }

  function renderCoachInnerCycleOnly() {
    const cyc = document.getElementById('coachInnerCycle');
    if (!cyc) return;
    const a = metroState.coachInner.audibleBars;
    const m = metroState.coachInner.mutedBars;
    const rand = metroState.coachInner.random;
    cyc.textContent = '';
    const pre = document.createElement('span'); pre.textContent = METRO_COPY.coachCycle + ': '; pre.style.flexShrink='0';
    cyc.appendChild(pre);
    const row = document.createElement('span');
    row.style.display='inline-flex'; row.style.alignItems='center'; row.style.gap='3px'; row.style.flexWrap='nowrap';
    const mk = (count, cls) => {
      for(let i=0;i<count;i++){
        const chip=document.createElement('span'); chip.className='metro-cycle-chip ' + cls; chip.textContent = cls==='audible' ? 'A' : 'M';
        row.appendChild(chip);
      }
    };
    mk(a,'audible');
    const plus=document.createElement('span'); plus.textContent=' + '; plus.style.fontWeight='800'; plus.style.margin='0 2px';
    row.appendChild(plus);
    mk(m,'muted');
    if (rand) {
      const rnd=document.createElement('span'); rnd.textContent=' • RANDOM'; rnd.style.color='#D8B244'; rnd.style.fontSize='0.66rem'; rnd.style.marginLeft='4px';
      row.appendChild(rnd);
    }
    cyc.appendChild(row);
  }

  function renderCoachInner() {
    renderCoachInnerCycleOnly();
    const a = metroState.coachInner.audibleBars;
    const m = metroState.coachInner.mutedBars;
    const rand = metroState.coachInner.random;

    const audLab = document.getElementById('coachInnerAudibleLabel');
    if (audLab) audLab.textContent = `${a} ${a === 1 ? 'Bar' : 'Bars'}`;
    const mutLab = document.getElementById('coachInnerMutedLabel');
    if (mutLab) mutLab.textContent = `${m} ${m === 1 ? 'Bar' : 'Bars'}`;

    const audSlider = document.getElementById('coachInnerAudible');
    if (audSlider) {
      if (document.activeElement !== audSlider) audSlider.value = String(a);
      updateRangeTrackFill(audSlider, 1, 16, a);
    }
    const mutSlider = document.getElementById('coachInnerMuted');
    if (mutSlider) {
      if (document.activeElement !== mutSlider) mutSlider.value = String(m);
      updateRangeTrackFill(mutSlider, 1, 16, m);
    }

    const randBtn = document.getElementById('coachInnerRandomBtn');
    if (randBtn) {
      randBtn.classList.toggle('active', !!rand);
      randBtn.setAttribute('aria-pressed', rand ? 'true' : 'false');
    }

    const presetRow = document.getElementById('coachInnerPresetRow');
    if (presetRow) {
      presetRow.querySelectorAll('.metro-coach-mini-chip').forEach((chip) => {
        const chipA = parseInt(chip.dataset.audible, 10);
        const chipM = parseInt(chip.dataset.muted, 10);
        chip.classList.toggle('active', chipA === a && chipM === m);
      });
    }
  }

  function renderCoachSpeedSummaryOnly() {
    const s = metroState.coachSpeed;
    const cyc = document.getElementById('coachSpeedCycle');
    if (cyc) {
      const repTxt = s.repeat ? ' • REPEAT ON' : '';
      cyc.innerHTML = `<span>${escHtml(METRO_COPY.coachCycle)}:</span> <strong>${s.start} → ${s.target} BPM (+${s.step} / ${s.everyBars} ${s.unit.toUpperCase()}${repTxt})</strong>`;
    }
  }

  function renderCoachSpeed() {
    renderCoachSpeedSummaryOnly();
    const s = metroState.coachSpeed;
    const sEl = document.getElementById('coachSpeedStart');
    const tEl = document.getElementById('coachSpeedTarget');
    const stEl = document.getElementById('coachSpeedStep');
    const evEl = document.getElementById('coachSpeedEvery');
    const repBtn = document.getElementById('coachSpeedRepeatBtn');

    if (sEl) {
      if (document.activeElement !== sEl) sEl.value = String(s.start);
      updateRangeTrackFill(sEl, 30, 300, s.start);
    }
    if (tEl) {
      if (document.activeElement !== tEl) tEl.value = String(s.target);
      updateRangeTrackFill(tEl, 30, 300, s.target);
    }
    if (stEl) {
      if (document.activeElement !== stEl) stEl.value = String(s.step);
      updateRangeTrackFill(stEl, 1, 50, s.step);
    }
    if (evEl) {
      if (document.activeElement !== evEl) evEl.value = String(s.everyBars);
      updateRangeTrackFill(evEl, 1, 32, s.everyBars);
    }
    if (repBtn) {
      repBtn.classList.toggle('active', !!s.repeat);
      repBtn.setAttribute('aria-pressed', s.repeat ? 'true' : 'false');
    }
    const sVal = document.getElementById('coachSpeedStartVal');
    if (sVal) sVal.textContent = `${s.start} BPM`;
    const tVal = document.getElementById('coachSpeedTargetVal');
    if (tVal) tVal.textContent = `${s.target} BPM`;
    const stVal = document.getElementById('coachSpeedStepVal');
    if (stVal) stVal.textContent = `+${s.step} BPM`;
    const evVal = document.getElementById('coachSpeedEveryVal');
    if (evVal) evVal.textContent = `${s.everyBars} ${s.unit === 'bars' ? (s.everyBars === 1 ? 'Bar' : 'Bars') : (s.everyBars === 1 ? 'Beat' : 'Beats')}`;
    const unitToggle = document.getElementById('coachSpeedUnitToggle');
    if (unitToggle) {
      unitToggle.querySelectorAll('.metro-unit-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.unit === s.unit);
      });
    }
  }

  function renderCoachRhythm() {
    const cfg = metroState.coachRhythm;
    const cyc = document.getElementById('coachRhythmCycle');
    const everyLab = document.getElementById('coachRhythmEveryLabel');
    const labels = {'1-4':'1/4','1-4t':'1/4T','1-8':'1/8','1-8t':'1/8T','1-16':'1/16','1-16t':'1/16T','1-32':'1/32'};
    if (cyc) {
      const pat = cfg.pattern.map(id=>labels[id]||id).join(' → ');
      cyc.innerHTML = `<span>${escHtml(METRO_COPY.coachCycle)}:</span> <strong>${escHtml(pat)} (${cfg.everyBars} BARS)</strong>`;
    }
    if (everyLab) everyLab.textContent = `${cfg.everyBars} Bars`;
    const slider = document.getElementById('coachRhythmEvery');
    if (slider) {
      if (document.activeElement !== slider) slider.value = String(cfg.everyBars);
      updateRangeTrackFill(slider, 1, 32, cfg.everyBars);
    }
    const poly = document.getElementById('coachRhythmPoly');
    if (poly) poly.checked = !!cfg.poly;
  }

  function renderCoachPrimer() {
    const p = metroState.coachPrimer;
    const blurb = document.getElementById('coachPrimerDiffBlurb');
    const diffMap = {
      easy: 'Builds foundational internal tempo memory',
      medium: 'Tightens recall to 5-BPM granularity',
      hard: 'Maelzel markings — classical tempo memory',
      expert: 'Exact 1-BPM recall — professional grade'
    };
    if (blurb) blurb.textContent = diffMap[p.difficulty] || diffMap.easy;
    const grid = document.getElementById('coachPrimerDiffGrid');
    if (grid) {
      grid.querySelectorAll('.metro-coach-diff-btn').forEach((x) => {
        x.classList.toggle('active', x.dataset.diff === p.difficulty);
      });
    }
    const badge = document.getElementById('coachPrimerMidiBadge');
    if (badge) {
      const isConnected = metroState.midiStatus === 'connected';
      badge.style.display = isConnected ? 'block' : 'none';
      badge.style.color = isConnected ? '#22c55e' : '#a1a1aa';
    }
  }

  // ---------- Coach Live (dock takes over COACH DECK button, outside sheet) ----------

  function enterCoachLive(tabId) {
    coachLiveRunning = true;
    coachLiveTab = tabId;
    // hide the COACH DECK button, show live dock in its place, close sheet to reveal full page
    if (els.coachBtn) {
      els.coachBtn.hidden = true;
      els.coachBtn.classList.add('is-live-hidden');
      els.coachBtn.setAttribute('aria-hidden', 'true');
    }
    if (els.coachLiveDock) els.coachLiveDock.hidden = false;
    if (sheetOpen) closeSheet();
    // keep sheet tabs enabled for when user reopens
    if (els.coachTablist) {
      els.coachTablist.querySelectorAll('.metro-coach-tab').forEach(t=>{
        t.disabled = false;
        t.style.opacity = '1';
      });
    }
    renderCoachLive(null);
  }

  function exitCoachLive() {
    coachLiveRunning = false;
    coachLiveTab = null;
    if (els.coachLiveDock) { els.coachLiveDock.hidden = true; els.coachLiveDock.textContent = ''; }
    if (els.coachLive) { els.coachLive.hidden = true; els.coachLive.textContent = ''; }
    if (els.coachBtn) {
      els.coachBtn.hidden = false;
      els.coachBtn.classList.remove('is-live-hidden');
      els.coachBtn.removeAttribute('aria-hidden');
    }
    if (els.coachTablist) {
      els.coachTablist.querySelectorAll('.metro-coach-tab').forEach(t=>{
        t.disabled = false;
        t.style.opacity = '1';
      });
    }
    selectCoachTab(coachTab);
  }

  function renderCoachLive(snapshot) {
    if (!coachLiveRunning) return;
    const dock = els.coachLiveDock || els.coachLive;
    if (!dock) return;
    const tabId = coachLiveTab || coachTab;
    dock.textContent = '';
    const card = document.createElement('div');
    card.className='metro-coach-live-card';

    const head=document.createElement('div'); head.className='metro-coach-live-head';
    const badge=document.createElement('span'); badge.className='metro-coach-live-badge';
    badge.innerHTML = `<i class="fa-solid fa-circle" style="font-size:0.5rem;color:#c0392b;animation:midiPulse 1s infinite alternate"></i> ${METRO_COPY.coachLive}`;
    const title=document.createElement('span'); title.style.fontFamily='var(--font-secondary)'; title.style.fontSize='0.72rem'; title.style.fontWeight='800'; title.style.letterSpacing='0.08em'; title.style.color='#a1a1aa'; title.textContent = tabId.replace('-',' ').toUpperCase();
    head.appendChild(badge); head.appendChild(title);

    let phaseEl, subEl, progFill;

    if (tabId==='inner-clock') {
      const snap = snapshot || { phase: metroState.coachInner.random ? 'AUDIBLE' : 'AUDIBLE', phaseBar:0, barCount:0 };
      const isMuted = snapshot ? snapshot.phase === 'muted' : false;
      phaseEl=document.createElement('div'); phaseEl.className='metro-coach-live-phase' + (isMuted?' muted':'');
      phaseEl.textContent = isMuted ? '○ MUTED' : '● AUDIBLE';
      subEl=document.createElement('div'); subEl.className='metro-coach-live-sub';
      const a=metroState.coachInner.audibleBars; const m=metroState.coachInner.mutedBars;
      const phaseBar = snapshot ? snapshot.phaseBar : 0;
      const phaseTotal = isMuted ? m : a;
      subEl.textContent = `Bar ${phaseBar+1}/${phaseTotal} • Next: ${isMuted ? 'AUDIBLE' : 'MUTED'} in ${Math.max(0, phaseTotal - phaseBar - 1)} bars • Total bars ${snapshot ? snapshot.barCount : 0}`;
      const prog=document.createElement('div'); prog.className='metro-coach-progress';
      progFill=document.createElement('div'); progFill.className='metro-coach-progress-fill';
      const pct = phaseTotal ? (phaseBar+1)/phaseTotal : 0;
      progFill.style.transform = `scaleX(${Math.min(1, pct)})`;
      prog.appendChild(progFill);
      card.appendChild(head); card.appendChild(phaseEl); card.appendChild(subEl); card.appendChild(prog);
    } else if (tabId==='speed-trainer') {
      const s=metroState.coachSpeed;
      const cur = snapshot ? snapshot.currentBpm : s.start;
      const stepIdx = snapshot ? snapshot.speedStepIdx : 0;
      const steps = snapshot ? snapshot.speedSteps : Math.ceil(Math.abs(s.target - s.start)/s.step);
      phaseEl=document.createElement('div'); phaseEl.className='metro-coach-live-phase';
      phaseEl.textContent = `${cur} BPM → ${s.target} BPM`;
      subEl=document.createElement('div'); subEl.className='metro-coach-live-sub';
      subEl.textContent = `Step ${stepIdx}/${steps} • +${s.step} every ${s.everyBars} ${s.unit} • Bar ${snapshot ? snapshot.barCount : 0}`;
      const prog=document.createElement('div'); prog.className='metro-coach-progress';
      progFill=document.createElement('div'); progFill.className='metro-coach-progress-fill';
      const pct = steps ? stepIdx/steps : 0;
      progFill.style.transform = `scaleX(${Math.min(1,pct)})`;
      prog.appendChild(progFill);
      card.appendChild(head); card.appendChild(phaseEl); card.appendChild(subEl); card.appendChild(prog);
      if (s.repeat) {
        const repBadge=document.createElement('span'); repBadge.textContent='↻ REPEAT ON'; repBadge.style.fontSize='0.66rem'; repBadge.style.color='#D8B244'; repBadge.style.fontWeight='800'; card.appendChild(repBadge);
      }
    } else if (tabId==='rhythm-step') {
      const pat=metroState.coachRhythm.pattern;
      const idx = snapshot ? snapshot.rhythmIdx : 0;
      const curId = pat[idx] || pat[0];
      const labels={'1-4':'1/4','1-4t':'1/4T','1-8':'1/8','1-8t':'1/8T','1-16':'1/16','1-16t':'1/16T','1-32':'1/32'};
      phaseEl=document.createElement('div'); phaseEl.className='metro-coach-live-phase'; phaseEl.textContent = labels[curId] || curId;
      subEl=document.createElement('div'); subEl.className='metro-coach-live-sub';
      const nextIdx = (idx+1)%pat.length;
      subEl.textContent = `Pattern ${idx+1}/${pat.length} • Next: ${labels[pat[nextIdx]]} in ${Math.max(0, metroState.coachRhythm.everyBars - (snapshot ? snapshot.barCount % metroState.coachRhythm.everyBars : 0))} bars`;
      const dotsRow=document.createElement('div'); dotsRow.style.display='flex'; dotsRow.style.gap='6px'; dotsRow.style.flexWrap='wrap';
      pat.forEach((id,i)=>{
        const chip=document.createElement('span'); chip.className='metro-cycle-chip'; chip.textContent=labels[id];
        chip.style.opacity = i===idx ? '1' : '0.45';
        if(i===idx) chip.style.background='#D8B244';
        dotsRow.appendChild(chip);
      });
      const prog=document.createElement('div'); prog.className='metro-coach-progress';
      progFill=document.createElement('div'); progFill.className='metro-coach-progress-fill';
      const every=metroState.coachRhythm.everyBars;
      const barMod = snapshot ? snapshot.barCount % every : 0;
      progFill.style.transform = `scaleX(${barMod / Math.max(1,every)})`;
      prog.appendChild(progFill);
      card.appendChild(head); card.appendChild(phaseEl); card.appendChild(subEl); card.appendChild(dotsRow); card.appendChild(prog);
      if (metroState.coachRhythm.poly) {
        const poly=document.createElement('div'); poly.style.fontSize='0.68rem'; poly.style.color='#D8B244'; poly.textContent='Polyrhythmic grid active • ' + metroState.coachRhythm.polyRatio;
        card.appendChild(poly);
      }
    } else if (tabId==='tempo-primer') {
      const target = snapshot ? snapshot.primerTarget : metroState.coachPrimer.target;
      phaseEl=document.createElement('div'); phaseEl.className='metro-coach-live-phase'; phaseEl.textContent = `TARGET ${target} BPM`;
      phaseEl.style.fontSize='1.1rem'; phaseEl.style.letterSpacing='0.06em';
      const tapCount = snapshot ? snapshot.primerTaps.length : 0;
      subEl=document.createElement('div'); subEl.className='metro-coach-live-sub';
      subEl.textContent = tapCount < 4 ? `Tap ${tapCount}/4 • ${METRO_COPY.midiTapHint}` : 'Scoring...';
      const dots=document.createElement('div'); dots.className='metro-coach-dots';
      for(let i=0;i<4;i++){ const s=document.createElement('span'); if(i<tapCount) s.classList.add('filled'); dots.appendChild(s); }
      card.appendChild(head); card.appendChild(phaseEl); card.appendChild(subEl); card.appendChild(dots);
      if (snapshot && snapshot.primerResult) {
        const res=snapshot.primerResult;
        const score=document.createElement('div'); score.className='metro-coach-score';
        const grade=document.createElement('div'); grade.className='metro-coach-score-grade'; grade.textContent=res.grade;
        const detail=document.createElement('div'); detail.className='metro-coach-score-detail';
        const sign = res.delta>0?'+':''; detail.textContent = `Recalled ${res.recalled} BPM • Δ ${sign}${res.delta} (${(res.pct*100).toFixed(1)}%)`;
        const actions=document.createElement('div'); actions.className='metro-coach-score-actions';
        const retry=document.createElement('button'); retry.type='button'; retry.className='metro-coach-score-btn'; retry.textContent='RETRY';
        retry.addEventListener('click', ()=>{ if(callbacks.onPrimerRetry) callbacks.onPrimerRetry(); });
        const next=document.createElement('button'); next.type='button'; next.className='metro-coach-score-btn primary'; next.textContent='NEW TARGET';
        next.addEventListener('click', ()=>{ if(callbacks.onPrimerNewTarget) callbacks.onPrimerNewTarget(); });
        actions.appendChild(retry); actions.appendChild(next);
        score.appendChild(grade); score.appendChild(detail); score.appendChild(actions);
        card.appendChild(score);
      } else {
        const tapBtn=document.createElement('button'); tapBtn.type='button'; tapBtn.className='metro-coach-tap-area brutal-press'; tapBtn.style.marginTop='4px';
        tapBtn.innerHTML = `<span class="metro-coach-tap-title">TAP HERE</span><span class="metro-coach-tap-sub">${escHtml(METRO_COPY.midiTapHint)}</span>`;
        tapBtn.addEventListener('click', ()=>{ if(callbacks.onPrimerTap) callbacks.onPrimerTap(performance.now()); });
        // midi badge inside
        if (metroState.midiStatus==='connected'){
          const badge=document.createElement('span'); badge.textContent='● MIDI ready'; badge.style.fontSize='0.66rem'; badge.style.color='#22c55e'; tapBtn.appendChild(badge);
        }
        card.appendChild(tapBtn);
      }
    }

    dock.appendChild(card);

    // split button — STOP takes most width, far-right opens menu back up
    const split=document.createElement('div'); split.className='metro-coach-live-split';
    const stopBtn=document.createElement('button'); stopBtn.type='button'; stopBtn.className='metro-coach-live-stop brutal-press';
    stopBtn.innerHTML='<i class="fa-solid fa-stop"></i> STOP SESSION';
    stopBtn.setAttribute('aria-label','Stop training session');
    stopBtn.addEventListener('click', ()=>{ if(callbacks.onCoachStop) callbacks.onCoachStop(); });
    const expandBtn=document.createElement('button'); expandBtn.type='button'; expandBtn.className='metro-coach-live-expand brutal-press';
    expandBtn.innerHTML='<i class="fa-solid fa-chevron-up"></i>';
    expandBtn.setAttribute('aria-label', METRO_COPY.coachOpenSettings);
    expandBtn.title = METRO_COPY.coachOpenSettings;
    expandBtn.addEventListener('click', ()=>{ if(callbacks.onCoachExpand) callbacks.onCoachExpand(); });
    split.appendChild(stopBtn); split.appendChild(expandBtn);
    dock.appendChild(split);
  }

  function bindMidiEvents() {
    window.addEventListener('kins:midi-state', (e)=>{
      const detail = e.detail || {};
      renderMidiState(detail);
      renderCoachPrimer();
      // also update tap badge
      if (coachLiveRunning && coachLiveTab==='tempo-primer') {
        // re-render live to show midi ready
      }
    });
    window.addEventListener('kins:midi-tap', (e)=>{
      if (coachLiveRunning && coachLiveTab==='tempo-primer' && callbacks.onPrimerTap) {
        callbacks.onPrimerTap(e.detail && e.detail.time ? e.detail.time : performance.now());
      } else if (!coachLiveRunning && coachTab==='tempo-primer' && callbacks.onPrimerTap) {
        // allow tap even when not live? treat as primer tap during editor
        callbacks.onPrimerTap(e.detail && e.detail.time ? e.detail.time : performance.now());
      }
    });
  }

  function renderMidiState(detail) {
    const status = detail.status || metroState.midiStatus || 'disconnected';
    const inputs = detail.inputs || [];
    const activeId = detail.activeId || metroState.midiDeviceId;
    if (!els.midiDot) return;
    els.midiDot.classList.remove('connected','connecting');
    let text = 'Not connected';
    if (status==='connected') { els.midiDot.classList.add('connected'); text = 'MIDI connected'; }
    else if (status==='connecting') { els.midiDot.classList.add('connecting'); text='Connecting…'; }
    else if (status==='unsupported') text='Not supported';
    else if (status==='no-inputs') text='No MIDI inputs found';
    if (els.midiStatusText) els.midiStatusText.textContent = text;
    if (els.midiSupportBadge) {
      els.midiSupportBadge.hidden = status !== 'unsupported';
      if (status==='unsupported') els.midiSupportBadge.textContent='Not supported';
    }
    if (els.midiDeviceName) {
      if (activeId && inputs.length) {
        const found = inputs.find(i=>i.id===activeId);
        if (found) { els.midiDeviceName.textContent = found.name + (found.manufacturer?` • ${found.manufacturer}`:''); els.midiDeviceName.hidden=false; }
        else { els.midiDeviceName.hidden=true; }
      } else if (activeId && !inputs.length && metroState.midiStatus==='connected') {
        els.midiDeviceName.textContent = 'Device ' + activeId.slice(0,8);
        els.midiDeviceName.hidden=false;
      } else { els.midiDeviceName.hidden=true; }
    }
    if (els.midiSelect) {
      if (inputs.length > 1) {
        els.midiSelect.hidden=false;
        els.midiSelect.textContent='';
        inputs.forEach(inp=>{
          const opt=document.createElement('option'); opt.value=inp.id; opt.textContent=inp.name; if(inp.id===activeId) opt.selected=true;
          els.midiSelect.appendChild(opt);
        });
      } else if (inputs.length===1) {
        els.midiSelect.hidden=true;
      } else {
        els.midiSelect.hidden=true;
      }
    }
    if (els.midiConnectBtn) {
      const label = els.midiConnectLabel;
      if (status==='connected') {
        els.midiConnectBtn.classList.add('connected');
        if (label) label.textContent='DISCONNECT';
        els.midiConnectBtn.setAttribute('aria-label','Disconnect MIDI');
      } else {
        els.midiConnectBtn.classList.remove('connected');
        if (label) label.textContent='CONNECT MIDI';
        els.midiConnectBtn.setAttribute('aria-label','Connect MIDI device');
      }
      if (status==='unsupported') els.midiConnectBtn.disabled=true;
      else els.midiConnectBtn.disabled=false;
    }
    // update primer badge
    renderCoachPrimer();
  }

  function attachListeners() {
    if (els.playBtn) els.playBtn.addEventListener('click', () => callbacks.onPlayToggle());
    if (els.tapBtn) els.tapBtn.addEventListener('click', () => callbacks.onTapTempo());
    if (els.tsPill) els.tsPill.addEventListener('click', () => callbacks.onTsOpen());
    if (els.subPill) els.subPill.addEventListener('click', () => callbacks.onSubOpen());
    if (els.setlistBtn) els.setlistBtn.addEventListener('click', () => callbacks.onSetlistOpen());
    if (els.coachBtn) els.coachBtn.addEventListener('click', () => callbacks.onCoachOpen());
    if (els.settingsBtn) els.settingsBtn.addEventListener('click', () => callbacks.onSettingsOpen());

    attachDialGestures();
    attachStepperHold();
    attachBpmEdit();

    if (els.backdrop) els.backdrop.addEventListener('click', () => closeSheet());
    if (els.handle) els.handle.addEventListener('click', () => closeSheet());
    document.addEventListener('keydown', onKeydown);

    if (els.tsInfoBeats) els.tsInfoBeats.addEventListener('click', () => callbacks.onInfoHelp('infoTsBeats'));
    if (els.tsInfoUnit) els.tsInfoUnit.addEventListener('click', () => callbacks.onInfoHelp('infoTsUnit'));
    if (els.subInfo) els.subInfo.addEventListener('click', () => callbacks.onInfoHelp('infoSub'));
    if (els.optionsInfo) els.optionsInfo.addEventListener('click', () => callbacks.onInfoHelp('infoOptions'));
    if (els.pitchInfo) els.pitchInfo.addEventListener('click', () => callbacks.onInfoHelp('infoPitchMap'));
    if (els.midiInfo) els.midiInfo.addEventListener('click', () => callbacks.onInfoHelp('infoMidi'));

    if (els.tsBoxTop) els.tsBoxTop.addEventListener('click', handleTsEditTop);
    if (els.tsBoxBottom) els.tsBoxBottom.addEventListener('click', handleTsEditBottom);

    if (els.volume) {
      els.volume.addEventListener('input', () => {
        const v = parseInt(els.volume.value, 10) / 100;
        callbacks.onVolumeChange(v, false);
        if (els.volumeValue) els.volumeValue.textContent = `${els.volume.value}%`;
      });
      els.volume.addEventListener('change', () => {
        callbacks.onVolumeChange(parseInt(els.volume.value, 10) / 100, true);
      });
    }
    /* Buttons carry no intrinsic checked state — handlers mutate
       metroState, then we re-render every pressed state from truth so a
       rejected toggle (e.g. Wake Lock unsupported) can never stick */
    const bindSetToggle = (btn, key, cb) => {
      if (!btn || !cb) return;
      btn.addEventListener('click', () => {
        cb(!metroState[key]);
        renderSettingsControls();
      });
    };
    bindSetToggle(els.flashToggle, 'flash', (next) => callbacks.onFlashToggle(next));
    bindSetToggle(els.vibrateToggle, 'vibrate', (next) => callbacks.onVibrateToggle(next));
    bindSetToggle(els.keepAwakeToggle, 'keepAwake', (next) => { if (callbacks.onKeepAwakeToggle) callbacks.onKeepAwakeToggle(next); });
    bindSetToggle(els.backgroundToggle, 'backgroundPlay', (next) => { if (callbacks.onBackgroundToggle) callbacks.onBackgroundToggle(next); });
    if (els.resetPitchBtn) els.resetPitchBtn.addEventListener('click', () => { if (callbacks.onResetPitchMap) callbacks.onResetPitchMap(); });
    if (els.copyLinkBtn) els.copyLinkBtn.addEventListener('click', copyMetronomeLink);
    if (els.beatStyleRow) {
      els.beatStyleRow.querySelectorAll('.metro-beatstyle-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const style = chip.dataset.style === 'radial' ? 'radial' : 'dots';
          if (callbacks.onBeatStyleChange) callbacks.onBeatStyleChange(style);
        });
      });
    }

    if (els.midiConnectBtn) {
      els.midiConnectBtn.addEventListener('click', () => {
        if (els.midiConnectBtn.classList.contains('connected')) {
          if (callbacks.onMidiDisconnect) callbacks.onMidiDisconnect();
        } else {
          if (callbacks.onMidiConnect) callbacks.onMidiConnect();
        }
      });
    }
    if (els.midiSelect) {
      els.midiSelect.addEventListener('change', () => {
        const id = els.midiSelect.value;
        if (callbacks.onMidiSelect) callbacks.onMidiSelect(id);
      });
    }

    if (els.topbarUndo) {
      els.topbarUndo.addEventListener('click', handleTopbarUndo);
    }

    if (els.bpmNum) {
      els.bpmNum.addEventListener('click', enterBpmEdit);
      els.bpmNum.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          enterBpmEdit();
          return;
        }
        if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
          e.preventDefault();
          callbacks.onBpmStep(1);
        } else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_') {
          e.preventDefault();
          callbacks.onBpmStep(-1);
        }
      });
    }
    if (els.bpmInput) {
      els.bpmInput.addEventListener('keydown', onBpmInputKeydown);
      els.bpmInput.addEventListener('blur', commitBpmEdit);
    }

    attachSheetDrag();
  }

  let bpmEditing = false;

  function enterBpmEdit() {
    if (bpmEditing || !els.bpmNum || !els.bpmInput) return;
    bpmEditing = true;
    els.bpmNum.hidden = true;
    els.bpmInput.hidden = false;
    els.bpmInput.value = String(metroState.bpm);
    requestAnimationFrame(() => {
      els.bpmInput.focus();
      els.bpmInput.select();
    });
  }

  function exitBpmEdit() {
    if (!bpmEditing) return;
    bpmEditing = false;
    if (els.bpmInput) {
      els.bpmInput.hidden = true;
      els.bpmInput.blur();
    }
    if (els.bpmNum) {
      els.bpmNum.hidden = false;
      els.bpmNum.focus({ preventScroll: true });
    }
  }

  function commitBpmEdit() {
    if (!els.bpmInput) return;
    const raw = els.bpmInput.value.trim();
    if (raw === '') {
      exitBpmEdit();
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      if (callbacks.onBpmSet) callbacks.onBpmSet(parsed);
      else callbacks.onBpmStep(parsed - metroState.bpm);
    }
    exitBpmEdit();
  }

  function onBpmInputKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitBpmEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      exitBpmEdit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      callbacks.onBpmStep(1);
      if (els.bpmInput) els.bpmInput.value = String(metroState.bpm);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      callbacks.onBpmStep(-1);
      if (els.bpmInput) els.bpmInput.value = String(metroState.bpm);
    }
  }

  function attachBpmEdit() {
    document.addEventListener('pointerdown', (e) => {
      if (!bpmEditing) return;
      if (els.bpmNum && els.bpmNum.contains(e.target)) return;
      if (els.bpmInput && els.bpmInput.contains(e.target)) return;
    });
  }

  function attachStepperHold() {
    if (!els.bpmMinus || !els.bpmPlus) return;
    const bindHold = (btn, delta) => {
      const startHold = (e) => {
        e.preventDefault();
        callbacks.onBpmStep(delta);
        clearRepeat();
        repeatTimeout = setTimeout(() => {
          repeatInterval = setInterval(() => {
            callbacks.onBpmStep(delta);
          }, METRO_BPM.repeatRateMs);
        }, METRO_BPM.repeatDelayMs);
      };
      const stopHold = () => clearRepeat();
      btn.addEventListener('pointerdown', startHold);
      btn.addEventListener('pointerup', stopHold);
      btn.addEventListener('pointercancel', stopHold);
      btn.addEventListener('pointerleave', stopHold);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          callbacks.onBpmStep(delta);
        }
      });
    };
    bindHold(els.bpmMinus, -1);
    bindHold(els.bpmPlus, 1);
    window.addEventListener('pointerup', clearRepeat, { passive: true });
    window.addEventListener('pointercancel', clearRepeat, { passive: true });
  }

  function handleTsEditTop() {
    const current = getTimeSignature().beatsPerBar;
    const input = window.prompt('Enter beats per bar (1 to 32):', String(current));
    if (input === null) return;
    const val = parseInt(input.trim(), 10);
    if (!Number.isNaN(val) && val >= 1 && val <= 32) {
      if (callbacks.onCustomTsSelect) {
        callbacks.onCustomTsSelect(val, getTimeSignature().beatUnit);
      }
    }
  }

  function handleTsEditBottom() {
    const current = getTimeSignature().beatUnit;
    const input = window.prompt('Enter note value (e.g. 1, 2, 4, 8, 16, 32):', String(current));
    if (input === null) return;
    const val = parseInt(input.trim(), 10);
    if (!Number.isNaN(val) && val >= 1 && val <= 32) {
      if (callbacks.onCustomTsSelect) {
        callbacks.onCustomTsSelect(getTimeSignature().beatsPerBar, val);
      }
    }
  }

  function copyMetronomeLink() {
    const url = window.location.origin + '/metronome';
    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
    if (els.copyBadge) {
      els.copyBadge.textContent = 'Copied!';
      els.copyBadge.classList.add('copied');
      if (copyBadgeTimer) clearTimeout(copyBadgeTimer);
      copyBadgeTimer = setTimeout(() => {
        if (els.copyBadge) {
          els.copyBadge.textContent = 'Copy';
          els.copyBadge.classList.remove('copied');
        }
      }, 1800);
    }
    showToast('Metronome link copied to clipboard!', 'success');
  }

  function attachDialGestures() {
    if (!els.dial) return;
    let gesture = null;
    const PX_PER_BPM = 6;
    els.dial.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      callbacks.onBpmStep(delta);
    }, { passive: false });
    const onPointerDown = (e) => {
      if (e.target.closest('.metro-pill') || e.target.closest('.metro-stepper-btn')) return;
      gesture = {
        startY: e.clientY,
        startBpm: metroState.bpm
      };
      if (els.dial) els.dial.classList.add('is-dragging');
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('pointercancel', onPointerUp, { passive: true });
    };
    const onPointerMove = (e) => {
      if (!gesture) return;
      const dy = e.clientY - gesture.startY;
      const bpmDelta = Math.round(dy / PX_PER_BPM);
      const nextBpm = gesture.startBpm + bpmDelta;
      callbacks.onBpmStep(nextBpm - metroState.bpm);
    };
    const onPointerUp = () => {
      gesture = null;
      if (els.dial) els.dial.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
    els.dial.addEventListener('pointerdown', onPointerDown, { passive: true });
  }

  function clearRepeat() {
    if (repeatTimeout !== null) {
      clearTimeout(repeatTimeout);
      repeatTimeout = null;
    }
    if (repeatInterval !== null) {
      clearInterval(repeatInterval);
      repeatInterval = null;
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      const modalOpen = document.querySelector('.modal-backdrop:not(.hidden)');
      if (modalOpen) return;
      if (coachLiveRunning) {
        if (callbacks.onCoachStop) callbacks.onCoachStop();
        return;
      }
      if (sheetOpen && els.customFormWrap && !els.customFormWrap.hidden) {
        closeCustomForm();
        e.stopPropagation();
        return;
      }
      if (sheetOpen) {
        closeSheet();
        return;
      }
    }
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (!sheetOpen && !typing) {
      if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') {
        e.preventDefault();
        callbacks.onBpmStep(1);
      } else if (e.key === '-' || e.key === '_' || e.key === 'ArrowDown') {
        e.preventDefault();
        callbacks.onBpmStep(-1);
      } else if (e.key === ' ') {
        e.preventDefault();
        callbacks.onPlayToggle();
      }
    }
  }

  function openSheet(panel, trigger) {
    if (sheetOpen && activePanel === panel) return;
    [els.panelTs, els.panelSub, els.panelSetlist, els.panelSettings, els.panelCoach].forEach((p) => {
      if (!p) return;
      p.hidden = p !== panel;
    });
    if (sheetTrigger && sheetTrigger !== trigger) {
      sheetTrigger.setAttribute('aria-expanded', 'false');
    }
    sheetTrigger = trigger || null;
    if (sheetTrigger) sheetTrigger.setAttribute('aria-expanded', 'true');
    els.sheet.hidden = false;
    els.backdrop.hidden = false;
    requestAnimationFrame(() => {
      els.sheet.classList.add('open');
      els.backdrop.classList.add('open');
    });
    els.sheet.focus({ preventScroll: true });
    sheetOpen = true;
    activePanel = panel;
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    activePanel = null;
    els.sheet.classList.remove('open');
    els.backdrop.classList.remove('open');
    els.sheet.style.transform = '';
    if (sheetTrigger) {
      sheetTrigger.setAttribute('aria-expanded', 'false');
      sheetTrigger.focus({ preventScroll: true });
      sheetTrigger = null;
    }
    const done = () => {
      if (sheetOpen) return;
      els.sheet.hidden = true;
      els.backdrop.hidden = true;
    };
    if (reducedMotion) {
      done();
    } else {
      setTimeout(done, 240);
    }
  }

  function attachSheetDrag() {
    els.sheet.addEventListener('touchstart', (e) => {
      if (!sheetOpen || e.touches.length !== 1) return;
      drag = {
        startY: e.touches[0].clientY,
        lastY: e.touches[0].clientY,
        startTime: performance.now(),
        engaged: false,
        translateY: 0
      };
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd, { passive: true });
      document.addEventListener('touchcancel', onDragEnd, { passive: true });
    }, { passive: true });
  }

  function onDragMove(e) {
    if (!drag) return;
    const touch = e.touches[0];
    const dy = touch.clientY - drag.startY;
    drag.lastY = touch.clientY;
    if (!drag.engaged) {
      const atTop = (() => {
        if (!activePanel) return els.sheet.scrollTop <= 2;
        if (activePanel === els.panelSettings && els.settingsScroll) return els.settingsScroll.scrollTop <= 2;
        return activePanel.scrollTop <= 2;
      })();
      const onHandle = e.target === els.handle || els.handle.contains(e.target);
      if (dy > 8 && (atTop || onHandle)) {
        drag.engaged = true;
        els.sheet.classList.add('dragging');
      } else if (Math.abs(dy) > 8) {
        cleanupDragListeners();
        drag = null;
        return;
      } else {
        return;
      }
    }
    if (e.cancelable) e.preventDefault();
    let targetY = Math.max(0, dy);
    if (targetY > 0) {
      const over = targetY;
      targetY = over * 0.82;
    }
    drag.translateY = targetY;
    if (!dragRafId) {
      dragRafId = requestAnimationFrame(() => {
        dragRafId = null;
        if (drag) els.sheet.style.transform = `translate3d(0, ${Math.round(drag.translateY)}px, 0)`;
      });
    }
  }

  function onDragEnd() {
    cleanupDragListeners();
    if (!drag) return;
    const wasEngaged = drag.engaged;
    const translateY = drag.translateY;
    const elapsed = Math.max(1, performance.now() - drag.startTime);
    const velocity = (drag.lastY - drag.startY) / elapsed;
    drag = null;
    if (dragRafId) {
      cancelAnimationFrame(dragRafId);
      dragRafId = null;
    }
    if (!wasEngaged) return;
    els.sheet.classList.remove('dragging');
    if (translateY > 90 || velocity > 0.35) {
      closeSheet();
    } else {
      els.sheet.style.transform = '';
    }
  }

  function cleanupDragListeners() {
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
    document.removeEventListener('touchcancel', onDragEnd);
  }

  function renderAll() {
    renderBpm();
    renderBeatStyle();
    renderPills();
    renderSheetDisplays();
    renderChipStates();
    renderSettingsControls();
    renderPlayState(false);
    renderCoachInner();
    renderCoachSpeed();
    renderCoachRhythm();
    renderCoachPrimer();
  }

  function renderBpm() {
    if (els.bpmNum) {
      els.bpmNum.textContent = String(metroState.bpm);
      els.bpmNum.setAttribute('aria-valuenow', String(metroState.bpm));
      els.bpmNum.setAttribute('aria-valuetext', `${metroState.bpm} beats per minute`);
    }
    if (els.bpmInput && !bpmEditing) {
      els.bpmInput.value = String(metroState.bpm);
    }
  }

  function renderBeatStyle() {
    const style = metroState.beatStyle === 'radial' ? 'radial' : 'dots';
    if (els.dial) els.dial.setAttribute('data-beat-style', style);
    if (els.beatStyleRow) {
      els.beatStyleRow.querySelectorAll('.metro-beatstyle-chip').forEach((chip) => {
        const active = chip.dataset.style === style;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-checked', active ? 'true' : 'false');
      });
    }
  }

  function renderPills() {
    if (els.tsPillLabel) els.tsPillLabel.textContent = getTimeSignature().label;
    if (els.subPillLabel) els.subPillLabel.textContent = getSubdivision().label;
  }

  function renderSheetDisplays() {
    const ts = getTimeSignature();
    if (els.tsBoxTop) els.tsBoxTop.textContent = String(ts.beatsPerBar);
    if (els.tsBoxBottom) els.tsBoxBottom.textContent = String(ts.beatUnit);
    const sub = getSubdivision();
    if (els.subBoxTop) els.subBoxTop.textContent = '1';
    if (els.subBoxBottom) els.subBoxBottom.textContent = sub.displayBottom;
  }

  function renderChipStates() {
    if (els.tsGrid) {
      els.tsGrid.querySelectorAll('.metro-chip').forEach((chip) => {
        const active = Number(chip.dataset.index) === metroState.timeSigIndex;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-checked', active ? 'true' : 'false');
      });
    }
    if (els.subRow) {
      els.subRow.querySelectorAll('.metro-sub-chip').forEach((chip) => {
        const active = Number(chip.dataset.index) === metroState.subdivisionIndex;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    if (els.soundRow) {
      els.soundRow.querySelectorAll('.metro-chip').forEach((chip) => {
        const active = chip.dataset.sound === metroState.soundId;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
  }

  function renderSettingsControls() {
    if (els.volume) els.volume.value = String(Math.round(metroState.volume * 100));
    if (els.volumeValue) els.volumeValue.textContent = `${Math.round(metroState.volume * 100)}%`;
    renderSetToggle(els.flashToggle, metroState.flash);
    renderSetToggle(els.vibrateToggle, metroState.vibrate);
    renderSetToggle(els.keepAwakeToggle, metroState.keepAwake);
    renderSetToggle(els.backgroundToggle, metroState.backgroundPlay);
    renderBeatStyle();
  }

  /* Settings toggle buttons: pressed state lives in aria-pressed + .active */
  function renderSetToggle(btn, enabled) {
    if (!btn) return;
    btn.classList.toggle('active', !!enabled);
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  function renderPlayState(playing) {
    if (!els.playBtn) return;
    els.playBtn.classList.toggle('playing', playing);
    els.playBtn.setAttribute('aria-label', playing ? METRO_COPY.startedLabel : METRO_COPY.stoppedLabel);
  }

  function renderBeat(beatInBar) {
    const isRadial = metroState.beatStyle === 'radial';
    const isAccentBeat = beatInBar === 0 && metroState.accentFirst;
    if (isRadial) {
      if (currentBeat >= 0) {
        radialSegs.forEach((seg) => {
          if (seg.dataset.index === String(currentBeat)) {
            seg.classList.remove('active', 'accent');
          }
        });
      }
      currentBeat = beatInBar;
      radialSegs.forEach((seg) => {
        if (seg.dataset.index === String(beatInBar)) {
          seg.classList.add('active');
          if (isAccentBeat) seg.classList.add('accent');
        }
      });
    } else {
      if (currentBeat >= 0 && beatDots[currentBeat]) {
        beatDots[currentBeat].classList.remove('active', 'accent');
      }
      currentBeat = beatInBar;
      if (beatDots[beatInBar]) {
        beatDots[beatInBar].classList.add('active');
        if (isAccentBeat) beatDots[beatInBar].classList.add('accent');
      }
    }
    if (metroState.flash && els.dial) {
      /* Alternate between two identical animations — swapping animation
         names forces a restart WITHOUT the forced reflow the old
         remove/void offsetWidth/add dance did on every beat */
      flashAlt = !flashAlt;
      els.dial.classList.remove('beat-flash-a', 'beat-flash-b');
      els.dial.classList.add(flashAlt ? 'beat-flash-a' : 'beat-flash-b');
    }
  }

  function resetBeatIndicator() {
    if (metroState.beatStyle === 'radial') {
      radialSegs.forEach((seg) => seg.classList.remove('active', 'accent'));
    } else {
      if (currentBeat >= 0 && beatDots[currentBeat]) {
        beatDots[currentBeat].classList.remove('active', 'accent');
      }
    }
    currentBeat = -1;
    if (els.dial) els.dial.classList.remove('beat-flash-a', 'beat-flash-b');
  }

  return {
    init,
    openSheet,
    closeSheet,
    rebuildBeatDots: () => { buildBeatDots(); buildRadialRing(); renderBeatStyle(); },
    renderBpm,
    renderBeatStyle,
    renderPills,
    renderSheetDisplays,
    renderChipStates,
    renderSettingsControls,
    renderPlayState,
    renderBeat,
    resetBeatIndicator,
    updateBeatDotTier,
    selectCoachTab,
    renderCoachInner,
    renderCoachSpeed,
    renderCoachRhythm,
    renderCoachPrimer,
    enterCoachLive,
    exitCoachLive,
    renderCoachLive,
    renderMidiState,
    clearRepeat,
    showTopbarTitle,
    hideTopbarTitleShowUndo,
    notifyBpmChangedFromUser,
    getLastSetlistEntry: () => lastSetlistEntry,
    isTopbarTitleVisible: () => topbarTitleVisible,
    isTopbarUndoVisible: () => topbarUndoVisible,
    setRestoringFlag: (v) => { isRestoringFromUndo = !!v; },
    get panelTs() { return els.panelTs; },
    get panelSub() { return els.panelSub; },
    get panelSetlist() { return els.panelSetlist; },
    get panelSettings() { return els.panelSettings; },
    get panelCoach() { return els.panelCoach; },
    get tsPill() { return els.tsPill; },
    get subPill() { return els.subPill; },
    get setlistBtn() { return els.setlistBtn; },
    get settingsBtn() { return els.settingsBtn; },
    get coachBtn() { return els.coachBtn; },
    get topbarTitle() { return els.topbarTitle; },
    get topbarUndo() { return els.topbarUndo; },
    get topbarCenter() { return els.topbarCenter; },
    get isSheetOpen() { return sheetOpen; },
    get coachLiveRunning() { return coachLiveRunning; }
  };
}
