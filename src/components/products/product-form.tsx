"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { 
  Package, 
  Tag, 
  DollarSign, 
  Layers, 
  Info, 
  Barcode, 
  Factory, 
  LayoutGrid, 
  Image as ImageIcon,
  CheckCircle2,
  X
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
  price_usd: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_2: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_3: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_4: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  price_usd_5: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  stock: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  unit: z.string().default("Unidad"),
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
      price_usd: product?.price_usd || 0,
      price_usd_2: product?.price_usd_2 || 0,
      price_usd_3: product?.price_usd_3 || 0,
      price_usd_4: product?.price_usd_4 || 0,
      price_usd_5: product?.price_usd_5 || 0,
      stock: product?.stock || 0,
      unit: product?.unit || "Unidad",
      image_url: product?.image_url || "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(product);
    } else {
      form.reset({
        name: "",
        sku: "",
        category: "",
        brand: "",
        department: "",
        description: "",
        supplier_code: "",
        price_usd: 0,
        price_usd_2: 0,
        price_usd_3: 0,
        price_usd_4: 0,
        price_usd_5: 0,
        stock: 0,
        unit: "Unidad",
        image_url: "",
      });
    }
  }, [product, form]);

  async function onSubmit(values: ProductFormValues) {
    if (!user?.company_id) return;
    setLoading(true);

    try {
      const payload = {
        company_id: user.company_id,
        ...values,
        status: values.stock > 0 ? "active" : "out_of_stock",
      };

      let error;
      if (product?.id) {
        const { error: err } = await supabase.from("products").update(payload).eq("id", product.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("products").insert(payload);
        error = err;
      }

      if (error) throw error;
      toast.success(product?.id ? "Producto actualizado" : "Producto creado");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Error al guardar producto", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0">
      <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-tighter">{title}</h3>
      <div className="flex-1 h-[1px] bg-white/5 ml-2" />
    </div>
  );

  const FormField = ({ label, error, children, className = "" }: { label: string, error?: any, children: React.ReactNode, className?: string }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest px-1">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-400 px-1 pt-0.5 font-medium">{error.message}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] p-0 bg-[#0F0A12] border-white/10 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent pointer-events-none" />
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/5 relative bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient p-0.5 shadow-brand">
                   <div className="w-full h-full bg-[#0F0A12] rounded-[14px] flex items-center justify-center">
                      <Package className="w-6 h-6 text-brand" />
                   </div>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                    {product?.id ? "Editar Ficha Técnica" : "Nuevo Producto"}
                  </DialogTitle>
                  <DialogDescription className="text-text-3 font-medium">
                    Configura SKU, precios multinivel e inventario.
                  </DialogDescription>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(false)}
                className="p-2 text-text-3 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <section>
                <SectionTitle icon={Info} title="Información General" />
                <div className="grid grid-cols-12 gap-4">
                  <FormField label="Nombre Comercial" error={form.formState.errors.name} className="col-span-12 md:col-span-8">
                    <Input 
                      {...form.register("name")} 
                      placeholder="Ej. Harina Pan 1Kg"
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-text-3 text-base focus:ring-brand focus:border-brand rounded-xl font-bold" 
                    />
                  </FormField>
                  <FormField label="SKU / Código Barra" error={form.formState.errors.sku} className="col-span-12 md:col-span-4">
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                      <Input 
                        {...form.register("sku")} 
                        placeholder="PROD-001"
                        className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-text-3 rounded-xl uppercase font-mono" 
                      />
                    </div>
                  </FormField>
                </div>
              </section>

              <section>
                <SectionTitle icon={LayoutGrid} title="Clasificación y Logística" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField label="Tipo de Unidad">
                    <Select value={form.watch("unit")} onValueChange={(v) => form.setValue("unit", v)}>
                      <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1220] border-white/10 text-white">
                        <SelectItem value="Unidad">📦 Unidad</SelectItem>
                        <SelectItem value="Caja">📦 Caja</SelectItem>
                        <SelectItem value="Paleta">🚚 Paleta</SelectItem>
                        <SelectItem value="Bulto">📦 Bulto</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Categoría">
                    <Input {...form.register("category")} placeholder="Víveres" className="h-11 bg-white/5 border-white/10 text-white rounded-xl" />
                  </FormField>
                  <FormField label="Marca">
                    <Input {...form.register("brand")} placeholder="Polar" className="h-11 bg-white/5 border-white/10 text-white rounded-xl" />
                  </FormField>
                  <FormField label="Departamento">
                    <Input {...form.register("department")} placeholder="Alimentos" className="h-11 bg-white/5 border-white/10 text-white rounded-xl" />
                  </FormField>
                  <FormField label="Cód. Proveedor">
                    <Input {...form.register("supplier_code")} placeholder="SUP-123" className="h-11 bg-white/5 border-white/10 text-white rounded-xl" />
                  </FormField>
                  <FormField label="Existencia Actual">
                    <div className="relative">
                       <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                       <Input {...form.register("stock")} type="number" className="h-11 pl-10 bg-brand/5 border-brand/20 text-brand font-bold rounded-xl" />
                    </div>
                  </FormField>
                </div>
              </section>

              <section>
                <SectionTitle icon={DollarSign} title="Estructura de Precios (Multinivel)" />
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField label="P1: General (Base)" className="bg-brand/10 p-4 rounded-xl border border-brand/20">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand font-bold">$</span>
                        <Input {...form.register("price_usd")} type="number" step="0.01" className="h-12 pl-8 bg-transparent border-none text-brand text-2xl font-bold focus:ring-0" />
                      </div>
                    </FormField>
                    <FormField label="P2: Mayorista">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3">$</span>
                        <Input {...form.register("price_usd_2")} type="number" step="0.01" className="h-11 pl-7 bg-white/5 border-white/10 text-white font-bold rounded-xl" />
                      </div>
                    </FormField>
                    <FormField label="P3: Distribuidor">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3">$</span>
                        <Input {...form.register("price_usd_3")} type="number" step="0.01" className="h-11 pl-7 bg-white/5 border-white/10 text-white font-bold rounded-xl" />
                      </div>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <FormField label="P4: Oferta / Promoción">
                      <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        <Input {...form.register("price_usd_4")} type="number" step="0.01" className="h-11 pl-10 bg-white/5 border-white/10 text-white font-bold rounded-xl" />
                      </div>
                    </FormField>
                    <FormField label="P5: VIP / Convenio">
                      <div className="relative">
                        <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-status-ok" />
                        <Input {...form.register("price_usd_5")} type="number" step="0.01" className="h-11 pl-10 bg-white/5 border-white/10 text-white font-bold rounded-xl" />
                      </div>
                    </FormField>
                  </div>
                </div>
              </section>

              <section>
                <div className="grid grid-cols-1 gap-6">
                   <FormField label="Imagen del Producto (URL)">
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                        <Input {...form.register("image_url")} placeholder="https://ejemplo.com/imagen.png" className="h-11 pl-10 bg-white/5 border-white/10 text-white rounded-xl" />
                      </div>
                   </FormField>
                   <FormField label="Descripción Detallada">
                      <textarea 
                        {...form.register("description")} 
                        className="w-full bg-white/5 border-white/10 rounded-2xl p-4 text-white text-sm min-h-[100px] focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-text-3"
                        placeholder="Describe características adicionales, empaque, ingredientes o uso..."
                      />
                   </FormField>
                </div>
              </section>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
             <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-3 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-10 py-2.5 rounded-xl bg-brand-gradient text-white font-bold shadow-brand hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  {loading ? "Sincronizando..." : product?.id ? "Actualizar Inventario" : "Crear Producto"}
                </button>
             </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
