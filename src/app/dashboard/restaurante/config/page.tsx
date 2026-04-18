"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, UtensilsCrossed, Palette } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useDataCache } from "@/lib/data-cache";

const DEFAULT_COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];

export default function RestaurantConfigPage() {
  const { user, loading: userLoading } = useUser();
  const companyId = user?.company_id;
  const supabase = createClient();

  const [zones, setZones] = useState<any[]>([]);
  const [config, setConfig] = useState({
    alert_minutes_yellow: 10,
    alert_minutes_red: 15,
    require_guests: true,
    allow_multiple_sends: true,
    notify_waiter_on_ready: true,
  });
  const [saving, setSaving] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneColor, setNewZoneColor] = useState("#10B981");

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const cacheKey = `restaurante_config_${companyId}`;
      const cached = useDataCache.getState().get(cacheKey);
      if (cached) {
        setZones(cached.zones);
        setConfig(cached.config);
        return;
      }

      // Load zones
      const { data: zonesData } = await supabase
        .from("restaurant_zones")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (zonesData) setZones(zonesData);

      // Load config
      const { data: configData } = await supabase
        .from("restaurant_config")
        .select("*")
        .eq("company_id", companyId)
        .single();

      const configObj = configData ? {
        alert_minutes_yellow: configData.alert_minutes_yellow ?? 10,
        alert_minutes_red: configData.alert_minutes_red ?? 15,
        require_guests: configData.require_guests ?? true,
        allow_multiple_sends: configData.allow_multiple_sends ?? true,
        notify_waiter_on_ready: configData.notify_waiter_on_ready ?? true,
      } : {
        alert_minutes_yellow: 10,
        alert_minutes_red: 15,
        require_guests: true,
        allow_multiple_sends: true,
        notify_waiter_on_ready: true,
      };
      if (configData) setConfig(configObj);
      useDataCache.getState().set(cacheKey, { zones: zonesData || [], config: configObj });
    })();
  }, [companyId, supabase]);

  const handleSaveConfig = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurant_config")
        .upsert({
          company_id: companyId,
          ...config,
        }, { onConflict: "company_id" });
      if (error) throw error;
      if (companyId) useDataCache.getState().invalidatePrefix("restaurante_");
      toast.success("Configuración guardada");
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = async () => {
    if (!newZoneName.trim() || !companyId) return;
    try {
      const { data, error } = await supabase
        .from("restaurant_zones")
        .insert({ company_id: companyId, name: newZoneName.trim(), color: newZoneColor })
        .select()
        .single();
      if (error) throw error;
      setZones((prev) => [...prev, data]);
      setNewZoneName("");
      if (companyId) useDataCache.getState().invalidatePrefix("restaurante_");
      toast.success(`Zona "${newZoneName}" creada`);
    } catch (err: any) {
      toast.error("Error al crear zona", { description: err.message });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const { error } = await supabase.from("restaurant_zones").delete().eq("id", zoneId);
      if (error) throw error;
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
      if (companyId) useDataCache.getState().invalidatePrefix("restaurante_");
      toast.success("Zona eliminada");
    } catch (err: any) {
      toast.error("Error al eliminar zona");
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20">
          <UtensilsCrossed className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-1 font-montserrat">Configuración Restaurante</h1>
          <p className="text-sm text-text-2">Personaliza zonas, tiempos y comportamiento del módulo</p>
        </div>
      </div>

      {/* ZONAS */}
      <div className="bg-surface-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-bold text-text-1 mb-4 font-montserrat">Zonas del Salón</h2>
        <p className="text-sm text-text-2 mb-6">Define las zonas de tu restaurante con un color identificador.</p>

        {/* Existing zones */}
        <div className="space-y-2 mb-4">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-base border border-border">
              <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: zone.color }} />
              <span className="text-sm font-semibold text-text-1 flex-1">{zone.name}</span>
              <button
                onClick={() => handleDeleteZone(zone.id)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {zones.length === 0 && (
            <p className="text-sm text-text-3 italic py-3">No hay zonas definidas. Agrega una para comenzar.</p>
          )}
        </div>

        {/* Add new zone */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewZoneColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  newZoneColor === c ? "border-text-1 scale-125 shadow-lg" : "border-transparent hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            placeholder="Nombre de zona..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-input border border-border/40 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/40"
            onKeyDown={(e) => e.key === "Enter" && handleAddZone()}
          />
          <button
            onClick={handleAddZone}
            disabled={!newZoneName.trim()}
            className="p-2.5 rounded-xl bg-brand text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TIEMPOS DE ALERTA COCINA */}
      <div className="bg-surface-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-bold text-text-1 mb-4 font-montserrat">Tiempos de Alerta en Cocina</h2>
        <p className="text-sm text-text-2 mb-6">Define los umbrales de tiempo para que el KDS muestre alertas visuales.</p>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              Alerta Amarilla (minutos)
            </label>
            <input
              type="number"
              value={config.alert_minutes_yellow}
              onChange={(e) => setConfig({ ...config, alert_minutes_yellow: parseInt(e.target.value) || 10 })}
              min={1}
              max={60}
              className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border/40 text-text-1 font-bold font-mono text-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              Alerta Roja (minutos)
            </label>
            <input
              type="number"
              value={config.alert_minutes_red}
              onChange={(e) => setConfig({ ...config, alert_minutes_red: parseInt(e.target.value) || 15 })}
              min={1}
              max={60}
              className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border/40 text-text-1 font-bold font-mono text-lg focus:outline-none focus:ring-2 focus:ring-red-400/40"
            />
          </div>
        </div>
      </div>

      {/* TOGGLES */}
      <div className="bg-surface-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-bold text-text-1 mb-4 font-montserrat">Comportamiento</h2>

        <div className="space-y-4">
          {[
            {
              key: "require_guests" as const,
              label: "Requerir número de comensales al abrir mesa",
              description: "El mesero deberá indicar cuántas personas se sientan",
            },
            {
              key: "allow_multiple_sends" as const,
              label: "Permitir múltiples envíos a cocina",
              description: "Los meseros pueden agregar items después del primer envío",
            },
            {
              key: "notify_waiter_on_ready" as const,
              label: "Notificar al mesero cuando cocina marca plato como listo",
              description: "Se mostrará una notificación en la vista del mesero",
            },
          ].map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-base border border-border">
              <div className="flex-1">
                <p className="text-sm font-bold text-text-1">{toggle.label}</p>
                <p className="text-xs text-text-3 mt-0.5">{toggle.description}</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, [toggle.key]: !config[toggle.key] })}
                className={`w-12 h-7 rounded-full transition-all duration-200 relative ${
                  config[toggle.key] ? "bg-brand" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                    config[toggle.key] ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SAVE */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-gradient text-white font-bold shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
