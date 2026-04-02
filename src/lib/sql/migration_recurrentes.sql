-- MIGRATION: RECURRING EXPENSES & FINANCE RESTRUCTURE

-- 1. Create recurring_expenses table
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    beneficiary_name TEXT,
    partner_id UUID REFERENCES partners(id),
    amount_usd DECIMAL(15,2) NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'Mensual', -- Semanal, Quincenal, Mensual, Bimestral, Anual
    due_day INTEGER NOT NULL DEFAULT 1, -- Day of month or week
    alert_days INTEGER DEFAULT 3, 
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enhance expenses table (for operational data)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='beneficiary_name') THEN
        ALTER TABLE expenses ADD COLUMN beneficiary_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='amount_bs') THEN
        ALTER TABLE expenses ADD COLUMN amount_bs DECIMAL(15,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='recurring_expense_id') THEN
        ALTER TABLE expenses ADD COLUMN recurring_expense_id UUID REFERENCES recurring_expenses(id);
    END IF;
END $$;

-- 3. Enhance transactions table (for linkage)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='expense_id') THEN
        ALTER TABLE transactions ADD COLUMN expense_id UUID REFERENCES expenses(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='recurring_expense_id') THEN
        ALTER TABLE transactions ADD COLUMN recurring_expense_id UUID REFERENCES recurring_expenses(id);
    END IF;
END $$;
