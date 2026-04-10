"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, ChefHat, CheckCircle2 } from "lucide-react";

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
      ? "text-red-400 bg-red-500/20 border-red-500/30"
      : minutes >= alertYellow
      ? "text-yellow-400 bg-yellow-500/20 border-yellow-500/30"
      : "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";

  return (
    <div className="bg-[#1E1E2E] rounded-2xl border border-[#2A2A3E] p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-white font-montserrat">{tableName}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Mesero: {waiterName}</p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold", timerColor)}>
          <Clock className="w-3.5 h-3.5" />
          {minutes}m
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-3">
        {pendingItems.map((item: any) => (
          <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-[#262636]">
            <span className="text-white font-bold text-xs shrink-0 mt-0.5">x{item.quantity}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200 leading-tight">{item.product_name}</p>
              {item.modifications && (
                <p className="text-[11px] text-amber-400 italic mt-0.5">⚠ {item.modifications}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions based on status */}
      {items.some((i: any) => i.status === "pendiente") && (
        <button
          onClick={() =>
            onStartPreparation(
              order.id,
              items.filter((i: any) => i.status === "pendiente").map((i: any) => i.id)
            )
          }
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
        >
          ✓ Entregado
        </button>
      )}
    </div>
  );
}
