"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user?.id)
    .single();

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

  const { error } = await supabase.from("seed_views").insert({
    seed_id: seedId,
    company_id: companyId,
    user_id: dbUser.id,
  } as any);

  // If insert succeeds (not a duplicate view for this user), increment count
  if (!error) {
    const { data: seed } = await supabase
      .from("daily_seeds")
      .select("views_count")
      .eq("id", seedId)
      .single();

    if (seed) {
      await supabase
        .from("daily_seeds")
        .update({ views_count: (seed.views_count || 0) + 1 } as any)
        .eq("id", seedId);
    }
  }
}
