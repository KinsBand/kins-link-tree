import { openCoverVideoModal } from './videoModalController.js';
import { handleSongRequestSubmit, openRequestSongModal } from './requestSongController.js';
import { getITunesTrackData, loadAlbumArt, prefetchTrackArtwork } from './inspirationVault.js';
import { getSubscriptionState, getSubscriberEmail } from './subscribeController.js';

import { KINS_COVERS_DATA, KINS_CURRENTLY_LEARNING } from '../../settings/covers.config';
export { KINS_COVERS_DATA, KINS_CURRENTLY_LEARNING };

let activeCategory = 'all';
let searchDebounceTimeout = null;
let artistFetchDebounceTimeout = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ARTIST_SUGGESTIONS_CACHE = {};

// Live iTunes API fetch for song title -> real original artist suggestions
export async function fetchLiveArtistSuggestions(songTitle) {
  if (!songTitle || songTitle.trim().length < 2) return [];

  const cleanTitle = songTitle.replace(/[!?"\']/g, '').trim().toLowerCase();
  if (ARTIST_SUGGESTIONS_CACHE[cleanTitle]) {
    return ARTIST_SUGGESTIONS_CACHE[cleanTitle];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&media=music&entity=song&limit=6&country=US`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
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

  return [];
}

function renderCoverCard(cover) {
  const card = document.createElement('div');
  card.className = 'cover-result-card brutal-press';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Play cover of ${cover.title} by ${cover.originalArtist}`);

  card.innerHTML = `
    <div class="cover-card-thumb-box">
      <img src="${escapeHtml(cover.thumbnail)}" alt="${escapeHtml(cover.title)}" class="cover-card-thumb-img" width="64" height="48" loading="lazy" decoding="async">
      <div class="thumb-play-overlay">
        <i class="fa-solid fa-play"></i>
      </div>
    </div>
    <div class="cover-card-info">
      <div class="cover-card-meta-row">
        <span class="cover-card-category-badge">${escapeHtml((cover.categoryLabel || cover.category).toUpperCase())}</span>
      </div>
      <h4 class="cover-card-title">${escapeHtml(cover.title)}</h4>
      <p class="cover-card-sub">Cover of <span class="artist-highlight">${escapeHtml(cover.originalArtist)}</span></p>
    </div>
    <div class="cover-card-action-btn" aria-hidden="true">
      <i class="${cover.platformIcon || 'fa-solid fa-play'}"></i>
    </div>
  `;

  card.addEventListener('click', () => {
    openCoverVideoModal(cover);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCoverVideoModal(cover);
    }
  });

  return card;
}

function renderRequestSongCard(rawQuery = '', isExplicitButton = false) {
  const container = document.createElement('div');
  container.className = 'request-song-card-container';
  
  const displayTitle = rawQuery.trim() ? rawQuery.trim() : '';
  const isSubscribed = getSubscriptionState();
  const savedEmail = getSubscriberEmail();

  const emailSectionHTML = isSubscribed ? `
    <div class="form-group request-email-group subscribed-state">
      <div class="subscribed-email-notice-badge">
        <div class="sub-badge-left">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div class="sub-badge-content">
          <span class="sub-badge-status">Subscribed Updates Active</span>
          <p class="sub-badge-text">You'll receive release updates via your email${savedEmail ? ` (<strong>${escapeHtml(savedEmail)}</strong>)` : ''}.</p>
        </div>
        <input type="hidden" id="reqEmail" value="${escapeHtml(savedEmail || 'Subscribed Fan')}">
      </div>
    </div>
  ` : `
    <div class="form-group request-email-group unsubscribed-state">
      <label for="reqEmail">Email Address <span class="opt-label">(optional, for release update)</span></label>
      <input type="email" id="reqEmail" placeholder="fan@example.com">
    </div>
  `;

  const safeDisplayTitle = escapeHtml(displayTitle);

  container.innerHTML = `
    <div class="cant-find-card">
      <div class="cant-find-header">
        <div class="cant-find-icon-badge">
          <i class="fa-solid fa-music"></i>
        </div>
        <div class="cant-find-header-text">
          <h4 class="cant-find-title">Can't Find Your Song?</h4>
          <p class="cant-find-sub">${displayTitle ? `We haven't covered "${safeDisplayTitle}" yet — request it below!` : 'Tell Kins which song to cover next!'}</p>
        </div>
      </div>

      <form class="request-song-form" id="requestSongForm">
        <div class="form-group">
          <label for="reqSongTitle">Song Title <span class="req-star">*</span></label>
          <input type="text" id="reqSongTitle" value="${safeDisplayTitle}" placeholder="e.g. Wonderwall" required>
        </div>

        <div class="form-group">
          <label for="reqArtist">Original Artist <span class="req-star">*</span></label>
          <input type="text" id="reqArtist" value="" placeholder="Artist name..." required>
          
          <div class="artist-suggestions-box" id="artistSuggestionsBox">
            <div class="artist-pills-scroll-row" id="artistPillsScrollRow"></div>
          </div>
        </div>

        <div class="form-group">
          <label for="reqReason">Why should Kins cover this? <span class="opt-label">(optional)</span></label>
          <textarea id="reqReason" rows="2" placeholder="e.g. Your style would sound amazing on this!"></textarea>
        </div>

        ${emailSectionHTML}

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
      pillsContainer.innerHTML = '';
      return;
    }

    if (artistInput && (!artistInput.value || artistInput.value === 'Fetching most likely artist...')) {
      artistInput.value = artists[0];
    }

    pillsContainer.innerHTML = artists.map((art, idx) => `
      <button type="button" class="artist-suggestion-pill ${idx === 0 ? 'active' : ''}" data-artist="${escapeHtml(art)}">
        ${idx === 0 ? '★ ' : '+ '}${escapeHtml(art)}
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

      artistFetchDebounceTimeout = setTimeout(() => {
        fetchLiveArtistSuggestions(currentTitle).then(artists => {
          if (artists.length > 0) {
            artistInput.value = artists[0];
          }
          updatePillsUI(artists);
        });
      }, 250);
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



function renderEmptySearchCard(rawQuery = '') {
  const container = document.createElement('div');
  container.className = 'empty-covers-search-container';
  const safeQuery = escapeHtml(rawQuery.trim());

  container.innerHTML = `
    <div class="empty-search-card">
      <div class="empty-search-icon">
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>
      <h4 class="empty-search-title">${safeQuery ? `No covers found for "${safeQuery}"` : 'No released covers yet'}</h4>
      <p class="empty-search-sub">
        ${safeQuery 
          ? `We haven't recorded "${safeQuery}" yet — request it below and Kins will add it to the rehearsal wishlist!` 
          : 'Kins hasn\'t released any official covers yet. Check out what we\'re learning above or request a cover below!'}
      </p>
      <button type="button" class="empty-request-trigger-btn brutal-press" id="emptyRequestTriggerBtn">
        <i class="fa-solid fa-microphone-lines"></i>
        <span>Request a Cover!</span>
      </button>
    </div>
  `;

  container.querySelector('#emptyRequestTriggerBtn')?.addEventListener('click', () => {
    openRequestSongModal(rawQuery.trim());
  });

  return container;
}

function renderLearningSpotlightCard(learningData) {
  const container = document.getElementById('coversLearningSection');
  if (!container || !learningData) return;

  const songsterrQuery = encodeURIComponent(`${learningData.originalArtist} ${learningData.title}`);
  const songsterrUrl = `https://www.songsterr.com/a/wa/search?pattern=${songsterrQuery}`;

  container.innerHTML = `
    <div class="learning-card" data-track-container="cover_learning_card">
      <div class="learning-header-bar">
        <div class="learning-badge">
          <span class="learning-pulse-dot" aria-hidden="true"></span>
          <span>CURRENTLY LEARNING</span>
        </div>
      </div>

      <div class="learning-hero-thumb">
        <img src="${escapeHtml(learningData.thumbnail || '/covers/just-like-heaven.jpg')}" alt="${escapeHtml(learningData.title)}" onerror="this.onerror=null;this.src='/covers/just-like-heaven.jpg'" loading="lazy" />
      </div>

      <div class="learning-info-block">
        <h4 class="learning-song-title">${escapeHtml(learningData.title)}</h4>
        <p class="learning-artist-line">Original by <strong>${escapeHtml(learningData.originalArtist)}</strong></p>
      </div>

      <div class="learning-actions-grid">
        <a href="${songsterrUrl}" target="_blank" rel="noopener noreferrer" class="learning-action-btn learning-tabs-btn brutal-press" id="learningSongsterrBtn" aria-label="Learn tabs on Songsterr" data-track="learning:songsterr">
          <i class="fa-solid fa-guitar" aria-hidden="true"></i>
          <span>Tabs ↗</span>
        </a>
      </div>
    </div>
  `;

  const songsterrLink = container.querySelector('#learningSongsterrBtn');
  songsterrLink?.addEventListener('click', () => {
    import('./toast.js').then(({ showToast }) => {
      showToast(`🎸 Opening Songsterr tabs for "${learningData.title}"...`);
    });
  });
}

export function filterAndRenderCovers() {
  const overlayInput = document.getElementById('overlaySearchInput');
  const resultsContainer = document.getElementById('coversResultsList');
  const sectionTitleEl = document.getElementById('coversSectionTitle');
  const learningSection = document.getElementById('coversLearningSection');

  if (!resultsContainer) return;

  const rawQuery = (overlayInput?.value || '').trim();
  const query = rawQuery.toLowerCase();

  // Show Learning Spotlight on zero-state; hide during active search
  if (learningSection) {
    if (query) {
      learningSection.classList.add('hidden');
    } else {
      learningSection.classList.remove('hidden');
    }
  }

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
    if (sectionTitleEl) sectionTitleEl.textContent = activeCategory === 'all' ? 'Latest Covers' : `${activeCategory.toUpperCase()} Covers`;
  }

  resultsContainer.innerHTML = '';
  const scrollBody = document.getElementById('searchOverlayBody') || document.querySelector('.search-overlay-body');
  if (scrollBody) {
    scrollBody.scrollTop = 0;
  }

  if (filtered.length === 0) {
    resultsContainer.appendChild(renderEmptySearchCard(rawQuery));
    return;
  }

  prefetchTrackArtwork(filtered.slice(0, 10));

  filtered.forEach(cover => {
    resultsContainer.appendChild(renderCoverCard(cover));
  });

  const requestTriggerBox = document.createElement('div');
  requestTriggerBox.className = 'bottom-request-trigger-box';
  requestTriggerBox.innerHTML = `
    <button class="bottom-request-pill-btn brutal-press" id="bottomRequestPillBtn">
      <i class="fa-solid fa-microphone-lines"></i>
      <span>Request a Cover!</span>
    </button>
  `;

  requestTriggerBox.querySelector('#bottomRequestPillBtn')?.addEventListener('click', () => {
    openRequestSongModal(rawQuery.trim());
  });

  resultsContainer.appendChild(requestTriggerBox);
}

export function initCoversSearchEngine() {
  const topNav = document.querySelector('.top-nav');
  const searchPillBtn = document.getElementById('headerSearchPillBtn');
  const searchOverlay = document.getElementById('coversSearchOverlay');
  const paletteContainer = document.getElementById('commandPaletteContainer');
  const closeSearchOverlayBtn = document.getElementById('closeSearchOverlayBtn');
  const overlayInput = document.getElementById('overlaySearchInput');
  const clearSearchInputBtn = document.getElementById('clearSearchInputBtn');
  const zeroStateSuggestions = document.getElementById('zeroStateSuggestions');
  const categoryBtns = document.querySelectorAll('.cover-category-pill');
  const suggestionBtns = document.querySelectorAll('.suggestion-chip-btn');

  function updateSearchUI() {
    if (!overlayInput) return;
    const hasVal = !!overlayInput.value.trim();
    if (clearSearchInputBtn) {
      if (hasVal) clearSearchInputBtn.classList.remove('hidden');
      else clearSearchInputBtn.classList.add('hidden');
    }
    if (zeroStateSuggestions) {
      if (hasVal) zeroStateSuggestions.classList.add('hidden');
      else zeroStateSuggestions.classList.remove('hidden');
    }
  }

  function openOverlay() {
    if (!searchOverlay) return;

    if (searchPillBtn) {
      const rect = searchPillBtn.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      searchOverlay.style.transformOrigin = `${originX}px ${originY}px`;
    }

    searchOverlay.classList.add('active');
    if (topNav) topNav.classList.add('search-active');
    document.body.classList.add('modal-open');

    if (overlayInput) {
      setTimeout(() => overlayInput.focus(), 150);
    }
    renderLearningSpotlightCard(KINS_CURRENTLY_LEARNING);
    updateSearchUI();
    filterAndRenderCovers();
  }

  // Initial render of learning spotlight card
  renderLearningSpotlightCard(KINS_CURRENTLY_LEARNING);

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

  if (searchOverlay) {
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) {
        closeOverlay();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchOverlay?.classList.contains('active')) {
        closeOverlay();
      } else {
        openOverlay();
      }
    } else if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
      closeOverlay();
    }
  });

  if (clearSearchInputBtn && overlayInput) {
    clearSearchInputBtn.addEventListener('click', () => {
      overlayInput.value = '';
      updateSearchUI();
      filterAndRenderCovers();
      overlayInput.focus();
    });
  }

  if (overlayInput) {
    overlayInput.addEventListener('input', () => {
      updateSearchUI();
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        filterAndRenderCovers();
      }, 300);
    });
  }

  suggestionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-search');
      if (query && overlayInput) {
        overlayInput.value = query;
        updateSearchUI();
        filterAndRenderCovers();
        overlayInput.focus();
      }
    });
  });

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category') || 'all';
      filterAndRenderCovers();
    });
  });

  window.addEventListener('kins:subscription-change', () => {
    if (searchOverlay?.classList.contains('active')) {
      filterAndRenderCovers();
    }
  });
}
