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

  // -------------------------------------------------------------
  // 10. Wallpaper Dynamic Color Theme Extractor
  // -------------------------------------------------------------
  function initWallpaperColorExtractor() {
    const heroImg = document.querySelector('.hero-banner-img');
    if (!heroImg) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = heroImg.src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 20;
        canvas.height = 20;
        ctx.drawImage(img, 0, 0, 20, 20);

        const imgData = ctx.getImageData(0, 0, 20, 20).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          // Average non-black/non-white pixels
          const pr = imgData[i];
          const pg = imgData[i + 1];
          const pb = imgData[i + 2];
          const brightness = (pr + pg + pb) / 3;

          if (brightness > 15 && brightness < 240) {
            r += pr;
            g += pg;
            b += pb;
            count++;
          }
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          // Darkened background color for contrast
          const darkBgR = Math.max(1, Math.floor(r * 0.25));
          const darkBgG = Math.max(20, Math.floor(g * 0.35));
          const darkBgB = Math.max(15, Math.floor(b * 0.3));

          document.documentElement.style.setProperty('--bg-dark', `rgb(${darkBgR}, ${darkBgG}, ${darkBgB})`);
          document.documentElement.style.setProperty('--hero-gradient-end', `rgb(${darkBgR}, ${darkBgG}, ${darkBgB})`);
        }
      } catch (e) {
        console.log('Wallpaper theme color extraction active.');
      }
    };
  }
  initWallpaperColorExtractor();

  // -------------------------------------------------------------
  // 11. Genre-Based Track Vault with iTunes Metadata
  // -------------------------------------------------------------
  // iTunes Metadata Cache & API Fetcher
  const ITUNES_CACHE = {};

  async function getITunesTrackData(artist, title) {
    const cacheKey = `${artist} - ${title}`.toLowerCase();
    if (ITUNES_CACHE[cacheKey]) return ITUNES_CACHE[cacheKey];

    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const result = {
          artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : null,
          previewUrl: item.previewUrl || null
        };
        ITUNES_CACHE[cacheKey] = result;
        return result;
      }
    } catch (e) {
      console.warn('iTunes API fallback:', e);
    }
    return { artworkUrl: null, previewUrl: null };
  }

  // State Management for Per-Artist Genre-Based Pagination
  let currentArtistKey = 'all';
  let currentPageIndex = 0;

  // DOM Elements
  const artistFilterBtns = document.querySelectorAll('#artistFilterBar .filter-pill-btn');
  const inspiredTracksContainer = document.getElementById('inspiredTracksContainer');
  const dotsPaginationContainer = document.getElementById('dotsPaginationContainer');

  // Bottom Audio Player Elements
  const bottomAudioBar = document.getElementById('bottomAudioBar');
  const audioBarTitle = document.getElementById('audioBarTitle');
  const audioBarArtist = document.getElementById('audioBarArtist');
  const audioBarToggleBtn = document.getElementById('audioBarToggleBtn');
  const audioBarCloseBtn = document.getElementById('audioBarCloseBtn');
  const audioBarCoverImg = document.getElementById('audioBarCoverImg');
  const audioBarFallbackIcon = document.getElementById('audioBarFallbackIcon');
  const vaultAudioPlayer = document.getElementById('vaultAudioPlayer');

  let isPlayingAudio = false;
  let currentPlayingTrack = null;

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

  // -------------------------------------------------------------
  // Track Play Buttons Helper (In-Place Update without Re-rendering)
  // -------------------------------------------------------------
  function updateTrackPlayButtons() {
    if (!inspiredTracksContainer) return;
    const playBtns = inspiredTracksContainer.querySelectorAll('.play-btn');
    playBtns.forEach(btn => {
      const songTitle = btn.getAttribute('data-song');
      const isThisTrackPlaying = currentPlayingTrack && currentPlayingTrack.title === songTitle && isPlayingAudio;
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = `fa-solid ${isThisTrackPlaying ? 'fa-pause' : 'fa-play'}`;
      }
    });

    if (bottomAudioBar) {
      if (isPlayingAudio) {
        bottomAudioBar.classList.add('active-player');
        bottomAudioBar.classList.remove('paused-player');
      } else {
        bottomAudioBar.classList.remove('active-player');
        bottomAudioBar.classList.add('paused-player');
      }
    }
  }

  // Directional Track rendering with Swipe Animation
  let prevPageIndex = 0;
  let prevArtistKey = 'all';

  function renderArtistView(artistKey, pageIdx = 0, overrideDirection = null) {
    const artistData = INSPIRED_ARTISTS_DATA[artistKey] || INSPIRED_ARTISTS_DATA['all'];
    
    // Determine slide direction
    let direction = overrideDirection;
    if (!direction) {
      if (artistKey !== prevArtistKey) {
        direction = 'next';
      } else if (pageIdx > prevPageIndex) {
        direction = 'next';
      } else if (pageIdx < prevPageIndex) {
        direction = 'prev';
      } else {
        direction = 'fade';
      }
    }

    currentArtistKey = artistKey;
    const totalPages = artistData.pages.length;
    currentPageIndex = Math.max(0, Math.min(pageIdx, totalPages - 1));
    prevPageIndex = currentPageIndex;
    prevArtistKey = currentArtistKey;

    // Render Bottom Pagination Dots
    if (dotsPaginationContainer) {
      dotsPaginationContainer.innerHTML = '';
      if (totalPages > 1) {
        dotsPaginationContainer.style.display = 'flex';
        for (let i = 0; i < totalPages; i++) {
          const dot = document.createElement('button');
          dot.className = `inspired-dot ${i === currentPageIndex ? 'active' : ''}`;
          dot.setAttribute('aria-label', `Page ${i + 1}`);
          dot.addEventListener('click', () => {
            const dir = i > currentPageIndex ? 'next' : 'prev';
            renderArtistView(currentArtistKey, i, dir);
          });
          dotsPaginationContainer.appendChild(dot);
        }
      } else {
        dotsPaginationContainer.style.display = 'none';
      }
    }

    // Render Track Cards with Directional Slide / Swipe Animation
    if (inspiredTracksContainer) {
      let exitTransform = 'translateY(8px)';
      let enterTransform = 'translateX(40px)';

      if (direction === 'next') {
        exitTransform = 'translateX(-40px)';
        enterTransform = 'translateX(40px)';
      } else if (direction === 'prev') {
        exitTransform = 'translateX(40px)';
        enterTransform = 'translateX(-40px)';
      }

      inspiredTracksContainer.style.transition = 'all 0.16s ease-in';
      inspiredTracksContainer.style.opacity = '0';
      inspiredTracksContainer.style.transform = exitTransform;

      setTimeout(() => {
        inspiredTracksContainer.innerHTML = '';
        const pageTracks = artistData.pages[currentPageIndex] || [];

        pageTracks.forEach(track => {
          const isThisTrackPlaying = currentPlayingTrack && currentPlayingTrack.title === track.title && isPlayingAudio;
          const card = document.createElement('div');
          card.className = 'music-card paginated-card';
          card.innerHTML = `
            <div class="music-card-thumb">
              <img class="track-artwork-img hidden" alt="${track.title} cover">
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
              <i class="fa-solid ${isThisTrackPlaying ? 'fa-pause' : 'fa-play'}"></i>
            </button>
          `;

          // Async iTunes Cover Art loading
          getITunesTrackData(track.artist, track.title).then(meta => {
            if (meta && meta.artworkUrl) {
              const imgEl = card.querySelector('.track-artwork-img');
              const iconEl = card.querySelector('.thumb-icon');
              if (imgEl) {
                imgEl.src = meta.artworkUrl;
                imgEl.classList.remove('hidden');
              }
              if (iconEl) iconEl.style.display = 'none';
              track.coverUrl = meta.artworkUrl;
            }
            if (meta && meta.previewUrl) {
              track.previewUrl = meta.previewUrl;
            }
          });

          // Attach play event listener
          const playBtn = card.querySelector('.play-btn');
          if (playBtn) {
            playBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              playTrackPreview(track);
            });
          }

          inspiredTracksContainer.appendChild(card);
        });

        // Prepare for slide IN
        inspiredTracksContainer.style.transition = 'none';
        inspiredTracksContainer.style.transform = enterTransform;
        inspiredTracksContainer.style.opacity = '0';

        // Force reflow
        void inspiredTracksContainer.offsetWidth;

        // Slide IN smoothly
        inspiredTracksContainer.style.transition = 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
        inspiredTracksContainer.style.opacity = '1';
        inspiredTracksContainer.style.transform = 'translateX(0)';
      }, 160);
    }
  }

  // Filter Pill Button Listeners
  artistFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      artistFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const artistKey = btn.getAttribute('data-artist-key') || 'all';
      renderArtistView(artistKey, 0, 'next');
    });
  });

  // Swipe Gesture Handling for Touch Devices
  let swipeStartX = 0;
  let swipeEndX = 0;
  if (inspiredTracksContainer) {
    inspiredTracksContainer.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        swipeStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    inspiredTracksContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        swipeEndX = e.changedTouches[0].screenX;
        const artistData = INSPIRED_ARTISTS_DATA[currentArtistKey] || INSPIRED_ARTISTS_DATA['all'];
        const totalPages = artistData.pages.length;
        const swipeDiff = swipeStartX - swipeEndX;

        if (swipeDiff > 45 && currentPageIndex < totalPages - 1) {
          renderArtistView(currentArtistKey, currentPageIndex + 1, 'next');
        } else if (swipeDiff < -45 && currentPageIndex > 0) {
          renderArtistView(currentArtistKey, currentPageIndex - 1, 'prev');
        }
      }
    }, { passive: true });
  }

  // Floating Audio Preview Player Handler
  async function playTrackPreview(track) {
    const songTitle = typeof track === 'string' ? track : track.title;
    const artistName = typeof track === 'object' ? track.artist : 'Artist';
    const trackObj = typeof track === 'object' ? track : { title: songTitle, artist: artistName };

    // Toggle play/pause if clicking the currently playing track
    if (currentPlayingTrack && currentPlayingTrack.title === trackObj.title) {
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) {
          vaultAudioPlayer.play();
        } else {
          vaultAudioPlayer.pause();
        }
      }
      if (audioBarToggleBtn) {
        audioBarToggleBtn.innerHTML = `<i class="fa-solid ${isPlayingAudio ? 'fa-pause' : 'fa-play'}"></i>`;
      }
      updateTrackPlayButtons();
      showToast(isPlayingAudio ? `Resumed: "${trackObj.title}"` : `Paused: "${trackObj.title}"`);
      return;
    }

    currentPlayingTrack = trackObj;

    // Show bottom audio player
    if (bottomAudioBar) {
      bottomAudioBar.classList.remove('hidden');
      bottomAudioBar.classList.add('active-player');
      bottomAudioBar.classList.remove('paused-player');
      document.body.classList.add('audio-bar-active');
    }

    if (audioBarTitle) audioBarTitle.textContent = trackObj.title;
    if (audioBarArtist) audioBarArtist.textContent = trackObj.artist;

    // Update Cover Image in Bottom Audio Bar
    if (trackObj.coverUrl) {
      if (audioBarCoverImg) {
        audioBarCoverImg.src = trackObj.coverUrl;
        audioBarCoverImg.classList.remove('hidden');
      }
      if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'none';
    } else {
      if (audioBarCoverImg) audioBarCoverImg.classList.add('hidden');
      if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'block';
    }

    // Fetch iTunes audio stream if missing
    let previewUrl = trackObj.previewUrl;
    if (!previewUrl) {
      const meta = await getITunesTrackData(trackObj.artist, trackObj.title);
      if (meta && meta.previewUrl) previewUrl = meta.previewUrl;
      if (meta && meta.artworkUrl && audioBarCoverImg) {
        audioBarCoverImg.src = meta.artworkUrl;
        audioBarCoverImg.classList.remove('hidden');
        if (audioBarFallbackIcon) audioBarFallbackIcon.style.display = 'none';
      }
    }

    // Play Audio using HTML5 Audio Element
    if (vaultAudioPlayer && previewUrl) {
      vaultAudioPlayer.src = previewUrl;
      vaultAudioPlayer.play().then(() => {
        isPlayingAudio = true;
        if (audioBarToggleBtn) audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        updateTrackPlayButtons();
        showToast(`Now Playing: "${trackObj.title}" by ${trackObj.artist}`);
      }).catch(err => {
        console.log('Audio autoplay info:', err);
        isPlayingAudio = true;
        if (audioBarToggleBtn) audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        updateTrackPlayButtons();
        showToast(`Playing: "${trackObj.title}"`);
      });
    } else {
      isPlayingAudio = true;
      if (audioBarToggleBtn) audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
      updateTrackPlayButtons();
      showToast(`Playing: "${trackObj.title}" by ${trackObj.artist}`);
    }
  }

  // Audio Play / Pause toggle
  if (audioBarToggleBtn) {
    audioBarToggleBtn.addEventListener('click', () => {
      isPlayingAudio = !isPlayingAudio;
      if (vaultAudioPlayer) {
        if (isPlayingAudio) {
          vaultAudioPlayer.play();
        } else {
          vaultAudioPlayer.pause();
        }
      }
      if (isPlayingAudio) {
        audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        bottomAudioBar.classList.add('active-player');
        bottomAudioBar.classList.remove('paused-player');
        document.body.classList.add('audio-bar-active');
        showToast('Resumed Track Preview');
      } else {
        audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
        bottomAudioBar.classList.remove('active-player');
        bottomAudioBar.classList.add('paused-player');
        showToast('Paused Track Preview');
      }
      updateTrackPlayButtons();
    });
  }

  // Audio Ended Handler
  if (vaultAudioPlayer) {
    vaultAudioPlayer.addEventListener('ended', () => {
      isPlayingAudio = false;
      if (audioBarToggleBtn) audioBarToggleBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
      if (bottomAudioBar) {
        bottomAudioBar.classList.remove('active-player');
        bottomAudioBar.classList.add('paused-player');
      }
      updateTrackPlayButtons();
    });
  }

  if (audioBarCloseBtn) {
    audioBarCloseBtn.addEventListener('click', () => {
      if (vaultAudioPlayer) {
        vaultAudioPlayer.pause();
      }
      if (bottomAudioBar) {
        bottomAudioBar.classList.add('hidden');
        bottomAudioBar.classList.remove('active-player');
        bottomAudioBar.classList.remove('paused-player');
      }
      document.body.classList.remove('audio-bar-active');
      isPlayingAudio = false;
      currentPlayingTrack = null;
      updateTrackPlayButtons();
    });
  }

  // Initial Render: Load 'all' artists page 0
  renderArtistView('all', 0);

  // -------------------------------------------------------------
  // 12. Toast Notification Helper (Throttled Single Alert Instance)
  // -------------------------------------------------------------
  let activeToast = null;
  let activeToastTimeout = null;

  function showToast(message) {
    if (!toastContainer) return;

    // Immediately remove existing active toast to prevent multiple stacking alerts
    if (activeToast) {
      clearTimeout(activeToastTimeout);
      activeToast.remove();
      activeToast = null;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color: #53c678;"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    activeToast = toast;

    activeToastTimeout = setTimeout(() => {
      if (toast) {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
          toast.remove();
          if (activeToast === toast) activeToast = null;
        }, 220);
      }
    }, 2800);
  }

  // -------------------------------------------------------------
  // 13. Dynamic Theme & Wallpaper Adaptability Engine
  // -------------------------------------------------------------
  const PRESET_THEMES = {
    classic: {
      name: 'Classic Light',
      dark: {
        // M3 Dark variant of Classic — deep emerald Kins signature
        primary: '#A8C7FA',
        onPrimary: '#002d6d',
        primaryContainer: '#004397',
        surface: '#121316',
        surfaceContainer: '#1e2022',
        surfaceContainerHigh: '#282a2c',
        onSurface: '#e3e3e3',
        onSurfaceVariant: '#c4c7c0',
        outline: '#8e918a',
        outlineVariant: '#44483e',
        // Legacy aliases
        bgDark: '#0f1115',
        bgGradient: 'linear-gradient(180deg, #121316 0%, #0a0b0d 100%)',
        btnGreen: '#A8C7FA',
        btnGreenHover: '#7cacf8',
        btnTextColor: '#002d6d',
        textWhite: '#e3e3e3'
      },
      light: {
        primary: '#1A73E8',
        onPrimary: '#ffffff',
        primaryContainer: '#d3e3fd',
        surface: '#F8F9FA',
        surfaceContainer: '#eef0f2',
        surfaceContainerHigh: '#e3e5e8',
        onSurface: '#1f1f1f',
        onSurfaceVariant: '#444746',
        outline: '#74796d',
        outlineVariant: '#c4c7c0',
        bgDark: '#F8F9FA',
        bgGradient: 'linear-gradient(180deg, #ffffff 0%, #eef0f2 100%)',
        btnGreen: '#1A73E8',
        btnGreenHover: '#005AC1',
        btnTextColor: '#ffffff',
        textWhite: '#1f1f1f'
      }
    },
    slate: {
      name: 'Midnight Slate',
      dark: {
        primary: '#D0BCFF',
        onPrimary: '#381e72',
        primaryContainer: '#4f378b',
        surface: '#0F1115',
        surfaceContainer: '#1a1c20',
        surfaceContainerHigh: '#242628',
        onSurface: '#e6e1e5',
        onSurfaceVariant: '#cac4d0',
        outline: '#938f99',
        outlineVariant: '#49454f',
        bgDark: '#0F1115',
        bgGradient: 'linear-gradient(180deg, #141620 0%, #08090d 100%)',
        btnGreen: '#D0BCFF',
        btnGreenHover: '#b69df7',
        btnTextColor: '#381e72',
        textWhite: '#e6e1e5'
      },
      light: {
        primary: '#6750A4',
        onPrimary: '#ffffff',
        primaryContainer: '#eaddff',
        surface: '#fef7ff',
        surfaceContainer: '#f3edf7',
        surfaceContainerHigh: '#ece6f0',
        onSurface: '#1d1b20',
        onSurfaceVariant: '#49454f',
        outline: '#79747e',
        outlineVariant: '#cac4d0',
        bgDark: '#fef7ff',
        bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f3edf7 100%)',
        btnGreen: '#6750A4',
        btnGreenHover: '#4f378b',
        btnTextColor: '#ffffff',
        textWhite: '#1d1b20'
      }
    },
    'high-contrast': {
      name: 'Max Contrast',
      dark: {
        primary: '#ffff00',
        onPrimary: '#000000',
        primaryContainer: '#3d3d00',
        surface: '#000000',
        surfaceContainer: '#121212',
        surfaceContainerHigh: '#1e1e1e',
        onSurface: '#ffffff',
        onSurfaceVariant: '#ffffff',
        outline: '#ffffff',
        outlineVariant: '#ffffff',
        bgDark: '#000000',
        bgGradient: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)',
        btnGreen: '#ffff00',
        btnGreenHover: '#cccc00',
        btnTextColor: '#000000',
        textWhite: '#ffffff'
      },
      light: {
        primary: '#000000',
        onPrimary: '#ffffff',
        primaryContainer: '#e0e0e0',
        surface: '#ffffff',
        surfaceContainer: '#f5f5f5',
        surfaceContainerHigh: '#eeeeee',
        onSurface: '#000000',
        onSurfaceVariant: '#000000',
        outline: '#000000',
        outlineVariant: '#757575',
        bgDark: '#ffffff',
        bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
        btnGreen: '#000000',
        btnGreenHover: '#333333',
        btnTextColor: '#ffffff',
        textWhite: '#000000'
      }
    },
    terracotta: {
      name: 'Warm Sage',
      dark: {
        primary: '#ffb4ab',
        onPrimary: '#561e10',
        primaryContainer: '#733424',
        surface: '#1a1110',
        surfaceContainer: '#271d1b',
        surfaceContainerHigh: '#322825',
        onSurface: '#f1dfdb',
        onSurfaceVariant: '#d8c2bb',
        outline: '#a08d86',
        outlineVariant: '#534340',
        bgDark: '#1a1110',
        bgGradient: 'linear-gradient(180deg, #201815 0%, #0f0a08 100%)',
        btnGreen: '#ffb4ab',
        btnGreenHover: '#e09990',
        btnTextColor: '#561e10',
        textWhite: '#f1dfdb'
      },
      light: {
        primary: '#A95A44',
        onPrimary: '#ffffff',
        primaryContainer: '#ffdbd1',
        surface: '#F4F1EA',
        surfaceContainer: '#ede9e2',
        surfaceContainerHigh: '#e6e2db',
        onSurface: '#231917',
        onSurfaceVariant: '#534340',
        outline: '#85736e',
        outlineVariant: '#d8c2bb',
        bgDark: '#F4F1EA',
        bgGradient: 'linear-gradient(180deg, #faf7f2 0%, #ede9e2 100%)',
        btnGreen: '#A95A44',
        btnGreenHover: '#8b4231',
        btnTextColor: '#ffffff',
        textWhite: '#231917'
      }
    },
    cyber: {
      name: 'Vibrant Cyber',
      dark: {
        primary: '#D0BCFF',
        onPrimary: '#381e72',
        primaryContainer: '#4f378b',
        surface: '#12061e',
        surfaceContainer: '#1e1028',
        surfaceContainerHigh: '#2a1b35',
        onSurface: '#ece1f9',
        onSurfaceVariant: '#cec2d8',
        outline: '#9e8fa8',
        outlineVariant: '#4d3f58',
        bgDark: '#12061e',
        bgGradient: 'linear-gradient(180deg, #1e0a32 0%, #090214 100%)',
        btnGreen: '#FFB4AB',
        btnGreenHover: '#e0998f',
        btnTextColor: '#561e10',
        textWhite: '#ece1f9'
      },
      light: {
        primary: '#7B2D8E',
        onPrimary: '#ffffff',
        primaryContainer: '#f8d8ff',
        surface: '#fef7ff',
        surfaceContainer: '#f9eef8',
        surfaceContainerHigh: '#f2e6f2',
        onSurface: '#1e1a20',
        onSurfaceVariant: '#4d444c',
        outline: '#7f747c',
        outlineVariant: '#d0c3cc',
        bgDark: '#fef7ff',
        bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f9eef8 100%)',
        btnGreen: '#7B2D8E',
        btnGreenHover: '#621b74',
        btnTextColor: '#ffffff',
        textWhite: '#1e1a20'
      }
    }
  };

  // State
  let themeState = {
    mode: 'dark',
    themeId: 'classic',
    customWallpaperDataUrl: null,
    customColors: null
  };

  // Load Saved Theme Configuration
  function loadThemeConfig() {
    try {
      const saved = localStorage.getItem('kins_theme_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        themeState = { ...themeState, ...parsed };
      }
    } catch (e) {
      console.warn('Theme storage error:', e);
    }
    applyTheme();
  }

  function saveThemeConfig() {
    try {
      localStorage.setItem('kins_theme_config', JSON.stringify(themeState));
    } catch (e) {
      console.warn('Theme save error:', e);
    }
  }

  // Apply Theme State to DOM
  function applyTheme() {
    const isLight = themeState.mode === 'light';
    document.body.classList.toggle('theme-light', isLight);

    // Update Mode Buttons UI
    const modeDarkBtn = document.getElementById('modeDarkBtn');
    const modeLightBtn = document.getElementById('modeLightBtn');
    if (modeDarkBtn) modeDarkBtn.classList.toggle('active', !isLight);
    if (modeLightBtn) modeLightBtn.classList.toggle('active', isLight);

    // Update Palette Buttons UI
    const cards = document.querySelectorAll('.theme-circle-btn, .palette-card');
    cards.forEach(card => {
      const tid = card.getAttribute('data-theme-id');
      card.classList.toggle('active', tid === themeState.themeId && !themeState.customWallpaperDataUrl);
    });

    const ambientBg = document.getElementById('ambientWallpaperBg');
    const previewBox = document.getElementById('wallpaperPreviewBox');
    const previewImg = document.getElementById('wallpaperPreviewImg');
    const root = document.documentElement;

    if (themeState.customWallpaperDataUrl) {
      // Apply Custom Wallpaper & Extracted Palette
      if (ambientBg) {
        ambientBg.style.backgroundImage = `url(${themeState.customWallpaperDataUrl})`;
        ambientBg.classList.add('active');
      }
      if (previewBox && previewImg) {
        previewImg.src = themeState.customWallpaperDataUrl;
        previewBox.classList.remove('hidden');
      }

      if (themeState.customColors) {
        const c = themeState.customColors;
        root.style.setProperty('--md-sys-color-primary', c.btnGreen);
        root.style.setProperty('--md-sys-color-surface', c.bgDark);
        root.style.setProperty('--btn-green', c.btnGreen);
        root.style.setProperty('--btn-green-hover', c.btnGreenHover);
        root.style.setProperty('--text-white', c.textWhite || '#ffffff');
      }
    } else {
      // Apply Preset Theme Tokens
      if (ambientBg) {
        ambientBg.style.backgroundImage = '';
        ambientBg.classList.remove('active');
      }
      if (previewBox) previewBox.classList.add('hidden');

      const themeConfig = PRESET_THEMES[themeState.themeId] || PRESET_THEMES['classic'];
      const tokens = isLight ? themeConfig.light : themeConfig.dark;

      // Set M3 System Tokens
      root.style.setProperty('--md-sys-color-primary', tokens.primary);
      root.style.setProperty('--md-sys-color-on-primary', tokens.onPrimary);
      root.style.setProperty('--md-sys-color-primary-container', tokens.primaryContainer);
      root.style.setProperty('--md-sys-color-surface', tokens.surface);
      root.style.setProperty('--md-sys-color-surface-container', tokens.surfaceContainer);
      root.style.setProperty('--md-sys-color-surface-container-high', tokens.surfaceContainerHigh);
      root.style.setProperty('--md-sys-color-on-surface', tokens.onSurface);
      root.style.setProperty('--md-sys-color-on-surface-variant', tokens.onSurfaceVariant);
      root.style.setProperty('--md-sys-color-outline', tokens.outline);
      root.style.setProperty('--md-sys-color-outline-variant', tokens.outlineVariant);

      // Set Legacy Aliases
      root.style.setProperty('--bg-dark', tokens.bgDark);
      root.style.setProperty('--bg-dark-gradient', tokens.bgGradient);
      root.style.setProperty('--bg-dark-green', tokens.bgDark);
      root.style.setProperty('--bg-dark-green-gradient', tokens.bgGradient);
      root.style.setProperty('--btn-green', tokens.btnGreen);
      root.style.setProperty('--btn-green-hover', tokens.btnGreenHover);
      root.style.setProperty('--btn-text-color', tokens.btnTextColor);
      root.style.setProperty('--text-white', tokens.textWhite);
      root.style.setProperty('--card-bg', tokens.surface);
    }
  }

  // HTML5 Canvas Color Extractor for Uploaded Wallpaper
  function extractColorsFromImage(dataUrl) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = dataUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);

        const imgData = ctx.getImageData(0, 0, 40, 40).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const pr = imgData[i];
          const pg = imgData[i + 1];
          const pb = imgData[i + 2];
          const brightness = (pr + pg + pb) / 3;

          if (brightness > 20 && brightness < 235) {
            r += pr;
            g += pg;
            b += pb;
            count++;
          }
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          const darkR = Math.max(8, Math.floor(r * 0.28));
          const darkG = Math.max(12, Math.floor(g * 0.28));
          const darkB = Math.max(16, Math.floor(b * 0.28));

          const accentR = Math.min(255, Math.floor(r * 1.25));
          const accentG = Math.min(255, Math.floor(g * 1.25));
          const accentB = Math.min(255, Math.floor(b * 1.25));

          const brightness = (accentR * 299 + accentG * 587 + accentB * 114) / 1000;
          const btnTextColor = brightness > 155 ? '#0b1f18' : '#ffffff';

          themeState.customWallpaperDataUrl = dataUrl;
          themeState.themeId = 'custom';
          themeState.customColors = {
            bgDark: `rgb(${darkR}, ${darkG}, ${darkB})`,
            bgGradient: `linear-gradient(180deg, rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)}) 0%, rgb(${darkR}, ${darkG}, ${darkB}) 100%)`,
            btnGreen: `rgb(${accentR}, ${accentG}, ${accentB})`,
            btnGreenHover: `rgb(${Math.max(0, accentR - 25)}, ${Math.max(0, accentG - 25)}, ${Math.max(0, accentB - 25)})`,
            btnTextColor: btnTextColor
          };

          saveThemeConfig();
          applyTheme();
          showToast('Extracted wallpaper palette!');
        }
      } catch (err) {
        console.warn('Canvas color extraction error:', err);
      }
    };
  }

  // DOM Event Listeners for Theme Customizer Drawer
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeDrawerModal = document.getElementById('themeDrawerModal');
  const themeDrawerOverlay = document.getElementById('themeDrawerOverlay');
  const themeDrawerCloseBtn = document.getElementById('themeDrawerCloseBtn');
  const modeDarkBtn = document.getElementById('modeDarkBtn');
  const modeLightBtn = document.getElementById('modeLightBtn');
  const paletteCardGrid = document.getElementById('paletteCardGrid');
  const wallpaperDropzone = document.getElementById('wallpaperDropzone');
  const wallpaperFileInput = document.getElementById('wallpaperFileInput');
  const removeCustomWallpaperBtn = document.getElementById('removeCustomWallpaperBtn');
  const resetThemeBtn = document.getElementById('resetThemeBtn');

  // Open Drawer
  if (themeToggleBtn && themeDrawerModal) {
    themeToggleBtn.addEventListener('click', () => {
      themeDrawerModal.classList.remove('hidden');
    });
  }

  // Close Drawer
  function closeThemeDrawer() {
    if (themeDrawerModal) themeDrawerModal.classList.add('hidden');
  }

  if (themeDrawerOverlay) themeDrawerOverlay.addEventListener('click', closeThemeDrawer);
  if (themeDrawerCloseBtn) themeDrawerCloseBtn.addEventListener('click', closeThemeDrawer);

  // Mode Switcher [ Light | Dark ]
  if (modeDarkBtn) {
    modeDarkBtn.addEventListener('click', () => {
      themeState.mode = 'dark';
      saveThemeConfig();
      applyTheme();
      showToast('Switched to Dark Mode 🌙');
    });
  }

  if (modeLightBtn) {
    modeLightBtn.addEventListener('click', () => {
      themeState.mode = 'light';
      saveThemeConfig();
      applyTheme();
      showToast('Switched to Light Mode ☀️');
    });
  }

  // Palette Row/Grid Clicks
  if (paletteCardGrid) {
    paletteCardGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.theme-circle-btn, .palette-card');
      if (card) {
        const themeId = card.getAttribute('data-theme-id');
        if (PRESET_THEMES[themeId]) {
          themeState.themeId = themeId;
          themeState.customWallpaperDataUrl = null;
          themeState.customColors = null;
          saveThemeConfig();
          applyTheme();
          showToast(`Applied ${PRESET_THEMES[themeId].name} theme!`);
        }
      }
    });
  }

  // File Input & Drag-and-Drop Uploader
  if (wallpaperDropzone && wallpaperFileInput) {
    wallpaperDropzone.addEventListener('click', () => {
      wallpaperFileInput.click();
    });

    wallpaperDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      wallpaperDropzone.style.borderColor = '#53c678';
    });

    wallpaperDropzone.addEventListener('dragleave', () => {
      wallpaperDropzone.style.borderColor = '';
    });

    wallpaperDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      wallpaperDropzone.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleWallpaperFile(e.dataTransfer.files[0]);
      }
    });

    wallpaperFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleWallpaperFile(e.target.files[0]);
      }
    });
  }

  function handleWallpaperFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      extractColorsFromImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  // Remove Custom Wallpaper
  if (removeCustomWallpaperBtn) {
    removeCustomWallpaperBtn.addEventListener('click', () => {
      themeState.customWallpaperDataUrl = null;
      themeState.customColors = null;
      themeState.themeId = 'classic';
      saveThemeConfig();
      applyTheme();
      showToast('Removed wallpaper & reset colors');
    });
  }

  // Reset to Default
  if (resetThemeBtn) {
    resetThemeBtn.addEventListener('click', () => {
      themeState = {
        mode: 'dark',
        themeId: 'classic',
        customWallpaperDataUrl: null,
        customColors: null
      };
      saveThemeConfig();
      applyTheme();
      showToast('Reset theme to Default Emerald 🌲');
    });
  }

  // Initialize Theme on Load
  loadThemeConfig();

});
