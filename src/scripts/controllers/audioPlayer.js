import { showToast } from './toast.js';
import { getITunesTrackData, loadAlbumArt, INSPIRED_ARTISTS_DATA } from './inspirationVault.js';

let isPlayingAudio = false;
let currentPlayingTrack = null;
let hasTransitionedToActive = false;

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
    const speed = Math.abs(velocity);
    const direction = velocity >= 0 ? 1 : -1;

    const targetGain = Math.min(0.42, Math.max(0.02, speed * 0.3));
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.015);

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

export function stopVinylSpinSmoothly(element, shouldSpin) {
  if (!element) return;

  if (shouldSpin) {
    element.classList.remove('vinyl-spin-decelerate');
    element.style.transform = '';
    element.classList.add('vinyl-spin-anim');
  } else {
    const isSpinning = element.classList.contains('vinyl-spin-anim') || 
                       element.classList.contains('spinning') || 
                       element.classList.contains('vinyl-spin-once');

    if (isSpinning || (element.style.transform && element.style.transform !== 'rotate(0deg)')) {
      let currentAngle = 0;
      try {
        const style = window.getComputedStyle(element);
        const transform = style.transform || style.webkitTransform;
        if (transform && transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          currentAngle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
          if (currentAngle < 0) currentAngle += 360;
        }
      } catch (e) {}

      // Remove active continuous spin classes and pin element at current exact angle
      element.classList.remove('vinyl-spin-anim', 'spinning', 'vinyl-spin-once');
      element.style.transform = `rotate(${currentAngle}deg)`;

      // Calculate forward deceleration arc to the next upright 360° position (0°)
      let remainder = currentAngle % 360;
      let extraDeg = 360 - remainder;
      if (extraDeg < 90) {
        extraDeg += 360; // guarantee a realistic momentum friction deceleration curve
      }
      const targetAngle = currentAngle + extraDeg;

      requestAnimationFrame(() => {
        element.classList.add('vinyl-spin-decelerate');
        element.style.transform = `rotate(${targetAngle}deg)`;

        setTimeout(() => {
          // Once deceleration completes, finalize inline style to upright 0deg smoothly without snapping
          element.classList.remove('vinyl-spin-decelerate');
          element.style.transform = 'rotate(0deg)';
        }, 720);
      });
    } else {
      element.classList.remove('vinyl-spin-decelerate', 'vinyl-spin-anim', 'spinning');
      element.style.transform = 'rotate(0deg)';
    }
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function getAllInspiredTracks() {
  const tracks = [];
  if (!INSPIRED_ARTISTS_DATA) return tracks;
  Object.values(INSPIRED_ARTISTS_DATA).forEach(artistObj => {
    if (artistObj.pages) {
      artistObj.pages.forEach(page => {
        page.forEach(track => tracks.push(track));
      });
    }
  });
  return tracks;
}

export function initAudioPlayer() {
  const bottomAudioBar = document.getElementById('bottomAudioBar');
  const deckIdleView = document.getElementById('deckIdleView');
  const deckActiveView = document.getElementById('deckActiveView');
  const idlePlayBtn = document.getElementById('idlePlayBtn');

  const audioBarTitle = document.getElementById('audioBarTitle');
  const audioBarArtist = document.getElementById('audioBarArtist');
  const audioBarToggleBtn = document.getElementById('audioBarToggleBtn');
  const audioBarStreamBtn = document.getElementById('audioBarStreamBtn');
  const audioBarCoverImg = document.getElementById('audioBarCoverImg');
  const audioBarFallbackIcon = document.getElementById('audioBarFallbackIcon');
  const audioBarIconBox = document.getElementById('audioBarIconBox');
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

  // Load stacked album covers in the idle view on initialization
  async function loadStackedAlbumCovers() {
    const cover1 = document.getElementById('stackCover1');
    const cover2 = document.getElementById('stackCover2');
    const cover3 = document.getElementById('stackCover3');

    const featured = [
      { artist: 'The Cure', title: 'Just Like Heaven' },
      { artist: 'Weezer', title: 'Do You Wanna Get High?' },
      { artist: 'Pulp', title: 'Common People' }
    ];

    const elements = [cover1, cover2, cover3];

    featured.forEach(async (item, index) => {
      const imgEl = elements[index];
      if (!imgEl) return;
      try {
        const meta = await getITunesTrackData(item.artist, item.title);
        if (meta && meta.artworkUrl) {
          await loadAlbumArt(imgEl, meta.artworkUrl, meta.rawArtworkUrl);
          const fallback = imgEl.parentElement ? imgEl.parentElement.querySelector('.stack-fallback-icon') : null;
          if (fallback) fallback.style.display = 'none';
        }
      } catch (err) {
        console.warn('Failed to load stacked album cover:', err);
      }
    });
  }

  loadStackedAlbumCovers();

  let cachedMusicSectionRect = null;

  function updateCachedMusicSectionRect() {
    const musicSection = document.getElementById('deckMusicSection');
    if (musicSection) {
      cachedMusicSectionRect = musicSection.getBoundingClientRect();
    }
  }

  window.addEventListener('resize', updateCachedMusicSectionRect, { passive: true });

  function showActiveView() {
    if (hasTransitionedToActive) return;
    hasTransitionedToActive = true;

    const deckMusicSection = document.getElementById('deckMusicSection');

    if (deckIdleView) deckIdleView.classList.add('hidden');
    if (deckActiveView) deckActiveView.classList.remove('hidden');

    if (deckMusicSection) {
      deckMusicSection.classList.remove('is-transitioning');
      requestAnimationFrame(() => {
        deckMusicSection.classList.add('is-transitioning');
      });
    }

    updateCachedMusicSectionRect();

    setTimeout(() => {
      if (deckMusicSection) deckMusicSection.classList.remove('is-transitioning');
      if (vinylStylusWrapper) {
        vinylStylusWrapper.classList.add('stylus-visible');
      }
    }, 450);
  }

  function showIdleView() {
    hasTransitionedToActive = false;
    const deckMusicSection = document.getElementById('deckMusicSection');
    if (deckMusicSection) deckMusicSection.classList.remove('is-transitioning');
    if (deckIdleView) deckIdleView.classList.remove('hidden');
    if (deckActiveView) deckActiveView.classList.add('hidden');
    if (vinylStylusWrapper) vinylStylusWrapper.classList.remove('stylus-visible');
  }

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
    if (!vaultAudioPlayer) return;
    if (!cachedMusicSectionRect) {
      updateCachedMusicSectionRect();
    }
    if (!cachedMusicSectionRect || cachedMusicSectionRect.width === 0) return;

    const rect = cachedMusicSectionRect;
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

  // Interactive Timeline Scrubbing with cached layout bounds
  if (bottomAudioBar) {
    bottomAudioBar.addEventListener('pointerdown', (e) => {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('button, .deck-gig-section, .deck-divider') || !currentPlayingTrack) return;

      isScrubbing = true;
      updateCachedMusicSectionRect();
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

      if (vaultAudioPlayer) {
        const duration = vaultAudioPlayer.duration || 30;
        if (vaultAudioPlayer.currentTime >= duration - 0.05) {
          vaultAudioPlayer.currentTime = duration;
          isPlayingAudio = false;
          stopTimelineAnimation();
          updateTimelineUI();
          updateToggleBtnState(false);
          return;
        }
      }

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
      requestAnimationFrame(() => {
        streamDrawerPanel.classList.add('active-drawer');
        audioBarStreamBtn.classList.add('active');
        document.body.classList.add('stream-panel-open');
      });
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

    const currentIsPause = audioBarToggleBtn.querySelector('.fa-pause') !== null;
    const currentIsSpinner = audioBarToggleBtn.querySelector('.fa-circle-notch') !== null;

    if (loading && !currentIsSpinner) {
      audioBarToggleBtn.classList.remove('icon-morph');
      audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
    } else if (!loading && (currentIsPause !== playing || currentIsSpinner)) {
      audioBarToggleBtn.classList.remove('icon-morph');
      audioBarToggleBtn.innerHTML = `<i class="fa-solid ${playing ? 'fa-pause' : 'fa-play'}"></i>`;
      requestAnimationFrame(() => {
        audioBarToggleBtn.classList.add('icon-morph');
        setTimeout(() => audioBarToggleBtn.classList.remove('icon-morph'), 350);
      });
    }

    if (audioBarIconBox) {
      stopVinylSpinSmoothly(audioBarIconBox, playing);
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

  function playRandomInspirationSong() {
    const allTracks = getAllInspiredTracks();
    if (allTracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allTracks.length);
    const randomTrack = allTracks[randomIndex];
    if (window.playTrackPreview) {
      window.playTrackPreview(randomTrack);
    }
  }

  // Click on idle view triggers random song
  if (deckIdleView) {
    deckIdleView.addEventListener('click', (e) => {
      e.stopPropagation();
      playRandomInspirationSong();
    });
  }

  if (idlePlayBtn) {
    idlePlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playRandomInspirationSong();
    });
  }

  function triggerSongChangeWipe() {
    const deckMusicSection = document.getElementById('deckMusicSection');
    if (!deckMusicSection) return;

    deckMusicSection.classList.remove('is-song-changing');
    void deckMusicSection.offsetWidth; // force reflow
    deckMusicSection.classList.add('is-song-changing');

    // Needle lift micro-interaction on song change
    if (vinylStylusWrapper) {
      vinylStylusWrapper.classList.add('tilt-backward');
      setTimeout(() => {
        vinylStylusWrapper.classList.remove('tilt-backward');
      }, 450);
    }

    setTimeout(() => {
      deckMusicSection.classList.remove('is-song-changing');
    }, 850);
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

    if (!hasTransitionedToActive) {
      showActiveView();
    } else {
      triggerSongChangeWipe();
    }

    currentPlayingTrack = trackObj;
    updateStreamLinks(currentPlayingTrack);

    if (audioBarTitle) {
      audioBarTitle.textContent = trackObj.title;
      audioBarTitle.classList.remove('is-scrolling');
      requestAnimationFrame(() => {
        const parent = audioBarTitle.parentElement;
        if (parent && audioBarTitle.scrollWidth > parent.clientWidth + 2) {
          const scrollDist = -(audioBarTitle.scrollWidth - parent.clientWidth + 16);
          audioBarTitle.style.setProperty('--scroll-dist', `${scrollDist}px`);
          audioBarTitle.classList.add('is-scrolling');
        }
      });
    }
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
      if (isScrubbing) return;
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
      showToast(isPlayingAudio ? `Resumed: "${currentPlayingTrack.title}"` : `Paused: "${currentPlayingTrack.title}"`, 'music');
    });
  }
}
