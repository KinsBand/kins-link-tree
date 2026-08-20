/**
 * Live Setlist & Lyrics Controller
 * Synchronizes selected song's live lyrics teleprompter,
 * calculates progress, and manages lyrics views.
 */

import { liveConfig } from '../../settings/live.config';

export function initLiveSetlistController() {
  const tabsModal = document.getElementById('liveTabsLyricsModal');
  const modalSongTitle = document.getElementById('tabsModalSongTitle');
  const modalSongKey = document.getElementById('tabsModalSongKey');
  const modalSongTempo = document.getElementById('tabsModalSongTempo');
  const lyricsTeleprompter = document.getElementById('liveLyricsTeleprompterList');
  const closeDrawerBtn = document.getElementById('closeTabsLyricsDrawer');

  // In-page stage lyrics component elements
  const stageSongTitle = document.getElementById('stageLyricsSongTitle');
  const stageKeyPill = document.getElementById('stageLyricsKeyPill');
  const stageTempoPill = document.getElementById('stageLyricsTempoPill');
  const stageLyricsList = document.getElementById('stageLyricsList');

  let currentSongData = liveConfig.setlist.find(s => s.status === 'active') || liveConfig.setlist[0];

  function updateInPageLyricsStage(song) {
    if (!song) return;
    currentSongData = song;

    if (stageSongTitle) {
      stageSongTitle.textContent = song.title || 'Untitled Track';
    }

    if (stageKeyPill) {
      if (song.key) {
        stageKeyPill.textContent = song.key;
        stageKeyPill.style.display = '';
      } else {
        stageKeyPill.style.display = 'none';
      }
    }

    if (stageTempoPill) {
      if (song.tempo) {
        stageTempoPill.textContent = song.tempo;
        stageTempoPill.style.display = '';
      } else {
        stageTempoPill.style.display = 'none';
      }
    }

    if (stageLyricsList) {
      stageLyricsList.innerHTML = '';
      if (song.lyrics && song.lyrics.length > 0) {
        song.lyrics.forEach((line, idx) => {
          const li = document.createElement('li');
          const isHighlighted = (song.status === 'active' && idx === 3) || (idx === 0 && song.lyrics.length === 1);
          li.className = `stage-lyrics-line ${isHighlighted ? 'active-singing-line' : ''}`;
          li.setAttribute('data-line-index', String(idx));
          li.innerHTML = `
            <span class="line-time">${formatSeconds(line.time)}</span>
            <span class="line-text">${escapeHtml(line.text)}</span>
          `;
          stageLyricsList.appendChild(li);
        });
      } else {
        stageLyricsList.innerHTML = `
          <li class="stage-lyrics-line">
            <span class="line-text">Lyrics coming soon for this track...</span>
          </li>
        `;
      }
    }
  }

  function openDrawer(songId = null) {
    if (songId) {
      const found = liveConfig.setlist.find(s => s.id === songId);
      if (found) currentSongData = found;
    }

    // Also update in-page lyrics stage
    updateInPageLyricsStage(currentSongData);

    if (!tabsModal) return;

    // Populate song title
    if (modalSongTitle) {
      modalSongTitle.textContent = currentSongData.title || 'Untitled Track';
    }

    // Populate Key metadata
    if (modalSongKey) {
      if (currentSongData.key) {
        modalSongKey.textContent = currentSongData.key.startsWith('Key:') 
          ? currentSongData.key 
          : `Key: ${currentSongData.key}`;
        modalSongKey.style.display = '';
      } else {
        modalSongKey.style.display = 'none';
      }
    }

    // Populate Tempo metadata
    if (modalSongTempo) {
      if (currentSongData.tempo) {
        modalSongTempo.textContent = currentSongData.tempo.startsWith('Tempo:') 
          ? currentSongData.tempo 
          : `Tempo: ${currentSongData.tempo}`;
        modalSongTempo.style.display = '';
      } else {
        modalSongTempo.style.display = 'none';
      }
    }

    // Populate lyrics teleprompter list
    if (lyricsTeleprompter) {
      lyricsTeleprompter.innerHTML = '';
      if (currentSongData.lyrics && currentSongData.lyrics.length > 0) {
        currentSongData.lyrics.forEach((line, index) => {
          const li = document.createElement('li');
          const isHighlighted = (currentSongData.status === 'active' && index === 3) || (index === 0 && currentSongData.lyrics.length === 1);
          li.className = `lyrics-line-item ${isHighlighted ? 'active-singing-line' : ''}`;
          li.innerHTML = `
            <span class="lyrics-timestamp">${formatSeconds(line.time)}</span>
            <span class="lyrics-text">${escapeHtml(line.text)}</span>
          `;
          lyricsTeleprompter.appendChild(li);
        });
      } else {
        lyricsTeleprompter.innerHTML = '<li class="lyrics-line-item"><em>Lyrics coming soon for this track...</em></li>';
      }
    }

    // Show modal & set body modal open class
    tabsModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  // Switch to stage tab helper
  function triggerStageTabSwitch(tabName) {
    if (typeof window.switchStageTab === 'function') {
      window.switchStageTab(tabName);
    } else {
      const tabBtn = document.querySelector(`.live-stage-tab-btn[data-tab-target="${tabName}"]`);
      if (tabBtn) tabBtn.click();
    }
  }

  // Bind All Song Rows in Setlist (Clicking any song updates lyrics and switches to lyrics tab)
  const songRows = document.querySelectorAll('.setlist-song-item');
  songRows.forEach(row => {
    row.addEventListener('click', () => {
      const songId = row.getAttribute('data-song-id');
      const found = liveConfig.setlist.find(s => s.id === songId);
      if (found) {
        updateInPageLyricsStage(found);
        triggerStageTabSwitch('lyrics');
      }
    });

    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const songId = row.getAttribute('data-song-id');
        const found = liveConfig.setlist.find(s => s.id === songId);
        if (found) {
          updateInPageLyricsStage(found);
          triggerStageTabSwitch('lyrics');
        }
      }
    });
  });

  // Close Drawer Helper
  function closeDrawer() {
    if (tabsModal) {
      tabsModal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
  }

  closeDrawerBtn?.addEventListener('click', closeDrawer);

  // Close on Backdrop Click
  tabsModal?.addEventListener('click', (e) => {
    if (e.target === tabsModal) {
      closeDrawer();
    }
  });

  // Close on Escape Key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tabsModal && !tabsModal.classList.contains('hidden')) {
      closeDrawer();
    }
  });

  // Initial stage lyrics population
  updateInPageLyricsStage(currentSongData);
}

function formatSeconds(secs) {
  if (typeof secs !== 'number' || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
