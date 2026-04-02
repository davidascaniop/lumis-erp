"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, Plus, ClipboardList, DollarSign,
  X, ChevronRight, Truck, CheckCircle2, XCircle, Clock,
  FileText, AlertCircle, ShoppingBag, Wallet, TrendingUp, TrendingDown, History,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBCV } from "@/hooks/use-bcv";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type PurchaseStatus = "draft" | "confirmed" | "partial" | "received" | "cancelled";

interface PurchaseItem {
  id?: string;
  product_id: string;
  product_name: string;
  sku: string;
  qty: number;
  qty_received: number;
  unit_cost_usd: number;
  subtotal_usd: number;
}

interface Purchase {
  id: string;
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
  created_at: string;
  suppliers?: { name: string; rif: string; phone: string | null } | null;
  _item_count?: number;
}

interface Supplier { id: string; name: string; rif: string }
interface Product  { id: string; name: string; sku: string | null; cost_usd: number | null }

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<PurchaseStatus, { label: string; cls: string; icon: any }> = {
  draft:     { label: "Borrador",            cls: "bg-surface-base text-text-3 border-border",                    icon: FileText     },
  confirmed: { label: "Emitida",              cls: "bg-status-info/10 text-status-info border-status-info/20",   icon: ShoppingBag  },
  partial:   { label: "Recib. Parcialmente",  cls: "bg-status-warn/10 text-status-warn border-status-warn/20",   icon: AlertCircle  },
  received:  { label: "Recibida",             cls: "bg-status-ok/10 text-status-ok border-status-ok/20",          icon: CheckCircle2 },
  cancelled: { label: "Cancelada",            cls: "bg-status-danger/10 text-status-danger border-status-danger/20", icon: XCircle  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrdenesCompraPage() {
  const supabase = createClient();
  const { rate: bcvRate } = useBCV();

  const [purchases, setPurchases]     = useState<Purchase[]>([]);
  const [loading, setLoading]         = useState(true);
  const [companyId, setCompanyId]     = useState<string | null>(null);
  const [search, setSearch]           = useState("");

  // New order modal
  const [newOpen, setNewOpen]         = useState(false);
  const [suppliers, setSuppliers]     = useState<Supplier[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [prodSearch, setProdSearch]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [priceHints, setPriceHints]   = useState<Record<string, { lastPrice: number | null; lastDays: number | null; bestPrice: number | null; bestSupplier: string | null; isFirst: boolean }>>({}); 
  const [form, setForm] = useState({ 
    supplier_id: "", 
    expected_date: "", 
    emission_date: new Date().toISOString().split("T")[0], 
    notes: "" 
  });
  const [items, setItems]             = useState<PurchaseItem[]>([]);

  // Quick Supplier Form
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [quickSupplier, setQuickSupplier] = useState({ name: "", rif: "", phone: "", email: "" });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ud } = await supabase.from("users").select("company_id").eq("auth_id", user.id).single();
      if (!ud) return;
      setCompanyId(ud.company_id);

      const { data } = await supabase
        .from("purchases")
        .select("*, suppliers(name,rif,phone)")
        .eq("company_id", ud.company_id)
        .order("created_at", { ascending: false });

      // Fetch item counts
      const ids = (data ?? []).map((p: any) => p.id);
      let counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: ic } = await supabase.from("purchase_items").select("purchase_id").in("purchase_id", ids);
        (ic ?? []).forEach((r: any) => { counts[r.purchase_id] = (counts[r.purchase_id] ?? 0) + 1; });
      }
      setPurchases(((data as any[]) ?? []).map(p => ({ ...p, _item_count: counts[p.id] ?? 0 })));
    } catch { toast.error("Error al cargar órdenes"); }
    finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonth = useMemo(() => purchases.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }), [purchases]);
  const pending = useMemo(() => purchases.filter(p => ["confirmed","partial"].includes(p.status)), [purchases]);
  const inTransitTotal = useMemo(() => pending.reduce((s,p) => s + (p.total_usd ?? 0), 0), [pending]);

  const filtered = useMemo(() => purchases.filter(p => {
    const q = search.toLowerCase();
    return (p.purchase_number ?? "").toLowerCase().includes(q) || (p.suppliers?.name ?? "").toLowerCase().includes(q);
  }), [purchases, search]);

  // ── Meta Data Loading ─────────────────────────────────────────────────────
  const loadMeta = useCallback(async () => {
    if (!companyId) return;
    const [{ data: s }, { data: pr }] = await Promise.all([
      supabase.from("suppliers").select("id,name,rif").eq("company_id", companyId).order("name"),
      supabase.from("products").select("id,name,sku,cost_usd").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);
    setSuppliers((s as Supplier[]) ?? []);
    setProducts((pr as Product[]) ?? []);
  }, [companyId, supabase]);

  const handleOpenNew = async () => {
    setForm({ 
      supplier_id: "", 
      expected_date: "", 
      emission_date: new Date().toISOString().split("T")[0], 
      notes: "" 
    });
    setItems([]);
    setProdSearch("");
    setShowQuickSupplier(false);
    await loadMeta();
    setNewOpen(true);
  };

  // ── Quick Supplier Logic ──────────────────────────────────────────────────
  const handleCreateSupplier = async () => {
    if (!quickSupplier.name || !quickSupplier.rif) {
      toast.error("Nombre y RIF son obligatorios");
      return;
    }
    try {
      const { data, error } = await supabase.from("suppliers").insert({
        company_id: companyId,
        name: quickSupplier.name,
        rif: quickSupplier.rif,
        phone: quickSupplier.phone,
        email: quickSupplier.email,
      }).select().single();

      if (error) throw error;
      
      const newSup = data as Supplier;
      setSuppliers(prev => [newSup, ...prev]);
      setForm(p => ({ ...p, supplier_id: newSup.id }));
      setShowQuickSupplier(false);
      setQuickSupplier({ name: "", rif: "", phone: "", email: "" });
      toast.success("Proveedor creado y seleccionado");
    } catch (e: any) {
      toast.error("Error al crear proveedor", { description: e.message });
    }
  };

  // ── Order Items Logic ─────────────────────────────────────────────────────
  const addProduct = (prod: Product) => {
    if (items.find(i => i.product_id === prod.id)) return;
    setItems(prev => [...prev, { 
      product_id: prod.id, 
      product_name: prod.name, 
      sku: prod.sku ?? "", 
      qty: 1, 
      qty_received: 0, 
      unit_cost_usd: prod.cost_usd ?? 0, 
      subtotal_usd: prod.cost_usd ?? 0 
    }]);
    setProdSearch("");
  };

  const updateItem = (idx: number, field: "qty" | "unit_cost_usd", val: number) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const u = { ...it, [field]: val };
      u.subtotal_usd = u.qty * u.unit_cost_usd;
      return u;
    }));
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalUSD = useMemo(() => items.reduce((s, i) => s + i.subtotal_usd, 0), [items]);
  const totalBS  = useMemo(() => bcvRate ? totalUSD * bcvRate : 0, [totalUSD, bcvRate]);

  // ── Saving Order ──────────────────────────────────────────────────────────
  const handleSave = async (emit: boolean) => {
    if (!form.supplier_id) { toast.error("Selecciona un proveedor"); return; }
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return; }
    if (!companyId) return;
    
    setSaving(true);
    try {
      const pNum = `OC-${Date.now().toString().slice(-6)}`;
      const status: PurchaseStatus = emit ? "confirmed" : "draft";
      const currentRate = bcvRate || 1;

      // 1. Create Purchase record
      const { data: purchase, error } = await supabase.from("purchases")
        .insert({ 
          company_id: companyId, 
          supplier_id: form.supplier_id, 
          purchase_number: pNum, 
          subtotal_usd: totalUSD, 
          total_usd: totalUSD, 
          exchange_rate: currentRate,
          total_bs: totalBS,
          status, 
          notes: form.notes || null, 
          expected_date: form.expected_date || null,
          created_at: form.emission_date ? new Date(form.emission_date).toISOString() : new Date().toISOString()
        } as any)
        .select().single();

      if (error) throw error;

      // 2. Create items
      await supabase.from("purchase_items").insert(items.map(it => ({ 
        purchase_id: (purchase as any).id, 
        product_id: it.product_id, 
        qty: it.qty, 
        unit_cost_usd: it.unit_cost_usd, 
        total_unit_cost_usd: it.unit_cost_usd, 
        subtotal_usd: it.subtotal_usd 
      })) as any);

      // 3. If emitted, create expense in CxP + price history
      if (emit) {
        await supabase.from("expenses").insert({
          company_id: companyId,
          supplier_id: form.supplier_id,
          description: `Orden de Compra ${pNum}`,
          amount_usd: totalUSD,
          amount_bs: totalBS,
          exchange_rate: currentRate,
          status: "pending",
          purchase_id: (purchase as any).id,
          type: "compra",
          date: form.emission_date || new Date().toISOString()
        } as any);

        // 4. Insert price history for each item
        await supabase.from("purchase_price_history").insert(items.map(it => ({
          company_id: companyId,
          product_id: it.product_id,
          supplier_id: form.supplier_id,
          purchase_order_id: (purchase as any).id,
          unit_price_usd: it.unit_cost_usd,
          unit_price_bs: it.unit_cost_usd * currentRate,
          bcv_rate: currentRate,
          quantity: it.qty,
          purchased_at: form.emission_date ? new Date(form.emission_date).toISOString() : new Date().toISOString()
        })) as any);
      }

      toast.success(emit ? `Orden ${pNum} emitida ✓` : `Borrador ${pNum} guardado`);
      setNewOpen(false);
      fetchData();
    } catch (e: any) { 
      toast.error("Error al guardar", { description: e.message }); 
    } finally { 
      setSaving(false); 
    }
  };

  const filteredProds = products.filter(p =>
    (p.name.toLowerCase().includes(prodSearch.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(prodSearch.toLowerCase())) &&
    !items.find(i => i.product_id === p.id)
  ).slice(0, 8);

  // ── Price Hints (PASO 2) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!form.supplier_id || !companyId || filteredProds.length === 0) return;
    const fetchHints = async () => {
      const prodIds = filteredProds.map(p => p.id);
      const { data: history } = await supabase
        .from("purchase_price_history")
        .select("product_id, supplier_id, unit_price_usd, purchased_at, suppliers:supplier_id(name)")
        .eq("company_id", companyId)
        .in("product_id", prodIds)
        .order("purchased_at", { ascending: false });

      const hints: typeof priceHints = {};
      for (const prod of filteredProds) {
        const forProduct = (history as any[] ?? []).filter((h: any) => h.product_id === prod.id);
        const withSupplier = forProduct.filter((h: any) => h.supplier_id === form.supplier_id);
        const best = forProduct.length > 0 ? forProduct.reduce((a: any, b: any) => a.unit_price_usd < b.unit_price_usd ? a : b) : null;

        if (withSupplier.length > 0) {
          const last = withSupplier[0];
          const daysDiff = Math.round((Date.now() - new Date(last.purchased_at).getTime()) / 86400000);
          hints[prod.id] = {
            lastPrice: last.unit_price_usd,
            lastDays: daysDiff,
            bestPrice: best && best.supplier_id !== form.supplier_id ? best.unit_price_usd : null,
            bestSupplier: best && best.supplier_id !== form.supplier_id ? best.suppliers?.name ?? null : null,
            isFirst: false
          };
        } else {
          hints[prod.id] = {
            lastPrice: null, lastDays: null,
            bestPrice: best ? best.unit_price_usd : null,
            bestSupplier: best ? best.suppliers?.name ?? null : null,
            isFirst: true
          };
        }
      }
      setPriceHints(hints);
    };
    fetchHints();
  }, [prodSearch, form.supplier_id, companyId]);

  const handleCancel = async (p: Purchase) => {
    if (!confirm(`¿Estás seguro de cancelar la orden ${p.purchase_number}?`)) return;
    try {
      await supabase.from("purchases").update({ status: "cancelled" } as any).eq("id", p.id);
      toast.success("Orden cancelada");
      fetchData();
    } catch {
      toast.error("Error al cancelar");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header Paso 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Órdenes de Compra</h1>
          <p className="text-text-2 mt-1 text-sm">Gestiona todo el ciclo de compra desde un solo lugar</p>
        </div>
        <button onClick={handleOpenNew}
          className="px-6 py-3 bg-brand-gradient text-white font-bold font-montserrat rounded-xl text-sm shadow-brand hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>
      </div>

      {/* KPI Cards Paso 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Órdenes del Mes",       value: loading ? "–" : thisMonth.length, icon: ClipboardList, color: "text-brand",      bg: "bg-brand/10" },
          { label: "Pendientes de Recibir",  value: loading ? "–" : pending.length,  icon: Truck,         color: "text-status-warn", bg: "bg-status-warn/10" },
          { label: "Valor Total en Tránsito", value: loading ? "–" : `$${inTransitTotal.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-status-ok", bg: "bg-status-ok/10" },
        ].map((c, idx) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}>
            <Card className="p-5 bg-surface-card shadow-card border-border/50 flex items-center gap-4 hover-card-effect transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg}`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs font-montserrat font-bold text-text-1">{c.label}</p>
                <p className="text-2xl font-montserrat font-bold text-text-1">{c.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabla Paso 2 */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-border bg-surface-base/50 flex justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input placeholder="Buscar por número o proveedor..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm" />
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>{["Nº Orden", "Proveedor", "Items", "Total USD", "Total BS", "Emisión", "F. Esperada", "Estado", "Acciones"].map(h => (
                <th key={h} className="px-5 py-4 font-bold font-montserrat text-[11px] text-text-1 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={9} className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-24 text-center text-text-3">No hay órdenes registradas</td></tr>
              ) : filtered.map((p, idx) => (
                <motion.tr key={p.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                  className="hover:bg-surface-hover/30 transition-colors group">
                  <td className="px-5 py-4"><span className="font-mono font-bold text-brand">{p.purchase_number ?? "–"}</span></td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-text-1">{p.suppliers?.name ?? "–"}</p>
                    <p className="text-[10px] text-text-3 font-mono">{p.suppliers?.rif}</p>
                  </td>
                  <td className="px-5 py-4 text-text-2 text-xs">{p._item_count ?? 0} ítems</td>
                  <td className="px-5 py-4 font-bold text-text-1">${(p.total_usd ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 text-text-3 text-xs">Bs. {(p.total_bs ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 text-text-2 text-xs">{format(new Date(p.created_at), "dd/MM/yyyy")}</td>
                  <td className="px-5 py-4 text-text-2 text-xs">{(p.expected_date) ? format(new Date(p.expected_date + "T00:00:00"), "dd/MM/yyyy") : "–"}</td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border", STATUS_CFG[p.status]?.cls || "bg-surface-base text-text-3")}>
                      {STATUS_CFG[p.status]?.label || p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/compras/ordenes/${p.id}`} 
                        className="p-2 rounded-lg bg-brand/5 text-brand hover:bg-brand hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      {!["received", "cancelled"].includes(p.status) && (
                        <button onClick={() => handleCancel(p)} className="p-2 rounded-lg bg-status-danger/5 text-status-danger hover:bg-status-danger hover:text-white transition-all">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL Nueva Orden Paso 3 ── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-xl text-text-1 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand" /> Nueva Orden de Compra
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sección Proveedor */}
            <div className="bg-surface-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-montserrat text-text-1">Proveedor</h3>
                {!showQuickSupplier && (
                  <button onClick={() => setShowQuickSupplier(true)} className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Crear proveedor rápido
                  </button>
                )}
              </div>

              {showQuickSupplier ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-surface-base border border-dashed border-brand/30 rounded-xl">
                  <Input placeholder="Nombre / Razón Social" value={quickSupplier.name} onChange={e => setQuickSupplier(p => ({ ...p, name: e.target.value }))} className="h-10 text-xs" />
                  <Input placeholder="RIF (J-12345678-0)" value={quickSupplier.rif} onChange={e => setQuickSupplier(p => ({ ...p, rif: e.target.value }))} className="h-10 text-xs" />
                  <Input placeholder="Teléfono" value={quickSupplier.phone} onChange={e => setQuickSupplier(p => ({ ...p, phone: e.target.value }))} className="h-10 text-xs" />
                  <Input placeholder="Email" value={quickSupplier.email} onChange={e => setQuickSupplier(p => ({ ...p, email: e.target.value }))} className="h-10 text-xs" />
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => setShowQuickSupplier(false)} className="px-3 py-1 text-[10px] font-bold text-text-3">Cancelar</button>
                    <button onClick={handleCreateSupplier} className="px-4 py-1.5 bg-brand text-white rounded-lg text-[10px] font-bold">Guardar y Seleccionar</button>
                  </div>
                </div>
              ) : (
                <Select value={form.supplier_id} onValueChange={v => setForm(p => ({ ...p, supplier_id: v }))}>
                  <SelectTrigger className="w-full bg-surface-input border-border/40 h-11 text-text-1 font-montserrat">
                    <SelectValue placeholder="Seleccionar proveedor de la lista..." />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-elevated border-border">
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} <span className="text-[10px] text-text-3 ml-2">{s.rif}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Sección Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-montserrat text-text-1">Fecha de Emisión</label>
                <Input type="date" value={form.emission_date} onChange={e => setForm(p => ({ ...p, emission_date: e.target.value }))} className="h-11 bg-surface-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-montserrat text-text-1">Fecha Esperada de Recepción</label>
                <Input type="date" value={form.expected_date} onChange={e => setForm(p => ({ ...p, expected_date: e.target.value }))} className="h-11 bg-surface-input" />
              </div>
            </div>

            {/* Sección Productos */}
            <div className="space-y-3">
              <label className="text-xs font-bold font-montserrat text-text-1">Agregar Productos</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <Input placeholder="Buscar por nombre o SKU..." value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  className="pl-10 h-11 bg-surface-input" />
              </div>
              {prodSearch && filteredProds.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden bg-surface-card shadow-lg">
                  {filteredProds.map(p => {
                    const hint = priceHints[p.id];
                    return (
                      <button key={p.id} onClick={() => addProduct(p)} className="w-full p-3 hover:bg-brand/5 border-b border-border last:border-b-0 text-left">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-text-1">{p.name}</p>
                            <p className="text-[10px] text-text-3 font-mono">{p.sku}</p>
                          </div>
                          <span className="text-xs font-bold text-brand">${p.cost_usd?.toFixed(2)}</span>
                        </div>
                        {hint && form.supplier_id && (
                          <div className="mt-1.5 space-y-0.5">
                            {hint.isFirst ? (
                              <p className="text-[10px] text-text-3 flex items-center gap-1"><History className="w-3 h-3" /> Primera compra de este producto con este proveedor</p>
                            ) : (
                              <p className="text-[10px] text-status-info flex items-center gap-1"><History className="w-3 h-3" /> Último precio con este proveedor: <strong>${hint.lastPrice?.toFixed(2)}</strong> (hace {hint.lastDays} días)</p>
                            )}
                            {hint.bestPrice && hint.bestSupplier && (
                              <p className="text-[10px] text-status-ok flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Mejor precio histórico: <strong>${hint.bestPrice?.toFixed(2)}</strong> — {hint.bestSupplier}</p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-base border-b border-border">
                      <tr>
                        <th className="px-3 py-3 text-left">Producto</th>
                        <th className="px-3 py-3 text-center">Cant.</th>
                        <th className="px-3 py-3 text-right">Precio Unit. (USD)</th>
                        <th className="px-3 py-3 text-right">Subtotal</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((it, idx) => (
                        <tr key={it.product_id}>
                          <td className="px-3 py-3">
                            <p className="font-bold text-text-1">{it.product_name}</p>
                            <p className="text-[10px] text-text-3 font-mono">{it.sku}</p>
                          </td>
                          <td className="px-3 py-3 w-20">
                            <input type="number" min={1} value={it.qty} onChange={e => updateItem(idx, "qty", +e.target.value)}
                              className="w-full bg-surface-input border border-border/50 rounded-lg p-1.5 text-center font-bold" />
                          </td>
                          <td className="px-3 py-3 w-32">
                            <input type="number" step="0.01" value={it.unit_cost_usd} onChange={e => updateItem(idx, "unit_cost_usd", +e.target.value)}
                              className="w-full bg-surface-input border border-border/50 rounded-lg p-1.5 text-right font-mono" />
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-text-1 font-mono">${it.subtotal_usd.toFixed(2)}</td>
                          <td className="px-3 py-3 text-center">
                            <button onClick={() => removeItem(idx)} className="text-status-danger p-1"><X className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-base border-t-2 border-border">
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-right font-bold text-text-1 uppercase text-[10px]">Total de la Orden</td>
                        <td className="px-3 py-4 text-right">
                          <p className="text-lg font-bold text-brand font-mono">${totalUSD.toFixed(2)}</p>
                          <p className="text-[10px] text-text-3 font-mono">≈ Bs. {totalBS.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Sección Notas */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">Notas u observaciones</label>
              <textarea placeholder="Condiciones de pago, instrucciones especiales..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={3} className="w-full p-3 bg-surface-input border border-border rounded-xl text-sm outline-none focus:border-brand/40 transition-all resize-none" />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 mt-4">
            <button onClick={() => setNewOpen(false)} className="px-5 py-2 text-text-3 font-bold text-sm">Cancelar</button>
            <div className="flex gap-2">
              <button disabled={saving} onClick={() => handleSave(false)} className="px-6 py-2.5 bg-surface-elevated border border-border text-text-1 font-bold text-sm rounded-xl hover:bg-surface-hover/30 transition-all">
                Guardar Borrador
              </button>
              <button disabled={saving} onClick={() => handleSave(true)} className="px-8 py-2.5 bg-brand-gradient text-white font-bold text-sm rounded-xl shadow-brand hover:opacity-90 transition-all flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                Emitir Orden
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
