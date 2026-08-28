-- =========================================================================
-- Kins Official Website — Master Consolidated Database Schema
-- 
-- Run this in your Supabase Dashboard:
-- SQL Editor -> New Query -> Paste All -> Run (Ctrl+Enter / Cmd+Enter)
-- 
-- This script is 100% IDEMPOTENT (safe to run multiple times).
-- It creates all required tables, indexes, RLS policies, storage buckets,
-- and reloads PostgREST schema cache immediately.
-- =========================================================================

-- =========================================================================
-- 1. SUBSCRIBERS TABLE & LIFECYCLE SEGMENTATION
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT DEFAULT 'website',
    is_subscribed BOOLEAN DEFAULT TRUE,
    unsubscribed_at TIMESTAMPTZ,
    welcome_email_sent BOOLEAN DEFAULT FALSE,
    city TEXT,
    alerts_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Idempotent column additions in case table was previously created with fewer columns
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT TRUE;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS alerts_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers (created_at DESC);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop legacy unauthenticated public insert if it exists (Hardening)
DROP POLICY IF EXISTS "Allow public insert to subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow service role full access to subscribers" ON public.subscribers;

CREATE POLICY "Allow service role full access to subscribers"
ON public.subscribers FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 2. VOTES TABLE (Hero Polls & Cover Song Voting)
-- =========================================================================

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

DROP POLICY IF EXISTS "Allow service role full access to votes" ON public.votes;
CREATE POLICY "Allow service role full access to votes"
ON public.votes FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 3. CHECKINS TABLE (Gig Attendance)
-- =========================================================================

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

DROP POLICY IF EXISTS "Allow service role full access to checkins" ON public.checkins;
CREATE POLICY "Allow service role full access to checkins"
ON public.checkins FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 4. PLAYER STATE TABLE (Gig Passport XP & Badges)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.player_state (
    identity_key TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    last_seen TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.player_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to player_state" ON public.player_state;
CREATE POLICY "Allow service role full access to player_state"
ON public.player_state FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 5. FAN UPLOADS TABLE & STORAGE BUCKET (Photos & Videos)
-- =========================================================================

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

DROP POLICY IF EXISTS "Allow public read of approved fan_uploads" ON public.fan_uploads;
CREATE POLICY "Allow public read of approved fan_uploads"
ON public.fan_uploads FOR SELECT
TO anon, authenticated
USING (status = 'approved');

DROP POLICY IF EXISTS "Allow service role full access to fan_uploads" ON public.fan_uploads;
CREATE POLICY "Allow service role full access to fan_uploads"
ON public.fan_uploads FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Fan Uploads Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'fan-uploads',
    'fan-uploads',
    FALSE,
    83886080, -- 80 MB ceiling
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm'
    ]
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read approved fan uploads" ON storage.objects;
CREATE POLICY "Public read approved fan uploads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'fan-uploads' AND (storage.foldername(name))[1] = 'approved');

-- =========================================================================
-- 6. QR SCANS TABLE (Phygital Attribution)
-- =========================================================================

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

DROP POLICY IF EXISTS "Allow service role full access to qr_scans" ON public.qr_scans;
CREATE POLICY "Allow service role full access to qr_scans"
ON public.qr_scans FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 7. TIPS TABLE (Ko-fi Webhook Superchats & Tips)
-- =========================================================================

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

DROP POLICY IF EXISTS "Allow service role full access to tips" ON public.tips;
CREATE POLICY "Allow service role full access to tips"
ON public.tips FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =========================================================================
-- 8. LIVE CHAT TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.live_chat (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    handle TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.live_chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of live_chat" ON public.live_chat;
CREATE POLICY "Allow public read of live_chat"
ON public.live_chat FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow moderated chat insert" ON public.live_chat;
CREATE POLICY "Allow moderated chat insert"
ON public.live_chat FOR INSERT
TO anon, authenticated
WITH CHECK (
    char_length(message) BETWEEN 1 AND 280
    AND char_length(username) BETWEEN 1 AND 40
    AND char_length(handle) <= 60
);

-- =========================================================================
-- 9. RELOAD POSTGREST SCHEMA CACHE
-- =========================================================================

NOTIFY pgrst, 'reload schema';
