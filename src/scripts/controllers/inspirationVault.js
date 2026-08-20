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

export const INSPIRED_ARTISTS_DATA = {
  'all': {
    name: 'All Inspirations',
    genre: 'Indie Rock / Alternative / Psychedelic',
    bio: 'The seminal tracks, fuzz-drenched guitars, and psych hooks shaping the Kins sound.',
    iconClass: 'fa-record-vinyl',
    pages: [
      [
        { title: 'Turnip Farm', artist: 'Dinosaur Jr.', duration: '4:51', genre: 'Alt Rock / Grunge', quote: 'Sludge fuzz guitar and explosive leads', icon: 'fa-guitar' },
        { title: '(David Bowie I Love You) Since I Was Six', artist: 'The Brian Jonestown Massacre', duration: '3:25', genre: 'Neo-Psychedelia', quote: 'Hypnotic drone & psych shimmer harmonies', icon: 'fa-eye' },
        { title: 'Underwear', artist: 'Pulp', duration: '4:06', genre: 'Britpop / Art Pop', quote: 'Dramatic synth swells & cabaret tension', icon: 'fa-mask' },
        { title: 'Unmade Bed', artist: 'Sonic Youth', duration: '3:53', genre: 'Noise Rock / Post-Punk', quote: 'Alternate tuning chime & raw warmth', icon: 'fa-bolt' }
      ],
      [
        { title: "She's So Loose", artist: 'Supergrass', duration: '3:42', genre: 'Britpop / Acoustic Rock', quote: 'Acoustic strumming & infectious melody', icon: 'fa-music' },
        { title: 'One Time', artist: 'beabadoobee', duration: '3:05', genre: 'Indie Rock / Bedroom Pop', quote: 'Warm acoustic strumming & bittersweet hooks', icon: 'fa-heart' },
        { title: 'Bluebeard', artist: 'Cocteau Twins', duration: '3:56', genre: 'Dream Pop / Ethereal Wave', quote: 'Lush shimmering guitars & soaring dreamscapes', icon: 'fa-cloud' },
        { title: 'A Letter to Elise', artist: 'The Cure', duration: '5:12', genre: 'Post-Punk / Jangle Pop', quote: 'Lush melancholic jangle & romantic heartache', icon: 'fa-envelope' }
      ],
      [
        { title: 'Cry', artist: 'The Sundays', duration: '4:06', genre: 'Dream Pop / Jangle Pop', quote: 'Radiant jangle-pop chime & effortless melody', icon: 'fa-sun' },
        { title: 'A Night Like This', artist: 'The Cure', duration: '4:16', genre: 'Post-Punk / New Wave', quote: 'Moody atmospheric guitars & driving bass hooks', icon: 'fa-moon' },
        { title: 'Heroes', artist: 'David Bowie', duration: '6:11', genre: 'Art Rock / Glam Rock', quote: 'Anthemic ambient art rock & driving rhythm', icon: 'fa-bolt' },
        { title: 'Jane!', artist: 'The Long Faces', duration: '3:07', genre: 'Art Rock / Post-Punk', quote: 'Dramatic dynamic shifts & intricate post-punk energy', icon: 'fa-music' }
      ],
      [
        { title: 'negative xp - autism', artist: 'Quandale Dingle', duration: '2:34', genre: 'Lo-Fi Punk / Internet Rock', quote: 'Gritty lo-fi DIY chords & internet culture energy', icon: 'fa-fire' },
        { title: 'Hello Juliet', artist: 'Clarion', duration: '3:28', genre: 'Indie Rock / Alternative', quote: 'Catchy indie guitar riffs & soaring melodic hooks', icon: 'fa-headphones' },
        { title: 'Made in Japan', artist: 'Buck Owens & His Buckaroos', duration: '2:45', genre: 'Bakersfield Country / Classic Rock', quote: 'Vintage twang, telecaster lead riffs & timeless songwriting', icon: 'fa-guitar' }
      ]
    ]
  },
  'beabadoobee': {
    name: 'beabadoobee',
    genre: 'Indie Rock / Bedroom Pop / Alt Rock',
    bio: 'Nostalgic 90s alt-rock riffs, sweet confessional lyrics, and fuzz-pop melodies.',
    iconClass: 'fa-heart',
    pages: [
      [
        { title: 'One Time', artist: 'beabadoobee', duration: '3:05', genre: 'Indie Rock / Bedroom Pop', quote: 'Warm acoustic strumming & bittersweet hooks', icon: 'fa-heart' }
      ]
    ]
  },
  'cocteau-twins': {
    name: 'Cocteau Twins',
    genre: 'Dream Pop / Ethereal Wave / Shoegaze',
    bio: 'Cascading chorus pedals, ethereal soundscapes, and otherworldly vocal magic.',
    iconClass: 'fa-cloud',
    pages: [
      [
        { title: 'Bluebeard', artist: 'Cocteau Twins', duration: '3:56', genre: 'Dream Pop / Ethereal Wave', quote: 'Lush shimmering guitars & soaring dreamscapes', icon: 'fa-cloud' }
      ]
    ]
  },
  'the-cure': {
    name: 'The Cure',
    genre: 'Post-Punk / Gothic Rock / New Wave',
    bio: 'Emotive melancholia, intricate flanged guitars, and legendary atmospheric post-punk.',
    iconClass: 'fa-moon',
    pages: [
      [
        { title: 'A Letter to Elise', artist: 'The Cure', duration: '5:12', genre: 'Post-Punk / Jangle Pop', quote: 'Lush melancholic jangle & romantic heartache', icon: 'fa-envelope' },
        { title: 'A Night Like This', artist: 'The Cure', duration: '4:16', genre: 'Post-Punk / New Wave', quote: 'Moody atmospheric guitars & driving bass hooks', icon: 'fa-moon' }
      ]
    ]
  },
  'cure': {
    name: 'The Cure',
    genre: 'Post-Punk / Gothic Rock / New Wave',
    bio: 'Emotive melancholia, intricate flanged guitars, and legendary atmospheric post-punk.',
    iconClass: 'fa-moon',
    pages: [
      [
        { title: 'A Letter to Elise', artist: 'The Cure', duration: '5:12', genre: 'Post-Punk / Jangle Pop', quote: 'Lush melancholic jangle & romantic heartache', icon: 'fa-envelope' },
        { title: 'A Night Like This', artist: 'The Cure', duration: '4:16', genre: 'Post-Punk / New Wave', quote: 'Moody atmospheric guitars & driving bass hooks', icon: 'fa-moon' }
      ]
    ]
  },
  'the-sundays': {
    name: 'The Sundays',
    genre: 'Dream Pop / Jangle Pop / Indie Pop',
    bio: 'Bright jangle-pop guitars, soaring melodic vocals, and acoustic warmth.',
    iconClass: 'fa-sun',
    pages: [
      [
        { title: 'Cry', artist: 'The Sundays', duration: '4:06', genre: 'Dream Pop / Jangle Pop', quote: 'Radiant jangle-pop chime & effortless melody', icon: 'fa-sun' }
      ]
    ]
  },
  'sundays': {
    name: 'The Sundays',
    genre: 'Dream Pop / Jangle Pop / Indie Pop',
    bio: 'Bright jangle-pop guitars, soaring melodic vocals, and acoustic warmth.',
    iconClass: 'fa-sun',
    pages: [
      [
        { title: 'Cry', artist: 'The Sundays', duration: '4:06', genre: 'Dream Pop / Jangle Pop', quote: 'Radiant jangle-pop chime & effortless melody', icon: 'fa-sun' }
      ]
    ]
  },
  'dinosaur-jr': {
    name: 'Dinosaur Jr.',
    genre: 'Alternative Rock / Grunge / Noise Pop',
    bio: 'Heavy wall-of-sound fuzz, melancholic drawl, and shredding guitar leads.',
    iconClass: 'fa-guitar',
    pages: [
      [
        { title: 'Turnip Farm', artist: 'Dinosaur Jr.', duration: '4:51', genre: 'Alt Rock / Grunge', quote: 'Sludge fuzz guitar and explosive leads', icon: 'fa-guitar' }
      ]
    ]
  },
  'brian-jonestown-massacre': {
    name: 'The Brian Jonestown Massacre',
    genre: 'Neo-Psychedelia / Shoegaze / Folk Rock',
    bio: 'Hypnotic drone, 12-string acoustic jangles, and vintage psych mysticism.',
    iconClass: 'fa-eye',
    pages: [
      [
        { title: '(David Bowie I Love You) Since I Was Six', artist: 'The Brian Jonestown Massacre', duration: '3:25', genre: 'Neo-Psychedelia', quote: 'Hypnotic drone & psych shimmer harmonies', icon: 'fa-eye' }
      ]
    ]
  },
  'the-brian-jonestown-massacre': {
    name: 'The Brian Jonestown Massacre',
    genre: 'Neo-Psychedelia / Shoegaze / Folk Rock',
    bio: 'Hypnotic drone, 12-string acoustic jangles, and vintage psych mysticism.',
    iconClass: 'fa-eye',
    pages: [
      [
        { title: '(David Bowie I Love You) Since I Was Six', artist: 'The Brian Jonestown Massacre', duration: '3:25', genre: 'Neo-Psychedelia', quote: 'Hypnotic drone & psych shimmer harmonies', icon: 'fa-eye' }
      ]
    ]
  },
  'pulp': {
    name: 'Pulp',
    genre: 'Britpop / Art Pop / Glam Rock',
    bio: 'Dramatic storytelling, disco-infused synthpop grooves, and theatrical British pop.',
    iconClass: 'fa-compact-disc',
    pages: [
      [
        { title: 'Underwear', artist: 'Pulp', duration: '4:06', genre: 'Britpop / Art Pop', quote: 'Dramatic synth swells & cabaret tension', icon: 'fa-mask' }
      ]
    ]
  },
  'sonic-youth': {
    name: 'Sonic Youth',
    genre: 'Noise Rock / Post-Punk / Alt Rock',
    bio: 'Experimental tunings, dissonant feedback art, and NYC post-punk coolness.',
    iconClass: 'fa-bolt',
    pages: [
      [
        { title: 'Unmade Bed', artist: 'Sonic Youth', duration: '3:53', genre: 'Noise Rock / Post-Punk', quote: 'Alternate tuning chime & raw warmth', icon: 'fa-bolt' }
      ]
    ]
  },
  'supergrass': {
    name: 'Supergrass',
    genre: 'Britpop / Glam Rock / Acoustic Rock',
    bio: 'Energetic britpop melodies, soulful harmonies, and sunny melodic hooks.',
    iconClass: 'fa-music',
    pages: [
      [
        { title: "She's So Loose", artist: 'Supergrass', duration: '3:42', genre: 'Britpop / Acoustic Rock', quote: 'Acoustic strumming & infectious melody', icon: 'fa-music' }
      ]
    ]
  },
  'david-bowie': {
    name: 'David Bowie',
    genre: 'Art Rock / Glam Rock / Post-Punk',
    bio: 'Chameleon sonic genius, soaring anthems, and timeless visionary rock songwriting.',
    iconClass: 'fa-bolt',
    pages: [
      [
        { title: 'Heroes', artist: 'David Bowie', duration: '6:11', genre: 'Art Rock / Glam Rock', quote: 'Anthemic ambient art rock & driving rhythm', icon: 'fa-bolt' }
      ]
    ]
  },
  'the-long-faces': {
    name: 'The Long Faces',
    genre: 'Art Rock / Post-Punk / Baroque Pop',
    bio: 'Intricate progressive dynamics, melodic math-rock rhythms, and dramatic post-punk vigor.',
    iconClass: 'fa-music',
    pages: [
      [
        { title: 'Jane!', artist: 'The Long Faces', duration: '3:07', genre: 'Art Rock / Post-Punk', quote: 'Dramatic dynamic shifts & intricate post-punk energy', icon: 'fa-music' }
      ]
    ]
  },
  'long-faces': {
    name: 'The Long Faces',
    genre: 'Art Rock / Post-Punk / Baroque Pop',
    bio: 'Intricate progressive dynamics, melodic math-rock rhythms, and dramatic post-punk vigor.',
    iconClass: 'fa-music',
    pages: [
      [
        { title: 'Jane!', artist: 'The Long Faces', duration: '3:07', genre: 'Art Rock / Post-Punk', quote: 'Dramatic dynamic shifts & intricate post-punk energy', icon: 'fa-music' }
      ]
    ]
  },
  'quandale-dingle': {
    name: 'Quandale Dingle',
    genre: 'Lo-Fi Punk / Internet Rock',
    bio: 'Viral internet culture, raw DIY indie punk distortion, and quirky underground energy.',
    iconClass: 'fa-fire',
    pages: [
      [
        { title: 'negative xp - autism', artist: 'Quandale Dingle', duration: '2:34', genre: 'Lo-Fi Punk / Internet Rock', quote: 'Gritty lo-fi DIY chords & internet culture energy', icon: 'fa-fire' }
      ]
    ]
  },
  'clarion': {
    name: 'Clarion',
    genre: 'Indie Rock / Alternative',
    bio: 'Driving melodic indie guitars, heartfelt vocal hooks, and jangly alternative warmth.',
    iconClass: 'fa-headphones',
    pages: [
      [
        { title: 'Hello Juliet', artist: 'Clarion', duration: '3:28', genre: 'Indie Rock / Alternative', quote: 'Catchy indie guitar riffs & soaring melodic hooks', icon: 'fa-headphones' }
      ]
    ]
  },
  'buck-owens': {
    name: 'Buck Owens and The Buckaroos',
    genre: 'Bakersfield Sound / Classic Country Rock',
    bio: 'Pioneering crisp Telecaster twang, infectious rhythm drive, and legendary songwriting.',
    iconClass: 'fa-guitar',
    pages: [
      [
        { title: 'Made in Japan', artist: 'Buck Owens & His Buckaroos', duration: '2:45', genre: 'Bakersfield Country / Classic Rock', quote: 'Vintage twang, telecaster lead riffs & timeless songwriting', icon: 'fa-guitar' }
      ]
    ]
  },
  'buck-owens-and-the-buckaroos': {
    name: 'Buck Owens and The Buckaroos',
    genre: 'Bakersfield Sound / Classic Country Rock',
    bio: 'Pioneering crisp Telecaster twang, infectious rhythm drive, and legendary songwriting.',
    iconClass: 'fa-guitar',
    pages: [
      [
        { title: 'Made in Japan', artist: 'Buck Owens & His Buckaroos', duration: '2:45', genre: 'Bakersfield Country / Classic Rock', quote: 'Vintage twang, telecaster lead riffs & timeless songwriting', icon: 'fa-guitar' }
      ]
    ]
  }
};
