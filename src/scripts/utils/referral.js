import { safeGet, safeSet } from './safeStorage.js';
import { routingMatrix } from '../../settings/links.config';

const REFERRAL_KEY = 'kins_referral_source';
const PLATFORM_KEY = 'kins_referral_platform';
const CAMPAIGN_KEY = 'kins_referral_campaign';

/**
 * Resolves canonical platform name from raw referral string or document.referrer URL.
 */
export function resolvePlatformName(rawSource = '', referrerUrl = '') {
  const s = (rawSource || '').toLowerCase().trim();
  const ref = (referrerUrl || '').toLowerCase().trim();

  // 1. Direct query param or string matching
  if (s) {
    if (s === 'spotify' || s.includes('spotify')) return 'Spotify';
    if (s === 'apple' || s === 'applemusic' || s === 'apple-music' || s === 'apple_music' || s.includes('apple')) return 'Apple Music';
    if (s === 'ytmusic' || s === 'yt-music' || s === 'yt_music' || s.includes('ytmusic') || s.includes('youtube music')) return 'YT Music';
    if (s === 'amazon' || s === 'amazonmusic' || s === 'amazon-music' || s.includes('amazon')) return 'Amazon Music';
    if (s === 'soundcloud' || s.includes('soundcloud')) return 'SoundCloud';
    if (s === 'bandcamp' || s.includes('bandcamp')) return 'Bandcamp';
    if (s === 'deezer' || s.includes('deezer')) return 'Deezer';
    if (s === 'tidal' || s.includes('tidal')) return 'Tidal';
    if (s === 'audiomack' || s.includes('audiomack')) return 'Audiomack';
    if (s === 'qobuz' || s.includes('qobuz')) return 'Qobuz';
    if (s === 'instagram' || s === 'ig' || s === 'insta' || s.includes('instagram')) return 'Instagram';
    if (s === 'tiktok' || s === 'tt' || s.includes('tiktok')) return 'TikTok';
    if (s === 'youtube' || s === 'yt' || s.includes('youtube')) return 'YouTube';
    if (s === 'facebook' || s === 'fb' || s.includes('facebook')) return 'Facebook';
    if (s === 'twitter' || s === 'x' || s === 'twitter/x' || s === 'x-twitter' || s.includes('twitter')) return 'Twitter / X';
    if (s === 'threads' || s.includes('threads')) return 'Threads';
    if (s === 'snapchat' || s === 'snap' || s.includes('snapchat')) return 'Snapchat';
    if (s === 'linkedin' || s.includes('linkedin')) return 'LinkedIn';
    if (s === 'discord' || s.includes('discord')) return 'Discord';
    if (s === 'reddit' || s.includes('reddit')) return 'Reddit';
    if (s === 'substack' || s.includes('substack')) return 'Substack';
    if (s === 'patreon' || s.includes('patreon')) return 'Patreon';
    if (s === 'twitch' || s.includes('twitch')) return 'Twitch';
    if (s === 'pinterest' || s.includes('pinterest')) return 'Pinterest';
  }

  // 2. Referrer header URL matching
  if (ref) {
    if (ref.includes('spotify.com')) return 'Spotify';
    if (ref.includes('music.apple.com')) return 'Apple Music';
    if (ref.includes('music.youtube.com')) return 'YT Music';
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'YouTube';
    if (ref.includes('instagram.com')) return 'Instagram';
    if (ref.includes('tiktok.com')) return 'TikTok';
    if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'Facebook';
    if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) return 'Twitter / X';
    if (ref.includes('threads.net') || ref.includes('threads.com')) return 'Threads';
    if (ref.includes('snapchat.com')) return 'Snapchat';
    if (ref.includes('linkedin.com')) return 'LinkedIn';
    if (ref.includes('discord.com') || ref.includes('discord.gg')) return 'Discord';
    if (ref.includes('reddit.com')) return 'Reddit';
    if (ref.includes('substack.com')) return 'Substack';
    if (ref.includes('patreon.com')) return 'Patreon';
    if (ref.includes('twitch.tv')) return 'Twitch';
    if (ref.includes('pinterest.com')) return 'Pinterest';
    if (ref.includes('music.amazon.com') || ref.includes('amazon.com')) return 'Amazon Music';
    if (ref.includes('soundcloud.com')) return 'SoundCloud';
    if (ref.includes('bandcamp.com')) return 'Bandcamp';
    if (ref.includes('deezer.com')) return 'Deezer';
    if (ref.includes('tidal.com')) return 'Tidal';
    if (ref.includes('audiomack.com')) return 'Audiomack';
    if (ref.includes('qobuz.com')) return 'Qobuz';
  }

  return null;
}

/**
 * Initializes referral parameter capture on page load:
 * 1. Reads ref / source / utm_source / src from URL query string or document.referrer.
 * 2. Saves referral source & resolved platform to sessionStorage & localStorage.
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
    const docReferrer = typeof document !== 'undefined' ? document.referrer : '';

    const detectedPlatform = resolvePlatformName(rawRef, docReferrer);

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

    if (detectedPlatform) {
      safeSet(PLATFORM_KEY, detectedPlatform, 'session');
      safeSet(PLATFORM_KEY, detectedPlatform, 'local');
    }
  } catch (err) {
    console.warn('[ReferralTracker] Initialization warning:', err);
  }
}

/**
 * Retrieves the stored referral source for attribution during subscriptions.
 */
export function getReferralSource(defaultSource = 'website') {
  const sessionSource = safeGet(REFERRAL_KEY, null, 'session');
  if (sessionSource) return sessionSource;

  const localSource = safeGet(REFERRAL_KEY, null, 'local');
  if (localSource) return localSource;

  return defaultSource;
}

/**
 * Retrieves the resolved entry platform name (e.g. 'Spotify', 'Instagram', 'Discord').
 */
export function getResolvedPlatform() {
  if (typeof window === 'undefined') return null;

  // Ensure referral parameter capture has executed
  initReferralTracker();

  const sessionPlatform = safeGet(PLATFORM_KEY, null, 'session');
  if (sessionPlatform) return sessionPlatform;

  const localPlatform = safeGet(PLATFORM_KEY, null, 'local');
  if (localPlatform) return localPlatform;

  const refSource = getReferralSource('');
  const docRef = typeof document !== 'undefined' ? document.referrer : '';
  return resolvePlatformName(refSource, docRef);
}

/**
 * Retrieves the matching RoutingRule for the current user's referral origin.
 */
export function getRoutingRuleForUser() {
  const platform = getResolvedPlatform();
  if (!platform) return null;

  return routingMatrix.find(r => r.source_platform.toLowerCase() === platform.toLowerCase()) || null;
}

