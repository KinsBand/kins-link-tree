/* ==========================================================================
   The Kins (@KinsBandOfficial) — Venue EPK & Booking Portal Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------------------------------------------------------
  // 1. Viewport Switcher Bar (Mobile Phone vs Full Width Desktop Preview)
  // ------------------------------------------------------------------------
  const toggleMobileBtn = document.getElementById('toggleMobileView');
  const toggleFullBtn = document.getElementById('toggleFullView');
  const appWrapper = document.querySelector('.app-wrapper');

  if (toggleMobileBtn && toggleFullBtn && appWrapper) {
    toggleMobileBtn.addEventListener('click', () => {
      toggleMobileBtn.classList.add('active');
      toggleFullBtn.classList.remove('active');
      appWrapper.classList.remove('full-desktop');
      showToast('Switched to Mobile Frame Preview');
    });

    toggleFullBtn.addEventListener('click', () => {
      toggleFullBtn.classList.add('active');
      toggleMobileBtn.classList.remove('active');
      appWrapper.classList.add('full-desktop');
      showToast('Switched to Full Width Desktop View');
    });
  }

  // Mobile Dropdown Navigation Menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDropdownNav = document.getElementById('mobileDropdownNav');

  if (mobileMenuBtn && mobileDropdownNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDropdownNav.classList.toggle('open');
    });

    // Close menu when clicking nav item
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        mobileDropdownNav.classList.remove('open');
      });
    });
  }

  // ------------------------------------------------------------------------
  // 2. Dynamic Live Status Banner Toggle
  // ------------------------------------------------------------------------
  const toggleStatusStateBtn = document.getElementById('toggleStatusStateBtn');
  const statusBadgeText = document.getElementById('statusBadgeText');
  const statusMsgText = document.getElementById('statusMsgText');

  const statusStates = [
    { badge: 'CURRENTLY TOUR READY', msg: 'Melbourne & Regional VIC • Spring / Summer Bookings Open' },
    { badge: 'LIMITED GIG DATES', msg: 'September & October Slots Filling Fast • Inquire Now' },
    { badge: 'IN STUDIO RECORDING', msg: 'New EP Pre-production • Available for Selected Weekend Headliners' }
  ];

  let currentStatusIndex = 0;

  if (toggleStatusStateBtn && statusBadgeText && statusMsgText) {
    toggleStatusStateBtn.addEventListener('click', () => {
      currentStatusIndex = (currentStatusIndex + 1) % statusStates.length;
      statusBadgeText.textContent = statusStates[currentStatusIndex].badge;
      statusMsgText.textContent = statusStates[currentStatusIndex].msg;
      showToast('Live Tour Status Updated');
    });
  }

  // ------------------------------------------------------------------------
  // 3. Audio Streamer Player Simulation
  // ------------------------------------------------------------------------
  const playlistItems = document.querySelectorAll('.playlist-item');
  const currentTrackTitle = document.getElementById('currentTrackTitle');
  const currentTrackArtist = document.getElementById('currentTrackArtist');
  const toggleAudioPlayBtn = document.getElementById('toggleAudioPlayBtn');
  const audioPlayIcon = document.getElementById('audioPlayIcon');
  const prevTrackBtn = document.getElementById('prevTrackBtn');
  const nextTrackBtn = document.getElementById('nextTrackBtn');
  const audioProgressBar = document.getElementById('audioProgressBar');
  const audioProgressFill = document.getElementById('audioProgressFill');
  const audioCurrentTime = document.getElementById('audioCurrentTime');

  let isPlaying = false;
  let currentTrackIdx = 0;
  let audioTimer = null;
  let elapsedSeconds = 0;

  const tracks = [
    { title: "Just Like Heaven (Kins Cover)", artist: "The Kins • Single Release", duration: 204 },
    { title: "Buddy Holly (Live Pub Mix)", artist: "The Kins • Live at The Tote", duration: 168 },
    { title: "Boys Don't Cry (Indie Rendition)", artist: "The Kins • Live at The Espy", duration: 190 }
  ];

  function loadTrack(index) {
    currentTrackIdx = index;
    const track = tracks[currentTrackIdx];
    if (currentTrackTitle) currentTrackTitle.textContent = track.title;
    if (currentTrackArtist) currentTrackArtist.textContent = track.artist;

    playlistItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    resetAudio();
    if (isPlaying) playAudio();
  }

  function playAudio() {
    isPlaying = true;
    if (audioPlayIcon) {
      audioPlayIcon.classList.remove('fa-play');
      audioPlayIcon.classList.add('fa-pause');
    }
    
    clearInterval(audioTimer);
    audioTimer = setInterval(() => {
      elapsedSeconds++;
      const total = tracks[currentTrackIdx].duration;
      if (elapsedSeconds >= total) {
        nextTrack();
      } else {
        updateAudioProgress(elapsedSeconds, total);
      }
    }, 1000);
  }

  function pauseAudio() {
    isPlaying = false;
    if (audioPlayIcon) {
      audioPlayIcon.classList.remove('fa-pause');
      audioPlayIcon.classList.add('fa-play');
    }
    clearInterval(audioTimer);
  }

  function resetAudio() {
    elapsedSeconds = 0;
    updateAudioProgress(0, tracks[currentTrackIdx].duration);
  }

  function updateAudioProgress(current, total) {
    const pct = (current / total) * 100;
    if (audioProgressFill) audioProgressFill.style.width = pct + '%';
    
    const mins = Math.floor(current / 60);
    const secs = current % 60;
    if (audioCurrentTime) {
      audioCurrentTime.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }

  function nextTrack() {
    const nextIdx = (currentTrackIdx + 1) % tracks.length;
    loadTrack(nextIdx);
    playAudio();
  }

  function prevTrack() {
    const prevIdx = (currentTrackIdx - 1 + tracks.length) % tracks.length;
    loadTrack(prevIdx);
    playAudio();
  }

  if (toggleAudioPlayBtn) {
    toggleAudioPlayBtn.addEventListener('click', () => {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
        showToast(`Playing: ${tracks[currentTrackIdx].title}`);
      }
    });
  }

  if (nextTrackBtn) nextTrackBtn.addEventListener('click', nextTrack);
  if (prevTrackBtn) prevTrackBtn.addEventListener('click', prevTrack);

  playlistItems.forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.getAttribute('data-index'), 10);
      loadTrack(index);
      playAudio();
      showToast(`Selected Track: ${tracks[index].title}`);
    });
  });

  if (audioProgressBar) {
    audioProgressBar.addEventListener('click', (e) => {
      const rect = audioProgressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = clickX / rect.width;
      const total = tracks[currentTrackIdx].duration;
      elapsedSeconds = Math.floor(pct * total);
      updateAudioProgress(elapsedSeconds, total);
    });
  }

  // ------------------------------------------------------------------------
  // 4. Video Showcase Play Trigger
  // ------------------------------------------------------------------------
  const playVideoBtn = document.getElementById('playVideoBtn');
  let videoPlayCounter = 94;

  if (playVideoBtn) {
    playVideoBtn.addEventListener('click', () => {
      videoPlayCounter++;
      const analyticsVideoCount = document.getElementById('analyticsVideoPlaysCount');
      if (analyticsVideoCount) analyticsVideoCount.textContent = videoPlayCounter;
      showToast('Live Showcase Reel Playing (High Quality Direct Soundboard Audio)');
    });
  }

  // ------------------------------------------------------------------------
  // 5. Live Photo Gallery Lightbox & Filters
  // ------------------------------------------------------------------------
  const galleryFilters = document.querySelectorAll('.gallery-filters .filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');

  galleryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      galleryItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const tag = item.querySelector('.gallery-tag');
      if (lightboxModal && lightboxImg && img) {
        lightboxImg.src = img.src;
        if (lightboxCaption && tag) lightboxCaption.textContent = tag.textContent;
        lightboxModal.classList.add('open');
      }
    });
  });

  if (closeLightboxBtn && lightboxModal) {
    closeLightboxBtn.addEventListener('click', () => {
      lightboxModal.classList.remove('open');
    });
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.remove('open');
    });
  }

  // ------------------------------------------------------------------------
  // 6. Searchable Song Catalogue & Setlist Filter Engine
  // ------------------------------------------------------------------------
  const songDatabase = [
    { title: "Just Like Heaven", artist: "The Cure", genre: "Classic Rock", energy: "High Energy", key: "A Major", set: "covers" },
    { title: "Buddy Holly", artist: "Weezer", genre: "Indie Rock", energy: "High Energy", key: "F# Major", set: "covers" },
    { title: "Boys Don't Cry", artist: "The Cure", genre: "Classic Rock", energy: "High Energy", key: "A Major", set: "covers" },
    { title: "Last Nite", artist: "The Strokes", genre: "Indie Rock", energy: "High Energy", key: "C Major", set: "covers" },
    { title: "Mr. Brightside", artist: "The Killers", genre: "Indie Rock", energy: "High Energy", key: "C# Major", set: "covers" },
    { title: "What You Know", artist: "Two Door Cinema Club", genre: "Indie Rock", energy: "High Energy", key: "F# Minor", set: "covers" },
    { title: "Wonderwall", artist: "Oasis", genre: "Acoustic", energy: "Chill Acoustic", key: "F#m / Em", set: "acoustic" },
    { title: "Riptide", artist: "Vance Joy", genre: "Acoustic", energy: "Chill Acoustic", key: "Am / C", set: "acoustic" },
    { title: "Kins Original Single 01", artist: "The Kins", genre: "Indie Rock", energy: "High Energy", key: "E Major", set: "originals" },
    { title: "Kins Original Single 02", artist: "The Kins", genre: "Indie Rock", energy: "Mid Tempo", key: "D Major", set: "originals" },
    { title: "Seven Nation Army", artist: "The White Stripes", genre: "Classic Rock", energy: "High Energy", key: "E Minor", set: "festival" },
    { title: "Fluorescent Adolescent", artist: "Arctic Monkeys", genre: "Indie Rock", energy: "High Energy", key: "E Major", set: "covers" }
  ];

  const songTableBody = document.getElementById('songTableBody');
  const songSearchInput = document.getElementById('songSearchInput');
  const clearSongSearchBtn = document.getElementById('clearSongSearchBtn');
  const songCountBadge = document.getElementById('songCountBadge');
  const setlistTabs = document.querySelectorAll('.setlist-tab');
  const genrePills = document.querySelectorAll('.filter-pills-wrapper .pill-btn');

  let activeSetFilter = 'covers';
  let activeGenreFilter = 'all';
  let activeSearchQuery = '';

  function renderSongTable() {
    if (!songTableBody) return;

    const filtered = songDatabase.filter(song => {
      const matchesSet = activeSetFilter === 'all' || song.set === activeSetFilter;
      const matchesGenre = activeGenreFilter === 'all' || song.genre === activeGenreFilter || song.energy === activeGenreFilter;
      const q = activeSearchQuery.toLowerCase();
      const matchesQuery = !q || 
        song.title.toLowerCase().includes(q) || 
        song.artist.toLowerCase().includes(q) || 
        song.key.toLowerCase().includes(q) ||
        song.energy.toLowerCase().includes(q);

      return matchesSet && matchesGenre && matchesQuery;
    });

    songTableBody.innerHTML = '';

    if (filtered.length === 0) {
      songTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:24px;">No matching songs found for "${activeSearchQuery}". Try a different filter!</td></tr>`;
      if (songCountBadge) songCountBadge.textContent = 'Showing 0 Songs';
      return;
    }

    filtered.forEach(song => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${song.title}</strong></td>
        <td>${song.artist}</td>
        <td><span class="badge ${song.genre === 'Classic Rock' ? 'sold-out' : 'packed'}">${song.genre}</span></td>
        <td>${song.energy}</td>
        <td><code>${song.key}</code></td>
      `;

      tr.addEventListener('click', () => {
        showToast(`Selected Song: ${song.title} (${song.artist}) — Key: ${song.key}`);
      });

      songTableBody.appendChild(tr);
    });

    if (songCountBadge) songCountBadge.textContent = `Showing ${filtered.length} Songs`;
  }

  // Search Input Handler
  if (songSearchInput) {
    songSearchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value.trim();
      if (clearSongSearchBtn) {
        clearSongSearchBtn.style.display = activeSearchQuery ? 'block' : 'none';
      }
      renderSongTable();
    });
  }

  if (clearSongSearchBtn) {
    clearSongSearchBtn.addEventListener('click', () => {
      if (songSearchInput) songSearchInput.value = '';
      activeSearchQuery = '';
      clearSongSearchBtn.style.display = 'none';
      renderSongTable();
    });
  }

  // Setlist Tab Handler
  setlistTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setlistTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeSetFilter = tab.getAttribute('data-tab');
      renderSongTable();
    });
  });

  // Genre Pill Handler
  genrePills.forEach(pill => {
    pill.addEventListener('click', () => {
      genrePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeGenreFilter = pill.getAttribute('data-filter-genre');
      renderSongTable();
    });
  });

  // Initial song render
  renderSongTable();

  // ------------------------------------------------------------------------
  // 7. Interactive Stage Plot SVG Channel Link
  // ------------------------------------------------------------------------
  const svgElements = document.querySelectorAll('.svg-element');
  const inputRows = document.querySelectorAll('.input-table tbody tr');

  svgElements.forEach(elem => {
    elem.addEventListener('click', () => {
      const channelRange = elem.getAttribute('data-channel');
      inputRows.forEach(row => row.classList.remove('highlight-channel'));

      if (channelRange) {
        if (channelRange.includes('-')) {
          const [start, end] = channelRange.split('-').map(Number);
          for (let i = start; i <= end; i++) {
            const targetRow = document.getElementById(`inputRow${i}`);
            if (targetRow) targetRow.classList.add('highlight-channel');
          }
        } else {
          const targetRow = document.getElementById(`inputRow${channelRange}`);
          if (targetRow) targetRow.classList.add('highlight-channel');
        }
        showToast(`Highlighted Channel Patch #${channelRange} on Input List`);
      }
    });
  });

  // ------------------------------------------------------------------------
  // 8. One-Click Download Centre Blob Manager
  // ------------------------------------------------------------------------
  const downloadBtns = document.querySelectorAll('.download-btn-trigger');
  let downloadCount = 38;

  downloadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const fileName = btn.getAttribute('data-file') || 'The_Kins_EPK_Asset.pdf';
      
      // Generate synthetic file download
      const content = `THE KINS OFFICIAL VENUE & PROMOTER SPECIFICATIONS (2026)\nFile: ${fileName}\nBooking Contact: bookings@thekins.au\nWebsite: https://yourband.com/epk\n\nThank you for downloading The Kins official press assets.`;
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      downloadCount++;
      const analyticsDownloadElement = document.getElementById('analyticsDownloadsCount');
      if (analyticsDownloadElement) analyticsDownloadElement.textContent = downloadCount;

      showToast(`Downloaded: ${fileName}`);
    });
  });

  if (document.getElementById('quickDownloadPackBtn')) {
    document.getElementById('quickDownloadPackBtn').addEventListener('click', () => {
      const btn = document.querySelector('.download-btn-trigger');
      if (btn) btn.click();
    });
  }

  // ------------------------------------------------------------------------
  // 9. Booking Pitch Form & Copy Email Chips
  // ------------------------------------------------------------------------
  const bookingForm = document.getElementById('bookingInquiryForm');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const venueName = document.getElementById('venueName').value;
      const contactEmail = document.getElementById('contactEmail').value;

      showToast(`Success! Booking pitch submitted for ${venueName}. Confirmation sent to ${contactEmail}`);
      bookingForm.reset();
    });
  }

  // Copy Email Handlers
  document.querySelectorAll('[data-copy], .copy-email-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const textToCopy = chip.getAttribute('data-copy') || 'bookings@thekins.au';
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`Copied to clipboard: ${textToCopy}`);
      }).catch(() => {
        showToast(`Copied: ${textToCopy}`);
      });
    });
  });

  // ------------------------------------------------------------------------
  // 10. VIP Promoter Portal Modal (`venue2026`)
  // ------------------------------------------------------------------------
  const openVipBtn = document.getElementById('openVipPortalBtn');
  const vipModal = document.getElementById('vipModal');
  const closeVipBtn = document.getElementById('closeVipModalBtn');
  const vipForm = document.getElementById('vipPasswordForm');
  const vipInput = document.getElementById('vipPasswordInput');
  const vipError = document.getElementById('vipErrorMsg');
  const vipLockedState = document.getElementById('vipLockedState');
  const vipUnlockedState = document.getElementById('vipUnlockedState');

  if (openVipBtn && vipModal) {
    openVipBtn.addEventListener('click', () => {
      vipModal.classList.add('open');
    });
  }

  if (closeVipBtn && vipModal) {
    closeVipBtn.addEventListener('click', () => {
      vipModal.classList.remove('open');
    });
    vipModal.addEventListener('click', (e) => {
      if (e.target === vipModal) vipModal.classList.remove('open');
    });
  }

  if (vipForm) {
    vipForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = vipInput.value.trim();

      if (pwd === 'venue2026' || pwd === 'kins2026') {
        vipLockedState.style.display = 'none';
        vipUnlockedState.style.display = 'block';
        if (vipError) vipError.classList.remove('visible');
        showToast('VIP Portal Unlocked — Confidential Venue Specs Accessible');
      } else {
        if (vipError) vipError.classList.add('visible');
      }
    });
  }

  // ------------------------------------------------------------------------
  // 11. Real-time Booker Analytics Modal
  // ------------------------------------------------------------------------
  const openAnalyticsBtn = document.getElementById('openAnalyticsBtn');
  const analyticsModal = document.getElementById('analyticsModal');
  const closeAnalyticsBtn = document.getElementById('closeAnalyticsModalBtn');

  if (openAnalyticsBtn && analyticsModal) {
    openAnalyticsBtn.addEventListener('click', () => {
      analyticsModal.classList.add('open');
    });
  }

  if (closeAnalyticsBtn && analyticsModal) {
    closeAnalyticsBtn.addEventListener('click', () => {
      analyticsModal.classList.remove('open');
    });
    analyticsModal.addEventListener('click', (e) => {
      if (e.target === analyticsModal) analyticsModal.classList.remove('open');
    });
  }

  // ------------------------------------------------------------------------
  // 12. Helper Toast Notification System
  // ------------------------------------------------------------------------
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#53c678;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

});
