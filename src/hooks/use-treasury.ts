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
  amount: number;       // always in USD (or the source currency)
  currency: string;     // source currency: "usd" | "bs" | "usdt"
  description: string;
  category: string;
  originModule: "ventas" | "cxc" | "gastos" | "compras" | "recurrentes" | "manual" | "transferencia";
  referenceId?: string;
  bcvRate?: number;     // required when account is Bs and amount is in USD
}) {
  const supabase = createClient();
  const { companyId, accountId, type, amount, currency, description, category, originModule, referenceId, bcvRate } = params;

  // 1. Get current balance AND account currency
  const { data: account, error: fetchErr } = await supabase
    .from("treasury_accounts")
    .select("current_balance, min_alert_balance, name, currency")
    .eq("id", accountId)
    .single();

  if (fetchErr || !account) throw new Error("Cuenta no encontrada");

  // 2. Convert amount to the account's native currency if needed
  let effectiveAmount = amount;
  if (account.currency === "bs" && (currency === "usd" || currency === "usdt")) {
    const rate = bcvRate || 1;
    effectiveAmount = amount * rate;
  } else if ((account.currency === "usd" || account.currency === "usdt") && currency === "bs") {
    const rate = bcvRate || 1;
    effectiveAmount = rate > 0 ? amount / rate : amount;
  }

  const currentBalance = Number(account.current_balance);
  const newBalance = type === "entrada" ? currentBalance + effectiveAmount : currentBalance - effectiveAmount;

  // 2. Update balance
  const { error: updateErr } = await supabase
    .from("treasury_accounts")
    .update({ current_balance: newBalance })
    .eq("id", accountId);

  if (updateErr) throw updateErr;

  // 3. Insert movement (store in account's native currency)
  const { error: insertErr } = await supabase
    .from("treasury_movements")
    .insert({
      company_id: companyId,
      account_id: accountId,
      type,
      amount: effectiveAmount,
      currency: account.currency,
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
