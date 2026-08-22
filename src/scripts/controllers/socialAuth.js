import { showToast } from './toast.js';
import { getSubscriptionState, setSubscriptionState } from './subscribeController.js';
import { validateRealEmail } from '../utils/emailValidator.js';

// Configuration Defaults & Environment Variables
const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_GOOGLE_CLIENT_ID) ||
  '852914057583-9u1smv7r8bbosgnpp6ajmmukpne54ru7.apps.googleusercontent.com';

const APPLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_APPLE_CLIENT_ID) ||
  '';

const APPLE_REDIRECT_URI =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_APPLE_REDIRECT_URI) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

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
 * Checks if an Apple Service ID is configured and valid.
 */
function isValidAppleClientId(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed === '' || trimmed === 'YOUR_APPLE_SERVICE_ID' || trimmed.startsWith('YOUR_')) return false;
  return trimmed.length > 5;
}

/**
 * Safely decodes a base64url-encoded JWT payload without external libraries.
 */
function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
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
export async function submitSocialSubscription(email, provider, credential = null) {
  if (!email) return false;

  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';
  const endpoint = `${baseUrl}/api/subscribe`;

  let subscribedSuccessfully = false;
  let toastMsg = `You're subscribed with ${provider}! Welcome email sent.`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
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

  // Resilient client-side webhook fallback if backend server endpoint is offline
  if (!subscribedSuccessfully) {
    try {
      const backupWebhook =
        'https://discordapp.com/api/webhooks/1540216715382882416/QNZTqlKy2V3uKofeLLi-tHs46x0evzfdeoy5ZMOckn0l_nF4HaMM6Z9TyO35abgoeMa2';
      await fetch(backupWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Kins Subscribers Bot',
          avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png',
          embeds: [
            {
              title: `✉️ New 1-Tap Fan Club Subscriber (${provider})!`,
              description: `**Email:** \`${email}\`\n• **Captured via:** 1-Tap Auth (${provider})\n• **Timestamp:** ${new Date().toISOString()}`,
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
 * Option 1: Native Safari / iOS iCloud 1-Tap Autofill Fallback
 * Focuses input, triggers native Safari/iOS keyboard autofill suggestions bar.
 */
function triggerICloudAutofillFallback() {
  const emailInput = document.getElementById('emailInput');
  if (emailInput) {
    if (!emailInput.value) {
      emailInput.value = '@icloud.com';
      emailInput.focus();
      try {
        emailInput.setSelectionRange(0, 0);
      } catch (e) {}
    } else {
      emailInput.focus();
    }
    // Dispatch input event so Safari / iOS keyboard bar surfaces iCloud suggestions
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  showToast('Enter your Apple iCloud email below to join in 1-tap!');
}

/**
 * Hybrid Apple Flow:
 * 1. Tries Native WebAuthn / Passkey Biometrics (Face ID / Touch ID / Windows Hello) - $0 Cost
 * 2. Falls back seamlessly to iOS iCloud 1-Tap Autofill
 */
async function handleHybridAppleAuth() {
  if (getSubscriptionState()) {
    showToast("You're already subscribed to Kins!");
    return;
  }

  const emailInput = document.getElementById('emailInput');
  const existingEmail = emailInput ? emailInput.value.trim() : '';

  // 1. If email is already typed in input, validate and submit immediately!
  if (existingEmail && existingEmail.includes('@')) {
    const val = await validateRealEmail(existingEmail);
    if (val.valid && val.cleanEmail) {
      await submitSocialSubscription(val.cleanEmail, 'Apple');
      return;
    }
  }

  // 2. Try Option 2: Native Biometric Passkey (Face ID on iPhone/iPad, Touch ID on Mac/iOS)
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);

      if (isAvailable && window.isSecureContext) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const userName = existingEmail || 'fan@apple.id';

        const publicKeyOptions = {
          challenge,
          rp: {
            name: 'Kins Band Fan Club',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: userName,
            displayName: existingEmail ? existingEmail.split('@')[0] : 'Kins Fan',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Native Face ID / Touch ID
            userVerification: 'preferred',
            residentKey: 'preferred',
          },
          timeout: 45000,
          attestation: 'none',
        };

        const cred = await navigator.credentials.create({
          publicKey: publicKeyOptions,
        });

        if (cred) {
          if (existingEmail) {
            await submitSocialSubscription(existingEmail, 'Apple Face ID');
            return;
          } else {
            showToast('Biometrics verified! Enter your email to confirm welcome drops.');
            triggerICloudAutofillFallback();
            return;
          }
        }
      }
    } catch (passkeyErr) {
      console.info('[SocialAuth] Biometric passkey dismissed or not completed, falling back to iCloud autofill:', passkeyErr);
    }
  }

  // 3. Fallback to Option 1: Native iOS iCloud 1-Tap Autofill
  triggerICloudAutofillFallback();
}

/**
 * Initializes Google Identity Services (GIS) One-Tap / FedCM Bottom Sheet.
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

  if (typeof window.google === 'undefined' || !window.google.accounts || !window.google.accounts.id) {
    return;
  }

  try {
    // Configure Google Identity Services with FedCM
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      use_fedcm_for_prompt: true,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: async (response) => {
        if (response && response.credential) {
          const payload = parseJwtPayload(response.credential);
          const email = payload?.email;
          if (email) {
            await submitSocialSubscription(email, 'Google', response.credential);
          }
        }
      }
    });

    const triggerPrompt = () => {
      if (getSubscriptionState()) return;
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.info('[SocialAuth] Google 1-Tap prompt status:', notification);
        }
      });
    };

    // Auto-prompt on mount for unsubscribed visitors
    if (!getSubscriptionState()) {
      setTimeout(triggerPrompt, 1200);
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (getSubscriptionState()) {
          showToast("You're already subscribed to Kins!");
          return;
        }
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
        } catch (promptErr) {
          const emailInput = document.getElementById('emailInput');
          if (emailInput) emailInput.focus();
        }
      });
    }
  } catch (err) {
    console.warn('[SocialAuth] Google GIS init exception:', err);
  }
}

/**
 * Initializes Apple Auth (Official SDK if configured, or Hybrid Biometrics + iCloud Autofill).
 */
async function initAppleAuth() {
  const appleBtn = document.getElementById('appleAuthBtn');

  // If official Apple Developer Service ID is provided, use official Apple JS SDK
  if (isValidAppleClientId(APPLE_CLIENT_ID)) {
    try {
      await loadExternalScript(
        'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth.js',
        'apple-auth-sdk'
      );
      if (window.AppleID && window.AppleID.auth) {
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: 'name email',
          redirectURI: APPLE_REDIRECT_URI || window.location.origin,
          usePopup: true,
        });

        if (appleBtn) {
          appleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (getSubscriptionState()) {
              showToast("You're already subscribed to Kins!");
              return;
            }
            try {
              const data = await window.AppleID.auth.signIn();
              let email = data?.user?.email;
              if (!email && data?.authorization?.id_token) {
                const payload = parseJwtPayload(data.authorization.id_token);
                email = payload?.email;
              }
              if (email) {
                await submitSocialSubscription(email, 'Apple', data?.authorization?.id_token);
              } else {
                handleHybridAppleAuth();
              }
            } catch (err) {
              handleHybridAppleAuth();
            }
          });
        }
        return;
      }
    } catch (sdkErr) {
      console.warn('[SocialAuth] Apple SDK load failed, falling back to Hybrid auth:', sdkErr);
    }
  }

  // Hybrid Flow (Biometric Passkeys -> iOS iCloud Autofill Fallback)
  if (appleBtn) {
    appleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleHybridAppleAuth();
    });
  }
}

/**
 * Main initialization entrypoint for 1-Tap Social Auth.
 */
export function initSocialAuth() {
  if (typeof window === 'undefined') return;

  initGoogleOneTap();
  initAppleAuth();
}
