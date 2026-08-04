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

  // ── Fetch real counts from followers.json ───────────────────
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

  // ── Re-fetch real counts every 30 minutes ───────────────────
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
  // 11. Inspired Us CTA & Per-Artist Multi-Page Rendering Engine
  // -------------------------------------------------------------
  const inspiredCtaBtn = document.getElementById('inspiredCtaBtn');
  if (inspiredCtaBtn) {
    inspiredCtaBtn.addEventListener('click', () => {
      const targetSec = document.getElementById('inspired-section');
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Multi-Page Dataset per Artist
  const INSPIRED_ARTISTS_DATA = {
    'all': {
      name: 'All Artists',
      genre: 'Curated Inspiration Vault',
      bio: 'Explore all iconic tracks driving the creative energy behind Kins.',
      iconClass: 'fa-layer-group',
      pages: [
        [
          { title: 'My Number', artist: 'Foals', duration: '4:00', genre: 'Indie Rock', quote: 'Inspires our drum grooves', icon: 'fa-bolt' },
          { title: 'R U Mine?', artist: 'Arctic Monkeys', duration: '3:21', genre: 'Garage Rock', quote: 'Heavy guitar tone benchmark', icon: 'fa-guitar' },
          { title: 'The Less I Know', artist: 'Tame Impala', duration: '3:36', genre: 'Psychedelic', quote: 'Analog synth bass influence', icon: 'fa-sliders' },
          { title: 'Last Nite', artist: 'The Strokes', duration: '3:17', genre: 'Post-Punk', quote: 'Raw garage energy inspiration', icon: 'fa-radio' },
          { title: "Can't Stop", artist: 'Red Hot Chili Peppers', duration: '4:29', genre: 'Funk Rock', quote: 'Slap bass rhythm inspiration', icon: 'fa-fire' },
          { title: 'Mountain At My Gates', artist: 'Foals', duration: '4:02', genre: 'Math Rock', quote: 'Building climax guitar arrangement', icon: 'fa-compact-disc' }
        ],
        [
          { title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', duration: '4:32', genre: 'Alt Rock', quote: 'Moody guitar riff dynamics', icon: 'fa-headphones' },
          { title: 'Feels Like We Only...', artist: 'Tame Impala', duration: '3:15', genre: 'Neo-Psychedelia', quote: 'Dreamy vocal reverb texture', icon: 'fa-wave-square' },
          { title: 'Reptilia', artist: 'The Strokes', duration: '3:39', genre: 'Indie Rock', quote: 'Interlocking guitar leads', icon: 'fa-drum' },
          { title: 'Californication', artist: 'Red Hot Chili Peppers', duration: '5:21', genre: 'Alt Rock', quote: 'Melodic bassline inspiration', icon: 'fa-record-vinyl' },
          { title: 'Spanish Sahara', artist: 'Foals', duration: '6:50', genre: 'Atmospheric', quote: 'Patience in song structure', icon: 'fa-sliders' },
          { title: '505', artist: 'Arctic Monkeys', duration: '4:13', genre: 'Indie Rock', quote: 'Organ driven slow burner', icon: 'fa-certificate' }
        ],
        [
          { title: 'Borderline', artist: 'Tame Impala', duration: '3:57', genre: 'Synth Pop', quote: 'Vintage drum machine feel', icon: 'fa-compact-disc' },
          { title: 'Someday', artist: 'The Strokes', duration: '3:03', genre: 'Garage Rock', quote: 'Nostalgic chord progressions', icon: 'fa-sun' },
          { title: 'Dani California', artist: 'Red Hot Chili Peppers', duration: '4:42', genre: 'Funk Metal', quote: 'Vintage guitar solo energy', icon: 'fa-bolt' },
          { title: 'What Went Down', artist: 'Foals', duration: '5:00', genre: 'Hard Rock', quote: 'Explosive studio loudness', icon: 'fa-fire' },
          { title: 'Fluorescent Adolescent', artist: 'Arctic Monkeys', duration: '2:57', genre: 'Indie Rock', quote: 'Punchy bass & drums pairing', icon: 'fa-music' },
          { title: 'Let It Happen', artist: 'Tame Impala', duration: '7:46', genre: 'Electronic Rock', quote: 'Epic intro synth sequencing', icon: 'fa-headphones' }
        ]
      ]
    },
    'foals': {
      name: 'Foals',
      genre: 'Indie Rock / Math Rock',
      bio: 'Polyrhythmic energy, driving basslines, and math-rock guitar climaxes.',
      iconClass: 'fa-bolt',
      pages: [
        [
          { title: 'My Number', artist: 'Foals', duration: '4:00', genre: 'Indie Rock', quote: 'Inspires our upbeat drum grooves', icon: 'fa-bolt' },
          { title: 'Mountain At My Gates', artist: 'Foals', duration: '4:02', genre: 'Math Rock', quote: 'Building climax guitar arrangement', icon: 'fa-compact-disc' },
          { title: 'Spanish Sahara', artist: 'Foals', duration: '6:50', genre: 'Atmospheric Rock', quote: 'Patience & build-up in structure', icon: 'fa-sliders' },
          { title: 'Red Socks Pugie', artist: 'Foals', duration: '5:09', genre: 'Math Rock', quote: 'Complex guitar interlocking', icon: 'fa-guitar' }
        ],
        [
          { title: 'What Went Down', artist: 'Foals', duration: '5:00', genre: 'Alternative Metal', quote: 'Raw fuzz vocals and aggressive riffs', icon: 'fa-fire' },
          { title: 'Life Is Yours', artist: 'Foals', duration: '4:12', genre: 'Dance Punk', quote: 'Summer synth grooves', icon: 'fa-sun' },
          { title: '2001', artist: 'Foals', duration: '4:27', genre: 'Funk Rock', quote: 'Tight rhythm section syncopation', icon: 'fa-headphones' },
          { title: 'The Runner', artist: 'Foals', duration: '4:21', genre: 'Heavy Rock', quote: 'Driving stomp rhythm', icon: 'fa-drum' }
        ],
        [
          { title: 'Inhaler', artist: 'Foals', duration: '4:54', genre: 'Hard Rock', quote: 'Massive fuzz chorus explosion', icon: 'fa-bolt' },
          { title: 'Olympic Airways', artist: 'Foals', duration: '4:19', genre: 'Indie Rock', quote: 'Clean delay-driven guitar lines', icon: 'fa-radio' },
          { title: 'Late Night', artist: 'Foals', duration: '5:27', genre: 'Post-Rock', quote: 'Emotional guitar solos', icon: 'fa-certificate' },
          { title: 'Exits', artist: 'Foals', duration: '5:57', genre: 'Art Rock', quote: 'Hypnotic bass groove loops', icon: 'fa-wave-square' }
        ]
      ]
    },
    'arctic-monkeys': {
      name: 'Arctic Monkeys',
      genre: 'Garage Rock / Post-Punk',
      bio: 'Dark guitar riffs, sharp lyrics, and punchy garage rock rhythm section.',
      iconClass: 'fa-guitar',
      pages: [
        [
          { title: 'R U Mine?', artist: 'Arctic Monkeys', duration: '3:21', genre: 'Garage Rock', quote: 'Heavy guitar tone benchmark', icon: 'fa-guitar' },
          { title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', duration: '4:32', genre: 'Stoner Rock', quote: 'Moody riff dynamics', icon: 'fa-headphones' },
          { title: '505', artist: 'Arctic Monkeys', duration: '4:13', genre: 'Indie Rock', quote: 'Organ driven slow build to crash', icon: 'fa-certificate' },
          { title: 'I Bet You Look Good', artist: 'Arctic Monkeys', duration: '2:53', genre: 'Post-Punk', quote: 'High tempo live adrenaline', icon: 'fa-bolt' }
        ],
        [
          { title: 'Fluorescent Adolescent', artist: 'Arctic Monkeys', duration: '2:57', genre: 'Indie Pop', quote: 'Punchy bass & drums pairing', icon: 'fa-music' },
          { title: 'Arabella', artist: 'Arctic Monkeys', duration: '3:27', genre: 'Hard Rock', quote: 'Sabbath-style heavy chorus drop', icon: 'fa-fire' },
          { title: 'Crying Lightning', artist: 'Arctic Monkeys', duration: '3:43', genre: 'Psychedelic Rock', quote: 'Twisted bassline riffs', icon: 'fa-sliders' },
          { title: 'Teddy Picker', artist: 'Arctic Monkeys', duration: '2:43', genre: 'Indie Rock', quote: 'Sharp rhythm guitars', icon: 'fa-compact-disc' }
        ],
        [
          { title: 'Brianstorm', artist: 'Arctic Monkeys', duration: '2:50', genre: 'Speed Rock', quote: 'Relentless drum fill energy', icon: 'fa-drum' },
          { title: 'Cornerstone', artist: 'Arctic Monkeys', duration: '3:17', genre: 'Pop Rock', quote: 'Melodic storytelling vocal line', icon: 'fa-sun' },
          { title: 'Four Out Of Five', artist: 'Arctic Monkeys', duration: '5:12', genre: 'Glam Rock', quote: 'Lounge vintage piano keys', icon: 'fa-radio' },
          { title: 'Snap Out Of It', artist: 'Arctic Monkeys', duration: '3:13', genre: 'Pop Rock', quote: 'Catchy handclap rhythms', icon: 'fa-thumbs-up' }
        ]
      ]
    },
    'tame-impala': {
      name: 'Tame Impala',
      genre: 'Psychedelic Synth / Neo-Psychedelia',
      bio: 'Psychedelic synths, hypnotic disco-rock grooves, and lush studio production.',
      iconClass: 'fa-sliders',
      pages: [
        [
          { title: 'The Less I Know', artist: 'Tame Impala', duration: '3:36', genre: 'Psychedelic Disco', quote: 'Analog synth bassline tone', icon: 'fa-sliders' },
          { title: 'Feels Like We Only...', artist: 'Tame Impala', duration: '3:15', genre: 'Neo-Psychedelia', quote: 'Dreamy vocal reverb texture', icon: 'fa-wave-square' },
          { title: 'Borderline', artist: 'Tame Impala', duration: '3:57', genre: 'Synth Pop', quote: 'Vintage drum machine feel', icon: 'fa-compact-disc' },
          { title: 'Let It Happen', artist: 'Tame Impala', duration: '7:46', genre: 'Electronic Rock', quote: 'Epic intro synth sequencing', icon: 'fa-headphones' }
        ],
        [
          { title: 'Elephant', artist: 'Tame Impala', duration: '3:31', genre: 'Psychedelic Rock', quote: 'Heavy distorted bass riffing', icon: 'fa-guitar' },
          { title: 'Lost In Yesterday', artist: 'Tame Impala', duration: '4:09', genre: 'Disco Rock', quote: 'Driving bass groove', icon: 'fa-bolt' },
          { title: 'Mind Mischief', artist: 'Tame Impala', duration: '4:31', genre: 'Psychedelic', quote: 'Flanged guitar rhythm loop', icon: 'fa-fire' },
          { title: 'Breathe Deeper', artist: 'Tame Impala', duration: '6:12', genre: 'House/Synth', quote: 'Chilled piano chords into 303 acid synth', icon: 'fa-music' }
        ],
        [
          { title: 'Eventually', artist: 'Tame Impala', duration: '5:19', genre: 'Synth Rock', quote: 'Crushing synth-fuzz hits', icon: 'fa-certificate' },
          { title: 'Is It True', artist: 'Tame Impala', duration: '3:58', genre: 'Dance Rock', quote: 'Funky bass pulse', icon: 'fa-radio' },
          { title: 'New Person, Same Old', artist: 'Tame Impala', duration: '6:04', genre: 'R&B Psychedelia', quote: 'Low-end sub bass atmosphere', icon: 'fa-drum' },
          { title: 'Solitude Is Bliss', artist: 'Tame Impala', duration: '3:55', genre: 'Fuzz Rock', quote: 'Classic phaser guitar chords', icon: 'fa-sun' }
        ]
      ]
    },
    'the-strokes': {
      name: 'The Strokes',
      genre: 'New York Indie Rock / Post-Punk Revival',
      bio: 'Raw New York indie rock, interlocking guitar melodies, and effortless hooks.',
      iconClass: 'fa-radio',
      pages: [
        [
          { title: 'Last Nite', artist: 'The Strokes', duration: '3:17', genre: 'Post-Punk', quote: 'Raw garage energy inspiration', icon: 'fa-radio' },
          { title: 'Reptilia', artist: 'The Strokes', duration: '3:39', genre: 'Indie Rock', quote: 'Interlocking guitar leads', icon: 'fa-drum' },
          { title: 'Someday', artist: 'The Strokes', duration: '3:03', genre: 'Garage Rock', quote: 'Nostalgic chord progressions', icon: 'fa-sun' },
          { title: 'The Adults Are Talking', artist: 'The Strokes', duration: '4:47', genre: 'New Wave', quote: 'Clean drum machine rhythm', icon: 'fa-compact-disc' }
        ],
        [
          { title: 'Hard To Explain', artist: 'The Strokes', duration: '3:44', genre: 'Indie Rock', quote: 'Compressed studio drum sound', icon: 'fa-headphones' },
          { title: '12:51', artist: 'The Strokes', duration: '2:33', genre: 'New Wave', quote: 'Synth-like guitar solo tone', icon: 'fa-bolt' },
          { title: 'Juicebox', artist: 'The Strokes', duration: '3:17', genre: 'Hard Rock', quote: 'Aggressive fuzz bass intro', icon: 'fa-fire' },
          { title: 'Under Cover of Darkness', artist: 'The Strokes', duration: '3:57', genre: 'Indie Pop', quote: 'Upbeat dual guitar harmonies', icon: 'fa-guitar' }
        ],
        [
          { title: 'Machu Picchu', artist: 'The Strokes', duration: '3:29', genre: 'Reggae Rock', quote: 'Funky muted guitar skank', icon: 'fa-sliders' },
          { title: 'Is This It', artist: 'The Strokes', duration: '2:35', genre: 'Garage Rock', quote: 'Laid back bass groove', icon: 'fa-music' },
          { title: 'Automatic Stop', artist: 'The Strokes', duration: '3:26', genre: 'Indie Rock', quote: 'Arpeggiated guitar weave', icon: 'fa-wave-square' },
          { title: 'You Only Live Once', artist: 'The Strokes', duration: '3:09', genre: 'Indie Rock', quote: 'Anthemic opening riff', icon: 'fa-certificate' }
        ]
      ]
    },
    'rhcp': {
      name: 'Red Hot Chili Peppers',
      genre: 'Funk Rock / Alternative Rock',
      bio: 'Slap basslines, explosive drum grooves, and soaring anthemic guitar hooks.',
      iconClass: 'fa-fire',
      pages: [
        [
          { title: "Can't Stop", artist: 'Red Hot Chili Peppers', duration: '4:29', genre: 'Funk Rock', quote: 'Slap bass & percussive guitar intro', icon: 'fa-fire' },
          { title: 'Californication', artist: 'Red Hot Chili Peppers', duration: '5:21', genre: 'Alt Rock', quote: 'Melodic bassline storytelling', icon: 'fa-record-vinyl' },
          { title: 'Dani California', artist: 'Red Hot Chili Peppers', duration: '4:42', genre: 'Funk Metal', quote: 'Vintage wah guitar solo energy', icon: 'fa-bolt' },
          { title: 'By The Way', artist: 'Red Hot Chili Peppers', duration: '3:37', genre: 'Funk Rock', quote: 'Rapid Verse to Melodic Chorus dynamics', icon: 'fa-guitar' }
        ],
        [
          { title: 'Scar Tissue', artist: 'Red Hot Chili Peppers', duration: '3:37', genre: 'Alt Rock', quote: 'Soulful slide guitar licks', icon: 'fa-sun' },
          { title: 'Under The Bridge', artist: 'Red Hot Chili Peppers', duration: '4:24', genre: 'Ballad', quote: 'Hendrix-inspired chord embellishments', icon: 'fa-sliders' },
          { title: 'Give It Away', artist: 'Red Hot Chili Peppers', duration: '4:43', genre: 'Funk Rock', quote: 'Unstoppable rhythm pocket', icon: 'fa-drum' },
          { title: 'Snow (Hey Oh)', artist: 'Red Hot Chili Peppers', duration: '5:34', genre: 'Indie Rock', quote: 'Fast arpeggiated guitar riffing', icon: 'fa-compact-disc' }
        ],
        [
          { title: 'Dark Necessities', artist: 'Red Hot Chili Peppers', duration: '5:02', genre: 'Funk Rock', quote: 'Piano & slap bass combo', icon: 'fa-headphones' },
          { title: 'Black Summer', artist: 'Red Hot Chili Peppers', duration: '3:52', genre: 'Alt Rock', quote: 'Classic Frusciante bend tones', icon: 'fa-certificate' },
          { title: 'Otherside', artist: 'Red Hot Chili Peppers', duration: '4:15', genre: 'Post-Punk', quote: 'Minimalist bass & vocal space', icon: 'fa-wave-square' },
          { title: 'Tell Me Baby', artist: 'Red Hot Chili Peppers', duration: '4:07', genre: 'Funk Rock', quote: 'High-energy chorus groove', icon: 'fa-music' }
        ]
      ]
    }
  };

  // State Management for Per-Artist Multi-Page Pagination
  let currentArtistKey = 'all';
  let currentPageIndex = 0;

  // DOM Elements
  const artistFilterBtns = document.querySelectorAll('#artistFilterBar .filter-pill-btn');
  const spotlightName = document.getElementById('spotlightName');
  const spotlightGenre = document.getElementById('spotlightGenre');
  const spotlightBio = document.getElementById('spotlightBio');
  const spotlightAvatar = document.getElementById('spotlightAvatar');
  const spotlightTrackCount = document.getElementById('spotlightTrackCount');

  const pagePillsContainer = document.getElementById('pagePillsContainer');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageCounterText = document.getElementById('pageCounterText');
  const inspiredTracksContainer = document.getElementById('inspiredTracksContainer');

  // Bottom Audio Bar Elements
  const bottomAudioBar = document.getElementById('bottomAudioBar');
  const audioBarTitle = document.getElementById('audioBarTitle');
  const audioBarArtist = document.getElementById('audioBarArtist');
  const audioBarToggleBtn = document.getElementById('audioBarToggleBtn');
  const audioBarCloseBtn = document.getElementById('audioBarCloseBtn');
  let isPlayingAudio = false;

  // Initialize Hero Studio Live Song Ticker
  const tickerSongs = [
    'Foals — My Number',
    'Arctic Monkeys — R U Mine?',
    'Tame Impala — The Less I Know',
    'The Strokes — Reptilia',
    'RHCP — Can\'t Stop'
  ];
  let tickerIdx = 0;
  const heroStudioTicker = document.getElementById('heroStudioTicker');
  if (heroStudioTicker) {
    setInterval(() => {
      tickerIdx = (tickerIdx + 1) % tickerSongs.length;
      heroStudioTicker.style.opacity = '0';
      setTimeout(() => {
        heroStudioTicker.textContent = tickerSongs[tickerIdx];
        heroStudioTicker.style.opacity = '1';
      }, 300);
    }, 4000);
  }

  // Render Artist Header & Multi-Page View
  function renderArtistView(artistKey, pageIdx = 0) {
    const artistData = INSPIRED_ARTISTS_DATA[artistKey] || INSPIRED_ARTISTS_DATA['all'];
    currentArtistKey = artistKey;

    const totalPages = artistData.pages.length;
    currentPageIndex = Math.max(0, Math.min(pageIdx, totalPages - 1));

    // Update Spotlight Banner
    if (spotlightName) spotlightName.textContent = artistData.name;
    if (spotlightGenre) spotlightGenre.textContent = artistData.genre;
    if (spotlightBio) spotlightBio.textContent = artistData.bio;
    if (spotlightAvatar) {
      spotlightAvatar.innerHTML = `<i class="fa-solid ${artistData.iconClass}"></i>`;
    }
    
    // Count total tracks for artist across all pages
    let totalTrackCount = 0;
    artistData.pages.forEach(p => totalTrackCount += p.length);
    if (spotlightTrackCount) {
      spotlightTrackCount.innerHTML = `<i class="fa-solid fa-music"></i> ${totalTrackCount} Tracks`;
    }

    // Render Page Pill Buttons
    if (pagePillsContainer) {
      pagePillsContainer.innerHTML = '';
      for (let i = 0; i < totalPages; i++) {
        const pill = document.createElement('button');
        pill.className = `page-pill-btn ${i === currentPageIndex ? 'active' : ''}`;
        pill.innerHTML = `<span>Page ${i + 1}</span>`;
        pill.addEventListener('click', () => {
          renderArtistView(currentArtistKey, i);
        });
        pagePillsContainer.appendChild(pill);
      }
    }

    // Update Prev / Next Buttons State
    if (prevPageBtn) {
      prevPageBtn.disabled = (currentPageIndex === 0);
    }
    if (nextPageBtn) {
      nextPageBtn.disabled = (currentPageIndex === totalPages - 1);
    }

    // Update Page Counter Text
    if (pageCounterText) {
      pageCounterText.textContent = `Page ${currentPageIndex + 1} of ${totalPages}`;
    }

    // Render Track Cards for active page with transition
    if (inspiredTracksContainer) {
      inspiredTracksContainer.style.opacity = '0';
      inspiredTracksContainer.style.transform = 'translateY(8px)';

      setTimeout(() => {
        inspiredTracksContainer.innerHTML = '';
        const pageTracks = artistData.pages[currentPageIndex] || [];

        pageTracks.forEach(track => {
          const card = document.createElement('div');
          card.className = 'music-card paginated-card';
          card.innerHTML = `
            <div class="music-card-thumb">
              <i class="fa-solid ${track.icon || 'fa-music'} thumb-icon"></i>
              <div class="vinyl-disc-mini"><i class="fa-solid fa-compact-disc"></i></div>
            </div>
            <div class="music-card-info">
              <div class="card-title-row">
                <span class="song-title">${track.title}</span>
                <span class="track-duration">${track.duration}</span>
              </div>
              <span class="artist-name">${track.artist}</span>
              <div class="card-badge-row">
                <span class="genre-tag">${track.genre}</span>
                <span class="quote-tag" title="${track.quote}"><i class="fa-solid fa-quote-left"></i> ${track.quote}</span>
              </div>
            </div>
            <button class="play-btn" aria-label="Play song" data-song="${track.title}" data-artist="${track.artist}">
              <i class="fa-solid fa-play"></i>
            </button>
          `;

          // Attach play event listener
          const playBtn = card.querySelector('.play-btn');
          if (playBtn) {
            playBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              playTrackPreview(track.title, track.artist);
            });
          }

          inspiredTracksContainer.appendChild(card);
        });

        inspiredTracksContainer.style.opacity = '1';
        inspiredTracksContainer.style.transform = 'translateY(0)';
      }, 180);
    }
  }

  // Filter Pill Button Listeners
  artistFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      artistFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const artistKey = btn.getAttribute('data-artist-key') || 'all';
      renderArtistView(artistKey, 0);
    });
  });

  // Prev / Next Page Controls
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPageIndex > 0) {
        renderArtistView(currentArtistKey, currentPageIndex - 1);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const artistData = INSPIRED_ARTISTS_DATA[currentArtistKey] || INSPIRED_ARTISTS_DATA['all'];
      if (currentPageIndex < artistData.pages.length - 1) {
        renderArtistView(currentArtistKey, currentPageIndex + 1);
      }
    });
  }

  // Floating Audio Preview Player Handler
  function playTrackPreview(songTitle, artistName) {
    if (bottomAudioBar) {
      bottomAudioBar.classList.remove('hidden');
      bottomAudioBar.classList.add('active-player');
    }
    if (audioBarTitle) audioBarTitle.textContent = songTitle;
    if (audioBarArtist) audioBarArtist.textContent = artistName;

    isPlayingAudio = true;
    if (audioBarToggleBtn) {
      audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    }

    showToast(`Now Playing Preview: "${songTitle}" by ${artistName}`);
  }

  if (audioBarToggleBtn) {
    audioBarToggleBtn.addEventListener('click', () => {
      isPlayingAudio = !isPlayingAudio;
      if (isPlayingAudio) {
        audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        bottomAudioBar.classList.add('active-player');
        showToast('Resumed Track Preview');
      } else {
        audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
        bottomAudioBar.classList.remove('active-player');
        showToast('Paused Track Preview');
      }
    });
  }

  if (audioBarCloseBtn) {
    audioBarCloseBtn.addEventListener('click', () => {
      if (bottomAudioBar) {
        bottomAudioBar.classList.add('hidden');
        bottomAudioBar.classList.remove('active-player');
      }
      isPlayingAudio = false;
    });
  }

  // Initial Render: Load 'all' artists page 0
  renderArtistView('all', 0);

  // -------------------------------------------------------------
  // 12. Toast Notification Helper
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
