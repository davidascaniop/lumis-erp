import { createSuperadminServerClient } from "@/lib/supabase/superadmin-server";
import { BcvOverrideForm } from "@/components/superadmin/bcv-override-form";
import { FeatureFlagsSection } from "@/components/superadmin/config/feature-flags-section";
import { PaymentMethodsSection } from "@/components/superadmin/config/payment-methods-section";
import { PlansSection } from "@/components/superadmin/config/plans-section";
import { NotificationsSection } from "@/components/superadmin/config/notifications-section";

export default async function ConfigPage() {
  const supabase = await createSuperadminServerClient();

  // Fetch all feature flags (which includes JSON configs)
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("*")
    .order("key");

  return (
    <div className="space-y-6 page-enter max-w-4xl pb-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Configuración Global
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Controla funcionalidades y ajustes para todas las empresas del SaaS
        </p>
      </div>

      {/* Tasa BCV manual */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <h2 className="font-display text-sm font-bold text-gray-900 mb-1">
          Tasa BCV — Override de Emergencia
        </h2>
        <p className="text-xs text-gray-500 mb-4">
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
      <FeatureFlagsSection flags={flags ?? []} />

      {/* Métodos de Pago */}
      <PaymentMethodsSection configJSON={flags?.find((f: any) => f.key === "payment_methods")?.value} />

      {/* Planes y Precios */}
      <PlansSection configJSON={flags?.find((f: any) => f.key === "plans_config")?.value} />

      {/* Notificaciones del Sistema */}
      <NotificationsSection configJSON={flags?.find((f: any) => f.key === "system_notifications")?.value} />
    </div>
  );
}
