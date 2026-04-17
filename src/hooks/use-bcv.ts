"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook que obtiene la tasa BCV para convertir USD → Bs.
 *
 * Orden de prioridad:
 *  1. Override manual del superadmin (feature_flags.bcv_manual_rate)
 *     → lo usamos SIEMPRE si está seteado, porque es la tasa que el
 *       dueño decidió aplicar (útil cuando el API oficial falla o
 *       cuando se quiere forzar una tasa específica)
 *  2. Fallback al último valor de exchange_rates (sincronizado desde
 *     ve.dolarapi.com cada cierto tiempo)
 *  3. null si no hay ninguno de los dos
 *
 * Escucha el evento "bcv-update" para refrescar sin recargar la página
 * cuando el admin cambia la tasa manual desde el panel.
 */
export function useBCV() {
  const supabase = createClient();
  const [rate, setRate] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    const fetchBcv = async () => {
      // 1. Manual override desde el superadmin
      try {
        const { data: flagData } = await supabase
          .from("feature_flags")
          .select("value, updated_at")
          .eq("key", "bcv_manual_rate")
          .maybeSingle();

        const rawManual = (flagData as any)?.value;
        const parsedManual =
          rawManual != null && rawManual !== ""
            ? parseFloat(String(rawManual))
            : NaN;

        if (!isNaN(parsedManual) && parsedManual > 0) {
          setRate(parsedManual);
          const when = (flagData as any)?.updated_at;
          setUpdatedAt(
            when
              ? new Date(when).toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "manual",
          );
          return;
        }
      } catch {
        // Si la tabla feature_flags no es accesible (RLS/anon),
        // simplemente caemos al fallback de exchange_rates.
      }

      // 2. Fallback a exchange_rates
      const { data: rawData } = await supabase
        .from("exchange_rates")
        .select("rate_bs, fetched_at")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single();
      const data = rawData as any;
      if (data) {
        setRate(data.rate_bs);
        setUpdatedAt(
          new Date(data.fetched_at).toLocaleTimeString("es-VE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    };

    fetchBcv();

    // Polling cada 30 min es suficiente para una tasa que cambia 1x al día
    const interval = setInterval(fetchBcv, 1000 * 60 * 30);

    // Listener para actualizaciones manuales desde settings
    const handleCustomUpdate = () => fetchBcv();
    window.addEventListener("bcv-update", handleCustomUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("bcv-update", handleCustomUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rate, updatedAt };
}
