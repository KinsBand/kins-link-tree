/**
 * Site-wide configuration and metadata settings.
 */
export const siteConfig = {
  title: "Kins | Official Link in Bio & Website",
  description: "Official link in bio for Kins (@KinsBandOfficial). Stream latest music, follow on social media, buy merch, and get gig updates.",
  handle: "@KinsBandOfficial",
  artistName: "Kins",
  copyrightYear: 2026,
  siteUrl: "https://kinshub.vercel.app",
  ogImage: "new.png",
  themeColor: "#0e0e0e",
  // Ko-fi page URL — set PUBLIC_KOFI_URL at build time. Empty = the homepage
  // tip button is left out (the /live tip jar keeps its own fallback).
  tipJarUrl: import.meta.env.PUBLIC_KOFI_URL || "",
};
