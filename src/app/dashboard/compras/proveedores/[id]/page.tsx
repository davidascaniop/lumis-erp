"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Building2, Phone, Mail, MapPin, User,
  Package, DollarSign, Search, ArrowUpDown,
  Loader2, TrendingUp, TrendingDown, Minus, Calendar,
  ClipboardList, Plus, Trash2, Save, X, Edit
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier {
  id: string;
  company_id: string;
  name: string;
  rif: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
  is_active: boolean;
}

interface PriceHistoryItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  last_qty: number;
  last_price_usd: number;
  last_price_bs: number;
  prev_price_usd: number | null;
  variation_pct: number | null;
  last_purchase: string;
}

interface VolumePrice {
  id: string;
  company_id: string;
  product_id: string;
  supplier_id: string;
  min_quantity: number;
  unit_price_usd: number;
  valid_from: string | null;
  valid_until: string | null;
  products?: { name: string, sku: string };
}

type SortField = "product" | "date" | "price";
type SortDir = "asc" | "desc";

// ─── Variation Badge ──────────────────────────────────────────────────────────
function VariationBadge({ pct }: { pct: number | null }) {
  if (pct === null)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
        <Minus className="w-3 h-3" /> Primera compra
      </span>
    );
  if (Math.abs(pct) < 0.01)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
        <Minus className="w-3 h-3" /> Sin cambio
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
        up
          ? "bg-status-danger/10 text-status-danger border-status-danger/20"
          : "bg-status-ok/10 text-status-ok border-status-ok/20"
      )}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [volumePrices, setVolumePrices] = useState<VolumePrice[]>([]);
  const [products, setProducts] = useState<any[]>([]); // For volume prices form
  
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"resumen" | "volumen">("resumen");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Volume price form state
  const [vpForm, setVpForm] = useState<{product_id: string, min_quantity: string, unit_price_usd: string, valid_until: string}>({
     product_id: "", min_quantity: "", unit_price_usd: "", valid_until: ""
  });
  const [savingVP, setSavingVP] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      // 1. Supplier info
      const { data: sup, error: supErr } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .eq("company_id", user.company_id)
        .single();
      if (supErr) throw supErr;
      setSupplier(sup as Supplier);

      // 2. Orders summary
      const { data: orders } = await supabase
        .from("purchases")
        .select("id, total_usd")
        .eq("supplier_id", id);
      setTotalOrders(orders?.length ?? 0);
      setTotalSpent((orders ?? []).reduce((s: number, o: any) => s + (o.total_usd ?? 0), 0));

      // 3. Price history per product
      const { data: phData } = await supabase
        .from("purchase_price_history")
        .select("product_id, unit_price_usd, unit_price_bs, quantity, purchased_at, products(name, sku)")
        .eq("supplier_id", id)
        .order("purchased_at", { ascending: true });

      // Group by product
      const productMap = new Map<
        string,
        { name: string; sku: string; records: { price_usd: number; price_bs: number; qty: number; date: string }[] }
      >();
      ((phData as any[]) || []).forEach((r) => {
        if (!productMap.has(r.product_id)) {
          productMap.set(r.product_id, {
            name: r.products?.name ?? "–",
            sku: r.products?.sku ?? "–",
            records: [],
          });
        }
        productMap.get(r.product_id)!.records.push({
          price_usd: r.unit_price_usd,
          price_bs: r.unit_price_bs,
          qty: r.quantity,
          date: r.purchased_at,
        });
      });

      const items: PriceHistoryItem[] = [];
      productMap.forEach((val, product_id) => {
        const sorted = [...val.records].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const last = sorted[sorted.length - 1];
        const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
        const variation =
          prev && prev.price_usd > 0
            ? ((last.price_usd - prev.price_usd) / prev.price_usd) * 100
            : null;

        items.push({
          product_id,
          product_name: val.name,
          product_sku: val.sku,
          last_qty: last.qty,
          last_price_usd: last.price_usd,
          last_price_bs: last.price_bs,
          prev_price_usd: prev?.price_usd ?? null,
          variation_pct: variation,
          last_purchase: last.date,
        });
      });

      setPriceHistory(items);

      // 4. Volume Prices
      const { data: vpData } = await supabase
         .from("volume_prices")
         .select("id, company_id, product_id, supplier_id, min_quantity, unit_price_usd, valid_from, valid_until, products(name, sku)")
         .eq("supplier_id", id)
         .order("min_quantity", { ascending: true });
      setVolumePrices((vpData as any) || []);

      // 5. Active products for dropdown
      const { data: pds } = await supabase.from("products").select("id, name, sku").eq("company_id", user.company_id).eq("status", "active");
      setProducts(pds || []);

    } catch (err: any) {
      toast.error("Error al cargar ficha de proveedor", { description: err.message });
      router.push("/dashboard/compras/proveedores");
    } finally {
      setLoading(false);
    }
  }, [id, supabase, router, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveVP = async () => {
     if (!vpForm.product_id || !vpForm.min_quantity || !vpForm.unit_price_usd) {
        return toast.error("Por favor completa los campos del baremo.");
     }
     
     setSavingVP(true);
     try {
        const { error } = await supabase.from("volume_prices").insert({
           company_id: user!.company_id,
           supplier_id: id,
           product_id: vpForm.product_id,
           min_quantity: Number(vpForm.min_quantity),
           unit_price_usd: Number(vpForm.unit_price_usd),
           valid_until: vpForm.valid_until ? new Date(vpForm.valid_until).toISOString() : null,
           valid_from: new Date().toISOString()
        });
        if (error) throw error;
        toast.success("Regla pre-acordada guardada");
        setVpForm({ product_id: "", min_quantity: "", unit_price_usd: "", valid_until: "" });
        fetchData();
     } catch (err: any) {
        toast.error("Error", { description: err.message });
     } finally {
        setSavingVP(false);
     }
  };

  const handleDeleteVP = async (vpId: string) => {
     try {
        await supabase.from("volume_prices").delete().eq("id", vpId);
        toast.success("Regla eliminada");
        fetchData();
     } catch (e: any) { toast.error("Error", {description: e.message}); }
  };

  // ── Sort & Filter ─────────────────────────────────────────────────────────
  const filteredHistory = priceHistory
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.product_name.toLowerCase().includes(q) ||
        item.product_sku.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "product") cmp = a.product_name.localeCompare(b.product_name);
      else if (sortField === "date")
        cmp = new Date(a.last_purchase).getTime() - new Date(b.last_purchase).getTime();
      else if (sortField === "price") cmp = a.last_price_usd - b.last_price_usd;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={cn(
        "w-3 h-3 ml-1 inline transition-colors",
        sortField === field ? "text-brand" : "text-text-3"
      )}
    />
  );

  const groupedVolumePrices = useMemo(() => {
     const map = new Map<string, VolumePrice[]>();
     volumePrices.forEach(v => {
        if (!map.has(v.product_id)) map.set(v.product_id, []);
        map.get(v.product_id)!.push(v);
     });
     return map;
  }, [volumePrices]);

  if (loading)
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );

  if (!supplier) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-surface-card border border-border text-text-3 hover:text-text-1 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-montserrat font-bold text-text-1">
                {supplier.name}
              </h1>
              <p className="text-xs text-text-3 font-mono">{supplier.rif}</p>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-[11px] font-bold border",
            supplier.is_active
              ? "bg-status-ok/10 text-status-ok border-status-ok/20"
              : "bg-text-3/10 text-text-3 border-border"
          )}
        >
          {supplier.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: User, label: "Contacto", value: supplier.contact_name ?? "–" },
          { icon: Phone, label: "Teléfono", value: supplier.phone ?? "–" },
          { icon: Mail, label: "Email", value: supplier.email ?? "–" },
          { icon: MapPin, label: "Dirección", value: supplier.address ?? "–" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-3.5 bg-surface-card border-border space-y-1.5">
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-brand" />
              {label}
            </p>
            <p className="text-xs text-text-2 truncate" title={value}>
              {value}
            </p>
          </Card>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-border mt-6">
         <button onClick={() => setActiveTab("resumen")} className={cn("px-4 py-3 font-bold border-b-2 text-sm transition-all", activeTab === "resumen" ? "border-brand text-brand" : "border-transparent text-text-3 hover:text-text-1")}>
            Historial de Compras
         </button>
         <button onClick={() => setActiveTab("volumen")} className={cn("px-4 py-3 font-bold border-b-2 text-sm transition-all flex items-center gap-2", activeTab === "volumen" ? "border-brand text-brand" : "border-transparent text-text-3 hover:text-text-1")}>
            Precios por Volumen 
            {volumePrices.length > 0 && <span className="bg-brand/10 text-brand text-[10px] px-1.5 py-0.5 rounded-full">{volumePrices.length} reglas</span>}
         </button>
      </div>

      {activeTab === "resumen" && (
         <div className="space-y-6 animate-fade-in">
           {/* KPI Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <Card className="p-5 bg-gradient-to-br from-brand/5 to-surface-card border-brand/20">
               <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <ClipboardList className="w-3 h-3 text-brand" /> Total Órdenes
               </p>
               <p className="text-3xl font-montserrat font-bold text-brand">{totalOrders}</p>
             </Card>
             <Card className="p-5 bg-surface-card border-border">
               <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <DollarSign className="w-3 h-3 text-status-ok" /> Comprado Total
               </p>
               <p className="text-3xl font-montserrat font-bold text-status-ok">
                 ${totalSpent.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
               </p>
             </Card>
             <Card className="p-5 bg-surface-card border-border">
               <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <Package className="w-3 h-3 text-[#7C4DFF]" /> Productos Distintos
               </p>
               <p className="text-3xl font-montserrat font-bold text-[#7C4DFF]">
                 {priceHistory.length}
               </p>
             </Card>
           </div>

           {/* Price History Section */}
           <Card className="overflow-hidden bg-surface-card border-border">
             <div className="p-4 bg-surface-base/40 border-b border-border">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                 <h2 className="font-montserrat font-bold text-text-1 text-sm flex items-center gap-2">
                   <TrendingUp className="w-4 h-4 text-brand" />
                   Historial de Precios por Producto
                 </h2>
                 <div className="relative w-full sm:w-72">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                   <Input
                     placeholder="Buscar producto o SKU..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10 bg-surface-input border-border/50 h-9 text-sm"
                   />
                 </div>
               </div>
             </div>

             {filteredHistory.length === 0 ? (
               <div className="py-16 flex flex-col items-center gap-3 text-text-3">
                 <Package className="w-12 h-12 opacity-20" />
                 <p className="text-sm">
                   {priceHistory.length === 0
                     ? "Aún no hay historial de precios con este proveedor"
                     : "Sin resultados para la búsqueda"}
                 </p>
                 <p className="text-xs opacity-60">
                   Los datos se generan automáticamente al emitir Órdenes de Compra
                 </p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                     <tr>
                       <th
                         className="px-5 py-3 cursor-pointer hover:text-text-1 transition-colors"
                         onClick={() => handleSort("product")}
                       >
                         Producto <SortIcon field="product" />
                       </th>
                       <th className="px-5 py-3">SKU</th>
                       <th className="px-5 py-3 text-right">Últ. Cant.</th>
                       <th
                         className="px-5 py-3 text-right cursor-pointer hover:text-text-1 transition-colors"
                         onClick={() => handleSort("price")}
                       >
                         Precio USD <SortIcon field="price" />
                       </th>
                       <th className="px-5 py-3 text-right">Precio Bs.</th>
                       <th className="px-5 py-3 text-center">Variación</th>
                       <th
                         className="px-5 py-3 cursor-pointer hover:text-text-1 transition-colors"
                         onClick={() => handleSort("date")}
                       >
                         Última Compra <SortIcon field="date" />
                       </th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {filteredHistory.map((item) => (
                       <motion.tr
                         key={item.product_id}
                         initial={{ opacity: 0, y: 4 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="hover:bg-surface-hover/20 transition-colors"
                       >
                         <td className="px-5 py-4">
                           <p className="font-bold text-text-1">{item.product_name}</p>
                           {item.prev_price_usd !== null && (
                             <p className="text-[10px] text-text-3 mt-0.5">
                               Anterior: <span className="font-mono">${item.prev_price_usd.toFixed(4)}</span>
                             </p>
                           )}
                         </td>
                         <td className="px-5 py-4">
                           <span className="font-mono text-[10px] border px-1.5 py-0.5 rounded-md text-text-3">
                             {item.product_sku}
                           </span>
                         </td>
                         <td className="px-5 py-4 text-right font-bold text-text-1 font-mono">
                           {item.last_qty}
                         </td>
                         <td className="px-5 py-4 text-right">
                           <span className="font-bold font-mono text-text-1">
                             ${item.last_price_usd.toFixed(4)}
                           </span>
                         </td>
                         <td className="px-5 py-4 text-right">
                           <span className="font-mono text-[10px] text-text-3">
                             Bs. {item.last_price_bs.toFixed(2)}
                           </span>
                         </td>
                         <td className="px-5 py-4 text-center">
                           <VariationBadge pct={item.variation_pct} />
                         </td>
                         <td className="px-5 py-4">
                           <p className="text-xs text-text-2">
                             {format(new Date(item.last_purchase), "dd MMM yyyy", { locale: es })}
                           </p>
                           <p className="text-[10px] text-text-3 mt-0.5">
                             {formatDistanceToNow(new Date(item.last_purchase), {
                               addSuffix: true,
                               locale: es,
                             })}
                           </p>
                         </td>
                       </motion.tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </Card>
         </div>
      )}

      {activeTab === "volumen" && (
         <div className="space-y-6 animate-fade-in">
            <div className="bg-brand/10 border border-brand/20 p-4 rounded-xl flex items-start gap-4">
               <div className="bg-brand rounded-full p-2 mt-1">
                  <Package className="w-5 h-5 text-white" />
               </div>
               <div>
                  <h3 className="font-bold text-sm text-brand mb-1">Automatiza descuentos por volumen</h3>
                  <p className="text-xs text-brand/80">Agrega acuerdos pactados con este proveedor. Cuando incluyas este producto en una Nueva Orden de Compra, el sistema detectará la cantidad seleccionada y ajustará el precio unitario automáticamente.</p>
               </div>
            </div>

            <Card className="p-4 bg-surface-card border-border overflow-visible">
               <h3 className="text-xs font-bold uppercase tracking-widest text-text-3 mb-4">Añadir Nueva Regla</h3>
               <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <div className="sm:col-span-2">
                     <label className="text-[10px] font-bold text-text-3 block mb-1">Producto <span className="text-status-danger">*</span></label>
                     <Select value={vpForm.product_id} onValueChange={(val) => setVpForm(p => ({...p, product_id: val}))}>
                        <SelectTrigger className="bg-surface-input border-border/50 text-sm h-10"><SelectValue placeholder="Selecciona un producto..."/></SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                           {products.map(p => <SelectItem key={p.id} value={p.id}>{p.sku} - {p.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-text-3 block mb-1">Llevando más de... <span className="text-status-danger">*</span></label>
                     <Input type="number" min="1" placeholder="Ej: 50" value={vpForm.min_quantity} onChange={e => setVpForm(p => ({...p, min_quantity: e.target.value}))} className="bg-surface-input border-border/50 h-10 font-mono" />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-text-3 block mb-1">Precio Unitario (USD) <span className="text-status-danger">*</span></label>
                     <Input type="number" step="0.0001" placeholder="Ej: 4.5" value={vpForm.unit_price_usd} onChange={e => setVpForm(p => ({...p, unit_price_usd: e.target.value}))} className="bg-surface-input border-border/50 h-10 font-mono" />
                  </div>
                  {/*<div>
                     <label className="text-[10px] font-bold text-text-3 block mb-1 whitespace-nowrap">Válido hasta</label>
                     <Input type="date" value={vpForm.valid_until} onChange={e => setVpForm(p => ({...p, valid_until: e.target.value}))} className="bg-surface-input border-border/50 h-10" />
                  </div>*/}
                  <div className="pt-2">
                     <button disabled={savingVP} onClick={handleSaveVP} className="w-full h-10 bg-brand text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 hover:opacity-90">
                        {savingVP ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />} Agregar
                     </button>
                  </div>
               </div>
            </Card>

            <div className="space-y-4">
              {Array.from(groupedVolumePrices.entries()).map(([productId, rules]) => {
                 const prod = rules[0].products;
                 return (
                    <Card key={productId} className="overflow-hidden bg-surface-card border-border">
                       <div className="bg-surface-base/50 p-3 border-b border-border flex justify-between items-center">
                          <p className="font-bold text-sm text-text-1">{prod?.name} <span className="font-mono text-[10px] text-text-3 ml-2 border px-1.5 py-0.5 rounded">{prod?.sku}</span></p>
                       </div>
                       <table className="w-full text-sm">
                          <tbody className="divide-y divide-border/50">
                             {rules.sort((a,b)=>a.min_quantity - b.min_quantity).map(rule => (
                                <tr key={rule.id} className="hover:bg-surface-hover/10">
                                   <td className="px-4 py-3 w-1/3">
                                      <span className="text-xs text-text-2 bg-surface-base border border-border px-2 py-1 rounded w-fit inline-flex items-center gap-1.5 font-bold">
                                         <ArrowUpDown className="w-3 h-3 text-brand"/> {rule.min_quantity}+ unidades
                                      </span>
                                   </td>
                                   <td className="px-4 py-3 font-mono font-bold text-status-ok text-right">
                                      ${Number(rule.unit_price_usd).toFixed(4)} <span className="text-[10px] font-sans text-text-3 ml-1">/c.u</span>
                                   </td>
                                   <td className="px-4 py-3 text-right">
                                      <button onClick={() => handleDeleteVP(rule.id)} className="p-1.5 text-text-3 hover:text-status-danger hover:bg-status-danger/10 rounded transition-colors inline-block" title="Eliminar regla"><Trash2 className="w-4 h-4"/></button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </Card>
                 )
              })}
              {volumePrices.length === 0 && (
                 <div className="py-10 text-center text-text-3 border-2 border-dashed border-border rounded-xl">
                    <p className="text-sm font-bold">No hay precios por volumen configurados.</p>
                    <p className="text-xs">Usa el formulario superior para añadir la primera regla.</p>
                 </div>
              )}
            </div>
         </div>
      )}
    </div>
  );
}
