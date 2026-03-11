"use server";

import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// ─── Helper: obtener company_id del usuario autenticado ──────
async function getCompanyId(supabase: any): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data } = await supabase
    .from("users")
    .select("company_id")
    .eq("auth_id", user.id)
    .single();
  if (!data?.company_id) throw new Error("Empresa no encontrada");
  return data.company_id;
}

// ─── Generar token único para un cliente ────────────────────
export async function generatePortalToken(partnerId: string) {
  const supabase = await createClient();
  const companyId = await getCompanyId(supabase);
  const token = nanoid(32);

  const { error } = await supabase.from("payment_portal_tokens").insert({
    token,
    company_id: companyId,
    partner_id: partnerId,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  } as any);

  if (error) throw new Error("No se pudo generar el token");

  await supabase.from("activity_log").insert({
    company_id: companyId,
    entity_type: "partner",
    entity_id: partnerId,
    type: "system",
    content: "Portal de pago generado y enviado al cliente",
  } as any);

  revalidatePath("/dashboard/clientes");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    token,
    url: `${appUrl}/portal/${token}`,
  };
}

// ─── Obtener datos del portal (ruta pública, sin auth) ──────
export async function getPortalData(token: string) {
  const supabase = await createClient();

  const { data: tokenData } = await supabase
    .from("payment_portal_tokens")
    .select(
      `
            *,
            partner:partners(id, name, rif, phone, whatsapp),
            company:companies(name, logo_url, primary_color)
        `,
    )
    .eq("token", token)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!tokenData) return null;

  // Actualizar último acceso
  await supabase
    .from("payment_portal_tokens")
    .update({
      last_access: new Date().toISOString(),
      access_count: (tokenData as any).access_count + 1,
    } as any)
    .eq("token", token);

  // Facturas pendientes del cliente
  const { data: receivables } = await supabase
    .from("receivables")
    .select("*, order:orders(order_number)")
    .eq("partner_id", (tokenData as any).partner_id)
    .neq("status", "paid")
    .order("due_date", { ascending: true });

  return {
    partner: (tokenData as any).partner,
    company: (tokenData as any).company,
    receivables: receivables ?? [],
    tokenId: (tokenData as any).id,
    companyId: (tokenData as any).company_id,
  };
}

// ─── Registrar pago desde el portal ─────────────────────────
export async function submitPortalPayment(data: {
  token: string;
  receivableId: string;
  amount: number;
  method: string;
  reference: string;
  clientName: string;
  clientPhone: string;
  proofUrl?: string;
}) {
  const supabase = await createClient();

  const { data: tokenData } = await supabase
    .from("payment_portal_tokens")
    .select("id, company_id, partner_id")
    .eq("token", data.token)
    .eq("is_active", true)
    .single();

  if (!tokenData) throw new Error("Token inválido o expirado");

  const td = tokenData as any;

  // Tasa BCV actual
  const { data: bcv } = await supabase
    .from("exchange_rates")
    .select("rate_bs")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  const rate = (bcv as any)?.rate_bs ?? 1;

  // Registrar pago con status 'pending'
  const { error } = await supabase.from("payments").insert({
    company_id: td.company_id,
    receivable_id: data.receivableId,
    partner_id: td.partner_id,
    amount_usd: data.amount,
    amount_bs: data.amount * rate,
    exchange_rate: rate,
    payment_method: data.method,
    reference: data.reference,
    status: "pending",
    submitted_by: "client_portal",
    portal_token_id: td.id,
    proof_url: data.proofUrl ?? null,
    client_name: data.clientName,
    client_phone: data.clientPhone,
  } as any);

  if (error) throw new Error("Error al registrar el pago");

  // Crear notificación para el dashboard interno
  await supabase.from("activity_log").insert({
    company_id: td.company_id,
    entity_type: "payment",
    entity_id: td.partner_id,
    type: "client_payment",
    content: `💳 ${data.clientName} registró un pago de $${data.amount.toFixed(2)} vía ${data.method} — pendiente de verificación`,
    metadata: JSON.stringify({
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      client_name: data.clientName,
      client_phone: data.clientPhone,
      proof_url: data.proofUrl ?? null,
      receivable_id: data.receivableId,
    }),
  } as any);

  return { success: true };
}
