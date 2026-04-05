-- ============================================================
-- MIGRACIÓN: Agregar campo invoice_number a orders
-- ============================================================
-- Este campo almacena el número correlativo del documento impreso
-- Formato V-000001 (ticket rápido) | F-000001 (factura formal)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_type   VARCHAR(20) DEFAULT 'contado',
  ADD COLUMN IF NOT EXISTS amount_paid    DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_due     DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency       VARCHAR(10)  DEFAULT 'USD';

-- Índice para búsqueda por número de factura
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number);

-- Comentario
COMMENT ON COLUMN orders.invoice_number IS
  'Número correlativo de documento impreso. Formato: V-XXXXXX (ticket) | F-XXXXXX (factura formal)';
