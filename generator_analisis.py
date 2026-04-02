import os

content = """\"use client\";

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
  Legend, ResponsiveContainer,
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
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  
  // States
  const [viewMode, setViewMode] = useState<"proveedor" | "periodo">("proveedor");
  const [selectedProductId, setSelectedProductId] = useState<string>("none");
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

      // Extract unique products
      const prodMap = new Map<string, { id: string; name: string; sku: string }>();
      mapped.forEach((r) => prodMap.set(r.product_id, { id: r.product_id, name: r.product_name, sku: r.product_sku }));
      setProducts([...prodMap.values()].sort((a, b) => a.name.localeCompare(b.name)));

      if (alertRes.data) {
        setAlerts(alertRes.data.map((a: any) => ({
          ...a,
          product_name: a.products?.name ?? "–", supplier_name: a.suppliers?.name ?? "–",
          old_price: Number(a.old_price), new_price: Number(a.new_price), variation_percent: Number(a.variation_percent)
        })));
      }
    } catch (err: any) {
      toast.error("Error al cargar datos", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      const usdPrices = sorted.map(r => r.unit_price_usd);
      return {
        supplier_id: supId,
        supplier_name: last.supplier_name,
        last_price_usd: last.unit_price_usd,
        last_price_bs: last.unit_price_bs,
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
    const body = periodHistory.map(r => `"${format(new Date(r.purchased_at),"dd/MM/yyyy")}","${r.supplier_name}",${r.unit_price_usd},${r.unit_price_bs},${r.bcv_rate},${r.quantity}`).join("\\n");
    const blob = new Blob([header + "\\n" + body], { type: "text/csv;charset=utf-8;" });
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
      <Card className="p-4 bg-surface-card border-border flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <Input 
            placeholder="Buscar por producto..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10 bg-surface-base border-border"
          />
        </div>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="w-[300px] bg-surface-base border-border font-bold">
            <Package className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Selecciona un producto..." />
          </SelectTrigger>
          <SelectContent className="bg-surface-card border-border max-h-[300px]">
             <SelectItem value="none">Seleccione producto...</SelectItem>
            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center justify-between w-full pr-4">
                   <span>{p.sku} — {p.name}</span>
                   {activeProductAlerts.has(p.id) && <Bell className="w-3 h-3 text-status-danger ml-2" />}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Tabs */}
      {selectedProductId !== "none" && (
        <div className="flex gap-2 border-b border-border mb-4">
          <button onClick={() => setViewMode("proveedor")} className={cn("px-4 py-3 font-bold border-b-2 text-sm transition-all", viewMode === "proveedor" ? "border-brand text-brand" : "border-transparent text-text-3 hover:text-text-1")}>
            Comparativa entre Proveedores
          </button>
          <button onClick={() => setViewMode("periodo")} className={cn("px-4 py-3 font-bold border-b-2 text-sm transition-all", viewMode === "periodo" ? "border-brand text-brand" : "border-transparent text-text-3 hover:text-text-1")}>
            Historial del Producto
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
      ) : viewMode === "proveedor" ? (
        <div className="space-y-6">
          {/* Chart */}
          <Card className="p-6 bg-surface-card border-border">
            <h2 className="font-montserrat font-bold text-text-1 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand" /> Último precio por proveedor USD
            </h2>
            <div className="h-64 sm:h-80 w-full overflow-hidden">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={supplierComparisons} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                   <XAxis type="number" tickFormatter={v => `$${v}`} tick={{fill:"var(--text-3)", fontSize: 11}} axisLine={false} tickLine={false} />
                   <YAxis type="category" dataKey="supplier_name" width={150} tick={{fill:"var(--text-2)", fontSize: 11}} axisLine={false} tickLine={false} />
                   <Tooltip formatter={(val: number) => [`$${val.toFixed(2)}`, "Precio USD"]} contentStyle={{background:"var(--surface-color)", border:"1px solid var(--border-color)", borderRadius:"8px", color:"var(--text-1)"}}/>
                   <Bar dataKey="last_price_usd" radius={[0,4,4,0]}>
                     {supplierComparisons.map((s, idx) => (
                       <cell key={idx} fill={idx === 0 ? "var(--status-ok)" : "var(--brand-color)"} style={{fill: idx === 0 ? "var(--status-ok)" : "var(--brand-color)"}} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </Card>

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
                          <div className="flex gap-1">
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
                         <span className="text-status-ok">${s.min.toFixed(2)}</span> / <span className="text-status-danger">${s.max.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-text-2">${s.avg.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="bg-surface-base border border-border px-2 py-1 rounded text-xs font-bold text-text-2">{s.total_qty} unid.</span>
                      </td>
                      <td className="px-5 py-4 text-center text-xs text-text-3">
                        {format(new Date(s.last_date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link href={`/dashboard/compras/ordenes?action=new_order&supplier_id=${s.supplier_id}&product_id=${selectedProductId}`} className="inline-flex items-center gap-1.5 bg-brand-gradient text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap shadow-brand">
                          <ShoppingBag className="w-3.5 h-3.5" /> Ordenar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
           {/* Period View */}
           <div className="flex justify-end">
              <button onClick={handleExportPeriod} className="flex items-center gap-2 px-4 py-2 bg-surface-card border border-border rounded-xl text-xs font-bold text-text-1 hover:bg-surface-base transition-all">
                <Download className="w-4 h-4 text-brand" /> Excel
              </button>
           </div>
           <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="px-5 py-4">Fecha</th>
                      <th className="px-5 py-4">Proveedor</th>
                      <th className="px-5 py-4 text-right">Precio USD</th>
                      <th className="px-5 py-4 text-right">Precio Bs</th>
                      <th className="px-5 py-4 text-right">Tasa BCV</th>
                      <th className="px-5 py-4 text-center">Cant.</th>
                      <th className="px-5 py-4 text-center">Variación vs Anterior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {periodHistory.map((r, idx) => {
                      const prev = periodHistory[idx + 1]; // next in array is chronologically previous
                      let varPct = null;
                      if (prev) {
                        varPct = prev.unit_price_usd > 0 ? ((r.unit_price_usd - prev.unit_price_usd) / prev.unit_price_usd) * 100 : null;
                      }
                      return (
                        <tr key={r.id} className="hover:bg-surface-hover/20">
                           <td className="px-5 py-4 font-bold text-text-2 text-xs">{format(new Date(r.purchased_at), "dd MMM yyyy, HH:mm", {locale:es})}</td>
                           <td className="px-5 py-4 text-text-1">{r.supplier_name}</td>
                           <td className="px-5 py-4 text-right font-bold text-text-1 font-mono">${r.unit_price_usd.toFixed(4)}</td>
                           <td className="px-5 py-4 text-right text-text-3 font-mono text-xs">Bs. {r.unit_price_bs.toFixed(2)}</td>
                           <td className="px-5 py-4 text-right text-text-3 font-mono text-xs">{r.bcv_rate.toFixed(2)}</td>
                           <td className="px-5 py-4 text-center font-bold text-text-2">{r.quantity}</td>
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
                  <Bell className="w-5 h-5 text-brand" /> Alertas de Precios {unreadAlerts.length > 0 && <span className="bg-status-danger text-white text-xs px-2 py-0.5 rounded-full">{unreadAlerts.length}</span>}
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
                    <p className="text-sm">No hay alertas de variación</p>
                  </div>
                ) : (
                  alerts.map(a => (
                    <div key={a.id} className={cn("p-4 rounded-xl border relative overflow-hidden transition-all", !a.is_read ? "bg-surface-card border-brand/30 shadow-brand/10" : "bg-surface-base border-border opacity-75")}>
                       {!a.is_read && <div className="absolute top-0 right-0 left-0 h-1 bg-brand-gradient" />}
                       <div className="flex gap-3 mb-2">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", a.alert_type === 'precio_subida' ? "bg-status-danger/10 text-status-danger" : "bg-status-ok/10 text-status-ok")}>
                             {a.alert_type === 'precio_subida' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-1 leading-tight">{a.product_name}</p>
                            <p className="text-xs text-text-3 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> {a.supplier_name}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-2 mt-4 bg-surface-base border border-border/50 p-2.5 rounded-lg">
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
                       <p className="text-[10px] text-text-3 mt-3 flex justify-end gap-1 items-center">
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
"""

with open("src/app/dashboard/compras/analisis/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Analysis Page Rewritten successfully.")
