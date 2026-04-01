"use client";

import { useState } from "react";
import { upsertFeatureFlag } from "@/lib/actions/superadmin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const REQUIRED_FLAGS = [
  { key: "bcv_auto_update", description: "Actualización automática BCV" },
  { key: "maintenance_mode", description: "Activar modo mantenimiento en toda la plataforma" },
  { key: "new_user_registration", description: "Permitir nuevos registros de empresas" },
  { key: "whatsapp_notifications", description: "Activar notificaciones automáticas por WhatsApp" }
];

export function FeatureFlagsSection({ flags }: { flags: any[] }) {
  // Merge required flags with DB flags, keeping DB values if they exist
  const displayFlags = REQUIRED_FLAGS.map(req => {
    const dbFlag = flags.find(f => f.key === req.key);
    return {
      key: req.key,
      description: req.description,
      value: dbFlag ? dbFlag.value : "false", // default to false if not in DB
    };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-display text-sm font-bold text-gray-900">
          Feature Flags
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Activa o desactiva funcionalidades globalmente
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {displayFlags.map((flag) => (
          <FeatureFlagToggle key={flag.key} flag={flag} />
        ))}
      </div>
    </div>
  );
}

function FeatureFlagToggle({ flag }: { flag: any }) {
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(flag.value === "true");

  const handleToggle = async () => {
    setLoading(true);
    const newValue = isEnabled ? "false" : "true";
    try {
      await upsertFeatureFlag(flag.key, newValue, flag.description);
      setIsEnabled(!isEnabled);
      toast.success("Configuración actualizada");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
      <div>
        <p className="text-sm font-semibold text-gray-900">{flag.description}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">{flag.key}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                    ${isEnabled ? "bg-[#E040FB]" : "bg-gray-200"}`}
      >
        <span
          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm
                          ${isEnabled ? "translate-x-5" : "translate-x-0"}`}
        />
        {loading && (
          <Loader2 className="absolute top-1 left-1.5 w-4 h-4 text-gray-900 animate-spin" />
        )}
      </button>
    </div>
  );
}
