"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Network,
  ListTree,
  Edit,
  Trash2,
  Loader2,
  FolderTree,
  BoxSelect,
  FolderOpen
} from "lucide-react";

const INPUT_CLS =
  "h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand font-montserrat";
const LABEL_CLS =
  "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-montserrat";

export default function CategoriasPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [openCatModal, setOpenCatModal] = useState(false);
  const [openAttrModal, setOpenAttrModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [catForm, setCatForm] = useState({ id: "", name: "", description: "", parent_id: "none", image_url: "" });
  const [attrForm, setAttrForm] = useState({ id: "", name: "", values: "" });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.company_id]);

  async function fetchData() {
    if (!user?.company_id) return;
    setLoading(true);

    try {
      const [catRes, attrRes] = await Promise.all([
        supabase
          .from("product_categories")
          .select("*, parent:parent_id(name)")
          .eq("company_id", user.company_id)
          .order("name"),
        supabase
          .from("product_attributes")
          .select("*")
          .eq("company_id", user.company_id)
          .order("name"),
      ]);

      if (catRes.error) {
         // Silencioso, podría ser que la tabla no existe aún.
         console.error(catRes.error);
      } else {
         setCategories(catRes.data || []);
      }

      if (attrRes.error) {
         console.error(attrRes.error);
      } else {
         setAttributes(attrRes.data || []);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ─── CATEGORÍAS ─────────────────────────────────────────────────────────────
  const openNewCategory = () => {
    setCatForm({ id: "", name: "", description: "", parent_id: "none", image_url: "" });
    setOpenCatModal(true);
  };

  const editCategory = (c: any) => {
    setCatForm({
      id: c.id,
      name: c.name,
      description: c.description || "",
      parent_id: c.parent_id || "none",
      image_url: c.image_url || ""
    });
    setOpenCatModal(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !user?.company_id) return;
    setIsSaving(true);

    try {
      const payload = {
        name: catForm.name,
        description: catForm.description,
        parent_id: catForm.parent_id === "none" ? null : catForm.parent_id,
        image_url: catForm.image_url,
        company_id: user.company_id
      };

      if (catForm.id) {
        await supabase.from("product_categories").update(payload).eq("id", catForm.id);
        toast.success("Categoría actualizada");
      } else {
        await supabase.from("product_categories").insert(payload);
        toast.success("Categoría creada");
      }
      setOpenCatModal(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error al guardar categoría", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await supabase.from("product_categories").delete().eq("id", id);
      toast.success("Categoría eliminada");
      fetchData();
    } catch (error: any) {
      toast.error("Error al eliminar", { description: error.message });
    }
  };

  // ─── ATRIBUTOS ─────────────────────────────────────────────────────────────
  const openNewAttribute = () => {
    setAttrForm({ id: "", name: "", values: "" });
    setOpenAttrModal(true);
  };

  const editAttribute = (a: any) => {
    setAttrForm({
      id: a.id,
      name: a.name,
      values: Array.isArray(a.values) ? a.values.join(", ") : ""
    });
    setOpenAttrModal(true);
  };

  const saveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.name || !user?.company_id) return;
    setIsSaving(true);

    try {
      const parsedValues = attrForm.values
        .split(",")
        .map(v => v.trim())
        .filter(v => v);

      const payload = {
        name: attrForm.name,
        values: parsedValues,
        company_id: user.company_id
      };

      if (attrForm.id) {
        await supabase.from("product_attributes").update(payload).eq("id", attrForm.id);
        toast.success("Atributo actualizado");
      } else {
        await supabase.from("product_attributes").insert(payload);
        toast.success("Atributo creado");
      }
      setOpenAttrModal(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error al guardar atributo", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAttribute = async (id: string) => {
    if (!confirm("¿Eliminar este atributo?")) return;
    try {
      await supabase.from("product_attributes").delete().eq("id", id);
      toast.success("Atributo eliminado");
      fetchData();
    } catch (error: any) {
      toast.error("Error al eliminar", { description: error.message });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary text-black dark:text-white">Categorías y Atributos</h1>
          <p className="text-text-3 font-medium">
            Organiza tu catálogo con categorías y características de productos
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openNewCategory}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all active:scale-95 text-sm"
          >
            <FolderTree className="w-4 h-4" />
            Nueva Categoría
          </button>
          <button
            onClick={openNewAttribute}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-800 border bg-surface-card border-border rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95 text-sm"
          >
            <BoxSelect className="w-4 h-4 text-brand" />
            Nuevo Atributo
          </button>
        </div>
      </div>

      <Tabs defaultValue="categorias" className="w-full">
        <TabsList className="bg-surface-card border border-border rounded-xl p-1 h-auto gap-1 w-full sm:w-auto">
          <TabsTrigger
             value="categorias"
             className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider font-montserrat transition-all gap-2"
          >
             <ListTree className="w-4 h-4" />
             Categorías
          </TabsTrigger>
          <TabsTrigger
             value="atributos"
             className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider font-montserrat transition-all gap-2"
          >
             <Network className="w-4 h-4" />
             Atributos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="mt-6">
          <Card className="bg-surface-card border-border border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
            ) : categories.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                 <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
                 <p className="text-sm">No tienes categorías creadas todavía.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Nombre</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Descripción</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Categoría Padre</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-center">Total Productos</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                           {c.image_url ? (
                               <img src={c.image_url} alt="cat" className="w-6 h-6 rounded-md object-cover" />
                           ) : (
                               <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400"><FolderTree className="w-3 h-3" /></div>
                           )}
                           {c.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">{c.description || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {c.parent ? (
                             <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold">{c.parent.name}</span>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 text-center font-mono font-bold">0</td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => editCategory(c)} className="p-1.5 text-slate-400 hover:text-brand bg-slate-100 hover:bg-brand/10 rounded-lg mr-2 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteCategory(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors">
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
        </TabsContent>

        <TabsContent value="atributos" className="mt-6">
          <Card className="bg-surface-card border-border border rounded-2xl overflow-hidden">
             {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
            ) : attributes.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                 <BoxSelect className="w-12 h-12 mb-4 opacity-20" />
                 <p className="text-sm">No tienes atributos creados todavía.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Nombre del Atributo</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat">Valores Posibles</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-center">Total Productos</th>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-3 font-montserrat text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attributes.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{a.name}</td>
                        <td className="px-5 py-3.5">
                           <div className="flex gap-1.5 flex-wrap">
                               {(a.values || []).map((v: string) => (
                                   <span key={v} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] rounded uppercase font-semibold">
                                       {v}
                                   </span>
                               ))}
                           </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 text-center font-mono font-bold">0</td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => editAttribute(a)} className="p-1.5 text-slate-400 hover:text-brand bg-slate-100 hover:bg-brand/10 rounded-lg mr-2 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteAttribute(a.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors">
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
        </TabsContent>
      </Tabs>

      {/* Modal Categoría */}
      <Dialog open={openCatModal} onOpenChange={setOpenCatModal}>
        <DialogContent className="sm:max-w-[500px] bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-primary text-slate-900">
               {catForm.id ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-4" onSubmit={saveCategory}>
               <div>
                 <label className={LABEL_CLS}>Nombre *</label>
                 <Input 
                    value={catForm.name} 
                    onChange={e => setCatForm({...catForm, name: e.target.value})} 
                    placeholder="Ej. Víveres" 
                    className={INPUT_CLS} 
                    required 
                 />
               </div>
               <div>
                 <label className={LABEL_CLS}>Descripción</label>
                 <textarea 
                    value={catForm.description} 
                    onChange={e => setCatForm({...catForm, description: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand font-montserrat"
                    rows={3} 
                 />
               </div>
               <div>
                  <label className={LABEL_CLS}>Categoría Padre</label>
                  <Select value={catForm.parent_id} onValueChange={v => setCatForm({...catForm, parent_id: v})}>
                      <SelectTrigger className="h-11 bg-white border-slate-200 text-slate-900 rounded-xl shadow-none font-montserrat">
                           <SelectValue placeholder="Ninguna" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 font-montserrat">
                           <SelectItem value="none">Ninguna (Categoría Principal)</SelectItem>
                           {categories.filter(c => c.id !== catForm.id).map(c => (
                               <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                           ))}
                      </SelectContent>
                  </Select>
               </div>
               <div>
                 <label className={LABEL_CLS}>Imagen (URL) opcional</label>
                 <Input 
                    value={catForm.image_url} 
                    onChange={e => setCatForm({...catForm, image_url: e.target.value})} 
                    placeholder="https://..." 
                    className={INPUT_CLS} 
                 />
               </div>

               <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setOpenCatModal(false)} className="px-4 py-2 font-bold text-xs text-slate-500 uppercase font-montserrat">Cancelar</button>
                   <button type="submit" disabled={!catForm.name || isSaving} className="px-6 py-2 bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-brand hover:opacity-90 disabled:opacity-50">
                       {isSaving ? "Guardando..." : "Guardar"}
                   </button>
               </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Atributo */}
      <Dialog open={openAttrModal} onOpenChange={setOpenAttrModal}>
        <DialogContent className="sm:max-w-[450px] bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-primary text-slate-900">
               {attrForm.id ? "Editar Atributo" : "Nuevo Atributo"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-4" onSubmit={saveAttribute}>
               <div>
                 <label className={LABEL_CLS}>Nombre del Atributo *</label>
                 <Input 
                    value={attrForm.name} 
                    onChange={e => setAttrForm({...attrForm, name: e.target.value})} 
                    placeholder="Ej. Talla" 
                    className={INPUT_CLS} 
                    required 
                 />
                 <p className="text-[11px] text-slate-400 mt-1">Este nombre se mostrará al crear productos combinados.</p>
               </div>
               <div>
                 <label className={LABEL_CLS}>Valores (separados por coma) *</label>
                 <Input 
                    value={attrForm.values} 
                    onChange={e => setAttrForm({...attrForm, values: e.target.value})} 
                    placeholder="S, M, L, XL" 
                    className={INPUT_CLS} 
                    required 
                 />
                 <p className="text-[11px] text-slate-400 mt-1">Escribe las diferentes opciones de este atributo separadas por una coma.</p>
               </div>

               <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setOpenAttrModal(false)} className="px-4 py-2 font-bold text-xs text-slate-500 uppercase font-montserrat">Cancelar</button>
                   <button type="submit" disabled={!attrForm.name || isSaving} className="px-6 py-2 bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-brand hover:opacity-90 disabled:opacity-50">
                       {isSaving ? "Guardando..." : "Guardar"}
                   </button>
               </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
