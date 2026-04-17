"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { Plus } from "lucide-react";
import {
  MF_INPUT,
  FormField,
  ModalHeader,
  ModalFooter,
} from "@/components/ui/modal-form";

const unitSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z.string().min(1, "Slug requerido").max(10, "Máximo 10 caracteres"),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface UnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UnitModal({ open, onOpenChange, onSuccess }: UnitModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: { name: "", slug: "" },
  });

  async function onSubmit(values: UnitFormValues) {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("product_units")
        .select("id")
        .eq("company_id", user.company_id)
        .eq("slug", values.slug.toLowerCase())
        .single();

      if (existing) {
        toast.error("Error", {
          description: "Ya existe una unidad con esta abreviatura (slug).",
        });
        return;
      }

      const { error } = await supabase.from("product_units").insert({
        company_id: user.company_id,
        name: values.name,
        slug: values.slug.toLowerCase(),
      });

      if (error) throw error;

      toast.success("Unidad creada", {
        description: `${values.name} (${values.slug}) se agregó al catálogo.`,
      });
      form.reset();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error al guardar", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 bg-white border-slate-200 overflow-hidden shadow-2xl rounded-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <ModalHeader
            eyebrow="Catálogo"
            title="Nueva Unidad de Medida"
            description="Agrega una nueva unidad para clasificar tus productos."
          />

          <div className="p-6 space-y-5">
            <FormField
              label="Nombre Completo"
              error={form.formState.errors.name?.message}
            >
              <Input
                {...form.register("name")}
                placeholder="Ej. Kilogramos"
                className={MF_INPUT}
              />
            </FormField>

            <FormField
              label="Abreviatura (Slug)"
              hint="Identificador único corto para reportes y facturas."
              error={form.formState.errors.slug?.message}
            >
              <Input
                {...form.register("slug")}
                placeholder="Ej. kg"
                className={`${MF_INPUT} lowercase`}
                onChange={(e) => {
                  form.setValue(
                    "slug",
                    e.target.value.toLowerCase().replace(/\s/g, ""),
                  );
                }}
              />
            </FormField>
          </div>

          <ModalFooter
            onCancel={() => onOpenChange(false)}
            submitLabel="Crear Unidad"
            loadingLabel="Guardando..."
            loading={loading}
            icon={<Plus className="w-4 h-4" />}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
