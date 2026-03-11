import { createClient } from "@/lib/supabase/server";
import { BroadcastForm } from "@/components/superadmin/broadcast-form";
import { Megaphone } from "lucide-react";

export default async function BroadcastPage() {
  const supabase = await createClient();

  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Broadcast
          </h1>
          <p className="text-sm text-[#9585B8] mt-0.5">
            Envía anuncios a todas tus empresas clientes
          </p>
        </div>
      </div>

      {/* Formulario nuevo broadcast */}
      <BroadcastForm />

      {/* Historial de broadcasts */}
      <div className="bg-[#18102A] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-display text-sm font-bold text-white">
            Historial de Anuncios
          </h2>
        </div>

        {(broadcasts ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="w-10 h-10 text-[#3D2D5C] mb-4" />
            <p className="text-sm text-[#9585B8]">
              Ningún anuncio enviado todavía
            </p>
          </div>
        ) : (
          (broadcasts ?? []).map((b: any) => {
            const TYPE_CONFIG: Record<
              string,
              { color: string; bg: string; emoji: string }
            > = {
              info: {
                color: "#4FC3F7",
                bg: "rgba(79,195,247,0.08)",
                emoji: "ℹ️",
              },
              warning: {
                color: "#FFB800",
                bg: "rgba(255,184,0,0.08)",
                emoji: "⚠️",
              },
              success: {
                color: "#00E5CC",
                bg: "rgba(0,229,204,0.08)",
                emoji: "✅",
              },
              maintenance: {
                color: "#9585B8",
                bg: "rgba(149,133,184,0.08)",
                emoji: "🔧",
              },
            };
            const cfg = TYPE_CONFIG[b.type] ?? TYPE_CONFIG.info;
            return (
              <div
                key={b.id}
                className="flex items-start gap-4 px-6 py-4 border-b border-white/[0.03]
                                         hover:bg-[#1F1535] transition-colors"
              >
                <span className="text-base flex-shrink-0 mt-0.5">
                  {cfg.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {b.title}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize`}
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {b.target === "all" ? "Todos" : b.target}
                    </span>
                    {!b.is_active && (
                      <span className="text-[10px] text-[#3D2D5C]">
                        · Desactivado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9585B8] line-clamp-2">
                    {b.message}
                  </p>
                </div>
                <span className="text-[11px] text-[#3D2D5C] flex-shrink-0">
                  {new Date(b.created_at).toLocaleDateString("es-VE", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
