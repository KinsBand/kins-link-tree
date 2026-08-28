import { safeGet, safeSet } from './safeStorage.js';

const REFERRAL_KEY = 'kins_referral_source';
const CAMPAIGN_KEY = 'kins_referral_campaign';

/**
 * Initializes referral parameter capture on page load:
 * 1. Reads ref / source / utm_source / src from URL query string.
 * 2. Saves referral source to sessionStorage & localStorage.
 * 3. Silently removes the query parameters from the address bar (Option A - clean URL).
 */
export function initReferralTracker() {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const rawRef =
      params.get('ref') ||
      params.get('source') ||
      params.get('utm_source') ||
      params.get('src') ||
      params.get('referrer');

    const rawCampaign = params.get('utm_campaign') || params.get('campaign');

    if (rawRef) {
      const cleanRef = rawRef.trim().toLowerCase().slice(0, 50);
      safeSet(REFERRAL_KEY, cleanRef, 'session');
      safeSet(REFERRAL_KEY, cleanRef, 'local');

      if (rawCampaign) {
        safeSet(CAMPAIGN_KEY, rawCampaign.trim().slice(0, 50), 'session');
      }

      // Remove tracking query parameters from the browser address bar without page reload
      params.delete('ref');
      params.delete('source');
      params.delete('utm_source');
      params.delete('src');
      params.delete('referrer');
      params.delete('utm_medium');
      params.delete('utm_campaign');
      params.delete('utm_term');
      params.delete('utm_content');

      const remainingQuery = params.toString();
      const newPath = url.pathname + (remainingQuery ? '?' + remainingQuery : '') + url.hash;

      window.history.replaceState(window.history.state || {}, document.title, newPath);
    }
  } catch (err) {
    console.warn('[ReferralTracker] Initialization warning:', err);
  }
}

/**
 * Retrieves the stored referral source for attribution during subscriptions.
 * Checks session storage first, then local storage, then falls back to defaultSource.
 */
export function getReferralSource(defaultSource = 'website') {
  const sessionSource = safeGet(REFERRAL_KEY, null, 'session');
  if (sessionSource) return sessionSource;

  const localSource = safeGet(REFERRAL_KEY, null, 'local');
  if (localSource) return localSource;

  return defaultSource;
}
