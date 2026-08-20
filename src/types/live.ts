export type LiveStatus = 'live' | 'pre-show' | 'offline' | 'replay';
export type SongStatus = 'completed' | 'active' | 'upcoming' | 'encore';

export interface SetlistItem {
  id: string;
  order: number;
  title: string;
  artist?: string;
  duration?: string;
  status: SongStatus;
  key?: string;
  tempo?: string;
  chordsSnippet?: string;
  tabs?: string;
  lyrics?: {
    time: number; // in seconds
    text: string;
  }[];
  notes?: string;
}

export interface FanCamStream {
  id: string;
  handle: string;
  platform: 'TikTok' | 'Twitch' | 'Kick' | 'Instagram' | 'YouTube' | 'X';
  platformIcon: string;
  platformColor: string;
  viewers: number;
  avatarUrl: string;
  streamUrl: string;
  angleName: string;
}

export interface NativeAppWatchLink {
  platform: string;
  label: string;
  shortLabel: string;
  iconClass: string;
  color: string;
  url: string;
}

export interface ChatBadge {
  type: 'band' | 'mod' | 'vip' | 'pit';
  label: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  message: string;
  timestamp: string;
  badge?: ChatBadge;
  isTip?: boolean;
  tipAmount?: string;
  highlight?: boolean;
}

export interface FanWallPost {
  id: string;
  authorHandle: string;
  authorName: string;
  avatarUrl: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption: string;
  timestamp: string;
  likes: number;
  hasLiked?: boolean;
  category: 'All' | 'Photos' | 'Videos' | 'Pit Shots' | 'Merch';
}

export interface LiveShowConfig {
  enabled?: boolean;
  status: LiveStatus;
  venueName: string;
  city: string;
  dateStr: string;
  startTimeStr: string;
  initialAudienceCount: number;
  activeCamAngle: string;
  streamSources: {
    hlsUrl?: string;
    rtmpUrl?: string;
    youtubeLiveId?: string;
    twitchChannel?: string;
    kickChannel?: string;
    fallbackVideoUrl: string;
  };
  pinnedAnnouncement: {
    text: string;
    couponCode?: string;
    linkUrl?: string;
  };
  nativeAppLinks: NativeAppWatchLink[];
  fanCams: FanCamStream[];
  setlist: SetlistItem[];
  initialChatMessages: ChatMessage[];
  fanWallPosts: FanWallPost[];
}
