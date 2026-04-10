"use client";

import { useState, useEffect } from "react";
import { UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PendingTablesBadgeProps {
  companyId: string | null | undefined;
  onClick: () => void;
}

export function PendingTablesBadge({ companyId, onClick }: PendingTablesBadgeProps) {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!companyId) return;

    // Initial fetch
    (async () => {
      const { count: c } = await supabase
        .from("restaurant_tables")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "cuenta_pedida");
      setCount(c || 0);
    })();

    // Realtime subscription
    const channel = supabase
      .channel("pos_pending_tables")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
          filter: `company_id=eq.${companyId}`,
        },
        async () => {
          const { count: c } = await supabase
            .from("restaurant_tables")
            .select("*", { count: "exact", head: true })
            .eq("company_id", companyId)
            .eq("status", "cuenta_pedida");
          setCount(c || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, supabase]);

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-700 font-bold text-sm hover:bg-amber-100 active:scale-[0.97] transition-all animate-in fade-in zoom-in-95"
    >
      <UtensilsCrossed className="w-4 h-4" />
      Cobrar Mesa
      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
        {count}
      </span>
    </button>
  );
}
