import { showToast } from './toast.js';

export function openCoverVideoModal(coverData) {
  const modal = document.getElementById('coverVideoModal');
  const iframe = document.getElementById('coverVideoIframe');
  const songTitleEl = document.getElementById('modalCoverSongTitle');
  const artistNameEl = document.getElementById('modalCoverArtistName');
  const watchNativeBtn = document.getElementById('modalWatchNativeBtn');
  const commentBtn = document.getElementById('modalCommentBtn');
  const commentCountText = document.getElementById('modalCommentCountText');
  const followBtn = document.getElementById('modalFollowBtn');

  if (!modal) return;

  if (iframe) iframe.src = coverData.embedUrl;
  if (songTitleEl) songTitleEl.textContent = `"${coverData.title}"`;
  if (artistNameEl) artistNameEl.textContent = coverData.originalArtist;
  if (commentCountText) commentCountText.textContent = `${coverData.commentCount || 0} Comments`;

  if (watchNativeBtn) {
    watchNativeBtn.href = coverData.watchUrl;
    watchNativeBtn.onclick = () => {
      showToast(`↗ Opening ${coverData.platformLabel || 'YouTube'} App...`);
    };
  }

  if (commentBtn) {
    commentBtn.href = coverData.commentUrl;
    commentBtn.onclick = () => {
      showToast(`↗ Opening Comments in ${coverData.platformLabel || 'YouTube'}...`);
    };
  }

  if (followBtn) {
    followBtn.href = coverData.followUrl;
    followBtn.onclick = () => {
      showToast(`↗ Opening Kins Channel...`);
    };
  }

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

export function closeCoverVideoModal() {
  const modal = document.getElementById('coverVideoModal');
  const iframe = document.getElementById('coverVideoIframe');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
  if (iframe) {
    iframe.src = '';
  }
}

export function initCoverVideoModalController() {
  const closeBtn = document.getElementById('closeCoverVideoModal');
  const backdrop = document.getElementById('coverVideoModal');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCoverVideoModal);
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeCoverVideoModal();
      }
    });
  }
}
