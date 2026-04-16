"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Printer, MessageSquare, Truck, 
  CheckCircle2, Clock, FileText, AlertCircle,
  Building2, Calendar, Package, DollarSign,
  Loader2, ArrowRight, ShieldCheck, Camera,
  X, TrendingUp, TrendingDown, History,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTreasuryAccounts, registerTreasuryMovement } from "@/hooks/use-treasury";
import { useUser } from "@/hooks/use-user";

// ─── Price Comparison Badge ────────────────────────────────────────────────────
function PriceCompareBadge({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
        Primera compra
      </span>
    );
  }
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.01) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
        Sin cambio
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
      up
        ? "bg-status-danger/10 text-status-danger border-status-danger/20"
        : "bg-status-ok/10 text-status-ok border-status-ok/20"
    )}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type PurchaseStatus = "draft" | "confirmed" | "partial" | "received" | "cancelled";

interface PurchaseItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  qty: number;
  qty_received: number;
  unit_cost_usd: number;
  subtotal_usd: number;
  is_manual?: boolean;
}

interface Purchase {
  id: string;
  company_id: string;
  purchase_number: string | null;
  supplier_id: string | null;
  status: PurchaseStatus;
  subtotal_usd: number | null;
  total_usd: number | null;
  exchange_rate: number | null;
  total_bs: number | null;
  notes: string | null;
  expected_date: string | null;
  received_at: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_amount_usd: number | null;
  invoice_amount_bs: number | null;
  invoice_url: string | null;
  created_at: string;
  suppliers: { 
    name: string; 
    rif: string; 
    phone: string | null; 
    email: string | null; 
    address: string | null 
  } | null;
}

const TIMELINE: { status: PurchaseStatus; label: string; icon: any }[] = [
  { status: "draft",     label: "Borrador",   icon: FileText },
  { status: "confirmed", label: "Emitida",    icon: ShoppingBag },
  { status: "partial",   label: "En Camino",  icon: Truck },
  { status: "received",  label: "Recibida",   icon: CheckCircle2 },
];

function ShoppingBag(props: any) {
  return <Package {...props} />;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PurchaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user: currentUser } = useUser();

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Price history comparison per item
  const [priceComparisons, setPriceComparisons] = useState<Record<string, number | null>>({});
  
  // States for panels
  const [showReception, setShowReception] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    number: "",
    date: new Date().toISOString().split("T")[0],
    amount_usd: 0,
    amount_bs: 0
  });
  const [selectedTreasuryAccountId, setSelectedTreasuryAccountId] = useState("");

  // Treasury accounts for payment registration
  const { accounts: treasuryAccounts, loading: loadingTreasury } = useTreasuryAccounts(purchase?.company_id);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, suppliers(*)")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setPurchase(data as Purchase);
      
      // Monto por defecto de factura es el total de la orden
      setInvoiceForm(prev => ({
        ...prev,
        amount_usd: data.total_usd ?? 0,
        amount_bs: data.total_bs ?? 0
      }));

      const { data: itemsData } = await supabase
        .from("purchase_items")
        .select("*, products(name,sku)")
        .eq("purchase_id", id);
      
      const mapped = ((itemsData as any[]) ?? []).map(r => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.products?.name ?? "–",
        sku: r.products?.sku ?? "",
        qty: r.qty,
        qty_received: r.qty_received ?? 0,
        unit_cost_usd: r.unit_cost_usd,
        subtotal_usd: r.subtotal_usd,
        is_manual: r.is_manual ?? false
      }));
      setItems(mapped);

      // Initial receive qtys
      const init: Record<string, number> = {};
      mapped.forEach(it => { init[it.id] = Math.max(0, it.qty - it.qty_received); });
      setReceiveQtys(init);

      // Load price comparisons vs previous purchase per product
      if (data?.supplier_id) {
        const comparisons: Record<string, number | null> = {};
        await Promise.all(mapped.map(async (it) => {
          const { data: prevHistory } = await supabase
            .from("purchase_price_history")
            .select("unit_price_usd, purchased_at")
            .eq("product_id", it.product_id)
            .eq("supplier_id", data.supplier_id)
            .lt("purchase_order_id", id as string)
            .order("purchased_at", { ascending: false })
            .limit(1);
          comparisons[it.product_id] = (prevHistory as any[])?.[0]?.unit_price_usd ?? null;
        }));
        setPriceComparisons(comparisons);
      }

    } catch (e: any) {
      toast.error("Error al cargar orden");
      router.push("/dashboard/compras/ordenes");
    } finally {
      setLoading(false);
    }
  }, [id, supabase, router]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // ── Reception Logic ────────────────────────────────────────────────────────
  const handleConfirmReception = async () => {
    if (!purchase) return;
    setIsProcessing(true);
    try {
      let isFullyReceived = true;
      const companyId = (purchase as any).company_id ?? null;

      let manualItemsSkipped = 0;

      for (const item of items) {
        const toReceive = Math.min(receiveQtys[item.id] ?? 0, item.qty - item.qty_received);
        if (toReceive <= 0) {
          if (item.qty_received < item.qty) isFullyReceived = false;
          continue;
        }

        const newTotalReceived = item.qty_received + toReceive;
        if (newTotalReceived < item.qty) isFullyReceived = false;

        // 1. Update received qty in line
        await supabase.from("purchase_items").update({ qty_received: newTotalReceived } as any).eq("id", item.id);

        if (item.is_manual) {
           manualItemsSkipped += toReceive;
           continue; // Do not update stock for manual items
        }

        // 2. Update actual stock in inventory
        // Assuming we have a products table and we want to update stock_qty
        const { data: prod } = await supabase.from("products").select("stock_qty").eq("id", item.product_id).single();
        const currentStock = prod?.stock_qty ?? 0;
        await supabase.from("products").update({ stock_qty: currentStock + toReceive } as any).eq("id", item.product_id);

        // 3. Register movement
        await supabase.from("stock_movements").insert({
          company_id: purchase.company_id,
          product_id: item.product_id,
          type: "IN",
          qty: toReceive,
          reason: `Recepción de Orden ${purchase.purchase_number}`,
          user_id: currentUser?.id,
          entity_type: "purchase",
          entity_id: purchase.id
        } as any);
      }

      await supabase.from("purchases").update({ 
        status: isFullyReceived ? "received" : "partial",
        received_at: isFullyReceived ? new Date().toISOString() : null
      } as any).eq("id", purchase.id);

      toast.success(isFullyReceived ? "Orden recibida por completo" : "Recepción registrada");
      if (manualItemsSkipped > 0) {
        toast.warning(`${manualItemsSkipped} productos manuales no actualizaron inventario automáticamente`, { duration: 6000 });
      }
      setShowReception(false);
      fetchDetail();
    } catch (e: any) {
      toast.error("Error al procesar recepción", { description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Invoice Logic ─────────────────────────────────────────────────────────
  const handleRegisterInvoice = async () => {
    if (!purchase) return;
    if (!invoiceForm.number) { toast.error("El número de factura es obligatorio"); return; }
    if (!selectedTreasuryAccountId) { toast.error("Selecciona una cuenta de origen para el pago"); return; }

    setIsProcessing(true);
    try {
      // 1. Update purchase record
      await supabase.from("purchases").update({
        invoice_number: invoiceForm.number,
        invoice_date: invoiceForm.date,
        invoice_amount_usd: invoiceForm.amount_usd,
        invoice_amount_bs: invoiceForm.amount_bs,
      } as any).eq("id", purchase.id);

      // 2. Create expense record in Finanzas/CxP
      await supabase.from("expenses").insert({
        company_id: purchase.company_id,
        supplier_id: purchase.supplier_id,
        description: `Factura ${invoiceForm.number} de OC ${purchase.purchase_number}`,
        amount_usd: invoiceForm.amount_usd,
        amount_bs: invoiceForm.amount_bs,
        status: "pending",
        date: invoiceForm.date,
        type: "compra_directa",
        purchase_id: purchase.id
      } as any);

      // 3. Register treasury movement (salida)
      const selectedAccount = treasuryAccounts.find(a => a.id === selectedTreasuryAccountId);
      const movementResult = await registerTreasuryMovement({
        companyId: purchase.company_id,
        accountId: selectedTreasuryAccountId,
        type: "salida",
        amount: invoiceForm.amount_usd,
        currency: selectedAccount?.currency ?? "USD",
        description: `Pago Factura ${invoiceForm.number} – OC ${purchase.purchase_number}`,
        category: "compras",
        originModule: "compras",
        referenceId: purchase.id,
      });

      // 4. Low balance alerts
      if (movementResult.isNegativeOrZero) {
        toast.warning(`La cuenta "${movementResult.accountName}" quedó con saldo $${movementResult.newBalance.toFixed(2)}`, { duration: 6000 });
      } else if (movementResult.isLowBalance) {
        toast.warning(`Saldo bajo en "${movementResult.accountName}": $${movementResult.newBalance.toFixed(2)}`, { duration: 5000 });
      }

      toast.success("Factura registrada vinculada a Finanzas y Tesorería");
      setShowInvoice(false);
      setSelectedTreasuryAccountId("");
      fetchDetail();
    } catch (e: any) {
      toast.error("Error al registrar factura", { description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  const shareWhatsApp = () => {
    if (!purchase) return;
    const msg = `Hola ${purchase.suppliers?.name}, te adjunto mi Orden de Compra ${purchase.purchase_number}. Saludos.`;
    window.open(`https://wa.me/${purchase.suppliers?.phone?.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" /></div>;
  if (!purchase) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-fade-in px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-surface-card border border-border text-text-3 hover:text-text-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-montserrat font-bold text-text-1">{purchase.purchase_number}</h1>
              <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", 
                purchase.status === 'received' ? "bg-status-ok/10 text-status-ok border-status-ok/20" : 
                purchase.status === 'cancelled' ? "bg-status-danger/10 text-status-danger border-status-danger/20" : 
                "bg-brand/10 text-brand border-brand/20")}>
                {purchase.status}
              </span>
            </div>
            <p className="text-xs text-text-3 font-medium">Emitida el {format(new Date(purchase.created_at), "dd 'de' MMM, yyyy", { locale: es })}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 text-xs font-bold font-montserrat bg-surface-card border border-border text-text-1 rounded-xl hover:bg-surface-base transition-all flex items-center gap-2">
            <Printer className="w-4 h-4" /> Exportar PDF
          </button>
          <button onClick={shareWhatsApp} className="px-4 py-2 text-xs font-bold font-montserrat bg-status-ok/10 text-status-ok border border-status-ok/20 rounded-xl hover:bg-status-ok hover:text-white transition-all flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Enviar por WhatsApp
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Timeline Paso 4.3 */}
          <Card className="p-6 bg-surface-card border-border overflow-hidden">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-border" />
              <div 
                className="absolute top-4 left-6 h-0.5 bg-brand-gradient transition-all duration-200 ease-out" 
                style={{ width: `${(Math.max(0, TIMELINE.findIndex(t => t.status === purchase.status)) / (TIMELINE.length - 1)) * 100}%` }}
              />
              {TIMELINE.map((item, idx) => {
                const currentIdx = TIMELINE.findIndex(t => t.status === purchase.status);
                const isActive = idx === currentIdx;
                const isDone = idx < currentIdx;
                return (
                  <div key={item.status} className="flex flex-col items-center gap-2 z-10">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all", 
                      isDone ? "bg-brand border-brand shadow-brand" : 
                      isActive ? "bg-brand/10 border-brand ring-4 ring-brand/5" : "bg-surface-base border-border")}>
                      <item.icon className={cn("w-4 h-4", isDone ? "text-white" : isActive ? "text-brand" : "text-text-3")} />
                    </div>
                    <p className={cn("text-[10px] font-bold text-center", isActive ? "text-brand" : isDone ? "text-text-1" : "text-text-3")}>{item.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Supplier & Info Section Paso 4.2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold font-montserrat text-text-1 flex items-center gap-2 border-b border-border pb-3">
                <Building2 className="w-4 h-4 text-brand" /> Datos del Proveedor
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Proveedor</p>
                  <p className="text-sm font-bold text-text-1">{purchase.suppliers?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">RIF</p>
                  <p className="text-xs text-text-2 font-mono">{purchase.suppliers?.rif}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Teléfono</p>
                    <p className="text-xs text-text-2">{purchase.suppliers?.phone || "–"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Email</p>
                    <p className="text-xs text-text-2">{purchase.suppliers?.email || "–"}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold font-montserrat text-text-1 flex items-center gap-2 border-b border-border pb-3">
                <Calendar className="w-4 h-4 text-brand" /> Logística & Fechas
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-base flex items-center justify-center">
                    <Clock className="w-5 h-5 text-text-3" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-3 uppercase">Programado para</p>
                    <p className="text-sm font-bold text-text-1">
                      {purchase.expected_date ? format(new Date(purchase.expected_date + "T00:00:00"), "dd/MM/yyyy") : "No definida"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", purchase.received_at ? "bg-status-ok/10" : "bg-surface-base")}>
                    <Truck className={cn("w-5 h-5", purchase.received_at ? "text-status-ok" : "text-text-3")} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-3 uppercase">Entregado el</p>
                    <p className="text-sm font-bold text-text-1">
                      {purchase.received_at ? format(new Date(purchase.received_at), "dd/MM/yyyy HH:mm") : "Pendiente"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Items List Paso 4.2 */}
          <Card className="overflow-hidden bg-surface-card border-border">
            <div className="p-4 bg-surface-base/30 border-b border-border">
              <h3 className="text-sm font-bold font-montserrat text-text-1">Productos en la Orden</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3 text-center">Origen</th>
                    <th className="px-5 py-3 text-center">Cant.</th>
                    <th className="px-5 py-3 text-center">Recibido</th>
                    <th className="px-5 py-3 text-right">Unitario (USD)</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map(it => (
                    <tr key={it.id} className="hover:bg-surface-hover/20">
                      <td className="px-5 py-4">
                        <p className="font-bold text-text-1">{it.product_name}</p>
                        {it.sku && <p className="text-[10px] text-text-3 font-mono">{it.sku}</p>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {it.is_manual ? (
                          <span className="bg-surface-elevated border border-border text-text-3 px-2 py-0.5 rounded-md text-[10px] font-bold">Manual</span>
                        ) : (
                          <span className="bg-[#6B46C1]/10 border border-[#6B46C1]/20 text-[#6B46C1] px-2 py-0.5 rounded-md text-[10px] font-bold">Catálogo</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-text-1">{it.qty}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={cn("font-bold", it.qty_received >= it.qty ? "text-status-ok" : "text-status-warn")}>
                          {it.qty_received}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-text-2">${it.unit_cost_usd.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-bold text-text-1 font-mono">${it.subtotal_usd.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-base/50 font-montserrat">
                  <tr>
                    <td colSpan={5} className="px-5 py-5 text-right font-bold text-text-1 uppercase text-xs">Total Orden:</td>
                    <td className="px-5 py-5 text-right">
                      <p className="text-xl font-bold text-brand font-mono">${purchase.total_usd?.toFixed(2)}</p>
                      <p className="text-[10px] text-text-3 font-mono">Bs. {purchase.total_bs?.toLocaleString("es-VE")}</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* ── Price History Section ── */}
          <Card className="overflow-hidden bg-surface-card border-border">
            <div className="p-4 bg-surface-base/30 border-b border-border">
              <h3 className="text-sm font-bold font-montserrat text-text-1 flex items-center gap-2">
                <History className="w-4 h-4 text-brand" />
                Historial de Precios en esta Orden
              </h3>
              <p className="text-[11px] text-text-3 mt-0.5">Comparación vs compra anterior con el mismo proveedor</p>
            </div>
            <div className="divide-y divide-border">
              {items.map((it) => {
                const prevPrice = priceComparisons[it.product_id];
                return (
                  <div key={it.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover/10 transition-colors">
                    <div>
                      <p className="font-bold text-text-1 text-sm">{it.product_name}</p>
                      <p className="text-[10px] text-text-3 font-mono">{it.sku}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {prevPrice !== undefined && prevPrice !== null && (
                        <div className="text-right">
                          <p className="text-[10px] text-text-3">Anterior</p>
                          <p className="text-xs font-mono text-text-2">${prevPrice.toFixed(4)}</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-[10px] text-text-3">Esta compra</p>
                        <p className="text-sm font-bold font-mono text-text-1">${it.unit_cost_usd.toFixed(4)}</p>
                      </div>
                      <PriceCompareBadge
                        current={it.unit_cost_usd}
                        previous={prevPrice !== undefined ? prevPrice : null}
                      />
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="py-8 text-center text-text-3 text-sm">Sin productos</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Actions Paso 4.4 & 4.5 */}
        <div className="space-y-6">
          
          {/* Status Actions Paso 4.4 */}
          {purchase.status === "confirmed" || purchase.status === "partial" ? (
            <Card className="p-5 border-2 border-dashed border-brand/20 bg-brand/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-brand">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand">Recepción de Mercancía</h3>
                  <p className="text-[10px] text-text-3">Confirma la llegada de los ítems</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {items.filter(it => it.qty_received < it.qty).map(it => (
                  <div key={it.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-text-1 truncate max-w-[150px]">{it.product_name}</span>
                      <span className="text-text-3">Faltan {it.qty - it.qty_received}</span>
                    </div>
                    <Input 
                      type="number" 
                      min={0}
                      max={it.qty - it.qty_received}
                      value={receiveQtys[it.id] ?? 0}
                      onChange={e => setReceiveQtys(prev => ({ ...prev, [it.id]: +e.target.value }))}
                      className="h-9 bg-white border-brand/20 text-text-1 text-center font-bold"
                    />
                  </div>
                ))}
              </div>

              <button 
                disabled={isProcessing || !Object.values(receiveQtys).some(v => v > 0)}
                onClick={handleConfirmReception}
                className="w-full py-3 bg-brand text-white rounded-xl font-bold text-xs shadow-brand hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />} Confirmar Recepción
              </button>
            </Card>
          ) : null}

          {/* Registrar Factura Paso 4.5 */}
          {purchase.status === "received" && !purchase.invoice_number && (
            <Card className="p-5 border-2 border-dashed border-status-info/20 bg-status-info/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-status-info text-white flex items-center justify-center shadow-info">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-status-info">Registrar Factura</h3>
                  <p className="text-[10px] text-text-3">Registra el documento legal para Finanzas</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-3 uppercase">Nº de Factura</label>
                  <Input 
                    placeholder="Ej: F-12345"
                    value={invoiceForm.number}
                    onChange={e => setInvoiceForm(p => ({ ...p, number: e.target.value }))}
                    className="h-10 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-3 uppercase">Fecha Factura</label>
                  <Input 
                    type="date"
                    value={invoiceForm.date}
                    onChange={e => setInvoiceForm(p => ({ ...p, date: e.target.value }))}
                    className="h-10 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-3 uppercase">Monto USD</label>
                    <Input
                      type="number"
                      value={invoiceForm.amount_usd}
                      onChange={e => setInvoiceForm(p => ({ ...p, amount_usd: +e.target.value }))}
                      className="h-10 bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-3 uppercase">Monto BS</label>
                    <Input
                      type="number"
                      value={invoiceForm.amount_bs}
                      onChange={e => setInvoiceForm(p => ({ ...p, amount_bs: +e.target.value }))}
                      className="h-10 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Treasury Account Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-3 uppercase flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Cuenta de origen
                  </label>
                  {loadingTreasury ? (
                    <div className="flex items-center gap-2 text-xs text-text-3 py-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cargando cuentas...
                    </div>
                  ) : treasuryAccounts.length === 0 ? (
                    <p className="text-[10px] text-status-warn font-medium py-1">
                      No hay cuentas de tesorería activas
                    </p>
                  ) : (
                    <select
                      value={selectedTreasuryAccountId}
                      onChange={e => setSelectedTreasuryAccountId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {treasuryAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency}) — Saldo: {acc.currency === "USD" ? "$" : "Bs."}{Number(acc.current_balance).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <button
                disabled={isProcessing || !invoiceForm.number || !selectedTreasuryAccountId}
                onClick={handleRegisterInvoice}
                className="w-full py-3 bg-status-info text-white rounded-xl font-bold text-xs shadow-info hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Registrar Factura en CxP
              </button>
            </Card>
          )}

          {/* Factura Registrada Display */}
          {purchase.invoice_number && (
            <Card className="p-5 bg-surface-base border border-border space-y-4">
              <h3 className="text-sm font-bold font-montserrat text-text-1">Documento Fiscal</h3>
              <div className="space-y-2 p-3 bg-white dark:bg-black/20 rounded-xl border border-border bg-surface-card">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-text-3">Nº Factura:</span>
                    <span className="font-bold text-text-1">{purchase.invoice_number}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-text-3">Fecha:</span>
                    <span className="text-text-2">{purchase.invoice_date && format(new Date(purchase.invoice_date + "T00:00:00"), "dd/MM/yyyy")}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs border-t border-border mt-2 pt-2">
                    <span className="text-text-3 font-bold uppercase text-[9px]">Monto Registrado</span>
                    <span className="font-bold text-status-ok font-mono">${purchase.invoice_amount_usd?.toFixed(2)}</span>
                 </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Box(props: any) {
  return <Package {...props} />;
}
