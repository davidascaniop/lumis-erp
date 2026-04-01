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
} from "lucide-react";
import { SaasLineChart } from "@/components/superadmin/saas-line-chart";
import { PlanDonutChart } from "@/components/superadmin/plan-donut-chart";
import { RecentCompanies } from "@/components/superadmin/recent-companies";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function SuperAdminHome() {
  const supabase = await createClient();

  // ─── QUERIES PARALELAS ─────────────────────────────────────
  const [
    { count: totalCompanies },
    { count: activeCompanies },
    { count: suspendedCompanies },
    { count: trialCompanies },
    { count: demoCompanies },
    { count: totalUsers },
    { data: planDistribution },
    { data: newCompaniesThisMonth },
    { data: mrrData },
    { data: overdueCompanies },
    { data: monthlyGrowth },
    { data: recentPayments },
    { data: latestCompanies },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("subscription_status", "active"), // Changed from plan_status
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("subscription_status", "suspended"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("subscription_status", "trial"), // Or 'pending_verification'
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("subscription_status", "demo"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("plan_type").in("subscription_status", ["active", "trial", "pending_verification"]),
    supabase.from("companies").select("id").gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from("subscription_payments").select("method").eq("status", "approved"),
    supabase.from("companies").select("id, name, subscription_status").eq("subscription_status", "suspended"), // Assuming suspended means overdue
    supabase.from("companies").select("created_at").order("created_at", { ascending: true }),
    supabase.from("subscription_payments").select("*, companies(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("companies").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  // Construir feed de actividades
  const activities: any[] = [];
  
  if (recentPayments) {
    recentPayments.forEach((p) => {
      activities.push({
        id: `pay-${p.id}`,
        type: p.status === 'pending' ? 'payment_uploaded' : (p.status === 'approved' ? 'payment_approved' : 'payment_rejected'),
        company: p.companies?.name || 'Empresa Desconocida',
        date: new Date(p.created_at),
        message: p.status === 'pending' ? 'subió comprobante de pago' : (p.status === 'approved' ? 'pago aprobado' : 'pago rechazado'),
        icon: p.status === 'pending' ? FileText : (p.status === 'approved' ? CheckCircle2 : XCircle),
        color: p.status === 'pending' ? 'text-status-warn bg-status-warn/10' : (p.status === 'approved' ? 'text-status-ok bg-status-ok/10' : 'text-status-danger bg-status-danger/10')
      });
    });
  }

  if (latestCompanies) {
    latestCompanies.forEach((c) => {
      activities.push({
        id: `comp-${c.id}`,
        type: 'new_registration',
        company: c.name,
        date: new Date(c.created_at),
        message: 'Nuevo registro en plataforma',
        icon: Building2,
        color: 'text-brand bg-brand/10'
      });
    });
  }

  // Sort activities by date descending and take top 6
  const sortedActivities = activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  // Calcular MRR - Usando plan_type en lugar de plan
  const PLAN_PRICES = { basic: 19.99, pro: 79.99, enterprise: 119.99 };
  const mrr = (planDistribution ?? []).reduce((sum, c) => {
    return sum + ((PLAN_PRICES as any)[c.plan_type as keyof typeof PLAN_PRICES] ?? 0);
  }, 0);
  const arr = mrr * 12;

  // Calcular distribución por plan
  const planCounts = (planDistribution ?? []).reduce((acc: any, c) => {
    const key = c.plan_type || 'basic';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  // Calcular crecimiento mensual de empresas (últimos 8 meses)
  const growthChart = buildMonthlyGrowth(monthlyGrowth ?? []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* MRR */}
            <Link href="/superadmin/clientes/suscripciones" className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-visible group hover:border-brand/30 transition-all cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-brand/10 border border-brand/20 relative group-hover:bg-brand/15 transition-colors">
                  <DollarSign className="w-5 h-5 text-brand" />
                  {/* Tooltip */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1125] text-white text-[10px] font-medium rounded-md px-2.5 py-1.5 shadow-xl -top-10 -left-4 pointer-events-none z-30 whitespace-nowrap">
                    Suma de todas las suscripciones activas este mes
                    <div className="absolute bottom-[-4px] left-6 w-2 h-2 bg-[#1A1125] rotate-45 transform"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest bg-surface-base px-2 py-1 rounded-md border border-border shadow-sm group-hover:border-brand/20 transition-colors">
                    MRR Actual
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-text-2 mb-1 group-hover:text-text-1 transition-colors">Ingresos Recurrentes Mensuales</h3>
                <div className="font-heading text-4xl font-black text-text-1 tracking-tight">
                  ${mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <div className="font-heading text-4xl font-black text-text-1 tracking-tight">
                  ${arr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Link>
          </div>

          {/* FILA 2: OPERACIONES (Compactas) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             {/* Empresas Activas */}
             <Link href="/superadmin/clientes/empresas" className="bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-brand/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-brand/10 rounded-lg text-brand">
                     <Building2 className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-bold text-status-ok bg-status-ok/10 px-1.5 py-0.5 rounded border border-status-ok/20">
                     +{newCompaniesThisMonth?.length ?? 0} este mes
                   </span>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Empresas Activas</h4>
                <p className="text-2xl font-heading font-black text-text-1">{activeCompanies || 0}</p>
             </Link>

             {/* Usuarios */}
             <Link href="/superadmin/usuarios" className="bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-[#0288D1]/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-[#4FC3F7]/10 rounded-lg text-[#0288D1]">
                     <Users className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Usuarios Totales</h4>
                <p className="text-2xl font-heading font-black text-text-1">{totalUsers || 0}</p>
             </Link>

             {/* Trial */}
             <Link href="/superadmin/clientes/empresas?filter=trial" className="bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-status-warn/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-status-warn/10 rounded-lg text-status-warn">
                     <Clock className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Cuentas Trial</h4>
                <p className="text-2xl font-heading font-black text-text-1">{trialCompanies || 0}</p>
             </Link>

             {/* Demo */}
             <Link href="/superadmin/clientes/empresas?filter=demo" className="bg-surface-card border border-border rounded-2xl p-4 shadow-sm hover:border-[#1E88E5]/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-[#1E88E5]/10 rounded-lg text-[#1E88E5]">
                     <Sparkles className="w-4 h-4" />
                   </div>
                </div>
                <h4 className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1 group-hover:text-text-2 transition-colors">Cuentas Demo</h4>
                <p className="text-2xl font-heading font-black text-text-1">{demoCompanies || 0}</p>
             </Link>

             {/* Pagos Vencidos */}
             <Link href="/superadmin/clientes/suscripciones?filter=vencidos" className="bg-[#FFF0F2] border border-[#FFCCD5] rounded-2xl p-4 shadow-sm hover:border-status-danger transition-all group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-status-danger/5 group-hover:bg-status-danger/10 transition-colors" />
                <div className="flex justify-between items-start mb-2 relative z-10">
                   <div className="p-2 bg-status-danger/20 rounded-lg text-status-danger shadow-sm">
                     <AlertTriangle className="w-4 h-4" />
                   </div>
                   {(overdueCompanies?.length ?? 0) > 0 && (
                     <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-danger opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-status-danger"></span>
                     </span>
                   )}
                </div>
                <h4 className="text-[11px] font-bold text-status-danger uppercase tracking-wider mb-1 relative z-10">Pagos Vencidos</h4>
                <p className="text-2xl font-heading font-black text-status-danger relative z-10">{overdueCompanies?.length ?? 0}</p>
             </Link>
          </div>

          {/* FILA 3: GRÁFICOS */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
            {/* Crecimiento */}
            <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-heading font-bold text-text-1">
                    Crecimiento de Empresas
                  </h2>
                  <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                    Histórico de registros mensuales
                  </p>
                </div>
              </div>
              {totalCompanies === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center bg-surface-base rounded-2xl border border-dashed border-border px-4 py-8">
                  <Activity className="w-8 h-8 text-text-3/50 mb-3" />
                  <p className="text-sm font-medium text-text-2">Sin datos suficientes</p>
                  <p className="text-xs text-text-3 mt-1">Aún no hay empresas registradas en la plataforma</p>
                </div>
              ) : (
                <SaasLineChart data={growthChart} />
              )}
            </div>

            {/* Donuts */}
            <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-heading font-bold text-text-1 mb-1">Distribución Tarifaria</h2>
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-6">Empresas por Plan</p>
              
              <div className="flex-1 flex flex-col justify-center">
                {totalCompanies === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center bg-surface-base rounded-2xl border border-dashed border-border px-4 py-6">
                    <p className="text-xs font-medium text-text-3">Sin datos suficientes</p>
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

        {/* COLUMNA LATERAL (1/3) - ACTION CENTER */}
        <div className="space-y-6">
          <div className="bg-surface-card border border-border rounded-3xl p-5 shadow-sm h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-heading font-bold text-text-1 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand" />
                    Centro de Acción
                  </h2>
                  <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                    Actividad y Pendientes
                  </p>
                </div>
             </div>

             <div className="flex-1 space-y-4">
                {sortedActivities.length === 0 ? (
                  <div className="text-center py-10 bg-surface-base rounded-2xl border border-dashed border-border">
                    <p className="text-sm font-medium text-text-3">No hay actividad reciente.</p>
                  </div>
                ) : (
                  sortedActivities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div key={act.id} className="group relative pl-4 border-l-2 border-border/50 hover:border-brand transition-colors pb-4 last:pb-0">
                         <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${act.color}`}>
                           <Icon className="w-2.5 h-2.5" />
                         </div>
                         <div className="-mt-1">
                           <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">
                              {formatDistanceToNow(act.date, { addSuffix: true, locale: es })}
                           </p>
                           <p className="text-sm font-bold text-text-1 mt-0.5">
                              {act.message}
                           </p>
                           <p className="text-xs font-medium text-text-2 mt-0.5">
                              {act.type === 'new_registration' ? (
                                <Link 
                                  href={`/superadmin/clientes/empresas?search=${encodeURIComponent(act.company)}`}
                                  className="font-semibold text-brand hover:underline transition-all"
                                >
                                  {act.company}
                                </Link>
                              ) : (
                                <span className="font-semibold text-brand">{act.company}</span>
                              )}
                           </p>
                         </div>
                         
                         {act.type === 'payment_uploaded' && (
                           <Link href="/superadmin/clientes/suscripciones" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 hover:bg-brand/20 px-2 py-1 rounded-md transition-colors">
                             Validar Pago →
                           </Link>
                         )}
                      </div>
                    )
                  })
                )}
             </div>

             <div className="mt-6 pt-5 border-t border-border">
                <Link href="/superadmin/clientes/empresas" className="w-full flex items-center justify-center gap-2 py-2.5 font-bold text-xs uppercase tracking-wider text-text-2 bg-surface-base hover:bg-surface-hover hover:text-text-1 rounded-xl border border-border transition-colors">
                  Ver todas las empresas
                </Link>
             </div>
          </div>
        </div>
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
