-- ==============================================================================
-- KINS BAND - SUPABASE OBSERVABILITY & DOM-ANCHOR HEATMAP SCHEMA (PROD READY)
-- ==============================================================================
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dmoagpgtvkpsvdfjhurc
-- 2. Click "SQL Editor" on the left menu -> Click "New Query"
-- 3. Paste this ENTIRE script into the box and click "Run" (green button)
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- TABLE 1: analytics_events (Pageviews, Funnels, Bio Links, Audio Milestones)
-- ==============================================================================
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  session_id text not null,
  event_type text not null,          -- 'pageview', 'outbound_click', 'audio_milestone', 'scroll_depth', etc.
  category text default 'general',   -- 'traffic', 'music', 'social', 'epk', 'tour', 'conversion'
  label text,                        -- Track title, platform name, venue name
  value numeric default 0,           -- Seconds listened, scroll percent
  path text not null default '/',     -- URL path
  referrer text,                     -- External referrer
  device text default 'desktop',     -- 'mobile' or 'desktop'
  browser text,                      -- 'Chrome', 'Safari', etc.
  country text default 'Global',     -- Timezone/Geo region
  metadata jsonb default '{}'::jsonb,-- Stores { inbound_channel, inbound_alias, region, container_scope, target_selector }
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- TABLE 2: analytics_clicks (Real-Time DOM-Anchor Snapping Heatmap Telemetry)
-- ==============================================================================
create table if not exists public.analytics_clicks (
  id bigint generated always as identity primary key,
  session_id text not null,
  path text not null default '/',
  container_scope text default 'main_feed', -- 'modal:gig_map', 'drawer:stream_platforms', 'main:vault', 'epk:portal'
  target_id text default '',                -- Button / Card ID (e.g. 'streamLinkSpotify')
  target_tag text default 'div',            -- 'button', 'a', 'div'
  target_selector text default '',          -- DOM Selector (e.g. '[data-track="spotify-stream-btn"]')
  element_role text default '',             -- Aria label or semantic role
  element_x_ratio float default 0.5,        -- Relative click offset inside element (0.0 to 1.0)
  element_y_ratio float default 0.5,        -- Relative click offset inside element (0.0 to 1.0)
  x_ratio float not null default 0.5,       -- Responsive X ratio relative to viewport
  y_px integer not null default 0,          -- Absolute vertical page coordinate
  viewport_w integer not null default 1280,
  viewport_h integer not null default 800,
  is_mobile boolean default false,
  created_at timestamptz not null default now()
);

-- Migration safety for existing tables: ensure all columns exist
alter table public.analytics_clicks add column if not exists container_scope text default 'main_feed';
alter table public.analytics_clicks add column if not exists target_id text default '';
alter table public.analytics_clicks add column if not exists target_selector text default '';
alter table public.analytics_clicks add column if not exists element_role text default '';
alter table public.analytics_clicks add column if not exists element_x_ratio float default 0.5;
alter table public.analytics_clicks add column if not exists element_y_ratio float default 0.5;

-- ==============================================================================
-- TABLE 3: analytics_vitals (Core Web Vitals & Error Logs)
-- ==============================================================================
create table if not exists public.analytics_vitals (
  id bigint generated always as identity primary key,
  session_id text not null,
  metric_name text not null,         -- 'LCP', 'INP', 'CLS', 'JS_ERROR'
  metric_value numeric default 0,
  rating text default 'good',        -- 'good', 'needs-improvement', 'poor'
  path text not null default '/',
  device text default 'desktop',
  error_message text,
  error_stack text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- HIGH-PERFORMANCE COMPOSITE INDICES (Instant Queries & Fast Clustering)
-- ==============================================================================
create index if not exists idx_events_perf on public.analytics_events (created_at desc, event_type);
create index if not exists idx_events_session_time on public.analytics_events (session_id, created_at desc);
create index if not exists idx_events_category on public.analytics_events (category, created_at desc);
create index if not exists idx_events_path on public.analytics_events (path);

create index if not exists idx_clicks_scope_target on public.analytics_clicks (container_scope, target_id, created_at desc);
create index if not exists idx_clicks_path_created on public.analytics_clicks (path, created_at desc);
create index if not exists idx_clicks_mobile_created on public.analytics_clicks (is_mobile, created_at desc);

create index if not exists idx_vitals_name_created on public.analytics_vitals (metric_name, created_at desc);

-- ==============================================================================
-- AUTOMATED 60-DAY DATA RETENTION & PRUNING FUNCTION
-- Keeps disk usage below 25MB by safely clearing old micro-coordinates
-- ==============================================================================
create or replace function public.purge_old_analytics(days_to_keep integer default 60)
returns table (deleted_clicks bigint, deleted_vitals bigint) language plpgsql security definer as $$
declare
  clicks_count bigint;
  vitals_count bigint;
begin
  delete from public.analytics_clicks 
  where created_at < (now() - (days_to_keep || ' days')::interval);
  get diagnostics clicks_count = row_count;

  delete from public.analytics_vitals 
  where metric_name = 'JS_ERROR' and created_at < (now() - (days_to_keep || ' days')::interval);
  get diagnostics vitals_count = row_count;

  return query select clicks_count, vitals_count;
end;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allows anonymous public inserts for visitors and reads for the dashboard
-- ==============================================================================
alter table public.analytics_events enable row level security;
alter table public.analytics_clicks enable row level security;
alter table public.analytics_vitals enable row level security;

-- Drop existing policies to allow clean re-runs
drop policy if exists "Allow public anon insert on events" on public.analytics_events;
drop policy if exists "Allow public anon select on events" on public.analytics_events;
drop policy if exists "Allow public anon insert on clicks" on public.analytics_clicks;
drop policy if exists "Allow public anon select on clicks" on public.analytics_clicks;
drop policy if exists "Allow public anon insert on vitals" on public.analytics_vitals;
drop policy if exists "Allow public anon select on vitals" on public.analytics_vitals;

-- Policies for analytics_events
create policy "Allow public anon insert on events"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);

create policy "Allow public anon select on events"
  on public.analytics_events for select
  to anon, authenticated
  using (true);

-- Policies for analytics_clicks
create policy "Allow public anon insert on clicks"
  on public.analytics_clicks for insert
  to anon, authenticated
  with check (true);

create policy "Allow public anon select on clicks"
  on public.analytics_clicks for select
  to anon, authenticated
  using (true);

-- Policies for analytics_vitals
create policy "Allow public anon insert on vitals"
  on public.analytics_vitals for insert
  to anon, authenticated
  with check (true);

create policy "Allow public anon select on vitals"
  on public.analytics_vitals for select
  to anon, authenticated
  using (true);
