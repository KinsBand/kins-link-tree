// JavaScript Logic for Kins (@KinsBandOfficial) Link in Bio Page

document.addEventListener('DOMContentLoaded', () => {
  
  // Element References
  const phoneFrame = document.getElementById('phoneFrame');
  const toggleMobileViewBtn = document.getElementById('toggleMobileView');
  const toggleFullViewBtn = document.getElementById('toggleFullView');
  
  const handleCopyBtn = document.getElementById('handleCopyBtn');
  const topSubscribeBtn = document.getElementById('topSubscribeBtn');
  const subscribeFormSection = document.getElementById('subscribeFormSection');
  const subscribeForm = document.getElementById('subscribeForm');
  const subscribeSuccess = document.getElementById('subscribeSuccess');
  
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = document.getElementById('closeShareModal');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const shareUrlInput = document.getElementById('shareUrlInput');
  
  const toastContainer = document.getElementById('toastContainer');
  const totalFollowersCountEl = document.getElementById('totalFollowersCount');
  const lastUpdatedEl = document.getElementById('followersLastUpdated');

  // Set current full URL for share input
  if (shareUrlInput) {
    shareUrlInput.value = window.location.href;
  }

  // -------------------------------------------------------------
  // 1. Pressable Handle Copy (@KinsBandOfficial)
  // -------------------------------------------------------------
  if (handleCopyBtn) {
    handleCopyBtn.addEventListener('click', async () => {
      const handleText = '@KinsBandOfficial';
      try {
        await navigator.clipboard.writeText(handleText);
        showToast(`Copied ${handleText} to clipboard!`);
      } catch (err) {
        // Fallback copy
        const tempInput = document.createElement('input');
        tempInput.value = handleText;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast(`Copied ${handleText} to clipboard!`);
      }
    });
  }

  // -------------------------------------------------------------
  // 1.5. Band Member Social Links Dropdown Toggles
  // -------------------------------------------------------------
  const memberSocialBtns = document.querySelectorAll('.member-socials-toggle-btn');
  memberSocialBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetDropdown = document.getElementById(targetId);
      
      if (targetDropdown) {
        const isHidden = targetDropdown.classList.contains('hidden');
        
        // Close other member dropdowns
        document.querySelectorAll('.member-socials-dropdown').forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
        document.querySelectorAll('.member-socials-toggle-btn').forEach(b => {
          b.classList.remove('active');
        });

        if (isHidden) {
          targetDropdown.classList.remove('hidden');
          btn.classList.add('active');
        }
      }
    });
  });
  function setupSegmentedSwitcher(tabSelector, contentSelector) {
    const tabs = document.querySelectorAll(tabSelector);
    const contents = document.querySelectorAll(contentSelector);

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-target');

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        contents.forEach(content => {
          if (content.id === targetId) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
  }

  // Main Links Tab Switcher
  setupSegmentedSwitcher('.tabbed-links-section .switcher-tab', '.tabbed-links-section .tab-content');

  // Subscribe / Emails Tab Switcher
  setupSegmentedSwitcher('.subscribe-switcher .switcher-tab', '.sub-tab-content');

  // -------------------------------------------------------------
  // 3. Email Copy Action Buttons
  // -------------------------------------------------------------
  const copyEmailBtns = document.querySelectorAll('.copy-email-btn');

  copyEmailBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-email');
      try {
        await navigator.clipboard.writeText(email);
        showToast(`Copied ${email} to clipboard!`);
      } catch (err) {
        const tempInput = document.createElement('input');
        tempInput.value = email;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast(`Copied ${email} to clipboard!`);
      }
    });
  });

  // -------------------------------------------------------------
  // 4. Live Data Metrics — Fetched from followers.json
  // -------------------------------------------------------------

  // Fallback values used while loading or if fetch fails
  const platformStats = {
    instagram:  0,
    linkedin:   0,
    tiktok:     0,
    twitch:     0,
    twitter:    0,
    youtube:    0,
    ytmusic:    0,
    soundcloud: 0,
    spotify:    0
  };

  function formatShortNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return '';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60)   return 'Updated just now';
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Updated ${Math.floor(diff / 3600)}h ago`;
    return `Updated ${Math.floor(diff / 86400)}d ago`;
  }

  /** Animate a single element's text from its current number to `target`.
   *  Only animates UPWARD — if target <= current, snaps instantly. */
  function animateCount(el, target, duration = 900) {
    const start = parseInt(el.getAttribute('data-raw') || '0', 10);
    // Never animate downward — only count UP
    if (target <= start) {
      el.innerText = formatShortNumber(target);
      el.setAttribute('data-raw', target);
      return;
    }
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      el.innerText = formatShortNumber(current);
      el.setAttribute('data-raw', current);
      if (progress < 1) requestAnimationFrame(step);
      else {
        el.innerText = formatShortNumber(target);
        el.setAttribute('data-raw', target);
      }
    }
    requestAnimationFrame(step);
  }

  function updateLiveMetrics(animate = false) {
    const socialKeys = ['instagram', 'linkedin', 'tiktok', 'twitch', 'twitter', 'youtube'];
    let totalSocialFollowers = socialKeys.reduce((sum, k) => sum + (platformStats[k] || 0), 0);

    if (totalFollowersCountEl) {
      if (animate) {
        animateCount(totalFollowersCountEl, totalSocialFollowers);
      } else {
        totalFollowersCountEl.innerText = formatShortNumber(totalSocialFollowers).toUpperCase();
        totalFollowersCountEl.setAttribute('data-raw', totalSocialFollowers);
      }
    }

    // Update individual platform badges
    Object.keys(platformStats).forEach(key => {
      const badge = document.getElementById(`badge-${key}`);
      if (badge) {
        if (animate) {
          animateCount(badge, platformStats[key], 800);
        } else {
          badge.innerText = formatShortNumber(platformStats[key]);
          badge.setAttribute('data-raw', platformStats[key]);
        }
      }
    });
  }

  // Render initial fallback values immediately (no animation)
  updateLiveMetrics(false);

  // ── Fetch real counts from followers.json ─────────────────────
  (async () => {
    try {
      // Cache-bust so we always get the latest committed version
      const res = await fetch(`followers.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      let anyUpdated = false;
      if (json.platforms) {
        Object.keys(json.platforms).forEach(key => {
          const val = json.platforms[key]?.followers;
          if (typeof val === 'number' && platformStats.hasOwnProperty(key)) {
            platformStats[key] = val;
            anyUpdated = true;
          }
        });
      }

      if (anyUpdated) {
        // Animate numbers counting up to real values
        updateLiveMetrics(true);

        // Show last-updated timestamp
        if (lastUpdatedEl && json.last_updated) {
          lastUpdatedEl.textContent = formatRelativeTime(json.last_updated);
          lastUpdatedEl.title = new Date(json.last_updated).toLocaleString();
          lastUpdatedEl.classList.add('visible');
        }
      }
    } catch (err) {
      // Silently fail — fallback numbers are already displayed
      console.warn('[Kins] followers.json fetch failed, using fallback data:', err);
    }
  })();

  // ── Re-fetch real counts every 30 minutes ─────────────────────
  setInterval(async () => {
    try {
      const res = await fetch(`followers.json?t=${Date.now()}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.platforms) {
        Object.keys(json.platforms).forEach(key => {
          const val = json.platforms[key]?.followers;
          if (typeof val === 'number' && platformStats.hasOwnProperty(key)) {
            platformStats[key] = val;
          }
        });
        updateLiveMetrics(true);

        if (lastUpdatedEl && json.last_updated) {
          lastUpdatedEl.textContent = formatRelativeTime(json.last_updated);
          lastUpdatedEl.title = new Date(json.last_updated).toLocaleString();
        }
      }
    } catch (err) {
      console.warn('[Kins] Live refresh failed:', err);
    }
  }, 30 * 60 * 1000);

  // -------------------------------------------------------------
  // 5. Desktop View Toggle (Mobile Frame vs Full Width)
  // -------------------------------------------------------------
  if (toggleMobileViewBtn && toggleFullViewBtn && phoneFrame) {
    toggleMobileViewBtn.addEventListener('click', () => {
      phoneFrame.classList.remove('full-width-mode');
      toggleMobileViewBtn.classList.add('active');
      toggleFullViewBtn.classList.remove('active');
    });

    toggleFullViewBtn.addEventListener('click', () => {
      phoneFrame.classList.add('full-width-mode');
      toggleFullViewBtn.classList.add('active');
      toggleMobileViewBtn.classList.remove('active');
    });
  }

  // -------------------------------------------------------------
  // 6. Subscribe Navigation Scroll
  // -------------------------------------------------------------
  if (topSubscribeBtn && subscribeFormSection) {
    topSubscribeBtn.addEventListener('click', () => {
      subscribeFormSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Ensure Subscribe tab is active
      const subTabBtn = document.getElementById('tabSubBtn');
      if (subTabBtn) subTabBtn.click();
      const emailInput = document.getElementById('emailInput');
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 600);
      }
    });
  }

  // -------------------------------------------------------------
  // 7. Share Modal Logic
  // -------------------------------------------------------------
  if (shareBtn && shareModal && closeShareModal) {
    shareBtn.addEventListener('click', () => {
      shareModal.classList.add('active');
    });

    closeShareModal.addEventListener('click', () => {
      shareModal.classList.remove('active');
    });

    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        shareModal.classList.remove('active');
      }
    });
  }

  // Copy Link Action
  if (copyUrlBtn && shareUrlInput) {
    copyUrlBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrlInput.value);
        showToast('Link copied to clipboard!');
        copyUrlBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          copyUrlBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        }, 2000);
      } catch (err) {
        // Fallback copy
        shareUrlInput.select();
        document.execCommand('copy');
        showToast('Link copied to clipboard!');
      }
    });
  }

  // -------------------------------------------------------------
  // 8. Form Submission (Email Only)
  // -------------------------------------------------------------
  if (subscribeForm) {
    // Check if user already subscribed in localStorage
    if (localStorage.getItem('kins_subscribed') === 'true') {
      subscribeForm.classList.add('hidden');
      subscribeSuccess.classList.remove('hidden');
    }

    subscribeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('emailInput').value.trim();

      if (email) {
        // Store in local state
        localStorage.setItem('kins_subscribed', 'true');
        localStorage.setItem('kins_user_email', email);

        // Animate transition
        subscribeForm.classList.add('hidden');
        subscribeSuccess.classList.remove('hidden');
        showToast(`Welcome to the Kins crew! 🎉`);
      }
    });
  }

  // -------------------------------------------------------------
  // 9. Interactive Gig Map & Bottom Sheet Modal Logic
  // -------------------------------------------------------------
  const GIG_DATA = {
    hasUpcoming: true,
    upcoming: {
      venue: "Enmore Theatre",
      city: "Sydney, AU",
      date: "Fri, Oct 24, 2026",
      time: "8:00 PM",
      lat: -33.8986,
      lng: 151.1764,
      ticketUrl: "https://enmoretheatre.com.au",
      statusText: "UPCOMING GIG"
    },
    pastGigs: [
      { venue: "The Forum", city: "Melbourne, AU", date: "Aug 12, 2025", lat: -37.8166, lng: 144.9692, notes: "Sold Out Headline Show!" },
      { venue: "The Tivoli", city: "Brisbane, AU", date: "Nov 05, 2025", lat: -27.4526, lng: 153.0334, notes: "Summer Festival Leg" },
      { venue: "The Gov", city: "Adelaide, AU", date: "Mar 18, 2026", lat: -34.9082, lng: 138.5802, notes: "Acoustic & Electric Night" }
    ]
  };

  const floatingGigPillBtn = document.getElementById('floatingGigPillBtn');
  const gigPillTag = document.getElementById('gigPillTag');
  const gigPillLocation = document.getElementById('gigPillLocation');

  const gigMapModal = document.getElementById('gigMapModal');
  const closeGigMapSheet = document.getElementById('closeGigMapSheet');

  const gigBannerVenue = document.getElementById('gigBannerVenue');
  const gigBannerMeta = document.getElementById('gigBannerMeta');
  const gigBannerTicketBtn = document.getElementById('gigBannerTicketBtn');
  const gigStatusBadge = document.getElementById('gigStatusBadge');

  let leafletMapInstance = null;

  // Initialize Floating Pill Text based on upcoming vs past gigs
  function updateFloatingPill() {
    if (!gigPillTag || !gigPillLocation) return;
    if (GIG_DATA.hasUpcoming && GIG_DATA.upcoming) {
      gigPillTag.textContent = "NEXT GIG";
      gigPillLocation.textContent = `${GIG_DATA.upcoming.venue}, ${GIG_DATA.upcoming.city.split(',')[0]} • OCT 24`;
    } else {
      gigPillTag.textContent = "TOUR HISTORY";
      gigPillLocation.textContent = "Previous Gigs & Venues";
    }
  }
  updateFloatingPill();

  // Function to initialize or refresh Leaflet Map
  function initGigMap() {
    const mapContainer = document.getElementById('gigMapView');
    if (!mapContainer || typeof L === 'undefined') return;

    if (!leafletMapInstance) {
      // Create map centered near Australia
      leafletMapInstance = L.map('gigMapView', {
        zoomControl: true,
        attributionControl: false
      }).setView([-30.0, 145.0], 4);

      // CartoDB Dark Matter map tiles for dark aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(leafletMapInstance);

      // Icon for Upcoming Gig (Gold Pulsing Pin)
      const upcomingIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="pin-upcoming" title="Upcoming Gig"><i class="fa-solid fa-star"></i></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Icon for Past Gigs (Emerald Green Pin)
      const pastIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="pin-past" title="Past Gig"><i class="fa-solid fa-location-dot"></i></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      // Add Upcoming Marker if present
      if (GIG_DATA.hasUpcoming && GIG_DATA.upcoming) {
        const up = GIG_DATA.upcoming;
        const upMarker = L.marker([up.lat, up.lng], { icon: upcomingIcon }).addTo(leafletMapInstance);
        
        upMarker.bindPopup(`
          <div style="text-align: center; padding: 4px;">
            <strong style="color: #ffd700; font-size: 0.9rem;">⚡ UPCOMING SHOW</strong><br>
            <strong style="font-size: 1rem; color: #fff;">${up.venue}</strong><br>
            <span style="font-size: 0.78rem; color: #a1a1aa;">${up.city}</span><br>
            <span style="font-size: 0.78rem; color: #00e699;">${up.date}</span>
          </div>
        `);

        upMarker.on('click', () => {
          updateGigBanner(up.venue, `${up.date} • ${up.time} | ${up.city}`, "⚡ UPCOMING GIG", "#ffd700");
          updateVenueDetailCard(up.venue, "5.0", `${up.city} • Live Stage`, up.ticketUrl, [
            { icon: "fa-guitar", text: "Iconic Concert Stage" },
            { icon: "fa-users", text: "2,500 Capacity" },
            { icon: "fa-martini-glass", text: "Full Bar & Lounge" },
            { icon: "fa-wheelchair", text: "Accessible Venue" }
          ]);
        });
      }

      // Add Past Markers
      GIG_DATA.pastGigs.forEach(past => {
        const marker = L.marker([past.lat, past.lng], { icon: pastIcon }).addTo(leafletMapInstance);
        
        marker.bindPopup(`
          <div style="text-align: center; padding: 4px;">
            <strong style="color: #00e699; font-size: 0.82rem;">📍 PAST GIG</strong><br>
            <strong style="font-size: 0.95rem; color: #fff;">${past.venue}</strong><br>
            <span style="font-size: 0.78rem; color: #a1a1aa;">${past.city} • ${past.date}</span><br>
            <span style="font-size: 0.72rem; color: #38bdf8;">"${past.notes}"</span>
          </div>
        `);

        marker.on('click', () => {
          const mapSearchUrl = `https://maps.google.com/?q=${encodeURIComponent(past.venue + ' ' + past.city)}`;
          updateGigBanner(past.venue, `Played on ${past.date} | ${past.city}`, "📍 PAST VENUE", "#00e699");
          updateVenueDetailCard(past.venue, "5.0", `${past.city} • "${past.notes}"`, mapSearchUrl, [
            { icon: "fa-clock-rotate-left", text: `Gig Date: ${past.date}` },
            { icon: "fa-location-dot", text: past.city },
            { icon: "fa-star", text: "5.0 Fan Rating" }
          ]);
        });
      });
    }

    // Trigger map resize after bottom sheet animation finishes
    setTimeout(() => {
      leafletMapInstance.invalidateSize();
      if (GIG_DATA.hasUpcoming) {
        leafletMapInstance.setView([GIG_DATA.upcoming.lat, GIG_DATA.upcoming.lng], 6);
      }
    }, 350);
  }

  function updateGigBanner(venue, meta, statusText, color) {
    if (gigBannerVenue) gigBannerVenue.textContent = venue;
    if (gigBannerMeta) gigBannerMeta.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${meta}`;
    if (gigStatusBadge) {
      gigStatusBadge.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${statusText}`;
      gigStatusBadge.style.color = color || "#ffd700";
    }
  }

  function updateVenueDetailCard(name, rating, city, bookingUrl, chips) {
    const venueCardName = document.getElementById('venueCardName');
    const venueRatingText = document.getElementById('venueRatingText');
    const venueCardCity = document.getElementById('venueCardCity');
    const venueBookingBtn = document.getElementById('venueBookingBtn');
    const venueGalleryContainer = document.getElementById('venueGalleryContainer');

    if (venueCardName) venueCardName.textContent = name;
    if (venueRatingText) venueRatingText.textContent = `${rating} / 5.0`;
    if (venueCardCity) venueCardCity.textContent = city;
    if (venueBookingBtn) venueBookingBtn.href = bookingUrl || '#';

    if (venueGalleryContainer && chips && Array.isArray(chips)) {
      venueGalleryContainer.innerHTML = chips.map(c => `
        <div class="gallery-chip"><i class="fa-solid ${c.icon}"></i> ${c.text}</div>
      `).join('');
    }
  }

  // Open Bottom Sheet Modal
  if (floatingGigPillBtn && gigMapModal) {
    floatingGigPillBtn.addEventListener('click', () => {
      gigMapModal.classList.add('active');
      initGigMap();
    });
  }

  // Close Bottom Sheet Modal
  if (closeGigMapSheet && gigMapModal) {
    closeGigMapSheet.addEventListener('click', () => {
      gigMapModal.classList.remove('active');
    });

    gigMapModal.addEventListener('click', (e) => {
      if (e.target === gigMapModal) {
        gigMapModal.classList.remove('active');
      }
    });
  }

  // -------------------------------------------------------------
  // SWIPE-DOWN TO CLOSE GESTURE ON BOTTOM SHEET MODAL
  // -------------------------------------------------------------
  const bottomSheetContainer = document.getElementById('bottomSheetContainer');
  const sheetDragArea = document.getElementById('sheetDragArea');

  if (bottomSheetContainer && sheetDragArea && gigMapModal) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    function onTouchStart(e) {
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      isDragging = true;
      bottomSheetContainer.style.transition = 'none';
    }

    function onTouchMove(e) {
      if (!isDragging) return;
      currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = currentY - startY;

      // Only allow pulling downwards
      if (deltaY > 0) {
        bottomSheetContainer.style.transform = `translateY(${deltaY}px)`;
      }
    }

    function onTouchEnd() {
      if (!isDragging) return;
      isDragging = false;
      const deltaY = currentY - startY;

      bottomSheetContainer.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

      // If swiped down past 100px threshold, close modal
      if (deltaY > 100) {
        gigMapModal.classList.remove('active');
        setTimeout(() => {
          bottomSheetContainer.style.transform = '';
        }, 300);
      } else {
        bottomSheetContainer.style.transform = 'translateY(0)';
      }

      startY = 0;
      currentY = 0;
    }

    // Attach listeners to drag handle header
    sheetDragArea.addEventListener('touchstart', onTouchStart, { passive: true });
    sheetDragArea.addEventListener('touchmove', onTouchMove, { passive: true });
    sheetDragArea.addEventListener('touchend', onTouchEnd);

    sheetDragArea.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);
  }

  // -------------------------------------------------------------
  // 10. Toast Notification Helper
  // -------------------------------------------------------------
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

});
