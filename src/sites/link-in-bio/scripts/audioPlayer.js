import { showToast } from './toast.js';
import { getITunesTrackData, loadAlbumArt } from './inspirationVault.js';

let isPlayingAudio = false;
let currentPlayingTrack = null;

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

  function notifyPlaybackState() {
    window.dispatchEvent(new CustomEvent('trackPlaybackStateChanged', {
      detail: { track: currentPlayingTrack, isPlaying: isPlayingAudio }
    }));
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
      // Use progressive loading for mini player too
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

    // Toggle play/pause if user clicks the currently active song
    if (currentPlayingTrack && currentPlayingTrack.title === trackObj.title) {
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) vaultAudioPlayer.play().catch(() => {});
        else vaultAudioPlayer.pause();
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

    // 1. Immediately set existing gathered coverUrl / artworkUrl if present
    let coverUrl = trackObj.coverUrl || trackObj.artworkUrl;
    let previewUrl = trackObj.previewUrl;

    if (coverUrl) {
      setMiniPlayerCover(coverUrl);
    } else {
      setMiniPlayerCover(null);
    }

    // 2. Fetch missing meta (cover artwork or 30s preview URL) if not yet gathered
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

    // 3. Play track audio
    if (vaultAudioPlayer && previewUrl) {
      vaultAudioPlayer.src = previewUrl;
      vaultAudioPlayer.play().then(() => {
        isPlayingAudio = true;
        updateToggleBtnState(true);
        showToast(`Now Playing: "${trackObj.title}" by ${trackObj.artist}`);
      }).catch(err => {
        console.warn('Playback error:', err);
        isPlayingAudio = false;
        updateToggleBtnState(false);
        showToast(`Unable to play preview for "${trackObj.title}"`);
      });
    } else {
      isPlayingAudio = false;
      updateToggleBtnState(false);
      showToast(`Audio preview unavailable for "${trackObj.title}"`);
    }
  };

  // Sync native audio events
  if (vaultAudioPlayer) {
    vaultAudioPlayer.addEventListener('ended', () => {
      isPlayingAudio = false;
      updateToggleBtnState(false);
    });
  }

  if (audioBarStreamBtn) {
    audioBarStreamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStreamDrawer();
    });
  }

  if (audioBarToggleBtn) {
    audioBarToggleBtn.addEventListener('click', () => {
      if (!currentPlayingTrack) return;
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) vaultAudioPlayer.play().catch(() => {});
        else vaultAudioPlayer.pause();
      }
      updateToggleBtnState(isPlayingAudio);
    });
  }

  if (audioBarCloseBtn) {
    audioBarCloseBtn.addEventListener('click', () => {
      if (vaultAudioPlayer) vaultAudioPlayer.pause();
      closeMiniPlayer();
    });
  }
}
