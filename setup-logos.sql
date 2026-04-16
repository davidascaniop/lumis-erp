-- Enable logo column on companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url text;

-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for objects
DROP POLICY IF EXISTS "Public access to company logos" ON storage.objects;
CREATE POLICY "Public access to company logos"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'company-logos' );

DROP POLICY IF EXISTS "Users can upload their company logo" ON storage.objects;
CREATE POLICY "Users can upload their company logo"
  ON storage.objects FOR INSERT
  WITH CHECK ( 
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their company logo" ON storage.objects;
CREATE POLICY "Users can update their company logo"
  ON storage.objects FOR UPDATE
  USING ( 
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete their company logo" ON storage.objects;
CREATE POLICY "Users can delete their company logo"
  ON storage.objects FOR DELETE
  USING ( 
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated'
  );
