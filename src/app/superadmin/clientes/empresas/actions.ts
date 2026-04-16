"use server";

import { createSuperadminServerClient } from "@/lib/supabase/superadmin-server";

export async function fetchCompaniesAction(
  search: string,
  statusFilter: string,
): Promise<any[]> {
  const supabase = await createSuperadminServerClient();

  let query = supabase
    .from("companies")
    .select("id, name, plan_type, subscription_status, created_at, owner_email, settings")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (statusFilter !== "all") {
    if (statusFilter === "trial") {
      query = query.in("subscription_status", ["trial", "demo"]);
    } else {
      query = query.eq("subscription_status", statusFilter);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateCompanyAction(
  companyId: string,
  updates: { plan_type: string; subscription_status: string; settings: any },
): Promise<void> {
  const supabase = await createSuperadminServerClient();
  const { error } = await supabase
    .from("companies")
    .update(updates as any)
    .eq("id", companyId);
  if (error) throw new Error(error.message);
}

export async function deleteCompanyAction(companyId: string): Promise<void> {
  const PROTECTED_ID = "5a888a7b-aa3d-47f7-a517-37d94e9b4d45";
  if (companyId === PROTECTED_ID) throw new Error("Esta empresa base no puede ser eliminada.");
  const supabase = await createSuperadminServerClient();
  const { error } = await supabase.from("companies").delete().eq("id", companyId);
  if (error) throw new Error(error.message);
}
