/**
 * Live Floating Reactions Particle Engine
 * Spawns physics-based floating emojis (🔥, ⚡, 🎸, 💀) across the live screen.
 * Compositor-only animation (transform+opacity), capped concurrency,
 * skipped entirely for reduced-motion users and low-power devices.
 */

const MAX_CONCURRENT_PARTICLES = 24;
const SPAWN_INTERVAL_MS = 4000;

let spontaneousIntervalId = null;

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isLowPowerMode() {
  return document.documentElement.classList.contains('low-power-mode');
}

export function initLiveReactionsController() {
  // Never stack duplicate intervals on re-init
  destroyLiveReactionsController();

  if (prefersReducedMotion() || isLowPowerMode()) return;

  const reactionButtons = document.querySelectorAll('.live-reaction-btn');
  const container = document.getElementById('liveReactionsOverlay') || createReactionsOverlay();

  function createReactionsOverlay() {
    let overlay = document.getElementById('liveReactionsOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'liveReactionsOverlay';
      overlay.className = 'live-reactions-floating-overlay';
      const stageContainer = document.getElementById('liveTheaterStageContainer') || document.body;
      stageContainer.appendChild(overlay);
    }
    return overlay;
  }

  function spawnReaction(emoji, startX = null, count = 1) {
    if (!container) return;

    for (let i = 0; i < count; i++) {
      // Concurrency cap keeps the DOM bounded during spam taps / big crowds
      if (container.childElementCount >= MAX_CONCURRENT_PARTICLES) return;

      const particle = document.createElement('div');
      particle.className = 'floating-reaction-particle';
      particle.textContent = emoji;
      particle.setAttribute('aria-hidden', 'true');

      // Calculate initial X position
      const viewportWidth = window.innerWidth;
      const initialX = startX !== null 
        ? Math.max(20, Math.min(viewportWidth - 40, startX + (Math.random() * 60 - 30)))
        : (viewportWidth * 0.5) + (Math.random() * (viewportWidth * 0.4) - (viewportWidth * 0.2));

      // Random physics variations (consumed by the compositor-only keyframes)
      particle.style.left = `${initialX}px`;
      particle.style.setProperty('--drift-x', `${Math.random() * 80 - 40}px`);
      particle.style.setProperty('--rot-deg', `${Math.random() * 40 - 20}deg`);
      particle.style.setProperty('--scale-target', (0.9 + Math.random() * 0.6).toFixed(2));
      particle.style.setProperty('--travel-y', `${55 + Math.random() * 30}vh`);

      const duration = 1.6 + Math.random() * 0.8;
      particle.style.animationDuration = `${duration}s`;

      container.appendChild(particle);

      // Clean up after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, duration * 1000);
    }
  }

  // Bind click handlers to reaction buttons
  reactionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const emoji = btn.getAttribute('data-emoji') || btn.textContent.trim();
      const rect = btn.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;

      // Haptic tactile bounce
      btn.classList.add('reaction-btn-bounce');
      setTimeout(() => btn.classList.remove('reaction-btn-bounce'), 250);

      // Spawn burst of 3-5 particles
      spawnReaction(emoji, btnCenterX, Math.floor(Math.random() * 3) + 2);
    });
  });

  // Random spontaneous crowd reaction bursts to simulate live arena energy
  const emojis = ['🔥', '⚡', '🎸', '💀'];
  spontaneousIntervalId = setInterval(() => {
    if (document.hidden) return; // no work in background tabs
    if (Math.random() > 0.45) {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      const randomX = window.innerWidth * (0.3 + Math.random() * 0.4);
      spawnReaction(randomEmoji, randomX, Math.floor(Math.random() * 2) + 1);
    }
  }, SPAWN_INTERVAL_MS);
}

export function destroyLiveReactionsController() {
  if (spontaneousIntervalId !== null) {
    clearInterval(spontaneousIntervalId);
    spontaneousIntervalId = null;
  }
}
