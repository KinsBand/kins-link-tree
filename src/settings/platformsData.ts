/**
 * Centralized platform and reach metrics configuration.
 * Stores platform metadata, URLs, icons, categories, and baseline metrics.
 */

export type PlatformCategory = 'streams' | 'socials' | 'community';

export interface PlatformItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: PlatformCategory;
  count: number;
  isPrimary?: boolean;
}

export const platformsData: PlatformItem[] = [
  // --- STREAMS ---
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com/search/KinsBandOfficial',
    icon: 'fa-brands fa-spotify',
    category: 'streams',
    count: 12450,
    isPrimary: true
  },
  {
    id: 'apple',
    name: 'Apple Music',
    url: 'https://music.apple.com/search?term=KinsBandOfficial',
    icon: 'fa-brands fa-apple',
    category: 'streams',
    count: 4800,
    isPrimary: true
  },
  {
    id: 'ytmusic',
    name: 'YT Music',
    url: 'https://music.youtube.com/search?q=KinsBandOfficial',
    icon: 'fa-brands fa-youtube',
    category: 'streams',
    count: 3200,
    isPrimary: true
  },
  {
    id: 'amazon',
    name: 'Amazon Music',
    url: 'https://music.amazon.com/search/KinsBandOfficial',
    icon: 'fa-brands fa-amazon',
    category: 'streams',
    count: 1100,
    isPrimary: true
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    url: 'https://soundcloud.com/KinsBandOfficial',
    icon: 'fa-brands fa-soundcloud',
    category: 'streams',
    count: 2300,
    isPrimary: true
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    url: 'https://bandcamp.com/search?q=KinsBandOfficial',
    icon: 'fa-brands fa-bandcamp',
    category: 'streams',
    count: 850,
    isPrimary: true
  },
  {
    id: 'deezer',
    name: 'Deezer',
    url: 'https://www.deezer.com/search/KinsBandOfficial',
    icon: 'fa-brands fa-deezer',
    category: 'streams',
    count: 620,
    isPrimary: false
  },
  {
    id: 'tidal',
    name: 'Tidal',
    url: 'https://listen.tidal.com/search?q=KinsBandOfficial',
    icon: 'fa-solid fa-water',
    category: 'streams',
    count: 410,
    isPrimary: false
  },
  {
    id: 'audiomack',
    name: 'Audiomack',
    url: 'https://audiomack.com/search?q=KinsBandOfficial',
    icon: 'fa-solid fa-headphones',
    category: 'streams',
    count: 350,
    isPrimary: false
  },
  {
    id: 'qobuz',
    name: 'Qobuz',
    url: 'https://www.qobuz.com/search?q=KinsBandOfficial',
    icon: 'fa-solid fa-compact-disc',
    category: 'streams',
    count: 220,
    isPrimary: false
  },

  // --- SOCIALS ---
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx',
    icon: 'fa-brands fa-instagram',
    category: 'socials',
    count: 18400,
    isPrimary: true
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ',
    icon: 'fa-brands fa-tiktok',
    category: 'socials',
    count: 24600,
    isPrimary: true
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ',
    icon: 'fa-brands fa-youtube',
    category: 'socials',
    count: 8900,
    isPrimary: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/share/1LU7GTyCBW/',
    icon: 'fa-brands fa-facebook',
    category: 'socials',
    count: 3400,
    isPrimary: true
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    url: 'https://x.com/KinsBandOfficial',
    icon: 'fa-brands fa-x-twitter',
    category: 'socials',
    count: 1850,
    isPrimary: true
  },
  {
    id: 'threads',
    name: 'Threads',
    url: 'https://www.threads.com/@kinsbandofficial',
    icon: 'fa-brands fa-threads',
    category: 'socials',
    count: 1200,
    isPrimary: true
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    url: 'https://snapchat.com/add/KinsBandOfficial',
    icon: 'fa-brands fa-snapchat',
    category: 'socials',
    count: 950,
    isPrimary: false
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com/company/KinsBandOfficial',
    icon: 'fa-brands fa-linkedin-in',
    category: 'socials',
    count: 520,
    isPrimary: false
  },

  // --- COMMUNITY ---
  {
    id: 'discord',
    name: 'Discord',
    url: 'https://discord.gg/Yu2npHUrH',
    icon: 'fa-brands fa-discord',
    category: 'community',
    count: 1450,
    isPrimary: true
  },
  {
    id: 'reddit',
    name: 'Reddit',
    url: 'https://www.reddit.com/u/KinsBandOfficial/s/m8JXFDETij',
    icon: 'fa-brands fa-reddit-alien',
    category: 'community',
    count: 820,
    isPrimary: true
  },
  {
    id: 'substack',
    name: 'Substack',
    url: 'https://substack.com/@kinsbandoffical?utm_source=share&utm_medium=android&r=8uyitn',
    icon: 'fa-solid fa-bookmark',
    category: 'community',
    count: 2100,
    isPrimary: true
  },
  {
    id: 'patreon',
    name: 'Patreon',
    url: 'https://patreon.com/KinsBand',
    icon: 'fa-brands fa-patreon',
    category: 'community',
    count: 380,
    isPrimary: true
  },
  {
    id: 'twitch',
    name: 'Twitch',
    url: 'https://twitch.tv/KinsBandOfficial',
    icon: 'fa-brands fa-twitch',
    category: 'community',
    count: 640,
    isPrimary: true
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    url: 'https://pinterest.com/KinsBandOfficial',
    icon: 'fa-brands fa-pinterest',
    category: 'community',
    count: 290,
    isPrimary: true
  }
];
