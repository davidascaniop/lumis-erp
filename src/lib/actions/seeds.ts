"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Helper: verificar que el usuario es superadmin ─────────
async function assertSuperAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();
  if (data?.role !== "superadmin") throw new Error("No autorizado");
  return { id: data.id, authId: user.id };
}

export async function createDailySeed(formData: {
  verse: string;
  verse_reference: string;
  reflection?: string;
  case_story?: string;
  scheduled_date: string;
  video_url?: string;
  status: "draft" | "scheduled" | "published";
}) {
  const supabase = await createClient();
  const dbUser = await assertSuperAdmin(supabase);

  const { error } = await supabase.from("daily_seeds").insert({
    ...formData,
    created_by: dbUser?.id,
    published_at:
      formData.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  } as any);

  if (error) {
    console.error("Error guardando la semilla:", error);
    throw new Error(`Error guardando la semilla: ${error.message} (${error.code})`);
  }
  revalidatePath("/superadmin/semillas");
  return { success: true };
}

export async function updateSeedStatus(
  id: string,
  status: "draft" | "scheduled" | "published",
) {
  const supabase = await createClient();
  await assertSuperAdmin(supabase);

  const { error } = await supabase
    .from("daily_seeds")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", id);

  if (error) throw new Error("Error actualizando la semilla");
  revalidatePath("/superadmin/semillas");
  return { success: true };
}

export async function deleteSeed(id: string) {
  const supabase = await createClient();
  await assertSuperAdmin(supabase);
  const { error } = await supabase.from("daily_seeds").delete().eq("id", id);
  if (error) throw new Error("Error eliminando la semilla");
  revalidatePath("/superadmin/semillas");
  return { success: true };
}

export async function recordSeedView(seedId: string, companyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return;

  // Intentar insertar vista única (puede fallar si ya existe por unique constraint)
  const { error } = await supabase.from("seed_views").insert({
    seed_id: seedId,
    company_id: companyId,
    user_id: dbUser.id,
  } as any);

  // Solo incrementar si es una vista nueva (no duplicada)
  if (!error) {
    await (supabase as any).rpc("increment_seed_view", { p_seed_id: seedId });
  }
}

export async function recordSeedBlessing(seedId: string) {
  const supabase = await createClient();
  // Usar RPC con SECURITY DEFINER para bypassear RLS de forma segura
  const { error } = await (supabase as any).rpc("increment_seed_blessing", { p_seed_id: seedId });
  if (error) {
    console.error("Error registrando bendición:", error.message);
    throw new Error("No se pudo registrar la bendición");
  }
}

export async function recordSeedShare(seedId: string) {
  const supabase = await createClient();
  // Usar RPC con SECURITY DEFINER para bypassear RLS de forma segura
  const { error } = await (supabase as any).rpc("increment_seed_share", { p_seed_id: seedId });
  if (error) {
    console.error("Error registrando compartido:", error.message);
    throw new Error("No se pudo registrar el compartido");
  }
}
