import { showToast } from './toast.js';

const ITUNES_CACHE = new Map();
const ITUNES_INFLIGHT_PROMISES = new Map();
const IMAGE_PRELOAD_CACHE = new Map();

// Optimized image loader with progressive quality for low-end devices
export function loadAlbumArt(imgElement, artworkUrl, highResUrl = null) {
  if (!imgElement) return Promise.resolve(false);
  
  if (IMAGE_PRELOAD_CACHE.has(artworkUrl)) {
    imgElement.src = artworkUrl;
    imgElement.classList.remove('hidden');
    return Promise.resolve(true);
  }
  
  return new Promise((resolve) => {
    const tempImg = new Image();
    const thumbUrl = artworkUrl ? artworkUrl.replace(/600x600bb\./, '100x100bb.').replace(/600x600/, '100x100') : artworkUrl;
    
    tempImg.onload = () => {
      IMAGE_PRELOAD_CACHE.set(thumbUrl, tempImg);
      imgElement.src = thumbUrl;
      imgElement.classList.remove('hidden');
      
      if (highResUrl && highResUrl !== thumbUrl) {
        const highResImg = new Image();
        highResImg.onload = () => {
          IMAGE_PRELOAD_CACHE.set(highResUrl, highResImg);
          if (imgElement.parentNode && imgElement.parentNode.contains(imgElement)) {
            imgElement.src = highResUrl;
          }
        };
        highResImg.onerror = () => resolve(true);
        highResImg.src = highResUrl;
      }
      resolve(true);
    };
    
    tempImg.onerror = () => {
      imgElement.src = artworkUrl;
      imgElement.classList.remove('hidden');
      resolve(false);
    };
    
    tempImg.src = thumbUrl;
  });
}

// Bulk prefetch for multiple tracks - fires requests in parallel with deduplication
export async function prefetchTrackArtwork(tracks) {
  if (!tracks || tracks.length === 0) return;
  
  const promises = tracks.map(async (track) => {
    if (track.coverUrl || track.artworkUrl) {
      const url = track.coverUrl || track.artworkUrl;
      if (!IMAGE_PRELOAD_CACHE.has(url)) {
        const img = new Image();
        img.src = url;
        IMAGE_PRELOAD_CACHE.set(url, img);
      }
    }
    if (track.artist && track.title && (!track.previewUrl || !track.coverUrl)) {
      const meta = await getITunesTrackData(track.artist, track.title);
      if (meta) {
        if (meta.artworkUrl) {
          track.coverUrl = meta.artworkUrl;
          track.artworkUrl = meta.artworkUrl;
          if (!IMAGE_PRELOAD_CACHE.has(meta.artworkUrl)) {
            const img = new Image();
            img.src = meta.artworkUrl;
            IMAGE_PRELOAD_CACHE.set(meta.artworkUrl, img);
          }
        }
        if (meta.previewUrl) {
          track.previewUrl = meta.previewUrl;
        }
      }
    }
  });
  
  await Promise.allSettled(promises);
}

export async function getITunesTrackData(artist, title) {
  const cacheKey = `${artist} - ${title}`.toLowerCase().trim();
  if (ITUNES_CACHE.has(cacheKey)) return ITUNES_CACHE.get(cacheKey);
  if (ITUNES_INFLIGHT_PROMISES.has(cacheKey)) return ITUNES_INFLIGHT_PROMISES.get(cacheKey);
  
  const fetchPromise = (async () => {
    try {
      const cleanTitle = (title || '').replace(/\(.*\)/g, '').replace(/\[.*\]/g, '').replace(/[!?"\\']/g, '').trim();
      const cleanArtist = (artist && artist !== 'Kins' && !artist.toLowerCase().includes('kins') && !artist.toLowerCase().includes('unreleased'))
        ? artist.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '').trim()
        : '';
      const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim());
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      let res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      let data = await res.json();

      if (!data.results || data.results.length === 0) {
        const fallbackQuery = encodeURIComponent(cleanTitle);
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 4000);
        
        res = await fetch(`https://itunes.apple.com/search?term=${fallbackQuery}&entity=song&limit=1`, {
          signal: fallbackController.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(fallbackTimeoutId);
        data = await res.json();
      }

      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const rawArt = item.artworkUrl100 || item.artworkUrl60 || null;
        const lowResUrl = rawArt;
        const highResUrl = rawArt ? rawArt.replace(/100x100bb?\./, '600x600bb.').replace(/100x100/, '600x600') : null;
        const previewUrl = item.previewUrl || null;
        const result = { 
          artworkUrl: highResUrl, 
          rawArtworkUrl: lowResUrl, 
          previewUrl,
          isHighResAvailable: !!highResUrl
        };
        ITUNES_CACHE.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn('iTunes API fetch error:', e);
    }
    const fallback = { artworkUrl: null, rawArtworkUrl: null, previewUrl: null, isHighResAvailable: false };
    ITUNES_CACHE.set(cacheKey, fallback);
    return fallback;
  })().finally(() => {
    ITUNES_INFLIGHT_PROMISES.delete(cacheKey);
  });

  ITUNES_INFLIGHT_PROMISES.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * @typedef {'Trai' | 'Vivian' | 'Oscar' | 'Charlie'} BandMember
 * 
 * @typedef {Object} InspirationTrack
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} genre - Strictly single primary genre
 * @property {string} [coverUrl]
 * @property {string} [audioUrl]
 * @property {string} [previewUrl]
 * @property {string} [artworkUrl]
 * @property {string} [duration]
 * @property {string} [quote]
 * @property {string} [icon]
 * @property {BandMember[]} curatedBy
 */

export const INSPIRATION_TRACKS = [
  {
    id: 'turnip-farm',
    title: 'Turnip Farm',
    artist: 'Dinosaur Jr.',
    genre: 'Grunge',
    duration: '4:51',
    quote: 'Sludge fuzz guitar and explosive leads',
    icon: 'fa-guitar',
    curatedBy: ['Charlie']
  },
  {
    id: 'david-bowie-six',
    title: '(David Bowie I Love You) Since I Was Six',
    artist: 'The Brian Jonestown Massacre',
    genre: 'Neo-Psychedelia',
    duration: '3:25',
    quote: 'Hypnotic drone & psych shimmer harmonies',
    icon: 'fa-eye',
    curatedBy: ['Charlie']
  },
  {
    id: 'underwear',
    title: 'Underwear',
    artist: 'Pulp',
    genre: 'Britpop',
    duration: '4:06',
    quote: 'Dramatic synth swells & cabaret tension',
    icon: 'fa-mask',
    curatedBy: ['Charlie']
  },
  {
    id: 'unmade-bed',
    title: 'Unmade Bed',
    artist: 'Sonic Youth',
    genre: 'Noise Rock',
    duration: '3:53',
    quote: 'Alternate tuning chime & raw warmth',
    icon: 'fa-bolt',
    curatedBy: ['Charlie']
  },
  {
    id: 'shes-so-loose',
    title: "She's So Loose",
    artist: 'Supergrass',
    genre: 'Britpop',
    duration: '3:42',
    quote: 'Acoustic strumming & infectious melody',
    icon: 'fa-music',
    curatedBy: ['Charlie']
  },
  {
    id: 'letter-to-elise',
    title: 'A Letter to Elise',
    artist: 'The Cure',
    genre: 'Post-Punk',
    duration: '5:12',
    quote: 'Lush melancholic jangle & romantic heartache',
    icon: 'fa-envelope',
    curatedBy: ['Vivian']
  },
  {
    id: 'cry',
    title: 'Cry',
    artist: 'The Sundays',
    genre: 'Dream Pop',
    duration: '4:06',
    quote: 'Radiant jangle-pop chime & effortless melody',
    icon: 'fa-sun',
    curatedBy: ['Vivian']
  },
  {
    id: 'one-time',
    title: 'One Time',
    artist: 'beabadoobee',
    genre: 'Bedroom Pop',
    duration: '3:05',
    quote: 'Warm acoustic strumming & bittersweet hooks',
    icon: 'fa-heart',
    curatedBy: ['Vivian']
  },
  {
    id: 'bluebeard',
    title: 'Bluebeard',
    artist: 'Cocteau Twins',
    genre: 'Dream Pop',
    duration: '3:56',
    quote: 'Lush shimmering guitars & soaring dreamscapes',
    icon: 'fa-cloud',
    curatedBy: ['Vivian']
  },
  {
    id: 'night-like-this',
    title: 'A Night Like This',
    artist: 'The Cure',
    genre: 'Post-Punk',
    duration: '4:16',
    quote: 'Moody atmospheric guitars & driving bass hooks',
    icon: 'fa-moon',
    curatedBy: ['Vivian']
  },
  {
    id: 'heroes',
    title: 'Heroes',
    artist: 'David Bowie',
    genre: 'Art Rock',
    duration: '6:11',
    quote: 'Anthemic ambient art rock & driving rhythm',
    icon: 'fa-bolt',
    curatedBy: ['Trai']
  },
  {
    id: 'jane',
    title: 'Jane!',
    artist: 'The Long Faces',
    genre: 'Art Rock',
    duration: '3:07',
    quote: 'Dramatic dynamic shifts & intricate post-punk energy',
    icon: 'fa-music',
    curatedBy: ['Trai']
  },
  {
    id: 'negative-xp',
    title: 'Mkultra Victim',
    artist: 'Negative XP',
    genre: 'Lo-Fi Punk',
    duration: '2:34',
    quote: 'Gritty lo-fi DIY chords & internet culture energy',
    icon: 'fa-fire',
    curatedBy: ['Trai']
  },
  {
    id: 'hello-juliet',
    title: 'Hello Juliet',
    artist: 'Clarion',
    genre: 'Indie Rock',
    duration: '3:28',
    quote: 'Catchy indie guitar riffs & soaring melodic hooks',
    icon: 'fa-headphones',
    curatedBy: ['Trai']
  },
  {
    id: 'made-in-japan',
    title: 'Made in Japan',
    artist: 'Buck Owens & His Buckaroos',
    genre: 'Country Rock',
    duration: '2:45',
    quote: 'Vintage twang, telecaster lead riffs & timeless songwriting',
    icon: 'fa-guitar',
    curatedBy: ['Trai']
  }
];

function chunkTracks(tracks, pageSize = 4) {
  const pages = [];
  for (let i = 0; i < tracks.length; i += pageSize) {
    pages.push(tracks.slice(i, i + pageSize));
  }
  return pages.length > 0 ? pages : [[]];
}

export const INSPIRED_ARTISTS_DATA = {
  'all': {
    name: 'All Inspirations',
    genre: 'Indie Rock / Alternative',
    bio: 'The seminal tracks, fuzz-drenched guitars, and psych hooks shaping the Kins sound.',
    iconClass: 'fa-record-vinyl',
    pages: chunkTracks(INSPIRATION_TRACKS, 4)
  },
  'trai': {
    name: 'Trai Curation',
    genre: 'Art Rock / Lo-Fi Punk / Indie',
    bio: 'Seminal songs and driving rhythms curated by Trai.',
    iconClass: 'fa-drum',
    pages: chunkTracks(INSPIRATION_TRACKS.filter(t => t.curatedBy.includes('Trai')), 4)
  },
  'vivian': {
    name: 'Vivian Curation',
    genre: 'Post-Punk / Dream Pop / Bedroom Pop',
    bio: 'Melodic hooks, ethereal soundscapes, and post-punk chime chosen by Vivian.',
    iconClass: 'fa-microphone',
    pages: chunkTracks(INSPIRATION_TRACKS.filter(t => t.curatedBy.includes('Vivian')), 4)
  },
  'oscar': {
    name: 'Oscar Curation',
    genre: 'Bass / Synths',
    bio: 'Tracks coming soon from Oscar.',
    iconClass: 'fa-sliders',
    pages: chunkTracks(INSPIRATION_TRACKS.filter(t => t.curatedBy.includes('Oscar')), 4)
  },
  'charlie': {
    name: 'Charlie Curation',
    genre: 'Grunge / Britpop / Noise Rock',
    bio: 'Sludge fuzz, Britpop melodies, and noise rock energy chosen by Charlie.',
    iconClass: 'fa-guitar',
    pages: chunkTracks(INSPIRATION_TRACKS.filter(t => t.curatedBy.includes('Charlie')), 4)
  }
};
