import { KINS_COVERS_DATA } from '../data/coversData.js';
import { openCoverVideoModal } from './videoModalController.js';
import { handleSongRequestSubmit } from './requestSongController.js';
import { getITunesTrackData, loadAlbumArt, prefetchTrackArtwork } from './inspirationVault.js';

let activeCategory = 'all';
let searchDebounceTimeout = null;
let artistFetchDebounceTimeout = null;

const ARTIST_SUGGESTIONS_CACHE = {};

// Live iTunes API fetch for song title -> real original artist suggestions
export async function fetchLiveArtistSuggestions(songTitle) {
  if (!songTitle || songTitle.trim().length < 2) return [];

  const cleanTitle = songTitle.replace(/[!?"\']/g, '').trim().toLowerCase();
  if (ARTIST_SUGGESTIONS_CACHE[cleanTitle]) {
    return ARTIST_SUGGESTIONS_CACHE[cleanTitle];
  }

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=song&limit=8`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const uniqueArtists = [];
      data.results.forEach(item => {
        if (item.artistName && !uniqueArtists.includes(item.artistName)) {
          uniqueArtists.push(item.artistName);
        }
      });
      ARTIST_SUGGESTIONS_CACHE[cleanTitle] = uniqueArtists;
      return uniqueArtists;
    }
  } catch (err) {
    console.warn('Error fetching live artist suggestions:', err);
  }
  const fallback = [];
  ARTIST_SUGGESTIONS_CACHE[cleanTitle] = fallback;
  return fallback;
}

function renderCoverCard(cover) {
  const card = document.createElement('div');
  card.className = 'cover-result-card';
  card.setAttribute('data-id', cover.id);
  
  const hasArtwork = !!(cover.artworkUrl || cover.coverUrl);
  const thumbSrc = hasArtwork ? (cover.artworkUrl || cover.coverUrl) : cover.thumbnail;
  
  card.innerHTML = `
    <div class="cover-card-thumb-box">
      <img src="${thumbSrc}" alt="${cover.title} thumbnail" class="cover-card-thumb-img" loading="lazy" decoding="async">
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

  if (!hasArtwork && cover.originalArtist && cover.title) {
    const imgEl = card.querySelector('.cover-card-thumb-img');
    getITunesTrackData(cover.originalArtist, cover.title).then(meta => {
      if (meta && meta.artworkUrl) {
        cover.artworkUrl = meta.artworkUrl;
        cover.coverUrl = meta.artworkUrl;
        loadAlbumArt(imgEl, meta.artworkUrl, meta.rawArtworkUrl);
      }
    });
  }

  card.addEventListener('click', () => {
    openCoverVideoModal(cover);
  });

  return card;
}

function renderRequestSongCard(rawQuery = '', isExplicitButton = false) {
  const container = document.createElement('div');
  container.className = 'request-song-card-container';
  
  const displayTitle = rawQuery.trim() ? rawQuery.trim() : '';

  container.innerHTML = `
    <div class="cant-find-card">
      <div class="cant-find-header">
        <div class="cant-find-icon-badge">
          <i class="fa-solid fa-music"></i>
        </div>
        <div class="cant-find-header-text">
          <h4 class="cant-find-title">Can't Find Your Song?</h4>
          <p class="cant-find-sub">${displayTitle ? `We haven't covered "${displayTitle}" yet — request it below!` : 'Tell Kins which song to cover next!'}</p>
        </div>
      </div>

      <form class="request-song-form" id="requestSongForm">
        <div class="form-group">
          <label for="reqSongTitle">Song Title <span class="req-star">*</span></label>
          <input type="text" id="reqSongTitle" value="${displayTitle}" placeholder="e.g. Wonderwall" required>
        </div>

        <div class="form-group">
          <label for="reqArtist">Original Artist <span class="req-star">*</span></label>
          <input type="text" id="reqArtist" value="" placeholder="Fetching most likely artist..." required>
          
          <div class="artist-suggestions-box" id="artistSuggestionsBox">
            <span class="suggestions-label"><i class="fa-solid fa-wand-magic-sparkles" style="font-size: 0.65rem; opacity: 0.7;"></i> Artist Match</span>
            <div class="artist-pills-scroll-row" id="artistPillsScrollRow">
              <span class="suggestions-loading-text"><i class="fa-solid fa-compact-disc fa-spin"></i> Searching artist database...</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="reqReason">Why should Kins cover this? <span class="opt-label">(optional)</span></label>
          <textarea id="reqReason" rows="2" placeholder="e.g. Your style would sound amazing on this!"></textarea>
        </div>

        <div class="form-group">
          <label for="reqEmail">Email Address <span class="opt-label">(optional, for release update)</span></label>
          <input type="email" id="reqEmail" placeholder="fan@example.com">
        </div>

        <div class="request-form-actions">
          <button type="submit" class="submit-request-btn">
            <i class="fa-solid fa-paper-plane"></i>
            <span>Submit Cover Request</span>
          </button>
          <button type="button" class="cancel-request-btn" id="cancelRequestBtn">
            <i class="fa-solid fa-arrow-left"></i> Back to Search
          </button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector('#requestSongForm');
  const songTitleInput = container.querySelector('#reqSongTitle');
  const artistInput = container.querySelector('#reqArtist');
  const pillsContainer = container.querySelector('#artistPillsScrollRow');

  function updatePillsUI(artists) {
    if (!pillsContainer) return;

    if (!artists || artists.length === 0) {
      pillsContainer.innerHTML = `<span class="suggestions-loading-text">Type a song title above to auto-detect artists</span>`;
      return;
    }

    if (artistInput && (!artistInput.value || artistInput.value === 'Fetching most likely artist...')) {
      artistInput.value = artists[0];
    }

    pillsContainer.innerHTML = artists.map((art, idx) => `
      <button type="button" class="artist-suggestion-pill ${idx === 0 ? 'active' : ''}" data-artist="${art}">
        ${idx === 0 ? '★ ' : '+ '}${art}
      </button>
    `).join('');

    const pills = pillsContainer.querySelectorAll('.artist-suggestion-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const selectedArtist = pill.getAttribute('data-artist') || '';
        if (artistInput) {
          artistInput.value = selectedArtist;
        }
      });
    });
  }

  if (displayTitle) {
    fetchLiveArtistSuggestions(displayTitle).then(artists => updatePillsUI(artists));
  } else {
    updatePillsUI([]);
  }

  if (songTitleInput && artistInput && pillsContainer) {
    songTitleInput.addEventListener('input', () => {
      clearTimeout(artistFetchDebounceTimeout);
      const currentTitle = songTitleInput.value.trim();

      if (!currentTitle) {
        artistInput.value = '';
        updatePillsUI([]);
        return;
      }

      pillsContainer.innerHTML = `<span class="suggestions-loading-text"><i class="fa-solid fa-compact-disc fa-spin"></i> Searching artist database...</span>`;

      artistFetchDebounceTimeout = setTimeout(() => {
        fetchLiveArtistSuggestions(currentTitle).then(artists => {
          if (artists.length > 0) {
            artistInput.value = artists[0];
          }
          updatePillsUI(artists);
        });
      }, 300);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => handleSongRequestSubmit(e, songTitleInput?.value || displayTitle));
  }

  const cancelBtn = container.querySelector('#cancelRequestBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const overlayInput = document.getElementById('overlaySearchInput');
      if (overlayInput) overlayInput.value = '';
      filterAndRenderCovers();
    });
  }

  return container;
}

export function filterAndRenderCovers() {
  const overlayInput = document.getElementById('overlaySearchInput');
  const resultsContainer = document.getElementById('coversResultsList');
  const sectionTitleEl = document.getElementById('coversSectionTitle');

  if (!resultsContainer) return;

  const rawQuery = (overlayInput?.value || '').trim();
  const query = rawQuery.toLowerCase();

  let filtered = KINS_COVERS_DATA;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(item => item.category === activeCategory);
  }

  if (query) {
    if (sectionTitleEl) sectionTitleEl.textContent = `Search Results for "${rawQuery}"`;
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.originalArtist.toLowerCase().includes(query)
    );
  } else {
    if (sectionTitleEl) sectionTitleEl.textContent = activeCategory === 'all' ? 'Latest Releases' : `${activeCategory.toUpperCase()} Covers`;
  }

  resultsContainer.innerHTML = '';

  if (filtered.length === 0) {
    resultsContainer.appendChild(renderRequestSongCard(rawQuery));
    return;
  }

  prefetchTrackArtwork(filtered.slice(0, 10));

  filtered.forEach(cover => {
    resultsContainer.appendChild(renderCoverCard(cover));
  });

  const requestTriggerBox = document.createElement('div');
  requestTriggerBox.className = 'bottom-request-trigger-box';
  requestTriggerBox.innerHTML = `
    <button class="bottom-request-pill-btn" id="bottomRequestPillBtn">
      <i class="fa-solid fa-plus-circle"></i>
      <span>Don't see your favorite song? Request a Cover</span>
    </button>
  `;

  requestTriggerBox.querySelector('#bottomRequestPillBtn')?.addEventListener('click', () => {
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(renderRequestSongCard(rawQuery, true));
    if (sectionTitleEl) sectionTitleEl.textContent = 'Request a Cover Song';
  });

  resultsContainer.appendChild(requestTriggerBox);
}

export function initCoversSearchEngine() {
  const topNav = document.querySelector('.top-nav');
  const searchPillBtn = document.getElementById('headerSearchPillBtn');
  const searchOverlay = document.getElementById('coversSearchOverlay');
  const closeSearchOverlayBtn = document.getElementById('closeSearchOverlayBtn');
  const overlayInput = document.getElementById('overlaySearchInput');
  const categoryBtns = document.querySelectorAll('.cover-category-pill');

  function openOverlay() {
    if (!searchPillBtn || !searchOverlay) return;

    const rect = searchPillBtn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    searchOverlay.style.transformOrigin = `${originX}px ${originY}px`;
    searchOverlay.classList.add('active');
    if (topNav) topNav.classList.add('search-active');
    document.body.classList.add('modal-open');

    if (overlayInput) {
      setTimeout(() => overlayInput.focus(), 150);
    }
    filterAndRenderCovers();
  }

  function closeOverlay() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('active');
    if (topNav) topNav.classList.remove('search-active');
    document.body.classList.remove('modal-open');
  }

  if (searchPillBtn) {
    searchPillBtn.addEventListener('click', openOverlay);
  }

  if (closeSearchOverlayBtn) {
    closeSearchOverlayBtn.addEventListener('click', closeOverlay);
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
