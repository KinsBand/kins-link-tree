import { showToast } from './toast.js';
import { getITunesTrackData } from './inspirationVault.js';

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
    void audioBarToggleBtn.offsetWidth; // Force reflow to re-trigger CSS keyframe
    if (loading) {
      audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
    } else {
      audioBarToggleBtn.innerHTML = `<i class="fa-solid ${playing ? 'fa-pause' : 'fa-play'}"></i>`;
      audioBarToggleBtn.classList.add('icon-morph');
    }
    notifyPlaybackState();
  }

  function openMiniPlayer() {
    if (!bottomAudioBar) return;
    bottomAudioBar.classList.remove('hidden', 'player-exiting');
    void bottomAudioBar.offsetWidth; // Force reflow for slide-up transition
    bottomAudioBar.classList.add('active-player');
    document.body.classList.add('audio-bar-active');
  }

  function closeMiniPlayer() {
    if (!bottomAudioBar) return;
    bottomAudioBar.classList.remove('active-player');
    bottomAudioBar.classList.add('player-exiting');
    setTimeout(() => {
      bottomAudioBar.classList.add('hidden');
      bottomAudioBar.classList.remove('player-exiting');
    }, 350);
    isPlayingAudio = false;
    currentPlayingTrack = null;
    notifyPlaybackState();
  }

  window.playTrackPreview = async function(trackObj) {
    if (currentPlayingTrack && currentPlayingTrack.title === trackObj.title) {
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) vaultAudioPlayer.play();
        else vaultAudioPlayer.pause();
      }
      updateToggleBtnState(isPlayingAudio);
      showToast(isPlayingAudio ? `Resumed: "${trackObj.title}"` : `Paused: "${trackObj.title}"`);
      return;
    }

    currentPlayingTrack = trackObj;
    openMiniPlayer();

    if (audioBarTitle) audioBarTitle.textContent = trackObj.title;
    if (audioBarArtist) audioBarArtist.textContent = trackObj.artist;

    let previewUrl = trackObj.previewUrl;
    if (!previewUrl) {
      updateToggleBtnState(false, true);
      const meta = await getITunesTrackData(trackObj.artist, trackObj.title);
      if (meta) {
        if (meta.previewUrl) previewUrl = meta.previewUrl;
        if (meta.artworkUrl && audioBarCoverImg) {
          audioBarCoverImg.src = meta.artworkUrl;
          audioBarCoverImg.classList.remove('hidden');
          if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'none';
        }
      }
    }

    if (vaultAudioPlayer && previewUrl) {
      vaultAudioPlayer.src = previewUrl;
      vaultAudioPlayer.play().then(() => {
        isPlayingAudio = true;
        updateToggleBtnState(true);
        showToast(`Now Playing: "${trackObj.title}" by ${trackObj.artist}`);
      }).catch(err => {
        isPlayingAudio = false;
        updateToggleBtnState(false);
      });
    }
  };

  if (audioBarToggleBtn) {
    audioBarToggleBtn.addEventListener('click', () => {
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) vaultAudioPlayer.play();
        else vaultAudioPlayer.pause();
      }
      updateToggleBtnState(isPlayingAudio);
    });
  }

  if (audioBarCloseBtn) {
    audioBarCloseBtn.addEventListener('click', () => {
      if (vaultAudioPlayer) vaultAudioPlayer.pause();
      closeMiniPlayer();
      document.body.classList.remove('audio-bar-active');
    });
  }
}
