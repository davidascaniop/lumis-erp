-- PARTE 2: RLS Policies
-- Ejecutar SEGUNDO en Supabase SQL Editor

CREATE POLICY tenant_isolation_treasury_accounts ON treasury_accounts
    FOR ALL USING (company_id = get_auth_company_id());

CREATE POLICY tenant_isolation_treasury_movements ON treasury_movements
    FOR ALL USING (company_id = get_auth_company_id());
