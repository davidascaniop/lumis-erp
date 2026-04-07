"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  FolderOpen,
  CheckCircle2,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = [
  "#E040FB", "#7C4DFF", "#00E5CC", "#FFB800",
  "#FF2D55", "#00BCD4", "#8BC34A", "#FF9800",
];

const VALUE_CHIP_COLORS = [
  "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "bg-red-500/10 text-red-600 border-red-500/20",
];

export default function CategoriasPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [productCountMap, setProductCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"categorias" | "atributos">("categorias");

  // Modals state
  const [openCatModal, setOpenCatModal] = useState(false);
  const [openAttrModal, setOpenAttrModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [catForm, setCatForm] = useState({
    id: "", name: "", description: "", parent_id: "none", image_url: "", color: CATEGORY_COLORS[0],
  });
  const [attrForm, setAttrForm] = useState({ id: "", name: "", values: "" });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.company_id]);

  async function fetchData() {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [catRes, attrRes, prodRes] = await Promise.all([
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
        supabase
          .from("products")
          .select("category")
          .eq("company_id", user.company_id)
          .eq("is_active", true),
      ]);

      if (!catRes.error) setCategories(catRes.data || []);
      if (!attrRes.error) setAttributes(attrRes.data || []);

      // Build product count map by category name
      const countMap: Record<string, number> = {};
      (prodRes.data || []).forEach((p: any) => {
        if (p.category) countMap[p.category] = (countMap[p.category] || 0) + 1;
      });
      setProductCountMap(countMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────────
  const openNewCategory = () => {
    setCatForm({ id: "", name: "", description: "", parent_id: "none", image_url: "", color: CATEGORY_COLORS[0] });
    setOpenCatModal(true);
  };

  const editCategory = (c: any) => {
    setCatForm({
      id: c.id,
      name: c.name,
      description: c.description || "",
      parent_id: c.parent_id || "none",
      image_url: c.image_url || "",
      color: c.color || CATEGORY_COLORS[0],
    });
    setOpenCatModal(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !user?.company_id) return;
    setIsSaving(true);
    try {
      const payload: any = {
        name: catForm.name,
        description: catForm.description,
        parent_id: catForm.parent_id === "none" ? null : catForm.parent_id,
        image_url: catForm.image_url,
        color: catForm.color,
        company_id: user.company_id,
      };
      if (catForm.id) {
        const { error } = await supabase.from("product_categories").update(payload).eq("id", catForm.id);
        if (error) throw error;
        toast.success("Categoría actualizada");
      } else {
        const { error } = await supabase.from("product_categories").insert(payload);
        if (error) throw error;
        toast.success("Categoría creada");
      }
      setOpenCatModal(false);
      await fetchData();
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

  // ─── ATRIBUTOS ────────────────────────────────────────────────────────────────
  const openNewAttribute = () => {
    setAttrForm({ id: "", name: "", values: "" });
    setOpenAttrModal(true);
  };

  const editAttribute = (a: any) => {
    setAttrForm({
      id: a.id,
      name: a.name,
      values: Array.isArray(a.values) ? a.values.join(", ") : "",
    });
    setOpenAttrModal(true);
  };

  const saveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.name || !user?.company_id) return;
    setIsSaving(true);
    try {
      const parsedValues = attrForm.values.split(",").map((v) => v.trim()).filter((v) => v);
      const payload = { name: attrForm.name, values: parsedValues, company_id: user.company_id };
      if (attrForm.id) {
        const { error } = await supabase.from("product_attributes").update(payload).eq("id", attrForm.id);
        if (error) throw error;
        toast.success("Atributo actualizado");
      } else {
        const { error } = await supabase.from("product_attributes").insert(payload);
        if (error) throw error;
        toast.success("Atributo creado");
      }
      setOpenAttrModal(false);
      await fetchData();
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

  // Preview de valores en el modal de atributo
  const previewValues = attrForm.values
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Categorías y Atributos</h1>
          <p className="text-text-2 mt-1 text-sm font-medium">Organiza tu catálogo con categorías y características de productos</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNewAttribute}
            className="flex items-center gap-2 px-5 py-3 bg-surface-card border border-border text-text-1 rounded-xl font-bold shadow-sm hover:bg-surface-hover/10 transition-all text-sm"
          >
            <BoxSelect className="w-4 h-4 text-brand" /> Nuevo Atributo
          </button>
          <button
            onClick={openNewCategory}
            className="px-6 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" /> Nueva Categoría
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Total Categorías</p>
            <p className="text-xl font-bold text-text-1">{loading ? "—" : categories.length}</p>
            <p className="text-[10px] text-brand font-bold mt-0.5">
              {categories.filter(c => !c.parent_id).length} principales · {categories.filter(c => c.parent_id).length} subcategorías
            </p>
          </div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Tags className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Total Atributos</p>
            <p className="text-xl font-bold text-text-1">{loading ? "—" : attributes.length}</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">
              {attributes.reduce((acc, a) => acc + (a.values?.length || 0), 0)} valores configurados
            </p>
          </div>
        </Card>
      </div>

      {/* TABS PILLS */}
      <div className="flex p-1 bg-surface-card border border-border rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab("categorias")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all",
            tab === "categorias" ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1 hover:bg-surface-base"
          )}
        >
          <ListTree className="w-3.5 h-3.5" />
          Categorías ({categories.length})
        </button>
        <button
          onClick={() => setTab("atributos")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all",
            tab === "atributos" ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1 hover:bg-surface-base"
          )}
        >
          <Network className="w-3.5 h-3.5" />
          Atributos ({attributes.length})
        </button>
      </div>

      {/* ─── TABLA CATEGORÍAS ─── */}
      {tab === "categorias" && (
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Categoría Padre</th>
                  <th className="px-6 py-4 text-center">Productos</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" /></td></tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <FolderOpen className="w-12 h-12 text-text-3 mx-auto mb-3 opacity-20" />
                      <p className="text-text-3 font-medium">No tienes categorías creadas todavía.</p>
                      <button onClick={openNewCategory} className="mt-3 text-brand text-sm font-bold hover:underline">
                        + Crear primera categoría
                      </button>
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => {
                    const color = c.color || CATEGORY_COLORS[0];
                    const productCount = productCountMap[c.name] || 0;
                    return (
                      <tr key={c.id} className="hover:bg-surface-hover/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${color}18` }}
                            >
                              {c.image_url ? (
                                <img src={c.image_url} alt="" className="w-5 h-5 rounded object-cover" />
                              ) : (
                                <FolderTree className="w-4 h-4" style={{ color }} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-text-1">{c.name}</p>
                              {c.parent_id && (
                                <p className="text-[10px] text-text-3">└ subcategoría</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-3 max-w-[220px] truncate">{c.description || "—"}</td>
                        <td className="px-6 py-4">
                          {c.parent ? (
                            <span className="px-2.5 py-1 bg-brand/10 text-brand border border-brand/20 rounded-lg text-[11px] font-bold">
                              {c.parent.name}
                            </span>
                          ) : (
                            <span className="text-text-3 text-xs">Principal</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold",
                            productCount > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-surface-base text-text-3"
                          )}>
                            {productCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => editCategory(c)}
                              className="p-2 hover:bg-brand/10 text-text-3 hover:text-brand rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCategory(c.id)}
                              className="p-2 hover:bg-status-danger/10 text-text-3 hover:text-status-danger rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TABLA ATRIBUTOS ─── */}
      {tab === "atributos" && (
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Atributo</th>
                  <th className="px-6 py-4">Valores posibles</th>
                  <th className="px-6 py-4 text-center">N° Valores</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" /></td></tr>
                ) : attributes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <BoxSelect className="w-12 h-12 text-text-3 mx-auto mb-3 opacity-20" />
                      <p className="text-text-3 font-medium">No tienes atributos creados todavía.</p>
                      <button onClick={openNewAttribute} className="mt-3 text-brand text-sm font-bold hover:underline">
                        + Crear primer atributo
                      </button>
                    </td>
                  </tr>
                ) : (
                  attributes.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-hover/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                            <Network className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-text-1">{a.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {(a.values || []).map((v: string, i: number) => (
                            <span
                              key={v}
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                                VALUE_CHIP_COLORS[i % VALUE_CHIP_COLORS.length]
                              )}
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 bg-brand/10 text-brand rounded-lg text-xs font-bold">
                          {a.values?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => editAttribute(a)}
                            className="p-2 hover:bg-brand/10 text-text-3 hover:text-brand rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAttribute(a.id)}
                            className="p-2 hover:bg-status-danger/10 text-text-3 hover:text-status-danger rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL CATEGORÍA ─── */}
      <Dialog open={openCatModal} onOpenChange={setOpenCatModal}>
        <DialogContent className="bg-surface-card border-border sm:max-w-lg text-text-1">
          <DialogHeader>
            <DialogTitle className="text-xl font-montserrat font-bold">
              {catForm.id ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 py-4" onSubmit={saveCategory}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Nombre *</label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="Ej: Víveres, Electrónica, Calzado..."
                className="h-11 bg-surface-input"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Descripción</label>
              <textarea
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                className="w-full bg-surface-input border border-border/50 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-brand text-text-1"
                rows={2}
                placeholder="Descripción opcional..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Categoría Padre</label>
                <Select value={catForm.parent_id} onValueChange={(v) => setCatForm({ ...catForm, parent_id: v })}>
                  <SelectTrigger className="h-11 bg-surface-input border-border/50">
                    <SelectValue placeholder="Ninguna" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card border-border text-black">
                    <SelectItem value="none">Ninguna (Principal)</SelectItem>
                    {categories.filter((c) => c.id !== catForm.id).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Imagen (URL)</label>
                <Input
                  value={catForm.image_url}
                  onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="h-11 bg-surface-input"
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Color identificador</label>
              <div className="flex items-center gap-2 flex-wrap">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCatForm({ ...catForm, color })}
                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                    style={{
                      backgroundColor: color,
                      borderColor: catForm.color === color ? "#1A1125" : "transparent",
                      boxShadow: catForm.color === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none",
                    }}
                  >
                    {catForm.color === color && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setOpenCatModal(false)} className="px-6 py-2 text-text-3 font-bold">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!catForm.name || isSaving}
                className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Guardar Categoría</>}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL ATRIBUTO ─── */}
      <Dialog open={openAttrModal} onOpenChange={setOpenAttrModal}>
        <DialogContent className="bg-surface-card border-border sm:max-w-md text-text-1">
          <DialogHeader>
            <DialogTitle className="text-xl font-montserrat font-bold">
              {attrForm.id ? "Editar Atributo" : "Nuevo Atributo"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 py-4" onSubmit={saveAttribute}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Nombre del Atributo *</label>
              <Input
                value={attrForm.name}
                onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                placeholder="Ej: Talla, Color, Material..."
                className="h-11 bg-surface-input"
                required
              />
              <p className="text-[10px] text-text-3">Este nombre aparecerá al crear variantes de productos.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Valores (separados por coma) *</label>
              <Input
                value={attrForm.values}
                onChange={(e) => setAttrForm({ ...attrForm, values: e.target.value })}
                placeholder="Ej: S, M, L, XL"
                className="h-11 bg-surface-input"
                required
              />
              <p className="text-[10px] text-text-3">Escribe las opciones separadas por coma.</p>
            </div>

            {/* Preview en tiempo real */}
            {previewValues.length > 0 && (
              <div className="p-3 bg-surface-base border border-border rounded-xl space-y-1.5">
                <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Vista previa</p>
                <div className="flex gap-1.5 flex-wrap">
                  {previewValues.map((v, i) => (
                    <span
                      key={v}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        VALUE_CHIP_COLORS[i % VALUE_CHIP_COLORS.length]
                      )}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setOpenAttrModal(false)} className="px-6 py-2 text-text-3 font-bold">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!attrForm.name || !attrForm.values || isSaving}
                className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Guardar Atributo</>}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
