-- MIGRATION: Add billing_day to companies
-- El día de corte mensual se calcula a partir del día en que se registró la empresa

-- 1. Agregar columna billing_day
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1
CHECK (billing_day >= 1 AND billing_day <= 28);

-- 2. Llenar con el día del mes de created_at para las empresas existentes
UPDATE companies
SET billing_day = EXTRACT(DAY FROM created_at)::INTEGER
WHERE billing_day = 1 AND created_at IS NOT NULL;

-- Limitar a máximo día 28 para evitar problemas en febrero
UPDATE companies
SET billing_day = 28
WHERE billing_day > 28;

-- Comentario: billing_day = 7 significa que si te registraste el 7 de abril,
-- tu fecha de corte es el 7 de cada mes.
