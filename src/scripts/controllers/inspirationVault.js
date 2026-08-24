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
    curatedBy: ['Charlie'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/69/9c/19/699c1988-6817-1003-58e4-b6b8250c174c/mzaf_12252388732781124241.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/71/91/47/719147c4-3f14-7e7f-b2ad-0962765e437b/5037300860169.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/71/91/47/719147c4-3f14-7e7f-b2ad-0962765e437b/5037300860169.jpg/600x600bb.jpg'
  },
  {
    id: 'david-bowie-six',
    title: '(David Bowie I Love You) Since I Was Six',
    artist: 'The Brian Jonestown Massacre',
    genre: 'Neo-Psychedelia',
    duration: '3:25',
    quote: 'Hypnotic drone & psych shimmer harmonies',
    icon: 'fa-eye',
    curatedBy: ['Charlie'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c5/8a/69/c58a69ac-eeeb-487e-a384-1a5e451aec37/mzaf_9543187617730244572.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/03/44/d1/0344d1eb-92d1-bbab-61bd-574918e4c357/5056321604101.png/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/03/44/d1/0344d1eb-92d1-bbab-61bd-574918e4c357/5056321604101.png/600x600bb.jpg'
  },
  {
    id: 'underwear',
    title: 'Underwear',
    artist: 'Pulp',
    genre: 'Britpop',
    duration: '4:06',
    quote: 'Dramatic synth swells & cabaret tension',
    icon: 'fa-mask',
    curatedBy: ['Charlie'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e5/f5/ef/e5f5efa2-5cf2-1501-6c5f-62c97f6be74c/mzaf_11860358743889143363.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a7/4c/c7/a74cc719-a64b-66f7-c8c4-ee3a23b40037/00731452416520.rgb.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a7/4c/c7/a74cc719-a64b-66f7-c8c4-ee3a23b40037/00731452416520.rgb.jpg/600x600bb.jpg'
  },
  {
    id: 'unmade-bed',
    title: 'Unmade Bed',
    artist: 'Sonic Youth',
    genre: 'Noise Rock',
    duration: '3:53',
    quote: 'Alternate tuning chime & raw warmth',
    icon: 'fa-bolt',
    curatedBy: ['Charlie'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/bc/ea/0c/bcea0c87-f545-f719-0926-eaa4ea1edd44/mzaf_7481279777170286080.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d0/7e/9e/d07e9e8d-31b6-3e05-19a7-2ef409d03fa0/00602547857873.rgb.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d0/7e/9e/d07e9e8d-31b6-3e05-19a7-2ef409d03fa0/00602547857873.rgb.jpg/600x600bb.jpg'
  },
  {
    id: 'shes-so-loose',
    title: "She's So Loose",
    artist: 'Supergrass',
    genre: 'Britpop',
    duration: '3:42',
    quote: 'Acoustic strumming & infectious melody',
    icon: 'fa-music',
    curatedBy: ['Charlie'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4f/8a/15/4f8a1540-ed3e-0777-de6d-fac2f25f8e91/mzaf_17125224574096335438.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/1a/ca/4c/1aca4c8a-1a13-bf78-969c-c8987600105c/0825646075690.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/1a/ca/4c/1aca4c8a-1a13-bf78-969c-c8987600105c/0825646075690.jpg/600x600bb.jpg'
  },
  {
    id: 'letter-to-elise',
    title: 'A Letter to Elise',
    artist: 'The Cure',
    genre: 'Post-Punk',
    duration: '5:12',
    quote: 'Lush melancholic jangle & romantic heartache',
    icon: 'fa-envelope',
    curatedBy: ['Vivian'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/6f/1e/93/6f1e93a8-e518-67da-69da-b2accb39dd0c/mzaf_1367715278569191034.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/49/99/b4/4999b482-ac72-6aa2-0016-a6924355e72e/dj.tyyqcstw.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/49/99/b4/4999b482-ac72-6aa2-0016-a6924355e72e/dj.tyyqcstw.jpg/600x600bb.jpg'
  },
  {
    id: 'cry',
    title: 'Cry',
    artist: 'The Sundays',
    genre: 'Dream Pop',
    duration: '4:06',
    quote: 'Radiant jangle-pop chime & effortless melody',
    icon: 'fa-sun',
    curatedBy: ['Vivian'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ec/5c/62/ec5c6229-4c2b-dbef-45b7-d602ad1020ad/mzaf_16522877187135004187.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/fe/bb/e7febbf1-551b-2330-4b45-108d54ce2f88/00720642513125.rgb.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/e7/fe/bb/e7febbf1-551b-2330-4b45-108d54ce2f88/00720642513125.rgb.jpg/600x600bb.jpg'
  },
  {
    id: 'one-time',
    title: 'One Time',
    artist: 'beabadoobee',
    genre: 'Bedroom Pop',
    duration: '3:05',
    quote: 'Warm acoustic strumming & bittersweet hooks',
    icon: 'fa-heart',
    curatedBy: ['Vivian'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6e/a6/aa/6ea6aaf5-9cfc-1222-b507-57575506296f/mzaf_18273886802624513535.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/78/fa/f7/78faf7a9-97c0-5aa7-df1e-547da9703178/196922946356_Cover.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/78/fa/f7/78faf7a9-97c0-5aa7-df1e-547da9703178/196922946356_Cover.jpg/600x600bb.jpg'
  },
  {
    id: 'bluebeard',
    title: 'Bluebeard',
    artist: 'Cocteau Twins',
    genre: 'Dream Pop',
    duration: '3:56',
    quote: 'Lush shimmering guitars & soaring dreamscapes',
    icon: 'fa-cloud',
    curatedBy: ['Vivian'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/85/a3/93/85a39331-cdb6-613f-ed5b-0e026f84111b/mzaf_13664396417576168646.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/a9/52/fd/a952fd47-cbbd-261e-e487-467a03fd5318/191400071469.png/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/a9/52/fd/a952fd47-cbbd-261e-e487-467a03fd5318/191400071469.png/600x600bb.jpg'
  },
  {
    id: 'night-like-this',
    title: 'A Night Like This',
    artist: 'The Cure',
    genre: 'Post-Punk',
    duration: '4:16',
    quote: 'Moody atmospheric guitars & driving bass hooks',
    icon: 'fa-moon',
    curatedBy: ['Vivian'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/b5/8e/be/b58ebe73-693b-92b6-9d92-60111b92b974/mzaf_1880326346357679654.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Features114/v4/de/b7/b7/deb7b785-22e9-fd23-54d9-7a1696587053/dj.uvvvujcu.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Features114/v4/de/b7/b7/deb7b785-22e9-fd23-54d9-7a1696587053/dj.uvvvujcu.jpg/600x600bb.jpg'
  },
  {
    id: 'heroes',
    title: 'Heroes',
    artist: 'David Bowie',
    genre: 'Art Rock',
    duration: '6:11',
    quote: 'Anthemic ambient art rock & driving rhythm',
    icon: 'fa-bolt',
    curatedBy: ['Trai'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1f/f3/12/1ff3122a-eb3e-373d-d524-cfe00de9b19a/mzaf_8446634475827049231.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e2/65/b2/e265b2ae-48d5-9dd8-0251-6cd6c6c4eb53/190295842826.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e2/65/b2/e265b2ae-48d5-9dd8-0251-6cd6c6c4eb53/190295842826.jpg/600x600bb.jpg'
  },
  {
    id: 'jane',
    title: 'Jane!',
    artist: 'The Long Faces',
    genre: 'Art Rock',
    duration: '3:07',
    quote: 'Dramatic dynamic shifts & intricate post-punk energy',
    icon: 'fa-music',
    curatedBy: ['Trai'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7e/3d/bd/7e3dbde2-b317-8722-aca9-71109dbbeda7/mzaf_10498704618704694337.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5d/9e/05/5d9e0523-b030-a338-97e1-03d300855092/840091606282_Cover.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5d/9e/05/5d9e0523-b030-a338-97e1-03d300855092/840091606282_Cover.jpg/600x600bb.jpg'
  },
  {
    id: 'negative-xp',
    title: 'Mkultra Victim',
    artist: 'Negative XP',
    genre: 'Lo-Fi Punk',
    duration: '2:34',
    quote: 'Gritty lo-fi DIY chords & internet culture energy',
    icon: 'fa-fire',
    curatedBy: ['Trai'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/ce/7f/bb/ce7fbb06-1dff-fbe7-52f3-9116a9a4f319/mzaf_17663003336024301626.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/06/2a/a5/062aa5f4-f724-91fa-9f2a-0634bd6163d7/198001829987.png/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/06/2a/a5/062aa5f4-f724-91fa-9f2a-0634bd6163d7/198001829987.png/600x600bb.jpg'
  },
  {
    id: 'hello-juliet',
    title: 'Hello Juliet',
    artist: 'Clarion',
    genre: 'Indie Rock',
    duration: '3:28',
    quote: 'Catchy indie guitar riffs & soaring melodic hooks',
    icon: 'fa-headphones',
    curatedBy: ['Trai'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/99/2e/5f/992e5fcd-7542-3e84-3d34-f0088c947d71/mzaf_9542996399022195106.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/90/17/41/9017411b-afa0-d394-aba0-5054cfafc66e/198671147978.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/90/17/41/9017411b-afa0-d394-aba0-5054cfafc66e/198671147978.jpg/600x600bb.jpg'
  },
  {
    id: 'made-in-japan',
    title: 'Made in Japan',
    artist: 'Buck Owens & His Buckaroos',
    genre: 'Country Rock',
    duration: '2:45',
    quote: 'Vintage twang, telecaster lead riffs & timeless songwriting',
    icon: 'fa-guitar',
    curatedBy: ['Trai'],
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/ce/26/51/ce26514f-d76e-f246-5771-ff96db2896bd/mzaf_16676201079264603046.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a4/00/2b/a4002b01-6c8d-2d34-fae8-0b9b7861361e/810075110593.jpg/600x600bb.jpg',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/a4/00/2b/a4002b01-6c8d-2d34-fae8-0b9b7861361e/810075110593.jpg/600x600bb.jpg'
  }
];

// Pre-seed iTunes cache with verified inspiration tracks for instantaneous synchronous lookup
INSPIRATION_TRACKS.forEach((track) => {
  if (track.previewUrl && track.artworkUrl) {
    const key = `${track.artist} - ${track.title}`.toLowerCase().trim();
    ITUNES_CACHE.set(key, {
      artworkUrl: track.artworkUrl,
      rawArtworkUrl: track.artworkUrl.replace(/600x600bb\./, '100x100bb.').replace(/600x600/, '100x100'),
      previewUrl: track.previewUrl,
      isHighResAvailable: true
    });
  }
});

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
