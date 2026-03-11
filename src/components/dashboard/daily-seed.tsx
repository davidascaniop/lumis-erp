"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, Share2 } from "lucide-react";

import { recordSeedView } from "@/lib/actions/seeds";

export function DailySeed({ companyId }: { companyId: string }) {
  const [seed, setSeed] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    supabase
      .from("daily_seeds")
      .select("*")
      .eq("scheduled_date", today)
      .eq("status", "published")
      .single()
      .then(async ({ data }) => {
        setSeed(data);
        setLoading(false);
        if (data) {
          // Record view in the backend properly
          await recordSeedView(data.id, companyId).catch(() => {});
        }
      });
  }, [companyId]);

  if (loading) return null;

  if (!seed) {
    return (
      <div className="relative bg-[#120D1A] border border-white/[0.04] rounded-2xl p-6 overflow-hidden mb-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-lg flex-shrink-0 opacity-50">
          ✨
        </div>
        <div>
          <h4 className="text-xs font-bold text-white mb-0.5">
            Semilla Diaria no disponible
          </h4>
          <p className="text-[10px] text-[#9585B8]">
            No hay contenido programado para hoy.
          </p>
        </div>
      </div>
    );
  }

  const isYoutube =
    seed.video_url?.includes("youtube") || seed.video_url?.includes("youtu.be");
  const ytMatch = seed.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  const ytId = ytMatch ? ytMatch[1] : null;

  return (
    <div
      className="relative bg-white/[0.015] backdrop-blur-3xl border border-white/[0.06]
                        shadow-[0_4px_24px_rgba(224,64,251,0.08)] rounded-2xl p-4 lg:p-5 overflow-hidden mb-4
                        animate-[fadeUp_0.5s_ease_both]"
    >
      {/* Glow decorativo — más sutil y distribuido */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px]
                            bg-[rgba(224,64,251,0.08)] pointer-events-none"
      />
      <div
        className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-[60px]
                            bg-[rgba(124,77,255,0.1)] pointer-events-none"
      />

      {/* Header — más compacto */}
      <div className="relative flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg bg-[rgba(224,64,251,0.12)] border border-[rgba(224,64,251,0.2)]
                                    flex items-center justify-center text-sm flex-shrink-0 shadow-[0_0_15px_rgba(224,64,251,0.1)]"
          >
            ✨
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#E040FB] uppercase tracking-[0.12em] leading-none mb-1">
              Semilla del Día
            </p>
            <p className="text-[9px] text-[#9585B8] leading-none">
              {new Date().toLocaleDateString("es-VE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Versículo — estilizado y con menos margen */}
      <div className="relative pl-3 border-l-[1.5px] border-[rgba(224,64,251,0.4)] mb-2.5">
        <blockquote className="text-[14px] font-medium text-[#F4EDFF] italic leading-tight m-0">
          &ldquo;{seed.verse}&rdquo;
        </blockquote>
        <cite className="text-[12px] font-bold text-[#E040FB]/80 not-italic block mt-1.5">
          — {seed.verse_reference}
        </cite>
      </div>

      {/* Contenido expandible */}
      {expanded && (
        <div className="pt-3.5 border-t border-white/[0.04] space-y-3.5">
          {seed.reflection && (
            <p className="text-[13px] text-[#9585B8] leading-relaxed">
              {seed.reflection}
            </p>
          )}

          {seed.video_url && (
            <div className="rounded-xl overflow-hidden shadow-lg border border-white/[0.04]">
              {isYoutube && ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  className="w-full rounded-xl"
                  style={{ height: 180, border: "none" }}
                  allowFullScreen
                />
              ) : (
                <video controls className="w-full rounded-xl max-h-48">
                  <source src={seed.video_url} />
                </video>
              )}
            </div>
          )}

          {seed.case_story && (
            <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
              <p className="text-[9px] font-bold text-[#7C4DFF] uppercase tracking-widest mb-1.5 leading-none">
                Caso de Éxito
              </p>
              <p className="text-[13px] text-[#9585B8] leading-relaxed">
                {seed.case_story}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer — Acciones más estilizadas */}
      <div className="flex items-center justify-between mt-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-bold text-[#E040FB]
                               hover:text-[#F060FF] transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Leer reflexión
            </>
          )}
        </button>
        <button
          onClick={() => {
            const text = encodeURIComponent(
              `✨ Semilla del Día\n\n"${seed.verse}"\n— ${seed.verse_reference}\n\n${seed.reflection ? seed.reflection.substring(0, 150) + "..." : ""}\n\n_Vía LUMIS_`,
            );
            window.open(`https://wa.me/?text=${text}`, "_blank");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold
                               text-[#25D366] bg-[rgba(37,211,102,0.05)] border border-[rgba(37,211,102,0.1)]
                               hover:bg-[rgba(37,211,102,0.1)] transition-all"
        >
          <Share2 className="w-3 h-3" />
          Compartir
        </button>
      </div>
    </div>
  );
}
