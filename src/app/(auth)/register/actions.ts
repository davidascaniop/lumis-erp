"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_TRIAL_DAYS = 15;

export type RegisterResult =
  | { ok: true; companyId: string; warning?: string }
  | { ok: false; error: string };

/**
 * Atomically registers a new company + admin user.
 *
 * Uses the Supabase service-role key to bypass RLS. Self-heals previous
 * orphaned auth.users (created when an earlier signup attempt failed mid-way)
 * by reusing the existing auth_id. Rolls back on any failure so we never leave
 * the database in an inconsistent state.
 *
 * For demo plans: skips receipt upload + payment insert, sets
 *   subscription_status="demo", plan_type="enterprise", trial_ends_at=now+15d
 * For paid plans: uploads the receipt to storage and creates a pending payment.
 */
export async function registerCompanyAction(formData: FormData): Promise<RegisterResult> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  // ─── Parse & validate inputs ────────────────────────────────────────────
  const companyName = String(formData.get("companyName") || "").trim();
  const rif = String(formData.get("rif") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const plan = String(formData.get("plan") || "") as "demo" | "basic" | "pro" | "enterprise";

  if (!companyName || !rif || !fullName || !email || !password || !plan) {
    return { ok: false, error: "Faltan datos requeridos." };
  }
  if (!["demo", "basic", "pro", "enterprise"].includes(plan)) {
    return { ok: false, error: "Plan inválido." };
  }
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const isDemo = plan === "demo";

  // Parse optional payment fields (only for paid plans)
  const paymentMethod = String(formData.get("paymentMethod") || "");
  const paymentName = String(formData.get("paymentName") || "") || null;
  const paymentEmailOrPhone = String(formData.get("paymentEmailOrPhone") || "") || null;
  const paymentBankOrLast4 = String(formData.get("paymentBankOrLast4") || "") || null;
  const amountUsd = Number(formData.get("amountUsd") || 0);
  const amountBs = Number(formData.get("amountBs") || 0);
  const bcvRate = Number(formData.get("bcvRate") || 0);
  const receiptFile = formData.get("receipt") as File | null;

  if (!isDemo) {
    if (!paymentMethod) return { ok: false, error: "Falta el método de pago." };
    if (!receiptFile || receiptFile.size === 0) {
      return { ok: false, error: "Falta el comprobante de pago." };
    }
  }

  // ─── Step 1: get or create auth user (self-heal orphans) ───────────────
  let authUserId: string;
  let authUserWasExisting = false;

  // Supabase admin doesn't expose "find user by email" directly, so we list.
  // For most accounts the user count is small enough that this is fine.
  const { data: existingAuth } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = existingAuth?.users?.find((u) => u.email?.toLowerCase() === email);

  if (existing) {
    // Check if the auth user is actually linked to a company already
    const { data: existingProfile } = await admin
      .from("users")
      .select("id, company_id")
      .eq("auth_id", existing.id)
      .maybeSingle();

    if (existingProfile?.company_id) {
      return {
        ok: false,
        error: "Este correo ya está registrado. Inicia sesión o usa otro correo.",
      };
    }

    // Orphan: auth user exists but no company/profile. Reuse + repair.
    authUserId = existing.id;
    authUserWasExisting = true;

    // Update the password in case they typed a different one this time
    await admin.auth.admin.updateUserById(authUserId, {
      password,
      email_confirm: true,
    });
  } else {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // no email verification needed for Lumis right now
    });

    if (authError || !authData.user) {
      return {
        ok: false,
        error: authError?.message || "No se pudo crear el usuario de autenticación.",
      };
    }
    authUserId = authData.user.id;
  }

  // Helper to rollback the auth user if we created it this run
  const rollbackAuth = async () => {
    if (!authUserWasExisting) {
      try {
        await admin.auth.admin.deleteUser(authUserId);
      } catch (e) {
        console.error("Rollback failed to delete auth user:", e);
      }
    }
  };

  // ─── Step 2: create company ─────────────────────────────────────────────
  const trialEndsAt = isDemo
    ? new Date(Date.now() + DEMO_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: companyRow, error: companyError } = await admin
    .from("companies")
    .insert({
      name: companyName,
      rif,
      plan_type: isDemo ? "enterprise" : plan,
      primary_color: "#E040FB",
      subscription_status: isDemo ? "demo" : "pending_verification",
      trial_ends_at: trialEndsAt,
    } as any)
    .select("id")
    .single();

  if (companyError || !companyRow) {
    await rollbackAuth();
    return {
      ok: false,
      error: companyError?.message || "No se pudo crear la empresa.",
    };
  }

  const companyId = (companyRow as any).id as string;

  const rollbackCompany = async () => {
    try {
      await admin.from("companies").delete().eq("id", companyId);
    } catch (e) {
      console.error("Rollback failed to delete company:", e);
    }
  };

  // ─── Step 3: create user profile ────────────────────────────────────────
  const { error: profileError } = await admin.from("users").insert({
    auth_id: authUserId,
    company_id: companyId,
    full_name: fullName,
    email,
    role: "admin",
  } as any);

  if (profileError) {
    await rollbackCompany();
    await rollbackAuth();
    return { ok: false, error: profileError.message };
  }

  // ─── Step 4: paid plan → upload receipt + insert payment ────────────────
  if (!isDemo && receiptFile) {
    const fileExt = receiptFile.name.split(".").pop() || "dat";
    const fileName = `${companyId}-${Date.now()}.${fileExt}`;

    const buffer = Buffer.from(await receiptFile.arrayBuffer());

    const { data: uploadData, error: uploadError } = await admin.storage
      .from("receipts")
      .upload(fileName, buffer, {
        contentType: receiptFile.type || "application/octet-stream",
        upsert: false,
      });

    let receiptUrl = "";
    if (uploadError) {
      console.error("Receipt upload failed:", uploadError);
      // Continue without receipt URL — payment record will still be created
    } else if (uploadData) {
      const { data: pub } = admin.storage.from("receipts").getPublicUrl(uploadData.path);
      receiptUrl = pub.publicUrl;
    }

    const now = new Date();
    const periodStart = now.toISOString().split("T")[0];
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const periodEnd = nextMonth.toISOString().split("T")[0];

    const { error: paymentError } = await admin.from("subscription_payments").insert({
      company_id: companyId,
      plan,
      plan_type: plan,
      plan_price: amountUsd,
      amount_usd: amountUsd,
      amount_bs: amountBs,
      bcv_rate: bcvRate,
      period_start: periodStart,
      period_end: periodEnd,
      method: paymentMethod,
      holder_name: paymentName,
      contact_info: paymentEmailOrPhone,
      last_digits: paymentBankOrLast4,
      receipt_url: receiptUrl,
      paid_at: now.toISOString(),
      status: "pending",
    } as any);

    if (paymentError) {
      // Don't roll back everything — the company + user exist and the superadmin
      // can manually register the payment. Just surface a warning.
      console.error("Payment insert failed:", paymentError);
      return {
        ok: true,
        companyId,
        warning:
          "Empresa creada, pero no se pudo registrar el pago automáticamente. " +
          "Contacta a soporte para regularizar.",
      };
    }
  }

  return { ok: true, companyId };
}
