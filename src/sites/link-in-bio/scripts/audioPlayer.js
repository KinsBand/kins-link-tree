import { showToast } from './toast.js';
import { getITunesTrackData, loadAlbumArt } from './inspirationVault.js';

let isPlayingAudio = false;
let currentPlayingTrack = null;

// Realistic Web Audio API Vinyl Scratch Synthesizer
class VinylScratchSynthesizer {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.oscNode = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // Create 2-second white noise buffer with vinyl crackle pops
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const crackle = Math.random() > 0.994 ? (Math.random() * 1.8 - 0.9) : 0;
      output[i] = white * 0.12 + crackle;
    }
    this.noiseBuffer = noiseBuffer;
  }

  playNeedleDrop() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Needle drop audio warning:', e);
    }
  }

  startScratch() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this.isPlaying) return;

      const now = this.ctx.currentTime;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, now);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(1400, now);
      this.filterNode.Q.setValueAtTime(3.8, now);

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = this.noiseBuffer;
      this.noiseNode.loop = true;
      this.noiseNode.connect(this.filterNode);

      this.oscNode = this.ctx.createOscillator();
      this.oscNode.type = 'sawtooth';
      this.oscNode.frequency.setValueAtTime(240, now);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.22, now);
      this.oscNode.connect(oscGain);
      oscGain.connect(this.filterNode);

      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.noiseNode.start(now);
      this.oscNode.start(now);
      this.isPlaying = true;
    } catch (e) {
      console.warn('Start scratch error:', e);
    }
  }

  updateScratch(velocity) {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const speed = Math.abs(velocity); // px/ms
    const direction = velocity >= 0 ? 1 : -1;

    // Gain scales with scrub speed
    const targetGain = Math.min(0.42, Math.max(0.02, speed * 0.3));
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.015);

    // Realistic pitch curve for vinyl screech:
    // Forward scrub: ascending pitch
    // Backward scrub: descending lower pitch curve
    let targetFreq = direction > 0 ? (280 + speed * 650) : (170 + speed * 480);
    targetFreq = Math.min(2600, Math.max(90, targetFreq));

    this.oscNode.frequency.cancelScheduledValues(now);
    this.oscNode.frequency.setTargetAtTime(targetFreq, now, 0.015);

    const filterFreq = Math.min(5500, Math.max(500, 900 + speed * 1600));
    this.filterNode.frequency.cancelScheduledValues(now);
    this.filterNode.frequency.setTargetAtTime(filterFreq, now, 0.015);

    if (this.noiseNode && this.noiseNode.playbackRate) {
      const rate = Math.min(2.8, Math.max(0.4, speed * 0.85));
      this.noiseNode.playbackRate.setTargetAtTime(rate, now, 0.015);
    }
  }

  stopScratch() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.gainNode) {
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      }
      setTimeout(() => {
        if (this.noiseNode) {
          try { this.noiseNode.stop(); } catch (e) {}
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        if (this.oscNode) {
          try { this.oscNode.stop(); } catch (e) {}
          this.oscNode.disconnect();
          this.oscNode = null;
        }
        this.isPlaying = false;
      }, 80);
    } catch (e) {
      this.isPlaying = false;
    }
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function initAudioPlayer() {
  const bottomAudioBar = document.getElementById('bottomAudioBar');
  const audioBarTitle = document.getElementById('audioBarTitle');
  const audioBarArtist = document.getElementById('audioBarArtist');
  const audioBarToggleBtn = document.getElementById('audioBarToggleBtn');
  const audioBarCloseBtn = document.getElementById('audioBarCloseBtn');
  const audioBarStreamBtn = document.getElementById('audioBarStreamBtn');
  const audioBarCoverImg = document.getElementById('audioBarCoverImg');
  const audioBarFallbackIcon = document.getElementById('audioBarFallbackIcon');
  const vaultAudioPlayer = document.getElementById('vaultAudioPlayer');

  const audioBarTimelineProgress = document.getElementById('audioBarTimelineProgress');
  const vinylStylusWrapper = document.getElementById('vinylStylusWrapper');
  const audioBarTime = document.getElementById('audioBarTime');

  const streamDrawerPanel = document.getElementById('streamDrawerPanel');
  const streamDrawerSongName = document.getElementById('streamDrawerSongName');
  const streamLinkSpotify = document.getElementById('streamLinkSpotify');
  const streamLinkApple = document.getElementById('streamLinkApple');
  const streamLinkYoutube = document.getElementById('streamLinkYoutube');
  const streamLinkAmazon = document.getElementById('streamLinkAmazon');
  const streamLinkSoundcloud = document.getElementById('streamLinkSoundcloud');
  const streamLinkDeezer = document.getElementById('streamLinkDeezer');
  const streamLinkTidal = document.getElementById('streamLinkTidal');
  const streamLinkBandcamp = document.getElementById('streamLinkBandcamp');
  const streamLinkAudiomack = document.getElementById('streamLinkAudiomack');
  const streamLinkQobuz = document.getElementById('streamLinkQobuz');

  const vinylScratchSynth = new VinylScratchSynthesizer();
  let isScrubbing = false;
  let lastX = 0;
  let lastTime = 0;
  let animFrameId = null;

  function notifyPlaybackState() {
    window.dispatchEvent(new CustomEvent('trackPlaybackStateChanged', {
      detail: { track: currentPlayingTrack, isPlaying: isPlayingAudio }
    }));
  }

  function updateTimelineUI() {
    if (!vaultAudioPlayer || isScrubbing) return;
    const duration = vaultAudioPlayer.duration || 30;
    const currentTime = vaultAudioPlayer.currentTime || 0;
    const pct = Math.min(100, Math.max(0, (currentTime / duration) * 100));

    if (audioBarTimelineProgress) audioBarTimelineProgress.style.width = `${pct}%`;
    if (vinylStylusWrapper) vinylStylusWrapper.style.left = `${pct}%`;
    if (audioBarTime) {
      audioBarTime.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
  }

  function renderPlaybackLoop() {
    if (isPlayingAudio && vaultAudioPlayer && !isScrubbing) {
      updateTimelineUI();
      animFrameId = requestAnimationFrame(renderPlaybackLoop);
    }
  }

  function startTimelineAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderPlaybackLoop);
  }

  function stopTimelineAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function seekToPosition(clientX) {
    if (!bottomAudioBar || !vaultAudioPlayer) return;
    const rect = bottomAudioBar.getBoundingClientRect();
    const pctRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pct = pctRatio * 100;
    const duration = vaultAudioPlayer.duration || 30;
    const newTime = pctRatio * duration;

    if (isFinite(newTime)) {
      vaultAudioPlayer.currentTime = newTime;
    }

    if (audioBarTimelineProgress) audioBarTimelineProgress.style.width = `${pct}%`;
    if (vinylStylusWrapper) vinylStylusWrapper.style.left = `${pct}%`;
    if (audioBarTime) {
      audioBarTime.textContent = `${formatTime(newTime)} / ${formatTime(duration)}`;
    }
  }

  // Interactive Timeline Scrubbing with Vinyl Screech SFX
  if (bottomAudioBar) {
    bottomAudioBar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || !currentPlayingTrack) return;

      isScrubbing = true;
      bottomAudioBar.classList.add('is-scrubbing');
      try { bottomAudioBar.setPointerCapture(e.pointerId); } catch (err) {}

      lastX = e.clientX;
      lastTime = performance.now();

      vinylScratchSynth.playNeedleDrop();
      vinylScratchSynth.startScratch();
      seekToPosition(e.clientX);
    });

    bottomAudioBar.addEventListener('pointermove', (e) => {
      if (!isScrubbing) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX;
      const velocity = dx / dt;

      lastX = e.clientX;
      lastTime = now;

      if (vinylStylusWrapper) {
        if (velocity > 0.03) {
          vinylStylusWrapper.classList.add('tilt-forward');
          vinylStylusWrapper.classList.remove('tilt-backward');
        } else if (velocity < -0.03) {
          vinylStylusWrapper.classList.add('tilt-backward');
          vinylStylusWrapper.classList.remove('tilt-forward');
        }
      }

      vinylScratchSynth.updateScratch(velocity);
      seekToPosition(e.clientX);
    });

    const endScrubbing = (e) => {
      if (!isScrubbing) return;
      isScrubbing = false;
      bottomAudioBar.classList.remove('is-scrubbing');
      try { if (e && e.pointerId) bottomAudioBar.releasePointerCapture(e.pointerId); } catch (err) {}

      if (vinylStylusWrapper) {
        vinylStylusWrapper.classList.remove('tilt-forward', 'tilt-backward');
      }

      vinylScratchSynth.stopScratch();
      if (isPlayingAudio) startTimelineAnimation();
    };

    bottomAudioBar.addEventListener('pointerup', endScrubbing);
    bottomAudioBar.addEventListener('pointercancel', endScrubbing);
  }

  function updateStreamLinks(trackObj) {
    if (!trackObj) return;
    const query = encodeURIComponent(`${trackObj.artist || 'Kins'} ${trackObj.title}`);
    if (streamDrawerSongName) streamDrawerSongName.textContent = `"${trackObj.title}"`;

    if (streamLinkSpotify) streamLinkSpotify.href = `https://open.spotify.com/search/${query}`;
    if (streamLinkApple) streamLinkApple.href = `https://music.apple.com/us/search?term=${query}`;
    if (streamLinkYoutube) streamLinkYoutube.href = `https://music.youtube.com/search?q=${query}`;
    if (streamLinkAmazon) streamLinkAmazon.href = `https://music.amazon.com/search/${query}`;
    if (streamLinkSoundcloud) streamLinkSoundcloud.href = `https://soundcloud.com/search?q=${query}`;
    if (streamLinkDeezer) streamLinkDeezer.href = `https://www.deezer.com/search/${query}`;
    if (streamLinkTidal) streamLinkTidal.href = `https://listen.tidal.com/search?q=${query}`;
    if (streamLinkBandcamp) streamLinkBandcamp.href = `https://bandcamp.com/search?q=${query}`;
    if (streamLinkAudiomack) streamLinkAudiomack.href = `https://audiomack.com/search?q=${query}`;
    if (streamLinkQobuz) streamLinkQobuz.href = `https://www.qobuz.com/search?q=${query}`;
  }

  function toggleStreamDrawer(forceOpen) {
    if (!streamDrawerPanel || !audioBarStreamBtn) return;
    const shouldOpen = forceOpen !== undefined ? forceOpen : streamDrawerPanel.classList.contains('hidden');

    if (shouldOpen) {
      if (currentPlayingTrack) updateStreamLinks(currentPlayingTrack);
      streamDrawerPanel.classList.remove('hidden');
      void streamDrawerPanel.offsetWidth; // Force reflow
      streamDrawerPanel.classList.add('active-drawer');
      audioBarStreamBtn.classList.add('active');
      document.body.classList.add('stream-panel-open');
    } else {
      streamDrawerPanel.classList.remove('active-drawer');
      audioBarStreamBtn.classList.remove('active');
      document.body.classList.remove('stream-panel-open');
      setTimeout(() => {
        if (!audioBarStreamBtn.classList.contains('active')) {
          streamDrawerPanel.classList.add('hidden');
        }
      }, 300);
    }
  }

  function updateToggleBtnState(playing, loading = false) {
    if (!audioBarToggleBtn) return;
    audioBarToggleBtn.classList.remove('icon-morph');
    void audioBarToggleBtn.offsetWidth; // Force reflow
    if (loading) {
      audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
    } else {
      audioBarToggleBtn.innerHTML = `<i class="fa-solid ${playing ? 'fa-pause' : 'fa-play'}"></i>`;
      audioBarToggleBtn.classList.add('icon-morph');
    }
    notifyPlaybackState();
  }

  function setMiniPlayerCover(url) {
    if (url && audioBarCoverImg) {
      loadAlbumArt(audioBarCoverImg, url).then(() => {
        if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'none';
      }).catch(() => {
        if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'flex';
      });
    } else if (audioBarCoverImg) {
      audioBarCoverImg.src = '';
      audioBarCoverImg.classList.add('hidden');
      if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'flex';
    }
  }

  function openMiniPlayer() {
    if (!bottomAudioBar) return;
    bottomAudioBar.classList.remove('hidden', 'player-exiting');
    void bottomAudioBar.offsetWidth; // Force reflow
    bottomAudioBar.classList.add('active-player');
    document.body.classList.add('audio-bar-active');
  }

  function closeMiniPlayer() {
    if (!bottomAudioBar) return;
    stopTimelineAnimation();
    toggleStreamDrawer(false);
    bottomAudioBar.classList.remove('active-player');
    bottomAudioBar.classList.add('player-exiting');
    document.body.classList.remove('audio-bar-active');
    setTimeout(() => {
      bottomAudioBar.classList.add('hidden');
      bottomAudioBar.classList.remove('player-exiting');
    }, 350);
    isPlayingAudio = false;
    currentPlayingTrack = null;
    notifyPlaybackState();
  }

  window.playTrackPreview = async function(trackObj) {
    if (!trackObj || !trackObj.title) return;

    if (currentPlayingTrack && currentPlayingTrack.title === trackObj.title) {
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) {
          vaultAudioPlayer.play().catch(() => {});
          startTimelineAnimation();
        } else {
          vaultAudioPlayer.pause();
          stopTimelineAnimation();
        }
      }
      updateToggleBtnState(isPlayingAudio);
      showToast(isPlayingAudio ? `Resumed: "${trackObj.title}"` : `Paused: "${trackObj.title}"`);
      return;
    }

    currentPlayingTrack = trackObj;
    openMiniPlayer();
    updateStreamLinks(currentPlayingTrack);

    if (audioBarTitle) audioBarTitle.textContent = trackObj.title;
    if (audioBarArtist) audioBarArtist.textContent = trackObj.artist || 'Kins';

    let coverUrl = trackObj.coverUrl || trackObj.artworkUrl;
    let previewUrl = trackObj.previewUrl;

    if (coverUrl) {
      setMiniPlayerCover(coverUrl);
    } else {
      setMiniPlayerCover(null);
    }

    if (!previewUrl || !coverUrl) {
      updateToggleBtnState(false, true);
      const meta = await getITunesTrackData(trackObj.artist, trackObj.title);
      if (meta) {
        if (meta.previewUrl) {
          previewUrl = meta.previewUrl;
          trackObj.previewUrl = previewUrl;
        }
        if (meta.artworkUrl) {
          coverUrl = meta.artworkUrl;
          trackObj.coverUrl = coverUrl;
          trackObj.artworkUrl = coverUrl;
          setMiniPlayerCover(coverUrl);
        }
      }
    }

    if (vaultAudioPlayer && previewUrl) {
      vaultAudioPlayer.src = previewUrl;
      vaultAudioPlayer.play().then(() => {
        isPlayingAudio = true;
        startTimelineAnimation();
        updateToggleBtnState(true);
        showToast(`Now Playing: "${trackObj.title}" by ${trackObj.artist}`);
      }).catch(err => {
        console.warn('Playback error:', err);
        isPlayingAudio = false;
        stopTimelineAnimation();
        updateToggleBtnState(false);
        showToast(`Unable to play preview for "${trackObj.title}"`);
      });
    } else {
      isPlayingAudio = false;
      stopTimelineAnimation();
      updateToggleBtnState(false);
      showToast(`Audio preview unavailable for "${trackObj.title}"`);
    }
  };

  if (vaultAudioPlayer) {
    vaultAudioPlayer.addEventListener('play', () => {
      isPlayingAudio = true;
      startTimelineAnimation();
      updateToggleBtnState(true);
    });

    vaultAudioPlayer.addEventListener('pause', () => {
      isPlayingAudio = false;
      stopTimelineAnimation();
      updateToggleBtnState(false);
    });

    vaultAudioPlayer.addEventListener('ended', () => {
      isPlayingAudio = false;
      stopTimelineAnimation();
      updateTimelineUI();
      updateToggleBtnState(false);
    });

    vaultAudioPlayer.addEventListener('timeupdate', updateTimelineUI);
    vaultAudioPlayer.addEventListener('loadedmetadata', updateTimelineUI);
  }

  if (audioBarStreamBtn) {
    audioBarStreamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStreamDrawer();
    });
  }

  if (audioBarToggleBtn) {
    audioBarToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentPlayingTrack) return;
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) {
          vaultAudioPlayer.play().catch(() => {});
          startTimelineAnimation();
        } else {
          vaultAudioPlayer.pause();
          stopTimelineAnimation();
        }
      }
      updateToggleBtnState(isPlayingAudio);
    });
  }

  if (audioBarCloseBtn) {
    audioBarCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (vaultAudioPlayer) vaultAudioPlayer.pause();
      closeMiniPlayer();
    });
  }
}

