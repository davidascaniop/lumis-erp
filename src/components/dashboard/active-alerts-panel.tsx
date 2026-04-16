"use client";

import Link from "next/link";
import {
  Package,
  Receipt,
  RepeatIcon,
  UserX,
  Bell,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

/* ─── Types ─── */
export type AlertPriority = "critical" | "high" | "medium" | "low";

export interface ActiveAlert {
  id: string;
  priority: AlertPriority;
  icon: React.ReactNode;
  colorClass: string;           // Tailwind text color
  bgColorStyle: string;         // Inline background (rgba)
  borderColorStyle: string;     // Inline border (rgba)
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}

/* ─── Priority order map ─── */
const PRIORITY_ORDER: Record<AlertPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/* ─── Props ─── */
interface ActiveAlertsPanelProps {
  lowStockProducts: any[];
  overdueReceivables: any[];
  activeRecurringAlerts: any[];
  inactiveClients: any[];
}

/* ─── Main Component ─── */
export function ActiveAlertsPanel({
  lowStockProducts,
  overdueReceivables,
  activeRecurringAlerts,
  inactiveClients,
}: ActiveAlertsPanelProps) {
  /* Build unified alert list */
  const alerts: ActiveAlert[] = [];

  /* 🔴 Stock negativo o crítico */
  const criticalStock = lowStockProducts.filter(
    (p: any) => p.stock <= 0 || (p.min_stock && p.stock < p.min_stock * 0.5),
  );
  const normalLowStock = lowStockProducts.filter(
    (p: any) => p.stock > 0 && p.min_stock && p.stock < p.min_stock,
  );

  if (criticalStock.length > 0) {
    alerts.push({
      id: "stock-critical",
      priority: "critical",
      icon: <Package className="w-3.5 h-3.5" />,
      colorClass: "text-[#FF2D55]",
      bgColorStyle: "rgba(255,45,85,0.12)",
      borderColorStyle: "rgba(255,45,85,0.25)",
      title: `Stock crítico (${criticalStock.length})`,
      description:
        criticalStock.length === 1
          ? `${criticalStock[0].name} tiene stock en 0 o negativo`
          : `${criticalStock.map((p: any) => p.name).slice(0, 2).join(", ")}${criticalStock.length > 2 ? ` y ${criticalStock.length - 2} más` : ""}`,
      href: "/dashboard/inventario",
      actionLabel: "Ver inventario",
    });
  }

  if (normalLowStock.length > 0) {
    alerts.push({
      id: "stock-low",
      priority: "high",
      icon: <Package className="w-3.5 h-3.5" />,
      colorClass: "text-[#FF6B35]",
      bgColorStyle: "rgba(255,107,53,0.12)",
      borderColorStyle: "rgba(255,107,53,0.25)",
      title: `Stock bajo (${normalLowStock.length})`,
      description:
        normalLowStock.length === 1
          ? `${normalLowStock[0].name}: ${normalLowStock[0].stock} ${normalLowStock[0].unit}`
          : `${normalLowStock.map((p: any) => p.name).slice(0, 2).join(", ")}${normalLowStock.length > 2 ? ` y ${normalLowStock.length - 2} más` : ""}`,
      href: "/dashboard/inventario",
      actionLabel: "Ver inventario",
    });
  }

  /* 🟠 Facturas vencidas por cobrar */
  if (overdueReceivables.length > 0) {
    const totalOverdue = overdueReceivables.reduce(
      (s: number, r: any) => s + (r.balance_usd ?? 0),
      0,
    );
    alerts.push({
      id: "overdue-receivables",
      priority: "high",
      icon: <Receipt className="w-3.5 h-3.5" />,
      colorClass: "text-[#FF8C00]",
      bgColorStyle: "rgba(255,140,0,0.12)",
      borderColorStyle: "rgba(255,140,0,0.25)",
      title: `Facturas vencidas (${overdueReceivables.length})`,
      description: `$${totalOverdue.toFixed(2)} pendientes de cobro vencidos`,
      href: "/dashboard/cobranza",
      actionLabel: "Gestionar cobros",
    });
  }

  /* 🟡 Gastos recurrentes próximos a vencer */
  if (activeRecurringAlerts.length > 0) {
    alerts.push({
      id: "recurring-expenses",
      priority: "medium",
      icon: <RepeatIcon className="w-3.5 h-3.5" />,
      colorClass: "text-[#F0C040]",
      bgColorStyle: "rgba(240,192,64,0.12)",
      borderColorStyle: "rgba(240,192,64,0.25)",
      title: `Gastos próximos a vencer (${activeRecurringAlerts.length})`,
      description:
        activeRecurringAlerts.length === 1
          ? `${activeRecurringAlerts[0].name} vence en los próximos días`
          : `${activeRecurringAlerts.map((r: any) => r.name).slice(0, 2).join(", ")} y más`,
      href: "/dashboard/finanzas/recurrentes",
      actionLabel: "Ver gastos",
    });
  }

  /* 🔵 Clientes sin actividad 30+ días */
  if (inactiveClients.length > 0) {
    alerts.push({
      id: "inactive-clients",
      priority: "low",
      icon: <UserX className="w-3.5 h-3.5" />,
      colorClass: "text-[#4FC3F7]",
      bgColorStyle: "rgba(79,195,247,0.12)",
      borderColorStyle: "rgba(79,195,247,0.25)",
      title: `Clientes inactivos (${inactiveClients.length})`,
      description: `${inactiveClients.length} cliente${inactiveClients.length > 1 ? "s" : ""} sin pedidos en 30+ días`,
      href: "/dashboard/crm",
      actionLabel: "Ver CRM",
    });
  }

  /* Sort by priority */
  alerts.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const MAX_VISIBLE = 5;
  const visibleAlerts = alerts.slice(0, MAX_VISIBLE);
  const hiddenCount = Math.max(0, alerts.length - MAX_VISIBLE);
  const totalCount = alerts.length;

  /* Empty state */
  if (totalCount === 0) {
    return (
      <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-card hover-card-effect">
        <AlertsPanelHeader totalCount={0} />
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,229,100,0.12)" }}
          >
            <CheckCircle2 className="w-6 h-6 text-[#00E564]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#00E564]">
              ✅ Todo en orden
            </p>
            <p className="text-xs text-text-3 mt-0.5">
              Sin alertas activas en este momento
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-card hover-card-effect flex flex-col">
      <AlertsPanelHeader totalCount={totalCount} />

      {/* Scrollable list — max 350px */}
      <div
        className="space-y-2 overflow-y-auto pr-0.5 mt-1"
        style={{ maxHeight: "320px" }}
      >
        {visibleAlerts.map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </div>

      {/* Ver todas link */}
      {hiddenCount > 0 && (
        <Link
          href="/dashboard/inventario"
          className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold
                     text-text-2 hover:text-brand transition-colors py-2 border-t border-border"
        >
          Ver todas las alertas ({totalCount})
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */
function AlertsPanelHeader({ totalCount }: { totalCount: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Bell className="w-4 h-4 text-text-2" />
          {totalCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF2D55]
                         text-white text-[8px] font-bold flex items-center justify-center
                         shadow-[0_0_8px_rgba(255,45,85,0.5)]"
            >
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          )}
        </div>
        <h3 className="text-[11px] font-primary text-text-3 uppercase tracking-[0.12em]">
          Alertas Activas
        </h3>
      </div>
      {totalCount > 0 && (
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full text-[#FF2D55]"
          style={{ background: "rgba(255,45,85,0.12)" }}
        >
          {totalCount} activa{totalCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function AlertRow({ alert }: { alert: ActiveAlert }) {
  return (
    <Link href={alert.href} className="block group">
      <div
        className="flex items-center gap-3 p-3 rounded-xl border transition-shadow duration-150
                   hover:shadow-md"
        style={{
          background: alert.bgColorStyle,
          borderColor: alert.borderColorStyle,
        }}
      >
        {/* Icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: alert.bgColorStyle }}
        >
          <span className={alert.colorClass}>{alert.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[11px] font-semibold truncate ${alert.colorClass}`}
          >
            {alert.title}
          </p>
          <p className="text-[10px] text-text-3 truncate mt-0.5">
            {alert.description}
          </p>
        </div>

        {/* Action */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className={`text-[9px] font-bold hidden group-hover:block transition-all ${alert.colorClass}`}
          >
            {alert.actionLabel}
          </span>
          <ChevronRight className={`w-3.5 h-3.5 ${alert.colorClass}`} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Exported counter helper ─── */
export function countActiveAlerts({
  lowStockProducts,
  overdueReceivables,
  activeRecurringAlerts,
  inactiveClients,
}: ActiveAlertsPanelProps): number {
  let count = 0;
  if (lowStockProducts.length > 0) count++;
  if (overdueReceivables.length > 0) count++;
  if (activeRecurringAlerts.length > 0) count++;
  if (inactiveClients.length > 0) count++;
  // Extra badge for critical stock (separate alert row)
  const hasCritical = lowStockProducts.some(
    (p: any) => p.stock <= 0 || (p.min_stock && p.stock < p.min_stock * 0.5),
  );
  const hasNormal = lowStockProducts.some(
    (p: any) => p.stock > 0 && p.min_stock && p.stock < p.min_stock,
  );
  if (hasCritical && hasNormal) count++; // split into 2 rows
  return count;
}
