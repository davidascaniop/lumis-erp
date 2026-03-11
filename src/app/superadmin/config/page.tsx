import { createClient } from "@/lib/supabase/server";
import { FeatureFlagToggle } from "@/components/superadmin/feature-flag-toggle";
import { BcvOverrideForm } from "@/components/superadmin/bcv-override-form";

export default async function ConfigPage() {
  const supabase = await createClient();

  const { data: flags } = await supabase
    .from("feature_flags")
    .select("*")
    .order("key");

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Configuración Global
        </h1>
        <p className="text-sm text-[#9585B8] mt-0.5">
          Controla funcionalidades para todas las empresas del SaaS
        </p>
      </div>

      {/* Tasa BCV manual */}
      <div className="bg-[#18102A] border border-white/6 rounded-2xl p-6">
        <h2 className="font-display text-sm font-bold text-white mb-1">
          Tasa BCV — Override de Emergencia
        </h2>
        <p className="text-xs text-[#9585B8] mb-5">
          Si la API de ve.dolarapi.com falla, puedes ingresar la tasa
          manualmente aquí. Dejar vacío = usar la API automática.
        </p>
        <BcvOverrideForm
          currentValue={
            flags?.find((f: any) => f.key === "bcv_manual_rate")?.value ?? ""
          }
        />
      </div>

      {/* Feature flags */}
      <div className="bg-[#18102A] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-display text-sm font-bold text-white">
            Feature Flags
          </h2>
          <p className="text-xs text-[#9585B8] mt-0.5">
            Activa o desactiva funcionalidades globalmente
          </p>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {(flags ?? [])
            .filter((f: any) => f.key !== "bcv_manual_rate")
            .map((flag: any) => (
              <FeatureFlagToggle key={flag.key} flag={flag} />
            ))}
        </div>
      </div>
    </div>
  );
}
