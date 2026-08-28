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
export async function submitSocialSubscription(email, name = '', avatar = '', source) {
  if (!email) return false;

  let resolvedSource = source;
  if (!resolvedSource) {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('source') || params.get('utm_source') || params.get('src');
      resolvedSource = ref ? `google_1tap:${ref.trim().slice(0, 40)}` : 'google_1tap';
    } catch (_) {
      resolvedSource = 'google_1tap';
    }
  }

  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';
  const endpoint = `${baseUrl}/api/subscribe`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatar, source: resolvedSource })
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
  if (emailInput) {
    if (!emailInput.value) {
      emailInput.placeholder = 'Enter your Google email...';
    }
    emailInput.focus();
  }
  showToast(message || 'Enter your Google email below and tap JOIN!');
}

/**
 * Ensures GIS is loaded and initialized. Runs ONLY after an explicit
 * button press — nothing Google-related happens at page load.
 */
let googleReady = false;
let googleInitPromise = null;

async function ensureGoogleInitialized() {
  if (googleReady) return true;
  if (googleInitPromise) return googleInitPromise;

  googleInitPromise = (async () => {
    const loaded = await loadGsiScript();
    if (!loaded || !window.google?.accounts?.id) return false;

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
        use_fedcm_for_prompt: true,
        ...(nonceHashed ? { nonce: nonceHashed } : {})
      });
      googleReady = true;
      return true;
    } catch (err) {
      console.warn('[SocialAuth] GIS initialize exception:', err);
      return false;
    }
  })();

  const ok = await googleInitPromise;
  if (!ok) googleInitPromise = null;
  return ok;
}

/**
 * Button-driven sign-in: loads/initializes GIS lazily, then opens the
 * Google account chooser. Falls back to the email form when the prompt
 * cannot be shown (blocked script, disallowed origin, dismissed).
 */
async function handleGoogleBtnPress(e) {
  e.preventDefault();
  const googleBtn = e.currentTarget || document.getElementById('googleAuthBtn');

  try {
    if (getSubscriptionState()) {
      showToast("You're already subscribed to Kins!");
      return;
    }
    if (!isValidGoogleClientId(GOOGLE_CLIENT_ID)) {
      fallbackToEmailForm('Google sign-in is not configured — enter your email below and tap JOIN!');
      return;
    }

    googleBtn?.setAttribute('disabled', '');
    const ready = await ensureGoogleInitialized();
    googleBtn?.removeAttribute('disabled');
    if (!ready) {
      fallbackToEmailForm('Google sign-in is unavailable right now — enter your email below and tap JOIN!');
      return;
    }

    // FedCM-compliant: use_fedcm_for_prompt:true already set in initialize().
    // Never call deprecated isNotDisplayed()/getNotDisplayedReason()/isSkippedMoment()/getSkippedReason()
    // — they trigger [GSI_LOGGER] warnings and will stop functioning under FedCM.
    // https://developers.google.com/identity/gsi/web/guides/fedcm-migration
    window.google.accounts.id.prompt((notification) => {
      try {
        // Only FedCM-safe status checks: isDisplayMoment() + isDisplayed()
        const isDisplayMoment = typeof notification.isDisplayMoment === 'function'
          ? notification.isDisplayMoment()
          : false;
        const isDisplayed = typeof notification.isDisplayed === 'function'
          ? notification.isDisplayed()
          : true;
        if (isDisplayMoment && !isDisplayed) {
          console.info('[SocialAuth] One Tap not displayed (FedCM)');
          fallbackToEmailForm();
        }
        // For all other FedCM moments (skipped/dismissed), UI already handled by browser;
        // no deprecated getSkippedReason/getNotDisplayedReason calls to avoid logger warnings.
      } catch (e) {
        console.warn('[SocialAuth] prompt callback warning:', e);
        fallbackToEmailForm();
      }
    });
  } catch (err) {
    console.warn('[SocialAuth] Google sign-in failed:', err);
    googleBtn?.removeAttribute('disabled');
    fallbackToEmailForm();
  }
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
 * Main initialization entrypoint. Binds the Google button only — no
 * network calls to Google happen until the user presses it.
 */
export function initSocialAuth() {
  if (typeof window === 'undefined') return;
  initSessionBridge();
  document.getElementById('googleAuthBtn')?.addEventListener('click', handleGoogleBtnPress);
}
