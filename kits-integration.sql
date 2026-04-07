-- ==========================================
-- SCRIPT DE INTEGRACIÓN DE KITS (SUPABASE) - V3
-- ==========================================
-- Instrucciones:
-- 1. Copia y pega todo este código en tu SQL Editor de Supabase.
-- 2. Haz clic en "Run" (Ejecutar).
-- Esto CREARÁ la tabla de componentes Y ACTUALIZARÁ la de pedidos con el historial.

-- 1. Tabla para los componentes de cada kit (Relación many-to-many)
CREATE TABLE IF NOT EXISTS product_kit_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id       UUID REFERENCES products(id) ON DELETE CASCADE,
  component_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity     DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kit_id, component_id)
);

-- 2. Habilitar RLS (Seguridad a nivel de fila)
ALTER TABLE product_kit_items ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso (Solo la compañía dueña del kit puede acceder)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'kit_items_policy' AND tablename = 'product_kit_items'
    ) THEN
        CREATE POLICY "kit_items_policy" ON product_kit_items FOR ALL 
        USING (
          kit_id IN (
            SELECT id FROM products 
            WHERE company_id = (
              SELECT company_id FROM users WHERE auth_id = auth.uid()
            )
          )
        );
    END IF;
END
$$;

-- 4. ACTUALIZAR TABLA DE VENTAS PARA HISTORIAL DE KITS (V3 incluye kit_description)
DO $$
BEGIN
    -- Añadir columna is_kit (Boolean)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='is_kit') THEN
        ALTER TABLE order_items ADD COLUMN is_kit BOOLEAN DEFAULT false;
    END IF;
    
    -- Añadir columna kit_name (Nombre original)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='kit_name') THEN
        ALTER TABLE order_items ADD COLUMN kit_name TEXT;
    END IF;

    -- Añadir columna kit_description (Lista de componentes como texto fijo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='kit_description') THEN
        ALTER TABLE order_items ADD COLUMN kit_description TEXT;
    END IF;
END
$$;
