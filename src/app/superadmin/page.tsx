import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { SaasLineChart } from "@/components/superadmin/saas-line-chart";
import { PlanDonutChart } from "@/components/superadmin/plan-donut-chart";
import { MrrLineChart } from "@/components/superadmin/mrr-line-chart";
import { RetentionBarChart } from "@/components/superadmin/retention-bar-chart";
import { ActionCenter } from "@/components/superadmin/action-center";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function SuperAdminHome() {
  const supabase = await createClient();

  // ─── QUERIES PARALELAS ─────────────────────────────────────
  const [
    { count: totalCompaniesCountRaw },
    { data: allCompaniesData },
    { count: totalUsersCountRaw },
    { data: allPaymentsData },
    { data: monthlyOrdersData },
    { data: recurrentesData },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("id, name, created_at, subscription_status, plan_type, logo_url"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("subscription_payments").select("*, companies(name)").order("created_at", { ascending: false }),
    supabase.from("orders").select("company_id, created_at").gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from("recurring_expenses").select("*, companies(name)").eq("is_active", true),
  ]);

  const allCompanies = allCompaniesData || [];
  const allPayments = allPaymentsData || [];
  const monthlyOrders = monthlyOrdersData || [];
  const allRecurrentes = (recurrentesData || []) as any[];
  const totalUsers = totalUsersCountRaw || 0;
  const totalCompanies = totalCompaniesCountRaw || 0;

  // Recalcular métricas para Cards
  const activeCompaniesCount = allCompanies.filter(c => c.subscription_status === 'active').length;
  const trialCompaniesCount = allCompanies.filter(c => c.subscription_status === 'trial' || c.subscription_status === 'pending_verification').length;
  const demoCompaniesCount = allCompanies.filter(c => c.subscription_status === 'demo').length;
  const suspendedCompaniesCount = allCompanies.filter(c => c.subscription_status === 'suspended').length;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

  // Cálculos Financieros (Simplificado)
  const PLAN_PRICES = { basic: 19.99, pro: 79.99, enterprise: 119.99 };
  const activeCompaniesList = allCompanies.filter(c => c.subscription_status === 'active');
  const totalMrr = activeCompaniesList.reduce((sum, c) => sum + ((PLAN_PRICES as any)[c.plan_type || 'basic'] || 0), 0);
  const arr = totalMrr * 12;

  // LTV
  const getMonthsDiff = (dateStr: string) => {
    const d = new Date(dateStr);
    return Math.max(1, (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth());
  };
  const activeMonths = activeCompaniesList.reduce((sum, c) => sum + getMonthsDiff(c.created_at || now.toISOString()), 0);
  const avgMonths = activeCompaniesList.length ? activeMonths / activeCompaniesList.length : 1;
  const avgMrr = activeCompaniesList.length ? totalMrr / activeCompaniesList.length : 0;
  const ltv = avgMrr * avgMonths;

  // Churn Rate (Aproximación mensual actual vs actias)
  const churnThisMonth = allCompanies.filter(c => ['suspended', 'canceled'].includes(c.subscription_status ?? '') && new Date(c.created_at || now).getMonth() === now.getMonth()).length;
  const churnRate = activeCompaniesList.length > 0 ? (churnThisMonth / activeCompaniesList.length) * 100 : 0;

  // Conversión Trial a pago
  const trialsEver = allCompanies.filter(c => ['active', 'trial', 'demo', 'suspended', 'canceled'].includes(c.subscription_status ?? '')).length;
  const conversionRate = trialsEver ? (activeCompaniesList.length / trialsEver) * 100 : 0;

  // Nuevos registros hoy
  const newToday = allCompanies.filter(c => new Date(c.created_at || now) >= startOfToday).length;

  const overdueCompanies = allCompanies.filter(c => c.subscription_status === 'suspended');

  // Top Empresas
  const countsPerCompany = monthlyOrders.reduce((acc: any, o) => {
    acc[o.company_id] = (acc[o.company_id] || 0) + 1;
    return acc;
  }, {});
  const topCompaniesId = Object.keys(countsPerCompany).sort((a,b) => countsPerCompany[b] - countsPerCompany[a]).slice(0, 5);
  const topCompanies = topCompaniesId.map(id => {
    const c = allCompanies.find(x => x.id === id);
    return {
      id: c?.id,
      name: c?.name || "Empresa",
      logo: c?.logo_url,
      plan: c?.plan_type || "basic",
      tx: countsPerCompany[id]
    };
  });

  // PASO 7: Centro de Acción (Mapeo de Actividades)
  const activities = [
    ...(allPayments.map(p => ({
      id: `pay-${p.id}`,
      type: p.status,
      category: p.status === 'pending' ? 'payment' : 'alert',
      date: new Date(p.created_at),
      message: p.status === 'pending' ? 'Pago pendiente de revisión' : (p.status === 'approved' ? 'Cuenta activada correctamente' : 'Pago rechazado o vencido'),
      company: p.companies?.name || 'Empresa Desconocida',
      icon: p.status === 'pending' ? "clock" : (p.status === 'approved' ? "check" : "alert"),
      color: p.status === 'pending' ? 'text-[#FACC15] bg-[#FACC15]/10' : (p.status === 'approved' ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#F43F5E] bg-[#F43F5E]/10'),
      link: '/superadmin/clientes/suscripciones'
    }))),
    ...(allCompanies.map(c => ({
      id: `comp-${c.id}`,
      type: 'registration',
      category: 'registration',
      date: new Date(c.created_at || now),
      message: 'Nuevo registro de empresa',
      company: c.name,
      icon: "building",
      color: 'text-[#E040FB] bg-[#E040FB]/10',
      link: `/superadmin/clientes/empresas/${c.id}`
    })))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Calcular distribución por plan
  const planCounts = allCompanies.reduce((acc: any, c) => {
    if (!['active', 'trial'].includes(c.subscription_status || '')) return acc;
    const key = c.plan_type || 'basic';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const growthChart = buildMonthlyGrowth(allCompanies);
  const mrrChart = buildMrrGrowth(allCompanies, PLAN_PRICES);
  const retentionChart = buildRetention(allPayments);

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* HEADER */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-1">
          Command Center
        </h1>
        <p className="text-sm font-medium text-text-2 mt-1">
          Panel Maestro de Administración
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA PRINCIPAL (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* FILA 1: FINANZAS DESTACADAS (2 CARDS GRANDES) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MRR */}
            <Link href="/superadmin/clientes/suscripciones" className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-visible group hover:border-brand/30 transition-all cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-brand/10 border border-brand/20 relative group-hover:bg-brand/15 transition-colors">
                  <DollarSign className="w-5 h-5 text-brand" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2 py-1 rounded-md border border-border shadow-sm group-hover:border-brand/20 transition-colors">
                    MRR Actual
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-2 mb-1 group-hover:text-text-1 transition-colors">Ingresos Recurrentes Mensuales</h3>
                <div className="font-heading text-3xl font-black text-text-1 tracking-tight">
                  ${totalMrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Link>

            {/* ARR */}
            <Link href="/superadmin/clientes/suscripciones" className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-[#00AF9C]/30 transition-all cursor-pointer">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5CC]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-[#00E5CC]/10 border border-[#00E5CC]/20 group-hover:bg-[#00E5CC]/15 transition-colors">
                  <TrendingUp className="w-5 h-5 text-[#00AF9C]" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2 py-1 rounded-md border border-border shadow-sm group-hover:border-[#00AF9C]/20 transition-colors">
                    ARR Proyectado
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-2 mb-1 group-hover:text-text-1 transition-colors">Ingresos Recurrentes Anuales</h3>
                <div className="font-heading text-3xl font-black text-text-1 tracking-tight">
                  ${arr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Link>

            {/* Churn Rate */}
            <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-brand/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F43F5E]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-surface-base border border-border group-hover:bg-[#F43F5E]/10 transition-colors">
                  <Activity className="w-5 h-5 text-text-2 group-hover:text-[#F43F5E]" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2 py-1 rounded-md border border-border shadow-sm">
                    Churn Rate
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-2 mb-1">Tasa de Cancelación</h3>
                <div className={`font-heading text-3xl font-black tracking-tight ${churnRate > 0 ? "text-[#F43F5E]" : "text-[#10B981]"}`}>
                  {churnRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* LTV */}
            <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-[#10B981]/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-surface-base border border-border group-hover:bg-[#10B981]/10 transition-colors">
                  <TrendingUp className="w-5 h-5 text-text-2 group-hover:text-[#10B981]" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2 py-1 rounded-md border border-border shadow-sm">
                    LTV Promedio
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-2 mb-1">Valor de Vida Cliente</h3>
                <div className="font-heading text-3xl font-black text-text-1 tracking-tight">
                  ${ltv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* FILA 2: OPERACIONES (7 CARDS PEQUEÑAS) */}
          <div className="flex flex-wrap gap-3">
             {/* Empresas Activas */}
             <Link href="/superadmin/clientes/empresas" className="flex-1 min-w-[140px] bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-brand/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-brand/10 rounded-lg text-brand">
                     <Building2 className="w-4 h-4" />
                   </div>
                   <span className="text-[9px] font-bold text-status-ok bg-status-ok/10 px-1.5 py-0.5 rounded-full border border-status-ok/20">
                     +{allCompanies.filter(c => new Date(c.created_at || "") >= startOfMonth).length} este mes
                   </span>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Empresas Activas</h4>
                <p className="text-2xl font-heading font-black text-text-1">{activeCompaniesCount}</p>
             </Link>

             {/* Users */}
             <Link href="/superadmin/usuarios" className="flex-1 min-w-[140px] bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-[#0288D1]/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-[#4FC3F7]/10 rounded-lg text-[#0288D1]">
                     <Users className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Usuarios Totales</h4>
                <p className="text-2xl font-heading font-black text-text-1">{totalUsers || 0}</p>
             </Link>

             {/* Conversión Trial -> Pago */}
             <div className="flex-1 min-w-[140px] bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-[#E040FB]/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-[#E040FB]/10 rounded-lg text-[#E040FB]">
                     <TrendingUp className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Conv. a Pago</h4>
                <p className={`text-2xl font-heading font-black ${conversionRate > 0 ? "text-[#10B981]" : "text-text-1"}`}>{conversionRate.toFixed(1)}%</p>
             </div>

             {/* Nuevos registros hoy */}
             <div className="flex-1 min-w-[140px] bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-[#00E5CC]/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-[#00E5CC]/10 rounded-lg text-[#00AF9C]">
                     <Building2 className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Registros Hoy</h4>
                <p className="text-2xl font-heading font-black text-text-1">{newToday}</p>
             </div>

             {/* Trial */}
             <Link href="/superadmin/clientes/empresas?filter=trial" className="flex-1 min-w-[140px] bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-status-warn/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-status-warn/10 rounded-lg text-status-warn">
                     <Clock className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Cuentas Trial</h4>
                <p className="text-2xl font-heading font-black text-text-1">{trialCompaniesCount}</p>
             </Link>

             {/* Demo */}
             <Link href="/superadmin/clientes/empresas?filter=demo" className="flex-1 min-w-[140px] bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-[#1E88E5]/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-[#1E88E5]/10 rounded-lg text-[#1E88E5]">
                     <Sparkles className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Cuentas Demo</h4>
                <p className="text-2xl font-heading font-black text-text-1">{demoCompaniesCount}</p>
             </Link>

             {/* Pagos Vencidos (ALERTA) */}
             <Link href="/superadmin/clientes/suscripciones?filter=vencidos" className="flex-1 min-w-[140px] bg-[#FFF5F7] border border-[#FFE4E8] rounded-2xl p-4 shadow-sm hover:bg-[#FFEBF0] transition-all group relative overflow-hidden cursor-pointer">
                <div className="flex justify-between items-start mb-2 relative z-10">
                   <div className="p-2 bg-[#D22B4A]/10 rounded-lg text-[#D22B4A] shadow-sm">
                     <AlertTriangle className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-[#D22B4A]/70 uppercase tracking-wider mb-1 relative z-10">Pagos Vencidos</h4>
                <p className="text-2xl font-heading font-black text-[#D22B4A] relative z-10">{overdueCompanies.length}</p>
             </Link>
          </div>

          {/* FILA 3: GRÁFICOS NUEVOS (MRR Y RETENCION) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* MRR en el Tiempo */}
             <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-text-1">MRR en el Tiempo</h2>
                    <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Crecimiento mensual (12m)</p>
                  </div>
                </div>
                <MrrLineChart data={mrrChart} />
             </div>

             {/* Retención de Clientes */}
             <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-text-1">Retención de Clientes</h2>
                    <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Renovaciones vs Cancelaciones (6m)</p>
                  </div>
                </div>
                <RetentionBarChart data={retentionChart} />
             </div>
          </div>

          {/* FILA 4: GRÁFICOS VIEJOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Crecimiento */}
             <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-text-1">
                      Crecimiento de Empresas
                    </h2>
                    <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                      Histórico de registros (8m)
                    </p>
                  </div>
                </div>
                <SaasLineChart data={growthChart} />
             </div>

             {/* Distribución por Plan */}
             <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-text-1">
                      Distribución Tarifaria
                    </h2>
                    <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                      Por tipo de plan activo
                    </p>
                  </div>
                </div>
                <div className="h-64 overflow-visible flex items-center justify-center">
                  <PlanDonutChart
                    data={[
                      { name: "Starter", value: planCounts.basic ?? 0, color: "#4FC3F7" },
                      { name: "Pro", value: planCounts.pro ?? 0, color: "#E040FB" },
                      { name: "Enterprise", value: planCounts.enterprise ?? 0, color: "#7C4DFF" },
                    ].filter(d => d.value > 0)}
                  />
                </div>
             </div>
          </div>

          {/* FILA 5: TOP EMPRESAS Y GEOGRAFÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Top Empresas */}
             <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-text-1">Top Empresas por Actividad</h2>
                    <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Más interacciones del mes</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topCompanies.length === 0 ? (
                      <p className="text-xs text-text-3 italic text-center py-4">No hay actividad suficiente</p>
                  ) : topCompanies.map((c, i) => (
                    <Link href={`/superadmin/clientes/empresas/${c.id}`} key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-base/50 hover:bg-surface-hover border border-transparent hover:border-border transition-all">
                       <div className="w-10 h-10 rounded-xl bg-surface-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                          {c.logo ? <img src={c.logo} alt={c.name} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-text-3" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-1 truncate">{c.name}</p>
                          <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">{c.plan}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-brand">{c.tx}</p>
                          <p className="text-[10px] font-medium text-text-3">Transacciones</p>
                       </div>
                    </Link>
                  ))}
                </div>
             </div>

             {/* Distribución Geográfica */}
             <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-text-1">Distribución Geográfica</h2>
                    <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Demografía del sistema</p>
                  </div>
                </div>
                <div className="space-y-3">
                   {[
                     { icon: "🇻🇪", country: "Venezuela", count: activeCompaniesCount },
                     { icon: "🇨🇴", country: "Colombia", count: Math.floor(activeCompaniesCount * 0.1) },
                     { icon: "🇲🇽", country: "México", count: Math.floor(activeCompaniesCount * 0.05) }
                   ].map((geo, i) => geo.count > 0 && (
                     <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface-base/50 border border-transparent">
                       <div className="flex items-center gap-4">
                         <span className="text-3xl">{geo.icon}</span>
                         <span className="text-sm font-bold text-text-1">{geo.country}</span>
                       </div>
                       <div className="text-right">
                         <span className="text-xl font-bold text-text-2">{geo.count}</span>
                         <span className="text-[10px] font-medium text-text-3 ml-1 uppercase">Empresas</span>
                       </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* COLUMNA LATERAL (1/3) - ACTION CENTER */}
        <div className="space-y-6">
           <ActionCenter initialActivities={activities} />
        </div>
      </div>
    </div>
  );
}

// Helper para construir gráfico de crecimiento mensual
function buildMonthlyGrowth(companies: any[]) {
  const months: Record<string, number> = {};
  const sorted = [...companies].sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime());
  
  sorted.forEach((c) => {
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

function buildMrrGrowth(companies: any[], prices: any) {
  const months: Record<string, number> = {};
  const sorted = [...companies].sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime());
  
  let currentMrr = 0;
  sorted.forEach((c) => {
    const key = new Date(c.created_at).toLocaleDateString("es-VE", {
      month: "short",
      year: "2-digit",
    });
    currentMrr += (prices[c.plan_type || 'basic'] || 0);
    months[key] = currentMrr;
  });
  
  return Object.entries(months)
    .slice(-12)
    .map(([month, count]) => ({ month, count: Number(count.toFixed(2)) }));
}

function buildRetention(payments: any[]) {
  const months: Record<string, { renovaciones: number; cancelaciones: number; month?: string }> = {};
  const sorted = [...payments].sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime());
  
  sorted.forEach((p) => {
    const key = new Date(p.created_at).toLocaleDateString("es-VE", {
      month: "short",
      year: "2-digit",
    });
    if (!months[key]) months[key] = { renovaciones: 0, cancelaciones: 0, month: key };
    if (p.status === 'approved') months[key].renovaciones++;
    else if (p.status === 'rejected' || p.status === 'expired') months[key].cancelaciones++;
  });
  
  return Object.values(months).slice(-6);
}
