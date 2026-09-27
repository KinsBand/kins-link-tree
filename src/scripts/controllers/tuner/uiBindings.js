import { createReferenceAnimation } from './referenceAnimation.js';
import { createDisplayState, tensionZone } from './displayState.js';
import {
  TUNER_INSTRUMENTS,
  TUNER_INSTRUMENT_SHORT_LABELS,
  TUNER_CATEGORY_LABELS,
  TUNER_CATEGORY_ORDER,
  MATERIAL_PROFILES,
  TUNER_COPY,
  DETECT, noteToFreq
} from '../../../settings/tuner.config.ts';
import { showToast } from '../toast.js';
import { NOTE_NAMES, noteLetter } from './notesUtil.js';
import {
  state,
  getGroup, getProfile,
  getPreset,
  materialOptions,
  stringCountOptions,
  currentStringCount, setTolerance, setStringLabel, getStringGauges, setStringGauge
} from './tunerState.js';
import { getInstrumentArt } from './instrumentArt.js';

const SEARCH_DEBOUNCE_MS = 120;

/**
 * Title sanitization: strip explicit string-count indicators from tuning display names.
 * Pattern matches optional parens, count, optional hyphen/space, "string"/"strings"
 * with optional " version" suffix, case-insensitive, globally.
 * e.g. "Drop D (6 String)" -> "Drop D", "Open G 7 Strings Version" -> "Open G"
 * @param {string} name
 * @returns {string}
 */
export const TUNING_TITLE_SANITIZE_RE = /\s*\(?\d+[- ]?strings?(\s*version)?\)?/gi;
export function sanitizeTuningName(name) {
  if (typeof name !== 'string') return '';
  let out = name.replace(TUNING_TITLE_SANITIZE_RE, '').trim().replace(/\s{2,}/g, ' ');
  // Cleanup artifacts from partial parenthetical matches (e.g. "Standard (7-String B)" -> "Standard B)")
  // 1. Remove empty parentheses left behind: "()" or "( )"
  out = out.replace(/\(\s*\)/g, '').trim().replace(/\s{2,}/g, ' ');
  // 2. Fix stray closing paren without opening: "Standard B)" -> "Standard (B)"
  //    Detect trailing "<space>X)" without prior "("
  if (!out.includes('(') && /\s+[A-Za-z0-9]\)\s*$/.test(out)) {
    out = out.replace(/\s+([A-Za-z0-9])\)\s*$/, ' ($1)');
  } else if ((out.match(/\(/g) || []).length < (out.match(/\)/g) || []).length) {
    // More closes than opens: strip excess trailing closes
    out = out.replace(/\s*\)\s*$/, '').trim();
  }
  // 3. Fix stray opening paren without closing: "Open G (Keith Richards" -> "Open G (Keith Richards)"
  if ((out.match(/\(/g) || []).length > (out.match(/\)/g) || []).length) {
    // If there's an unmatched open, close it at end (preserving inner text)
    out = out.trim() + ')';
    out = out.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  }
  // 4. Final normalisation of spacing around parentheses
  out = out.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s{2,}/g, ' ').trim();
  // 5. Remove isolated stray parentheses at edges
  out = out.replace(/^\s*\(\s*$/, '').replace(/^\s*\)\s*$/, '').trim();
  return out;
}

/* Memoized text writes: identical consecutive values (the common case while
   a string rings) skip DOM invalidation entirely at the 20 Hz tick rate. */
function setText(memo, el, value) {
  if (!el || memo.get(el) === value) return;
  memo.set(el, value);
  el.textContent = value;
}

export function createUi(callbacks) {
  const eventLifetime = new AbortController();
  const timers = new Set();
  const frames = new Set();
  let disposed = false;
  let meterObserver = null;
  let viewMotion = null;
  let viewGeneration = 0;
  function setTimeout(callback, delay) {
    const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
    timers.add(id); return id;
  }
  function clearTimeout(id) { timers.delete(id); window.clearTimeout(id); }
  function requestAnimationFrame(callback) {
    const id = window.requestAnimationFrame(time => { frames.delete(id); if (!disposed) callback(time); });
    frames.add(id); return id;
  }
  function cancelAnimationFrame(id) { frames.delete(id); window.cancelAnimationFrame(id); }
  function destroy() {
    disposed = true; eventLifetime.abort();
    viewGeneration++;
    viewMotion?.cancel();
    meterObserver?.disconnect();
    for (const id of timers) window.clearTimeout(id);
    for (const id of frames) window.cancelAnimationFrame(id);
    timers.clear(); frames.clear(); cleanupSheetDragListeners();
    referenceAnimation.stop();
    textMemo.clear();
  }

  let els = null;
  let meterWidth = 0;
  let openMenuName = null;
  let openTriggerEl = null;
  let openPanelEl = null;
  let searchTimer = null;
  let figureListenerBound = false;
  let activeTargetEl = null;
  let activeFilter = 'all';
  const START_MIDI = 12; // C0, through G9 (the top of the MIDI note range).
  const END_MIDI = 127;
  let noteSpacing = 0;
  let railNotes = [];
  let activeRailMidi = null;
  let activeRailExact = false;
  let activeRailNearEl = null;
  let pegPulseTimer = null;
  let sheetOpen = false;
  let activeSheetPanel = null;
  let sheetTrigger = null;
  let copyBadgeTimer = null;
  let sheetDrag = null;
  let sheetDragRafId = null;
  let sheetReducedMotion = false;
  const textMemo = new Map();

  function cache() {
    els = {
      tunerView: document.getElementById('tunerView'),
      tuningView: document.getElementById('tuningView'),
      presetBtn: document.getElementById('tunerPresetBtn'),
      presetLabel: document.getElementById('tunerPresetLabel'),
      modeBtn: document.getElementById('tunerModeBtn'),
      modeLabel: document.getElementById('tunerModeLabel'),
      modeMenuSlot: document.getElementById('tunerModeMenuSlot'),
      stringsBtn: document.getElementById('tunerStringsBtn'),
      stringsLabel: document.getElementById('tunerStringsLabel'),
      stringsMenuSlot: document.getElementById('tunerStringsMenuSlot'),
      materialBtn: document.getElementById('tunerMaterialBtn'),
      materialLabel: document.getElementById('tunerMaterialLabel'),
      materialMenuSlot: document.getElementById('tunerMaterialMenuSlot'),
      readout: document.getElementById('tunerReadoutPanel'),
      micBtn: document.getElementById('tunerMicBtn'),
      micCta: document.getElementById('tunerMicToggleBtn'),
      meter: document.getElementById('tunerMeter'),
      needle: document.getElementById('tunerNeedle'),
      zoneWarnUp: document.getElementById('tunerZoneWarnUp'),
      zoneDanger: document.getElementById('tunerZoneDanger'),
      zoneDead: document.getElementById('tunerZoneDead'),
      zoneLoose: document.getElementById('tunerZoneLoose'),
      chromRail: document.getElementById('tunerChromRail'),
      chromTape: document.getElementById('tunerChromTape'),
      badgeLow: document.getElementById('tunerBadgeLow'),
      badgeHigh: document.getElementById('tunerBadgeHigh'),
      cents: document.getElementById('tunerCentsReadout'),
      settingsBtn: document.getElementById('tunerSettingsBtn'),
      settingsBtnBottom: document.getElementById('tunerSettingsBtnBottom'),
      status: document.getElementById('tunerStatusLine'),
      note: document.getElementById('tunerDetectedNote'),
      noteOctave: document.getElementById('tunerDetectedNoteOctave'),
      freq: document.getElementById('tunerDetectedFreq'),
      hint: document.getElementById('tunerDirectionHint'),
      micWarning: document.getElementById('tunerMicWarning'),
      lowMicHint: document.getElementById('tunerLowMicHint'),
      figure: document.getElementById('tunerFigure'),
      instrumentRow: document.getElementById('tunerInstrumentRow'),
      instrumentBtn: document.getElementById('tunerInstrumentBtn'),
      instrumentLabel: document.getElementById('tunerInstrumentLabel'),
      instrumentMenuSlot: document.getElementById('tunerInstrumentMenuSlot'),
      categoryList: document.getElementById('tunerCategoryList'),
      a4Chips: document.getElementById('tunerA4Chips'),
      backToTunerBtn: document.getElementById('tunerBackToTunerBtn'),
      searchClearBtn: document.getElementById('tunerSearchClearBtn'),
      searchInput: document.getElementById('tunerSearchInput'),
      filterChips: Array.from(document.querySelectorAll('.tuning-filter-chip')),
      sheetBackdrop: document.getElementById('tunerSheetBackdrop'),
      sheet: document.getElementById('tunerSheet'),
      sheetHandle: document.getElementById('tunerSheetHandle'),
      panelSettings: document.getElementById('tunerPanelSettings'),
      sheetInstrumentRow: document.getElementById('tunerSheetInstrumentRow'),
      sheetModeRow: document.getElementById('tunerSheetModeRow'),
      sheetStringsBtn: document.getElementById('tunerSheetStringsBtn'),
      sheetStringsLabelSheet: document.getElementById('tunerSheetStringsLabel'),
      sheetStringsSlot: document.getElementById('tunerSheetStringsSlot'),
      sheetMaterialBtnSheet: document.getElementById('tunerSheetMaterialBtn'),
      sheetMaterialLabelSheet: document.getElementById('tunerSheetMaterialLabelSheet'),
      sheetMaterialSlot: document.getElementById('tunerSheetMaterialSlot'),
      sheetMaterialRow: document.getElementById('tunerSheetMaterialRow'),
      sheetA4Row: document.getElementById('tunerSheetA4Row'),
      sheetAutoAdvance: document.getElementById('tunerSheetAutoAdvance'),
      sheetAutoId: document.getElementById('tunerSheetAutoId'),
      copyLinkBtn: document.getElementById('tunerCopyLinkBtn'),
      copyBadge: document.getElementById('tunerCopyBadge')
    };
  }

  function invalidateMeterRect() {
    if (!els || !els.meter) return;
    meterWidth = els.meter.clientWidth || 0;
    layoutZones();
    if (state && state.mode === 'chromatic') {
      centerRailDefault();
    }
  }

  async function switchTunerView(next, focusTarget, direction) {
    const generation = ++viewGeneration;
    viewMotion?.cancel();
    closeMenus();
    const views = [els.tunerView, els.tuningView];
    const previous = views.find(view => !view.hidden);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tokens = getComputedStyle(next);
    const duration = parseFloat(tokens.getPropertyValue('--tuner-view-duration'));
    const offset = tokens.getPropertyValue('--tuner-view-offset').trim();
    const easing = tokens.getPropertyValue('--ease-snappy').trim();
    if (previous && previous !== next && !reduced) {
      previous.inert = true;
      viewMotion = previous.animate([
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(${direction > 0 ? '-' : ''}${offset})` },
      ], { duration: duration / 2, easing, fill: 'forwards' });
      await viewMotion.finished.catch(() => {});
      if (disposed || generation !== viewGeneration) return;
      viewMotion.cancel();
    }
    for (const view of views) { view.hidden = view !== next; view.inert = view !== next; }
    window.scrollTo(0, 0);
    invalidateMeterRect();
    if (!reduced && previous !== next) {
      viewMotion = next.animate([
        { opacity: 0, transform: `translateX(${direction < 0 ? '-' : ''}${offset})` },
        { opacity: 1, transform: 'translateX(0)' },
      ], { duration, easing });
      await viewMotion.finished.catch(() => {});
      if (disposed || generation !== viewGeneration) return;
    }
    viewMotion = null;
    focusTarget?.focus({ preventScroll: true });
  }

  function showTunerView() {
    void switchTunerView(els.tunerView, els.presetBtn, -1);
  }

  function showTuningView() {
    renderTuningList(getSearchQuery());
    void switchTunerView(els.tuningView, els.backToTunerBtn, 1);
  }

  function closeMenus(restoreFocus) {
    const trigger = openTriggerEl;
    const panel = openPanelEl;
    const hadMenu = !!openMenuName;
    openMenuName = null;
    openTriggerEl = null;
    openPanelEl = null;
    if (!els) return;
    // Return focus to the trigger when the menu was dismissed without an
    // explicit choice (Escape / outside click) and focus is loose or inside
    // the panel that is about to be removed.
    if (
      hadMenu &&
      restoreFocus &&
      trigger &&
      (!document.activeElement || document.activeElement === document.body || (panel && panel.contains(document.activeElement)))
    ) {
      trigger.focus();
    }
    if (els.sheetStringsBtn) els.sheetStringsBtn.setAttribute('aria-expanded', 'false');
    if (els.sheetMaterialBtnSheet) els.sheetMaterialBtnSheet.setAttribute('aria-expanded', 'false');

    if (panel) {
      panel.classList.add('is-closing');
      setTimeout(() => {
        if (panel.parentElement) {
          panel.remove();
        }
      }, 150);
    } else {
      if (els.modeMenuSlot) els.modeMenuSlot.innerHTML = '';
      if (els.stringsMenuSlot) els.stringsMenuSlot.innerHTML = '';
      if (els.materialMenuSlot) els.materialMenuSlot.innerHTML = '';
      if (els.instrumentMenuSlot) els.instrumentMenuSlot.innerHTML = '';
      if (els.sheetStringsSlot) els.sheetStringsSlot.innerHTML = '';
      if (els.sheetMaterialSlot) els.sheetMaterialSlot.innerHTML = '';
    }
  }

  function toggleMenu(name, renderFn, btn) {
    if (openMenuName === name) {
      closeMenus(false);
      return;
    }
    closeMenus(false);
    if (sheetOpen) closeSheet();
    openMenuName = name;
    openTriggerEl = btn || null;
    renderFn();
  }

  function toggleSheetMenu(name, renderFn, btn) {
    // Sheet-internal dropdowns open upward without closing the sheet
    if (openMenuName === name) {
      closeMenus(false);
      return;
    }
    // clear only menu panels, keep sheet open
    if (els.modeMenuSlot) els.modeMenuSlot.innerHTML = '';
    if (els.stringsMenuSlot) els.stringsMenuSlot.innerHTML = '';
    if (els.materialMenuSlot) els.materialMenuSlot.innerHTML = '';
    if (els.instrumentMenuSlot) els.instrumentMenuSlot.innerHTML = '';
    if (els.sheetStringsSlot) els.sheetStringsSlot.innerHTML = '';
    if (els.sheetMaterialSlot) els.sheetMaterialSlot.innerHTML = '';
    if (els.sheetStringsBtn) els.sheetStringsBtn.setAttribute('aria-expanded', 'false');
    if (els.sheetMaterialBtnSheet) els.sheetMaterialBtnSheet.setAttribute('aria-expanded', 'false');
    openMenuName = name;
    openTriggerEl = btn || null;
    if (btn) btn.setAttribute('aria-expanded', 'true');
    renderFn();
  }

  /* ---------- Tuner settings sheet (mirrors metronome sheet) ---------- */
  function openSheet(panel, trigger) {
    if (!els || !els.sheet || !els.sheetBackdrop || !panel) return;
    closeMenus(false);
    if (sheetOpen && activeSheetPanel === panel) return;
    if (els.panelSettings) els.panelSettings.hidden = els.panelSettings !== panel;
    if (sheetTrigger && sheetTrigger !== trigger) {
      sheetTrigger.setAttribute('aria-expanded', 'false');
    }
    sheetTrigger = trigger || null;
    if (els.settingsBtn) els.settingsBtn.setAttribute('aria-expanded', sheetTrigger === els.settingsBtn ? 'true' : 'false');
    if (els.settingsBtnBottom) els.settingsBtnBottom.setAttribute('aria-expanded', sheetTrigger === els.settingsBtnBottom ? 'true' : 'false');
    renderSheetSettings();
    els.sheet.classList.remove('is-closing');
    els.sheetBackdrop.classList.remove('is-closing');
    els.sheet.hidden = false;
    els.sheetBackdrop.hidden = false;
    requestAnimationFrame(() => {
      if (!els.sheet || !els.sheetBackdrop) return;
      els.sheet.classList.add('open');
      els.sheetBackdrop.classList.add('open');
    });
    els.sheet.focus({ preventScroll: true });
    sheetOpen = true;
    activeSheetPanel = panel;
  }

  function closeSheet() {
    if (!sheetOpen || !els || !els.sheet || !els.sheetBackdrop) return;
    sheetOpen = false;
    activeSheetPanel = null;
    els.sheet.classList.remove('open');
    els.sheetBackdrop.classList.remove('open');
    els.sheet.classList.add('is-closing');
    els.sheetBackdrop.classList.add('is-closing');
    els.sheet.style.transform = '';
    if (sheetTrigger) {
      sheetTrigger.setAttribute('aria-expanded', 'false');
      // also reset the other trigger
      if (els.settingsBtn && sheetTrigger !== els.settingsBtn) els.settingsBtn.setAttribute('aria-expanded', 'false');
      if (els.settingsBtnBottom && sheetTrigger !== els.settingsBtnBottom) els.settingsBtnBottom.setAttribute('aria-expanded', 'false');
      sheetTrigger.focus({ preventScroll: true });
      sheetTrigger = null;
    } else {
      if (els.settingsBtn) els.settingsBtn.setAttribute('aria-expanded', 'false');
      if (els.settingsBtnBottom) els.settingsBtnBottom.setAttribute('aria-expanded', 'false');
    }
    const done = () => {
      if (sheetOpen || !els.sheet || !els.sheetBackdrop) return;
      els.sheet.classList.remove('is-closing');
      els.sheetBackdrop.classList.remove('is-closing');
      els.sheet.hidden = true;
      els.sheetBackdrop.hidden = true;
    };
    if (sheetReducedMotion) {
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

  function attachSheetDrag() {
    if (!els || !els.sheet || !els.sheetHandle) return;
    els.sheet.addEventListener('touchstart', (e) => {
      if (!sheetOpen || e.touches.length !== 1) return;
      const target = e.target;
      const onHandle = Boolean(els.sheetHandle && (target === els.sheetHandle || els.sheetHandle.contains(target)));

      if (!onHandle && target && target.closest) {
        const isInteractive = target.closest('button, input, select, textarea, label, a, .tuner-sheet-inst-chip, .tuner-sheet-mode-chip, .tuner-sheet-setup-btn');
        if (isInteractive) return;
      }

      sheetDrag = {
        startY: e.touches[0].clientY,
        startX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
        startTime: performance.now(),
        engaged: false,
        onHandle,
        target,
        translateY: 0
      };
      document.addEventListener('touchmove', onSheetDragMove, { ...({ passive: false }), signal: eventLifetime.signal });
      document.addEventListener('touchend', onSheetDragEnd, { ...({ passive: true }), signal: eventLifetime.signal });
      document.addEventListener('touchcancel', onSheetDragEnd, { ...({ passive: true }), signal: eventLifetime.signal });
    }, { ...({ passive: true }), signal: eventLifetime.signal });
  }

  function onSheetDragMove(e) {
    if (!sheetDrag || !els || !els.sheet || !els.sheetHandle) return;
    const touch = e.touches[0];
    const dy = touch.clientY - sheetDrag.startY;
    const dx = touch.clientX - sheetDrag.startX;
    sheetDrag.lastY = touch.clientY;

    if (!sheetDrag.engaged) {
      if (sheetDrag.onHandle) {
        if (dy > 8) {
          sheetDrag.engaged = true;
          els.sheet.classList.add('dragging');
        } else if (dy < -8 || Math.abs(dx) > 16) {
          cleanupSheetDragListeners();
          sheetDrag = null;
          return;
        } else {
          return;
        }
      } else {
        const atTop = (els.panelSettings ? els.panelSettings.scrollTop <= 2 : els.sheet.scrollTop <= 2) && isScrollableContainerAtTop(sheetDrag.target, els.sheet);
        const isVerticalPull = dy > 24 && Math.abs(dy) > Math.abs(dx) * 1.5;

        if (atTop && isVerticalPull) {
          sheetDrag.engaged = true;
          els.sheet.classList.add('dragging');
        } else if (Math.abs(dy) > 16 || Math.abs(dx) > 16 || dy < 0 || !atTop) {
          cleanupSheetDragListeners();
          sheetDrag = null;
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
    sheetDrag.translateY = targetY;
    if (!sheetDragRafId) {
      sheetDragRafId = requestAnimationFrame(() => {
        sheetDragRafId = null;
        if (sheetDrag && els.sheet) els.sheet.style.transform = `translate3d(0, ${Math.round(sheetDrag.translateY)}px, 0)`;
      });
    }
  }

  function onSheetDragEnd() {
    cleanupSheetDragListeners();
    if (!sheetDrag || !els || !els.sheet) return;
    const wasEngaged = sheetDrag.engaged;
    const translateY = sheetDrag.translateY;
    const elapsed = Math.max(1, performance.now() - sheetDrag.startTime);
    const velocity = (sheetDrag.lastY - sheetDrag.startY) / elapsed;
    sheetDrag = null;
    if (sheetDragRafId) {
      cancelAnimationFrame(sheetDragRafId);
      sheetDragRafId = null;
    }
    if (!wasEngaged) return;
    els.sheet.classList.remove('dragging');
    if (translateY > 120 || (translateY > 45 && velocity > 0.6)) {
      closeSheet();
    } else {
      els.sheet.style.transform = '';
    }
  }

  function cleanupSheetDragListeners() {
    document.removeEventListener('touchmove', onSheetDragMove);
    document.removeEventListener('touchend', onSheetDragEnd);
    document.removeEventListener('touchcancel', onSheetDragEnd);
  }

  function buildSheetMaterialRow() {
    if (!els || !els.sheetMaterialRow) return;
    const options = materialOptions();
    const rows = options.map((id) => {
      const profile = MATERIAL_PROFILES[id];
      if (!profile) return '';
      const active = state.materialId === id;
      return `<button type="button" class="tuner-sheet-chip brutal-press${active ? ' active' : ''}" role="radio" aria-checked="${active}" data-sheet-material="${id}">${profile.shortLabel}</button>`;
    });
    const offActive = state.materialId === 'off';
    rows.push(`<button type="button" class="tuner-sheet-chip brutal-press${offActive ? ' active' : ''}" role="radio" aria-checked="${offActive}" data-sheet-material="off">OFF</button>`);
    els.sheetMaterialRow.innerHTML = rows.join('');
    els.sheetMaterialRow.querySelectorAll('[data-sheet-material]').forEach((btn) => {
      btn.addEventListener('click', () => {
        callbacks.onMaterialSelect(btn.getAttribute('data-sheet-material'));
        buildSheetMaterialRow();
        renderSheetSettings();
      }, { signal: eventLifetime.signal });
    });
  }

  function buildSheetA4Row() {
    // A4 UI removed — fixed 440 Hz. Keep legacy container empty for compat.
    if (!els || !els.sheetA4Row) return;
    els.sheetA4Row.innerHTML = '';
  }

  function buildSheetInstrumentRow() {
    if (!els || !els.sheetInstrumentRow) return;
    const rows = TUNER_INSTRUMENTS.map((group) => {
      const active = group.id === state.instrumentId;
      return `<button type="button" class="tuner-sheet-chip brutal-press${active ? ' active' : ''}" role="radio" aria-checked="${active}" data-sheet-instrument="${group.id}">${group.label}</button>`;
    }).join('');
    els.sheetInstrumentRow.innerHTML = rows;
    els.sheetInstrumentRow.querySelectorAll('[data-sheet-instrument]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeMenus(false);
        callbacks.onInstrumentChange(btn.getAttribute('data-sheet-instrument'));
      }, { signal: eventLifetime.signal });
    });
  }

  function buildSheetModeRow() {
    if (!els || !els.sheetModeRow) return;
    const isGuided = state.mode === 'guided';
    els.sheetModeRow.innerHTML = `
      <button type="button" class="tuner-sheet-chip brutal-press${isGuided ? ' active' : ''}" role="radio" aria-checked="${isGuided}" data-sheet-mode="guided">GUIDED</button>
      <button type="button" class="tuner-sheet-chip brutal-press${state.mode === 'chromatic' ? ' active' : ''}" role="radio" aria-checked="${state.mode === 'chromatic'}" data-sheet-mode="chromatic">FREE</button>
      ${state.instrumentId !== 'drums' ? `<button type="button" class="tuner-sheet-chip tuner-ear-mode brutal-press${state.mode === 'ear' ? ' active' : ''}" role="radio" aria-checked="${state.mode === 'ear'}" data-sheet-mode="ear">EAR TRAINING</button>` : ''}
    `;
    els.sheetModeRow.querySelectorAll('[data-sheet-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeMenus(false);
        callbacks.onModeSelect(btn.getAttribute('data-sheet-mode'));
        els.sheetModeRow.querySelector(`[data-sheet-mode="${state.mode}"]`)?.focus({ preventScroll: true });
      }, { signal: eventLifetime.signal });
    });
  }

  function syncSheetSetupButtons() {
    if (!els) return;
    renderStringLabelSettings();
    const isGuided = state.mode === 'guided';
    const drums = state.instrumentId === 'drums';
    const hasStrings = stringCountOptions().length > 0 && !drums;
    const hasMaterial = materialOptions().length > 0 && isGuided && !drums;
    if (els.sheetStringsBtn) {
      els.sheetStringsBtn.disabled = !hasStrings;
      els.sheetStringsBtn.setAttribute('aria-disabled', hasStrings ? 'false' : 'true');
    }
    if (els.sheetMaterialBtnSheet) {
      els.sheetMaterialBtnSheet.disabled = !hasMaterial;
      els.sheetMaterialBtnSheet.setAttribute('aria-disabled', hasMaterial ? 'false' : 'true');
    }
    if (els.sheetStringsLabelSheet) {
      els.sheetStringsLabelSheet.textContent = hasStrings ? currentStringCount() + ' STRINGS' : '—';
    }
    syncStringStepper();
    const profile = state.materialId === 'off' ? null : MATERIAL_PROFILES[state.materialId];
    if (els.sheetMaterialLabelSheet) {
      els.sheetMaterialLabelSheet.textContent = hasMaterial ? (profile ? profile.shortLabel : 'OFF') : '—';
    }
    // legacy hidden tops still keep state sync
    if (els.stringsLabel) els.stringsLabel.textContent = hasStrings ? currentStringCount() + ' STRINGS' : '';
    if (els.materialLabel) els.materialLabel.textContent = profile ? profile.shortLabel : 'OFF';
  }

  function syncStringStepper() {
    const input = document.getElementById('tunerStringCount');
    if (!input) return;
    input.value = String(currentStringCount());
    input.disabled = state.instrumentId === 'drums';
    document.getElementById('tunerStringsMinus').disabled = input.disabled || currentStringCount() <= 1;
    document.getElementById('tunerStringsPlus').disabled = input.disabled || currentStringCount() >= 12;
  }

  function renderSheetSettings() {
    if (!els) return;
    buildSheetInstrumentRow();
    buildSheetModeRow();
    syncSheetSetupButtons();
    // keep legacy hidden rows in sync for tests that might query them
    buildSheetMaterialRow();
    buildSheetA4Row();
    if (els.sheetAutoAdvance) els.sheetAutoAdvance.setAttribute('aria-pressed', String(!!state.autoAdvance));
    if (els.sheetAutoId) els.sheetAutoId.setAttribute('aria-pressed', String(!!state.autoIdentify));
    // disable material button when not guided/drums
    if (els.sheetMaterialBtnSheet) {
      const isGuided = state.mode === 'guided' && state.instrumentId !== 'drums';
      els.sheetMaterialBtnSheet.style.opacity = isGuided ? '1' : '0.45';
      // disabled attribute already handled in sync
    }
    if (els.sheetStringsBtn) {
      const hasStrings = stringCountOptions().length > 0 && state.instrumentId !== 'drums';
      els.sheetStringsBtn.style.opacity = hasStrings ? '1' : '0.45';
    }
  }

  function copyTunerLink() {
    const url = window.location.origin + '/tuner';
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
    if (els && els.copyBadge) {
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
    showToast('Tuner link copied to clipboard!', 'success');
  }

  function menuPanel(slot, contentHtml) {
    const panel = document.createElement('div');
    panel.className = 'tuner-menu-panel';
    panel.setAttribute('role', 'menu');
    panel.innerHTML = contentHtml;
    slot.replaceChildren(panel);
    openPanelEl = panel;
    return panel;
  }

  function renderModeMenu() {
    const guidedActive = state.mode === 'guided';
    const html = `
      <button type="button" class="tuner-menu-row${guidedActive ? ' active' : ''}" role="menuitemradio" aria-checked="${guidedActive}" data-mode="guided">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Guided</span>
          <span class="tuner-menu-row-sub">One string at a time.</span>
        </span>
        <span class="tuner-menu-check" aria-hidden="true">${guidedActive ? '&#10003;' : ''}</span>
      </button>
      <button type="button" class="tuner-menu-row${guidedActive ? '' : ' active'}" role="menuitemradio" aria-checked="${!guidedActive}" data-mode="chromatic">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Free Tune</span>
          <span class="tuner-menu-row-sub">Any note, any instrument.</span>
        </span>
        <span class="tuner-menu-check" aria-hidden="true">${guidedActive ? '' : '&#10003;'}</span>
      </button>
      <div class="tuner-menu-divider" role="separator"></div>
      <button type="button" class="tuner-menu-row tuner-menu-toggle-row${state.mode === 'chromatic' ? ' disabled' : ''}" role="menuitemcheckbox" aria-checked="${state.autoAdvance}" data-auto-advance aria-disabled="${state.mode === 'chromatic'}">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Auto-advance</span>
          <span class="tuner-menu-row-sub">Next string when in tune.</span>
        </span>
        <span class="tuner-toggle${state.autoAdvance ? ' on' : ''}" role="switch" aria-checked="${state.autoAdvance}" aria-label="Auto-advance">
          <span class="tuner-toggle-knob"></span>
        </span>
      </button>
      <button type="button" class="tuner-menu-row tuner-menu-toggle-row${state.mode === 'chromatic' ? ' disabled' : ''}" role="menuitemcheckbox" aria-checked="${state.autoIdentify}" data-auto-id aria-disabled="${state.mode === 'chromatic'}">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Auto string select</span>
          <span class="tuner-menu-row-sub">Follows your pluck.</span>
        </span>
        <span class="tuner-toggle${state.autoIdentify ? ' on' : ''}" role="switch" aria-checked="${state.autoIdentify}" aria-label="Auto string select">
          <span class="tuner-toggle-knob"></span>
        </span>
      </button>
    `;
    const panel = menuPanel(els.modeMenuSlot, html);
    panel.addEventListener('click', (e) => {
      const modeRow = e.target.closest('[data-mode]');
      if (modeRow) {
        callbacks.onModeSelect(modeRow.getAttribute('data-mode'));
        closeMenus();
        return;
      }
      if (e.target.closest('[data-auto-advance]') && state.mode !== 'chromatic') {
        callbacks.onAutoAdvanceToggle(!state.autoAdvance);
        renderModeMenu();
        return;
      }
      if (e.target.closest('[data-auto-id]') && state.mode !== 'chromatic') {
        callbacks.onAutoIdToggle(!state.autoIdentify);
        renderModeMenu();
      }
    }, { signal: eventLifetime.signal });
  }

  function renderStringsMenu() {
    const options = stringCountOptions();
    if (!options.length || !els.stringsMenuSlot) return;
    const current = currentStringCount();
    const isCustomActive = !options.includes(current);
    const rows = options.map((count) => {
      const active = count === current;
      let subtitle = count + '-string setup';
      if (state.instrumentId === 'electric') {
        if (count === 6) subtitle = 'Standard tuning.';
        else if (count === 7) subtitle = 'Adds a low B.';
        else if (count === 8) subtitle = 'Adds low B + F#.';
        else if (count === 5) subtitle = 'Rare 5-string.';
      } else if (state.instrumentId === 'acoustic') {
        if (count === 6) subtitle = 'Standard tuning.';
        else if (count === 12) subtitle = 'Paired strings.';
        else if (count === 5) subtitle = 'Rare 5-string.';
      } else if (state.instrumentId === 'bass') {
        if (count === 4) subtitle = 'Standard bass.';
        else if (count === 5) subtitle = 'Adds a low B.';
        else if (count === 6) subtitle = 'Low B + high C.';
      }
      // Fallbacks for legacy counts
      if (count === 7 && state.instrumentId === 'acoustic') subtitle = 'Rare extended tuning.';
      if (count === 8 && state.instrumentId === 'acoustic') subtitle = 'Rare extended tuning.';

      return `
        <button type="button" class="tuner-menu-row${active ? ' active' : ''}" role="menuitemradio" aria-checked="${active}" data-string-count="${count}">
          <span class="tuner-menu-row-text">
            <span class="tuner-menu-row-title">${count} STRINGS</span>
            <span class="tuner-menu-row-sub">${subtitle}</span>
          </span>
          <span class="tuner-menu-check" aria-hidden="true">${active ? '&#10003;' : ''}</span>
        </button>`;
    }).join('');

    let customSubtitle = 'Custom count.';
    if (state.instrumentId === 'electric') customSubtitle = 'Custom low tuning.';
    else if (state.instrumentId === 'acoustic') customSubtitle = 'Rare extended setup.';
    else if (state.instrumentId === 'bass') customSubtitle = 'Custom setup.';
    const customTitle = isCustomActive ? `${current} STRINGS (Custom)` : 'Custom...';
    const customRow = `
        <div class="tuner-menu-divider" role="separator"></div>
        <button type="button" class="tuner-menu-row${isCustomActive ? ' active' : ''}" role="menuitemradio" aria-checked="${isCustomActive}" data-string-custom>
          <span class="tuner-menu-row-text">
            <span class="tuner-menu-row-title">${customTitle}</span>
            <span class="tuner-menu-row-sub">${customSubtitle}</span>
          </span>
          <span class="tuner-menu-check" aria-hidden="true">${isCustomActive ? '&#10003;' : ''}</span>
        </button>
        <div class="tuner-custom-field" style="display:${isCustomActive ? 'flex' : 'none'}">
          <input type="number" min="1" max="12" step="1" aria-label="Custom string count" class="tuner-custom-input" value="${isCustomActive ? current : ''}" placeholder="1-12" />
          <button type="button" class="tuner-custom-apply brutal-press">Apply</button>
        </div>`;

    const panel = menuPanel(els.stringsMenuSlot, rows + customRow);
    panel.addEventListener('click', (e) => {
      const row = e.target.closest('[data-string-count]');
      if (row) {
        const count = parseInt(row.getAttribute('data-string-count'), 10);
        callbacks.onStringCountSelect(count);
        closeMenus();
        return;
      }
      if (e.target.closest('[data-string-custom]')) {
        const field = panel.querySelector('.tuner-custom-field');
        if (field) field.style.display = field.style.display === 'none' ? 'flex' : 'none';
        const input = panel.querySelector('.tuner-custom-input');
        if (input) input.focus();
        return;
      }
      if (e.target.closest('.tuner-custom-apply')) {
        const input = panel.querySelector('.tuner-custom-input');
        const val = Number(input ? input.value : '');
        if (!Number.isInteger(val) || val < 1 || val > 12) {
          showToast('Enter a string count between 1 and 12', 'warning');
          return;
        }
        if (options.includes(val)) {
          callbacks.onStringCountSelect(val);
        } else if (callbacks.onCustomStringCount) {
          callbacks.onCustomStringCount(val);
        } else {
          callbacks.onStringCountSelect(val);
        }
        closeMenus();
      }
    }, { signal: eventLifetime.signal });
    panel.querySelector('.tuner-custom-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        panel.querySelector('.tuner-custom-apply')?.click();
      }
    }, { signal: eventLifetime.signal });
  }

  function renderMaterialMenu() {
    const options = materialOptions();
    if (!options.length) return;
    const rows = options.map((id) => {
      const profile = MATERIAL_PROFILES[id];
      if (!profile) return '';
      const active = state.materialId === id;
      return `
        <button type="button" class="tuner-menu-row${active ? ' active' : ''}" role="menuitemradio" aria-checked="${active}" data-material="${id}">
          <span class="tuner-menu-row-text">
            <span class="tuner-menu-row-title">${profile.label}</span>
            <span class="tuner-menu-row-sub">${profile.hint}</span>
          </span>
          <span class="tuner-menu-check" aria-hidden="true">${active ? '&#10003;' : ''}</span>
        </button>`;
    }).join('');
    const offActive = state.materialId === 'off';
    const html = `
      ${rows}
      <div class="tuner-menu-divider" role="separator"></div>
      <button type="button" class="tuner-menu-row${offActive ? ' active' : ''}" role="menuitemradio" aria-checked="${offActive}" data-material="off">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Off</span>
          <span class="tuner-menu-row-sub">No warnings.</span>
        </span>
        <span class="tuner-menu-check" aria-hidden="true">${offActive ? '&#10003;' : ''}</span>
      </button>
    `;
    const panel = menuPanel(els.materialMenuSlot, html);
    panel.addEventListener('click', (e) => {
      const row = e.target.closest('[data-material]');
      if (row) {
        callbacks.onMaterialSelect(row.getAttribute('data-material'));
        closeMenus();
      }
    }, { signal: eventLifetime.signal });
  }

  function renderSheetStringsMenu() {
    const options = stringCountOptions();
    if (!els.sheetStringsSlot) return;
    // For drums, show disabled state — but still allow close
    if (!options.length) {
      const panel = menuPanel(els.sheetStringsSlot, '<div class="tuner-menu-row disabled"><span class="tuner-menu-row-text"><span class="tuner-menu-row-title">No string options for drums</span></span></div>');
      return;
    }
    const current = currentStringCount();
    const isCustomActive = !options.includes(current);
    const rows = options.map((count) => {
      const active = count === current;
      let subtitle = count + '-string setup';
      if (state.instrumentId === 'electric') {
        if (count === 6) subtitle = 'Standard tuning.';
        else if (count === 7) subtitle = 'Adds a low B.';
        else if (count === 8) subtitle = 'Adds low B + F#.';
        else if (count === 5) subtitle = 'Rare 5-string.';
      } else if (state.instrumentId === 'acoustic') {
        if (count === 6) subtitle = 'Standard tuning.';
        else if (count === 12) subtitle = 'Paired strings.';
        else if (count === 5) subtitle = 'Rare 5-string.';
      } else if (state.instrumentId === 'bass') {
        if (count === 4) subtitle = 'Standard bass.';
        else if (count === 5) subtitle = 'Adds a low B.';
        else if (count === 6) subtitle = 'Low B + high C.';
      }
      if (count === 7 && state.instrumentId === 'acoustic') subtitle = 'Rare extended tuning.';
      if (count === 8 && state.instrumentId === 'acoustic') subtitle = 'Rare extended tuning.';
      return `
        <button type="button" class="tuner-menu-row${active ? ' active' : ''}" role="menuitemradio" aria-checked="${active}" data-string-count="${count}">
          <span class="tuner-menu-row-text">
            <span class="tuner-menu-row-title">${count} STRINGS</span>
            <span class="tuner-menu-row-sub">${subtitle}</span>
          </span>
          <span class="tuner-menu-check" aria-hidden="true">${active ? '&#10003;' : ''}</span>
        </button>`;
    }).join('');
    let customSubtitle = 'Custom count.';
    if (state.instrumentId === 'electric') customSubtitle = 'Custom low tuning.';
    else if (state.instrumentId === 'acoustic') customSubtitle = 'Rare extended setup.';
    else if (state.instrumentId === 'bass') customSubtitle = 'Custom setup.';
    const customTitle = isCustomActive ? `${current} STRINGS (Custom)` : 'Custom...';
    const customRow = `
        <div class="tuner-menu-divider" role="separator"></div>
        <button type="button" class="tuner-menu-row${isCustomActive ? ' active' : ''}" role="menuitemradio" aria-checked="${isCustomActive}" data-string-custom>
          <span class="tuner-menu-row-text">
            <span class="tuner-menu-row-title">${customTitle}</span>
            <span class="tuner-menu-row-sub">${customSubtitle}</span>
          </span>
          <span class="tuner-menu-check" aria-hidden="true">${isCustomActive ? '&#10003;' : ''}</span>
        </button>
        <div class="tuner-custom-field" style="display:${isCustomActive ? 'flex' : 'none'}">
          <input type="number" min="1" max="12" step="1" aria-label="Custom string count" class="tuner-custom-input" value="${isCustomActive ? current : ''}" placeholder="1-12" />
          <button type="button" class="tuner-custom-apply brutal-press">Apply</button>
        </div>`;
    const panel = menuPanel(els.sheetStringsSlot, rows + customRow);
    panel.addEventListener('click', (e) => {
      const row = e.target.closest('[data-string-count]');
      if (row) {
        const count = parseInt(row.getAttribute('data-string-count'), 10);
        callbacks.onStringCountSelect(count);
        closeMenus();
        return;
      }
      if (e.target.closest('[data-string-custom]')) {
        const field = panel.querySelector('.tuner-custom-field');
        if (field) field.style.display = field.style.display === 'none' ? 'flex' : 'none';
        const input = panel.querySelector('.tuner-custom-input');
        if (input) input.focus();
        return;
      }
      if (e.target.closest('.tuner-custom-apply')) {
        const input = panel.querySelector('.tuner-custom-input');
        const val = Number(input ? input.value : '');
        if (!Number.isInteger(val) || val < 1 || val > 12) {
          showToast('Enter a string count between 1 and 12', 'warning');
          return;
        }
        if (options.includes(val)) {
          callbacks.onStringCountSelect(val);
        } else if (callbacks.onCustomStringCount) {
          callbacks.onCustomStringCount(val);
        } else {
          callbacks.onStringCountSelect(val);
        }
        closeMenus();
      }
    }, { signal: eventLifetime.signal });
    panel.querySelector('.tuner-custom-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        panel.querySelector('.tuner-custom-apply')?.click();
      }
    }, { signal: eventLifetime.signal });
  }

  function renderSheetMaterialMenu() {
    const options = materialOptions();
    if (!els.sheetMaterialSlot) return;
    if (!options.length) {
      menuPanel(els.sheetMaterialSlot, '<div class="tuner-menu-row disabled"><span class="tuner-menu-row-text"><span class="tuner-menu-row-title">No material for drums</span></span></div>');
      return;
    }
    const rows = options.map((id) => {
      const profile = MATERIAL_PROFILES[id];
      if (!profile) return '';
      const active = state.materialId === id;
      return `
        <button type="button" class="tuner-menu-row${active ? ' active' : ''}" role="menuitemradio" aria-checked="${active}" data-material="${id}">
          <span class="tuner-menu-row-text">
            <span class="tuner-menu-row-title">${profile.label}</span>
            <span class="tuner-menu-row-sub">${profile.hint}</span>
          </span>
          <span class="tuner-menu-check" aria-hidden="true">${active ? '&#10003;' : ''}</span>
        </button>`;
    }).join('');
    const offActive = state.materialId === 'off';
    const html = `
      ${rows}
      <div class="tuner-menu-divider" role="separator"></div>
      <button type="button" class="tuner-menu-row${offActive ? ' active' : ''}" role="menuitemradio" aria-checked="${offActive}" data-material="off">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Off</span>
          <span class="tuner-menu-row-sub">No warnings.</span>
        </span>
        <span class="tuner-menu-check" aria-hidden="true">${offActive ? '&#10003;' : ''}</span>
      </button>
    `;
    const panel = menuPanel(els.sheetMaterialSlot, html);
    panel.addEventListener('click', (e) => {
      const row = e.target.closest('[data-material]');
      if (row) {
        callbacks.onMaterialSelect(row.getAttribute('data-material'));
        closeMenus();
      }
    }, { signal: eventLifetime.signal });
  }

  function renderInstrumentMenu() {
    const rows = TUNER_INSTRUMENTS.map((group) => {
      const active = group.id === state.instrumentId;
      return `
        <button type="button" class="tuner-menu-row${active ? ' active' : ''}" role="menuitemradio" aria-checked="${active}" data-instrument-menu="${group.id}">
          <span class="tuner-menu-row-text"><span class="tuner-menu-row-title">${group.dropdownLabel}</span></span>
          <span class="tuner-menu-check" aria-hidden="true">${active ? '&#10003;' : ''}</span>
        </button>`;
    }).join('');
    const panel = menuPanel(els.instrumentMenuSlot, rows);
    panel.addEventListener('click', (e) => {
      const row = e.target.closest('[data-instrument-menu]');
      if (row) {
        callbacks.onInstrumentChange(row.getAttribute('data-instrument-menu'));
        closeMenus();
      }
    }, { signal: eventLifetime.signal });
  }

  function renderTopbar() {
    els.presetLabel.textContent = sanitizeTuningName(getPreset().name);
    const isGuided = state.mode === 'guided';
    if (els.modeLabel) els.modeLabel.textContent = isGuided ? 'GUIDED' : 'FREE TUNE';

    // Main controls moved to sheet — keep legacy topbar pills hidden permanently
    if (els.modeBtn) {
      els.modeBtn.hidden = true;
      const anchor = els.modeBtn.closest('.tuner-menu-anchor');
      if (anchor) anchor.hidden = true;
    }
    if (els.stringsBtn) {
      els.stringsBtn.hidden = true;
      const anchor = els.stringsBtn.closest('.tuner-menu-anchor');
      if (anchor) anchor.hidden = true;
    }
    if (els.materialBtn) {
      els.materialBtn.hidden = true;
      const anchor = els.materialBtn.closest('.tuner-menu-anchor');
      if (anchor) anchor.hidden = true;
    }
    // Keep labels in sync for hidden legacy + new sheet buttons
    if (els.stringsLabel) {
      els.stringsLabel.textContent = currentStringCount() + ' STRINGS';
    }
    const profile = state.materialId === 'off' ? null : MATERIAL_PROFILES[state.materialId];
    if (els.materialLabel) els.materialLabel.textContent = profile ? profile.shortLabel : 'OFF';

    const drumsMode = state.instrumentId === 'drums';
    els.tunerView.classList.toggle('mode-chromatic', state.mode === 'chromatic' && !drumsMode);
    els.tunerView.classList.toggle('mode-drums', drumsMode);
    const ear = state.mode === 'ear' && state.instrumentId !== 'drums';
    els.tunerView.classList.toggle('mode-ear', ear);
    els.readout.hidden = drumsMode;
    document.getElementById('tunerTension').hidden = !ear;
    els.micCta.hidden = false;
    els.presetBtn.disabled = drumsMode;
    if (drumsMode) els.presetLabel.textContent = 'My kit';
    els.figure.hidden = drumsMode;
    document.getElementById('drumWorkflow').hidden = !drumsMode;
    for (const id of ['drumAdd', 'drumSave']) document.getElementById(id).hidden = !drumsMode;
    if (els.modeLabel && ear) els.modeLabel.textContent = 'EAR TRAINING';
    if (els.sheetAutoAdvance) els.sheetAutoAdvance.disabled = ear || state.instrumentId === 'drums';
    if (els.sheetAutoId) els.sheetAutoId.disabled = ear || state.instrumentId === 'drums';
    if (els.chromRail) {
      els.chromRail.hidden = state.mode !== 'chromatic' || drumsMode;
      if (!els.chromRail.hidden) { buildRail(); centerRailDefault(); }
    }
    layoutZones();
    renderSheetSettings();
  }

  function renderInstrumentRow() {
    Array.from(els.instrumentRow.querySelectorAll('[data-instrument]')).forEach((btn) => {
      const active = btn.getAttribute('data-instrument') === state.instrumentId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function drumsSvg(preset) {
    const drums = [
      { idx: 0, cx: 160, cy: 148, r: 52, label: 'KICK' },
      { idx: 1, cx: 64, cy: 105, r: 34, label: 'SNARE' },
      { idx: 2, cx: 160, cy: 46, r: 28, label: 'TOM' },
      { idx: 3, cx: 254, cy: 112, r: 38, label: 'FLOOR' }
    ];
    const pieces = drums.map((d) => {
      const str = preset.strings[d.idx];
      if (!str) return '';
      const active = d.idx === state.stringIndex;
      return `
        <g class="tuner-drum${active ? ' active' : ''}" data-string-index="${d.idx}" role="button" tabindex="0" aria-label="Target ${str.label}" aria-pressed="${active}">
          <circle class="tuner-drum-glow" cx="${d.cx}" cy="${d.cy}" r="${d.r + 10}"></circle>
          <circle class="tuner-drum-shape" cx="${d.cx}" cy="${d.cy}" r="${d.r}"></circle>
          <circle class="tuner-drum-rim" cx="${d.cx}" cy="${d.cy}" r="${d.r - 4}"></circle>
          <circle class="tuner-drum-hub" cx="${d.cx}" cy="${d.cy}" r="${Math.max(7, d.r * 0.2)}"></circle>
          <text class="tuner-drum-label" x="${d.cx}" y="${d.cy - d.r - 8}" text-anchor="middle">${d.label}</text>
        </g>`;
    }).join('');

    return `
      <svg class="tuner-drum-svg" viewBox="0 0 320 215" aria-hidden="false">
        <!-- Hi-Hat -->
        <ellipse class="tuner-cymbal" cx="44" cy="34" rx="30" ry="7"></ellipse>
        <ellipse class="tuner-cymbal-groove" cx="44" cy="34" rx="20" ry="4.5"></ellipse>
        <ellipse class="tuner-cymbal-bell" cx="44" cy="34" rx="7" ry="2.2"></ellipse>
        <line class="tuner-stand" x1="44" y1="34" x2="44" y2="85"></line>
        <path d="M38 85 L44 90 L50 85" stroke="rgba(245,244,239,0.3)" stroke-width="2" fill="none"></path>

        <!-- Ride Cymbal -->
        <ellipse class="tuner-cymbal" cx="276" cy="40" rx="32" ry="7"></ellipse>
        <ellipse class="tuner-cymbal-groove" cx="276" cy="40" rx="22" ry="4.5"></ellipse>
        <ellipse class="tuner-cymbal-bell" cx="276" cy="40" rx="8" ry="2.4"></ellipse>
        <line class="tuner-stand" x1="276" y1="40" x2="276" y2="92"></line>
        <path d="M270 92 L276 97 L282 92" stroke="rgba(245,244,239,0.3)" stroke-width="2" fill="none"></path>

        <!-- Bass Drum Spurs & Tom Mount -->
        <line class="tuner-drum-spur" x1="116" y1="172" x2="92" y2="196"></line>
        <line class="tuner-drum-spur" x1="204" y1="172" x2="228" y2="196"></line>
        <line class="tuner-stand" x1="160" y1="74" x2="160" y2="100"></line>

        ${pieces}
      </svg>`;
  }

  function renderFigure() {
    const focusedIndex = els.figure.contains(document.activeElement) ? document.activeElement.getAttribute('data-string-index') : null;
    renderA4();
    const preset = getPreset();
    const isDrums = state.instrumentId === 'drums';
    els.figure.classList.toggle('drums', isDrums);
    if (isDrums) {
      els.figure.innerHTML = drumsSvg(preset);
      activeTargetEl = els.figure.querySelector('.tuner-drum.active');
    } else {
      const art = getInstrumentArt(state.instrumentId, currentStringCount());
      els.figure.innerHTML = art || '';
      Array.from(els.figure.querySelectorAll('.tuner-peg')).forEach((peg) => {
        const idx = parseInt(peg.getAttribute('data-string-index'), 10);
        const str = preset.strings[idx];
        if (!str) {
          peg.remove();
          return;
        }
        const label = peg.querySelector('.tuner-peg-label');
        const noteText = state.instrumentId === 'bass' ? str.note : noteLetter(str.note);
        if (label) label.textContent = state.stringLabel === 'number' ? String(preset.strings.length - idx)
          : state.stringLabel === 'gauge' ? String(getStringGauges()[idx] ?? '—') : noteText;
        peg.setAttribute('aria-label', state.mode === 'ear' ? 'Play reference for string ' + (preset.strings.length - idx) : 'Target string ' + str.note);
        peg.setAttribute('aria-pressed', String(idx === state.stringIndex));
        peg.classList.toggle('is-active', idx === state.stringIndex);
        peg.classList.remove('is-in-tune');
      });
      activeTargetEl = els.figure.querySelector('.tuner-peg.is-active');
    }
    if (focusedIndex !== null) els.figure.querySelector(`[data-string-index="${focusedIndex}"]`)?.focus({ preventScroll: true });
    if (!figureListenerBound) {
      figureListenerBound = true;
      els.figure.addEventListener('click', (e) => {
        const peg = e.target.closest('[data-string-index]');
        if (peg) callbacks.onStringSelect(parseInt(peg.getAttribute('data-string-index'), 10));
      }, { signal: eventLifetime.signal });
      els.figure.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const peg = e.target.closest('[data-string-index]');
        if (peg) {
          e.preventDefault();
          callbacks.onStringSelect(parseInt(peg.getAttribute('data-string-index'), 10));
        }
      }, { signal: eventLifetime.signal });
    }
  }

  function renderA4() {
    const calibration = document.getElementById('tunerCalibration');
    if (calibration) calibration.value = String(state.a4);
    // Calibration lives in the accessible settings form; clear obsolete chips.
    if (els.a4Chips) els.a4Chips.replaceChildren();
    // keep sheet A4 in sync (legacy hidden row)
    buildSheetA4Row();
  }

  function presetMatches(preset, query) {
    const q = query.toLowerCase();
    if (preset.name.toLowerCase().includes(q)) return true;
    if (preset.category && preset.category.toLowerCase().includes(q)) return true;
    const spaced = preset.strings.map((s) => s.note).join(' ').toLowerCase();
    const joined = preset.strings.map((s) => s.note).join('').toLowerCase();
    return spaced.includes(q) || joined.includes(q);
  }

  function renderTuningList(query) {
    const group = getGroup();
    const q = (query || '').trim();
    if (els.searchClearBtn) {
      els.searchClearBtn.hidden = !q;
    }
    els.categoryList.replaceChildren();

    // String-count filtering: only show tunings that match the currently selected string count
    // Electric == Acoustic pitch-wise; variants only appear when that string count is active
    const targetCount = state.instrumentId === 'drums' ? null : currentStringCount();
    const visiblePresets = targetCount === null
      ? group.presets
      : group.presets.filter((p) => p.strings.length === targetCount);

    let categories = TUNER_CATEGORY_ORDER.filter((cat) => visiblePresets.some((p) => p.category === cat));
    const isCategoryFilter = activeFilter === 'all' || TUNER_CATEGORY_ORDER.includes(activeFilter);
    if (isCategoryFilter && activeFilter !== 'all') {
      categories = categories.filter((cat) => cat === activeFilter);
    }

    let matchCount = 0;

    categories.forEach((cat) => {
      let presets = visiblePresets.filter((p) => p.category === cat);
      if (!isCategoryFilter) {
        presets = presets.filter((p) => presetMatches(p, activeFilter));
      }
      if (q) presets = presets.filter((p) => presetMatches(p, q));
      if (!presets.length) return;
      matchCount += presets.length;

      const activeInCat = presets.some((p) => group.presets.indexOf(p) === state.presetIndex);
      const section = document.createElement('section');
      section.className = 'tuning-category' + (q || activeFilter !== 'all' || activeInCat ? ' open' : '');
      const head = document.createElement('button');
      head.type = 'button';
      head.className = 'tuning-category-head';
      head.setAttribute('aria-expanded', section.classList.contains('open') ? 'true' : 'false');
      head.innerHTML = `<span>${TUNER_CATEGORY_LABELS[cat] || cat.toUpperCase()} (${presets.length})</span><svg class="tuning-caret" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
      head.addEventListener('click', () => {
        const open = section.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      }, { signal: eventLifetime.signal });
      const body = document.createElement('div');
      body.className = 'tuning-category-body';
      presets.forEach((preset) => {
        const isActive = group.presets.indexOf(preset) === state.presetIndex;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'tuning-card' + (isActive ? ' active' : '');
        card.setAttribute('aria-pressed', isActive ? 'true' : 'false');

        const info = document.createElement('div');
        info.className = 'tuning-card-info';

        const nameEl = document.createElement('span');
        nameEl.className = 'tuning-card-name';
        nameEl.textContent = sanitizeTuningName(preset.name);
        // Preserve full unsanitized title for tooltip / accessibility
        if (preset.name !== nameEl.textContent) {
          nameEl.title = preset.name;
          card.setAttribute('aria-label', sanitizeTuningName(preset.name));
        }

        const notesEl = document.createElement('span');
        notesEl.className = 'tuning-card-notes';
        notesEl.textContent = preset.strings.map((s) => (state.instrumentId === 'bass' ? s.note : noteLetter(s.note))).join(' · ');

        info.append(nameEl, notesEl);

        const radio = document.createElement('span');
        radio.className = 'tuning-card-radio' + (isActive ? ' checked' : '');
        radio.innerHTML = isActive
          ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '';
        card.append(info, radio);
        card.addEventListener('click', () => {
          callbacks.onPresetSelect(group.presets.indexOf(preset));
          showTunerView();
        }, { signal: eventLifetime.signal });
        body.appendChild(card);
      });
      section.append(head, body);
      els.categoryList.appendChild(section);
    });

    if (!els.categoryList.children.length) {
      const empty = document.createElement('p');
      empty.className = 'tuning-empty';
      empty.textContent = q ? `No tunings match "${q}" in this category.` : 'No tunings found for this filter.';
      els.categoryList.appendChild(empty);
    }
    els.instrumentLabel.textContent = TUNER_INSTRUMENT_SHORT_LABELS[group.id];
    els.instrumentBtn.setAttribute('aria-label', 'Instrument: ' + group.dropdownLabel);
    renderA4();
  }

  function getSearchQuery() {
    return els.searchInput ? els.searchInput.value : '';
  }

  /* Meter scale: a linear fine range and compressed outer range for large offsets. */
  function centsToPct(cents) {
    const fine = DETECT.METER_FINE_CENTS;
    const ext = DETECT.METER_MAX_CENTS;
    const core = DETECT.METER_CORE_SPLIT;
    const a = Math.abs(cents);
    const sg = cents < 0 ? -1 : 1;
    if (a <= fine) return sg * (a / fine) * core * 100;
    const t = Math.min(1, Math.log(a / fine) / Math.log(ext / fine));
    return sg * (core + t * (1 - core)) * 100;
  }

  function setNeedle(cents) {
    if (!els.needle || !meterWidth) return;
    const max = meterWidth / 2 - 18;
    const pct = Math.max(-100, Math.min(100, centsToPct(cents)));
    els.needle.style.transform = 'translateX(' + ((pct / 100) * max).toFixed(1) + 'px)';
  }

  /* ---------- Breakage / looseness zone sections ---------- */
  function halfPct(cents) {
    return Math.abs(centsToPct(cents)) / 2; // % of full meter width from centre
  }

  function posZoneRight(el, fromC, toC) {
    if (!el) return;
    const o = halfPct(fromC);
    const w = toC == null ? 50 - o : Math.max(0, halfPct(toC) - o);
    if (w <= 0.4) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = (50 + o).toFixed(2) + '%';
    el.style.width = w.toFixed(2) + '%';
  }

  function posZoneLeft(el, fromC, toC) {
    if (!el) return;
    const o = halfPct(fromC);
    const w = toC == null ? 50 - o : Math.max(0, halfPct(toC) - o);
    if (w <= 0.4) { el.hidden = true; return; }
    el.hidden = false;
    el.style.right = (50 + o).toFixed(2) + '%';
    el.style.width = w.toFixed(2) + '%';
  }

  function layoutZones() {
    [els.zoneWarnUp, els.zoneDanger, els.zoneDead, els.zoneLoose].forEach(el => { if (el) el.hidden = true; });
    const zone = els.meter.querySelector('.tuner-meter-zone');
    if (zone && meterWidth) {
      const travel = meterWidth / 2 - 18;
      zone.style.width = (2 * Math.abs(centsToPct(state.tolerance)) * travel / 100) + 'px';
    }
  }

  const referenceAnimation = createReferenceAnimation();
  function setReferenceStatus(status, playback) {
    referenceAnimation.stop();
    if (status === 'playing' && playback) referenceAnimation.play(els.figure, playback);
    if (!els) return;
    els.figure.setAttribute('aria-busy', String(status === 'loading'));
    els.figure.classList.toggle('reference-loading', status === 'loading');
    const announcement = document.getElementById('tunerAudioStatus');
    if (announcement) announcement.textContent = status === 'loading' ? 'Loading recorded guitar sound.' : status === 'playing' ? 'Playing recorded reference.' : '';
  }

  /* ---------- Chromatic free-mode live scrolling note rail ---------- */
  function centerRailDefault() {
    if (!els || !els.chromTape || !meterWidth) return;
    noteSpacing = railNotes[0]?.getBoundingClientRect().width || noteSpacing;
    if (!noteSpacing) return;
    const defaultMidi = 69; // A4
    const fractionalIdx = defaultMidi - START_MIDI;
    const tapeX = (meterWidth / 2) - ((fractionalIdx + 0.5) * noteSpacing);
    els.chromTape.style.transform = 'translate3d(' + tapeX.toFixed(1) + 'px, 0, 0)';
  }

  function buildRail() {
    if (!els || !els.chromTape || railNotes.length) return;
    railNotes = [];
    for (let m = START_MIDI; m <= END_MIDI; m++) {
      const pitchClass = NOTE_NAMES[((m % 12) + 12) % 12];
      const octave = Math.floor(m / 12) - 1;
      const sp = document.createElement('span');
      sp.className = 'rail-note';
      sp.setAttribute('data-midi', String(m));

      const noteText = document.createTextNode(pitchClass);
      sp.appendChild(noteText);

      const octSpan = document.createElement('span');
      octSpan.className = 'rail-note-octave';
      octSpan.textContent = String(octave);
      sp.appendChild(octSpan);

      railNotes.push(sp);
    }
    els.chromTape.replaceChildren(...railNotes);
    centerRailDefault();
  }

  function clearRail() {
    if (activeRailNearEl) {
      activeRailNearEl.classList.remove('is-near', 'active', 'is-exact');
      activeRailNearEl = null;
    }
    activeRailMidi = null;
    activeRailExact = false;
    centerRailDefault();
  }

  /* Live scrolling chromatic visualizer:
     Tape continuously translates left/right with subpixel precision tracking pitch.
     When pitch is exact, the note and reticle highlight. */
  function updateRail(freq, nearestMidi, isExact) {
    if (!els || !els.chromRail || els.chromRail.hidden || !els.chromTape || !meterWidth) return;
    if (!railNotes.length) buildRail();
    const mf = 69 + 12 * Math.log2(freq / state.a4);
    const fractionalIdx = mf - START_MIDI;
    const tapeX = (meterWidth / 2) - ((fractionalIdx + 0.5) * noteSpacing);
    els.chromTape.style.transform = 'translate3d(' + tapeX.toFixed(1) + 'px, 0, 0)';


    if (activeRailMidi !== nearestMidi || activeRailExact !== isExact) {
      if (activeRailNearEl) {
        activeRailNearEl.classList.remove('is-near', 'active', 'is-exact');
      }
      const idx = nearestMidi - START_MIDI;
      if (idx >= 0 && idx < railNotes.length) {
        activeRailNearEl = railNotes[idx];
        activeRailNearEl.classList.add('is-near');
        if (isExact) {
          activeRailNearEl.classList.add('active', 'is-exact');
        }
      } else {
        activeRailNearEl = null;
      }
      activeRailMidi = nearestMidi;
      activeRailExact = isExact;
    }
  }

  function clearSafetyClasses() {
    els.readout.classList.remove('safety-red', 'safety-red-soft', 'safety-green', 'safety-green-soft', 'in-tune', 'off-pitch');
    els.figure.classList.remove('safety-red', 'safety-red-soft', 'safety-green', 'safety-green-soft');
  }

  function setInTuneHighlight(on) {
    if (activeTargetEl) {
      const wasInTune = activeTargetEl.classList.contains('is-in-tune');
      activeTargetEl.classList.toggle('is-in-tune', !!on);
      if (on && !wasInTune) {
        activeTargetEl.classList.remove('lock-pop-celebrate');
        requestAnimationFrame(() => {
          if (activeTargetEl) activeTargetEl.classList.add('lock-pop-celebrate');
        });
        setTimeout(() => {
          if (activeTargetEl) activeTargetEl.classList.remove('lock-pop-celebrate');
        }, 400);
      }
    }
  }

  function setPill(text, pillClass) {
    // Announce status without duplicating the bottom Start/Stop action.
    const cls = 'sr-only';
    if (els.status) {
      setText(textMemo, els.status, text);
      if (els.status.className !== cls) els.status.className = cls;
    }
  }

  function setCents(text, extraClass) {
    if (!els.cents) return;
    setText(textMemo, els.cents, text);
    const base = 'tuner-note-cents';
    const cls = extraClass ? base + ' ' + extraClass : base;
    if (els.cents.className !== cls) els.cents.className = cls;
  }

  function formatCentsDisplay(cents, locked) {
    const value = Math.abs(cents) < 0.05 ? 0 : cents;
    return (value > 0 ? '+' : '') + (locked ? value.toFixed(1) : String(Math.round(value))) + ' ct';
  }

  /* Screen-reader summary through the polite status region: immediately
     when the in-tune state changes, otherwise at most every 2 s. */
  const ANNOUNCE_GAP_MS = 2000;
  let lastAnnounceAt = -Infinity, lastAnnounceInTune = false;
  function announceReading(reading, inTune, now) {
    const name = reading.detectedNote + reading.detectedOctave;
    const rounded = Math.round(Math.abs(reading.cents));
    const text = inTune ? name + ' in tune'
      : rounded === 0 ? name + ', on pitch'
      : name + ', ' + rounded + (rounded === 1 ? ' cent ' : ' cents ') + (reading.cents < 0 ? 'flat' : 'sharp');
    if (inTune === lastAnnounceInTune && now - lastAnnounceAt < ANNOUNCE_GAP_MS) return;
    lastAnnounceAt = now;
    lastAnnounceInTune = inTune;
    setPill(text, 'pill-neutral');
  }

  const visualState = createDisplayState();
  const tensionState = createDisplayState();
  function resetReadout() {
    els.readout.dataset.phase = visualState.reset(state.listening ? 'listening' : 'idle');
    tensionState.reset('unknown');
    renderTension('unknown');
    document.getElementById('tunerExtremeCue').textContent = '';
    clearSafetyClasses();
    setInTuneHighlight(false);
    setNeedle(0);
    els.readout.classList.remove('is-held');
    clearRail();
    setText(textMemo, els.note, '--');
    setText(textMemo, els.noteOctave, '');
    setText(textMemo, els.freq, '-- Hz');
    setText(textMemo, els.hint, '');
    setCents('', '');
    if (state.listening) {
      setPill(TUNER_COPY.listening, 'pill-neutral');
    } else if (state.starting) {
      setPill(TUNER_COPY.starting, 'pill-neutral');
    } else {
      setPill(TUNER_COPY.tapToStart, 'pill-cta');
    }
  }

  function setMicState(listening, starting) {
    state.listening = listening;
    state.starting = starting;
    els.micBtn.classList.toggle('listening', listening);
    els.micBtn.setAttribute('aria-label', listening ? 'Stop tuning' : starting ? 'Cancel microphone request' : 'Start tuning');
    els.micWarning.hidden = true;
    if (els.micCta) {
      const ctaText = els.micCta.querySelector('.tuner-mic-cta-text');
      if (ctaText) ctaText.textContent = listening ? 'STOP' : starting ? 'CANCEL' : 'START';
      els.micCta.classList.toggle('listening', listening);
      els.micCta.setAttribute('aria-label', listening ? 'Stop tuning' : starting ? 'Cancel microphone request' : 'Start tuning');
    }
    if (state.instrumentId === 'drums' && listening) {
      els.lowMicHint.textContent = TUNER_COPY.lowMicWarning;
      els.lowMicHint.hidden = false;
    } else {
      els.lowMicHint.hidden = true;
    }
    resetReadout();
  }

  function showMicWarning(message) {
    if (state.instrumentId === 'drums') { showToast(message, 'error'); return; }
    els.micWarning.textContent = message;
    els.micWarning.hidden = false;
  }

  function updateProgress(progress, confirmed) {
    const bar = document.getElementById('tunerConfirmation');
    const fill = document.getElementById('tunerConfirmationFill');
    const label = document.getElementById('tunerConfirmationLabel');
    const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
    if (bar) bar.setAttribute('aria-valuenow', String(percent));
    if (fill) fill.style.transform = 'scaleX(' + (percent / 100) + ')';
    setText(textMemo, label, state.mode === 'chromatic' ? 'Play one note at a time.' : confirmed ? 'String checked' : percent ? 'Confirming tuning · ' + percent + '%' : 'Keep one string ringing to confirm its tuning.');
  }

  function renderTension(zone) {
    const gauge = document.getElementById('tunerTension');
    gauge.dataset.zone = zone;
    els.readout.dataset.tension = zone;
    for (const segment of gauge.querySelectorAll('[data-zone]')) {
      const active = segment.dataset.zone === zone;
      segment.classList.toggle('is-active', active);
      segment.setAttribute('aria-current', String(active));
    }
    const labels = { unknown: '',
      normal: '', slack: 'Very loose string: tighten cautiously.',
      high: 'High tension / snap risk: stop tightening and loosen the string.' };
    setText(textMemo, document.getElementById('tunerTensionStatus'), labels[zone]);
  }

  function updateReading(reading) {
    const ear = state.mode === 'ear';
    const chromatic = state.mode === 'chromatic';
    const now = performance.now();
    const next = reading.status !== 'ok' ? 'listening' : reading.confirmed || (chromatic && reading.inRange) ? 'in-tune' : 'locked';
    els.readout.dataset.phase = visualState.update(ear && next === 'in-tune' ? 'locked' : next, now);
    els.readout.dataset.signal = reading.held ? 'held' : reading.status;
    if (reading.held) return;
    clearSafetyClasses();
    document.getElementById('tunerExtremeCue').textContent = '';
    setText(textMemo, els.hint, '');
    if (ear) {
      setNeedle(0); setInTuneHighlight(false);
      setText(textMemo, els.note, ''); setText(textMemo, els.noteOctave, '');
      setText(textMemo, els.freq, ''); setCents('', '');
      setPill(state.listening ? 'LISTEN AND MATCH BY EAR' : 'TAP TO START', 'pill-neutral');
      const zone = reading.status === 'ok' ? tensionZone(reading.rawCents, getProfile()) : 'unknown';
      renderTension(tensionState.update(zone, now));
      return;
    }
    if (reading.status !== 'ok') {
      setInTuneHighlight(false); setNeedle(0); setCents('', '');
      setPill(TUNER_COPY.listening, 'pill-neutral');
      setText(textMemo, els.note, '--'); setText(textMemo, els.noteOctave, '');
      setText(textMemo, els.freq, '-- Hz');
      return;
    }
    setNeedle(chromatic ? 0 : reading.cents);
    if (chromatic) updateRail(reading.freq, reading.midi, reading.inRange);
    setText(textMemo, els.note, reading.detectedNote);
    setText(textMemo, els.noteOctave, String(reading.detectedOctave));
    setText(textMemo, els.freq, reading.freq.toFixed(2) + ' Hz');
    const inTune = els.readout.dataset.phase === 'in-tune';
    setCents(formatCentsDisplay(reading.cents, reading.locked), reading.inRange ? 'is-in-tune' : reading.cents < 0 ? 'is-flat' : 'is-sharp');
    els.readout.classList.toggle('in-tune', inTune);
    setInTuneHighlight(inTune && !chromatic);
    if (!chromatic && Math.abs(reading.rawCents) > 100) {
      const cue = document.getElementById('tunerExtremeCue');
      cue.textContent = reading.rawCents < 0 ? '\u25c0' : '\u25b6';
      cue.dataset.direction = reading.rawCents < 0 ? 'low' : 'high';
    }
    announceReading(reading, chromatic ? reading.inRange : inTune, now);
  }

  async function refreshInputs() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (disposed) return;
      const select = document.getElementById('tunerInputDevice');
      if (!select) return;
      select.replaceChildren(new Option('System default', ''));
      devices.filter(device => device.kind === 'audioinput').forEach((device, index) => {
        select.add(new Option(device.label || 'Input ' + (index + 1), device.deviceId));
      });
      select.value = state.deviceId;
    } catch { /* Keep system default available when enumeration is restricted. */ }
  }

  function bindQualitySettings() {
    document.querySelectorAll('[data-string-label]').forEach(button => {
      button.addEventListener('click', () => {
        setStringLabel(button.getAttribute('data-string-label'));
        renderStringLabelSettings(); renderFigure();
      }, { signal: eventLifetime.signal });
    });
    document.getElementById('tunerGaugeInputs')?.addEventListener('change', event => {
      const input = event.target.closest('[data-string-gauge]');
      if (!input) return;
      if (!setStringGauge(Number(input.dataset.stringGauge), input.value)) showToast('Enter a gauge greater than 0 and up to 200.', 'error');
      renderStringLabelSettings(); renderFigure();
    }, { signal: eventLifetime.signal });
    const calibration = document.getElementById('tunerCalibration');
    calibration?.addEventListener('change', () => {
      if (!calibration.checkValidity()) { calibration.reportValidity(); return; }
      callbacks.onA4Select(calibration.value);
    }, { signal: eventLifetime.signal });
    document.getElementById('tunerCalibrationReset')?.addEventListener('click', () => callbacks.onA4Select(440), { signal: eventLifetime.signal });
    const tolerance = document.getElementById('tunerTolerance');
    if (tolerance) tolerance.value = String(state.tolerance);
    tolerance?.addEventListener('change', () => { setTolerance(tolerance.value); tolerance.value = String(state.tolerance); callbacks.onToleranceChange(); layoutZones(); }, { signal: eventLifetime.signal });
    document.getElementById('tunerInputDevice')?.addEventListener('change', event => { state.deviceId = event.target.value; callbacks.onInputChange(); }, { signal: eventLifetime.signal });
    document.getElementById('tunerInputChannel')?.addEventListener('change', event => { state.inputChannel = Number(event.target.value); callbacks.onInputChange(); }, { signal: eventLifetime.signal });
    navigator.mediaDevices?.addEventListener('devicechange', refreshInputs, { signal: eventLifetime.signal });
    document.addEventListener('keydown', event => {
      if (!sheetOpen || event.key !== 'Tab' || document.querySelector('.modal-backdrop:not(.hidden)')) return;
      const controls = Array.from(els.sheet.querySelectorAll('button, input, select, a[href], [tabindex="0"]')).filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === els.sheet)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === els.sheet)) { event.preventDefault(); first.focus(); }
    }, { signal: eventLifetime.signal });
  }

  /* Soft one-shot pop on the active peg after auto string identification —
     transform-only animation, no toast noise. */
  function pulseActivePeg() {
    if (!activeTargetEl) return;
    activeTargetEl.classList.remove('peg-acquired');
    requestAnimationFrame(() => activeTargetEl && activeTargetEl.classList.add('peg-acquired'));
    if (pegPulseTimer) clearTimeout(pegPulseTimer);
    pegPulseTimer = setTimeout(() => {
      if (activeTargetEl) activeTargetEl.classList.remove('peg-acquired');
    }, 450);
  }

  function renderStringLabelSettings() {
    const section = document.getElementById('tunerStringLabels');
    if (!section) return;
    section.hidden = state.instrumentId === 'drums';
    section.querySelectorAll('[data-string-label]').forEach(button => {
      const selected = button.getAttribute('data-string-label') === state.stringLabel;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('active', selected);
    });
    document.getElementById('tunerGaugeSettings').hidden = state.stringLabel !== 'gauge';
    const gauges = getStringGauges();
    document.getElementById('tunerGaugeInputs').style.setProperty('--tuner-gauge-columns', String(Math.min(5, gauges.length)));
    document.getElementById('tunerGaugeInputs').innerHTML = gauges.map((gauge, index) => `<label>String ${gauges.length - index}<input type="number" min="0.1" max="200" step="0.1" inputmode="decimal" data-string-gauge="${index}" aria-label="String ${gauges.length - index} gauge" value="${gauge ?? ''}" placeholder="—" /></label>`).join('');
  }

  function bindStaticEvents() {
    sheetReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.micBtn.addEventListener('click', () => callbacks.onMicToggle(), { signal: eventLifetime.signal });
    if (els.micCta) els.micCta.addEventListener('click', () => callbacks.onMicToggle(), { signal: eventLifetime.signal });
    Array.from(els.instrumentRow.querySelectorAll('[data-instrument]')).forEach((btn) => {
      btn.addEventListener('click', () => callbacks.onInstrumentChange(btn.getAttribute('data-instrument')), { signal: eventLifetime.signal });
    });
    if (els.presetBtn) els.presetBtn.addEventListener('click', showTuningView, { signal: eventLifetime.signal });
    if (els.settingsBtn) els.settingsBtn.addEventListener('click', () => openSheet(els.panelSettings, els.settingsBtn), { signal: eventLifetime.signal });
    if (els.settingsBtnBottom) els.settingsBtnBottom.addEventListener('click', () => openSheet(els.panelSettings, els.settingsBtnBottom), { signal: eventLifetime.signal });
    if (els.sheetBackdrop) els.sheetBackdrop.addEventListener('click', () => closeSheet(), { signal: eventLifetime.signal });
    if (els.sheetHandle) els.sheetHandle.addEventListener('click', () => closeSheet(), { signal: eventLifetime.signal });
    document.getElementById('tunerSheetClose')?.addEventListener('click', () => closeSheet(), { signal: eventLifetime.signal });
    if (els.sheetAutoAdvance) els.sheetAutoAdvance.addEventListener('click', () => {
      callbacks.onAutoAdvanceToggle(!state.autoAdvance);
      renderSheetSettings();
    }, { signal: eventLifetime.signal });
    if (els.sheetAutoId) els.sheetAutoId.addEventListener('click', () => {
      callbacks.onAutoIdToggle(!state.autoIdentify);
      renderSheetSettings();
    }, { signal: eventLifetime.signal });
    const countInput = document.getElementById('tunerStringCount');
    const commitCount = () => {
      if (!countInput.value || !countInput.checkValidity()) {
        showToast('Enter a whole string count between 1 and 12', 'warning');
        syncStringStepper(); return;
      }
      if (Number(countInput.value) !== currentStringCount()) callbacks.onStringCountSelect(Number(countInput.value));
      syncStringStepper();
    };
    countInput.addEventListener('focus', () => countInput.select(), { signal: eventLifetime.signal });
    countInput.addEventListener('blur', commitCount, { signal: eventLifetime.signal });
    countInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); countInput.blur(); }
      if (event.key === 'Escape') { event.stopPropagation(); syncStringStepper(); countInput.blur(); }
    }, { signal: eventLifetime.signal });
    for (const [id, delta] of [['tunerStringsMinus', -1], ['tunerStringsPlus', 1]]) {
      document.getElementById(id).addEventListener('click', () => {
        callbacks.onStringCountSelect(currentStringCount() + delta); syncStringStepper();
      }, { signal: eventLifetime.signal });
    }
    if (els.copyLinkBtn) els.copyLinkBtn.addEventListener('click', copyTunerLink, { signal: eventLifetime.signal });
    attachSheetDrag();
    // Legacy topbar pills (now hidden) — keep guarded for compat, not used in new UI
    if (els.modeBtn) els.modeBtn.addEventListener('click', () => toggleMenu('mode', renderModeMenu, els.modeBtn), { signal: eventLifetime.signal });
    if (els.stringsBtn) els.stringsBtn.addEventListener('click', () => toggleMenu('strings', renderStringsMenu, els.stringsBtn), { signal: eventLifetime.signal });
    if (els.materialBtn) els.materialBtn.addEventListener('click', () => toggleMenu('material', renderMaterialMenu, els.materialBtn), { signal: eventLifetime.signal });
    // New sheet controls — strings/material open upward without closing sheet
    if (els.sheetStringsBtn) els.sheetStringsBtn.addEventListener('click', () => toggleSheetMenu('sheetStrings', renderSheetStringsMenu, els.sheetStringsBtn), { signal: eventLifetime.signal });
    if (els.sheetMaterialBtnSheet) els.sheetMaterialBtnSheet.addEventListener('click', () => toggleSheetMenu('sheetMaterial', renderSheetMaterialMenu, els.sheetMaterialBtnSheet), { signal: eventLifetime.signal });
    if (els.instrumentBtn) els.instrumentBtn.addEventListener('click', () => toggleMenu('instrument', renderInstrumentMenu, els.instrumentBtn), { signal: eventLifetime.signal });
    els.backToTunerBtn.addEventListener('click', showTunerView, { signal: eventLifetime.signal });

    if (els.searchClearBtn) {
      els.searchClearBtn.addEventListener('click', () => {
        if (els.searchInput) {
          els.searchInput.value = '';
          renderTuningList('');
          els.searchInput.focus();
        }
      }, { signal: eventLifetime.signal });
    }

    if (els.searchInput) {
      els.searchInput.addEventListener('input', () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => renderTuningList(getSearchQuery()), SEARCH_DEBOUNCE_MS);
      }, { signal: eventLifetime.signal });
    }

    els.filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeFilter = chip.getAttribute('data-filter') || 'all';
        els.filterChips.forEach((c) => c.classList.toggle('active', c === chip));
        renderTuningList(getSearchQuery());
      }, { signal: eventLifetime.signal });
    });

    document.addEventListener('click', (e) => {
      if (!openMenuName) return;
      if (e.target.closest('.tuner-menu-panel')) return;
      if (e.target.closest('#tunerModeBtn, #tunerStringsBtn, #tunerMaterialBtn, #tunerInstrumentBtn, #tunerSheetStringsBtn, #tunerSheetMaterialBtn')) return;
      closeMenus(true);
    }, { signal: eventLifetime.signal });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modalOpen = document.querySelector('.modal-backdrop:not(.hidden)');
        if (modalOpen) return;
        if (openMenuName) {
          closeMenus(true);
          return;
        }
        if (sheetOpen) {
          closeSheet();
        } else if (!els.tuningView.hidden) {
          showTunerView();
        }
      }
    }, { signal: eventLifetime.signal });

    window.addEventListener('resize', invalidateMeterRect, { ...({ passive: true }), signal: eventLifetime.signal });
  }

  function resetFilter() {
    activeFilter = 'all';
    if (els && els.filterChips) {
      els.filterChips.forEach((c) => c.classList.toggle('active', c.getAttribute('data-filter') === 'all'));
    }
  }

  function clearSearch() {
    if (els && els.searchInput) els.searchInput.value = '';
    if (els && els.searchClearBtn) els.searchClearBtn.hidden = true;
  }

  function init() {
    cache();
    bindStaticEvents();
    bindQualitySettings();
    invalidateMeterRect();
    buildRail();
    renderTopbar();
    renderInstrumentRow();
    renderFigure();
    renderSheetSettings();
    invalidateMeterRect();
    if ('ResizeObserver' in window) {
      meterObserver = new ResizeObserver(invalidateMeterRect);
      meterObserver.observe(els.meter);
    }
    updateProgress(0, false);
    setMicState(false, false);
  }

  return {
    destroy, updateProgress, refreshInputs, setReferenceStatus,
    init,
    renderTopbar,
    renderInstrumentRow,
    renderFigure,
    renderTuningList,
    renderA4,
    showTunerView,
    showTuningView,
    setMicState,
    resetReadout,
    updateReading,
    showMicWarning,
    pulseActivePeg,
    invalidateMeterRect,
    closeMenus,
    resetFilter,
    clearSearch,
    openSheet,
    closeSheet,
    renderSheetSettings,
    get isSheetOpen() { return sheetOpen; },
    get panelSettings() { return els ? els.panelSettings : null; },
    get settingsBtn() { return els ? els.settingsBtn : null; },
    get settingsBtnBottom() { return els ? els.settingsBtnBottom : null; },
    toast: showToast
  };
}

