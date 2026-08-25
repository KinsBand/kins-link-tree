-- KINS Sheets — per-song instrumental sheets (PDF / GP / GP5 / XML / MusicXML)
-- Apply after fan-uploads migration. Bucket is private; approved/ prefix is public read via policy.

-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kins-sheets',
  'kins-sheets',
  FALSE,
  15728640,
  ARRAY[
    'application/pdf',
    'application/x-pdf',
    'audio/x-guitar-pro',
    'application/x-guitar-pro',
    'application/octet-stream',
    'text/xml',
    'application/xml',
    'application/vnd.recordare.musicxml+xml',
    'application/vnd.recordare.musicxml',
    'application/x-musicxml',
    'application/gzip',
    'application/x-gzip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Table
CREATE TABLE IF NOT EXISTS public.kins_sheet_music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size >= 1024 AND byte_size <= 15728640),
  instrument text NOT NULL CHECK (instrument IN ('bass','electric','acoustic','drums')),
  setlist_key text,
  title text CHECK (char_length(title) <= 120),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kins_sheet_music ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved sheets" ON public.kins_sheet_music;
CREATE POLICY "Public read approved sheets"
  ON public.kins_sheet_music FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Service role full access sheets" ON public.kins_sheet_music;
CREATE POLICY "Service role full access sheets"
  ON public.kins_sheet_music FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Storage policies — only approved/ readable publicly
DROP POLICY IF EXISTS "Public read approved kins sheets" ON storage.objects;
CREATE POLICY "Public read approved kins sheets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kins-sheets' AND (storage.foldername(name))[1] = 'approved');

DROP POLICY IF EXISTS "Service role write kins sheets" ON storage.objects;
CREATE POLICY "Service role write kins sheets"
  ON storage.objects FOR ALL
  USING (bucket_id = 'kins-sheets' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'kins-sheets' AND auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS kins_sheet_music_setlist_idx ON public.kins_sheet_music (setlist_key, instrument, status);
CREATE INDEX IF NOT EXISTS kins_sheet_music_created_idx ON public.kins_sheet_music (created_at DESC);
