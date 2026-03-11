"use client";
import { useState } from "react";
import { updateFeatureFlag } from "@/lib/actions/superadmin";
import { toast } from "sonner";

export function BcvOverrideForm({ currentValue }: { currentValue: string }) {
  const [rate, setRate] = useState(currentValue);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateFeatureFlag("bcv_manual_rate", rate);
      toast.success("Tasa BCV manual actualizada");
    } catch {
      toast.error("Error al actualizar tasa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        placeholder="Ej: 36.50"
        className="bg-[#0F0818] border border-white/8 rounded-xl px-4 py-2 text-sm text-white w-32 focus:outline-none focus:border-[#E040FB]"
      />
      <button
        onClick={handleSave}
        disabled={loading || rate === currentValue}
        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
