"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { createStockAdjustment } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  RefreshCw,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Package,
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

const REASONS = [
  "Compra a proveedor",
  "Producto dañado",
  "Producto vencido",
  "Ajuste por inventario físico",
  "Devolución de cliente",
  "Merma / Pérdida",
  "Donación",
  "Uso interno",
  "Otro",
];

const INPUT_CLS =
  "h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand focus:border-brand font-montserrat";
const LABEL_CLS =
  "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-montserrat";
const SELECT_CLS =
  "h-11 bg-white border-slate-200 text-slate-900 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand font-montserrat";

interface StockAdjustmentFormProps {
  onSuccess?: () => void;
}

export function StockAdjustmentForm({ onSuccess }: StockAdjustmentFormProps) {
  const { user } = useUser();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ─── Formulario ─────────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [operation, setOperation] = useState<"IN" | "OUT">("IN");
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

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

  // ─── Filtro de productos ────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  // ─── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalReason = reason === "Otro" ? customReason : reason;

    if (!selectedProduct || !warehouseId || !finalReason || qty <= 0) {
      toast.error("Completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const result = await createStockAdjustment({
        product_id: selectedProduct.id,
        warehouse_id: warehouseId,
        type: operation,
        qty,
        reason: finalReason,
      });

      if (!result.success) {
        toast.error(result.error ?? "Error desconocido.");
        return;
      }

      toast.success(
        `${operation === "IN" ? "Entrada" : "Salida"} de ${qty} unidades registrada.`
      );

      // Reset
      setSelectedProduct(null);
      setProductSearch("");
      setQty(0);
      setReason("");
      setCustomReason("");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Error al registrar ajuste", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de Operación */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOperation("IN")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl border-2 font-bold text-sm transition-all ${
            operation === "IN"
              ? "border-status-ok bg-status-ok/5 text-status-ok shadow-ok"
              : "border-border bg-surface-card text-text-3 hover:border-status-ok/30"
          }`}
        >
          <ArrowDownCircle className="w-5 h-5" />
          Entrada de Stock
        </button>
        <button
          type="button"
          onClick={() => setOperation("OUT")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl border-2 font-bold text-sm transition-all ${
            operation === "OUT"
              ? "border-status-danger bg-status-danger/5 text-status-danger shadow-danger"
              : "border-border bg-surface-card text-text-3 hover:border-status-danger/30"
          }`}
        >
          <ArrowUpCircle className="w-5 h-5" />
          Salida de Stock
        </button>
      </div>

      {/* Producto con búsqueda */}
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
              onClick={() => { setSelectedProduct(null); setProductSearch(""); }}
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

      {/* Depósito + Cantidad */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Depósito *</label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
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
        <div>
          <label className={LABEL_CLS}>Cantidad *</label>
          <Input
            type="number"
            min={1}
            value={qty || ""}
            onChange={(e) => setQty(Number(e.target.value))}
            placeholder="0"
            className={`${INPUT_CLS} font-mono text-center text-lg`}
          />
        </div>
      </div>

      {/* Motivo */}
      <div>
        <label className={LABEL_CLS}>Motivo del Ajuste *</label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className={SELECT_CLS}>
            <SelectValue placeholder="Seleccionar motivo" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 rounded-xl">
            {REASONS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reason === "Otro" && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <label className={LABEL_CLS}>Especificar Motivo *</label>
          <Input
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Describe el motivo del ajuste..."
            className={INPUT_CLS}
          />
        </motion.div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
          operation === "IN"
            ? "bg-status-ok text-white shadow-ok hover:opacity-90"
            : "bg-status-danger text-white shadow-danger hover:opacity-90"
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : operation === "IN" ? (
          <Plus className="w-5 h-5" />
        ) : (
          <Minus className="w-5 h-5" />
        )}
        {loading
          ? "Registrando..."
          : `Registrar ${operation === "IN" ? "Entrada" : "Salida"}`}
      </button>
    </form>
  );
}
