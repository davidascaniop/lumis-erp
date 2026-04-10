"use client";

import { useState, useEffect } from "react";
import { X, Loader2, UtensilsCrossed, Users, Clock, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CollectTableModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onSelectTable: (tableId: string, orderId: string, items: any[], tableName: string, waiterName: string) => void;
}

export function CollectTableModal({ open, onClose, companyId, onSelectTable }: CollectTableModalProps) {
  const supabase = createClient();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !companyId) return;
    setLoading(true);
    (async () => {
      // Get tables with cuenta_pedida status
      const { data: tablesData } = await supabase
        .from("restaurant_tables")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "cuenta_pedida");

      if (!tablesData || tablesData.length === 0) {
        setTables([]);
        setLoading(false);
        return;
      }

      // Get orders for those tables
      const orderIds = tablesData.map((t) => t.current_order_id).filter(Boolean);
      const { data: ordersData } = await supabase
        .from("restaurant_orders")
        .select(`
          *,
          users!restaurant_orders_waiter_id_fkey(full_name),
          restaurant_order_items(*)
        `)
        .in("id", orderIds);

      const enriched = tablesData.map((table) => {
        const order = (ordersData || []).find((o: any) => o.id === table.current_order_id);
        const items = order?.restaurant_order_items || [];
        const total = items.reduce((sum: number, i: any) => sum + i.quantity * i.unit_price, 0);
        const elapsed = order
          ? Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
          : 0;
        return {
          ...table,
          order,
          items,
          total,
          elapsed,
          waiterName: order?.users?.full_name || "Mesero",
          guestsCount: order?.guests_count || 1,
        };
      });

      setTables(enriched);
      setLoading(false);
    })();
  }, [open, companyId, supabase]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-card rounded-3xl p-6 shadow-elevated border border-border animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-200">
              <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-1 font-montserrat">Cobrar Mesa</h2>
              <p className="text-xs text-text-3">Selecciona la mesa para cargar al POS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5 text-text-3" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-10">
            <UtensilsCrossed className="w-10 h-10 text-text-3/30 mx-auto mb-2" />
            <p className="text-text-3 font-medium">No hay mesas con cuenta pendiente</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  onSelectTable(table.id, table.order?.id, table.items, table.name, table.waiterName);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-base border border-border hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-1">{table.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-text-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {table.guestsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {table.elapsed}m
                    </span>
                    <span>Mesero: {table.waiterName}</span>
                  </div>
                  <p className="text-[10px] text-text-3 mt-0.5">{table.items.length} items</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-text-1 font-montserrat">${table.total.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
