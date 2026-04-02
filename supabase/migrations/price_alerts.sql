-- PASO 3: Tabla de alertas de precios
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    old_price NUMERIC(18,4) NOT NULL,
    new_price NUMERIC(18,4) NOT NULL,
    variation_percent NUMERIC(18,2) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'precio_subida' o 'precio_bajada'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for company" ON public.price_alerts;
CREATE POLICY "Enable all access for company" 
ON public.price_alerts FOR ALL 
USING (true) WITH CHECK (true);

-- Trigger para generar alertas automáticamente al insertar en purchase_price_history
CREATE OR REPLACE FUNCTION public.check_price_variation()
RETURNS TRIGGER AS $$
DECLARE
    prev_price NUMERIC(18,4);
    var_percent NUMERIC(18,2);
    a_type VARCHAR(50);
BEGIN
    -- Buscar el precio anterior (el más reciente antes del registro actual)
    SELECT unit_price_usd INTO prev_price
    FROM public.purchase_price_history
    WHERE product_id = NEW.product_id 
      AND supplier_id = NEW.supplier_id
      AND company_id = NEW.company_id
      AND id != NEW.id
    ORDER BY purchased_at DESC
    LIMIT 1;

    IF FOUND AND prev_price > 0 THEN
        var_percent := ((NEW.unit_price_usd - prev_price) / prev_price) * 100;
        
        IF var_percent > 10 THEN
            a_type := 'precio_subida';
        ELSIF var_percent < -10 THEN
            a_type := 'precio_bajada';
        ELSE
            RETURN NEW;
        END IF;

        -- Insertar alerta
        INSERT INTO public.price_alerts (
            company_id, product_id, supplier_id, old_price, new_price, variation_percent, alert_type
        ) VALUES (
            NEW.company_id, NEW.product_id, NEW.supplier_id, prev_price, NEW.unit_price_usd, var_percent, a_type
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_price_variation_alert ON public.purchase_price_history;
CREATE TRIGGER trigger_price_variation_alert
AFTER INSERT ON public.purchase_price_history
FOR EACH ROW
EXECUTE FUNCTION public.check_price_variation();
