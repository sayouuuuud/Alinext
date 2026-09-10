-- Create public media bucket for Ali Fleet images and media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alifleet-media',
  'alifleet-media',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif'];

-- Ensure public can read objects from alifleet-media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public Read Alifleet Media'
  ) THEN
    CREATE POLICY "Public Read Alifleet Media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'alifleet-media');
  END IF;
END $$;
