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
import { MapPin, Navigation } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  rif: z.string().min(5, "Rif inválido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  credit_limit: z.any().transform((v) => Number(v) || 0),
  payment_terms: z.any().transform((v) => Number(v) || 0),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function ClientForm({
  open,
  setOpen,
  onSuccess,
  client,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
  client?: any;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      rif: client?.rif || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
      latitude: client?.latitude || null,
      longitude: client?.longitude || null,
      credit_limit: client?.credit_limit || 500,
      payment_terms: client?.payment_terms || 7,
    },
  });

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        rif: client.rif,
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        latitude: client.latitude || null,
        longitude: client.longitude || null,
        credit_limit: client.credit_limit,
        payment_terms: client.payment_terms,
      });
    } else {
      form.reset({
        name: "",
        rif: "",
        email: "",
        phone: "",
        address: "",
        latitude: null,
        longitude: null,
        credit_limit: 500,
        payment_terms: 7,
      });
    }
  }, [client, form]);

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast.info("Capturando ubicación GPS...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          toast.success(
            "Ubicación capturada: " +
              position.coords.latitude.toFixed(4) +
              ", " +
              position.coords.longitude.toFixed(4),
          );
        },
        (err) => {
          toast.error("Error al obtener ubicación. Asegúrate de dar permisos.");
        },
      );
    } else {
      toast.error("Tu navegador no soporta geolocalización");
    }
  };

  async function onSubmit(values: any) {
    if (!user?.company_id) return;
    setLoading(true);

    if (!client?.id) {
        const plan = user?.companies?.plan_type?.toLowerCase() || 'starter';
        if (!plan.includes('pro') && !plan.includes('enterprise')) {
            const { count } = await supabase.from('partners').select('*', { count: 'exact', head: true }).eq('company_id', user.company_id);
            if (count !== null && count >= 50) {
                toast.error('Alcanzaste el límite de tu plan, mejora a Pro Business para clientes ilimitados');
                setLoading(false);
                return;
            }
        }
    }

    try {
      const payload = {
        company_id: user.company_id,
        name: values.name,
        rif: values.rif,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        latitude: values.latitude,
        longitude: values.longitude,
        credit_limit: values.credit_limit,
        payment_terms: values.payment_terms,
      };

      let error;
      if (client?.id) {
        const { error: err } = await supabase
          .from("partners")
          .update(payload as any)
          .eq("id", client.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("partners").insert({
          ...payload,
          current_balance: 0,
          status: "active",
          credit_status: "green",
        } as any);
        error = err;
      }

      if (error) throw error;

      toast.success(client?.id ? "Cliente actualizado" : "Cliente creado");
      setOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Error al crear cliente", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-surface-base border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-syne text-white">
            {client?.id ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-text-3">
            {client?.id
              ? "Actualiza la información de la cuenta comercial."
              : "Registra una nueva cuenta comercial en tu sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Nombre / Razón Social
              </label>
              <Input
                {...form.register("name")}
                placeholder="Distribuidora C.A."
              />
              {form.formState.errors.name && (
                <p className="text-[10px] text-status-danger">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                RIF / Cédula
              </label>
              <Input {...form.register("rif")} placeholder="J-12345678-0" />
              {form.formState.errors.rif && (
                <p className="text-[10px] text-status-danger">
                  {form.formState.errors.rif.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Teléfono
              </label>
              <Input {...form.register("phone")} placeholder="0412..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
              Dirección de Entrega
            </label>
            <div className="relative">
              <Input
                {...form.register("address")}
                placeholder="Av. Principal, Edif. Lumis..."
                className="pr-12"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand/10 text-brand rounded-lg hover:bg-brand hover:text-white transition-all"
                title="Capturar ubicación GPS actual"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
            {form.watch("latitude") && form.watch("longitude") && (
              <p className="text-[10px] text-status-ok flex items-center gap-1 mt-1">
                <Navigation className="w-3 h-3" />
                Ubicación capturada: {form.watch("latitude")?.toFixed(4)},{" "}
                {form.watch("longitude")?.toFixed(4)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Límite Crédito ($)
              </label>
              <Input {...form.register("credit_limit")} type="number" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase tracking-wider">
                Días de Crédito
              </label>
              <Input {...form.register("payment_terms")} type="number" />
            </div>
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
                : client?.id
                  ? "Guardar Cambios"
                  : "Crear Cliente"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
