"use client";

import { cn } from "@/lib/utils";
import { Users, Clock, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

interface TableCardProps {
  table: {
    id: string;
    name: string;
    capacity: number;
    zone: string;
    status: string;
    current_order_id: string | null;
    created_at: string;
  };
  orderInfo?: {
    created_at: string;
    total: number;
  } | null;
  onClick: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; dot: string }> = {
  libre:          { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200 hover:border-emerald-400", label: "Libre", dot: "bg-emerald-500" },
  ocupada:        { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200 hover:border-red-400",       label: "Ocupada", dot: "bg-red-500" },
  cuenta_pedida:  { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200 hover:border-amber-400",   label: "Cuenta Pedida", dot: "bg-amber-500" },
  reservada:      { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200 hover:border-blue-400",     label: "Reservada", dot: "bg-blue-500" },
};

function useElapsedTime(startTime: string | null | undefined) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startTime) { setElapsed(""); return; }

    const updateElapsed = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      if (hrs > 0) {
        setElapsed(`${hrs}h ${mins % 60}m`);
      } else {
        setElapsed(`${mins}m`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 30_000); // Update every 30s
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

export function TableCard({ table, orderInfo, onClick }: TableCardProps) {
  const config = STATUS_CONFIG[table.status] || STATUS_CONFIG.libre;
  const elapsed = useElapsedTime(
    table.status === "ocupada" || table.status === "cuenta_pedida"
      ? orderInfo?.created_at
      : null
  );

  return (
    <button
      onClick={onClick}
      id={`table-card-${table.id}`}
      className={cn(
        "relative group w-full p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left",
        "hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]",
        config.bg,
        config.border,
      )}
    >
      {/* Status dot */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full", config.dot)} />
          <span className={cn("text-xs font-bold uppercase tracking-wider", config.color)}>
            {config.label}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-text-3 bg-white/80 px-2 py-0.5 rounded-md border border-border/40">
          {table.zone}
        </span>
      </div>

      {/* Table name */}
      <h3 className="text-lg font-bold text-text-1 mb-2 font-montserrat">{table.name}</h3>

      {/* Info row */}
      <div className="flex items-center gap-3 text-xs text-text-2">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold">{table.capacity}</span>
        </div>

        {elapsed && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">{elapsed}</span>
          </div>
        )}

        {orderInfo && orderInfo.total > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="font-bold text-text-1">${orderInfo.total.toFixed(2)}</span>
          </div>
        )}
      </div>
    </button>
  );
}
