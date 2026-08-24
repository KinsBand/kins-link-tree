-- =========================================================================
-- Kins Official Website — RLS Hardening Migration
-- Run in Supabase Dashboard -> SQL Editor.
--
-- WHY: the original schema granted `anon` (i.e. anyone with the public URL +
-- publishable key) unrestricted INSERT on `subscribers`, bypassing the site's
-- own /api/subscribe validation, rate limiting and credential verification.
-- All legitimate writes now flow through server routes that use the
-- service-role key, which bypasses RLS entirely — so anon needs no write
-- access at all.
--
-- The live_chat policies add a real server-side floor for chat moderation:
-- length caps enforced by the database itself, regardless of client code.
-- =========================================================================

-- ------------------------------------------------------------------
-- 1. subscribers: remove public write access
-- ------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public insert to subscribers" ON public.subscribers;

-- No replacement policy: service_role (used exclusively by our API routes)
-- bypasses RLS and keeps full access via the policy below.

-- Optional sanity check after running:
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'subscribers';
-- Expected: only "Allow service role full access to subscribers".

-- ------------------------------------------------------------------
-- 2. live_chat: RLS with database-enforced message hygiene
--    (adjust table/column names if your schema differs)
-- ------------------------------------------------------------------

ALTER TABLE public.live_chat ENABLE ROW LEVEL SECURITY;

-- Anyone can read the live feed...
DROP POLICY IF EXISTS "Allow public read of live_chat" ON public.live_chat;
CREATE POLICY "Allow public read of live_chat"
ON public.live_chat
FOR SELECT
TO anon, authenticated
USING (true);

-- ...but writes are length-capped and must carry non-empty content.
DROP POLICY IF EXISTS "Allow moderated chat insert" ON public.live_chat;
CREATE POLICY "Allow moderated chat insert"
ON public.live_chat
FOR INSERT
TO anon, authenticated
WITH CHECK (
    char_length(message) BETWEEN 1 AND 280
    AND char_length(username) BETWEEN 1 AND 40
    AND char_length(handle) <= 60
);

-- ------------------------------------------------------------------
-- 3. Same hygiene for any fan-wall media table (if present)
-- ------------------------------------------------------------------
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables
--              WHERE table_schema = 'public' AND table_name = 'fan_wall') THEN
--     ALTER TABLE public.fan_wall ENABLE ROW LEVEL SECURITY;
--
--     DROP POLICY IF EXISTS "Allow public read of fan_wall" ON public.fan_wall;
--     CREATE POLICY "Allow public read of fan_wall"
--       ON public.fan_wall FOR SELECT TO anon, authenticated USING (true);
--
--     DROP POLICY IF EXISTS "Allow moderated wall insert" ON public.fan_wall;
--     CREATE POLICY "Allow moderated wall insert"
--       ON public.fan_wall FOR INSERT TO anon, authenticated
--       WITH CHECK (
--         char_length(handle) BETWEEN 1 AND 60
--         AND char_length(caption) <= 240
--       );
--   END IF;
-- END $$;

-- ------------------------------------------------------------------
-- 4. Verify
-- ------------------------------------------------------------------
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
