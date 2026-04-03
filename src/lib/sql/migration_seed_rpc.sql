-- MIGRATION: RPC functions para métricas de semillas
-- Estas funciones usan SECURITY DEFINER para bypassear RLS de forma segura
-- ya que cualquier usuario autenticado puede bendecir/compartir una semilla

-- 1. Incrementar blessings_count de forma atómica
CREATE OR REPLACE FUNCTION increment_seed_blessing(p_seed_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE daily_seeds
  SET blessings_count = COALESCE(blessings_count, 0) + 1
  WHERE id = p_seed_id;
END;
$$;

-- 2. Incrementar shares_count de forma atómica
CREATE OR REPLACE FUNCTION increment_seed_share(p_seed_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE daily_seeds
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = p_seed_id;
END;
$$;

-- 3. Incrementar views_count de forma atómica
CREATE OR REPLACE FUNCTION increment_seed_view(p_seed_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE daily_seeds
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_seed_id;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION increment_seed_blessing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_seed_share(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_seed_view(UUID) TO authenticated;
