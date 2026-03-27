"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Info, AlertTriangle, CheckCircle, Wrench } from "lucide-react";

// You must create markBroadcastRead inside lib/actions/broadcasts.ts
import { markBroadcastRead } from "@/lib/actions/broadcasts";

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  maintenance: Wrench,
};
const STYLES = {
  info: "bg-surface-base border-border text-brand",
  warning: "bg-status-warning/10 border-status-warning/20 text-status-warning",
  success: "bg-status-ok/10 border-status-ok/20 text-status-ok",
  maintenance: "bg-surface-card border-border text-text-3",
};

export function BroadcastBanner({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  const supabase = createClient();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const load = async () => {
      // Traer broadcasts activos no leídos por este usuario
      const { data: readIds } = await supabase
        .from("broadcast_reads")
        .select("broadcast_id")
        .eq("user_id", userId);

      const readSet = new Set((readIds ?? []).map((r: any) => r.broadcast_id));

      const { data } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Also filter by expires_at here directly in JS since PostgREST OR logic can be tricky sometimes
      const unread = (data ?? []).filter((b: any) => {
        if (readSet.has(b.id)) return false;
        if (b.expires_at && new Date(b.expires_at) <= new Date()) return false;
        return true;
      });
      setBroadcasts(unread);
    };
    load();
  }, [userId, companyId]);

  if (broadcasts.length === 0) return null;

  const b = broadcasts[current];
  const Icon = ICONS[b.type as keyof typeof ICONS] ?? Info;

  const handleDismiss = async () => {
    await markBroadcastRead(b.id, companyId, userId);
    if (current < broadcasts.length - 1) setCurrent((c) => c + 1);
    else setBroadcasts([]);
  };

  return (
    <div
      className={`flex items-start gap-3 px-5 py-3.5 mb-4 rounded-2xl border shadow-card hover-card-effect ${
        STYLES[b.type as keyof typeof STYLES] ?? STYLES.info
      }`}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-1">{b.title}</p>
        <p className="text-xs text-text-2 mt-0.5">{b.message}</p>
      </div>
      {broadcasts.length > 1 && (
        <span className="text-[10px] text-[#9585B8] flex-shrink-0 self-center">
          {current + 1}/{broadcasts.length}
        </span>
      )}
      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-white/8 text-[#9585B8] hover:text-white
                         transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
