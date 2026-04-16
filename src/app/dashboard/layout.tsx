import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { SuspendedGuard } from "@/components/layout/SuspendedGuard";
import { Toaster } from "sonner";
import { UserProvider } from "@/components/providers/user-provider";

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
    .select("*, companies(id, is_active, plan_type, settings, subscription_status, modules_enabled, logo_url, name, name_comercial, rif)")
    .eq("auth_id", authUser.id)
    .single();

  return (
    <UserProvider initialUser={serverProfile}>
      <div className="flex h-screen overflow-hidden bg-surface-base font-montserrat">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <SuspendedGuard>{children}</SuspendedGuard>
          </main>
        </div>
        <Toaster
          position="top-right"
          theme="system"
          className="font-montserrat"
        />
      </div>
    </UserProvider>
  );
}
