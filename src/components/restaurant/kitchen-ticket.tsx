"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, ChefHat, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface KitchenTicketProps {
  order: any;
  alertYellow: number;
  alertRed: number;
  onStartPreparation: (orderId: string, itemIds: string[]) => void;
  onMarkReady: (orderId: string, itemIds: string[]) => void;
  onMarkDelivered: (orderId: string, itemIds: string[]) => void;
}

function useKitchenTimer(startTime: string | null) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!startTime) { setMinutes(0); return; }
    const update = () => {
      setMinutes(Math.floor((Date.now() - new Date(startTime).getTime()) / 60000));
    };
    update();
    const interval = setInterval(update, 15_000);
    return () => clearInterval(interval);
  }, [startTime]);

  return minutes;
}

export function KitchenTicket({
  order,
  alertYellow,
  alertRed,
  onStartPreparation,
  onMarkReady,
  onMarkDelivered,
}: KitchenTicketProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const items = order.restaurant_order_items || [];
  const tableName = order.restaurant_tables?.name || "Mesa";
  const waiterName = order.users?.full_name || "Mesero";

  // Group items by status
  const pendingItems = items.filter((i: any) => i.status === "en_preparacion" || i.status === "pendiente");
  const readyItems = items.filter((i: any) => i.status === "listo");

  // Calculate timer from earliest sent_to_kitchen_at
  const earliestSent = pendingItems
    .map((i: any) => i.sent_to_kitchen_at)
    .filter(Boolean)
    .sort()[0];

  const minutes = useKitchenTimer(earliestSent || order.created_at);

  const timerColor =
    minutes >= alertRed
      ? "text-red-700 bg-red-100 border-red-200"
      : minutes >= alertYellow
      ? "text-amber-700 bg-amber-100 border-amber-200"
      : "text-emerald-700 bg-emerald-100 border-emerald-200";

  const displayItems = pendingItems.length > 0 ? pendingItems : readyItems;
  const totalPlates = displayItems.reduce((acc: number, item: any) => acc + item.quantity, 0);

  return (
    <div className="bg-surface-card rounded-2xl border border-border p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all">
      {/* Header (Accordion Toggle) */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 border-b border-border/50 pb-3 hover:opacity-80 active:scale-[0.98] transition-all text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text-1 font-montserrat">{tableName}</h3>
            {totalPlates > 0 && (
              <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded-md">
                {totalPlates} {totalPlates === 1 ? "plato" : "platos"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-3 font-medium mt-0.5">Mesero: {waiterName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold", timerColor)}>
            <Clock className="w-3.5 h-3.5" />
            {minutes}m
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-3" /> : <ChevronDown className="w-4 h-4 text-text-3" />}
        </div>
      </button>

      {/* Items (Collapsible) */}
      {isExpanded && (
      <div className="mb-4 rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden bg-surface-card">
        {displayItems.map((item: any) => (
          <div key={item.id} className="flex items-start gap-3 p-3">
            <span className="text-text-1 font-bold text-xs shrink-0 mt-0.5 px-2 py-1 bg-surface-base rounded-md border border-border/50">x{item.quantity}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-1 leading-tight mt-0.5">{item.product_name}</p>
              {item.modifications && (
                <p className="text-xs text-amber-600 font-medium italic mt-1.5 bg-amber-50 rounded px-2 py-1 inline-block border border-amber-100">⚠ {item.modifications}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Actions based on status */}
      {items.some((i: any) => i.status === "pendiente") && (
        <button
          onClick={() =>
            onStartPreparation(
              order.id,
              items.filter((i: any) => i.status === "pendiente").map((i: any) => i.id)
            )
          }
          className="w-full py-2.5 rounded-xl bg-surface-base hover:bg-blue-50 text-blue-600 font-bold text-sm transition-all border border-border hover:border-blue-200 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <ChefHat className="w-4 h-4" />
          Iniciar Preparación
        </button>
      )}

      {items.some((i: any) => i.status === "en_preparacion") &&
       !items.some((i: any) => i.status === "pendiente") && (
        <button
          onClick={() =>
            onMarkReady(
              order.id,
              items.filter((i: any) => i.status === "en_preparacion").map((i: any) => i.id)
            )
          }
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Marcar como Listo
        </button>
      )}

      {readyItems.length > 0 && pendingItems.length === 0 && (
        <button
          onClick={() =>
            onMarkDelivered(
              order.id,
              readyItems.map((i: any) => i.id)
            )
          }
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
        >
          ✓ Entregado
        </button>
      )}
    </div>
  );
}
