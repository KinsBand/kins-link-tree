import { safeGet, safeSet, safeRemove } from '../utils/safeStorage.js';

const STORAGE_KEY = 'kins_subscribed';
const COOKIE_NAME = 'kins_subscribed';
const EMAIL_KEY = 'kins_subscriber_email';

/**
 * Reads persistent subscription state from safeStorage or fallback Cookie.
 * Returns true if Subscribed (Active State), false if Unsubscribed (Normal State).
 */
export function getSubscriptionState() {
  if (typeof window === 'undefined') return false;

  const localVal = safeGet(STORAGE_KEY);
  if (localVal === 'true') return true;
  if (localVal === 'false') return false;
  const emailVal = safeGet(EMAIL_KEY);
  if (emailVal && emailVal.length > 3) return true;

  const cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  if (cookieMatch) {
    return cookieMatch[1] === 'true';
  }

  return false;
}

/**
 * Gets saved subscriber email from safeStorage if available.
 */
export function getSubscriberEmail() {
  if (typeof window === 'undefined') return '';
  return safeGet(EMAIL_KEY, '') || '';
}

/**
 * Saves subscription state to both safeStorage and Cookie, and triggers a sync event.
 * @param {boolean} isSubscribed
 * @param {string | null} [email]
 */
export function setSubscriptionState(isSubscribed, email = null) {
  if (typeof window === 'undefined') return;

  const valStr = isSubscribed ? 'true' : 'false';

  safeSet(STORAGE_KEY, valStr);
  if (isSubscribed && email) {
    safeSet(EMAIL_KEY, email.trim());
  } else if (!isSubscribed) {
    safeRemove(EMAIL_KEY);
  }

  const securePart = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${valStr}; path=/; max-age=31536000; SameSite=Lax${securePart}`;

  window.dispatchEvent(new CustomEvent('kins:subscription-change', {
    detail: { isSubscribed, email: email || getSubscriberEmail() }
  }));
}

/**
 * Updates the Notification Bell button visual state & aria attributes.
 * - Normal State: Unsubscribed (Outlined Bell)
 * - Active State: Subscribed (Solid Active Bell)
 */
export function updateBellUI(btnEl, isSubscribed, shouldAnimate = true) {
  if (!btnEl) return;

  const iconEl = btnEl.querySelector('.nav-icon') || btnEl.querySelector('i');

  if (isSubscribed) {
    // ACTIVE STATE (SUBSCRIBED)
    btnEl.classList.add('bell-subscribed');
    btnEl.classList.remove('bell-unsubscribed');
    btnEl.setAttribute('aria-label', 'Subscribed to Kins (Click to view subscription)');
    btnEl.setAttribute('title', 'Subscribed to Kins');

    if (iconEl) {
      iconEl.className = 'fa-solid fa-bell nav-icon bell-active-solid';
      
      if (shouldAnimate) {
        iconEl.classList.remove('bell-ring-shake');
        void iconEl.offsetWidth; // Force reflow
        iconEl.classList.add('bell-ring-shake');
      }
    }
  } else {
    // NORMAL STATE (UNSUBSCRIBED)
    btnEl.classList.remove('bell-subscribed');
    btnEl.classList.add('bell-unsubscribed');
    btnEl.setAttribute('aria-label', 'Subscribe to Kins');
    btnEl.setAttribute('title', 'Subscribe to Kins');

    if (iconEl) {
      iconEl.className = 'fa-regular fa-bell nav-icon';
      iconEl.classList.remove('bell-ring-shake');
    }
  }
}

/**
 * Scrolls the signup form into view and focuses its email field.
 * Returns false when the page has no signup form (newsletter disabled).
 */
export function focusSignupForm() {
  const section = document.getElementById('subscribeFormSection');
  if (!section || !document.getElementById('subscribeForm')) return false;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

  const input = document.getElementById('emailInput');
  if (input && !getSubscriptionState()) {
    input.focus({ preventScroll: true });
  }
  return true;
}

/**
 * Initializes the state-aware Notification Bell and Join pill in the top bar.
 */
export function initSubscribeBell() {
  const topSubscribeBtn = document.getElementById('topSubscribeBtn');
  const headerJoinPillBtn = document.getElementById('headerJoinPillBtn');

  // On Load: Check storage & initialize state immediately (zero layout shift/delay)
  const initialIsSubscribed = getSubscriptionState();

  if (topSubscribeBtn) {
    updateBellUI(topSubscribeBtn, initialIsSubscribed, false);
  }

  [topSubscribeBtn, headerJoinPillBtn].forEach((btn) => {
    btn?.addEventListener('click', (e) => {
      if (focusSignupForm()) e.preventDefault();
    });
  });

  // Listen to global subscription state changes (e.g. when user submits form)
  window.addEventListener('kins:subscription-change', (e) => {
    const nextState = e.detail?.isSubscribed;
    if (typeof nextState === 'boolean' && topSubscribeBtn) {
      updateBellUI(topSubscribeBtn, nextState, true);
    }
  });
}
