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
  METRO_STORAGE_KEYS,
  COACH_DEFAULTS,
  DEFAULT_BEAT_COLORS,
  getTempoMarking
} from '../../../settings/metronome.config';
import { showToast } from '../toast.js';
import {
  metroState,
  getTimeSignature,
  getSubdivision,
  getBeatTier,
  getLevelColor,
  setLevelColor,
  resetLevelColors,
  applyLevelColors,
  loadSetlists,
  saveSetlists,
  getSetlists,
  getSetlistById,
  upsertSetlist,
  deleteSetlist
} from './metroState.js';

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
  let activeSetlistSort = 'default';
  let lastSetlistEntry = null;
  let topbarTitleVisible = false;
  let topbarUndoVisible = false;
  let isRestoringFromUndo = false;
  let flashAlt = false;
  let tempoMarkingTimer = null;
  let tempoMarkingHideTimer = null;
  let tempoSwapAlt = false;
  let currentMarkingText = '';

  // Hierarchical Setlist & Song Navigation State
  let activeMenuTab = 'setlists'; // 'setlists' | 'songs'
  let currentSetlistDetailId = null;
  let currentEditingSong = null;
  let songEditParentContext = { from: 'songs-browse' }; // { from: 'setlist-detail', setlistId } | { from: 'songs-browse' }
  let songEditActiveTab = 'details'; // 'details' | 'structure'
  let editingSetlistNameId = null; // null for create, string for rename
  let songPickerSelectedIds = new Set();
  let songPickerSearchQuery = '';

  // custom + search state
  let customEntries = [];
  let setlistSearchQuery = '';
  let searchDebounceTimer = null;
  let webSearchDebounceTimer = null;
  let songFormTapTimes = [];

  // setlist song drag reorder state
  let songDragState = null;
  let songDragSuppressClickUntil = 0;

  const NS = 'http://www.w3.org/2000/svg';

  /* Registry of persistent document/window-level listeners so a re-init
     (bfcache restore / view-transition swap) can fully detach the previous
     instance's handlers instead of stacking duplicates. Element-scoped
     listeners are intentionally not tracked — they die with their DOM. */
  const globalListeners = [];
  function trackGlobal(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    globalListeners.push({ target, type, fn, opts });
  }
  function releaseGlobalListeners() {
    while (globalListeners.length) {
      const l = globalListeners.pop();
      try { l.target.removeEventListener(l.type, l.fn, l.opts); } catch (e) {}
    }
  }

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
      customEntries = parsed.filter((e) => e && typeof e.title === 'string' && typeof e.artist === 'string')
        .map((e, idx) => ({
          id: e.id || `custom-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          title: String(e.title).trim().slice(0, 120),
          artist: String(e.artist).trim().slice(0, 120) || 'Unknown Artist',
          bpm: clampBpmLocal(e.bpm),
          category: (e.category === 'covers' || e.category === 'originals') ? e.category : 'custom',
          timeSig: e.timeSig ? String(e.timeSig).trim() : '',
          countIn: !!e.countIn,
          structure: Array.isArray(e.structure) ? e.structure : [],
          notes: e.notes ? String(e.notes).trim().slice(0, 80) : '',
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
    els.tempoMarking = q('metroTempoMarking');
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
    els.nowPlaying = q('metroNowPlaying');
    els.nowPlayingTitle = q('metroNowPlayingTitle');
    els.nowPlayingSection = q('metroNowPlayingSection');
    els.nowPlayingBars = q('metroNowPlayingBars');
    els.nowPlayingSep = q('metroNowPlayingSep');
    els.nowPlayingExit = q('metroNowPlayingExit');
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

    // Top 50/50 Navigation
    els.navSetlists = q('metroNavSetlists');
    els.navSongs = q('metroNavSongs');

    // Level 1 Setlists List View
    els.setlistsListView = q('metroSetlistsListView');
    els.setlistsList = q('metroSetlistsList');

    // Level 2 Setlist Detail View
    els.setlistDetailView = q('metroSetlistDetailView');
    els.setlistDetailBackBtn = q('metroSetlistDetailBackBtn');
    els.setlistDetailTitle = q('metroSetlistDetailTitle');
    els.setlistDetailPlayBtn = q('metroSetlistDetailPlayBtn');
    els.setlistDetailCount = q('metroSetlistDetailCount');
    els.setlistDetailEditNameBtn = q('metroSetlistDetailEditNameBtn');
    els.setlistDetailAddSongBtn = q('metroSetlistDetailAddSongBtn');
    els.setlistDetailSongs = q('metroSetlistDetailSongs');

    // Level 1 Songs Browse View
    els.songsBrowseView = q('metroSongsBrowseView');
    els.setlistFilters = q('metroSetlistFilters');
    els.setlistSortBar = q('metroSetlistSortBar');
    els.setlistList = q('metroSetlistList');

    // Level 3 / Direct Song Edit View
    els.songEditView = q('metroSongEditView');
    els.songEditBackBtn = q('metroSongEditBackBtn');
    els.songEditTitle = q('metroSongEditTitle');
    els.songEditPlayBtn = q('metroSongEditPlayBtn');
    els.songEditTabs = q('metroSongEditTabs');
    els.songEditTabDetails = q('metroSongEditTabDetails') || q('metroSongEditTabCustom');
    els.songEditTabStructure = q('metroSongEditTabStructure') || q('metroSongEditTabSearch');
    els.songEditPaneDetails = q('metroSongEditPaneDetails') || q('metroSongEditCustomPane');
    els.songEditPaneStructure = q('metroSongEditPaneStructure') || q('metroSongEditSearchPane');

    // Song Form Fields
    els.songFormTitle = q('metroSongFormTitle') || q('metroCustomTitle');
    els.songFormArtist = q('metroSongFormArtist') || q('metroCustomArtist');
    els.songFormBpm = q('metroSongFormBpm') || q('metroCustomBpm');
    els.songFormBpmTap = q('metroSongFormBpmTap') || q('metroCustomTapBpmBtn');
    els.songFormUseCurrentBpm = q('metroCustomUseCurrentBpmBtn');
    els.songFormTimeSig = q('metroSongFormTimeSig') || q('metroCustomTimeSig');
    els.songFormCategory = q('metroSongFormCategory') || q('metroCustomCategory');
    els.songFormCountIn = q('metroSongFormCountIn') || q('metroCustomCountIn');
    els.songFormNotes = q('metroSongFormNotes') || q('metroCustomNotes');
    els.songEditCancelBtn = q('metroSongEditCancelBtn') || q('metroCustomCancelBtn');
    els.songEditSaveBtn = q('metroSongEditSaveBtn') || q('metroCustomSubmitBtn');

    // Web Lookup Fields
    els.webSearchInput = q('metroSetlistWebSearchInput');
    els.webSearchClear = q('metroSetlistWebSearchClear');
    els.webResults = q('metroSetlistWebResults');

    // Song Structure Builder
    els.structureSummary = q('metroStructureSummary');
    els.structureDeck = q('metroStructureDeck');
    els.structureFlow = q('metroStructureFlow');
    els.presetIntro = q('metroPresetIntro') || document.querySelector('[data-preset="Intro"]');
    els.presetVerse = q('metroPresetVerse') || document.querySelector('[data-preset="Verse"]');
    els.presetChorus = q('metroPresetChorus') || document.querySelector('[data-preset="Chorus"]');
    els.presetBridge = q('metroPresetBridge') || document.querySelector('[data-preset="Bridge"]');
    els.presetSolo = q('metroPresetSolo') || document.querySelector('[data-preset="Solo"]');
    els.presetOutro = q('metroPresetOutro') || document.querySelector('[data-preset="Outro"]');
    els.presetCustom = q('metroPresetCustom') || q('metroAddCustomSectionBtn');

    // Setlist Name View
    els.setlistNameView = q('metroSetlistNameView');
    els.setlistNameBackBtn = q('metroSetlistNameBackBtn');
    els.setlistNameTitle = q('metroSetlistNameTitle') || q('metroSetlistNameModalTitle');
    els.setlistNameInput = q('metroSetlistNameInput');
    els.setlistNameCancelBtn = q('metroSetlistNameCancelBtn');
    els.setlistNameSaveBtn = q('metroSetlistNameSaveBtn') || q('metroSetlistNameSubmitBtn');

    // Setlist Main Floating Title
    els.setlistSheetMainTitle = q('metroSetlistSheetMainTitle');

    // Fixed Bottom Dock (Add left, Search icon-only right — expands full width on demand)
    els.bottomFixedDock = q('metroBottomFixedDock');
    els.bottomAddCol = q('metroBottomAddCol');
    els.bottomSearchCol = q('metroBottomSearchCol');
    els.bottomSearchPill = q('metroBottomSearchPill');
    els.bottomSearchToggleBtn = q('metroBottomSearchToggleBtn');
    els.bottomSearchInput = q('metroBottomSearchInput');
    els.bottomSearchClear = q('metroBottomSearchClear');
    els.bottomSearchCloseBtn = q('metroBottomSearchCloseBtn');
    els.bottomAddBtn = q('metroBottomAddBtn');
    els.bottomAddBtnText = q('metroBottomAddBtnText') || q('metroBottomAddBtnLabel');

    // Song Picker Modal
    els.songPickerModal = q('metroSongPickerModal');
    els.pickerCloseBtn = q('metroPickerCloseBtn') || q('metroSongPickerCloseBtn');
    els.pickerSearchInput = q('metroPickerSearchInput');
    els.pickerList = q('metroPickerList') || q('metroSongPickerList');
    els.pickerCount = q('metroPickerCount') || q('metroPickerSelectedCount');
    els.pickerConfirmBtn = q('metroPickerConfirmBtn') || q('metroSongPickerConfirmBtn');

    // Topbar Center Playback
    els.topbarCenter = q('metroTopbarCenter');
    els.topbarTitle = q('metroTopbarTitle');
    els.topbarUndo = q('metroTopbarUndo');
    els.topbarPlayback = q('metroTopbarPlayback');
    els.topbarSetlistTitle = q('metroTopbarSetlistTitle');
    els.topbarSongLine = q('metroTopbarSongLine');
    els.topbarSongTitle = q('metroTopbarSongTitle');
    els.topbarSep = q('metroTopbarSep');
    els.topbarSection = q('metroTopbarSection');
    els.topbarCounter = q('metroTopbarCounter');
    if (els.topbarCenter) els.topbarCenter.hidden = true;

    // Setlist Navigation Deck
    els.setlistDeck = q('metroSetlistDeck');
    els.deckPrevSong = q('metroDeckPrevSong');
    els.deckPrevSection = q('metroDeckPrevSection');
    els.deckNextSection = q('metroDeckNextSection');
    els.deckNextSong = q('metroDeckNextSong');

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
    els.pitchInfo = q('metroPitchInfo') || q('metroPitchColorInfo');
    els.midiInfo = q('metroMidiInfo');
    els.copyLinkBtn = q('metroCopyLinkBtn');
    els.copyBadge = q('metroCopyBadge');
    els.resetPitchBtn = q('metroResetPitchBtn');
    // beat color customization
    els.colorLow = q('metroColorLow');
    els.colorMid = q('metroColorMid');
    els.colorHigh = q('metroColorHigh');
    els.colorHexLow = q('metroColorHexLow');
    els.colorHexMid = q('metroColorHexMid');
    els.colorHexHigh = q('metroColorHexHigh');
    els.colorDotLow = q('metroColorDotLow');
    els.colorDotMid = q('metroColorDotMid');
    els.colorDotHigh = q('metroColorDotHigh');
    els.resetColorsBtn = q('metroResetColorsBtn');
    els.colorInfo = q('metroColorInfo') || q('metroPitchColorInfo');

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
    buildCoachTabs();
    try { applyLevelColors(); } catch (e) {}
    renderBeatColors();
    bindBeatColorEvents();
    // Defer heaviest setlist/sound builds to idle — keeps FCP/TBT low without breaking coach tests
    const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    scheduleIdle(() => {
      buildSetlist();
      buildSoundRow();
    });
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
      // Unified classes: metro-beat-dot + tier-* legacy + is-* spec + beat-* + beat-pip + muted gold — no layout thrash, single class string
      dot.className = `metro-beat-dot beat-pip tier-${tier} is-${tier} beat-${tier}${tier === 'mute' ? ' beat-muted-gold beat-muted is-muted' : ''}`;
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
      const tier = getBeatTier(i);
      const arcD = describeArc(cx, cy, r, start, end);
      const label = METRO_COPY.beatTierAria ? METRO_COPY.beatTierAria(i + 1, tier) : `Beat ${i + 1} — pitch ${tier}`;
      // Transparent hit path — 44px stroke ensures WCAG 2.5.8 minimum target (visual stays 8px)
      const hit = document.createElementNS(NS, 'path');
      hit.setAttribute('d', arcD);
      hit.setAttribute('class', 'metro-radial-seg-hit');
      hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '44');
      hit.setAttribute('stroke-linecap', 'round');
      hit.style.pointerEvents = 'stroke';
      hit.dataset.index = String(i);
      hit.setAttribute('data-track', 'metronome:tier_cycle');
      hit.setAttribute('aria-hidden', 'true');
      const fire = (e) => {
        e.stopPropagation();
        if (callbacks.onTierCycle) callbacks.onTierCycle(i);
      };
      hit.addEventListener('click', fire);
      // Append hit before visual so visual renders on top
      els.radialRing.appendChild(hit);
      // Visual path — preserves original 8px design and a11y semantics
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', arcD);
      path.setAttribute('class', `metro-radial-seg beat-pip tier-${tier} is-${tier} beat-${tier}${tier === 'mute' ? ' beat-muted-gold beat-muted is-muted' : ''}`);
      path.setAttribute('role', 'button');
      path.setAttribute('tabindex', '0');
      path.dataset.index = String(i);
      path.dataset.tier = tier;
      path.setAttribute('data-track', 'metronome:tier_cycle');
      path.setAttribute('aria-label', label);
      path.addEventListener('click', fire);
      path.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          if (callbacks.onTierCycle) callbacks.onTierCycle(i);
        }
      });
      path._hitPath = hit;
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
      // Maintain legacy tier-* for existing CSS + spec beat-pip is-* + unified beat-* + muted gold
      dot.classList.remove('tier-low', 'tier-mid', 'tier-high', 'tier-mute', 'beat-muted-gold', 'is-low', 'is-mid', 'is-high', 'is-muted', 'is-mute', 'beat-low', 'beat-mid', 'beat-high', 'beat-muted', 'beat-pip');
      dot.classList.add(`tier-${t}`, `is-${t}`, `beat-${t}`);
      dot.classList.add('beat-pip');
      if (t === 'mute') {
        dot.classList.add('beat-muted-gold', 'is-muted', 'beat-muted');
      } else {
        dot.classList.remove('beat-muted-gold', 'is-muted', 'is-mute', 'beat-muted');
      }
      // Strictly for muted: ensure inner pip opacity handling via CSS, no DOM thrash — only class toggles, no style reads
      dot.setAttribute('aria-label', label);
    }
    radialSegs.forEach((seg) => {
      if (seg.dataset.index === String(beatIndex)) {
        seg.dataset.tier = t;
        seg.classList.remove('tier-low', 'tier-mid', 'tier-high', 'tier-mute', 'beat-muted-gold', 'is-low', 'is-mid', 'is-high', 'is-muted', 'is-mute', 'beat-low', 'beat-mid', 'beat-high', 'beat-muted', 'beat-pip');
        seg.classList.add(`tier-${t}`, `is-${t}`, `beat-${t}`);
        seg.classList.add('beat-pip');
        if (t === 'mute') {
          seg.classList.add('beat-muted-gold', 'is-muted', 'beat-muted');
        } else {
          seg.classList.remove('beat-muted-gold', 'is-muted', 'is-mute', 'beat-muted');
        }
        seg.setAttribute('aria-label', label);
        // Also sync sibling hit path if present (44px transparent hit area)
        const hit = seg._hitPath;
        if (hit) hit.setAttribute('aria-label', label);
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

  // ==========================================
  // HIERARCHICAL SETLIST & SONG SYSTEM
  // ==========================================

  function getAllEntriesForSearch() {
    const base = [
      ...METRO_SETLIST_INSPIRES,
      ...((METRO_SETLIST_BY_CATEGORY.covers) || []),
      ...((METRO_SETLIST_BY_CATEGORY.originals) || [])
    ];
    return [...base, ...customEntries];
  }

  function getFilteredSetlist() {
    let list = [];
    if (setlistSearchQuery && setlistSearchQuery.length >= 1) {
      const q = setlistSearchQuery.toLowerCase();
      const all = getAllEntriesForSearch();
      list = all.filter((e) => {
        const hay = `${e.title} ${e.artist} ${e.bpm} ${e.category || ''} ${e.notes || ''}`.toLowerCase();
        return hay.includes(q);
      });
    } else if (activeSetlistFilter === 'custom') {
      list = customEntries.filter((e) => e.category === 'custom' || !e.category || e.isCustom);
    } else if (activeSetlistFilter === 'covers') {
      const staticCovers = METRO_SETLIST_BY_CATEGORY.covers || [];
      const userCovers = customEntries.filter((e) => e.category === 'covers');
      list = [...staticCovers, ...userCovers];
    } else if (activeSetlistFilter === 'originals') {
      const staticOriginals = METRO_SETLIST_BY_CATEGORY.originals || [];
      const userOriginals = customEntries.filter((e) => e.category === 'originals');
      list = [...staticOriginals, ...userOriginals];
    } else {
      list = [...METRO_SETLIST_INSPIRES];
    }

    if (activeSetlistSort === 'bpm-asc') {
      return [...list].sort((a, b) => a.bpm - b.bpm);
    }
    if (activeSetlistSort === 'bpm-desc') {
      return [...list].sort((a, b) => b.bpm - a.bpm);
    }
    if (activeSetlistSort === 'alpha') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
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

  function hideAllSetlistSubviews() {
    if (els.setlistsListView) els.setlistsListView.hidden = true;
    if (els.setlistDetailView) els.setlistDetailView.hidden = true;
    if (els.songsBrowseView) els.songsBrowseView.hidden = true;
    if (els.songEditView) els.songEditView.hidden = true;
    if (els.setlistNameView) els.setlistNameView.hidden = true;
  }

  function switchMenuTab(tab) {
    activeMenuTab = tab === 'songs' ? 'songs' : 'setlists';
    if (els.navSetlists) {
      els.navSetlists.classList.toggle('active', activeMenuTab === 'setlists');
      els.navSetlists.setAttribute('aria-selected', activeMenuTab === 'setlists' ? 'true' : 'false');
    }
    if (els.navSongs) {
      els.navSongs.classList.toggle('active', activeMenuTab === 'songs');
      els.navSongs.setAttribute('aria-selected', activeMenuTab === 'songs' ? 'true' : 'false');
    }

    if (activeMenuTab === 'setlists') {
      showSetlistsListView();
    } else {
      showSongsBrowseView();
    }
  }

  function updateSetlistMainTitle(title) {
    if (els.setlistSheetMainTitle) {
      els.setlistSheetMainTitle.textContent = title;
    }
  }

  // --- LEVEL 1: SETLISTS LIST VIEW ---
  function showSetlistsListView() {
    hideAllSetlistSubviews();
    if (els.setlistsListView) els.setlistsListView.hidden = false;
    updateSetlistMainTitle('SETLISTS');
    if (els.bottomAddBtnText) els.bottomAddBtnText.textContent = 'SETLIST';
    renderSetlistsList();
  }

  function renderSetlistsList() {
    if (!els.setlistsList) return;
    const allSetlists = getSetlists();
    let filtered = allSetlists;
    if (setlistSearchQuery) {
      const q = setlistSearchQuery.toLowerCase();
      filtered = allSetlists.filter((s) => s.name.toLowerCase().includes(q));
    }

    els.setlistsList.textContent = '';

    if (!filtered || filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'metro-setlist-empty';
      empty.innerHTML = `
        <i class="fa-solid fa-list-check metro-setlist-empty-icon" aria-hidden="true"></i>
        <p class="metro-setlist-empty-title">${setlistSearchQuery ? 'NO MATCHING SETLISTS' : 'NO SETLISTS YET'}</p>
        <p class="metro-setlist-empty-sub">${setlistSearchQuery ? `No setlists matching “${escHtmlShort(setlistSearchQuery)}”.` : 'Create your first setlist to organize songs for rehearsals or gigs.'}</p>
      `;
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'metro-setlist-empty-cta brutal-press';
      cta.innerHTML = '<i class="fa-solid fa-plus"></i> Create Setlist';
      cta.addEventListener('click', () => showSetlistNameModal(null));
      empty.appendChild(cta);
      els.setlistsList.appendChild(empty);
      return;
    }

    filtered.forEach((setlist) => {
      const card = document.createElement('div');
      card.className = 'metro-setlist-card brutal-press';
      if (metroState.activeSetlist && metroState.activeSetlist.id === setlist.id) {
        card.classList.add('active-setlist');
      }

      const info = document.createElement('div');
      info.className = 'metro-setlist-card-info';

      const title = document.createElement('span');
      title.className = 'metro-setlist-card-title';
      title.textContent = setlist.name;

      const meta = document.createElement('div');
      meta.className = 'metro-setlist-card-meta';

      const badge = document.createElement('span');
      badge.className = 'metro-setlist-card-badge';
      const count = (setlist.songs || []).length;
      badge.textContent = `${count} ${count === 1 ? 'SONG' : 'SONGS'}`;
      meta.appendChild(badge);

      if (metroState.activeSetlist && metroState.activeSetlist.id === setlist.id) {
        const liveTag = document.createElement('span');
        liveTag.className = 'metro-setlist-tag';
        liveTag.style.borderColor = 'var(--accent-neon-yellow)';
        liveTag.style.color = 'var(--accent-neon-yellow)';
        liveTag.textContent = 'ACTIVE';
        meta.appendChild(liveTag);
      }

      info.appendChild(title);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'metro-setlist-card-actions';

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'metro-setlist-card-play-btn brutal-press';
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      playBtn.setAttribute('aria-label', `Play setlist ${setlist.name}`);
      playBtn.title = `Play setlist ${setlist.name}`;
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (callbacks.onPlaySetlist) callbacks.onPlaySetlist(setlist.id);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'metro-setlist-card-del-btn brutal-press';
      delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      delBtn.title = `Delete setlist ${setlist.name}`;
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete setlist “${setlist.name}”?`)) {
          deleteSetlist(setlist.id);
          renderSetlistsList();
          showToast(`Deleted “${setlist.name}”`, 'info');
        }
      });

      actions.appendChild(playBtn);
      actions.appendChild(delBtn);

      card.appendChild(info);
      card.appendChild(actions);

      card.addEventListener('click', () => {
        showSetlistDetailView(setlist.id);
      });

      els.setlistsList.appendChild(card);
    });
  }

  // --- LEVEL 2: SETLIST DETAIL VIEW ---
  function showSetlistDetailView(setlistId) {
    currentSetlistDetailId = setlistId;
    const setlist = getSetlistById(setlistId);
    if (!setlist) {
      showSetlistsListView();
      return;
    }

    hideAllSetlistSubviews();
    if (els.setlistDetailView) els.setlistDetailView.hidden = false;

    updateSetlistMainTitle('SETLIST');
    if (els.setlistDetailTitle) els.setlistDetailTitle.textContent = setlist.name;
    if (els.bottomAddBtnText) els.bottomAddBtnText.textContent = 'SONGS';

    renderSetlistDetailSongs(setlist);
  }

  function renderSetlistDetailSongs(setlist) {
    if (!els.setlistDetailSongs) return;
    els.setlistDetailSongs.textContent = '';

    const songs = setlist.songs || [];
    if (els.setlistDetailCount) {
      els.setlistDetailCount.textContent = `${songs.length} ${songs.length === 1 ? 'SONG' : 'SONGS'}`;
    }

    if (songs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'metro-setlist-empty';
      empty.innerHTML = `
        <i class="fa-solid fa-music metro-setlist-empty-icon" aria-hidden="true"></i>
        <p class="metro-setlist-empty-title">NO SONGS IN THIS SETLIST</p>
        <p class="metro-setlist-empty-sub">Add songs from the KINS catalogue or custom songs to build your setlist order.</p>
      `;
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'metro-setlist-empty-cta brutal-press';
      cta.innerHTML = '<i class="fa-solid fa-plus"></i> Add Songs';
      cta.addEventListener('click', () => showSongPickerModal(setlist.id));
      empty.appendChild(cta);
      els.setlistDetailSongs.appendChild(empty);
      return;
    }

    songs.forEach((song, idx) => {
      const row = document.createElement('div');
      row.className = 'metro-setlist-song-row brutal-press';
      if (metroState.activeSetlist && metroState.activeSetlist.id === setlist.id && metroState.activeSetlistSongIdx === idx) {
        row.classList.add('active-loaded');
      }
      row.dataset.index = String(idx);
      row.dataset.songId = song.id || `${song.title}::${song.artist}`;

      const num = document.createElement('span');
      num.className = 'metro-setlist-song-num';
      num.textContent = `${idx + 1}.`;

      const info = document.createElement('div');
      info.className = 'metro-setlist-song-info';

      const title = document.createElement('span');
      title.className = 'metro-setlist-song-title';
      title.textContent = song.title;

      const sub = document.createElement('div');
      sub.className = 'metro-setlist-song-sub';
      sub.textContent = `${song.bpm} BPM • ${song.artist || 'Unknown'}`;

      if (song.timeSig) {
        const ts = document.createElement('span');
        ts.className = 'metro-setlist-tag';
        ts.textContent = song.timeSig;
        sub.appendChild(ts);
      }

      if (song.structure && song.structure.length > 0) {
        const totalBars = song.structure.reduce((sum, s) => sum + (Number(s.bars) || 0), 0);
        const structTag = document.createElement('span');
        structTag.className = 'metro-setlist-tag';
        structTag.textContent = `${song.structure.length} sec • ${totalBars} bars`;
        sub.appendChild(structTag);
      }

      info.appendChild(title);
      info.appendChild(sub);

      const ctrls = document.createElement('div');
      ctrls.className = 'metro-setlist-song-ctrls';

      const dragHandle = document.createElement('button');
      dragHandle.type = 'button';
      dragHandle.className = 'metro-setlist-song-drag-handle';
      dragHandle.innerHTML = '<i class="fa-solid fa-grip-lines" aria-hidden="true"></i>';
      dragHandle.setAttribute('aria-label', `Drag to reorder ${song.title}`);
      dragHandle.title = 'Hold and drag to reorder';
      dragHandle.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'metro-setlist-song-remove-btn';
      removeBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      removeBtn.setAttribute('aria-label', `Remove ${song.title} from setlist`);
      removeBtn.title = 'Remove song from setlist';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setlist.songs.splice(idx, 1);
        saveSetlists();
        renderSetlistDetailSongs(setlist);
        showToast(`Removed “${song.title}” from setlist`, 'info');
      });

      ctrls.appendChild(dragHandle);
      ctrls.appendChild(removeBtn);

      row.appendChild(num);
      row.appendChild(info);
      row.appendChild(ctrls);

      // Click to open song editor (suppressed if recent drag)
      row.addEventListener('click', () => {
        if (Date.now() < songDragSuppressClickUntil) return;
        if (songDragState && songDragState.isDragging) return;
        showSongEditView(song, { from: 'setlist-detail', setlistId: setlist.id, songIdx: idx });
      });

      // Hold card or handle and drag to reorder — pointer events cover mouse + touch
      attachSongRowDragHandlers(row, dragHandle, setlist, idx);

      els.setlistDetailSongs.appendChild(row);
    });
  }

  // --- LEVEL 1: SONGS BROWSE VIEW ---
  function showSongsBrowseView() {
    hideAllSetlistSubviews();
    if (els.songsBrowseView) els.songsBrowseView.hidden = false;
    updateSetlistMainTitle('SONGS');
    if (els.bottomAddBtnText) els.bottomAddBtnText.textContent = 'SONG';
    renderSetlistFilters();
    renderSetlistList();
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

      if (!btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => setActiveSetlistFilter(f));
      }
    });
  }

  function attachSongRowDragHandlers(row, handle, setlist, startIdx) {
    let pointerId = null;
    let startY = 0;
    let startX = 0;
    let didStartDrag = false;
    let placeholder = null;
    let rafId = null;
    let lastY = 0;

    const threshold = 6;
    const onPointerDown = (e) => {
      // Ignore right-click / non-primary
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // Don't hijack clicks on the remove button
      if (e.target.closest('.metro-setlist-song-remove-btn')) return;

      startX = e.clientX;
      startY = e.clientY;
      lastY = e.clientY;
      didStartDrag = false;
      pointerId = e.pointerId;

      const onMove = (ev) => {
        if (pointerId !== null && ev.pointerId !== pointerId) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        lastY = ev.clientY;
        if (!didStartDrag) {
          if (Math.abs(dy) < threshold && Math.abs(dx) < threshold) return;
          if (Math.abs(dx) > Math.abs(dy) * 1.2) {
            cleanup();
            return;
          }
          // Begin dragging
          didStartDrag = true;
          songDragState = { isDragging: true, row, setlist, startIdx };
          row.classList.add('is-dragging');
          try { row.setPointerCapture(pointerId); } catch (err) {}

          const rect = row.getBoundingClientRect();
          row.style.width = `${rect.width}px`;
          row.style.boxSizing = 'border-box';

          // Create placeholder in place of row
          placeholder = document.createElement('div');
          placeholder.className = 'metro-setlist-song-row drag-placeholder drop-placeholder-slot';
          placeholder.style.height = `${rect.height}px`;
          placeholder.style.width = '100%';
          placeholder.setAttribute('aria-hidden', 'true');
          row.parentNode.insertBefore(placeholder, row);

          // Position row as smooth floating overlay
          row.style.position = 'relative';
          row.style.zIndex = '100';
          row.style.transition = 'none';
          row.style.pointerEvents = 'none';
          row.style.transform = 'translate3d(0, 0, 0) scale(1.02) rotate(0.6deg)';
          if (els.setlistDetailSongs) els.setlistDetailSongs.style.touchAction = 'none';
        }

        if (!didStartDrag) return;
        if (ev.cancelable) ev.preventDefault();

        // Translate the floating overlay row directly with pointer
        row.style.transform = `translate3d(0, ${dy}px, 0) scale(1.02) rotate(0.6deg)`;

        // Move placeholder based on pointer Y
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            if (!placeholder || !placeholder.parentNode) return;
            const container = els.setlistDetailSongs;
            if (!container) return;
            const pointerY = lastY;
            const children = Array.from(container.children).filter((c) => c !== row && c !== placeholder && c.classList.contains('metro-setlist-song-row'));
            let inserted = false;
            for (let i = 0; i < children.length; i++) {
              const child = children[i];
              const r = child.getBoundingClientRect();
              const mid = r.top + r.height / 2;
              if (pointerY < mid) {
                if (placeholder.nextElementSibling !== child) {
                  container.insertBefore(placeholder, child);
                }
                inserted = true;
                break;
              }
            }
            if (!inserted && children.length > 0) {
              const last = children[children.length - 1];
              if (placeholder.previousElementSibling !== last) {
                container.appendChild(placeholder);
              }
            }
            // Auto-scroll container when near edges
            const cRect = container.getBoundingClientRect();
            const edge = 64;
            if (pointerY < cRect.top + edge) {
              container.scrollTop -= 10;
            } else if (pointerY > cRect.bottom - edge) {
              container.scrollTop += 10;
            }
          });
        }
      };

      const onUp = (ev) => {
        if (pointerId !== null && ev.pointerId !== pointerId && ev.type !== 'pointercancel') return;
        cleanup();
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        if (!didStartDrag) {
          return;
        }
        const container = els.setlistDetailSongs;
        if (container && placeholder && placeholder.parentNode) {
          const allChildren = Array.from(container.children);
          const phIdx = allChildren.indexOf(placeholder);
          let newIdx = 0;
          for (let i = 0; i < phIdx; i++) {
            const c = allChildren[i];
            if (c.classList.contains('metro-setlist-song-row') && c !== row && !c.classList.contains('drag-placeholder') && !c.classList.contains('drop-placeholder-slot')) newIdx++;
          }
          // Cleanup visuals
          row.classList.remove('is-dragging');
          row.style.width = '';
          row.style.position = '';
          row.style.zIndex = '';
          row.style.boxSizing = '';
          row.style.transform = '';
          row.style.transition = '';
          row.style.pointerEvents = '';
          try { row.releasePointerCapture(pointerId); } catch (err) {}
          if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
          if (container) container.style.touchAction = '';
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
          placeholder = null;
          songDragState = null;
          songDragSuppressClickUntil = Date.now() + 400;

          if (newIdx !== startIdx) {
            const songs = setlist.songs;
            const [moved] = songs.splice(startIdx, 1);
            const clamped = Math.max(0, Math.min(songs.length, newIdx));
            songs.splice(clamped, 0, moved);
            saveSetlists();
            renderSetlistDetailSongs(setlist);
            showToast(`Moved “${moved.title}” to #${clamped + 1}`, 'info');
          } else {
            if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
            renderSetlistDetailSongs(setlist);
          }
        } else {
          row.classList.remove('is-dragging');
          row.style.width = '';
          row.style.position = '';
          row.style.zIndex = '';
          row.style.transform = '';
          row.style.transition = '';
          row.style.pointerEvents = '';
          if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
          if (els.setlistDetailSongs) els.setlistDetailSongs.style.touchAction = '';
          songDragState = null;
          songDragSuppressClickUntil = Date.now() + 400;
        }
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };

      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp, { passive: true });
      window.addEventListener('pointercancel', onUp, { passive: true });
    };

    row.addEventListener('pointerdown', onPointerDown, { passive: true });
    handle.addEventListener('pointerdown', onPointerDown, { passive: true });
  }

  function setActiveSetlistFilter(filter) {
    if (!['inspires', 'covers', 'originals', 'custom'].includes(filter)) return;
    activeSetlistFilter = filter;
    renderSetlistFilters();
    renderSetlistList();
  }

  function bindSetlistSortBar() {
    if (!els.setlistSortBar) return;
    const chips = els.setlistSortBar.querySelectorAll('.metro-setlist-sort-chip');
    chips.forEach((chip) => {
      if (chip.dataset.bound) return;
      chip.dataset.bound = '1';
      chip.addEventListener('click', () => {
        const s = chip.getAttribute('data-sort') || 'default';
        activeSetlistSort = s;
        chips.forEach((c) => c.classList.toggle('active', c.getAttribute('data-sort') === s));
        renderSetlistList();
      });
    });
  }

  function renderSetlistList() {
    if (!els.setlistList) return;
    const entries = getFilteredSetlist();
    els.setlistList.textContent = '';

    if (!entries || entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'metro-setlist-empty';
      empty.innerHTML = `
        <i class="fa-solid fa-music metro-setlist-empty-icon" aria-hidden="true"></i>
        <p class="metro-setlist-empty-title">NO SONGS FOUND</p>
        <p class="metro-setlist-empty-sub">No songs found in this category.</p>
      `;
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'metro-setlist-empty-cta brutal-press';
      cta.innerHTML = '<i class="fa-solid fa-plus"></i> Create Song';
      cta.addEventListener('click', () => showSongEditView(null, { from: 'songs-browse' }));
      empty.appendChild(cta);
      els.setlistList.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'metro-setlist-row-wrap';

      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'metro-setlist-row brutal-press';
      if (lastSetlistEntry && lastSetlistEntry.title === entry.title && lastSetlistEntry.artist === entry.artist && lastSetlistEntry.bpm === entry.bpm) {
        row.classList.add('active-loaded');
      }

      const num = document.createElement('span');
      num.className = 'metro-setlist-bpm';
      num.textContent = `${entry.bpm}`;

      const text = document.createElement('span');
      text.className = 'metro-setlist-text';

      const titleWrap = document.createElement('span');
      titleWrap.className = 'metro-setlist-title-wrap';

      const title = document.createElement('span');
      title.className = 'metro-setlist-title';
      title.innerHTML = highlightSearch(entry.title, setlistSearchQuery);
      titleWrap.appendChild(title);

      if (entry.isCustom || entry.category === 'custom') {
        const badge = document.createElement('span');
        badge.className = 'metro-setlist-tag';
        badge.textContent = 'CUSTOM';
        titleWrap.appendChild(badge);
      }

      const metaRow = document.createElement('span');
      metaRow.className = 'metro-setlist-meta-row';

      const artist = document.createElement('span');
      artist.className = 'metro-setlist-artist';
      artist.innerHTML = highlightSearch(entry.artist, setlistSearchQuery);
      metaRow.appendChild(artist);

      if (entry.timeSig) {
        const tsTag = document.createElement('span');
        tsTag.className = 'metro-setlist-tag';
        tsTag.textContent = entry.timeSig;
        metaRow.appendChild(tsTag);
      }

      text.appendChild(titleWrap);
      text.appendChild(metaRow);

      const load = document.createElement('span');
      load.className = 'metro-setlist-load';
      load.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
      load.setAttribute('aria-hidden', 'true');
      load.title = `Load ${entry.title}`;

      row.appendChild(num);
      row.appendChild(text);
      row.appendChild(load);

      row.addEventListener('click', () => {
        if (callbacks.onSetlistSelect) {
          callbacks.onSetlistSelect(entry);
        }
      });

      rowWrapper.appendChild(row);

      // Edit song button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'metro-setlist-edit-btn brutal-press';
      editBtn.title = `Edit ${entry.title}`;
      editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showSongEditView(entry, { from: 'songs-browse' });
      });
      rowWrapper.appendChild(editBtn);

      els.setlistList.appendChild(rowWrapper);
    });
  }

  // --- LEVEL 3 / DIRECT: SONG DETAIL & STRUCTURE VIEW ---
  function showSongEditView(song, parentContext) {
    songEditParentContext = parentContext || { from: 'songs-browse' };
    currentEditingSong = song
      ? JSON.parse(JSON.stringify(song))
      : {
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: '',
          artist: '',
          bpm: metroState.bpm,
          timeSig: getTimeSignature().id || '4-4',
          category: 'custom',
          countIn: false,
          notes: '',
          structure: []
        };

    if (!Array.isArray(currentEditingSong.structure)) {
      currentEditingSong.structure = [];
    }

    hideAllSetlistSubviews();
    if (els.songEditView) els.songEditView.hidden = false;
    updateSetlistMainTitle(song ? 'SONG DETAILS' : 'NEW SONG');

    // Back Button — icon only
    if (els.songEditBackBtn) {
      els.songEditBackBtn.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i>';
    }

    if (els.songEditTitle) {
      els.songEditTitle.textContent = song && song.title ? song.title : 'NEW SONG';
    }

    // Populate Fields
    if (els.songFormTitle) els.songFormTitle.value = currentEditingSong.title || '';
    if (els.songFormArtist) els.songFormArtist.value = currentEditingSong.artist || '';
    if (els.songFormBpm) els.songFormBpm.value = String(currentEditingSong.bpm || metroState.bpm);
    if (els.songFormTimeSig) els.songFormTimeSig.value = currentEditingSong.timeSig || '4-4';
    if (els.songFormCategory) els.songFormCategory.value = currentEditingSong.category || 'custom';
    if (els.songFormCountIn) els.songFormCountIn.checked = !!currentEditingSong.countIn;
    if (els.songFormNotes) els.songFormNotes.value = currentEditingSong.notes || '';

    // Switch to details tab initially
    switchSongEditTab('details');
    renderStructureDeck();
  }

  function switchSongEditTab(tab) {
    songEditActiveTab = tab === 'structure' ? 'structure' : 'details';
    if (els.songEditTabDetails) {
      els.songEditTabDetails.classList.toggle('active', songEditActiveTab === 'details');
    }
    if (els.songEditTabStructure) {
      els.songEditTabStructure.classList.toggle('active', songEditActiveTab === 'structure');
    }
    if (els.songEditPaneDetails) els.songEditPaneDetails.hidden = songEditActiveTab !== 'details';
    if (els.songEditPaneStructure) els.songEditPaneStructure.hidden = songEditActiveTab !== 'structure';
  }

  function getFormDataSong() {
    if (!currentEditingSong) return null;
    const title = (els.songFormTitle ? els.songFormTitle.value : '').trim() || 'Untitled Song';
    const artist = (els.songFormArtist ? els.songFormArtist.value : '').trim() || 'Unknown Artist';
    const bpm = clampBpmLocal(parseInt(els.songFormBpm ? els.songFormBpm.value : '120', 10) || 120);
    const timeSig = (els.songFormTimeSig ? els.songFormTimeSig.value : '4-4').trim();
    const category = (els.songFormCategory ? els.songFormCategory.value : 'custom');
    const countIn = !!(els.songFormCountIn && els.songFormCountIn.checked);
    const notes = (els.songFormNotes ? els.songFormNotes.value : '').trim();

    return {
      ...currentEditingSong,
      title,
      artist,
      bpm,
      timeSig,
      category,
      countIn,
      notes,
      structure: Array.isArray(currentEditingSong.structure) ? currentEditingSong.structure : []
    };
  }

  function saveSongEditor() {
    const updated = getFormDataSong();
    if (!updated || !updated.title) {
      showToast('Please provide a song title', 'error');
      return;
    }

    if (songEditParentContext.from === 'setlist-detail' && songEditParentContext.setlistId) {
      const setlist = getSetlistById(songEditParentContext.setlistId);
      if (setlist && Array.isArray(setlist.songs)) {
        if (typeof songEditParentContext.songIdx === 'number' && setlist.songs[songEditParentContext.songIdx]) {
          setlist.songs[songEditParentContext.songIdx] = updated;
        } else {
          setlist.songs.push(updated);
        }
        saveSetlists();
        showToast(`Saved “${updated.title}” to ${setlist.name}`, 'success');
        showSetlistDetailView(setlist.id);
        return;
      }
    }

    // Otherwise save to customEntries library
    const idx = customEntries.findIndex((e) => e.id === updated.id || (e.title === updated.title && e.artist === updated.artist));
    if (idx !== -1) {
      customEntries[idx] = updated;
    } else {
      customEntries.unshift(updated);
    }
    saveCustomEntries();
    showToast(`Saved “${updated.title}”`, 'success');
    showSongsBrowseView();
  }

  function renderStructureDeck() {
    if (!els.structureDeck || !currentEditingSong) return;
    els.structureDeck.textContent = '';

    const sections = currentEditingSong.structure || [];
    const totalBars = sections.reduce((sum, s) => sum + (Number(s.bars) || 0), 0);

    if (els.structureSummary) {
      els.structureSummary.textContent = `${sections.length} SECTIONS • ${totalBars} BARS TOTAL`;
    }

    if (els.structureFlow) {
      if (sections.length === 0) {
        els.structureFlow.textContent = 'No sections added yet';
      } else {
        els.structureFlow.textContent = sections.map((s) => `${s.name} (${s.bars})`).join(' → ') + ` | ${totalBars} bars`;
      }
    }

    if (sections.length === 0) {
      const empty = document.createElement('p');
      empty.style.fontFamily = 'var(--font-secondary)';
      empty.style.fontSize = '0.74rem';
      empty.style.color = '#71717a';
      empty.style.margin = '4px 0';
      empty.textContent = 'Add sections below (+ Intro, + Verse, etc.) to set custom tempos, time signatures and bar lengths.';
      els.structureDeck.appendChild(empty);
      return;
    }

    const activeSong = metroState.activeSong;
    const isSongActive = !!(activeSong && currentEditingSong && (activeSong.id === currentEditingSong.id || activeSong.title === currentEditingSong.title));
    const activeSecIdx = isSongActive ? (metroState.currentSectionIdx || 0) : -1;

    sections.forEach((sec, idx) => {
      const card = document.createElement('div');
      const isCardActive = isSongActive && idx === activeSecIdx;
      card.className = `metro-structure-card${isCardActive ? ' is-active' : ''}`;
      card.dataset.sectionIndex = String(idx);

      // Header: Name input + Delete button
      const head = document.createElement('div');
      head.className = 'metro-structure-card-header';

      const nameIn = document.createElement('input');
      nameIn.type = 'text';
      nameIn.className = 'metro-structure-card-name-input';
      nameIn.value = sec.name || `Section ${idx + 1}`;
      nameIn.placeholder = 'Section name';
      nameIn.addEventListener('input', (e) => {
        sec.name = String(e.target.value).trim() || `Section ${idx + 1}`;
        if (els.structureFlow) {
          els.structureFlow.textContent = sections.map((s) => `${s.name} (${s.bars})`).join(' → ') + ` | ${totalBars} bars`;
        }
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'metro-structure-card-del-btn';
      delBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
      delBtn.title = 'Delete section';
      delBtn.addEventListener('click', () => {
        sections.splice(idx, 1);
        renderStructureDeck();
      });

      head.appendChild(nameIn);
      head.appendChild(delBtn);

      // Horizontal fields row: Bars, Time Signature & Custom BPM
      const row1 = document.createElement('div');
      row1.className = 'metro-structure-card-row';

      const barsField = document.createElement('div');
      barsField.className = 'metro-structure-card-field';
      barsField.innerHTML = '<span class="metro-structure-card-field-label">BARS</span>';
      const barsIn = document.createElement('input');
      barsIn.type = 'number';
      barsIn.min = '1';
      barsIn.max = '999';
      barsIn.className = 'metro-structure-card-num-input';
      barsIn.value = String(sec.bars || 8);
      barsIn.addEventListener('change', (e) => {
        sec.bars = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 8));
        renderStructureDeck();
      });
      barsField.appendChild(barsIn);

      const tsField = document.createElement('div');
      tsField.className = 'metro-structure-card-field';
      tsField.innerHTML = '<span class="metro-structure-card-field-label">TIME SIG</span>';
      const tsSelect = document.createElement('select');
      tsSelect.className = 'metro-structure-card-select';
      METRO_TIME_SIGNATURES.forEach((ts) => {
        const opt = document.createElement('option');
        opt.value = ts.id;
        opt.textContent = ts.label;
        if (sec.timeSig === ts.id || (!sec.timeSig && currentEditingSong.timeSig === ts.id)) {
          opt.selected = true;
        }
        tsSelect.appendChild(opt);
      });
      tsSelect.addEventListener('change', (e) => {
        sec.timeSig = e.target.value;
      });
      tsField.appendChild(tsSelect);

      const bpmField = document.createElement('div');
      bpmField.className = 'metro-structure-card-field';
      bpmField.innerHTML = '<span class="metro-structure-card-field-label">BPM</span>';
      const bpmIn = document.createElement('input');
      bpmIn.type = 'number';
      bpmIn.min = '20';
      bpmIn.max = '300';
      bpmIn.placeholder = String(currentEditingSong.bpm || 120);
      bpmIn.className = 'metro-structure-card-num-input';
      bpmIn.value = sec.bpm ? String(sec.bpm) : '';
      bpmIn.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!val || Number.isNaN(val)) {
          delete sec.bpm;
        } else {
          sec.bpm = clampBpmLocal(val);
        }
      });
      bpmField.appendChild(bpmIn);

      row1.appendChild(barsField);
      row1.appendChild(tsField);
      row1.appendChild(bpmField);

      // Footer: Position & Nav buttons
      const foot = document.createElement('div');
      foot.className = 'metro-structure-card-footer';

      const pos = document.createElement('span');
      pos.className = 'metro-structure-card-pos';
      pos.textContent = `#${idx + 1} / ${sections.length}`;

      const navBtns = document.createElement('div');
      navBtns.className = 'metro-structure-card-nav-btns';

      const leftBtn = document.createElement('button');
      leftBtn.type = 'button';
      leftBtn.className = 'metro-structure-reorder-btn brutal-press';
      leftBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
      leftBtn.title = 'Move section left';
      leftBtn.disabled = idx === 0;
      leftBtn.addEventListener('click', () => {
        if (idx > 0) {
          const tmp = sections[idx];
          sections[idx] = sections[idx - 1];
          sections[idx - 1] = tmp;
          renderStructureDeck();
        }
      });

      const rightBtn = document.createElement('button');
      rightBtn.type = 'button';
      rightBtn.className = 'metro-structure-reorder-btn brutal-press';
      rightBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
      rightBtn.title = 'Move section right';
      rightBtn.disabled = idx === sections.length - 1;
      rightBtn.addEventListener('click', () => {
        if (idx < sections.length - 1) {
          const tmp = sections[idx];
          sections[idx] = sections[idx + 1];
          sections[idx + 1] = tmp;
          renderStructureDeck();
        }
      });

      navBtns.appendChild(leftBtn);
      navBtns.appendChild(rightBtn);

      foot.appendChild(pos);
      foot.appendChild(navBtns);

      card.appendChild(head);
      card.appendChild(row1);
      card.appendChild(foot);

      els.structureDeck.appendChild(card);

      if (isCardActive) {
        setTimeout(() => {
          try {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } catch (err) {}
        }, 30);
      }
    });
  }

  function addStructurePreset(name, defaultBars) {
    if (!currentEditingSong) return;
    if (!Array.isArray(currentEditingSong.structure)) currentEditingSong.structure = [];
    currentEditingSong.structure.push({
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      bars: defaultBars || 8
    });
    renderStructureDeck();
  }

  // --- SETLIST NAME MODAL ---
  function showSetlistNameModal(setlistId) {
    editingSetlistNameId = setlistId;
    hideAllSetlistSubviews();
    if (els.setlistNameView) els.setlistNameView.hidden = false;
    updateSetlistMainTitle(setlistId ? 'EDIT SETLIST' : 'NEW SETLIST');

    const existing = setlistId ? getSetlistById(setlistId) : null;
    if (els.setlistNameTitle) els.setlistNameTitle.textContent = existing ? 'RENAME SETLIST' : 'NEW SETLIST';
    if (els.setlistNameInput) {
      els.setlistNameInput.value = existing ? existing.name : '';
      setTimeout(() => {
        try { els.setlistNameInput.focus(); } catch (e) {}
      }, 100);
    }
  }

  function saveSetlistNameModal() {
    const name = (els.setlistNameInput ? els.setlistNameInput.value : '').trim();
    if (!name) {
      showToast('Please enter a setlist name', 'error');
      return;
    }

    if (editingSetlistNameId) {
      const existing = getSetlistById(editingSetlistNameId);
      if (existing) {
        existing.name = name;
        saveSetlists();
        showToast(`Renamed to “${name}”`, 'success');
        showSetlistDetailView(existing.id);
        return;
      }
    }

    const created = upsertSetlist({ name, songs: [] });
    if (created) {
      showToast(`Created setlist “${name}”`, 'success');
      showSetlistDetailView(created.id);
    }
  }

  // --- SONG PICKER MODAL ---
  function showSongPickerModal(setlistId) {
    currentSetlistDetailId = setlistId;
    songPickerSelectedIds.clear();
    songPickerSearchQuery = '';
    if (els.pickerSearchInput) els.pickerSearchInput.value = '';
    if (els.songPickerModal) els.songPickerModal.hidden = false;
    renderSongPickerList();
  }

  function closeSongPickerModal() {
    if (els.songPickerModal) els.songPickerModal.hidden = true;
    songPickerSelectedIds.clear();
  }

  function renderSongPickerList() {
    if (!els.pickerList) return;
    els.pickerList.textContent = '';

    const allSongs = getAllEntriesForSearch();
    let filtered = allSongs;
    if (songPickerSearchQuery) {
      const q = songPickerSearchQuery.toLowerCase();
      filtered = allSongs.filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.style.color = '#a1a1aa';
      empty.style.fontSize = '0.76rem';
      empty.style.textAlign = 'center';
      empty.textContent = 'No matching songs found.';
      els.pickerList.appendChild(empty);
      return;
    }

    filtered.forEach((song) => {
      const key = song.id || `${song.title}::${song.artist}`;
      const item = document.createElement('label');
      item.className = 'metro-picker-item brutal-press';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'metro-picker-item-checkbox';
      cb.checked = songPickerSelectedIds.has(key);
      cb.addEventListener('change', () => {
        if (cb.checked) songPickerSelectedIds.add(key);
        else songPickerSelectedIds.delete(key);
        if (els.pickerCount) {
          els.pickerCount.textContent = `${songPickerSelectedIds.size} selected`;
        }
      });

      const info = document.createElement('div');
      info.className = 'metro-picker-item-info';

      const title = document.createElement('span');
      title.className = 'metro-picker-item-title';
      title.textContent = song.title;

      const sub = document.createElement('span');
      sub.className = 'metro-picker-item-sub';
      sub.textContent = `${song.bpm} BPM • ${song.artist}`;

      info.appendChild(title);
      info.appendChild(sub);

      item.appendChild(cb);
      item.appendChild(info);

      els.pickerList.appendChild(item);
    });

    if (els.pickerCount) {
      els.pickerCount.textContent = `${songPickerSelectedIds.size} selected`;
    }
  }

  function confirmSongPickerModal() {
    if (!currentSetlistDetailId) return;
    const setlist = getSetlistById(currentSetlistDetailId);
    if (!setlist) return;
    if (!Array.isArray(setlist.songs)) setlist.songs = [];

    const allSongs = getAllEntriesForSearch();
    let addedCount = 0;
    songPickerSelectedIds.forEach((key) => {
      const found = allSongs.find((s) => (s.id && s.id === key) || `${s.title}::${s.artist}` === key);
      if (found) {
        setlist.songs.push({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          songId: found.id || found.inspirationId || `song-${Date.now()}`,
          title: found.title,
          artist: found.artist,
          bpm: found.bpm,
          timeSig: found.timeSig || '4-4',
          countIn: !!found.countIn,
          structure: Array.isArray(found.structure) ? JSON.parse(JSON.stringify(found.structure)) : []
        });
        addedCount++;
      }
    });

    saveSetlists();
    closeSongPickerModal();
    showSetlistDetailView(setlist.id);
    showToast(`Added ${addedCount} song${addedCount === 1 ? '' : 's'} to ${setlist.name}`, 'success');
  }

  // --- BIND ALL SETLIST & SONG EVENTS ---
  function buildSetlist() {
    loadCustomEntries();
    loadSetlists();

    // 50/50 Navigation
    if (els.navSetlists) {
      els.navSetlists.addEventListener('click', () => switchMenuTab('setlists'));
    }
    if (els.navSongs) {
      els.navSongs.addEventListener('click', () => switchMenuTab('songs'));
    }

    // Setlist Detail Subview Events
    if (els.setlistDetailBackBtn) {
      els.setlistDetailBackBtn.addEventListener('click', showSetlistsListView);
    }
    if (els.setlistDetailPlayBtn) {
      els.setlistDetailPlayBtn.addEventListener('click', () => {
        if (currentSetlistDetailId && callbacks.onPlaySetlist) {
          callbacks.onPlaySetlist(currentSetlistDetailId);
        }
      });
    }
    if (els.setlistDetailEditNameBtn) {
      els.setlistDetailEditNameBtn.addEventListener('click', () => {
        if (currentSetlistDetailId) showSetlistNameModal(currentSetlistDetailId);
      });
    }
    if (els.setlistDetailAddSongBtn) {
      els.setlistDetailAddSongBtn.addEventListener('click', () => {
        if (currentSetlistDetailId) showSongPickerModal(currentSetlistDetailId);
      });
    }

    // Song Edit Subview Events
    if (els.songEditBackBtn) {
      els.songEditBackBtn.addEventListener('click', () => {
        if (songEditParentContext.from === 'setlist-detail' && songEditParentContext.setlistId) {
          showSetlistDetailView(songEditParentContext.setlistId);
        } else {
          showSongsBrowseView();
        }
      });
    }
    if (els.songEditPlayBtn) {
      els.songEditPlayBtn.addEventListener('click', () => {
        const song = getFormDataSong();
        if (song && callbacks.onPlaySong) {
          callbacks.onPlaySong(song);
        }
      });
    }
    if (els.songEditTabDetails) {
      els.songEditTabDetails.addEventListener('click', () => switchSongEditTab('details'));
    }
    if (els.songEditTabStructure) {
      els.songEditTabStructure.addEventListener('click', () => switchSongEditTab('structure'));
    }
    if (els.songEditCancelBtn) {
      els.songEditCancelBtn.addEventListener('click', () => {
        if (songEditParentContext.from === 'setlist-detail' && songEditParentContext.setlistId) {
          showSetlistDetailView(songEditParentContext.setlistId);
        } else {
          showSongsBrowseView();
        }
      });
    }
    if (els.songEditSaveBtn) {
      els.songEditSaveBtn.addEventListener('click', saveSongEditor);
    }
    if (els.songFormUseCurrentBpm) {
      els.songFormUseCurrentBpm.addEventListener('click', () => {
        if (els.songFormBpm) {
          els.songFormBpm.value = String(metroState.bpm || 120);
          showToast(`Set tempo to current BPM (${metroState.bpm})`, 'info');
        }
      });
    }
    if (els.songFormBpmTap) {
      els.songFormBpmTap.addEventListener('click', () => {
        const now = performance.now();
        songFormTapTimes.push(now);
        if (songFormTapTimes.length > 5) songFormTapTimes.shift();
        if (songFormTapTimes.length >= 2) {
          const intervals = [];
          for (let i = 1; i < songFormTapTimes.length; i++) intervals.push(songFormTapTimes[i] - songFormTapTimes[i - 1]);
          const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          if (avg > 0 && els.songFormBpm) {
            els.songFormBpm.value = String(clampBpmLocal(Math.round(60000 / avg)));
          }
        }
      });
    }

    // Web Lookup Search
    if (els.webSearchInput) {
      els.webSearchInput.addEventListener('input', (e) => {
        const query = (e.target.value || '').trim();
        if (els.webSearchClear) els.webSearchClear.hidden = !query;
        if (webSearchDebounceTimer) clearTimeout(webSearchDebounceTimer);
        if (!query) {
          if (els.webResults) els.webResults.textContent = '';
          return;
        }
        webSearchDebounceTimer = setTimeout(() => {
          performSongWebSearch(query);
        }, 250);
      });
    }

    if (els.webSearchClear) {
      els.webSearchClear.addEventListener('click', () => {
        if (els.webSearchInput) els.webSearchInput.value = '';
        els.webSearchClear.hidden = true;
        if (els.webResults) els.webResults.textContent = '';
      });
    }

    // Structure Presets
    if (els.presetIntro) els.presetIntro.addEventListener('click', () => addStructurePreset('Intro', 4));
    if (els.presetVerse) els.presetVerse.addEventListener('click', () => addStructurePreset('Verse', 8));
    if (els.presetChorus) els.presetChorus.addEventListener('click', () => addStructurePreset('Chorus', 8));
    if (els.presetBridge) els.presetBridge.addEventListener('click', () => addStructurePreset('Bridge', 8));
    if (els.presetSolo) els.presetSolo.addEventListener('click', () => addStructurePreset('Solo', 8));
    if (els.presetOutro) els.presetOutro.addEventListener('click', () => addStructurePreset('Outro', 4));
    if (els.presetCustom) els.presetCustom.addEventListener('click', () => addStructurePreset('Custom', 4));

    // Setlist Name Modal Events
    if (els.setlistNameBackBtn) {
      els.setlistNameBackBtn.addEventListener('click', () => {
        if (editingSetlistNameId) showSetlistDetailView(editingSetlistNameId);
        else showSetlistsListView();
      });
    }
    if (els.setlistNameCancelBtn) {
      els.setlistNameCancelBtn.addEventListener('click', () => {
        if (editingSetlistNameId) showSetlistDetailView(editingSetlistNameId);
        else showSetlistsListView();
      });
    }
    if (els.setlistNameSaveBtn) {
      els.setlistNameSaveBtn.addEventListener('click', saveSetlistNameModal);
    }
    if (els.setlistNameInput) {
      els.setlistNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveSetlistNameModal();
      });
    }

    // Song Picker Modal Events
    if (els.pickerCloseBtn) {
      els.pickerCloseBtn.addEventListener('click', closeSongPickerModal);
    }
    if (els.pickerConfirmBtn) {
      els.pickerConfirmBtn.addEventListener('click', confirmSongPickerModal);
    }
    if (els.pickerSearchInput) {
      els.pickerSearchInput.addEventListener('input', (e) => {
        songPickerSearchQuery = (e.target.value || '').trim();
        renderSongPickerList();
      });
    }

    // Fixed Bottom Controls
    if (els.bottomSearchInput) {
      els.bottomSearchInput.addEventListener('input', (e) => {
        const val = (e.target.value || '').trim();
        setlistSearchQuery = val;
        if (els.bottomSearchClear) els.bottomSearchClear.hidden = !val;

        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          if (activeMenuTab === 'setlists') {
            if (els.setlistDetailView && !els.setlistDetailView.hidden && currentSetlistDetailId) {
              const setlist = getSetlistById(currentSetlistDetailId);
              if (setlist) renderSetlistDetailSongs(setlist);
            } else {
              renderSetlistsList();
            }
          } else {
            renderSetlistList();
          }
        }, 120);
      });
    }

    if (els.bottomSearchClear) {
      els.bottomSearchClear.addEventListener('click', () => {
        setlistSearchQuery = '';
        if (els.bottomSearchInput) els.bottomSearchInput.value = '';
        els.bottomSearchClear.hidden = true;
        if (activeMenuTab === 'setlists') {
          if (els.setlistDetailView && !els.setlistDetailView.hidden && currentSetlistDetailId) {
            const setlist = getSetlistById(currentSetlistDetailId);
            if (setlist) renderSetlistDetailSongs(setlist);
          } else {
            renderSetlistsList();
          }
        } else {
          renderSetlistList();
        }
      });
    }

    if (els.bottomAddBtn) {
      els.bottomAddBtn.addEventListener('click', () => {
        if (activeMenuTab === 'setlists') {
          if (els.setlistDetailView && !els.setlistDetailView.hidden && currentSetlistDetailId) {
            showSongPickerModal(currentSetlistDetailId);
          } else {
            showSetlistNameModal(null);
          }
        } else {
          showSongEditView(null, { from: 'songs-browse' });
        }
      });
    }

    // Search pill expand/collapse — icon-only right corner, expands to full dock width
    if (els.bottomSearchPill && els.bottomSearchInput) {
      const pill = els.bottomSearchPill;
      const input = els.bottomSearchInput;
      const dock = els.bottomFixedDock;
      const closeBtn = els.bottomSearchCloseBtn;
      const clearBtn = els.bottomSearchClear;

      const expandSearch = () => {
        if (dock) dock.classList.add('is-search-expanded');
        pill.classList.add('expanded');
        if (closeBtn) closeBtn.hidden = false;
        requestAnimationFrame(() => {
          try { input.focus(); } catch (e) {}
        });
      };

      const collapseSearch = () => {
        input.value = '';
        setlistSearchQuery = '';
        if (clearBtn) clearBtn.hidden = true;
        if (closeBtn) closeBtn.hidden = true;
        pill.classList.remove('expanded');
        if (dock) dock.classList.remove('is-search-expanded');
        if (activeMenuTab === 'setlists') {
          if (els.setlistDetailView && !els.setlistDetailView.hidden && currentSetlistDetailId) {
            const setlist = getSetlistById(currentSetlistDetailId);
            if (setlist) renderSetlistDetailSongs(setlist);
          } else {
            renderSetlistsList();
          }
        } else {
          renderSetlistList();
        }
      };

      if (els.bottomSearchToggleBtn) {
        els.bottomSearchToggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          expandSearch();
        });
      }

      pill.addEventListener('click', (e) => {
        if (dock && dock.classList.contains('is-search-expanded')) {
          if (e.target === pill || e.target.closest('.metro-bottom-search-icon')) input.focus();
          return;
        }
        e.preventDefault();
        expandSearch();
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          collapseSearch();
        });
      }

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          collapseSearch();
        }
      });

      trackGlobal(document, 'click', (e) => {
        if (!dock || !dock.classList.contains('is-search-expanded')) return;
        if (pill.contains(e.target)) return;
        if (!input.value.trim()) {
          collapseSearch();
        }
      });
    }

    // Setlist Deck 4 Buttons (⏮ ◀ ▶ ⏭)
    if (els.deckPrevSong) {
      els.deckPrevSong.addEventListener('click', () => {
        if (callbacks.onPrevSong) callbacks.onPrevSong();
      });
    }
    if (els.deckPrevSection) {
      els.deckPrevSection.addEventListener('click', () => {
        if (callbacks.onPrevSection) callbacks.onPrevSection();
      });
    }
    if (els.deckNextSection) {
      els.deckNextSection.addEventListener('click', () => {
        if (callbacks.onNextSection) callbacks.onNextSection();
      });
    }
    if (els.deckNextSong) {
      els.deckNextSong.addEventListener('click', () => {
        if (callbacks.onNextSong) callbacks.onNextSong();
      });
    }

    // Exit playback from now-playing display between bottom buttons
    if (els.nowPlayingExit) {
      els.nowPlayingExit.addEventListener('click', () => {
        if (callbacks.onExitPlayback) callbacks.onExitPlayback();
      });
    }

    bindSetlistSortBar();
    switchMenuTab('setlists');
  }

  function clampBpmLocal(n) {
    return Math.min(300, Math.max(20, Math.round(Number(n) || 120)));
  }

  function deleteCustomEntry(entry) {
    customEntries = customEntries.filter((e) => !(entry.id && e.id === entry.id) && !(e.title === entry.title && e.artist === entry.artist));
    saveCustomEntries();
    renderSetlistList();
    showToast(`Removed “${entry.title}”`, 'info');
  }

  async function performSongWebSearch(query) {
    if (!els.webResults) return;
    els.webResults.innerHTML = `
      <div class="metro-setlist-loading">
        <i class="fa-solid fa-spinner" aria-hidden="true"></i>
        <span>Searching track catalogue…</span>
      </div>
    `;
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const results = data.results || [];
      els.webResults.textContent = '';
      if (results.length === 0) {
        els.webResults.innerHTML = `<p class="metro-setlist-empty-sub" style="text-align: center; margin: 16px auto;">No online tracks found for “${escHtmlShort(query)}”.</p>`;
        return;
      }
      results.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'metro-web-result-card brutal-press';

        const info = document.createElement('div');
        info.className = 'metro-web-result-info';

        const title = document.createElement('span');
        title.className = 'metro-web-result-title';
        title.textContent = item.trackName || 'Untitled Track';

        const meta = document.createElement('span');
        meta.className = 'metro-web-result-meta';
        const year = item.releaseDate ? item.releaseDate.slice(0, 4) : '';
        meta.textContent = `${item.artistName || 'Unknown'}${item.primaryGenreName ? ' • ' + item.primaryGenreName : ''}${year ? ' • ' + year : ''}`;

        info.appendChild(title);
        info.appendChild(meta);

        const importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.className = 'metro-web-result-import-btn brutal-press';
        importBtn.innerHTML = '<i class="fa-solid fa-arrow-down-to-bracket" aria-hidden="true"></i> USE';
        importBtn.title = `Import ${item.trackName}`;
        importBtn.addEventListener('click', () => {
          if (els.songFormTitle) els.songFormTitle.value = item.trackName || '';
          if (els.songFormArtist) els.songFormArtist.value = item.artistName || '';
          switchSongEditTab('details');
          showToast(`Imported “${item.trackName}”`, 'success');
        });

        card.appendChild(info);
        card.appendChild(importBtn);
        els.webResults.appendChild(card);
      });
    } catch (err) {
      if (els.webResults) {
        els.webResults.innerHTML = `<p class="metro-setlist-empty-sub" style="text-align: center; color: #ff6b6b; margin: 16px auto;">Search error. Check your connection or enter manually.</p>`;
      }
    }
  }

  // ---------- Live Topbar Setlist Playback & Undo ----------
  function renderTopbarPlayback() {
    if (!els.topbarCenter || !els.topbarPlayback) return;

    if (metroState.activeSetlist && metroState.activeSetlist.songs && metroState.activeSetlist.songs.length > 0) {
      const setlist = metroState.activeSetlist;
      const songIdx = metroState.activeSetlistSongIdx || 0;
      const song = setlist.songs[songIdx] || setlist.songs[0];

      if (els.topbarTitle) els.topbarTitle.hidden = true;
      if (els.topbarUndo) els.topbarUndo.hidden = true;
      els.topbarPlayback.hidden = false;
      setTopbarCenterVisible(true);

      if (els.topbarSetlistTitle) {
        els.topbarSetlistTitle.textContent = setlist.name;
        els.topbarSetlistTitle.hidden = false;
      }
      if (els.topbarSongTitle) els.topbarSongTitle.textContent = song.title;

      if (els.topbarSection && els.topbarSep) {
        if (metroState.isCountIn) {
          els.topbarSection.textContent = 'COUNT-IN';
          els.topbarSection.hidden = false;
          els.topbarSep.hidden = false;
        } else if (song.structure && song.structure.length > 0) {
          const sec = song.structure[metroState.currentSectionIdx || 0] || song.structure[0];
          els.topbarSection.textContent = `${sec.name} (Bar ${metroState.currentSectionBar || 1}/${sec.bars})`;
          els.topbarSection.hidden = false;
          els.topbarSep.hidden = false;
        } else {
          els.topbarSection.hidden = true;
          els.topbarSep.hidden = true;
        }
      }

      if (els.topbarCounter) {
        els.topbarCounter.textContent = `${songIdx + 1} / ${setlist.songs.length} TRACKS`;
        els.topbarCounter.hidden = false;
      }

      renderSetlistDeck();
      renderNowPlaying();
      syncActiveStructureCardHighlight();
      return;
    }

    if (metroState.activeSong) {
      const song = metroState.activeSong;
      if (els.topbarTitle) els.topbarTitle.hidden = true;
      if (els.topbarUndo) els.topbarUndo.hidden = true;
      els.topbarPlayback.hidden = false;
      setTopbarCenterVisible(true);

      if (els.topbarSetlistTitle) els.topbarSetlistTitle.hidden = true;
      if (els.topbarSongTitle) els.topbarSongTitle.textContent = song.title;

      if (els.topbarSection && els.topbarSep) {
        if (metroState.isCountIn) {
          els.topbarSection.textContent = 'COUNT-IN';
          els.topbarSection.hidden = false;
          els.topbarSep.hidden = false;
        } else if (song.structure && song.structure.length > 0) {
          const sec = song.structure[metroState.currentSectionIdx || 0] || song.structure[0];
          els.topbarSection.textContent = `${sec.name} (Bar ${metroState.currentSectionBar || 1}/${sec.bars})`;
          els.topbarSection.hidden = false;
          els.topbarSep.hidden = false;
        } else {
          els.topbarSection.hidden = true;
          els.topbarSep.hidden = true;
        }
      }

      if (els.topbarCounter) els.topbarCounter.hidden = true;

      renderSetlistDeck();
      renderNowPlaying();
      syncActiveStructureCardHighlight();
      return;
    }

    // No active playback
    els.topbarPlayback.hidden = true;
    renderSetlistDeck();
    renderNowPlaying();
    syncActiveStructureCardHighlight();
    if (!topbarTitleVisible && !topbarUndoVisible) {
      setTopbarCenterVisible(false);
    }
  }

  function syncActiveStructureCardHighlight() {
    if (!els.structureDeck) return;
    const cards = els.structureDeck.querySelectorAll('.metro-structure-card');
    if (!cards || cards.length === 0) return;
    const currentActiveSong = metroState.activeSong;
    const isSongActive = !!(currentActiveSong && currentEditingSong && (currentActiveSong.id === currentEditingSong.id || currentActiveSong.title === currentEditingSong.title));
    const activeSecIdx = isSongActive ? (metroState.currentSectionIdx || 0) : -1;

    cards.forEach((card, idx) => {
      const isActive = isSongActive && idx === activeSecIdx;
      card.classList.toggle('is-active', isActive);
      if (isActive) {
        try {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch (err) {}
      }
    });
  }

  function renderSetlistDeck() {
    if (!els.setlistDeck) return;
    const isSetlistPlaying = !!(metroState.activeSetlist && metroState.activeSetlist.songs && metroState.activeSetlist.songs.length > 0);
    // Deck replaces COACH DECK only during setlist playback; single-song playback shows neither deck nor replacement
    const shouldShowDeck = isSetlistPlaying && !coachLiveRunning;
    els.setlistDeck.hidden = !shouldShowDeck;

    // Swap COACH DECK ↔ setlist deck
    if (els.coachBtn) {
      if (shouldShowDeck) {
        els.coachBtn.hidden = true;
        els.coachBtn.classList.add('is-live-hidden');
        els.coachBtn.setAttribute('aria-hidden', 'true');
      } else if (!coachLiveRunning) {
        // Only restore coach button when coach live is not active (coach live controls its own visibility)
        els.coachBtn.hidden = false;
        els.coachBtn.classList.remove('is-live-hidden');
        els.coachBtn.removeAttribute('aria-hidden');
      }
    }

    if (!shouldShowDeck) return;

    if (els.deckPrevSong) {
      els.deckPrevSong.disabled = !metroState.activeSetlist || metroState.activeSetlistSongIdx <= 0;
    }
    if (els.deckPrevSection) {
      els.deckPrevSection.disabled = (metroState.currentSectionIdx || 0) <= 0;
    }
    if (els.deckNextSection) {
      const activeSong = metroState.activeSetlist
        ? metroState.activeSetlist.songs[metroState.activeSetlistSongIdx || 0]
        : metroState.activeSong;
      const structLen = (activeSong && activeSong.structure) ? activeSong.structure.length : 0;
      els.deckNextSection.disabled = structLen === 0 || (metroState.currentSectionIdx || 0) >= structLen - 1;
    }
    if (els.deckNextSong) {
      const songsLen = metroState.activeSetlist ? metroState.activeSetlist.songs.length : 0;
      els.deckNextSong.disabled = !metroState.activeSetlist || (metroState.activeSetlistSongIdx || 0) >= songsLen - 1;
    }
  }

  // ---------- Now Playing (between bottom buttons) + bar progress ----------
  function getSongTotalBars(song) {
    if (!song || !Array.isArray(song.structure) || song.structure.length === 0) return 0;
    return song.structure.reduce((sum, s) => sum + (Number(s.bars) || 0), 0);
  }

  function getSetlistTotalBars(setlist) {
    if (!setlist || !Array.isArray(setlist.songs) || setlist.songs.length === 0) return 0;
    return setlist.songs.reduce((sum, s) => sum + getSongTotalBars(s), 0);
  }

  function getCurrentAbsoluteBar() {
    if (metroState.activeSetlist && Array.isArray(metroState.activeSetlist.songs)) {
      const setlist = metroState.activeSetlist;
      const songIdx = metroState.activeSetlistSongIdx || 0;
      let total = 0;
      for (let i = 0; i < songIdx; i++) {
        total += getSongTotalBars(setlist.songs[i]);
      }
      const song = setlist.songs[songIdx];
      if (song && Array.isArray(song.structure) && song.structure.length > 0) {
        const secIdx = metroState.currentSectionIdx || 0;
        for (let i = 0; i < secIdx; i++) {
          total += Number(song.structure[i].bars) || 0;
        }
        total += metroState.currentSectionBar || 1;
      } else {
        total += 1;
      }
      return total;
    }
    if (metroState.activeSong) {
      const song = metroState.activeSong;
      if (Array.isArray(song.structure) && song.structure.length > 0) {
        const secIdx = metroState.currentSectionIdx || 0;
        let total = 0;
        for (let i = 0; i < secIdx; i++) total += Number(song.structure[i].bars) || 0;
        total += metroState.currentSectionBar || 1;
        return total;
      }
      return metroState.currentSectionBar || 1;
    }
    return 0;
  }

  function renderNowPlaying() {
    const hasSong = !!(metroState.activeSetlist || metroState.activeSong);
    if (!els.nowPlaying || !els.tapBtn) return;
    if (!hasSong) {
      els.nowPlaying.hidden = true;
      els.tapBtn.hidden = false;
      if (els.nowPlayingTitle) els.nowPlayingTitle.textContent = '';
      if (els.nowPlayingSection) els.nowPlayingSection.textContent = '';
      if (els.nowPlayingBars) els.nowPlayingBars.textContent = '';
      if (els.nowPlayingSep) els.nowPlayingSep.hidden = true;
      return;
    }
    let song = null;
    if (metroState.activeSetlist && Array.isArray(metroState.activeSetlist.songs)) {
      const idx = metroState.activeSetlistSongIdx || 0;
      song = metroState.activeSetlist.songs[idx] || metroState.activeSetlist.songs[0];
    } else {
      song = metroState.activeSong;
    }
    if (!song) {
      els.nowPlaying.hidden = true;
      els.tapBtn.hidden = false;
      return;
    }
    els.nowPlaying.hidden = false;
    els.tapBtn.hidden = true;
    if (els.nowPlayingTitle) {
      els.nowPlayingTitle.textContent = song.title || 'Untitled';
      try { els.nowPlayingTitle.title = song.title || ''; } catch (e) {}
    }
    let sectionName = '';
    let barText = '';
    if (metroState.isCountIn) {
      sectionName = 'COUNT-IN';
      barText = '1/1';
    } else if (song.structure && Array.isArray(song.structure) && song.structure.length > 0) {
      const secIdx = metroState.currentSectionIdx || 0;
      const sec = song.structure[secIdx] || song.structure[0];
      sectionName = sec ? (sec.name || `Section ${secIdx + 1}`) : '';
      const totalBars = metroState.activeSetlist ? getSetlistTotalBars(metroState.activeSetlist) : getSongTotalBars(song);
      const currentBar = getCurrentAbsoluteBar();
      if (totalBars > 0) barText = `${currentBar}/${totalBars}`;
      else barText = `${metroState.currentSectionBar || 1}/${sec.bars || ''}`.replace(/\/$/, '');
    } else {
      sectionName = '';
      barText = '';
    }
    if (els.nowPlayingSection) els.nowPlayingSection.textContent = sectionName;
    if (els.nowPlayingBars) els.nowPlayingBars.textContent = barText;
    if (els.nowPlayingSep) els.nowPlayingSep.hidden = !sectionName || !barText;
  }

  // ---------- Topbar setlist title / undo ----------
  function setTopbarCenterVisible(visible) {
    if (!els.topbarCenter) return;
    els.topbarCenter.hidden = !visible;
  }

  const COACH_MODE_TITLES = {
    'inner-clock': 'INNER CLOCK',
    'speed-trainer': 'SPEED TRAINER',
    'rhythm-step': 'RHYTHM STEP',
    'tempo-primer': 'TEMPO PRIMER'
  };

  function showTopbarModeTitle(tabId) {
    if (!els.topbarTitle || !els.topbarUndo) return;
    const title = COACH_MODE_TITLES[tabId] || (typeof tabId === 'string' ? tabId.replace('-', ' ').toUpperCase() : 'COACH DECK');
    els.topbarTitle.textContent = title;
    try { els.topbarTitle.title = `Coach Mode: ${title}`; } catch (e) {}
    els.topbarTitle.hidden = false;
    els.topbarUndo.hidden = true;
    topbarTitleVisible = false;
    topbarUndoVisible = false;
    setTopbarCenterVisible(true);
  }

  function clearTopbarModeTitle() {
    if (!els.topbarTitle || !els.topbarUndo) return;
    if (!topbarTitleVisible && !topbarUndoVisible) {
      els.topbarTitle.textContent = '';
      els.topbarTitle.hidden = true;
      setTopbarCenterVisible(false);
    }
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
    const METRO_SOUND_ICONS = {
      click: 'fa-solid fa-bullseye',
      woodblock: 'fa-solid fa-cube',
      cowbell: 'fa-solid fa-bell',
      rimshot: 'fa-solid fa-drum'
    };
    METRO_SOUNDS.forEach((sound) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'metro-chip brutal-press';
      chip.dataset.sound = sound.id;
      chip.setAttribute('aria-pressed', 'false');
      chip.setAttribute('aria-label', `${sound.label} click sound`);
      const icon = document.createElement('i');
      icon.className = METRO_SOUND_ICONS[sound.id] || 'fa-solid fa-music';
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = sound.label;
      chip.append(icon, label);
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

    // "Suggest a Module" CTA — distinct ghost button after the real tabs
    const suggestBtn = document.createElement('button');
    suggestBtn.type = 'button';
    suggestBtn.className = 'metro-coach-suggest-btn brutal-press';
    suggestBtn.setAttribute('aria-label', 'Suggest a new practice module');
    suggestBtn.setAttribute('data-track', 'metronome:coach_suggest_module');
    suggestBtn.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> SUGGEST';
    suggestBtn.addEventListener('click', () => {
      if (typeof window.openFeedbackModal === 'function') {
        window.openFeedbackModal('Metronome');
      } else {
        const modal = document.getElementById('feedbackModal');
        if (modal) {
          modal.classList.remove('hidden');
          document.body.classList.add('modal-open');
        }
      }
    });
    els.coachTablist.appendChild(suggestBtn);

    if (els.coachLive) {
      els.coachLive.textContent = '';
      els.coachLive.hidden = true;
    }
    if (els.coachLiveDock) {
      els.coachLiveDock.textContent = '';
      els.coachLiveDock.hidden = true;
    }
    if (els.coachBtn) els.coachBtn.hidden = false;
    updateCoachSheetCtas();
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
    const labAudVal = labAudible.querySelector('strong');
    attachClickToEditNumber(labAudVal, {
      getValue: () => metroState.coachInner.audibleBars,
      setValue: (val) => {
        if (callbacks.onCoachInnerChange) callbacks.onCoachInnerChange({ audibleBars: val });
        renderCoachInner();
      },
      min: 1,
      max: 64,
      format: (v) => `${v} ${v === 1 ? 'Bar' : 'Bars'}`,
      title: 'Click to enter custom audible bars'
    });

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
        if (lab && !lab.querySelector('input')) lab.textContent = `${val} ${val === 1 ? 'Bar' : 'Bars'}`;
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
    const labMutVal = labMuted.querySelector('strong');
    attachClickToEditNumber(labMutVal, {
      getValue: () => metroState.coachInner.mutedBars,
      setValue: (val) => {
        if (callbacks.onCoachInnerChange) callbacks.onCoachInnerChange({ mutedBars: val });
        renderCoachInner();
      },
      min: 1,
      max: 64,
      format: (v) => `${v} ${v === 1 ? 'Bar' : 'Bars'}`,
      title: 'Click to enter custom muted bars'
    });

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
        if (lab && !lab.querySelector('input')) lab.textContent = `${val} ${val === 1 ? 'Bar' : 'Bars'}`;
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
    cta.addEventListener('click', () => {
      if (coachLiveRunning && coachLiveTab === 'inner-clock') {
        if (callbacks.onCoachStop) callbacks.onCoachStop();
      } else {
        if (callbacks.onCoachStart) callbacks.onCoachStart('inner-clock');
      }
    });

    wrap.appendChild(head);
    wrap.appendChild(cycle);
    wrap.appendChild(gridBars);
    wrap.appendChild(fieldPresets);
    wrap.appendChild(randomBtn);
    wrap.appendChild(cta);
    return wrap;
  }

  function attachClickToEditNumber(el, { getValue, setValue, min = 1, max = 999, format = (v) => String(v), title = 'Click to edit number' }) {
    if (!el) return;
    el.classList.add('metro-coach-clickable-val');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', title);
    el.title = title;

    const startEdit = () => {
      if (el.querySelector('input')) return;
      const currentVal = getValue();
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'metro-coach-inline-num';
      input.inputMode = 'numeric';
      input.pattern = '[0-9]*';
      input.min = String(min);
      input.max = String(max);
      input.value = String(currentVal);
      el.textContent = '';
      el.appendChild(input);

      let finished = false;
      const commit = () => {
        if (finished) return;
        finished = true;
        const raw = input.value.trim();
        const parsed = parseInt(raw, 10);
        let finalVal = currentVal;
        if (!Number.isNaN(parsed)) {
          finalVal = Math.min(max, Math.max(min, parsed));
        }
        if (input.parentNode === el) {
          el.removeChild(input);
        }
        el.textContent = format(finalVal);
        setValue(finalVal);
      };

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          finished = true;
          if (input.parentNode === el) {
            el.removeChild(input);
          }
          el.textContent = format(currentVal);
        }
      });

      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    };

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      startEdit();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startEdit();
      }
    });
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
    const labStartVal = labStart.querySelector('strong');
    attachClickToEditNumber(labStartVal, {
      getValue: () => metroState.coachSpeed.start,
      setValue: (val) => {
        let targetBpm = metroState.coachSpeed.target;
        if (val > targetBpm) targetBpm = val;
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ start: val, target: targetBpm });
        renderCoachSpeed();
      },
      min: 30,
      max: 300,
      format: (v) => `${v} BPM`,
      title: 'Click to enter custom start BPM'
    });

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
        if (lab && !lab.querySelector('input')) lab.textContent = `${startBpm} BPM`;
        const tLab = document.getElementById('coachSpeedTargetVal');
        if (tLab && !tLab.querySelector('input')) tLab.textContent = `${targetBpm} BPM`;
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
    const labTargetVal = labTarget.querySelector('strong');
    attachClickToEditNumber(labTargetVal, {
      getValue: () => metroState.coachSpeed.target,
      setValue: (val) => {
        let startBpm = metroState.coachSpeed.start;
        if (val < startBpm) startBpm = val;
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ start: startBpm, target: val });
        renderCoachSpeed();
      },
      min: 30,
      max: 300,
      format: (v) => `${v} BPM`,
      title: 'Click to enter custom target BPM'
    });

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
        if (lab && !lab.querySelector('input')) lab.textContent = `${targetBpm} BPM`;
        const sLab = document.getElementById('coachSpeedStartVal');
        if (sLab && !sLab.querySelector('input')) sLab.textContent = `${startBpm} BPM`;
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
    const labStepVal = labStep.querySelector('strong');
    attachClickToEditNumber(labStepVal, {
      getValue: () => metroState.coachSpeed.step,
      setValue: (val) => {
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ step: val });
        renderCoachSpeed();
      },
      min: 1,
      max: 100,
      format: (v) => `+${v} BPM`,
      title: 'Click to enter custom step BPM'
    });

    const stepWrap = createCoachSliderWrap({
      id: 'coachSpeedStep',
      min: 1,
      max: Math.max(50, metroState.coachSpeed.step),
      step: 1,
      value: metroState.coachSpeed.step,
      ariaLabel: 'Step increment BPM',
      steppers: false,
      onInput: (v) => {
        const val = Math.round(v);
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ step: val });
        const stVal = document.getElementById('coachSpeedStepVal');
        if (stVal && !stVal.querySelector('input')) stVal.textContent = `+${val} BPM`;
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
    const curUnit = metroState.coachSpeed.unit;
    const curUnitLabel = curUnit === 'bars' ? (metroState.coachSpeed.everyBars === 1 ? 'Bar' : 'Bars') : (curUnit === 'seconds' ? (metroState.coachSpeed.everyBars === 1 ? 'Second' : 'Seconds') : (metroState.coachSpeed.everyBars === 1 ? 'Beat' : 'Beats'));
    labInt.innerHTML = `<span>CHANGE EVERY</span><strong id="coachSpeedEveryVal">${metroState.coachSpeed.everyBars} ${curUnitLabel}</strong>`;
    const labIntVal = labInt.querySelector('strong');
    attachClickToEditNumber(labIntVal, {
      getValue: () => metroState.coachSpeed.everyBars,
      setValue: (val) => {
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ everyBars: val });
        renderCoachSpeed();
      },
      min: 1,
      max: 999,
      format: (v) => `${v} ${metroState.coachSpeed.unit === 'bars' ? (v === 1 ? 'Bar' : 'Bars') : (metroState.coachSpeed.unit === 'seconds' ? (v === 1 ? 'Second' : 'Seconds') : (v === 1 ? 'Beat' : 'Beats'))}`,
      title: 'Click to enter custom interval amount'
    });

    const defaultMax = curUnit === 'seconds' ? 60 : (curUnit === 'beats' ? 64 : 32);
    const intWrap = createCoachSliderWrap({
      id: 'coachSpeedEvery',
      min: 1,
      max: Math.max(defaultMax, metroState.coachSpeed.everyBars),
      step: 1,
      value: metroState.coachSpeed.everyBars,
      ariaLabel: 'Interval amount',
      steppers: false,
      onInput: (v) => {
        const val = Math.round(v);
        if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ everyBars: val });
        const evLab = document.getElementById('coachSpeedEveryVal');
        if (evLab && !evLab.querySelector('input')) {
          const u = metroState.coachSpeed.unit;
          const uLab = u === 'bars' ? (val === 1 ? 'Bar' : 'Bars') : (u === 'seconds' ? (val === 1 ? 'Second' : 'Seconds') : (val === 1 ? 'Beat' : 'Beats'));
          evLab.textContent = `${val} ${uLab}`;
        }
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

    // Unit toggle full width row (BARS / BEATS / SECONDS expanded to whole width)
    const unitRow = document.createElement('div');
    unitRow.className = 'metro-coach-unit-row';
    unitRow.style.width = '100%';
    unitRow.style.display = 'flex';
    unitRow.style.boxSizing = 'border-box';

    const unitToggle = document.createElement('div');
    unitToggle.className = 'metro-unit-toggle metro-unit-toggle--full';
    unitToggle.id = 'coachSpeedUnitToggle';
    unitToggle.setAttribute('role', 'radiogroup');
    unitToggle.setAttribute('aria-label', 'Interval unit');
    unitToggle.style.width = '100%';
    unitToggle.style.flex = '1 1 auto';
    unitToggle.style.display = 'flex';

    const btnBars = document.createElement('button');
    btnBars.type = 'button';
    btnBars.className = `metro-unit-btn ${metroState.coachSpeed.unit === 'bars' ? 'active' : ''}`;
    btnBars.textContent = 'BARS';
    btnBars.dataset.unit = 'bars';
    btnBars.style.flex = '1 1 0';

    const btnBeats = document.createElement('button');
    btnBeats.type = 'button';
    btnBeats.className = `metro-unit-btn ${metroState.coachSpeed.unit === 'beats' ? 'active' : ''}`;
    btnBeats.textContent = 'BEATS';
    btnBeats.dataset.unit = 'beats';
    btnBeats.style.flex = '1 1 0';

    const btnSeconds = document.createElement('button');
    btnSeconds.type = 'button';
    btnSeconds.className = `metro-unit-btn ${metroState.coachSpeed.unit === 'seconds' ? 'active' : ''}`;
    btnSeconds.textContent = 'SECONDS';
    btnSeconds.dataset.unit = 'seconds';
    btnSeconds.style.flex = '1 1 0';

    const handleUnitSelect = (unit) => {
      if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ unit });
      btnBars.classList.toggle('active', unit === 'bars');
      btnBeats.classList.toggle('active', unit === 'beats');
      btnSeconds.classList.toggle('active', unit === 'seconds');
      renderCoachSpeed();
    };

    btnBars.addEventListener('click', () => handleUnitSelect('bars'));
    btnBeats.addEventListener('click', () => handleUnitSelect('beats'));
    btnSeconds.addEventListener('click', () => handleUnitSelect('seconds'));

    unitToggle.appendChild(btnBars);
    unitToggle.appendChild(btnBeats);
    unitToggle.appendChild(btnSeconds);
    unitRow.appendChild(unitToggle);

    // Actions row: Repeat 50% left + Direction 50% right (fills negative space)
    const actionsRow = document.createElement('div');
    actionsRow.className = 'metro-coach-actions-row';
    actionsRow.style.display = 'grid';
    actionsRow.style.gridTemplateColumns = '1fr 1fr';
    actionsRow.style.gap = '10px';
    actionsRow.style.width = '100%';
    actionsRow.style.boxSizing = 'border-box';

    const isRepeat = !!metroState.coachSpeed.repeat;
    const repeatBtn = document.createElement('button');
    repeatBtn.type = 'button';
    repeatBtn.id = 'coachSpeedRepeatBtn';
    repeatBtn.className = 'metro-coach-toggle-btn brutal-press' + (isRepeat ? ' active' : '');
    repeatBtn.setAttribute('aria-pressed', isRepeat ? 'true' : 'false');
    repeatBtn.innerHTML = `<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> <span>${escHtml(METRO_COPY.coachRepeat)}</span>`;
    repeatBtn.style.width = '100%';
    repeatBtn.style.flex = '1 1 50%';
    repeatBtn.style.maxWidth = 'none';
    repeatBtn.addEventListener('click', () => {
      const nextRepeat = !metroState.coachSpeed.repeat;
      if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ repeat: nextRepeat });
      renderCoachSpeed();
    });

    const currentDir = metroState.coachSpeed.direction === 'desc' ? 'desc' : 'asc';
    const isAsc = currentDir === 'asc';
    const directionBtn = document.createElement('button');
    directionBtn.type = 'button';
    directionBtn.id = 'coachSpeedDirectionBtn';
    directionBtn.className = 'metro-coach-toggle-btn brutal-press is-' + (isAsc ? 'asc active' : 'desc active');
    directionBtn.setAttribute('aria-pressed', isAsc ? 'false' : 'true');
    directionBtn.setAttribute('aria-label', isAsc ? 'Ascending (low to high)' : 'Descending (high to low)');
    directionBtn.title = isAsc ? 'Ascending — BPM goes up' : 'Descending — BPM goes down';
    directionBtn.innerHTML = isAsc
      ? `<i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> <span>ASCENDING</span>`
      : `<i class="fa-solid fa-arrow-trend-down" aria-hidden="true"></i> <span>DESCENDING</span>`;
    directionBtn.style.width = '100%';
    directionBtn.style.flex = '1 1 50%';
    directionBtn.addEventListener('click', () => {
      const cur = metroState.coachSpeed.direction === 'desc' ? 'desc' : 'asc';
      const nextDir = cur === 'asc' ? 'desc' : 'asc';
      if (callbacks.onCoachSpeedChange) callbacks.onCoachSpeedChange({ direction: nextDir });
      renderCoachSpeed();
    });

    actionsRow.appendChild(repeatBtn);
    actionsRow.appendChild(directionBtn);

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'metro-coach-cta brutal-press';
    cta.dataset.coachStart = 'speed-trainer';
    cta.innerHTML = '<i class="fa-solid fa-play"></i> ' + escHtml(METRO_COPY.coachStartSession);
    cta.addEventListener('click', () => {
      if (coachLiveRunning && coachLiveTab === 'speed-trainer') {
        if (callbacks.onCoachStop) callbacks.onCoachStop();
      } else {
        if (callbacks.onCoachStart) callbacks.onCoachStart('speed-trainer');
      }
    });

    wrap.appendChild(head);
    wrap.appendChild(cycle);
    wrap.appendChild(gridRange);
    wrap.appendChild(gridStep);
    wrap.appendChild(unitRow);
    wrap.appendChild(actionsRow);
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
    cta.addEventListener('click', () => {
      if (coachLiveRunning && coachLiveTab === 'rhythm-step') {
        if (callbacks.onCoachStop) callbacks.onCoachStop();
      } else {
        if (callbacks.onCoachStart) callbacks.onCoachStart('rhythm-step');
      }
    });

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
    const diffBlurb=document.createElement('p'); diffBlurb.id='coachPrimerDiffBlurb'; diffBlurb.style.margin='0'; diffBlurb.style.fontFamily='var(--font-secondary)'; diffBlurb.style.fontSize='0.72rem'; diffBlurb.style.fontWeight='700'; diffBlurb.style.color='var(--accent-neon-yellow)'; diffBlurb.style.textAlign='center';
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
    cta.addEventListener('click', () => {
      if (coachLiveRunning && coachLiveTab === 'tempo-primer') {
        if (callbacks.onCoachStop) callbacks.onCoachStop();
      } else {
        if (callbacks.onCoachStart) callbacks.onCoachStart('tempo-primer');
      }
    });

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
    updateCoachSheetCtas();
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
      const rnd=document.createElement('span'); rnd.textContent=' • RANDOM'; rnd.style.color='var(--accent-neon-yellow)'; rnd.style.fontSize='0.66rem'; rnd.style.marginLeft='4px';
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
      const dirTxt = s.direction === 'desc' ? ' DESC' : ' ASC';
      const repTxt = s.repeat ? ' • REPEAT ON • PING-PONG' : '';
      const arrow = s.direction === 'desc' ? '↓' : '↑';
      cyc.innerHTML = `<span>${escHtml(METRO_COPY.coachCycle)}:</span> <strong>${s.start} → ${s.target} BPM ${arrow} (+${s.step} / ${s.everyBars} ${s.unit.toUpperCase()}${dirTxt}${repTxt})</strong>`;
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
      const maxVal = Math.max(50, s.step);
      stEl.max = String(maxVal);
      if (document.activeElement !== stEl) stEl.value = String(s.step);
      updateRangeTrackFill(stEl, 1, maxVal, s.step);
    }
    if (evEl) {
      const defaultMax = s.unit === 'seconds' ? 60 : (s.unit === 'beats' ? 64 : 32);
      const maxVal = Math.max(defaultMax, s.everyBars);
      evEl.max = String(maxVal);
      if (document.activeElement !== evEl) evEl.value = String(s.everyBars);
      updateRangeTrackFill(evEl, 1, maxVal, s.everyBars);
    }
    if (repBtn) {
      repBtn.classList.toggle('active', !!s.repeat);
      repBtn.setAttribute('aria-pressed', s.repeat ? 'true' : 'false');
    }
    const dirBtn = document.getElementById('coachSpeedDirectionBtn');
    if (dirBtn) {
      const isAsc = s.direction !== 'desc';
      dirBtn.classList.add('active');
      dirBtn.classList.toggle('is-asc', isAsc);
      dirBtn.classList.toggle('is-desc', !isAsc);
      dirBtn.setAttribute('aria-pressed', isAsc ? 'false' : 'true');
      dirBtn.setAttribute('aria-label', isAsc ? 'Ascending (low to high)' : 'Descending (high to low)');
      dirBtn.title = isAsc ? 'Ascending — BPM goes up' : 'Descending — BPM goes down';
      dirBtn.innerHTML = isAsc
        ? `<i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> <span>ASCENDING</span>`
        : `<i class="fa-solid fa-arrow-trend-down" aria-hidden="true"></i> <span>DESCENDING</span>`;
    }
    const sVal = document.getElementById('coachSpeedStartVal');
    if (sVal && !sVal.querySelector('input')) sVal.textContent = `${s.start} BPM`;
    const tVal = document.getElementById('coachSpeedTargetVal');
    if (tVal && !tVal.querySelector('input')) tVal.textContent = `${s.target} BPM`;
    const stVal = document.getElementById('coachSpeedStepVal');
    if (stVal && !stVal.querySelector('input')) stVal.textContent = `+${s.step} BPM`;
    const evVal = document.getElementById('coachSpeedEveryVal');
    if (evVal && !evVal.querySelector('input')) {
      let unitLabel = 'Bars';
      if (s.unit === 'beats') unitLabel = s.everyBars === 1 ? 'Beat' : 'Beats';
      else if (s.unit === 'seconds') unitLabel = s.everyBars === 1 ? 'Second' : 'Seconds';
      else unitLabel = s.everyBars === 1 ? 'Bar' : 'Bars';
      evVal.textContent = `${s.everyBars} ${unitLabel}`;
    }
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

  function updateCoachSheetCtas() {
    if (!els.coachPanelsWrap) return;
    const ctas = els.coachPanelsWrap.querySelectorAll('.metro-coach-cta');
    ctas.forEach((btn) => {
      const tabId = btn.dataset.coachStart;
      if (coachLiveRunning && coachLiveTab === tabId) {
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> STOP SESSION';
        btn.classList.add('is-running');
      } else {
        btn.innerHTML = '<i class="fa-solid fa-play"></i> ' + escHtml(METRO_COPY.coachStartSession);
        btn.classList.remove('is-running');
      }
    });
  }

  function enterCoachLive(tabId) {
    coachLiveRunning = true;
    coachLiveTab = tabId;
    // hide the COACH DECK button, show live dock in its place, close sheet to reveal full page
    if (els.coachBtn) {
      els.coachBtn.hidden = true;
      els.coachBtn.classList.add('is-live-hidden');
      els.coachBtn.setAttribute('aria-hidden', 'true');
    }
    if (els.setlistDeck) els.setlistDeck.hidden = true;
    if (els.coachLiveDock) els.coachLiveDock.hidden = false;
    if (sheetOpen) closeSheet();
    // keep sheet tabs enabled for when user reopens
    if (els.coachTablist) {
      els.coachTablist.querySelectorAll('.metro-coach-tab').forEach(t=>{
        t.disabled = false;
        t.style.opacity = '1';
      });
    }
    showTopbarModeTitle(tabId);
    updateCoachSheetCtas();
    setupCoachLiveDom();
    renderCoachLive(null);
  }

  function exitCoachLive() {
    coachLiveRunning = false;
    coachLiveTab = null;
    clearTopbarModeTitle();
    if (els.coachLiveDock) { els.coachLiveDock.hidden = true; els.coachLiveDock.textContent = ''; }
    if (els.coachLive) { els.coachLive.hidden = true; els.coachLive.textContent = ''; }
    // Defer coachBtn visibility to renderSetlistDeck so setlist deck can reclaim the spot if needed
    if (els.coachBtn) {
      els.coachBtn.classList.remove('is-reviving');
      void els.coachBtn.offsetWidth; // force reflow for smooth animation
      // Don't unhide yet — renderSetlistDeck will handle it
    }
    renderSetlistDeck();
    renderTopbarPlayback();
    if (!els.setlistDeck || els.setlistDeck.hidden) {
      if (els.coachBtn) {
        els.coachBtn.hidden = false;
        els.coachBtn.classList.remove('is-live-hidden');
        els.coachBtn.removeAttribute('aria-hidden');
        els.coachBtn.classList.add('is-reviving');
        els.coachBtn.addEventListener('animationend', () => {
          els.coachBtn.classList.remove('is-reviving');
        }, { once: true });
      }
    }
    if (els.coachTablist) {
      els.coachTablist.querySelectorAll('.metro-coach-tab').forEach(t=>{
        t.disabled = false;
        t.style.opacity = '1';
      });
    }
    updateCoachSheetCtas();
    selectCoachTab(coachTab);
  }

  function setupCoachLiveDom() {
    const dock = els.coachLiveDock || els.coachLive;
    if (!dock) return;
    dock.textContent = '';

    const pill = document.createElement('div');
    pill.className = 'metro-coach-pill-bar';
    pill.id = 'metroCoachPillBar';

    // Bottom progress line
    const prog = document.createElement('div');
    prog.className = 'metro-coach-pill-prog';
    const progFill = document.createElement('div');
    progFill.className = 'metro-coach-pill-prog-fill';
    progFill.id = 'metroCoachPillProgFill';
    prog.appendChild(progFill);
    pill.appendChild(prog);

    // Left info block (pulsing red dot + rich live mode metrics)
    const info = document.createElement('div');
    info.className = 'metro-coach-pill-info';

    const dot = document.createElement('span');
    dot.className = 'metro-coach-pill-dot';
    dot.setAttribute('aria-hidden', 'true');

    const tag = document.createElement('div');
    tag.className = 'metro-coach-pill-tag';
    tag.id = 'metroCoachPillTag';

    info.appendChild(dot);
    info.appendChild(tag);
    pill.appendChild(info);

    // Right actions: STOP SESSION and Expand settings button
    const actions = document.createElement('div');
    actions.className = 'metro-coach-pill-actions';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.id = 'metroCoachPillRetry';
    retryBtn.className = 'metro-coach-pill-retry brutal-press';
    retryBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> <span>RETRY</span>';
    retryBtn.setAttribute('aria-label', 'Retry tempo primer test');
    retryBtn.style.display = 'none';
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (callbacks.onPrimerRetry) callbacks.onPrimerRetry();
    });
    actions.appendChild(retryBtn);

    const stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.id = 'metroCoachPillStop';
    stopBtn.className = 'metro-coach-pill-stop metro-coach-live-stop brutal-press';
    stopBtn.innerHTML = '<i class="fa-solid fa-stop"></i> <span>STOP SESSION</span>';
    stopBtn.setAttribute('aria-label', 'Stop training session');
    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (callbacks.onCoachStop) callbacks.onCoachStop();
    });
    actions.appendChild(stopBtn);

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.id = 'metroCoachPillExpand';
    expandBtn.className = 'metro-coach-pill-expand metro-coach-live-expand brutal-press';
    expandBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
    expandBtn.setAttribute('aria-label', METRO_COPY.coachOpenSettings);
    expandBtn.title = METRO_COPY.coachOpenSettings;
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (callbacks.onCoachExpand) callbacks.onCoachExpand();
    });
    actions.appendChild(expandBtn);

    pill.appendChild(actions);
    dock.appendChild(pill);
  }

  function renderCoachLive(snapshot) {
    if (!coachLiveRunning) return;
    const dock = els.coachLiveDock || els.coachLive;
    if (!dock) return;
    let pill = dock.querySelector('#metroCoachPillBar');
    if (!pill) {
      setupCoachLiveDom();
      pill = dock.querySelector('#metroCoachPillBar');
    }
    if (!pill) return;

    const progFill = pill.querySelector('#metroCoachPillProgFill');
    const tag = pill.querySelector('#metroCoachPillTag');
    const retryBtn = pill.querySelector('#metroCoachPillRetry');
    if (!tag) return;

    const tabId = coachLiveTab || coachTab;
    let pct = 0;

    if (tabId === 'inner-clock') {
      if (retryBtn) retryBtn.style.display = 'none';
      const isMuted = snapshot ? snapshot.phase === 'muted' : false;
      const a = metroState.coachInner.audibleBars;
      const m = metroState.coachInner.mutedBars;
      const phaseBar = snapshot ? snapshot.phaseBar : 0;
      const phaseTotal = isMuted ? m : a;
      pct = phaseTotal ? (phaseBar + 1) / phaseTotal : 0;
      const nextPhase = isMuted ? 'Audible' : 'Mute';
      const remainingBars = Math.max(0, phaseTotal - phaseBar - 1);
      if (isMuted) {
        tag.classList.add('is-muted');
        tag.innerHTML = `<span class="metro-coach-phase-badge muted">MUTED</span> <span class="metro-coach-pill-bold">Bar ${phaseBar + 1}/${m}</span> <span class="metro-coach-pill-sub">• Next: ${nextPhase} in ${remainingBars}b</span>`;
      } else {
        tag.classList.remove('is-muted');
        tag.innerHTML = `<span class="metro-coach-phase-badge audible">AUDIBLE</span> <span class="metro-coach-pill-bold">Bar ${phaseBar + 1}/${a}</span> <span class="metro-coach-pill-sub">• Next: ${nextPhase} in ${remainingBars}b</span>`;
      }
    } else if (tabId === 'speed-trainer') {
      if (retryBtn) retryBtn.style.display = 'none';
      const s = metroState.coachSpeed;
      const cur = snapshot ? snapshot.currentBpm : s.start;
      const stepIdx = snapshot ? snapshot.speedStepIdx : 0;
      const steps = snapshot ? snapshot.speedSteps : Math.ceil(Math.abs(s.target - s.start) / s.step);
      pct = steps ? stepIdx / steps : 0;
      let unitSuffix = 'b';
      if (s.unit === 'beats') unitSuffix = 'bt';
      else if (s.unit === 'seconds') unitSuffix = 's';
      tag.innerHTML = `<span class="metro-coach-pill-bold">${cur} → ${s.target} BPM</span> <span class="metro-coach-pill-sub">• Step ${stepIdx}/${steps} (+${s.step}/${s.everyBars}${unitSuffix})</span>`;
    } else if (tabId === 'rhythm-step') {
      if (retryBtn) retryBtn.style.display = 'none';
      const pat = metroState.coachRhythm.pattern;
      const idx = snapshot ? snapshot.rhythmIdx : 0;
      const curId = pat[idx] || pat[0];
      const labels = { '1-4': '1/4', '1-4t': '1/4T', '1-8': '1/8', '1-8t': '1/8T', '1-16': '1/16', '1-16t': '1/16T', '1-32': '1/32' };
      const every = metroState.coachRhythm.everyBars;
      const barMod = snapshot ? snapshot.barCount % every : 0;
      pct = barMod / Math.max(1, every);
      const nextIdx = (idx + 1) % pat.length;
      const nextSub = labels[pat[nextIdx]] || pat[nextIdx];
      const barsToNext = Math.max(0, every - barMod);
      tag.innerHTML = `<span class="metro-coach-pill-bold">${labels[curId] || curId}</span> <span class="metro-coach-pill-sub">• Next: ${nextSub} in ${barsToNext}b</span>`;
    } else if (tabId === 'tempo-primer') {
      if (snapshot && snapshot.primerResult) {
        if (retryBtn) retryBtn.style.display = 'inline-flex';
        const res = snapshot.primerResult;
        const sign = res.delta > 0 ? '+' : '';
        tag.innerHTML = `<span class="metro-coach-pill-bold">${res.recalled} BPM</span> <span class="metro-coach-grade-badge">${res.grade}</span> <span class="metro-coach-pill-sub">Δ ${sign}${res.delta}</span>`;
        pct = 1;
      } else {
        if (retryBtn) retryBtn.style.display = 'none';
        const target = snapshot ? snapshot.primerTarget : metroState.coachPrimer.target;
        const tapCount = snapshot ? snapshot.primerTaps.length : 0;
        pct = tapCount / 4;
        tag.innerHTML = `<span class="metro-coach-pill-bold">TARGET ${target} BPM</span> <span class="metro-coach-pill-sub">• ${tapCount < 4 ? `Tap ${tapCount}/4` : 'Scoring…'}</span>`;
      }
    }

    if (progFill) {
      progFill.style.transform = `scaleX(${Math.min(1, Math.max(0, pct))})`;
    }
  }

  function onMidiStateEvent(e) {
    const detail = e.detail || {};
    renderMidiState(detail);
    renderCoachPrimer();
    // also update tap badge
    if (coachLiveRunning && coachLiveTab==='tempo-primer') {
      // re-render live to show midi ready
    }
  }

  function bindMidiEvents() {
    /* kins:midi-tap is handled ONCE by index.js (canonical gate inside
       onPrimerTap). Binding it here too double-counted every pad hit —
       each tap pushed two timestamps into the primer, poisoning the
       recalled BPM (≈3× too fast, grade always "TRY AGAIN"). */
    trackGlobal(window, 'kins:midi-state', onMidiStateEvent);
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
    trackGlobal(document, 'keydown', onKeydown);

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

  function onDocPointerDownBpmEdit(e) {
    if (!bpmEditing) return;
    if (els.bpmNum && els.bpmNum.contains(e.target)) return;
    if (els.bpmInput && els.bpmInput.contains(e.target)) return;
  }

  function attachBpmEdit() {
    trackGlobal(document, 'pointerdown', onDocPointerDownBpmEdit);
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
    trackGlobal(window, 'pointerup', clearRepeat, { passive: true });
    trackGlobal(window, 'pointercancel', clearRepeat, { passive: true });
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
      const delta = e.deltaY > 0 ? -1 : 1;
      callbacks.onBpmStep(delta);
    }, { passive: false });
    const onPointerDown = (e) => {
      if (
        e.target.closest('.metro-pill') ||
        e.target.closest('.metro-stepper-btn') ||
        e.target.closest('.metro-beat-dot') ||
        e.target.closest('.metro-radial-seg')
      ) return;
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
      if (sheetOpen && els.songPickerModal && !els.songPickerModal.hidden) {
        closeSongPickerModal();
        e.stopPropagation();
        return;
      }
      if (sheetOpen && els.songEditView && !els.songEditView.hidden) {
        if (songEditParentContext.from === 'setlist-detail' && songEditParentContext.setlistId) {
          showSetlistDetailView(songEditParentContext.setlistId);
        } else {
          showSongsBrowseView();
        }
        e.stopPropagation();
        return;
      }
      if (sheetOpen && els.setlistNameView && !els.setlistNameView.hidden) {
        if (editingSetlistNameId) {
          showSetlistDetailView(editingSetlistNameId);
        } else {
          showSetlistsListView();
        }
        e.stopPropagation();
        return;
      }
      if (sheetOpen && els.setlistDetailView && !els.setlistDetailView.hidden) {
        showSetlistsListView();
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
    if (panel === els.panelSetlist) {
      switchMenuTab(activeMenuTab);
    }
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
    closeSongPickerModal();
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

  function isScrollableContainerAtTop(target, root) {
    if (!target) return true;
    let el = target;
    while (el && el !== root && el !== document.body) {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          if (el.scrollTop > 2) {
            return false;
          }
        }
      }
      el = el.parentElement;
    }
    return true;
  }

  function isPanelAtTop(panel) {
    if (!panel) return (els.sheet ? els.sheet.scrollTop <= 2 : true);
    if (panel === els.panelSettings) {
      return els.settingsScroll ? els.settingsScroll.scrollTop <= 2 : true;
    }
    if (panel === els.panelSetlist) {
      const activePane = panel.querySelector('.metro-view-pane:not([hidden])');
      if (activePane && activePane.scrollHeight > activePane.clientHeight + 1) {
        if (activePane.scrollTop > 2) return false;
      }
      const pickerList = document.querySelector('.metro-picker-list');
      if (pickerList && pickerList.scrollHeight > pickerList.clientHeight + 1) {
        if (pickerList.scrollTop > 2) return false;
      }
      return panel.scrollTop <= 2;
    }
    if (panel === els.panelCoach) {
      const activeCoachPanel = panel.querySelector('.metro-coach-panel:not([hidden]), .metro-coach-panels');
      if (activeCoachPanel && activeCoachPanel.scrollHeight > activeCoachPanel.clientHeight + 1) {
        if (activeCoachPanel.scrollTop > 2) return false;
      }
      return panel.scrollTop <= 2;
    }
    return panel.scrollTop <= 2;
  }

  function attachSheetDrag() {
    els.sheet.addEventListener('touchstart', (e) => {
      if (!sheetOpen || e.touches.length !== 1) return;
      // Don't start sheet drag when interacting with a reorderable song row
      if (songDragState && songDragState.isDragging) return;
      
      const target = e.target;
      const onHandle = Boolean(els.handle && (target === els.handle || els.handle.contains(target)));

      // If not on handle, ignore touch on interactive form controls or list items
      if (!onHandle && target && target.closest) {
        const isInteractive = target.closest('button, input, select, textarea, label, a, .metro-toggle, .metro-dual-range, .metro-color-input, .metro-setlist-song-row, .metro-setlist-song-drag-handle, .metro-stepper-btn, .metro-chip, .metro-sub-chip, .metro-beatstyle-chip, .metro-settings-btn-chip, .metro-coach-tab, .metro-setlist-filter, .metro-setlist-sort-chip, .metro-picker-item');
        if (isInteractive) return;
      }

      drag = {
        startY: e.touches[0].clientY,
        startX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
        startTime: performance.now(),
        engaged: false,
        onHandle,
        target,
        translateY: 0
      };
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd, { passive: true });
      document.addEventListener('touchcancel', onDragEnd, { passive: true });
    }, { passive: true });
  }

  function onDragMove(e) {
    if (!drag) return;
    // If a song is being reordered, abort sheet drag entirely
    if (songDragState && songDragState.isDragging) {
      cleanupDragListeners();
      drag = null;
      if (els.sheet) els.sheet.classList.remove('dragging');
      return;
    }
    const touch = e.touches[0];
    const dy = touch.clientY - drag.startY;
    const dx = touch.clientX - drag.startX;
    drag.lastY = touch.clientY;

    if (!drag.engaged) {
      if (drag.onHandle) {
        if (dy > 8) {
          drag.engaged = true;
          els.sheet.classList.add('dragging');
        } else if (dy < -8 || Math.abs(dx) > 16) {
          cleanupDragListeners();
          drag = null;
          return;
        } else {
          return;
        }
      } else {
        // Content-initiated drag: must be at top of active panel AND target scroll hierarchy
        const atTop = isPanelAtTop(activePanel) && isScrollableContainerAtTop(drag.target, els.sheet);
        const isVerticalPull = dy > 24 && Math.abs(dy) > Math.abs(dx) * 1.5;

        if (atTop && isVerticalPull) {
          drag.engaged = true;
          els.sheet.classList.add('dragging');
        } else if (Math.abs(dy) > 16 || Math.abs(dx) > 16 || dy < 0 || !atTop) {
          // Normal content scrolling or horizontal swipe — release sheet drag listener
          cleanupDragListeners();
          drag = null;
          return;
        } else {
          return;
        }
      }
    }

    if (e.cancelable) e.preventDefault();
    let targetY = Math.max(0, dy);
    if (targetY > 0) {
      targetY = targetY * 0.82;
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
    if (translateY > 120 || (translateY > 45 && velocity > 0.6)) {
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

  function updateTempoMarking(bpm) {
    if (!els.tempoMarking) return;
    const marking = getTempoMarking(bpm);

    if (tempoMarkingTimer !== null) {
      clearTimeout(tempoMarkingTimer);
      tempoMarkingTimer = null;
    }
    if (tempoMarkingHideTimer !== null) {
      clearTimeout(tempoMarkingHideTimer);
      tempoMarkingHideTimer = null;
    }

    els.tempoMarking.classList.remove('is-hiding');

    if (currentMarkingText !== marking) {
      currentMarkingText = marking;
      els.tempoMarking.textContent = marking;
      tempoSwapAlt = !tempoSwapAlt;
      els.tempoMarking.classList.remove('swap-anim-a', 'swap-anim-b');
      els.tempoMarking.classList.add(tempoSwapAlt ? 'swap-anim-a' : 'swap-anim-b');
    }

    els.tempoMarking.classList.add('is-visible');

    tempoMarkingTimer = setTimeout(() => {
      if (els.tempoMarking) {
        els.tempoMarking.classList.remove('is-visible', 'swap-anim-a', 'swap-anim-b');
        els.tempoMarking.classList.add('is-hiding');
        tempoMarkingHideTimer = setTimeout(() => {
          if (els.tempoMarking) {
            els.tempoMarking.classList.remove('is-hiding');
          }
          tempoMarkingHideTimer = null;
        }, 400);
      }
      tempoMarkingTimer = null;
    }, 1800);
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
    updateTempoMarking(metroState.bpm);
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
    renderBeatColors();
  }

  function renderBeatColors() {
    const map = [
      { tier: 'low', input: els.colorLow, hexEl: els.colorHexLow, dot: els.colorDotLow },
      { tier: 'mid', input: els.colorMid, hexEl: els.colorHexMid, dot: els.colorDotMid },
      { tier: 'high', input: els.colorHigh, hexEl: els.colorHexHigh, dot: els.colorDotHigh },
    ];
    map.forEach(({ tier, input, hexEl, dot }) => {
      const hex = getLevelColor(tier);
      if (input) input.value = hex;
      if (hexEl) hexEl.textContent = hex;
      if (dot) dot.style.background = hex;
    });
  }

  function bindBeatColorEvents() {
    const handleColorChange = (tier) => (e) => {
      const hex = e.target.value;
      const result = setLevelColor(tier, hex, true);
      if (result) {
        const hexEl = tier === 'low' ? els.colorHexLow : tier === 'mid' ? els.colorHexMid : els.colorHexHigh;
        const dot = tier === 'low' ? els.colorDotLow : tier === 'mid' ? els.colorDotMid : els.colorDotHigh;
        if (hexEl) hexEl.textContent = result;
        if (dot) dot.style.background = result;
        showToast(`${tier.toUpperCase()} color ${result}`, 'info');
      }
    };
    if (els.colorLow && !els.colorLow.dataset.bound) {
      els.colorLow.dataset.bound = '1';
      els.colorLow.addEventListener('input', handleColorChange('low'));
      els.colorLow.addEventListener('change', handleColorChange('low'));
    }
    if (els.colorMid && !els.colorMid.dataset.bound) {
      els.colorMid.dataset.bound = '1';
      els.colorMid.addEventListener('input', handleColorChange('mid'));
      els.colorMid.addEventListener('change', handleColorChange('mid'));
    }
    if (els.colorHigh && !els.colorHigh.dataset.bound) {
      els.colorHigh.dataset.bound = '1';
      els.colorHigh.addEventListener('input', handleColorChange('high'));
      els.colorHigh.addEventListener('change', handleColorChange('high'));
    }
    if (els.resetColorsBtn && !els.resetColorsBtn.dataset.bound) {
      els.resetColorsBtn.dataset.bound = '1';
      els.resetColorsBtn.addEventListener('click', () => {
        resetLevelColors(true);
        renderBeatColors();
        showToast('Beat colors reset to default', 'info');
      });
    }
    if (els.colorInfo && !els.colorInfo.dataset.bound) {
      els.colorInfo.dataset.bound = '1';
      els.colorInfo.addEventListener('click', () => {
        showToast('Tap beat dots or radial segments on the dial to cycle pitch tiers (Low / Mid / High / Mute). Customize colors for Low, Mid, and High beats below.', 'info');
      });
    }
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
    renderBeatColors,
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
    renderTopbarPlayback,
    renderSetlistDeck,
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
    get topbarPlayback() { return els.topbarPlayback; },
    get setlistDeck() { return els.setlistDeck; },
    get topbarCenter() { return els.topbarCenter; },
    get isSheetOpen() { return sheetOpen; },
    get coachLiveRunning() { return coachLiveRunning; },
    destroy: () => {
      releaseGlobalListeners();
    }
  };
}
