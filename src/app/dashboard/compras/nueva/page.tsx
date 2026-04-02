"use client";

import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Package, Truck, Loader2,
  TrendingDown, TrendingUp, Info, Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { calculateProratedCosts } from "@/lib/calculations";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function NuevaCompraPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <NuevaCompraContent />
    </Suspense>
  );
}

// ─── Price Hint Component ─────────────────────────────────────────────────────
interface PriceHint {
  lastPriceWithSupplier: number | null;
  lastPurchaseDateWithSupplier: string | null;
  bestHistoricPrice: number | null;
  bestHistoricSupplierName: string | null;
}

function ProductPriceHint({ hint }: { hint: PriceHint | null }) {
  if (!hint) return null;

  const { lastPriceWithSupplier, lastPurchaseDateWithSupplier, bestHistoricPrice, bestHistoricSupplierName } = hint;

  const lines: React.ReactNode[] = [];

  if (lastPriceWithSupplier !== null && lastPurchaseDateWithSupplier) {
    const daysAgo = formatDistanceToNow(new Date(lastPurchaseDateWithSupplier), {
      addSuffix: false,
      locale: es,
    });
    lines.push(
      <span key="last" className="flex items-center gap-1.5 text-text-3">
        <Clock className="w-3 h-3 flex-shrink-0 text-brand" />
        Último precio con este proveedor:
        <span className="font-bold text-text-1 font-mono">${lastPriceWithSupplier.toFixed(4)}</span>
        <span className="opacity-70">(hace {daysAgo})</span>
      </span>
    );
  } else {
    lines.push(
      <span key="first" className="flex items-center gap-1.5 text-[#7C4DFF]/80">
        <Info className="w-3 h-3 flex-shrink-0" />
        Primera compra de este producto con este proveedor
      </span>
    );
  }

  if (bestHistoricPrice !== null && bestHistoricSupplierName) {
    const isBetter = lastPriceWithSupplier === null || bestHistoricPrice < lastPriceWithSupplier;
    lines.push(
      <span key="best" className={cn("flex items-center gap-1.5", isBetter ? "text-status-ok/80" : "text-text-3")}>
        {isBetter ? <TrendingDown className="w-3 h-3 flex-shrink-0" /> : <TrendingUp className="w-3 h-3 flex-shrink-0" />}
        Mejor precio histórico:
        <span className="font-bold font-mono">${bestHistoricPrice.toFixed(4)}</span>
        <span className="opacity-70">— {bestHistoricSupplierName}</span>
      </span>
    );
  }

  if (lines.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 py-1.5 px-3 bg-surface-base/60 rounded-lg border border-white/5 text-[11px] mt-1">
      {lines}
    </div>
  );
}

// ─── Cart Item with price hint ────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  unit_cost_usd: number;
  priceHint?: PriceHint | null;
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function NuevaCompraContent() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bcvRate, setBcvRate] = useState(0);

  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [purchaseNumber, setPurchaseNumber] = useState("");
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    async function init() {
      if (!user?.company_id) return;
      try {
        const [supRes, warRes, proRes, rateRes] = await Promise.all([
          supabase.from("suppliers").select("*").eq("company_id", user.company_id),
          supabase.from("warehouses").select("*").eq("company_id", user.company_id).eq("is_active", true),
          supabase.from("products").select("*").eq("company_id", user.company_id),
          supabase.from("exchange_rates").select("rate_bs").order("fetched_at", { ascending: false }).limit(1).single(),
        ]);

        setSuppliers(supRes.data || []);
        setWarehouses(warRes.data || []);
        setProducts(proRes.data || []);
        setBcvRate((rateRes.data as any)?.rate_bs ?? 0);
      } catch {
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  // ── Fetch price hint for a product+supplier pair ──────────────────────────
  const fetchPriceHint = useCallback(async (productId: string, supplierId: string): Promise<PriceHint> => {
    if (!user?.company_id) return { lastPriceWithSupplier: null, lastPurchaseDateWithSupplier: null, bestHistoricPrice: null, bestHistoricSupplierName: null };

    // Last price with THIS supplier
    const { data: withSupplier } = await supabase
      .from("purchase_price_history")
      .select("unit_price_usd, purchased_at")
      .eq("company_id", user.company_id)
      .eq("product_id", productId)
      .eq("supplier_id", supplierId)
      .order("purchased_at", { ascending: false })
      .limit(1);

    // Best price across ALL suppliers
    const { data: allHistory } = await supabase
      .from("purchase_price_history")
      .select("unit_price_usd, supplier_id, suppliers(name)")
      .eq("company_id", user.company_id)
      .eq("product_id", productId)
      .order("unit_price_usd", { ascending: true })
      .limit(1);

    const lastRecord = withSupplier?.[0] as any;
    const bestRecord = allHistory?.[0] as any;

    return {
      lastPriceWithSupplier: lastRecord?.unit_price_usd ?? null,
      lastPurchaseDateWithSupplier: lastRecord?.purchased_at ?? null,
      bestHistoricPrice: bestRecord?.unit_price_usd ?? null,
      bestHistoricSupplierName: bestRecord?.suppliers?.name ?? null,
    };
  }, [user, supabase]);

  // ── Add item to cart ──────────────────────────────────────────────────────
  const addItemToPurchase = async (productId: string) => {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Avoid duplicates
    if (cart.some((c) => c.id === productId)) {
      toast.info("Este producto ya está en la orden");
      return;
    }

    const newItem: CartItem = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      qty: 1,
      unit_cost_usd: product.cost_usd || 0,
      priceHint: null,
    };

    setCart((prev) => [...prev, newItem]);

    // Load price hint if supplier selected
    if (selectedSupplier) {
      const hint = await fetchPriceHint(productId, selectedSupplier);
      setCart((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, priceHint: hint } : item))
      );
    }
  };

  // ── When supplier changes, refresh hints for all cart items ───────────────
  useEffect(() => {
    if (!selectedSupplier || cart.length === 0) return;
    cart.forEach(async (item) => {
      const hint = await fetchPriceHint(item.id, selectedSupplier);
      setCart((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, priceHint: hint } : c))
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplier]);

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setCart((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const proratedItems = useMemo(() => {
    return calculateProratedCosts(cart, freightAmount);
  }, [cart, freightAmount]);

  const subtotal = proratedItems.reduce((acc, item) => acc + item.subtotal_usd, 0);
  const grandTotal = subtotal + freightAmount;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSavePurchase = async () => {
    if (!selectedSupplier) return toast.error("Selecciona un proveedor");
    if (!selectedWarehouse) return toast.error("Selecciona un almacén");
    if (cart.length === 0) return toast.error("Agrega productos a la compra");
    if (!user?.company_id) return;

    setSaving(true);
    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplier);

      // 1. Crear Compra
      const { data: purchase, error: pErr } = await supabase
        .from("purchases")
        .insert({
          company_id: user.company_id,
          supplier_id: selectedSupplier,
          warehouse_id: selectedWarehouse,
          purchase_number: purchaseNumber,
          subtotal_usd: subtotal,
          freight_usd: freightAmount,
          total_usd: grandTotal,
          total_bs: grandTotal * bcvRate,
          exchange_rate: bcvRate,
          status: "received",
          received_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (pErr) throw pErr;

      // 2. Crear Items
      const itemsPayload = proratedItems.map((item) => ({
        purchase_id: purchase.id,
        product_id: item.id,
        qty: item.qty,
        unit_cost_usd: item.unit_cost_usd,
        prorated_freight_usd: item.prorated_freight_usd,
        total_unit_cost_usd: item.total_unit_cost_usd,
        subtotal_usd: item.subtotal_usd,
      }));

      const { error: iErr } = await supabase.from("purchase_items").insert(itemsPayload as any);
      if (iErr) throw iErr;

      // 3. Actualizar Inventario + Historial de Precios
      for (const item of cart) {
        // Stock global
        await supabase.rpc("increment_stock", { p_id: item.id, qty_to_add: item.qty });

        // Stock por almacén
        const { data: stockEntry } = await supabase
          .from("warehouse_stock")
          .select("*")
          .eq("warehouse_id", selectedWarehouse)
          .eq("product_id", item.id)
          .single();

        if (stockEntry) {
          await supabase
            .from("warehouse_stock")
            .update({ qty: stockEntry.qty + item.qty })
            .eq("id", stockEntry.id);
        } else {
          await supabase
            .from("warehouse_stock")
            .insert({ warehouse_id: selectedWarehouse, product_id: item.id, qty: item.qty });
        }

        // Actualizar costo del producto
        await supabase
          .from("products")
          .update({
            cost_usd: item.unit_cost_usd,
            last_purchase_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        // 4. Insertar en historial de precios ─ PASO 1 del requerimiento
        await supabase.from("purchase_price_history").insert({
          company_id: user.company_id,
          product_id: item.id,
          supplier_id: selectedSupplier,
          purchase_order_id: purchase.id,
          unit_price_usd: item.unit_cost_usd,
          unit_price_bs: item.unit_cost_usd * bcvRate,
          bcv_rate: bcvRate,
          quantity: item.qty,
          purchased_at: new Date().toISOString(),
        } as any);
      }

      toast.success("Compra registrada y stock actualizado");
      router.push("/dashboard/compras/ordenes");
    } catch (err: any) {
      toast.error("Error al guardar compra", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-syne font-bold">Registrar Compra a Proveedor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-surface-card border-border space-y-4">
            <h3 className="text-sm font-bold text-text-3 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4" /> Productos a Comprar
            </h3>

            <div className="flex gap-2">
              <Select onValueChange={addItemToPurchase} value="">
                <SelectTrigger className="flex-1 bg-surface-base border-border">
                  <SelectValue placeholder={
                    selectedSupplier
                      ? "Seleccionar producto..."
                      : "Selecciona primero un proveedor"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-white">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left py-2 border-b border-white/5">
                    <th className="pb-2 text-[10px] uppercase font-bold text-text-3">Producto</th>
                    <th className="pb-2 text-[10px] uppercase font-bold text-text-3 w-24">Cant.</th>
                    <th className="pb-2 text-[10px] uppercase font-bold text-text-3 w-32">Costo U.</th>
                    <th className="pb-2 text-[10px] uppercase font-bold text-text-3 w-32 text-right">Prorrateo</th>
                    <th className="pb-2 text-[10px] uppercase font-bold text-text-3 w-32 text-right">Total U.</th>
                    <th className="pb-2 text-[10px] uppercase font-bold text-text-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {proratedItems.map((item, idx) => {
                    const cartItem = cart[idx];
                    return (
                      <tr key={idx} className="group">
                        <td className="py-3 pr-3">
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-[10px] text-text-3 mt-0.5 font-mono uppercase">{item.sku}</p>
                          {/* Price hint below product name */}
                          {cartItem?.priceHint !== undefined && (
                            <ProductPriceHint hint={cartItem.priceHint ?? null} />
                          )}
                        </td>
                        <td className="py-3">
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                            className="h-8 bg-surface-base border-none"
                          />
                        </td>
                        <td className="py-3">
                          <Input
                            type="number"
                            step="0.0001"
                            value={item.unit_cost_usd}
                            onChange={(e) => updateItem(idx, "unit_cost_usd", Number(e.target.value))}
                            className="h-8 bg-surface-base border-none"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-xs text-brand font-bold">
                            +${(item.prorated_freight_usd / item.qty).toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-sm font-bold text-white">
                            ${item.total_unit_cost_usd.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-2 text-status-danger opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cart.length === 0 && (
                <div className="py-12 text-center text-text-3 text-sm">
                  No hay productos cargados
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Config Column */}
        <div className="space-y-6">
          <Card className="p-6 bg-surface-card border-border space-y-6">
            <h3 className="text-sm font-bold text-text-3 uppercase tracking-widest">
              Configuración de Compra
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-text-3 font-bold uppercase tracking-wider">
                  Proveedor
                </label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="bg-surface-base border-border">
                    <SelectValue placeholder="Elegir..." />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card border-border text-white">
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-3 font-bold uppercase tracking-wider">
                  Almacén Destino
                </label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger className="bg-surface-base border-border">
                    <SelectValue placeholder="Elegir..." />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card border-border text-white">
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-3 font-bold uppercase tracking-wider">
                  Nº Factura / Control
                </label>
                <Input
                  value={purchaseNumber}
                  onChange={(e) => setPurchaseNumber(e.target.value)}
                  placeholder="FAC-1234..."
                  className="bg-surface-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-3 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-3 h-3" /> Flete / Gastos de Envío ($)
                </label>
                <Input
                  type="number"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(Number(e.target.value))}
                  className="bg-surface-base"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center text-text-3">
                <span className="text-sm">Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-brand">
                <span className="text-sm">Flete Total</span>
                <span className="font-mono">+${freightAmount.toFixed(2)}</span>
              </div>
              {bcvRate > 0 && (
                <div className="flex justify-between items-center text-text-3 text-xs">
                  <span>Total Bs. (Tasa {bcvRate.toFixed(2)})</span>
                  <span className="font-mono">Bs. {(grandTotal * bcvRate).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white pt-2">
                <span className="text-lg font-syne font-bold">Total Compra</span>
                <span className="text-2xl font-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSavePurchase}
              disabled={saving}
              className="w-full py-4 bg-brand-gradient text-white rounded-2xl shadow-brand font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Recepción"}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
