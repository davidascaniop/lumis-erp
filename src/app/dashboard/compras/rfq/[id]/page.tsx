"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Calendar as CalIcon, Building2, Package, CheckCircle2, ChevronRight, Calculator, ShoppingBag, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [rfq, setRfq] = useState<any>(null);
  
  // Convert Dialog
  const [convertOpen, setConvertOpen] = useState(false);
  const [winningSupplier, setWinningSupplier] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Quote input (simulate provider response for DEMO purposes)
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSupplier, setQuoteSupplier] = useState<string>("");
  const [quoteForm, setQuoteForm] = useState<Record<string, string>>({}); // product_id -> price str

  const fetchRfq = useCallback(async () => {
    if (!user?.company_id || !params.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("purchase_rfq").select(`
        *,
        items:purchase_rfq_items(*, products(name, sku, cost_usd)),
        suppliers:purchase_rfq_suppliers(*, suppliers(name, rif)),
        quotes:purchase_rfq_quotes(*)
      `).eq("id", params.id).single();

      if (error) throw error;
      setRfq(data);
    } catch (err: any) {
      toast.error("Error cargando RFQ", { description: err.message });
      router.push("/dashboard/compras/rfq");
    } finally {
      setLoading(false);
    }
  }, [user, params.id, supabase, router]);

  useEffect(() => { fetchRfq(); }, [fetchRfq]);

  // Derived calculations
  const products = useMemo(() => rfq?.items || [], [rfq]);
  const consultedSuppliers = useMemo(() => rfq?.suppliers || [], [rfq]);
  const quotes = useMemo(() => rfq?.quotes || [], [rfq]);

  const responsesCount = consultedSuppliers.filter((s:any) => s.status === 'Respondida').length;
  const canConvert = responsesCount > 0 && rfq?.status !== 'Cancelada' && rfq?.status !== 'Convertida';

  // Analysis structured data
  const matrix = useMemo(() => {
     if (!rfq) return [];
     /* 
       Row format: 
       { product_id, name, qty, prices: { [supplier_id]: price }, min_price }
     */
     return products.map((item: any) => {
        const prices: Record<string, number> = {};
        const pQuotes = quotes.filter((q:any) => q.product_id === item.product_id);
        
        let minPrice = Infinity;
        for (const q of pQuotes) {
           prices[q.supplier_id] = Number(q.unit_price_usd);
           if (Number(q.unit_price_usd) < minPrice) minPrice = Number(q.unit_price_usd);
        }

        return {
           product_id: item.product_id,
           name: item.products?.name,
           sku: item.products?.sku,
           qty: Number(item.quantity_requested),
           prices,
           min_price: minPrice === Infinity ? null : minPrice
        };
     });
  }, [rfq, products, quotes]);

  const supplierTotals = useMemo(() => {
     const totals: Record<string, number> = {};
     for (const sup of consultedSuppliers) {
        if (sup.status !== "Respondida") continue;
        let t = 0;
        let isComplete = true; // To check if they quoted all items
        for (const row of matrix) {
           if (row.prices[sup.supplier_id] !== undefined) {
             t += row.prices[sup.supplier_id] * row.qty;
           } else {
             isComplete = false;
           }
        }
        if (isComplete) totals[sup.supplier_id] = t;
     }
     return totals;
  }, [consultedSuppliers, matrix]);

  const bestSupplierId = useMemo(() => {
     let bestId = null;
     let min = Infinity;
     for (const [id, val] of Object.entries(supplierTotals)) {
        if (val < min) { min = val; bestId = id; }
     }
     return bestId;
  }, [supplierTotals]);

  // -- Actions --
  const handleSimulateQuote = async () => {
    // This allows the user to input fake quotes for testing
    if (!quoteSupplier) return toast.error("Selecciona proveedor");
    setSaving(true);
    try {
      const qs = Object.entries(quoteForm).map(([pId, val]) => ({
        rfq_id: rfq.id,
        supplier_id: quoteSupplier,
        product_id: pId,
        unit_price_usd: Number(val)
      }));

      // Insert quotes
      for (const q of qs) {
        await supabase.from("purchase_rfq_quotes").upsert(q, { onConflict: "rfq_id, supplier_id, product_id" });
      }

      // Update supplier status in rfq
      await supabase.from("purchase_rfq_suppliers")
        .update({ status: 'Respondida', responded_at: new Date().toISOString() })
        .eq('rfq_id', rfq.id).eq('supplier_id', quoteSupplier);

      // Update rfq status if Borrador/Enviada
      if (rfq.status === 'Borrador' || rfq.status === 'Enviada') {
         await supabase.from("purchase_rfq").update({ status: 'Respondida' }).eq('id', rfq.id);
      }

      toast.success("Cotización registrada");
      setQuoteOpen(false);
      fetchRfq();
    } catch(e:any) { toast.error("Error", {description:e.message}); }
    finally { setSaving(false); }
  };

  const handleConvert = async () => {
    if (!winningSupplier) return toast.error("Selecciona proveedor ganador");
    setSaving(true);
    try {
      // Create Purchase Order
      const supTotal = supplierTotals[winningSupplier];
      const pNum = `OC-${Date.now().toString().slice(-6)}`;
      const { data: bcv } = await supabase.from("bcv_history").select("rate").order("date", { ascending: false }).limit(1).single();
      const currentRate = bcv?.rate || 1;

      // 1. Insert Purchases
      const { data: purchase, error: pErr } = await supabase.from("purchases").insert({
        company_id: user!.company_id,
        supplier_id: winningSupplier,
        purchase_number: pNum,
        status: "draft",
        exchange_rate: currentRate,
        subtotal_usd: supTotal,
        total_usd: supTotal,
        total_bs: supTotal * currentRate,
        notes: `Generada automáticamente desde ${rfq.rfq_number}`
      }).select().single();
      
      if (pErr) throw pErr;

      // 2. Insert Items and History
      const selectedQuotes = quotes.filter((q:any) => q.supplier_id === winningSupplier);
      
      const insertItems = [];
      const historyItems = [];

      for (const item of products) {
        const quote = selectedQuotes.find((q:any) => q.product_id === item.product_id);
        const cost = quote ? quote.unit_price_usd : item.products.cost_usd;
        
        insertItems.push({
          purchase_id: purchase.id,
          product_id: item.product_id,
          qty: item.quantity_requested,
          unit_cost_usd: cost,
          total_unit_cost_usd: cost,
          subtotal_usd: cost * item.quantity_requested
        });

        // Register in purchase_price_history to trigger alerts
        historyItems.push({
          company_id: user!.company_id,
          product_id: item.product_id,
          supplier_id: winningSupplier,
          purchase_order_id: purchase.id,
          unit_price_usd: cost,
          unit_price_bs: cost * currentRate,
          bcv_rate: currentRate,
          quantity: item.quantity_requested,
          purchased_at: new Date().toISOString()
        });
      }

      await supabase.from("purchase_items").insert(insertItems);
      await supabase.from("purchase_price_history").insert(historyItems);

      // 3. Update RFQ Status
      await supabase.from("purchase_rfq").update({ status: 'Convertida' }).eq('id', rfq.id);

      toast.success(`Orden ${pNum} creada exitosamente`);
      router.push("/dashboard/compras/ordenes");
    } catch(e:any) { toast.error("Error convirtiendo", {description:e.message}); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (!rfq) return <div className="py-20 text-center text-text-3">No se encontró RFQ</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Back & Header */}
      <div className="flex flex-col gap-4">
         <Link href="/dashboard/compras/rfq" className="text-text-3 hover:text-brand text-xs font-bold flex items-center gap-1 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Volver a Solicitudes
         </Link>
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-border p-5 rounded-2xl shadow-sm">
            <div>
               <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-2xl font-montserrat font-bold text-text-1">{rfq.rfq_number}</h1>
                 <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border", 
                                rfq.status === 'Borrador' ? "bg-surface-base text-text-3 border-border" :
                                rfq.status === 'Enviada'  ? "bg-status-info/10 text-status-info border-status-info/20" :
                                rfq.status === 'Respondida'? "bg-status-warn/10 text-status-warn border-status-warn/20" :
                                rfq.status === 'Convertida'? "bg-status-ok/10 text-status-ok border-status-ok/20" :
                                "bg-status-danger/10 text-status-danger border-status-danger/20"
                              )}>
                                 {rfq.status}
                  </span>
               </div>
               <div className="flex items-center gap-4 text-xs font-bold text-text-3 font-mono">
                  <span className="flex items-center gap-1.5"><CalIcon className="w-3.5 h-3.5"/> Creado: {format(new Date(rfq.created_at), "dd/MM/yy")}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Límite: {rfq.expires_at ? format(new Date(rfq.expires_at), "dd/MM/yy") : "–"}</span>
               </div>
            </div>

            <div className="flex items-center gap-3">
               {rfq.status !== 'Convertida' && rfq.status !== 'Cancelada' && (
                 <button onClick={() => setQuoteOpen(true)} className="px-4 py-2 border border-brand/40 text-brand text-xs font-bold rounded-xl hover:bg-brand/10 transition-colors flex items-center gap-2">
                   <Plus className="w-3 h-3" /> Registrar Cotización
                 </button>
               )}
               {canConvert && (
                 <button onClick={() => setConvertOpen(true)} className="px-5 py-2.5 bg-brand-gradient text-white text-xs font-bold rounded-xl shadow-brand hover:opacity-90 flex items-center gap-2 transition-all">
                    <ShoppingBag className="w-4 h-4" /> Convertir a Orden
                 </button>
               )}
            </div>
         </div>
      </div>

      {rfq.notes && (
         <Card className="p-4 bg-surface-base border-border/50 text-sm italic text-text-2 border-l-4 border-l-brand rounded-lg">
            "{rfq.notes}"
         </Card>
      )}

      {/* Main Competitive Table */}
      <Card className="bg-surface-card border-border overflow-hidden shadow-card">
         <div className="p-5 border-b border-border bg-surface-base/50">
            <h2 className="font-montserrat font-bold text-sm text-text-1 flex items-center gap-2">
               <Calculator className="w-4 h-4 text-brand" /> Comparativa de Cotizaciones
            </h2>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-surface-base sticky top-0">
                  <tr>
                     <th className="px-5 py-4 text-[10px] uppercase font-bold text-text-3 border-b border-r border-border/50 w-64 shadow-sm z-20">Producto Solicitado</th>
                     {consultedSuppliers.map((s:any) => (
                        <th key={s.supplier_id} className="px-5 py-4 text-center border-b border-border border-r last:border-r-0 min-w-[140px] align-top bg-surface-card">
                           <p className="text-xs font-bold text-text-1 flex justify-center items-center gap-1.5"><Building2 className="w-3 h-3 text-text-3" /> {s.suppliers?.name}</p>
                           <p className={cn("text-[9px] uppercase font-bold mt-2", s.status === 'Respondida' ? "text-status-ok" : "text-status-warn")}>
                             {s.status === 'Pendiente' ? "⏳ Esperando precio..." : "✅ Cotización recibida"}
                           </p>
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {matrix.map((row: any) => (
                     <tr key={row.product_id} className="hover:bg-surface-hover/20 transition-colors">
                        <td className="px-5 py-4 border-r border-border/50 bg-surface-base/30 relative">
                           <p className="font-bold text-text-1 text-xs">{row.name}</p>
                           <p className="text-[10px] text-text-3 font-mono mt-0.5">{row.sku}</p>
                           <span className="absolute top-1/2 -translate-y-1/2 right-3 font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded text-[10px]">x{row.qty}</span>
                        </td>
                        {consultedSuppliers.map((s:any) => {
                           const price = row.prices[s.supplier_id];
                           const isMin = price !== undefined && price === row.min_price && price > 0 && responsesCount > 1;
                           return (
                              <td key={s.supplier_id} className={cn("px-5 py-4 text-center border-r font-mono border-border last:border-r-0 relative transition-all", isMin ? "bg-status-ok/5" : "")}>
                                 {price !== undefined ? (
                                    <>
                                       <span className={cn("font-bold", isMin ? "text-status-ok" : "text-text-1")}>${price.toFixed(4)}</span>
                                       {isMin && <span className="absolute top-1/2 -translate-y-1/2 right-2 bg-status-ok text-white w-3 h-3 rounded-full flex items-center justify-center shrink-0" title="Mejor precio de la fila"><CheckCircle2 className="w-2 h-2" /></span>}
                                    </>
                                 ) : (
                                    <span className="text-text-3/50 text-[10px] italic">No cotizado</span>
                                 )}
                              </td>
                           )
                        })}
                     </tr>
                  ))}
               </tbody>
               <tfoot className="bg-surface-base border-t-2 border-border font-mono shadow-inner">
                  <tr>
                     <td className="px-5 py-5 border-r border-border/50 text-right font-bold text-xs uppercase tracking-widest text-text-3">Costo Total Compra</td>
                     {consultedSuppliers.map((s:any) => {
                        const total = supplierTotals[s.supplier_id];
                        const isBest = s.supplier_id === bestSupplierId && total > 0;
                        return (
                           <td key={s.supplier_id} className={cn("px-5 py-5 text-center border-r border-border last:border-r-0 relative", isBest ? "bg-status-ok/10" : "")}>
                              {total !== undefined ? (
                                 <div className="flex flex-col items-center gap-1">
                                    <span className={cn("font-bold text-base", isBest ? "text-status-ok" : "text-text-1")}>${total.toLocaleString("es-VE",{minimumFractionDigits:2})}</span>
                                    {isBest && <span className="bg-status-ok text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded tracking-wider shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> MEJOR OFERTA</span>}
                                 </div>
                              ) : (
                                 <span className="text-[10px] text-text-3 italic opacity-50">Faltan Ítems</span>
                              )}
                           </td>
                        )
                     })}
                  </tr>
               </tfoot>
            </table>
         </div>
      </Card>

      {/* Simulator Modal for registering quotes */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
         <DialogContent className="max-w-md bg-surface-card border-border">
            <h2 className="text-lg font-montserrat font-bold">Registrar Cotización Manual</h2>
            <p className="text-xs text-text-3 mb-4">Selecciona el proveedor y rellena sus precios cotizados. (Esto simula una respuesta del proveedor).</p>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-text-3 uppercase">Proveedor</label>
                  <Select value={quoteSupplier} onValueChange={setQuoteSupplier}>
                     <SelectTrigger className="bg-surface-input border-border/50 mt-1"><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                     <SelectContent>
                        {consultedSuppliers.map((s:any) => <SelectItem key={s.supplier_id} value={s.supplier_id}>{s.suppliers?.name}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
               {quoteSupplier && (
                  <div className="space-y-3 bg-surface-base p-3 rounded-xl border border-border">
                     {products.map((p:any) => (
                        <div key={p.product_id} className="flex justify-between items-center">
                           <div className="w-1/2">
                              <p className="text-xs font-bold text-text-1 truncate">{p.products?.name}</p>
                              <p className="text-[10px] text-brand">x{p.quantity_requested} unid.</p>
                           </div>
                           <div className="w-1/3">
                              <Input type="number" placeholder="Precio USD" value={quoteForm[p.product_id] || ""} onChange={(e: any) => setQuoteForm((prev: any)=>({...prev, [p.product_id]: e.target.value}))} className="h-8 text-right bg-surface-input border-border/50 font-mono text-sm" />
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            <DialogFooter className="mt-4">
               <button onClick={()=>setQuoteOpen(false)} className="text-xs font-bold text-text-3 mr-4">Cancelar</button>
               <button disabled={saving} onClick={handleSimulateQuote} className="px-5 py-2 bg-brand text-white font-bold text-xs rounded-xl flex items-center gap-2">
                 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Registrar Respuesta
               </button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Convert Modal */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
         <DialogContent className="max-w-md bg-surface-card border-border">
            <h2 className="text-xl font-montserrat font-bold flex items-center gap-2 text-brand"><ShoppingBag className="w-5 h-5"/> Convertir a Orden</h2>
            <p className="text-xs text-text-3 mb-4">Selecciona a qué proveedor adjuntarle la victoria para generar la Orden de Compra.</p>
            <div className="space-y-4">
               {consultedSuppliers.filter((s:any) => s.status === 'Respondida').map((s:any) => {
                  const isBest = bestSupplierId === s.supplier_id;
                  const total = supplierTotals[s.supplier_id];
                  return (
                     <button key={s.supplier_id} onClick={() => setWinningSupplier(s.supplier_id)}
                        className={cn("w-full p-4 rounded-xl border flex items-center justify-between transition-all", winningSupplier === s.supplier_id ? "bg-brand/10 border-brand" : "bg-surface-base border-border hover:bg-surface-hover/50")}>
                        <div className="flex items-center gap-3">
                           <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", winningSupplier === s.supplier_id ? "border-brand": "border-text-3")}>
                              {winningSupplier === s.supplier_id && <div className="w-2 h-2 bg-brand rounded-full"/>}
                           </div>
                           <div className="text-left">
                              <p className="font-bold text-sm text-text-1">{s.suppliers?.name}</p>
                              {isBest && <p className="text-[10px] text-status-ok font-bold uppercase mt-0.5 tracking-wider">🌟 Opción Recomendada</p>}
                           </div>
                        </div>
                        <p className="font-mono font-bold text-text-1">${total?.toLocaleString("es-VE",{minimumFractionDigits:2})}</p>
                     </button>
                  )
               })}
            </div>
            <DialogFooter className="mt-4 border-t border-border/50 pt-4">
               <button onClick={()=>setConvertOpen(false)} className="text-xs font-bold text-text-3 mr-4">Mmm, mejor luego</button>
               <button disabled={saving || !winningSupplier} onClick={handleConvert} className="px-6 py-2.5 bg-brand-gradient text-white font-bold text-xs rounded-xl shadow-brand hover:opacity-90 flex items-center gap-2">
                 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />} Emitir Orden al Ganador
               </button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
