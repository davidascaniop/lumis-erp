import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Sparkles,
  ArrowDownRight,
  Star,
  Gem,
  Percent,
  Zap,
  CalendarPlus,
  TrendingDown,
} from "lucide-react";
import { SaasLineChart } from "@/components/superadmin/saas-line-chart";
import { PlanDonutChart } from "@/components/superadmin/plan-donut-chart";
import { MRRLineChart } from "@/components/superadmin/mrr-line-chart";
import { RetentionBarChart } from "@/components/superadmin/retention-bar-chart";
import { TopCompaniesActivity } from "@/components/superadmin/top-companies-activity";
import { GeoDistribution } from "@/components/superadmin/geo-distribution";
import { ActionCenter } from "@/components/superadmin/action-center";
import { cn } from "@/lib/utils";
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
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("id, name, created_at, subscription_status, plan_type, logo_url"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("subscription_payments").select("*, companies(name)").order("created_at", { ascending: false }),
    supabase.from("orders").select("company_id, created_at").gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const allCompanies = allCompaniesData || [];
  const allPayments = allPaymentsData || [];
  const monthlyOrders = monthlyOrdersData || [];
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

  // PASO 1: Cálculos Financieros
  const PLAN_PRICES = { basic: 19.99, pro: 79.99, enterprise: 119.99 };
  
  // Churn Rate
  const cancelledThisMonth = allPayments.filter(p => 
    p.status === 'rejected' && new Date(p.created_at) >= startOfMonth
  ).length;
  const activeLastMonth = allCompanies.filter(c => 
    new Date(c.created_at || "") < startOfMonth && 
    (c.subscription_status === 'active' || c.subscription_status === 'suspended')
  ).length;
  const churnRate = activeLastMonth > 0 ? (cancelledThisMonth / activeLastMonth) * 100 : 0;

  // LTV Promedio
  const activeCompaniesList = allCompanies.filter(c => c.subscription_status === 'active');
  const totalMrr = activeCompaniesList.reduce((sum, c) => sum + ((PLAN_PRICES as any)[c.plan_type || 'basic'] || 0), 0);
  const avgPrice = activeCompaniesCount > 0 ? totalMrr / activeCompaniesCount : 0;
  
  const avgMonthsActive = activeCompaniesList.length > 0 
    ? activeCompaniesList.reduce((sum, c) => {
        const created = new Date(c.created_at || now);
        const months = Math.max(1, (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth()));
        return sum + months;
      }, 0) / activeCompaniesList.length
    : 0;
  const avgLTV = avgPrice * avgMonthsActive;

  // PASO 2: Cálculos Operativos
  // Conversión Trial a Pago
  const trialsThisMonth = allCompanies.filter(c => 
    new Date(c.created_at || "") >= startOfMonth && (c.subscription_status === 'trial' || c.subscription_status === 'active')
  ).length || allCompanies.filter(c => c.subscription_status === 'trial').length;
  
  const trialToPaidThisMonth = allPayments.filter(p => 
    p.status === 'approved' && 
    new Date(p.created_at) >= startOfMonth &&
    allCompanies.find(c => c.id === p.company_id)?.subscription_status === 'active'
  ).length;
  const trialConversion = trialsThisMonth > 0 ? (trialToPaidThisMonth / trialsThisMonth) * 100 : 0;
  
  // Nuevos Registros Hoy vs Ayer
  const newToday = allCompanies.filter(c => new Date(c.created_at || "") >= startOfToday).length;
  const newYesterday = allCompanies.filter(c => {
    const d = new Date(c.created_at || "");
    return d >= startOfYesterday && d < startOfToday;
  }).length;

  const arr = totalMrr * 12; // Update ARR since we calculated totalMrr correctly now

  // PASO 3 & 4: Históricos para Gráficas
  const mrrHistory = buildMRRHistory(allCompanies);
  const retentionHistory = buildRetentionHistory(allCompanies, allPayments);

  // PASO 5: Top 5 Empresas Actividad
  const topActiveCompanies = allCompanies
    .map(c => {
      const activityCount = monthlyOrders.filter(o => o.company_id === c.id).length;
      return { ...c, activityCount };
    })
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 5);

  // PASO 6: Distribución Geográfica
  // Asumimos mercado principal Venezuela si no hay campo de ubicación
  const geoData = [
    { location: "Venezuela", count: allCompanies.length, percentage: 100, flag: "🇻🇪" }
  ];

  const recentPayments = allPayments.slice(0, 5);
  const latestCompaniesSorted = [...allCompanies].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 5);
  const overdueCompanies = allCompanies.filter(c => c.subscription_status === 'suspended');

  // PASO 7: Centro de Acción (Mapeo de Actividades)
  const activities = [
    ...(allPayments.map(p => ({
      id: `pay-${p.id}`,
      type: p.status,
      category: p.status === 'pending' ? 'alert' : 'payment',
      date: new Date(p.created_at),
      message: p.status === 'pending' ? 'Pago pendiente de revisión' : (p.status === 'approved' ? 'Cuenta activada correctamente' : 'Pago rechazado o vencido'),
      company: p.companies?.name || 'Empresa Desconocida',
      icon: p.status === 'pending' ? "clock" : (p.status === 'approved' ? "check" : "alert"),
      color: p.status === 'pending' ? 'text-status-warn bg-status-warn/10' : (p.status === 'approved' ? 'text-status-ok bg-status-ok/10' : 'text-status-danger bg-status-danger/10'),
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
      color: 'text-brand bg-brand/10',
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
          
          {/* FILA 1: FINANZAS DESTACADAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MRR */}
            <Link href="/superadmin/clientes/suscripciones" className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-visible group hover:border-brand/30 transition-all cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-brand/10 border border-brand/20 relative group-hover:bg-brand/15 transition-colors">
                  <DollarSign className="w-5 h-5 text-brand" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2.5 py-1.5 rounded-lg border border-border shadow-sm group-hover:border-brand/20 transition-all whitespace-nowrap">
                    Ingresos Mensuales
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-3 mb-2 group-hover:text-text-2 transition-colors uppercase tracking-tight">Recurrentes (MRR)</h3>
                <div className="font-heading text-4xl font-black text-text-1 tracking-tight">
                  <span className="text-brand mr-1">$</span>{totalMrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Link>

            {/* ARR */}
            <Link href="/superadmin/clientes/suscripciones" className="bg-surface-card border border-border rounded-[32px] p-8 shadow-sm relative overflow-hidden group hover:border-[#00AF9C]/30 transition-all cursor-pointer min-h-[180px] flex flex-col justify-center">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5CC]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="p-3.5 rounded-2xl bg-[#00E5CC]/10 border border-[#00E5CC]/20 group-hover:bg-[#00E5CC]/15 transition-colors">
                  <TrendingUp className="w-6 h-6 text-[#00AF9C]" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2.5 py-1.5 rounded-lg border border-border shadow-sm group-hover:border-[#00AF9C]/20 transition-all whitespace-nowrap">
                    Ingresos Anuales
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-3 mb-2 group-hover:text-text-2 transition-colors uppercase tracking-tight">Proyectado (ARR)</h3>
                <div className="font-heading text-4xl font-black text-text-1 tracking-tight">
                  <span className="text-[#00AF9C] mr-1">$</span>{arr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Link>

            {/* Churn Rate */}
            <div className="bg-surface-card border border-border rounded-[32px] p-8 shadow-sm relative overflow-hidden group hover:border-status-danger/30 transition-all min-h-[180px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="p-3.5 rounded-2xl bg-status-danger/10 border border-status-danger/20">
                  <ArrowDownRight className="w-6 h-6 text-status-danger" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2.5 py-1.5 rounded-lg border border-border shadow-sm whitespace-nowrap">
                    Tasa de Cancelación
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-3 mb-2 uppercase tracking-tight">Pérdida de Clientes</h3>
                <div className={cn(
                  "font-heading text-4xl font-black tracking-tight",
                  churnRate === 0 ? "text-status-ok" : "text-status-danger"
                )}>
                  {churnRate.toFixed(1)}<span className="text-xl ml-0.5">%</span>
                </div>
              </div>
            </div>

            {/* LTV Promedio */}
            <div className="bg-surface-card border border-border rounded-[32px] p-8 shadow-sm relative overflow-hidden group hover:border-status-warn/30 transition-all min-h-[180px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-status-warn/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="p-3.5 rounded-2xl bg-status-warn/10 border border-status-warn/20">
                  <Gem className="w-6 h-6 text-status-warn" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2.5 py-1.5 rounded-lg border border-border shadow-sm whitespace-nowrap">
                    Valor de Vida del Cliente
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-3 mb-2 uppercase tracking-tight">Promedio (LTV)</h3>
                <div className="font-heading text-4xl font-black text-text-1 tracking-tight">
                  <span className="text-status-warn mr-1">$</span>{avgLTV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-10" />

          {/* FILA 2: OPERACIONES */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
             {/* Empresas Activas */}
             <Link href="/superadmin/clientes/empresas" className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm hover:border-brand/30 transition-all group cursor-pointer flex flex-col items-center text-center">
                <div className="p-3 bg-brand/10 rounded-xl text-brand mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 group-hover:text-text-2">Empresas Activas</h4>
                <p className="text-3xl font-heading font-black text-text-1">{activeCompaniesCount}</p>
             </Link>

             {/* Usuarios Totales */}
             <Link href="/superadmin/usuarios" className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm hover:border-status-info/30 transition-all group cursor-pointer flex flex-col items-center text-center">
                <div className="p-3 bg-status-info/10 rounded-xl text-status-info mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 group-hover:text-text-2">Usuarios Totales</h4>
                <p className="text-3xl font-heading font-black text-text-1">{totalUsers || 0}</p>
             </Link>

             {/* En Trial */}
             <Link href="/superadmin/clientes/empresas?filter=trial" className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm hover:border-status-warn/30 transition-all group cursor-pointer flex flex-col items-center text-center">
                <div className="p-3 bg-status-warn/10 rounded-xl text-status-warn mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 group-hover:text-text-2">En Trial</h4>
                <p className="text-3xl font-heading font-black text-text-1">{trialCompaniesCount}</p>
             </Link>

             {/* Conversión */}
             <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm hover:border-brand/30 transition-all group flex flex-col items-center text-center">
                <div className="p-3 bg-brand/10 rounded-xl text-brand mb-4 group-hover:scale-110 transition-transform">
                  <Percent className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 group-hover:text-text-2">Conversión</h4>
                <p className="text-3xl font-heading font-black text-text-1 whitespace-nowrap">
                  {trialConversion.toFixed(0)}%
                </p>
             </div>

             {/* Hoy */}
             <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm hover:border-status-success/30 transition-all group flex flex-col items-center text-center">
                <div className="p-3 bg-status-success/10 rounded-xl text-status-success mb-4 group-hover:scale-110 transition-transform">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 group-hover:text-text-2">Hoy</h4>
                <p className="text-3xl font-heading font-black text-text-1">{newToday}</p>
                <p className="text-[11px] font-bold text-status-success/70 mt-1">Ayer: {newYesterday}</p>
             </div>

             {/* Demo */}
             <Link href="/superadmin/clientes/empresas?filter=demo" className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm hover:border-status-info/30 transition-all group cursor-pointer flex flex-col items-center text-center">
                <div className="p-3 bg-status-info/10 rounded-xl text-status-info mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 group-hover:text-text-2">Demo</h4>
                <p className="text-3xl font-heading font-black text-text-1">{demoCompaniesCount}</p>
             </Link>

             {/* Vencidos */}
             <Link href="/superadmin/clientes/suscripciones?filter=vencidos" className="bg-surface-card border border-status-danger/20 rounded-2xl p-6 shadow-sm hover:border-status-danger transition-all group relative overflow-hidden cursor-pointer flex flex-col items-center text-center">
                <div className="p-3 bg-status-danger/10 rounded-xl text-status-danger mb-4 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-2 group-hover:text-text-2">Vencidos</h4>
                <p className="text-3xl font-heading font-black text-status-danger">{overdueCompanies.length}</p>
             </Link>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-10" />

          {/* FILA 3: GRÁFICOS MRR Y RETENCIÓN (PASO 3 & 4) */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
            {/* MRR en el Tiempo */}
            <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-heading font-bold text-text-1">
                    MRR en el Tiempo
                  </h2>
                  <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                    Histórico de ingresos de los últimos 12 meses
                  </p>
                </div>
              </div>
              <MRRLineChart data={mrrHistory} />
            </div>

            {/* Retención de Clientes */}
            <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-heading font-bold text-text-1 mb-1">Retención</h2>
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-6">Renovaciones vs Bajas (6m)</p>
              <div className="flex-1 flex flex-col justify-center">
                 <RetentionBarChart data={retentionHistory} />
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-10" />

          {/* FILA 4: ACTIVIDAD Y CRECIMIENTO (PASO 5 & 6 + EXISTENTES) */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
             {/* Actividad e Historia */}
             <div className="space-y-4">
                {/* Top Empresas */}
                <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-heading font-bold text-text-1">
                        Top Empresas por Actividad
                      </h2>
                      <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                        Las más activas este mes
                      </p>
                    </div>
                  </div>
                  <TopCompaniesActivity companies={topActiveCompanies} />
                </div>

                {/* Crecimiento (Movido) */}
                <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-heading font-bold text-text-1">
                        Crecimiento de Empresas
                      </h2>
                      <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                        Histórico de registros
                      </p>
                    </div>
                  </div>
                  <SaasLineChart data={growthChart} />
                </div>
             </div>

             <div className="space-y-4">
                {/* Distribución Geográfica */}
                <div className="bg-surface-card border border-border rounded-3xl p-5 shadow-sm">
                  <h2 className="text-lg font-heading font-bold text-text-1 mb-1">Geografía</h2>
                  <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-5">Origen de tus clientes</p>
                  <GeoDistribution data={geoData} />
                </div>

                {/* Donuts (Movido) */}
                <div className="bg-surface-card border border-border rounded-3xl p-5 shadow-sm">
                  <h2 className="text-lg font-heading font-bold text-text-1 mb-1">Distribución Tarifaria</h2>
                  <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-5">Por Plan</p>
                  <div className="min-h-[200px] overflow-visible flex items-center justify-center">
                    {Object.values(planCounts).every(v => v === 0) ? (
                      <div className="w-full space-y-3">
                        {[
                          { name: "Starter", value: planCounts.basic ?? 0, color: "bg-[#4FC3F7]" },
                          { name: "Pro", value: planCounts.pro ?? 0, color: "bg-[#E040FB]" },
                          { name: "Enterprise", value: planCounts.enterprise ?? 0, color: "bg-[#7C4DFF]" },
                        ].map(plan => {
                          const total = Object.values(planCounts).reduce((a: any, b: any) => a + b, 0) || 1;
                          const perc = (Number(plan.value) / Number(total)) * 100;
                          return (
                            <div key={plan.name} className="flex items-center justify-between p-3 bg-surface-base rounded-xl border border-border/50">
                               <div className="flex items-center gap-3">
                                 <div className={cn("w-3 h-3 rounded-full", plan.color)} />
                                 <span className="text-sm font-bold text-text-1">{plan.name}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                 <span className="text-xs font-black text-text-2">{plan.value} empresas</span>
                                 <span className="text-xs font-bold text-brand">{perc.toFixed(0)}%</span>
                               </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <PlanDonutChart
                        data={[
                          { name: "Starter", value: planCounts.basic ?? 0, color: "#4FC3F7" },
                          { name: "Pro", value: planCounts.pro ?? 0, color: "#E040FB" },
                          { name: "Enterprise", value: planCounts.enterprise ?? 0, color: "#7C4DFF" },
                        ].filter(d => d.value > 0)}
                      />
                    )}
                  </div>
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

function buildMRRHistory(companies: any[]) {
  const history = [];
  const now = new Date();
  const PLAN_PRICES = { basic: 19.99, pro: 79.99, enterprise: 119.99 };
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleDateString('es-VE', { month: 'short' });
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const value = companies.reduce((sum, c) => {
      const created = new Date(c.created_at || now);
      if (created <= monthEnd && (c.subscription_status === 'active' || c.subscription_status === 'suspended')) {
         return sum + ((PLAN_PRICES as any)[c.plan_type || 'basic'] || 0);
      }
      return sum;
    }, 0);
    
    history.push({ month: monthName, value });
  }
  return history;
}

function buildRetentionHistory(companies: any[], payments: any[]) {
  const history = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleDateString('es-VE', { month: 'short' });
    
    const renewed = companies.filter(c => 
      c.subscription_status === 'active' && 
      new Date(c.created_at || "") < d
    ).length;
    
    const cancelled = payments.filter(p => 
      p.status === 'rejected' && 
      new Date(p.created_at).getMonth() === d.getMonth() &&
      new Date(p.created_at).getFullYear() === d.getFullYear()
    ).length;
    
    history.push({ month: monthName, renewed, cancelled });
  }
  return history;
}
