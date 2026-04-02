-- PASO 1: Tablas para RFQ y Precios por Volumen

-- 1. Tabla principal de RFQ
CREATE TABLE IF NOT EXISTS public.purchase_rfq (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    rfq_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Borrador', -- Borrador, Enviada, Respondida, Convertida, Cancelada
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    notes TEXT
);

-- 2. Proveedores consultados por RFQ
CREATE TABLE IF NOT EXISTS public.purchase_rfq_suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID NOT NULL REFERENCES public.purchase_rfq(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    responded_at TIMESTAMPTZ,
    total_usd NUMERIC(18,4) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pendiente' -- Pendiente, Respondida, Rechazada
);

-- 3. Productos solicitados en la RFQ
CREATE TABLE IF NOT EXISTS public.purchase_rfq_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID NOT NULL REFERENCES public.purchase_rfq(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_requested NUMERIC(10,2) NOT NULL DEFAULT 1
);

-- 4. Cotizaciones (respuestas enviadas por los proveedores)
CREATE TABLE IF NOT EXISTS public.purchase_rfq_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID NOT NULL REFERENCES public.purchase_rfq(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_price_usd NUMERIC(18,4),
    delivery_days INTEGER,
    min_quantity NUMERIC(10,2),
    notes TEXT
);

-- 5. Tabla de precios por volumen
CREATE TABLE IF NOT EXISTS public.volume_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    min_quantity NUMERIC(10,2) NOT NULL,
    unit_price_usd NUMERIC(18,4) NOT NULL,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ
);

-- Seguridad (RLS)
ALTER TABLE public.purchase_rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_rfq_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_rfq_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volume_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for company" ON public.purchase_rfq;
CREATE POLICY "Enable all access for company" ON public.purchase_rfq FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for company" ON public.purchase_rfq_suppliers;
CREATE POLICY "Enable all access for company" ON public.purchase_rfq_suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for company" ON public.purchase_rfq_items;
CREATE POLICY "Enable all access for company" ON public.purchase_rfq_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for company" ON public.purchase_rfq_quotes;
CREATE POLICY "Enable all access for company" ON public.purchase_rfq_quotes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for company" ON public.volume_prices;
CREATE POLICY "Enable all access for company" ON public.volume_prices FOR ALL USING (true) WITH CHECK (true);
