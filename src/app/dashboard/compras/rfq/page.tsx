"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { motion } from "framer-motion";
import { 
  Plus, Search, Loader2, FileText, ClipboardList, CheckCircle2, 
  Trash2, X, Building2, Package, Inbox, Calendar as CalIcon, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Product = { id: string; name: string; sku: string };
type Supplier = { id: string; name: string; rif: string };

interface RFQFormItem {
  product_id: string;
  name: string;
  sku: string;
  qty: number;
}

export default function RFQPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formItems, setFormItems] = useState<RFQFormItem[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  
  const [formDates, setFormDates] = useState({
    created_at: new Date().toISOString().split("T")[0],
    expires_at: "",
    notes: ""
  });

  // DB Meta
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [suppSearch, setSuppSearch] = useState("");
  
  // Stats
  const activeCount = rfqs.filter(r => r.status !== 'Cancelada' && r.status !== 'Convertida').length;
  const pendingCount = rfqs.filter(r => r.status === 'Enviada').length;
  const convertedCount = rfqs.filter(r => r.status === 'Convertida').length;

  const fetchData = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [rfqRes, prodRes, supRes] = await Promise.all([
        supabase.from("purchase_rfq").select(`
          *,
          items:purchase_rfq_items(id, product_id),
          suppliers:purchase_rfq_suppliers(id, status)
        `).eq("company_id", user.company_id).order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, sku").eq("company_id", user.company_id).eq("is_active", true),
        supabase.from("suppliers").select("id, name, rif").eq("company_id", user.company_id)
      ]);

      if (rfqRes.error) throw rfqRes.error;
      setRfqs(rfqRes.data || []);
      setProducts(prodRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err: any) {
      toast.error("Error cargando RFQs", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle Form
  const addProduct = (p: Product) => {
    if (formItems.find(i => i.product_id === p.id)) return;
    setFormItems(prev => [...prev, { product_id: p.id, name: p.name, sku: p.sku || "", qty: 1 }]);
    setProdSearch("");
  };

  const addSupplier = (s: Supplier) => {
    if (selectedSuppliers.find(x => x.id === s.id)) return;
    setSelectedSuppliers(prev => [...prev, s]);
    setSuppSearch("");
  };

  const handleSave = async (isDraft: boolean) => {
    if (formItems.length === 0) return toast.error("Agrega al menos 1 producto");
    if (selectedSuppliers.length === 0) return toast.error("Agrega al menos 1 proveedor");
    if (!formDates.expires_at) return toast.error("La fecha límite es obligatoria");
    if (!user?.company_id) return;

    setSaving(true);
    try {
      const rfq_number = `RFQ-${Date.now().toString().slice(-5)}`;
      const status = isDraft ? "Borrador" : "Enviada";

      const { data: rfq, error: rfqErr } = await supabase.from("purchase_rfq").insert({
        company_id: user.company_id,
        rfq_number,
        status,
        expires_at: new Date(formDates.expires_at).toISOString(),
        created_at: new Date(formDates.created_at).toISOString(),
        notes: formDates.notes
      }).select().single();

      if (rfqErr) throw rfqErr;

      // Insert items
      const { error: itemsErr } = await supabase.from("purchase_rfq_items").insert(
        formItems.map(i => ({ rfq_id: rfq.id, product_id: i.product_id, quantity_requested: i.qty }))
      );
      if (itemsErr) throw itemsErr;

      // Insert suppliers
      const { error: suppsErr } = await supabase.from("purchase_rfq_suppliers").insert(
        selectedSuppliers.map(s => ({ rfq_id: rfq.id, supplier_id: s.id, status: "Pendiente" }))
      );
      if (suppsErr) throw suppsErr;

      toast.success(isDraft ? "Borrador guardado" : "Solicitud Enviada a Proveedores");
      setModalOpen(false);
      setFormItems([]);
      setSelectedSuppliers([]);
      setFormDates({ created_at: new Date().toISOString().split("T")[0], expires_at: "", notes: "" });
      fetchData();
    } catch (err: any) {
      toast.error("Error al crear RFQ", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const cancelRfq = async (id: string, code: string) => {
     if (!confirm(`¿Seguro que deseas cancelar la solicitud ${code}?`)) return;
     try {
       await supabase.from("purchase_rfq").update({ status: 'Cancelada' }).eq("id", id);
       toast.success("Cancelada correctamente");
       fetchData();
     } catch(e:any) { toast.error("Error", {description: e.message}); }
  };

  const filteredRfqs = rfqs.filter(r => r.rfq_number.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1 flex items-center gap-2">
            Solicitudes de Cotización <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase">BETA</span>
          </h1>
          <p className="text-text-2 mt-1 text-sm">Pide precios a varios proveedores antes de comprar</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="px-6 py-3 bg-brand-gradient text-white font-bold font-montserrat rounded-xl text-sm shadow-brand hover:opacity-90 transition-all flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nueva Solicitud
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "RFQs activas", value: loading ? "..." : activeCount, icon: FileText, color: "text-brand", bg: "bg-brand/10" },
          { label: "Esperando respuesta", value: loading ? "..." : pendingCount, icon: ClipboardList, color: "text-status-warn", bg: "bg-status-warn/10" },
          { label: "Convertidas a Órdenes", value: loading ? "..." : convertedCount, icon: CheckCircle2, color: "text-status-ok", bg: "bg-status-ok/10" },
        ].map(c => (
           <Card key={c.label} className="p-5 bg-surface-card shadow-card border-border/50 flex items-center gap-4 hover-card-effect transition-all">
             <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg}`}>
                 <c.icon className={`w-5 h-5 ${c.color}`} />
             </div>
             <div>
               <p className="text-[10px] uppercase font-bold text-text-2 tracking-widest">{c.label}</p>
               <p className="text-2xl font-montserrat font-bold text-text-1">{c.value}</p>
             </div>
           </Card>
        ))}
      </div>

      {/* Table Section */}
      <Card className="bg-surface-card border-border overflow-hidden min-h-[400px] flex flex-col shadow-card">
        <div className="p-4 border-b border-border bg-surface-base/50 flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input placeholder="Buscar nº RFQ..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 border-border/40 bg-surface-input focus:border-brand/40 transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-surface-base sticky top-0 z-10">
                  <tr>
                    {['Nº RFQ', 'Productos', 'Proveedores', 'Respuestas', 'Vencimiento', 'Estado', 'Acciones'].map(h => (
                       <th key={h} className="px-5 py-4 text-[10px] font-bold text-text-3 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {loading ? (
                     <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand" /></td></tr>
                  ) : filteredRfqs.length === 0 ? (
                     <tr><td colSpan={7} className="py-20 text-center text-text-3">No hay solicitudes encontradas.</td></tr>
                  ) : filteredRfqs.map((r, i) => {
                     const responded = (r.suppliers || []).filter((s:any) => s.status !== 'Pendiente').length;
                     return (
                        <tr key={r.id} className="hover:bg-surface-hover/20 transition-colors group">
                           <td className="px-5 py-4 font-mono font-bold text-brand">{r.rfq_number}</td>
                           <td className="px-5 py-4 font-bold text-text-2">{(r.items || []).length} ítems</td>
                           <td className="px-5 py-4 font-bold text-text-2">{(r.suppliers || []).length} consultados</td>
                           <td className="px-5 py-4">
                              <span className={cn("px-2 py-0.5 rounded text-xs font-bold font-mono", responded > 0 ? "bg-status-info/10 text-status-info" : "text-text-3")}>
                                 {responded} / {(r.suppliers || []).length}
                              </span>
                           </td>
                           <td className="px-5 py-4 text-text-2 text-xs">
                              {r.expires_at ? format(new Date(r.expires_at), "dd/MM/yyyy") : "–"}
                           </td>
                           <td className="px-5 py-4">
                              <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border", 
                                r.status === 'Borrador' ? "bg-surface-base text-text-3 border-border" :
                                r.status === 'Enviada'  ? "bg-status-info/10 text-status-info border-status-info/20" :
                                r.status === 'Respondida'? "bg-status-warn/10 text-status-warn border-status-warn/20" :
                                r.status === 'Convertida'? "bg-status-ok/10 text-status-ok border-status-ok/20" :
                                "bg-status-danger/10 text-status-danger border-status-danger/20"
                              )}>
                                 {r.status}
                              </span>
                           </td>
                           <td className="px-5 py-4">
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/dashboard/compras/rfq/${r.id}`} className="p-1.5 text-text-2 hover:bg-surface-base hover:text-brand rounded shrink-0">
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                                {(r.status === 'Borrador' || r.status === 'Enviada') && (
                                   <button onClick={() => cancelRfq(r.id, r.rfq_number)} className="p-1.5 text-text-2 hover:bg-status-danger/10 hover:text-status-danger rounded shrink-0 transition-colors cursor-pointer z-10 relative pointer-events-auto">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                )}
                              </div>
                           </td>
                        </tr>
                     )
                  })}
               </tbody>
            </table>
        </div>
      </Card>

      {/* MODAL NUEVA RFQ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-surface-card border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
           <div className="px-6 py-5 border-b border-border bg-surface-base/30 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-montserrat font-bold text-text-1">Nueva Solicitud de Cotización (RFQ)</h2>
                <p className="text-xs text-text-3 mt-1">Elabora y envía solicitudes a múltiples proveedores</p>
              </div>
           </div>
           
           <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              
              {/* Productos */}
              <section>
                 <h3 className="font-montserrat font-bold text-sm text-text-1 flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-brand"/> 1. Productos a Cotizar</h3>
                 <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                    <Input placeholder="Buscar producto por nombre o SKU..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)} className="pl-10 bg-surface-input border-border/50 h-10" />
                 </div>
                 {prodSearch && (
                    <div className="border border-border/50 rounded-xl mb-4 bg-surface-base shadow-sm max-h-40 overflow-y-auto">
                       {products.filter(p => (p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.toLowerCase().includes(prodSearch.toLowerCase())) && !formItems.find(i=>i.product_id===p.id)).slice(0,5).map(p => (
                          <button key={p.id} onClick={() => addProduct(p)} className="flex justify-between items-center w-full p-2.5 hover:bg-surface-hover/50 border-b border-border/30 last:border-0 text-left">
                             <div>
                                <p className="text-xs font-bold text-text-1">{p.name}</p>
                                <p className="text-[10px] text-text-3 font-mono">{p.sku}</p>
                             </div>
                             <Plus className="w-3 h-3 text-brand" />
                          </button>
                       ))}
                       {products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.toLowerCase().includes(prodSearch.toLowerCase())).length === 0 && (
                          <p className="p-3 text-xs text-text-3 text-center">No se encontraron productos</p>
                       )}
                    </div>
                 )}
                 {formItems.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden bg-surface-base">
                       <table className="w-full text-xs">
                          <thead className="border-b border-border/50 bg-surface-card">
                             <tr><th className="px-3 py-2 text-left text-text-3">Producto / SKU</th><th className="px-3 py-2 text-center text-text-3">Cantidad Mínima</th><th className="px-3 py-2 text-center" /></tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                             {formItems.map((item, idx) => (
                                <tr key={item.product_id} className="bg-surface-base">
                                   <td className="px-3 py-2"><p className="font-bold text-text-1">{item.name}</p><p className="text-[9px] font-mono text-text-3">{item.sku}</p></td>
                                   <td className="px-3 py-2 w-28 text-center">
                                      <input type="number" min={1} value={item.qty} onChange={e => {
                                         const n = [...formItems]; n[idx].qty = Number(e.target.value); setFormItems(n);
                                      }} className="w-full bg-surface-input border border-border/50 rounded p-1 text-center font-bold" />
                                   </td>
                                   <td className="px-3 py-2 w-10 text-center"><button onClick={() => setFormItems(prev => prev.filter((_, i) => i !== idx))} className="text-status-danger p-1"><X className="w-3 h-3"/></button></td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 )}
              </section>

              {/* Proveedores */}
              <section>
                 <h3 className="font-montserrat font-bold text-sm text-text-1 flex items-center gap-2 mb-3"><Building2 className="w-4 h-4 text-[#FFB800]"/> 2. Selecciona Proveedores</h3>
                 <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                    <Input placeholder="Buscar proveedor..." value={suppSearch} onChange={e=>setSuppSearch(e.target.value)} className="pl-10 bg-surface-input border-border/50 h-10" />
                 </div>
                 {suppSearch && (
                    <div className="border border-border/50 rounded-xl mb-4 bg-surface-base shadow-sm max-h-40 overflow-y-auto">
                       {suppliers.filter(s => (s.name.toLowerCase().includes(suppSearch.toLowerCase()) || s.rif.toLowerCase().includes(suppSearch.toLowerCase())) && !selectedSuppliers.find(i=>i.id===s.id)).slice(0,5).map(s => (
                          <button key={s.id} onClick={() => addSupplier(s)} className="flex justify-between items-center w-full p-2.5 hover:bg-surface-hover/50 border-b border-border/30 last:border-0 text-left">
                             <div>
                                <p className="text-xs font-bold text-text-1">{s.name}</p>
                                <p className="text-[10px] text-text-3 font-mono">{s.rif}</p>
                             </div>
                             <Plus className="w-3 h-3 text-brand" />
                          </button>
                       ))}
                    </div>
                 )}
                 {selectedSuppliers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                       {selectedSuppliers.map(s => (
                          <span key={s.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-border text-xs font-bold text-text-1">
                             <Building2 className="w-3 h-3 text-text-3" /> {s.name}
                             <button onClick={() => setSelectedSuppliers(p => p.filter(x => x.id !== s.id))} className="text-text-3 hover:text-status-danger"><X className="w-3 h-3"/></button>
                          </span>
                       ))}
                    </div>
                 )}
              </section>

              {/* Fechas */}
              <section>
                 <h3 className="font-montserrat font-bold text-sm text-text-1 flex items-center gap-2 mb-3"><CalIcon className="w-4 h-4 text-[#E040FB]"/> 3. Período de Recepción</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider mb-1 block">Fecha Creación</label>
                       <Input type="date" value={formDates.created_at} onChange={e=>setFormDates(p => ({...p, created_at: e.target.value}))} className="bg-surface-input border-border/50" />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider mb-1 block">Límite de Respuesta <span className="text-status-danger">*</span></label>
                       <Input type="date" value={formDates.expires_at} onChange={e=>setFormDates(p => ({...p, expires_at: e.target.value}))} className="bg-surface-input border-border/50 border-status-danger/20 focus:border-status-danger" />
                    </div>
                 </div>
              </section>

              {/* Notas */}
              <section>
                 <h3 className="font-montserrat font-bold text-sm text-text-1 flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-[#00E5CC]"/> 4. Instrucciones o Notas</h3>
                 <textarea placeholder="Ej: Especificar que los precios deben incluir flete..." value={formDates.notes} onChange={e=>setFormDates(p => ({...p, notes: e.target.value}))} rows={3} className="w-full p-3 bg-surface-input border border-border/50 rounded-xl text-xs outline-none focus:border-brand/40 resize-none transition-colors" />
              </section>

           </div>
           
           <div className="px-6 py-4 border-t border-border bg-surface-base/30 flex justify-end gap-3 shrink-0">
             <button onClick={() => setModalOpen(false)} className="px-5 py-2 text-text-3 font-bold text-xs">Cancelar</button>
             <button disabled={saving} onClick={() => handleSave(true)} className="px-6 py-2 bg-surface-card border border-border text-text-1 font-bold text-xs rounded-xl hover:bg-surface-hover/50 transition-all">
                Guardar Borrador
             </button>
             <button disabled={saving} onClick={() => handleSave(false)} className="px-6 py-2 bg-brand-gradient text-white font-bold text-xs rounded-xl shadow-brand hover:opacity-90 transition-all flex items-center gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Inbox className="w-3.5 h-3.5" />} Enviar a Proveedores
             </button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
