"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { transferStock } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  Search,
  Loader2,
  Package,
  Warehouse,
  AlertTriangle,
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

const INPUT_CLS =
  "h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand focus:border-brand font-montserrat";
const LABEL_CLS =
  "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-montserrat";
const SELECT_CLS =
  "h-11 bg-white border-slate-200 text-slate-900 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand font-montserrat";

interface StockTransferFormProps {
  onSuccess?: () => void;
}

export function StockTransferForm({ onSuccess }: StockTransferFormProps) {
  const { user } = useUser();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ─── Formulario ─────────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [originStock, setOriginStock] = useState<number | null>(null);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.company_id) return;

    const [productsRes, warehousesRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku, stock")
        .eq("company_id", user.company_id)
        .order("name"),
      supabase
        .from("warehouses")
        .select("id, name")
        .eq("company_id", user.company_id)
        .eq("is_active", true),
    ]);

    setProducts(productsRes.data ?? []);
    setWarehouses(warehousesRes.data ?? []);
  }, [user?.company_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Verificar stock en origen ──────────────────────────────────────────────
  useEffect(() => {
    async function checkOriginStock() {
      if (!selectedProduct || !fromWarehouseId) {
        setOriginStock(null);
        return;
      }

      const { data } = await supabase
        .from("warehouse_stock")
        .select("qty")
        .eq("warehouse_id", fromWarehouseId)
        .eq("product_id", selectedProduct.id)
        .single();

      setOriginStock(data?.qty ?? 0);
    }

    checkOriginStock();
  }, [selectedProduct, fromWarehouseId]);

  // ─── Filtro ─────────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const sameWarehouse = fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId;
  const exceededStock = originStock !== null && qty > originStock;

  // ─── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedProduct || !fromWarehouseId || !toWarehouseId || qty <= 0) {
      toast.error("Completa todos los campos obligatorios.");
      return;
    }

    if (sameWarehouse) {
      toast.error("El almacén de origen y destino no pueden ser el mismo.");
      return;
    }

    if (exceededStock) {
      toast.error("La cantidad excede el stock disponible en el origen.");
      return;
    }

    setLoading(true);
    try {
      const result = await transferStock({
        product_id: selectedProduct.id,
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        qty,
      });

      if (!result.success) {
        toast.error(result.error ?? "Error desconocido.");
        return;
      }

      toast.success(`${qty} unidades transferidas exitosamente.`);

      // Reset
      setSelectedProduct(null);
      setProductSearch("");
      setFromWarehouseId("");
      setToWarehouseId("");
      setQty(0);
      setOriginStock(null);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Error al transferir", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Producto */}
      <div className="relative">
        <label className={LABEL_CLS}>Producto *</label>
        {selectedProduct ? (
          <div className="flex items-center justify-between h-11 px-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-brand" />
              <span className="text-sm font-semibold text-slate-900">{selectedProduct.name}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedProduct.sku}</span>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedProduct(null); setProductSearch(""); setOriginStock(null); }}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar por nombre o SKU..."
                className={`${INPUT_CLS} pl-10`}
              />
            </div>
            <AnimatePresence>
              {showDropdown && productSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredProducts.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-400 text-center">Sin resultados</p>
                  ) : (
                    filteredProducts.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setProductSearch(p.name);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-brand" />
                          <span className="text-sm text-slate-900 font-medium">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{p.sku}</span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Depósitos: Origen → Destino */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div>
          <label className={LABEL_CLS}>Origen *</label>
          <Select value={fromWarehouseId} onValueChange={setFromWarehouseId}>
            <SelectTrigger className={SELECT_CLS}>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl">
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center pb-1">
          <div className="w-10 h-10 rounded-full bg-status-info/10 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-status-info" />
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Destino *</label>
          <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
            <SelectTrigger className={SELECT_CLS}>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl">
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Warnings */}
      {sameWarehouse && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-status-warn bg-status-warn/10 border border-status-warn/20 rounded-xl px-4 py-2.5 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          El almacén de origen y destino no pueden ser el mismo.
        </motion.div>
      )}

      {/* Stock disponible + Cantidad */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Stock Disponible en Origen</label>
          <div className="h-11 px-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl">
            <span className={`font-mono text-lg font-bold ${originStock !== null && originStock <= 5 ? "text-status-danger" : "text-slate-900"}`}>
              {originStock !== null ? originStock : "—"}
            </span>
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Cantidad a Transferir *</label>
          <Input
            type="number"
            min={1}
            max={originStock ?? undefined}
            value={qty || ""}
            onChange={(e) => setQty(Number(e.target.value))}
            placeholder="0"
            className={`${INPUT_CLS} font-mono text-center text-lg ${exceededStock ? "border-status-danger ring-1 ring-status-danger" : ""}`}
          />
        </div>
      </div>

      {exceededStock && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-status-danger bg-status-danger/10 border border-status-danger/20 rounded-xl px-4 py-2.5 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          La cantidad excede el stock disponible ({originStock} unidades).
        </motion.div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !!sameWarehouse || !!exceededStock}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-status-info text-white transition-all active:scale-[0.98] disabled:opacity-50 hover:opacity-90"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ArrowRightLeft className="w-5 h-5" />
        )}
        {loading ? "Transfiriendo..." : "Ejecutar Transferencia"}
      </button>
    </form>
  );
}
