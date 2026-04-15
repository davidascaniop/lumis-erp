-- RPC: Dashboard data en 1 sola llamada
-- Ejecutar en SQL Editor de Supabase

CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_company_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_start_month timestamptz;
  v_today_start timestamptz;
  v_today_end timestamptz;
  v_thirty_days_ago timestamptz;
  v_eight_months_ago timestamptz;
BEGIN
  v_start_month := date_trunc('month', now());
  v_today_start := date_trunc('day', now());
  v_today_end := v_today_start + interval '1 day';
  v_thirty_days_ago := now() - interval '30 days';
  v_eight_months_ago := date_trunc('month', now() - interval '7 months');

  SELECT json_build_object(
    'receivables', COALESCE((
      SELECT json_agg(r)
      FROM (
        SELECT balance_usd, amount_usd, due_date, status, created_at
        FROM receivables
        WHERE company_id = p_company_id AND status != 'paid'
      ) r
    ), '[]'::json),

    'payments_verified', COALESCE((
      SELECT json_agg(p)
      FROM (
        SELECT amount_usd, verified_at, created_at
        FROM payments
        WHERE company_id = p_company_id
          AND status = 'verified'
          AND verified_at >= v_start_month
      ) p
    ), '[]'::json),

    'pending_verifications_count', (
      SELECT count(*)
      FROM payments
      WHERE company_id = p_company_id AND status = 'pending'
    ),

    'active_orders_count', (
      SELECT count(*)
      FROM orders
      WHERE company_id = p_company_id
        AND status IN ('draft', 'confirmed', 'dispatched', 'pending')
    ),

    'risk_clients', COALESCE((
      SELECT json_agg(rc)
      FROM (
        SELECT p.id, p.name, p.current_balance, p.credit_status,
               json_build_object('full_name', u.full_name) as users
        FROM partners p
        LEFT JOIN users u ON u.id = p.assigned_user_id
        WHERE p.company_id = p_company_id AND p.credit_status = 'red'
        ORDER BY p.current_balance DESC
        LIMIT 6
      ) rc
    ), '[]'::json),

    'orders_trend', COALESCE((
      SELECT json_agg(ot)
      FROM (
        SELECT total_usd, created_at
        FROM orders
        WHERE company_id = p_company_id
          AND created_at >= v_eight_months_ago
        ORDER BY created_at ASC
      ) ot
    ), '[]'::json),

    'new_clients_count', (
      SELECT count(*)
      FROM partners
      WHERE company_id = p_company_id AND created_at >= v_start_month
    ),

    'low_stock', COALESCE((
      SELECT json_agg(ls)
      FROM (
        SELECT id, name, stock, unit, min_stock
        FROM products
        WHERE company_id = p_company_id
          AND min_stock IS NOT NULL
        ORDER BY stock ASC
        LIMIT 5
      ) ls
    ), '[]'::json),

    'credits_due_today', COALESCE((
      SELECT json_agg(cd)
      FROM (
        SELECT r.id, r.balance_usd, r.due_date,
               json_build_object('name', p.name) as partners
        FROM receivables r
        LEFT JOIN partners p ON p.id = r.partner_id
        WHERE r.company_id = p_company_id
          AND r.status != 'paid'
          AND r.due_date >= v_today_start
          AND r.due_date < v_today_end
      ) cd
    ), '[]'::json),

    'top_clients_raw', COALESCE((
      SELECT json_agg(tc)
      FROM (
        SELECT r.partner_id, r.balance_usd,
               json_build_object('name', p.name) as partners
        FROM receivables r
        LEFT JOIN partners p ON p.id = r.partner_id
        WHERE r.company_id = p_company_id AND r.status != 'paid'
        ORDER BY r.balance_usd DESC
        LIMIT 20
      ) tc
    ), '[]'::json),

    'top_products_raw', COALESCE((
      SELECT json_agg(tp)
      FROM (
        SELECT oi.product_id, oi.qty, oi.subtotal,
               json_build_object('name', pr.name, 'unit', pr.unit) as products
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products pr ON pr.id = oi.product_id
        WHERE o.company_id = p_company_id
          AND o.created_at >= v_start_month
      ) tp
    ), '[]'::json),

    'recurring_expenses', COALESCE((
      SELECT json_agg(re)
      FROM (
        SELECT id, name, amount, due_day, alert_days, is_active
        FROM recurring_expenses
        WHERE company_id = p_company_id AND is_active = true
      ) re
    ), '[]'::json),

    'inactive_clients', COALESCE((
      SELECT json_agg(ic)
      FROM (
        SELECT id, name, last_order_at
        FROM partners
        WHERE company_id = p_company_id
          AND last_order_at < v_thirty_days_ago
        ORDER BY last_order_at ASC
        LIMIT 10
      ) ic
    ), '[]'::json),

    'overdue_receivables', COALESCE((
      SELECT json_agg(ovr)
      FROM (
        SELECT r.id, r.invoice_number, r.balance_usd, r.due_date,
               json_build_object('name', p.name) as partners
        FROM receivables r
        LEFT JOIN partners p ON p.id = r.partner_id
        WHERE r.company_id = p_company_id
          AND r.status != 'paid'
          AND r.due_date < v_today_start
        ORDER BY r.due_date ASC
        LIMIT 10
      ) ovr
    ), '[]'::json)

  ) INTO result;

  RETURN result;
END;
$$;

-- Dar acceso al rol autenticado
GRANT EXECUTE ON FUNCTION public.get_dashboard_data(uuid) TO authenticated;
