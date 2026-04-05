import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Target, CalendarDays, LineChart } from "lucide-react";
import { SaasLineChart } from "@/components/superadmin/saas-line-chart";
import { IncomeBarChart } from "@/components/superadmin/income-bar-chart";
import { HorizontalBarChart } from "@/components/superadmin/horizontal-bar-chart"; // Can be reused for day of week

export default async function CrecimientoReporte() {
  const supabase = await createClient();

  const [{ data: allCompaniesRaw }] = await Promise.all([
    supabase.from("companies").select("id, name, created_at, subscription_status, plan_type"),
  ]);

  const allCompanies = allCompaniesRaw || [];
  
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  // Growth MoM and YoY
  const activeNow = allCompanies.filter(c => c.subscription_status === 'active').length;
  const activeLastMonth = allCompanies.filter(c => c.subscription_status === 'active' && new Date(c.created_at) < currentMonthStart).length;
  const activeLastYear = allCompanies.filter(c => c.subscription_status === 'active' && new Date(c.created_at) < lastYearStart).length;

  const momGrowth = activeLastMonth ? ((activeNow - activeLastMonth) / activeLastMonth) * 100 : 0;
  const yoyGrowth = activeLastYear ? ((activeNow - activeLastYear) / activeLastYear) * 100 : 0;

  // Proyección MRR
  const PLAN_PRICES = { basic: 19.99, pro: 79.99, enterprise: 119.99 };
  const currentMrr = allCompanies.filter(c => c.subscription_status === 'active').reduce((sum, c) => sum + ((PLAN_PRICES as any)[c.plan_type || 'basic'] || 0), 0);
  const projectedMrr = currentMrr * Math.pow(1 + (Math.max(0, momGrowth) / 100), 3); // Compounding MoM growth for 3 months

  // Gráfica 1: Histórico acumulado
  const buildCumulativeGrowth = () => {
    const months: Record<string, number> = {};
    const sorted = [...allCompanies].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let sum = 0;
    sorted.forEach((c) => {
      const key = new Date(c.created_at).toLocaleDateString("es-VE", {
        month: "short",
        year: "2-digit",
      });
      sum++;
      months[key] = sum;
    });
    return Object.entries(months)
      .slice(-12)
      .map(([month, count]) => ({ month, count }));
  };
  const cumulativeGrowth = buildCumulativeGrowth();

  // Gráfica 2: Conversion Trial -> Pago (using IncomeBarChart styled for simplicity)
  const buildConversion = () => {
    // We mock the trial vs pago conversion over time using allCompanies
    const months: Record<string, { month: string; cobrados: number; proyectados: number }> = {};
    const sorted = [...allCompanies].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sorted.forEach((c) => {
      const key = new Date(c.created_at).toLocaleDateString("es-VE", {
        month: "short",
        year: "2-digit",
      });
      if (!months[key]) months[key] = { month: key, cobrados: 0, proyectados: 0 };
      months[key].proyectados++; // Total trials
      if (['active', 'suspended', 'canceled'].includes(c.subscription_status || '')) {
         months[key].cobrados++; // Conversions
      }
    });
    
    return Object.values(months).slice(-6).map(m => ({
      month: m.month,
      cobrados: m.cobrados,       // Mapped to "Conversiones" inside chart if we had dynamic labels, but it renders green
      proyectados: m.proyectados - m.cobrados // Leftover trials
    }));
  };
  const conversionChart = buildConversion();

  // Gráfica 3: Registros por día
  const buildDayOfWeek = () => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const counts = [0,0,0,0,0,0,0];
    allCompanies.forEach(c => {
       counts[new Date(c.created_at).getDay()]++;
    });
    return days.map((name, i) => ({ name, meses: counts[i] })); // 'meses' because HorizontalBarChart expects it under 'meses' property
  };
  const daysChart = buildDayOfWeek();

  // Tabla Cohortes
  const buildCohorts = () => {
    const cohorts: Record<string, { total: number; active: number }> = {};
    allCompanies.forEach(c => {
      const key = new Date(c.created_at).toLocaleDateString("es-VE", { month: "long", year: "numeric" });
      if (!cohorts[key]) cohorts[key] = { total: 0, active: 0 };
      cohorts[key].total++;
      if (c.subscription_status === 'active') cohorts[key].active++;
    });
    return Object.entries(cohorts).map(([month, data]) => ({
      month,
      total: data.total,
      active: data.active,
      perc: data.total ? ((data.active / data.total) * 100).toFixed(1) : "0.0"
    })).slice(-6); // Last 6 months
  };
  const cohorts = buildCohorts();

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Reporte de Crecimiento</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Análisis de adquisición y tendencias de expansión</p>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MoM */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Crecimiento MoM</h3>
          <div className={`font-heading text-3xl font-black tracking-tight relative z-10 ${momGrowth >= 0 ? "text-status-ok" : "text-status-danger"}`}>
            {momGrowth >= 0 ? "+" : ""}{momGrowth.toFixed(1)}%
          </div>
        </div>

        {/* YoY */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0288D1]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-[#4FC3F7]/10 border border-[#4FC3F7]/20 rounded-2xl text-[#0288D1]">
              <LineChart className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Crecimiento YoY</h3>
          <div className={`font-heading text-3xl font-black tracking-tight relative z-10 ${yoyGrowth >= 0 ? "text-status-ok" : "text-status-danger"}`}>
            {yoyGrowth >= 0 ? "+" : ""}{yoyGrowth.toFixed(1)}%
          </div>
        </div>

        {/* Proyección */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5CC]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-[#00E5CC]/10 border border-[#00E5CC]/20 rounded-2xl text-[#00AF9C]">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Proyección MRR (3 meses)</h3>
          <div className="font-heading text-3xl font-black text-text-1 tracking-tight relative z-10">${projectedMrr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfica 1: Crecimiento acumulado */}
        <div className="md:col-span-2 bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Crecimiento Histórico</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Volumen acumulado de empresas registradas</p>
          </div>
          <div className="flex-1">
             <SaasLineChart data={cumulativeGrowth} />
          </div>
        </div>

        {/* Gráfica 2: Conversion Trial */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Conversión de Embudo</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Trials (Azul) vs Cuentas Pagas (Verde)</p>
          </div>
          <div className="flex-1">
             <IncomeBarChart data={conversionChart} />
          </div>
        </div>

        {/* Gráfica 3: Días de semana */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Actividad por Día</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Volumen de registros semanales</p>
          </div>
          <div className="flex-1">
             <HorizontalBarChart data={daysChart} />
          </div>
        </div>
      </div>

      {/* TABLA DE COHORTES */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-text-1 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-brand" /> Análisis de Cohortes</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Retención por mes de registro (Últimos 6m)</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-base/50">
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Cohorte (Mes de Registro)</th>
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Total Registrados</th>
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Activos Actualmente</th>
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Retención del Cohorte</th>
              </tr>
            </thead>
            <tbody>
              {[...cohorts].reverse().map((c, i) => (
                <tr key={i} className="border-b border-border hover:bg-surface-hover/20 transition-colors">
                  <td className="p-3 text-sm font-bold text-text-1 capitalize">{c.month}</td>
                  <td className="p-3 text-sm font-medium text-text-2">{c.total}</td>
                  <td className="p-3 text-sm font-medium text-status-ok">{c.active}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                       <div className="w-full max-w-[200px] h-2 bg-surface-hover rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${c.perc}%` }} />
                       </div>
                       <span className="text-xs font-bold text-text-1">{c.perc}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {cohorts.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-sm text-text-3">No hay datos suficientes para cohortes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
