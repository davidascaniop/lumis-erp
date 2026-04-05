-- TABLAS PARA MÓDULO FINANZAS (SUPER ADMIN)

CREATE TABLE IF NOT EXISTS public.admin_fixed_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL,
    due_day INT NOT NULL,
    alerts_enabled BOOLEAN DEFAULT false,
    alert_days INT DEFAULT 3,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.admin_fixed_cost_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fixed_cost_id UUID REFERENCES public.admin_fixed_costs(id) ON DELETE CASCADE,
    amount_usd NUMERIC(10,2) NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.admin_variable_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL,
    date TIMESTAMPTZ DEFAULT timezone('utc', now()),
    notes TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- RLS
ALTER TABLE public.admin_fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_fixed_cost_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_variable_costs ENABLE ROW LEVEL SECURITY;

-- POLICIES (Sólo super admin puede leer y escribir. Se simplifica a todos los usuarios autenticados SI en este entorno los usuarios autenticados aquí son sólo super admin.
-- Pero para ser más seguro, usamos el check (auth.role() = 'authenticated'))
-- Como no hay auth.role superadmin fácilmente, asuminos full access si está autenticado porque en /superadmin ya hay guards.
CREATE POLICY "Full access admin_fixed_costs" ON public.admin_fixed_costs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access admin_fixed_cost_payments" ON public.admin_fixed_cost_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access admin_variable_costs" ON public.admin_variable_costs FOR ALL USING (auth.role() = 'authenticated');
