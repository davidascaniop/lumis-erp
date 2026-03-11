"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  ChevronRight,
  Bell,
  X,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";

/* ─── Notificaciones mock ─── */
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "payment" as const,
    read: false,
    title: "Pago pendiente de verificar",
    description: "Distribuidora Alpha registró un pago de $250.00",
    time: "Hace 15 min",
    href: "/dashboard/cobranza",
  },
  {
    id: "2",
    type: "order" as const,
    read: false,
    title: "Nuevo pedido recibido",
    description: "Pedido #2491 creado por Vendedor 1",
    time: "Hace 1 hora",
    href: "/dashboard/ventas",
  },
  {
    id: "3",
    type: "alert" as const,
    read: false,
    title: "Crédito vencido",
    description: "Cliente Megamart tiene $480 vencidos (+30 días)",
    time: "Hace 2 horas",
    href: "/dashboard/cobranza",
  },
  {
    id: "4",
    type: "success" as const,
    read: true,
    title: "Pago verificado",
    description: "Se verificó el pago de $120.00 de Bodega Central",
    time: "Ayer",
    href: "/dashboard/cobranza",
  },
];

const NOTIFICATION_ICONS = {
  payment: { icon: DollarSign, color: "#E040FB", bg: "rgba(224,64,251,0.10)" },
  order: { icon: ShoppingCart, color: "#FFB800", bg: "rgba(255,184,0,0.10)" },
  alert: { icon: AlertTriangle, color: "#FF2D55", bg: "rgba(255,45,85,0.10)" },
  success: { icon: CheckCircle2, color: "#00E5CC", bg: "rgba(0,229,204,0.10)" },
};

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, section: "HOME" },
  {
    href: "/dashboard/ventas",
    label: "Ventas",
    icon: ShoppingCart,
    section: "MÓDULOS",
    description: "Pedidos y facturación",
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: Users,
    section: "MÓDULOS",
    description: "Fichas 360° y contactos",
  },
  {
    href: "/dashboard/cobranza",
    label: "Cobranza",
    icon: CreditCard,
    section: "MÓDULOS",
    description: "CxC y pagos pendientes",
  },
  {
    href: "/dashboard/productos",
    label: "Productos",
    icon: Package,
    section: "MÓDULOS",
    description: "Inventario y catálogo",
  },
  {
    href: "/dashboard/reportes",
    label: "Reportes",
    icon: BarChart3,
    section: "MÓDULOS",
    description: "Métricas y análisis",
  },
  {
    href: "/dashboard/semillas",
    label: "Semilla Diaria",
    icon: Sparkles,
    section: "MÓDULOS",
    description: "Devocionales y negocios",
  },
];

const configItems = [
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();
  const { rate } = useBCV();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const homeItems = navItems.filter((i) => i.section === "HOME");
  const moduleItems = navItems.filter((i) => i.section === "MÓDULOS");

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-white/5 bg-[#08050F]">
      {/* Logo + BCV widget */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center
                                    bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
                                    shadow-[0_0_20px_rgba(224,64,251,0.40)]"
          >
            <span className="font-display font-bold text-white text-lg leading-none">
              L
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <span className="font-display font-bold text-[17px] text-white tracking-tight">
              LUMIS
            </span>
            <p className="text-[10px] text-[#3D2D5C] font-medium tracking-widest uppercase leading-none mt-0.5">
              ERP · CRM
            </p>
          </div>
        </div>

        {/* BCV Widget — integrado debajo del logo */}
        <div
          className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg
                                bg-white/[0.03] border border-white/[0.06]"
        >
          <div className="relative w-1.5 h-1.5">
            <div className="absolute inset-0 rounded-full bg-[#00E5CC]" />
            <div className="absolute inset-0 rounded-full bg-[#00E5CC] animate-ping opacity-40" />
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#9585B8] tracking-tight">
            BCV:{" "}
            <span className="text-[#00E5CC]">Bs.{formatNumber(rate)}/$</span>
          </span>
        </div>
      </div>

      {/* CTA — Nuevo Pedido */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/dashboard/ventas/nueva"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                               bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white
                               text-sm font-semibold
                               shadow-[0_6px_20px_rgba(224,64,251,0.25)]
                               hover:shadow-[0_10px_28px_rgba(224,64,251,0.35)]
                               hover:opacity-95 active:scale-[0.98]
                               transition-all duration-150 group"
        >
          <Plus
            className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200"
            strokeWidth={2.5}
          />
          Nueva venta
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-3">
        {/* HOME */}
        <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-[0.12em]">
          Home
        </p>
        {homeItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href) && pathname !== "/dashboard";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mb-0.5",
                active
                  ? "bg-gradient-to-r from-[rgba(224,64,251,0.12)] to-[rgba(124,77,255,0.06)] border border-[rgba(224,64,251,0.20)] font-semibold"
                  : "hover:bg-white/[0.04] border border-transparent group",
              )}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                                                bg-gradient-to-b from-[#E040FB] to-[#7C4DFF] rounded-full"
                />
              )}
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  active
                    ? "text-[#E040FB]"
                    : "text-[#9585B8] group-hover:text-white",
                )}
              />
              <span
                className={cn(
                  "flex-1 transition-colors",
                  active
                    ? "text-[#E040FB]"
                    : "text-[#9585B8] group-hover:text-white",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* MÓDULOS */}
        <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-[0.12em]">
          Módulos
        </p>
        {moduleItems.map((item) => {
          const active =
            pathname.startsWith(item.href) && pathname !== "/dashboard";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mb-0.5 group",
                active
                  ? "bg-gradient-to-r from-[rgba(224,64,251,0.12)] to-[rgba(124,77,255,0.06)] border border-[rgba(224,64,251,0.20)] font-semibold"
                  : "hover:bg-white/[0.04] border border-transparent",
              )}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                                                bg-gradient-to-b from-[#E040FB] to-[#7C4DFF] rounded-full"
                />
              )}
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  active
                    ? "text-[#E040FB]"
                    : "text-[#9585B8] group-hover:text-white",
                )}
              />
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "block transition-colors",
                    active
                      ? "text-[#E040FB]"
                      : "text-[#9585B8] group-hover:text-white",
                  )}
                >
                  {item.label}
                </span>
              </div>
              <ChevronRight
                className={cn(
                  "w-3.5 h-3.5 flex-shrink-0 transition-all duration-150",
                  active
                    ? "text-[#E040FB]"
                    : "text-[#3D2D5C] group-hover:text-[#9585B8] group-hover:translate-x-0.5",
                )}
              />
            </Link>
          );
        })}

        {/* CONFIGURACIÓN */}
        <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-[0.12em]">
          Configuración
        </p>
        {configItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                                   text-[#9585B8] hover:bg-white/[0.04] hover:text-white transition-all group mb-0.5"
          >
            <item.icon className="w-4 h-4 group-hover:text-white transition-colors" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#3D2D5C] group-hover:text-[#9585B8] group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                               text-[#FF2D55]/70 hover:bg-[rgba(255,45,85,0.06)] hover:text-[#FF2D55] transition-all"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </nav>

      {/* Footer: Notificación + Usuario */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {/* Campana de Notificaciones */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150",
              showNotifications
                ? "bg-white/[0.08] text-white"
                : "text-[#9585B8] hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <div className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full
                                                 bg-[#FF2D55] border-2 border-[#08050F]
                                                 flex items-center justify-center text-[7px] font-bold text-white"
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="flex-1 text-left">Notificaciones</span>
            {unreadCount > 0 && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                             bg-[rgba(224,64,251,0.15)] text-[#E040FB]"
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown — se abre hacia la derecha */}
          {showNotifications && (
            <div
              className="absolute left-full bottom-0 ml-2 w-80 z-50
                                        bg-[#130D22] border border-white/[0.08] rounded-2xl
                                        shadow-[0_16px_48px_rgba(0,0,0,0.50)] overflow-hidden
                                        animate-fade-up"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                                         bg-[rgba(224,64,251,0.15)] text-[#E040FB]"
                    >
                      {unreadCount} nueva{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-semibold text-[#E040FB] hover:text-white
                                                       transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]"
                    >
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-md hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-[#3D2D5C]" />
                  </button>
                </div>
              </div>

              {/* Lista */}
              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-[#3D2D5C] mx-auto mb-2" />
                    <p className="text-xs text-[#9585B8]">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const {
                      icon: Icon,
                      color,
                      bg,
                    } = NOTIFICATION_ICONS[n.type];
                    return (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => {
                          markAsRead(n.id);
                          setShowNotifications(false);
                        }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 transition-colors",
                          n.read
                            ? "hover:bg-white/[0.02] opacity-60"
                            : "bg-white/[0.02] hover:bg-white/[0.05]",
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: bg }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-xs leading-tight",
                                n.read
                                  ? "text-[#9585B8]"
                                  : "text-white font-medium",
                              )}
                            >
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E040FB] flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#3D2D5C] mt-0.5 truncate">
                            {n.description}
                          </p>
                          <p className="text-[9px] text-[#3D2D5C] mt-1">
                            {n.time}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] font-semibold text-[#E040FB] hover:text-white
                                               transition-colors block text-center"
                >
                  Ver historial completo
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Usuario activo */}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                               bg-[rgba(224,64,251,0.06)] border border-[rgba(224,64,251,0.10)]
                               hover:bg-[rgba(224,64,251,0.10)] transition-colors"
        >
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
                                    flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                                    shadow-[0_0_12px_rgba(224,64,251,0.25)]"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate uppercase">
              {user?.full_name ?? "Usuario"}
            </p>
            <p className="text-[10px] text-[#3D2D5C] capitalize">
              {user?.role ?? "admin"}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
