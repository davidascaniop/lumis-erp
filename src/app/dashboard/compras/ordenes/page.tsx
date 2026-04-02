"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  Search, Loader2, Plus, ClipboardList, DollarSign,
  X, ChevronRight, Truck, CheckCircle2, XCircle, Clock,
  FileText, AlertCircle,
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
  confirmed: { label: "Enviada al Proveedor", cls: "bg-status-info/10 text-status-info border-status-info/20",   icon: Truck        },
  partial:   { label: "Recib. Parcialmente",  cls: "bg-status-warn/10 text-status-warn border-status-warn/20",   icon: AlertCircle  },
  received:  { label: "Recibida",             cls: "bg-status-ok/10 text-status-ok border-status-ok/20",          icon: CheckCircle2 },
  cancelled: { label: "Cancelada",            cls: "bg-status-danger/10 text-status-danger border-status-danger/20", icon: XCircle  },
};

const TIMELINE: PurchaseStatus[] = ["draft", "confirmed", "partial", "received"];

function StatusBadge({ status }: { status: PurchaseStatus }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${c.cls}`}>
      <c.icon className="w-3 h-3" />{c.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OrdenesCompraPage() {
  const supabase = createClient();

  const [purchases, setPurchases]     = useState<Purchase[]>([]);
  const [loading, setLoading]         = useState(true);
  const [companyId, setCompanyId]     = useState<string | null>(null);
  const [userId, setUserId]           = useState<string | null>(null);
  const [search, setSearch]           = useState("");

  // New order modal
  const [newOpen, setNewOpen]         = useState(false);
  const [suppliers, setSuppliers]     = useState<Supplier[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [prodSearch, setProdSearch]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [form, setForm] = useState({ supplier_id: "", expected_date: "", emission_date: "", notes: "" });
  const [items, setItems]             = useState<PurchaseItem[]>([]);

  // Detail modal
  const [detailOpen, setDetailOpen]   = useState(false);
  const [selected, setSelected]       = useState<Purchase | null>(null);
  const [detailItems, setDetailItems] = useState<PurchaseItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [receiving, setReceiving]     = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ud } = await supabase.from("users").select("id,company_id").eq("auth_id", user.id).single();
      if (!ud) return;
      setCompanyId(ud.company_id);
      setUserId(ud.id);

      const { data } = await supabase
        .from("purchases")
        .select("*, suppliers(name,rif,phone)")
        .eq("company_id", ud.company_id)
        .order("created_at", { ascending: false });

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

  // ── Load meta ─────────────────────────────────────────────────────────────
  const loadMeta = useCallback(async () => {
    if (!companyId) return;
    const [{ data: s }, { data: pr }] = await Promise.all([
      supabase.from("suppliers").select("id,name,rif").eq("company_id", companyId).eq("is_active", true).order("name"),
      supabase.from("products").select("id,name,sku,cost_usd").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);
    setSuppliers((s as Supplier[]) ?? []);
    setProducts((pr as Product[]) ?? []);
  }, [companyId, supabase]);

  const handleOpenNew = async () => {
    setForm({ supplier_id: "", expected_date: "", emission_date: "", notes: "" });
    setItems([]);
    setProdSearch("");
    await loadMeta();
    setNewOpen(true);
  };

  // ── Product lines ─────────────────────────────────────────────────────────
  const addProduct = (prod: Product) => {
    if (items.find(i => i.product_id === prod.id)) return;
    setItems(prev => [...prev, { product_id: prod.id, product_name: prod.name, sku: prod.sku ?? "", qty: 1, qty_received: 0, unit_cost_usd: prod.cost_usd ?? 0, subtotal_usd: prod.cost_usd ?? 0 }]);
    setProdSearch("");
  };
  const updateItem = (idx: number, field: "qty" | "unit_cost_usd", val: number) => {
    setItems(prev => prev.map((it, i) => { if (i !== idx) return it; const u = { ...it, [field]: val }; u.subtotal_usd = u.qty * u.unit_cost_usd; return u; }));
  };
  const removeItem = (idx: number) => setItems(prev => prev.filter((_,i) => i !== idx));
  const total = useMemo(() => items.reduce((s,i) => s + i.subtotal_usd, 0), [items]);

  // ── Save order ─────────────────────────────────────────────────────────────
  const handleSave = async (emit: boolean) => {
    if (!form.supplier_id) { toast.error("Selecciona un proveedor"); return; }
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return; }
    if (!companyId) return;
    setSaving(true);
    try {
      const pNum = `OC-${Date.now().toString().slice(-6)}`;
      const status: PurchaseStatus = emit ? "confirmed" : "draft";
      const { data: purchase, error } = await supabase.from("purchases")
        .insert({ company_id: companyId, supplier_id: form.supplier_id, purchase_number: pNum, subtotal_usd: total, total_usd: total, exchange_rate: 1, status, notes: form.notes || null, expected_date: form.expected_date || null } as any)
        .select().single();
      if (error) throw error;

      await supabase.from("purchase_items").insert(items.map(it => ({ purchase_id: (purchase as any).id, product_id: it.product_id, qty: it.qty, unit_cost_usd: it.unit_cost_usd, total_unit_cost_usd: it.unit_cost_usd, subtotal_usd: it.subtotal_usd })) as any);

      if (emit) {
        // Create pending expense in CxP
        await supabase.from("expenses").insert({ company_id: companyId, supplier_id: form.supplier_id, description: `Orden de Compra ${pNum}`, amount_usd: total, status: "pending", purchase_id: (purchase as any).id } as any);
      }

      toast.success(emit ? `Orden ${pNum} emitida ✓` : `Borrador ${pNum} guardado`);
      setNewOpen(false);
      fetchData();
    } catch (e: any) { toast.error("Error al guardar", { description: e.message }); }
    finally { setSaving(false); }
  };

  // ── Detail ─────────────────────────────────────────────────────────────────
  const openDetail = async (p: Purchase) => {
    setSelected(p); setDetailOpen(true); setLoadingDetail(true);
    try {
      const { data } = await supabase.from("purchase_items").select("*, products(name,sku)").eq("purchase_id", p.id);
      const mapped: PurchaseItem[] = ((data as any[]) ?? []).map(r => ({ id: r.id, product_id: r.product_id, product_name: r.products?.name ?? "–", sku: r.products?.sku ?? "", qty: r.qty, qty_received: r.qty_received ?? 0, unit_cost_usd: r.unit_cost_usd, subtotal_usd: r.subtotal_usd }));
      setDetailItems(mapped);
      const init: Record<string, number> = {};
      mapped.forEach(it => { if (it.id) init[it.id] = Math.max(0, it.qty - it.qty_received); });
      setReceiveQtys(init);
    } catch { toast.error("Error al cargar detalle"); }
    finally { setLoadingDetail(false); }
  };

  // ── Confirm reception ──────────────────────────────────────────────────────
  const handleReceive = async () => {
    if (!selected) return;
    setReceiving(true);
    try {
      let allDone = true;
      for (const item of detailItems) {
        if (!item.id) continue;
        const toRcv = Math.min(receiveQtys[item.id] ?? 0, item.qty - item.qty_received);
        if (toRcv <= 0) { if (item.qty_received < item.qty) allDone = false; continue; }
        const newRcv = item.qty_received + toRcv;
        if (newRcv < item.qty) allDone = false;
        await supabase.from("purchase_items").update({ qty_received: newRcv } as any).eq("id", item.id);
        await supabase.rpc("increment_stock", { p_id: item.product_id, qty_to_add: toRcv });
      }
      await supabase.from("purchases").update({ status: allDone ? "received" : "partial", received_at: allDone ? new Date().toISOString() : null } as any).eq("id", selected.id);
      toast.success(allDone ? "Orden recibida completamente ✓" : "Recepción parcial registrada");
      setDetailOpen(false);
      fetchData();
    } catch (e: any) { toast.error("Error", { description: e.message }); }
    finally { setReceiving(false); }
  };

  const handleCancel = async (p: Purchase) => {
    if (!confirm(`¿Cancelar la orden ${p.purchase_number}?`)) return;
    await supabase.from("purchases").update({ status: "cancelled" } as any).eq("id", p.id);
    toast.success("Orden cancelada"); fetchData();
  };

  const filteredProds = products.filter(p =>
    (p.name.toLowerCase().includes(prodSearch.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(prodSearch.toLowerCase())) &&
    !items.find(i => i.product_id === p.id)
  ).slice(0, 8);

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Órdenes de Compra</h1>
          <p className="text-text-2 mt-1 text-sm">Gestiona y rastrea todas las compras a tus proveedores</p>
        </div>
        <button onClick={handleOpenNew}
          className="px-6 py-3 bg-brand-gradient text-white font-bold font-montserrat rounded-xl text-sm shadow-brand hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Órdenes del Mes",      value: loading ? "–" : thisMonth.length, icon: ClipboardList, color: "text-brand",      bg: "bg-brand/10" },
          { label: "Pendientes de Recibir", value: loading ? "–" : pending.length,  icon: Truck,         color: "text-status-warn", bg: "bg-status-warn/10" },
          { label: "Valor en Tránsito",    value: loading ? "–" : `$${inTransitTotal.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-status-ok", bg: "bg-status-ok/10" },
        ].map((c,idx) => (
          <motion.div key={c.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.07 }}>
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

      {/* Table */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-border bg-surface-base/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input placeholder="Buscar por número o proveedor..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm" />
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>{["Nº Orden","Proveedor","Items","Monto Total","Emisión","F. Recepción","Estado","Acciones"].map(h => (
                <th key={h} className="px-5 py-4 font-bold font-montserrat text-[11px] text-text-1">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-3">
                    <ClipboardList className="w-12 h-12 opacity-30" />
                    <p className="font-medium text-sm">Sin órdenes registradas</p>
                    <p className="text-xs opacity-70">Crea tu primera orden con el botón de arriba</p>
                  </div>
                </td></tr>
              ) : filtered.map((p, idx) => (
                <motion.tr key={p.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.03 }}
                  className="hover:bg-surface-hover/30 transition-colors">
                  <td className="px-5 py-4"><span className="font-mono font-bold text-brand text-sm">{p.purchase_number ?? "–"}</span></td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-text-1 text-sm">{p.suppliers?.name ?? "–"}</p>
                    <p className="text-[10px] text-text-3 font-mono">{p.suppliers?.rif}</p>
                  </td>
                  <td className="px-5 py-4 text-text-2 text-xs">{p._item_count ?? 0} items</td>
                  <td className="px-5 py-4 font-montserrat font-bold text-text-1 text-sm">${(p.total_usd ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 text-text-2 text-xs">{format(new Date(p.created_at), "dd MMM yyyy", { locale: es })}</td>
                  <td className="px-5 py-4 text-text-2 text-xs">
                    {(p as any).expected_date ? format(new Date((p as any).expected_date + "T00:00:00"), "dd MMM yyyy", { locale: es }) : "–"}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openDetail(p)} className="px-3 py-1.5 text-[11px] font-bold font-montserrat bg-brand/10 text-brand border border-brand/20 rounded-lg hover:bg-brand hover:text-white transition-all">
                        Ver detalle
                      </button>
                      {!["received","cancelled"].includes(p.status) && (
                        <button onClick={() => handleCancel(p)} className="px-3 py-1.5 text-[11px] font-bold bg-status-danger/10 text-status-danger border border-status-danger/20 rounded-lg hover:bg-status-danger hover:text-white transition-all">
                          Cancelar
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

      {/* ── MODAL Nueva Orden ── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-xl text-text-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand" /> Nueva Orden de Compra
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Selecciona proveedor, agrega productos y emite o guarda como borrador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 space-y-1.5">
                <label className="text-xs font-bold font-montserrat text-text-1">Proveedor *</label>
                <Select value={form.supplier_id} onValueChange={v => setForm(p => ({ ...p, supplier_id: v }))}>
                  <SelectTrigger className="w-full bg-surface-input border-border/40 h-11 text-text-1 font-montserrat">
                    <SelectValue placeholder="Seleccionar proveedor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-elevated border-border z-[9999]" position="popper" sideOffset={5}>
                    {suppliers.length === 0
                      ? <SelectItem value="none" disabled>Sin proveedores registrados</SelectItem>
                      : suppliers.map(s => <SelectItem key={s.id} value={s.id}><span className="font-bold">{s.name}</span><span className="text-text-3 ml-2 text-xs font-mono">{s.rif}</span></SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-montserrat text-text-1">Fecha de emisión</label>
                <Input type="date" value={form.emission_date} onChange={e => setForm(p => ({ ...p, emission_date: e.target.value }))} className="bg-surface-input border-border/40 h-11 text-text-1" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-montserrat text-text-1">F. esperada recepción</label>
                <Input type="date" value={form.expected_date} onChange={e => setForm(p => ({ ...p, expected_date: e.target.value }))} className="bg-surface-input border-border/40 h-11 text-text-1" />
              </div>
            </div>

            {/* Buscar producto */}
            <div className="space-y-2">
              <label className="text-xs font-bold font-montserrat text-text-1">Agregar productos</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <Input placeholder="Buscar por nombre o SKU..." value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  className="pl-10 bg-surface-input border-border/40 h-11 text-text-1" />
              </div>
              {prodSearch && filteredProds.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden bg-surface-elevated shadow-lg z-50">
                  {filteredProds.map(prod => (
                    <button key={prod.id} onClick={() => addProduct(prod)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover/40 transition-colors text-left">
                      <div>
                        <p className="text-sm font-semibold text-text-1">{prod.name}</p>
                        <p className="text-[10px] text-text-3 font-mono">{prod.sku}</p>
                      </div>
                      <span className="text-xs text-brand font-mono">${prod.cost_usd?.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-surface-base/80 border-b border-border">
                    <tr>{["Producto","SKU","Cant.","P. Unitario","Subtotal",""].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-bold font-montserrat text-text-1">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it, idx) => (
                      <tr key={it.product_id} className="hover:bg-surface-hover/20">
                        <td className="px-3 py-2 font-medium text-text-1">{it.product_name}</td>
                        <td className="px-3 py-2 text-text-3 font-mono">{it.sku}</td>
                        <td className="px-3 py-2 w-20">
                          <input type="number" min={1} value={it.qty} onChange={e => updateItem(idx,"qty",+e.target.value)}
                            className="w-full bg-surface-input border border-border/40 rounded-lg px-2 py-1 text-text-1 focus:outline-none focus:border-brand/40" />
                        </td>
                        <td className="px-3 py-2 w-24">
                          <input type="number" min={0} step="0.01" value={it.unit_cost_usd} onChange={e => updateItem(idx,"unit_cost_usd",+e.target.value)}
                            className="w-full bg-surface-input border border-border/40 rounded-lg px-2 py-1 text-text-1 focus:outline-none focus:border-brand/40" />
                        </td>
                        <td className="px-3 py-2 font-bold text-text-1 font-montserrat">${it.subtotal_usd.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeItem(idx)} className="p-1 rounded-lg text-text-3 hover:text-status-danger hover:bg-status-danger/10 transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-surface-base/60">
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-right font-montserrat font-bold text-text-1 text-xs">Total:</td>
                      <td className="px-3 py-3 font-montserrat font-bold text-brand">${total.toFixed(2)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">Notas u observaciones (opcional)</label>
              <textarea placeholder="Condiciones de pago, instrucciones especiales..." value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 bg-surface-input border border-border/40 rounded-xl text-sm text-text-1 placeholder:text-text-3 resize-none focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all" />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <button onClick={() => setNewOpen(false)} className="px-5 py-2 text-text-3 font-montserrat font-bold text-sm hover:text-text-1 transition-colors">Cancelar</button>
            <button disabled={saving} onClick={() => handleSave(false)}
              className="px-6 py-2.5 bg-surface-base border border-border text-text-1 font-montserrat font-bold text-sm rounded-xl hover:bg-surface-hover/30 disabled:opacity-50 flex items-center gap-2 transition-all">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Guardar como Borrador
            </button>
            <button disabled={saving} onClick={() => handleSave(true)}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-montserrat font-bold shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Emitir Orden
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL Detalle ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-xl text-text-1 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand" />{selected?.purchase_number ?? "Detalle"}
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              {selected?.suppliers?.name} — {selected && format(new Date(selected.created_at), "dd 'de' MMMM yyyy", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" /></div>
          ) : selected && (
            <div className="space-y-6 py-2">
              {/* Timeline */}
              <div className="bg-surface-card border border-border rounded-2xl p-5">
                <p className="text-xs font-bold font-montserrat text-text-1 mb-5">Estado de la Orden</p>
                <div className="flex items-start justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
                  <div className="absolute top-4 left-0 h-0.5 bg-brand-gradient transition-all duration-700"
                    style={{ width: `${(Math.max(0, TIMELINE.indexOf(selected.status === "cancelled" ? "draft" : (TIMELINE.includes(selected.status) ? selected.status : "draft"))) / (TIMELINE.length - 1)) * 100}%` }} />
                  {TIMELINE.map((s, idx) => {
                    const ci = TIMELINE.indexOf(selected.status === "cancelled" ? "draft" : (TIMELINE.includes(selected.status) ? selected.status : "draft"));
                    const done = idx < ci; const active = idx === ci && selected.status !== "cancelled";
                    const Ic = STATUS_CFG[s].icon;
                    return (
                      <div key={s} className="flex flex-col items-center gap-2 z-10 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? "bg-brand border-brand" : active ? "bg-brand/20 border-brand ring-4 ring-brand/10" : "bg-surface-base border-border"}`}>
                          <Ic className={`w-3.5 h-3.5 ${done ? "text-white" : active ? "text-brand" : "text-text-3"}`} />
                        </div>
                        <p className={`text-[10px] font-semibold text-center leading-tight ${active ? "text-brand" : done ? "text-text-1" : "text-text-3"}`}>
                          {STATUS_CFG[s].label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Proveedor info */}
              <div className="grid grid-cols-3 gap-3">
                {[{ label: "Proveedor", val: selected.suppliers?.name ?? "–" }, { label: "RIF", val: selected.suppliers?.rif ?? "–" }, { label: "Teléfono", val: selected.suppliers?.phone ?? "–" }].map(({ label, val }) => (
                  <div key={label} className="bg-surface-card border border-border rounded-xl p-3">
                    <p className="text-[11px] font-montserrat font-bold text-text-1 mb-0.5">{label}</p>
                    <p className="text-xs text-text-2">{val}</p>
                  </div>
                ))}
              </div>

              {/* Productos */}
              <div>
                <p className="text-xs font-bold font-montserrat text-text-1 mb-3">Productos de la Orden</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-base/80 border-b border-border">
                      <tr>
                        {["Producto","SKU","Ordenado","Recibido","P. Unit.","Subtotal"].map(h => <th key={h} className="px-3 py-2.5 text-left font-bold font-montserrat text-text-1">{h}</th>)}
                        {!["received","cancelled"].includes(selected.status) && <th className="px-3 py-2.5 font-bold font-montserrat text-text-1">A Recibir</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detailItems.map(it => (
                        <tr key={it.id} className="hover:bg-surface-hover/20">
                          <td className="px-3 py-2.5 font-medium text-text-1">{it.product_name}</td>
                          <td className="px-3 py-2.5 text-text-3 font-mono">{it.sku || "–"}</td>
                          <td className="px-3 py-2.5 text-text-2 font-bold">{it.qty}</td>
                          <td className="px-3 py-2.5">
                            <span className={`font-bold ${it.qty_received >= it.qty ? "text-status-ok" : it.qty_received > 0 ? "text-status-warn" : "text-text-3"}`}>{it.qty_received}</span>
                          </td>
                          <td className="px-3 py-2.5 text-text-2 font-mono">${it.unit_cost_usd.toFixed(2)}</td>
                          <td className="px-3 py-2.5 font-bold text-text-1 font-montserrat">${it.subtotal_usd.toFixed(2)}</td>
                          {!["received","cancelled"].includes(selected.status) && it.id && (
                            <td className="px-3 py-2.5 w-20">
                              <input type="number" min={0} max={it.qty - it.qty_received}
                                value={receiveQtys[it.id] ?? 0}
                                onChange={e => setReceiveQtys(prev => ({ ...prev, [it.id!]: +e.target.value }))}
                                className="w-full bg-surface-input border border-border/40 rounded-lg px-2 py-1 text-text-1 focus:outline-none focus:border-brand/40" />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-surface-base/60">
                      <tr>
                        <td colSpan={5} className="px-3 py-3 text-right font-montserrat font-bold text-text-1 text-xs">Total Orden:</td>
                        <td className="px-3 py-3 font-montserrat font-bold text-brand">${(selected.total_usd ?? 0).toFixed(2)}</td>
                        {!["received","cancelled"].includes(selected.status) && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selected.notes && (
                <div className="p-4 bg-surface-card border border-border rounded-xl">
                  <p className="text-[11px] font-montserrat font-bold text-text-1 mb-1">Notas</p>
                  <p className="text-xs text-text-2 leading-relaxed">{selected.notes}</p>
                </div>
              )}
            </div>
          )}

          {selected && !["received","cancelled"].includes(selected.status) && (
            <DialogFooter>
              <button onClick={() => setDetailOpen(false)} className="px-5 py-2 text-text-3 font-montserrat font-bold text-sm hover:text-text-1 transition-colors">Cerrar</button>
              <button disabled={receiving} onClick={handleReceive}
                className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-montserrat font-bold shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all">
                {receiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirmar Recepción
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
