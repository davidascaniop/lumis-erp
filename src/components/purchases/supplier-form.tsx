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

const supplierSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  rif: z.string().min(5, "RIF Requerido"),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").or(z.literal("")),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export function SupplierForm({
  open,
  setOpen,
  onSuccess,
  supplier,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
  supplier?: any;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      rif: supplier?.rif || "",
      contact_name: supplier?.contact_name || "",
      phone: supplier?.phone || "",
      email: supplier?.email || "",
      address: supplier?.address || "",
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset(supplier);
    } else {
      form.reset({
        name: "",
        rif: "",
        contact_name: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [supplier, form]);

  async function onSubmit(values: SupplierFormValues) {
    if (!user?.company_id) return;
    setLoading(true);

    try {
      const payload = {
        company_id: user.company_id,
        ...values,
      };

      let error;
      if (supplier?.id) {
        const { error: err } = await supabase
          .from("suppliers")
          .update(payload)
          .eq("id", supplier.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("suppliers")
          .insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(supplier?.id ? "Proveedor actualizado" : "Proveedor creado");
      setOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Error al guardar proveedor", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-surface-base border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-syne text-white">
            {supplier?.id ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
          <DialogDescription className="text-text-3">
            Registra los datos de contacto de tu aliado comercial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">Nombre / Razón Social</label>
              <Input {...form.register("name")} placeholder="Empresas Polar C.A" />
              {form.formState.errors.name && <p className="text-[10px] text-status-danger">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">RIF</label>
              <Input {...form.register("rif")} placeholder="J-12345678-0" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">Persona de Contacto</label>
              <Input {...form.register("contact_name")} placeholder="Juan Pérez" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">Teléfono</label>
              <Input {...form.register("phone")} placeholder="+58 412..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">Email</label>
              <Input {...form.register("email")} placeholder="proveedor@gmail.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-2 uppercase">Dirección Fiscal</label>
            <textarea
              {...form.register("address")}
              className="w-full bg-surface-input border-none rounded-xl p-3 text-sm text-white placeholder:text-text-3 min-h-[80px] focus:ring-1 focus:ring-brand outline-none"
              placeholder="Ubicación física del proveedor..."
            />
          </div>
          </div>

          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-text-2 hover:bg-white/5 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar Proveedor"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
