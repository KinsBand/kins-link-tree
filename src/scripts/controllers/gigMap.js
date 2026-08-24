import { showToast } from './toast.js';
import { GIG_VENUES as VENUES_DATA } from '../../settings/gigs.config';
import { getDeviceId } from './fanIdentity.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lockScroll() {
  document.body.classList.add('modal-open');
  document.body.classList.add('gig-map-open');
  document.documentElement.classList.add('modal-open');
  document.documentElement.classList.add('gig-map-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.body.classList.remove('gig-map-open');
  document.documentElement.classList.remove('modal-open');
  document.documentElement.classList.remove('gig-map-open');
}

// Tour venues and gig instances — data lives in settings/gigs.config.ts
export const VENUES = VENUES_DATA;
export const LOCAL_GIGS = VENUES_DATA.flatMap((v) => v.shows || []);

// NSW Tour Corridor Polyline coordinates (Newcastle -> Central Coast -> Sydney)
const TOUR_CORRIDOR_PATH = [
  [-32.9265, 151.7675], // The Cambridge Hotel (Newcastle)
  [-32.9230, 151.7510], // The Lass O'Gowrie (Wickham)
  [-32.9278, 151.7640], // King Street Bandroom
  [-33.0000, 151.6500], // Lake Macquarie
  [-33.2800, 151.4200], // Tuggerah / Wyong
  [-33.4300, 151.3400], // Gosford (Central Coast)
  [-33.6000, 151.2000], // Hawkesbury River
  [-33.8000, 151.1800], // Sydney North
  [-33.8762, 151.2064], // Metro Theatre (Sydney CBD)
  [-33.8785, 151.2140], // Oxford Art Factory (Darlinghurst)
  [-33.8845, 151.1985], // The Lansdowne Hotel
  [-33.8885, 151.1890]  // Manning Bar
];

// Coastal Polygon for the Hunter / Sydney catchment
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
let tourPolylineInstance = null;
let regionPolygonInstance = null;
let countdownInterval = null;
let activeVenueId = "venue-cambridge";
let activeGigId = "gig-newcastle-1";
let activeFilter = "all";
const markerMap = new Map();

export let currentSnapState = 'peek'; // 'peek' (Tier 1) | 'expanded' (Tier 2)

let cachedSnapHeights = null;

// Calculate dynamic pixel snap heights and translation bounds for 2-tier bottom sheet (55vh max expansion)
export function getSnapHeights(forceRefresh = false) {
  if (!cachedSnapHeights || forceRefresh) {
    const vh = window.innerHeight;
    const card = document.getElementById('venueDetailBottomCard');
    const fullHeight = card && card.offsetHeight > 0 ? card.offsetHeight : Math.round(vh * 0.55);
    const peekHeight = Math.min(220, Math.max(190, Math.round(vh * 0.28)));
    cachedSnapHeights = {
      peek: peekHeight,
      expanded: fullHeight,
      maxTranslateY: Math.max(0, fullHeight - peekHeight)
    };
  }
  return cachedSnapHeights;
}

// Set bottom sheet snap state (Tier 1 'peek' vs Tier 2 'expanded' 55vh)
export function setSnapState(targetState, options = { animate: true, autoPanMap: true }) {
  const venueDetailCard = document.getElementById('venueDetailBottomCard');
  if (!venueDetailCard) return;

  const validState = targetState === 'expanded' ? 'expanded' : 'peek';
  currentSnapState = validState;
  venueDetailCard.classList.remove('is-dragging');
  venueDetailCard.classList.remove('is-peek', 'is-mid', 'is-expanded');
  venueDetailCard.classList.add(`is-${validState}`);
  venueDetailCard.setAttribute('data-snap-state', validState);
  venueDetailCard.setAttribute('aria-expanded', validState === 'expanded' ? 'true' : 'false');

  // Clean inline transforms and heights so GPU CSS classes take control
  venueDetailCard.style.transform = '';
  venueDetailCard.style.height = '';

  const snapHeights = getSnapHeights();
  document.documentElement.style.setProperty('--peek-height', `${snapHeights.peek}px`);

  // Reset inner scroll positions so Tier 2 always starts at the very top
  const expandedContent = document.getElementById('venueExpandedContent');
  const dynamicBody = document.getElementById('venueDynamicBody');
  if (expandedContent) expandedContent.scrollTop = 0;
  if (dynamicBody) dynamicBody.scrollTop = 0;
  if (venueDetailCard) venueDetailCard.scrollTop = 0;

  // Smoothly adjust Leaflet map so the active venue marker stays centered in the visible top half (the 45% remaining viewport)
  if (options.autoPanMap && leafletMapInstance && activeVenueId) {
    const activeVenue = VENUES.find(v => v.id === activeVenueId);
    if (activeVenue) {
      const isDesktop = window.innerWidth >= 768;
      const latOffset = validState === 'expanded' ? (isDesktop ? 0.035 : 0.046) : (isDesktop ? 0.015 : 0.008);
      leafletMapInstance.panTo([activeVenue.lat - latOffset, activeVenue.lng], {
        animate: true,
        duration: 0.35
      });
    }
  }

  // Single deferred map size recalculation
  setTimeout(() => {
    if (leafletMapInstance) leafletMapInstance.invalidateSize();
  }, 360);
}

// Toggle between Tier 1 (Summary) and Tier 2 (Full Expanded)
export function cycleSheetState() {
  if (currentSnapState === 'expanded') {
    setSnapState('peek');
  } else {
    setSnapState('expanded');
  }
}

export function stepUpSheetState() {
  setSnapState('expanded');
}

export function stepDownSheetState() {
  setSnapState('peek');
}

// Helper to find venue and show
export function findVenueAndShow(targetId) {
  if (!VENUES || VENUES.length === 0) {
    return { venue: null, show: null };
  }

  if (!targetId) {
    const defaultVenue = VENUES[0];
    const defaultShow = defaultVenue?.shows ? (defaultVenue.shows.find(s => s.isNextShow) || defaultVenue.shows[0]) : null;
    return { venue: defaultVenue, show: defaultShow };
  }

  // Check if targetId is a Venue ID
  const venueById = VENUES.find(v => v.id === targetId);
  if (venueById) {
    const show = venueById.shows ? (venueById.shows.find(s => s.isNextShow) || venueById.shows.find(s => s.type === 'upcoming') || venueById.shows[0]) : null;
    return { venue: venueById, show };
  }

  // Check if targetId is a Gig ID
  for (const v of VENUES) {
    if (v.shows) {
      const show = v.shows.find(s => s.id === targetId);
      if (show) {
        return { venue: v, show };
      }
    }
  }

  const defaultVenue = VENUES[0] || null;
  const defaultShow = defaultVenue?.shows?.[0] || null;
  return { venue: defaultVenue, show: defaultShow };
}

// Helper to open Apple Maps (iOS / macOS) or Google Maps (Android / Windows / Other)
export function openExternalMaps(venue) {
  if (!venue) return;
  const isApple = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent || navigator.platform || '');
  const destination = encodeURIComponent(`${venue.name}, ${venue.address}`);
  let url = '';

  if (isApple) {
    url = `https://maps.apple.com/?daddr=${destination}&dirflg=d`;
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  showToast(`Opening directions to ${venue.name}...`);
}

// Generate high-density popup HTML with zero negative space and multi-show preview
function buildPopupHtml(venue, activeShow) {
  const show = activeShow || venue.shows.find(s => s.isNextShow) || venue.shows[0];
  const isUpcoming = show.type === 'upcoming';
  const isNext = show.isNextShow;
  const showCount = venue.shows.length;

  let badgeText = isNext ? '🔥 NEXT GIG' : (isUpcoming ? '🎟️ UPCOMING' : '📼 PAST');
  if (showCount > 1) {
    badgeText = `${badgeText} • ${showCount} SHOWS`;
  }

  return `
    <div class="map-popup-card">
      <div class="map-popup-header-row">
        <span class="map-popup-badge ${isNext ? 'badge-next' : (isUpcoming ? 'badge-upcoming' : 'badge-past')}">
          ${badgeText}
        </span>
        <span class="map-popup-rating"><i class="fa-solid fa-star"></i> ${venue.rating}</span>
      </div>
      <h4 class="map-popup-title" title="${venue.name}">${venue.name}</h4>
      <div class="map-popup-meta">
        <span><i class="fa-solid fa-location-dot"></i> ${venue.city.split(',')[0]}</span>
      </div>
      <div class="map-popup-dates-summary">
        <span class="map-popup-date-preview"><i class="fa-regular fa-calendar"></i> ${show.dateText}</span>
      </div>
      <div class="map-popup-actions">
        <button type="button" class="map-popup-btn map-popup-action-btn" data-popup-venue-id="${venue.id}" data-popup-gig-id="${show.id}" title="View setlist and timeline">
          <i class="fa-solid fa-circle-info"></i> Details
        </button>
        <button type="button" class="map-popup-btn btn-route map-popup-route-btn" data-route-venue-id="${venue.id}" data-route-gig-id="${show.id}" title="Navigate in Maps">
          <i class="fa-solid fa-diamond-turn-right"></i> Navigate
        </button>
      </div>
    </div>
  `;
}

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

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
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
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

// Generate Google Calendar Link
function getGoogleCalendarUrl(gig) {
  if (!gig.targetDate) return "#";
  const start = new Date(gig.targetDate);
  const end = new Date(start.getTime() + 3.5 * 60 * 60 * 1000); // 3.5 hours show

  const formatCalDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
  const title = encodeURIComponent(`Kins Live at ${gig.venue}`);
  const details = encodeURIComponent(`Kins Live in Concert!\nVenue: ${gig.venue}\nAddress: ${gig.address}\nTimes: ${gig.timeText}\nTickets: ${gig.ticketUrl || 'https://www.bandsintown.com'}`);
  const location = encodeURIComponent(`${gig.venue}, ${gig.address}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatCalDate(start)}/${formatCalDate(end)}&details=${details}&location=${location}`;
}

// Generate and trigger iCal .ics download
function downloadIcsFile(gig) {
  if (!gig.targetDate) return;
  const start = new Date(gig.targetDate);
  const end = new Date(start.getTime() + 3.5 * 60 * 60 * 1000);
  const formatIcsDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kins Band//Live Concert//EN",
    "BEGIN:VEVENT",
    `UID:${gig.id}-${Date.now()}@kinsband.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Kins Live at ${gig.venue}`,
    `DESCRIPTION:Kins Live Concert\\nVenue: ${gig.venue}\\nTimes: ${gig.timeText}\\nTickets: ${gig.ticketUrl || 'https://www.bandsintown.com'}`,
    `LOCATION:${gig.venue}, ${gig.address}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `kins-live-${gig.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Calendar event downloaded for ${gig.venue}!`);
}

function openPhotoLightbox(imgSrc, caption) {
  const lightbox = document.getElementById('gigPhotoLightbox');
  const lightboxImg = document.getElementById('gigLightboxImg');
  const lightboxCaption = document.getElementById('gigLightboxCaption');
  if (!lightbox || !lightboxImg) return;

  lightboxImg.src = imgSrc;
  if (lightboxCaption) lightboxCaption.textContent = caption || "Fan Concert Photo • Kins Live";
  lightbox.classList.add('active');
}

function closePhotoLightbox() {
  const lightbox = document.getElementById('gigPhotoLightbox');
  if (lightbox) lightbox.classList.remove('active');
}

function getVenueWebsiteUrl(venue) {
  if (venue.websiteUrl) return venue.websiteUrl;
  const name = (venue.name || '').toLowerCase();
  if (name.includes('lansdowne')) return 'https://thelansdownepub.com.au';
  if (name.includes('metro')) return 'https://www.metrotheatre.com.au';
  if (name.includes('enmore')) return 'https://www.enmoretheatre.com.au';
  if (name.includes('oxford')) return 'https://oxfordartfactory.com';
  if (name.includes('crowbar')) return 'https://crowbarsyd.com';
  if (name.includes('stag')) return 'https://stagandhunter.com.au';
  if (name.includes('manning')) return 'https://manningbar.com';
  if (name.includes('cambridge') || name.includes('king st')) return 'https://www.kingstreet.net.au';
  if (name.includes('lass')) return 'https://thelass.com.au';
  if (name.includes('wollongong')) return 'https://wollongongtownhall.com.au';
  return `https://www.google.com/search?q=${encodeURIComponent((venue.name || '') + ' ' + (venue.city || ''))}`;
}

function getVenueMenuUrl(venue) {
  if (venue.menuUrl) return venue.menuUrl;
  const name = (venue.name || '').toLowerCase();
  if (name.includes('lansdowne')) return 'https://thelansdownepub.com.au/eat-drink/';
  if (name.includes('metro')) return 'https://www.metrotheatre.com.au/bars/';
  if (name.includes('enmore')) return 'https://www.enmoretheatre.com.au/bars/';
  if (name.includes('oxford')) return 'https://oxfordartfactory.com/food-drink/';
  if (name.includes('crowbar')) return 'https://crowbarsyd.com/bar-menu/';
  if (name.includes('stag')) return 'https://stagandhunter.com.au/menu/';
  if (name.includes('manning')) return 'https://manningbar.com/food-drink/';
  if (name.includes('cambridge') || name.includes('king st')) return 'https://www.kingstreet.net.au/bars';
  if (name.includes('lass')) return 'https://thelass.com.au/kitchen/';
  if (name.includes('wollongong')) return 'https://wollongongtownhall.com.au/visit/';
  return `https://www.google.com/search?q=${encodeURIComponent((venue.name || '') + ' menu ' + (venue.city || ''))}`;
}

function getVenueAvgSpend(venue, show) {
  if (venue.avgSpend) return venue.avgSpend.replace(/^[~$\s]+/, '$').replace(/\s*pp$/i, '');
  if (show && show.avgSpend) return show.avgSpend.replace(/^[~$\s]+/, '$').replace(/\s*pp$/i, '');
  const name = (venue.name || '').toLowerCase();
  if (name.includes('enmore') || name.includes('metro')) return '$42';
  if (name.includes('lansdowne') || name.includes('oxford') || name.includes('stag')) return '$28';
  if (name.includes('cambridge') || name.includes('king st')) return '$25';
  if (name.includes('manning') || name.includes('crowbar')) return '$22';
  if (name.includes('wollongong') || name.includes('lass')) return '$26';
  return '$28';
}

// Render multi-show timeline tabs inside venue detail card
function renderVenueEditionTimeline(venue, activeShow) {
  const timelineBar = document.getElementById('venueEditionTimelineBar');
  const timelinePills = document.getElementById('timelineBarPills');
  if (!timelineBar || !timelinePills) return;

  if (!venue || !venue.shows || venue.shows.length <= 1) {
    timelineBar.classList.add('hidden');
    timelinePills.innerHTML = '';
    return;
  }

  timelineBar.classList.remove('hidden');
  timelinePills.innerHTML = venue.shows.map(s => {
    const isAct = s.id === activeShow.id;
    const isUp = s.type === 'upcoming';
    const isNext = s.isNextShow;
    const iconClass = isNext ? 'fa-fire' : (isUp ? 'fa-ticket' : 'fa-compact-disc');
    const badgeText = isNext ? 'NEXT SHOW' : (isUp ? 'UPCOMING' : 'PAST');

    return `
      <button type="button" class="venue-edition-tab ${isAct ? 'active' : ''} ${isUp ? 'is-upcoming' : 'is-past'}" data-show-id="${s.id}" aria-label="Show on ${s.dateText}">
        <i class="fa-solid ${iconClass}"></i>
        <span class="edition-date">${s.dateText}</span>
        <span class="edition-status-badge">${badgeText}</span>
      </button>
    `;
  }).join('');

  timelinePills.querySelectorAll('.venue-edition-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const showId = btn.getAttribute('data-show-id');
      const targetShow = venue.shows.find(s => s.id === showId);
      if (targetShow) {
        displayVenueDetails(venue, targetShow);
      }
    });
  });
}

// Display venue & show details in the bottom card
export function displayVenueDetails(targetVenueOrGig, specificShow) {
  const venueNameEl = document.getElementById('venueCardName');
  const venueLocationEl = document.getElementById('venueCardLocation');
  const venuePeekDate = document.getElementById('venuePeekDate');
  const venueUrgencyPill = document.getElementById('venueUrgencyPill');
  const venueBookingBtn = document.getElementById('venueBookingBtn');
  const venueBookingBtnText = document.getElementById('venueBookingBtnText');
  const quickInfoRow = document.getElementById('venueQuickInfoRow');
  const venueDirectionsBtn = document.getElementById('venueDirectionsBtn');
  const venueCalendarBtn = document.getElementById('venueCalendarBtn');
  const venueShareBtn = document.getElementById('venueShareBtn');
  const richBreakdown = document.getElementById('richShowBreakdown');
  const venueAddressEl = document.getElementById('venueAddressLine');
  const amenitiesRow = document.getElementById('venueAmenitiesRow');
  const transitNoteEl = document.getElementById('venueTransitNote');

  if (!targetVenueOrGig) {
    if (venueNameEl) venueNameEl.textContent = "No Scheduled Shows Found";
    if (venueLocationEl) venueLocationEl.textContent = "Newcastle & Sydney Region";
    if (venuePeekDate) venuePeekDate.textContent = "Check Back Soon";
    if (venueUrgencyPill) venueUrgencyPill.classList.add('hidden');
    if (venueBookingBtn) venueBookingBtn.style.display = "none";
    if (quickInfoRow) quickInfoRow.innerHTML = "";
    if (richBreakdown) {
      richBreakdown.innerHTML = `
        <div class="show-section-card" style="text-align: center; padding: 32px 16px;">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
          <h4 style="font-family: var(--font-heading); color: var(--text-white); font-size: 1.05rem; margin-bottom: 8px;">No Shows Match This Filter</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); max-width: 320px; margin: 0 auto 16px auto;">Try selecting 'All Shows' to explore the full tour route across Sydney and Newcastle.</p>
        </div>
      `;
    }
    renderVenueEditionTimeline(null, null);
    return;
  }

  // Resolve venue and show
  let venue, show;
  if (targetVenueOrGig.shows && Array.isArray(targetVenueOrGig.shows)) {
    venue = targetVenueOrGig;
    show = specificShow || (activeFilter === 'past' 
      ? (venue.shows.find(s => s.type === 'past') || venue.shows[0])
      : (venue.shows.find(s => s.isNextShow) || venue.shows.find(s => s.type === 'upcoming') || venue.shows[0]));
  } else {
    const pair = findVenueAndShow(targetVenueOrGig.id);
    venue = pair.venue;
    show = specificShow || targetVenueOrGig;
  }

  activeVenueId = venue.id;
  activeGigId = show.id;
  const isUpcoming = show.type === 'upcoming';

  // Always reset Tier 2 scroll to top when switching gigs or venues
  const expandedContentEl = document.getElementById('venueExpandedContent');
  const dynamicBodyEl = document.getElementById('venueDynamicBody');
  const detailCardEl = document.getElementById('venueDetailBottomCard');
  if (expandedContentEl) expandedContentEl.scrollTop = 0;
  if (dynamicBodyEl) dynamicBodyEl.scrollTop = 0;
  if (detailCardEl) detailCardEl.scrollTop = 0;

  // 1. Venue Title, Location & Date
  if (venueNameEl) venueNameEl.textContent = venue.name;
  if (venueLocationEl) venueLocationEl.textContent = venue.city.split(',')[0].trim();
  if (venuePeekDate) venuePeekDate.textContent = show.dateText;

  // 2. Badges: Urgency Pill (Upcoming) vs Archive Badge (Past) & Header Share Button
  const venueArchiveBadge = document.getElementById('venueArchiveBadge');
  if (venueUrgencyPill) {
    if (isUpcoming && show.urgencyBadgeText) {
      venueUrgencyPill.innerHTML = `<i class="fa-solid fa-fire"></i> ${show.urgencyBadgeText.replace('🔥', '').trim()}`;
      venueUrgencyPill.classList.remove('hidden');
    } else {
      venueUrgencyPill.classList.add('hidden');
    }
  }

  if (venueArchiveBadge) {
    if (!isUpcoming) {
      venueArchiveBadge.classList.remove('hidden');
    } else {
      venueArchiveBadge.classList.add('hidden');
    }
  }

  // Header Share Button (Always active and visible in header next to badge)
  const venueHeaderShareBtn = document.getElementById('venueHeaderShareBtn');
  if (venueHeaderShareBtn) {
    venueHeaderShareBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerShareShow(venue, show);
    };
  }

  // 3. Primary Full-Width CTA
  const venueCheckinBtn = document.getElementById('venueCheckinBtn');
  const venueCheckinBtnText = document.getElementById('venueCheckinBtnText');

  if (isUpcoming) {
    if (venueBookingBtn) {
      venueBookingBtn.style.display = "flex";
      const isSellingFast = show.ticketStatus === 'selling_fast';
      venueBookingBtn.className = `venue-booking-btn ${isSellingFast ? 'is-selling-fast' : ''}`;
      const priceTag = show.ticketPriceLabel || show.ticketPrice || '$15 (EARLY BIRD)';
      venueBookingBtn.innerHTML = `<i class="fa-solid fa-bolt"></i><span>GET TICKETS — ${priceTag}</span>`;
      venueBookingBtn.href = show.ticketUrl || "https://www.bandsintown.com";
      venueBookingBtn.target = "_blank";
    }
    if (venueCheckinBtn) venueCheckinBtn.classList.add('hidden');
  } else {
    if (venueBookingBtn) venueBookingBtn.style.display = "none";
    if (venueCheckinBtn) {
      venueCheckinBtn.classList.remove('hidden');
      const updateCheckinUI = () => {
        const count = (show.attendanceCount || 340) + (show.hasUserCheckedIn ? 1 : 0);
        if (show.hasUserCheckedIn) {
          venueCheckinBtn.className = "venue-checkin-btn is-checked-in";
          if (venueCheckinBtnText) venueCheckinBtnText.textContent = `CHECKED IN! • YOU ATTENDED THIS SHOW (${count} FANS)`;
          venueCheckinBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>CHECKED IN! • YOU ATTENDED THIS SHOW (${count} FANS)</span>`;
        } else {
          venueCheckinBtn.className = "venue-checkin-btn";
          if (venueCheckinBtnText) venueCheckinBtnText.textContent = `${count} FANS ATTENDED • "I WAS THERE" (CHECK IN)`;
          venueCheckinBtn.innerHTML = `<i class="fa-solid fa-ticket"></i><span>${count} FANS ATTENDED • "I WAS THERE" (CHECK IN)</span>`;
        }
      };
      updateCheckinUI();

      venueCheckinBtn.onclick = async (e) => {
        e.preventDefault();
        if (venueCheckinBtn.dataset.busy === 'true') return;
        venueCheckinBtn.dataset.busy = 'true';

        try {
          const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gigId: show.id, deviceId: getDeviceId() })
          });
          const data = await res.json();

          if (res.ok && data.status === 'success') {
            const badgeNote = Array.isArray(data.newBadges) && data.newBadges.length > 0
              ? ` Badge earned: ${data.newBadges.map((b) => b.label).join(', ')}!`
              : '';
            if (data.alreadyCheckedIn) {
              showToast(`Already in your passport — ${data.totalGigs} show${data.totalGigs === 1 ? '' : 's'} and counting.`);
            } else {
              showToast(`Checked in to ${venue.name}! ${data.totalGigs} show${data.totalGigs === 1 ? '' : 's'} in your passport.${badgeNote}`);
            }
            if (venueCheckinBtnText) {
              venueCheckinBtnText.textContent = `✓ IN YOUR PASSPORT • ${data.totalGigs} SHOW${data.totalGigs === 1 ? '' : 'S'}`;
            }
            venueCheckinBtn.className = 'venue-checkin-btn is-checked-in';
            venueCheckinBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>✓ IN YOUR PASSPORT • ${data.totalGigs} SHOW${data.totalGigs === 1 ? '' : 'S'}</span>`;
            show.hasUserCheckedIn = true;
          } else {
            showToast((data && data.message) || 'Check-in failed right now — try again.');
          }
        } catch (_) {
          showToast('Network issue — check-in not saved. Try again.');
        } finally {
          delete venueCheckinBtn.dataset.busy;
        }
      };
    }
  }

  // Build unified chronological history of all shows at this venue (most recent on top)
  const venueHistoryItems = [];
  (venue.shows || []).forEach(s => {
    venueHistoryItems.push({
      id: s.id,
      dateText: s.dateText,
      tourTitle: s.tourName || s.timeText || (s.type === 'upcoming' ? 'Headline Tour 2026' : 'Soundboard Tape Recorded'),
      type: s.type,
      isNextShow: s.isNextShow,
      sortDate: s.targetDate ? new Date(s.targetDate).getTime() : (s.type === 'upcoming' ? Date.now() + 10000000000 : (Date.parse(s.dateText.replace('Played ', '').replace('Sat, ', '')) || 0))
    });
  });

  if (show.pastVenueHistory && Array.isArray(show.pastVenueHistory)) {
    show.pastVenueHistory.forEach(h => {
      const alreadyExists = venueHistoryItems.some(item => item.dateText.includes(h.date) || h.date.includes(item.dateText));
      if (!alreadyExists) {
        venueHistoryItems.push({
          id: null,
          dateText: h.date,
          tourTitle: h.tourName,
          type: 'past',
          isNextShow: false,
          sortDate: Date.parse(h.date) || 0
        });
      }
    });
  }

  venueHistoryItems.sort((a, b) => b.sortDate - a.sortDate);

  // 4. Render Dynamic Body Content for Upcoming vs Archived
  const venueDynamicBody = document.getElementById('venueDynamicBody');
  if (venueDynamicBody) {
    if (isUpcoming) {
      // UPCOMING GIG SECTIONS
      const googleCalUrl = getGoogleCalendarUrl(show);

      venueDynamicBody.innerHTML = `
        <!-- Tier 1 View: Summary, Quick Actions & Drawer Trigger -->
        <div class="venue-quick-info-row">
          <span class="quick-chip"><i class="fa-regular fa-clock"></i> Doors ${show.doorsTime || '7:00 PM'}</span>
          <span class="quick-chip"><i class="fa-solid fa-id-card"></i> ${show.ageLimit || '18+'}</span>
          <span class="quick-chip"><i class="fa-solid fa-users"></i> ${show.capacity || '500'} Cap</span>
          <span class="quick-chip"><i class="fa-solid fa-receipt"></i> ~${getVenueAvgSpend(venue, show)} pp</span>
        </div>

        <!-- Redesigned Quick Action Row: 1. Directions -> 2. Website -> 3. Menu -> 4. Calendar -->
        <div class="venue-action-chips-row">
          <button type="button" class="venue-action-icon-btn" id="venueDirectionsAction" aria-label="Directions to venue" title="Directions / Navigation">
            <i class="fa-solid fa-diamond-turn-right"></i>
          </button>
          <a href="${getVenueWebsiteUrl(venue)}" target="_blank" rel="noopener noreferrer" class="venue-action-pill-btn" aria-label="Visit venue website" title="Venue Official Website">
            <i class="fa-solid fa-globe"></i>
            <span>Website</span>
          </a>
          <a href="${getVenueMenuUrl(venue)}" target="_blank" rel="noopener noreferrer" class="venue-action-pill-btn" aria-label="View food and drinks menu" title="Food & Drink Menu">
            <i class="fa-solid fa-utensils"></i>
            <span>Menu</span>
          </a>
          <button type="button" class="venue-action-icon-btn" id="venueCalendarAction" aria-label="Add show to calendar" title="Add to Calendar">
            <i class="fa-regular fa-calendar-plus"></i>
          </button>
        </div>

        <!-- Fixed Interactive Bottom Drawer Trigger (Tier 1 Bottom) -->
        <div class="swipe-up-hint-box" id="upcomingSwipeUpTrigger" role="button" tabindex="0" title="Tap or swipe up for full details">
          <i class="fa-solid fa-chevron-up"></i>
          <span>Swipe up for Setlist preview & Song Requests</span>
        </div>

        <!-- TIER 2 FULL EXTENDED CONTENT (Revealed via swipe-up / CTA tap) -->
        <div class="expanded-only-block" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Section 1: Set Times & Lineup Card (Moved to Tier 2) -->
          <div class="set-times-card">
            <div class="set-times-header-title">
              <i class="fa-solid fa-clock-rotate-left fa-fw"></i> Set Times & Lineup
            </div>
            <div class="set-times-list">
              ${(show.setTimes || [
                { time: "7:00 PM", act: "Doors Open", role: "Doors" },
                { time: "7:30 PM", act: "The Local Openers", role: "Support" },
                { time: "8:45 PM", act: "KINS (Main Set)", role: "Headliner" }
              ]).map(st => `
                <div class="set-time-row">
                  <div class="set-time-left">
                    <span class="set-time-pill">${st.time}</span>
                    <span class="set-act-title ${st.role === 'Headliner' ? 'is-headliner' : ''}">${st.act}</span>
                  </div>
                  <span class="set-role-badge role-${st.role ? st.role.toLowerCase() : 'support'}">${st.role || 'ACT'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: Planned Setlist Preview -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-music fa-fw"></i> Planned Setlist</span>
            </h3>
            <div class="setlist-preview-list">
              ${(show.plannedSetlist || [
                { name: "Pictures of You (The Cure)", tag: "OPENER", duration: "4:20" },
                { name: "Say It Ain't So (Weezer)", tag: "HIGH ENERGY", duration: "4:18" },
                { name: "Common People (Pulp)", tag: "FAN FAVORITE", duration: "4:10" },
                { name: "Jane (The Long Faces)", tag: "DEEP CUT", duration: "3:45" },
                { name: "Everlong (Foo Fighters)", tag: "ENCORE", duration: "4:10" }
              ]).map((t, idx) => `
                <div class="setlist-preview-row" data-track-name="${t.name}">
                  <div class="track-title-wrap">
                    <i class="fa-solid fa-play" style="font-size: 0.65rem; color: #a1a1aa;"></i>
                    <span><strong>${idx + 1}.</strong> ${t.name}</span>
                  </div>
                  <span class="track-tag">[${t.tag || 'LIVE'}]</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 3: Request a Song or Cover -->
          <div class="song-request-card">
            <div class="song-request-header">
              <i class="fa-solid fa-envelope fa-fw"></i> Request a Song or Cover
            </div>
            <p class="song-request-desc">Have a track you want us to play? Let the band know before soundcheck!</p>
            <div class="song-request-form" id="songRequestFormContainer">
              <input type="text" placeholder="e.g. Pictures of You - The Cure" class="song-request-input" id="songRequestInput" />
              <button type="button" class="song-request-submit-btn" id="songRequestSubmitBtn">Submit</button>
            </div>
          </div>

          <!-- Section 4: Venue & Location -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-location-dot fa-fw"></i> Venue & Location</span>
            </h3>
            <div class="venue-travel-card">
              <button type="button" class="copy-address-btn" id="copyVenueAddressBtn" data-address="${venue.address}" title="Click to copy full address">
                <div class="copy-address-text-wrap">
                  <i class="fa-solid fa-location-dot address-icon"></i>
                  <span class="venue-full-address-text">${venue.address}</span>
                </div>
                <span class="copy-address-action-badge">
                  <i class="fa-regular fa-copy"></i>
                  <span>Copy</span>
                </span>
              </button>
              <div class="travel-amenities-pills">
                ${(venue.amenities && Array.isArray(venue.amenities) ? venue.amenities.map(am => typeof am === 'object' ? `<span class="travel-amenity-chip">${am.label || ''}</span>` : `<span class="travel-amenity-chip">${am}</span>`) : ['<span class="travel-amenity-chip">💳 Card-Only Bar</span>', '<span class="travel-amenity-chip">♿ Accessible</span>']).join('')}
              </div>
            </div>
          </div>

          <!-- Section 5: Past Shows at Venue (Chronological History List) -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-clock-rotate-left fa-fw"></i> Past Shows at Venue</span>
              <span class="right-hint">${venueHistoryItems.length} Shows</span>
            </h3>
            <div class="venue-history-list">
              ${venueHistoryItems.map(item => `
                <div class="venue-history-card-row ${item.id === show.id ? 'is-current-active' : ''}" ${item.id ? `data-show-id="${item.id}"` : ''}>
                  <div class="venue-history-row-left">
                    <span class="venue-history-date">${item.dateText}</span>
                    <span class="venue-history-sub">${item.tourTitle}</span>
                  </div>
                  <div class="venue-history-row-right">
                    ${item.isNextShow 
                      ? '<span class="venue-history-badge is-live"><i class="fa-solid fa-bolt"></i> NEXT SHOW</span>'
                      : (item.type === 'upcoming'
                          ? '<span class="venue-history-badge is-upcoming"><i class="fa-solid fa-calendar-check"></i> UPCOMING</span>'
                          : '<span class="venue-history-badge is-past"><i class="fa-solid fa-box-archive"></i> COMPLETED</span>')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tier 2 Bottom Navigation Controls (Back to Top & Back to Map) -->
          <div class="sheet-bottom-nav-row">
            <button type="button" class="sheet-nav-btn is-back-to-top sheet-back-to-top-btn" aria-label="Back to top of gig details">
              <i class="fa-solid fa-arrow-up"></i>
              <span>Back to Top</span>
            </button>
            <button type="button" class="sheet-nav-btn is-back-to-map sheet-back-to-map-btn" aria-label="Back to interactive map">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Back to Map</span>
            </button>
          </div>
        </div>
      `;

      // Wire interactive events for upcoming components
      const dirBtn = document.getElementById('venueDirectionsAction');
      if (dirBtn) {
        dirBtn.onclick = (e) => {
          e.preventDefault();
          openExternalMaps(venue);
        };
      }

      const copyAddrBtn = document.getElementById('copyVenueAddressBtn');
      if (copyAddrBtn) {
        copyAddrBtn.onclick = () => {
          const addr = copyAddrBtn.getAttribute('data-address') || venue.address;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(addr);
            showToast(`Address copied: ${addr}`);
          } else {
            showToast(`Address: ${addr}`);
          }
        };
      }

      const calBtn = document.getElementById('venueCalendarAction');
      if (calBtn) {
        calBtn.onclick = (e) => {
          e.preventDefault();
          const choice = confirm(`Add "${venue.name}" show to calendar?\n\nClick OK for Google Calendar\nClick Cancel to download .ics (Apple / Outlook)`);
          if (choice) {
            window.open(googleCalUrl, '_blank', 'noopener,noreferrer');
          } else {
            downloadIcsFile(show);
          }
        };
      }

      const shareBtn = document.getElementById('venueShareAction');
      if (shareBtn) {
        shareBtn.onclick = () => triggerShareShow(venue, show);
      }

      const swipeUp = document.getElementById('upcomingSwipeUpTrigger');
      if (swipeUp) {
        swipeUp.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('expanded');
        };
      }

      // Track preview row clicks
      venueDynamicBody.querySelectorAll('.setlist-preview-row').forEach(row => {
        row.addEventListener('click', () => {
          const trackName = row.getAttribute('data-track-name') || '';
          const trackObj = parseSetlistTrackInfo(trackName);
          if (window.playTrackPreview) {
            window.playTrackPreview(trackObj);
          }
        });
      });

      // History row clicks
      venueDynamicBody.querySelectorAll('.venue-history-card-row[data-show-id]').forEach(row => {
        row.addEventListener('click', () => {
          const sId = row.getAttribute('data-show-id');
          const targetShow = venue.shows.find(s => s.id === sId);
          if (targetShow && targetShow.id !== show.id) {
            displayVenueDetails(venue, targetShow);
          }
        });
      });

      // Song Request Form submission (real endpoint: /api/request-song)
      const songReqBtn = document.getElementById('songRequestSubmitBtn');
      const songReqInput = document.getElementById('songRequestInput');
      const songReqContainer = document.getElementById('songRequestFormContainer');
      if (songReqBtn && songReqInput && songReqContainer) {
        songReqBtn.onclick = async () => {
          const val = songReqInput.value.trim();
          if (!val || songReqBtn.dataset.busy === 'true') return;

          const separatorIdx = val.lastIndexOf(' - ');
          const songTitle = separatorIdx > 0 ? val.slice(0, separatorIdx).trim() : val;
          const artist = separatorIdx > 0 ? val.slice(separatorIdx + 3).trim() : 'Unknown Artist';

          songReqBtn.dataset.busy = 'true';
          songReqBtn.disabled = true;
          const originalLabel = songReqBtn.textContent;
          songReqBtn.textContent = 'Sending…';

          try {
            const res = await fetch('/api/request-song', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ songTitle, artist, reason: `Gig-night request via venue sheet (${venue.name})` })
            });
            const data = await res.json().catch(() => null);

            if (res.ok && data && data.status === 'success') {
              songReqContainer.innerHTML = `<div class="song-request-success">✓ Request for "${escapeHtml(songTitle)}" sent to the band's setlist board!</div>`;
              showToast('Song request submitted! Thanks for voting.');
            } else {
              showToast((data && data.message) || 'Could not send your request right now.');
              songReqBtn.textContent = originalLabel;
              songReqBtn.disabled = false;
            }
          } catch (_) {
            showToast('Network issue — request not sent. Try again.');
            songReqBtn.textContent = originalLabel;
            songReqBtn.disabled = false;
          } finally {
            delete songReqBtn.dataset.busy;
          }
        };
      }

      // Tier 3 Bottom Navigation Event Listeners
      venueDynamicBody.querySelectorAll('.sheet-back-to-top-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const card = document.getElementById('venueDetailBottomCard');
          if (card) {
            card.scrollTo({ top: 0, behavior: 'smooth' });
            card.scrollTop = 0;
          }
        };
      });

      venueDynamicBody.querySelectorAll('.sheet-back-to-map-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('peek', { animate: true, autoPanMap: true });
        };
      });

    } else {
      // ARCHIVED GIG SECTIONS - Normalize data to guarantee full viability
      const asPlayedTracks = (show.asPlayedSetlist && show.asPlayedSetlist.length > 0)
        ? show.asPlayedSetlist
        : ((show.setlistDetails && show.setlistDetails.songs && show.setlistDetails.songs.length > 0)
            ? show.setlistDetails.songs.map((s, idx) => ({
                name: s.name,
                tag: s.tag || s.genre || (idx === 0 ? 'Opener' : (idx === show.setlistDetails.songs.length - 1 ? 'Encore' : 'Live Track')),
                duration: s.duration || '3:45',
                isUnreleased: s.isUnreleased || false,
                hasSnippet: true
              }))
            : [
                { name: "Pictures of You (The Cure cover)", tag: "Opener", duration: "4:20" },
                { name: "Say It Ain't So (Weezer cover)", tag: "High Energy", duration: "4:18" },
                { name: "Common People", tag: "Britpop", duration: "4:10" },
                { name: "Jane", tag: "Art Rock", duration: "3:45" },
                { name: "Neon Horizon [UNRELEASED NEW SONG]", isUnreleased: true, tag: "Debut", duration: "3:55" },
                { name: "Everlong (Foo Fighters)", tag: "Encore", duration: "4:10", hasSnippet: true }
              ]);

      const recapPhotos = (show.recapPhotos && show.recapPhotos.length > 0)
        ? show.recapPhotos
        : ((show.crowdAndGallery && show.crowdAndGallery.photos && show.crowdAndGallery.photos.length > 0)
            ? show.crowdAndGallery.photos.map(url => ({
                url,
                caption: "Concert Archive",
                credit: "@kins_vault"
              }))
            : [
                { url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", caption: "Stage & Light Rig", credit: "@local_photographer" },
                { url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", caption: "Full Room Crowd", credit: "@rock_lens" },
                { url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80", caption: "Encore on Bar Counter", credit: "@band_archives" }
              ]);

      const highlightsList = (show.highlightsAndTrivia && show.highlightsAndTrivia.length > 0)
        ? show.highlightsAndTrivia
        : [
            show.snapshot?.highlight || "Sold out performance recorded live on soundboard master.",
            show.setlistDetails?.stageNotes || "Crowd reached full room capacity before headline set.",
            "Archived in 24-bit stereo soundboard master format."
          ];
      venueDynamicBody.innerHTML = `
        <!-- Tier 1 View: Summary, Quick Actions & Drawer Trigger -->
        <div class="venue-quick-info-row">
          <span class="quick-chip"><i class="fa-solid fa-box-archive"></i> Past</span>
          <span class="quick-chip"><i class="fa-solid fa-id-card"></i> ${show.ageLimit || '18+'}</span>
          <span class="quick-chip"><i class="fa-solid fa-users"></i> ${show.capacity || '500'} Cap</span>
          <span class="quick-chip"><i class="fa-solid fa-receipt"></i> ~${getVenueAvgSpend(venue, show)} pp</span>
        </div>

        <!-- Redesigned Quick Action Row: 1. Directions -> 2. Website -> 3. Menu -> 4. Spotify -->
        <div class="venue-action-chips-row">
          <button type="button" class="venue-action-icon-btn" id="venueArchiveDirectionsAction" aria-label="Directions to venue" title="Directions / Navigation">
            <i class="fa-solid fa-diamond-turn-right"></i>
          </button>
          <a href="${getVenueWebsiteUrl(venue)}" target="_blank" rel="noopener noreferrer" class="venue-action-pill-btn" aria-label="Visit venue website" title="Venue Official Website">
            <i class="fa-solid fa-globe"></i>
            <span>Website</span>
          </a>
          <a href="${getVenueMenuUrl(venue)}" target="_blank" rel="noopener noreferrer" class="venue-action-pill-btn" aria-label="View food and drinks menu" title="Food & Drink Menu">
            <i class="fa-solid fa-utensils"></i>
            <span>Menu</span>
          </a>
          <a href="${show.spotifyPlaylistUrl || 'https://open.spotify.com'}" target="_blank" rel="noopener noreferrer" class="venue-action-icon-btn" aria-label="Play on Spotify" title="Spotify Playlist">
            <i class="fa-brands fa-spotify" style="color: #1db954 !important;"></i>
          </a>
        </div>

        <!-- Fixed Interactive Bottom Drawer Trigger (Tier 1 Bottom) -->
        <div class="swipe-up-hint-box" id="archiveSwipeUpTrigger" role="button" tabindex="0" title="Tap or swipe up for full archive">
          <i class="fa-solid fa-chevron-up"></i>
          <span>Swipe up for Setlist, recordings & photos</span>
        </div>

        <!-- TIER 2 FULL EXTENDED CONTENT (Revealed via swipe-up / CTA tap) -->
        <div class="expanded-only-block" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Section 1: Official Photos & Media Gallery -->
          ${recapPhotos.length > 0 ? `
            <div class="section-divider-bar">
              <h3 class="expanded-section-title">
                <span class="left-title"><i class="fa-solid fa-images fa-fw"></i> Official Photos & Media</span>
                <span class="right-hint">Swipe ➔</span>
              </h3>
              <div class="official-media-gallery">
                ${recapPhotos.map(p => `
                  <div class="official-photo-card" data-photo-url="${p.url}" data-photo-caption="${p.caption} • ${p.credit || ''}">
                    <img src="${p.url}" alt="${p.caption}" loading="lazy" />
                    <div class="photo-credit-bar">${p.credit ? 'Photo by ' + p.credit : p.caption}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Section 2: As-Played Setlist (Guaranteed Viable) -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-compact-disc fa-fw"></i> As-Played Setlist</span>
            </h3>
            <div class="as-played-list">
              ${asPlayedTracks.map((t, idx) => `
                <div class="as-played-item">
                  <div class="track-main-info">
                    <span style="font-family: monospace; color: #71717a; font-size: 0.7rem;">${idx + 1}.</span>
                    <span>${t.name}</span>
                    ${t.isUnreleased ? `<span class="unreleased-star">⭐ UNRELEASED</span>` : ''}
                  </div>
                  ${t.hasSnippet ? `
                    <button type="button" class="snippet-btn" data-track-name="${t.name}">
                      <i class="fa-solid fa-volume-high"></i> Snippet
                    </button>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 3: Show Highlights & Trivia -->
          ${highlightsList.length > 0 ? `
            <div class="section-divider-bar">
              <h3 class="expanded-section-title">
                <span class="left-title"><i class="fa-solid fa-wand-magic-sparkles fa-fw"></i> Show Highlights & Trivia</span>
              </h3>
              <div class="show-trivia-card">
                ${highlightsList.map(tr => `
                  <p class="trivia-bullet"><i class="fa-solid fa-circle-dot"></i> <span>${tr}</span></p>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Section 4: Past Shows at Venue (Chronological History List) -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-clock-rotate-left fa-fw"></i> Past Shows at Venue</span>
              <span class="right-hint">${venueHistoryItems.length} Shows</span>
            </h3>
            <div class="venue-history-list">
              ${venueHistoryItems.map(item => `
                <div class="venue-history-card-row ${item.id === show.id ? 'is-current-active' : ''}" ${item.id ? `data-show-id="${item.id}"` : ''}>
                  <div class="venue-history-row-left">
                    <span class="venue-history-date">${item.dateText}</span>
                    <span class="venue-history-sub">${item.tourTitle}</span>
                  </div>
                  <div class="venue-history-row-right">
                    ${item.isNextShow 
                      ? '<span class="venue-history-badge is-live"><i class="fa-solid fa-bolt"></i> NEXT SHOW</span>'
                      : (item.type === 'upcoming'
                          ? '<span class="venue-history-badge is-upcoming"><i class="fa-solid fa-calendar-check"></i> UPCOMING</span>'
                          : '<span class="venue-history-badge is-past"><i class="fa-solid fa-box-archive"></i> COMPLETED</span>')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tier 2 Bottom Navigation Controls (Back to Top & Back to Map) -->
          <div class="sheet-bottom-nav-row">
            <button type="button" class="sheet-nav-btn is-back-to-top sheet-back-to-top-btn" aria-label="Back to top of gig details">
              <i class="fa-solid fa-arrow-up"></i>
              <span>Back to Top</span>
            </button>
            <button type="button" class="sheet-nav-btn is-back-to-map sheet-back-to-map-btn" aria-label="Back to interactive map">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Back to Map</span>
            </button>
          </div>
        </div>
      `;

      // Wire interactive events for archive components
      const dirBtnArc = document.getElementById('venueArchiveDirectionsAction');
      if (dirBtnArc) {
        dirBtnArc.onclick = (e) => {
          e.preventDefault();
          openExternalMaps(venue);
        };
      }

      const shareBtnArc = document.getElementById('venueArchiveShareAction');
      if (shareBtnArc) {
        shareBtnArc.onclick = () => triggerShareShow(venue, show);
      }

      const swipeUpArc = document.getElementById('archiveSwipeUpTrigger');
      if (swipeUpArc) {
        swipeUpArc.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('expanded');
        };
      }

      // History row clicks
      venueDynamicBody.querySelectorAll('.venue-history-card-row[data-show-id]').forEach(row => {
        row.addEventListener('click', () => {
          const sId = row.getAttribute('data-show-id');
          const targetShow = venue.shows.find(s => s.id === sId);
          if (targetShow && targetShow.id !== show.id) {
            displayVenueDetails(venue, targetShow);
          }
        });
      });

      // Lightbox click on photos
      venueDynamicBody.querySelectorAll('[data-photo-url]').forEach(card => {
        card.addEventListener('click', () => {
          const url = card.getAttribute('data-photo-url');
          const cap = card.getAttribute('data-photo-caption') || 'Concert Photo';
          openPhotoLightbox(url, cap);
        });
      });

      // Snippet player buttons
      venueDynamicBody.querySelectorAll('.snippet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const trackName = btn.getAttribute('data-track-name') || '';
          const trackObj = parseSetlistTrackInfo(trackName);
          showToast(`Playing soundboard snippet for ${trackObj.title}...`);
          if (window.playTrackPreview) {
            window.playTrackPreview(trackObj);
          }
        });
      });

      // Tier 3 Bottom Navigation Event Listeners
      venueDynamicBody.querySelectorAll('.sheet-back-to-top-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const card = document.getElementById('venueDetailBottomCard');
          if (card) {
            card.scrollTo({ top: 0, behavior: 'smooth' });
            card.scrollTop = 0;
          }
        };
      });

      venueDynamicBody.querySelectorAll('.sheet-back-to-map-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('peek', { animate: true, autoPanMap: true });
        };
      });
    }
  }

  // Helper for sharing show
  function triggerShareShow(v, s) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gig=${s.id}`;
    const shareData = {
      title: `Kins Live at ${v.name}`,
      text: `Check out Kins live show at ${v.name} (${s.dateText})!`,
      url: shareUrl
    };
    if (navigator.share && window.innerWidth < 768) {
      navigator.share(shareData).catch(() => {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast(`Link to ${v.name} copied!`);
    } else {
      showToast(`Share: ${shareUrl}`);
    }
  }

  // 8. Update Selector Pills
  let activePillToCenter = null;
  document.querySelectorAll('.gig-select-pill').forEach(pill => {
    const pillGigId = pill.getAttribute('data-gig-id');
    const pillVenueId = pill.getAttribute('data-venue-id');
    if (pillGigId === show.id || pillVenueId === venue.id) {
      pill.classList.add('active');
      activePillToCenter = pill;
    } else {
      pill.classList.remove('active');
    }
  });

  if (activePillToCenter) {
    requestAnimationFrame(() => {
      activePillToCenter.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  // 10. Highlight Map Marker (Without opening duplicate popup overlay)
  markerMap.forEach((marker, vId) => {
    const el = marker.getElement();
    const v = VENUES.find(item => item.id === vId);
    if (el) {
      const wrap = el.querySelector('.custom-map-pin-wrap');
      if (wrap) {
        if (vId === venue.id) {
          wrap.classList.add('is-selected-marker');
          marker.setZIndexOffset(1000);
        } else {
          wrap.classList.remove('is-selected-marker');
          const hasNext = v && v.shows.some(s => s.isNextShow);
          marker.setZIndexOffset(hasNext ? 500 : 100);
        }
      }
    }
  });

  // Close any stray leaflet popups so the map remains clear above the bottom sheet
  if (leafletMapInstance) {
    leafletMapInstance.closePopup();
    const isDesktop = window.innerWidth >= 768;
    const targetLat = isDesktop ? venue.lat - 0.035 : venue.lat - 0.015;
    leafletMapInstance.flyTo([targetLat, venue.lng], isDesktop ? 12 : 12.5, { duration: 0.8 });
  }
}

export function filterGigs(category) {
  activeFilter = category;
  
  // Update filter buttons
  document.querySelectorAll('.gig-filter-tab').forEach(tab => {
    const isAct = tab.getAttribute('data-filter') === category;
    if (isAct) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    } else {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    }
  });

  // Update active indicator dot on the filter toggle button
  const activeDot = document.getElementById('filterActiveDot');
  if (activeDot) {
    activeDot.style.display = category !== 'all' ? 'block' : 'none';
  }

  // Filter venues by All, Upcoming, or Past
  const matchingVenues = VENUES.filter(v => {
    if (category === 'all') return true;
    if (category === 'upcoming') return v.shows.some(s => s.type === 'upcoming');
    if (category === 'past') return v.shows.some(s => s.type === 'past');
    return true;
  });

  // Re-render selector pills (Minimised compact pills)
  const selectorPillsRow = document.getElementById('gigSelectorPillsRow');
  if (selectorPillsRow) {
    if (matchingVenues.length > 0) {
      selectorPillsRow.innerHTML = matchingVenues.map(v => {
        // Pick primary show for display
        let primeShow = v.shows.find(s => s.isNextShow);
        if (!primeShow) {
          if (category === 'past') {
            primeShow = v.shows.find(s => s.type === 'past') || v.shows[0];
          } else {
            primeShow = v.shows.find(s => s.type === 'upcoming') || v.shows[0];
          }
        }

        const isNext = primeShow.isNextShow;
        const isUp = primeShow.type === 'upcoming';
        const multiTag = v.shows.length > 1 ? `<span class="pill-multi-count">${v.shows.length}</span>` : '';

        return `
          <button class="gig-select-pill ${v.id === activeVenueId ? 'active' : ''}" data-venue-id="${v.id}" data-gig-id="${primeShow.id}">
            <span class="pill-badge-icon">${isNext ? '🔥' : (isUp ? '🎟️' : '📼')}</span>
            <span class="pill-name">${v.name}</span>
            <span class="pill-city-tag">• ${v.city.split(',')[0]}</span>
            ${multiTag}
          </button>
        `;
      }).join('');

      selectorPillsRow.querySelectorAll('.gig-select-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const venueId = pill.getAttribute('data-venue-id');
          const gigId = pill.getAttribute('data-gig-id');
          const targetVenue = VENUES.find(v => v.id === venueId);
          const targetShow = targetVenue ? targetVenue.shows.find(s => s.id === gigId) : null;
          if (targetVenue) displayVenueDetails(targetVenue, targetShow);
        });
      });
    } else {
      selectorPillsRow.innerHTML = `<span style="color: var(--text-muted); font-size: 0.72rem; padding: 4px 10px; display: inline-block;">No shows matching selected filter</span>`;
    }
  }

  // Update map markers visibility/opacity
  markerMap.forEach((marker, vId) => {
    const isMatch = matchingVenues.some(v => v.id === vId);
    const el = marker.getElement();
    if (el) {
      if (isMatch) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0.2';
        el.style.pointerEvents = 'none';
      }
    }
  });

  // If in list view, re-render the chronological tour stack
  renderChronologicalTourStack(category, currentSearchQuery);

  // If active venue is not matching, switch to first matching
  const isCurrentMatching = matchingVenues.some(v => v.id === activeVenueId);
  if (!isCurrentMatching && matchingVenues.length > 0) {
    displayVenueDetails(matchingVenues[0]);
  } else if (matchingVenues.length === 0) {
    displayVenueDetails(null);
  }
}

let currentViewMode = 'map';
let currentSearchQuery = '';

export function setViewMode(mode) {
  currentViewMode = mode;
  const mapBtns = document.querySelectorAll('.view-switch-map-btn');
  const listBtns = document.querySelectorAll('.view-switch-list-btn');
  const mapWrapper = document.getElementById('mapViewWrapper');
  const bottomCard = document.getElementById('venueDetailBottomCard');
  const listContainer = document.getElementById('gigListViewContainer');

  if (mode === 'list') {
    mapBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    listBtns.forEach(b => {
      b.classList.add('active');
      b.setAttribute('aria-selected', 'true');
    });
    if (mapWrapper) mapWrapper.classList.add('hidden');
    if (bottomCard) bottomCard.classList.add('hidden');
    if (listContainer) {
      listContainer.classList.remove('hidden');
      renderChronologicalTourStack(activeFilter, currentSearchQuery);
    }
  } else {
    mapBtns.forEach(b => {
      b.classList.add('active');
      b.setAttribute('aria-selected', 'true');
    });
    listBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    if (listContainer) listContainer.classList.add('hidden');
    if (mapWrapper) mapWrapper.classList.remove('hidden');
    if (bottomCard) bottomCard.classList.remove('hidden');
    if (leafletMapInstance) {
      setTimeout(() => {
        try {
          leafletMapInstance.invalidateSize();
        } catch (e) {}
      }, 100);
    }
  }
}

export function renderChronologicalTourStack(category = 'all', query = currentSearchQuery) {
  const feed = document.getElementById('gigListScrollFeed');
  if (!feed) return;

  const normalizedQuery = (query || '').toLowerCase().trim();

  // Flatten all shows across all venues with their parent venue references
  const allShowsList = [];
  VENUES.forEach(v => {
    (v.shows || []).forEach(s => {
      let sortTimestamp = 0;
      if (s.targetDate) {
        sortTimestamp = new Date(s.targetDate).getTime();
      } else if (s.dateText) {
        sortTimestamp = Date.parse(s.dateText.replace('Played ', '').replace('Sat, ', '').replace('Fri, ', '')) || 0;
      }
      allShowsList.push({
        venue: v,
        show: s,
        sortTimestamp,
        isUpcoming: s.type === 'upcoming',
        isNextShow: !!s.isNextShow
      });
    });
  });

  // Filter shows based on category
  let filtered = allShowsList.filter(item => {
    if (category === 'upcoming') return item.isUpcoming;
    if (category === 'past') return !item.isUpcoming;
    return true;
  });

  // Filter shows based on query
  if (normalizedQuery) {
    filtered = filtered.filter(item => {
      const v = item.venue;
      const s = item.show;
      const matchVenue = (v.name || '').toLowerCase().includes(normalizedQuery);
      const matchCity = (v.city || '').toLowerCase().includes(normalizedQuery);
      const matchAddress = (v.address || '').toLowerCase().includes(normalizedQuery);
      const matchDate = (s.dateText || '').toLowerCase().includes(normalizedQuery);
      const matchSupport = (s.supportActs || '').toLowerCase().includes(normalizedQuery);
      const matchSetlist = (s.asPlayedSetlist || []).some(t => (t.name || '').toLowerCase().includes(normalizedQuery));
      return matchVenue || matchCity || matchAddress || matchDate || matchSupport || matchSetlist;
    });
  }

  // Sort upcoming chronologically (closest date first), and past shows chronologically (most recent played first)
  const upcomingList = filtered.filter(item => item.isUpcoming).sort((a, b) => a.sortTimestamp - b.sortTimestamp);
  const pastList = filtered.filter(item => !item.isUpcoming).sort((a, b) => b.sortTimestamp - a.sortTimestamp);

  const displayList = category === 'past' 
    ? pastList 
    : (category === 'upcoming' ? upcomingList : [...upcomingList, ...pastList]);

  if (displayList.length === 0) {
    feed.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-card-muted); font-family: var(--font-secondary); font-size: 0.85rem; font-weight: 800;">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 1.8rem; margin-bottom: 12px; display: block; opacity: 0.4;"></i>
        <div>No gigs found matching "${query ? query.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'filter'}"</div>
        ${query ? `<button type="button" class="venue-action-pill-btn" id="listClearSearchAction" style="margin: 14px auto 0; display: inline-flex;">Clear Search</button>` : ''}
      </div>
    `;
    const clearBtn = document.getElementById('listClearSearchAction');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('gigListSearchInput');
        if (searchInput) searchInput.value = '';
        const searchClear = document.getElementById('gigListSearchClearBtn');
        if (searchClear) searchClear.classList.add('hidden');
        currentSearchQuery = '';
        renderChronologicalTourStack(activeFilter, '');
      });
    }
    return;
  }

  feed.innerHTML = displayList.map(({ venue, show, isUpcoming, isNextShow }) => {
    const isSellingFast = show.ticketStatus === 'selling_fast';
    const priceTag = show.ticketPriceLabel || show.ticketPrice || '$15 (EARLY BIRD)';
    const statusText = isNextShow 
      ? '🔥 NEXT GIG' 
      : (isUpcoming ? (show.urgencyBadgeText ? show.urgencyBadgeText.replace('🔥', '').trim() : 'UPCOMING') : 'PAST SHOW');
    const statusClass = isNextShow ? 'status-next' : (isUpcoming ? 'status-upcoming' : 'status-past');
    const avgSpend = getVenueAvgSpend(venue, show);

    const lineupSnippet = isUpcoming
      ? (show.supportActs ? `Lineup: KINS + ${show.supportActs}` : (show.setTimes ? show.setTimes.map(st => st.act).join(' • ') : 'KINS Live Set + Special Guests'))
      : (show.asPlayedSetlist ? `As Played: ${show.asPlayedSetlist.slice(0, 3).map(tr => tr.name).join(' • ')}` : 'Recorded Soundboard Master');

    return `
      <div class="tour-stack-card ${isNextShow ? 'is-next-show' : ''} ${isUpcoming ? 'is-upcoming' : 'is-past'}" data-venue-id="${venue.id}" data-gig-id="${show.id}">
        <!-- Top Row: Date Badge + Status Badge -->
        <div class="tour-stack-top-row">
          <span class="tour-stack-date-badge">
            <i class="fa-regular fa-calendar-days"></i>
            <span>${show.dateText}</span>
          </span>
          <span class="tour-stack-status-badge ${statusClass}">${statusText}</span>
        </div>

        <!-- Venue Name & City -->
        <div>
          <h3 class="tour-stack-venue-title">${venue.name}</h3>
          <div class="tour-stack-location-line">${venue.address || venue.city}</div>
        </div>

        <!-- Quick Info Chips -->
        <div class="tour-stack-chips-row">
          <span class="quick-chip"><i class="fa-regular fa-clock"></i> Doors ${show.doorsTime || '7:00 PM'}</span>
          <span class="quick-chip"><i class="fa-solid fa-id-card"></i> ${show.ageLimit || '18+'}</span>
          <span class="quick-chip"><i class="fa-solid fa-users"></i> ${show.capacity || '500'} Cap</span>
          <span class="quick-chip"><i class="fa-solid fa-receipt"></i> ~${avgSpend} pp</span>
        </div>

        <!-- Lineup Preview Snippet -->
        <div class="tour-stack-lineup-box">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><i class="fa-solid fa-guitar" style="margin-right: 5px; color: var(--accent-neon-yellow);"></i> ${lineupSnippet}</span>
          <button type="button" class="tour-stack-map-jump-btn venue-action-icon-btn" data-jump-venue-id="${venue.id}" data-jump-gig-id="${show.id}" title="Locate on Map" aria-label="Locate venue on map" style="width: 28px; height: 28px; font-size: 0.76rem;">
            <i class="fa-solid fa-map-pin"></i>
          </button>
        </div>

        <!-- Action Row: 1. Directions -> 2. Website -> 3. Menu -> 4. Calendar/Spotify -->
        <div class="venue-action-chips-row">
          <button type="button" class="venue-action-icon-btn list-directions-btn" data-venue-id="${venue.id}" aria-label="Directions to ${venue.name}" title="Directions / Navigation">
            <i class="fa-solid fa-diamond-turn-right"></i>
          </button>
          <a href="${getVenueWebsiteUrl(venue)}" target="_blank" rel="noopener noreferrer" class="venue-action-pill-btn" aria-label="Visit ${venue.name} website" title="Venue Official Website">
            <i class="fa-solid fa-globe"></i>
            <span>Website</span>
          </a>
          <a href="${getVenueMenuUrl(venue)}" target="_blank" rel="noopener noreferrer" class="venue-action-pill-btn" aria-label="View menu for ${venue.name}" title="Food & Drink Menu">
            <i class="fa-solid fa-utensils"></i>
            <span>Menu</span>
          </a>
          ${isUpcoming ? `
          <button type="button" class="venue-action-icon-btn list-calendar-btn" data-gig-id="${show.id}" aria-label="Add to calendar" title="Add to Calendar">
            <i class="fa-regular fa-calendar-plus"></i>
          </button>
          ` : `
          <a href="${show.spotifyPlaylistUrl || 'https://open.spotify.com'}" target="_blank" rel="noopener noreferrer" class="venue-action-icon-btn" aria-label="Play on Spotify" title="Spotify Playlist">
            <i class="fa-brands fa-spotify" style="color: #1db954 !important;"></i>
          </a>
          `}
        </div>

        <!-- Full Width CTA Button -->
        ${isUpcoming ? `
        <a href="${show.ticketUrl || 'https://www.bandsintown.com'}" target="_blank" rel="noopener noreferrer" class="tour-stack-primary-cta" aria-label="Get tickets for ${venue.name}">
          <i class="fa-solid fa-bolt"></i>
          <span>GET TICKETS — ${priceTag}</span>
        </a>
        ` : `
        <button type="button" class="tour-stack-primary-cta is-past-cta list-checkin-btn" data-gig-id="${show.id}" aria-label="Check in to show">
          <i class="fa-solid fa-ticket"></i>
          <span>${(show.attendanceCount || 340) + (show.hasUserCheckedIn ? 1 : 0)} FANS ATTENDED • ${show.hasUserCheckedIn ? 'CHECKED IN (✓)' : '"I WAS THERE"'}</span>
        </button>
        `}
      </div>
    `;
  }).join('');

  // Wire event handlers inside the list feed
  feed.querySelectorAll('.tour-stack-map-jump-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const vId = btn.getAttribute('data-jump-venue-id');
      const gId = btn.getAttribute('data-jump-gig-id');
      const pair = findVenueAndShow(gId || vId);
      setViewMode('map');
      if (pair.venue) {
        displayVenueDetails(pair.venue, pair.show);
        panToVenueOnMap(pair.venue, true);
      }
    });
  });

  feed.querySelectorAll('.list-directions-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const vId = btn.getAttribute('data-venue-id');
      const pair = findVenueAndShow(vId);
      if (pair.venue) openExternalMaps(pair.venue);
    });
  });

  feed.querySelectorAll('.list-calendar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gId = btn.getAttribute('data-gig-id');
      const pair = findVenueAndShow(gId);
      if (pair.show) {
        const choice = confirm(`Add "${pair.venue ? pair.venue.name : 'Kins'}" show to calendar?\n\nClick OK for Google Calendar\nClick Cancel to download .ics (Apple / Outlook)`);
        if (choice) {
          window.open(getGoogleCalendarUrl(pair.show), '_blank', 'noopener,noreferrer');
        } else {
          downloadIcsFile(pair.show);
        }
      }
    });
  });

  feed.querySelectorAll('.list-checkin-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const gId = btn.getAttribute('data-gig-id');
      const pair = findVenueAndShow(gId);
      if (!pair.show || btn.dataset.busy === 'true') return;
      btn.dataset.busy = 'true';

      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gigId: pair.show.id, deviceId: getDeviceId() })
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
          const badgeNote = Array.isArray(data.newBadges) && data.newBadges.length > 0
            ? ` Badge earned: ${data.newBadges.map((b) => b.label).join(', ')}!`
            : '';
          if (data.alreadyCheckedIn) {
            showToast(`Already in your passport — ${data.totalGigs} show${data.totalGigs === 1 ? '' : 's'} and counting.`);
          } else {
            showToast(`Checked in to ${pair.venue ? pair.venue.name : 'show'}! ${data.totalGigs} show${data.totalGigs === 1 ? '' : 's'} in your passport.${badgeNote}`);
          }
          renderChronologicalTourStack(category);
        } else {
          showToast((data && data.message) || 'Check-in failed right now — try again.');
        }
      } catch (_) {
        showToast('Network issue — check-in not saved. Try again.');
      } finally {
        delete btn.dataset.busy;
      }
    });
  });
}

export function fitAllTourBounds() {
  if (!leafletMapInstance) return;
  const group = new window.L.featureGroup(Array.from(markerMap.values()));
  leafletMapInstance.fitBounds(group.getBounds(), {
    padding: window.innerWidth >= 768 ? [80, 80] : [40, 40],
    maxZoom: 13,
    duration: 0.8
  });
  showToast("Viewing all Kins tour stops across NSW");
}



export function initGigMapModule() {
  const floatingGigPillBtn = document.getElementById('floatingGigPillBtn');
  const gigMapModal = document.getElementById('gigMapModal');
  const closeGigMapSheet = document.getElementById('closeGigMapSheet');
  const gigPillTag = document.getElementById('gigPillTag');
  const gigPillLocation = document.getElementById('gigPillLocation');
  const gigPillTitle = document.getElementById('gigPillTitle');
  const fitBoundsBtn = document.getElementById('mapFitBoundsBtn');
  const locateMeBtn = document.getElementById('mapLocateMeBtn');
  const toggleMapDetailsBtn = document.getElementById('toggleMapDetailsBtn');
  const venueDetailCard = document.getElementById('venueDetailBottomCard');
  const lightboxCloseBtn = document.getElementById('gigLightboxClose');
  const lightboxBackdrop = document.getElementById('gigPhotoLightbox');

  const nextGig = LOCAL_GIGS.find(g => g.isNextShow) || LOCAL_GIGS[0];

  function updateFloatingPill() {
    if (nextGig) {
      if (gigPillTag) gigPillTag.textContent = "NEXT SHOW";
      if (gigPillTitle) gigPillTitle.textContent = "TOUR MAP";
      if (gigPillLocation) gigPillLocation.textContent = `${nextGig.venue.replace('The ', '')} • ${nextGig.city.split(',')[0]}`;
    } else {
      if (gigPillTag) gigPillTag.textContent = "TOUR";
      if (gigPillTitle) gigPillTitle.textContent = "GIG MAP";
      if (gigPillLocation) gigPillLocation.textContent = "Newcastle & Sydney";
    }
  }
  updateFloatingPill();

  // Setup View Switchers (Map View ⇄ List View) across both header bars
  document.querySelectorAll('.view-switch-map-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setViewMode('map');
    });
  });

  document.querySelectorAll('.view-switch-list-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setViewMode('list');
    });
  });

  // Setup List Live Search Input
  const listSearchInput = document.getElementById('gigListSearchInput');
  const listSearchClearBtn = document.getElementById('gigListSearchClearBtn');
  // Debounced: the tour stack rebuilds a large DOM subtree per render — never do that per keystroke
  let gigSearchDebounceId = null;

  if (listSearchInput) {
    listSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      if (listSearchClearBtn) {
        listSearchClearBtn.classList.toggle('hidden', !currentSearchQuery);
      }
      clearTimeout(gigSearchDebounceId);
      gigSearchDebounceId = setTimeout(() => {
        renderChronologicalTourStack(activeFilter, currentSearchQuery);
      }, 150);
    });
  }

  if (listSearchClearBtn) {
    listSearchClearBtn.addEventListener('click', (e) => {
      if (listSearchInput) {
        listSearchInput.value = '';
        listSearchInput.focus();
      }
      listSearchClearBtn.classList.add('hidden');
      currentSearchQuery = '';
      renderChronologicalTourStack(activeFilter, '');
    });
  }

  // Setup Close Sheet buttons across both Map and List views
  document.querySelectorAll('.list-close-sheet-btn, #closeGigMapSheet').forEach(btn => {
    btn.addEventListener('click', () => {
      if (gigMapModal) {
        gigMapModal.classList.remove('active');
        unlockScroll();
      }
    });
  });

  // Setup Horizontal Expanding Filter Toolbar
  const filterToolbar = document.getElementById('expandingFilterToolbar');
  const filterToggleBtn = document.getElementById('gigFilterToggleBtn');

  if (filterToggleBtn && filterToolbar) {
    filterToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterToolbar.classList.toggle('is-expanded');
    });

    // Collapse when tapping outside
    document.addEventListener('click', (e) => {
      if (filterToolbar && !filterToolbar.contains(e.target)) {
        filterToolbar.classList.remove('is-expanded');
      }
    });
  }

  // Setup Filter Tabs (All, Upcoming, Past) across both Map and List views
  document.querySelectorAll('.gig-filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      const filter = tab.getAttribute('data-filter');
      filterGigs(filter || 'all');
      if (filterToolbar) {
        filterToolbar.classList.remove('is-expanded');
      }
    });
  });

  // Initialize selector pills row with default 'all'
  filterGigs('all');

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
        attributionControl: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelDebounceTime: 60,
        tap: !window.L.Browser.mobile,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([-33.4, 151.4], 9);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(leafletMapInstance);

      // NSW Region Polygon (Newcastle to Sydney Catchment)
      regionPolygonInstance = window.L.polygon(COASTAL_LAND_POLYGON, {
        color: 'rgba(255, 255, 255, 0.25)',
        fillColor: '#f2f0eb',
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(leafletMapInstance);

      regionPolygonInstance.bindTooltip("📍 Kins NSW Tour Corridor: Newcastle & Sydney", {
        permanent: false,
        direction: "top"
      });

      // Tour Route Polyline connecting the tour stops
      tourPolylineInstance = window.L.polyline(TOUR_CORRIDOR_PATH, {
        color: '#f2f0eb',
        weight: 2.5,
        opacity: 0.85,
        smoothFactor: 1.5,
        className: 'tour-route-line'
      }).addTo(leafletMapInstance);

      tourPolylineInstance.bindTooltip("🚗 NSW Tour Highway: Newcastle ⇄ Central Coast ⇄ Sydney", {
        permanent: false,
        direction: "center"
      });

      markerMap.clear();

      VENUES.forEach(venue => {
        const hasNext = venue.shows.some(s => s.isNextShow);
        const hasUpcoming = venue.shows.some(s => s.type === 'upcoming');
        const showCount = venue.shows.length;
        const iconSize = hasNext ? [30, 30] : [26, 26];
        const iconAnchor = hasNext ? [15, 15] : [13, 13];
        const popupAnchor = hasNext ? [0, -16] : [0, -15];
        
        const countBadgeHtml = showCount > 1 
          ? `<span class="multi-show-counter-badge" title="${showCount} shows at this venue">${showCount}</span>` 
          : '';

        const pinIcon = window.L.divIcon({
          className: 'custom-map-pin-div',
          html: `
            <div class="custom-map-pin-wrap ${hasNext ? 'is-next-gig' : ''} ${hasUpcoming ? 'is-upcoming' : 'is-past'} ${venue.id === activeVenueId ? 'is-selected-marker' : ''}" title="${venue.name} (${showCount} show${showCount > 1 ? 's' : ''})">
              ${hasNext ? `
                <div class="next-show-top-stack">
                  <span class="next-show-pill-text">NEXT</span>
                </div>
              ` : ''}
              <div class="pin-bubble">
                <i class="fa-solid ${hasNext ? 'fa-fire' : (hasUpcoming ? 'fa-ticket' : 'fa-compact-disc')}"></i>
                ${countBadgeHtml}
              </div>
            </div>
          `,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor
        });

        const marker = window.L.marker([venue.lat, venue.lng], { 
          icon: pinIcon,
          riseOnHover: true,
          zIndexOffset: venue.id === activeVenueId ? 1000 : (hasNext ? 500 : 100)
        }).addTo(leafletMapInstance);

        // Marker click directly syncs the bottom sheet (no floating popup overlay)
        marker.on('click', () => {
          displayVenueDetails(venue);
          setSnapState('peek', { animate: true, autoPanMap: true });
        });

        markerMap.set(venue.id, marker);
      });

      const initialPair = findVenueAndShow(activeGigId || activeVenueId);
      displayVenueDetails(initialPair.venue, initialPair.show);
    } else {
      const currentPair = findVenueAndShow(activeGigId || activeVenueId);
      displayVenueDetails(currentPair.venue, currentPair.show);
    }

    setTimeout(() => {
      if (leafletMapInstance) {
        leafletMapInstance.invalidateSize();
      }
    }, 300);
  }

  // ==========================================================================
  // 2-TIER GPU-ACCELERATED BOTTOM SHEET GESTURE ENGINE (Peek vs Expanded)
  // ==========================================================================
  const venueCardHeader = document.getElementById('venueCardHeader');
  const desktopSnapToggleBtn = document.getElementById('desktopSnapToggleBtn');
  // Declared explicitly — previously resolved via implicit window named-access (fragile)
  const sheetDragHandle = document.getElementById('sheetDragHandle');

  let isDraggingSheet = false;
  let dragStartY = 0;
  let dragStartTranslateY = 0;
  let currentDragTranslateY = 0;
  let dragStartTime = 0;
  let lastTouchY = 0;
  let lastTouchTime = 0;
  let dragInitiatedFromContent = false;
  let dragRafId = null;

  // --- MOBILE TOUCH GESTURE ENGINE (TouchStart / TouchMove / TouchEnd with GPU translate3d) ---
  if (venueDetailCard) {
    // 1. Touch Start
    venueDetailCard.addEventListener('touchstart', (e) => {
      if (window.innerWidth >= 768) return; // Desktop handles clicks/keys
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      dragStartY = touch.clientY;
      lastTouchY = touch.clientY;
      dragStartTime = performance.now();
      lastTouchTime = dragStartTime;

      const snapHeights = getSnapHeights();
      dragStartTranslateY = (currentSnapState === 'peek') ? snapHeights.maxTranslateY : 0;
      currentDragTranslateY = dragStartTranslateY;
      dragInitiatedFromContent = false;

      // Check touch origination - allow interactive elements to receive taps cleanly
      const target = e.target;
      const isInteractive = target.closest('button') || 
                            target.closest('a') || 
                            target.closest('input') ||
                            target.closest('.gig-bottom-sheet-attached-header') ||
                            target.closest('.expanding-filter-toolbar') ||
                            target.closest('.gig-selector-pills-row') ||
                            target.closest('.swipe-up-hint-box') || 
                            target.closest('.sheet-nav-btn') || 
                            target.closest('.copy-address-btn') || 
                            target.closest('.setlist-preview-row') || 
                            target.closest('.as-played-item') || 
                            target.closest('.venue-history-card-row') || 
                            target.closest('.recap-photo-card') ||
                            target.closest('.official-photo-card') ||
                            target.closest('.venue-checkin-btn') ||
                            target.closest('.venue-booking-btn');

      if (isInteractive) {
        isDraggingSheet = false;
        dragInitiatedFromContent = false;
        return;
      }

      const isHeaderOrHandle = target.closest('#sheetDragHandle') || target.closest('#venueCardHeader');
      
      if (isHeaderOrHandle) {
        isDraggingSheet = true;
        venueDetailCard.classList.add('is-dragging');
      } else {
        // Content area touch - only engage if at top of scroll
        isDraggingSheet = false;
        if (venueDetailCard.scrollTop <= 2) {
          dragInitiatedFromContent = true;
        }
      }
    }, { passive: true });

    // 2. Touch Move (Batched via requestAnimationFrame)
    venueDetailCard.addEventListener('touchmove', (e) => {
      if (window.innerWidth >= 768) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const currentY = touch.clientY;
      const deltaY = currentY - dragStartY; // Positive = pulling DOWN, Negative = pulling UP
      const now = performance.now();

      lastTouchY = currentY;
      lastTouchTime = now;

      // Check if pulling down from top of scrollable content in Expanded state
      if (!isDraggingSheet && dragInitiatedFromContent) {
        if (venueDetailCard.scrollTop <= 0 && deltaY > 10) {
          // Hand-off: switch to dragging the sheet down
          isDraggingSheet = true;
          venueDetailCard.classList.add('is-dragging');
          dragStartY = currentY; // Reset anchor to avoid jump
          dragStartTranslateY = 0; // Top position
        }
      }

      if (isDraggingSheet) {
        // Prevent background viewport bounce/scroll
        if (e.cancelable) e.preventDefault();

        const snapHeights = getSnapHeights();
        let targetY = dragStartTranslateY + deltaY;

        // Apply logarithmic rubber-band resistance beyond limits
        if (targetY < 0) {
          // Dragging UP past expanded top (resistance)
          targetY = -Math.pow(Math.abs(targetY), 0.72);
        } else if (targetY > snapHeights.maxTranslateY) {
          // Dragging DOWN past peek bottom (resistance)
          const over = targetY - snapHeights.maxTranslateY;
          targetY = snapHeights.maxTranslateY + Math.pow(over, 0.72);
        }

        currentDragTranslateY = targetY;

        // GPU translate3d throttled strictly to display refresh rate
        if (!dragRafId) {
          dragRafId = requestAnimationFrame(() => {
            venueDetailCard.style.transform = `translate3d(0, ${Math.round(currentDragTranslateY)}px, 0)`;
            dragRafId = null;
          });
        }
      }
    }, { passive: false });

    // 3. Touch End / Cancel
    const handleTouchEnd = (e) => {
      if (dragRafId) {
        cancelAnimationFrame(dragRafId);
        dragRafId = null;
      }

      if (!isDraggingSheet) return;
      isDraggingSheet = false;
      venueDetailCard.classList.remove('is-dragging');

      const endTime = performance.now();
      const timeDiff = Math.max(1, endTime - dragStartTime);
      const velocity = (lastTouchY - dragStartY) / timeDiff; // px/ms (Positive = DOWN, Negative = UP)
      const snapHeights = getSnapHeights();

      // Velocity-based dynamic snapping
      if (velocity < -0.3) {
        // Flick UP -> Expand to Tier 2
        setSnapState('expanded');
        return;
      } else if (velocity > 0.3) {
        // Flick DOWN -> Collapse to Tier 1
        setSnapState('peek');
        return;
      }

      // Distance / Threshold snapping based on release translation
      const midThreshold = snapHeights.maxTranslateY / 2;

      if (currentDragTranslateY > midThreshold) {
        setSnapState('peek');
      } else {
        setSnapState('expanded');
      }
    };

    venueDetailCard.addEventListener('touchend', handleTouchEnd, { passive: true });
    venueDetailCard.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Tap on drag handle toggles between Tier 1 and Tier 2
    if (sheetDragHandle) {
      sheetDragHandle.addEventListener('click', (e) => {
        // Only trigger click if not dragged significantly
        if (Math.abs(dragStartY - lastTouchY) < 6) {
          cycleSheetState();
        }
      });
    }

    // Header click in Tier 1 state expands to Tier 2
    if (venueCardHeader) {
      venueCardHeader.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input')) return; // Ignore interactive clicks
        if (currentSnapState === 'peek') {
          setSnapState('expanded');
        }
      });
    }

    // Close button on State 2 / Full
    const sheetCloseFullBtn = document.getElementById('sheetCloseFullBtn');
    if (sheetCloseFullBtn) {
      sheetCloseFullBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSnapState('peek');
      });
    }

    // Desktop toggle button (toggles between Tier 1 & Tier 2)
    if (desktopSnapToggleBtn) {
      desktopSnapToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleSheetState();
      });
    }
  }

  // --- KEYBOARD ACCESSIBILITY CONTROLS ---
  window.addEventListener('keydown', (e) => {
    if (!gigMapModal || !gigMapModal.classList.contains('active')) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepUpSheetState();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepDownSheetState();
    } else if (e.key === 'Escape') {
      if (lightboxBackdrop && lightboxBackdrop.classList.contains('active')) {
        closePhotoLightbox();
        return;
      }
      if (currentSnapState === 'expanded') {
        e.preventDefault();
        setSnapState('peek');
      } else {
        gigMapModal.classList.remove('active');
        unlockScroll();
      }
    }
  });

  // Global Open Helper (Disabled with coming soon toast until live tour dates drop)
  window.openGigMap = function() {
    showToast("Live tour dates and gig map coming soon! Stay tuned.");
  };

  if (floatingGigPillBtn) {
    floatingGigPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast("Live tour dates and gig map coming soon! Stay tuned.");
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

  // Custom Map Controls Handlers
  if (fitBoundsBtn) {
    fitBoundsBtn.addEventListener('click', () => {
      fitAllTourBounds();
    });
  }

  if (locateMeBtn) {
    locateMeBtn.addEventListener('click', () => {
      locateUserAndSort(true);
    });
  }

  // Toggle map canvas mode (collapse/expand details)
  if (toggleMapDetailsBtn && venueDetailCard) {
    let isCollapsed = false;
    toggleMapDetailsBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        setSnapState('peek');
        toggleMapDetailsBtn.innerHTML = `<i class="fa-solid fa-sheet-plastic"></i>`;
        toggleMapDetailsBtn.title = "Show Venue Details";
        showToast("Map Canvas Maximized");
      } else {
        setSnapState('expanded');
        toggleMapDetailsBtn.innerHTML = `<i class="fa-solid fa-map"></i>`;
        toggleMapDetailsBtn.title = "Full Map Canvas";
      }
    });
  }

  // Photo Lightbox Close
  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closePhotoLightbox);
  }
  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener('click', (e) => {
      if (e.target === lightboxBackdrop) closePhotoLightbox();
    });
  }

  // Delegated click handler for popup action buttons, route triggers, and back to top/map buttons
  document.addEventListener('click', (e) => {
    const backToTopBtn = e.target.closest('.sheet-back-to-top-btn') || e.target.closest('#scrollTopBtn');
    if (backToTopBtn) {
      e.preventDefault();
      const card = document.getElementById('venueDetailBottomCard');
      if (card) {
        card.scrollTo({ top: 0, behavior: 'smooth' });
        card.scrollTop = 0;
      }
      return;
    }

    const backToMapBtn = e.target.closest('.sheet-back-to-map-btn') || e.target.closest('#bottomCollapseSheetBtn');
    if (backToMapBtn) {
      e.preventDefault();
      setSnapState('peek', { animate: true, autoPanMap: true });
      return;
    }

    const swipeTrigger = e.target.closest('#upcomingSwipeUpTrigger') || e.target.closest('#archiveSwipeUpTrigger');
    if (swipeTrigger) {
      e.preventDefault();
      setSnapState('expanded');
      return;
    }

    const routeBtn = e.target.closest('.map-popup-route-btn');
    if (routeBtn) {
      const venueId = routeBtn.getAttribute('data-route-venue-id') || routeBtn.getAttribute('data-route-gig-id');
      const pair = findVenueAndShow(venueId);
      if (pair.venue) {
        calculateAndRenderRoute(pair.venue);
      }
      return;
    }

    const popupBtn = e.target.closest('.map-popup-action-btn');
    if (popupBtn) {
      const venueId = popupBtn.getAttribute('data-popup-venue-id') || popupBtn.getAttribute('data-popup-gig-id');
      const showId = popupBtn.getAttribute('data-popup-gig-id');
      const pair = findVenueAndShow(showId || venueId);
      if (pair.venue) {
        displayVenueDetails(pair.venue, pair.show);
        setSnapState('peek');
      }
    }
  });

  // Check URL parameters or hash on load
  const urlParams = new URLSearchParams(window.location.search);
  const requestedGig = urlParams.get('gig') || urlParams.get('venue');
  if (requestedGig || window.location.hash === '#gig-map' || window.location.hash === '#gigs') {
    setTimeout(() => {
      window.openGigMap(requestedGig || undefined, 'peek');
    }, 400);
  }

  // Handle clicks on any #gigs or #gig-map anchor links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#gigs"], a[href="#gig-map"]');
    if (link) {
      e.preventDefault();
      window.openGigMap(undefined, 'peek');
    }
  });
}

