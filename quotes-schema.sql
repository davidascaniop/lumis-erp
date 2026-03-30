-- ============================================================
-- QUOTES (Presupuestos / Cotizaciones)
-- ============================================================

CREATE TABLE IF NOT EXISTS quotes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  partner_id      UUID REFERENCES partners(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  quote_number    VARCHAR(30) NOT NULL UNIQUE,
  status          VARCHAR(20) DEFAULT 'open'
                  CHECK (status IN ('open', 'expired', 'converted')),
  total_usd       DECIMAL(12, 2) DEFAULT 0,
  total_bs        DECIMAL(14, 2) DEFAULT 0,
  notes           TEXT,
  -- Si fue convertida, referencia al pedido creado
  converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id    UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  price_usd   DECIMAL(12, 2) NOT NULL,
  subtotal    DECIMAL(12, 2) GENERATED ALWAYS AS (qty * price_usd) STORED,
  product_name VARCHAR(255), -- snapshot del nombre por si cambia
  product_sku  VARCHAR(100)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quotes_company   ON quotes(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_partner   ON quotes(partner_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);

-- RLS
ALTER TABLE quotes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_quotes" ON quotes
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "tenant_quote_items" ON quote_items
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes
      WHERE company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_quotes_updated_at();
