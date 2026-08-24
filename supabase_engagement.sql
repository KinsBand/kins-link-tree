-- =========================================================================
-- Kins Official Website — Engagement Layer Migration
-- Run in Supabase Dashboard -> SQL Editor.
--
-- Adds durable first-party tables backing:
--   * hero poll + cover-request voting      -> votes
--   * gig-night check-ins ("I WAS THERE")   -> checkins
--   * gamified Gig Passport ledger          -> player_state
--   * fan-cam / fan-wall upload pipeline    -> fan_uploads (+ storage bucket)
--   * phygital QR scan attribution          -> qr_scans
--   * Ko-fi webhook-confirmed superchats    -> tips
--   * gig-alert segmentation                -> subscribers.city / alerts_opt_in
--   * defensive creation of live_chat       -> referenced by rls_hardening.sql
--
-- SECURITY MODEL (mirrors supabase_rls_hardening.sql):
--   ALL writes flow through server routes using the service-role key,
--   which bypasses RLS entirely. Anon gets NO write access anywhere.
--   The ONLY public read is fan_uploads WHERE status = 'approved'.
-- =========================================================================

-- ------------------------------------------------------------------
-- 0. Defensive creation of live_chat (referenced by hardening policy)
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.live_chat (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    handle TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------
-- 1. subscribers: gig-alert segmentation columns
-- ------------------------------------------------------------------

ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS alerts_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- ------------------------------------------------------------------
-- 2. votes: generic tally store (hero polls, cover requests)
--    voter_key is a server-side hash of IP+salt OR an anonymous
--    deviceId UUID issued client-side. Uniqueness enforced per scope.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.votes (
    id BIGSERIAL PRIMARY KEY,
    scope TEXT NOT NULL,
    choice TEXT NOT NULL,
    voter_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_scope_voter ON public.votes (scope, voter_key);
CREATE INDEX IF NOT EXISTS idx_votes_scope ON public.votes (scope);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to votes"
ON public.votes FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------
-- 3. checkins: one per gig per device. email optional linkage.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.checkins (
    id BIGSERIAL PRIMARY KEY,
    gig_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_gig_device ON public.checkins (gig_id, device_id);
CREATE INDEX IF NOT EXISTS idx_checkins_device ON public.checkins (device_id);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to checkins"
ON public.checkins FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------
-- 4. player_state: Gamification ledger. XP and badges are computed
--    SERVER-SIDE ONLY — never trust client claims (repo rule §5).
--    identity_key = 'device:<uuid>' or 'email:<hash>'.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.player_state (
    identity_key TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    last_seen TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.player_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to player_state"
ON public.player_state FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------
-- 5. fan_uploads: moderation pipeline. Only 'approved' rows are
--    publicly readable; pending/rejected stay invisible to anon.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.fan_uploads (
    id BIGSERIAL PRIMARY KEY,
    storage_path TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 83886080),
    caption TEXT CHECK (caption IS NULL OR char_length(caption) <= 240),
    handle TEXT CHECK (handle IS NULL OR char_length(handle) <= 60),
    gig_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fan_uploads_status ON public.fan_uploads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fan_uploads_gig ON public.fan_uploads (gig_id) WHERE gig_id IS NOT NULL;

ALTER TABLE public.fan_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of approved fan_uploads"
ON public.fan_uploads FOR SELECT
TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Allow service role full access to fan_uploads"
ON public.fan_uploads FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------
-- 5b. Storage bucket for fan uploads (private; signed/public URLs are
--     generated by the API route after approval).
-- ------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'fan-uploads',
    'fan-uploads',
    FALSE,
    83886080, -- 80 MB hard ceiling, mirrors fan_uploads.byte_size check
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm'
    ]
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public may fetch objects only from the approved/ folder once the API
-- route flips them there. Uploads themselves are service-role only.
DROP POLICY IF EXISTS "Public read approved fan uploads" ON storage.objects;
CREATE POLICY "Public read approved fan uploads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'fan-uploads' AND (storage.foldername(name))[1] = 'approved');

-- ------------------------------------------------------------------
-- 6. qr_scans: physical-to-digital attribution. One row per placement
--    per device per UTC day enables atomic same-day XP dedupe.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.qr_scans (
    id BIGSERIAL PRIMARY KEY,
    placement TEXT NOT NULL,
    device_id TEXT NOT NULL,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_scans_daily_dedupe
ON public.qr_scans (placement, device_id, ((created_at AT TIME ZONE 'UTC')::date));

CREATE INDEX IF NOT EXISTS idx_qr_scans_placement ON public.qr_scans (placement, created_at DESC);

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to qr_scans"
ON public.qr_scans FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------
-- 7. tips: Ko-fi webhook confirmations. kofi_id is Ko-fi's transaction
--    id (unique). A tip becomes visible in live chat only when
--    published = true (set by the stream-time publisher endpoint).
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tips (
    id BIGSERIAL PRIMARY KEY,
    kofi_id TEXT UNIQUE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'AUD',
    supporter_name TEXT CHECK (supporter_name IS NULL OR char_length(supporter_name) <= 60),
    message TEXT CHECK (message IS NULL OR char_length(message) <= 200),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    show_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_tips_published ON public.tips (published, created_at DESC);

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to tips"
ON public.tips FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------
-- 8. Verify
-- ------------------------------------------------------------------
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
