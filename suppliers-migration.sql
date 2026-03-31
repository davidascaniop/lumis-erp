-- ============================================================
-- MIGRACIÓN: Columnas adicionales para tabla suppliers
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category      VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes         TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT true;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS last_purchase_at TIMESTAMPTZ;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- Activar todos los proveedores existentes
UPDATE suppliers SET is_active = true WHERE is_active IS NULL;

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(company_id, category);
