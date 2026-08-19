// src/lib/attribution.ts
// Universal Omnichannel Inbound Attribution Engine for Kins Band
// Handles explicit query params, naked queries, hash routes, path aliases, in-app mobile user-agents, and referrers.

export interface InboundAttribution {
  channel: string;       // e.g. 'Instagram', 'TikTok', 'Spotify', 'Facebook', 'YouTube', 'Discord', 'Substack'
  alias: string;         // e.g. 'IGBioPage', 'TKBioPage', 'SPBioPage', 'FBBioPage', 'YTBioPage', 'DCBioPage'
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_domain?: string;
  entry_timestamp: string;
}

const STORAGE_INBOUND_KEY = 'kins_inbound_attribution';
const STORAGE_FIRST_TOUCH_KEY = 'kins_first_attribution';

// Comprehensive Alias to Platform Dictionary
const ALIAS_DICTIONARY: Record<string, { channel: string; defaultAlias: string }> = {
  // Instagram
  'igbiopage': { channel: 'Instagram', defaultAlias: 'IGBioPage' },
  'ig': { channel: 'Instagram', defaultAlias: 'IGBioPage' },
  'insta': { channel: 'Instagram', defaultAlias: 'IGBioPage' },
  'instagram': { channel: 'Instagram', defaultAlias: 'IGBioPage' },
  'ig_bio': { channel: 'Instagram', defaultAlias: 'IGBioPage' },
  'iglink': { channel: 'Instagram', defaultAlias: 'IGBioPage' },
  'instagrambio': { channel: 'Instagram', defaultAlias: 'IGBioPage' },

  // Facebook
  'fbbiopage': { channel: 'Facebook', defaultAlias: 'FBBioPage' },
  'fb': { channel: 'Facebook', defaultAlias: 'FBBioPage' },
  'facebook': { channel: 'Facebook', defaultAlias: 'FBBioPage' },
  'fb_bio': { channel: 'Facebook', defaultAlias: 'FBBioPage' },
  'fblink': { channel: 'Facebook', defaultAlias: 'FBBioPage' },

  // TikTok
  'tkbiopage': { channel: 'TikTok', defaultAlias: 'TKBioPage' },
  'tt': { channel: 'TikTok', defaultAlias: 'TKBioPage' },
  'tk': { channel: 'TikTok', defaultAlias: 'TKBioPage' },
  'tiktok': { channel: 'TikTok', defaultAlias: 'TKBioPage' },
  'tiktok_bio': { channel: 'TikTok', defaultAlias: 'TKBioPage' },
  'ttbio': { channel: 'TikTok', defaultAlias: 'TKBioPage' },

  // Spotify
  'spbiopage': { channel: 'Spotify', defaultAlias: 'SPBioPage' },
  'spotify': { channel: 'Spotify', defaultAlias: 'SPBioPage' },
  'sp': { channel: 'Spotify', defaultAlias: 'SPBioPage' },
  'spotify_bio': { channel: 'Spotify', defaultAlias: 'SPBioPage' },
  'spotifybio': { channel: 'Spotify', defaultAlias: 'SPBioPage' },

  // YouTube
  'ytbiopage': { channel: 'YouTube', defaultAlias: 'YTBioPage' },
  'youtube': { channel: 'YouTube', defaultAlias: 'YTBioPage' },
  'yt': { channel: 'YouTube', defaultAlias: 'YTBioPage' },
  'yt_bio': { channel: 'YouTube', defaultAlias: 'YTBioPage' },
  'ytbio': { channel: 'YouTube', defaultAlias: 'YTBioPage' },

  // Discord
  'dcbiopage': { channel: 'Discord', defaultAlias: 'DCBioPage' },
  'discord': { channel: 'Discord', defaultAlias: 'DCBioPage' },
  'dc': { channel: 'Discord', defaultAlias: 'DCBioPage' },
  'discord_bio': { channel: 'Discord', defaultAlias: 'DCBioPage' },

  // Substack / Newsletter
  'substackbio': { channel: 'Substack', defaultAlias: 'SubstackBio' },
  'substack': { channel: 'Substack', defaultAlias: 'SubstackBio' },
  'newsletter': { channel: 'Substack', defaultAlias: 'SubstackBio' },
  'vip': { channel: 'Substack', defaultAlias: 'SubstackBio' },

  // Threads
  'threadsbio': { channel: 'Threads', defaultAlias: 'ThreadsBio' },
  'threads': { channel: 'Threads', defaultAlias: 'ThreadsBio' },

  // Apple Music
  'applebio': { channel: 'Apple Music', defaultAlias: 'AppleBio' },
  'applemusic': { channel: 'Apple Music', defaultAlias: 'AppleBio' },
  'apple': { channel: 'Apple Music', defaultAlias: 'AppleBio' },

  // X / Twitter
  'twbiopage': { channel: 'X/Twitter', defaultAlias: 'TwitterBio' },
  'twitter': { channel: 'X/Twitter', defaultAlias: 'TwitterBio' },
  'x': { channel: 'X/Twitter', defaultAlias: 'TwitterBio' }
};

function normalizeLookupKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

// Inbound Attribution Resolver
export function initAttribution(): InboundAttribution {
  if (typeof window === 'undefined') {
    return { channel: 'Direct', alias: 'Direct', entry_timestamp: new Date().toISOString() };
  }

  const href = window.location.href;
  const url = new URL(href);
  const searchParams = url.searchParams;

  let matchedChannel = '';
  let matchedAlias = '';
  let utmSource = searchParams.get('utm_source') || '';
  let utmMedium = searchParams.get('utm_medium') || '';
  let utmCampaign = searchParams.get('utm_campaign') || '';

  // 1. Check Standard Named Query Parameters (?alias=..., ?src=..., ?ref=..., ?source=..., ?bio=..., ?from=...)
  const candidateKeys = ['alias', 'src', 'ref', 'source', 'bio', 'from', 'c', 'campaign', 'channel'];
  for (const k of candidateKeys) {
    const val = searchParams.get(k);
    if (val) {
      const normalized = normalizeLookupKey(val);
      if (ALIAS_DICTIONARY[normalized]) {
        matchedChannel = ALIAS_DICTIONARY[normalized].channel;
        matchedAlias = ALIAS_DICTIONARY[normalized].defaultAlias;
        break;
      } else if (!matchedAlias) {
        matchedChannel = val.charAt(0).toUpperCase() + val.slice(1);
        matchedAlias = val;
      }
    }
  }

  // 2. Check Naked Query Keys (e.g. ?IGBioPage, ?TKBioPage, ?FBBioPage, ?spotify, ?instagram)
  if (!matchedChannel) {
    searchParams.forEach((value, key) => {
      if (!matchedChannel) {
        const normalizedKey = normalizeLookupKey(key);
        const normalizedVal = normalizeLookupKey(value);
        
        if (ALIAS_DICTIONARY[normalizedKey]) {
          matchedChannel = ALIAS_DICTIONARY[normalizedKey].channel;
          matchedAlias = ALIAS_DICTIONARY[normalizedKey].defaultAlias;
        } else if (normalizedVal && ALIAS_DICTIONARY[normalizedVal]) {
          matchedChannel = ALIAS_DICTIONARY[normalizedVal].channel;
          matchedAlias = ALIAS_DICTIONARY[normalizedVal].defaultAlias;
        }
      }
    });
  }

  // 3. Check URL Hash (e.g. #IGBioPage, #/TKBioPage, #src=instagram)
  if (!matchedChannel && window.location.hash) {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    const hashClean = normalizeLookupKey(rawHash);
    if (ALIAS_DICTIONARY[hashClean]) {
      matchedChannel = ALIAS_DICTIONARY[hashClean].channel;
      matchedAlias = ALIAS_DICTIONARY[hashClean].defaultAlias;
    }
  }

  // 4. Check URL Pathname Segments (e.g. /kins-link-tree/IGBioPage, /ig, /tiktok)
  if (!matchedChannel && window.location.pathname) {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    for (const segment of pathSegments) {
      const segClean = normalizeLookupKey(segment);
      if (ALIAS_DICTIONARY[segClean]) {
        matchedChannel = ALIAS_DICTIONARY[segClean].channel;
        matchedAlias = ALIAS_DICTIONARY[segClean].defaultAlias;
        break;
      }
    }
  }

  // 5. Check UTM Source if specified
  if (!matchedChannel && utmSource) {
    const utmClean = normalizeLookupKey(utmSource);
    if (ALIAS_DICTIONARY[utmClean]) {
      matchedChannel = ALIAS_DICTIONARY[utmClean].channel;
      matchedAlias = utmCampaign || ALIAS_DICTIONARY[utmClean].defaultAlias;
    } else {
      matchedChannel = utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
      matchedAlias = utmCampaign || utmSource;
    }
  }

  // 6. Mobile In-App Browser User-Agent Detection (Guarantees attribution when OS strips HTTP referrer)
  if (!matchedChannel && typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent;
    if (ua.includes('Instagram') || ua.includes('IGWeb')) {
      matchedChannel = 'Instagram';
      matchedAlias = 'InstagramInApp';
    } else if (ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('FB_IAB')) {
      matchedChannel = 'Facebook';
      matchedAlias = 'FacebookInApp';
    } else if (ua.includes('TikTok') || ua.includes('BytedanceWebview') || ua.includes('musical_ly')) {
      matchedChannel = 'TikTok';
      matchedAlias = 'TikTokInApp';
    } else if (ua.includes('Twitter') || ua.includes('TwitterAndroid') || ua.includes('TwitterforiPhone')) {
      matchedChannel = 'X/Twitter';
      matchedAlias = 'TwitterInApp';
    } else if (ua.includes('Discord')) {
      matchedChannel = 'Discord';
      matchedAlias = 'DiscordInApp';
    } else if (ua.includes('Spotify')) {
      matchedChannel = 'Spotify';
      matchedAlias = 'SpotifyInApp';
    }
  }

  // 7. Fallback to HTTP Referrer Header
  let refDomain = '';
  if (!matchedChannel && document.referrer) {
    try {
      refDomain = new URL(document.referrer).hostname.toLowerCase();
      if (refDomain.includes('instagram.com') || refDomain.includes('l.instagram.com')) {
        matchedChannel = 'Instagram';
        matchedAlias = 'InstagramReferral';
      } else if (refDomain.includes('facebook.com') || refDomain.includes('l.facebook.com')) {
        matchedChannel = 'Facebook';
        matchedAlias = 'FacebookReferral';
      } else if (refDomain.includes('tiktok.com')) {
        matchedChannel = 'TikTok';
        matchedAlias = 'TikTokReferral';
      } else if (refDomain.includes('spotify.com')) {
        matchedChannel = 'Spotify';
        matchedAlias = 'SpotifyReferral';
      } else if (refDomain.includes('youtube.com') || refDomain.includes('youtu.be')) {
        matchedChannel = 'YouTube';
        matchedAlias = 'YouTubeReferral';
      } else if (refDomain.includes('t.co') || refDomain.includes('twitter.com') || refDomain.includes('x.com')) {
        matchedChannel = 'X/Twitter';
        matchedAlias = 'TwitterReferral';
      } else if (refDomain.includes('discord.com') || refDomain.includes('discord.gg')) {
        matchedChannel = 'Discord';
        matchedAlias = 'DiscordReferral';
      } else if (refDomain.includes('google.com') || refDomain.includes('google.com.au')) {
        matchedChannel = 'Google';
        matchedAlias = 'GoogleOrganic';
      }
    } catch (e) {}
  }

  // Default fallback if no signal matched
  if (!matchedChannel) {
    const existing = sessionStorage.getItem(STORAGE_INBOUND_KEY);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch (e) {}
    }
    matchedChannel = 'Direct';
    matchedAlias = 'Direct';
  }

  const attributionRecord: InboundAttribution = {
    channel: matchedChannel,
    alias: matchedAlias,
    utm_source: utmSource || undefined,
    utm_medium: utmMedium || undefined,
    utm_campaign: utmCampaign || undefined,
    referrer_domain: refDomain || undefined,
    entry_timestamp: new Date().toISOString()
  };

  // Persist for session & first-touch lifetime
  try {
    sessionStorage.setItem(STORAGE_INBOUND_KEY, JSON.stringify(attributionRecord));
    if (!localStorage.getItem(STORAGE_FIRST_TOUCH_KEY)) {
      localStorage.setItem(STORAGE_FIRST_TOUCH_KEY, JSON.stringify(attributionRecord));
    }
  } catch (e) {}

  return attributionRecord;
}

export function getInboundAttribution(): InboundAttribution {
  if (typeof window === 'undefined') {
    return { channel: 'Direct', alias: 'Direct', entry_timestamp: new Date().toISOString() };
  }
  const existing = sessionStorage.getItem(STORAGE_INBOUND_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {}
  }
  return initAttribution();
}

// Campaign Link Generator Helper (used in Dashboard)
export function generateCampaignUrl(baseUrl: string, platformKey: string, customAlias?: string): string {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const entry = ALIAS_DICTIONARY[platformKey.toLowerCase()] || { channel: platformKey, defaultAlias: customAlias || platformKey };
  const alias = customAlias || entry.defaultAlias;
  return `${cleanBase}?alias=${encodeURIComponent(alias)}&utm_source=${encodeURIComponent(entry.channel.toLowerCase())}&utm_medium=bio_link&utm_campaign=${encodeURIComponent(alias)}`;
}
