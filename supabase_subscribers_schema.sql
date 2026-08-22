-- =========================================================================
-- Kins Official Website - Subscribers Database Schema
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- =========================================================================

-- 1. Create subscribers table (with name capture)
CREATE TABLE IF NOT EXISTS public.subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT DEFAULT 'website',
    welcome_email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Ensure name column exists if table was created previously
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Create index on email for ultra-fast lookup and upserts
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers (created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow anon and service role to insert/upsert new subscribers
CREATE POLICY "Allow public insert to subscribers"
ON public.subscribers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow service role full access to subscribers"
ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Helper Query to Export Emails for Substack:
-- SELECT email, created_at FROM public.subscribers ORDER BY created_at DESC;
