"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { X, ChevronDown, Loader2 } from "lucide-react";
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
  stock: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
  unit: z.string().default("Unidad"),
  warehouse_id: z.string().optional(),
  image_url: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const INPUT_CLS = "h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm rounded-xl shadow-none focus:ring-0 focus:border-slate-400 font-montserrat";
const LABEL_CLS = "block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 font-montserrat";

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
  const [activeSection, setActiveSection] = useState<string>("general");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const supabase = createClient();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "", sku: "", category: "", brand: "", department: "",
      description: "", supplier_code: "", cost_usd: 0, price_usd: 0,
      price_usd_2: 0, price_usd_3: 0, price_usd_4: 0,
      stock: 0, unit: "Unidad", warehouse_id: "", image_url: "",
    },
  });

  const cost_usd  = Number(form.watch("cost_usd"))  || 0;
  const price_usd = Number(form.watch("price_usd")) || 0;
  const stock_qty = Number(form.watch("stock"))      || 0;

  const totalCost         = cost_usd; // costo unitario sin multiplicar
  const profit            = price_usd - cost_usd;
  const profitMarginPct   = cost_usd > 0 ? (profit / cost_usd) * 100 : 0;

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
      form.reset({ ...product, warehouse_id: "", image_url: product.image_url || "" });
    } else {
      form.reset({
        name: "", sku: "", category: "", brand: "", department: "",
        description: "", supplier_code: "", cost_usd: 0, price_usd: 0,
        price_usd_2: 0, price_usd_3: 0, price_usd_4: 0,
        stock: 0, unit: "Unidad", warehouse_id: "", image_url: "",
      });
    }
    setActiveSection("general");
  }, [product, open]);

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
        await supabase.from("warehouse_stock").upsert(
          { warehouse_id, product_id: productData.id, qty: values.stock },
          { onConflict: "warehouse_id,product_id" }
        );
      }
      toast.success(product?.id ? "Producto actualizado" : "Producto creado");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Error al guardar producto", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setActiveSection((prev) => (prev === id ? "" : id));
  }

  const Section = ({
    id, title, children, hasError = false,
  }: { id: string; title: string; children: React.ReactNode; hasError?: boolean }) => {
    const open = activeSection === id;
    return (
      <div className={`border-b ${hasError ? "border-l-2 border-l-red-400 pl-3" : "border-slate-100"}`}>
        <button
          type="button"
          onClick={() => toggle(id)}
          className="w-full flex items-center justify-between py-5 text-left group"
        >
          <span className={`text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors font-montserrat ${open ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"}`}>
            {title}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${open ? "rotate-180 text-slate-700" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="pb-8 pt-1">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={className}>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );

  const Metric = ({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-montserrat">{label}</span>
      <span className={`font-mono text-xl font-semibold tracking-tight ${danger ? "text-red-500" : "text-slate-800"}`}>{value}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] p-0 bg-white border-slate-200 overflow-hidden shadow-2xl rounded-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col" style={{ maxHeight: "90vh" }}>

          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between shrink-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 font-montserrat">Gestión de Inventario</p>
              <DialogTitle className="text-2xl text-slate-900 tracking-tight leading-none font-montserrat font-bold">
                {product?.id ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
            </div>
            {/* El DialogContent proporciona la X de cierre automáticamente */}
          </div>

          {/* Secciones con scroll */}
          <div className="flex-1 overflow-y-auto px-8 py-2">

            {/* SECCIÓN 1 — Información General */}
            <Section id="general" title="Información General" hasError={!!form.formState.errors.name || !!form.formState.errors.sku}>
              <div className="grid grid-cols-12 gap-4">
                <Field label="Nombre Comercial" className="col-span-9">
                  <Input {...form.register("name")} placeholder="Ej. Harina Pan 1Kg" className={INPUT_CLS} />
                  {form.formState.errors.name && <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                </Field>
                <Field label="SKU / Código de Barra" className="col-span-3">
                  <Input {...form.register("sku")} placeholder="PROD-001" className={`${INPUT_CLS} uppercase font-mono`} />
                  {form.formState.errors.sku && <p className="text-[10px] text-red-500 mt-1">{form.formState.errors.sku.message}</p>}
                </Field>
              </div>
            </Section>

            {/* SECCIÓN 2 — Clasificación y Logística */}
            <Section id="clasificacion" title="Clasificación y Logística">
              <div className="space-y-4">
                {/* Fila 1 */}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Tipo de Unidad">
                    <Select value={form.watch("unit")} onValueChange={(v) => form.setValue("unit", v)}>
                      <SelectTrigger className={INPUT_CLS}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-xl">
                        <SelectItem value="Unidad">Unidad</SelectItem>
                        <SelectItem value="Caja">Caja</SelectItem>
                        <SelectItem value="Kg">Kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Categoría">
                    <Input {...form.register("category")} placeholder="Víveres" className={INPUT_CLS} />
                  </Field>
                  <Field label="Marca">
                    <Input {...form.register("brand")} placeholder="Polar" className={INPUT_CLS} />
                  </Field>
                </div>
                {/* Fila 2 */}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Departamento">
                    <Input {...form.register("department")} placeholder="Alimentos" className={INPUT_CLS} />
                  </Field>
                  <Field label="Cód. Proveedor">
                    <Input {...form.register("supplier_code")} placeholder="SUP-123" className={`${INPUT_CLS} uppercase font-mono`} />
                  </Field>
                  <Field label="Depósito / Sucursal">
                    <Select value={form.watch("warehouse_id")} onValueChange={(v) => form.setValue("warehouse_id", v)}>
                      <SelectTrigger className={INPUT_CLS}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-xl">
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                {/* Fila 3 */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Existencia Inicial">
                    <Input {...form.register("stock")} type="number" min={0} defaultValue={0} className={`${INPUT_CLS} font-mono`} />
                  </Field>
                  <div /> {/* espaciador para mantener el 50% */}
                </div>
              </div>
            </Section>

            {/* SECCIÓN 3 — Estructura de Precios y Ganancias */}
            <Section id="precios" title="Estructura de Precios y Ganancias">
              <div className="space-y-6">
                {/* Fila 1: Inputs editables 50/50 */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Costo Unitario ($)">
                    <Input {...form.register("cost_usd")} type="number" step="0.01" min={0} className={`${INPUT_CLS} font-mono`} />
                  </Field>
                  <Field label="Precio de Venta ($)">
                    <Input {...form.register("price_usd")} type="number" step="0.01" min={0} className={`${INPUT_CLS} font-mono`} />
                  </Field>
                </div>

                {/* Fila 2: Métricas solo lectura */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                  <Metric label="Costo Total Inventario" value={formatCurrency(totalCost)} />
                  <Metric label="Margen de Ganancia" value={`${profitMarginPct.toFixed(1)}%`} />
                  <Metric label="Utilidad Neta" value={formatCurrency(profit)} danger={profit < 0} />
                </div>

                {/* Fila 3: Precios especiales */}
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4 font-montserrat">Precios Especiales</p>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Precio al Mayor">
                      <Input {...form.register("price_usd_2")} type="number" step="0.01" min={0} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="Precio Mínimo">
                      <Input {...form.register("price_usd_3")} type="number" step="0.01" min={0} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="Precio Oferta">
                      <Input {...form.register("price_usd_4")} type="number" step="0.01" min={0} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>

            {/* SECCIÓN 4 — Imagen y Descripción */}
            <Section id="avanzados" title="Imagen y Descripción">
              <div className="space-y-4">
                <Field label="URL de Imagen">
                  <Input {...form.register("image_url")} placeholder="https://..." className={`${INPUT_CLS} font-mono`} />
                </Field>
                <Field label="Descripción">
                  <textarea
                    {...form.register("description")}
                    placeholder="Escriba aquí los detalles del producto..."
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none font-montserrat"
                  />
                </Field>
              </div>
            </Section>

          </div>

          {/* Footer — siempre visible */}
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-6 shrink-0 bg-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors font-montserrat"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-brand text-white text-[11px] font-semibold uppercase tracking-widest rounded-full hover:bg-brand/90 transition-all disabled:opacity-50 flex items-center gap-2 font-montserrat shadow-lg shadow-brand/20 active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Guardando..." : product?.id ? "Actualizar" : "Crear Producto"}
            </button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
