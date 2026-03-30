"use client";

import { useState, useEffect } from "react";
import { Settings2, Wifi, WifiOff, Loader2, Save, ExternalLink, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface WaSettings {
  id?: string;
  api_url: string;
  instance_name: string;
  api_token: string;
  is_connected: boolean;
  phone_number: string | null;
}

interface WhatsAppSetupProps {
  companyId: string;
  onSettingsLoaded: (settings: WaSettings | null) => void;
}

export function WhatsAppSetup({ companyId, onSettingsLoaded }: WhatsAppSetupProps) {
  const supabase = createClient();
  const [settings, setSettings] = useState<WaSettings>({
    api_url: "",
    instance_name: "",
    api_token: "",
    is_connected: false,
    phone_number: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("crm_whatsapp_settings")
        .select("*")
        .eq("company_id", companyId)
        .single();
      if (data) {
        setSettings(data as WaSettings);
        onSettingsLoaded(data as WaSettings);
      } else {
        onSettingsLoaded(null);
      }
      setLoading(false);
    }
    load();
  }, [companyId]);

  const handleSave = async () => {
    if (!settings.api_url || !settings.instance_name) {
      toast.error("Ingresa la URL de la API y el nombre de instancia");
      return;
    }
    setSaving(true);
    const payload = { ...settings, company_id: companyId };

    const { error } = settings.id
      ? await supabase.from("crm_whatsapp_settings").update(payload).eq("id", settings.id)
      : await supabase.from("crm_whatsapp_settings").insert(payload);

    if (error) {
      toast.error("Error al guardar configuración");
    } else {
      toast.success("Configuración guardada");
      onSettingsLoaded(settings);
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!settings.api_url || !settings.instance_name) return;
    setTesting(true);
    try {
      const res = await fetch(
        `${settings.api_url}/instance/connectionState/${settings.instance_name}`,
        { headers: { apikey: settings.api_token } }
      );
      const json = await res.json();
      const connected = json?.instance?.state === "open";
      setSettings((s) => ({ ...s, is_connected: connected }));
      await supabase
        .from("crm_whatsapp_settings")
        .update({ is_connected: connected })
        .eq("company_id", companyId);
      toast[connected ? "success" : "error"](
        connected ? "✅ Conectado a WhatsApp" : "❌ No conectado. Verifica tu instancia"
      );
    } catch {
      toast.error("No se pudo conectar con la API");
    }
    setTesting(false);
  };

  if (loading) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-base border border-border text-sm font-semibold hover:bg-gray-50 transition-all"
      >
        {settings.is_connected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-gray-400" />
        )}
        {settings.is_connected ? (
          <span className="text-green-600 text-xs">WhatsApp Activo</span>
        ) : (
          <span className="text-gray-500 text-xs">Configurar WhatsApp</span>
        )}
        <Settings2 className="w-3.5 h-3.5 text-gray-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-5">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-brand" />
            Configuración WhatsApp
          </h4>

          {settings.is_connected && (
            <div className="flex items-center gap-2 mb-4 p-2.5 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-green-700">Instancia conectada</p>
                {settings.phone_number && (
                  <p className="text-[10px] text-green-600">{settings.phone_number}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                URL de la API (Evolution API)
              </label>
              <input
                type="url"
                placeholder="https://api.tuservidor.com"
                value={settings.api_url}
                onChange={(e) => setSettings((s) => ({ ...s, api_url: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                Nombre de Instancia
              </label>
              <input
                type="text"
                placeholder="mi-empresa"
                value={settings.instance_name}
                onChange={(e) => setSettings((s) => ({ ...s, instance_name: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                API Token
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={settings.api_token}
                onChange={(e) => setSettings((s) => ({ ...s, api_token: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex-1 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
              Probar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 text-xs font-bold bg-brand text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Guardar
            </button>
          </div>

          <a
            href="https://doc.evolution-api.com"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-1 text-[10px] text-brand hover:underline"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            Documentación Evolution API
          </a>
        </div>
      )}
    </div>
  );
}
