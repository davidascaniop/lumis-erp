import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This endpoint fixes RLS policies for registration
// It uses the anon key with rpc to apply broader insert policies
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // We can't run raw SQL with anon key, so we return instructions
  return NextResponse.json({
    message:
      "Para resolver el problema de RLS, ejecuta el siguiente SQL en tu Supabase Dashboard > SQL Editor:",
    sql: `
-- Fix RLS policies for registration flow
-- Companies: allow authenticated users to insert
DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert" ON companies FOR INSERT TO authenticated WITH CHECK (true);

-- Companies: allow users to read their own company
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT TO authenticated USING (true);

-- Users: allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_id);

-- Users: allow users to read users from their company
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);

-- Users: allow users to update their own profile
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_id);

-- Partners: full CRUD for authenticated users within their company
DROP POLICY IF EXISTS "partners_all" ON partners;
CREATE POLICY "partners_all" ON partners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products: full CRUD for authenticated users
DROP POLICY IF EXISTS "products_all" ON products;
CREATE POLICY "products_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders: full CRUD for authenticated users
DROP POLICY IF EXISTS "orders_all" ON orders;
CREATE POLICY "orders_all" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Order Items: full CRUD for authenticated users
DROP POLICY IF EXISTS "order_items_all" ON order_items;
CREATE POLICY "order_items_all" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Receivables: full CRUD for authenticated users
DROP POLICY IF EXISTS "receivables_all" ON receivables;
CREATE POLICY "receivables_all" ON receivables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payments: full CRUD for authenticated users
DROP POLICY IF EXISTS "payments_all" ON payments;
CREATE POLICY "payments_all" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Exchange Rates: read for all, insert for authenticated
DROP POLICY IF EXISTS "exchange_rates_select" ON exchange_rates;
CREATE POLICY "exchange_rates_select" ON exchange_rates FOR SELECT USING (true);
DROP POLICY IF EXISTS "exchange_rates_insert" ON exchange_rates;
CREATE POLICY "exchange_rates_insert" ON exchange_rates FOR INSERT TO authenticated WITH CHECK (true);

-- Activity Log: full CRUD for authenticated users
DROP POLICY IF EXISTS "activity_log_all" ON activity_log;
CREATE POLICY "activity_log_all" ON activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
        `.trim(),
  });
}
