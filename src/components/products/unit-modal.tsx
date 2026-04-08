"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { Loader2, X, Plus } from "lucide-react";

const INPUT_CLS =
  "w-full h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand focus:border-brand font-montserrat";
const LABEL_CLS =
  "block text-[10px] font-bold text-brand uppercase tracking-widest mb-1 font-montserrat";

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
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  async function onSubmit(values: UnitFormValues) {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      // Verificar si ya existe el slug para esta empresa
      const { data: existing } = await supabase
        .from("product_units")
        .select("id")
        .eq("company_id", user.company_id)
        .eq("slug", values.slug.toLowerCase())
        .single();

      if (existing) {
        toast.error("Error", { description: "Ya existe una unidad con esta abreviatura (slug)." });
        return;
      }

      const { error } = await supabase.from("product_units").insert({
        company_id: user.company_id,
        name: values.name,
        slug: values.slug.toLowerCase(),
      });

      if (error) throw error;

      toast.success("Unidad creada", { description: `${values.name} (${values.slug}) se agregó al catálogo.` });
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
      <DialogContent className="sm:max-w-[400px] p-0 bg-white border-slate-200 overflow-hidden shadow-2xl rounded-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-montserrat">
                Catálogo
              </p>
              <DialogTitle className="text-xl text-slate-900 font-bold font-montserrat tracking-tight leading-none">
                Nueva Unidad
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className={LABEL_CLS}>Nombre Completo</label>
              <Input
                {...form.register("name")}
                placeholder="Ej. Kilogramos"
                className={INPUT_CLS}
              />
              {form.formState.errors.name && (
                <p className="text-[10px] text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLS}>Abreviatura (Slug)</label>
              <Input
                {...form.register("slug")}
                placeholder="Ej. kg"
                className={`${INPUT_CLS} lowercase`}
                onChange={(e) => {
                  form.setValue("slug", e.target.value.toLowerCase().replace(/\s/g, ""));
                }}
              />
              <p className="text-[10px] text-slate-400 font-montserrat">
                Identificador único corto para reportes y facturas.
              </p>
              {form.formState.errors.slug && (
                <p className="text-[10px] text-red-500">{form.formState.errors.slug.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors font-montserrat"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-brand/90 transition-all disabled:opacity-50 flex items-center gap-2 font-montserrat shadow-lg shadow-brand/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? "Guardando..." : "Crear Unidad"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
