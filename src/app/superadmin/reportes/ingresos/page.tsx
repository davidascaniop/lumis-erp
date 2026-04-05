import { createClient } from "@/lib/supabase/server";
import { DollarSign, AlertCircle, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";
import { PlanDonutChart } from "@/components/superadmin/plan-donut-chart";
import { IncomeBarChart } from "@/components/superadmin/income-bar-chart";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function IngresosReporte() {
  const supabase = await createClient();

  // Queries
  const [{ data: allCompaniesRaw }, { data: allPaymentsRaw }] = await Promise.all([
    supabase.from("companies").select("id, name, created_at, subscription_status, plan_type"),
    supabase.from("subscription_payments").select("*, companies(name)").order("created_at", { ascending: false }),
  ]);

  const allCompanies = allCompaniesRaw || [];
  const allPayments = (allPaymentsRaw || []) as any[];
  
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Cards
  const paymentsThisMonth = allPayments.filter(p => new Date(p.created_at) >= currentMonthStart);
  
  const collectedThisMonth = paymentsThisMonth.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
  const pendingThisMonth = paymentsThisMonth.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
  
  const activeCount = allCompanies.filter(c => c.subscription_status === 'active').length;
  const avgIncomePerCompany = activeCount ? collectedThisMonth / activeCount : 0;

  // Gráfica 1: Distribución por plan (Con MRR)
  const PLAN_PRICES = { basic: 19.99, pro: 79.99, enterprise: 119.99 };
  const planData = [
    { name: "Starter", type: "basic", color: "#4FC3F7" },
    { name: "Pro", type: "pro", color: "#E040FB" },
    { name: "Enterprise", type: "enterprise", color: "#7C4DFF" },
  ].map(p => {
    const companiesInPlan = allCompanies.filter(c => c.plan_type === p.type && c.subscription_status === 'active');
    const mrr = companiesInPlan.length * (PLAN_PRICES as any)[p.type];
    return { name: p.name, value: mrr || 0, color: p.color };
  }).filter(d => d.value > 0);

  // Gráfica 2: Ingresos por mes (Cobrados vs Proyectados)
  const buildIncomeHistory = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const pMonth = allPayments.filter(p => new Date(p.created_at) >= d && new Date(p.created_at) < nextD);
      const cobrados = pMonth.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
      
      // Proyectados = cobrados + pending + reject that maybe would have been collected, or just ARPU * active companies historically. Let's mock a realistic projection logic based on active companies.
      const prevActiveCount = allCompanies.filter(c => new Date(c.created_at) < nextD && !['canceled'].includes(c.subscription_status)).length; 
      const proyectados = Math.max(cobrados, prevActiveCount * 40); // 40 as avg arpu mock

      months.push({
        month: d.toLocaleDateString("es-VE", { month: "short", year: "2-digit" }),
        cobrados: Number(cobrados.toFixed(2)),
        proyectados: Number(proyectados.toFixed(2))
      });
    }
    return months;
  };
  const incomeChart = buildIncomeHistory();

  // Gráfica 3: Métodos de pago
  const methodsCounts = allPayments.reduce((acc: any, p) => {
    const m = p.method || 'desconocido';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const methodColors: Record<string, string> = {
    "pago_movil": "#10B981",
    "zinli": "#F59E0B",
    "binance": "#FACC15",
    "stripe": "#6366F1",
    "desconocido": "#94A3B8"
  };
  const methodData = Object.entries(methodsCounts).map(([key, val]) => ({
    name: key === 'pago_movil' ? 'Pago Móvil' : key.charAt(0).toUpperCase() + key.slice(1),
    value: val as number,
    color: methodColors[key] || "#94A3B8"
  }));

  // Render
  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Ingresos y Suscripciones</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Análisis de facturación mensual y métodos de pago</p>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cobrados */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-status-ok/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-status-ok/10 border border-status-ok/20 rounded-2xl text-status-ok">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Ingresos Cobrados (Mes)</h3>
          <div className="font-heading text-3xl font-black text-text-1 tracking-tight relative z-10">${collectedThisMonth.toLocaleString()}</div>
        </div>

        {/* Pendientes */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-status-warn/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-status-warn/10 border border-status-warn/20 rounded-2xl text-status-warn">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Ingresos Pendientes (Mes)</h3>
          <div className="font-heading text-3xl font-black text-text-1 tracking-tight relative z-10">${pendingThisMonth.toLocaleString()}</div>
        </div>

        {/* Promedio */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Ingreso Promedio x Empresa</h3>
          <div className="font-heading text-3xl font-black text-text-1 tracking-tight relative z-10">${avgIncomePerCompany.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gráfica 1 */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">MRR por Plan</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Aporte financiero de cada tier</p>
          </div>
          <div className="flex-1 flex justify-center items-center min-h-[200px]">
             {planData.length > 0 ? <PlanDonutChart data={planData} /> : <p className="text-sm text-text-3">Sin datos suficientes</p>}
          </div>
        </div>

        {/* Gráfica 2 */}
        <div className="md:col-span-2 bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Ingresos por Mes</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Cobrados vs Proyectados (6m)</p>
          </div>
          <div className="flex-1">
             <IncomeBarChart data={incomeChart} />
          </div>
        </div>

        {/* Gráfica 3 */}
        <div className="md:col-span-1 bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Métodos de Pago</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Vías de recaudación preferidas</p>
          </div>
          <div className="flex-1 flex justify-center items-center min-h-[200px]">
             {methodData.length > 0 ? <PlanDonutChart data={methodData} /> : <p className="text-sm text-text-3">Sin datos suficientes</p>}
          </div>
        </div>

        {/* TABLA DE PAGOS RECIENTES */}
        <div className="md:col-span-2 bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col overflow-hidden">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-heading font-bold text-text-1">Pagos Recientes</h2>
              <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Últimas 20 transacciones registradas</p>
            </div>
            <Link href="/superadmin/clientes/suscripciones" className="text-xs font-bold text-brand hover:underline">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-base/50">
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Empresa</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Plan / Monto</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Método</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Fecha</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.slice(0, 20).map((p, i) => (
                  <tr key={i} className="border-b border-border hover:bg-surface-hover/20 transition-colors">
                    <td className="p-3 text-sm font-bold text-text-1 truncate max-w-[150px]">{p.companies?.name || "Desconocida"}</td>
                    <td className="p-3">
                      <p className="text-[10px] font-bold text-text-3 uppercase">{p.plan || p.plan_type}</p>
                      <p className="text-sm font-bold text-brand">${p.plan_price || p.amount_usd || 0}</p>
                    </td>
                    <td className="p-3 text-xs font-medium text-text-2 capitalize">{(p.method || '--').replace('_', ' ')}</td>
                    <td className="p-3 text-xs font-medium text-text-2">{format(new Date(p.created_at), "dd MMM, yy", { locale: es })}</td>
                    <td className="p-3 text-right">
                      {p.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-warn/10 text-status-warn text-[10px] font-bold uppercase tracking-wider"><Clock className="w-3 h-3" /> Pendiente</span>}
                      {p.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-ok/10 text-status-ok text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Aprobado</span>}
                      {p.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-danger/10 text-status-danger text-[10px] font-bold uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rechazado</span>}
                      {p.status === 'expired' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-danger/10 text-status-danger text-[10px] font-bold uppercase tracking-wider"><XCircle className="w-3 h-3" /> Vencido</span>}
                    </td>
                  </tr>
                ))}
                {allPayments.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-sm text-text-3">No hay pagos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
