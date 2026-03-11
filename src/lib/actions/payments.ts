"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calcCreditStatus } from "./partners";

export async function verifyPayment(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // 1. Obtener pago
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .select("*, receivables(balance_usd, paid_usd)")
    .eq("id", paymentId)
    .single();

  if (pErr || !payment) return { error: "Pago no encontrado" };
  if (payment.status === "verified") return { error: "Pago ya verificado" };

  const verifiedAt = new Date().toISOString();

  // 2. Actualizar pago
  await supabase
    .from("payments")
    .update({
      status: "verified",
      verified_by: user.id,
      verified_at: verifiedAt,
    })
    .eq("id", paymentId);

  // 3. Actualizar Rx
  const prevPaid = Number(payment.receivables?.paid_usd || 0);
  const prevBalance = Number(payment.receivables?.balance_usd || 0);
  const amount = Number(payment.amount_usd);

  const newPaid = prevPaid + amount;
  const newBalance = Math.max(0, prevBalance - amount);
  const newStatus = newBalance <= 0.01 ? "paid" : "partial"; // Margen de error para punto flotante

  await supabase
    .from("receivables")
    .update({
      paid_usd: newPaid,
      balance_usd: newBalance,
      status: newStatus,
    })
    .eq("id", payment.receivable_id);

  // 4. Actualizar Partner current_balance
  const { data: allRx } = await supabase
    .from("receivables")
    .select("balance_usd, due_date")
    .eq("partner_id", payment.partner_id)
    .neq("status", "paid");

  const totalDebt =
    allRx?.reduce((acc, r) => acc + Number(r.balance_usd), 0) || 0;

  // 5. Recalcular Status
  const creditStatus = calcCreditStatus(allRx || []);

  await supabase
    .from("partners")
    .update({
      current_balance: totalDebt,
      credit_status: creditStatus,
    })
    .eq("id", payment.partner_id);

  // 6. Log Actividad
  await supabase.from("activity_log").insert({
    company_id: payment.company_id,
    entity_type: "payment",
    entity_id: payment.id,
    user_id: user.id,
    type: "system",
    content: `Abono de $${amount.toFixed(2)} verificado.`,
  });

  // 7. Revalidar
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cobranza");
  revalidatePath(`/dashboard/clientes/${payment.partner_id}`);

  return { success: true };
}
