import { showToast } from './toast.js';

const VOTED_SETLIST_STORAGE_KEY = 'kins_voted_setlist_covers';

function getVotedSetlistCovers() {
  try {
    const raw = localStorage.getItem(VOTED_SETLIST_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markCoverAsVoted(coverId) {
  try {
    const set = getVotedSetlistCovers();
    set.add(coverId);
    localStorage.setItem(VOTED_SETLIST_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function getCategoryInfo(category) {
  switch (category) {
    case 'acoustic':
      return { label: 'Acoustic Cover', icon: 'fa-solid fa-guitar' };
    case 'full-band':
      return { label: 'Full Band Cover', icon: 'fa-solid fa-guitar' };
    case 'shorts':
      return { label: 'Shorts Cover', icon: 'fa-solid fa-bolt' };
    default:
      return { label: 'Cover Performance', icon: 'fa-solid fa-music' };
  }
}

export function openCoverVideoModal(coverData) {
  const modal = document.getElementById('coverVideoModal');
  const iframe = document.getElementById('coverVideoIframe');
  const songTitleEl = document.getElementById('modalCoverSongTitle');
  const artistNameEl = document.getElementById('modalCoverArtistName');
  const categoryLabelEl = document.getElementById('modalCoverCategoryLabel');
  const categoryIconEl = document.getElementById('modalCoverCategoryIcon');
  const performanceTextEl = document.getElementById('modalCoverPerformanceText');
  const sublineIconEl = document.getElementById('modalCoverSublineIcon');
  const watchNativeBtn = document.getElementById('modalWatchNativeBtn');
  const songsterrBtn = document.getElementById('modalSongsterrBtn');
  const commentBtn = document.getElementById('modalCommentBtn');
  const commentCountText = document.getElementById('modalCommentCountText');
  const viewsEl = document.getElementById('modalCoverViews');
  const commentsEl = document.getElementById('modalCoverComments');
  const durationEl = document.getElementById('modalCoverDuration');
  const setlistBtn = document.getElementById('modalSetlistRequestBtn');
  const setlistBtnText = document.getElementById('modalSetlistBtnText');
  const setlistIcon = document.getElementById('modalSetlistIcon');
  const followBtn = document.getElementById('modalFollowBtn');

  if (!modal) return;

  // 1. Iframe src with JS API enabled and YouTube native controls/overlays hidden
  if (iframe) {
    const base = coverData.embedUrl.split('?')[0];
    iframe.src = `${base}?autoplay=1&controls=0&modestbranding=1&rel=0&fs=0&iv_load_policy=3&playsinline=1&enablejsapi=1`;
  }

  // 2. Top-Row Dynamic Category Badge
  const catInfo = getCategoryInfo(coverData.category);
  if (categoryLabelEl) categoryLabelEl.textContent = catInfo.label;
  if (categoryIconEl) categoryIconEl.className = catInfo.icon;

  // 3. Clean Song Title & Original Artist (no artificial quotes)
  if (songTitleEl) songTitleEl.textContent = coverData.title;
  if (artistNameEl) artistNameEl.textContent = coverData.originalArtist;

  // 4. Performance Attribution Subline (Live vs. Non-live)
  if (performanceTextEl) {
    if (coverData.isLivePerformance === true) {
      performanceTextEl.innerHTML = 'Performed live by <strong>Kins Band</strong>';
      if (sublineIconEl) sublineIconEl.className = 'fa-solid fa-tower-broadcast';
    } else {
      performanceTextEl.innerHTML = 'Cover by <strong>Kins Band</strong>';
      if (sublineIconEl) sublineIconEl.className = 'fa-solid fa-guitar';
    }
  }

  // 5. Metadata Stats Strip (Views, Comments, Duration)
  if (viewsEl) viewsEl.textContent = `${coverData.views || '10K+'} views`;
  if (commentsEl) commentsEl.textContent = `${coverData.commentCount || 0} comments`;
  if (durationEl) durationEl.textContent = coverData.duration || '3:30';

  // 6. Action Bar: Watch Native & Songsterr Tabs
  if (watchNativeBtn) {
    watchNativeBtn.href = coverData.watchUrl;
    watchNativeBtn.onclick = () => {
      showToast(`↗ Opening ${coverData.platformLabel || 'YouTube'} App...`);
    };
  }

  if (songsterrBtn) {
    const songsterrQuery = encodeURIComponent(`${coverData.originalArtist} ${coverData.title}`);
    songsterrBtn.href = `https://www.songsterr.com/a/wa/search?pattern=${songsterrQuery}`;
    songsterrBtn.onclick = () => {
      showToast(`🎸 Opening Songsterr tabs for "${coverData.title}"...`);
    };
  }

  if (commentBtn) {
    commentBtn.href = coverData.commentUrl;
    commentBtn.onclick = () => {
      showToast(`↗ Opening Comments in ${coverData.platformLabel || 'YouTube'}...`);
    };
  }
  if (commentCountText) commentCountText.textContent = `${coverData.commentCount || 0}`;

  // 6. Request for Live Setlist 1-Tap Vote Button & Fan Evidence
  const coverKey = coverData.id || coverData.title;
  const votedSet = getVotedSetlistCovers();
  const hasVotedThisCover = votedSet.has(coverKey);
  const baseCount = coverData.setlistRequests || 142;
  const currentCount = hasVotedThisCover ? baseCount + 1 : baseCount;

  const evidenceCountEl = document.getElementById('modalCoverEvidenceCount');
  const evidenceChipEl = document.getElementById('modalSetlistChip');
  if (evidenceCountEl) {
    evidenceCountEl.textContent = `${currentCount}`;
  }

  if (setlistBtn && setlistBtnText) {
    if (hasVotedThisCover) {
      setlistBtn.classList.add('voted');
      setlistBtnText.textContent = 'Requested';
      setlistBtn.setAttribute('title', `${currentCount} fans thought the same`);
      setlistBtn.setAttribute('aria-label', `Already requested, ${currentCount} fans thought the same`);
      if (setlistIcon) setlistIcon.className = 'fa-solid fa-check';
    } else {
      setlistBtn.classList.remove('voted');
      setlistBtnText.textContent = 'Req. Setlist';
      setlistBtn.setAttribute('title', `${currentCount} fans thought the same`);
      setlistBtn.setAttribute('aria-label', `Request song for Kins live setlist, ${currentCount} fans thought the same`);
      if (setlistIcon) setlistIcon.className = 'fa-solid fa-fire';
    }

    setlistBtn.onclick = async () => {
      if (getVotedSetlistCovers().has(coverKey)) {
        showToast(`⚡ "${coverData.title}" is already requested for Kins' setlist!`);
        return;
      }

      // Optimistic visual feedback
      markCoverAsVoted(coverKey);
      setlistBtn.classList.add('voted');
      setlistBtnText.textContent = 'Requested';
      if (setlistIcon) setlistIcon.className = 'fa-solid fa-check';

      const updated = (parseInt(evidenceCountEl?.textContent, 10) || baseCount) + 1;
      if (evidenceCountEl) {
        evidenceCountEl.textContent = `${updated}`;
      }
      setlistBtn.setAttribute('title', `${updated} fans thought the same`);
      setlistBtn.setAttribute('aria-label', `Already requested, ${updated} fans thought the same`);

      if (evidenceChipEl) {
        evidenceChipEl.classList.add('chip-bump');
        setTimeout(() => evidenceChipEl.classList.remove('chip-bump'), 400);
      }

      showToast(`🗳️ Requested "${coverData.title}" for Kins' live setlist!`);

      // Dispatch vote to serverless API
      try {
        const safeScope = coverData.id ? `cover-request:${coverData.id}` : `cover-request:general`;
        await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: safeScope,
            choice: coverData.title
          })
        });
      } catch (err) {
        console.warn('Setlist vote network sync failed:', err);
      }
    };
  }

  // Reset video overlay controls state
  const overlay = document.getElementById('videoControlsOverlay');
  const playIcon = document.getElementById('videoPlayPauseIcon');
  const qualityDropdown = document.getElementById('videoQualityDropdown');
  if (overlay) overlay.classList.remove('controls-hidden');
  if (playIcon) playIcon.className = 'fa-solid fa-pause';
  if (qualityDropdown) qualityDropdown.classList.add('hidden');
  isVideoPlaying = true;

  // Legacy fallback if follow button exists
  if (followBtn) {
    followBtn.href = coverData.followUrl || '#';
    followBtn.onclick = () => {
      showToast(`↗ Opening Kins Channel...`);
    };
  }

  modal.classList.remove('hidden');
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

let isVideoPlaying = true;

function postYTCommand(func, args = '') {
  const iframe = document.getElementById('coverVideoIframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: func,
      args: args
    }), '*');
  }
}

export function closeCoverVideoModal() {
  const modal = document.getElementById('coverVideoModal');
  const iframe = document.getElementById('coverVideoIframe');
  const container = document.querySelector('.cover-video-modal-container');
  const fullscreenIcon = document.getElementById('videoFullscreenIcon');
  const fullscreenBtn = document.getElementById('videoFullscreenBtn');

  if (container) {
    container.classList.remove('is-mobile-landscape');
  }

  const doc = document;
  if (doc.fullscreenElement || doc.webkitFullscreenElement) {
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  }

  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (err) {}

  if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-expand';
  if (fullscreenBtn) {
    fullscreenBtn.setAttribute('title', 'Fullscreen / Landscape');
    fullscreenBtn.setAttribute('aria-label', 'Fullscreen and landscape mode');
  }

  if (modal) {
    if (modal.classList.contains('is-closing')) return;
    modal.classList.add('is-closing');
    setTimeout(() => {
      modal.classList.remove('active', 'is-closing');
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
      if (iframe) {
        iframe.src = '';
      }
    }, 180);
  }
}

export function initCoverVideoModalController() {
  const closeBtn = document.getElementById('closeCoverVideoModal');
  const backdrop = document.getElementById('coverVideoModal');
  const overlay = document.getElementById('videoControlsOverlay');
  const playPauseBtn = document.getElementById('videoPlayPauseBtn');
  const playIcon = document.getElementById('videoPlayPauseIcon');
  const fullscreenBtn = document.getElementById('videoFullscreenBtn');
  const fullscreenIcon = document.getElementById('videoFullscreenIcon');
  const qualityBtn = document.getElementById('videoQualityBtn');
  const qualityDropdown = document.getElementById('videoQualityDropdown');
  const qualityOptions = document.querySelectorAll('.quality-opt-btn');
  const videoWrapper = document.getElementById('videoIframeWrapper');

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

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('active')) {
      closeCoverVideoModal();
    }
  });

  // Toggle controls overlay visibility when tapping/clicking the overlay
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      // If clicking inside interactive elements, don't toggle overlay
      if ((e.target).closest('button') || (e.target).closest('.video-quality-dropdown')) {
        return;
      }
      overlay.classList.toggle('controls-hidden');
      if (qualityDropdown) qualityDropdown.classList.add('hidden');
    });
  }

  // Play / Pause toggle
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isVideoPlaying) {
        postYTCommand('pauseVideo');
        isVideoPlaying = false;
        if (playIcon) playIcon.className = 'fa-solid fa-play';
        showToast('⏸ Video Paused');
      } else {
        postYTCommand('playVideo');
        isVideoPlaying = true;
        if (playIcon) playIcon.className = 'fa-solid fa-pause';
        showToast('▶ Video Resumed');
      }
    });
  }

  // Fullscreen / Landscape toggle
  async function toggleLandscapeFullscreen() {
    const doc = document;
    const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
    const container = document.querySelector('.cover-video-modal-container');
    const isSimulated = container?.classList.contains('is-mobile-landscape');

    if (!isFull && !isSimulated) {
      let nativeSuccess = false;
      if (videoWrapper) {
        try {
          if (videoWrapper.requestFullscreen) {
            await videoWrapper.requestFullscreen();
            nativeSuccess = true;
          } else if (videoWrapper.webkitRequestFullscreen) {
            await videoWrapper.webkitRequestFullscreen();
            nativeSuccess = true;
          }
        } catch (err) {
          console.warn('Native fullscreen request blocked/unsupported:', err);
        }
      }

      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape');
        }
      } catch (err) {}

      // On mobile viewports or if native fullscreen unsupported (e.g. iOS Safari), activate simulated landscape
      if (!nativeSuccess || window.innerWidth < 768) {
        if (container) container.classList.add('is-mobile-landscape');
      }

      if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-compress';
      if (fullscreenBtn) {
        fullscreenBtn.setAttribute('title', 'Exit Fullscreen / Landscape');
        fullscreenBtn.setAttribute('aria-label', 'Exit fullscreen and landscape mode');
      }
      showToast('⛶ Landscape Mode');
    } else {
      if (isFull) {
        try {
          if (doc.exitFullscreen) {
            await doc.exitFullscreen();
          } else if (doc.webkitExitFullscreen) {
            await doc.webkitExitFullscreen();
          }
        } catch (err) {}
      }

      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (err) {}

      if (container) container.classList.remove('is-mobile-landscape');
      if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-expand';
      if (fullscreenBtn) {
        fullscreenBtn.setAttribute('title', 'Fullscreen / Landscape');
        fullscreenBtn.setAttribute('aria-label', 'Fullscreen and landscape mode');
      }
      showToast('Exit Landscape');
    }
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLandscapeFullscreen();
    });
  }

  function onFullscreenStateChange() {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const container = document.querySelector('.cover-video-modal-container');
    if (!isFull && !container?.classList.contains('is-mobile-landscape')) {
      if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-expand';
      if (fullscreenBtn) {
        fullscreenBtn.setAttribute('title', 'Fullscreen / Landscape');
        fullscreenBtn.setAttribute('aria-label', 'Fullscreen and landscape mode');
      }
    }
  }

  document.addEventListener('fullscreenchange', onFullscreenStateChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenStateChange);

  // Quality settings toggle
  if (qualityBtn) {
    qualityBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (qualityDropdown) {
        qualityDropdown.classList.toggle('hidden');
      }
    });
  }

  qualityOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const q = opt.getAttribute('data-quality') || '1080p';
      qualityOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      if (qualityBtn) {
        qualityBtn.setAttribute('title', `Video Quality: ${q}`);
        qualityBtn.setAttribute('aria-label', `Video quality: ${q}`);
      }
      if (qualityDropdown) qualityDropdown.classList.add('hidden');
      
      const ytQuality = q === 'Auto' ? 'default' : q === '1080p' ? 'hd1080' : 'hd720';
      postYTCommand('setPlaybackQuality', [ytQuality]);
      showToast(`⚙️ Video Quality: ${q}`);
    });
  });
}

