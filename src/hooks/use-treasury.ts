"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useTreasuryAccounts(companyId: string | undefined) {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("treasury_accounts")
        .select("id, name, type, currency, current_balance, platform")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      setAccounts(data || []);
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  return { accounts, loading };
}

/**
 * Register a treasury movement: updates account balance + inserts movement record.
 * This handles the atomic operation client-side with sequential updates.
 */
export async function registerTreasuryMovement(params: {
  companyId: string;
  accountId: string;
  type: "entrada" | "salida";
  amount: number;
  currency: string;
  description: string;
  category: string;
  originModule: "ventas" | "cxc" | "gastos" | "compras" | "recurrentes" | "manual" | "transferencia";
  referenceId?: string;
}) {
  const supabase = createClient();
  const { companyId, accountId, type, amount, currency, description, category, originModule, referenceId } = params;

  // 1. Get current balance
  const { data: account, error: fetchErr } = await supabase
    .from("treasury_accounts")
    .select("current_balance, min_alert_balance, name")
    .eq("id", accountId)
    .single();

  if (fetchErr || !account) throw new Error("Cuenta no encontrada");

  const currentBalance = Number(account.current_balance);
  const newBalance = type === "entrada" ? currentBalance + amount : currentBalance - amount;

  // 2. Update balance
  const { error: updateErr } = await supabase
    .from("treasury_accounts")
    .update({ current_balance: newBalance })
    .eq("id", accountId);

  if (updateErr) throw updateErr;

  // 3. Insert movement
  const { error: insertErr } = await supabase
    .from("treasury_movements")
    .insert({
      company_id: companyId,
      account_id: accountId,
      type,
      amount,
      currency,
      description,
      category,
      origin_module: originModule,
      reference_id: referenceId || null,
      balance_after: newBalance,
    });

  if (insertErr) throw insertErr;

  // 4. Return alert info
  const minAlert = Number(account.min_alert_balance || 0);
  return {
    newBalance,
    accountName: account.name,
    isLowBalance: minAlert > 0 && newBalance < minAlert,
    isNegativeOrZero: newBalance <= 0,
  };
}
