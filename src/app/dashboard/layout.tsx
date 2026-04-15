import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { SuspendedGuard } from "@/components/layout/SuspendedGuard";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard — no depender solo del middleware
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
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
  );
}
