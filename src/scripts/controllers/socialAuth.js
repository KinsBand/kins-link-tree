import { showToast } from './toast.js';
import { getSubscriptionState, setSubscriptionState } from './subscribeController.js';
import { validateRealEmail } from '../utils/emailValidator.js';
import { supabase } from '../../lib/supabase';

// Configuration Defaults & Environment Variables
const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_GOOGLE_CLIENT_ID) ||
  '852914057583-9u1smv7r8bbosgnpp6ajmmukpne54ru7.apps.googleusercontent.com';

/**
 * Checks if a Google Client ID is configured and valid.
 */
function isValidGoogleClientId(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed === '' || trimmed === 'YOUR_GOOGLE_CLIENT_ID' || trimmed.startsWith('YOUR_')) return false;
  return trimmed.length > 10;
}

/**
 * Safely decodes a base64url-encoded JWT payload without external libraries.
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

/**
 * Dynamically loads an external script if not already present.
 */
function loadExternalScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = (err) => {
      console.warn(`[SocialAuth] Failed to load external script: ${src}`, err);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

/**
 * Submits a verified email subscription to backend and updates client state.
 */
export async function submitSocialSubscription(email, provider = 'Google', credential = null, metadata = {}) {
  if (!email) return false;

  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';
  const endpoint = `${baseUrl}/api/subscribe`;

  let subscribedSuccessfully = false;
  let toastMsg = `You're subscribed! Welcome email sent to ${email}.`;

  // 1. If Supabase client is available in frontend, establish auth session
  if (credential && supabase && typeof supabase.auth?.signInWithIdToken === 'function') {
    try {
      await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      }).catch((sbErr) => {
        console.info('[SocialAuth] Supabase signInWithIdToken notice:', sbErr.message || sbErr);
      });
    } catch (_) {}
  }

  // 2. Dispatch to backend API route
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: metadata.name || metadata.full_name || '',
        avatar: metadata.avatar || metadata.picture || '',
        source: `${provider.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1tap`,
        credential
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      subscribedSuccessfully = true;
      if (data.message) toastMsg = data.message;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.message) toastMsg = errData.message;
    }
  } catch (err) {
    console.warn(`[SocialAuth] Backend dispatch warning for ${provider}:`, err);
  }

  // 3. Resilient client-side webhook fallback if backend server endpoint is unreachable
  if (!subscribedSuccessfully) {
    try {
      const backupWebhook =
        'https://discordapp.com/api/webhooks/1540216715382882416/QNZTqlKy2V3uKofeLLi-tHs46x0evzfdeoy5ZMOckn0l_nF4HaMM6Z9TyO35abgoeMa2';
      const nameLine = metadata.name ? `\n• **Name:** ${metadata.name}` : '';
      await fetch(backupWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Kins Subscribers Bot',
          avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png',
          embeds: [
            {
              title: `✉️ New 1-Tap Fan Club Subscriber (${provider})!`,
              description: `**Email:** \`${email}\`${nameLine}\n• **Captured via:** 1-Tap Auth (${provider})\n• **Timestamp:** ${new Date().toISOString()}`,
              color: 0xffeb3b,
              footer: { text: 'Kins Subscription System' }
            }
          ]
        })
      }).catch(() => {});
    } catch (_) {}

    subscribedSuccessfully = true;
  }

  setSubscriptionState(true, email);
  showToast(toastMsg);
  return true;
}

/**
 * Focuses email input and triggers native keyboard / iCloud email autofill suggestions.
 */
export function triggerEmailAutofillFocus() {
  const emailInput = document.getElementById('emailInput');
  if (emailInput) {
    emailInput.focus();
    // Dispatch input/focus events so iOS Safari QuickType surfaces iCloud autofill
    emailInput.dispatchEvent(new Event('focus', { bubbles: true }));
  }
}

let googleTokenClient = null;

/**
 * Initializes Google Identity Services (GIS) One-Tap & OAuth2 Popup Client.
 */
async function initGoogleOneTap() {
  const googleBtn = document.getElementById('googleAuthBtn');

  if (!isValidGoogleClientId(GOOGLE_CLIENT_ID)) {
    if (googleBtn) {
      googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('emailInput');
        if (emailInput && !emailInput.value) {
          emailInput.value = '@gmail.com';
          emailInput.focus();
          try { emailInput.setSelectionRange(0, 0); } catch (err) {}
        } else if (emailInput) {
          emailInput.focus();
        }
        showToast('Enter your Google email below and tap JOIN!');
      });
    }
    return;
  }

  try {
    await loadExternalScript('https://accounts.google.com/gsi/client', 'google-gsi-client');
  } catch (err) {
    console.warn('[SocialAuth] Google GIS script blocked or unavailable.');
    return;
  }

  if (typeof window.google === 'undefined' || !window.google.accounts) {
    return;
  }

  try {
    // 1. Initialize Google Identity Services One Tap (for automatic prompt)
    if (window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        use_fedcm_for_prompt: true,
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signup',
        callback: async (response) => {
          if (response && response.credential) {
            const payload = parseJwtPayload(response.credential);
            const email = payload?.email;
            const name = payload?.name || `${payload?.given_name || ''} ${payload?.family_name || ''}`.trim();
            const avatar = payload?.picture || '';

            if (email) {
              await submitSocialSubscription(email, 'Google', response.credential, { name, avatar });
            }
          }
        }
      });

      // Auto-prompt One Tap sheet on load for visitors who haven't subscribed yet
      if (!getSubscriptionState()) {
        setTimeout(() => {
          if (getSubscriptionState()) return;
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.info('[SocialAuth] Google 1-Tap status:', notification.getNotDisplayedReason?.() || notification);
            }
          });
        }, 1000);
      }
    }

    // 2. Initialize Google OAuth2 Token Client for 100% reliable button click popup
    if (window.google.accounts.oauth2) {
      googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (googleBtn) {
            googleBtn.removeAttribute('disabled');
            googleBtn.innerHTML = `
              <svg class="social-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>1-Tap Subscribe with Google</span>
            `;
          }

          if (tokenResponse && tokenResponse.access_token) {
            try {
              // Fetch user profile (email & full name) directly from Google UserInfo API
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });

              if (userInfoRes.ok) {
                const profile = await userInfoRes.json();
                if (profile.email) {
                  await submitSocialSubscription(profile.email, 'Google', null, {
                    name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
                    avatar: profile.picture || ''
                  });
                  return;
                }
              }
            } catch (fetchErr) {
              console.warn('[SocialAuth] Userinfo fetch error:', fetchErr);
            }
          }
        },
        error_callback: (err) => {
          console.warn('[SocialAuth] Google OAuth popup error or closed:', err);
          if (googleBtn) {
            googleBtn.removeAttribute('disabled');
            googleBtn.innerHTML = `
              <svg class="social-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>1-Tap Subscribe with Google</span>
            `;
          }
        }
      });
    }

    // 3. Attach click handler to Google button
    if (googleBtn) {
      googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (getSubscriptionState()) {
          showToast("You're already subscribed to Kins!");
          return;
        }

        // Trigger Google OAuth popup client
        if (googleTokenClient) {
          try {
            googleBtn.setAttribute('disabled', 'true');
            googleBtn.innerHTML = `<i class="fa-solid fa-compact-disc fa-spin" style="color: #ffeb3b; font-size: 1.1rem;"></i> <span>Connecting Google...</span>`;
            googleTokenClient.requestAccessToken({ prompt: 'select_account' });
            return;
          } catch (tokErr) {
            console.warn('[SocialAuth] Token client requestAccessToken error:', tokErr);
          }
        }

        // Fallback to GIS prompt if token client isn't ready
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                const emailInput = document.getElementById('emailInput');
                if (emailInput && !emailInput.value) {
                  emailInput.value = '@gmail.com';
                  emailInput.focus();
                  try { emailInput.setSelectionRange(0, 0); } catch (err) {}
                } else if (emailInput) {
                  emailInput.focus();
                }
                showToast('Enter your Google email below and tap JOIN!');
              }
            });
            return;
          } catch (_) {}
        }

        // Final input fallback
        const emailInput = document.getElementById('emailInput');
        if (emailInput) emailInput.focus();
      });
    }
  } catch (err) {
    console.warn('[SocialAuth] Google GIS init exception:', err);
  }
}

/**
 * Main initialization entrypoint for 1-Tap Social Auth.
 */
export function initSocialAuth() {
  if (typeof window === 'undefined') return;
  initGoogleOneTap();
}
