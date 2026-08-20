/**
 * Live Floating Reactions Particle Engine
 * Spawns physics-based floating emojis (🔥, ⚡, 🎸, 💀) across the live screen.
 */

export function initLiveReactionsController() {
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
      const particle = document.createElement('div');
      particle.className = 'floating-reaction-particle';
      particle.textContent = emoji;

      // Calculate initial X position
      const viewportWidth = window.innerWidth;
      const initialX = startX !== null 
        ? Math.max(20, Math.min(viewportWidth - 40, startX + (Math.random() * 60 - 30)))
        : (viewportWidth * 0.5) + (Math.random() * (viewportWidth * 0.4) - (viewportWidth * 0.2));

      // Random physics variations
      const driftX = (Math.random() * 80 - 40) + 'px';
      const rotateDeg = (Math.random() * 40 - 20) + 'deg';
      const duration = 1.6 + Math.random() * 0.8;
      const scale = 0.9 + Math.random() * 0.6;

      particle.style.left = `${initialX}px`;
      particle.style.setProperty('--drift-x', driftX);
      particle.style.setProperty('--rot-deg', rotateDeg);
      particle.style.setProperty('--scale-target', scale);
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
    btn.addEventListener('click', (e) => {
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
  setInterval(() => {
    if (Math.random() > 0.45) {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      const randomX = window.innerWidth * (0.3 + Math.random() * 0.4);
      spawnReaction(randomEmoji, randomX, Math.floor(Math.random() * 2) + 1);
    }
  }, 4000);
}
