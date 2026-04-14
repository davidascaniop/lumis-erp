"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Updates the full_name of the currently authenticated user.
 * Uses the server-side Supabase client (with session cookies) to
 * bypass potential client-side RLS restrictions on the users table.
 */
export async function updateUserFullName(fullName: string): Promise<{ success: boolean; error?: string }> {
  if (!fullName || fullName.trim().length === 0) {
    return { success: false, error: "El nombre no puede estar vacío" };
  }

  try {
    const supabase = await createClient();

    // Verify the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Update full_name — server client has broader write permissions
    const { error: updateError } = await supabase
      .from("users")
      .update({ full_name: fullName.trim() })
      .eq("auth_id", user.id)
      .select("id");

    if (updateError) {
      console.error("[updateUserFullName] Supabase error:", updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate the settings and dashboard paths so Server Components re-fetch
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("[updateUserFullName] Unexpected error:", err);
    return { success: false, error: err?.message ?? "Error desconocido" };
  }
}
