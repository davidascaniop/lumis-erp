import { Sidebar } from "@/components/layout/sidebar";
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
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1C1228",
            border: "1px solid rgba(224,64,251,0.20)",
            color: "#F0E8FF",
            fontFamily: "DM Sans, sans-serif",
          },
        }}
      />
    </div>
  );
}
