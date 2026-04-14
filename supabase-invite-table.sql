CREATE TABLE IF NOT EXISTS company_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pendiente',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations are viewable by company members" 
  ON company_invitations FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE "auth_id" = auth.uid()
    )
  );
