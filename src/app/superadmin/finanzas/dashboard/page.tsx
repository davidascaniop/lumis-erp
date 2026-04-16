import { createSuperadminServerClient } from "@/lib/supabase/superadmin-server";
import { DollarSign, TrendingUp, TrendingDown, Target, Wallet } from "lucide-react";
import { FinanzaComposedChart } from "@/components/superadmin/finanza-composed-chart";
import { PlanDonutChart } from "@/components/superadmin/plan-donut-chart";
import Link from "next/link";

export default async function FinanzasDashboard() {
  const supabase = await createSuperadminServerClient();

  // Queries
  const [
    { data: payRaw }, 
    { data: varRaw },
    { data: fixPayRaw },
    { data: fixCostsRaw } // To infer categories if needed, but fixPayRaw doesn't have category joined if simple schema. Wait, we need categories of fixed costs. Let's assume we can fetch them or join them.
  ] = await Promise.all([
    supabase.from("subscription_payments")
      .select("amount_usd, plan_price, created_at, status, companies!inner(subscription_status)")
      .eq("status", "approved")
      .neq("companies.subscription_status", "demo"),
    supabase.from("admin_variable_costs").select("amount_usd, category, date"),
    supabase.from("admin_fixed_cost_payments").select("amount_usd, paid_at, admin_fixed_costs(category)"),
    supabase.from("admin_fixed_costs").select("amount_usd, category") // to simulate fixed costs expected if not paid, but prompt says "Costos fijos registrados"
  ]);

  const payments = payRaw || [];
  const varCosts = varRaw || [];
  const fixPayments = fixPayRaw || [];
  
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Math for this month
  const incomesThisMonth = payments.filter(p => new Date(p.created_at) >= currentMonthStart).reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
  
  const varCostsThisMonth = varCosts.filter(c => new Date(c.date) >= currentMonthStart).reduce((sum, c) => sum + (c.amount_usd || 0), 0);
  const fixCostsThisMonth = fixPayments.filter(c => new Date(c.paid_at) >= currentMonthStart).reduce((sum, c) => sum + (c.amount_usd || 0), 0);
  
  const totalCostsThisMonth = varCostsThisMonth + fixCostsThisMonth;
  const netProfit = incomesThisMonth - totalCostsThisMonth;
  const marginPercent = incomesThisMonth > 0 ? (netProfit / incomesThisMonth) * 100 : 0;

  // Gráfica 1: Histórico de 6 meses
  const buildHistory = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const ing = payments.filter(p => new Date(p.created_at) >= d && new Date(p.created_at) < nextD).reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
      const vCost = varCosts.filter(c => new Date(c.date) >= d && new Date(c.date) < nextD).reduce((sum, c) => sum + (c.amount_usd || 0), 0);
      const fCost = fixPayments.filter(c => new Date(c.paid_at) >= d && new Date(c.paid_at) < nextD).reduce((sum, c) => sum + (c.amount_usd || 0), 0);
      
      months.push({
        month: d.toLocaleDateString("es-VE", { month: "short", year: "2-digit" }),
        ingreso: Number(ing.toFixed(2)),
        costo: Number((vCost + fCost).toFixed(2)),
        ganancia: Number((ing - (vCost + fCost)).toFixed(2))
      });
    }
    return months;
  };
  const historyChart = buildHistory();

  // Gráfica 2: Dona de costos este mes
  const combinedCosts = [
    ...varCosts.filter(c => new Date(c.date) >= currentMonthStart).map(c => ({ category: c.category || 'Otros', amount: c.amount_usd })),
    ...fixPayments.filter(c => new Date(c.paid_at) >= currentMonthStart).map(c => ({ category: (c.admin_fixed_costs as any)?.category || 'Otros', amount: c.amount_usd }))
  ];
  
  const categoryMap = combinedCosts.reduce((acc: any, c) => {
    acc[c.category] = (acc[c.category] || 0) + c.amount;
    return acc;
  }, {});

  const catColors: any = {
     "Infraestructura": "#4FC3F7",
     "Marketing": "#E040FB",
     "Personal": "#FFB300",
     "Herramientas SaaS": "#6366F1",
     "Soporte": "#F43F5E",
     "Otros": "#94A3B8"
  };

  const donutData = Object.entries(categoryMap).map(([key, val]) => ({
     name: key,
     value: val as number,
     color: catColors[key] || "#94A3B8"
  }));

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Mis Finanzas</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Rentabilidad y control de costos de LUMIS</p>
        </div>
        <div className="flex bg-surface-card p-1 rounded-xl border border-border shadow-sm">
          <button className="px-4 py-1.5 text-xs font-bold bg-brand text-white rounded-lg shadow-sm">Este Mes</button>
          <button className="px-4 py-1.5 text-xs font-bold text-text-3 hover:text-text-1">Último Trimestre</button>
          <button className="px-4 py-1.5 text-xs font-bold text-text-3 hover:text-text-1">Este Año</button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-status-ok relative z-10">
             <TrendingUp className="w-4 h-4" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Ingresos del Mes</span>
          </div>
          <p className="text-3xl font-heading font-black text-text-1 mt-2 relative z-10">${incomesThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-status-danger relative z-10">
             <TrendingDown className="w-4 h-4" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Costos Totales (Mes)</span>
          </div>
          <p className="text-3xl font-heading font-black text-text-1 mt-2 relative z-10">${totalCostsThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
          <div className={`flex items-center gap-2 mb-2 relative z-10 ${netProfit >= 0 ? 'text-status-ok' : 'text-status-danger'}`}>
             <DollarSign className="w-4 h-4" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Ganancia Neta</span>
          </div>
          <p className={`text-3xl font-heading font-black mt-2 relative z-10 ${netProfit >= 0 ? 'text-status-ok' : 'text-status-danger'}`}>
             ${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E5CC]/5 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 text-[#00AF9C] relative z-10">
             <Target className="w-4 h-4" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Margen Neta %</span>
          </div>
          <p className="text-3xl font-heading font-black text-text-1 mt-2 relative z-10">
             {marginPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* MID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gráfica Ingresos vs Costos */}
        <div className="md:col-span-2 bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Ingresos vs Costos</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Rentabilidad mensual (6m)</p>
          </div>
          <div className="flex-1">
             <FinanzaComposedChart data={historyChart} />
          </div>
        </div>

        {/* Desglose de Costos */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Desglose de Costos</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Por categoría este mes</p>
          </div>
          <div className="flex-1 flex justify-center items-center min-h-[200px]">
             {donutData.length > 0 ? <PlanDonutChart data={donutData} /> : <p className="text-sm text-text-3">Sin gastos el mes actual</p>}
          </div>
        </div>
      </div>

      {/* BOTTOM Resumen */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col overflow-hidden">
          <div className="mb-6">
            <h2 className="text-lg font-heading font-bold text-text-1 flex items-center gap-2"><Wallet className="w-5 h-5 text-brand" /> Resumen del Mes Actual</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Flujo P&L Consolidado</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
             <div className="py-4 md:py-0 md:px-6">
                <p className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-2">1. Ingresos Cobrados</p>
                <p className="text-2xl font-bold text-status-ok">${incomesThisMonth.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
             </div>
             <div className="py-4 md:py-0 md:px-6">
                <p className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-2">2. Costos Fijos</p>
                <p className="text-2xl font-bold text-status-danger">${fixCostsThisMonth.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
             </div>
             <div className="py-4 md:py-0 md:px-6">
                <p className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-2">3. Costos Variables</p>
                <p className="text-2xl font-bold text-status-danger">${varCostsThisMonth.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
             </div>
             <div className="py-4 md:py-0 md:px-6">
                <p className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-2">4. Ganancia Neta</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-brand" : "text-status-danger"}`}>${netProfit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
             </div>
          </div>
      </div>

    </div>
  );
}
