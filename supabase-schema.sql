-- HABILITAR UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: EMPRESAS (Inquilinos del SaaS)
-- ============================================
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID, -- Creador original de la empresa
  name          VARCHAR(255) NOT NULL,
  rif           VARCHAR(20)  UNIQUE NOT NULL,
  logo_url      TEXT,
  primary_color VARCHAR(7)   DEFAULT '#6C63FF',
  plan_type     VARCHAR(20)  DEFAULT 'basic',  -- basic | pro | enterprise
  is_active     BOOLEAN      DEFAULT true,
  settings      JSONB        DEFAULT '{}',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================
-- TABLA: USUARIOS
-- ============================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  auth_id       UUID UNIQUE, -- vinculado a Supabase Auth
  full_name     VARCHAR(150),
  email         VARCHAR(150) UNIQUE,
  role          VARCHAR(20) DEFAULT 'vendedor', -- admin | supervisor | vendedor | almacen
  avatar_url    TEXT,
  zone          VARCHAR(100),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: SOCIOS COMERCIALES (Clientes/Comercios)
-- ============================================
CREATE TABLE partners (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID REFERENCES companies(id) ON DELETE CASCADE,
  code                 VARCHAR(20),  -- código interno del cliente
  name                 VARCHAR(255) NOT NULL,
  trade_name           VARCHAR(255), -- nombre comercial
  rif                  VARCHAR(20),
  type                 VARCHAR(50),  -- bodegon | farmacia | supermercado | otro
  address              TEXT,
  city                 VARCHAR(100),
  zone                 VARCHAR(100),
  lat                  DECIMAL(10,7),
  lng                  DECIMAL(10,7),
  phone                VARCHAR(20),
  whatsapp             VARCHAR(20),
  email                VARCHAR(150),
  credit_limit         DECIMAL(14,2) DEFAULT 0.00,
  current_balance      DECIMAL(14,2) DEFAULT 0.00, -- deuda actual (calculada)
  payment_terms        INTEGER       DEFAULT 0,      -- días de plazo
  price_list           VARCHAR(50)   DEFAULT 'general',
  status               VARCHAR(20)   DEFAULT 'active', -- active | blocked | prospect
  credit_status        VARCHAR(20)   DEFAULT 'green',  -- green | yellow | red
  assigned_user_id     UUID REFERENCES users(id),
  last_visit_at        TIMESTAMPTZ,
  last_order_at        TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: PRODUCTOS
-- ============================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  sku           VARCHAR(50),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  price_usd     DECIMAL(14,4),
  cost_usd      DECIMAL(14,4),
  stock_qty     INTEGER DEFAULT 0,
  min_stock     INTEGER DEFAULT 5,
  unit          VARCHAR(20) DEFAULT 'und',
  image_url     TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: TASAS DE CAMBIO (BCV diaria)
-- ============================================
CREATE TABLE exchange_rates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency    VARCHAR(10) DEFAULT 'USD',
  rate_bs     DECIMAL(14,4) NOT NULL,
  source      VARCHAR(20) DEFAULT 'BCV',
  fetched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: PEDIDOS
-- ============================================
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  order_number    VARCHAR(20) UNIQUE,
  partner_id      UUID REFERENCES partners(id),
  user_id         UUID REFERENCES users(id),
  subtotal_usd    DECIMAL(14,2),
  total_usd       DECIMAL(14,2),
  exchange_rate   DECIMAL(14,4),
  total_bs        DECIMAL(18,2),
  status          VARCHAR(30) DEFAULT 'draft', -- draft | confirmed | dispatched | delivered | cancelled
  notes           TEXT,
  delivery_date   DATE,
  confirmed_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  signature_url   TEXT, -- firma digital del receptor
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: LÍNEAS DEL PEDIDO
-- ============================================
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  qty         INTEGER NOT NULL,
  unit_price  DECIMAL(14,4),
  discount    DECIMAL(5,2) DEFAULT 0,
  subtotal    DECIMAL(14,2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: CUENTAS POR COBRAR (CxC)
-- ============================================
CREATE TABLE receivables (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id),
  partner_id      UUID REFERENCES partners(id),
  invoice_number  VARCHAR(30),
  amount_usd      DECIMAL(14,2),
  paid_usd        DECIMAL(14,2) DEFAULT 0.00,
  balance_usd     DECIMAL(14,2),
  due_date        DATE,
  status          VARCHAR(20) DEFAULT 'open', -- open | partial | paid | overdue
  days_overdue    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: PAGOS / COBROS
-- ============================================
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
  receivable_id    UUID REFERENCES receivables(id),
  partner_id       UUID REFERENCES partners(id),
  collected_by     UUID REFERENCES users(id),
  amount_usd       DECIMAL(14,2),
  payment_method   VARCHAR(30), -- zelle | pago_movil | cash_usd | cash_bs | transfer | otro
  reference        VARCHAR(100),
  exchange_rate    DECIMAL(14,4),
  amount_bs        DECIMAL(18,2),
  status           VARCHAR(20) DEFAULT 'pending', -- pending | verified | rejected
  verified_by      UUID REFERENCES users(id),
  verified_at      TIMESTAMPTZ,
  notes            TEXT,
  receipt_url      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: CHATTER / HISTORIAL DE ACTIVIDAD
-- ============================================
CREATE TABLE activity_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  entity_type  VARCHAR(30), -- partner | order | receivable | payment
  entity_id    UUID,
  user_id      UUID REFERENCES users(id),
  type         VARCHAR(30), -- note | system | alert | status_change
  content      TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (Multi-tenancy)
-- ============================================
ALTER TABLE companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCIONES AUXILIARES PARA RLS
-- ============================================
-- Esta función elude el RLS para no crear un ciclo infinito al consultar la tabla users
CREATE OR REPLACE FUNCTION get_auth_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM users WHERE auth_id = auth.uid();
$$;

-- ============================================
-- POLÍTICAS: COMPANIES
-- ============================================
CREATE POLICY "companies_select" ON companies FOR SELECT USING (id = get_auth_company_id() OR auth_id = auth.uid());
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (id = get_auth_company_id() OR auth_id = auth.uid());
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (auth_id = auth.uid());

-- ============================================
-- POLÍTICAS: USERS
-- ============================================
CREATE POLICY "users_select" ON users FOR SELECT USING (company_id = get_auth_company_id() OR auth_id = auth.uid());
CREATE POLICY "users_update" ON users FOR UPDATE USING (company_id = get_auth_company_id() OR auth_id = auth.uid());
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth_id = auth.uid());

-- ============================================
-- POLÍTICAS: OTROS (Tenant Isolation Base)
-- ============================================
CREATE POLICY "tenant_isolation_partners"     ON partners     FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "tenant_isolation_products"     ON products     FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "tenant_isolation_orders"       ON orders       FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "tenant_isolation_order_items"  ON order_items  FOR ALL USING (
  order_id IN (SELECT id FROM orders WHERE company_id = get_auth_company_id())
);
CREATE POLICY "tenant_isolation_receivables"  ON receivables  FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "tenant_isolation_payments"     ON payments     FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "tenant_isolation_activity_log" ON activity_log FOR ALL USING (company_id = get_auth_company_id());


-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_partners_company     ON partners(company_id);
CREATE INDEX idx_orders_company       ON orders(company_id);
CREATE INDEX idx_orders_partner       ON orders(partner_id);
CREATE INDEX idx_receivables_company  ON receivables(company_id);
CREATE INDEX idx_receivables_status   ON receivables(status);
CREATE INDEX idx_payments_company     ON payments(company_id);
CREATE INDEX idx_activity_entity      ON activity_log(entity_type, entity_id);
