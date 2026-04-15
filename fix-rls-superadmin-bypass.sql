-- =====================================================
-- FIX DB-02: Superadmin bypass en políticas RLS
-- Ejecutar en SQL Editor de Supabase
-- =====================================================

-- Actualizar la función helper para incluir bypass de superadmin
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Helper para verificar si el usuario actual es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'superadmin' FROM users WHERE auth_id = auth.uid() LIMIT 1),
    false
  );
$$;

-- ─── Actualizar políticas CRÍTICAS para incluir superadmin bypass ───

-- subscription_payments: superadmin necesita ver pagos de todas las empresas
DROP POLICY IF EXISTS "subscription_payments_access" ON public.subscription_payments;
CREATE POLICY "subscription_payments_access" ON public.subscription_payments
  FOR ALL USING (
    company_id = public.get_my_company_id()
    OR public.is_superadmin()
  );

-- companies: superadmin necesita ver todas las empresas
DROP POLICY IF EXISTS "companies_access" ON public.companies;
CREATE POLICY "companies_access" ON public.companies
  FOR ALL USING (
    id = public.get_my_company_id()
    OR public.is_superadmin()
  );

-- users: superadmin necesita gestionar usuarios de todas las empresas
DROP POLICY IF EXISTS "users_access" ON public.users;
CREATE POLICY "users_access" ON public.users
  FOR ALL USING (
    company_id = public.get_my_company_id()
    OR auth_id = auth.uid()
    OR public.is_superadmin()
  );

-- orders: superadmin necesita ver reportes de todas las empresas
DROP POLICY IF EXISTS "orders_access" ON public.orders;
CREATE POLICY "orders_access" ON public.orders
  FOR ALL USING (
    company_id = public.get_my_company_id()
    OR public.is_superadmin()
  );

-- daily_seeds: tabla del superadmin (sin company_id)
DROP POLICY IF EXISTS "daily_seeds_access" ON public.daily_seeds;
CREATE POLICY "daily_seeds_access" ON public.daily_seeds
  FOR ALL USING (true);

-- seed_views: cualquier autenticado puede registrar vista
DROP POLICY IF EXISTS "seed_views_access" ON public.seed_views;
CREATE POLICY "seed_views_access" ON public.seed_views
  FOR ALL USING (true);

-- user_invitations: solo superadmin
DROP POLICY IF EXISTS "user_invitations_access" ON public.user_invitations;
CREATE POLICY "user_invitations_access" ON public.user_invitations
  FOR ALL USING (public.is_superadmin());

-- broadcast_reads: cualquier autenticado puede marcar como leído
DROP POLICY IF EXISTS "broadcast_reads_access" ON public.broadcast_reads;
CREATE POLICY "broadcast_reads_access" ON public.broadcast_reads
  FOR ALL USING (true);

-- Recargar schema
NOTIFY pgrst, 'reload schema';
