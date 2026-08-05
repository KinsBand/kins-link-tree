/* ==========================================================================
   Kins Studio - SaaS Control Centre Dashboard Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. SIDEBAR TOGGLE & VIEW SWITCHER ENGINE
  const sidebar = document.getElementById('studioSidebar');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  const viewContainers = document.querySelectorAll('.view-container');

  // Mobile sidebar toggle
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }

  // View Switcher Function
  function switchView(targetViewId) {
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === targetViewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    viewContainers.forEach(view => {
      if (view.id === `view-${targetViewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    sidebar.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      switchView(targetView);
    });
  });

  // Cross View Links
  document.querySelectorAll('[data-view-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view-trigger');
      switchView(targetView);
    });
  });

  // 1.5. OVERVIEW PLATFORM FILTERING TABS (Starting with 'ALL')
  const ovFilterBtns = document.querySelectorAll('.ov-filter-btn');
  const selectedPfTitle = document.getElementById('selectedPfTitle');
  const selectedPfHandle = document.getElementById('selectedPfHandle');
  const selectedPfSyncText = document.getElementById('selectedPfSyncText');
  const sumFollowers = document.getElementById('sumFollowers');
  const sumEngagement = document.getElementById('sumEngagement');
  const sumFollowerEng = document.getElementById('sumFollowerEng');
  const sumTotalVideos = document.getElementById('sumTotalVideos');
  const sumImpressions = document.getElementById('sumImpressions');
  const sumTotalEngagements = document.getElementById('sumTotalEngagements');
  const sumAvgViews = document.getElementById('sumAvgViews');
  const sumAvgLikes = document.getElementById('sumAvgLikes');
  const sumAvgComments = document.getElementById('sumAvgComments');
  const overviewTotalFollowers = document.getElementById('overviewTotalFollowers');

  const PLATFORM_METRICS_MAP = {
    all: {
      title: 'All Platforms Summary',
      handle: '@KINSBANDOFFICIAL',
      sync: 'Synced across all platforms on Aug 5',
      followers: '428,590',
      engagement: '16.4%',
      followerEng: '4.8%',
      totalVideos: '42',
      impressions: '3,920,400',
      totalEngagements: '642,800',
      avgViews: '42,800',
      avgLikes: '8,420',
      avgComments: '1,240'
    },
    instagram: {
      title: 'Instagram',
      handle: '@KINSBANDOFFICIAL',
      sync: 'Synced with Instagram on Aug 5',
      followers: '142,400',
      engagement: '18.2%',
      followerEng: '5.1%',
      totalVideos: '18',
      impressions: '1,420,000',
      totalEngagements: '258,400',
      avgViews: '78,800',
      avgLikes: '14,350',
      avgComments: '1,820'
    },
    tiktok: {
      title: 'TikTok',
      handle: '@KINSBANDOFFICIAL',
      sync: 'Synced with TikTok on Aug 5',
      followers: '89,200',
      engagement: '14.8%',
      followerEng: '4.2%',
      totalVideos: '14',
      impressions: '1,940,000',
      totalEngagements: '287,100',
      avgViews: '138,500',
      avgLikes: '20,500',
      avgComments: '2,410'
    },
    spotify: {
      title: 'Spotify for Artists',
      handle: 'Kins Official',
      sync: 'Synced with Spotify on Aug 5',
      followers: '214,800',
      engagement: '21.4%',
      followerEng: '6.8%',
      totalVideos: '8',
      impressions: '1,842,120',
      totalEngagements: '394,200',
      avgViews: '230,200',
      avgLikes: '32,100',
      avgComments: '840'
    },
    youtube: {
      title: 'YouTube',
      handle: '@KINSBANDOFFICIAL',
      sync: 'Synced with YouTube on Aug 5',
      followers: '64,200',
      engagement: '11.4%',
      followerEng: '3.6%',
      totalVideos: '10',
      impressions: '840,100',
      totalEngagements: '95,700',
      avgViews: '84,010',
      avgLikes: '7,420',
      avgComments: '920'
    },
    twitter: {
      title: 'Twitter / X',
      handle: '@KINSBANDOFFICIAL',
      sync: 'Synced with Twitter on Aug 5',
      followers: '132,790',
      engagement: '9.8%',
      followerEng: '2.9%',
      totalVideos: '4',
      impressions: '482,000',
      totalEngagements: '47,200',
      avgViews: '32,400',
      avgLikes: '3,890',
      avgComments: '410'
    },
    twitch: {
      title: 'Twitch',
      handle: '@KINSBANDOFFICIAL',
      sync: 'Synced with Twitch on Aug 5',
      followers: '14,200',
      engagement: '24.1%',
      followerEng: '8.4%',
      totalVideos: '6',
      impressions: '128,400',
      totalEngagements: '30,900',
      avgViews: '21,400',
      avgLikes: '2,910',
      avgComments: '1,680'
    }
  };

  ovFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ovFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterKey = btn.getAttribute('data-platform-filter') || 'all';
      const data = PLATFORM_METRICS_MAP[filterKey] || PLATFORM_METRICS_MAP.all;

      if (selectedPfTitle) selectedPfTitle.textContent = data.title;
      if (selectedPfHandle) selectedPfHandle.textContent = data.handle;
      if (selectedPfSyncText) selectedPfSyncText.textContent = data.sync;
      if (sumFollowers) sumFollowers.textContent = data.followers;
      if (sumEngagement) sumEngagement.textContent = data.engagement;
      if (sumFollowerEng) sumFollowerEng.textContent = data.followerEng;
      if (sumTotalVideos) sumTotalVideos.textContent = data.totalVideos;
      if (sumImpressions) sumImpressions.textContent = data.impressions;
      if (sumTotalEngagements) sumTotalEngagements.textContent = data.totalEngagements;
      if (sumAvgViews) sumAvgViews.textContent = data.avgViews;
      if (sumAvgLikes) sumAvgLikes.textContent = data.avgLikes;
      if (sumAvgComments) sumAvgComments.textContent = data.avgComments;
      if (overviewTotalFollowers && filterKey !== 'all') {
        overviewTotalFollowers.textContent = data.followers;
      } else if (overviewTotalFollowers) {
        overviewTotalFollowers.textContent = '428,590';
      }
    });
  });

  const workWithMeBtn = document.getElementById('workWithMeBtn');
  if (workWithMeBtn) {
    workWithMeBtn.addEventListener('click', () => {
      showToast('Opening Collaboration Inquiry Form...', 'success');
    });
  }

  // Connect Channel Modal Logic
  const openConnectModalBtn = document.getElementById('openConnectModalBtn');
  const connectChannelModal = document.getElementById('connectChannelModal');
  const closeConnectModalBtn = document.getElementById('closeConnectModalBtn');
  const connectChannelBackdrop = document.getElementById('connectChannelBackdrop');

  if (openConnectModalBtn && connectChannelModal) {
    openConnectModalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      connectChannelModal.classList.remove('hidden');
    });
  }

  function closeConnectModal() {
    if (connectChannelModal) connectChannelModal.classList.add('hidden');
  }

  if (closeConnectModalBtn) closeConnectModalBtn.addEventListener('click', closeConnectModal);
  if (connectChannelBackdrop) connectChannelBackdrop.addEventListener('click', closeConnectModal);

  document.querySelectorAll('.connect-platform-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pf = btn.getAttribute('data-connect-pf') || 'Channel';
      showToast(`Initiating OAuth authentication for ${pf}...`, 'info');
      closeConnectModal();
    });
  });

  // SCHEDULE / EDIT POST MODAL HANDLERS
  const newScheduleBtn = document.getElementById('newScheduleBtn');
  const schedulePostModal = document.getElementById('schedulePostModal');
  const closeScheduleModalBtn = document.getElementById('closeScheduleModalBtn');
  const schedulePostBackdrop = document.getElementById('schedulePostBackdrop');
  const schedulePostForm = document.getElementById('schedulePostForm');
  const scheduleModalTitle = document.getElementById('scheduleModalTitle');

  function openScheduleModal(title = 'Schedule New Post') {
    if (scheduleModalTitle) scheduleModalTitle.innerHTML = `<i class="fa-solid fa-calendar-plus connect-modal-icon"></i> ${title}`;
    if (schedulePostModal) schedulePostModal.classList.remove('hidden');
  }

  function closeScheduleModal() {
    if (schedulePostModal) schedulePostModal.classList.add('hidden');
  }

  if (newScheduleBtn) newScheduleBtn.addEventListener('click', () => openScheduleModal('Schedule New Post'));
  if (closeScheduleModalBtn) closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
  if (schedulePostBackdrop) schedulePostBackdrop.addEventListener('click', closeScheduleModal);

  document.querySelectorAll('.edit-post-btn').forEach(btn => {
    btn.addEventListener('click', () => openScheduleModal('Edit Post Details'));
  });

  document.querySelectorAll('.edit-draft-btn').forEach(btn => {
    btn.addEventListener('click', () => openScheduleModal('Edit Draft Post'));
  });

  if (schedulePostForm) {
    schedulePostForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Post schedule updated successfully!', 'success');
      closeScheduleModal();
    });
  }

  // POST STATS MODAL HANDLERS
  const statsModal = document.getElementById('statsModal');
  const closeStatsModalBtn = document.getElementById('closeStatsModalBtn');
  const closeStatsOkBtn = document.getElementById('closeStatsOkBtn');
  const statsBackdrop = document.getElementById('statsBackdrop');

  function openStatsModal() {
    if (statsModal) statsModal.classList.remove('hidden');
  }

  function closeStatsModal() {
    if (statsModal) statsModal.classList.add('hidden');
  }

  document.querySelectorAll('.view-stats-btn').forEach(btn => {
    btn.addEventListener('click', openStatsModal);
  });

  if (closeStatsModalBtn) closeStatsModalBtn.addEventListener('click', closeStatsModal);
  if (closeStatsOkBtn) closeStatsOkBtn.addEventListener('click', closeStatsModal);
  if (statsBackdrop) statsBackdrop.addEventListener('click', closeStatsModal);

  // RELEASE MANAGER MODAL & CHECKLIST TOGGLES
  const newReleaseBtn = document.getElementById('newReleaseBtn');
  const releaseModal = document.getElementById('releaseModal');
  const closeReleaseModalBtn = document.getElementById('closeReleaseModalBtn');
  const releaseBackdrop = document.getElementById('releaseBackdrop');
  const releaseForm = document.getElementById('releaseForm');

  if (newReleaseBtn && releaseModal) {
    newReleaseBtn.addEventListener('click', () => releaseModal.classList.remove('hidden'));
  }

  function closeReleaseModal() {
    if (releaseModal) releaseModal.classList.add('hidden');
  }

  if (closeReleaseModalBtn) closeReleaseModalBtn.addEventListener('click', closeReleaseModal);
  if (releaseBackdrop) releaseBackdrop.addEventListener('click', closeReleaseModal);

  if (releaseForm) {
    releaseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('New release pipeline created successfully!', 'success');
      closeReleaseModal();
    });
  }

  // Checklist Item Toggles
  document.querySelectorAll('.chk-item').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      if (item.classList.contains('ready')) {
        item.classList.remove('ready');
        item.classList.add('pending');
        item.innerHTML = `<i class="fa-solid fa-clock"></i> ${item.textContent.replace('(Ready)', '(Pending)')}`;
        showToast('Checklist item set to Pending', 'info');
      } else {
        item.classList.remove('pending');
        item.classList.add('ready');
        item.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${item.textContent.replace('(Pending Edit)', '(Ready)')}`;
        showToast('Checklist item set to Ready', 'success');
      }
    });
  });

  // CALENDAR NAV & FILTERING INTERACTIVITY
  document.querySelectorAll('.cal-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cal-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      showToast(`Filtered calendar posts by ${pill.textContent}`, 'info');
    });
  });

  document.querySelectorAll('.cal-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Navigated calendar month', 'info');
    });
  });

  // REALTIME TABLE SEARCH FILTER
  const contentSearchInput = document.getElementById('contentSearchInput');
  if (contentSearchInput) {
    contentSearchInput.addEventListener('input', () => {
      const term = contentSearchInput.value.toLowerCase();
      document.querySelectorAll('.data-table tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }

  // 2. COMMAND PALETTE MODAL (Ctrl + K / Cmd + K)
  const cmdModal = document.getElementById('cmdPaletteModal');
  const cmdTrigger = document.getElementById('cmdPaletteTrigger');
  const cmdBackdrop = document.getElementById('cmdPaletteBackdrop');
  const cmdSearchInput = document.getElementById('cmdSearchInput');
  const cmdItems = document.querySelectorAll('.cmd-item');

  function openCmdPalette() {
    cmdModal.classList.remove('hidden');
    cmdSearchInput.value = '';
    cmdSearchInput.focus();
    filterCmdItems('');
  }

  function closeCmdPalette() {
    cmdModal.classList.add('hidden');
  }

  if (cmdTrigger) cmdTrigger.addEventListener('click', openCmdPalette);
  if (cmdBackdrop) cmdBackdrop.addEventListener('click', closeCmdPalette);

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdModal.classList.contains('hidden')) {
        openCmdPalette();
      } else {
        closeCmdPalette();
      }
    } else if (e.key === 'Escape' && !cmdModal.classList.contains('hidden')) {
      closeCmdPalette();
    }
  });

  // Filtering Command Items
  function filterCmdItems(query) {
    const q = query.toLowerCase().trim();
    cmdItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(q)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  cmdSearchInput.addEventListener('input', (e) => {
    filterCmdItems(e.target.value);
  });

  cmdItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      const target = item.getAttribute('data-target');

      if (action === 'nav' && target) {
        switchView(target);
      } else if (action === 'sync') {
        triggerForceSync();
      } else if (action === 'export') {
        showToast('Preparing Followers CSV export...', 'info');
      }

      closeCmdPalette();
    });
  });

  // 3. NOTIFICATIONS DRAWER
  const notifBtn = document.getElementById('notifBtn');
  const notifDrawer = document.getElementById('notifDrawer');
  const markReadBtn = document.getElementById('markReadBtn');
  const notifBadgeCount = document.getElementById('notifBadgeCount');

  if (notifBtn) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDrawer.classList.toggle('hidden');
    });
  }

  document.addEventListener('click', (e) => {
    if (notifDrawer && !notifDrawer.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDrawer.classList.add('hidden');
    }
  });

  if (markReadBtn) {
    markReadBtn.addEventListener('click', () => {
      document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
      if (notifBadgeCount) notifBadgeCount.style.display = 'none';
      showToast('All notifications marked as read.', 'success');
    });
  }

  // 4. DYNAMIC REAL-TIME MOCK DATA TICKER
  let secondsAgo = 4;
  const liveSyncTimer = document.getElementById('liveSyncTimer');
  const kpiTotalFollowers = document.getElementById('kpiTotalFollowers');
  const kpiMonthlyStreams = document.getElementById('kpiMonthlyStreams');
  const instaFollowers = document.getElementById('instaFollowers');

  let currentFollowerCount = 428590;
  let currentStreamCount = 1842120;
  let currentInstaCount = 142400;

  setInterval(() => {
    secondsAgo += 3;
    if (secondsAgo > 45) {
      secondsAgo = 2;
      // Increment stats slightly to simulate live active traffic
      currentFollowerCount += Math.floor(Math.random() * 5) + 1;
      currentStreamCount += Math.floor(Math.random() * 12) + 3;
      currentInstaCount += Math.floor(Math.random() * 3) + 1;

      if (kpiTotalFollowers) kpiTotalFollowers.textContent = currentFollowerCount.toLocaleString();
      if (kpiMonthlyStreams) kpiMonthlyStreams.textContent = currentStreamCount.toLocaleString();
      if (instaFollowers) instaFollowers.textContent = currentInstaCount.toLocaleString();
    }

    if (liveSyncTimer) liveSyncTimer.textContent = `Updated ${secondsAgo}s ago`;
  }, 3000);

  // 5. COPY TO CLIPBOARD HANDLER
  document.querySelectorAll('.copy-url-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Copied direct asset URL to clipboard!', 'success');
        }).catch(() => {
          showToast('Failed to copy URL.', 'error');
        });
      }
    });
  });

  // 6. SINGLE PLATFORM SYNC & FORCE SYNC
  function triggerForceSync() {
    showToast('Syncing all platform APIs...', 'info');
    setTimeout(() => {
      secondsAgo = 0;
      if (liveSyncTimer) liveSyncTimer.textContent = 'Updated 0s ago';
      showToast('All platforms synchronized successfully!', 'success');
    }, 1200);
  }

  const forceSyncBtn = document.getElementById('forceSyncBtn');
  if (forceSyncBtn) forceSyncBtn.addEventListener('click', triggerForceSync);

  document.querySelectorAll('.sync-single-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.getAttribute('data-platform') || 'Platform';
      showToast(`Synchronizing ${platform}...`, 'info');
      setTimeout(() => {
        showToast(`${platform} data updated!`, 'success');
      }, 1000);
    });
  });

  // 7. DEVELOPER API SIMULATOR
  const sendApiReqBtn = document.getElementById('sendApiReqBtn');
  const apiEndpointSelect = document.getElementById('apiEndpointSelect');
  const apiJsonOutput = document.getElementById('apiJsonOutput');

  if (sendApiReqBtn && apiEndpointSelect && apiJsonOutput) {
    sendApiReqBtn.addEventListener('click', () => {
      const selected = apiEndpointSelect.value;
      apiJsonOutput.textContent = 'Executing request to API gateway...';

      setTimeout(() => {
        if (selected.includes('followers')) {
          apiJsonOutput.textContent = JSON.stringify({
            status: 200,
            endpoint: '/v1/followers',
            timestamp: new Date().toISOString(),
            data: {
              instagram: currentInstaCount,
              tiktok: 89200,
              youtube: 64200,
              twitter: 132790,
              total: currentFollowerCount
            }
          }, null, 2);
        } else if (selected.includes('streams')) {
          apiJsonOutput.textContent = JSON.stringify({
            status: 200,
            endpoint: '/v1/streams',
            timestamp: new Date().toISOString(),
            data: {
              spotify_monthly_listeners: 214800,
              apple_music_streams: 1428000,
              soundcloud_plays: 199320,
              total_monthly_streams: currentStreamCount
            }
          }, null, 2);
        } else {
          apiJsonOutput.textContent = JSON.stringify({
            status: 200,
            endpoint: '/v1/sync',
            timestamp: new Date().toISOString(),
            result: 'SUCCESS',
            synced_platforms: ['Instagram', 'TikTok', 'YouTube', 'SoundCloud', 'Twitch']
          }, null, 2);
        }
      }, 600);
    });
  }

  // 8. TOAST NOTIFICATION ENGINE
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

});
