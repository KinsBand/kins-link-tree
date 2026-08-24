// ============================================================================
// 🎛️ HERO FEATURE CARD CONFIGURATION
// Control active state, active sub-variation, and content values here!
// ============================================================================

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  img?: string;
  icon?: string;
}

export interface HeroConfig {
  // 1. ACTIVE MAIN STATE & SUB-VARIATIONS
  activeState: 'upcoming' | 'release' | 'poll' | 'preview' | 'tour' | 'milestones' | 'livestream' | 'spotlight' | 'collab';
  
  activeUpcomingVar: 'minimal_teaser' | 'mystery_countdown';
  activeReleaseVar: 'cover_video' | 'original_single' | 'ep_preorder';
  activePollVar: 'merch_design' | 'recording_cover' | 'setlist_song' | 'city_request';
  activePreviewVar: 'inspired_demo' | 'studio_bts';
  activeTourVar: 'next_show' | 'aftermovie' | 'sold_out';
  activeMilestoneVar: 'follower_milestone' | 'stream_milestone' | 'press_quote';
  activeLivestreamVar: 'preshow' | 'live_now' | 'postshow' | 'upcoming_stream' | 'listening_party';
  activeSpotlightVar: 'member_spotlight' | 'origin_story' | 'gear_showcase';
  activeCollabVar: 'collab_single' | 'featured_playlist' | 'tiktok_challenge';

  // 2. STATE DATA VALUES
  upcoming: {
    minimal_teaser: {
      badge: string;
      title: string;
      desc: string;
    };
    mystery_countdown: {
      badge: string;
      title: string;
      targetDate: string;
    };
  };

  release: {
    cover_video: {
      title: string;
      subtitle: string;
      badge: string;
      platformIcon: string;
      footerText: string;
      embedUrl: string;
      watchUrl: string;
      coverImg: string;
    };
    original_single: {
      title: string;
      subtitle: string;
      badge: string;
      platformIcon: string;
      footerText: string;
      coverImg: string;
    };
    ep_preorder: {
      title: string;
      subtitle: string;
      badge: string;
      platformIcon: string;
      footerText: string;
      coverImg: string;
    };
  };

  poll: {
    recording_cover: {
      question: string;
      options: PollOption[];
    };
    setlist_song: {
      question: string;
      options: PollOption[];
      showCountdown: boolean;
      gigName: string;
      gigCity: string;
      targetDate: string;
    };
    merch_design: {
      question: string;
      options: PollOption[];
    };
    city_request: {
      question: string;
      options: PollOption[];
    };
  };

  preview: {
    inspired_demo: {
      title: string;
      artist: string;
      durationSeconds: number;
      coverImg: string;
    };
    studio_bts: {
      title: string;
      artist: string;
      videoUrl: string;
    };
  };

  tour: {
    next_show: {
      badge: string;
      title: string;
      venue: string;
      dateText: string;
      ticketsUrl: string;
    };
    aftermovie: {
      badge: string;
      title: string;
      venue: string;
      dateText: string;
      videoUrl: string;
    };
    sold_out: {
      badge: string;
      title: string;
      venue: string;
      dateText: string;
      ticketsUrl: string;
    };
  };

  milestones: {
    follower_milestone: {
      badge: string;
      title: string;
      countText: string;
      message: string;
    };
    stream_milestone: {
      badge: string;
      songTitle: string;
      streamCount: string;
      platform: string;
    };
    press_quote: {
      badge: string;
      quote: string;
      publication: string;
      author: string;
    };
  };

  livestream: {
    preshow: {
      statusLine: string;
      title: string;
      subtitle: string;
      leftCta: string;
      rightCta: string;
      ticketsUrl: string;
    };
    live_now: {
      statusLine: string;
      title: string;
      subtitle: string;
      leftCta: string;
      rightCta: string;
      streamUrl: string;
      viewerCount: string;
    };
    postshow: {
      statusLine: string;
      title: string;
      subtitle: string;
      leftCta: string;
      rightCta: string;
      replayUrl: string;
    };
    upcoming_stream: {
      badge: string;
      title: string;
      scheduledTime: string;
      targetDate: string;
    };
    listening_party: {
      badge: string;
      title: string;
      eventDetails: string;
    };
  };

  spotlight: {
    member_spotlight: {
      name: string;
      role: string;
      quote: string;
      img: string;
    };
    origin_story: {
      title: string;
      snippet: string;
      yearFormed: string;
    };
    gear_showcase: {
      title: string;
      items: Array<{ name: string; category: string; img: string; icon: string }>;
    };
  };

  collab: {
    collab_single: {
      badge: string;
      title: string;
      featuredArtist: string;
      releaseDate: string;
    };
    featured_playlist: {
      badge: string;
      playlistName: string;
      curator: string;
      followers: string;
    };
    tiktok_challenge: {
      badge: string;
      title: string;
      hashtag: string;
      desc: string;
    };
  };
}

export const heroConfig: HeroConfig = {
  // --------------------------------------------------------------------------
  // ⚡ QUICK CONTROLS: CHANGE ACTIVE STATE & SUB-VARIATION HERE
  // --------------------------------------------------------------------------
  activeState: 'upcoming',

  activeUpcomingVar: 'minimal_teaser',
  activeReleaseVar: 'cover_video',
  activePollVar: 'merch_design',
  activePreviewVar: 'inspired_demo',
  activeTourVar: 'next_show',
  activeMilestoneVar: 'follower_milestone',
  activeLivestreamVar: 'live_now',
  activeSpotlightVar: 'member_spotlight',
  activeCollabVar: 'collab_single',

  // --------------------------------------------------------------------------
  // 📋 CONTENT DATA VALUES FOR ALL STATES
  // --------------------------------------------------------------------------
  upcoming: {
    minimal_teaser: {
      badge: "UPCOMING RELEASE",
      title: "New music is on the way",
      desc: "First official cover coming soon..."
    },
    mystery_countdown: {
      badge: "SECRET ANNOUNCEMENT",
      title: "Something big is dropping...",
      targetDate: "2026-03-01T18:00:00"
    }
  },

  release: {
    cover_video: {
      title: "Just Like Heaven",
      subtitle: "The Cure cover • Official Kins Version",
      badge: "POST-PUNK",
      platformIcon: "fa-youtube",
      footerText: "First official cover • Out now",
      embedUrl: "https://www.youtube.com/embed/n3nPiBaiZrg?autoplay=1",
      watchUrl: "https://www.youtube.com/watch?v=n3nPiBaiZrg",
      coverImg: "/new.png"
    },
    original_single: {
      title: "Neon Shadows",
      subtitle: "Kins Debut Original Single",
      badge: "ALT-ROCK",
      platformIcon: "fa-spotify",
      footerText: "Stream now on Spotify & Apple Music",
      coverImg: "/new.png"
    },
    ep_preorder: {
      title: "Kins EP Vol. 1",
      subtitle: "5-Track Debut Vinyl & Digital",
      badge: "PRE-ORDER",
      platformIcon: "fa-compact-disc",
      footerText: "Includes exclusive bonus track • Ships March 2026",
      coverImg: "/new.png"
    }
  },

  poll: {
    recording_cover: {
      question: "What cover song should Kins record next?",
      options: [
        { id: "opt1", text: "Boys Don't Cry — The Cure", votes: 142 },
        { id: "opt2", text: "Slide Away — Oasis", votes: 98 },
        { id: "opt3", text: "Last Nite — The Strokes", votes: 64 }
      ]
    },
    setlist_song: {
      question: "What song should we add to our Sydney setlist?",
      options: [
        { id: "opt1", text: "Just Like Heaven — The Cure", votes: 210 },
        { id: "opt2", text: "Everlong — Foo Fighters", votes: 185 },
        { id: "opt3", text: "New Original Demo #3", votes: 140 }
      ],
      showCountdown: true,
      gigName: "Sydney Metro Theatre",
      gigCity: "Sydney • Mar 28",
      targetDate: "2026-03-28T20:00:00"
    },
    merch_design: {
      question: "Which T-Shirt design should we print for tour?",
      options: [
        { id: "opt1", text: "Vintage Crest Tee", votes: 165, img: "/new.png", icon: "fa-shirt" },
        { id: "opt2", text: "Newcastle Rock Tee", votes: 210, img: "/new.png", icon: "fa-tshirt" },
        { id: "opt3", text: "Minimalist Wave Tee", votes: 124, img: "/new.png", icon: "fa-vector-square" }
      ]
    },
    city_request: {
      question: "Where should Kins play our next headline show?",
      options: [
        { id: "opt1", text: "Newcastle (The Cambridge)", votes: 310 },
        { id: "opt2", text: "Sydney (Oxford Art Factory)", votes: 280 },
        { id: "opt3", text: "Wollongong (La La La's)", votes: 195 }
      ]
    }
  },

  preview: {
    inspired_demo: {
      title: "Chemical Fires",
      artist: "Kins (Unreleased Demo)",
      durationSeconds: 30,
      coverImg: "/new.png",
      audioUrl: ""
    },
    studio_bts: {
      title: "Recording Guitars at Newcastle Studio",
      artist: "Behind The Scenes Vlog",
      videoUrl: "https://www.youtube.com/embed/n3nPiBaiZrg?autoplay=1"
    }
  },

  tour: {
    next_show: {
      badge: "LIVE SHOW",
      title: "Kins Live in Sydney",
      venue: "Metro Theatre • Sydney",
      dateText: "Saturday Mar 28 • 8:00 PM",
      ticketsUrl: "https://www.bandsintown.com"
    },
    aftermovie: {
      badge: "SHOW RECAP",
      title: "Newcastle Concert Highlights",
      venue: "The Cambridge Hotel • Newcastle",
      dateText: "Watch the live show recap video",
      videoUrl: "https://www.youtube.com/embed/n3nPiBaiZrg?autoplay=1"
    },
    sold_out: {
      badge: "SOLD OUT",
      title: "Sydney Show Sold Out!",
      venue: "Metro Theatre • Sydney",
      dateText: "2nd Newcastle show added for Sunday Mar 29",
      ticketsUrl: "https://www.bandsintown.com"
    }
  },

  milestones: {
    follower_milestone: {
      badge: "BAND MILESTONE",
      title: "10,000 Followers!",
      countText: "10K CREW STRONG",
      message: "Huge thank you to everyone supporting Kins. Live drop coming soon!"
    },
    stream_milestone: {
      badge: "SPOTIFY MILESTONE",
      songTitle: "Just Like Heaven",
      streamCount: "100,000+ STREAMS",
      platform: "Spotify"
    },
    press_quote: {
      badge: "PRESS REVIEW",
      quote: "Newcastle's most exciting new post-punk act delivering raw energy and infectious energy.",
      publication: "Tone Deaf Magazine",
      author: "Music Editor Review"
    }
  },

  livestream: {
    preshow: {
      statusLine: "🟡 Doors Open 7:30 PM • Set at 9:00 PM",
      title: "KINS at The Cambridge Hotel",
      subtitle: "Headline Tour • Newcastle, NSW",
      leftCta: "🎟️ GET TICKETS / INFO",
      rightCta: "🔔 NOTIFY ME",
      ticketsUrl: "https://www.bandsintown.com"
    },
    live_now: {
      statusLine: "🔴 Now Playing: Midnight Electricity",
      title: "KINS LIVE BROADCAST",
      subtitle: "Master Band Feed & Pit Fan-Cams",
      leftCta: "⚡ ENTER LIVE",
      rightCta: "📤 UPLOAD VIDEO",
      streamUrl: "/live",
      viewerCount: "342 watching"
    },
    postshow: {
      statusLine: "🏁 Show Concluded • Thanks for coming!",
      title: "Relive KINS Live in Newcastle",
      subtitle: "Full Concert Master Replay & Fan Wall",
      leftCta: "▶️ RELIVE SHOW (REPLAY)",
      rightCta: "📸 UPLOAD FOOTAGE",
      replayUrl: "/live"
    },
    upcoming_stream: {
      badge: "UPCOMING LIVESTREAM",
      title: "Live Q&A & Unreleased Song Teaser",
      scheduledTime: "Tonight • 8:00 PM AEST",
      targetDate: "2026-03-01T20:00:00"
    },
    listening_party: {
      badge: "EXCLUSIVE EVENT",
      title: "EP Vol. 1 Fan Listening Party",
      eventDetails: "Join Kins live on Discord & YouTube for the first spin."
    }
  },

  spotlight: {
    member_spotlight: {
      name: "Jack Kins",
      role: "Lead Vocals & Guitar",
      quote: "Heavy reverbs, post-punk basslines, and playing loud is all that matters.",
      img: "/new.png"
    },
    origin_story: {
      title: "Born in Newcastle, Australia",
      snippet: "Formed in late 2024, Kins bridges energetic 80s post-punk with modern alternative indie soundscapes.",
      yearFormed: "EST. 2024"
    },
    gear_showcase: {
      title: "Signature Band Gear",
      items: [
        { name: "Fender Jazzmaster", category: "Guitar", img: "/new.png", icon: "fa-guitar" },
        { name: "Vox AC30 Top Boost", category: "Amp", img: "/new.png", icon: "fa-bullhorn" },
        { name: "Strymon BigSky", category: "Reverb", img: "/new.png", icon: "fa-sliders" }
      ]
    }
  },

  collab: {
    collab_single: {
      badge: "COLLAB DROP",
      title: "Shadows (feat. Coastal Wave)",
      featuredArtist: "Kins x Coastal Wave",
      releaseDate: "Out Worldwide"
    },
    featured_playlist: {
      badge: "PLAYLIST FEATURE",
      playlistName: "Aussie Indie Rock Weekly",
      curator: "Spotify Official",
      followers: "45K Followers"
    },
    tiktok_challenge: {
      badge: "FAN CHALLENGE",
      title: "Cover Just Like Heaven",
      hashtag: "#KinsCoverChallenge",
      desc: "Tag @KinsBand on TikTok or Reels for a repost!"
    }
  }
};
