import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Activity,
} from "lucide-react";
import { SaasLineChart } from "@/components/superadmin/saas-line-chart";
import { PlanDonutChart } from "@/components/superadmin/plan-donut-chart";
import { RecentCompanies } from "@/components/superadmin/recent-companies";

export default async function SuperAdminHome() {
  const supabase = await createClient();

  // ─── QUERIES PARALELAS ─────────────────────────────────────
  const [
    { count: totalCompanies },
    { count: activeCompanies },
    { count: suspendedCompanies },
    { count: trialCompanies },
    { count: totalUsers },
    { data: planDistribution },
    { data: newCompaniesThisMonth },
    { data: recentCompanies },
    { data: mrrData },
    { data: overdueCompanies },
    { data: monthlyGrowth },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("plan_status", "active"),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("plan_status", "suspended"),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("plan_status", "trial"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("plan").eq("plan_status", "active"),
    supabase
      .from("companies")
      .select("id")
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString(),
      ),
    supabase
      .from("companies")
      .select("id, name, plan, plan_status, created_at, owner_email")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("subscription_payments")
      .select("amount_usd")
      .eq("status", "paid")
      .gte(
        "period_start",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString(),
      ),
    supabase
      .from("companies")
      .select("id, name, owner_email")
      .eq("plan_status", "overdue"),
    supabase
      .from("companies")
      .select("created_at")
      .order("created_at", { ascending: true }),
  ]);

  // Calcular MRR
  const PLAN_PRICES = { emprendedor: 25, crecimiento: 55, corporativo: 120 };
  const mrr = (planDistribution ?? []).reduce((sum, c) => {
    return (
      sum + ((PLAN_PRICES as any)[c.plan as keyof typeof PLAN_PRICES] ?? 0)
    );
  }, 0);
  const arr = mrr * 12;

  // Calcular distribución por plan
  const planCounts = (planDistribution ?? []).reduce((acc: any, c) => {
    acc[c.plan] = (acc[c.plan] ?? 0) + 1;
    return acc;
  }, {});

  // Calcular crecimiento mensual de empresas (últimos 8 meses)
  const growthChart = buildMonthlyGrowth(monthlyGrowth ?? []);

  return (
    <div className="space-y-6 page-enter">
      {/* HEADER */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Command Center
        </h1>
        <p className="text-sm text-[#9585B8] mt-0.5">
          Vista global del SaaS —{" "}
          {new Date().toLocaleDateString("es-VE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ALERTA MOROSAS */}
      {(overdueCompanies?.length ?? 0) > 0 && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl
                        bg-[rgba(255,45,85,0.06)] border border-[rgba(255,45,85,0.20)]"
        >
          <AlertTriangle className="w-5 h-5 text-[#FF2D55] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {overdueCompanies?.length} empresa(s) con pago vencido
            </p>
            <p className="text-xs text-[#9585B8]">
              Requieren atención inmediata
            </p>
          </div>
          <a
            href="/superadmin/suscripciones"
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#FF2D55]
                        bg-[rgba(255,45,85,0.10)] hover:bg-[rgba(255,45,85,0.18)] transition-colors"
          >
            Ver morosas →
          </a>
        </div>
      )}

      {/* KPIs — FILA 1: Financieros */}
      <div>
        <p className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest mb-3">
          Métricas Financieras
        </p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {/* MRR */}
          <div
            className="bg-[#18102A] border border-white/6 rounded-2xl p-5
                          hover:border-[rgba(224,64,251,0.20)] transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-[rgba(0,229,204,0.10)]">
                <DollarSign className="w-4 h-4 text-[#00E5CC]" />
              </div>
              <span className="text-[10px] font-semibold text-[#9585B8]">
                este mes
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-white tracking-tight mb-1">
              ${mrr.toLocaleString()}
            </div>
            <p className="text-xs text-[#9585B8]">MRR</p>
          </div>

          {/* ARR */}
          <div
            className="bg-[#18102A] border border-white/6 rounded-2xl p-5
                          hover:border-[rgba(124,77,255,0.20)] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-[rgba(124,77,255,0.10)]">
                <TrendingUp className="w-4 h-4 text-[#7C4DFF]" />
              </div>
              <span className="text-[10px] font-semibold text-[#9585B8]">
                proyectado
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-white tracking-tight mb-1">
              ${arr.toLocaleString()}
            </div>
            <p className="text-xs text-[#9585B8]">ARR</p>
          </div>

          {/* Empresas activas */}
          <div
            className="bg-[#18102A] border border-white/6 rounded-2xl p-5
                          hover:border-[rgba(224,64,251,0.20)] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-[rgba(224,64,251,0.10)]">
                <Building2 className="w-4 h-4 text-[#E040FB]" />
              </div>
              <span className="text-[10px] font-semibold text-[#00E5CC]">
                +{newCompaniesThisMonth?.length ?? 0} este mes
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-white tracking-tight mb-1">
              {activeCompanies}
            </div>
            <p className="text-xs text-[#9585B8]">Empresas activas</p>
          </div>

          {/* Usuarios totales */}
          <div
            className="bg-[#18102A] border border-white/6 rounded-2xl p-5
                          hover:border-[rgba(79,195,247,0.20)] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-[rgba(79,195,247,0.10)]">
                <Users className="w-4 h-4 text-[#4FC3F7]" />
              </div>
            </div>
            <div className="font-mono text-3xl font-bold text-white tracking-tight mb-1">
              {totalUsers}
            </div>
            <p className="text-xs text-[#9585B8]">Usuarios totales</p>
          </div>
        </div>
      </div>

      {/* KPIs — FILA 2: Estados */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: "Total empresas",
            value: totalCompanies ?? 0,
            color: "#E040FB",
            bg: "rgba(224,64,251,0.08)",
          },
          {
            label: "En trial",
            value: trialCompanies ?? 0,
            color: "#FFB800",
            bg: "rgba(255,184,0,0.08)",
          },
          {
            label: "Suspendidas",
            value: suspendedCompanies ?? 0,
            color: "#FF2D55",
            bg: "rgba(255,45,85,0.08)",
          },
          {
            label: "Con pago vencido",
            value: overdueCompanies?.length ?? 0,
            color: "#FF2D55",
            bg: "rgba(255,45,85,0.08)",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="bg-[#18102A] border border-white/6 rounded-2xl p-4
                                     hover:border-white/12 transition-all"
          >
            <div
              className="font-mono text-2xl font-bold mb-1"
              style={{ color }}
            >
              {value}
            </div>
            <p className="text-xs text-[#9585B8]">{label}</p>
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((value / (totalCompanies || 1)) * 100, 100)}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        {/* Crecimiento mensual de empresas */}
        <div className="bg-[#18102A] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Crecimiento de Empresas
              </h2>
              <p className="text-xs text-[#9585B8] mt-0.5">
                Nuevas empresas por mes
              </p>
            </div>
          </div>
          <SaasLineChart data={growthChart} />
        </div>

        {/* Distribución por plan */}
        <div className="bg-[#18102A] border border-white/6 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-white mb-1">
            Por Plan
          </h2>
          <p className="text-xs text-[#9585B8] mb-4">Distribución actual</p>
          <PlanDonutChart
            data={[
              {
                name: "Emprendedor",
                value: planCounts.emprendedor ?? 0,
                color: "#4FC3F7",
              },
              {
                name: "Crecimiento",
                value: planCounts.crecimiento ?? 0,
                color: "#E040FB",
              },
              {
                name: "Corporativo",
                value: planCounts.corporativo ?? 0,
                color: "#7C4DFF",
              },
              {
                name: "Enterprise",
                value: planCounts.enterprise ?? 0,
                color: "#FFB800",
              },
            ].filter(Boolean)}
          />
        </div>
      </div>

      {/* ÚLTIMAS EMPRESAS REGISTRADAS */}
      <div className="bg-[#18102A] border border-white/6 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-base font-bold text-white">
            Últimas Empresas
          </h2>
          <a
            href="/superadmin/empresas"
            className="text-[11px] font-semibold text-[#E040FB] hover:opacity-80 transition-opacity"
          >
            Ver todas →
          </a>
        </div>
        <RecentCompanies companies={recentCompanies ?? []} />
      </div>
    </div>
  );
}

// Helper para construir gráfico de crecimiento mensual
function buildMonthlyGrowth(companies: any[]) {
  const months: Record<string, number> = {};
  companies.forEach((c) => {
    const key = new Date(c.created_at).toLocaleDateString("es-VE", {
      month: "short",
      year: "2-digit",
    });
    months[key] = (months[key] ?? 0) + 1;
  });
  return Object.entries(months)
    .slice(-8)
    .map(([month, count]) => ({ month, count }));
}
