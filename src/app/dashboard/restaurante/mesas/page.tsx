"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, UtensilsCrossed, Search, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useRealtimeTables } from "@/hooks/use-restaurant-realtime";
import { createClient } from "@/lib/supabase/client";
import { TableCard } from "@/components/restaurant/table-card";
import { NewTableModal } from "@/components/restaurant/new-table-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDataCache } from "@/lib/data-cache";

const DEFAULT_ZONES = [
  { id: "default-1", name: "Salón", color: "#10B981" },
  { id: "default-2", name: "Terraza", color: "#F59E0B" },
  { id: "default-3", name: "Barra", color: "#3B82F6" },
  { id: "default-4", name: "VIP", color: "#8B5CF6" },
];

export default function MesasPage() {
  const { user, loading: userLoading } = useUser();
  const companyId = user?.company_id;
  const { tables, loading: tablesLoading, refetch } = useRealtimeTables(companyId);
  const [zones, setZones] = useState<any[]>(DEFAULT_ZONES);
  const [activeZone, setActiveZone] = useState("Todas");
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [orderInfoMap, setOrderInfoMap] = useState<Record<string, { created_at: string; total: number }>>({});
  const router = useRouter();
  const supabase = createClient();

  // Fetch zones from DB
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const cacheKey = `restaurante_mesas_${companyId}`;
      const cached = useDataCache.getState().get(cacheKey, 30_000);
      if (cached) {
        if (cached.zones && cached.zones.length > 0) setZones(cached.zones);
        return;
      }
      const { data } = await supabase
        .from("restaurant_zones")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (data && data.length > 0) {
        setZones(data);
      }
      useDataCache.getState().set(cacheKey, { zones: data || [] });
    })();
  }, [companyId, supabase]);

  // Fetch order totals for occupied tables
  useEffect(() => {
    if (!companyId) return;
    const occupiedTables = tables.filter(t => t.status === "ocupada" || t.status === "cuenta_pedida");
    if (occupiedTables.length === 0) return;

    (async () => {
      const orderIds = occupiedTables.map(t => t.current_order_id).filter(Boolean);
      if (orderIds.length === 0) return;

      const { data: orders } = await supabase
        .from("restaurant_orders")
        .select("id, created_at, restaurant_order_items(quantity, unit_price)")
        .in("id", orderIds);

      if (orders) {
        const map: Record<string, { created_at: string; total: number }> = {};
        orders.forEach((o: any) => {
          const total = (o.restaurant_order_items || []).reduce(
            (sum: number, item: any) => sum + (item.quantity * item.unit_price),
            0
          );
          // Map by table id via current_order_id
          const table = occupiedTables.find(t => t.current_order_id === o.id);
          if (table) {
            map[table.id] = { created_at: o.created_at, total };
          }
        });
        setOrderInfoMap(map);
      }
    })();
  }, [tables, companyId, supabase]);

  // Filter tables by zone
  const filteredTables = activeZone === "Todas"
    ? tables
    : tables.filter(t => t.zone === activeZone);

  // Get unique zones for filters
  const allZoneNames = ["Todas", ...new Set(zones.map(z => z.name))];

  const handleTableClick = (table: any) => {
    if (table.status === "libre") {
      // Navigate to comandas to create new order for this table
      router.push(`/dashboard/restaurante/comandas?mesa=${table.id}&mesa_name=${encodeURIComponent(table.name)}`);
    } else if (table.status === "ocupada" || table.status === "cuenta_pedida") {
      // Navigate to active comanda
      router.push(`/dashboard/restaurante/comandas?mesa=${table.id}&order=${table.current_order_id}`);
    }
  };

  const handleDeleteTable = async (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const table = tables.find(t => t.id === tableId);
    if (table?.status !== "libre") {
      toast.error("No puedes eliminar una mesa que está en uso");
      return;
    }
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", tableId);
    if (error) {
      toast.error("Error al eliminar mesa");
    } else {
      toast.success("Mesa eliminada");
      if (companyId) useDataCache.getState().invalidatePrefix("restaurante_");
    }
  };

  if (userLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-sm text-text-3">Cargando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20">
              <UtensilsCrossed className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-1 font-montserrat">Mesas</h1>
              <p className="text-sm text-text-2">Estado del salón en tiempo real</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowNewTableModal(true)}
          id="btn-new-table"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-brand hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Mesa
        </button>
      </div>

      {/* STATUS SUMMARY */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Libres", count: tables.filter(t => t.status === "libre").length, dot: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Ocupadas", count: tables.filter(t => t.status === "ocupada").length, dot: "bg-red-500", bg: "bg-red-50 border-red-200" },
          { label: "Cuenta Pedida", count: tables.filter(t => t.status === "cuenta_pedida").length, dot: "bg-amber-500", bg: "bg-amber-50 border-amber-200" },
          { label: "Reservadas", count: tables.filter(t => t.status === "reservada").length, dot: "bg-blue-500", bg: "bg-blue-50 border-blue-200" },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg}`}>
            <div className={`w-3 h-3 rounded-full ${s.dot}`} />
            <div>
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold text-text-1">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ZONE FILTERS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {allZoneNames.map((zoneName) => (
          <button
            key={zoneName}
            onClick={() => setActiveZone(zoneName)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeZone === zoneName
                ? "bg-brand text-white shadow-brand"
                : "bg-surface-card border border-border text-text-2 hover:text-text-1 hover:border-brand/30"
            }`}
          >
            {zoneName}
          </button>
        ))}
      </div>

      {/* TABLES GRID */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed className="w-12 h-12 text-text-3/30 mx-auto mb-3" />
          <p className="text-text-3 font-medium">No hay mesas en esta zona</p>
          <p className="text-xs text-text-3 mt-1">Crea una nueva mesa para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map((table) => (
            <div key={table.id} className="relative group">
              <TableCard
                table={table}
                orderInfo={orderInfoMap[table.id] || null}
                onClick={() => handleTableClick(table)}
              />
              {table.status === "libre" && (
                <button
                  onClick={(e) => handleDeleteTable(table.id, e)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 border border-red-200 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all z-10"
                  title="Eliminar mesa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NEW TABLE MODAL */}
      <NewTableModal
        open={showNewTableModal}
        onClose={() => setShowNewTableModal(false)}
        onSuccess={refetch}
        companyId={companyId || ""}
        zones={zones}
      />
    </div>
  );
}
