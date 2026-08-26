import {
  TUNER_INSTRUMENTS,
  TUNER_CATEGORY_LABELS,
  TUNER_CATEGORY_ORDER,
  MATERIAL_PROFILES,
  A4_CALIBRATION,
  TUNER_COPY,
  DETECT
} from '../../../settings/tuner.config';
import { showToast } from '../toast.js';
import { NOTE_NAMES, noteLetter } from './notesUtil.js';
import {
  state,
  getGroup,
  getPreset,
  getProfile,
  materialOptions,
  stringCountOptions,
  currentStringCount
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
  let els = null;
  let meterWidth = 0;
  let openMenuName = null;
  let openTriggerEl = null;
  let openPanelEl = null;
  let searchTimer = null;
  let figureListenerBound = false;
  let activeTargetEl = null;
  let activeFilter = 'all';
  const START_MIDI = 20;
  const NOTE_SPACING_PX = 56;
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
    meterWidth = els.meter.offsetWidth || 0;
    if (state && state.mode === 'chromatic') {
      centerRailDefault();
    }
  }

  function showTunerView() {
    closeMenus();
    els.tuningView.hidden = true;
    els.tunerView.hidden = false;
    window.scrollTo(0, 0);
    requestAnimationFrame(invalidateMeterRect);
  }

  function showTuningView() {
    closeMenus();
    els.tunerView.hidden = true;
    els.tuningView.hidden = false;
    window.scrollTo(0, 0);
    renderTuningList(getSearchQuery());
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
    if (els.modeMenuSlot) els.modeMenuSlot.innerHTML = '';
    if (els.stringsMenuSlot) els.stringsMenuSlot.innerHTML = '';
    if (els.materialMenuSlot) els.materialMenuSlot.innerHTML = '';
    if (els.instrumentMenuSlot) els.instrumentMenuSlot.innerHTML = '';
    if (els.sheetStringsSlot) els.sheetStringsSlot.innerHTML = '';
    if (els.sheetMaterialSlot) els.sheetMaterialSlot.innerHTML = '';
    if (els.sheetStringsBtn) els.sheetStringsBtn.setAttribute('aria-expanded', 'false');
    if (els.sheetMaterialBtnSheet) els.sheetMaterialBtnSheet.setAttribute('aria-expanded', 'false');
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
      els.sheet.hidden = true;
      els.sheetBackdrop.hidden = true;
    };
    if (sheetReducedMotion) {
      done();
    } else {
      setTimeout(done, 240);
    }
  }

  function attachSheetDrag() {
    if (!els || !els.sheet || !els.sheetHandle) return;
    els.sheet.addEventListener('touchstart', (e) => {
      if (!sheetOpen || e.touches.length !== 1) return;
      sheetDrag = {
        startY: e.touches[0].clientY,
        lastY: e.touches[0].clientY,
        startTime: performance.now(),
        engaged: false,
        translateY: 0
      };
      document.addEventListener('touchmove', onSheetDragMove, { passive: false });
      document.addEventListener('touchend', onSheetDragEnd, { passive: true });
      document.addEventListener('touchcancel', onSheetDragEnd, { passive: true });
    }, { passive: true });
  }

  function onSheetDragMove(e) {
    if (!sheetDrag || !els || !els.sheet || !els.sheetHandle) return;
    const touch = e.touches[0];
    const dy = touch.clientY - sheetDrag.startY;
    sheetDrag.lastY = touch.clientY;
    if (!sheetDrag.engaged) {
      const atTop = els.sheet.scrollTop <= 2;
      const onHandle = e.target === els.sheetHandle || els.sheetHandle.contains(e.target);
      if (dy > 8 && (atTop || onHandle)) {
        sheetDrag.engaged = true;
        els.sheet.classList.add('dragging');
      } else if (Math.abs(dy) > 8) {
        cleanupSheetDragListeners();
        sheetDrag = null;
        return;
      } else {
        return;
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
    if (translateY > 90 || velocity > 0.35) {
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
      });
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
      });
    });
  }

  function buildSheetModeRow() {
    if (!els || !els.sheetModeRow) return;
    const isGuided = state.mode === 'guided';
    els.sheetModeRow.innerHTML = `
      <button type="button" class="tuner-sheet-chip brutal-press${isGuided ? ' active' : ''}" role="radio" aria-checked="${isGuided}" data-sheet-mode="guided">GUIDED</button>
      <button type="button" class="tuner-sheet-chip brutal-press${!isGuided ? ' active' : ''}" role="radio" aria-checked="${!isGuided}" data-sheet-mode="chromatic">FREE</button>
    `;
    els.sheetModeRow.querySelectorAll('[data-sheet-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeMenus(false);
        callbacks.onModeSelect(btn.getAttribute('data-sheet-mode'));
      });
    });
  }

  function syncSheetSetupButtons() {
    if (!els) return;
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
    const profile = state.materialId === 'off' ? null : MATERIAL_PROFILES[state.materialId];
    if (els.sheetMaterialLabelSheet) {
      els.sheetMaterialLabelSheet.textContent = hasMaterial ? (profile ? profile.shortLabel : 'OFF') : '—';
    }
    // legacy hidden tops still keep state sync
    if (els.stringsLabel) els.stringsLabel.textContent = hasStrings ? currentStringCount() + ' STRINGS' : '';
    if (els.materialLabel) els.materialLabel.textContent = profile ? profile.shortLabel : 'OFF';
  }

  function renderSheetSettings() {
    if (!els) return;
    buildSheetInstrumentRow();
    buildSheetModeRow();
    syncSheetSetupButtons();
    // keep legacy hidden rows in sync for tests that might query them
    buildSheetMaterialRow();
    buildSheetA4Row();
    if (els.sheetAutoAdvance) els.sheetAutoAdvance.checked = !!state.autoAdvance;
    if (els.sheetAutoId) els.sheetAutoId.checked = !!state.autoIdentify;
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
    });
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
          <input type="number" min="3" max="12" step="1" aria-label="Custom string count" class="tuner-custom-input" value="${isCustomActive ? current : ''}" placeholder="3-12" />
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
        const val = parseInt(input ? input.value : '', 10);
        if (!Number.isInteger(val) || val < 3 || val > 12) {
          showToast('Enter a string count between 3 and 12', 'warning');
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
    });
    panel.querySelector('.tuner-custom-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        panel.querySelector('.tuner-custom-apply')?.click();
      }
    });
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
    });
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
          <input type="number" min="3" max="12" step="1" aria-label="Custom string count" class="tuner-custom-input" value="${isCustomActive ? current : ''}" placeholder="3-12" />
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
        const val = parseInt(input ? input.value : '', 10);
        if (!Number.isInteger(val) || val < 3 || val > 12) {
          showToast('Enter a string count between 3 and 12', 'warning');
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
    });
    panel.querySelector('.tuner-custom-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        panel.querySelector('.tuner-custom-apply')?.click();
      }
    });
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
    });
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
    });
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

    els.tunerView.classList.toggle('mode-chromatic', state.mode === 'chromatic');
    if (els.chromRail) {
      els.chromRail.hidden = state.mode !== 'chromatic';
      if (state.mode === 'chromatic') {
        buildRail();
        centerRailDefault();
      }
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
        if (label) label.textContent = noteText;
        peg.setAttribute('aria-label', 'Target string ' + str.note);
        peg.classList.toggle('is-active', idx === state.stringIndex);
        peg.classList.remove('is-in-tune');
      });
      activeTargetEl = els.figure.querySelector('.tuner-peg.is-active');
    }
    if (!figureListenerBound) {
      figureListenerBound = true;
      els.figure.addEventListener('click', (e) => {
        const peg = e.target.closest('[data-string-index]');
        if (peg) callbacks.onStringSelect(parseInt(peg.getAttribute('data-string-index'), 10));
      });
      els.figure.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const peg = e.target.closest('[data-string-index]');
        if (peg) {
          e.preventDefault();
          callbacks.onStringSelect(parseInt(peg.getAttribute('data-string-index'), 10));
        }
      });
    }
  }

  function renderA4() {
    // A4 UI removed — fixed 440 Hz. Keep legacy containers empty but safe-guard for hidden elements.
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
      });
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
        });
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
    els.instrumentLabel.textContent = group.dropdownLabel;
    renderA4();
  }

  function getSearchQuery() {
    return els.searchInput ? els.searchInput.value : '';
  }

  /* Meter scale: linear ±50¢ core, then log-compressed out to ±650¢ so the
     material-profile warn/danger (breakage) and loose/dead thresholds are
     visible as highlighted sections on the meter itself. */
  function centsToPct(cents) {
    const fine = DETECT.METER_FINE_CENTS;
    const ext = DETECT.METER_MAX_CENTS;
    const core = DETECT.METER_CORE_SPLIT;
    const a = Math.abs(cents);
    const sg = cents < 0 ? -1 : 1;
    if (a <= fine) return sg * (a / fine) * core * 50;
    const t = Math.min(1, Math.log(a / fine) / Math.log(ext / fine));
    return sg * (core + t * (1 - core)) * 50;
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
    const profile = state.mode === 'guided' && state.instrumentId !== 'drums' ? getProfile() : null;
    const active = !!profile;
    [els.zoneWarnUp, els.zoneDanger, els.zoneDead, els.zoneLoose].forEach((el) => {
      if (el) el.hidden = !active;
    });
    if (!active) return;
    // Sharp side: stretching -> snap risk (breakage)
    posZoneRight(els.zoneWarnUp, profile.warnUp * 100, profile.dangerUp * 100);
    posZoneRight(els.zoneDanger, profile.dangerUp * 100, null);
    // Flat side: very loose -> dead slack
    posZoneLeft(els.zoneLoose, profile.warnDown * 100, profile.deadDown * 100);
    posZoneLeft(els.zoneDead, profile.deadDown * 100, null);
  }

  /* ---------- Chromatic free-mode live scrolling note rail ---------- */
  function centerRailDefault() {
    if (!els || !els.chromTape || !meterWidth) return;
    const defaultMidi = 69; // A4
    const fractionalIdx = defaultMidi - START_MIDI;
    const tapeX = (meterWidth / 2) - ((fractionalIdx + 0.5) * NOTE_SPACING_PX);
    els.chromTape.style.transform = 'translate3d(' + tapeX.toFixed(1) + 'px, 0, 0)';
  }

  function buildRail() {
    if (!els || !els.chromTape || railNotes.length) return;
    railNotes = [];
    for (let m = START_MIDI; m <= 108; m++) {
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
  function updateRail(freq, cents, locked) {
    if (!els || !els.chromRail || els.chromRail.hidden || !els.chromTape || !meterWidth) return;
    if (!railNotes.length) buildRail();
    const mf = 69 + 12 * Math.log2(freq / state.a4);
    const fractionalIdx = mf - START_MIDI;
    const tapeX = (meterWidth / 2) - ((fractionalIdx + 0.5) * NOTE_SPACING_PX);
    els.chromTape.style.transform = 'translate3d(' + tapeX.toFixed(1) + 'px, 0, 0)';

    const nearestMidi = Math.round(mf);
    const isExact = Math.abs(cents) <= DETECT.IN_TUNE_CENTS;

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

  function applySafetyClasses(color) {
    if (!color || color === 'grey') return;
    els.readout.classList.add('safety-' + color);
    els.figure.classList.add('safety-' + color);
  }

  function setInTuneHighlight(on) {
    if (activeTargetEl) activeTargetEl.classList.toggle('is-in-tune', !!on);
  }

  function setPill(text, pillClass) {
    // Hidden a11y live region — always sr-only
    const base = 'tuner-status sr-only';
    const cls = base + (pillClass ? ' ' + pillClass : '');
    if (els.status) {
      setText(textMemo, els.status, text);
      if (els.status.className !== cls) els.status.className = cls;
    }
  }

  function setCents(text, extraClass) {
    if (!els.cents) return;
    setText(textMemo, els.cents, text);
    const base = 'tuner-cents';
    const cls = extraClass ? base + ' ' + extraClass : base;
    if (els.cents.className !== cls) els.cents.className = cls;
  }

  function formatCentsDisplay(cents, locked) {
    const abs = Math.abs(cents);
    if (abs <= DETECT.IN_TUNE_CENTS) return '0 ct';
    const sign = cents < 0 ? '-' : '+';
    const val = locked && abs < DETECT.FINE_CENTS_RANGE ? abs.toFixed(1) : String(Math.round(abs));
    return sign + val + ' ct';
  }

  /* Sub-cent display: one decimal while the detector is locked and inside
     the fine range, whole cents otherwise (TomSchimansky-style precision). */
  function formatCents(cents, fine) {
    const abs = Math.abs(cents);
    return fine && abs < DETECT.FINE_CENTS_RANGE ? abs.toFixed(1) : String(Math.round(abs));
  }

  function resetReadout() {
    clearSafetyClasses();
    setInTuneHighlight(false);
    setNeedle(0);
    els.readout.classList.remove('is-held');
    clearRail();
    setText(textMemo, els.note, '--');
    setText(textMemo, els.noteOctave, '');
    setText(textMemo, els.freq, '');
    setText(textMemo, els.hint, '');
    setCents('--', '');
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
    els.micWarning.hidden = true;
    if (els.micCta) {
      const ctaText = els.micCta.querySelector('.tuner-mic-cta-text');
      if (ctaText) ctaText.textContent = listening ? TUNER_COPY.stopTuner : starting ? TUNER_COPY.starting : TUNER_COPY.startTuner;
      els.micCta.classList.toggle('listening', listening);
      els.micCta.setAttribute('aria-label', listening ? 'Stop tuning' : 'Start tuning');
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
    els.micWarning.textContent = message;
    els.micWarning.hidden = false;
  }

  function updateReading(reading) {
    const chromatic = state.mode === 'chromatic';

    // Held frame: repeat of the last confident reading between plucks.
    // Touch nothing except the held styling — this is what makes the note
    // stay put instead of gathering and vanishing every gate dip.
    if (reading.held) {
      els.readout.classList.add('is-held');
      return;
    }
    els.readout.classList.remove('is-held');
    clearSafetyClasses();

    if (reading.status !== 'ok') {
      setNeedle(0);
      setInTuneHighlight(false);
      clearRail();
      setCents('--', '');
      if (reading.status === 'polyphonic') {
        setPill(TUNER_COPY.playOneString, 'pill-neutral');
      } else if (reading.status === 'clipped') {
        setPill(TUNER_COPY.tooLoud, 'pill-neutral');
      } else {
        setPill(TUNER_COPY.listening, 'pill-neutral');
      }
      setText(textMemo, els.note, '--');
      setText(textMemo, els.noteOctave, '');
      setText(textMemo, els.freq, '');
      setText(textMemo, els.hint, '');
      return;
    }

    const cents = reading.cents;
    if (!chromatic) {
      setNeedle(cents);
    } else {
      setNeedle(0);
    }
    setText(textMemo, els.note, noteLetter(reading.detectedNote));
    setText(textMemo, els.noteOctave, chromatic ? String(reading.detectedOctave) : '');
    setText(textMemo, els.freq, reading.freq.toFixed(1) + ' Hz');

    if (!chromatic) {
      if (reading.zone === 'wrong-octave') {
        setNeedle(0);
        setInTuneHighlight(false);
        setCents('--', '');
        setPill('CHECK THE PEGS', 'pill-neutral');
        setText(textMemo, els.hint, '');
        return;
      }
      if (Math.abs(cents) <= DETECT.IN_TUNE_CENTS) {
        setCents('0 ct', 'is-in-tune');
        setPill(TUNER_COPY.inTune, 'pill-tuned');
        setInTuneHighlight(true);
        els.readout.classList.add('in-tune');
        setText(textMemo, els.hint, '');
      } else {
        const dir = cents < 0 ? TUNER_COPY.tooFlat : TUNER_COPY.tooSharp;
        setCents(formatCentsDisplay(cents, reading.locked), cents < 0 ? 'is-flat' : 'is-sharp');
        setPill(dir + ' \u00B7 ' + formatCents(cents, reading.locked) + '\u00A2', 'pill-off');
        setInTuneHighlight(false);
        els.readout.classList.add('off-pitch');
        setText(textMemo, els.hint, cents < 0 ? 'TIGHTEN \u2191' : 'LOOSEN \u2193');
      }
      applySafetyClasses(reading.color);
    } else {
      setInTuneHighlight(false);
      updateRail(reading.freq, cents, reading.locked);
      const isExact = Math.abs(cents) <= DETECT.IN_TUNE_CENTS;
      els.readout.classList.toggle('in-tune', isExact);
      const signed = (cents >= 0 ? '+' : '-') + formatCents(cents, reading.locked);
      if (isExact) {
        setCents('0 ct', 'is-in-tune');
        setPill(reading.nearestName + ' \u00B7 IN TUNE', 'pill-tuned');
      } else {
        setCents(formatCentsDisplay(cents, reading.locked), cents < 0 ? 'is-flat' : 'is-sharp');
        setPill(reading.nearestName + ' \u00B7 ' + signed + '\u00A2', 'pill-neutral');
      }
      setText(textMemo, els.hint, reading.nearestName + ' \u00B7 ' + signed + '\u00A2');
    }
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

  function bindStaticEvents() {
    sheetReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.readout.addEventListener('click', () => callbacks.onMicToggle());
    if (els.micCta) els.micCta.addEventListener('click', () => callbacks.onMicToggle());
    Array.from(els.instrumentRow.querySelectorAll('[data-instrument]')).forEach((btn) => {
      btn.addEventListener('click', () => callbacks.onInstrumentChange(btn.getAttribute('data-instrument')));
    });
    if (els.presetBtn) els.presetBtn.addEventListener('click', showTuningView);
    if (els.settingsBtn) els.settingsBtn.addEventListener('click', () => openSheet(els.panelSettings, els.settingsBtn));
    if (els.settingsBtnBottom) els.settingsBtnBottom.addEventListener('click', () => openSheet(els.panelSettings, els.settingsBtnBottom));
    if (els.sheetBackdrop) els.sheetBackdrop.addEventListener('click', () => closeSheet());
    if (els.sheetHandle) els.sheetHandle.addEventListener('click', () => closeSheet());
    if (els.sheetAutoAdvance) els.sheetAutoAdvance.addEventListener('change', () => {
      callbacks.onAutoAdvanceToggle(els.sheetAutoAdvance.checked);
      renderSheetSettings();
    });
    if (els.sheetAutoId) els.sheetAutoId.addEventListener('change', () => {
      callbacks.onAutoIdToggle(els.sheetAutoId.checked);
      renderSheetSettings();
    });
    if (els.copyLinkBtn) els.copyLinkBtn.addEventListener('click', copyTunerLink);
    attachSheetDrag();
    // Legacy topbar pills (now hidden) — keep guarded for compat, not used in new UI
    if (els.modeBtn) els.modeBtn.addEventListener('click', () => toggleMenu('mode', renderModeMenu, els.modeBtn));
    if (els.stringsBtn) els.stringsBtn.addEventListener('click', () => toggleMenu('strings', renderStringsMenu, els.stringsBtn));
    if (els.materialBtn) els.materialBtn.addEventListener('click', () => toggleMenu('material', renderMaterialMenu, els.materialBtn));
    // New sheet controls — strings/material open upward without closing sheet
    if (els.sheetStringsBtn) els.sheetStringsBtn.addEventListener('click', () => toggleSheetMenu('sheetStrings', renderSheetStringsMenu, els.sheetStringsBtn));
    if (els.sheetMaterialBtnSheet) els.sheetMaterialBtnSheet.addEventListener('click', () => toggleSheetMenu('sheetMaterial', renderSheetMaterialMenu, els.sheetMaterialBtnSheet));
    if (els.instrumentBtn) els.instrumentBtn.addEventListener('click', () => toggleMenu('instrument', renderInstrumentMenu, els.instrumentBtn));
    els.backToTunerBtn.addEventListener('click', showTunerView);

    if (els.searchClearBtn) {
      els.searchClearBtn.addEventListener('click', () => {
        if (els.searchInput) {
          els.searchInput.value = '';
          renderTuningList('');
          els.searchInput.focus();
        }
      });
    }

    if (els.searchInput) {
      els.searchInput.addEventListener('input', () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => renderTuningList(getSearchQuery()), SEARCH_DEBOUNCE_MS);
      });
    }

    els.filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeFilter = chip.getAttribute('data-filter') || 'all';
        els.filterChips.forEach((c) => c.classList.toggle('active', c === chip));
        renderTuningList(getSearchQuery());
      });
    });

    document.addEventListener('click', (e) => {
      if (!openMenuName) return;
      if (e.target.closest('.tuner-menu-panel')) return;
      if (e.target.closest('#tunerModeBtn, #tunerStringsBtn, #tunerMaterialBtn, #tunerInstrumentBtn, #tunerSheetStringsBtn, #tunerSheetMaterialBtn')) return;
      closeMenus(true);
    });

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
    });

    window.addEventListener('resize', invalidateMeterRect, { passive: true });
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
    invalidateMeterRect();
    buildRail();
    renderTopbar();
    renderInstrumentRow();
    renderFigure();
    renderSheetSettings();
    setMicState(false, false);
  }

  return {
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

