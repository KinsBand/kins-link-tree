import type { LiveShowConfig } from '../types/live';

export const liveConfig: LiveShowConfig = {
  status: 'live',
  venueName: 'THE CAMBRIDGE HOTEL',
  city: 'NEWCASTLE, NSW',
  dateStr: 'TONIGHT • AUG 20, 2026',
  startTimeStr: '9:30 PM AEST',
  initialAudienceCount: 340,
  activeCamAngle: 'CAM 1 • MASTER SOUNDBOARD (FOH 4K)',
  
  streamSources: {
    hlsUrl: '', // Plug HLS .m3u8 here when live
    rtmpUrl: '',
    youtubeLiveId: 'dQw4w9WgXcQ', // Fallback or direct YouTube Live stream ID
    twitchChannel: 'kinsbandofficial',
    kickChannel: 'kinsband',
    fallbackVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // or live loop
  },

  pinnedAnnouncement: {
    text: 'Merch stand is open at the back! Use code LIVE15 for 15% off official tour tees online tonight.',
    couponCode: 'LIVE15',
    linkUrl: '#merch'
  },

  nativeAppLinks: [
    {
      platform: 'YouTube',
      label: 'Watch on YouTube',
      shortLabel: 'YT',
      iconClass: 'fa-brands fa-youtube',
      color: '#ff0000',
      url: 'https://youtube.com/@kinsbandofficial/live'
    },
    {
      platform: 'Twitch',
      label: 'Watch on Twitch',
      shortLabel: 'TTV',
      iconClass: 'fa-brands fa-twitch',
      color: '#9146ff',
      url: 'https://twitch.tv/kinsbandofficial'
    },
    {
      platform: 'Kick',
      label: 'Watch on Kick',
      shortLabel: 'KICK',
      iconClass: 'fa-solid fa-bolt',
      color: '#53fc18',
      url: 'https://kick.com/kinsband'
    },
    {
      platform: 'TikTok',
      label: 'Watch on TikTok',
      shortLabel: 'TK',
      iconClass: 'fa-brands fa-tiktok',
      color: '#00f2fe',
      url: 'https://tiktok.com/@kinsbandofficial/live'
    },
    {
      platform: 'Facebook',
      label: 'Watch on Facebook',
      shortLabel: 'FB',
      iconClass: 'fa-brands fa-facebook-f',
      color: '#1877f2',
      url: 'https://facebook.com/kinsbandofficial/live'
    },
    {
      platform: 'Twitter / X',
      label: 'Watch on X',
      shortLabel: 'X',
      iconClass: 'fa-brands fa-x-twitter',
      color: '#f5f5f7',
      url: 'https://x.com/kinsbandofficial'
    }
  ],

  fanCams: [
    {
      id: 'cam-oscar',
      handle: '@oscar_',
      platform: 'TikTok',
      platformIcon: 'fa-brands fa-tiktok',
      platformColor: '#00f2fe',
      viewers: 128,
      avatarUrl: 'pfp.jpg',
      streamUrl: 'https://tiktok.com/@oscar_/live',
      angleName: 'Bass Rig & Pit Angle'
    },
    {
      id: 'cam-charlie',
      handle: '@charlie',
      platform: 'Twitch',
      platformIcon: 'fa-brands fa-twitch',
      platformColor: '#9146ff',
      viewers: 94,
      avatarUrl: 'kins-studio/pfp.jpg',
      streamUrl: 'https://twitch.tv/charlie_kins',
      angleName: 'Stage Right Guitar View'
    },
    {
      id: 'cam-fan99',
      handle: '@fan_99',
      platform: 'Kick',
      platformIcon: 'fa-solid fa-bolt',
      platformColor: '#53fc18',
      viewers: 65,
      avatarUrl: 'pfp.jpg',
      streamUrl: 'https://kick.com/fan_99_live',
      angleName: 'Front Row Barrier Cam'
    },
    {
      id: 'cam-sarah',
      handle: '@sarah_pit',
      platform: 'Instagram',
      platformIcon: 'fa-brands fa-instagram',
      platformColor: '#e1306c',
      viewers: 53,
      avatarUrl: 'kins-studio/pfp.jpg',
      streamUrl: 'https://instagram.com/sarah_pit/live',
      angleName: 'Mosh Pit Center'
    }
  ],

  setlist: [
    {
      id: 'song-1',
      order: 1,
      title: 'Neon Riot',
      artist: 'KINS',
      duration: '3:45',
      status: 'completed',
      key: 'D Minor',
      tempo: '148 BPM',
      chordsSnippet: 'Dm - Bb - C - Gm',
      tabs: `e|---------------------------|
B|---------------------------|
G|---7-7-7-7-7-7-7-7---------|
D|---7-7-7-7-7-7-7-7-8-8-8-8-|
A|---5-5-5-5-5-5-5-5-8-8-8-8-|
E|-------------------6-6-6-6-|`,
      lyrics: [
        { time: 0, text: "[Intro - Heavy Bass Riff]" },
        { time: 14, text: "Flicker in the streetlights, pulse under the skin" },
        { time: 24, text: "Counting every second till the static rushes in" },
        { time: 38, text: "We tear through the neon, no silence allowed!" },
        { time: 52, text: "Lost inside the violence of a screaming crowd!" }
      ],
      notes: 'Opened with massive fuzz lead from Charlie.'
    },
    {
      id: 'song-2',
      order: 2,
      title: 'Shadows in the Mist',
      artist: 'KINS',
      duration: '4:10',
      status: 'completed',
      key: 'A Minor',
      tempo: '132 BPM',
      chordsSnippet: 'Am - F - C - G',
      tabs: `e|---------------------------|
B|---1-1-1-1---1-1-1-1-------|
G|---2-2-2-2---2-2-2-2-------|
D|---2-2-2-2---3-3-3-3-------|
A|---0-0-0-0-----------------|
E|---------------------------|`,
      lyrics: [
        { time: 0, text: "[Guitar Chorus & Delay Intro]" },
        { time: 18, text: "Cold harbor wind cuts straight to the bone" },
        { time: 32, text: "Walking past the factories we used to call our own" },
        { time: 48, text: "Shadows in the mist, they don't want us to stay" }
      ],
      notes: 'Huge singalong during the bridge.'
    },
    {
      id: 'song-3',
      order: 3,
      title: 'Midnight Electricity',
      artist: 'KINS',
      duration: '3:58',
      status: 'active',
      key: 'E Minor',
      tempo: '155 BPM',
      chordsSnippet: 'Em - C - G - D (Chorus: Em - G - Am - B7)',
      tabs: `e|---0-0-0-0---3-3-3-3---|
B|---0-0-0-0---3-3-3-3---|
G|---0-0-0-0---0-0-0-0---|
D|---2-2-2-2---0-0-0-0---|
A|---2-2-2-2---2-2-2-2---|
E|---0-0-0-0---3-3-3-3---|
[Lead Riff / Charlie]:
e|-----------------------12~-|
B|--12b14-12-10----10-12-----|
G|--------------12-----------|
D|---------------------------|`,
      lyrics: [
        { time: 0, text: "[Verse 1 - Vivian]" },
        { time: 8, text: "Four on the floor and the amp starts to hum" },
        { time: 16, text: "Counting every heartbeat till the breakdown comes" },
        { time: 24, text: "Sweat on the frets, we are crossing the line" },
        { time: 32, text: "Midnight electricity running down the spine!" },
        { time: 44, text: "[Chorus - Full Band Explodes]" },
        { time: 48, text: "Light up the dark, burn down the wire!" },
        { time: 56, text: "We are the spark that feeds the fire!" },
        { time: 66, text: "[Guitar Solo - Charlie]" },
        { time: 80, text: "Can you feel the pulse? Can you hear the shout?!" },
        { time: 92, text: "Newcastle rock room turning inside out!" }
      ],
      notes: 'Playing now! Vivian crowd-surfing prep on Trai drum breakdown.'
    },
    {
      id: 'song-4',
      order: 4,
      title: 'Echoes of the Coast',
      artist: 'KINS',
      duration: '4:30',
      status: 'upcoming',
      key: 'C Major',
      tempo: '140 BPM',
      chordsSnippet: 'C - Em - F - G',
      tabs: `e|---0---0---1---3---|
B|---1---0---1---0---|
G|---0---0---2---0---|
D|---2---2---3---0---|
A|---3---2---3---2---|
E|-------0---1---3---|`,
      lyrics: [
        { time: 0, text: "[Fast driving rhythm]" },
        { time: 15, text: "Down along the cliff edge where the waves collide" }
      ],
      notes: 'Upcoming track in queue.'
    },
    {
      id: 'song-5',
      order: 5,
      title: '??? (Mystery Encore)',
      artist: 'KINS',
      duration: '???',
      status: 'encore',
      key: 'Secret',
      tempo: 'Fast',
      chordsSnippet: 'Crowd vote / special guest song',
      notes: 'Special encore request or unreleased b-side!'
    }
  ],

  initialChatMessages: [
    {
      id: 'msg-1',
      username: 'Sarah_Pit',
      handle: '@sarah_pit',
      avatar: 'kins-studio/pfp.jpg',
      message: 'Audio is dialed in so crisp tonight!! 🔥',
      timestamp: '9:41 PM',
      badge: { type: 'pit', label: 'PIT CREW', color: '#f2fd43' }
    },
    {
      id: 'msg-2',
      username: 'Oscar_Bass',
      handle: '@oscar_kins',
      avatar: 'pfp.jpg',
      message: 'Cambridge Hotel is PACKED wall to wall let’s goooo 🎸',
      timestamp: '9:42 PM',
      badge: { type: 'band', label: 'KINS', color: '#f2fd43' }
    },
    {
      id: 'msg-3',
      username: 'Liam_Mosh',
      handle: '@liam99',
      avatar: 'kins-studio/pfp.jpg',
      message: '🔥🎸🔥 Charlie that fuzz solo was unreal',
      timestamp: '9:43 PM',
      badge: { type: 'vip', label: 'VIP', color: '#00f2fe' }
    },
    {
      id: 'msg-4',
      username: 'Chloe_Sydney',
      handle: '@chloerocks',
      avatar: 'pfp.jpg',
      message: 'Unreal view from the pit! Stream quality is 10/10 ⚡',
      timestamp: '9:44 PM',
      badge: { type: 'mod', label: 'MOD', color: '#a855f7' }
    }
  ],

  fanWallPosts: [
    {
      id: 'wall-1',
      authorHandle: '@pit_queen',
      authorName: 'Jessie R.',
      avatarUrl: 'kins-studio/pfp.jpg',
      mediaType: 'image',
      mediaUrl: 'pfp.jpg',
      caption: 'Front row at The Cambridge! Vivian is on fire tonight 🔥 #KinsLive',
      timestamp: '2m ago',
      likes: 47,
      category: 'Pit Shots'
    },
    {
      id: 'wall-2',
      authorHandle: '@soundboard_dave',
      authorName: 'Dave M.',
      avatarUrl: 'pfp.jpg',
      mediaType: 'image',
      mediaUrl: 'kins-studio/pfp.jpg',
      caption: 'FOH Desk view. Levels are peak rock perfection 🎛️ #KinsLive',
      timestamp: '6m ago',
      likes: 82,
      category: 'Photos'
    },
    {
      id: 'wall-3',
      authorHandle: '@merch_hunter',
      authorName: 'Alex K.',
      avatarUrl: 'kins-studio/pfp.jpg',
      mediaType: 'image',
      mediaUrl: 'pfp.jpg',
      caption: 'Snagged the limited tour tee before it sells out! 🖤 #KinsLive',
      timestamp: '11m ago',
      likes: 35,
      category: 'Merch'
    },
    {
      id: 'wall-4',
      authorHandle: '@guitar_nerd',
      authorName: 'Sam T.',
      avatarUrl: 'pfp.jpg',
      mediaType: 'image',
      mediaUrl: 'kins-studio/pfp.jpg',
      caption: 'Charlie’s pedalboard setup is an absolute dream 🎸 #KinsLive',
      timestamp: '15m ago',
      likes: 64,
      category: 'Photos'
    },
    {
      id: 'wall-5',
      authorHandle: '@newy_local',
      authorName: 'Bec W.',
      avatarUrl: 'kins-studio/pfp.jpg',
      mediaType: 'image',
      mediaUrl: 'pfp.jpg',
      caption: 'Mosh pit during Midnight Electricity is absolute chaos!! 🤘 #KinsLive',
      timestamp: '19m ago',
      likes: 119,
      category: 'Pit Shots'
    },
    {
      id: 'wall-6',
      authorHandle: '@trai_drums_fan',
      authorName: 'Marcus B.',
      avatarUrl: 'pfp.jpg',
      mediaType: 'image',
      mediaUrl: 'kins-studio/pfp.jpg',
      caption: 'Trai drumming breakdown in 7/8 time had the whole room jumping! 🥁 #KinsLive',
      timestamp: '24m ago',
      likes: 91,
      category: 'Videos'
    }
  ]
};
