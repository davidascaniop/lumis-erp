"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { SuspendedGuard } from "./SuspendedGuard";
import { PortalPaymentsAlert } from "@/components/dashboard/portal-payments-alert";
import { LumisLogo } from "@/components/landing/lumis-logo";
import { useBCV } from "@/hooks/use-bcv";
import { formatNumber } from "@/lib/utils";

/**
 * DashboardShell — client wrapper que maneja el estado del drawer móvil.
 *
 * En desktop (md+): sidebar fija lateral estándar.
 * En mobile (<md):
 *   - Topbar con hamburger + logo + BCV pill
 *   - Sidebar se oculta por defecto, aparece como drawer al tocar hamburger
 *   - Backdrop semitransparente cuando el drawer está abierto
 *   - El drawer se cierra automáticamente al cambiar de ruta
 */
export function DashboardShell({
  children,
  companyId,
}: {
  children: React.ReactNode;
  companyId: string | null;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { rate } = useBCV();

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-surface-base font-montserrat"
      style={{
        // iOS safe area insets — respeta el notch / home indicator
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          SIDEBAR — desktop fixed / mobile drawer
          ═══════════════════════════════════════════════════════════════ */}
      <Sidebar
        isMobileOpen={drawerOpen}
        onMobileClose={() => setDrawerOpen(false)}
      />

      {/* Mobile backdrop — fade in/out */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN COLUMN — mobile topbar + content
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar — only <md */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background/95 backdrop-blur-md shrink-0 z-30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg text-text-2 hover:text-text-1 hover:bg-surface-hover/20 transition-colors active:scale-95"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <LumisLogo size={28} showText={false} />
            <span className="font-display font-bold text-base text-text-1 tracking-tight">
              LUMIS
            </span>
          </div>

          {/* BCV pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-hover/10 border border-border">
            <div className="relative w-1.5 h-1.5">
              <div className="absolute inset-0 rounded-full bg-[#00E5CC]" />
              <div className="absolute inset-0 rounded-full bg-[#00E5CC] animate-ping opacity-40" />
            </div>
            <span className="text-[10px] font-semibold text-text-1">
              Bs.{formatNumber(rate)}
            </span>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 relative">
          {companyId && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-40 max-w-[calc(100vw-1.5rem)] sm:max-w-sm">
              <PortalPaymentsAlert companyId={companyId} />
            </div>
          )}
          <SuspendedGuard>{children}</SuspendedGuard>
        </main>
      </div>
    </div>
  );
}

/** Botón X para cerrar el drawer desde adentro del sidebar (solo mobile) */
export function MobileDrawerClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="md:hidden absolute top-3 right-3 p-2 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-hover/20 transition-colors active:scale-95 z-10"
      aria-label="Cerrar menú"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
