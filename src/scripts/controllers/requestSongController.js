import { showToast } from './toast.js';

export function handleSongRequestSubmit(event, prefilledTitle = '') {
  event.preventDefault();
  const form = event.target;
  const songTitleInput = form.querySelector('#reqSongTitle');
  const artistInput = form.querySelector('#reqArtist');
  const reasonInput = form.querySelector('#reqReason');
  const emailInput = form.querySelector('#reqEmail');

  const songTitle = songTitleInput?.value.trim() || prefilledTitle || 'Untitled Cover';
  const artist = artistInput?.value.trim() || 'Unknown Artist';

  if (!songTitle || !artist) {
    showToast('⚠️ Please provide both Song Title and Original Artist!');
    return;
  }

  const container = form.closest('.request-song-card-container');
  if (container) {
    container.innerHTML = `
      <div class="song-request-success-card">
        <div class="success-icon-box">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="success-title">Request Submitted!</h4>
        <p class="success-desc">
          Kins has added <strong>"${songTitle}"</strong> by <strong>${artist}</strong> to their cover wishlist!
        </p>
        <button class="request-another-btn" id="requestAnotherBtn">
          <i class="fa-solid fa-plus"></i> Request Another Song
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
