"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface NewTableModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  zones: { id: string; name: string; color: string }[];
}

export function NewTableModal({ open, onClose, companyId, zones }: NewTableModalProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [zone, setZone] = useState(zones[0]?.name || "Salón");
  const [capacity, setCapacity] = useState(4);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nombre de mesa requerido");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("restaurant_tables").insert({
        company_id: companyId,
        name: name.trim(),
        zone,
        capacity,
        status: "libre",
      });
      if (error) throw error;
      toast.success(`Mesa "${name}" creada`);
      setName("");
      setCapacity(4);
      onClose();
    } catch (err: any) {
      toast.error("Error al crear mesa", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-card rounded-3xl p-6 shadow-elevated border border-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-1 font-montserrat">Nueva Mesa</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5 text-text-3" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-1 uppercase tracking-wider">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mesa 1, Barra 3, VIP A..."
              className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border/40 text-text-1 font-medium focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-1 uppercase tracking-wider">Zona</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border/40 text-text-1 font-medium focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
              {zones.length === 0 && (
                <>
                  <option value="Salón">Salón</option>
                  <option value="Terraza">Terraza</option>
                  <option value="Barra">Barra</option>
                  <option value="VIP">VIP</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-1 uppercase tracking-wider">Capacidad</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={50}
              className="w-full px-4 py-3 rounded-xl bg-surface-input border border-border/40 text-text-1 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 mt-2 rounded-xl bg-brand-gradient text-white font-bold shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Crear Mesa
          </button>
        </div>
      </div>
    </div>
  );
}
