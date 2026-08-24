import type { LiveShowConfig } from '../types/live';

export const liveConfig: LiveShowConfig = {
  enabled: true,
  // 'offline' = honest standby page (no fabricated show).
  // Flip to 'live' + fill streamSources/setlist on gig night.
  mode: 'offline',
  status: 'offline',
  venueName: 'THE CAMBRIDGE HOTEL',
  city: 'NEWCASTLE, NSW',
  dateStr: 'NEXT SHOW • TBA',
  startTimeStr: '',
  initialAudienceCount: 0,
  activeCamAngle: '',

  streamSources: {
    hlsUrl: '', // Plug HLS .m3u8 here when live
    rtmpUrl: '',
    youtubeLiveId: '', // YouTube Live stream ID on gig night
    twitchChannel: 'kinsbandofficial',
    kickChannel: 'kinsband',
    fallbackVideoUrl: ''
  },

  pinnedAnnouncement: {
    text: 'Subscribe below and get pinged the second we go LIVE.',
    couponCode: '',
    linkUrl: '/#subscribeFormSection'
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

  // Real fan co-streams get added here on gig night — never seed fictional cams.
  fanCams: [],

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

  // Seeded chat is disabled — real chat starts empty on the night.
  initialChatMessages: [],

  // Fan-wall seed posts removed; real approved uploads hydrate from /api/fan-wall.
  fanWallPosts: []
};
