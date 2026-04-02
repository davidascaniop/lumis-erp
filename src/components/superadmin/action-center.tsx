"use client";

import { useState } from "react";
import { 
  Activity, 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function ActionCenter({ initialActivities }: { initialActivities: any[] }) {
  const [filter, setFilter] = useState("all");

  const filteredActivities = initialActivities.filter(act => {
    if (filter === "all") return true;
    if (filter === "payments") return act.category === "payment";
    if (filter === "registrations") return act.category === "registration";
    if (filter === "alerts") return act.category === "alert" || act.type === "payment_rejected";
    return true;
  }).slice(0, 10);

  const filters = [
    { id: "all", label: "Todos" },
    { id: "payments", label: "Pagos" },
    { id: "registrations", label: "Registros" },
    { id: "alerts", label: "Alertas" },
  ];

  return (
    <div className="bg-surface-card border border-border rounded-3xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
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

      {/* FILTROS (PASO 7) */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap",
              filter === f.id
                ? "bg-brand text-white border-brand shadow-sm"
                : "bg-surface-base text-text-2 border-border hover:bg-surface-hover"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-10 bg-surface-base rounded-2xl border border-dashed border-border px-4">
            <p className="text-xs font-medium text-text-3">No hay actividad en esta categoría</p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const Icon = act.icon;
            return (
              <Link 
                key={act.id} 
                href={act.link || "#"}
                className="group flex gap-3 relative p-3 rounded-2xl bg-surface-base/50 border border-transparent hover:border-brand/30 hover:bg-white transition-all cursor-pointer"
              >
                <div className={cn(
                  "mt-0.5 p-2 rounded-xl transition-colors shrink-0",
                  act.color
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start gap-2">
                     <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">
                        {formatDistanceToNow(new Date(act.date), { addSuffix: true, locale: es })}
                     </p>
                   </div>
                   <p className="text-sm font-bold text-text-1 mt-0.5 leading-snug">
                      {act.message}
                   </p>
                   <p className="text-xs font-medium text-brand mt-1 truncate">
                      {act.company}
                   </p>
                </div>
                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-brand" />
                </div>
              </Link>
            )
          })
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-border mt-auto">
        <Link href="/superadmin/clientes/empresas" className="w-full flex items-center justify-center gap-2 py-2.5 font-bold text-xs uppercase tracking-wider text-text-2 bg-surface-base hover:bg-surface-hover hover:text-text-1 rounded-xl border border-border transition-colors">
          Ver todas las empresas
        </Link>
      </div>
    </div>
  );
}
