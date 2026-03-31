-- ============================================
-- TABLA: DESPACHOS / ENVÍOS
-- ============================================
CREATE TABLE dispatches (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
  dispatch_number     VARCHAR(30) UNIQUE,
  order_id            UUID REFERENCES orders(id),
  partner_id          UUID REFERENCES partners(id),
  delivery_address    TEXT,
  carrier             VARCHAR(150),
  estimated_delivery  DATE,
  actual_delivery     TIMESTAMPTZ,
  status              VARCHAR(30) DEFAULT 'pending_dispatch', -- pending_dispatch | preparing | dispatched | in_transit | delivered | returned
  notes               TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: ITEMS DEL DESPACHO
-- ============================================
CREATE TABLE dispatch_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_id   UUID REFERENCES dispatches(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id),
  product_name  VARCHAR(255),
  qty           INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: HISTORIAL DE ESTADOS DEL DESPACHO
-- ============================================
CREATE TABLE dispatch_status_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_id   UUID REFERENCES dispatches(id) ON DELETE CASCADE,
  status        VARCHAR(30) NOT NULL,
  changed_by    UUID REFERENCES users(id),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE dispatches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_dispatches" ON dispatches FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "tenant_isolation_dispatch_items" ON dispatch_items FOR ALL USING (
  dispatch_id IN (SELECT id FROM dispatches WHERE company_id = get_auth_company_id())
);
CREATE POLICY "tenant_isolation_dispatch_status_log" ON dispatch_status_log FOR ALL USING (
  dispatch_id IN (SELECT id FROM dispatches WHERE company_id = get_auth_company_id())
);

-- ÍNDICES
CREATE INDEX idx_dispatches_company   ON dispatches(company_id);
CREATE INDEX idx_dispatches_status    ON dispatches(status);
CREATE INDEX idx_dispatches_order     ON dispatches(order_id);
CREATE INDEX idx_dispatch_items_dispatch ON dispatch_items(dispatch_id);
CREATE INDEX idx_dispatch_status_log_dispatch ON dispatch_status_log(dispatch_id);
