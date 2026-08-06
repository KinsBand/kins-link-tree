import { KINS_COVERS_DATA } from './coversData.js';
import { openCoverVideoModal } from './videoModalController.js';

let activeCategory = 'all';
let searchDebounceTimeout = null;

function renderCoverCard(cover) {
  const card = document.createElement('div');
  card.className = 'cover-result-card';
  card.setAttribute('data-id', cover.id);
  card.innerHTML = `
    <div class="cover-card-thumb-box">
      <img src="${cover.thumbnail}" alt="${cover.title} thumbnail" class="cover-card-thumb-img">
      <div class="thumb-play-overlay"><i class="fa-solid fa-play"></i></div>
    </div>
    <div class="cover-card-info">
      <h4 class="cover-card-title">${cover.title}</h4>
      <p class="cover-card-sub">Cover of <span class="artist-highlight">${cover.originalArtist}</span></p>
    </div>
    <button class="cover-card-action-btn" aria-label="Play ${cover.title}">
      <i class="${cover.platformIcon || 'fa-solid fa-play'}"></i>
    </button>
  `;

  card.addEventListener('click', () => {
    openCoverVideoModal(cover);
  });

  return card;
}

export function filterAndRenderCovers() {
  const input = document.getElementById('headerSearchInput');
  const overlayInput = document.getElementById('overlaySearchInput');
  const resultsContainer = document.getElementById('coversResultsList');
  const sectionTitleEl = document.getElementById('coversSectionTitle');

  if (!resultsContainer) return;

  const query = (overlayInput?.value || input?.value || '').trim().toLowerCase();

  let filtered = KINS_COVERS_DATA;

  // Filter by category pill if not 'all'
  if (activeCategory !== 'all') {
    filtered = filtered.filter(item => item.category === activeCategory);
  }

  // Filter by search query if non-empty
  if (query) {
    if (sectionTitleEl) sectionTitleEl.textContent = `Search Results for "${query}"`;
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.originalArtist.toLowerCase().includes(query)
    );
  } else {
    if (sectionTitleEl) sectionTitleEl.textContent = activeCategory === 'all' ? 'Latest Releases' : `${activeCategory.toUpperCase()} Covers`;
  }

  resultsContainer.innerHTML = '';

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-covers-found">
        <i class="fa-solid fa-compact-disc fa-spin"></i>
        <p>No cover videos found matching your search.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(cover => {
    resultsContainer.appendChild(renderCoverCard(cover));
  });
}

export function initCoversSearchEngine() {
  const searchPillBtn = document.getElementById('headerSearchPillBtn');
  const searchOverlay = document.getElementById('coversSearchOverlay');
  const closeSearchOverlayBtn = document.getElementById('closeSearchOverlayBtn');
  const overlayInput = document.getElementById('overlaySearchInput');
  const categoryBtns = document.querySelectorAll('.cover-category-pill');

  if (searchPillBtn && searchOverlay) {
    searchPillBtn.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      document.body.classList.add('modal-open');
      if (overlayInput) {
        setTimeout(() => overlayInput.focus(), 200);
      }
      filterAndRenderCovers();
    });
  }

  if (closeSearchOverlayBtn && searchOverlay) {
    closeSearchOverlayBtn.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
      document.body.classList.remove('modal-open');
    });
  }

  if (overlayInput) {
    overlayInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        filterAndRenderCovers();
      }, 150);
    });
  }

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category') || 'all';
      filterAndRenderCovers();
    });
  });
}
