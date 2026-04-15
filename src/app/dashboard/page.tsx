"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { KpiCardWithSparkline } from "@/components/dashboard/kpi-card-sparkline";
import { AgingChart } from "@/components/dashboard/aging-chart";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { ActiveAlertsPanel, countActiveAlerts } from "@/components/dashboard/active-alerts-panel";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DailySeed } from "@/components/dashboard/daily-seed";
import { PortalPaymentsAlert } from "@/components/dashboard/portal-payments-alert";
import { BroadcastBanner } from "@/components/dashboard/broadcast-banner";
import { useUser } from "@/hooks/use-user";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  CheckCircle,
  ShoppingCart,
  Loader2,
  Target,
  UserPlus,
  Package,
  BarChart3,
  DollarSign,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ChevronRight,
  Bell,
} from "lucide-react";
import Link from "next/link";

/* ─── Helpers ─── */
function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 12) return "🌅";
  if (h < 18) return "☀️";
  return "🌙";
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatDateEs(d: Date): string {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function groupByDay(
  rows: any[],
  dateField: string,
  valueField: string,
): { v: number }[] {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const day = r[dateField]?.substring(0, 10) ?? "";
    map.set(day, (map.get(day) ?? 0) + (Number(r[valueField]) || 0));
  });
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([, v]) => ({ v: Math.round(v * 100) / 100 }));
}

function groupByMonth(rows: any[], dateField: string, valueField: string) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = new Date(r[dateField]);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + (Number(r[valueField]) || 0));
  });
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      month: months[parseInt(key.split("-")[1]) - 1],
      total: Math.round(total * 100) / 100,
    }));
}

/* ─── Componente Principal ─── */
export default function DashboardPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<string>("mes");

  useEffect(() => {
    async function load() {
      try {
        const companyId = user?.company_id;
        if (!companyId) {
          setLoading(false);
          return;
        }

        const today = new Date();
        const startMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ).toISOString();
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 86400000,
        ).toISOString();
        const eightMonthsAgo = new Date(
          today.getFullYear(),
          today.getMonth() - 7,
          1,
        ).toISOString();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).toISOString();
        const todayEnd = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1,
        ).toISOString();

        const [
          receivablesRes,
          paymentsVerifiedRes,
          paymentsPendingRes,
          ordersActiveRes,
          riskRes,
          ordersTrendRes,
          newClientsRes,
          lowStockRes,
          creditsDueTodayRes,
          topClientsRes,
          topProductsRes,
          recurringRes,
          inactiveRes,
          overdueRes,
        ] = await Promise.all([
          // Existentes
          supabase
            .from("receivables")
            .select("balance_usd, amount_usd, due_date, status, created_at")
            .eq("company_id", companyId)
            .neq("status", "paid"),
          supabase
            .from("payments")
            .select("amount_usd, verified_at, created_at")
            .eq("company_id", companyId)
            .eq("status", "verified")
            .gte("verified_at", startMonth),
          // Pagos pendientes de verificar
          supabase
            .from("payments")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId)
            .eq("status", "pending"),
          // Pedidos activos
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("company_id", companyId)
            .in("status", ["draft", "confirmed", "dispatched", "pending"]),
          // Clientes riesgo
          supabase
            .from("partners")
            .select(
              "id, name, current_balance, credit_status, users(full_name)",
            )
            .eq("company_id", companyId)
            .eq("credit_status", "red")
            .order("current_balance", { ascending: false })
            .limit(6),
          // Tendencia ventas 8 meses
          supabase
            .from("orders")
            .select("total_usd, created_at")
            .eq("company_id", companyId)
            .gte("created_at", eightMonthsAgo)
            .order("created_at", { ascending: true }),
          // Clientes nuevos este mes
          supabase
            .from("partners")
            .select("id, created_at", { count: "exact" })
            .eq("company_id", companyId)
            .gte("created_at", startMonth),
          // Productos stock bajo
          supabase
            .from("products")
            .select("id, name, stock, unit, min_stock")
            .eq("company_id", companyId)
            .not("min_stock", "is", null)
            .order("stock", { ascending: true })
            .limit(5),
          // Créditos venciendo hoy
          supabase
            .from("receivables")
            .select("id, balance_usd, due_date, partners(name)")
            .eq("company_id", companyId)
            .neq("status", "paid")
            .gte("due_date", todayStart)
            .lt("due_date", todayEnd),
          // Top clientes por deuda
          supabase
            .from("receivables")
            .select("partner_id, balance_usd, partners(name)")
            .eq("company_id", companyId)
            .neq("status", "paid")
            .order("balance_usd", { ascending: false })
            .limit(20),
          // Top productos (order_items recientes)
          supabase
            .from("order_items")
            .select(
              "product_id, qty, subtotal, products(name, unit), orders!inner(company_id, created_at)",
            )
            .eq("orders.company_id", companyId)
            .gte("orders.created_at", startMonth),
          supabase
            .from("recurring_expenses")
            .select("*")
            .eq("company_id", companyId)
            .eq("is_active", true),
          // Clientes inactivos 30+ días
          supabase
            .from("partners")
            .select("id, name, last_order_at")
            .eq("company_id", companyId)
            .lt("last_order_at", thirtyDaysAgo)
            .order("last_order_at", { ascending: true })
            .limit(10),
          // Facturas vencidas
          supabase
            .from("receivables")
            .select("id, invoice_number, balance_usd, due_date, partners(name)")
            .eq("company_id", companyId)
            .neq("status", "paid")
            .lt("due_date", todayStart)
            .order("due_date", { ascending: true })
            .limit(10),
        ]);

        const recs = (receivablesRes.data as any[]) || [];
        const pays = (paymentsVerifiedRes.data as any[]) || [];
        const risks = (riskRes.data as any[]) || [];
        const ordersTrend = (ordersTrendRes.data as any[]) || [];
        const lowStockRaw = (lowStockRes.data as any[]) || [];
        const creditsDueRaw = (creditsDueTodayRes.data as any[]) || [];
        const topClientsRaw = (topClientsRes.data as any[]) || [];
        const topProductsRaw = (topProductsRes.data as any[]) || [];
        const recurringAlerts = (recurringRes.data as any[]) || [];
        const inactiveClientsRaw = (inactiveRes.data as any[]) || [];
        const overdueReceivablesRaw = (overdueRes.data as any[]) || [];

        const totalCartera = recs.reduce(
          (s: number, r: any) => s + (r.balance_usd ?? 0),
          0,
        );
        const totalMora = recs
          .filter((r: any) => new Date(r.due_date) < today)
          .reduce((s: number, r: any) => s + (r.balance_usd ?? 0), 0);
        const recaudadoMes = pays.reduce(
          (s: number, p: any) => s + (p.amount_usd ?? 0),
          0,
        );

        // Filter recurring alerts (e.g. within next 3 days)
        const activeRecurringAlerts = recurringAlerts.filter(r => {
          const day = Number(r.due_day);
          const todayNum = today.getDate();
          return (day - todayNum) >= 0 && (day - todayNum) <= (r.alert_days || 3);
        });
        const porcentajeMora =
          totalCartera > 0 ? +((totalMora / totalCartera) * 100).toFixed(1) : 0;
        const collectionRate =
          recaudadoMes + totalCartera > 0
            ? Math.round((recaudadoMes / (recaudadoMes + totalCartera)) * 100)
            : 0;

        // Sparklines
        const receivableSpark = groupByDay(recs, "created_at", "balance_usd");
        const collectedSpark = groupByDay(pays, "verified_at", "amount_usd");
        const ordersSpark = groupByDay(ordersTrend, "created_at", "total_usd");

        // Gráfico ventas por mes
        const salesByMonth = groupByMonth(
          ordersTrend,
          "created_at",
          "total_usd",
        );

        // Low stock (filtrar realmente los bajos)
        const lowStockProducts = lowStockRaw.filter(
          (p: any) => p.min_stock && p.stock <= p.min_stock,
        );

        // Credits due today
        const creditsDueToday = creditsDueRaw.map((r: any) => ({
          id: r.id,
          client_name: r.partners?.name ?? "Sin nombre",
          amount: r.balance_usd ?? 0,
        }));

        // Top clients agrupados
        const clientMap = new Map<string, { name: string; total: number }>();
        topClientsRaw.forEach((r: any) => {
          const id = r.partner_id;
          const existing = clientMap.get(id);
          if (existing) {
            existing.total += r.balance_usd ?? 0;
          } else {
            clientMap.set(id, {
              name: r.partners?.name ?? "Sin nombre",
              total: r.balance_usd ?? 0,
            });
          }
        });
        const topClients = [...clientMap.entries()]
          .map(([id, v]) => ({ partner_id: id, ...v }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        // Top products agrupados
        const productMap = new Map<
          string,
          { name: string; unit: string; qty: number; revenue: number }
        >();
        topProductsRaw.forEach((r: any) => {
          const id = r.product_id;
          const existing = productMap.get(id);
          if (existing) {
            existing.qty += r.qty ?? 0;
            existing.revenue += r.subtotal ?? 0;
          } else {
            productMap.set(id, {
              name: r.products?.name ?? "Sin nombre",
              unit: r.products?.unit ?? "und",
              qty: r.qty ?? 0,
              revenue: r.subtotal ?? 0,
            });
          }
        });
        const topProducts = [...productMap.entries()]
          .map(([id, v]) => ({ product_id: id, ...v }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setData({
          companyId,
          totalCartera,
          totalMora,
          recaudadoMes,
          porcentajeMora,
          pendingOrders: ordersActiveRes.count ?? 0,
          pendingVerifications: paymentsPendingRes.count ?? 0,
          newClients: newClientsRes.count ?? 0,
          collectionRate,
          aging: calcAging(recs, today),
          mappedRiskClients: risks.map((r: any) => ({
            ...r,
            assigned_user: r.users,
          })),
          receivableSpark,
          collectedSpark,
          ordersSpark,
          salesByMonth,
          lowStockProducts,
          creditsDueToday,
          topClients,
          topProducts,
          activeRecurringAlerts,
          inactiveClients: inactiveClientsRaw,
          overdueReceivables: overdueReceivablesRaw,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.company_id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#E040FB] animate-spin" />
      </div>
    );
  if (!data)
    return <div className="p-8 text-[#9585B8]">Falta configurar empresa.</div>;

  const firstName = user?.full_name?.split(" ")[0] || "Usuario";

  const alertCount = data
    ? countActiveAlerts({
        lowStockProducts: data.lowStockProducts,
        overdueReceivables: data.overdueReceivables,
        activeRecurringAlerts: data.activeRecurringAlerts,
        inactiveClients: data.inactiveClients,
      })
    : 0;

  return (
    <div className="space-y-5 animate-fade-up max-w-7xl mx-auto font-montserrat font-light">
      {/* ═══ ZONA 0: HEADER ═══ */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getGreetingEmoji()}</span>
            <h1 className="font-primary text-2xl">
              ¡{getGreeting()}, {firstName}!
            </h1>
          </div>
          <p className="text-sm text-text-2">{formatDateEs(new Date())}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bell with counter */}
          <div className="relative">
            <button
              onClick={() => {
                document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-9 h-9 rounded-xl bg-surface-card border border-border flex items-center justify-center
                         shadow-card hover:border-border-brand/40 transition-colors"
              title="Ir a las alertas activas"
            >
              <Bell className="w-4 h-4 text-text-2" />
            </button>
            {alertCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF2D55]
                           text-white text-[9px] font-bold flex items-center justify-center px-1
                           shadow-[0_0_10px_rgba(255,45,85,0.5)] animate-pulse"
              >
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </div>

          {/* Selector de período */}
          <div className="flex items-center gap-1 p-1 bg-surface-card rounded-xl border border-border shadow-card">
            {["hoy", "semana", "mes", "año"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  period === p
                    ? "bg-gradient-to-r from-brand to-brand-dark text-white shadow-brand"
                    : "text-text-2 hover:text-text-1"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SEMILLA + ALERTAS PORTAL ═══ */}
      {user && <BroadcastBanner companyId={data.companyId} userId={user.id} />}
      <DailySeed companyId={data.companyId} />
      <PortalPaymentsAlert companyId={data.companyId} />

      {/* ═══ ZONA 1: 6 KPIs con Sparklines ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
        <Link href="/dashboard/cobranza" className="block">
          <KpiCardWithSparkline
            icon={<Wallet className="w-4 h-4" />}
            iconBg="bg-[rgba(224,64,251,0.10)]"
            iconColor="text-[#E040FB]"
            glowColor="rgba(224,64,251,0.10)"
            value={formatCurrency(data.totalCartera)}
            label="Por Cobrar"
            sparkData={data.receivableSpark}
            sparkColor="#E040FB"
          />
        </Link>

        <Link href="/dashboard/cobranza?filter=overdue" className="block">
          <KpiCardWithSparkline
            icon={<AlertTriangle className="w-4 h-4" />}
            iconBg={
              data.totalMora > 0
                ? "bg-[rgba(255,45,85,0.10)]"
                : "bg-[rgba(0,229,204,0.10)]"
            }
            iconColor={data.totalMora > 0 ? "text-[#FF2D55]" : "text-[#00E5CC]"}
            glowColor={
              data.totalMora > 0
                ? "rgba(255,45,85,0.12)"
                : "rgba(0,229,204,0.08)"
            }
            value={formatCurrency(data.totalMora)}
            label="Vencida"
            delta={-data.porcentajeMora}
            sparkData={data.receivableSpark}
            sparkColor={data.totalMora > 0 ? "#FF2D55" : "#00E5CC"}
          />
        </Link>

        <KpiCardWithSparkline
          icon={<CheckCircle className="w-4 h-4" />}
          iconBg="bg-[rgba(0,229,204,0.10)]"
          iconColor="text-[#00E5CC]"
          glowColor="rgba(0,229,204,0.10)"
          value={formatCurrency(data.recaudadoMes)}
          label="Recaudado"
          sublabel="este mes"
          sparkData={data.collectedSpark}
          sparkColor="#00E5CC"
        />

        <Link href="/dashboard/ventas" className="block">
          <KpiCardWithSparkline
            icon={<ShoppingCart className="w-4 h-4" />}
            iconBg="bg-[rgba(255,184,0,0.10)]"
            iconColor="text-[#FFB800]"
            glowColor="rgba(255,184,0,0.08)"
            value={String(data.pendingOrders)}
            label="Pedidos Activos"
            sparkData={data.ordersSpark}
            sparkColor="#FFB800"
          />
        </Link>

        {/* KPI 5: Eficiencia de Cobro */}
        <div
          className="relative bg-surface-card border border-border rounded-2xl p-4 overflow-hidden
                                shadow-card hover-card-effect
                                group card-enter h-[140px]"
        >
          <div
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "var(--brand-glow)" }}
          />
          <div className="flex items-start justify-between mb-2 relative">
            <div className="p-2 rounded-xl bg-brand/10">
              <Target className="w-4 h-4 text-brand" />
            </div>
            <span className="text-[10px] font-semibold text-text-3">
              este mes
            </span>
          </div>
          <div className="font-primary text-2xl leading-tight mb-0.5 relative">
            {data.collectionRate}%
          </div>
          <p className="text-[11px] text-text-2 mb-3 relative">
            Efic. de Cobro
          </p>
          <div className="h-1 bg-surface-card/10 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(data.collectionRate, 100)}%`,
                background:
                  data.collectionRate > 70
                    ? "linear-gradient(90deg, var(--ok), var(--brand))"
                    : data.collectionRate > 40
                      ? "linear-gradient(90deg, var(--warn), var(--brand))"
                      : "linear-gradient(90deg, var(--danger), var(--warn))",
              }}
            />
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-b-2xl
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, var(--brand), transparent)",
            }}
          />
        </div>

        {/* KPI 6: Clientes Nuevos */}
        <Link href="/dashboard/clientes" className="block">
          <KpiCardWithSparkline
            icon={<UserPlus className="w-4 h-4" />}
            iconBg="bg-[rgba(79,195,247,0.10)]"
            iconColor="text-[#4FC3F7]"
            glowColor="rgba(79,195,247,0.08)"
            value={String(data.newClients)}
            label="Clientes Nuevos"
            sublabel="este mes"
            sparkColor="#4FC3F7"
          />
        </Link>
      </div>

      {/* ═══ ZONA 2-3: Gráfico Ventas + Panel Lateral ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* Gráfico Ventas por Mes */}
        <SalesChart data={data.salesByMonth} />

        {/* Panel lateral: Acciones Rápidas + Verificar Cobros + Vencen Hoy */}
        <div className="space-y-3">
          {/* Acciones Rápidas */}
          <div className="bg-surface-card border border-border rounded-2xl p-4 shadow-card hover-card-effect">
            <h3 className="text-[10px] font-primary text-text-3 uppercase tracking-[0.12em] mb-3">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Nueva Venta",
                  icon: ShoppingCart,
                  href: "/dashboard/ventas/nueva",
                  color: "#E040FB",
                },
                {
                  label: "Registrar Cobro",
                  icon: DollarSign,
                  href: "/dashboard/cobranza",
                  color: "#00E5CC",
                },
                {
                  label: "Nuevo Cliente",
                  icon: UserPlus,
                  href: "/dashboard/clientes",
                  color: "#4FC3F7",
                },
                {
                  label: "Ver Reportes",
                  icon: BarChart3,
                  href: "/dashboard/reportes",
                  color: "#FFB800",
                },
              ].map(({ label, icon: Icon, href, color }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl
                                               bg-surface-base/10 border border-border
                                               hover:bg-surface-hover/20 hover:border-border-brand/30
                                               transition-all duration-150 group text-center"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span
                    className="text-[10px] font-semibold text-text-2
                                                     group-hover:text-text-1 transition-colors leading-tight"
                  >
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Cobros Pendientes */}
          {data.pendingVerifications > 0 && (
            <div
              className="bg-gradient-to-r from-[rgba(224,64,251,0.10)] to-[rgba(124,77,255,0.06)]
                                        border border-[rgba(224,64,251,0.20)] rounded-2xl p-4 shadow-card hover-card-effect"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg bg-[rgba(224,64,251,0.15)]
                                                flex items-center justify-center flex-shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 text-[#E040FB]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-1">
                    Verificar Cobros
                  </p>
                  <p className="text-[11px] text-text-2">
                    {data.pendingVerifications} pago(s) esperando
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/cobranza"
                className="block w-full py-2 rounded-xl text-center text-xs font-semibold
                                           bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white
                                           hover:opacity-90 transition-opacity"
              >
                Revisar ahora
              </Link>
            </div>
          )}

          {/* Créditos venciendo HOY */}
          {data.creditsDueToday.length > 0 && (
            <div
              className="bg-status-warn/5 border border-status-warn/15
                                        rounded-2xl p-4 shadow-card hover-card-effect"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-status-warn flex-shrink-0" />
                <p className="text-xs font-semibold text-status-warn">
                  Vencen HOY ({data.creditsDueToday.length})
                </p>
              </div>
              <div className="space-y-2">
                {data.creditsDueToday.slice(0, 3).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <p className="text-xs font-medium text-text-1 truncate max-w-[140px]">
                      {item.client_name}
                    </p>
                    <span className="font-primary text-xs text-status-warn">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ZONA 4-5: Top Clientes + Top Productos ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Clientes */}
        <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-card hover-card-effect">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-primary text-sm text-text-1">
              Top Clientes
            </h2>
            <Link
              href="/dashboard/clientes"
              className="text-[11px] font-semibold text-brand hover:text-brand-dark transition-colors flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {data.topClients.length > 0 ? (
            <div className="space-y-3">
              {data.topClients.map((client: any, i: number) => {
                const maxDebt = data.topClients[0]?.total || 1;
                const pct = (client.total / maxDebt) * 100;
                return (
                  <div key={client.partner_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-text-3 w-4">
                          #{i + 1}
                        </span>
                        <div
                          className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#E040FB]/20 to-[#7C4DFF]/20
                                                                flex items-center justify-center text-[9px] font-bold text-[#E040FB]"
                        >
                          {client.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-xs font-medium text-text-1 truncate max-w-[120px]">
                          {client.name}
                        </span>
                      </div>
                      <span className="font-primary text-xs text-status-danger">
                        {formatCurrency(client.total)}
                      </span>
                    </div>
                    <div className="h-1 bg-surface-card/10 rounded-full overflow-hidden ml-6">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background:
                            i === 0
                              ? "linear-gradient(90deg, #FF2D55, #E040FB)"
                              : "linear-gradient(90deg, #E040FB, #7C4DFF)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-8 h-8 text-[#3D2D5C] mx-auto mb-2" />
              <p className="text-xs text-[#9585B8]">Sin cuentas por cobrar</p>
            </div>
          )}
        </div>

        {/* Top Productos */}
        <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-card hover-card-effect">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-primary text-sm text-text-1">
              Más Vendidos
            </h2>
            <span className="text-[10px] text-text-3">este mes</span>
          </div>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p: any, i: number) => {
                const maxRev = data.topProducts[0]?.revenue || 1;
                const pct = (p.revenue / maxRev) * 100;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={p.product_id} className="flex items-center gap-3">
                    <span className="text-base w-6 flex-shrink-0 text-center">
                      {medals[i] ?? `#${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-1 truncate max-w-[140px]">
                          {p.name}
                        </span>
                        <span className="font-primary text-[11px] text-ok ml-2 flex-shrink-0">
                          {formatCurrency(p.revenue)}
                        </span>
                      </div>
                      <div className="h-1 bg-surface-card/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background:
                              "linear-gradient(90deg, var(--ok), var(--brand))",
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-text-3 mt-0.5 block">
                        {p.qty} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-text-3 mx-auto mb-2" />
              <p className="text-xs text-text-2">Sin ventas este mes</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ZONA 6: Aging de Cartera ═══ */}
      <AgingChart data={data.aging} />

      {/* ═══ ZONA 7: Alertas Activas + Actividad Reciente ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4" id="alerts-section">
        <RecentActivity companyId={data.companyId} />
        <div className="space-y-3">
          <ActiveAlertsPanel
            lowStockProducts={data.lowStockProducts}
            overdueReceivables={data.overdueReceivables}
            activeRecurringAlerts={data.activeRecurringAlerts}
            inactiveClients={data.inactiveClients}
          />
          <AlertsPanel clients={data.mappedRiskClients} />
        </div>
      </div>
    </div>
  );
}

/* ─── Sales Chart Component ─── */
function SalesChart({ data }: { data: { month: string; total: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-card hover-card-effect">
        <h2 className="font-primary text-base text-text-1 mb-2">
          Ventas por Mes
        </h2>
        <div className="flex items-center justify-center h-48">
          <p className="text-xs text-text-2">Sin datos de ventas aún</p>
        </div>
      </div>
    );
  }

  // Rellenar meses vacíos para tener al menos los últimos 6 meses
  const MONTHS_LABELS = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const now = new Date();
  const filledData: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = MONTHS_LABELS[d.getMonth()];
    const existing = data.find((item) => item.month === label);
    filledData.push({ month: label, total: existing?.total ?? 0 });
  }

  const maxVal = Math.max(...filledData.map((d) => d.total), 1);
  const totalVentas = filledData.reduce((s, d) => s + d.total, 0);

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-card hover-card-effect">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-primary text-base text-text-1">
            Ventas por Mes
          </h2>
          <p className="text-xs text-text-2 mt-0.5">
            Facturación total en USD
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-text-2">
            <span className="w-3 h-1 bg-gradient-to-r from-brand to-brand-dark rounded-full inline-block" />
            Ventas
          </span>
          {totalVentas > 0 && (
            <span className="font-primary text-text-1">
              {formatCurrency(totalVentas)}
            </span>
          )}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-3 h-48">
        {filledData.map((d, i) => {
          const heightPct =
            d.total > 0 ? Math.max(12, (d.total / maxVal) * 100) : 4;
          const isLast = i === filledData.length - 1;
          const hasValue = d.total > 0;
          return (
            <div
              key={d.month}
              className="flex-1 flex flex-col items-center gap-2 group"
            >
              {/* Valor al hover (siempre visible si hay datos) */}
              <span
                className={`text-[10px] font-primary transition-opacity ${
                  hasValue
                    ? "text-brand opacity-100"
                    : "text-text-3 opacity-0 group-hover:opacity-100"
                }`}
              >
                {hasValue ? formatCurrency(d.total) : "$0"}
              </span>
              <div
                className={`w-full relative rounded-t-lg transition-all duration-500
                                            group-hover:opacity-80 cursor-default`}
                style={{
                  height: `${heightPct}%`,
                  background: hasValue
                    ? isLast
                      ? "linear-gradient(180deg, var(--brand), var(--brand-dark))"
                      : "linear-gradient(180deg, var(--brand-glow), var(--bg-card-hover))"
                    : "var(--bg-card-hover)",
                  boxShadow:
                    hasValue && isLast
                      ? "var(--shadow-brand)"
                      : "none",
                  borderRadius: "6px 6px 0 0",
                }}
              />
              <span
                className={`text-[10px] font-semibold ${
                  isLast
                    ? "text-brand"
                    : hasValue
                      ? "text-text-2"
                      : "text-text-3"
                }`}
              >
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Aging Calculator ─── */
function calcAging(receivables: any[], today: Date) {
  const r = { corriente: 0, d1_7: 0, d8_15: 0, d16_30: 0, mas30: 0 };
  receivables.forEach(({ balance_usd, due_date }) => {
    const days = Math.ceil(
      (today.getTime() - new Date(due_date).getTime()) / 86400000,
    );
    if (days <= 0) r.corriente += balance_usd ?? 0;
    else if (days <= 7) r.d1_7 += balance_usd ?? 0;
    else if (days <= 15) r.d8_15 += balance_usd ?? 0;
    else if (days <= 30) r.d16_30 += balance_usd ?? 0;
    else r.mas30 += balance_usd ?? 0;
  });
  return [
    { name: "Corriente", value: r.corriente, color: "#00E5CC" },
    { name: "1–7d", value: r.d1_7, color: "#7C4DFF" },
    { name: "8–15d", value: r.d8_15, color: "#FFB800" },
    { name: "16–30d", value: r.d16_30, color: "#FF8C00" },
    { name: "+30d", value: r.mas30, color: "#FF2D55" },
  ];
}
