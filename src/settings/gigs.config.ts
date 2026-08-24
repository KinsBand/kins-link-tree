/**
 * Canonical tour/venue data — SINGLE SOURCE OF TRUTH for the gig map.
 *
 * OWNER: add real shows here (dates/times are venue-local Australia/Sydney;
 * the sheet converts via its DST-aware helpers). The controller imports
 * GIG_VENUES directly. Do NOT hardcode dates in components or controllers.
 *
 * `TEMPLATE_SHOW` documents every field the renderer consumes. Delete it
 * once real data exists.
 */

export interface GigSetlistSong {
  name: string;
  artist?: string;
  snippetUrl?: string;
}

export interface GigShow {
  id: string;
  type: "upcoming" | "past";
  dateText: string;
  timeText?: string;
  targetDate?: string;
  tourName?: string;
  isNextShow?: boolean;
  urgencyBadgeText?: string;
  ticketStatus?: "on_sale" | "selling_fast" | "sold_out" | "free";
  ticketPriceLabel?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  supportActs?: string;
  attendanceCount?: number;
  hasUserCheckedIn?: boolean;
  plannedSetlist?: GigSetlistSong[];
  asPlayedSetlist?: GigSetlistSong[];
  notes?: string;
  pastVenueHistory?: { date: string; tourName: string }[];
}

export interface GigVenue {
  id: string;
  name: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  websiteUrl?: string;
  mapsQuery?: string;
  shows: GigShow[];
}

export const TEMPLATE_SHOW: GigShow = {
  id: "gig-template",
  type: "upcoming",
  dateText: "Fri, Aug 28",
  timeText: "8:00 PM",
  targetDate: "2026-08-28T20:00:00+10:00",
  tourName: "Headline Tour",
  isNextShow: false,
  urgencyBadgeText: "🔥 SELLING FAST",
  ticketStatus: "on_sale",
  ticketPriceLabel: "$15 + BF",
  ticketUrl: "https://example.com/tickets",
  supportActs: "",
  attendanceCount: 0,
  plannedSetlist: [{ name: "Neon Riot" }],
  asPlayedSetlist: [],
  pastVenueHistory: []
};

export const GIG_VENUES: GigVenue[] = [];

export const UPCOMING_GIGS: GigShow[] = [];
