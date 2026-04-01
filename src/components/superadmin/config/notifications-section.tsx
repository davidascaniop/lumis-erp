"use client";

import { useState } from "react";
import { upsertFeatureFlag } from "@/lib/actions/superadmin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function NotificationsSection({ configJSON }: { configJSON?: string }) {
  const [loading, setLoading] = useState(false);

  // Default config if not in DB
  const [config, setConfig] = useState(() => {
    if (configJSON) {
      try {
        return JSON.parse(configJSON);
      } catch (e) {}
    }
    return {
      email: "",
      whatsapp: "",
      toggles: {
        new_registration: true,
        new_payment: true,
        account_suspended: true,
        trial_ending: true
      }
    };
  });

  const saveConfig = async (newConfig: any) => {
    setLoading(true);
    try {
      await upsertFeatureFlag("system_notifications", JSON.stringify(newConfig), "Notificaciones del Sistema");
      setConfig(newConfig);
      toast.success("Notificaciones del sistema actualizadas");
    } catch {
      toast.error("Error al guardar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newConfig = {
      ...config,
      email: formData.get("email"),
      whatsapp: formData.get("whatsapp"),
    };
    saveConfig(newConfig);
  };

  const setToggle = (key: keyof typeof config.toggles) => {
    setConfig((prev: any) => ({
      ...prev,
      toggles: {
        ...prev.toggles,
        [key]: !prev.toggles[key]
      }
    }));
  };

  const TOGGLES = [
    { key: "new_registration", label: "Nuevo registro de empresa" },
    { key: "new_payment", label: "Nuevo pago recibido" },
    { key: "account_suspended", label: "Cuenta suspendida" },
    { key: "trial_ending", label: "Trial por vencer (3 días antes)" }
  ];

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 mt-6">
      <div className="mb-5 border-b border-gray-100 pb-4">
        <h2 className="font-display text-sm font-bold text-gray-900">Notificaciones del Sistema</h2>
        <p className="text-xs text-gray-500 mt-0.5">Controla las alertas operativas del equipo de LUMIS</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Email de Alertas Generales</label>
            <input 
              name="email" 
              defaultValue={config.email} 
              placeholder="alertas@lumis.com" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB] focus:ring-1 focus:ring-[#E040FB]/20 transition-all font-mono" 
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">WhatsApp Pagos (+58...)</label>
            <input 
              name="whatsapp" 
              defaultValue={config.whatsapp} 
              placeholder="+584141234567" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E040FB] focus:ring-1 focus:ring-[#E040FB]/20 transition-all font-mono" 
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3 ml-1">Tipos de Notificaciones Activas</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOGGLES.map(t => {
              const active = config.toggles[t.key as keyof typeof config.toggles];
              return (
                <div 
                  key={t.key} 
                  onClick={() => setToggle(t.key as keyof typeof config.toggles)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors select-none ${
                    active ? "border-[#E040FB] bg-purple-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${active ? "bg-[#E040FB]" : "bg-gray-200"}`}>
                    <span className={`absolute top-0.5 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${active ? "translate-x-3.5" : "translate-x-0"}`} />
                  </div>
                  <span className={`text-sm font-semibold ${active ? "text-[#E040FB]" : "text-gray-900"}`}>{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:opacity-90 disabled:opacity-50 transition-all shadow-sm flex items-center">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Guardando..." : "Guardar Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}
