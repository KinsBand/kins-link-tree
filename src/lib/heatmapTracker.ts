// src/lib/heatmapTracker.ts
// Semantic DOM-Anchor Click Telemetry & Touch Intelligence Engine for Kins
// Features: Pointer/Touch Precision, Rage/Dead Click Detection, Attention Dwell, Queue Buffer Ingestion & Resilient Supabase Sync

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
  container_scope: string;       // e.g. 'main_feed', 'modal:gig_map', 'drawer:stream_platforms', 'modal:covers_search', 'main:vault'
  target_id: string;             // e.g. 'streamLinkSpotify', 'idlePlayBtn'
  target_tag: string;            // 'button', 'a', 'div', etc.
  target_selector: string;       // e.g. '[data-track="spotify-stream-btn"]', '#streamLinkSpotify'
  element_role: string;          // e.g. 'streaming_link', 'audio_toggle', 'card_item'
  element_x_ratio: number;       // 0.00 to 1.00 relative to clicked element bounding box
  element_y_ratio: number;       // 0.00 to 1.00 relative to clicked element bounding box
  x_ratio: number;               // Fallback responsive X ratio relative to viewport
  y_px: number;                  // Fallback absolute vertical page coordinate
  viewport_w: number;
  viewport_h: number;
  is_mobile: boolean;
  pointer_type?: 'touch' | 'mouse' | 'pen';
  touch_radius?: number;         // Contact width / radius
  is_rage_click?: boolean;       // >= 3 rapid clicks in 600ms in <= 35px radius
  is_dead_click?: boolean;       // Click on non-interactive dead space
  is_near_miss?: boolean;        // Click within 18px outside interactive target boundary
  miss_distance_px?: number;
  bounding_width?: number;
  bounding_height?: number;
  scroll_depth_pct?: number;
  created_at: string;
}

export interface SectionAttentionRecord {
  section_id: string;
  dwell_seconds: number;
  entry_count: number;
  max_scroll_depth: number;
  last_updated: string;
}

export const LOCAL_MOCK_CLICKS_KEY = 'kins_local_analytics_clicks';
export const LOCAL_SECTION_ATTENTION_KEY = 'kins_local_section_attention';

let lastClickTime = 0;
const clickHistoryWindow: Array<{ time: number; x: number; y: number; target: HTMLElement | null }> = [];

// Resolve topmost active container scope
export function resolveContainerScope(target: HTMLElement | null): string {
  if (!target || typeof target.closest !== 'function') return 'main_feed';
  const explicitContainer = target.getAttribute('data-track-container');
  if (explicitContainer) return explicitContainer;

  if (target.closest('#privacyModal')) return 'modal:privacy';
  if (target.closest('#termsModal')) return 'modal:terms';
  if (target.closest('#communitySubmissionModal')) return 'modal:community';
  if (target.closest('#feedbackModal')) return 'modal:feedback';
  if (target.closest('#coverVideoModal')) return 'modal:cover_video';
  if (target.closest('#shareModal')) return 'modal:share';
  if (target.closest('#coversSearchOverlay') || target.closest('.covers-search-modal')) return 'modal:covers_search';
  if (target.closest('#gigMapModal') || target.closest('#gigMapSheetModal') || target.closest('.gig-map-sheet')) return 'modal:gig_map';
  if (target.closest('#streamDrawerPanel') || target.closest('.stream-drawer-panel')) return 'drawer:stream_platforms';
  if (target.closest('#requestSongModal')) return 'modal:request_song';
  if (target.closest('.brutal-bottom-dock') || target.closest('#bottomAudioBar')) return 'dock:audio_player';
  if (target.closest('#inspirationVault') || target.closest('.inspiration-section') || target.closest('#inspired-section')) return 'main:vault';
  if (target.closest('#merchSection') || target.closest('.merch-section')) return 'main:merch';
  if (target.closest('#spotlightSection') || target.closest('.spotlight-section')) return 'main:spotlight';
  if (target.closest('#membersSection') || target.closest('.members-section')) return 'main:members';
  if (target.closest('#epkDeck') || target.closest('.epk-section') || (typeof window !== 'undefined' && window.location.pathname.includes('/epk'))) return 'epk:portal';
  if (target.closest('#heroBanner') || target.closest('#heroBannerContainer') || target.closest('.hero-section')) return 'main:hero';
  if (target.closest('#subscribeSection') || target.closest('.subscribe-section')) return 'main:subscribe';
  if (target.closest('.top-nav')) return 'main:top_nav';
  return 'main_feed';
}

// Generate resilient CSS selector prioritizing immutable data-track tags
export function generateResilientSelector(el: HTMLElement | null): string {
  if (!el) return 'div';
  
  const dataTrack = el.getAttribute('data-track');
  if (dataTrack) return `[data-track="${dataTrack}"]`;

  if (el.id) return `#${el.id}`;

  if (el.dataset) {
    if (el.dataset.artistKey) return `[data-artist-key="${el.dataset.artistKey}"]`;
    if (el.dataset.songTitle) return `[data-song-title="${el.dataset.songTitle}"]`;
    if (el.dataset.target) return `[data-target="${el.dataset.target}"]`;
    if (el.dataset.category) return `[data-category="${el.dataset.category}"]`;
    if (el.dataset.platform) return `[data-platform="${el.dataset.platform}"]`;
    if (el.dataset.member) return `[data-member="${el.dataset.member}"]`;
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

  // Local mirror instant cache
  try {
    const stored: ClickRecord[] = JSON.parse(localStorage.getItem(LOCAL_MOCK_CLICKS_KEY) || '[]');
    const combined = [...batch, ...stored];
    if (combined.length > 3000) combined.length = 3000;
    localStorage.setItem(LOCAL_MOCK_CLICKS_KEY, JSON.stringify(combined));
    
    // Notify live HUD and Dashboard listeners of new telemetry
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kins:telemetry:click', { detail: { count: batch.length } }));
    }
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

  // 1. Try sending full payload
  try {
    const res = await fetch(endpoint, {
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

    if (res.ok) return;
  } catch (err) {}

  // 2. Fallback: sanitize to core columns in case remote table schema is older
  try {
    const sanitized = batch.map(b => ({
      session_id: b.session_id,
      path: b.path,
      container_scope: b.container_scope,
      target_id: b.target_id || '',
      target_tag: b.target_tag || '',
      target_selector: b.target_selector || '',
      element_role: b.element_role || '',
      element_x_ratio: b.element_x_ratio,
      element_y_ratio: b.element_y_ratio,
      x_ratio: b.x_ratio,
      y_px: b.y_px,
      viewport_w: b.viewport_w,
      viewport_h: b.viewport_h,
      is_mobile: b.is_mobile,
      created_at: b.created_at
    }));

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sanitized),
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

// Check Rage Clicks (>= 3 clicks within 600ms within 35px Euclidean distance)
function checkIsRageClick(now: number, clientX: number, clientY: number): boolean {
  clickHistoryWindow.push({ time: now, x: clientX, y: clientY, target: null });
  const recent = clickHistoryWindow.filter(c => now - c.time <= 700);
  clickHistoryWindow.length = 0;
  clickHistoryWindow.push(...recent);

  if (recent.length >= 3) {
    const last3 = recent.slice(-3);
    const maxDist = Math.max(
      Math.hypot(last3[0].x - last3[1].x, last3[0].y - last3[1].y),
      Math.hypot(last3[1].x - last3[2].x, last3[1].y - last3[2].y),
      Math.hypot(last3[0].x - last3[2].x, last3[0].y - last3[2].y)
    );
    if (maxDist <= 35) return true;
  }
  return false;
}

// Check Near-Miss to any interactive element within 18px
function findNearMissInteractive(clientX: number, clientY: number): { isNearMiss: boolean; distance: number; el: HTMLElement | null } {
  if (typeof document === 'undefined') return { isNearMiss: false, distance: 0, el: null };
  const interactives = document.querySelectorAll<HTMLElement>('a, button, [role="button"], [data-track], input, .brutal-link-card, .music-card');
  let closestDist = 999;
  let closestEl: HTMLElement | null = null;

  interactives.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
      const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
      const dist = Math.hypot(dx, dy);
      if (dist < closestDist) {
        closestDist = dist;
        closestEl = el;
      }
    }
  });

  if (closestDist > 0 && closestDist <= 18) {
    return { isNearMiss: true, distance: Math.round(closestDist), el: closestEl };
  }
  return { isNearMiss: false, distance: 0, el: null };
}

// Global Interaction Ingestion Listener
export function initHeatmapTracker(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (isBotOrCrawler()) return;

  const sessionId = getSessionId();

  function onUserPointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Ignore admin controls
    if (target.closest('#dev-heatmap-hud') || target.closest('#admin-passcode-modal') || target.closest('[data-no-track="true"]')) {
      return;
    }

    const now = Date.now();
    const isMobile = window.innerWidth <= 768 || e.pointerType === 'touch';
    const isRage = checkIsRageClick(now, e.clientX, e.clientY);

    // Locate closest interactive element
    const interactive = target.closest('a, button, [role="button"], input, select, textarea, [data-track], .music-card, .cover-result-card, .member-bio-card') as HTMLElement | null;
    const isDeadClick = !interactive;
    const nearMissInfo = isDeadClick ? findNearMissInteractive(e.clientX, e.clientY) : { isNearMiss: false, distance: 0, el: null };

    const boundEl = interactive || nearMissInfo.el || target;
    const rect = boundEl.getBoundingClientRect();

    let elemXRatio = 0.5;
    let elemYRatio = 0.5;
    if (rect.width > 0 && rect.height > 0) {
      elemXRatio = Number(((e.clientX - rect.left) / rect.width).toFixed(3));
      elemYRatio = Number(((e.clientY - rect.top) / rect.height).toFixed(3));
      elemXRatio = Math.max(0, Math.min(1, elemXRatio));
      elemYRatio = Math.max(0, Math.min(1, elemYRatio));
    }

    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollDepthPct = Math.min(100, Math.round((scrollY / scrollMax) * 100));

    const clickRecord: ClickRecord = {
      session_id: sessionId,
      path: window.location.pathname || '/',
      container_scope: resolveContainerScope(target),
      target_id: boundEl.id || '',
      target_tag: (boundEl.tagName || 'div').toLowerCase(),
      target_selector: generateResilientSelector(boundEl),
      element_role: boundEl.getAttribute('data-track') || boundEl.getAttribute('aria-label') || boundEl.getAttribute('role') || (boundEl.tagName || '').toLowerCase(),
      element_x_ratio: elemXRatio,
      element_y_ratio: elemYRatio,
      x_ratio: Number((e.clientX / window.innerWidth).toFixed(4)),
      y_px: Math.round(e.clientY + scrollY),
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
      is_mobile: isMobile,
      pointer_type: (e.pointerType as any) || (isMobile ? 'touch' : 'mouse'),
      touch_radius: e.width ? Math.round(e.width / 2) : (isMobile ? 22 : 0),
      is_rage_click: isRage,
      is_dead_click: isDeadClick,
      is_near_miss: nearMissInfo.isNearMiss,
      miss_distance_px: nearMissInfo.distance,
      bounding_width: Math.round(rect.width),
      bounding_height: Math.round(rect.height),
      scroll_depth_pct: scrollDepthPct,
      created_at: new Date().toISOString()
    };

    clickQueue.push(clickRecord);

    if (clickFlushTimer) clearTimeout(clickFlushTimer);
    if (clickQueue.length >= 10 || isRage) {
      flushClickQueue();
    } else {
      clickFlushTimer = setTimeout(() => flushClickQueue(), 2500);
    }
  }

  window.addEventListener('pointerdown', onUserPointerDown, { passive: true, capture: true });
  window.addEventListener('pagehide', () => flushClickQueue(true));
  window.addEventListener('beforeunload', () => flushClickQueue(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushClickQueue(true);
  });

  initSectionAttentionObserver();
}

export const initHeatmapClickTracker = initHeatmapTracker;

// Section Attention & Dwell Observer Engine
export function initSectionAttentionObserver(): void {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

  const sectionTimers = new Map<string, number>();
  const attentionRecords: Record<string, { dwellSeconds: number; entries: number }> = fetchSectionAttention();

  const sectionsToTrack = [
    { id: 'main:top_nav', selector: '.top-nav' },
    { id: 'main:hero', selector: '#heroBannerContainer, .hero-banner-container' },
    { id: 'main:profile', selector: '.profile-section' },
    { id: 'main:tabs', selector: '.tabbed-links-section' },
    { id: 'main:vault', selector: '#inspirationVault, .inspiration-section' },
    { id: 'dock:audio_player', selector: '#bottomAudioBar, .brutal-bottom-dock' },
    { id: 'drawer:stream_platforms', selector: '#streamDrawerPanel' },
    { id: 'modal:gig_map', selector: '#gigMapModal' },
    { id: 'modal:covers_search', selector: '#coversSearchOverlay' },
    { id: 'main:members', selector: '.members-section' },
    { id: 'main:spotlight', selector: '.spotlight-section' },
    { id: 'main:merch', selector: '#merch-section, .merch-section' },
    { id: 'main:subscribe', selector: '.subscribe-section' }
  ];

  const observer = new IntersectionObserver((entries) => {
    const now = Date.now();
    entries.forEach(entry => {
      const targetSec = sectionsToTrack.find(s => entry.target.matches(s.selector));
      if (!targetSec) return;

      const secId = targetSec.id;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
        sectionTimers.set(secId, now);
        if (!attentionRecords[secId]) attentionRecords[secId] = { dwellSeconds: 0, entries: 0 };
        attentionRecords[secId].entries++;
      } else {
        const startTime = sectionTimers.get(secId);
        if (startTime) {
          const dwellDeltaSec = Math.round((now - startTime) / 1000);
          if (dwellDeltaSec > 0 && dwellDeltaSec < 600) {
            if (!attentionRecords[secId]) attentionRecords[secId] = { dwellSeconds: 0, entries: 1 };
            attentionRecords[secId].dwellSeconds += dwellDeltaSec;
            try {
              localStorage.setItem(LOCAL_SECTION_ATTENTION_KEY, JSON.stringify(attentionRecords));
            } catch (e) {}
          }
          sectionTimers.delete(secId);
        }
      }
    });
  }, { threshold: [0.35] });

  sectionsToTrack.forEach(sec => {
    const el = document.querySelector(sec.selector);
    if (el) observer.observe(el);
  });
}

// Heatmap Data Fetcher with Scope Filtering
export async function fetchHeatmapClicks(options: {
  path?: string;
  timeRange: '24h' | '7d' | '30d' | 'all';
  deviceFilter?: 'all' | 'mobile' | 'desktop';
  containerScope?: string;
  modeFilter?: 'all' | 'rage_only' | 'dead_only' | 'interactive_only';
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
      if (options.containerScope && options.containerScope !== 'all' && options.containerScope !== 'auto') {
        query = query.eq('container_scope', options.containerScope);
      }
      if (options.modeFilter === 'rage_only') query = query.eq('is_rage_click', true);
      if (options.modeFilter === 'dead_only') query = query.eq('is_dead_click', true);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as ClickRecord[];
      }
    } catch (err) {}
  }

  // Local storage real data fallback
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
    if (options.containerScope && options.containerScope !== 'all' && options.containerScope !== 'auto') {
      localClicks = localClicks.filter(c => c.container_scope === options.containerScope);
    }
    if (options.modeFilter === 'rage_only') {
      localClicks = localClicks.filter(c => c.is_rage_click);
    } else if (options.modeFilter === 'dead_only') {
      localClicks = localClicks.filter(c => c.is_dead_click);
    } else if (options.modeFilter === 'interactive_only') {
      localClicks = localClicks.filter(c => !c.is_dead_click);
    }

    return localClicks;
  } catch (e) {
    return [];
  }
}

// Fetch Section Attention Metrics for HUD Attention Map (Real dwell metrics)
export function fetchSectionAttention(): Record<string, { dwellSeconds: number; entries: number }> {
  try {
    const stored = localStorage.getItem(LOCAL_SECTION_ATTENTION_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  return {};
}
