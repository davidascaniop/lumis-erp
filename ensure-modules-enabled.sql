-- ============================================
-- Asegurar la existencia de modules_enabled
-- ============================================

-- Este script asegura que la columna modules_enabled exista en la tabla companies,
-- utilizada para el almacenamiento persistente de la activación de módulos.

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS modules_enabled JSONB DEFAULT '[]';
