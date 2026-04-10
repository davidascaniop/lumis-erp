-- ============================================
-- MÓDULO RESTAURANTE — Migración de Base de Datos
-- ============================================

-- 1. Agregar campo modules_enabled a companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS modules_enabled JSONB DEFAULT '[]';

-- ============================================
-- TABLA: ZONAS DEL RESTAURANTE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7) DEFAULT '#6C63FF',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: MESAS DEL RESTAURANTE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  capacity         INTEGER DEFAULT 4,
  zone             VARCHAR(100) DEFAULT 'Salón',
  status           VARCHAR(30) DEFAULT 'libre', -- libre | ocupada | reservada | cuenta_pedida
  current_order_id UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: COMANDAS / PEDIDOS DE RESTAURANTE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  table_id     UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  waiter_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  status       VARCHAR(30) DEFAULT 'abierta', -- abierta | en_cocina | lista | cobrada | cancelada
  guests_count INTEGER DEFAULT 1,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  closed_at    TIMESTAMPTZ
);

-- ============================================
-- TABLA: ITEMS DE COMANDA
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID REFERENCES restaurant_orders(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name      VARCHAR(255) NOT NULL,
  quantity          INTEGER DEFAULT 1,
  unit_price        DECIMAL(14,4) DEFAULT 0,
  modifications     TEXT, -- texto libre: "sin sal", "término 3/4", etc.
  status            VARCHAR(30) DEFAULT 'pendiente', -- pendiente | en_preparacion | listo | entregado
  sent_to_kitchen_at TIMESTAMPTZ,
  ready_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: CONFIGURACIÓN DE RESTAURANTE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_config (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  alert_minutes_yellow  INTEGER DEFAULT 10,
  alert_minutes_red     INTEGER DEFAULT 15,
  require_guests        BOOLEAN DEFAULT true,
  allow_multiple_sends  BOOLEAN DEFAULT true,
  notify_waiter_on_ready BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FK: restaurant_tables.current_order_id → restaurant_orders
-- ============================================
ALTER TABLE restaurant_tables
  ADD CONSTRAINT fk_current_order
  FOREIGN KEY (current_order_id)
  REFERENCES restaurant_orders(id)
  ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE restaurant_zones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables      ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_config      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_restaurant_zones" ON restaurant_zones
  FOR ALL USING (company_id = get_auth_company_id());

CREATE POLICY "tenant_isolation_restaurant_tables" ON restaurant_tables
  FOR ALL USING (company_id = get_auth_company_id());

CREATE POLICY "tenant_isolation_restaurant_orders" ON restaurant_orders
  FOR ALL USING (company_id = get_auth_company_id());

CREATE POLICY "tenant_isolation_restaurant_order_items" ON restaurant_order_items
  FOR ALL USING (
    order_id IN (SELECT id FROM restaurant_orders WHERE company_id = get_auth_company_id())
  );

CREATE POLICY "tenant_isolation_restaurant_config" ON restaurant_config
  FOR ALL USING (company_id = get_auth_company_id());

-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_restaurant_zones_company ON restaurant_zones(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_company ON restaurant_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_company ON restaurant_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_table ON restaurant_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_status ON restaurant_orders(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_order ON restaurant_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_status ON restaurant_order_items(status);

-- ============================================
-- HABILITAR SUPABASE REALTIME
-- (Ejecutar desde el Dashboard de Supabase o con permisos de superusuario)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_order_items;

-- ============================================
-- DATOS INICIALES: Zonas por defecto
-- (Se insertan solo si no existen, cada empresa las crea al activar el módulo)
-- ============================================
-- Las zonas se crean dinámicamente al activar el módulo desde el frontend.
