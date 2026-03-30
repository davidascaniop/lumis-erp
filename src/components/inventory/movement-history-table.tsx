"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Search,
  Filter,
  Calendar,
  Loader2,
  PackageOpen,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Constantes ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof ArrowDownCircle }> = {
  IN:         { label: "Entrada",       color: "text-status-ok",     bg: "bg-status-ok/10",     icon: ArrowDownCircle },
  OUT:        { label: "Salida",        color: "text-status-danger", bg: "bg-status-danger/10", icon: ArrowUpCircle },
  ADJUSTMENT: { label: "Ajuste",       color: "text-status-warn",   bg: "bg-status-warn/10",   icon: RefreshCw },
  TRANSFER:   { label: "Transferencia", color: "text-status-info",  bg: "bg-status-info/10",   icon: ArrowRightLeft },
  SALE:       { label: "Venta",         color: "text-status-danger", bg: "bg-status-danger/10", icon: ArrowUpCircle },
  PURCHASE:   { label: "Compra",        color: "text-status-ok",     bg: "bg-status-ok/10",     icon: ArrowDownCircle },
};

interface MovementHistoryTableProps {
  refreshKey?: number;
}

export function MovementHistoryTable({ refreshKey }: MovementHistoryTableProps) {
  const { user } = useUser();
  const supabase = createClient();

  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterWarehouse, setFilterWarehouse] = useState("ALL");
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const fetchMovements = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);

    try {
      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          products(name, sku),
          warehouses:warehouse_id(name),
          from_warehouse:from_warehouse_id(name),
          to_warehouse:to_warehouse_id(name)
        `)
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterType !== "ALL") query = query.eq("type", filterType);
      if (filterWarehouse !== "ALL") query = query.eq("warehouse_id", filterWarehouse);

      const { data } = await query;
      setMovements(data ?? []);
    } catch (error) {
      console.error("Error fetching movements:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.company_id, filterType, filterWarehouse]);

  const fetchWarehouses = useCallback(async () => {
    if (!user?.company_id) return;
    const { data } = await supabase
      .from("warehouses")
      .select("id, name")
      .eq("company_id", user.company_id)
      .eq("is_active", true);
    setWarehouses(data ?? []);
  }, [user?.company_id]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements, refreshKey]);

  // ─── Filtro por texto ──────────────────────────────────────────────────────

  const filtered = movements.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.products?.name?.toLowerCase().includes(q) ||
      m.products?.sku?.toLowerCase().includes(q) ||
      m.reason?.toLowerCase().includes(q)
    );
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <Input
            placeholder="Buscar por producto, SKU o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-surface-card border-border rounded-xl text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-10 bg-surface-card border-border rounded-xl text-sm">
            <Filter className="w-4 h-4 mr-2 text-text-3" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 rounded-xl">
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="IN">Entradas</SelectItem>
            <SelectItem value="OUT">Salidas</SelectItem>
            <SelectItem value="ADJUSTMENT">Ajustes</SelectItem>
            <SelectItem value="TRANSFER">Transferencias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
          <SelectTrigger className="w-[180px] h-10 bg-surface-card border-border rounded-xl text-sm">
            <SelectValue placeholder="Depósito" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 rounded-xl">
            <SelectItem value="ALL">Todos los depósitos</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <p className="text-text-3 text-sm animate-pulse">Cargando movimientos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <PackageOpen className="w-12 h-12 text-text-3 opacity-20" />
            <p className="text-text-3 text-sm">No hay movimientos registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Fecha</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Producto</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Tipo</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Cantidad</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Almacén</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Motivo</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((m, i) => {
                    const config = TYPE_CONFIG[m.type] ?? TYPE_CONFIG["ADJUSTMENT"];
                    const Icon = config.icon;
                    const date = new Date(m.created_at);

                    return (
                      <motion.tr
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.4) }}
                        className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-text-1 font-semibold">
                              {date.toLocaleDateString("es-VE", { day: "2-digit", month: "short" })}
                            </span>
                            <span className="font-mono text-[10px] text-text-3">
                              {date.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-text-1 font-semibold text-xs">{m.products?.name ?? "—"}</span>
                            <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider">{m.products?.sku ?? ""}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`font-mono font-bold text-sm ${m.type === "OUT" || m.type === "SALE" ? "text-status-danger" : "text-status-ok"}`}>
                            {m.type === "OUT" || m.type === "SALE" ? "-" : "+"}{m.qty}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {m.type === "TRANSFER" ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-text-3">{m.from_warehouse?.name ?? "—"}</span>
                              <ArrowRightLeft className="w-3 h-3 text-status-info" />
                              <span className="text-text-1 font-semibold">{m.to_warehouse?.name ?? "—"}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-2">{m.warehouses?.name ?? "—"}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-text-2 max-w-[200px] truncate block">{m.reason}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
