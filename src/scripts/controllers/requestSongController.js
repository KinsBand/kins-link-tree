import { showToast } from './toast.js';
import { getSubscriptionState, getSubscriberEmail } from './subscribeController.js';

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

let artistFetchDebounceTimeout = null;

function updateModalPillsUI(artists) {
  const pillsContainer = document.getElementById('modalArtistPillsScrollRow');
  const artistInput = document.getElementById('modalReqArtist');
  if (!pillsContainer) return;

  if (!artists || artists.length === 0) {
    pillsContainer.innerHTML = '';
    return;
  }

  if (artistInput && !artistInput.value.trim()) {
    artistInput.value = artists[0];
  }

  pillsContainer.innerHTML = artists.map((art, idx) => `
    <button type="button" class="artist-suggestion-pill brutal-press ${idx === 0 ? 'active' : ''}" data-artist="${escapeHtml(art)}">
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

function updateModalEmailSection() {
  const container = document.getElementById('modalRequestEmailSection');
  if (!container) return;

  const isSubscribed = getSubscriptionState();
  const savedEmail = getSubscriberEmail();

  if (isSubscribed) {
    container.innerHTML = `
      <div class="subscribed-email-notice-badge">
        <div class="sub-badge-left">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div class="sub-badge-content">
          <span class="sub-badge-status">Subscribed Updates Active</span>
          <p class="sub-badge-text">You'll receive release updates via your email${savedEmail ? ` (<strong>${escapeHtml(savedEmail)}</strong>)` : ''}.</p>
        </div>
        <input type="hidden" id="modalReqEmail" value="${escapeHtml(savedEmail || 'Subscribed Fan')}">
      </div>
    `;
  } else {
    container.innerHTML = `
      <label for="modalReqEmail" class="form-label">Email Address <span class="optional-tag">(optional, for release update)</span></label>
      <input
        type="email"
        id="modalReqEmail"
        name="email"
        placeholder="fan@example.com"
        autocomplete="email"
        class="brutal-input"
      />
    `;
  }
}

let currentRequestType = 'video';

export function setRequestType(type) {
  currentRequestType = type === 'setlist' ? 'setlist' : 'video';

  const videoBtn = document.getElementById('reqTypeVideoBtn');
  const setlistBtn = document.getElementById('reqTypeSetlistBtn');
  const typeInput = document.getElementById('modalReqType');
  const reasonLabel = document.getElementById('modalReqReasonLabel');
  const reasonInput = document.getElementById('modalReqReason');
  const submitText = document.getElementById('modalSubmitText');
  const submitIcon = document.getElementById('modalSubmitIcon');
  const subheadline = document.getElementById('requestSubheadline');

  if (videoBtn && setlistBtn) {
    if (currentRequestType === 'setlist') {
      videoBtn.classList.remove('active');
      videoBtn.setAttribute('aria-pressed', 'false');
      setlistBtn.classList.add('active');
      setlistBtn.setAttribute('aria-pressed', 'true');
    } else {
      setlistBtn.classList.remove('active');
      setlistBtn.setAttribute('aria-pressed', 'false');
      videoBtn.classList.add('active');
      videoBtn.setAttribute('aria-pressed', 'true');
    }
  }

  if (typeInput) {
    typeInput.value = currentRequestType;
  }

  if (currentRequestType === 'setlist') {
    if (subheadline) {
      subheadline.textContent = 'Request tracks to be played live on stage at upcoming gigs.';
    }
    if (reasonLabel) {
      reasonLabel.textContent = 'Why should Kins play this live?';
    }
    if (reasonInput) {
      reasonInput.placeholder = 'e.g. Play this live at your next gig in Melbourne!';
    }
    if (submitText) {
      submitText.textContent = 'Request For Live Setlist';
    }
    if (submitIcon) {
      submitIcon.className = 'fa-solid fa-bolt';
    }
  } else {
    if (subheadline) {
      subheadline.textContent = 'Vote for tracks for upcoming gigs & sessions.';
    }
    if (reasonLabel) {
      reasonLabel.textContent = 'Why should Kins cover this?';
    }
    if (reasonInput) {
      reasonInput.placeholder = 'e.g. Your rhythm section style would sound unreal on this track!';
    }
    if (submitText) {
      submitText.textContent = 'Submit Cover Request';
    }
    if (submitIcon) {
      submitIcon.className = 'fa-solid fa-paper-plane';
    }
  }
}

export function openRequestSongModal(prefilledTitle = '') {
  const modal = document.getElementById('requestSongModal');
  const formView = document.getElementById('requestSongFormView');
  const successView = document.getElementById('requestSongSuccessView');
  const titleInput = document.getElementById('modalReqSongTitle');
  const artistInput = document.getElementById('modalReqArtist');
  const reasonInput = document.getElementById('modalReqReason');

  if (!modal) return;

  // Reset view state & request type
  if (formView) formView.classList.remove('hidden');
  if (successView) successView.classList.add('hidden');
  setRequestType('video');

  // Populate title & email section
  if (titleInput) {
    titleInput.value = prefilledTitle.trim();
  }
  if (artistInput) {
    artistInput.value = '';
  }
  if (reasonInput) {
    reasonInput.value = '';
  }

  updateModalEmailSection();
  updateModalPillsUI([]);

  if (prefilledTitle.trim()) {
    fetchLiveArtistSuggestions(prefilledTitle.trim()).then(artists => {
      updateModalPillsUI(artists);
    });
  }

  modal.classList.remove('hidden');
  modal.classList.add('active');
  document.body.classList.add('modal-open');

  setTimeout(() => {
    if (prefilledTitle.trim() && artistInput) {
      artistInput.focus();
    } else if (titleInput) {
      titleInput.focus();
    }
  }, 120);
}

export function closeRequestSongModal() {
  const modal = document.getElementById('requestSongModal');
  const searchOverlay = document.getElementById('coversSearchOverlay');

  if (modal) {
    if (modal.classList.contains('is-closing') || modal.classList.contains('hidden')) return;
    const wrapper = modal.querySelector('.request-song-sheet-wrapper');
    modal.classList.add('is-closing');
    if (wrapper) wrapper.classList.add('is-closing');

    setTimeout(() => {
      modal.classList.remove('active', 'is-closing');
      if (wrapper) wrapper.classList.remove('is-closing');
      modal.classList.add('hidden');

      // Only remove modal-open from body if covers search overlay is not open
      if (!searchOverlay || !searchOverlay.classList.contains('active')) {
        document.body.classList.remove('modal-open');
      }
    }, 180);
  }
}

export async function handleSongRequestSubmit(event, prefilledTitle = '') {
  event.preventDefault();
  const form = event.target;
  const songTitleInput = form.querySelector('#reqSongTitle') || form.querySelector('#modalReqSongTitle');
  const artistInput = form.querySelector('#reqArtist') || form.querySelector('#modalReqArtist');
  const reasonInput = form.querySelector('#reqReason') || form.querySelector('#modalReqReason');
  const emailInput = form.querySelector('#reqEmail') || form.querySelector('#modalReqEmail');
  const submitBtn = form.querySelector('.submit-request-btn');
  const typeInput = form.querySelector('#modalReqType');

  const songTitle = songTitleInput?.value.trim() || prefilledTitle || 'Untitled Cover';
  const artist = artistInput?.value.trim() || 'Unknown Artist';
  const reason = reasonInput?.value.trim() || 'None provided';
  const requestType = typeInput?.value || currentRequestType || 'video';
  const isSetlist = requestType === 'setlist';
  
  const isSubscribed = getSubscriptionState();
  const savedEmail = getSubscriberEmail();
  let email = emailInput?.value.trim() || '';
  if (!email || email === 'Subscribed Fan') {
    email = savedEmail || (isSubscribed ? 'Subscribed Fan' : 'Not provided');
  }

  if (!songTitle || !artist) {
    showToast('⚠️ Please provide both Song Title and Original Artist!');
    return;
  }

  const originalBtnHtml = submitBtn?.innerHTML || '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-compact-disc fa-spin"></i> <span>Submitting...</span>`;
  }

  try {
    const res = await fetch('/api/request-song', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songTitle, artist, reason, email, isSubscribed, requestType })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || `Request failed (${res.status})`);
    }
  } catch (err) {
    console.warn('Cover request submission error:', err);
    showToast("⚠️ Couldn't submit your request — please try again in a moment.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
    return;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }

  // Handle modal view transition
  const formView = document.getElementById('requestSongFormView');
  const successView = document.getElementById('requestSongSuccessView');
  const successTitle = document.getElementById('modalSuccessTitle');
  const successDesc = document.getElementById('modalSuccessDesc');
  const successMetaText = document.getElementById('modalSuccessMetaText');

  if (formView && successView) {
    formView.classList.add('hidden');
    successView.classList.remove('hidden');

    if (successTitle) {
      successTitle.textContent = isSetlist ? 'Live Setlist Request Locked In!' : 'Cover Request Locked In!';
    }

    if (successDesc) {
      successDesc.innerHTML = isSetlist
        ? `Rock on! Kins added <strong>"${escapeHtml(songTitle)}"</strong> by <strong>${escapeHtml(artist)}</strong> to their official live gig setlist wishlist.`
        : `Rock on! Kins added <strong>"${escapeHtml(songTitle)}"</strong> by <strong>${escapeHtml(artist)}</strong> to their official cover wishlist.`;
    }
    if (successMetaText) {
      if (isSetlist) {
        successMetaText.innerHTML = isSubscribed
          ? `We'll update your inbox at <strong>${escapeHtml(savedEmail || 'your email')}</strong> if Kins adds this to a live gig setlist!`
          : 'You will receive updates if Kins plays this track live on stage.';
      } else {
        successMetaText.innerHTML = isSubscribed
          ? `We'll notify your inbox at <strong>${escapeHtml(savedEmail || 'your email')}</strong> when it drops!`
          : 'You will receive release updates if Kins covers this track.';
      }
    }
  }

  // Legacy fallback if inside inline container
  const container = form.closest('.request-song-card-container');
  if (container) {
    container.innerHTML = `
      <div class="song-request-success-card">
        <div class="success-icon-box">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="success-title">${isSetlist ? 'Live Setlist Request Locked In!' : 'Cover Request Locked In!'}</h4>
        <p class="success-desc">
          Rock on! Kins added <strong>"${escapeHtml(songTitle)}"</strong> by <strong>${escapeHtml(artist)}</strong> to their official ${isSetlist ? 'live setlist' : 'cover'} wishlist.
        </p>
        <div class="success-meta-note">
          <i class="fa-solid fa-envelope"></i>
          <span>${isSubscribed ? `We'll update your inbox at <strong>${escapeHtml(savedEmail || 'your email')}</strong>!` : 'You will receive release updates if Kins covers this track.'}</span>
        </div>
        <button class="request-another-btn brutal-press" id="requestAnotherBtn">
          <i class="fa-solid fa-rotate-left"></i> Request Another Song
        </button>
      </div>
    `;

    const requestAnotherBtn = container.querySelector('#requestAnotherBtn');
    if (requestAnotherBtn) {
      requestAnotherBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('overlaySearchInput');
        if (searchInput) {
          searchInput.dispatchEvent(new Event('input'));
        }
      });
    }
  }

  const toastLabel = isSetlist ? 'Live setlist request' : 'Cover request';
  showToast(`🎵 ${toastLabel} for "${songTitle}" submitted to Kins!`);
}

export function initRequestSongModalController() {
  const modal = document.getElementById('requestSongModal');
  const closeBtn = document.getElementById('closeRequestSongModalBtn');
  const doneCloseBtn = document.getElementById('modalDoneCloseBtn');
  const requestAnotherBtn = document.getElementById('modalRequestAnotherBtn');
  const form = document.getElementById('requestSongModalForm');
  const songTitleInput = document.getElementById('modalReqSongTitle');
  const formView = document.getElementById('requestSongFormView');
  const successView = document.getElementById('requestSongSuccessView');
  const videoBtn = document.getElementById('reqTypeVideoBtn');
  const setlistBtn = document.getElementById('reqTypeSetlistBtn');

  if (videoBtn) {
    videoBtn.addEventListener('click', () => setRequestType('video'));
  }

  if (setlistBtn) {
    setlistBtn.addEventListener('click', () => setRequestType('setlist'));
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeRequestSongModal);
  }

  if (doneCloseBtn) {
    doneCloseBtn.addEventListener('click', closeRequestSongModal);
  }

  if (requestAnotherBtn) {
    requestAnotherBtn.addEventListener('click', () => {
      if (formView) formView.classList.remove('hidden');
      if (successView) successView.classList.add('hidden');
      if (form) form.reset();
      setRequestType('video');
      updateModalEmailSection();
      updateModalPillsUI([]);
      if (songTitleInput) songTitleInput.focus();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeRequestSongModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeRequestSongModal();
    }
  });

  if (songTitleInput) {
    songTitleInput.addEventListener('input', () => {
      clearTimeout(artistFetchDebounceTimeout);
      const currentTitle = songTitleInput.value.trim();

      if (!currentTitle) {
        updateModalPillsUI([]);
        return;
      }

      artistFetchDebounceTimeout = setTimeout(() => {
        fetchLiveArtistSuggestions(currentTitle).then(artists => {
          updateModalPillsUI(artists);
        });
      }, 250);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => handleSongRequestSubmit(e));
  }
}
