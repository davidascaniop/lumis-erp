"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { MapPin, Navigation, Users } from "lucide-react";
import {
  MF_INPUT,
  FormField,
  ModalHeader,
  ModalFooter,
} from "@/components/ui/modal-form";

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
    if (!("geolocation" in navigator)) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    toast.info("Capturando ubicación GPS...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude);
        form.setValue("longitude", position.coords.longitude);
        toast.success(
          `Ubicación capturada: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        );
      },
      () => {
        toast.error("Error al obtener ubicación. Asegúrate de dar permisos.");
      },
    );
  };

  async function onSubmit(values: any) {
    if (!user?.company_id) return;
    setLoading(true);

    if (!client?.id) {
      const plan = user?.companies?.plan_type?.toLowerCase() || "starter";
      if (!plan.includes("pro") && !plan.includes("enterprise")) {
        const { count } = await supabase
          .from("partners")
          .select("*", { count: "exact", head: true })
          .eq("company_id", user.company_id);
        if (count !== null && count >= 50) {
          toast.error(
            "Alcanzaste el límite de tu plan, mejora a Pro Business para clientes ilimitados",
          );
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
      toast.error("Error al guardar cliente", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[520px] p-0 bg-white border-slate-200 overflow-hidden shadow-2xl rounded-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <ModalHeader
            eyebrow="Clientes"
            title={client?.id ? "Editar Cliente" : "Nuevo Cliente"}
            description={
              client?.id
                ? "Actualiza la información de la cuenta comercial."
                : "Registra una nueva cuenta comercial en tu sistema."
            }
            icon={<Users className="w-5 h-5" />}
          />

          <div className="p-6 space-y-5">
            <FormField
              label="Nombre / Razón Social"
              required
              error={form.formState.errors.name?.message}
            >
              <Input
                {...form.register("name")}
                placeholder="Distribuidora C.A."
                className={MF_INPUT}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="RIF / Cédula"
                required
                error={form.formState.errors.rif?.message}
              >
                <Input
                  {...form.register("rif")}
                  placeholder="J-12345678-0"
                  className={MF_INPUT}
                />
              </FormField>

              <FormField label="Teléfono">
                <Input
                  {...form.register("phone")}
                  placeholder="0412..."
                  className={MF_INPUT}
                />
              </FormField>
            </div>

            <FormField label="Correo Electrónico" error={form.formState.errors.email?.message}>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="correo@empresa.com"
                className={MF_INPUT}
              />
            </FormField>

            <FormField label="Dirección de Entrega">
              <div className="relative">
                <Input
                  {...form.register("address")}
                  placeholder="Av. Principal, Edif. Lumis..."
                  className={`${MF_INPUT} pr-12`}
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
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Límite de Crédito ($)">
                <Input
                  {...form.register("credit_limit")}
                  type="number"
                  className={MF_INPUT}
                />
              </FormField>
              <FormField label="Días de Crédito">
                <Input
                  {...form.register("payment_terms")}
                  type="number"
                  className={MF_INPUT}
                />
              </FormField>
            </div>
          </div>

          <ModalFooter
            onCancel={() => setOpen(false)}
            submitLabel={client?.id ? "Guardar Cambios" : "Crear Cliente"}
            loadingLabel="Guardando..."
            loading={loading}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
