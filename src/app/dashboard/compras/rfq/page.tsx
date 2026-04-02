"use client";

import { useState } from "react";
import { Plus, Search, Loader2, FileText, ClipboardList, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RFQPage() {
  const [loading, setLoading] = useState(false);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const handleNewRFQ = () => {
    alert("Próximamente: Modal de nueva solicitud de cotización");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1 flex items-center gap-2">
            Solicitudes de Cotización <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase">BETA</span>
          </h1>
          <p className="text-text-2 mt-1 text-sm">Pide precios a varios proveedores antes de comprar</p>
        </div>
        <button onClick={handleNewRFQ}
          className="px-6 py-3 bg-brand-gradient text-white font-bold font-montserrat rounded-xl text-sm shadow-brand hover:opacity-90 transition-all flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nueva Solicitud
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "RFQs activas este mes", value: "0", icon: FileText, color: "text-brand", bg: "bg-brand/10" },
          { label: "Esperando respuesta", value: "0", icon: ClipboardList, color: "text-status-warn", bg: "bg-status-warn/10" },
          { label: "Convertidas a Órdenes", value: "0", icon: CheckCircle2, color: "text-status-ok", bg: "bg-status-ok/10" },
        ].map(c => (
           <Card key={c.label} className="p-5 bg-surface-card shadow-card border-border/50 flex flex-col gap-3">
             <div className="flex justify-between items-start">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                 <c.icon className={`w-5 h-5 ${c.color}`} />
               </div>
             </div>
             <div>
               <p className="text-2xl font-montserrat font-bold text-text-1">{c.value}</p>
               <p className="text-xs font-montserrat font-bold text-text-3 mt-1">{c.label}</p>
             </div>
           </Card>
        ))}
      </div>

      {/* Table Section */}
      <Card className="p-0 bg-surface-card border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-base/50 flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input placeholder="Buscar RFQ..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 border-border/40 bg-surface-input" />
          </div>
        </div>
        <div className="p-20 flex flex-col items-center justify-center text-text-3">
           <FileText className="w-12 h-12 opacity-10 mb-4" />
           <p className="text-sm">En construcción: Tabla de RFQs en progreso.</p>
        </div>
      </Card>
    </div>
  );
}
