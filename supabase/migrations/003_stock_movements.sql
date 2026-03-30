-- =============================================
-- Migración: Tabla stock_movements
-- Módulo: Ajustes de Stock / Almacén
-- =============================================

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'SALE', 'PURCHASE')),
    qty NUMERIC NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_select" ON stock_movements
    FOR SELECT USING (true);

CREATE POLICY "stock_movements_insert" ON stock_movements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "stock_movements_update" ON stock_movements
    FOR UPDATE USING (true);
