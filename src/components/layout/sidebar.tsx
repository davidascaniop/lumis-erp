"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X, Bell, ChevronRight, Plus, LogOut, Settings, BarChart3, Package,
  CreditCard, ShoppingCart, Users, LayoutDashboard, Truck, Sparkles,
  DollarSign, AlertTriangle, CheckCircle2, Briefcase, Lock, Wallet,
  FileText, FileClock, TrendingUp, PieChart, Store, ClipboardList,
  Tags, Layers, Receipt, ArrowDownCircle, Gauge, MessageSquare, ShoppingBag, Box, LineChart,
  Landmark, RefreshCw, UtensilsCrossed, LayoutGrid, CookingPot,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { useNotifications } from "@/hooks/use-notifications";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

const NOTIFICATION_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  payment:   { icon: DollarSign,    color: "#E040FB", bg: "rgba(224,64,251,0.10)" },
  order:     { icon: ShoppingCart,  color: "#FFB800", bg: "rgba(255,184,0,0.10)"  },
  alert:     { icon: AlertTriangle, color: "#FF2D55", bg: "rgba(255,45,85,0.10)"  },
  success:   { icon: CheckCircle2,  color: "#00E5CC", bg: "rgba(0,229,204,0.10)"  },
  stock:     { icon: Package,       color: "#FF2D55", bg: "rgba(255,45,85,0.10)"  },
  treasury:  { icon: Landmark,      color: "#FF2D55", bg: "rgba(255,45,85,0.10)"  },
  recurring: { icon: RefreshCw,     color: "#FFB800", bg: "rgba(255,184,0,0.10)"  },
  plan:      { icon: Sparkles,      color: "#E040FB", bg: "rgba(224,64,251,0.10)" },
};

/* ─── Estructura del Menú Acordeón ─── */
type NavChild = { href: string; label: string; icon: any; requiredPlan?: string[] };
type NavSection = {
  id: string;
  label: string;
  icon: any;
  children: NavChild[];
  requiredPlan?: string[];
};

const BASE_NAV_SECTIONS: NavSection[] = [
  {
    id: "ventas",
    label: "Ventas",
    icon: ShoppingCart,
    children: [
      { href: "/dashboard/ventas/nueva", label: "Punto de Venta (POS)", icon: Store },
      { href: "/dashboard/ventas/presupuestos", label: "Presupuestos", icon: FileText },
      { href: "/dashboard/ventas", label: "Historial de Ventas", icon: FileClock },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: ShoppingBag,
    children: [
      { href: "/dashboard/compras/ordenes", label: "Órdenes de Compra", icon: Wallet, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/compras/rfq", label: "Solicitudes de Cotización (RFQ)", icon: FileText, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/compras/proveedores", label: "Proveedores", icon: ClipboardList, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/compras/analisis", label: "Análisis de Precios", icon: LineChart, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/compras/fiscal", label: "Fiscal", icon: Receipt },
    ],
  },
  {
    id: "clientes",
    label: "Clientes & CRM",
    icon: Users,
    children: [
      { href: "/dashboard/clientes", label: "Directorio de Clientes", icon: Users },
      { href: "/dashboard/crm", label: "CRM Oportunidades", icon: Briefcase, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/crm/mensajeria", label: "Centro de Mensajería", icon: MessageSquare, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/crm/prospectos", label: "Seguimiento", icon: TrendingUp, requiredPlan: ["pro", "enterprise"] },
    ],
  },
  {
    id: "productos",
    label: "Inventario",
    icon: Package,
    children: [
      { href: "/dashboard/productos", label: "Lista de Productos", icon: Package },
      { href: "/dashboard/inventario", label: "Ajustes de Stock", icon: Gauge },
      { href: "/dashboard/productos/categorias", label: "Categorías y Atributos", icon: Tags },
      { href: "/dashboard/productos/kits", label: "Kits & Ensambles", icon: Layers, requiredPlan: ["pro", "enterprise"] },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: DollarSign,
    children: [
      { href: "/dashboard/cobranza", label: "Cuentas por Cobrar", icon: CreditCard, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/finanzas/gastos", label: "Gastos y Pagos", icon: Receipt, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/finanzas/recurrentes", label: "Gastos Recurrentes", icon: FileClock, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/finanzas/cuentas", label: "Mis Cuentas", icon: Landmark, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/finanzas/flujo", label: "Flujo de Caja", icon: ArrowDownCircle, requiredPlan: ["pro", "enterprise"] },
    ],
  },
  {
    id: "operaciones",
    label: "Logística",
    icon: Truck,
    children: [
      { href: "/dashboard/compras/despachos", label: "Despachos y Envíos", icon: Truck, requiredPlan: ["pro", "enterprise"] },
    ],
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: BarChart3,
    children: [
      { href: "/dashboard/reportes/ejecutivo", label: "Resumen Ejecutivo", icon: Sparkles, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/reportes/ventas", label: "Reporte de Ventas", icon: BarChart3 },
      { href: "/dashboard/reportes/productos", label: "Productos e Inventario", icon: TrendingUp, requiredPlan: ["pro", "enterprise"] },
      { href: "/dashboard/reportes/equipo", label: "Equipo de Ventas", icon: PieChart, requiredPlan: ["pro", "enterprise"] },
    ],
  },
];

const RESTAURANT_SECTION: NavSection = {
  id: "restaurante",
  label: "Restaurante",
  icon: UtensilsCrossed,
  children: [
    { href: "/dashboard/restaurante/mesas", label: "Mesas", icon: LayoutGrid },
    { href: "/dashboard/restaurante/comandas", label: "Comandas", icon: ClipboardList },
    { href: "/dashboard/restaurante/cocina", label: "Cocina (KDS)", icon: CookingPot },
    { href: "/dashboard/restaurante/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/dashboard/restaurante/config", label: "Configuración", icon: Settings },
  ],
};

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userPlan, setUserPlan] = useState("starter");

  // Build nav sections dynamically based on enabled modules
  const modulesEnabled: string[] = user?.companies?.modules_enabled || [];
  const NAV_SECTIONS = useMemo(() => {
    const sections = [...BASE_NAV_SECTIONS];
    if (modulesEnabled.includes('restaurante')) {
      // Insert after "compras" (index 1)
      const comprasIdx = sections.findIndex(s => s.id === 'compras');
      sections.splice(comprasIdx + 1, 0, RESTAURANT_SECTION);
    }
    return sections;
  }, [modulesEnabled]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(
    user?.company_id,
    user?.companies,
  );

  // Find the most specific active child globally:
  const allChildren = NAV_SECTIONS.flatMap(s => s.children);
  const activeChild = allChildren.reduce((best, child) => {
    if (pathname === child.href || pathname.startsWith(child.href + "/")) {
      if (!best || child.href.length > best.href.length) {
        return child;
      }
    }
    return best;
  }, null as typeof allChildren[0] | null);

  // Detectar sección activa para auto-expandir
  const getInitialOpenSections = () => {
    const open = new Set<string>();
    if (activeChild) {
      for (const section of NAV_SECTIONS) {
        if (section.children.some((c) => c.href === activeChild.href)) {
          open.add(section.id);
        }
      }
    }
    return open;
  };

  const [openSections, setOpenSections] = useState<Set<string>>(getInitialOpenSections);

  useEffect(() => {
    setOpenSections(getInitialOpenSections());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (user?.companies) {
      if (user.companies.subscription_status === 'demo') {
        setUserPlan('enterprise');
        return;
      }
      const plan = (user.companies.plan_type || "starter").toLowerCase();
      setUserPlan(plan.includes("pro") ? "pro" : plan.includes("enterprise") ? "enterprise" : "starter");
    } else {
      setUserPlan("starter");
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-border bg-background transition-colors duration-300">
      {/* Logo + BCV */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] shadow-[0_0_20px_rgba(224,64,251,0.40)]">
              <span className="font-display font-bold text-white text-lg leading-none">L</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <div>
              <span className="font-display font-bold text-[17px] text-text-1 tracking-tight">LUMIS</span>
              <p className="text-[10px] text-text-3 font-medium tracking-widest uppercase leading-none mt-0.5">ERP · CRM</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg bg-surface-hover/10 border border-border">
          <div className="relative w-1.5 h-1.5">
            <div className="absolute inset-0 rounded-full bg-[#00E5CC]" />
            <div className="absolute inset-0 rounded-full bg-[#00E5CC] animate-ping opacity-40" />
          </div>
          <span className="currency-bs !text-text-1/80">BCV: <span className="text-text-1">Bs.{formatNumber(rate)}/$</span></span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/dashboard/ventas/nueva"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                     bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white text-sm font-semibold
                     shadow-[0_6px_20px_rgba(224,64,251,0.25)] hover:shadow-[0_10px_28px_rgba(224,64,251,0.35)]
                     hover:opacity-95 active:scale-[0.98] transition-all duration-150 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" strokeWidth={2.5} />
          Nueva venta
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 pt-2 pb-3">
        {/* HOME */}
        <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-text-3 uppercase tracking-[0.12em]">Home</p>
        <Link
          href="/dashboard"
          className={cn(
            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mb-0.5",
            pathname === "/dashboard"
              ? "bg-brand/10 border border-brand/20 font-semibold"
              : "hover:bg-surface-hover/10 border border-transparent group",
          )}
        >
          {pathname === "/dashboard" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-[#E040FB] to-[#7C4DFF] rounded-full" />
          )}
          <LayoutDashboard className={cn("w-4 h-4 flex-shrink-0", pathname === "/dashboard" ? "text-brand" : "text-text-2 group-hover:text-text-1")} />
          <span className={cn("flex-1", pathname === "/dashboard" ? "text-brand" : "text-text-2 group-hover:text-text-1")}>Dashboard</span>
        </Link>

        {/* MÓDULOS — Acordeón */}
        <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold text-text-3 uppercase tracking-[0.12em]">Módulos</p>

        {NAV_SECTIONS.map((section) => {
          const isOpen = openSections.has(section.id);
          const isActive = activeChild ? section.children.some(c => c.href === activeChild.href) : false;

          return (
            <div key={section.id} className="mb-0.5">
              {/* Header de sección */}
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                  isActive
                    ? "bg-brand/10 border border-brand/20 font-semibold"
                    : "hover:bg-surface-hover/10 border border-transparent",
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-[#E040FB] to-[#7C4DFF] rounded-full" />
                )}
                <section.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-brand" : "text-text-2 group-hover:text-text-1",
                  )}
                />
                <span className={cn("flex-1 text-left transition-colors", isActive ? "text-brand" : "text-text-2 group-hover:text-text-1")}>
                  {section.label}
                </span>
                <ChevronRight
                  className={cn(
                    "w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200",
                    isOpen ? "rotate-90" : "",
                    isActive ? "text-brand" : "text-text-3 group-hover:text-text-2",
                  )}
                />
              </button>

              {/* Hijos animados */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="children"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3 pt-0.5 pb-1 space-y-0.5 border-l border-border/60 ml-5 mt-1">
                      {section.children.map((child) => {
                        const isLocked = child.requiredPlan && !child.requiredPlan.includes(userPlan);
                        const isChildActive = activeChild?.href === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={isLocked ? "#" : child.href}
                            onClick={(e) => {
                              if (isLocked) {
                                e.preventDefault();
                                setShowUpgradeModal(true);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] transition-all duration-150 group/child cursor-pointer",
                              isChildActive && !isLocked
                                ? "text-text-1 font-bold bg-surface-hover/5"
                                : "text-text-3 hover:text-text-1 hover:bg-surface-hover/5",
                              isLocked ? "opacity-40 grayscale pointer-events-none" : "",
                            )}
                          >
                            <child.icon className={cn("w-3.5 h-3.5 flex-shrink-0", (isChildActive && !isLocked) ? "text-text-1" : "text-text-3 group-hover/child:text-text-2")} />
                            <span className="flex-1 leading-tight">{child.label}</span>
                            {isLocked && !isChildActive && <Lock className="w-3.5 h-3.5 text-text-3/40 shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* CONFIGURACIÓN */}
        <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold text-text-3 uppercase tracking-[0.12em]">Configuración</p>
        {configItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-2 hover:bg-surface-hover/10 hover:text-text-1 transition-all group mb-0.5"
          >
            <item.icon className="w-4 h-4 group-hover:text-text-1 transition-colors" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-text-3 group-hover:text-text-2 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-danger/70 hover:bg-danger/10 hover:text-danger transition-all"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </nav>

      {/* Footer: Notificaciones + Usuario */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150",
              showNotifications ? "bg-surface-hover/20 text-text-1" : "text-text-2 hover:bg-surface-hover/10 hover:text-text-1",
            )}
          >
            <div className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger border-2 border-background flex items-center justify-center text-[7px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="flex-1 text-left">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand/15 text-brand">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-full bottom-0 ml-2 w-80 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Notificaciones</h3>
                  {unreadCount > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand/15 text-brand">{unreadCount} nueva{unreadCount > 1 ? "s" : ""}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-semibold text-brand hover:text-brand/70 transition-colors px-2 py-1 rounded-md hover:bg-slate-50">
                      Marcar todas
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="p-1 rounded-md hover:bg-slate-100 transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {notifications.filter(n => !n.read).length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Sin notificaciones pendientes</p>
                    <p className="text-[10px] text-slate-400 mt-1">Todo está bajo control ✓</p>
                  </div>
                ) : (
                  notifications.filter(n => !n.read).map((n) => {
                    const iconConf = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.alert;
                    const { icon: Icon, color, bg } = iconConf;
                    const isHigh = n.priority === "high";
                    return (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => { markAsRead(n.id); setShowNotifications(false); }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50",
                          isHigh && "bg-red-50/40"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: bg }}>
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 mt-1" />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">{n.description}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">{n.time}</p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                <Link href="/dashboard/reportes/ejecutivo" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-brand hover:text-brand/70 transition-colors block text-center">
                  Ver Resumen Ejecutivo →
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand/5 border border-brand/10 hover:bg-brand/10 transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-[0_0_12px_rgba(224,64,251,0.25)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-1 truncate uppercase">{user?.full_name ?? "Usuario"}</p>
            <p className="text-[10px] text-text-3 capitalize">{user?.role ?? "admin"}</p>
          </div>
        </Link>
      </div>

      {/* MODAL MEJORAR PLAN */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-surface-elevated rounded-3xl p-6 shadow-elevated border border-border"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-center text-text-1 mb-2 font-display">Función Bloqueada</h2>
              <p className="text-sm text-center text-text-3 mb-6">
                Esta función no está disponible en tu plan actual. Mejora tu plan para desbloquear su potencial completo.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push("/dashboard/settings");
                  }}
                  className="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Mejorar Plan
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 rounded-xl bg-surface-base text-text-2 font-bold text-sm hover:bg-surface-hover transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
}
