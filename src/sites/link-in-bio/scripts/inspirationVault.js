import { showToast } from './toast.js';

const ITUNES_CACHE = {};
const IMAGE_PRELOAD_CACHE = new Map();

// Optimized image loader with progressive quality for low-end devices
export function loadAlbumArt(imgElement, artworkUrl, highResUrl = null) {
  if (!imgElement) return Promise.resolve(false);
  
  // Check if already cached in memory
  if (IMAGE_PRELOAD_CACHE.has(artworkUrl)) {
    imgElement.src = artworkUrl;
    imgElement.classList.remove('hidden');
    return Promise.resolve(true);
  }
  
  return new Promise((resolve) => {
    const tempImg = new Image();
    
    // For low-end devices: use smaller thumbnail first (100x100)
    const thumbUrl = artworkUrl ? artworkUrl.replace(/600x600bb\./, '100x100bb.').replace(/600x600/, '100x100') : artworkUrl;
    
    tempImg.onload = () => {
      IMAGE_PRELOAD_CACHE.set(thumbUrl, tempImg);
      imgElement.src = thumbUrl;
      imgElement.classList.remove('hidden');
      
      // Progressive enhancement: load high-res in background if available
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
      // Fallback to original URL
      imgElement.src = artworkUrl;
      imgElement.classList.remove('hidden');
      resolve(false);
    };
    
    tempImg.src = thumbUrl;
  });
}

// Bulk prefetch for multiple tracks - fires all requests in parallel
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
    } else if (track.artist && track.title) {
      // Fetch metadata in background
      getITunesTrackData(track.artist, track.title).then(meta => {
        if (meta && meta.artworkUrl) {
          track.coverUrl = meta.artworkUrl;
          track.artworkUrl = meta.artworkUrl;
          const img = new Image();
          img.src = meta.artworkUrl;
          IMAGE_PRELOAD_CACHE.set(meta.artworkUrl, img);
        }
      });
    }
  });
  
  // Don't wait for completion - fire and forget for speed
  Promise.allSettled(promises);
}

export async function getITunesTrackData(artist, title) {
  const cacheKey = `${artist} - ${title}`.toLowerCase();
  if (ITUNES_CACHE[cacheKey]) return ITUNES_CACHE[cacheKey];
  
  try {
    const cleanTitle = title.replace(/[!?"\\']/g, '').trim();
    const query = encodeURIComponent(`${artist} ${cleanTitle}`);
    
    // Use AbortController for timeout on slow connections
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    
    let res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    let data = await res.json();

    if (!data.results || data.results.length === 0) {
      const fallbackQuery = encodeURIComponent(cleanTitle);
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 3000);
      
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
      // Get both low-res (for instant display) and high-res (for retina/zoom)
      const lowResUrl = rawArt;
      const highResUrl = rawArt ? rawArt.replace(/100x100bb?\./, '600x600bb.').replace(/100x100/, '600x600') : null;
      const previewUrl = item.previewUrl || null;
      const result = { 
        artworkUrl: highResUrl, 
        rawArtworkUrl: lowResUrl, 
        previewUrl,
        isHighResAvailable: !!highResUrl
      };
      ITUNES_CACHE[cacheKey] = result;
      return result;
    }
  } catch (e) {
    console.warn('iTunes API fetch error:', e);
  }
  const fallback = { artworkUrl: null, rawArtworkUrl: null, previewUrl: null, isHighResAvailable: false };
  ITUNES_CACHE[cacheKey] = fallback;
  return fallback;
}

export const INSPIRED_ARTISTS_DATA = {
  'the-cure': {
    name: 'The Cure',
    genre: 'Post-Punk / Goth Rock / New Wave',
    bio: 'Shimmering post-punk guitars, atmospheric basslines, and melancholic pop melodies.',
    iconClass: 'fa-heart',
    pages: [
      [
        { title: 'Just Like Heaven', artist: 'The Cure', duration: '3:32', genre: 'Post-Punk', quote: 'Shimmering guitar chorus & bass drive', icon: 'fa-heart' },
        { title: "Boys Don't Cry", artist: 'The Cure', duration: '2:37', genre: 'Post-Punk', quote: 'Bouncy guitar riff & iconic vocal hook', icon: 'fa-bolt' },
        { title: "Friday I'm in Love", artist: 'The Cure', duration: '3:35', genre: 'Jangle Pop', quote: 'Uplifting 12-string guitar jangle', icon: 'fa-sun' },
        { title: 'Lovesong', artist: 'The Cure', duration: '3:29', genre: 'Goth Rock', quote: 'Melodic bassline & lush synth arrangement', icon: 'fa-music' }
      ]
    ]
  },
  'weezer': {
    name: 'Weezer',
    genre: 'Alternative Rock / Power Pop',
    bio: 'Crunchy fuzz guitar riffs, anthemic power pop harmonies, and raw emotional hooks.',
    iconClass: 'fa-glasses',
    pages: [
      [
        { title: 'Do You Wanna Get High?', artist: 'Weezer', duration: '3:27', genre: 'Alt Rock', quote: 'Pinkerton-era heavy fuzz guitar crunch', icon: 'fa-fire' },
        { title: 'Go Away', artist: 'Weezer', duration: '3:13', genre: 'Power Pop', quote: 'Catchy dual-vocal power pop harmony', icon: 'fa-guitar' },
        { title: 'Jamie', artist: 'Weezer', duration: '4:19', genre: 'Power Pop', quote: 'Raw early Weezer garage charm', icon: 'fa-radio' },
        { title: 'Hash Pipe', artist: 'Weezer', duration: '3:06', genre: 'Heavy Power Pop', quote: 'Aggressive staccato riffing & driving beat', icon: 'fa-drum' }
      ],
      [
        { title: 'Pink Triangle', artist: 'Weezer', duration: '3:58', genre: 'Power Pop', quote: 'Heartfelt distortion & anthemic chorus', icon: 'fa-compact-disc' },
        { title: 'Buddy Holly', artist: 'Weezer', duration: '2:39', genre: 'Power Pop', quote: 'Iconic synth-guitar lead & tight rhythm', icon: 'fa-headphones' },
        { title: 'Across The Sea', artist: 'Weezer', duration: '4:32', genre: 'Alt Rock', quote: 'Dynamic arrangement & soaring guitar solo', icon: 'fa-sliders' }
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
        { title: 'Common People', artist: 'Pulp', duration: '5:51', genre: 'Britpop', quote: 'Building crescendo synth & theatrical delivery', icon: 'fa-layer-group' },
        { title: 'Babies', artist: 'Pulp', duration: '4:04', genre: 'Britpop', quote: 'Driving bassline & storytelling lyrics', icon: 'fa-microphone' },
        { title: 'Do You Remember the First Time?', artist: 'Pulp', duration: '4:22', genre: 'Britpop', quote: 'Melodic guitar riff & bittersweet vocal hook', icon: 'fa-certificate' },
        { title: 'Underwear', artist: 'Pulp', duration: '4:06', genre: 'Britpop', quote: 'Dramatic synth swells & cabaret tension', icon: 'fa-mask' }
      ],
      [
        { title: 'I Want You', artist: 'Pulp', duration: '4:42', genre: 'Alt Rock', quote: 'Raw emotional guitar crunch & pulse', icon: 'fa-fire' },
        { title: 'Have You Seen Her Lately?', artist: 'Pulp', duration: '4:21', genre: 'Chamber Pop', quote: 'Lush orchestral pop textures & storytelling', icon: 'fa-eye' }
      ]
    ]
  },
  'the-long-faces': {
    name: 'The Long Faces',
    genre: 'Art Rock / Math Rock / Neo-Psychedelia',
    bio: 'Complex polyrhythms, intricate jazzy guitar weaves, and theatrical art-rock arrangements.',
    iconClass: 'fa-masks-theater',
    pages: [
      [
        { title: 'Jane!', artist: 'The Long Faces', duration: '3:45', genre: 'Art Rock', quote: 'Complex polyrhythms & theatrical vocals', icon: 'fa-masks-theater' },
        { title: 'Cadillac', artist: 'The Long Faces', duration: '4:12', genre: 'Art Rock', quote: 'Jazzy guitar weaves & dramatic brass energy', icon: 'fa-car' },
        { title: 'Sail Away', artist: 'The Long Faces', duration: '3:58', genre: 'Indie Rock', quote: 'Swelling guitar textures & soaring hooks', icon: 'fa-compass' },
        { title: 'Documentaries', artist: 'The Long Faces', duration: '4:05', genre: 'Art Rock', quote: 'Intricate basswork & cinematic dynamics', icon: 'fa-film' }
      ],
      [
        { title: 'Oberon', artist: 'The Long Faces', duration: '3:50', genre: 'Math Rock', quote: 'Energetic math-rock tempo changes', icon: 'fa-bolt' }
      ]
    ]
  }
};
