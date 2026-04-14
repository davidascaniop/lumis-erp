"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2, AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuspendedGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-2rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  // DEMO accounts bypass all suspension checks — full access granted
  if (user?.companies?.subscription_status === "demo") {
    return <>{children}</>;
  }

  // If the company is loaded and marked as inactive (suspended)
  if (user?.companies && (user.companies.is_active === false || user.companies.subscription_status === "suspended")) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-2rem)] space-y-6 bg-surface-base">
        <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center text-danger">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div className="text-center max-w-md space-y-3">
          <h1 className="text-2xl font-bold font-display text-text-1">Cuenta Suspendida</h1>
          <p className="text-sm text-text-3 font-medium">
            Tu cuenta ha sido suspendida, contáctanos para resolverlo y reactivar tus servicios.
          </p>
        </div>
        <a 
          href="https://wa.me/1234567890?text=Hola,%20mi%20cuenta%20fue%20suspendida%20y%20necesito%20soporte." 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm shadow-lg shadow-[#25D366]/30 hover:bg-[#20bd5a] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Contactar por WhatsApp
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
