"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useBCV() {
  const supabase = createClient();
  const [rate, setRate] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    const fetchBcv = async () => {
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

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel("db-exchange-rates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "exchange_rates",
        },
        () => {
          fetchBcv();
        },
      )
      .subscribe();

    const interval = setInterval(fetchBcv, 1000 * 60 * 30); // cada 30 min

    // Listener para actualizaciones manuales desde la misma pestaña
    const handleCustomUpdate = () => fetchBcv();
    window.addEventListener("storage", handleCustomUpdate);
    window.addEventListener("bcv-update", handleCustomUpdate);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleCustomUpdate);
      window.removeEventListener("bcv-update", handleCustomUpdate);
    };
  }, []);

  return { rate, updatedAt };
}
