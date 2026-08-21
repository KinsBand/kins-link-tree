import { showToast } from './toast.js';

const STORAGE_KEY = 'kins_subscribed';
const COOKIE_NAME = 'kins_subscribed';
const EMAIL_KEY = 'kins_subscriber_email';

/**
 * Reads persistent subscription state from localStorage or fallback Cookie.
 * Returns true if Subscribed (Active State), false if Unsubscribed (Normal State).
 */
export function getSubscriptionState() {
  if (typeof window === 'undefined') return false;

  try {
    const localVal = localStorage.getItem(STORAGE_KEY);
    if (localVal === 'true') return true;
    if (localVal === 'false') return false;
    const emailVal = localStorage.getItem(EMAIL_KEY);
    if (emailVal && emailVal.length > 3) return true;
  } catch (e) {
    // Ignore storage errors
  }

  const cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  if (cookieMatch) {
    return cookieMatch[1] === 'true';
  }

  return false;
}

/**
 * Gets saved subscriber email from localStorage if available.
 */
export function getSubscriberEmail() {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch (e) {
    return '';
  }
}

/**
 * Saves subscription state to both localStorage and Cookie, and triggers a sync event.
 */
export function setSubscriptionState(isSubscribed, email = null) {
  if (typeof window === 'undefined') return;

  const valStr = isSubscribed ? 'true' : 'false';

  try {
    localStorage.setItem(STORAGE_KEY, valStr);
    if (isSubscribed && email) {
      localStorage.setItem(EMAIL_KEY, email.trim());
    } else if (!isSubscribed) {
      localStorage.removeItem(EMAIL_KEY);
    }
  } catch (e) {
    console.warn('localStorage error:', e);
  }

  document.cookie = `${COOKIE_NAME}=${valStr}; path=/; max-age=31536000; SameSite=Lax`;

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
 * Initializes the state-aware Notification Bell UI component.
 */
export function initSubscribeBell() {
  const topSubscribeBtn = document.getElementById('topSubscribeBtn');

  // On Load: Check storage & initialize state immediately (zero layout shift/delay)
  const initialIsSubscribed = getSubscriptionState();

  if (topSubscribeBtn) {
    updateBellUI(topSubscribeBtn, initialIsSubscribed, false);

    topSubscribeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isSubscribed = getSubscriptionState();

      if (!isSubscribed) {
        // Normal State -> Click to Subscribe: Scroll to form to complete subscription
        const subscribeFormSection = document.getElementById('subscribeFormSection');
        const emailInput = document.getElementById('emailInput');
        
        if (subscribeFormSection) {
          subscribeFormSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        if (emailInput) {
          setTimeout(() => emailInput.focus(), 500);
        }

        showToast("Enter your email to subscribe to Kins updates!");
      } else {
        // Active State (Subscribed) -> Scroll to section; user must press the Unsubscribe button to opt out
        const subscribeFormSection = document.getElementById('subscribeFormSection');
        if (subscribeFormSection) {
          subscribeFormSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showToast("You are already subscribed to Kins! You'll receive drops straight to your inbox.");
      }
    });
  }

  // Listen to global subscription state changes (e.g. when user submits form)
  window.addEventListener('kins:subscription-change', (e) => {
    const nextState = e.detail?.isSubscribed;
    if (typeof nextState === 'boolean' && topSubscribeBtn) {
      updateBellUI(topSubscribeBtn, nextState, true);
    }
  });
}
