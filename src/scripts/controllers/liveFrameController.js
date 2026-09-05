/**
 * Live Viewport Frame & Sticky Top Tab Controller
 * Manages intersection observation of the live hero card, viewport perimeter glow,
 * and seamless top-tab reveal when scrolling.
 */

let observer = null;
let scrollTargets = [];
let scrollHandler = null;

export function initLiveFrameController() {
  teardownLiveFrameController();

  const frame = document.getElementById('liveViewportFrame');
  if (!frame) return;

  const heroCard = document.getElementById('heroFeatureCard') || document.getElementById('heroFeatureCardWrapper');

  // If there's no hero card on this page (e.g. inner pages), activate immediately
  if (!heroCard) {
    frame.classList.add('is-scrolled-past');
    return;
  }

  function checkHeroVisibility() {
    if (!heroCard || !frame) return;
    const rect = heroCard.getBoundingClientRect();
    
    // If the bottom of the hero card is above the top bar (scrolled past),
    // or if the card is completely hidden / not visible in viewport
    if (rect.bottom <= 70 || rect.top >= window.innerHeight) {
      frame.classList.add('is-scrolled-past');
    } else {
      frame.classList.remove('is-scrolled-past');
    }
  }

  // 1. Setup IntersectionObserver for native 60fps compositor detection
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          // If it leaves viewport, check if it scrolled up past
          const rect = entry.boundingClientRect;
          if (rect.bottom <= 120) {
            frame.classList.add('is-scrolled-past');
          }
        } else {
          // In view near top of screen
          const rect = entry.boundingClientRect;
          if (rect.top >= -40 && rect.bottom > 80) {
            frame.classList.remove('is-scrolled-past');
          }
        }
      });
    }, {
      root: null,
      threshold: [0, 0.25, 0.75, 1.0],
      rootMargin: '-64px 0px 0px 0px'
    });

    observer.observe(heroCard);
  }

  // 2. Setup scroll listeners for both window and desktop left-sidebar container
  let ticking = false;
  scrollHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        checkHeroVisibility();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('resize', scrollHandler, { passive: true });
  scrollTargets.push(window);

  const leftSidebar = document.getElementById('leftSidebar');
  if (leftSidebar) {
    leftSidebar.addEventListener('scroll', scrollHandler, { passive: true });
    scrollTargets.push(leftSidebar);
  }

  // Run initial check
  checkHeroVisibility();
}

export function teardownLiveFrameController() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (scrollHandler) {
    scrollTargets.forEach((target) => {
      try { target.removeEventListener('scroll', scrollHandler); } catch (e) {}
    });
    window.removeEventListener('resize', scrollHandler);
    scrollTargets = [];
    scrollHandler = null;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initLiveFrameController);
  document.addEventListener('astro:before-swap', teardownLiveFrameController);
}
