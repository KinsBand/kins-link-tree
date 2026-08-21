/**
 * Theme Controller - Kins Official Website
 * Manages Standard Mode vs Stealth Dark Mode switching with localStorage persistence
 */

export const THEME_STORAGE_KEY = 'kins-theme';

export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'standard') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {}
  return 'standard';
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'standard';
}

export function updateThemeButtonUI(theme) {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const toggleLabel = document.getElementById('themeToggleLabel');
  const toggleIcon = document.getElementById('themeToggleIcon');
  const iconBadge = toggleBtn?.querySelector('.theme-toggle-icon-badge');

  if (!toggleBtn) return;

  const isDark = theme === 'dark';
  
  if (toggleLabel) {
    toggleLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
  }

  if (toggleIcon) {
    toggleIcon.className = `theme-toggle-icon fa-solid ${isDark ? 'fa-moon' : 'fa-sun'}`;
  }

  if (iconBadge) {
    iconBadge.classList.remove('theme-spin-pop');
    void iconBadge.offsetWidth; // Trigger reflow for animation restart
    iconBadge.classList.add('theme-spin-pop');
    setTimeout(() => {
      iconBadge.classList.remove('theme-spin-pop');
    }, 600);
  }

  toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  toggleBtn.setAttribute('data-current-theme', theme);
}

export function setTheme(theme) {
  const targetTheme = theme === 'dark' ? 'dark' : 'standard';
  document.documentElement.setAttribute('data-theme', targetTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
  } catch (e) {}

  updateThemeButtonUI(targetTheme);

  // Broadcast custom event for other reactive components
  window.dispatchEvent(
    new CustomEvent('kins:theme-change', {
      detail: { theme: targetTheme }
    })
  );
}

export function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'standard' : 'dark';
  setTheme(next);
}

export function initTheme() {
  const initial = getCurrentTheme() || getPreferredTheme();
  document.documentElement.setAttribute('data-theme', initial);
  updateThemeButtonUI(initial);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }

  // Listen for system theme changes if user has not explicitly set a preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (!saved) {
          setTheme(e.matches ? 'dark' : 'standard');
        }
      } catch (err) {}
    });
  }
}
