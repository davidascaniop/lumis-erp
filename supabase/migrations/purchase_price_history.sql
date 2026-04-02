-- ============================================
-- TABLA: HISTORIAL DE PRECIOS DE COMPRA
-- Se inserta automáticamente al emitir una OC
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  unit_price_usd  NUMERIC(14,4) NOT NULL,
  unit_price_bs   NUMERIC(14,4) DEFAULT 0,
  bcv_rate        NUMERIC(14,4) DEFAULT 1,
  quantity        NUMERIC(14,2) DEFAULT 1,
  purchased_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_pph_company ON purchase_price_history(company_id);
CREATE INDEX IF NOT EXISTS idx_pph_product_supplier ON purchase_price_history(product_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_pph_supplier ON purchase_price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pph_purchased_at ON purchase_price_history(purchased_at DESC);

-- RLS
ALTER TABLE purchase_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company isolation" ON purchase_price_history
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid()));
