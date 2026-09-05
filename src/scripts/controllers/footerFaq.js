/**
 * Footer FAQ Accordion Controller
 * Handles expansion, smooth scrolling, keyboard accessibility (Escape to close),
 * and lifecycle teardown on Astro page transitions.
 */

let toggleBtn = null;
let tray = null;
let card = null;
let closeBtn = null;
let chevron = null;
let isClosing = false;
let closeTimer = null;

function handleToggle() {
  if (!toggleBtn || !tray) return;
  const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
  if (isExpanded) {
    closeFaq();
  } else {
    openFaq();
  }
}

function openFaq() {
  if (!toggleBtn || !tray) return;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  tray.classList.remove('hidden');
  // Trigger reflow so opening transition starts from 0fr
  void tray.offsetHeight;
  tray.classList.add('is-open');
  toggleBtn.setAttribute('aria-expanded', 'true');
  toggleBtn.setAttribute('title', 'Close Frequently Asked Questions');
  if (card) card.classList.add('is-open');
  if (chevron) {
    chevron.style.transform = 'rotate(180deg)';
  }
  // Smoothly align scroll so tray is visible
  setTimeout(() => {
    tray.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function closeFaq() {
  if (!toggleBtn || !tray || tray.classList.contains('hidden')) return;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  tray.classList.remove('is-open');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('title', 'Explore Frequently Asked Questions about KINS');
  if (card) card.classList.remove('is-open');
  if (chevron) {
    chevron.style.transform = 'rotate(0deg)';
  }

  const onEnd = (e) => {
    if (e && e.propertyName && e.propertyName !== 'grid-template-rows') return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    tray.removeEventListener('transitionend', onEnd);
    if (!tray.classList.contains('is-open')) {
      tray.classList.add('hidden');
    }
  };

  tray.addEventListener('transitionend', onEnd);
  // Safety timeout in case transitionend does not fire
  closeTimer = setTimeout(() => onEnd(), 320);
}

function handleKeydown(e) {
  if (e.key === 'Escape' && toggleBtn && toggleBtn.getAttribute('aria-expanded') === 'true') {
    closeFaq();
    toggleBtn.focus();
  }
}

export function initFooterFaq() {
  teardownFooterFaq();

  toggleBtn = document.getElementById('footerFaqToggleBtn');
  tray = document.getElementById('footerFaqTray');
  card = document.getElementById('footerFaqCard');
  closeBtn = document.getElementById('closeFooterFaqBtn');
  chevron = document.getElementById('footerFaqChevron');

  if (!toggleBtn || !tray) return;

  toggleBtn.addEventListener('click', handleToggle);
  if (closeBtn) {
    closeBtn.addEventListener('click', closeFaq);
  }
  document.addEventListener('keydown', handleKeydown);
}

export function teardownFooterFaq() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  isClosing = false;
  if (toggleBtn) {
    toggleBtn.removeEventListener('click', handleToggle);
    toggleBtn = null;
  }
  if (closeBtn) {
    closeBtn.removeEventListener('click', closeFaq);
    closeBtn = null;
  }
  document.removeEventListener('keydown', handleKeydown);
  tray = null;
  card = null;
  chevron = null;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterFaq);
  } else {
    initFooterFaq();
  }
  document.addEventListener('astro:page-load', initFooterFaq);
  document.addEventListener('astro:before-swap', teardownFooterFaq);
}
