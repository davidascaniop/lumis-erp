-- PARTE 1: Tablas, Índices y RLS
-- Ejecutar PRIMERO en Supabase SQL Editor

-- 1. Create treasury_accounts table
CREATE TABLE IF NOT EXISTS treasury_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    alias TEXT,
    type TEXT NOT NULL CHECK (type IN ('banco', 'efectivo', 'digital', 'crypto')),
    platform TEXT,
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
    reference_id UUID,
    balance_after DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_company ON treasury_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_company ON treasury_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_account ON treasury_movements(account_id);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_origin ON treasury_movements(origin_module);
CREATE INDEX IF NOT EXISTS idx_treasury_movements_created ON treasury_movements(created_at DESC);

-- 4. Enable RLS
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_movements ENABLE ROW LEVEL SECURITY;
