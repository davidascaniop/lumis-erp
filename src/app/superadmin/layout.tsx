import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminSidebar } from "@/components/superadmin/sidebar";
import { SuperAdminTopbar } from "@/components/superadmin/topbar";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("auth_id", user.id)
    .single();

  if (userData?.role !== "superadmin") redirect("/dashboard");

  return (
    <div className="flex h-screen bg-[#08050F] overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SuperAdminTopbar admin={userData} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
