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
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { 
  X,
  ChevronDown,
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
    children, 
    error = false 
  }: { 
    id: string, 
    title: string, 
    children: React.ReactNode, 
    error?: boolean 
  }) => {
    const isOpen = activeSection === id;
    return (
      <div className={`border-b transition-all duration-300 ${error ? "border-l-2 border-l-red-500 pl-3" : "border-slate-100"}`}>
        <button
          type="button"
          onClick={() => setActiveSection(isOpen ? "" : id)}
          className="w-full flex items-center justify-between py-6 text-left group"
        >
          <h3 className={`text-[11px] font-sans font-semibold uppercase tracking-[0.15em] transition-colors ${isOpen ? "text-slate-900" : "text-slate-400 group-hover:text-slate-800"}`}>
            {title}
          </h3>
          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isOpen ? "rotate-180 text-slate-900" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="pb-8 pt-1 bg-white">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const FormField = ({ label, error, children, className = "" }: { label: string, error?: any, children: React.ReactNode, className?: string }) => (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-widest px-0.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-500 px-1 pt-0.5 font-bold uppercase tracking-tight">{error.message}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] p-0 bg-white border-slate-200 overflow-hidden shadow-2xl rounded-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
          {/* Header Minimalista */}
          <div className="px-8 py-7 border-b border-slate-100 relative bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-slate-400 mb-2">Gestión de Inventario</p>
                <DialogTitle className="text-2xl font-serif text-slate-900 tracking-tight leading-none">
                  {product?.id ? "Editar Producto" : "Nuevo Producto"}
                </DialogTitle>
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>
          </div>

          {/* Secciones Desplegables */}
          <div className="flex-1 overflow-y-auto px-8 py-2 bg-white">
            <div>
              {/* Sección 1: General */}
              <CollapsibleSection 
                id="general" 
                title="Información General" 
                error={!!form.formState.errors.name || !!form.formState.errors.sku}
              >
                <div className="grid grid-cols-12 gap-5">
                  <FormField label="Nombre Comercial" error={form.formState.errors.name} className="col-span-12 md:col-span-9">
                    <Input 
                      {...form.register("name")} 
                      placeholder="Ej. Harina Pan 1Kg"
                      className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm focus:ring-0 focus:border-slate-400 rounded-sm shadow-none" 
                    />
                  </FormField>
                  <FormField label="SKU / Cód." error={form.formState.errors.sku} className="col-span-12 md:col-span-3">
                    <Input 
                      {...form.register("sku")} 
                      placeholder="PROD-001"
                      className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 rounded-sm uppercase font-mono shadow-none px-4 text-sm focus:ring-0 focus:border-slate-400" 
                    />
                  </FormField>
                </div>
              </CollapsibleSection>

              {/* Sección 2: Clasificación */}
              <CollapsibleSection id="clasificacion" title="Clasificación y Logística">
                <div className="grid grid-cols-12 gap-5">
                  <FormField label="Tipo de Unidad" className="col-span-12 md:col-span-3">
                    <Select value={form.watch("unit")} onValueChange={(v) => form.setValue("unit", v)}>
                      <SelectTrigger className="h-12 bg-white border-slate-200 text-slate-900 rounded-sm shadow-none font-medium text-sm focus:ring-0">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-sm">
                        <SelectItem value="Unidad" className="text-sm">Unidad</SelectItem>
                        <SelectItem value="Caja" className="text-sm">Caja</SelectItem>
                        <SelectItem value="Paleta" className="text-sm">Paleta</SelectItem>
                        <SelectItem value="Bulto" className="text-sm">Bulto</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Categoría" className="col-span-12 md:col-span-5">
                    <Input {...form.register("category")} placeholder="Víveres" className="h-12 bg-white border-slate-200 text-slate-900 rounded-sm font-medium text-sm shadow-none focus:ring-0" />
                  </FormField>
                  <FormField label="Marca" className="col-span-12 md:col-span-4">
                    <Input {...form.register("brand")} placeholder="Polar" className="h-12 bg-white border-slate-200 text-slate-900 rounded-sm font-medium text-sm shadow-none focus:ring-0" />
                  </FormField>
                  <FormField label="Departamento" className="col-span-12 md:col-span-4">
                    <Input {...form.register("department")} placeholder="Alimentos" className="h-12 bg-white border-slate-200 text-slate-900 rounded-sm font-medium text-sm shadow-none focus:ring-0" />
                  </FormField>
                  <FormField label="Cód. Proveedor" className="col-span-12 md:col-span-4">
                    <Input {...form.register("supplier_code")} placeholder="SUP-123" className="h-12 bg-white border-slate-200 text-slate-900 rounded-sm font-medium text-sm shadow-none uppercase focus:ring-0" />
                  </FormField>
                  <FormField label="Depósito / Sucursal" className="col-span-12 md:col-span-4">
                    <Select value={form.watch("warehouse_id")} onValueChange={(v) => form.setValue("warehouse_id", v)}>
                      <SelectTrigger className="h-12 bg-white border-slate-200 text-slate-900 rounded-sm shadow-none font-medium text-sm focus:ring-0">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-sm">
                        {warehouses.map(w => (
                          <SelectItem key={w.id} value={w.id} className="text-sm">{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Existencia Inicial" className="col-span-12 md:col-span-12 border-t border-slate-100 pt-5 mt-2">
                    <Input {...form.register("stock")} type="number" className="h-12 bg-white border-slate-200 text-slate-900 font-mono font-medium text-base rounded-sm shadow-none px-4 focus:ring-0" />
                  </FormField>
                </div>
              </CollapsibleSection>

              {/* Sección 3: Precios y Ganancias */}
              <CollapsibleSection id="precios" title="Estructura de Precios y Ganancias">
                <div className="space-y-8">
                  <div className="grid grid-cols-12 gap-5">
                    <FormField label="Costo Unitario ($)" className="col-span-12 md:col-span-5">
                      <Input 
                        {...form.register("cost_usd")} 
                        type="number" 
                        step="0.01" 
                        className="h-12 bg-white border-slate-200 text-slate-900 font-mono text-base rounded-sm shadow-none px-4 focus:ring-0" 
                      />
                    </FormField>
                    <FormField label="Precio de Venta ($)" className="col-span-12 md:col-span-7">
                      <Input 
                        {...form.register("price_usd")} 
                        type="number" 
                        step="0.01" 
                        className="h-12 bg-white border-slate-200 text-slate-900 font-mono text-base rounded-sm shadow-none px-4 focus:ring-0" 
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-12 gap-5 border-t border-slate-100 pt-6">
                    <div className="col-span-12 md:col-span-6 flex flex-col justify-center">
                       <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest mb-1">Costo Total Inventario</span>
                       <span className="font-mono text-lg text-slate-600 tracking-tight">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="col-span-12 md:col-span-6 flex items-center justify-between">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest mb-1">Margen de Ganancia</span>
                         <span className="font-mono text-lg text-slate-600 tracking-tight">{profitMarginPercent.toFixed(1)}%</span>
                       </div>
                       <div className="flex flex-col text-right">
                         <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest mb-1">Utilidad Neta</span>
                         <span className={`font-mono text-lg tracking-tight ${profit > 0 ? "text-slate-900" : "text-red-500"}`}>
                           {formatCurrency(profit)}
                         </span>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 pt-6 md:pt-8 border-t border-slate-100">
                    <FormField label="Mayorista" className="col-span-6 md:col-span-3">
                      <Input {...form.register("price_usd_2")} type="number" step="0.01" className="h-10 bg-white border-slate-200 text-slate-600 font-mono text-sm rounded-sm focus:ring-0" />
                    </FormField>
                    <FormField label="Distribuidor" className="col-span-6 md:col-span-3">
                      <Input {...form.register("price_usd_3")} type="number" step="0.01" className="h-10 bg-white border-slate-200 text-slate-600 font-mono text-sm rounded-sm focus:ring-0" />
                    </FormField>
                    <FormField label="Oferta" className="col-span-6 md:col-span-3">
                      <Input {...form.register("price_usd_4")} type="number" step="0.01" className="h-10 bg-white border-slate-200 text-slate-600 font-mono text-sm rounded-sm focus:ring-0" />
                    </FormField>
                    <FormField label="VIP" className="col-span-6 md:col-span-3">
                      <Input {...form.register("price_usd_5")} type="number" step="0.01" className="h-10 bg-white border-slate-200 text-slate-900 font-mono font-medium text-sm rounded-sm focus:ring-0 shadow-none" />
                    </FormField>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Sección 4: Avanzados */}
              <CollapsibleSection id="avanzados" title="Imagen y Descripción">
                <div className="space-y-6">
                   <FormField label="URL de Imagen">
                      <Input {...form.register("image_url")} placeholder="https://..." className="h-12 bg-white border-slate-200 text-slate-900 font-mono text-sm rounded-sm shadow-none focus:ring-0" />
                   </FormField>
                   <FormField label="Descripción">
                      <textarea 
                        {...form.register("description")} 
                        className="w-full bg-white border border-slate-200 rounded-sm p-4 text-slate-900 text-sm min-h-[100px] outline-none focus:border-slate-400 focus:ring-0 resize-none font-sans"
                        placeholder="Escriba aquí los detalles..."
                      />
                   </FormField>
                </div>
              </CollapsibleSection>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-end gap-6">
             <button 
               type="button" 
               onClick={() => setOpen(false)}
               className="text-[11px] font-sans font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
             >
               Cancelar
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-6 py-2.5 bg-brand text-white text-[11px] font-sans font-semibold uppercase tracking-widest rounded-sm hover:bg-brand/90 transition-all disabled:opacity-50 flex items-center gap-2"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
               {loading ? "Guardando..." : product?.id ? "Actualizar" : "Crear Producto"}
             </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
