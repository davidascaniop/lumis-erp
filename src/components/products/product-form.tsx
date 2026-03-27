"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
      <div className="p-1.5 rounded-lg bg-[#E040FB]/10 text-[#E040FB]">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      <div className="flex-1 h-[1px] bg-slate-200 ml-2" />
    </div>
  );

  const FormField = ({ label, error, children, className = "" }: { label: string, error?: any, children: React.ReactNode, className?: string }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest px-1">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-500 px-1 pt-0.5 font-medium">{error.message}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] p-0 bg-white border-slate-200 overflow-hidden shadow-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100 relative bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] p-0.5 shadow-md">
                   <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#7C4DFF]" />
                   </div>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                    {product?.id ? "Editar Ficha Técnica" : "Nuevo Producto"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">
                    Configura SKU, precios multinivel e inventario de forma clara y sencilla.
                  </DialogDescription>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
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
                      className="h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 text-base focus:ring-[#7C4DFF] focus:border-[#7C4DFF] rounded-xl font-semibold shadow-sm" 
                    />
                  </FormField>
                  <FormField label="SKU / Código Barra" error={form.formState.errors.sku} className="col-span-12 md:col-span-4">
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input 
                        {...form.register("sku")} 
                        placeholder="PROD-001"
                        className="h-12 pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl uppercase font-mono shadow-sm" 
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
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl shadow-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="Unidad">📦 Unidad</SelectItem>
                        <SelectItem value="Caja">📦 Caja</SelectItem>
                        <SelectItem value="Paleta">🚚 Paleta</SelectItem>
                        <SelectItem value="Bulto">📦 Bulto</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Categoría">
                    <Input {...form.register("category")} placeholder="Víveres" className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl shadow-sm" />
                  </FormField>
                  <FormField label="Marca">
                    <Input {...form.register("brand")} placeholder="Polar" className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl shadow-sm" />
                  </FormField>
                  <FormField label="Departamento">
                    <Input {...form.register("department")} placeholder="Alimentos" className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl shadow-sm" />
                  </FormField>
                  <FormField label="Cód. Proveedor">
                    <Input {...form.register("supplier_code")} placeholder="SUP-123" className="h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl shadow-sm" />
                  </FormField>
                  <FormField label="Existencia Actual">
                    <div className="relative">
                       <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00D4AA]" />
                       <Input {...form.register("stock")} type="number" className="h-11 pl-10 bg-[#00D4AA]/5 border-[#00D4AA]/30 text-slate-900 font-bold rounded-xl shadow-sm" />
                    </div>
                  </FormField>
                </div>
              </section>

              <section>
                <SectionTitle icon={DollarSign} title="Estructura de Precios (Multinivel)" />
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField label="P1: General (Base)" className="bg-[#E040FB]/5 p-4 rounded-xl border border-[#E040FB]/20 shadow-sm">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C4DFF] font-bold text-lg">$</span>
                        <Input {...form.register("price_usd")} type="number" step="0.01" className="h-12 pl-8 bg-white border border-white text-slate-900 text-2xl font-bold focus:ring-[#7C4DFF] rounded-lg shadow-sm" />
                      </div>
                    </FormField>
                    <FormField label="P2: Mayorista" className="pt-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <Input {...form.register("price_usd_2")} type="number" step="0.01" className="h-11 pl-7 bg-white border-slate-200 text-slate-900 font-bold rounded-xl shadow-sm" />
                      </div>
                    </FormField>
                    <FormField label="P3: Distribuidor" className="pt-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <Input {...form.register("price_usd_3")} type="number" step="0.01" className="h-11 pl-7 bg-white border-slate-200 text-slate-900 font-bold rounded-xl shadow-sm" />
                      </div>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                    <FormField label="P4: Oferta / Promoción">
                      <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        <Input {...form.register("price_usd_4")} type="number" step="0.01" className="h-11 pl-10 bg-white border-slate-200 text-slate-900 font-bold rounded-xl shadow-sm" />
                      </div>
                    </FormField>
                    <FormField label="P5: VIP / Convenio">
                      <div className="relative">
                        <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00D4AA]" />
                        <Input {...form.register("price_usd_5")} type="number" step="0.01" className="h-11 pl-10 bg-white border-slate-200 text-slate-900 font-bold rounded-xl shadow-sm" />
                      </div>
                    </FormField>
                  </div>
                </div>
              </section>

              <section>
                <div className="grid grid-cols-1 gap-6">
                   <FormField label="Imagen del Producto (URL)">
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input {...form.register("image_url")} placeholder="https://ejemplo.com/imagen.png" className="h-11 pl-10 bg-slate-50 border-slate-200 text-slate-900 rounded-xl shadow-sm" />
                      </div>
                   </FormField>
                   <FormField label="Descripción Detallada">
                      <textarea 
                        {...form.register("description")} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm min-h-[100px] focus:ring-2 focus:ring-[#7C4DFF]/20 focus:border-[#7C4DFF] outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Describe características adicionales, empaque, ingredientes o uso..."
                      />
                   </FormField>
                </div>
              </section>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-lg">
             <button 
               type="button" 
               onClick={() => setOpen(false)}
               className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"
             >
               Cancelar
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
             >
               {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
               {loading ? "Sincronizando..." : product?.id ? "Actualizar Inventario" : "Crear Producto"}
             </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
