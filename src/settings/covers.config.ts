/**
 * Covers Catalog Data — SINGLE SOURCE OF TRUTH for Kins cover performances.
 * Used by CoversSearchOverlay, coversSearchEngine, and videoModalController.
 */

export type CoverCategory = 'full-band' | 'acoustic' | 'shorts';
export type CoverPlatform = 'youtube' | 'tiktok' | 'instagram';

export interface KinsCoverItem {
  id: string;
  title: string;
  originalArtist: string;
  category: CoverCategory;
  categoryLabel: string;
  thumbnail: string;
  embedUrl: string;
  platform: CoverPlatform;
  platformLabel: string;
  platformIcon: string;
  watchUrl: string;
  commentUrl: string;
  followUrl: string;
  commentCount: number;
  duration: string;
  views: string;
  isLatest?: boolean;
  isLivePerformance?: boolean;
  setlistRequests?: number;
}

export interface KinsLearningCover {
  id: string;
  title: string;
  originalArtist: string;
  category: CoverCategory;
  categoryLabel: string;
  rehearsalStatus: string;
  rehearsalNotes: string;
  progressPercent: number;
  thumbnail?: string;
  releaseDateEstimate?: string;
  setlistRequests?: number;
}

/**
 * SINGLE SOURCE OF TRUTH: Track Kins Band is actively learning in rehearsal.
 * Displayed in the 'CURRENTLY LEARNING' spotlight in CoversSearchOverlay.
 */
export const KINS_CURRENTLY_LEARNING: KinsLearningCover = {
  id: "learning-1",
  title: "Just Like Heaven",
  originalArtist: "The Cure",
  category: "full-band",
  categoryLabel: "Full Band",
  rehearsalStatus: "IN REHEARSAL",
  rehearsalNotes: "In rehearsal — learning guitar leads & arrangement",
  progressPercent: 65,
  thumbnail: "/covers/just-like-heaven.jpg",
  releaseDateEstimate: "In Rehearsal"
};

/**
 * Released Kins covers catalog.
 * Empty until official band covers are recorded and published.
 */
export const KINS_COVERS_DATA: KinsCoverItem[] = [];
