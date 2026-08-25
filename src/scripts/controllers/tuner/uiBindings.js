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
  let railNotes = [];
  let pegPulseTimer = null;
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
      badgeLow: document.getElementById('tunerBadgeLow'),
      badgeHigh: document.getElementById('tunerBadgeHigh'),
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
      filterChips: Array.from(document.querySelectorAll('.tuning-filter-chip'))
    };
  }

  function invalidateMeterRect() {
    if (!els || !els.meter) return;
    meterWidth = els.meter.offsetWidth || 0;
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
  }

  function toggleMenu(name, renderFn, btn) {
    if (openMenuName === name) {
      closeMenus(false);
      return;
    }
    closeMenus(false);
    openMenuName = name;
    openTriggerEl = btn || null;
    renderFn();
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
          <span class="tuner-menu-row-title">Guided instrument mode</span>
          <span class="tuner-menu-row-sub">String targets, safety colors, auto-step</span>
        </span>
        <span class="tuner-menu-check" aria-hidden="true">${guidedActive ? '&#10003;' : ''}</span>
      </button>
      <button type="button" class="tuner-menu-row${guidedActive ? '' : ' active'}" role="menuitemradio" aria-checked="${!guidedActive}" data-mode="chromatic">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Chromatic free mode</span>
          <span class="tuner-menu-row-sub">Any pitch, no targets</span>
        </span>
        <span class="tuner-menu-check" aria-hidden="true">${guidedActive ? '' : '&#10003;'}</span>
      </button>
      <div class="tuner-menu-divider" role="separator"></div>
      <button type="button" class="tuner-menu-row tuner-menu-toggle-row${state.mode === 'chromatic' ? ' disabled' : ''}" role="menuitemcheckbox" aria-checked="${state.autoAdvance}" data-auto-advance aria-disabled="${state.mode === 'chromatic'}">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Auto-advance</span>
          <span class="tuner-menu-row-sub">Step to next string when tuned</span>
        </span>
        <span class="tuner-toggle${state.autoAdvance ? ' on' : ''}" role="switch" aria-checked="${state.autoAdvance}" aria-label="Auto-advance">
          <span class="tuner-toggle-knob"></span>
        </span>
      </button>
      <button type="button" class="tuner-menu-row tuner-menu-toggle-row${state.mode === 'chromatic' ? ' disabled' : ''}" role="menuitemcheckbox" aria-checked="${state.autoIdentify}" data-auto-id aria-disabled="${state.mode === 'chromatic'}">
        <span class="tuner-menu-row-text">
          <span class="tuner-menu-row-title">Auto string select</span>
          <span class="tuner-menu-row-sub">Follow whichever string you pluck</span>
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
        if (count === 6) subtitle = 'The universal standard for most genres.';
        else if (count === 7) subtitle = 'Adds a lower B string for heavier rock and metal.';
        else if (count === 8) subtitle = 'Adds a low B and a lower F# string for extreme low-end riffs.';
        else if (count === 5) subtitle = '5-string configuration';
      } else if (state.instrumentId === 'acoustic') {
        if (count === 6) subtitle = 'The standard setup for strumming and fingerpicking.';
        else if (count === 12) subtitle = 'Uses six pairs of strings tuned in octaves and unisons for a rich, shimmering sound.';
        else if (count === 5) subtitle = '5-string configuration';
      } else if (state.instrumentId === 'bass') {
        if (count === 4) subtitle = 'The traditional setup found on most classic recordings.';
        else if (count === 5) subtitle = 'Adds a low B string for modern pop, gospel, and metal.';
        else if (count === 6) subtitle = 'Adds a low B and a high C string, favored by jazz and solo bassists.';
      }
      // Fallbacks for legacy counts
      if (count === 7 && state.instrumentId === 'acoustic') subtitle = 'Rare, but used in classical music or specialized modern acoustic genres.';
      if (count === 8 && state.instrumentId === 'acoustic') subtitle = 'Rare, but used in classical music or specialized modern acoustic genres.';

      return `
        <button type="button" class="tuner-menu-row${active ? ' active' : ''}" role="menuitemradio" aria-checked="${active}" data-string-count="${count}">
          <span class="tuner-menu-row-text">
            <span class="tuner-menu-row-title">${count} STRINGS</span>
            <span class="tuner-menu-row-sub">${subtitle}</span>
          </span>
          <span class="tuner-menu-check" aria-hidden="true">${active ? '&#10003;' : ''}</span>
        </button>`;
    }).join('');

    let customSubtitle = 'Custom string count';
    if (state.instrumentId === 'electric') customSubtitle = 'Rare custom instruments adding even deeper bass strings.';
    else if (state.instrumentId === 'acoustic') customSubtitle = 'Rare, but used in classical music or specialized modern acoustic genres.';
    else if (state.instrumentId === 'bass') customSubtitle = 'Custom string setup';
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
          <span class="tuner-menu-row-sub">No safety highlighting</span>
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
    els.presetLabel.textContent = getPreset().name;
    const isGuided = state.mode === 'guided';
    if (els.modeLabel) els.modeLabel.textContent = isGuided ? 'GUIDED' : 'FREE';

    // Strings Pill — also hide anchor as fallback for browsers without :has()
    const stringOpts = stringCountOptions();
    const stringsVisible = stringOpts.length > 0 && state.instrumentId !== 'drums';
    if (els.stringsBtn) {
      els.stringsBtn.hidden = !stringsVisible;
      const anchor = els.stringsBtn.closest('.tuner-menu-anchor');
      if (anchor) anchor.hidden = !stringsVisible;
    }
    if (els.stringsLabel) {
      els.stringsLabel.textContent = currentStringCount() + ' STRINGS';
    }

    // Material Pill
    const profile = state.materialId === 'off' ? null : MATERIAL_PROFILES[state.materialId];
    const materialVisible = materialOptions().length > 0 && isGuided;
    if (els.materialBtn) {
      els.materialBtn.hidden = !materialVisible;
      const anchor = els.materialBtn.closest('.tuner-menu-anchor');
      if (anchor) anchor.hidden = !materialVisible;
    }
    if (els.materialLabel) els.materialLabel.textContent = profile ? profile.shortLabel : 'OFF';
    if (els.materialBtn) {
      if (state.materialId === 'off') els.materialBtn.classList.add('off');
      else els.materialBtn.classList.remove('off');
    }

    els.tunerView.classList.toggle('mode-chromatic', state.mode === 'chromatic');
    if (els.chromRail) els.chromRail.hidden = state.mode !== 'chromatic';
    layoutZones();
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
    els.a4Chips.replaceChildren();
    A4_CALIBRATION.forEach((hz) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tuning-a4-chip' + (hz === state.a4 ? ' active' : '');
      chip.textContent = String(hz);
      chip.setAttribute('aria-pressed', hz === state.a4 ? 'true' : 'false');
      chip.addEventListener('click', () => callbacks.onA4Select(hz));
      els.a4Chips.appendChild(chip);
    });
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
        nameEl.textContent = preset.name;

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

  /* ---------- Chromatic free-mode note rail ---------- */
  function buildRail() {
    if (!els.chromRail || railNotes.length) return;
    railNotes = NOTE_NAMES.map((n) => {
      const sp = document.createElement('span');
      sp.className = 'rail-note';
      sp.textContent = n;
      return sp;
    });
    els.chromRail.replaceChildren(...railNotes);
  }

  function clearRail() {
    railNotes.forEach((el) => {
      if (el._v) { el._v = 0; el.style.removeProperty('--rg'); }
      el.classList.remove('active');
    });
  }

  /* Progressive proximity glow: every note lights up in proportion to how
     close the played pitch is to it — the nearest semitone brightest,
     neighbours fading with distance. Rail runs low (left) to high (right). */
  function updateRail(freq) {
    if (!railNotes.length || !els.chromRail || els.chromRail.hidden) return;
    const mf = 69 + 12 * Math.log2(freq / state.a4);
    const range = DETECT.RAIL_RANGE_CENTS;
    for (let i = 0; i < railNotes.length; i++) {
      const cls = i;
      let d = Math.abs(mf - (Math.round((mf - cls) / 12) * 12 + cls)) * 100;
      if (d > 600) d = 1200 - d;
      const v = Math.max(0, 1 - d / range);
      const q = Math.round(v * 12) / 12; // quantised: fewer style writes
      const el = railNotes[i];
      if (q <= 0) {
        if (el._v) { el._v = 0; el.style.removeProperty('--rg'); }
        el.classList.remove('active');
        continue;
      }
      if (el._v !== q) {
        el._v = q;
        el.style.setProperty('--rg', q.toFixed(3));
      }
      el.classList.toggle('active', d <= 60);
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
    const cls = 'tuner-status' + (pillClass ? ' ' + pillClass : '');
    setText(textMemo, els.status, text);
    if (els.status.className !== cls) els.status.className = cls;
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
    setNeedle(cents);
    setText(textMemo, els.note, noteLetter(reading.detectedNote));
    setText(textMemo, els.noteOctave, chromatic ? String(reading.detectedOctave) : '');
    setText(textMemo, els.freq, reading.freq.toFixed(1) + ' Hz');

    if (!chromatic) {
      if (reading.zone === 'wrong-octave') {
        setNeedle(0);
        setInTuneHighlight(false);
        setPill('CHECK THE PEGS', 'pill-neutral');
        setText(textMemo, els.hint, '');
        return;
      }
      if (Math.abs(cents) <= DETECT.IN_TUNE_CENTS) {
        setPill(TUNER_COPY.inTune, 'pill-tuned');
        setInTuneHighlight(true);
        els.readout.classList.add('in-tune');
        setText(textMemo, els.hint, '');
      } else {
        const dir = cents < 0 ? TUNER_COPY.tooFlat : TUNER_COPY.tooSharp;
        setPill(dir + ' \u00B7 ' + formatCents(cents, reading.locked) + '\u00A2', 'pill-off');
        setInTuneHighlight(false);
        els.readout.classList.add('off-pitch');
        setText(textMemo, els.hint, cents < 0 ? 'TIGHTEN \u2191' : 'LOOSEN \u2193');
      }
      applySafetyClasses(reading.color);
    } else {
      setInTuneHighlight(false);
      updateRail(reading.freq);
      const signed = (cents >= 0 ? '+' : '-') + formatCents(cents, reading.locked);
      setPill(reading.nearestName + ' \u00B7 ' + signed + '\u00A2', 'pill-neutral');
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
    els.readout.addEventListener('click', () => callbacks.onMicToggle());
    if (els.micCta) els.micCta.addEventListener('click', () => callbacks.onMicToggle());
    Array.from(els.instrumentRow.querySelectorAll('[data-instrument]')).forEach((btn) => {
      btn.addEventListener('click', () => callbacks.onInstrumentChange(btn.getAttribute('data-instrument')));
    });
    els.presetBtn.addEventListener('click', showTuningView);
    els.modeBtn.addEventListener('click', () => toggleMenu('mode', renderModeMenu, els.modeBtn));
    if (els.stringsBtn) els.stringsBtn.addEventListener('click', () => toggleMenu('strings', renderStringsMenu, els.stringsBtn));
    if (els.materialBtn) els.materialBtn.addEventListener('click', () => toggleMenu('material', renderMaterialMenu, els.materialBtn));
    els.instrumentBtn.addEventListener('click', () => toggleMenu('instrument', renderInstrumentMenu, els.instrumentBtn));
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
      if (e.target.closest('#tunerModeBtn, #tunerStringsBtn, #tunerMaterialBtn, #tunerInstrumentBtn')) return;
      closeMenus(true);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (openMenuName) {
          closeMenus(true);
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
    toast: showToast
  };
}

