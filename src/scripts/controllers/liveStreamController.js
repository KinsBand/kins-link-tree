/**
 * Live Stream Player Controller
 * Handles video playback, audio controls,
 * theater/fullscreen controls, tap-to-toggle overlays,
 * rotate-to-fullscreen on mobile, in-player settings overlay, and audience count jitter.
 */

import { showToast } from './toast.js';

export function initLiveStreamController() {
  const videoPlayer = document.getElementById('masterVideoPlayer');
  const playPauseBtn = document.getElementById('livePlayPauseBtn');
  const playPauseIcon = document.getElementById('livePlayPauseIcon');
  const volumeBtn = document.getElementById('liveVolumeBtn');
  const volumeIcon = document.getElementById('liveVolumeIcon');
  const volumeSlider = document.getElementById('liveVolumeSlider');
  const fullscreenBtn = document.getElementById('liveFullscreenBtn');
  const streamSettingsBtn = document.getElementById('openStreamSettingsBtn') || document.getElementById('liveStreamSettingsBtn');
  const videoWrapper = document.getElementById('masterVideoWrapper');
  const streamStatusBadge = document.getElementById('livePlayerStatusBadge');
  const audienceCounter = document.getElementById('liveHeaderAudienceCount');
  const audioMixSelect = document.getElementById('streamAudioMixSelect');
  const streamQualitySelect = document.getElementById('streamQualitySelect');
  const lowLatencyToggle = document.getElementById('streamLowLatencyToggle');
  const fullscreenTarget = document.getElementById('liveTheaterStageContainer') || videoWrapper;
  const exitTheaterBtn = document.getElementById('theaterExitFloatingBtn') || document.getElementById('playerInlineExitFullscreenBtn');

  let isPlaying = true;
  let isMuted = false;
  let currentVolume = 0.85;
  let currentAudience = 340;
  let controlsVisible = true;

  // =============================================
  // 1. Play / Pause Control
  // =============================================
  if (playPauseBtn && videoPlayer) {
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (videoPlayer.paused) {
        videoPlayer.play().then(() => {
          isPlaying = true;
          updatePlayState();
        }).catch(() => {
          isPlaying = false;
          updatePlayState();
        });
      } else {
        videoPlayer.pause();
        isPlaying = false;
        updatePlayState();
      }
    });

    videoPlayer.addEventListener('play', () => {
      isPlaying = true;
      updatePlayState();
    });

    videoPlayer.addEventListener('pause', () => {
      isPlaying = false;
      updatePlayState();
    });
  }

  function updatePlayState() {
    if (!playPauseIcon) return;
    if (isPlaying) {
      playPauseIcon.className = 'fa-solid fa-pause';
      playPauseBtn?.setAttribute('aria-label', 'Pause stream');
      if (streamStatusBadge) streamStatusBadge.textContent = 'LIVE • 1080p60';
    } else {
      playPauseIcon.className = 'fa-solid fa-play';
      playPauseBtn?.setAttribute('aria-label', 'Play stream');
      if (streamStatusBadge) streamStatusBadge.textContent = 'PAUSED';
    }
  }

  // =============================================
  // 2. Tap-to-Toggle Controls Visibility
  //    Click viewport → show controls
  //    Click viewport again → hide controls
  //    Clicking a button does NOT toggle (stopPropagation)
  // =============================================
  if (videoWrapper) {
    videoWrapper.addEventListener('click', (e) => {
      // Don't toggle if clicking on a button, link, or input
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
        return;
      }

      controlsVisible = !controlsVisible;
      if (controlsVisible) {
        videoWrapper.classList.remove('controls-hidden');
        videoWrapper.classList.remove('controls-idle-hidden');
      } else {
        videoWrapper.classList.add('controls-hidden');
      }
    });
  }

  // =============================================
  // 3. Volume & Mute Controls
  // =============================================
  if (volumeBtn && videoPlayer) {
    volumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      videoPlayer.muted = isMuted;
      updateVolumeUI();
    });
  }

  if (volumeSlider && videoPlayer) {
    volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      currentVolume = val;
      videoPlayer.volume = val;
      isMuted = val === 0;
      videoPlayer.muted = isMuted;
      updateVolumeUI();
    });

    volumeSlider.addEventListener('click', (e) => e.stopPropagation());
  }

  function updateVolumeUI() {
    if (!volumeIcon) return;
    if (isMuted || videoPlayer?.volume === 0) {
      volumeIcon.className = 'fa-solid fa-volume-xmark';
      if (volumeSlider) volumeSlider.value = '0';
    } else if (videoPlayer && videoPlayer.volume < 0.5) {
      volumeIcon.className = 'fa-solid fa-volume-low';
      if (volumeSlider) volumeSlider.value = String(videoPlayer.volume);
    } else {
      volumeIcon.className = 'fa-solid fa-volume-high';
      if (volumeSlider && videoPlayer) volumeSlider.value = String(videoPlayer.volume);
    }
  }

  // =============================================
  // 4. Venue Copy Pill Handler
  // =============================================
  const venueCopyBtn = document.getElementById('venueCopyPillBtn');
  const venueCopyIcon = document.getElementById('venueCopyIcon');

  if (venueCopyBtn) {
    venueCopyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const venueAddress = "The Cambridge Hotel, 789 Hunter St, Newcastle NSW 2300";
      navigator.clipboard.writeText(venueAddress).then(() => {
        if (venueCopyIcon) {
          venueCopyIcon.className = 'fa-solid fa-check venue-copy-icon text-success';
          setTimeout(() => {
            venueCopyIcon.className = 'fa-regular fa-copy venue-copy-icon';
          }, 1800);
        }
        showToast('📍 The Cambridge Hotel address copied to clipboard!', 'success');
      }).catch(() => {
        showToast('📍 The Cambridge Hotel, 789 Hunter St, Newcastle NSW', 'info');
      });
    });
  }

  // =============================================
  // 5. Fullscreen / Theater / Rotate-to-Fullscreen
  // =============================================
  function getFullscreenTarget() {
    return document.getElementById('liveTheaterStageContainer') || document.getElementById('masterVideoWrapper') || document.body;
  }

  function isNativeFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function isFullscreenActive() {
    const target = getFullscreenTarget();
    return isNativeFullscreen() || (target && target.classList.contains('theater-fullscreen-active')) || document.body.classList.contains('theater-mode-active');
  }

  function updateFullscreenUI(isFull) {
    const btns = document.querySelectorAll('#liveFullscreenBtn, [data-track="player:fullscreen"]');
    btns.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        if (isFull) {
          icon.className = 'fa-solid fa-compress';
        } else {
          icon.className = 'fa-solid fa-mobile-screen-button rotate-phone-icon';
        }
      }
      const labelText = isFull ? 'Exit Fullscreen' : 'Rotate to Fullscreen';
      btn.setAttribute('title', labelText);
      btn.setAttribute('aria-label', labelText);
    });
  }

  function enterTheaterFullscreen() {
    const target = getFullscreenTarget();
    if (!target) return;

    target.classList.add('theater-fullscreen-active');
    document.body.classList.add('theater-mode-active');
    document.documentElement.classList.add('theater-mode-active');
    
    // Attempt native fullscreen
    try {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (target.mozRequestFullScreen) {
        target.mozRequestFullScreen();
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
      }
    } catch (e) {}

    // On mobile, try to lock to landscape for true fullscreen stream experience
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}

    updateFullscreenUI(true);
    showToast('📱 Rotate phone for best fullscreen experience', 'info');
  }

  function exitTheaterFullscreen() {
    const target = getFullscreenTarget();
    if (target) {
      target.classList.remove('theater-fullscreen-active');
    }
    document.body.classList.remove('theater-mode-active');
    document.documentElement.classList.remove('theater-mode-active');

    try {
      if (isNativeFullscreen()) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (e) {}

    // Unlock orientation
    try {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (e) {}

    updateFullscreenUI(false);
  }

  function toggleTheaterFullscreen() {
    if (isFullscreenActive()) {
      exitTheaterFullscreen();
    } else {
      enterTheaterFullscreen();
    }
  }

  // Delegated click on document for fullscreen button & exit floating button
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    const fsBtn = target.closest('#liveFullscreenBtn, [data-track="player:fullscreen"]');
    if (fsBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggleTheaterFullscreen();
      return;
    }

    const exitBtn = target.closest('#theaterExitFloatingBtn, #playerInlineExitFullscreenBtn, [data-track="player:exit_fullscreen"]');
    if (exitBtn) {
      e.preventDefault();
      e.stopPropagation();
      exitTheaterFullscreen();
      return;
    }
  });

  // Double-click on video wrapper to toggle fullscreen
  if (videoWrapper) {
    videoWrapper.addEventListener('dblclick', (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
        return;
      }
      e.preventDefault();
      toggleTheaterFullscreen();
    });
  }

  // Keyboard shortcut listener ('KeyF' / 'f' to toggle, 'Escape' to exit)
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );

    if (!isTyping && (e.key === 'f' || e.key === 'F' || e.code === 'KeyF')) {
      e.preventDefault();
      toggleTheaterFullscreen();
    } else if (e.key === 'Escape' && isFullscreenActive()) {
      exitTheaterFullscreen();
    }
  });

  // Native browser fullscreen change listeners to sync state
  const handleNativeFullscreenChange = () => {
    const isNative = isNativeFullscreen();
    const target = getFullscreenTarget();
    if (isNative) {
      target?.classList.add('theater-fullscreen-active');
      document.body.classList.add('theater-mode-active');
      updateFullscreenUI(true);
    } else if (!target?.classList.contains('theater-fullscreen-active')) {
      document.body.classList.remove('theater-mode-active');
      updateFullscreenUI(false);
    }
  };

  document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleNativeFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleNativeFullscreenChange);

  // =============================================
  // 6. In-Player Stream Settings Overlay Trigger
  // =============================================
  if (streamSettingsBtn) {
    streamSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const settingsModal = document.getElementById('liveStreamSettingsModal');
      if (settingsModal) {
        settingsModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      }
    });
  }

  // =============================================
  // 7. Settings Modal Handlers
  // =============================================
  if (audioMixSelect) {
    audioMixSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      let label = 'Soundboard Direct Feed';
      if (selected === 'pit') label = 'Pit Ambience & Crowd Mic';
      if (selected === 'stereo') label = 'FOH Stereo Room Mix';
      showToast(`Audio mix switched to: ${label}`, 'success');
    });
  }

  if (streamQualitySelect) {
    streamQualitySelect.addEventListener('change', (e) => {
      const q = e.target.value;
      showToast(`Stream quality locked to: ${q.toUpperCase()}`, 'info');
    });
  }

  if (lowLatencyToggle) {
    lowLatencyToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      showToast(enabled ? '⚡ Ultra-Low Latency Mode Enabled (~1.1s)' : 'Standard Buffer Mode Enabled (~3.5s)', 'info');
    });
  }

  // =============================================
  // 8. Audience Counter Jitter Simulation
  // =============================================
  if (audienceCounter) {
    setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2;
      currentAudience = Math.max(310, Math.min(380, currentAudience + delta));
      audienceCounter.textContent = `${currentAudience} watching`;
    }, 4500);
  }
}
