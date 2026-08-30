/**
 * KINS THEORY MAIN ORCHESTRATOR
 * Coordinates tab switching, search filtering, Circle of Fifths,
 * fretboard engine, drum visualizer, and Astro lifecycle hooks.
 */
import { initTheme, toggleTheme, getCurrentTheme } from '../themeController.js';
import { GuitarFretboardController, CHORDS_DATA } from './fretboardController';
import { DrumVisualizerController } from './drumVisualizerController';
import { playGuitarPluck, teardownTheoryAudio } from './theoryAudio';

let guitarController: GuitarFretboardController | null = null;
let drumController: DrumVisualizerController | null = null;

import { circleOfFifthsData as CIRCLE_DATA } from '../../../settings/theory.config';

export function initTheory(): void {
  teardownTheory();

  initTheme();

  guitarController = new GuitarFretboardController();
  guitarController.init();

  drumController = new DrumVisualizerController();
  drumController.init();

  const guitarTabBtn = document.getElementById('guitarTabBtn');
  const drumsTabBtn = document.getElementById('drumsTabBtn');
  const guitarPanel = document.getElementById('guitarPanel');
  const drumsPanel = document.getElementById('drumsPanel');
  const guitarChipsRow = document.getElementById('guitarChipsRow');
  const drumsChipsRow = document.getElementById('drumsChipsRow');

  const topbar = document.getElementById('theoryTopbar');
  const searchContainer = document.getElementById('theorySearchContainer');
  const searchToggleBtn = document.getElementById('theorySearchToggleBtn');
  const searchInput = document.getElementById('theorySearchInput') as HTMLInputElement | null;
  const emptyState = document.getElementById('theoryEmptyState');
  const emptyDesc = document.getElementById('theoryEmptyDesc');
  const resetSearchBtn = document.getElementById('theoryResetSearchBtn');

  let activeInstrument = 'guitar';
  let isSearchOpen = false;

  function setInstrument(inst: string) {
    activeInstrument = inst;
    if (inst === 'guitar') {
      guitarTabBtn?.classList.add('active');
      guitarTabBtn?.setAttribute('aria-selected', 'true');
      drumsTabBtn?.classList.remove('active');
      drumsTabBtn?.setAttribute('aria-selected', 'false');

      if (guitarPanel) {
        guitarPanel.hidden = false;
        guitarPanel.classList.add('active');
      }
      if (drumsPanel) {
        drumsPanel.hidden = true;
        drumsPanel.classList.remove('active');
      }

      if (guitarChipsRow) guitarChipsRow.hidden = false;
      if (drumsChipsRow) drumsChipsRow.hidden = true;
    } else {
      drumsTabBtn?.classList.add('active');
      drumsTabBtn?.setAttribute('aria-selected', 'true');
      guitarTabBtn?.classList.remove('active');
      guitarTabBtn?.setAttribute('aria-selected', 'false');

      if (drumsPanel) {
        drumsPanel.hidden = false;
        drumsPanel.classList.add('active');
      }
      if (guitarPanel) {
        guitarPanel.hidden = true;
        guitarPanel.classList.remove('active');
      }

      if (drumsChipsRow) drumsChipsRow.hidden = false;
      if (guitarChipsRow) guitarChipsRow.hidden = true;
    }

    resetCategoryChips();
    applySearchFilter();
  }

  if (guitarTabBtn) guitarTabBtn.addEventListener('click', () => setInstrument('guitar'));
  if (drumsTabBtn) drumsTabBtn.addEventListener('click', () => setInstrument('drums'));

  function handleChipClick(e: MouseEvent) {
    const chipBtn = (e.target as HTMLElement).closest('.theory-chip-btn');
    if (!chipBtn) return;
    const parentRow = chipBtn.closest('.chip-scroll-row');
    const wasActive = chipBtn.classList.contains('active');

    if (parentRow) {
      parentRow.querySelectorAll('.theory-chip-btn').forEach((b) => b.classList.remove('active'));
    }

    const currentPanel = activeInstrument === 'guitar' ? guitarPanel : drumsPanel;
    if (!currentPanel) return;
    const cards = currentPanel.querySelectorAll('.theory-category-card');

    if (wasActive) {
      cards.forEach((card) => ((card as HTMLElement).hidden = false));
      return;
    }

    chipBtn.classList.add('active');
    const filter = chipBtn.getAttribute('data-filter');

    cards.forEach((card) => {
      const cardChip = card.getAttribute('data-chip');
      if (!filter || cardChip === filter) {
        (card as HTMLElement).hidden = false;
        (card as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        (card as HTMLElement).hidden = true;
      }
    });
  }

  if (guitarChipsRow) guitarChipsRow.addEventListener('click', handleChipClick);
  if (drumsChipsRow) drumsChipsRow.addEventListener('click', handleChipClick);

  function resetCategoryChips() {
    const activeRow = activeInstrument === 'guitar' ? guitarChipsRow : drumsChipsRow;
    if (activeRow) {
      activeRow.querySelectorAll('.theory-chip-btn').forEach((b) => b.classList.remove('active'));
    }
    const currentPanel = activeInstrument === 'guitar' ? guitarPanel : drumsPanel;
    if (currentPanel) {
      currentPanel.querySelectorAll('.theory-category-card').forEach((c) => ((c as HTMLElement).hidden = false));
    }
  }

  document.querySelectorAll('.section-subfilters-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.subfilter-btn');
      if (!btn) return;
      row.querySelectorAll('.subfilter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.getAttribute('data-type');
      const listId = row.getAttribute('data-target-list');
      if (!listId) return;
      const list = document.getElementById(listId);
      if (!list) return;

      list.querySelectorAll('.theory-item-row, .theory-chord-card').forEach((item) => {
        const itemType = item.getAttribute('data-subfilter-type');
        if (type === 'all' || itemType === type) {
          (item as HTMLElement).hidden = false;
        } else {
          (item as HTMLElement).hidden = true;
        }
      });
    });
  });

  function openSearch() {
    if (isSearchOpen) return;
    isSearchOpen = true;
    if (topbar) topbar.classList.add('is-search-active');
    if (searchContainer) searchContainer.classList.add('is-expanded');
    if (searchToggleBtn) {
      searchToggleBtn.setAttribute('aria-expanded', 'true');
      searchToggleBtn.setAttribute('aria-label', 'Close search');
    }
    setTimeout(() => searchInput?.focus(), 50);
  }

  function closeSearch() {
    if (!isSearchOpen) return;
    isSearchOpen = false;
    if (topbar) topbar.classList.remove('is-search-active');
    if (searchContainer) searchContainer.classList.remove('is-expanded');
    if (searchToggleBtn) {
      searchToggleBtn.setAttribute('aria-expanded', 'false');
      searchToggleBtn.setAttribute('aria-label', 'Open search');
    }
    if (searchInput) searchInput.value = '';
    applySearchFilter();
  }

  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => (isSearchOpen ? closeSearch() : openSearch()));
  }
  if (resetSearchBtn) resetSearchBtn.addEventListener('click', closeSearch);

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !isSearchOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape' && isSearchOpen) {
      closeSearch();
    }
  });

  function applySearchFilter() {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLowerCase();
    const currentPanel = activeInstrument === 'guitar' ? guitarPanel : drumsPanel;
    if (!currentPanel) return;
    const categoryCards = currentPanel.querySelectorAll('.theory-category-card');

    let visibleCount = 0;

    if (!query) {
      categoryCards.forEach((card) => {
        (card as HTMLElement).hidden = false;
        card.querySelectorAll('.theory-item-row, .theory-chord-card').forEach((r) => ((r as HTMLElement).hidden = false));
      });
      if (emptyState) emptyState.hidden = true;
      return;
    }

    categoryCards.forEach((card) => {
      const title = card.querySelector('.category-title')?.textContent?.toLowerCase() || '';
      const badge = card.querySelector('.category-badge')?.textContent?.toLowerCase() || '';
      const items = card.querySelectorAll('.theory-item-row, .theory-chord-card');
      let cardHasMatch = false;

      const catMatches = title.includes(query) || badge.includes(query);

      items.forEach((item) => {
        const target = item.getAttribute('data-search-target')?.toLowerCase() || '';
        if (catMatches || target.includes(query)) {
          (item as HTMLElement).hidden = false;
          cardHasMatch = true;
        } else {
          (item as HTMLElement).hidden = true;
        }
      });

      if (cardHasMatch || catMatches) {
        (card as HTMLElement).hidden = false;
        visibleCount++;
      } else {
        (card as HTMLElement).hidden = true;
      }
    });

    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.hidden = false;
        if (emptyDesc) emptyDesc.textContent = `No ${activeInstrument} theory topics match "${query}".`;
      } else {
        emptyState.hidden = true;
      }
    }
  }

  if (searchInput) searchInput.addEventListener('input', applySearchFilter);

  // Circle of Fifths
  const circleGrid = document.getElementById('circleKeysGrid');
  const circleDetailKey = document.getElementById('circleDetailKey');
  const circleDetailMinor = document.getElementById('circleDetailMinor');
  const circleDetailAcc = document.getElementById('circleDetailAcc');

  if (circleGrid) {
    circleGrid.innerHTML = '';
    CIRCLE_DATA.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = `circle-key-btn ${idx === 0 ? 'active' : ''} brutal-press`;
      btn.innerHTML = `<span class="circle-key-name">${item.key}</span><span class="circle-minor-name">${item.minor}</span>`;
      btn.addEventListener('click', () => {
        circleGrid.querySelectorAll('.circle-key-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (circleDetailKey) circleDetailKey.textContent = `Key of ${item.key} Major`;
        if (circleDetailMinor) circleDetailMinor.textContent = `Relative Minor: ${item.minor}`;
        if (circleDetailAcc) circleDetailAcc.textContent = `Accidentals: ${item.acc}`;
      });
      circleGrid.appendChild(btn);
    });
  }

  // Global delegation for dynamic triggers
  document.addEventListener('click', async (e) => {
    const copyBtn = (e.target as HTMLElement).closest('[data-copy-text]');
    if (copyBtn) {
      const textToCopy = copyBtn.getAttribute('data-copy-text');
      if (textToCopy) {
        try {
          await navigator.clipboard.writeText(textToCopy);
          const { showToast } = await import('../toast.js');
          showToast('✓ Copied to clipboard!', 'success');
        } catch {
          const { showToast } = await import('../toast.js');
          showToast('✓ Copied!', 'info');
        }
      }
      return;
    }

    const playChordTrigger = (e.target as HTMLElement).closest('[data-play-chord]');
    if (playChordTrigger) {
      const loadBtn = (e.target as HTMLElement).closest('[data-load-chord]');
      if (!loadBtn && !copyBtn) {
        const chordId = playChordTrigger.getAttribute('data-play-chord');
        if (chordId && CHORDS_DATA[chordId] && guitarController) {
          guitarController.playChordStrum(chordId);
        }
        return;
      }
    }

    const scaleBtn = (e.target as HTMLElement).closest('[data-load-scale]');
    if (scaleBtn && guitarController) {
      const id = scaleBtn.getAttribute('data-load-scale');
      if (id) guitarController.loadScale(id);
      return;
    }

    const chordBtn = (e.target as HTMLElement).closest('[data-load-chord]');
    if (chordBtn && guitarController) {
      const id = chordBtn.getAttribute('data-load-chord');
      if (id) guitarController.loadChord(id);
      return;
    }

    const cagedBtn = (e.target as HTMLElement).closest('[data-load-caged]');
    if (cagedBtn && guitarController) {
      const id = cagedBtn.getAttribute('data-load-caged');
      if (id) guitarController.loadCaged(id);
      return;
    }

    const grooveBtn = (e.target as HTMLElement).closest('[data-load-groove]');
    if (grooveBtn && drumController) {
      const id = grooveBtn.getAttribute('data-load-groove');
      if (id) drumController.loadGroove(id);
      return;
    }

    const rudimentBtn = (e.target as HTMLElement).closest('[data-load-rudiment]');
    if (rudimentBtn && drumController) {
      const id = rudimentBtn.getAttribute('data-load-rudiment');
      if (id) drumController.loadRudiment(id);
      return;
    }

    const tuningBtn = (e.target as HTMLElement).closest('[data-play-tuning]');
    if (tuningBtn) {
      try {
        const pitches = JSON.parse(tuningBtn.getAttribute('data-play-tuning') || '[]');
        pitches.forEach((freq: number, i: number) => {
          playGuitarPluck(freq, 1.8, i * 0.28);
        });
      } catch {}
    }
  });
}

export function teardownTheory(): void {
  if (drumController) {
    drumController.teardown();
    drumController = null;
  }
  guitarController = null;
  teardownTheoryAudio();
}

document.addEventListener('astro:page-load', initTheory);
document.addEventListener('astro:before-swap', teardownTheory);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheory);
} else {
  initTheory();
}
