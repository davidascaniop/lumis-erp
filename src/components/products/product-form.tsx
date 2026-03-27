"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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
import { Package, Tag, DollarSign, Layers } from "lucide-react";

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
  price_usd: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val) || 0),
  price_usd_2: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val) || 0),
  price_usd_3: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val) || 0),
  price_usd_4: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val) || 0),
  price_usd_5: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val) || 0),
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
      form.reset({
        name: product.name,
        sku: product.sku,
        category: product.category || "",
        brand: product.brand || "",
        department: product.department || "",
        description: product.description || "",
        supplier_code: product.supplier_code || "",
        price_usd: product.price_usd,
        price_usd_2: product.price_usd_2 || 0,
        price_usd_3: product.price_usd_3 || 0,
        price_usd_4: product.price_usd_4 || 0,
        price_usd_5: product.price_usd_5 || 0,
        stock: product.stock,
        unit: product.unit || "Unidad",
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
        name: values.name,
        sku: values.sku,
        category: values.category || "General",
        brand: values.brand,
        department: values.department,
        description: values.description,
        supplier_code: values.supplier_code,
        price_usd: values.price_usd,
        price_usd_2: values.price_usd_2,
        price_usd_3: values.price_usd_3,
        price_usd_4: values.price_usd_4,
        price_usd_5: values.price_usd_5,
        stock: values.stock,
        unit: values.unit,
        image_url: values.image_url,
        status: values.stock > 0 ? "active" : "out_of_stock",
      };

      let error;
      if (product?.id) {
        const { error: err } = await supabase
          .from("products")
          .update(payload as any)
          .eq("id", product.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("products")
          .insert(payload as any);
        error = err;
      }

      if (error) throw error;

      toast.success(product?.id ? "Producto actualizado" : "Producto creado");
      setOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Error al guardar producto", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] bg-surface-base border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-syne text-white">
            {product?.id ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription className="text-text-3">
            Administra tu inventario y precios de venta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Nombre del Producto
              </label>
              <Input {...form.register("name")} placeholder="Harina Pan 1Kg" />
              {form.formState.errors.name && (
                <p className="text-[10px] text-status-danger">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                SKU / Código
              </label>
              <Input {...form.register("sku")} placeholder="PROD-001" />
              {form.formState.errors.sku && (
                <p className="text-[10px] text-status-danger">
                  {form.formState.errors.sku.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Categoría
              </label>
              <Input {...form.register("category")} placeholder="Víveres" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" /> Precio ($)
              </label>
              <Input
                {...form.register("price_usd")}
                type="number"
                step="0.01"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Stock Inicial
              </label>
              <Input {...form.register("stock")} type="number" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Unidad
              </label>
              <Select
                value={form.watch("unit")}
                onValueChange={(val) => form.setValue("unit", val)}
              >
                <SelectTrigger className="w-full bg-surface-input border-none rounded-xl text-white">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-white">
                  <SelectItem value="Unidad">Unidad</SelectItem>
                  <SelectItem value="Caja">Caja</SelectItem>
                  <SelectItem value="Paleta">Paleta</SelectItem>
                  <SelectItem value="Bulto">Bulto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Marca
              </label>
              <Input {...form.register("brand")} placeholder="Polar" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Departamento
              </label>
              <Input {...form.register("department")} placeholder="Alimentos" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Código Proveedor
              </label>
              <Input {...form.register("supplier_code")} placeholder="SUP-001" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                URL Imagen (Opcional)
              </label>
              <Input
                {...form.register("image_url")}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2 border-t border-white/5 pt-4 mt-2">
              <h4 className="text-[10px] font-bold text-brand uppercase tracking-widest mb-4">
                Listado de Precios de Venta
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-text-3 uppercase">P1: General ($)</label>
                  <Input {...form.register("price_usd")} type="number" step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-text-3 uppercase">P2: Mayorista ($)</label>
                  <Input {...form.register("price_usd_2")} type="number" step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-text-3 uppercase">P3: Distribuidor ($)</label>
                  <Input {...form.register("price_usd_3")} type="number" step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-text-3 uppercase">P4: Oferta ($)</label>
                  <Input {...form.register("price_usd_4")} type="number" step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-text-3 uppercase">P5: VIP ($)</label>
                  <Input {...form.register("price_usd_5")} type="number" step="0.01" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
              Descripción Breve
            </label>
            <textarea
              {...form.register("description")}
              className="w-full bg-surface-input border-none rounded-xl p-3 text-sm text-white placeholder:text-text-3 min-h-[80px] focus:ring-1 focus:ring-brand outline-none"
              placeholder="Detalles adicionales del producto..."
            />
          </div>

          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-2 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-gradient text-white shadow-brand hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading
                ? "Guardando..."
                : product?.id
                  ? "Actualizar Producto"
                  : "Crear Producto"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
