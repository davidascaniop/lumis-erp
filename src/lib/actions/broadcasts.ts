"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markBroadcastRead(
  broadcastId: string,
  companyId: string,
  userId: string,
) {
  const supabase = await createClient();

  await supabase.from("broadcast_reads").insert({
    broadcast_id: broadcastId,
    company_id: companyId,
    user_id: userId,
  });
}
