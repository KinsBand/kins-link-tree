import { showToast } from './toast.js';

function lockScroll() {
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
}

const LOCAL_GIGS = [
  {
    id: "gig-newcastle-1",
    bandName: "KINS",
    venue: "King St Bandroom",
    city: "Newcastle, NSW",
    region: "Hunter Region",
    type: "upcoming",
    isNextShow: true,
    targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 3 days away
    dateText: "10/08/2026",
    capacity: "350 packed",
    supportActs: "Sunbleached, Indigo Youth",
    rating: "4.9 ★ (48 Reviews)",
    ticketUrl: "https://www.bandsintown.com",
    amenities: [
      { icon: "fa-wheelchair", label: "Wheelchair Accessible ♿" },
      { icon: "fa-user-check", label: "18+ Event 🔞" },
      { icon: "fa-beer-mug-empty", label: "Craft Bar & Kitchen 🍺" },
      { icon: "fa-square-parking", label: "Onsite Parking 🅿️" }
    ],
    snapshot: {
      vibe: "Sweaty, high-octane, intimate",
      highlight: "The entire room jumping as one during the final breakdown chorus of 'Jane!'.",
      videoYoutubeId: "dQw4w9WgXcQ"
    },
    setlistDetails: {
      songs: [
        { name: "Just Like Heaven (The Cure)", tag: "Cover Opener" },
        { name: "Jane! (The Long Faces)", tag: "Fan Favorite" },
        { name: "First Light", tag: "Original Debut" },
        { name: "Everlong (Foo Fighters)", tag: "Extended Outro Jam" },
        { name: "Common People (Pulp)", tag: "Encore" }
      ],
      audioRecording: "Live Desk Audio Recording (24-bit Stereo Board Capture)",
      stageNotes: "Vivian switched to vintage Fender Telecaster for 'Jane!'; crowd energy triggered dynamic tempo bump on final encore."
    },
    venueAndFood: {
      venueDesc: "Classic underground bandroom with pristine acoustics, low-ceiling intimate vibe, and crystal-clear PA setup.",
      foodRecommendation: "Post-show late night feed at King Street Maccas & Rascal Burgers around the corner."
    },
    crowdAndGallery: {
      energyScore: "10/10 🔥",
      photos: [
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop"
      ],
      stageToCrowdShot: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop"
    },
    btsAndArtifacts: {
      roadStory: "Trai snapped a drumstick during soundcheck, but local legend sound tech hooked up a spare Oak stick just in time for doors!",
      artifactsNotes: "Paper setlist signed by band, official gig poster, and gold-foil entry wristbands."
    },
    lat: -32.9283,
    lng: 151.7817
  },
  {
    id: "gig-maitland-1",
    bandName: "KINS",
    venue: "The Junkyard (Grand Junction)",
    city: "Maitland, NSW",
    region: "Hunter Region",
    type: "upcoming",
    isNextShow: false,
    targetDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 9 days away
    dateText: "16/08/2026",
    capacity: "200 courtyard crew",
    supportActs: "The Valley Echoes",
    rating: "4.8 ★ (32 Reviews)",
    ticketUrl: "https://www.bandsintown.com",
    amenities: [
      { icon: "fa-wheelchair", label: "Wheelchair Accessible ♿" },
      { icon: "fa-ticket", label: "All Ages 🎟️" },
      { icon: "fa-beer-mug-empty", label: "Beer Garden & Bistro 🍺" }
    ],
    snapshot: {
      vibe: "Sunlit, gritty, electric",
      highlight: "Sun setting over the open courtyard beer garden as the crowd sang along to 'Buddy Holly'.",
      videoYoutubeId: "dQw4w9WgXcQ"
    },
    setlistDetails: {
      songs: [
        { name: "Buddy Holly (Weezer)", tag: "Courtyard Singalong" },
        { name: "Cadillac (The Long Faces)", tag: "High Energy" },
        { name: "Ocean Drive", tag: "Kins Original" },
        { name: "Boys Don't Cry (The Cure)", tag: "Encore" }
      ],
      audioRecording: "Live Beer Garden Stereo Recording",
      stageNotes: "Acoustic-electric hybrid setup used to fit the outdoor courtyard reverberation."
    },
    venueAndFood: {
      venueDesc: "Iconic Maitland live music venue with open-air courtyard stage, vintage rock posters, and legendary local atmosphere.",
      foodRecommendation: "Smoked brisket burgers and craft pale ales served fresh from The Junkyard bistro kitchen."
    },
    crowdAndGallery: {
      energyScore: "9.8/10 ⚡",
      photos: [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop"
      ],
      stageToCrowdShot: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop"
    },
    btsAndArtifacts: {
      roadStory: "Drove down the New England Highway in the van listening to early 2000s indie rock on full blast.",
      artifactsNotes: "Original hand-drawn setlist on pub coaster."
    },
    lat: -32.7333,
    lng: 151.5500
  },
  {
    id: "gig-sydney-past",
    bandName: "KINS",
    venue: "The Lansdowne Hotel",
    city: "Sydney, NSW",
    region: "Greater Sydney",
    type: "past",
    isNextShow: false,
    dateText: "18/07/2026",
    capacity: "280 sold out",
    supportActs: "Velvet Bloom, Static Waves",
    rating: "5.0 ★ (Sold Out Show)",
    ticketUrl: "https://www.bandsintown.com",
    amenities: [
      { icon: "fa-wheelchair", label: "Ground Level Access ♿" },
      { icon: "fa-user-check", label: "18+ Event 🔞" },
      { icon: "fa-utensils", label: "Pub Food & Bar 🍔" }
    ],
    snapshot: {
      vibe: "Raw, electric, wall-to-wall",
      highlight: "Unbelievable wall-to-wall crowd chorus echoing across Chippendale on 'Oberon'!",
      videoYoutubeId: "dQw4w9WgXcQ"
    },
    setlistDetails: {
      songs: [
        { name: "Oberon (The Long Faces)", tag: "Sold Out Opener" },
        { name: "Do You Wanna Get High (Weezer)", tag: "Crowd Favorite" },
        { name: "Shadows", tag: "Kins Original" },
        { name: "Everlong (Foo Fighters)", tag: "Encore Finale" }
      ],
      audioRecording: "Official Desk Board Audio Recording (Full Stereo Master)",
      stageNotes: "Charlie's guitar solo on 'Oberon' had the front row singing every single note!"
    },
    venueAndFood: {
      venueDesc: "Sydney's iconic multi-level live rock venue in Chippendale with sticky floors and legendary sound history.",
      foodRecommendation: "Lansdowne woodfired pizzas & craft brews right at the pub bar before showtime."
    },
    crowdAndGallery: {
      energyScore: "10/10 🔥",
      photos: [
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop"
      ],
      stageToCrowdShot: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop"
    },
    btsAndArtifacts: {
      roadStory: "Soundcheck ran long, but the green room pizza delivery arrived right as doors opened!",
      artifactsNotes: "Signed Lansdowne gig poster, paper setlist, and commemorative ticket stub."
    },
    lat: -33.8850,
    lng: 151.1980
  }
];

// Refined Coastal Land Polygon for Newcastle, Maitland & Sydney
const COASTAL_LAND_POLYGON = [
  [-32.73, 151.55], // Maitland Inland
  [-32.88, 151.72], // Newcastle North
  [-32.93, 151.78], // Newcastle Coast/Harbour
  [-33.08, 151.65], // Lake Macquarie Coast
  [-33.30, 151.50], // Central Coast (Wyong/Gosford)
  [-33.58, 151.32], // Broken Bay / Palm Beach Coast
  [-33.85, 151.28], // Sydney Harbour / Coast
  [-34.05, 151.15], // Cronulla / Botany Bay Coast
  [-34.05, 150.85], // Campbelltown / South-West Sydney
  [-33.75, 150.68], // Penrith / West Sydney
  [-33.35, 151.10], // Hawkesbury / Mangrove Mountain Inland
  [-32.80, 151.25]  // Cessnock / Hunter Valley Inland
];

let leafletMapInstance = null;
let countdownInterval = null;
let activeGigId = "gig-newcastle-1";

function updateCountdownTimer(targetDate) {
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');

  if (countdownInterval) clearInterval(countdownInterval);

  function tick() {
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMins) cdMins.textContent = '00';
      if (cdSecs) cdSecs.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = String(d).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(h).padStart(2, '0');
    if (cdMins) cdMins.textContent = String(m).padStart(2, '0');
    if (cdSecs) cdSecs.textContent = String(s).padStart(2, '0');
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

function displayVenueDetails(gig) {
  activeGigId = gig.id;
  const venueNameEl = document.getElementById('venueCardName');
  const venueRatingEl = document.getElementById('venueRatingBadge');
  const venueCityEl = document.getElementById('venueCardCity');
  const amenitiesRow = document.getElementById('venueAmenitiesRow');
  const countdownBanner = document.getElementById('gigCountdownBanner');
  const richBreakdown = document.getElementById('richShowBreakdown');
  const venueBookingBtn = document.getElementById('venueBookingBtn');

  if (venueNameEl) venueNameEl.textContent = gig.venue;
  if (venueRatingEl) venueRatingEl.innerHTML = `<i class="fa-solid fa-star"></i> ${gig.rating}`;
  if (venueCityEl) venueCityEl.textContent = `${gig.city} • Date: ${gig.dateText}`;

  // Update primary CTA button text and icon depending on upcoming vs past gig
  if (venueBookingBtn) {
    if (gig.type === 'upcoming') {
      venueBookingBtn.innerHTML = `<i class="fa-solid fa-ticket"></i><span>GET TICKETS 🎟️</span>`;
      venueBookingBtn.href = gig.ticketUrl || "https://www.bandsintown.com";
      venueBookingBtn.target = "_blank";
    } else {
      venueBookingBtn.innerHTML = `<i class="fa-solid fa-headphones"></i><span>LISTEN TO AUDIO 🎵</span>`;
      venueBookingBtn.href = "javascript:void(0);";
      venueBookingBtn.target = "_self";
      venueBookingBtn.onclick = (e) => {
        e.preventDefault();
        showToast(`🎧 Loading live desk audio recording for ${gig.venue}...`);
      };
    }
  }

  // Update pills UI active class
  document.querySelectorAll('.gig-select-pill').forEach(pill => {
    if (pill.getAttribute('data-gig-id') === gig.id) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // Amenities
  if (amenitiesRow) {
    amenitiesRow.innerHTML = gig.amenities.map(a => `
      <span class="amenity-chip"><i class="fa-solid ${a.icon}"></i> ${a.label}</span>
    `).join('');
  }

  // Countdown timer for upcoming gig
  if (countdownBanner) {
    if (gig.type === 'upcoming' && gig.targetDate) {
      countdownBanner.classList.remove('hidden');
      updateCountdownTimer(gig.targetDate);
    } else {
      countdownBanner.classList.add('hidden');
    }
  }

  // Render Rich Structured Breakdown based on show status (Upcoming vs Past)
  if (richBreakdown) {
    const isUpcoming = gig.type === 'upcoming';
    const mailtoSubject = encodeURIComponent(`Song Request for Kins at ${gig.venue} (${gig.dateText})`);
    const mailtoBody = encodeURIComponent(`Hey Kins!\n\nI'd love to request the following song for your upcoming setlist at ${gig.venue}:\n\nSong Name:\nYour Name:`);
    const mailtoUrl = `mailto:HelloKinsBand@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

    richBreakdown.innerHTML = `
      <!-- Main Show Title Headline -->
      <div class="show-meta-headline-box">
        <h4 class="show-main-title">${gig.bandName} Live at ${gig.venue}, ${gig.city.split(',')[0]}</h4>
        <p class="show-sub-stats">
          📅 Date: ${gig.dateText} &nbsp;|&nbsp; 👥 Capacity: ${gig.capacity} &nbsp;|&nbsp; 🎸 Support: ${gig.supportActs}
        </p>
      </div>

      ${isUpcoming ? `
        <!-- UPCOMING SHOW: PRE-SHOW INFO & TENTATIVE SETLIST -->
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-calendar-check"></i> 🎟️ Pre-Show Info & Teaser</h5>
          <p class="snapshot-item"><strong>Expected Vibe:</strong> ${gig.snapshot.vibe}</p>
          <p class="snapshot-item"><strong>Show Highlight Teaser:</strong> ${gig.snapshot.highlight}</p>
        </div>

        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-music"></i> 🎵 Tentative Setlist & Song Requests</h5>
          <div class="setlist-list">
            ${gig.setlistDetails.songs.map((song, i) => `
              <div class="setlist-item-row">
                <span><strong>${i + 1}.</strong> ${song.name}</span>
                <span class="setlist-tag">${song.tag}</span>
              </div>
            `).join('')}
          </div>
          <div class="song-request-container" style="margin-top: 10px; text-align: center;">
            <p class="snapshot-item" style="margin-bottom: 8px;">Want a specific song added to the setlist?</p>
            <a href="${mailtoUrl}" class="request-song-mailto-btn">
              <i class="fa-solid fa-envelope"></i> Request a Song via Email ✉️
            </a>
          </div>
        </div>

        <!-- 🏟️ Venue & Access Scene -->
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-building-columns"></i> 🏟️ Venue & Food Scene</h5>
          <p class="scene-item"><strong>The Venue:</strong> ${gig.venueAndFood.venueDesc}</p>
          <p class="scene-item"><strong>Pre/Post-Show Food:</strong> 🍔 ${gig.venueAndFood.foodRecommendation}</p>
        </div>
      ` : `
        <!-- PAST SHOW: FULL ARCHIVE RECAP -->
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-camera-retro"></i> 📸 Quick Snapshot (Post-Show Recap)</h5>
          <p class="snapshot-item"><strong>Vibe in 3 words:</strong> ${gig.snapshot.vibe}</p>
          <p class="snapshot-item"><strong>Show Highlight:</strong> ${gig.snapshot.highlight}</p>
          
          <div class="video-preview-embed">
            <iframe 
              src="https://www.youtube.com/embed/${gig.snapshot.videoYoutubeId}?autoplay=0&controls=1" 
              title="${gig.bandName} Live Clip"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        </div>

        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-music"></i> 🎵 Performed Setlist & Audio</h5>
          <div class="setlist-list">
            ${gig.setlistDetails.songs.map((song, i) => `
              <div class="setlist-item-row">
                <span><strong>${i + 1}.</strong> ${song.name}</span>
                <span class="setlist-tag">${song.tag}</span>
              </div>
            `).join('')}
          </div>
          <p class="snapshot-item" style="margin-top: 6px;"><strong>Audio Recording:</strong> 🎧 ${gig.setlistDetails.audioRecording}</p>
          <p class="snapshot-item"><strong>Stage Notes:</strong> 🎛️ ${gig.setlistDetails.stageNotes}</p>
        </div>

        <!-- 🏟️ Venue & Food Scene -->
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-building-columns"></i> 🏟️ Venue & Food Scene</h5>
          <p class="scene-item"><strong>The Venue:</strong> ${gig.venueAndFood.venueDesc}</p>
          <p class="scene-item"><strong>Pre/Post-Show Food:</strong> 🍔 ${gig.venueAndFood.foodRecommendation}</p>
        </div>

        <!-- 👥 Crowd & Fan Gallery -->
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-users"></i> 👥 Crowd & Fan Gallery</h5>
          <p class="snapshot-item"><strong>Crowd Energy Score:</strong> ${gig.crowdAndGallery.energyScore}</p>
          
          <p class="snapshot-item" style="margin-top: 4px;"><strong>Fan Photo Wall:</strong></p>
          <div class="gallery-grid">
            ${gig.crowdAndGallery.photos.map(img => `
              <div class="gallery-img-box">
                <img src="${img}" alt="Fan Photo" loading="lazy">
              </div>
            `).join('')}
          </div>

          <p class="snapshot-item" style="margin-top: 6px;"><strong>Stage-to-Crowd Shot:</strong></p>
          <img src="${gig.crowdAndGallery.stageToCrowdShot}" alt="Stage to Crowd" class="stage-crowd-photo" loading="lazy">
        </div>

        <!-- 🚚 Behind the Scenes & Artifacts -->
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-truck-ramp-box"></i> 🚚 Behind the Scenes & Artifacts</h5>
          <p class="bts-item"><strong>Road Story:</strong> ${gig.btsAndArtifacts.roadStory}</p>
          <p class="bts-item"><strong>Artifacts:</strong> 📄 ${gig.btsAndArtifacts.artifactsNotes}</p>
        </div>
      `}
    `;
  }

  if (leafletMapInstance) {
    leafletMapInstance.flyTo([gig.lat, gig.lng], 11, { duration: 1.2 });
  }
}

export function initGigMapModule() {
  const floatingGigPillBtn = document.getElementById('floatingGigPillBtn');
  const gigMapModal = document.getElementById('gigMapModal');
  const closeGigMapSheet = document.getElementById('closeGigMapSheet');
  const gigPillTag = document.getElementById('gigPillTag');
  const gigPillLocation = document.getElementById('gigPillLocation');
  const selectorPillsRow = document.getElementById('gigSelectorPillsRow');

  const nextGig = LOCAL_GIGS.find(g => g.isNextShow) || LOCAL_GIGS[0];

  function updateFloatingPill() {
    if (!gigPillTag || !gigPillLocation) return;
    gigPillTag.textContent = "NEXT GIG";
    gigPillLocation.textContent = `${nextGig.venue}, Newcastle`;
  }
  updateFloatingPill();

  // Render Selector Pills
  if (selectorPillsRow) {
    selectorPillsRow.innerHTML = LOCAL_GIGS.map(g => `
      <button class="gig-select-pill ${g.id === nextGig.id ? 'active' : ''}" data-gig-id="${g.id}">
        ${g.isNextShow ? '🔥 NEXT: ' : ''}${g.venue} (${g.city.split(',')[0]})
      </button>
    `).join('');

    selectorPillsRow.querySelectorAll('.gig-select-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const id = pill.getAttribute('data-gig-id');
        const targetGig = LOCAL_GIGS.find(g => g.id === id);
        if (targetGig) displayVenueDetails(targetGig);
      });
    });
  }

  function initGigMap() {
    const mapContainer = document.getElementById('gigMapView');
    if (!mapContainer || typeof window.L === 'undefined') return;

    if (!leafletMapInstance) {
      // Center map between Sydney, Newcastle and Maitland
      leafletMapInstance = window.L.map('gigMapView', {
        zoomControl: true,
        attributionControl: false
      }).setView([-33.2, 151.4], 9);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(leafletMapInstance);

      // Refined Land-Only Coastal Polygon
      const regionPolygon = window.L.polygon(COASTAL_LAND_POLYGON, {
        color: '#53c678',
        fillColor: '#53c678',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(leafletMapInstance);

      regionPolygon.bindTooltip("📍 Kins Gig Region: Newcastle, Maitland & Sydney", {
        permanent: false,
        direction: "top"
      });

      // Add Gig Markers
      LOCAL_GIGS.forEach(gig => {
        const isUpcoming = gig.type === 'upcoming';
        
        const pinIcon = window.L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div class="${isUpcoming ? 'pin-upcoming-pulse' : 'pin-past-archive'}" title="${gig.venue}">
              <i class="fa-solid ${isUpcoming ? 'fa-guitar' : 'fa-clock-rotate-left'}"></i>
              ${gig.isNextShow ? '<span class="next-show-badge">NEXT GIG</span>' : ''}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = window.L.marker([gig.lat, gig.lng], { icon: pinIcon }).addTo(leafletMapInstance);
        
        marker.on('click', () => {
          displayVenueDetails(gig);
        });

        marker.bindPopup(`
          <div style="text-align: center; padding: 4px;">
            <strong style="color: #53c678; font-size: 0.8rem;">${isUpcoming ? '🔥 UPCOMING GIG' : '📜 PAST SHOW'}</strong><br>
            <strong style="font-size: 0.95rem; color: #fff;">${gig.venue}</strong><br>
            <span style="font-size: 0.76rem; color: #a1a1aa;">${gig.city}</span><br>
            <span style="font-size: 0.72rem; color: #ffd700;">${gig.rating}</span>
          </div>
        `);
      });

      displayVenueDetails(nextGig);
    }

    setTimeout(() => {
      if (leafletMapInstance) {
        leafletMapInstance.invalidateSize();
      }
    }, 350);
  }

  if (floatingGigPillBtn && gigMapModal) {
    floatingGigPillBtn.addEventListener('click', () => {
      gigMapModal.classList.add('active');
      lockScroll();
      initGigMap();
    });
  }

  if (closeGigMapSheet && gigMapModal) {
    closeGigMapSheet.addEventListener('click', () => {
      gigMapModal.classList.remove('active');
      unlockScroll();
    });

    gigMapModal.addEventListener('click', (e) => {
      if (e.target === gigMapModal) {
        gigMapModal.classList.remove('active');
        unlockScroll();
      }
    });
  }

  // Swipe gesture setup
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
      if (deltaY > 0) {
        bottomSheetContainer.style.transform = `translateY(${deltaY}px)`;
      }
    }

    function onTouchEnd() {
      if (!isDragging) return;
      isDragging = false;
      const deltaY = currentY - startY;
      bottomSheetContainer.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

      if (deltaY > 100) {
        gigMapModal.classList.remove('active');
        unlockScroll();
        setTimeout(() => {
          bottomSheetContainer.style.transform = '';
        }, 300);
      } else {
        bottomSheetContainer.style.transform = 'translateY(0)';
      }
      startY = 0;
      currentY = 0;
    }

    sheetDragArea.addEventListener('touchstart', onTouchStart, { passive: true });
    sheetDragArea.addEventListener('touchmove', onTouchMove, { passive: true });
    sheetDragArea.addEventListener('touchend', onTouchEnd);
  }
}
