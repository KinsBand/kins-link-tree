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

export async function handleSongRequestSubmit(event, prefilledTitle = '') {
  event.preventDefault();
  const form = event.target;
  const songTitleInput = form.querySelector('#reqSongTitle');
  const artistInput = form.querySelector('#reqArtist');
  const reasonInput = form.querySelector('#reqReason');
  const emailInput = form.querySelector('#reqEmail');
  const submitBtn = form.querySelector('.submit-request-btn');

  const songTitle = songTitleInput?.value.trim() || prefilledTitle || 'Untitled Cover';
  const artist = artistInput?.value.trim() || 'Unknown Artist';
  const reason = reasonInput?.value.trim() || 'None provided';
  
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
      body: JSON.stringify({ songTitle, artist, reason, email, isSubscribed })
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
  }

  const container = form.closest('.request-song-card-container');
  if (container) {
    container.innerHTML = `
      <div class="song-request-success-card">
        <div class="success-icon-box">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="success-title">Cover Request Locked In!</h4>
        <p class="success-desc">
          Rock on! Kins added <strong>"${escapeHtml(songTitle)}"</strong> by <strong>${escapeHtml(artist)}</strong> to their official cover wishlist.
        </p>
        <div class="success-meta-note">
          <i class="fa-solid fa-envelope"></i>
          <span>${isSubscribed ? `We'll update your inbox at <strong>${escapeHtml(savedEmail || 'your email')}</strong> when it drops!` : 'You will receive release updates if Kins covers this track.'}</span>
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

  showToast(`🎵 Request for "${songTitle}" submitted to Kins!`);
}
