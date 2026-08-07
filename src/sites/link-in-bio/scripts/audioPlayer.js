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
  const audioBarCoverImg = document.getElementById('audioBarCoverImg');
  const audioBarFallbackIcon = document.getElementById('audioBarFallbackIcon');
  const vaultAudioPlayer = document.getElementById('vaultAudioPlayer');

  function notifyPlaybackState() {
    window.dispatchEvent(new CustomEvent('trackPlaybackStateChanged', {
      detail: { track: currentPlayingTrack, isPlaying: isPlayingAudio }
    }));
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
