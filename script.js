// JavaScript Logic for Kins (@KinsBandOfficial) Link in Bio Page

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// Click Analytics & Conversion Tracking (Mock Function)
function trackClick(eventName, details = {}) {
  console.log(`[Analytics Track] Event: "${eventName}"`, details, `Timestamp: ${new Date().toISOString()}`);
}

document.addEventListener('DOMContentLoaded', () => {
  
  // Track initial page view
  trackClick('page_view', { url: window.location.href });

  // Attach outbound link click analytics
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      const text = link.innerText.trim();
      trackClick('outbound_click', { text, href });
    });
  });
  
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
  // 7. Share Modal & Dynamic QR Code Generation
  // -------------------------------------------------------------
  let qrCodeInstance = null;

  if (shareBtn && shareModal && closeShareModal) {
    shareBtn.addEventListener('click', () => {
      shareModal.classList.add('active');
      trackClick('open_share_modal');

      // Generate dynamic QR code if qrcode.js is loaded
      const qrCanvasContainer = document.getElementById('qrcodeCanvas');
      if (qrCanvasContainer && typeof QRCode !== 'undefined') {
        qrCanvasContainer.innerHTML = '';
        qrCodeInstance = new QRCode(qrCanvasContainer, {
          text: window.location.href,
          width: 130,
          height: 130,
          colorDark: "#0b1f18",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }
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
        trackClick('copy_share_url', { url: shareUrlInput.value });
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
  // 8. Form Submission (Mock Backend API Handler)
  // -------------------------------------------------------------
  if (subscribeForm) {
    // Check if user already subscribed in localStorage
    if (localStorage.getItem('kins_subscribed') === 'true') {
      subscribeForm.classList.add('hidden');
      subscribeSuccess.classList.remove('hidden');
    }

    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('emailInput').value.trim();
      const submitBtn = subscribeForm.querySelector('button[type="submit"]');

      if (email) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Subscribing...</span>';
        }

        trackClick('submit_newsletter_form', { email });

        // Simulate backend API call delay (Netlify/Mailchimp/ConvertKit endpoint)
        await new Promise(resolve => setTimeout(resolve, 800));

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
    hasUpcoming: false,
    upcoming: null,
    pastGigs: [
      { venue: "Melbourne", city: "Victoria, AU", date: "Live Show", lat: -37.8136, lng: 144.9631, notes: "Kins Live Stage" },
      { venue: "Sydney", city: "NSW, AU", date: "Live Show", lat: -33.8688, lng: 151.2093, notes: "Kins Live Stage" },
      { venue: "Brisbane", city: "QLD, AU", date: "Live Show", lat: -27.4698, lng: 153.0251, notes: "Kins Live Stage" }
    ]
  };

  const addToCalendarBtn = document.getElementById('addToCalendarBtn');
  if (addToCalendarBtn) {
    addToCalendarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!GIG_DATA.hasUpcoming || !GIG_DATA.upcoming) {
        showToast('No upcoming show currently scheduled!');
        return;
      }
      trackClick('add_to_calendar', { venue: GIG_DATA.upcoming.venue, date: GIG_DATA.upcoming.date });
      
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kins Band//NONSGML Live Gig//EN
BEGIN:VEVENT
UID:${Date.now()}@kins.au
SUMMARY:Kins Live at ${GIG_DATA.upcoming.venue}
DESCRIPTION:Kins (@KinsBandOfficial) Live Concert.
LOCATION:${GIG_DATA.upcoming.venue}, ${GIG_DATA.upcoming.city}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'Kins_Live_Show.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Calendar event (.ics) downloaded!');
    });
  }

  let leafletMapInstance = null;

  // Initialize Floating Pill Text based on upcoming vs past gigs
  function updateFloatingPill() {
    if (!gigPillTag || !gigPillLocation) return;
    if (GIG_DATA.hasUpcoming && GIG_DATA.upcoming) {
      gigPillTag.textContent = "NEXT GIG";
      gigPillLocation.textContent = `${GIG_DATA.upcoming.venue}, ${GIG_DATA.upcoming.city.split(',')[0]}`;
    } else {
      gigPillTag.textContent = "LIVE GIGS";
      gigPillLocation.textContent = "Tour Dates & Locations";
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
      bio: 'Explore all iconic tracks from The Cure, Weezer, Pulp, and The Long Faces driving Kins.',
      iconClass: 'fa-layer-group',
      pages: [
        [
          { title: 'Just Like Heaven', artist: 'The Cure', duration: '3:32', genre: 'Post-Punk', quote: 'Shimmering guitar chorus & bass drive', icon: 'fa-heart' },
          { title: 'Buddy Holly', artist: 'Weezer', duration: '2:39', genre: 'Power Pop', quote: 'Iconic synth-guitar lead & tight rhythm', icon: 'fa-headphones' },
          { title: 'Common People', artist: 'Pulp', duration: '5:51', genre: 'Britpop', quote: 'Building crescendo synth & theatrical delivery', icon: 'fa-layer-group' },
          { title: 'Jane!', artist: 'The Long Faces', duration: '3:45', genre: 'Art Rock', quote: 'Complex polyrhythms & theatrical vocals', icon: 'fa-masks-theater' },
          { title: "Boys Don't Cry", artist: 'The Cure', duration: '2:37', genre: 'Post-Punk', quote: 'Bouncy guitar riff & iconic vocal hook', icon: 'fa-bolt' },
          { title: 'Hash Pipe', artist: 'Weezer', duration: '3:06', genre: 'Power Pop', quote: 'Aggressive staccato riffing & driving beat', icon: 'fa-drum' }
        ],
        [
          { title: 'Babies', artist: 'Pulp', duration: '4:04', genre: 'Britpop', quote: 'Driving bassline & storytelling lyrics', icon: 'fa-microphone' },
          { title: 'Pink Triangle', artist: 'Weezer', duration: '3:58', genre: 'Power Pop', quote: 'Heartfelt distortion & anthemic chorus', icon: 'fa-compact-disc' },
          { title: "Friday I'm in Love", artist: 'The Cure', duration: '3:35', genre: 'Jangle Pop', quote: 'Uplifting 12-string guitar jangle', icon: 'fa-sun' },
          { title: 'Cadillac', artist: 'The Long Faces', duration: '4:12', genre: 'Art Rock', quote: 'Jazzy guitar weaves & dramatic brass energy', icon: 'fa-car' },
          { title: 'Do You Remember the First Time?', artist: 'Pulp', duration: '4:22', genre: 'Britpop', quote: 'Melodic guitar riff & bittersweet vocal hook', icon: 'fa-certificate' },
          { title: 'Across The Sea', artist: 'Weezer', duration: '4:32', genre: 'Alt Rock', quote: 'Dynamic arrangement & soaring guitar solo', icon: 'fa-sliders' }
        ],
        [
          { title: 'Lovesong', artist: 'The Cure', duration: '3:29', genre: 'Goth Rock', quote: 'Melodic bassline & lush synth arrangement', icon: 'fa-music' },
          { title: 'Do You Wanna Get High?', artist: 'Weezer', duration: '3:27', genre: 'Alt Rock', quote: 'Pinkerton-era heavy fuzz guitar crunch', icon: 'fa-fire' },
          { title: 'Underwear', artist: 'Pulp', duration: '4:06', genre: 'Britpop', quote: 'Dramatic synth swells & cabaret tension', icon: 'fa-mask' },
          { title: 'Sail Away', artist: 'The Long Faces', duration: '3:58', genre: 'Indie Rock', quote: 'Swelling guitar textures & soaring hooks', icon: 'fa-compass' },
          { title: 'Go Away', artist: 'Weezer', duration: '3:13', genre: 'Power Pop', quote: 'Catchy dual-vocal power pop harmony', icon: 'fa-guitar' },
          { title: 'Oberon', artist: 'The Long Faces', duration: '3:50', genre: 'Math Rock', quote: 'Energetic math-rock tempo changes', icon: 'fa-bolt' }
        ]
      ]
    },
    'the-cure': {
      name: 'The Cure',
      genre: 'Post-Punk / Goth Rock / New Wave',
      bio: 'Shimmering post-punk guitars, atmospheric basslines, and melancholic pop melodies.',
      iconClass: 'fa-heart',
      pages: [
        [
          { title: 'Just Like Heaven', artist: 'The Cure', duration: '3:32', genre: 'Post-Punk', quote: 'Shimmering guitar chorus & bass drive', icon: 'fa-heart' },
          { title: "Boys Don't Cry", artist: 'The Cure', duration: '2:37', genre: 'Post-Punk', quote: 'Bouncy guitar riff & iconic vocal hook', icon: 'fa-bolt' },
          { title: "Friday I'm in Love", artist: 'The Cure', duration: '3:35', genre: 'Jangle Pop', quote: 'Uplifting 12-string guitar jangle', icon: 'fa-sun' },
          { title: 'Lovesong', artist: 'The Cure', duration: '3:29', genre: 'Goth Rock', quote: 'Melodic bassline & lush synth arrangement', icon: 'fa-music' }
        ]
      ]
    },
    'weezer': {
      name: 'Weezer',
      genre: 'Alternative Rock / Power Pop',
      bio: 'Crunchy fuzz guitar riffs, anthemic power pop harmonies, and raw emotional hooks.',
      iconClass: 'fa-glasses',
      pages: [
        [
          { title: 'Do You Wanna Get High?', artist: 'Weezer', duration: '3:27', genre: 'Alt Rock', quote: 'Pinkerton-era heavy fuzz guitar crunch', icon: 'fa-fire' },
          { title: 'Go Away', artist: 'Weezer', duration: '3:13', genre: 'Power Pop', quote: 'Catchy dual-vocal power pop harmony', icon: 'fa-guitar' },
          { title: 'Jamie', artist: 'Weezer', duration: '4:19', genre: 'Power Pop', quote: 'Raw early Weezer garage charm', icon: 'fa-radio' },
          { title: 'Hash Pipe', artist: 'Weezer', duration: '3:06', genre: 'Heavy Power Pop', quote: 'Aggressive staccato riffing & driving beat', icon: 'fa-drum' }
        ],
        [
          { title: 'Pink Triangle', artist: 'Weezer', duration: '3:58', genre: 'Power Pop', quote: 'Heartfelt distortion & anthemic chorus', icon: 'fa-compact-disc' },
          { title: 'Buddy Holly', artist: 'Weezer', duration: '2:39', genre: 'Power Pop', quote: 'Iconic synth-guitar lead & tight rhythm', icon: 'fa-headphones' },
          { title: 'Across The Sea', artist: 'Weezer', duration: '4:32', genre: 'Alt Rock', quote: 'Dynamic arrangement & soaring guitar solo', icon: 'fa-sliders' }
        ]
      ]
    },
    'pulp': {
      name: 'Pulp',
      genre: 'Britpop / Art Pop / Glam Rock',
      bio: 'Dramatic storytelling, disco-infused synthpop grooves, and theatrical British pop.',
      iconClass: 'fa-compact-disc',
      pages: [
        [
          { title: 'Common People', artist: 'Pulp', duration: '5:51', genre: 'Britpop', quote: 'Building crescendo synth & theatrical delivery', icon: 'fa-layer-group' },
          { title: 'Babies', artist: 'Pulp', duration: '4:04', genre: 'Britpop', quote: 'Driving bassline & storytelling lyrics', icon: 'fa-microphone' },
          { title: 'Do You Remember the First Time?', artist: 'Pulp', duration: '4:22', genre: 'Britpop', quote: 'Melodic guitar riff & bittersweet vocal hook', icon: 'fa-certificate' },
          { title: 'Underwear', artist: 'Pulp', duration: '4:06', genre: 'Britpop', quote: 'Dramatic synth swells & cabaret tension', icon: 'fa-mask' }
        ],
        [
          { title: 'I Want You', artist: 'Pulp', duration: '4:42', genre: 'Alt Rock', quote: 'Raw emotional guitar crunch & pulse', icon: 'fa-fire' },
          { title: 'Have You Seen Her Lately?', artist: 'Pulp', duration: '4:21', genre: 'Chamber Pop', quote: 'Lush orchestral pop textures & storytelling', icon: 'fa-eye' }
        ]
      ]
    },
    'the-long-faces': {
      name: 'The Long Faces',
      genre: 'Art Rock / Math Rock / Neo-Psychedelia',
      bio: 'Complex polyrhythms, intricate jazzy guitar weaves, and theatrical art-rock arrangements.',
      iconClass: 'fa-masks-theater',
      pages: [
        [
          { title: 'Jane!', artist: 'The Long Faces', duration: '3:45', genre: 'Art Rock', quote: 'Complex polyrhythms & theatrical vocals', icon: 'fa-masks-theater' },
          { title: 'Cadillac', artist: 'The Long Faces', duration: '4:12', genre: 'Art Rock', quote: 'Jazzy guitar weaves & dramatic brass energy', icon: 'fa-car' },
          { title: 'Sail Away', artist: 'The Long Faces', duration: '3:58', genre: 'Indie Rock', quote: 'Swelling guitar textures & soaring hooks', icon: 'fa-compass' },
          { title: 'Documentaries', artist: 'The Long Faces', duration: '4:05', genre: 'Art Rock', quote: 'Intricate basswork & cinematic dynamics', icon: 'fa-film' }
        ],
        [
          { title: 'Oberon', artist: 'The Long Faces', duration: '3:50', genre: 'Math Rock', quote: 'Energetic math-rock tempo changes', icon: 'fa-bolt' }
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
  let currentArtistKey = 'the-cure';
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
    'The Cure — Just Like Heaven',
    'Weezer — Buddy Holly',
    'Pulp — Common People',
    'The Long Faces — Jane!',
    'The Cure — Friday I\'m in Love',
    'Weezer — Hash Pipe',
    'Pulp — Babies'
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
                <span class="track-duration">${track.duration || ''}</span>
              </div>
              <span class="artist-name">${track.artist}</span>
              <div class="card-badge-row">
                <span class="genre-tag">${track.genre}</span>
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

  // Initial Render: Load 'the-cure' artists page 0
  renderArtistView('the-cure', 0);

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


});
