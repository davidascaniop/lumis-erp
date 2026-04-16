"use client";
import { useState, useEffect } from "react";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
import { ListOrdered, Plus, ArrowUpRight, ArrowDownRight, Users, TrendingUp, XCircle, FileText } from "lucide-react";
import { HorizontalBarChart } from "@/components/superadmin/horizontal-bar-chart";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CostosVariablesPage() {
  const supabase = createSuperadminClient();
  const [costos, setCostos] = useState<any[]>([]);
  const [activeClients, setActiveClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchCostos = async () => {
    const { data: cv } = await supabase.from("admin_variable_costs").select("*").order("date", { ascending: false });
    const { count } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("subscription_status", "active");
    
    setCostos(cv || []);
    setActiveClients(count || 1); // Avoid division by 0
    setLoading(false);
  };

  useEffect(() => {
    fetchCostos();
  }, []);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthVars = costos.filter(c => new Date(c.date) >= currentMonthStart);
  const lastMonthVars = costos.filter(c => new Date(c.date) >= lastMonthStart && new Date(c.date) <= lastMonthEnd);

  const totalThisMonth = thisMonthVars.reduce((sum, c) => sum + (c.amount_usd || 0), 0);
  const totalLastMonth = lastMonthVars.reduce((sum, c) => sum + (c.amount_usd || 0), 0);
  
  const momChange = totalLastMonth ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;
  const avgPerClient = totalThisMonth / activeClients;

  // Chart
  const categories = thisMonthVars.reduce((acc: any, c) => {
    acc[c.category] = (acc[c.category] || 0) + (c.amount_usd || 0);
    return acc;
  }, {});
  const chartData = Object.entries(categories).map(([name, val]) => ({ name, meses: Number(val) }));

  // Categoría styles
  const catStyles: any = {
    "Marketing / Publicidad": "bg-[#E040FB]/10 text-[#E040FB]",
    "Comisiones": "bg-[#00E5CC]/10 text-[#00AF9C]",
    "Soporte técnico extra": "bg-[#F43F5E]/10 text-[#F43F5E]",
    "APIs de terceros": "bg-[#0288D1]/10 text-[#0288D1]",
    "Servicios puntuales": "bg-[#FFB300]/10 text-[#FFB300]",
    "Otro": "bg-surface-hover text-text-2"
  };

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Costos Variables</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Gastos que cambian según la actividad</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#4FC3F7] text-[#01579B] text-sm font-bold rounded-xl hover:bg-[#4FC3F7]/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 text-status-danger relative z-10">
             <ListOrdered className="w-5 h-5 text-status-danger" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Total Variable (Mes)</span>
          </div>
          <div className={`font-heading text-4xl font-black tracking-tight relative z-10 text-text-1`}>
             ${totalThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-[#E040FB] relative z-10">
             <Users className="w-5 h-5" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Costo x Cliente Activo</span>
          </div>
          <div className={`font-heading text-4xl font-black tracking-tight relative z-10 text-text-1`}>
             ${avgPerClient.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-brand relative z-10">
             <TrendingUp className="w-5 h-5" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Variación MoM</span>
          </div>
          <div className={`flex items-center gap-2 font-heading text-4xl font-black tracking-tight relative z-10 ${momChange > 0 ? "text-status-danger" : "text-status-ok"}`}>
             {momChange > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
             {Math.abs(momChange).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* CHART & TABLE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* TABLA */}
        <div className="xl:col-span-2 bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-heading font-bold text-text-1">Historial de Gastos</h2>
              <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Últimos registros</p>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-base/50">
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Fecha</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Descripción</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Categoría</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Monto</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={5} className="p-4 text-center text-sm text-text-3">Cargando...</td></tr>
                ) : costos.length === 0 ? (
                   <tr><td colSpan={5} className="p-4 text-center text-sm text-text-3">No hay gastos registrados.</td></tr>
                ) : (
                  costos.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-b border-border hover:bg-surface-hover/20 transition-colors">
                      <td className="p-3 text-xs font-medium text-text-2">{format(new Date(c.date), "dd MMM, yy", { locale: es })}</td>
                      <td className="p-3 text-sm font-bold text-text-1 truncate max-w-[200px]">{c.description}</td>
                      <td className="p-3">
                         <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${catStyles[c.category] || catStyles["Otro"]}`}>
                           {c.category}
                         </span>
                      </td>
                      <td className="p-3 text-sm font-bold text-status-danger">${Number(c.amount_usd).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button className="text-brand hover:underline text-[10px] uppercase font-bold tracking-wider">Ver Más</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CHART */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Por Categoría</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">Distribución del gasto (Este mes)</p>
          </div>
          <div className="flex-1 min-h-[300px]">
             {chartData.length > 0 ? <HorizontalBarChart data={chartData} /> : <p className="text-sm text-text-3 text-center py-10">Sin gastos este mes.</p>}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-surface-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-text-3 hover:text-text-1"><XCircle className="w-5 h-5" /></button>
              <h2 className="text-xl font-heading font-bold text-text-1 mb-4">Registrar Gasto Variable</h2>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Descripción</label>
                    <input type="text" className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand" placeholder="Ej: Campaña de FB Ads Promoción Marzo" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Categoría</label>
                      <select className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand">
                         <option>Marketing / Publicidad</option>
                         <option>Comisiones</option>
                         <option>Soporte técnico extra</option>
                         <option>APIs de terceros</option>
                         <option>Servicios puntuales</option>
                         <option>Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto USD</label>
                      <input type="number" className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand" placeholder="0.00" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha</label>
                      <input type="date" className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Comprobante (Opcional)</label>
                    <div className="mt-1 border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-text-3 hover:text-brand hover:border-brand transition-colors cursor-pointer bg-surface-base/50">
                       <FileText className="w-6 h-6 mb-2" />
                       <span className="text-xs font-bold uppercase tracking-wider">Subir Archivo</span>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="w-full py-3 bg-[#4FC3F7] text-[#01579B] rounded-xl text-sm font-bold hover:bg-[#4FC3F7]/90 transition-colors shadow-sm mt-4">
                    Guardar Gasto
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
