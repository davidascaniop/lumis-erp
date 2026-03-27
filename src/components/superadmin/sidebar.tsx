"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Sparkles,
  Users,
  Megaphone,
  CreditCard,
  Settings,
  Shield,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { label: "Command Center", href: "/superadmin", icon: LayoutDashboard },
  { label: "Empresas", href: "/superadmin/empresas", icon: Building2 },
  {
    label: "Suscripciones",
    href: "/superadmin/suscripciones",
    icon: CreditCard,
  },
  { label: "Semillas", href: "/superadmin/semillas", icon: Sparkles },
  { label: "Broadcast", href: "/superadmin/broadcast", icon: Megaphone },
  { label: "Usuarios", href: "/superadmin/usuarios", icon: Users },
  { label: "Config", href: "/superadmin/config", icon: Settings },
];

export function SuperAdminSidebar() {
  const path = usePathname();

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full
                      bg-surface-base border-r border-border transition-colors duration-300"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div
          className="relative w-9 h-9 rounded-xl flex items-center justify-center
                        bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
                        shadow-[0_0_20px_rgba(224,64,251,0.20)]"
        >
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-display font-bold text-[15px] text-text-1 tracking-tight">
            LUMIS
          </span>
          <p className="text-[9px] text-[#FF2D55] font-bold tracking-widest uppercase leading-none mt-0.5">
            SUPER ADMIN
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/superadmin"
              ? path === "/superadmin"
              : path.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                          transition-all duration-150 group ${
                            isActive
                              ? "bg-brand/10 border border-brand/20"
                              : "hover:bg-surface-hover/10"
                          }`}
            >
              {/* Indicador lateral activo */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                                bg-gradient-to-b from-[#E040FB] to-[#7C4DFF] rounded-full"
                />
              )}

              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive
                    ? "text-[#E040FB]"
                    : "text-text-3 group-hover:text-text-1"
                } transition-colors`}
              />

              <span
                className={`text-sm font-medium ${
                  isActive
                    ? "text-[#E040FB] font-semibold"
                    : "text-text-2 group-hover:text-text-1"
                } transition-colors`}
              >
                {label}
              </span>

              {!isActive && (
                <ChevronRight
                  className="w-3 h-3 text-text-3 ml-auto
                                         opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — volver al dashboard */}
      <div className="p-3 border-t border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-surface-hover/5 hover:bg-surface-hover/10 transition-colors text-text-3
                     hover:text-text-1 text-xs font-medium"
        >
          ← Volver al Dashboard
        </Link>
      </div>
    </aside>
  );
}
