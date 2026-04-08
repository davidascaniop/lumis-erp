-- ============================================
-- TABLA: UNIDADES DE MEDIDA
-- ============================================
CREATE TABLE IF NOT EXISTS product_units (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(20) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- RLS
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_product_units" ON product_units
  FOR ALL USING (company_id = get_auth_company_id());

-- ============================================
-- SEED DATA (Base Master List)
-- ============================================
-- Nota: Este insert asume que se ejecuta una vez por empresa o se adapta 
-- para insertar las unidades base a cada nueva empresa.
-- Para esta tarea, insertaremos las unidades para una empresa específica si es necesario,
-- o simplemente las definimos como el estándar.

-- Función para inicializar unidades en una empresa
CREATE OR REPLACE FUNCTION initialize_company_units(target_company_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO product_units (company_id, name, slug)
  VALUES 
    (target_company_id, 'Unidad', 'und'),
    (target_company_id, 'Caja', 'cja'),
    (target_company_id, 'Paquete', 'pqt'),
    (target_company_id, 'Set / Juego', 'set'),
    (target_company_id, 'Kit', 'kit'),
    (target_company_id, 'Tubo', 'tbo'),
    (target_company_id, 'Frasco', 'frs'),
    (target_company_id, 'Rollo', 'rlo'),
    (target_company_id, 'Blíster', 'blis'),
    (target_company_id, 'Gramos', 'g'),
    (target_company_id, 'Kilogramos', 'kg'),
    (target_company_id, 'Mililitros', 'ml'),
    (target_company_id, 'Litros', 'l')
  ON CONFLICT (company_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
