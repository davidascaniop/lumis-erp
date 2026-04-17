-- =====================================================================
-- FIX RLS: Permitir el auto-registro de empresas (signup público)
--
-- Problema:
--   La policy "companies_access" (creada por fix-rls-superadmin-bypass.sql)
--   es FOR ALL con USING = "id = get_my_company_id() OR is_superadmin()".
--   En PostgreSQL, cuando una policy FOR ALL no tiene WITH CHECK explícito,
--   Postgres usa el USING como WITH CHECK para INSERT/UPDATE.
--   Pero un usuario recién registrado NO tiene fila en public.users todavía,
--   así que get_my_company_id() devuelve NULL → el INSERT falla con
--   "new row violates row-level security policy for table companies".
--
-- Solución:
--   Añadir una policy permisiva adicional para INSERT que deje crear SU
--   propia company a cualquier usuario autenticado que aún no tenga una.
--   Las otras operaciones (SELECT/UPDATE/DELETE) siguen bloqueadas por la
--   policy "companies_access" original — no se afloja nada de seguridad.
--
--   El mismo problema aplica para subscription_payments (flujo de pago),
--   así que también lo arreglamos acá.
--
-- Cómo ejecutar:
--   Pega este archivo completo en el SQL Editor de Supabase y ejecuta.
-- =====================================================================

-- ─── companies: permitir INSERT durante el signup inicial ─────────────
DROP POLICY IF EXISTS "companies_signup_insert" ON public.companies;
CREATE POLICY "companies_signup_insert" ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- El usuario está autenticado (Supabase JWT válido) pero aún no tiene
    -- una empresa asociada → es un signup legítimo.
    public.get_my_company_id() IS NULL
  );

-- ─── users: permitir INSERT del propio perfil al terminar el signup ───
-- La policy users_access ya contempla "auth_id = auth.uid()" vía FOR ALL,
-- pero lo explicitamos para que sea más resistente a cambios futuros.
DROP POLICY IF EXISTS "users_signup_insert" ON public.users;
CREATE POLICY "users_signup_insert" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

-- ─── subscription_payments: permitir INSERT del 1er pago al registrarse
-- Aplica solo al flujo de pago (Starter/Pro/Enterprise). El demo no usa
-- esta tabla. Sólo permitimos insertar con status='pending' — los cambios
-- a 'approved'/'rejected' los hace el superadmin desde su panel y ya están
-- cubiertos por "subscription_payments_access" + is_superadmin().
DROP POLICY IF EXISTS "subscription_payments_signup_insert" ON public.subscription_payments;
CREATE POLICY "subscription_payments_signup_insert" ON public.subscription_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (status = 'pending');

-- Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
