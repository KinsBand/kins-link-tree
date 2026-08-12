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
  { platform: "Instagram", url: "https://instagram.com/kinsbandofficial", icon: "fa-brands fa-instagram" },
  { platform: "Spotify", url: "https://open.spotify.com/artist/kins", icon: "fa-brands fa-spotify" },
  { platform: "YouTube", url: "https://youtube.com/@kinsbandofficial", icon: "fa-brands fa-youtube" },
  { platform: "TikTok", url: "https://tiktok.com/@kinsbandofficial", icon: "fa-brands fa-tiktok" },
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
];
