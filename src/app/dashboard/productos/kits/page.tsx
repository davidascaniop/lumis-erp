"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Plus, Layers, AlertCircle, Edit, Trash2, Loader2, Package, Search,
  ArrowRight, SearchIcon, Image as ImageIcon, Box, Eye
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MF_INPUT as INPUT_CLS, MF_LABEL as LABEL_CLS, ModalHeader, ModalFooter } from "@/components/ui/modal-form";
import { useDataCache } from "@/lib/data-cache";

interface ComponentItem {
  product_id: string;
  name: string;
  sku: string;
  stock: number;
  qty_required: number;
}

export default function KitsPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [kits, setKits] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [openModal, setOpenModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // For viewing kit details
  const [selectedKit, setSelectedKit] = useState<any>(null);

  // Form states
  const [form, setForm] = useState({ id: "", name: "", description: "", price_usd: 0, image_url: "", status: "active" });
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchKits = async () => {
    if (!user?.company_id) return;

    const cacheKey = `productos_kits_${user.company_id}`;
    const cached = useDataCache.getState().get(cacheKey);
    if (cached) {
      setKits(cached.kits);
      setProducts(cached.products);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Get all Kits (products where is_kit = true) with their components
      const { data: kitsData, error: kError } = await supabase
        .from("products")
        .select(`
          *,
          product_kit_items!product_kit_items_kit_id_fkey (
            quantity,
            component:component_id (id, name, sku, stock, price_usd)
          )
        `)
        .eq("company_id", user.company_id)
        .eq("is_kit", true)
        .order("created_at", { ascending: false });

      let finalKits: any[] = [];
      if (kError) {
        console.error("Kits Fetch Error:", kError);
        // If the relation doesn't exist yet, fall back to simple fetch
        if (kError.message.includes("does not exist") || kError.message.includes("relation")) {
          const { data: simpleKits } = await supabase
            .from("products")
            .select("*")
            .eq("company_id", user.company_id)
            .eq("is_kit", true)
            .order("created_at", { ascending: false });
          finalKits = (simpleKits || []).map(k => ({ ...k, comps: [], availableStock: 0 }));
          setKits(finalKits);
        }
      } else {
        finalKits = (kitsData || []).map(k => {
          const comps = (k.product_kit_items || []).map((pki: any) => ({
            ...(pki.component || {}),
            qty_required: pki.quantity,
          })).filter((c: any) => c.id); // filter out nulls

          // Available stock = minimum assemblable units from all components
          let availableStock = comps.length > 0 ? 999999 : 0;
          comps.forEach((c: any) => {
            if (c.qty_required > 0) {
              const maxForThisItem = Math.floor((c.stock || 0) / c.qty_required);
              if (maxForThisItem < availableStock) availableStock = maxForThisItem;
            }
          });

          return { ...k, comps, availableStock };
        });
        setKits(finalKits);
      }

      // 2. Fetch regular products for the component search (non-kits)
      const { data: prodData } = await supabase
        .from("products")
        .select("id, name, sku, stock, price_usd")
        .eq("company_id", user.company_id)
        .neq("is_kit", true);

      setProducts(prodData || []);
      useDataCache.getState().set(cacheKey, { kits: finalKits, products: prodData || [] });
    } catch (e) {
      console.error("fetchKits error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.company_id]);

  // ---------- STATS ---------- //
  const activeKits = kits.filter(k => k.status === 'active').length;
  const criticalKits = kits.filter(k => k.availableStock <= 5).length;
  const totalValue = kits.reduce((acc, k) => acc + (k.price_usd * k.availableStock), 0);

  // ---------- FORM ACTIONS ---------- //
  const openNewKit = () => {
    setForm({ id: "", name: "", description: "", price_usd: 0, image_url: "", status: "active" });
    setComponents([]);
    setOpenModal(true);
  };

  const editKit = (k: any) => {
    setForm({
       id: k.id,
       name: k.name,
       description: k.description || "",
       price_usd: k.price_usd || 0,
       image_url: k.image_url || "",
       status: k.status || "active"
    });
    setComponents(k.comps.map((c: any) => ({
        product_id: c.id,
        name: c.name,
        sku: c.sku,
        stock: c.stock,
        qty_required: c.qty_required
    })));
    setOpenModal(true);
  };

  const addComponent = (product: any) => {
      if (components.find(c => c.product_id === product.id)) return;
      setComponents([
          ...components, 
          { product_id: product.id, name: product.name, sku: product.sku, stock: product.stock, qty_required: 1 }
      ]);
      setSearchQuery("");
  };

  const removeComponent = (productId: string) => {
      setComponents(components.filter(c => c.product_id !== productId));
  };

  const saveKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || components.length === 0 || !user?.company_id) {
      toast.error("Rellena el nombre y añade al menos un componente al kit.");
      return;
    }
    setIsSaving(true);

    try {
      const isEditing = !!form.id;
      const kitPayload = {
        company_id: user.company_id,
        name: form.name,
        description: form.description,
        price_usd: Number(form.price_usd),
        image_url: form.image_url,
        is_kit: true,
        status: form.status,
        stock: 0,
        sku: isEditing ? undefined : `KIT-${Date.now().toString().slice(-6)}`,
      };

      let kitId = form.id;

      if (isEditing) {
        const { error: updErr } = await supabase
          .from("products")
          .update(kitPayload)
          .eq("id", form.id);
        if (updErr) throw updErr;
        // Remove old components before reinserting
        const { error: delErr } = await supabase
          .from("product_kit_items")
          .delete()
          .eq("kit_id", form.id);
        if (delErr) throw delErr;
      } else {
        const { data: newKit, error: insErr } = await supabase
          .from("products")
          .insert(kitPayload)
          .select("id")
          .single();
        if (insErr) throw insErr;
        kitId = newKit.id;
      }

      // Insert components
      const compsPayload = components.map(c => ({
        kit_id: kitId,
        component_id: c.product_id,
        quantity: c.qty_required,
      }));
      const { error: cErr } = await supabase.from("product_kit_items").insert(compsPayload);
      if (cErr) throw cErr;

      toast.success(isEditing ? "Kit actualizado correctamente" : "Kit creado exitosamente");
      setOpenModal(false);
      if (user?.company_id) useDataCache.getState().invalidatePrefix("productos_");
      await fetchKits(); // await to ensure table refreshes immediately
    } catch (err: any) {
      toast.error("Error al guardar kit", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteKit = async (id: string) => {
    if (!confirm("¿Eliminar este kit? Sus componentes originales no se verán afectados.")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Kit eliminado");
      if (user?.company_id) useDataCache.getState().invalidatePrefix("productos_");
      await fetchKits();
    } catch (error: any) {
      toast.error("Error al eliminar", { description: error.message });
    }
  };

  const viewKit = (k: any) => {
     setSelectedKit(k);
     setOpenViewModal(true);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary text-black dark:text-white">Kits & Ensambles</h1>
          <p className="text-text-3 font-medium">
            Crea productos compuestos agrupando items de tu inventario
          </p>
        </div>
        <button
            onClick={openNewKit}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all active:scale-95 text-sm w-full md:w-auto"
        >
            <Plus className="w-5 h-5" />
            Nuevo Kit
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-surface-card border border-border p-6 rounded-2xl flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center text-brand">
               <Layers className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold uppercase tracking-widest text-text-3 font-montserrat">Kits Activos</p>
               <h3 className="text-3xl font-bold text-text-1 mt-1 font-mono">{activeKits}</h3>
            </div>
         </Card>
         <Card className="bg-surface-card border border-border p-6 rounded-2xl flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center text-danger">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold uppercase tracking-widest text-text-3 font-montserrat">Stock Crítico</p>
               <h3 className="text-3xl font-bold text-text-1 mt-1 font-mono text-danger">{criticalKits}</h3>
            </div>
         </Card>
         <Card className="bg-surface-card border border-border p-6 rounded-2xl flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-status-ok/10 flex items-center justify-center text-status-ok">
               <Package className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold uppercase tracking-widest text-text-3 font-montserrat">Valor Estimado</p>
               <h3 className="text-xl font-bold text-text-1 mt-1 lg:text-3xl font-mono">{formatCurrency(totalValue)}</h3>
            </div>
         </Card>
      </div>

      {/* LISTA */}
      <Card className="bg-surface-card border-border border rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
          ) : kits.length === 0 ? (
             <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Layers className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-semibold text-text-1 mb-1">No hay kits todavía</p>
                <p className="text-xs">Arma tu primer combo con piezas de tu inventario.</p>
             </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Kit</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-center">Componentes</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-right">Precio Venta</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-center">Stock Disponible</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-center">Estado</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {kits.map(k => (
                        <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                 {k.image_url ? (
                                     <img src={k.image_url} alt="kit" className="w-9 h-9 rounded-lg object-cover" />
                                 ) : (
                                     <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><Layers className="w-5 h-5" /></div>
                                 )}
                                 <div>
                                     <p className="font-bold text-text-1 text-[13px]">{k.name}</p>
                                     <p className="text-[10px] text-text-3 uppercase font-mono">{k.sku}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-5 py-4 text-center">
                              <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{k.comps.length} items</span>
                           </td>
                           <td className="px-5 py-4 text-right font-mono font-bold text-text-1">
                              {formatCurrency(k.price_usd)}
                           </td>
                           <td className="px-5 py-4 text-center">
                              <div className="flex justify-center">
                                  {k.availableStock <= 5 ? (
                                     <span className="flex items-center gap-1.5 px-2.5 py-1 bg-danger/10 text-danger rounded-lg text-xs font-bold shadow-sm border border-danger/20 font-mono">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {k.availableStock} armables
                                     </span>
                                  ) : (
                                     <span className="px-2.5 py-1 bg-status-ok/10 text-status-ok rounded-lg text-xs font-bold font-mono border border-status-ok/20">
                                        {k.availableStock} armables
                                     </span>
                                  )}
                              </div>
                           </td>
                           <td className="px-5 py-4 text-center">
                              {k.status === 'active' ? (
                                 <span className="w-2.5 h-2.5 rounded-full bg-status-ok inline-block shadow-[0_0_8px_rgba(0,229,204,0.6)]" />
                              ) : (
                                 <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" />
                              )}
                           </td>
                           <td className="px-5 py-4 text-right flex items-center justify-end gap-1.5">
                              <button onClick={() => viewKit(k)} className="p-2 text-slate-400 hover:text-brand bg-slate-100/50 hover:bg-brand/10 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => editKit(k)} className="p-2 text-slate-400 hover:text-brand bg-slate-100/50 hover:bg-brand/10 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteKit(k.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-100/50 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          )}
      </Card>

      {/* MODAL CREAR/EDITAR KIT */}
      <Dialog open={openModal} onOpenChange={val => { if (!val) setOpenModal(false) }}>
         <DialogContent className="sm:max-w-[700px] bg-white border-slate-200 p-0 shadow-2xl rounded-2xl overflow-hidden">
             <ModalHeader
               eyebrow="Constructor de Kit"
               title={form.id ? "Modificar Ensamble" : "Nuevo Kit & Ensamble"}
               icon={<Layers className="w-5 h-5" />}
             />
             <form onSubmit={saveKit} className="flex flex-col" style={{maxHeight:'80vh'}}>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* General Specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className={LABEL_CLS}>Nombre del Kit *</label>
                                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej. Combo Desayuno" className={INPUT_CLS} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL_CLS}>Precio (Venta) *</label>
                                    <Input type="number" step="0.01" min="0" value={form.price_usd} onChange={e => setForm({...form, price_usd: Number(e.target.value)})} className={`${INPUT_CLS} font-mono font-bold`} required />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Estado</label>
                                    <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                                       <SelectTrigger className={INPUT_CLS}><SelectValue /></SelectTrigger>
                                       <SelectContent className="bg-white">
                                           <SelectItem value="active">Activo</SelectItem>
                                           <SelectItem value="inactive">Inactivo</SelectItem>
                                       </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                             <div>
                                <label className={LABEL_CLS}>Imagen URL</label>
                                <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." className={INPUT_CLS} />
                            </div>
                            <div>
                                <label className={LABEL_CLS}>Descripción</label>
                                <textarea 
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand font-montserrat resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                       <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                          <Box className="w-3.5 h-3.5" /> Componentes del Kit *
                       </h4>

                       {/* Buscador de productos */}
                       <div className="relative mb-4">
                          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                             placeholder="Buscar producto a agregar por nombre o SKU..." 
                             className={`${INPUT_CLS} pl-10 border-brand/30 bg-brand/5 focus:bg-white transition-colors`}
                             value={searchQuery}
                             onChange={e => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                             <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                                 {filteredProducts.length === 0 ? (
                                    <p className="text-xs text-slate-500 p-3 italic">No hay productos que coincidan.</p>
                                 ) : (
                                     filteredProducts.map(p => (
                                         <button 
                                            key={p.id} 
                                            type="button"
                                            onClick={() => addComponent(p)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between group"
                                         >
                                            <div>
                                                <p className="text-[13px] font-bold text-slate-800">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">Stock: {p.stock} | SKU: {p.sku}</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                                         </button>
                                     ))
                                 )}
                             </div>
                          )}
                       </div>

                       {/* Lista de Componentes */}
                       <div className="space-y-2">
                           {components.length === 0 ? (
                               <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-semibold bg-slate-50/50">
                                   No has agregado ningún componente al kit todavía.
                               </div>
                           ) : components.map((comp, idx) => (
                               <div key={comp.product_id} className="flex items-center justify-between p-3 bg-white border border-slate-100 shadow-sm rounded-xl">
                                   <div className="flex items-center gap-3">
                                       <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center font-mono">
                                          {idx + 1}
                                       </span>
                                       <div>
                                           <p className="text-[13px] font-bold text-slate-800">{comp.name}</p>
                                           <p className="text-[10px] text-slate-400 uppercase font-mono">{comp.sku} · Max actual: {comp.stock}</p>
                                       </div>
                                   </div>
                                   <div className="flex items-center gap-3">
                                       <div className="flex flex-col items-end">
                                           <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Cant</label>
                                           <Input 
                                              type="number" min="1" 
                                              value={comp.qty_required}
                                              onChange={(e) => {
                                                  const newComps = [...components];
                                                  newComps[idx].qty_required = Number(e.target.value) || 1;
                                                  setComponents(newComps);
                                              }}
                                              className="w-20 h-8 bg-slate-50 border-slate-200 text-center text-xs font-mono font-bold font-montserrat"
                                           />
                                       </div>
                                       <button type="button" onClick={() => removeComponent(comp.product_id)} className="p-1.5 mt-3.5 text-slate-300 hover:text-red-500 transition-colors">
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               </div>
                           ))}
                       </div>
                    </div>
                </div>

                <ModalFooter
                    onCancel={() => setOpenModal(false)}
                    submitLabel={form.id ? "Guardar Cambios" : "Crear Kit"}
                    loadingLabel="Guardando..."
                    loading={isSaving}
                    disabled={components.length === 0}
                    leftContent={`${components.length} componentes · ${components.reduce((acc, c) => acc + c.qty_required, 0)} unidades`}
                />
             </form>
         </DialogContent>
      </Dialog>

      {/* MODAL VER DETALLE */}
      <Dialog open={openViewModal} onOpenChange={val => { if (!val) setOpenViewModal(false); }}>
         <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
             {selectedKit && (
                 <>
                   <div className="p-6 pb-4 flex items-center gap-4 bg-slate-50 border-b border-slate-100">
                       {selectedKit.image_url ? (
                           <img src={selectedKit.image_url} alt="kit" className="w-16 h-16 rounded-xl object-cover shadow-sm bg-white" />
                       ) : (
                           <div className="w-16 h-16 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><Layers className="w-8 h-8" /></div>
                       )}
                       <div>
                           <div className="flex items-center gap-2 mb-1">
                               <h3 className="text-lg font-bold font-primary text-slate-900 leading-tight">{selectedKit.name}</h3>
                               <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${selectedKit.status === 'active' ? 'bg-status-ok/10 text-status-ok border-status-ok/20' : 'bg-slate-200 text-slate-500'} border`}>
                                  {selectedKit.status}
                               </span>
                           </div>
                           <p className="text-xs text-slate-500 font-mono">SKU: {selectedKit.sku}</p>
                           <p className="text-xl font-bold font-mono text-brand mt-1">{formatCurrency(selectedKit.price_usd)}</p>
                       </div>
                   </div>

                   <div className="p-6">
                       <div className="flex bg-brand/5 border border-brand/20 p-4 rounded-xl items-center justify-between mb-6">
                           <div>
                               <p className="text-xs font-bold uppercase text-brand/70 font-montserrat">Potencial de Armado</p>
                               <p className="text-sm font-medium text-slate-600">Puedes armar como máximo:</p>
                           </div>
                           <h4 className="text-4xl font-bold font-mono text-brand">{selectedKit.availableStock} <span className="text-sm text-brand/50 uppercase tracking-widest font-sans ml-1">Kits</span></h4>
                       </div>

                       <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                          Desglose de Componentes
                       </h4>
                       <div className="space-y-3">
                           {selectedKit.comps.map((c: any, i:number) => {
                               const limitFactor = Math.floor(c.stock / c.qty_required);
                               const isBottleneck = limitFactor === selectedKit.availableStock;

                               return (
                               <div key={i} className="flex items-center justify-between">
                                  <div>
                                      <p className="text-xs font-bold text-slate-800">{c.qty_required}x {c.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">Stock actual: {c.stock}</p>
                                  </div>
                                  {isBottleneck && (
                                      <span className="text-[9px] bg-danger/10 text-danger border border-danger/20 font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                          Cuello de botella
                                      </span>
                                  )}
                               </div>
                           )})}
                       </div>
                   </div>
                   <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
                       <p className="text-[10px] text-slate-400 italic">
                           * Al vender este kit, se descontará {selectedKit.comps.length === 1 ? 'este componente' : 'estos ' + selectedKit.comps.length + ' componentes'} del inventario principal automáticamente.
                       </p>
                   </div>
                 </>
             )}
         </DialogContent>
      </Dialog>

    </div>
  );
}
