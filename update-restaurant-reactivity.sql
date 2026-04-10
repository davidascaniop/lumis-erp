-- =======================================================
-- ACTUALIZACIÓN DE REACTIVIDAD - MÓDULO RESTAURANTE
-- =======================================================
-- Este script aplica los cambios necesarios para mejorar la 
-- confiabilidad y velocidad de Supabase Realtime en el módulo.

-- 1. Añadir company_id a los items para facilitar el RLS y Realtime
ALTER TABLE restaurant_order_items 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. Migrar los datos existentes (copiar company_id del pedido padre a los items existentes)
UPDATE restaurant_order_items roi
SET company_id = ro.company_id
FROM restaurant_orders ro
WHERE roi.order_id = ro.id AND roi.company_id IS NULL;

-- 3. Actualizar la política RLS para que sea más directa y rápida
DROP POLICY IF EXISTS "tenant_isolation_restaurant_order_items" ON restaurant_order_items;

CREATE POLICY "tenant_isolation_restaurant_order_items" ON restaurant_order_items
  FOR ALL USING (company_id = get_auth_company_id());

-- 4. Crear índice para optimizar consultas de Realtime
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_company ON restaurant_order_items(company_id);

-- 5. Configurar REPLICA IDENTITY FULL
-- Esto hace que Postgres envíe el registro COMPLETO en eventos UPDATE y DELETE a Realtime,
-- asegurando que el frontend siempre tenga toda la información para actualizar el estado local.
ALTER TABLE restaurant_tables REPLICA IDENTITY FULL;
ALTER TABLE restaurant_orders REPLICA IDENTITY FULL;
ALTER TABLE restaurant_order_items REPLICA IDENTITY FULL;
