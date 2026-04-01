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
  ChevronDown,
  Briefcase
} from "lucide-react";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function SuperAdminSidebar() {
  const path = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  const [expandedSection, setExpandedSection] = useState<string | null>(
    path.startsWith("/superadmin/clientes") ? "Clientes" 
    : path.startsWith("/superadmin/usuarios") ? "Usuarios" 
    : null
  );

  useEffect(() => {
    if (path.startsWith("/superadmin/clientes")) {
      setExpandedSection("Clientes");
    } else if (path.startsWith("/superadmin/usuarios")) {
      setExpandedSection("Usuarios");
    }
  }, [path]);

  useEffect(() => {
    const fetchPending = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("subscription_payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      setPendingCount(count || 0);
    };

    fetchPending();
  }, []);

  const NAV = [
    { label: "Command Center", href: "/superadmin", icon: LayoutDashboard },
    {
      label: "Clientes",
      icon: Briefcase,
      isDropdown: true,
      subItems: [
        { label: "Empresas", href: "/superadmin/clientes/empresas", icon: Building2 },
        { label: "Suscripciones", href: "/superadmin/clientes/suscripciones", icon: CreditCard },
      ],
    },
    { label: "Semillas", href: "/superadmin/semillas", icon: Sparkles },
    { label: "Comunicación", href: "/superadmin/comunicacion", icon: Megaphone },
    {
      label: "Usuarios",
      icon: Users,
      isDropdown: true,
      subItems: [
        { label: "Sistema", href: "/superadmin/usuarios", icon: Users },
        { label: "Por Empresa", href: "/superadmin/usuarios/empresas", icon: Building2 },
      ],
    },
    { label: "Config", href: "/superadmin/config", icon: Settings },
  ];

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

      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item, idx) => {
          if (item.isDropdown) {
            // Un subitem está activo si la ruta coincide o empieza con la ruta del subitem (excepto para home routes base si las hay, pero en superadmin funciona)
            const hasActiveChild = item.subItems?.some((sub) => path === sub.href || path.startsWith(sub.href + "/"));
            const isExpanded = expandedSection === item.label;
            const Icon = item.icon;

            return (
              <div key={item.label} className="mt-2 mb-1">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : item.label)}
                  className={`w-full relative flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl
                              transition-all duration-150 group cursor-pointer ${
                                hasActiveChild && !isExpanded
                                  ? "bg-brand/5 border border-brand/10"
                                  : "hover:bg-surface-hover/10 border border-transparent"
                              }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        hasActiveChild || isExpanded
                          ? "text-[#E040FB]"
                          : "text-text-3 group-hover:text-text-1"
                      } transition-colors`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        hasActiveChild || isExpanded
                          ? "text-[#E040FB] font-semibold"
                          : "text-text-2 group-hover:text-text-1"
                      } transition-colors`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-text-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-text-3" />
                  )}
                </button>

                {isExpanded && item.subItems && (
                  <div className="mt-1 ml-4 pl-3 border-l-2 border-border/50 space-y-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = path.startsWith(sub.href);
                      const SubIcon = sub.icon;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg
                                      transition-all duration-150 group ${
                                        isSubActive
                                          ? "bg-brand/10 text-[#E040FB] font-semibold"
                                          : "text-text-2 hover:bg-surface-hover/10 hover:text-text-1"
                                      }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-[#E040FB]" : "text-text-3 group-hover:text-text-1"}`} />
                          <span className="text-sm flex-1">{sub.label}</span>
                          
                          {sub.href === "/superadmin/clientes/suscripciones" && pendingCount > 0 && (
                            <div className="w-4 h-4 rounded-full bg-status-danger text-white text-[9px] font-bold flex items-center justify-center shadow-sm leading-none animate-pulse">
                              {pendingCount}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Item normal
          const isActive =
            item.href === "/superadmin"
              ? path === "/superadmin"
              : path.startsWith(item.href as string);
          
          const Icon = item.icon as any;

          return (
            <Link
              key={item.href}
              href={item.href as string}
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
                className={`text-sm font-medium flex-1 ${
                  isActive
                    ? "text-[#E040FB] font-semibold"
                    : "text-text-2 group-hover:text-text-1"
                } transition-colors`}
              >
                {item.label}
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
