-- ============================================================
-- SUPER ADMIN — TABLAS NUEVAS
-- ============================================================

-- Anuncios/Broadcast a todas las empresas
CREATE TABLE IF NOT EXISTS broadcasts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  type         VARCHAR(20) DEFAULT 'info',  -- info | warning | success | maintenance
  target       VARCHAR(20) DEFAULT 'all',   -- all | plan_emprendedor | plan_crecimiento | plan_corporativo
  is_active    BOOLEAN DEFAULT true,
  created_by   UUID REFERENCES users(id),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de lectura de broadcasts por empresa
CREATE TABLE IF NOT EXISTS broadcast_reads (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id),
  read_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(broadcast_id, user_id)
);

-- Historial de pagos de suscripción
CREATE TABLE IF NOT EXISTS subscription_payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan         VARCHAR(30) NOT NULL,         -- emprendedor | crecimiento | corporativo | enterprise
  amount_usd   DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status       VARCHAR(20) DEFAULT 'pending', -- pending | paid | failed | refunded
  payment_method VARCHAR(30),
  reference    VARCHAR(100),
  notes        TEXT,
  recorded_by  UUID REFERENCES users(id),
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Campos extra en companies para el admin
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan          VARCHAR(30) DEFAULT 'emprendedor';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan_status   VARCHAR(20) DEFAULT 'active';  -- active | suspended | trial | overdue
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE companies ADD COLUMN IF NOT EXISTS suspended_at  TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS suspend_reason TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mrr_usd       DECIMAL(10,2) DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url      TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#E040FB';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_email   VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_phone   VARCHAR(20);

-- Feature flags globales
CREATE TABLE IF NOT EXISTS feature_flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key          VARCHAR(100) UNIQUE NOT NULL,
  value        TEXT NOT NULL,
  description  TEXT,
  updated_by   UUID REFERENCES users(id),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar flags iniciales
INSERT INTO feature_flags (key, value, description) VALUES
  ('portal_enabled',     'true',  'Habilitar portal de pago del cliente'),
  ('seeds_enabled',      'true',  'Habilitar semilla diaria en dashboard'),
  ('bcv_auto_update',    'true',  'Actualización automática tasa BCV cada 30 min'),
  ('bcv_manual_rate',    '',      'Tasa BCV manual de emergencia (vacío = usar API)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_broadcasts_active    ON broadcasts(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_companies_plan       ON companies(plan, plan_status);
CREATE INDEX IF NOT EXISTS idx_sub_payments_company ON subscription_payments(company_id, created_at);

-- ============================================================
-- RLS — Solo superadmin puede leer/escribir estas tablas
-- ============================================================

ALTER TABLE broadcasts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_reads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags         ENABLE ROW LEVEL SECURITY;

-- Broadcasts: superadmin escribe, todos leen los activos
CREATE POLICY "broadcasts_read" ON broadcasts FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "broadcasts_admin" ON broadcasts FOR ALL
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'superadmin');

-- Broadcast reads: empresa registra sus propias lecturas
CREATE POLICY "broadcast_reads_own" ON broadcast_reads FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

-- Subscription payments: solo superadmin
CREATE POLICY "sub_payments_admin" ON subscription_payments FOR ALL
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'superadmin');

-- Feature flags: todos leen, solo superadmin escribe
CREATE POLICY "flags_read"  ON feature_flags FOR SELECT USING (true);
CREATE POLICY "flags_write" ON feature_flags FOR ALL
  USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'superadmin');
