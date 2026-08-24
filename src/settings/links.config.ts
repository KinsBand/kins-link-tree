/**
 * Link-in-Bio links and social platform settings.
 */
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconClass: string;
  badgeText?: string;
  featured?: boolean;
}

export const socialLinks = [
  { platform: "Instagram", url: "https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx", icon: "fa-brands fa-instagram" },
  { platform: "TikTok", url: "https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ", icon: "fa-brands fa-tiktok" },
  { platform: "YouTube", url: "https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ", icon: "fa-brands fa-youtube" },
  { platform: "Facebook", url: "https://www.facebook.com/share/1LU7GTyCBW/", icon: "fa-brands fa-facebook" },
  { platform: "X", url: "https://x.com/KinsBandOfficia", icon: "fa-brands fa-x-twitter" },
  { platform: "Substack", url: "https://substack.com/@kinsbandoffical?utm_source=share&utm_medium=android&r=8uyitn", icon: "fa-solid fa-bookmark" },
  { platform: "Threads", url: "https://www.threads.com/@kinsbandofficial", icon: "fa-brands fa-threads" },
  { platform: "Reddit", url: "https://www.reddit.com/u/KinsBandOfficial/s/m8JXFDETij", icon: "fa-brands fa-reddit-alien" },
  { platform: "Spotify", url: "https://open.spotify.com/artist/kins", icon: "fa-brands fa-spotify" },
  { platform: "Apple Music", url: "https://music.apple.com/artist/kins", icon: "fa-brands fa-apple" },
];

export const mainBioLinks: LinkItem[] = [
  {
    id: "spotify-latest",
    title: "Stream Latest Release on Spotify",
    url: "https://open.spotify.com",
    iconClass: "fa-brands fa-spotify",
    badgeText: "NEW",
    featured: true,
  },
  {
    id: "gig-tickets",
    title: "Tour Dates & Tickets",
    url: "#gigs",
    iconClass: "fa-solid fa-ticket",
  },
  {
    id: "covers-vault",
    title: "Covers & Live Performance Search",
    url: "#covers",
    iconClass: "fa-solid fa-magnifying-glass",
  },
  {
    id: "official-merch",
    title: "Official Kins Apparel & Merch",
    url: "#merch",
    iconClass: "fa-solid fa-shirt",
  },
  {
    id: "live-stream-hub",
    title: "Live Stream & Concert Hub",
    url: "live",
    iconClass: "fa-solid fa-tower-broadcast",
  },
];
