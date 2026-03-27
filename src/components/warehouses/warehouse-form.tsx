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

const warehouseSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  location: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export function WarehouseForm({
  open,
  setOpen,
  onSuccess,
  warehouse,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
  warehouse?: any;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name || "",
      location: warehouse?.location || "",
    },
  });

  useEffect(() => {
    if (warehouse) {
      form.reset(warehouse);
    } else {
      form.reset({
        name: "",
        location: "",
      });
    }
  }, [warehouse, form]);

  async function onSubmit(values: WarehouseFormValues) {
    if (!user?.company_id) return;
    setLoading(true);

    try {
      const payload = {
        company_id: user.company_id,
        ...values,
      };

      let error;
      if (warehouse?.id) {
        const { error: err } = await supabase
          .from("warehouses")
          .update(payload)
          .eq("id", warehouse.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("warehouses")
          .insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(warehouse?.id ? "Almacén actualizado" : "Almacén creado");
      setOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Error al guardar almacén", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px] bg-surface-base border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-syne text-white">
            {warehouse?.id ? "Editar Almacén" : "Nuevo Almacén"}
          </DialogTitle>
          <DialogDescription className="text-text-3">
            Define los puntos de almacenamiento de tu inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-2 uppercase">Nombre del Almacén</label>
            <Input {...form.register("name")} placeholder="Almacén Principal / Sede Norte" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-2 uppercase">Ubicación / Dirección</label>
            <textarea
              {...form.register("location")}
              className="w-full bg-surface-input border-none rounded-xl p-3 text-sm text-white placeholder:text-text-3 min-h-[80px] focus:ring-1 focus:ring-brand outline-none"
              placeholder="Ej: Av. Principal, Galpón #4..."
            />
          </div>

          <DialogFooter className="mt-6">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-text-2 hover:bg-white/5 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar Almacén"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
