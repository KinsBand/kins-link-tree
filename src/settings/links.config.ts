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

export const primarySocials: PlatformLink[] = [
  { name: "Instagram", icon: "fa-brands fa-instagram", url: "https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx", platform: "instagram" },
  { name: "TikTok", icon: "fa-brands fa-tiktok", url: "https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ", platform: "tiktok" },
  { name: "YouTube", icon: "fa-brands fa-youtube", url: "https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ", platform: "youtube" },
  { name: "Facebook", icon: "fa-brands fa-facebook", url: "https://www.facebook.com/share/1LU7GTyCBW/", platform: "facebook" },
  { name: "Twitter / X", icon: "fa-brands fa-x-twitter", url: "https://x.com/KinsBandOfficia", platform: "twitter" },
  { name: "Discord", icon: "fa-brands fa-discord", url: "https://discord.gg/Yu2npHUrH", platform: "discord" }
];

export const secondarySocials: PlatformLink[] = [
  { name: "Substack", icon: "fa-solid fa-bookmark", url: "https://substack.com/@kinsbandoffical?utm_source=share&utm_medium=android&r=8uyitn", platform: "substack" },
  { name: "Threads", icon: "fa-brands fa-threads", url: "https://www.threads.com/@kinsbandofficial", platform: "threads" },
  { name: "Reddit", icon: "fa-brands fa-reddit-alien", url: "https://www.reddit.com/u/KinsBandOfficial/s/m8JXFDETij", platform: "reddit" },
  { name: "Snapchat", icon: "fa-brands fa-snapchat", url: "https://snapchat.com/add/KinsBandOfficial", platform: "snapchat" },
  { name: "Patreon", icon: "fa-brands fa-patreon", url: "https://patreon.com/KinsBand", platform: "patreon" },
  { name: "Twitch", icon: "fa-brands fa-twitch", url: "https://twitch.tv/KinsBandOfficial", platform: "twitch" },
  { name: "Pinterest", icon: "fa-brands fa-pinterest", url: "https://pinterest.com/KinsBandOfficial", platform: "pinterest" },
  { name: "LinkedIn", icon: "fa-brands fa-linkedin-in", url: "https://linkedin.com/company/KinsBandOfficial", platform: "linkedin" }
];

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
