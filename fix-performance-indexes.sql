-- PERFORMANCE: Indices para acelerar queries pesadas

-- Dashboard: receivables filtradas por company + status
CREATE INDEX IF NOT EXISTS idx_receivables_company_status
  ON public.receivables (company_id, status);

-- Dashboard: receivables por due_date (creditos vencidos)
CREATE INDEX IF NOT EXISTS idx_receivables_company_due
  ON public.receivables (company_id, due_date)
  WHERE status != 'paid';

-- Dashboard: payments verificados por mes
CREATE INDEX IF NOT EXISTS idx_payments_company_status
  ON public.payments (company_id, status);

-- Dashboard + Ventas: orders por company + status
CREATE INDEX IF NOT EXISTS idx_orders_company_status
  ON public.orders (company_id, status);

-- Dashboard: orders para trend por fecha
CREATE INDEX IF NOT EXISTS idx_orders_company_created
  ON public.orders (company_id, created_at);

-- Productos: stock bajo
CREATE INDEX IF NOT EXISTS idx_products_company_stock
  ON public.products (company_id, stock_qty)
  WHERE min_stock IS NOT NULL;

-- Partners: clientes en mora
CREATE INDEX IF NOT EXISTS idx_partners_company_credit
  ON public.partners (company_id, credit_status);

-- Order items: para top productos
CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items (order_id, product_id);

-- Activity log: para actividad reciente
CREATE INDEX IF NOT EXISTS idx_activity_company_created
  ON public.activity_log (company_id, created_at DESC);

-- Users: busqueda por auth_id (usado en CADA request)
CREATE INDEX IF NOT EXISTS idx_users_auth_id
  ON public.users (auth_id);

-- Stock movements: historial por producto
CREATE INDEX IF NOT EXISTS idx_stock_movements_product
  ON public.stock_movements (company_id, product_id, created_at DESC);

-- Compras: purchase_price_history
CREATE INDEX IF NOT EXISTS idx_price_history_company_product
  ON public.purchase_price_history (company_id, product_id);

-- Notificaciones: price_alerts sin leer
CREATE INDEX IF NOT EXISTS idx_price_alerts_unread
  ON public.price_alerts (company_id, is_read)
  WHERE is_read = false;

-- Recurring expenses activos
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active
  ON public.recurring_expenses (company_id, is_active)
  WHERE is_active = true;

-- Funcion get_my_company_id: asegurar que sea STABLE
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

NOTIFY pgrst, 'reload schema';
