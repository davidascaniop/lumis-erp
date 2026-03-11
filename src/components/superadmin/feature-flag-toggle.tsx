"use client";
import { useState } from "react";
import { updateFeatureFlag } from "@/lib/actions/superadmin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function FeatureFlagToggle({ flag }: { flag: any }) {
  const [loading, setLoading] = useState(false);
  const isEnabled = flag.value === "true";

  const handleToggle = async () => {
    setLoading(true);
    try {
      await updateFeatureFlag(flag.key, isEnabled ? "false" : "true");
      toast.success("Configuración actualizada");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-[#1F1535] transition-colors">
      <div>
        <p className="text-sm font-semibold text-white">{flag.key}</p>
        <p className="text-xs text-[#9585B8] mt-0.5">{flag.description}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                    ${isEnabled ? "bg-[#E040FB]" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform
                          ${isEnabled ? "translate-x-5" : "translate-x-0"}`}
        />
        {loading && (
          <Loader2 className="absolute top-1 left-1.5 w-4 h-4 text-[#08050F] animate-spin" />
        )}
      </button>
    </div>
  );
}
