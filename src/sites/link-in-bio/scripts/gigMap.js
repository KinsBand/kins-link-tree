import { showToast } from './toast.js';
import { trackClick } from '../../../shared/scripts/analytics.js';

function lockScroll() {
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
}

const GIG_DATA = {
  hasUpcoming: false,
  upcoming: null,
  pastGigs: [
    { venue: "Melbourne", city: "Victoria, AU", date: "Live Show", lat: -37.8136, lng: 144.9631, notes: "Kins Live Stage" },
    { venue: "Sydney", city: "NSW, AU", date: "Live Show", lat: -33.8688, lng: 151.2093, notes: "Kins Live Stage" },
    { venue: "Brisbane", city: "QLD, AU", date: "Live Show", lat: -27.4698, lng: 153.0251, notes: "Kins Live Stage" }
  ]
};

let leafletMapInstance = null;

export function initGigMapModule() {
  const floatingGigPillBtn = document.getElementById('floatingGigPillBtn');
  const gigMapModal = document.getElementById('gigMapModal');
  const closeGigMapSheet = document.getElementById('closeGigMapSheet');
  const gigPillTag = document.getElementById('gigPillTag');
  const gigPillLocation = document.getElementById('gigPillLocation');

  function updateFloatingPill() {
    if (!gigPillTag || !gigPillLocation) return;
    if (GIG_DATA.hasUpcoming && GIG_DATA.upcoming) {
      gigPillTag.textContent = "NEXT GIG";
      gigPillLocation.textContent = `${GIG_DATA.upcoming.venue}, ${GIG_DATA.upcoming.city.split(',')[0]}`;
    } else {
      gigPillTag.textContent = "Gigs";
      gigPillLocation.textContent = "Locations";
    }
  }
  updateFloatingPill();

  function initGigMap() {
    const mapContainer = document.getElementById('gigMapView');
    if (!mapContainer || typeof window.L === 'undefined') return;

    if (!leafletMapInstance) {
      leafletMapInstance = window.L.map('gigMapView', {
        zoomControl: true,
        attributionControl: false
      }).setView([-30.0, 145.0], 4);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(leafletMapInstance);

      const pastIcon = window.L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="pin-past" title="Past Gig"><i class="fa-solid fa-location-dot"></i></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      GIG_DATA.pastGigs.forEach(past => {
        const marker = window.L.marker([past.lat, past.lng], { icon: pastIcon }).addTo(leafletMapInstance);
        marker.bindPopup(`
          <div style="text-align: center; padding: 4px;">
            <strong style="color: #53c678; font-size: 0.82rem;">📍 PAST GIG</strong><br>
            <strong style="font-size: 0.95rem; color: #fff;">${past.venue}</strong><br>
            <span style="font-size: 0.78rem; color: #a1a1aa;">${past.city} • ${past.date}</span><br>
            <span style="font-size: 0.72rem; color: #38bdf8;">"${past.notes}"</span>
          </div>
        `);
      });
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
