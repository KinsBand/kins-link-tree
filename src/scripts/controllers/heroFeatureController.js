import { openCoverVideoModal } from './videoModalController.js';
import { showToast } from './toast.js';
import { stopVinylSpinSmoothly } from './audioPlayer.js';

export function initHeroFeatureController() {
  const card = document.getElementById('heroFeatureCard');
  if (!card) return;

  const primaryTabBtns = document.querySelectorAll('.state-tab-btn');
  const subvarsRow = document.getElementById('heroSelectorSubvarsRow');

  // SUB-VARIATIONS DICTIONARY FOR ALL 8 STATES
  const subvarsMap = {
    upcoming: [
      { key: 'minimal_teaser', label: 'Minimal Teaser' },
      { key: 'mystery_countdown', label: 'Mystery Countdown' }
    ],
    release: [
      { key: 'cover_video', label: 'Cover Video (Screenshot)' },
      { key: 'original_single', label: 'Original Single' },
      { key: 'ep_preorder', label: 'EP Pre-Order' }
    ],
    poll: [
      { key: 'merch_design', label: 'Merch Vote (3×1:1 Grid)' },
      { key: 'recording_cover', label: 'Recording Poll' },
      { key: 'setlist_song', label: 'Setlist Poll + Countdown' },
      { key: 'city_request', label: 'City Request' }
    ],
    preview: [
      { key: 'inspired_demo', label: 'Inspired Demo' },
      { key: 'studio_bts', label: 'Studio BTS' }
    ],
    tour: [
      { key: 'next_show', label: 'Next Show & Tickets' },
      { key: 'aftermovie', label: 'Concert Aftermovie' },
      { key: 'sold_out', label: 'Sold Out Alert' }
    ],
    milestones: [
      { key: 'follower_milestone', label: 'Follower Milestone' },
      { key: 'stream_milestone', label: 'Stream Count Milestone' },
      { key: 'press_quote', label: 'Press / Blog Quote' }
    ],
    livestream: [
      { key: 'live_now', label: '🔴 Live Stream Now' },
      { key: 'upcoming_stream', label: 'Stream Countdown' },
      { key: 'listening_party', label: 'Listening Party' }
    ],
    spotlight: [
      { key: 'member_spotlight', label: 'Member Spotlight' },
      { key: 'origin_story', label: 'Origin Story' },
      { key: 'gear_showcase', label: 'Gear Showcase' }
    ],
    collab: [
      { key: 'collab_single', label: 'Collab Single' },
      { key: 'featured_playlist', label: 'Featured Playlist' },
      { key: 'tiktok_challenge', label: 'TikTok Challenge' }
    ]
  };

  let currentState = card.getAttribute('data-active-state') || 'upcoming';
  let currentSubvar = card.getAttribute('data-active-var') || 'minimal_teaser';

  function applyStateAndSubvar(state, subvar) {
    // Hide all main state containers
    document.querySelectorAll('.hero-card-state').forEach(el => el.classList.add('hidden'));

    // Show active state container
    const activeStateEl = document.getElementById(`state${state.charAt(0).toUpperCase() + state.slice(1)}`);
    if (activeStateEl) {
      activeStateEl.classList.remove('hidden');

      // Hide all sub-variations in this state
      activeStateEl.querySelectorAll('.sub-var-panel').forEach(panel => panel.classList.add('hidden'));

      // Show selected sub-variation panel
      const targetPanel = activeStateEl.querySelector(`.var-${state}-${subvar}`);
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
      } else {
        // Fallback to first panel if specified subvar isn't found
        const firstPanel = activeStateEl.querySelector('.sub-var-panel');
        firstPanel?.classList.remove('hidden');
      }
    }
  }

  // Initial state setup from config
  applyStateAndSubvar(currentState, currentSubvar);

  // --- ACTIONS: VIDEO MODAL TRIGGERS ---
  document.querySelectorAll('.release-play-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      openCoverVideoModal({
        title: "Just Like Heaven",
        originalArtist: "The Cure",
        embedUrl: "https://www.youtube.com/embed/n3nPiBaiZrg?autoplay=1",
        watchUrl: "https://www.youtube.com/watch?v=n3nPiBaiZrg",
        commentUrl: "https://www.youtube.com/watch?v=n3nPiBaiZrg",
        followUrl: "https://www.youtube.com/channel/UC57aKk67k5L7iL13C0d7g5Y",
        commentCount: 42,
        platformLabel: "YouTube"
      });
    });
  });

  document.querySelectorAll('.single-stream-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const audioBarStreamBtn = document.getElementById('audioBarStreamBtn');
      if (audioBarStreamBtn) {
        audioBarStreamBtn.click();
      } else {
        window.open('https://open.spotify.com/artist/57aKk67k5L7iL13C0d7g5Y', '_blank');
      }
    });
  });

  document.querySelectorAll('.ep-preorder-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast("↗ Redirecting to Kins EP Pre-Order store...");
    });
  });

  document.querySelectorAll('.hero-share-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const shareModal = document.getElementById('shareModal');
      if (shareModal) {
        shareModal.classList.remove('hidden');
      } else if (navigator.share) {
        navigator.share({
          title: 'Kins - Official Band Link in Bio',
          url: window.location.href,
        }).catch(() => {});
      } else {
        showToast("Link copied to clipboard!");
      }
    });
  });

  // --- ACTIONS: GIG MAP TRIGGER ---
  const heroOpenGigMapBtn = document.getElementById('heroOpenGigMapBtn');
  heroOpenGigMapBtn?.addEventListener('click', () => {
    const floatingGigPillBtn = document.getElementById('floatingGigPillBtn');
    floatingGigPillBtn?.click();
  });

  // --- ACTIONS: POLL VOTING LOGIC WITH DESELECT & REVOTE ---
  const pollOptionBtns = document.querySelectorAll('.poll-option-btn');

  function calculateAndRevealPoll(pollType, votedOptionId) {
    const typeOptionBtns = document.querySelectorAll(`.poll-option-btn[data-poll-type="${pollType}"]`);
    const statusTag = document.querySelector(`.poll-status-${pollType}`);

    let totalVotes = 0;
    const votesMap = {};

    typeOptionBtns.forEach(btn => {
      const optId = btn.getAttribute('data-option-id');
      let baseVotes = parseInt(btn.getAttribute('data-votes') || '100', 10);
      if (optId === votedOptionId) {
        baseVotes += 1;
      }
      votesMap[optId] = baseVotes;
      totalVotes += baseVotes;
    });

    typeOptionBtns.forEach(btn => {
      const optId = btn.getAttribute('data-option-id');
      const pctEl = btn.querySelector('.poll-option-pct');
      const fillEl = btn.querySelector('.poll-progress-fill');

      if (votedOptionId) {
        const votes = votesMap[optId] || 0;
        const pct = Math.round((votes / totalVotes) * 100);

        if (pctEl) {
          pctEl.textContent = `${pct}%`;
          pctEl.classList.remove('hidden');
        }
        if (fillEl) {
          fillEl.style.width = `${pct}%`;
        }

        if (optId === votedOptionId) {
          btn.classList.add('selected');
        } else {
          btn.classList.remove('selected');
        }
      } else {
        if (pctEl) pctEl.classList.add('hidden');
        if (fillEl) fillEl.style.width = '0%';
        btn.classList.remove('selected');
      }
    });

    if (statusTag) {
      if (votedOptionId) {
        statusTag.innerHTML = `<i class="fa-solid fa-circle-check"></i> VOTE RECORDED • CLICK TO CHANGE`;
        statusTag.classList.add('voted');
      } else {
        statusTag.innerHTML = `<i class="fa-solid fa-vote-yea"></i> Voting Open`;
        statusTag.classList.remove('voted');
      }
    }
  }

  // Restore saved votes for each poll type
  ['recording', 'setlist', 'merch', 'city'].forEach(pollType => {
    const saved = localStorage.getItem(`kins_poll_vote_${pollType}`);
    if (saved) {
      calculateAndRevealPoll(pollType, saved);
    }
  });

  pollOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pollType = btn.getAttribute('data-poll-type');
      const optId = btn.getAttribute('data-option-id');
      if (!pollType || !optId) return;

      const currentVote = localStorage.getItem(`kins_poll_vote_${pollType}`);

      if (currentVote === optId) {
        localStorage.removeItem(`kins_poll_vote_${pollType}`);
        calculateAndRevealPoll(pollType, null);
        showToast("Vote deselected.");
      } else {
        localStorage.setItem(`kins_poll_vote_${pollType}`, optId);
        calculateAndRevealPoll(pollType, optId);
        showToast(currentVote ? "Vote updated!" : "Vote recorded! Thanks for building with Kins.");
      }
    });
  });

  // GIG COUNTDOWN TIMER TICK
  const cdDays = document.getElementById('heroCdDays');
  const cdHours = document.getElementById('heroCdHours');
  const cdMins = document.getElementById('heroCdMins');
  const cdSecs = document.getElementById('heroCdSecs');
  const gigTargetTime = new Date('2026-03-28T20:00:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = gigTargetTime - now;

    if (diff > 0) {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      if (cdDays) cdDays.textContent = String(d).padStart(2, '0');
      if (cdHours) cdHours.textContent = String(h).padStart(2, '0');
      if (cdMins) cdMins.textContent = String(m).padStart(2, '0');
      if (cdSecs) cdSecs.textContent = String(s).padStart(2, '0');
    }
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // --- STATE 3: SONG PREVIEW PLAYER ---
  const previewPlayBtn = document.getElementById('previewPlayToggleBtn');
  const previewDiscBox = document.getElementById('previewDiscBox');
  const previewProgressFill = document.getElementById('previewProgressFill');
  const previewTimeCurrent = document.getElementById('previewTimeCurrent');
  let isPreviewPlaying = false;
  let previewTimer = null;
  let previewSeconds = 0;

  previewPlayBtn?.addEventListener('click', () => {
    isPreviewPlaying = !isPreviewPlaying;

    if (isPreviewPlaying) {
      previewPlayBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
      stopVinylSpinSmoothly(previewDiscBox, true);

      previewTimer = setInterval(() => {
        previewSeconds += 1;
        if (previewSeconds > 30) {
          previewSeconds = 0;
          isPreviewPlaying = false;
          clearInterval(previewTimer);
          previewPlayBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
          stopVinylSpinSmoothly(previewDiscBox, false);
          if (previewProgressFill) previewProgressFill.style.width = '0%';
          if (previewTimeCurrent) previewTimeCurrent.textContent = '0:00';
          return;
        }

        const pct = (previewSeconds / 30) * 100;
        if (previewProgressFill) previewProgressFill.style.width = `${pct}%`;
        if (previewTimeCurrent) previewTimeCurrent.textContent = `0:${String(previewSeconds).padStart(2, '0')}`;
      }, 1000);

      showToast("Playing preview: Kins — Chemical Fires (Demo)");
    } else {
      clearInterval(previewTimer);
      previewPlayBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
      stopVinylSpinSmoothly(previewDiscBox, false);
    }
  });

  const previewPreSaveBtn = document.getElementById('previewPreSaveBtn');
  previewPreSaveBtn?.addEventListener('click', () => {
    showToast("Pre-save confirmed! You will be notified when Chemical Fires drops.");
  });
}
