-- ============================================================
-- LUMIS — EXPANSIÓN #2: PORTAL DE PAGO + SEMILLA DIARIA
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── PORTAL DE PAGO DEL CLIENTE ──────────────────────────────

-- Tokens únicos por cliente para acceso al portal
CREATE TABLE IF NOT EXISTS payment_portal_tokens (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token        VARCHAR(80) UNIQUE NOT NULL,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  partner_id   UUID REFERENCES partners(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES users(id),
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  last_access  TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Campos extra en payments para pagos del portal
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url        TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS submitted_by     VARCHAR(20) DEFAULT 'internal';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS portal_token_id  UUID REFERENCES payment_portal_tokens(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_name      VARCHAR(150);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_phone     VARCHAR(20);

-- ── SEMILLA DIARIA ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_seeds (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               VARCHAR(255),
  verse               TEXT NOT NULL,
  verse_reference     VARCHAR(100),
  reflection          TEXT,
  case_story          TEXT,
  video_url           TEXT,
  video_storage_path  TEXT,
  video_thumbnail     TEXT,
  scheduled_date      DATE UNIQUE,
  status              VARCHAR(20) DEFAULT 'draft',
  is_global           BOOLEAN DEFAULT true,
  views_count         INTEGER DEFAULT 0,
  created_by          UUID REFERENCES users(id),
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seed_views (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seed_id     UUID REFERENCES daily_seeds(id) ON DELETE CASCADE,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seed_id, user_id)
);

-- ── ÍNDICES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_portal_tokens_token   ON payment_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_partner ON payment_portal_tokens(partner_id);
CREATE INDEX IF NOT EXISTS idx_daily_seeds_date      ON daily_seeds(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_seeds_status    ON daily_seeds(status);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE payment_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_seeds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_views            ENABLE ROW LEVEL SECURITY;

-- Tokens: solo la empresa propietaria
CREATE POLICY "tenant_portal_tokens" ON payment_portal_tokens FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

-- Seeds: lectura pública (son globales para todos los clientes)
CREATE POLICY "seeds_read"  ON daily_seeds FOR SELECT USING (true);
CREATE POLICY "seeds_write" ON daily_seeds FOR ALL
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'superadmin');

-- Seed views: la empresa registra sus propias vistas
CREATE POLICY "tenant_seed_views" ON seed_views FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
