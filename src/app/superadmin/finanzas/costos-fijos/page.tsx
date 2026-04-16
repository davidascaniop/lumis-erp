"use client";
import { useState, useEffect } from "react";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
import { Calculator, Plus, MoreVertical, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export default function CostosFijosPage() {
  const supabase = createSuperadminClient();
  const [costos, setCostos] = useState<any[]>([]);
  const [paymentsThisMonth, setPaymentsThisMonth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchCostos = async () => {
    const { data: fc } = await supabase.from("admin_fixed_costs").select("*");
    
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: payments } = await supabase
      .from("admin_fixed_cost_payments")
      .select("*")
      .gte("paid_at", currentMonthStart);
      
    setCostos(fc || []);
    setPaymentsThisMonth(payments || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCostos();
  }, []);

  const totalCostosMes = costos.reduce((sum, c) => sum + (c.amount_usd || 0), 0);
  
  // Categoría styles
  const catStyles: any = {
    "Infraestructura": "bg-[#4FC3F7]/10 text-[#0288D1]",
    "Herramientas SaaS": "bg-[#E040FB]/10 text-[#E040FB]",
    "Personal": "bg-[#FFB300]/10 text-[#FFB300]",
    "Oficina": "bg-[#10B981]/10 text-[#10B981]",
    "Otro": "bg-surface-hover text-text-2"
  };

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Costos Fijos</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Gastos que se repiten cada mes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Agregar Costo Fijo
        </button>
      </div>

      {/* CARD RESUMEN */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden max-w-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="p-3 bg-status-danger/10 border border-status-danger/20 rounded-2xl text-status-danger">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">Total Costos Fijos Mensuales</h3>
        <div className={`font-heading text-4xl font-black tracking-tight relative z-10 text-text-1`}>
          ${totalCostosMes.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </div>
      </div>

      {/* LISTA GRID DE COSTOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
           <p className="text-text-3 p-4">Cargando...</p>
        ) : costos.length === 0 ? (
           <div className="col-span-full py-12 text-center border border-dashed border-border rounded-3xl">
             <Calculator className="w-10 h-10 text-text-3 mx-auto mb-4" />
             <p className="text-text-2 font-bold mb-2">No hay costos fijos registrados</p>
             <p className="text-text-3 text-sm mb-4">Empieza agregando tu hosting o herramientas.</p>
             <button onClick={() => setShowModal(true)} className="text-brand font-bold hover:underline">Añadir el primero</button>
           </div>
        ) : (
          costos.map(c => {
            const isPaid = paymentsThisMonth.some(p => p.fixed_cost_id === c.id);
            const isOverdue = !isPaid && new Date().getDate() > c.due_day;
            const isPendingDueSoon = !isPaid && !isOverdue;

            return (
              <div key={c.id} className="bg-surface-card border border-border rounded-3xl p-5 shadow-sm flex flex-col items-center text-center relative group">
                <button className="absolute top-4 right-4 text-text-3 hover:text-text-1 bg-surface-base p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                   <MoreVertical className="w-4 h-4" />
                </button>
                
                <div className="w-16 h-16 rounded-2xl bg-surface-base border border-border flex items-center justify-center mb-4 shadow-sm">
                   <span className="text-2xl font-bold text-text-2">{c.name.charAt(0)}</span>
                </div>
                
                <h3 className="text-sm font-bold text-text-1 mb-1">{c.name}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-4 ${catStyles[c.category] || catStyles["Otro"]}`}>
                  {c.category}
                </span>

                <div className="text-3xl font-heading font-black text-text-1 mb-1">
                  ${Number(c.amount_usd).toLocaleString()}
                </div>
                <div className="text-[#00AF9C] text-[10px] font-bold uppercase tracking-widest bg-[#00E5CC]/10 px-2 py-1 rounded-md mb-6">
                  Día {c.due_day} de cada mes
                </div>

                <div className="mt-auto w-full">
                  {isPaid ? (
                    <div className="flex items-center justify-center gap-2 text-status-ok bg-status-ok/10 py-2.5 rounded-xl text-xs font-bold w-full uppercase tracking-wider border border-status-ok/20">
                      <CheckCircle2 className="w-4 h-4" /> Pagado
                    </div>
                  ) : (
                    <div className="space-y-2 w-full">
                      <div className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${isOverdue ? "text-status-danger" : "text-status-warn"}`}>
                        {isOverdue ? <><XCircle className="w-4 h-4" /> Vencido</> : <><Clock className="w-4 h-4" /> Pendiente</>}
                      </div>
                      <button className="w-full py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/90 transition-colors shadow-sm">
                        Registrar Pago
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-surface-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-text-3 hover:text-text-1"><XCircle className="w-5 h-5" /></button>
              <h2 className="text-xl font-heading font-bold text-text-1 mb-4">Nuevo Costo Fijo</h2>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Nombre</label>
                    <input type="text" className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand" placeholder="Ej: Vercel, Supabase..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Categoría</label>
                      <select className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand">
                         <option>Infraestructura</option>
                         <option>Herramientas SaaS</option>
                         <option>Personal</option>
                         <option>Oficina</option>
                         <option>Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto USD</label>
                      <input type="number" className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand" placeholder="0.00" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Día de cobro</label>
                    <input type="number" min={1} max={31} className="w-full mt-1 bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand" placeholder="1 - 31" />
                 </div>
                 <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-surface-base/50">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-brand focus:ring-brand" defaultChecked />
                    <div className="flex-1">
                       <p className="text-sm font-bold text-text-1">Generar Alerta</p>
                       <p className="text-[10px] text-text-3 uppercase tracking-wider">Avisar antes del vencimiento</p>
                    </div>
                    <select className="bg-surface-card border border-border rounded-lg px-2 py-1 text-xs text-text-1">
                       <option>3 días antes</option>
                       <option>5 días antes</option>
                       <option>10 días antes</option>
                    </select>
                 </div>
                 <button onClick={() => setShowModal(false)} className="w-full py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand/90 transition-colors shadow-sm mt-4">
                    Guardar Costo Fijo
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
