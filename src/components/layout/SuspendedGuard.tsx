"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2, AlertTriangle, MessageCircle, Clock, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

export function SuspendedGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-2rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  const company = user?.companies;
  const status = company?.subscription_status;
  const trialEndsAt = (company as any)?.trial_ends_at
    ? new Date((company as any).trial_ends_at)
    : null;
  const isDemoExpired =
    status === "demo" && trialEndsAt !== null && trialEndsAt.getTime() < Date.now();

  // Active demo (still within trial window) gets full access
  if (status === "demo" && !isDemoExpired) {
    return <>{children}</>;
  }

  // Demo trial ran out — block access and push to the upgrade page
  if (isDemoExpired) {
    const daysOver = Math.max(
      0,
      Math.floor((Date.now() - (trialEndsAt as Date).getTime()) / (1000 * 60 * 60 * 24)),
    );
    return (
      <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-2rem)] space-y-6 bg-surface-base px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E040FB]/10 to-[#7C4DFF]/10 flex items-center justify-center text-brand">
          <Clock className="w-10 h-10" />
        </div>
        <div className="text-center max-w-md space-y-3">
          <h1 className="text-2xl font-bold font-display text-text-1">
            Tu demo de 15 días terminó
          </h1>
          <p className="text-sm text-text-3 font-medium">
            {daysOver === 0
              ? "Tu período de prueba acaba de vencer."
              : `Tu período de prueba venció hace ${daysOver} día${daysOver !== 1 ? "s" : ""}.`}{" "}
            Activa un plan para seguir usando LUMIS sin interrupciones.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link
            href="/dashboard/upgrade"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white font-bold text-sm shadow-lg shadow-brand/30 hover:opacity-90 transition-opacity"
          >
            <Rocket className="w-4 h-4" />
            Ver Planes
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/584120000000?text=Hola,%20mi%20demo%20venció%20y%20quiero%20activar%20un%20plan."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm shadow-lg shadow-[#25D366]/30 hover:bg-[#20bd5a] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Manually suspended or deactivated company
  if (company && (company.is_active === false || status === "suspended")) {
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
          href="https://wa.me/584120000000?text=Hola,%20mi%20cuenta%20fue%20suspendida%20y%20necesito%20soporte."
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
