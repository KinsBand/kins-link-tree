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

  window.playTrackPreview = async function(trackObj) {
    if (currentPlayingTrack && currentPlayingTrack.title === trackObj.title) {
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) vaultAudioPlayer.play();
        else vaultAudioPlayer.pause();
      }
      if (audioBarToggleBtn) {
        audioBarToggleBtn.innerHTML = `<i class="fa-solid ${isPlayingAudio ? 'fa-pause' : 'fa-play'}"></i>`;
      }
      showToast(isPlayingAudio ? `Resumed: "${trackObj.title}"` : `Paused: "${trackObj.title}"`);
      return;
    }

    currentPlayingTrack = trackObj;

    if (bottomAudioBar) {
      bottomAudioBar.classList.remove('hidden');
      bottomAudioBar.classList.add('active-player');
      document.body.classList.add('audio-bar-active');
    }

    if (audioBarTitle) audioBarTitle.textContent = trackObj.title;
    if (audioBarArtist) audioBarArtist.textContent = trackObj.artist;

    let previewUrl = trackObj.previewUrl;
    if (!previewUrl) {
      if (audioBarToggleBtn) audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
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
        if (audioBarToggleBtn) audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        showToast(`Now Playing: "${trackObj.title}" by ${trackObj.artist}`);
      }).catch(err => {
        isPlayingAudio = false;
        if (audioBarToggleBtn) audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
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
      audioBarToggleBtn.innerHTML = `<i class="fa-solid ${isPlayingAudio ? 'fa-pause' : 'fa-play'}"></i>`;
    });
  }

  if (audioBarCloseBtn) {
    audioBarCloseBtn.addEventListener('click', () => {
      if (vaultAudioPlayer) vaultAudioPlayer.pause();
      if (bottomAudioBar) bottomAudioBar.classList.add('hidden');
      document.body.classList.remove('audio-bar-active');
      isPlayingAudio = false;
      currentPlayingTrack = null;
    });
  }
}
