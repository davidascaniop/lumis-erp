import { Sidebar } from "@/components/layout/sidebar";
import { SuspendedGuard } from "@/components/layout/SuspendedGuard";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
