"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { 
  Package, 
  DollarSign, 
  Layers, 
  Info, 
  Barcode, 
  LayoutGrid, 
  Image as ImageIcon,
  CheckCircle2,
  Zap,
  X,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Wallet,
  Loader2
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const productSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  sku: z.string().min(2, "SKU Requerido"),
  category: z.string().optional(),
  brand: z.string().optional(),
  department: z.string().optional(),
  description: z.string().optional(),
  supplier_code: z.string().optional(),
  cost_usd: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_2: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_3: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_4: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_5: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  stock: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  unit: z.string().default("Unidad"),
  warehouse_id: z.string().optional(),
  image_url: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({
  open,
  setOpen,
  onSuccess,
  product,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
  product?: any;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const supabase = createClient();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      category: product?.category || "",
      brand: product?.brand || "",
      department: product?.department || "",
      description: product?.description || "",
      supplier_code: product?.supplier_code || "",
      cost_usd: product?.cost_usd || 0,
      price_usd: product?.price_usd || 0,
      price_usd_2: product?.price_usd_2 || 0,
      price_usd_3: product?.price_usd_3 || 0,
      price_usd_4: product?.price_usd_4 || 0,
      price_usd_5: product?.price_usd_5 || 0,
      stock: product?.stock || 0,
      unit: product?.unit || "Unidad",
      warehouse_id: "",
      image_url: product?.image_url || "",
    },
  });

  // Watch for price calculations
  const cost_usd = form.watch("cost_usd") || 0;
  const price_usd = form.watch("price_usd") || 0;
  const stock_qty = form.watch("stock") || 0;

  const profit = price_usd - cost_usd;
  const profitMarginPercent = cost_usd > 0 ? (profit / cost_usd) * 100 : 0;
  const totalCost = stock_qty * cost_usd;

  useEffect(() => {
    async function fetchWarehouses() {
      if (!user?.company_id) return;
      const { data } = await supabase
        .from("warehouses")
        .select("*")
        .eq("company_id", user.company_id)
        .eq("is_active", true);
      setWarehouses(data || []);
    }
    fetchWarehouses();
  }, [user?.company_id]);

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        unit: product.unit || "Unidad",
        warehouse_id: "",
        image_url: product.image_url || "",
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        category: "",
        brand: "",
        department: "",
        description: "",
        supplier_code: "",
        cost_usd: 0,
        price_usd: 0,
        price_usd_2: 0,
        price_usd_3: 0,
        price_usd_4: 0,
        price_usd_5: 0,
        stock: 0,
        unit: "Unidad",
        warehouse_id: "",
        image_url: "",
      });
    }
  }, [product, form]);

  async function onSubmit(values: ProductFormValues) {
    if (!user?.company_id) return;
    setLoading(true);

    try {
      const { warehouse_id, ...rest } = values;
      const payload = {
        company_id: user.company_id,
        ...rest,
        status: values.stock > 0 ? "active" : "out_of_stock",
      };

      let productData;
      if (product?.id) {
        const { data, error } = await supabase.from("products").update(payload).eq("id", product.id).select().single();
        if (error) throw error;
        productData = data;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;
        productData = data;
      }

      if (warehouse_id && productData) {
        await supabase.from("warehouse_stock").upsert({
          warehouse_id,
          product_id: productData.id,
          qty: values.stock
        }, { onConflict: 'warehouse_id,product_id' });
      }

      toast.success(product?.id ? "Producto actualizado" : "Producto creado");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Error al guardar producto", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  const CollapsibleSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children, 
    error = false 
  }: { 
    id: string, 
    title: string, 
    icon: any, 
    children: React.ReactNode, 
    error?: boolean 
  }) => {
    const isOpen = activeSection === id;
    return (
      <div className={`border rounded-[1.5rem] overflow-hidden transition-all duration-300 ${isOpen ? "border-brand shadow-sm" : "border-border/40"}`}>
        <button
          type="button"
          onClick={() => setActiveSection(isOpen ? "" : id)}
          className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? "bg-white" : "bg-white hover:bg-slate-50"} ${error ? "border-l-[4px] border-l-red-500" : ""}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl transition-colors ${isOpen ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-400"}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-montserrat font-black uppercase tracking-wider transition-colors ${isOpen ? "text-brand" : "text-slate-600"}`}>
              {title}
            </h3>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="p-6 pt-2 bg-white border-t border-border/10">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const FormField = ({ label, error, children, className = "" }: { label: string, error?: any, children: React.ReactNode, className?: string }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-montserrat font-black text-slate-400 uppercase tracking-widest px-0.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-500 px-1 pt-0.5 font-bold uppercase tracking-tight">{error.message}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[750px] p-0 bg-white border-slate-200 overflow-hidden shadow-2xl rounded-[2.5rem]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
          {/* Header Minimalista */}
          <div className="p-8 pb-6 border-b border-slate-100 relative bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 border border-border/40 flex items-center justify-center shadow-sm">
                   <Package className="w-7 h-7 text-brand" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-montserrat font-black text-slate-900 tracking-tight leading-none">
                    {product?.id ? "Editar Producto" : "Nuevo Producto"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-[13px] mt-1.5 font-medium">
                    Gestión eficiente de inventario y precios multinivel.
                  </DialogDescription>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(false)}
                className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Secciones Desplegables */}
          <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-4 scrollbar-hide bg-white">
            <div className="space-y-4">
              {/* Sección 1: General */}
              <CollapsibleSection 
                id="general" 
                title="Información General" 
                icon={Info}
                error={!!form.formState.errors.name || !!form.formState.errors.sku}
              >
                <div className="grid grid-cols-12 gap-5">
                  <FormField label="Nombre Comercial" error={form.formState.errors.name} className="col-span-12 md:col-span-8">
                    <Input 
                      {...form.register("name")} 
                      placeholder="Ej. Harina Pan 1Kg"
                      className="h-12 bg-white border-border/40 text-slate-900 placeholder:text-slate-200 text-base focus:ring-brand rounded-xl font-bold font-outfit shadow-sm" 
                    />
                  </FormField>
                  <FormField label="SKU / Código Barra" error={form.formState.errors.sku} className="col-span-12 md:col-span-4">
                    <Input 
                      {...form.register("sku")} 
                      placeholder="PROD-001"
                      className="h-12 bg-white border-border/40 text-slate-900 placeholder:text-slate-200 rounded-xl uppercase font-mono shadow-sm px-4" 
                    />
                  </FormField>
                </div>
              </CollapsibleSection>

              {/* Sección 2: Clasificación */}
              <CollapsibleSection id="clasificacion" title="Clasificación y Logística" icon={LayoutGrid}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FormField label="Tipo de Unidad">
                    <Select value={form.watch("unit")} onValueChange={(v) => form.setValue("unit", v)}>
                      <SelectTrigger className="h-12 bg-white border-border/40 text-slate-900 rounded-xl shadow-sm font-bold">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Unidad">📦 Unidad</SelectItem>
                        <SelectItem value="Caja">📦 Caja</SelectItem>
                        <SelectItem value="Paleta">🚚 Paleta</SelectItem>
                        <SelectItem value="Bulto">📦 Bulto</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Categoría">
                    <Input {...form.register("category")} placeholder="Víveres" className="h-12 bg-white border-border/40 text-slate-900 rounded-xl font-bold shadow-sm" />
                  </FormField>
                  <FormField label="Marca">
                    <Input {...form.register("brand")} placeholder="Polar" className="h-12 bg-white border-border/40 text-slate-900 rounded-xl font-bold shadow-sm" />
                  </FormField>
                  <FormField label="Departamento">
                    <Input {...form.register("department")} placeholder="Alimentos" className="h-12 bg-white border-border/40 text-slate-900 rounded-xl font-bold shadow-sm" />
                  </FormField>
                  <FormField label="Cód. Proveedor">
                    <Input {...form.register("supplier_code")} placeholder="SUP-123" className="h-12 bg-white border-border/40 text-slate-900 rounded-xl font-bold shadow-sm" />
                  </FormField>
                  <FormField label="Depósito / Sucursal">
                    <Select value={form.watch("warehouse_id")} onValueChange={(v) => form.setValue("warehouse_id", v)}>
                      <SelectTrigger className="h-12 bg-white border-border/40 text-slate-700 rounded-xl shadow-sm font-black uppercase text-[10px]">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {warehouses.map(w => (
                          <SelectItem key={w.id} value={w.id}>🏪 {w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Existencia Inicial" className="col-span-full">
                    <Input {...form.register("stock")} type="number" className="h-14 bg-brand/5 border-brand/20 text-brand font-black text-xl rounded-2xl shadow-sm text-center" />
                  </FormField>
                </div>
              </CollapsibleSection>

              {/* Sección 3: Precios y Ganancias */}
              <CollapsibleSection id="precios" title="Estructura de Precios y Ganancias" icon={DollarSign}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField label="Costo Unitario ($)">
                      <Input 
                        {...form.register("cost_usd")} 
                        type="number" 
                        step="0.01" 
                        className="h-12 bg-white border-border/40 text-slate-900 font-bold rounded-xl" 
                      />
                    </FormField>
                    <FormField label="Cantidad">
                       <Input value={stock_qty} disabled className="h-12 bg-slate-50 border-border/30 text-slate-400 font-bold rounded-xl cursor-not-allowed" />
                    </FormField>
                    <FormField label="Costo Total">
                       <div className="h-12 bg-slate-50 border border-border/30 rounded-xl flex items-center px-4 font-mono font-black text-slate-400">
                         {formatCurrency(totalCost)}
                       </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ring-1 ring-brand/10 p-6 rounded-3xl bg-slate-50/50">
                    <FormField label="Precio de Venta ($)">
                      <Input 
                        {...form.register("price_usd")} 
                        type="number" 
                        step="0.01" 
                        className="h-14 bg-white border-brand/20 text-text-1 text-2xl font-black rounded-2xl shadow-sm focus:ring-brand" 
                      />
                    </FormField>
                    <FormField label="Ganancia (%)">
                       <div className="h-14 bg-white border border-border/40 rounded-2xl flex items-center justify-center text-ok font-black text-2xl shadow-sm">
                         {profitMarginPercent.toFixed(1)}%
                       </div>
                    </FormField>
                  </div>

                  <div className="text-center">
                    <span className={`text-[12px] font-black uppercase tracking-widest ${profit > 0 ? "text-ok" : "text-danger"}`}>
                       Utilidad: {formatCurrency(profit)} por unidad
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/10">
                    <FormField label="Mayorista">
                      <Input {...form.register("price_usd_2")} type="number" step="0.01" className="h-11 bg-white border-border/40 text-slate-700 font-bold rounded-xl" />
                    </FormField>
                    <FormField label="Distrib.">
                      <Input {...form.register("price_usd_3")} type="number" step="0.01" className="h-11 bg-white border-border/40 text-slate-700 font-bold rounded-xl" />
                    </FormField>
                    <FormField label="Oferta">
                      <Input {...form.register("price_usd_4")} type="number" step="0.01" className="h-11 bg-white border-border/40 text-slate-700 font-bold rounded-xl" />
                    </FormField>
                    <FormField label="VIP">
                      <Input {...form.register("price_usd_5")} type="number" step="0.01" className="h-11 bg-white border-border/40 text-slate-700 font-bold rounded-xl" />
                    </FormField>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Sección 4: Avanzados */}
              <CollapsibleSection id="avanzados" title="Imagen y Descripción" icon={ImageIcon}>
                <div className="space-y-6">
                   <FormField label="URL de Imagen">
                      <Input {...form.register("image_url")} placeholder="https://..." className="h-12 bg-white border-border/40 text-slate-900 rounded-xl" />
                   </FormField>
                   <FormField label="Descripción">
                      <textarea 
                        {...form.register("description")} 
                        className="w-full bg-white border border-border/40 rounded-2xl p-4 text-slate-900 text-[13px] font-outfit min-h-[100px] focus:ring-1 focus:ring-brand outline-none"
                        placeholder="..."
                      />
                   </FormField>
                </div>
              </CollapsibleSection>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-3 rounded-b-[2.5rem]">
             <button 
               type="button" 
               onClick={() => setOpen(false)}
               className="px-8 py-3 rounded-2xl text-[12px] font-montserrat font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
             >
               Cancelar
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-10 py-3 rounded-2xl bg-brand text-white text-[12px] font-montserrat font-black uppercase tracking-widest shadow-brand-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3"
             >
               {loading ? "Sincronizando..." : product?.id ? "Actualizar" : "Crear Producto"}
             </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
