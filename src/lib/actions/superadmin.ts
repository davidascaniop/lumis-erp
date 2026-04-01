"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Verificar que quien llama es superadmin ─────────────────
async function assertSuperAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", user?.id)
    .single();
  if (data?.role !== "superadmin") throw new Error("No autorizado");
  return { id: data.id };
}

// ─── Suspender empresa ───────────────────────────────────────
export async function suspendCompany(companyId: string, reason: string) {
  const supabase = await createClient();
  await assertSuperAdmin(supabase);

  await supabase
    .from("companies")
    .update({
      plan_status: "suspended",
      suspended_at: new Date().toISOString(),
      suspend_reason: reason,
    })
    .eq("id", companyId);

  revalidatePath("/superadmin/empresas");
}

// ─── Reactivar empresa ───────────────────────────────────────
export async function reactivateCompany(companyId: string) {
  const supabase = await createClient();
  await assertSuperAdmin(supabase);

  await supabase
    .from("companies")
    .update({
      plan_status: "active",
      suspended_at: null,
      suspend_reason: null,
    })
    .eq("id", companyId);

  revalidatePath("/superadmin/empresas");
}

// ─── Cambiar plan ─────────────────────────────────────────────
export async function changePlan(companyId: string, plan: string) {
  const supabase = await createClient();
  await assertSuperAdmin(supabase);

  const PLAN_PRICES: Record<string, number> = {
    emprendedor: 25,
    crecimiento: 55,
    corporativo: 120,
  };

  await supabase
    .from("companies")
    .update({
      plan,
      mrr_usd: PLAN_PRICES[plan] ?? 0,
    })
    .eq("id", companyId);

  revalidatePath("/superadmin/empresas");
}

// ─── Crear broadcast ─────────────────────────────────────────
export async function createBroadcast(data: {
  title: string;
  message: string;
  type: string;
  target: string;
  channel?: string;
  scheduled_for?: string | null;
}) {
  const supabase = await createClient();
  const user = await assertSuperAdmin(supabase);

  await supabase.from("broadcasts").insert({
    ...data,
    created_by: user.id,
    is_active: data.scheduled_for ? false : true,
    scheduled_for: data.scheduled_for || null,
    channel: data.channel || 'app',
  });

  revalidatePath("/superadmin/comunicacion");
}

// ─── Registrar pago de suscripción ───────────────────────────
export async function recordSubscriptionPayment(data: {
  company_id: string;
  plan: string;
  amount_usd: number;
  period_start: string;
  period_end: string;
  payment_method: string;
  reference?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const user = await assertSuperAdmin(supabase);

  await supabase.from("subscription_payments").insert({
    ...data,
    status: "paid",
    paid_at: new Date().toISOString(),
    recorded_by: user.id,
  });

  // Actualizar status de la empresa a activa si estaba overdue
  await supabase
    .from("companies")
    .update({ plan_status: "active", suspended_at: null })
    .eq("id", data.company_id)
    .in("plan_status", ["overdue", "trial"]);

  revalidatePath("/superadmin/suscripciones");
  revalidatePath("/superadmin/empresas");
}

// ─── Actualizar feature flag ──────────────────────────────────
export async function updateFeatureFlag(key: string, value: string) {
  const supabase = await createClient();
  const user = await assertSuperAdmin(supabase);

  await supabase
    .from("feature_flags")
    .update({
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  revalidatePath("/superadmin/config");
}

// ─── Upsert feature flag (crea o actualiza) ───────────────────
export async function upsertFeatureFlag(key: string, value: string, description?: string) {
  const supabase = await createClient();
  const user = await assertSuperAdmin(supabase);

  const { data: existing } = await supabase
    .from("feature_flags")
    .select("key")
    .eq("key", key)
    .single();

  if (existing) {
    await supabase
      .from("feature_flags")
      .update({
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        ...(description && { description }),
      })
      .eq("key", key);
  } else {
    // try inserting with just the minimum required
    await supabase
      .from("feature_flags")
      .insert({
        key,
        value,
        ...(description && { description }),
        updated_by: user.id,
      });
  }

  revalidatePath("/superadmin/config");
}

// ─── Registrar Nuevo Superadmin (Setup Inicial) ────────────────
export async function registerSuperAdmin(data: {
  fullName:   string
  email:      string
  password:   string
  secretCode: string
}) {
  // En producción, esto debe estar en .env.local
  const adminSecret = process.env.SUPERADMIN_SECRET || 'lumis_admin_root_2024'

  if (data.secretCode !== adminSecret) {
    throw new Error('Código de secreto administrativo inválido')
  }

  const supabase = await createClient()

  // 1. Crear el auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      }
    }
  })

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Error registrando usuario')
  }

  // 2. Crear el perfil de usuario con rol superadmin y sin empresa asociada
  const { error: profileError } = await supabase.from('users').insert({
    auth_id:    authData.user.id,
    full_name:  data.fullName,
    email:      data.email,
    role:       'superadmin',
    company_id: null 
  })

  if (profileError) {
    throw new Error('Error al crear el perfil administrativo: ' + profileError.message)
  }

  return { success: true }
}
