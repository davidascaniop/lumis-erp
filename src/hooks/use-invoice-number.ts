"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Generates the next correlative invoice/ticket number for a company.
 * Format: V-000001 (tickets) | F-000001 (facturas formales)
 *
 * Uses the orders table field `invoice_number` if present, otherwise falls
 * back to counting existing numbered records to derive the sequence.
 *
 * NOTE: For true atomic sequences in production, use a Supabase DB function.
 * This client-side version is safe for single-session POS use cases.
 */
export async function getNextDocumentNumber(
  companyId: string,
  type: "ticket" | "factura",
): Promise<string> {
  const supabase = createClient();
  const prefix = type === "ticket" ? "V" : "F";

  try {
    // Count existing documents of this type for the company
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .like("invoice_number", `${prefix}-%`);

    if (error) throw error;

    const nextNum = (count ?? 0) + 1;
    const padded = String(nextNum).padStart(6, "0");
    return `${prefix}-${padded}`;
  } catch (err) {
    console.error("[getNextDocumentNumber] Error:", err);
    // Fallback to timestamp-based suffix
    const fallback = Date.now().toString().slice(-6);
    return `${prefix}-${fallback}`;
  }
}

/**
 * Saves the generated invoice number back to the order record.
 */
export async function saveDocumentNumber(
  orderId: string,
  documentNumber: string,
): Promise<void> {
  const supabase = createClient();
  try {
    await supabase
      .from("orders")
      .update({ invoice_number: documentNumber } as any)
      .eq("id", orderId);
  } catch (err) {
    console.error("[saveDocumentNumber] Error:", err);
  }
}
