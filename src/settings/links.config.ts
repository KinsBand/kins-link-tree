/**
 * Canonical social & streaming link data (consumed by TabbedLinks.astro).
 * Add/modify links here only — never inline them in components.
 */
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconClass: string;
  badgeText?: string;
  featured?: boolean;
}

export interface PlatformLink {
  name: string;
  icon: string;
  url: string;
  platform: string;
}

export const primaryStreams: PlatformLink[] = [
  { name: "Spotify", icon: "fa-brands fa-spotify", url: "https://open.spotify.com/search/KinsBandOfficial", platform: "spotify" },
  { name: "Apple Music", icon: "fa-brands fa-apple", url: "https://music.apple.com/search?term=KinsBandOfficial", platform: "apple" },
  { name: "YT Music", icon: "fa-brands fa-youtube", url: "https://music.youtube.com/search?q=KinsBandOfficial", platform: "ytmusic" },
  { name: "Amazon Music", icon: "fa-brands fa-amazon", url: "https://music.amazon.com/search/KinsBandOfficial", platform: "amazon" },
  { name: "SoundCloud", icon: "fa-brands fa-soundcloud", url: "https://soundcloud.com/KinsBandOfficial", platform: "soundcloud" },
  { name: "Bandcamp", icon: "fa-brands fa-bandcamp", url: "https://bandcamp.com/search?q=KinsBandOfficial", platform: "bandcamp" }
];

export const secondaryStreams: PlatformLink[] = [
  { name: "Deezer", icon: "fa-brands fa-deezer", url: "https://www.deezer.com/search/KinsBandOfficial", platform: "deezer" },
  { name: "Tidal", icon: "fa-solid fa-water", url: "https://listen.tidal.com/search?q=KinsBandOfficial", platform: "tidal" },
  { name: "Audiomack", icon: "fa-solid fa-headphones", url: "https://audiomack.com/search?q=KinsBandOfficial", platform: "audiomack" },
  { name: "Qobuz", icon: "fa-solid fa-compact-disc", url: "https://www.qobuz.com/search?q=KinsBandOfficial", platform: "qobuz" }
];

export const primarySocials: PlatformLink[] = [
  { name: "Instagram", icon: "fa-brands fa-instagram", url: "https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx", platform: "instagram" },
  { name: "TikTok", icon: "fa-brands fa-tiktok", url: "https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ", platform: "tiktok" },
  { name: "YouTube", icon: "fa-brands fa-youtube", url: "https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ", platform: "youtube" },
  { name: "Facebook", icon: "fa-brands fa-facebook", url: "https://www.facebook.com/share/1LU7GTyCBW/", platform: "facebook" },
  { name: "Twitter / X", icon: "fa-brands fa-x-twitter", url: "https://x.com/KinsBandOfficial", platform: "twitter" },
  { name: "Threads", icon: "fa-brands fa-threads", url: "https://www.threads.com/@kinsbandofficial", platform: "threads" }
];

export const secondarySocials: PlatformLink[] = [
  { name: "Snapchat", icon: "fa-brands fa-snapchat", url: "https://snapchat.com/add/KinsBandOfficial", platform: "snapchat" },
  { name: "LinkedIn", icon: "fa-brands fa-linkedin-in", url: "https://linkedin.com/company/KinsBandOfficial", platform: "linkedin" }
];

export const primaryCommunity: PlatformLink[] = [
  { name: "Discord", icon: "fa-brands fa-discord", url: "https://discord.gg/Yu2npHUrH", platform: "discord" },
  { name: "Reddit", icon: "fa-brands fa-reddit-alien", url: "https://www.reddit.com/u/KinsBandOfficial/s/m8JXFDETij", platform: "reddit" },
  { name: "Substack", icon: "fa-solid fa-bookmark", url: "https://substack.com/@kinsbandoffical?utm_source=share&utm_medium=android&r=8uyitn", platform: "substack" },
  { name: "Patreon", icon: "fa-brands fa-patreon", url: "https://patreon.com/KinsBand", platform: "patreon" },
  { name: "Twitch", icon: "fa-brands fa-twitch", url: "https://twitch.tv/KinsBandOfficial", platform: "twitch" },
  { name: "Pinterest", icon: "fa-brands fa-pinterest", url: "https://pinterest.com/KinsBandOfficial", platform: "pinterest" }
];

export const secondaryCommunity: PlatformLink[] = [];

export interface RecommendedPlatforms {
  socials: string[];
  streams: string[];
  community: string[];
}

export interface RoutingRule {
  source_platform: string;
  source_url: string;
  source_category: "Stream" | "Social" | "Community";
  default_tab: "Streams" | "Socials" | "Community";
  recommended: RecommendedPlatforms;
}

export const routingMatrix: RoutingRule[] = [
  {
    source_platform: "Spotify",
    source_url: "https://open.spotify.com/search/KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Apple Music", "YT Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Apple Music",
    source_url: "https://music.apple.com/search?term=KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "YT Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "YT Music",
    source_url: "https://music.youtube.com/search?q=KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Amazon Music",
    source_url: "https://music.amazon.com/search/KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "SoundCloud",
    source_url: "https://soundcloud.com/KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Bandcamp",
    source_url: "https://bandcamp.com/search?q=KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Deezer",
    source_url: "https://www.deezer.com/search/KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Tidal",
    source_url: "https://listen.tidal.com/search?q=KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Audiomack",
    source_url: "https://audiomack.com/search?q=KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Qobuz",
    source_url: "https://www.qobuz.com/search?q=KinsBandOfficial",
    source_category: "Stream",
    default_tab: "Streams",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Instagram",
    source_url: "https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["TikTok", "YouTube"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "TikTok",
    source_url: "https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["Instagram", "YouTube"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "YouTube",
    source_url: "https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Facebook",
    source_url: "https://www.facebook.com/share/1LU7GTyCBW/",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Twitter / X",
    source_url: "https://x.com/KinsBandOfficial",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Threads",
    source_url: "https://www.threads.com/@kinsbandofficial",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Snapchat",
    source_url: "https://snapchat.com/add/KinsBandOfficial",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "LinkedIn",
    source_url: "https://linkedin.com/company/KinsBandOfficial",
    source_category: "Social",
    default_tab: "Socials",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Discord",
    source_url: "https://discord.gg/Yu2npHUrH",
    source_category: "Community",
    default_tab: "Community",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Reddit", "Substack"]
    }
  },
  {
    source_platform: "Reddit",
    source_url: "https://www.reddit.com/u/KinsBandOfficial/s/m8JXFDETij",
    source_category: "Community",
    default_tab: "Community",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Substack"]
    }
  },
  {
    source_platform: "Substack",
    source_url: "https://substack.com/@kinsbandoffical?utm_source=share&utm_medium=android&r=8uyitn",
    source_category: "Community",
    default_tab: "Community",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Patreon",
    source_url: "https://patreon.com/KinsBand",
    source_category: "Community",
    default_tab: "Community",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Twitch",
    source_url: "https://twitch.tv/KinsBandOfficial",
    source_category: "Community",
    default_tab: "Community",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  },
  {
    source_platform: "Pinterest",
    source_url: "https://pinterest.com/KinsBandOfficial",
    source_category: "Community",
    default_tab: "Community",
    recommended: {
      socials: ["Instagram", "TikTok"],
      streams: ["Spotify", "Apple Music"],
      community: ["Discord", "Reddit"]
    }
  }
];

