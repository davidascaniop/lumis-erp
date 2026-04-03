-- PARTE 3: Función atómica
-- Ejecutar TERCERO en Supabase SQL Editor

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
AS $fn$
DECLARE
    v_new_balance DECIMAL;
    v_movement_id UUID;
BEGIN
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
        UPDATE treasury_accounts
        SET current_balance = current_balance - p_amount
        WHERE id = p_account_id AND company_id = p_company_id
        RETURNING current_balance INTO v_new_balance;
    END IF;

    IF v_new_balance IS NULL THEN
        RAISE EXCEPTION 'Account not found or not owned by company';
    END IF;

    INSERT INTO treasury_movements (
        company_id, account_id, type, amount, currency,
        description, category, origin_module, reference_id, balance_after
    ) VALUES (
        p_company_id, p_account_id, p_type, p_amount, p_currency,
        p_description, p_category, p_origin_module, p_reference_id, v_new_balance
    ) RETURNING id INTO v_movement_id;

    RETURN v_movement_id;
END;
$fn$;
