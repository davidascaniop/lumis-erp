"use client";
import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  X,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useBCV } from "@/hooks/use-bcv";
import { useUser } from "@/hooks/use-user";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

/* ─── Notificaciones mock (se conectará a tabla real después) ─── */
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

export function Topbar() {
  const { rate } = useBCV();
  const { user } = useUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  return (
    <header
      className="h-12 flex items-center justify-between px-6 flex-shrink-0
                           bg-transparent"
    >
      {/* Buscador — compacto y elegante */}
      <div
        className="flex items-center gap-2 w-64 px-3 py-1.5
                            bg-white/[0.03] border border-white/[0.06] rounded-lg
                            hover:border-white/[0.10]
                            focus-within:border-[rgba(224,64,251,0.30)]
                            focus-within:bg-white/[0.04]
                            transition-all duration-200 group cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 text-[#3D2D5C] group-focus-within:text-[#9585B8] transition-colors" />
        <input
          placeholder="Buscar..."
          className="bg-transparent text-xs text-white placeholder-[#3D2D5C]
                               focus:outline-none flex-1"
        />
        <kbd
          className="text-[8px] font-mono text-[#3D2D5C]
                                px-1 py-0.5 rounded border border-white/[0.06] bg-white/[0.03]
                                hidden sm:inline"
        >
          ⌘K
        </kbd>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-2">
        {/* BCV — pastilla compacta */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                                bg-white/[0.03] border border-white/[0.06]
                                hover:border-[rgba(0,229,204,0.20)] transition-colors"
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

        {/* Campana — CON DROPDOWN FUNCIONAL */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg transition-all duration-150 ${
              showNotifications
                ? "bg-white/[0.08] text-white"
                : "hover:bg-white/[0.04] text-[#9585B8] hover:text-white"
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
                                             bg-[#FF2D55] border-2 border-[#0D0818]
                                             flex items-center justify-center text-[7px] font-bold text-white
                                             animate-pulse"
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de notificaciones */}
          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-2 w-80 z-50
                                        bg-[#130D22] border border-white/[0.08] rounded-2xl
                                        shadow-[0_16px_48px_rgba(0,0,0,0.50)] overflow-hidden
                                        animate-fade-up"
            >
              {/* Header del dropdown */}
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

              {/* Lista de notificaciones */}
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
                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04]
                                                            last:border-0 transition-colors
                                                            ${
                                                              n.read
                                                                ? "hover:bg-white/[0.02] opacity-60"
                                                                : "bg-white/[0.02] hover:bg-white/[0.05]"
                                                            }`}
                      >
                        {/* Icono */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: bg }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-xs leading-tight ${
                                n.read
                                  ? "text-[#9585B8]"
                                  : "text-white font-medium"
                              }`}
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

        {/* Avatar — compacto */}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 pl-2 ml-1 border-l border-white/[0.06]
                               hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E040FB] to-[#7C4DFF]
                                    flex items-center justify-center
                                    text-xs font-display font-bold text-white
                                    shadow-[0_0_10px_rgba(224,64,251,0.20)]"
          >
            {user?.full_name?.[0] ?? "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-white leading-none">
              {user?.full_name ?? "Usuario"}
            </p>
            <p className="text-[9px] text-[#3D2D5C] capitalize mt-0.5">
              {user?.role ?? "admin"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
