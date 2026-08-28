import { safeGet, safeSet } from '../utils/safeStorage.js';

export const THEME_STORAGE_KEY = 'kins-theme';

export function getPreferredTheme() {
  const saved = safeGet(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'standard') {
    return saved;
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'standard';
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'standard';
}

export function updateThemeButtonUI(theme) {
  const isDark = theme === 'dark';
  const themeTitle = isDark ? 'Dark' : 'Light';

  // 1. Update Current Theme Title text on the left side
  document.querySelectorAll('#themeCurrentTitle, .theme-current-title').forEach((el) => {
    el.textContent = themeTitle;
  });

  // Legacy full labels
  document.querySelectorAll('#themeToggleLabel, .theme-toggle-label, #drawerThemeToggleLabel').forEach((el) => {
    el.textContent = isDark ? 'Dark Mode' : 'Light Mode';
  });

  // 2. Update Middle Segmented Pill (Light vs Dark selectable icons)
  document.querySelectorAll('#themePillLightBtn, .theme-pill-light').forEach((btn) => {
    if (!isDark) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  document.querySelectorAll('#themePillDarkBtn, .theme-pill-dark').forEach((btn) => {
    if (isDark) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // 3. Update legacy icon badges if present
  document.querySelectorAll('#themeToggleIcon, #drawerThemeToggleIcon').forEach((icon) => {
    icon.className = `theme-toggle-icon fa-solid ${isDark ? 'fa-moon' : 'fa-sun'}`;
  });

  // 4. Update container attributes
  document.querySelectorAll('#themeToggleBtn, #drawerThemeToggleBtn, .footer-theme-toggle-btn').forEach((toggleBtn) => {
    toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggleBtn.setAttribute('data-current-theme', theme);
  });
}

export function setTheme(theme) {
  const targetTheme = theme === 'dark' ? 'dark' : 'standard';
  document.documentElement.setAttribute('data-theme', targetTheme);

  safeSet(THEME_STORAGE_KEY, targetTheme);

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

  // Unified click handler supporting direct pill selection & card toggling
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    // 1. Direct click on Light / Dark segmented pill button
    const pillBtn = target.closest('[data-theme-target]');
    if (pillBtn) {
      e.preventDefault();
      e.stopPropagation();
      const targetTheme = pillBtn.getAttribute('data-theme-target');
      if (targetTheme) {
        setTheme(targetTheme);
      }
      return;
    }

    // 2. Click on the theme toggle card button
    const toggleBtn = target.closest('#themeToggleBtn, #drawerThemeToggleBtn, .footer-theme-toggle-btn');
    if (toggleBtn) {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Listen for system theme changes if user has not explicitly set a preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const saved = safeGet(THEME_STORAGE_KEY);
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'standard');
      }
    });
  }
}
