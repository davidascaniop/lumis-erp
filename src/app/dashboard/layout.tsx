import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "sonner";
import { UserProvider } from "@/components/providers/user-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side: fetch auth + profile in one shot (no client roundtrip needed)
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // Fetch full user profile on the server — eliminates client-side waterfall
  const { data: serverProfile } = await supabase
    .from("users")
    .select(
      "*, companies(id, is_active, plan_type, settings, subscription_status, trial_ends_at, modules_enabled, logo_url, name, name_comercial, rif)",
    )
    .eq("auth_id", authUser.id)
    .single();

  return (
    <UserProvider initialUser={serverProfile}>
      <DashboardShell companyId={serverProfile?.company_id ?? null}>
        {children}
      </DashboardShell>
      <Toaster position="top-right" theme="system" className="font-montserrat" />
    </UserProvider>
  );
}
