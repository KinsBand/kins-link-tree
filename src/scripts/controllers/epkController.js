/**
 * EPK Controller - Interactive features for KINS Electronic Press Kit
 * Manages Member scroll controls, 1-Click Bio copy, Mobile Drawer navigation, Email copy, and zero-friction asset downloads.
 */

import { showToast } from './toast.js';
import { toggleTheme, getCurrentTheme, THEME_STORAGE_KEY } from './themeController.js';

export function initEpkController() {
  initEpkMembersScroll();
  initEpkBioCopy();
  initEpkMobileDrawer();
  initEpkDownloads();
  initEpkJumpLinks();
  initEpkEmailCopy();
}

/**
 * 1. Band Members Horizontal Scroll Controller with Active Highlight
 */
function initEpkMembersScroll() {
  const container = document.getElementById('epkMembersScrollContainer');
  const prevBtn = document.getElementById('epkMembersScrollPrev');
  const nextBtn = document.getElementById('epkMembersScrollNext');
  const cards = document.querySelectorAll('.epk-member-card');

  if (!container) return;

  let scrollSettleTimeout = null;

  function updateArrowsState() {
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const isOverflowing = maxScroll > 4;
    const controlsGroup = prevBtn?.parentElement;
    if (controlsGroup) {
      controlsGroup.style.display = isOverflowing ? 'flex' : 'none';
    }

    const atStart = container.scrollLeft <= 5;
    const atEnd = container.scrollLeft >= maxScroll - 5;

    if (prevBtn) {
      prevBtn.style.opacity = atStart ? '0.35' : '1';
      prevBtn.style.pointerEvents = atStart ? 'none' : 'auto';
      prevBtn.disabled = atStart;
      prevBtn.classList.toggle('is-disabled', atStart);
      prevBtn.setAttribute('aria-disabled', String(atStart));
    }
    if (nextBtn) {
      nextBtn.style.opacity = atEnd ? '0.35' : '1';
      nextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
      nextBtn.disabled = atEnd;
      nextBtn.classList.toggle('is-disabled', atEnd);
      nextBtn.setAttribute('aria-disabled', String(atEnd));
    }
  }

  function updateActiveCardHighlight() {
    if (!cards.length) return;
    const containerCenter = container.getBoundingClientRect().left + container.clientWidth / 2;
    let closestCard = null;
    let closestDist = Infinity;

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const dist = Math.abs(containerCenter - cardCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestCard = card;
      }
    });

    cards.forEach(card => {
      if (card === closestCard) {
        card.classList.add('is-scroll-active');
      } else {
        card.classList.remove('is-scroll-active');
      }
    });

    if (scrollSettleTimeout) clearTimeout(scrollSettleTimeout);
    scrollSettleTimeout = setTimeout(() => {
      cards.forEach(card => card.classList.remove('is-scroll-active'));
      const controlsGroup = prevBtn?.parentElement;
      if (controlsGroup) {
        controlsGroup.classList.remove('is-scrolling');
      }
    }, 800);
  }

  updateArrowsState();

  // rAF-coalesced so scroll/resize never interleave rect reads with class writes (layout thrash)
  let epkScrollRafId = null;
  function scheduleEpkUpdate() {
    const controlsGroup = prevBtn?.parentElement;
    if (controlsGroup) {
      controlsGroup.classList.add('is-scrolling');
    }
    if (epkScrollRafId !== null) return;
    epkScrollRafId = requestAnimationFrame(() => {
      epkScrollRafId = null;
      updateArrowsState();
      updateActiveCardHighlight();
    });
  }

  container.addEventListener('scroll', scheduleEpkUpdate, { passive: true });

  window.addEventListener('resize', scheduleEpkUpdate, { passive: true });

  prevBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const controlsGroup = prevBtn?.parentElement;
    if (controlsGroup) controlsGroup.classList.add('is-scrolling');
    container.scrollBy({ left: -260, behavior: 'smooth' });
  });

  nextBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const controlsGroup = nextBtn?.parentElement;
    if (controlsGroup) controlsGroup.classList.add('is-scrolling');
    container.scrollBy({ left: 260, behavior: 'smooth' });
  });

  container.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      container.scrollLeft += e.deltaX;
    }
  }, { passive: true });
}

/**
 * 2. 1-Click Band Bio Copy to Clipboard
 */
function initEpkBioCopy() {
  const copyBtns = document.querySelectorAll('.epk-copy-bio-btn, #epkCopyBioBtn');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy-text');
      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast('Band biography copied to clipboard!', 'success');
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Band biography copied to clipboard!', 'success');
      }
    });
  });
}

/**
 * 3. 1-Click Email Copy to Clipboard
 */
function initEpkEmailCopy() {
  const emailBtns = document.querySelectorAll('.epk-email-copy-btn');
  emailBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = btn.getAttribute('data-email') || 'booking@kinsband.com';
      try {
        await navigator.clipboard.writeText(email);
        showToast(`Copied ${email} to clipboard!`, 'success');
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`Copied ${email} to clipboard!`, 'success');
      }
    });
  });
}

/**
 * 4. Mobile Drawer Navigation & Backdrop Controller
 */
function initEpkMobileDrawer() {
  const hamburgerBtn = document.getElementById('epkHamburgerBtn');
  const closeDrawerBtn = document.getElementById('epkCloseDrawerBtn');
  const drawer = document.getElementById('epkMobileDrawer');
  const backdrop = document.getElementById('epkDrawerBackdrop');
  const drawerLinks = document.querySelectorAll('.epk-drawer-link');
  const drawerThemeBtn = document.getElementById('drawerThemeToggleBtn');
  const drawerThemeIcon = document.getElementById('drawerThemeToggleIcon');
  const drawerThemeLabel = document.getElementById('drawerThemeToggleLabel');

  function openDrawer() {
    drawer?.classList.add('is-open');
    backdrop?.classList.add('is-open');
    drawer?.setAttribute('aria-hidden', 'false');
    hamburgerBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer?.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
    hamburgerBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburgerBtn?.addEventListener('click', openDrawer);
  closeDrawerBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  function updateDrawerThemeUI() {
    const isDark = getCurrentTheme() === 'dark';
    if (drawerThemeIcon) {
      drawerThemeIcon.className = `theme-toggle-icon fa-solid ${isDark ? 'fa-moon' : 'fa-sun'}`;
    }
    if (drawerThemeLabel) {
      drawerThemeLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }
  }

  updateDrawerThemeUI();

  if (drawerThemeBtn) {
    drawerThemeBtn.addEventListener('click', () => {
      toggleTheme();
      updateDrawerThemeUI();
    });
  }

  window.addEventListener('kins:theme-change', updateDrawerThemeUI);
}

/**
 * 5. Zero-Friction Download Deck Asset Triggers
 */
function initEpkDownloads() {
  const downloadBtns = document.querySelectorAll('.epk-deck-download-btn, #epkMasterDownloadBtn, .epk-quick-download-cta');

  downloadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filename = btn.getAttribute('data-filename') || 'KINS_Press_Asset.pdf';
      const assetTitle = btn.getAttribute('data-asset-title') || 'EPK Asset';

      const simulatedContent = `========================================================================
KINS (@KinsBandOfficial) - OFFICIAL PRODUCTION & PROMOTIONAL ASSET
Asset: ${assetTitle}
Generated: ${new Date().toUTCString()}
========================================================================

1. BAND IDENTITY & ORIGIN:
- Artist: KINS (@KinsBandOfficial)
- Genre: Post-Punk / Alternative Rock
- Origin: Newcastle, NSW, Australia (East Coast Hub • 2h North of Sydney)
- Sounds Like (RIYL): Fontaines D.C., IDLES, The Murder Capital, The Cure, Gang of Youths

2. BAND ROSTER & STAGE ROLES:
- Vivian: Lead Vocals & Rhythm Electric Guitar (Vocal Mic SM58/Beta58, Amp Head/Combo, Pedalboard)
- Charlie: Lead Electric Guitar & Backing Vocals (Guitar Head/Cab, Pedalboard, Backing Mic)
- Oscar: Bass Guitar & Synthesizers (Active DI, Bass Preamp/Cab, Synth Line)
- Trai: Drums & Percussion (Snare, Cymbals, Kick Pedal)

3. BACKLINE SPECIFICATIONS:
BAND PROVIDES:
- Drum breakables (snare drum, cymbals, kick pedal)
- Guitar amplifier heads/combos and pedalboards
- Wireless IEM monitoring transmitter system
- Instrument, patch, and power leads

VENUE / PROMOTER MUST PROVIDE:
- 5-Piece Drum Shell Pack (Kick, 2x Rack Toms, Floor Tom, Snare Stand, Hi-Hat Stand, 3x Cymbal Boom Stands, Throne)
- Professional Bass Cabinet (4x10 or 8x10 enclosure)
- 3x Vocal Microphones (Shure SM58 / Beta 58A) with tall boom stands
- 3x Active DI Boxes (Bass, Synth, Aux)
- FOH Professional PA System & 4 Independent Monitor Mixes

4. LIVE REPERTOIRE & SET OPTIONS:
- 30-Min Support Set: Fast, high-energy set designed for opening / multi-band slots.
- 45-Min Feature Set: Dynamic mix of high-voltage originals and select post-punk covers.
- 60-Min Headline Set: Full-throttle live show with extended instrumental builds.

5. DIRECT OFFICIAL CONTACTS:
- Booking & Live Routing: booking@kinsband.com
- General & Inquiries: hello@kinsband.com
- Official Website: https://kinsband.com

(Authorized for venue production, festival advance sheets, and press media usage.)`;
      
      const blob = new Blob([simulatedContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(url);

      showToast(`Downloading: ${filename}`, 'success');
    });
  });
}

/**
 * 6. Smooth Jump Links for Navigation
 */
function initEpkJumpLinks() {
  const jumpLinks = document.querySelectorAll('a[href^="#epk-"]');
  jumpLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const offsetTop = targetEl.getBoundingClientRect().top + window.scrollY - 65;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}
