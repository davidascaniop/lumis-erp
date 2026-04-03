-- MIGRATION: TREASURY ACCOUNTS & MOVEMENTS
-- Módulo de Tesorería y Flujo de Caja para LUMIS ERP

-- 1. Create treasury_accounts table
CREATE TABLE IF NOT EXISTS treasury_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    alias TEXT,
    type TEXT NOT NULL CHECK (type IN ('banco', 'efectivo', 'digital', 'crypto')),
    platform TEXT, -- Banesco, Mercantil, Zelle, Binance, Zinli, etc.
    account_number TEXT,
    currency TEXT NOT NULL DEFAULT 'usd' CHECK (currency IN ('bs', 'usd', 'usdt')),
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_alert_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create treasury_movements table
CREATE TABLE IF NOT EXISTS treasury_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    account_id UUID NOT NULL REFERENCES treasury_accounts(id),
    type TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'transferencia')),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    description TEXT,
    category TEXT,
    origin_module TEXT NOT NULL CHECK (origin_module IN ('ventas', 'cxc', 'gastos', 'compras', 'recurrentes', 'manual', 'transferencia')),
    reference_id UUID, -- ID del registro de origen (order_id, expense_id, etc.)
    balance_after DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_company ON treasury_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_company ON treasury_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_account ON treasury_movements(account_id);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_origin ON treasury_movements(origin_module);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_created ON treasury_movements(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_movements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (tenant isolation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_treasury_accounts') THEN
        CREATE POLICY tenant_isolation_treasury_accounts ON treasury_accounts
            FOR ALL USING (company_id = get_auth_company_id());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_treasury_movements') THEN
        CREATE POLICY tenant_isolation_treasury_movements ON treasury_movements
            FOR ALL USING (company_id = get_auth_company_id());
    END IF;
END $$;

-- 6. Atomic function for treasury operations (update balance + insert movement)
CREATE OR REPLACE FUNCTION treasury_register_movement(
    p_company_id UUID,
    p_account_id UUID,
    p_type TEXT,
    p_amount DECIMAL,
    p_currency TEXT,
    p_description TEXT,
    p_category TEXT,
    p_origin_module TEXT,
    p_reference_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance DECIMAL;
    v_movement_id UUID;
BEGIN
    -- Lock the account row to prevent race conditions
    IF p_type = 'entrada' THEN
        UPDATE treasury_accounts
        SET current_balance = current_balance + p_amount
        WHERE id = p_account_id AND company_id = p_company_id
        RETURNING current_balance INTO v_new_balance;
    ELSIF p_type = 'salida' THEN
        UPDATE treasury_accounts
        SET current_balance = current_balance - p_amount
        WHERE id = p_account_id AND company_id = p_company_id
        RETURNING current_balance INTO v_new_balance;
    ELSIF p_type = 'transferencia' THEN
        -- For transfers, we handle the debit side here
        UPDATE treasury_accounts
        SET current_balance = current_balance - p_amount
        WHERE id = p_account_id AND company_id = p_company_id
        RETURNING current_balance INTO v_new_balance;
    END IF;

    IF v_new_balance IS NULL THEN
        RAISE EXCEPTION 'Account not found or not owned by company';
    END IF;

    -- Insert the movement record
    INSERT INTO treasury_movements (
        company_id, account_id, type, amount, currency,
        description, category, origin_module, reference_id, balance_after
    ) VALUES (
        p_company_id, p_account_id, p_type, p_amount, p_currency,
        p_description, p_category, p_origin_module, p_reference_id, v_new_balance
    ) RETURNING id INTO v_movement_id;

    RETURN v_movement_id;
END;
$$;
