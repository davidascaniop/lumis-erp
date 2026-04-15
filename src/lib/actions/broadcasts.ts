"use server";
import { createClient } from "@/lib/supabase/server";

export async function markBroadcastRead(
  broadcastId: string,
  companyId: string,
  _userId: string, // Parámetro ignorado — se obtiene del servidor
) {
  const supabase = await createClient();

  // Obtener user_id desde el servidor para evitar manipulación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return;

  await supabase.from("broadcast_reads").insert({
    broadcast_id: broadcastId,
    company_id: companyId,
    user_id: dbUser.id,
  });
}
