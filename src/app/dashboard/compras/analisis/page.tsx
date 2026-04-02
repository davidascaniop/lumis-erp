"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Search, Filter,
  Download, ChevronDown, ChevronUp, Package, Building2,
  BarChart3, Loader2, Calendar, DollarSign, ArrowRight,
  Bell, Check, X, ShoppingBag, Clock
} from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface PriceHistoryRow {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  supplier_id: string;
  supplier_name: string;
  unit_price_usd: number;
  unit_price_bs: number;
  bcv_rate: number;
  quantity: number;
  purchased_at: string;
}

interface PriceAlert {
  id: string;
  product_id: string;
  supplier_id: string;
  product_name: string;
  supplier_name: string;
  old_price: number;
  new_price: number;
  variation_percent: number;
  alert_type: string;
  is_read: boolean;
  created_at: string;
}

const LINE_COLORS = ["#E040FB", "#00E5CC", "#FFB800", "#4FC3F7", "#FF6B6B", "#69D483"];

function VariationBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-text-3 text-xs">–</span>;
  if (pct === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
      <Minus className="w-3 h-3" /> Sin cambio
    </span>
  );
  const up = pct > 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
      up ? "bg-status-danger/10 text-status-danger border-status-danger/20" : "bg-status-ok/10 text-status-ok border-status-ok/20"
    )}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function AnalisisPreciosPage() {
  const supabase = createClient();
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<PriceHistoryRow[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("none");
  const [viewMode, setViewMode] = useState<"proveedor" | "periodo">("proveedor");
  const [selectedProduct, setSelectedProduct] = useState<{name: string, sku: string} | null>(null);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; sku: string; hasHistory?: boolean }[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Fetch
  const fetchData = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [histRes, alertRes] = await Promise.all([
        supabase.from("purchase_price_history").select(`
          id, product_id, supplier_id, unit_price_usd, unit_price_bs,
          bcv_rate, quantity, purchased_at,
          products(name, sku), suppliers(name)
        `).eq("company_id", user.company_id).order("purchased_at", { ascending: false }),
        supabase.from("price_alerts").select(`
          id, product_id, supplier_id, old_price, new_price, variation_percent,
          alert_type, is_read, created_at,
          products(name), suppliers(name)
        `).eq("company_id", user.company_id).order("created_at", { ascending: false })
      ]);

      if (histRes.error) throw histRes.error;
      
      const mapped = (histRes.data || []).map((r: any) => ({
        id: r.id, product_id: r.product_id, product_name: r.products?.name ?? "–",
        product_sku: r.products?.sku ?? "–", supplier_id: r.supplier_id,
        supplier_name: r.suppliers?.name ?? "–", unit_price_usd: Number(r.unit_price_usd),
        unit_price_bs: Number(r.unit_price_bs), bcv_rate: Number(r.bcv_rate),
        quantity: Number(r.quantity), purchased_at: r.purchased_at,
      }));
      setRawData(mapped);

      if (alertRes.data) {
        setAlerts(alertRes.data.map((a: any) => ({
          ...a,
          product_name: a.products?.name ?? "–", supplier_name: a.suppliers?.name ?? "–",
          old_price: Number(a.old_price), new_price: Number(a.new_price), variation_percent: Number(a.variation_percent)
        })));
      }

      // 3. Independent: Fetch all products for searching
      const { data: pData } = await supabase.from("products").select("id, name, sku").eq("company_id", user.company_id);
      if (pData) setAllProducts(pData);
    } catch (err: any) {
      toast.error("Error al cargar datos", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time Search (In-memory for speed and reliability)
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const historyIds = new Set(rawData.map(r => r.product_id));
    
    const filtered = allProducts.filter(p => 
       p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
    ).map(p => ({
       ...p,
       hasHistory: historyIds.has(p.id)
    })).sort((a, b) => {
       if (a.hasHistory && !b.hasHistory) return -1;
       if (!a.hasHistory && b.hasHistory) return 1;
       return a.name.localeCompare(b.name);
    }).slice(0, 20);

    setSearchResults(filtered);
  }, [searchQuery, allProducts, rawData]);

  // Derived: By Supplier 
  const supplierComparisons = useMemo(() => {
    if (selectedProductId === "none") return [];
    const productData = rawData.filter(r => r.product_id === selectedProductId);
    const bySup = new Map<string, PriceHistoryRow[]>();
    productData.forEach(r => {
      if (!bySup.has(r.supplier_id)) bySup.set(r.supplier_id, []);
      bySup.get(r.supplier_id)!.push(r);
    });

    return Array.from(bySup.entries()).map(([supId, rows]) => {
      const sorted = rows.sort((a,b) => new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime());
      const last = sorted[sorted.length - 1];
      const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      let trend: "up" | "down" | "flat" | "none" = "none";
      if (prev) {
        if (last.unit_price_usd > prev.unit_price_usd) trend = "up";
        else if (last.unit_price_usd < prev.unit_price_usd) trend = "down";
        else trend = "flat";
      }

      const usdPrices = sorted.map(r => r.unit_price_usd);
      return {
        supplier_id: supId,
        supplier_name: last.supplier_name,
        last_price_usd: last.unit_price_usd,
        last_price_bs: last.unit_price_bs,
        trend,
        min: Math.min(...usdPrices),
        max: Math.max(...usdPrices),
        avg: usdPrices.reduce((a,b)=>a+b,0) / usdPrices.length,
        total_qty: sorted.reduce((a,b)=>a+b.quantity, 0),
        last_date: last.purchased_at,
        is_cheapest: false,
        is_most_bought: false
      };
    }).sort((a,b) => a.last_price_usd - b.last_price_usd); // ascending price
  }, [rawData, selectedProductId]);

  // Mark badges
  useMemo(() => {
    if (supplierComparisons.length > 0) {
      supplierComparisons[0].is_cheapest = true;
      let maxQty = -1; let bestIdx = -1;
      supplierComparisons.forEach((s, idx) => { if (s.total_qty > maxQty) { maxQty = s.total_qty; bestIdx = idx; } });
      if (bestIdx >= 0) supplierComparisons[bestIdx].is_most_bought = true;
    }
  }, [supplierComparisons]);

  // Derived: By Period
  const periodHistory = useMemo(() => {
    if (selectedProductId === "none") return [];
    const productData = rawData.filter(r => r.product_id === selectedProductId);
    return productData.sort((a,b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime());
  }, [rawData, selectedProductId]);

  const unreadAlerts = alerts.filter(a => !a.is_read);

  const markAllAsRead = async () => {
    if (unreadAlerts.length === 0 || !user?.company_id) return;
    try {
      await supabase.from("price_alerts").update({ is_read: true }).eq("company_id", user.company_id).eq("is_read", false);
      setAlerts(prev => prev.map(a => ({...a, is_read:true})));
      toast.success("Alertas marcadas como leídas");
    } catch { toast.error("Error al actualizar alertas"); }
  };

  const handleExportPeriod = () => {
    if (periodHistory.length === 0) return;
    const header = "Fecha,Proveedor,Precio USD,Precio Bs,Tasa BCV,Cantidad";
    const body = periodHistory.map(r => `"${format(new Date(r.purchased_at),"dd/MM/yyyy")}","${r.supplier_name}",${r.unit_price_usd},${r.unit_price_bs},${r.bcv_rate},${r.quantity}`).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`historial-periodo.csv`; a.click();
  };

  const activeProductAlerts = useMemo(() => {
    const list = new Set<string>();
    unreadAlerts.forEach(a => list.add(a.product_id));
    return list;
  }, [unreadAlerts]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1 flex items-center gap-3">
            Análisis de Precios
          </h1>
          <p className="text-text-2 mt-1 text-sm">
            Comparativa de precios entre proveedores y alertas de variación
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button onClick={() => setIsAlertsOpen(true)} className="relative p-2.5 bg-surface-card border border-border rounded-xl hover:bg-surface-base transition-colors">
            <Bell className="w-5 h-5 text-text-1" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-status-danger text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadAlerts.length > 9 ? "9+" : unreadAlerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Selector */}
      <Card className="p-4 bg-surface-card border-border relative z-30 shadow-sm">
        <label className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-2 block">Selecciona un Producto para Analizar</label>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <Input 
            placeholder="Buscar por producto (nombre o SKU)..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface-base border-border/50 focus:border-brand/50 h-12 text-sm transition-all"
          />
          {searchQuery && (
             <div className="absolute top-[52px] left-0 right-0 bg-surface-card border border-border rounded-xl shadow-2xl max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 z-50">
               {searching && <div className="p-4 text-center"><Loader2 className="w-5 h-5 text-brand animate-spin mx-auto" /></div>}
               {!searching && searchResults.map(p => (
                 <button key={p.id} onClick={() => { setSelectedProductId(p.id); setSelectedProduct({name: p.name, sku: p.sku}); setSearchQuery(""); }} className="w-full text-left px-4 py-3 hover:bg-surface-hover/50 border-b border-border/50 last:border-0 flex justify-between items-center transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-text-1">{p.name}</p>
                        {p.hasHistory ? (
                          <span className="bg-[#E040FB]/10 text-[#E040FB] text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#E040FB]/20 uppercase">Con historial</span>
                        ) : (
                          <span className="bg-text-3/10 text-text-3 text-[8px] font-bold px-1.5 py-0.5 rounded border border-border/50 uppercase">Sin compras aún</span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-text-3">{p.sku}</p>
                    </div>
                    {activeProductAlerts.has(p.id) && <Bell className="w-4 h-4 text-status-danger" />}
                 </button>
               ))}
               {!searching && searchResults.length === 0 && (
                 <p className="p-4 text-center text-text-3 text-sm">No se encontraron productos compatibles.</p>
               )}
             </div>
          )}
        </div>
        
        {selectedProductId !== "none" && (
           <div className="mt-4 p-3 bg-brand/5 border border-brand/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-brand" /></div>
                 <div>
                    <p className="text-[9px] text-brand font-bold uppercase tracking-widest leading-tight">Analizando producto</p>
                    <p className="text-sm font-bold text-text-1 leading-tight mt-0.5">{selectedProduct?.name} <span className="text-text-3 font-mono text-xs ml-1">({selectedProduct?.sku})</span></p>
                 </div>
              </div>
              <button onClick={() => { setSelectedProductId("none"); setSelectedProduct(null); }} className="p-2 hover:bg-status-danger/10 text-text-3 hover:text-status-danger rounded-lg transition-colors"><X className="w-4 h-4"/></button>
           </div>
        )}
      </Card>

      {/* Tabs */}
      {selectedProductId !== "none" && (
        <div className="flex gap-2 border-b border-border mb-4">
          <button onClick={() => setViewMode("proveedor")} className={cn("px-4 py-3 font-bold border-b-2 text-sm transition-all", viewMode === "proveedor" ? "border-brand text-brand" : "border-transparent text-text-3 hover:text-text-1")}>
            Comparativa entre Proveedores
          </button>
          <button onClick={() => setViewMode("periodo")} className={cn("px-4 py-3 font-bold border-b-2 text-sm transition-all", viewMode === "periodo" ? "border-brand text-brand" : "border-transparent text-text-3 hover:text-text-1")}>
            Historial del Producto (Período)
          </button>
        </div>
      )}

      {selectedProductId === "none" ? (
        <Card className="p-16 bg-surface-card border-border flex flex-col items-center justify-center text-text-3 border-dashed">
            <BarChart3 className="w-12 h-12 opacity-20 mb-3" />
            <p>Selecciona un producto arriba para ver sus comparativas.</p>
        </Card>
      ) : loading ? (
        <div className="py-20 flex center justify-center"><Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" /></div>
      ) : supplierComparisons.length === 0 ? (
        <Card className="p-16 bg-surface-card border-border flex flex-col items-center justify-center text-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-brand/5 flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-brand/40" />
            </div>
            <h3 className="text-lg font-bold text-text-1 mb-2">Sin historial de compra</h3>
            <p className="text-sm text-text-3 max-w-sm">
              Este producto aún no tiene compras registradas. <br />
              Cuando realices tu primera orden de compra con este producto podrás ver aquí el análisis de precios.
            </p>
            <Link href={`/dashboard/compras/ordenes?new=1&product_id=${selectedProductId}`} className="mt-6 px-6 py-2 bg-brand text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">
              Crear Primera Orden
            </Link>
        </Card>
      ) : viewMode === "proveedor" ? (
        <div className="space-y-6">
          {/* Supplier Cards */}
          {supplierComparisons.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
               {supplierComparisons.map((s, idx) => (
                    <Card key={s.supplier_id} className={cn("p-5 bg-surface-card border relative overflow-hidden transition-all hover:border-brand/40 shadow-sm", s.is_cheapest ? "border-status-ok/40 shadow-status-ok/5" : "border-border/60")}>
                       {s.is_cheapest && <div className="absolute top-0 inset-x-0 h-1 bg-status-ok" />}
                       
                       <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-text-1 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-text-3"/> {s.supplier_name}</h3>
                         <div className="flex flex-col gap-1 items-end">
                            {s.is_cheapest && <span className="bg-status-ok/10 text-status-ok text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-status-ok/20">Mejor Precio</span>}
                            {s.is_most_bought && <span className="bg-[#E040FB]/10 text-[#E040FB] text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-[#E040FB]/20">Más Usado</span>}
                         </div>
                       </div>
                       
                       <div className="flex items-center justify-between mb-4">
                         <div>
                            <p className="text-[10px] text-text-3 font-bold uppercase tracking-widest mb-1">Precio Actual</p>
                            <p className={cn("text-3xl font-montserrat font-bold", s.is_cheapest ? "text-status-ok" : "text-text-1")}>${s.last_price_usd.toFixed(2)}</p>
                            <p className="text-[11px] text-text-3 font-mono mt-1">Bs. {s.last_price_bs.toFixed(2)}</p>
                         </div>
                         <div className="flex flex-col items-end">
                            {s.trend === "up" ? (
                               <div className="flex flex-col items-center"><TrendingUp className="w-6 h-6 text-status-danger" /><span className="text-[9px] font-bold text-status-danger mt-1">SUBIÓ</span></div>
                            ) : s.trend === "down" ? (
                               <div className="flex flex-col items-center"><TrendingDown className="w-6 h-6 text-status-ok" /><span className="text-[9px] font-bold text-status-ok mt-1">BAJÓ</span></div>
                            ) : s.trend === "flat" ? (
                               <div className="flex flex-col items-center"><Minus className="w-6 h-6 text-text-3" /><span className="text-[9px] font-bold text-text-3 mt-1">IGUAL</span></div>
                            ) : (
                               <div className="flex flex-col items-center"><Minus className="w-6 h-6 text-text-3/50" /><span className="text-[9px] font-bold text-text-3/50 mt-1">NUEVO</span></div>
                            )}
                         </div>
                       </div>

                       <div className="pt-3 border-t border-border/50 text-[10px] text-text-3 flex items-center justify-between font-mono">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Última vez: {format(new Date(s.last_date), "dd/MM/yyyy")}</span>
                          <span>{s.total_qty} uds. compradas</span>
                       </div>
                    </Card>
               ))}
            </div>
          )}

          {/* Table */}
          <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-5 py-4">Proveedor</th>
                    <th className="px-5 py-4 text-right">Último Precio</th>
                    <th className="px-5 py-4 text-right">Min / Max USD</th>
                    <th className="px-5 py-4 text-center">Promedio USD</th>
                    <th className="px-5 py-4 text-center">Frecuencia</th>
                    <th className="px-5 py-4 text-center">Última Compra</th>
                    <th className="px-5 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supplierComparisons.map(s => (
                    <tr key={s.supplier_id} className="hover:bg-surface-hover/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-bold text-text-1">{s.supplier_name}</span>
                          <div className="flex gap-1 flex-wrap">
                            {s.is_cheapest && <span className="bg-status-ok/10 border border-status-ok/20 text-status-ok text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Mejor Precio</span>}
                            {s.is_most_bought && <span className="bg-[#E040FB]/10 border border-[#E040FB]/20 text-[#E040FB] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Más Comprado</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono">
                        <p className="font-bold text-text-1">${s.last_price_usd.toFixed(4)}</p>
                        <p className="text-[10px] text-text-3">Bs. {s.last_price_bs.toFixed(2)}</p>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-xs">
                         <span className="text-status-ok">${s.min.toFixed(2)}</span><br/><span className="text-status-danger">${s.max.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-text-2">${s.avg.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="bg-surface-base border border-border px-2 py-1 rounded text-xs font-bold text-text-2">{s.total_qty} unid.</span>
                      </td>
                      <td className="px-5 py-4 text-center text-xs text-text-3">
                        {format(new Date(s.last_date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link href={`/dashboard/compras/ordenes?new=1&supplier_id=${s.supplier_id}&product_id=${selectedProductId}`} className="inline-flex items-center gap-1.5 bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap shadow-brand">
                          <ShoppingBag className="w-3.5 h-3.5" /> Ordenar
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {supplierComparisons.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-text-3">Sin datos para este producto.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           {/* Period View Line Chart */}
           <Card className="p-6 bg-white border border-border shadow-card">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="font-montserrat font-bold text-gray-800 text-lg flex items-center gap-2">
                     Evolución de Precios USD
                   </h2>
                   <p className="text-xs text-gray-500 mt-1">Línea de tiempo histórica de las compras a proveedores</p>
                </div>
                {periodHistory.length > 0 && (
                   <button onClick={handleExportPeriod} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm">
                     <Download className="w-4 h-4 text-brand" /> Exportar Data
                   </button>
                )}
             </div>

             {periodHistory.length < 2 ? (
                <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50">
                   <p className="text-sm font-bold text-center">Necesitas registrar al menos 2 compras<br/>para ver la evolución de precios en el gráfico.</p>
                </div>
             ) : (
                <div className="h-[300px] w-full text-xs">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={[...periodHistory].reverse()} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                       <XAxis 
                         dataKey="purchased_at" 
                         tickFormatter={(val) => format(new Date(val), "MMM yyyy", {locale: es})} 
                         tick={{fill: "#6B7280", fontSize: 11, fontWeight: 500}} 
                         axisLine={{stroke: "#D1D5DB", strokeWidth: 2}}
                         tickLine={false}
                       />
                       <YAxis 
                         tickFormatter={(val) => `$${val}`} 
                         tick={{fill: "#6B7280", fontSize: 11, fontWeight: 500}} 
                         axisLine={false} 
                         tickLine={false} 
                       />
                       <Tooltip 
                         formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)}`, name]}
                         labelFormatter={(lbl) => format(new Date(lbl), "dd MMM yyyy", {locale: es})}
                         contentStyle={{background: "white", border: "1px solid #E5E7EB", borderRadius: "12px", color: "#1F2937", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", fontWeight: "bold"}}
                       />
                       <Legend wrapperStyle={{fontSize: "12px", fontWeight: "bold", paddingTop: "20px"}} />
                       {Array.from(new Set(periodHistory.map(r=>r.supplier_name))).map((sName, idx) => (
                          <Line 
                            key={sName} 
                            type="monotone" 
                            dataKey={(row) => row.supplier_name === sName ? row.unit_price_usd : null} 
                            name={sName} 
                            stroke={LINE_COLORS[idx % LINE_COLORS.length]} 
                            strokeWidth={3} 
                            dot={{r: 4, strokeWidth: 2, fill: "white"}} 
                            activeDot={{r: 6, strokeWidth: 0, fill: LINE_COLORS[idx % LINE_COLORS.length]}} 
                            connectNulls
                          />
                       ))}
                     </LineChart>
                   </ResponsiveContainer>
                </div>
             )}
           </Card>

           <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="px-5 py-4">Fecha</th>
                      <th className="px-5 py-4">Proveedor</th>
                      <th className="px-5 py-4 text-right">Precio USD</th>
                      <th className="px-5 py-4 text-right">Precio Bs</th>
                      <th className="px-5 py-4 text-center">Tasa BCV</th>
                      <th className="px-5 py-4 text-center">Cant. Comprada</th>
                      <th className="px-5 py-4 text-center">Variación %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {periodHistory.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 text-text-3 font-bold">No hay historial de compras para este producto. Crea tu primera orden de compra para empezar a ver comparativas.</td></tr>
                    ) : periodHistory.map((r, idx) => {
                      const prev = periodHistory[idx + 1]; // next in array is chronologically previous
                      let varPct = null;
                      if (prev) {
                        varPct = prev.unit_price_usd > 0 ? ((r.unit_price_usd - prev.unit_price_usd) / prev.unit_price_usd) * 100 : null;
                      }
                      return (
                        <tr key={r.id} className="hover:bg-surface-hover/20">
                           <td className="px-5 py-4">
                             <p className="font-bold text-text-1">{format(new Date(r.purchased_at), "MMMM yyyy", {locale:es}).replace(/^\w/, c => c.toUpperCase())}</p>
                             <p className="text-xs text-text-3 font-mono mt-1">{format(new Date(r.purchased_at), "dd/MM/yyyy HH:mm")}</p>
                           </td>
                           <td className="px-5 py-4 text-text-1 font-bold">{r.supplier_name}</td>
                           <td className="px-5 py-4 text-right font-bold text-brand font-mono">${r.unit_price_usd.toFixed(4)}</td>
                           <td className="px-5 py-4 text-right text-text-3 font-mono text-xs">Bs. {r.unit_price_bs.toFixed(2)}</td>
                           <td className="px-5 py-4 text-right text-text-3 font-mono text-xs">{r.bcv_rate.toFixed(2)}</td>
                           <td className="px-5 py-4 text-center font-bold text-text-1">{r.quantity}</td>
                           <td className="px-5 py-4 text-center"><VariationBadge pct={varPct} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar Alerts */}
      <AnimatePresence>
        {isAlertsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsAlertsOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-surface-base border-l border-border z-50 shadow-2xl flex flex-col">
              <div className="p-5 border-b border-border bg-surface-card flex items-center justify-between">
                <h3 className="font-montserrat font-bold text-text-1 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand" /> Alertas de Precios {unreadAlerts.length > 0 && <span className="bg-status-danger text-white text-[10px] px-2 py-0.5 rounded-full">{unreadAlerts.length}</span>}
                </h3>
                <div className="flex items-center gap-3">
                   {unreadAlerts.length > 0 && (
                     <button onClick={markAllAsRead} className="text-[10px] uppercase font-bold tracking-wider text-brand hover:underline flex items-center gap-1">
                       <Check className="w-3 h-3" /> Marcar Leídas
                     </button>
                   )}
                   <button onClick={() => setIsAlertsOpen(false)} className="text-text-3 hover:text-text-1"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alerts.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-text-3 gap-3">
                    <Bell className="w-10 h-10 opacity-20" />
                    <p className="text-sm border-b border-dashed pb-2">No hay alertas de variación</p>
                  </div>
                ) : (
                  alerts.map(a => (
                    <div key={a.id} className={cn("p-4 rounded-xl border relative overflow-hidden transition-all", !a.is_read ? "bg-surface-card border-brand/30 shadow-card" : "bg-surface-base border-border opacity-75 grayscale-[0.3]")}>
                       {!a.is_read && <div className="absolute top-0 right-0 left-0 h-1 bg-brand-gradient" />}
                       <div className="flex gap-3 mb-2 pt-1">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", a.alert_type === 'precio_subida' ? "bg-status-danger/10 text-status-danger" : "bg-status-ok/10 text-status-ok")}>
                             {a.alert_type === 'precio_subida' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-1 leading-tight">{a.product_name}</p>
                            <p className="text-[10px] text-text-3 mt-1 flex items-center gap-1 font-mono uppercase"><Building2 className="w-3 h-3" /> {a.supplier_name}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-2 mt-4 bg-surface-input border border-border/50 p-2.5 rounded-lg">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-text-3 tracking-widest">Anterior</p>
                            <p className="font-mono font-bold text-text-2 text-xs">${a.old_price.toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-text-3 tracking-widest">Nuevo</p>
                            <div className="flex items-center gap-1.5">
                               <p className={cn("font-mono font-bold text-xs", a.alert_type === 'precio_subida' ? "text-status-danger" : "text-status-ok")}>${a.new_price.toFixed(4)}</p>
                               <VariationBadge pct={a.variation_percent} />
                            </div>
                          </div>
                       </div>
                       <p className="text-[10px] text-text-3 mt-3 flex justify-end gap-1 items-center font-mono">
                          <Clock className="w-3 h-3" /> {format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}
                       </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
