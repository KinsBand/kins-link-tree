// src/lib/heatmapTracker.ts
// Semantic DOM-Anchor Click Telemetry & Container Scoping Engine for Kins
// Features: data-track Priority, Queue Buffer Ingestion, Layout Shift Observers

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSessionId, isBotOrCrawler } from './analytics';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const url = (typeof import.meta !== 'undefined' && (import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL)) || '';
  const anonKey = (typeof import.meta !== 'undefined' && (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_KEY)) || '';

  if (url && url.startsWith('http') && anonKey) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: { persistSession: false }
      });
    } catch (e) {}
  }
  return supabaseClient;
}

export interface ClickRecord {
  id?: number;
  session_id: string;
  path: string;
  container_scope: string;       // e.g. 'main_feed', 'modal:gig_map', 'drawer:stream_platforms', 'main:vault'
  target_id: string;             // e.g. 'streamLinkSpotify', 'idlePlayBtn'
  target_tag: string;            // 'button', 'a', 'div'
  target_selector: string;       // e.g. '[data-track="spotify-stream-btn"]', '#streamLinkSpotify'
  element_role: string;          // e.g. 'streaming_link', 'audio_toggle', 'card_item'
  element_x_ratio: number;       // 0.00 to 1.00 relative to clicked element bounding box
  element_y_ratio: number;       // 0.00 to 1.00 relative to clicked element bounding box
  x_ratio: number;               // Fallback responsive X ratio relative to viewport
  y_px: number;                  // Fallback absolute vertical page coordinate
  viewport_w: number;
  viewport_h: number;
  is_mobile: boolean;
  created_at: string;
}

const LOCAL_MOCK_CLICKS_KEY = 'kins_local_analytics_clicks';
let lastClickTime = 0;

// Resolve topmost active container scope
export function resolveContainerScope(target: HTMLElement | null): string {
  if (!target || typeof target.closest !== 'function') return 'main_feed';
  const explicitContainer = target.getAttribute('data-track-container');
  if (explicitContainer) return explicitContainer;

  if (target.closest('#streamDrawerPanel')) return 'drawer:stream_platforms';
  if (target.closest('#gigMapSheetModal') || target.closest('.gig-map-sheet')) return 'modal:gig_map';
  if (target.closest('#coversSearchOverlay') || target.closest('.covers-search-modal')) return 'modal:covers_search';
  if (target.closest('#coverVideoModal')) return 'modal:cover_video';
  if (target.closest('#shareModal')) return 'modal:share';
  if (target.closest('#feedbackModal')) return 'modal:feedback';
  if (target.closest('#communitySubmissionModal')) return 'modal:community';
  if (target.closest('.brutal-bottom-dock') || target.closest('#bottomAudioBar')) return 'dock:audio_player';
  if (target.closest('#inspirationVault') || target.closest('.inspiration-section') || target.closest('#inspired-section')) return 'main:vault';
  if (target.closest('#merchSection')) return 'main:merch';
  if (target.closest('#epkDeck') || target.closest('.epk-section')) return 'epk:portal';
  if (target.closest('#heroBanner') || target.closest('.hero-section')) return 'main:hero';
  return 'main_feed';
}

// Generate resilient CSS selector prioritizing immutable data-track tags
export function generateResilientSelector(el: HTMLElement | null): string {
  if (!el) return 'div';
  
  // 1. Highest Priority: Immutable data-track attribute
  const dataTrack = el.getAttribute('data-track');
  if (dataTrack) return `[data-track="${dataTrack}"]`;

  if (el.id) return `#${el.id}`;

  if (el.dataset) {
    if (el.dataset.artistKey) return `[data-artist-key="${el.dataset.artistKey}"]`;
    if (el.dataset.songTitle) return `[data-song-title="${el.dataset.songTitle}"]`;
    if (el.dataset.target) return `[data-target="${el.dataset.target}"]`;
    if (el.dataset.category) return `[data-category="${el.dataset.category}"]`;
    if (el.dataset.search) return `[data-search="${el.dataset.search}"]`;
    if (el.dataset.logoFormat) return `[data-logo-format="${el.dataset.logoFormat}"]`;
    if (el.dataset.qrFormat) return `[data-qr-format="${el.dataset.qrFormat}"]`;
    if (el.dataset.bioTier) return `[data-bio-tier="${el.dataset.bioTier}"]`;
  }

  const tag = (el.tagName || 'div').toLowerCase();
  const validClasses: string[] = [];

  if (typeof el.className === 'string') {
    el.className.split(/\s+/).forEach(c => {
      if (c && typeof c.includes === 'function' && !c.startsWith('astro-') && !c.includes(':') && c !== 'active' && c !== 'hover' && c !== 'is-playing') {
        validClasses.push(c);
      }
    });
  } else if (el.classList && typeof el.classList.forEach === 'function') {
    el.classList.forEach(c => {
      if (c && typeof c === 'string' && typeof c.includes === 'function' && !c.startsWith('astro-') && !c.includes(':') && c !== 'active') {
        validClasses.push(c);
      }
    });
  }

  if (validClasses.length > 0) {
    return `${tag}.${validClasses.slice(0, 2).join('.')}`;
  }

  return tag;
}

// In-Memory Click Batch Buffer
let clickQueue: ClickRecord[] = [];
let clickFlushTimer: any = null;

async function flushClickQueue(isUnload: boolean = false): Promise<void> {
  if (clickFlushTimer) {
    clearTimeout(clickFlushTimer);
    clickFlushTimer = null;
  }
  if (clickQueue.length === 0) return;

  const batch = [...clickQueue];
  clickQueue = [];

  // Local mirror
  try {
    const stored: ClickRecord[] = JSON.parse(localStorage.getItem(LOCAL_MOCK_CLICKS_KEY) || '[]');
    const combined = [...batch, ...stored];
    if (combined.length > 1500) combined.length = 1500;
    localStorage.setItem(LOCAL_MOCK_CLICKS_KEY, JSON.stringify(combined));
  } catch (e) {}

  const url = (typeof import.meta !== 'undefined' && (import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL)) || '';
  const anonKey = (typeof import.meta !== 'undefined' && (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_KEY)) || '';

  if (!url || !anonKey) return;

  const endpoint = `${url}/rest/v1/analytics_clicks`;

  if (isUnload && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
      const sent = navigator.sendBeacon(`${endpoint}?apikey=${anonKey}`, blob);
      if (sent) return;
    } catch (e) {}
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch),
      keepalive: true
    });
  } catch (err) {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('analytics_clicks').insert(batch);
      } catch (e) {}
    }
  }
}

// Log click coordinates and element attributes
export function initHeatmapClickTracker(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('click', async (e) => {
    if (isBotOrCrawler()) return;
    const pathname = window.location.pathname || '';
    if (typeof pathname.includes === 'function' && pathname.toLowerCase().includes('/analytics')) return;

    const target = e.target as HTMLElement | null;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('#dev-heatmap-hud') || target.closest('#admin-passcode-modal') || target.closest('#change-pin-modal') || target.closest('[data-no-track]')) {
      return;
    }

    const now = Date.now();
    if (now - lastClickTime < 150) return;
    lastClickTime = now;

    const interactiveTarget = target.closest('a, button, [role="button"], [data-track], input, select, .music-card, .cover-result-card, .filter-pill-btn, .top-nav-btn, .format-option-card') as HTMLElement || target;
    const targetRect = interactiveTarget.getBoundingClientRect ? interactiveTarget.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    
    const elX = targetRect.width > 0 ? Math.max(0, Math.min(1, (e.clientX - targetRect.left) / targetRect.width)) : 0.5;
    const elY = targetRect.height > 0 ? Math.max(0, Math.min(1, (e.clientY - targetRect.top) / targetRect.height)) : 0.5;

    const selector = generateResilientSelector(interactiveTarget);
    const containerScope = resolveContainerScope(interactiveTarget);

    const clickRecord: ClickRecord = {
      session_id: getSessionId(),
      path: window.location.pathname || '/',
      container_scope: containerScope,
      target_id: interactiveTarget.id || '',
      target_tag: (interactiveTarget.tagName || 'div').toLowerCase(),
      target_selector: selector.substring(0, 100),
      element_role: (interactiveTarget.getAttribute && (interactiveTarget.getAttribute('aria-label') || interactiveTarget.getAttribute('data-track') || interactiveTarget.getAttribute('title'))) || (interactiveTarget.tagName || 'div').toLowerCase(),
      element_x_ratio: Number(elX.toFixed(3)),
      element_y_ratio: Number(elY.toFixed(3)),
      x_ratio: Number((e.clientX / Math.max(1, window.innerWidth)).toFixed(4)),
      y_px: Math.round((window.scrollY || 0) + e.clientY),
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
      is_mobile: window.innerWidth < 768,
      created_at: new Date().toISOString()
    };

    clickQueue.push(clickRecord);

    if (clickQueue.length >= 10) {
      await flushClickQueue(false);
    } else if (!clickFlushTimer) {
      clickFlushTimer = setTimeout(() => flushClickQueue(false), 3000);
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushClickQueue(true);
  });
  window.addEventListener('pagehide', () => flushClickQueue(true));
}

// Fetch click points for the Dev Heatmap HUD
export async function fetchHeatmapClicks(options: {
  path?: string;
  timeRange: '24h' | '7d' | '30d' | 'all';
  deviceFilter?: 'all' | 'mobile' | 'desktop';
  containerScope?: string;
}): Promise<ClickRecord[]> {
  const targetPath = options.path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  
  const now = new Date();
  let cutoff: Date | null = null;
  if (options.timeRange === '24h') cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (options.timeRange === '7d') cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (options.timeRange === '30d') cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const sb = getSupabase();
  if (sb) {
    try {
      let query = sb
        .from('analytics_clicks')
        .select('*')
        .eq('path', targetPath)
        .order('created_at', { ascending: false })
        .limit(3000);

      if (cutoff) query = query.gte('created_at', cutoff.toISOString());
      if (options.deviceFilter === 'mobile') query = query.eq('is_mobile', true);
      else if (options.deviceFilter === 'desktop') query = query.eq('is_mobile', false);
      if (options.containerScope && options.containerScope !== 'all') {
        query = query.eq('container_scope', options.containerScope);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as ClickRecord[];
      }
    } catch (err) {}
  }

  // Local fallback
  try {
    let localClicks: ClickRecord[] = JSON.parse(localStorage.getItem(LOCAL_MOCK_CLICKS_KEY) || '[]');
    if (cutoff) {
      const cutoffTime = cutoff.getTime();
      localClicks = localClicks.filter(c => new Date(c.created_at).getTime() >= cutoffTime);
    }
    if (options.deviceFilter === 'mobile') {
      localClicks = localClicks.filter(c => c.is_mobile);
    } else if (options.deviceFilter === 'desktop') {
      localClicks = localClicks.filter(c => !c.is_mobile);
    }
    if (options.containerScope && options.containerScope !== 'all') {
      localClicks = localClicks.filter(c => c.container_scope === options.containerScope);
    }

    if (localClicks.length === 0) {
      localClicks = generateDemoClickClusters();
    }
    return localClicks;
  } catch (e) {
    return generateDemoClickClusters();
  }
}

function generateDemoClickClusters(): ClickRecord[] {
  const points: ClickRecord[] = [];
  const now = new Date();
  
  const clusters = [
    { x: 0.5, y: 320, count: 25, id: 'idlePlayBtn', selector: '[data-track="audio-play-idle"]', scope: 'dock:audio_player' },
    { x: 0.25, y: 480, count: 18, id: 'streamLinkSpotify', selector: '[data-track="spotify-stream-btn"]', scope: 'drawer:stream_platforms' },
    { x: 0.75, y: 480, count: 15, id: 'floatingGigPillBtn', selector: '[data-track="dock-gig-map-pill"]', scope: 'dock:audio_player' },
    { x: 0.5, y: 650, count: 20, id: 'the-cure-card', selector: '[data-artist-key="the-cure"]', scope: 'main:vault' },
    { x: 0.85, y: 40, count: 12, id: 'headerShareBtn', selector: '[data-track="hero-share-btn"]', scope: 'main:hero' },
  ];

  clusters.forEach((cl, idx) => {
    for (let i = 0; i < cl.count; i++) {
      const jitterX = (Math.random() - 0.5) * 0.04;
      const jitterY = (Math.random() - 0.5) * 30;
      points.push({
        session_id: `seed_${idx}_${i}`,
        path: '/',
        container_scope: cl.scope,
        target_id: cl.id,
        target_tag: 'button',
        target_selector: cl.selector,
        element_role: 'interactive_button',
        element_x_ratio: 0.5 + (Math.random() - 0.5) * 0.2,
        element_y_ratio: 0.5 + (Math.random() - 0.5) * 0.2,
        x_ratio: Math.max(0.05, Math.min(0.95, cl.x + jitterX)),
        y_px: Math.max(10, Math.round(cl.y + jitterY)),
        viewport_w: 1280,
        viewport_h: 800,
        is_mobile: i % 2 === 0,
        created_at: new Date(now.getTime() - Math.random() * 3600000 * 24).toISOString()
      });
    }
  });

  return points;
}
