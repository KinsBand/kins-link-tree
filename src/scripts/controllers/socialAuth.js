import { showToast } from './toast.js';
import { getSubscriptionState, setSubscriptionState } from './subscribeController.js';
import { getSupabaseBrowserClient } from '../../lib/supabase';

// Google OAuth Web Client ID (public by design — safe to expose)
const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_GOOGLE_CLIENT_ID) || '';

/**
 * Per-page nonce for One Tap replay protection.
 * Hashed copy goes to Google, raw copy goes to supabase.auth.signInWithIdToken().
 */
let oneTapNonceRaw = '';

function isValidGoogleClientId(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed === '' || trimmed.startsWith('YOUR_')) return false;
  return /^[0-9a-zA-Z-]+\.apps\.googleusercontent\.com$/.test(trimmed);
}

/**
 * Safely decodes a base64url-encoded JWT payload for UI display only.
 * Trust decisions happen in Supabase Auth / server-side — never here.
 */
export function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('[SocialAuth] JWT parse warning:', e);
    return null;
  }
}

let gsiScriptPromise = null;

/**
 * Loads the Google Identity Services client library once.
 */
function loadGsiScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve) => {
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[SocialAuth] Google GIS script blocked or unavailable.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

/**
 * Generates a cryptographically random nonce and its SHA-256 hex hash.
 */
async function generateNonce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { raw, hashed };
}

/**
 * Records the subscription server-side after Supabase auth succeeded.
 * Returns true only on genuine success — never fakes success on failure.
 */
export async function submitSocialSubscription(email, name = '', avatar = '', source = 'google_1tap') {
  if (!email) return false;

  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';
  const endpoint = `${baseUrl}/api/subscribe`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatar, source })
    });

    if (res.ok) {
      setSubscriptionState(true, email);
      const data = await res.json().catch(() => ({}));
      showToast(data.message || `You're subscribed! Welcome email sent to ${email}.`);
      return true;
    }

    const errData = await res.json().catch(() => ({}));
    showToast(errData.message || 'Subscription failed. Please try again or use the email form.');
    return false;
  } catch (err) {
    console.warn('[SocialAuth] Backend dispatch warning:', err);
    showToast('Could not reach the subscription service. Please try again shortly.');
    return false;
  }
}

/**
 * Handles the GIS credential response: establishes a real Supabase auth
 * session via signInWithIdToken, then records the subscription.
 */
async function handleGoogleCredential(response) {
  if (!response?.credential) return;

  const payload = parseJwtPayload(response.credential);
  const email = payload?.email;
  const name = payload?.name || `${payload?.given_name || ''} ${payload?.family_name || ''}`.trim();
  const avatar = payload?.picture || '';

  if (!email) {
    showToast('Google sign-in returned no email. Please use the email form instead.');
    return;
  }

  const sb = getSupabaseBrowserClient();
  if (!sb) {
    console.warn(
      '[SocialAuth] Supabase browser client unavailable — set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.'
    );
  } else {
    try {
      const { error } = await sb.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: oneTapNonceRaw || undefined
      });
      if (error) {
        console.warn('[SocialAuth] signInWithIdToken failed:', error.message);
        showToast('Google sign-in could not be verified. Please try the email form.');
        return;
      }
    } catch (sbErr) {
      console.warn('[SocialAuth] signInWithIdToken exception:', sbErr);
      showToast('Google sign-in failed. Please try the email form.');
      return;
    }
  }

  await submitSocialSubscription(email, name, avatar);
}

/**
 * Shows the email-form fallback when Google prompt/UI is unavailable.
 */
function fallbackToEmailForm(message) {
  const emailInput = document.getElementById('emailInput');
  if (emailInput && !emailInput.value) {
    emailInput.value = '@gmail.com';
    emailInput.focus();
    try { emailInput.setSelectionRange(0, 0); } catch (_) {}
  } else if (emailInput) {
    emailInput.focus();
  }
  showToast(message || 'Enter your Google email below and tap JOIN!');
}

/**
 * Swaps the custom button for Google's official Sign In With Google button
 * once it renders successfully. Falls back to the custom button otherwise.
 */
function mountOfficialGoogleButton() {
  const host = document.getElementById('googleBtnHost');
  const customBtn = document.getElementById('googleAuthBtn');
  if (!host || !window.google?.accounts?.id) return false;

  try {
    window.google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      logo_alignment: 'left',
      locale: 'en-US'
    });

    // renderButton injects its iframe synchronously in practice; verify next tick
    requestAnimationFrame(() => {
      if (host.childElementCount > 0 && customBtn) {
        customBtn.classList.add('hidden');
        host.classList.remove('hidden');
      }
    });
    return true;
  } catch (err) {
    console.warn('[SocialAuth] renderButton failed:', err);
    return false;
  }
}

/**
 * Initializes Google Identity Services One Tap + official button.
 */
async function initGoogleOneTap() {
  const googleBtn = document.getElementById('googleAuthBtn');

  if (!isValidGoogleClientId(GOOGLE_CLIENT_ID)) {
    console.warn('[SocialAuth] PUBLIC_GOOGLE_CLIENT_ID missing or invalid.');
    googleBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      fallbackToEmailForm('Google sign-in is not configured — enter your email below and tap JOIN!');
    });
    return;
  }

  const loaded = await loadGsiScript();
  if (!loaded || !window.google?.accounts?.id) return;

  let nonceHashed = '';
  try {
    const nonce = await generateNonce();
    oneTapNonceRaw = nonce.raw;
    nonceHashed = nonce.hashed;
  } catch (err) {
    console.warn('[SocialAuth] Nonce generation failed:', err);
  }

  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: true,
      cancel_on_tap_outside: true,
      context: 'signup',
      itp_support: true,
      ...(nonceHashed ? { nonce: nonceHashed } : {})
    });
  } catch (err) {
    console.warn('[SocialAuth] GIS initialize exception:', err);
    return;
  }

  mountOfficialGoogleButton();

  // One Tap auto-prompt for visitors who haven't subscribed yet
  if (!getSubscriptionState()) {
    setTimeout(() => {
      if (getSubscriptionState()) return;
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.info('[SocialAuth] One Tap not displayed:', notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.info('[SocialAuth] One Tap skipped:', notification.getSkippedReason());
          }
        });
      } catch (_) {}
    }, 1200);
  }

  // Custom-button fallback path (only visible when the official button fails to render)
  googleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (getSubscriptionState()) {
      showToast("You're already subscribed to Kins!");
      return;
    }
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (
            (typeof notification.isNotDisplayed === 'function' && notification.isNotDisplayed()) ||
            (typeof notification.isSkippedMoment === 'function' && notification.isSkippedMoment())
          ) {
            fallbackToEmailForm();
          }
        });
        return;
      } catch (_) {}
    }
    fallbackToEmailForm();
  });
}

/**
 * Reuses an existing Supabase session so returning users see subscribed state
 * immediately, without re-prompting.
 */
export async function initSessionBridge() {
  const sb = getSupabaseBrowserClient();
  if (!sb) return;

  sb.auth.onAuthStateChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.email) {
      if (!getSubscriptionState()) {
        setSubscriptionState(true, session.user.email);
      }
    }
  });

  try {
    const { data } = await sb.auth.getSession();
    const email = data?.session?.user?.email;
    if (email && !getSubscriptionState()) {
      setSubscriptionState(true, email);
    }
  } catch (err) {
    console.warn('[SocialAuth] Session restore warning:', err);
  }
}

/**
 * Signs out of Supabase and prevents Google auto-select dead-loops.
 * Called when the user unsubscribes / resets their state.
 */
export async function signOutSocialAuth() {
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch (_) {}
  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch (err) {
      console.warn('[SocialAuth] signOut warning:', err);
    }
  }
}

/**
 * Main initialization entrypoint for 1-Tap Social Auth.
 */
export function initSocialAuth() {
  if (typeof window === 'undefined') return;
  initSessionBridge();
  initGoogleOneTap();
}
