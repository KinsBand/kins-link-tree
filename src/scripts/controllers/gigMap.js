import { showToast } from './toast.js';

function lockScroll() {
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
}

const LOCAL_GIGS = [];

// Refined Coastal Land Polygon for Newcastle, Maitland & Sydney
const COASTAL_LAND_POLYGON = [
  [-32.73, 151.55],
  [-32.88, 151.72],
  [-32.93, 151.78],
  [-33.08, 151.65],
  [-33.30, 151.50],
  [-33.58, 151.32],
  [-33.85, 151.28],
  [-34.05, 151.15],
  [-34.05, 150.85],
  [-33.75, 150.68],
  [-33.35, 151.10],
  [-32.80, 151.25]
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

function updateSetlistPlaybackState(currentTrack, isPlaying) {
  const setlistRows = document.querySelectorAll('.setlist-item-row');
  setlistRows.forEach(row => {
    const songFullName = row.getAttribute('data-song-fullname') || '';
    const icon = row.querySelector('.setlist-play-icon');
    
    let isMatch = false;
    if (currentTrack && currentTrack.title) {
      const cleanName = songFullName.replace(/\(.*\)/, '').trim().toLowerCase();
      const playingTitle = currentTrack.title.toLowerCase();
      if (cleanName.includes(playingTitle) || playingTitle.includes(cleanName)) {
        isMatch = true;
      }
    }

    if (isMatch && isPlaying) {
      row.classList.add('is-playing');
      if (icon) {
        icon.className = 'fa-solid fa-pause setlist-play-icon';
      }
    } else {
      row.classList.remove('is-playing');
      if (icon) {
        icon.className = 'fa-solid fa-play setlist-play-icon';
      }
    }
  });
}

window.addEventListener('trackPlaybackStateChanged', (e) => {
  const { track, isPlaying } = e.detail || {};
  updateSetlistPlaybackState(track, isPlaying);
});

function parseSetlistTrackInfo(fullName) {
  let title = fullName.replace(/\(.*\)/, '').trim();
  let artist = "Kins";
  if (fullName.includes('(The Cure)')) artist = "The Cure";
  else if (fullName.includes('(Weezer)')) artist = "Weezer";
  else if (fullName.includes('(The Long Faces)')) artist = "The Long Faces";
  else if (fullName.includes('(Foo Fighters)')) artist = "Foo Fighters";
  else if (fullName.includes('(Pulp)')) artist = "Pulp";
  return { title, artist };
}

function displayVenueDetails(gig) {
  const venueNameEl = document.getElementById('venueCardName');
  const venueRatingEl = document.getElementById('venueRatingBadge');
  const venueCapacityEl = document.getElementById('venueCapacityBadge');
  const venueCityEl = document.getElementById('venueCardCity');
  const amenitiesRow = document.getElementById('venueAmenitiesRow');
  const countdownBanner = document.getElementById('gigCountdownBanner');
  const richBreakdown = document.getElementById('richShowBreakdown');
  const venueBookingBtn = document.getElementById('venueBookingBtn');

  if (!gig) {
    if (venueNameEl) venueNameEl.textContent = "No Scheduled Gigs";
    if (venueRatingEl) venueRatingEl.style.display = "none";
    if (venueCapacityEl) venueCapacityEl.style.display = "none";
    if (venueCityEl) venueCityEl.textContent = "Newcastle & Sydney";
    if (amenitiesRow) amenitiesRow.innerHTML = "";
    if (countdownBanner) countdownBanner.classList.add("hidden");
    if (venueBookingBtn) venueBookingBtn.style.display = "none";
    if (richBreakdown) {
      richBreakdown.innerHTML = `
        <div class="show-section-card" style="text-align: center; padding: 32px 16px;">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
          <h4 style="font-family: var(--font-heading); color: var(--text-white); font-size: 1.05rem; margin-bottom: 8px;">No Gigs Announced Yet</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); max-width: 300px; margin: 0 auto 16px auto;">Kins hasn't scheduled any upcoming shows right now. Check back soon for upcoming Newcastle & Sydney tour dates!</p>
        </div>
      `;
    }
    return;
  }
  activeGigId = gig.id;

  if (venueNameEl) venueNameEl.textContent = gig.venue;
  if (venueRatingEl) venueRatingEl.innerHTML = `<i class="fa-solid fa-star"></i> ${gig.rating}`;
  if (venueCapacityEl) venueCapacityEl.innerHTML = `<i class="fa-solid fa-users"></i> ${gig.capacity}`;
  if (venueCityEl) venueCityEl.textContent = `${gig.city} • ${gig.dateText}`;

  if (venueBookingBtn) {
    if (gig.type === 'upcoming') {
      venueBookingBtn.innerHTML = `<i class="fa-solid fa-ticket"></i><span>GET TICKETS</span>`;
      venueBookingBtn.href = gig.ticketUrl || "https://www.bandsintown.com";
      venueBookingBtn.target = "_blank";
    } else {
      venueBookingBtn.innerHTML = `<i class="fa-solid fa-headphones"></i><span>LIVE AUDIO</span>`;
      venueBookingBtn.href = "javascript:void(0);";
      venueBookingBtn.target = "_self";
      venueBookingBtn.onclick = (e) => {
        e.preventDefault();
        showToast(`🎧 Loading live desk audio recording for ${gig.venue}...`);
      };
    }
  }

  document.querySelectorAll('.gig-select-pill').forEach(pill => {
    if (pill.getAttribute('data-gig-id') === gig.id) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  if (amenitiesRow) {
    amenitiesRow.innerHTML = gig.amenities.map(a => `
      <span class="amenity-chip"><i class="fa-solid ${a.icon}"></i> ${a.label}</span>
    `).join('');
  }

  if (countdownBanner) {
    if (gig.type === 'upcoming' && gig.targetDate) {
      countdownBanner.classList.remove('hidden');
      updateCountdownTimer(gig.targetDate);
    } else {
      countdownBanner.classList.add('hidden');
    }
  }

  if (richBreakdown) {
    const isUpcoming = gig.type === 'upcoming';
    const mailtoSubject = encodeURIComponent(`Song Request for Kins at ${gig.venue} (${gig.dateText})`);
    const mailtoBody = encodeURIComponent(`Hey Kins!\n\nI'd love to request the following song for your upcoming setlist at ${gig.venue}:\n\nSong Name:\nYour Name:`);
    const mailtoUrl = `mailto:HelloKinsBand@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

    richBreakdown.innerHTML = `
      ${isUpcoming ? `
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-calendar-check"></i> Pre-Show Info & Teaser</h5>
          <p class="snapshot-item"><strong>Expected Vibe:</strong> ${gig.snapshot.vibe}</p>
          <p class="snapshot-item"><strong>Support Acts:</strong> ${gig.supportActs}</p>
          <p class="snapshot-item"><strong>Show Teaser:</strong> ${gig.snapshot.highlight}</p>
        </div>

        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-music"></i> Setlist & Song Preview</h5>
          <div class="setlist-list">
            ${gig.setlistDetails.songs.map((song, i) => `
              <div class="setlist-item-row" data-song-fullname="${song.name}">
                <div class="setlist-row-progress"></div>
                <div class="setlist-row-content">
                  <span class="setlist-song-name">
                    <i class="fa-solid fa-play setlist-play-icon"></i>
                    <strong>${i + 1}.</strong> ${song.name}
                  </span>
                  <span class="setlist-tag">${song.tag}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="song-request-container" style="margin-top: 10px; text-align: center;">
            <p class="snapshot-item" style="margin-bottom: 8px;">Want a specific song added to the setlist?</p>
            <a href="${mailtoUrl}" class="request-song-mailto-btn">
              <i class="fa-solid fa-envelope"></i> Request a Song via Email
            </a>
          </div>
        </div>

        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-building-columns"></i> Venue & Food Scene</h5>
          <p class="scene-item"><strong>The Venue:</strong> ${gig.venueAndFood.venueDesc}</p>
          <p class="scene-item"><strong>Pre/Post-Show Food:</strong> ${gig.venueAndFood.foodRecommendation}</p>
        </div>
      ` : `
        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-camera-retro"></i> Post-Show Recap</h5>
          <p class="snapshot-item"><strong>Vibe:</strong> ${gig.snapshot.vibe}</p>
          <p class="snapshot-item"><strong>Show Highlight:</strong> ${gig.snapshot.highlight}</p>
        </div>

        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-music"></i> Performed Setlist & Audio</h5>
          <div class="setlist-list">
            ${gig.setlistDetails.songs.map((song, i) => `
              <div class="setlist-item-row" data-song-fullname="${song.name}">
                <div class="setlist-row-progress"></div>
                <div class="setlist-row-content">
                  <span class="setlist-song-name">
                    <i class="fa-solid fa-play setlist-play-icon"></i>
                    <strong>${i + 1}.</strong> ${song.name}
                  </span>
                  <span class="setlist-tag">${song.tag}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <p class="snapshot-item" style="margin-top: 6px;"><strong>Audio Recording:</strong> ${gig.setlistDetails.audioRecording}</p>
          <p class="snapshot-item"><strong>Stage Notes:</strong> ${gig.setlistDetails.stageNotes}</p>
        </div>

        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-building-columns"></i> Venue & Food Scene</h5>
          <p class="scene-item"><strong>The Venue:</strong> ${gig.venueAndFood.venueDesc}</p>
          <p class="scene-item"><strong>Pre/Post Food:</strong> ${gig.venueAndFood.foodRecommendation}</p>
        </div>

        <div class="show-section-card">
          <h5 class="section-heading"><i class="fa-solid fa-users"></i> Crowd Energy & Gallery</h5>
          <p class="snapshot-item"><strong>Energy Score:</strong> ${gig.crowdAndGallery.energyScore}</p>
          <p class="snapshot-item" style="margin-top: 4px;"><strong>Fan Photo Wall:</strong></p>
          <div class="gallery-grid">
            ${gig.crowdAndGallery.photos.map(img => `
              <div class="gallery-img-box">
                <img src="${img}" alt="Fan Photo" loading="lazy">
              </div>
            `).join('')}
          </div>
        </div>
      `}
    `;

    richBreakdown.querySelectorAll('.setlist-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const fullName = row.getAttribute('data-song-fullname') || '';
        const trackObj = parseSetlistTrackInfo(fullName);
        if (window.playTrackPreview) {
          window.playTrackPreview(trackObj);
        }
      });
    });
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
    if (nextGig) {
      gigPillTag.textContent = "NEXT GIG";
      gigPillLocation.textContent = `${nextGig.venue}, Newcastle`;
    } else {
      gigPillTag.textContent = "GIGS";
      gigPillLocation.textContent = "Locations";
    }
  }
  updateFloatingPill();

  if (selectorPillsRow) {
    if (LOCAL_GIGS.length > 0) {
      selectorPillsRow.innerHTML = LOCAL_GIGS.map(g => `
        <button class="gig-select-pill ${nextGig && g.id === nextGig.id ? 'active' : ''}" data-gig-id="${g.id}">
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
    } else {
      selectorPillsRow.innerHTML = `<span style="color: var(--text-muted); font-size: 0.76rem; padding: 6px 12px; display: inline-block;">No upcoming gig dates currently announced</span>`;
    }
  }

  async function ensureLeafletLoaded() {
    if (window.L) return;

    if (!document.getElementById('leaflet-css-dyn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-dyn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js-dyn')) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'leaflet-js-dyn';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  function initGigMap() {
    const mapContainer = document.getElementById('gigMapView');
    if (!mapContainer || typeof window.L === 'undefined') return;

    if (!leafletMapInstance) {
      leafletMapInstance = window.L.map('gigMapView', {
        zoomControl: true,
        attributionControl: false
      }).setView([-33.2, 151.4], 9);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(leafletMapInstance);

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

      displayVenueDetails(nextGig || null);
    }

    setTimeout(() => {
      if (leafletMapInstance) {
        leafletMapInstance.invalidateSize();
      }
    }, 350);
  }

  if (floatingGigPillBtn && gigMapModal) {
    floatingGigPillBtn.addEventListener('click', async () => {
      gigMapModal.classList.add('active');
      lockScroll();
      await ensureLeafletLoaded();
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
}
