import { openCoverVideoModal } from './videoModalController.js';
import { showToast } from './toast.js';
import { initLiveFanUploadForm } from './liveUploadController.js';
import { heroConfig } from '../../settings/hero.config';

// Config dates are venue-local (NSW). Resolve the true UTC instant incl. DST.
function tzOffsetMsAt(instantMs, timeZone) {
  try {
    const dtf = new Intl.DateTimeFormat('en-AU', {
      timeZone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const parts = dtf.formatToParts(new Date(instantMs));
    const get = (t) => Number((parts.find((p) => p.type === t) || {}).value) || 0;
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
    return asUtc - instantMs;
  } catch (e) {
    return 0;
  }
}

function venueLocalTimeToMs(dateStr) {
  if (!dateStr) return 0;
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) {
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  const naiveAsUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  let guess = naiveAsUtc;
  // Two passes converge on the correct instant for any fixed-offset zone w/ DST
  guess = naiveAsUtc - tzOffsetMsAt(guess, 'Australia/Sydney');
  guess = naiveAsUtc - tzOffsetMsAt(guess, 'Australia/Sydney');
  return guess;
}

// localStorage can throw (private mode / locked-down Safari) — never let it break the UI
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

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
      { key: 'preshow', label: '🟡 Pre-Show (Doors)' },
      { key: 'live_now', label: '🔴 Showtime (Live Now)' },
      { key: 'postshow', label: '🏁 Post-Show (Replay)' },
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
      showToast("Redirecting to Kins EP Pre-Order store...");
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
    showToast("Live tour dates and gig map coming soon! Stay tuned.");
  });

  // --- ACTIONS: POLL VOTING (server-persisted via /api/vote) ---
  const pollOptionBtns = document.querySelectorAll('.poll-option-btn');
  const POLL_SCOPE_PREFIX = 'hero-poll:';

  function pollScopeFor(pollType) {
    return `${POLL_SCOPE_PREFIX}${pollType}`;
  }

  async function fetchPollTallies(pollType) {
    try {
      const res = await fetch(`/api/vote?scope=${encodeURIComponent(pollScopeFor(pollType))}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.status === 'success' ? data.tallies : null;
    } catch (_) {
      return null;
    }
  }

  function calculateAndRevealPoll(pollType, votedOptionId, tallies) {
    const typeOptionBtns = document.querySelectorAll(`.poll-option-btn[data-poll-type="${pollType}"]`);
    const statusTag = document.querySelector(`.poll-status-${pollType}`);

    let totalVotes = 0;
    typeOptionBtns.forEach(btn => {
      totalVotes += Number((tallies && tallies[btn.getAttribute('data-option-id')]) || 0);
    });

    typeOptionBtns.forEach(btn => {
      const optId = btn.getAttribute('data-option-id');
      const pctEl = btn.querySelector('.poll-option-pct');
      const fillEl = btn.querySelector('.poll-progress-fill');

      if (votedOptionId && tallies && totalVotes > 0) {
        const votes = tallies[optId] || 0;
        const pct = Math.round((votes / totalVotes) * 100);

        if (pctEl) {
          pctEl.textContent = `${pct}%`;
          pctEl.classList.remove('hidden');
        }
        if (fillEl) {
          fillEl.style.width = `${pct}%`;
        }
      } else {
        if (pctEl) pctEl.classList.add('hidden');
        if (fillEl) fillEl.style.width = '0%';
      }

      if (optId === votedOptionId) {
        btn.classList.add('selected');
      } else {
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

  // Restore saved choice locally and hydrate REAL tallies from the server
  ['recording', 'setlist', 'merch', 'city'].forEach(async (pollType) => {
    const hasPollUI = document.querySelector(`.poll-option-btn[data-poll-type="${pollType}"]`);
    if (!hasPollUI) return;

    const saved = storageGet(`kins_poll_vote_${pollType}`);
    const tallies = await fetchPollTallies(pollType);
    if (tallies) {
      calculateAndRevealPoll(pollType, saved, tallies);
    } else if (saved) {
      calculateAndRevealPoll(pollType, saved, null);
    }
  });

  pollOptionBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const pollType = btn.getAttribute('data-poll-type');
      const optId = btn.getAttribute('data-option-id');
      if (!pollType || !optId || btn.dataset.voteBusy === 'true') return;

      const currentVote = storageGet(`kins_poll_vote_${pollType}`);
      const isDeselect = currentVote === optId;
      const nextChoice = isDeselect ? null : optId;

      btn.dataset.voteBusy = 'true';
      try {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope: pollScopeFor(pollType), choice: nextChoice })
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.status !== 'success') {
          showToast((data && data.message) || 'Your vote could not be saved. Please try again.');
          return;
        }

        if (isDeselect) {
          storageRemove(`kins_poll_vote_${pollType}`);
          showToast("Vote deselected.");
        } else {
          storageSet(`kins_poll_vote_${pollType}`, optId);
          showToast(currentVote ? "Vote updated!" : "Vote recorded! Thanks for building with Kins.");
        }

        const freshTallies = await fetchPollTallies(pollType);
        calculateAndRevealPoll(pollType, isDeselect ? null : optId, freshTallies);
      } catch (_) {
        showToast('Network issue — your vote was not saved.');
      } finally {
        delete btn.dataset.voteBusy;
      }
    });
  });

  // GIG / MYSTERY COUNTDOWN TIMER TICK
  // Date sourced from hero.config (single source of truth), interpreted as Sydney venue-local time.
  const cdDays = document.getElementById('heroCdDays') || document.getElementById('mysteryCdDays');
  const cdHours = document.getElementById('heroCdHours') || document.getElementById('mysteryCdHours');
  const cdMins = document.getElementById('heroCdMins') || document.getElementById('mysteryCdMins');
  const cdSecs = document.getElementById('heroCdSecs') || document.getElementById('mysteryCdSecs');
  const gigTargetTime = venueLocalTimeToMs(heroConfig?.poll?.setlist_song?.targetDate);
  let heroCountdownIntervalId = null;

  function updateCountdown() {
    const diff = gigTargetTime - Date.now();

    let d = 0, h = 0, mi = 0, s = 0;
    if (diff > 0) {
      d = Math.floor(diff / (1000 * 60 * 60 * 24));
      h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      mi = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      s = Math.floor((diff % (1000 * 60)) / 1000);
    }

    if (cdDays) cdDays.textContent = String(d).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(h).padStart(2, '0');
    if (cdMins) cdMins.textContent = String(mi).padStart(2, '0');
    if (cdSecs) cdSecs.textContent = String(s).padStart(2, '0');

    // Expired: write zeros once and stop ticking forever
    if (diff <= 0 && heroCountdownIntervalId !== null) {
      clearInterval(heroCountdownIntervalId);
      heroCountdownIntervalId = null;
    }
  }

  if (cdDays && cdHours && cdMins && cdSecs && gigTargetTime > 0) {
    updateCountdown();
    if (gigTargetTime > Date.now()) {
      heroCountdownIntervalId = setInterval(updateCountdown, 1000);
    }
  }

  // --- STATE 3: SONG PREVIEW PLAYER ---
  const previewPlayBtn = document.getElementById('previewPlayToggleBtn');
  const previewDiscBox = document.getElementById('previewDiscBox');
  const previewProgressFill = document.getElementById('previewProgressFill');
  const previewTimeCurrent = document.getElementById('previewTimeCurrent');
  let isPreviewPlaying = false;
  let previewTimer = null;
  let previewSeconds = 0;
  const previewAudioUrl = heroConfig?.preview?.inspired_demo?.audioUrl || '';
  let previewAudioEl = null;

  if (!previewAudioUrl) {
    // No real demo audio configured yet — hide the fake player controls
    // entirely rather than simulating playback (honest UI rule).
    if (previewPlayBtn) previewPlayBtn.style.display = 'none';
    if (previewProgressFill) previewProgressFill.parentElement.style.display = 'none';
    if (previewTimeCurrent) previewTimeCurrent.closest('.preview-time-row, .preview-progress-row')?.style.setProperty('display', 'none');
  }

  function stopPreviewPlayback() {
    isPreviewPlaying = false;
    clearInterval(previewTimer);
    if (previewAudioEl) {
      previewAudioEl.pause();
      previewAudioEl.currentTime = 0;
    }
    previewDiscBox?.classList.remove('spinning');
    previewPlayBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
  }

  previewPlayBtn?.addEventListener('click', () => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
      return;
    }

    isPreviewPlaying = true;
    previewPlayBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    previewDiscBox?.classList.add('spinning');

    try {
      if (!previewAudioEl) {
        previewAudioEl = new Audio(previewAudioUrl);
        previewAudioEl.volume = 0.8;
      }
      previewAudioEl.currentTime = 0;
      previewAudioEl.play().catch(() => {
        showToast('Preview unavailable right now.');
        stopPreviewPlayback();
      });
    } catch (_) {
      showToast('Preview unavailable right now.');
      stopPreviewPlayback();
      return;
    }

    previewTimer = setInterval(() => {
      previewSeconds += 1;
      if (previewSeconds > 30 || (previewAudioEl && previewAudioEl.ended)) {
        previewSeconds = 0;
        if (previewProgressFill) previewProgressFill.style.width = '0%';
        if (previewTimeCurrent) previewTimeCurrent.textContent = '0:00';
        stopPreviewPlayback();
        return;
      }

      const pct = (previewSeconds / 30) * 100;
      if (previewProgressFill) previewProgressFill.style.width = `${pct}%`;
      if (previewTimeCurrent) previewTimeCurrent.textContent = `0:${String(previewSeconds).padStart(2, '0')}`;
    }, 1000);

    showToast("Playing preview: Kins — Chemical Fires (Demo)");
  });

  const previewPreSaveBtn = document.getElementById('previewPreSaveBtn');
  previewPreSaveBtn?.addEventListener('click', () => {
    const topSubscribeBtn = document.getElementById('topSubscribeBtn');
    if (topSubscribeBtn) {
      topSubscribeBtn.click();
      showToast("Drop your email and you'll be first to hear Chemical Fires!", 'success');
    } else {
      showToast('Follow KINS on your streaming app to catch the release.');
    }
  });

  // --- ACTIONS: LIVESTREAM CTA TRIGGERS ---
  const heroLiveNotifyBtn = document.getElementById('heroLiveNotifyBtn');
  heroLiveNotifyBtn?.addEventListener('click', () => {
    const topSubscribeBtn = document.getElementById('topSubscribeBtn');
    if (topSubscribeBtn) {
      topSubscribeBtn.click();
    } else {
      showToast("You'll be notified as soon as KINS goes live!", "success");
    }
  });

  document.querySelectorAll('.hero-community-upload-btn, #heroLiveUploadBtn, #heroPostShowUploadBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const uploadModal = document.getElementById('liveUploadModal') || document.getElementById('communitySubmissionModal');
      if (uploadModal) {
        uploadModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      } else {
        window.location.href = `${window.location.origin}/live#upload`;
      }
    });
  });

  // Live Upload Shot Modal Handlers on Home Page
  const closeLiveUploadModalBtn = document.getElementById('closeLiveUploadModal');
  const liveUploadModal = document.getElementById('liveUploadModal');
  closeLiveUploadModalBtn?.addEventListener('click', () => {
    if (liveUploadModal) {
      liveUploadModal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
  });

  // Real upload submission (POST /api/fan-upload). Replaces the old fake-success handler.
  initLiveFanUploadForm();
}
