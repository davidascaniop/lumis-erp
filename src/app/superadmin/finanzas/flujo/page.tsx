import { createSuperadminServerClient } from "@/lib/supabase/superadmin-server";
import { DollarSign, ArrowDownToLine, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { AreaFlowChart } from "@/components/superadmin/area-flow-chart";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function FlujoCajaPage() {
  const supabase = await createSuperadminServerClient();

  const [
    { data: payRaw },
    { data: varRaw },
    { data: fixPayRaw }
  ] = await Promise.all([
    supabase.from("subscription_payments").select("amount_usd, plan_price, created_at, status, companies!inner(name, subscription_status)").eq("status", "approved").neq("companies.subscription_status", "demo"),
    supabase.from("admin_variable_costs").select("amount_usd, category, date, description"),
    supabase.from("admin_fixed_cost_payments").select("amount_usd, paid_at, admin_fixed_costs(name, category)")
  ]);

  const payments = payRaw || [];
  const varCosts = varRaw || [];
  const fixPayments = fixPayRaw || [];

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Cards logic
  const totalIngresos = payments.reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
  const totalEgresos = varCosts.reduce((sum, c) => sum + (c.amount_usd || 0), 0) + fixPayments.reduce((sum, c) => sum + (c.amount_usd || 0), 0);
  const saldoActual = totalIngresos - totalEgresos;

  const ingresosMes = payments.filter(p => new Date(p.created_at) >= currentMonthStart).reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
  const egresosMes = varCosts.filter(c => new Date(c.date) >= currentMonthStart).reduce((sum, c) => sum + (c.amount_usd || 0), 0) +
    fixPayments.filter(c => new Date(c.paid_at) >= currentMonthStart).reduce((sum, c) => sum + (c.amount_usd || 0), 0);

  // Build History Chart Data
  const buildFlowHistory = () => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const ing = payments.filter(p => new Date(p.created_at) >= d && new Date(p.created_at) < nextD).reduce((sum, p) => sum + (p.plan_price || p.amount_usd || 0), 0);
      const egr = varCosts.filter(c => new Date(c.date) >= d && new Date(c.date) < nextD).reduce((sum, c) => sum + (c.amount_usd || 0), 0) +
        fixPayments.filter(c => new Date(c.paid_at) >= d && new Date(c.paid_at) < nextD).reduce((sum, c) => sum + (c.amount_usd || 0), 0);

      months.push({
        month: d.toLocaleDateString("es-VE", { month: "short", year: "2-digit" }),
        ingresos: Number(ing.toFixed(2)),
        egresos: Number(egr.toFixed(2)),
        neto: Number((ing - egr).toFixed(2))
      });
    }
    return months;
  };
  const flowChart = buildFlowHistory();

  // Build Combined Transactions list
  const tx: any[] = [];

  payments.forEach(p => {
    tx.push({ date: new Date(p.created_at), desc: `Pago Suscripción - ${(p.companies as any)?.name || 'Cliente'}`, type: 'ingreso', category: 'Suscripción', amount: (p.plan_price || p.amount_usd || 0) });
  });
  varCosts.forEach(c => {
    tx.push({ date: new Date(c.date), desc: c.description, type: 'egreso', category: c.category, amount: (c.amount_usd || 0) });
  });
  fixPayments.forEach(c => {
    tx.push({ date: new Date(c.paid_at), desc: `Costo Fijo - ${(c.admin_fixed_costs as any)?.name || 'Varios'}`, type: 'egreso', category: (c.admin_fixed_costs as any)?.category || 'General', amount: (c.amount_usd || 0) });
  });

  // Sort ascending to calculate running balance, then reverse for display
  tx.sort((a, b) => a.date.getTime() - b.date.getTime());
  let runningBalance = 0;
  tx.forEach(t => {
    if (t.type === 'ingreso') runningBalance += t.amount;
    else runningBalance -= t.amount;
    t.balance = runningBalance;
  });

  tx.reverse();

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Flujo de Caja</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Control de tesorería y saldos líquidos</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-card border border-border text-text-2 hover:text-text-1 text-sm font-bold rounded-xl hover:bg-surface-hover transition-colors shadow-sm">
          <ArrowDownToLine className="w-4 h-4" /> Exportar Reporte
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Saldo Actual</h3>
          <div className={`font-heading text-4xl font-black tracking-tight relative z-10 ${saldoActual >= 0 ? "text-brand" : "text-status-danger"}`}>
            ${saldoActual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-status-ok/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-status-ok/10 border border-status-ok/20 rounded-2xl text-status-ok">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Ingresos (Mes)</h3>
          <div className="font-heading text-4xl font-black text-text-1 tracking-tight relative z-10">
            ${ingresosMes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="p-3 bg-status-danger/10 border border-status-danger/20 rounded-2xl text-status-danger">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Egresos (Mes)</h3>
          <div className="font-heading text-4xl font-black text-text-1 tracking-tight relative z-10">
            ${egresosMes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
        <div className="mb-4">
          <h2 className="text-lg font-heading font-bold text-text-1">Flujo Histórico Acumulado</h2>
          <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Entradas vs Salidas (12m)</p>
        </div>
        <div className="flex-1">
          <AreaFlowChart data={flowChart} />
        </div>
      </div>

      {/* TABLA MOVIMIENTOS */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col overflow-hidden">
        <div className="mb-4">
          <h2 className="text-lg font-heading font-bold text-text-1">Movimientos Recientes</h2>
          <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Historial general de caja</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-base/50">
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Fecha</th>
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Descripción</th>
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Categoría</th>
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Monto</th>
                <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider text-right">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {tx.slice(0, 30).map((t, i) => (
                <tr key={i} className="border-b border-border hover:bg-surface-hover/20 transition-colors">
                  <td className="p-3 text-xs font-medium text-text-2">{format(t.date, "dd MMM, yy HH:mm", { locale: es })}</td>
                  <td className="p-3 text-sm font-bold text-text-1 truncate max-w-[250px]">
                    <div className="flex items-center gap-2">
                      {t.type === 'ingreso' ? <TrendingUp className="w-3 h-3 text-status-ok" /> : <TrendingDown className="w-3 h-3 text-status-danger" />}
                      {t.desc}
                    </div>
                  </td>
                  <td className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">{t.category}</td>
                  <td className={`p-3 text-sm font-bold ${t.type === 'ingreso' ? 'text-status-ok' : 'text-status-danger'}`}>
                    {t.type === 'ingreso' ? '+' : '-'}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-sm font-bold text-text-1">
                    ${Number(t.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {tx.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-text-3">No hay movimientos en la caja.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
