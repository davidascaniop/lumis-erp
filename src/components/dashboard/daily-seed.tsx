"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, Share2, Heart } from "lucide-react";
import Link from "next/link";
import { recordSeedView, recordSeedBlessing } from "@/lib/actions/seeds";

export function DailySeed({ companyId }: { companyId: string }) {
  const [seed, setSeed] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blessed, setBlessed] = useState(false);
  const [blessCount, setBlessCount] = useState(0);

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
          setBlessCount(data.blessings_count || 0);
          // Check if already blessed from localStorage
          const saved = localStorage.getItem("lumis_blessed_seeds");
          if (saved) {
            try {
              const arr: string[] = JSON.parse(saved);
              if (arr.includes(data.id)) setBlessed(true);
            } catch { /* ignore */ }
          }
          await recordSeedView(data.id, companyId).catch(() => {});
        }
      });
  }, [companyId]);

  const handleBless = async () => {
    if (blessed || !seed) return;
    setBlessed(true);
    setBlessCount(c => c + 1);
    // Persist in localStorage
    const saved = localStorage.getItem("lumis_blessed_seeds");
    const arr: string[] = saved ? JSON.parse(saved) : [];
    if (!arr.includes(seed.id)) {
      arr.push(seed.id);
      localStorage.setItem("lumis_blessed_seeds", JSON.stringify(arr));
    }
    await recordSeedBlessing(seed.id).catch(() => {});
  };

  if (loading) return null;

  if (!seed) {
    return (
      <div className="relative bg-surface-card border border-border rounded-2xl p-6 overflow-hidden mb-4 flex items-center gap-4 shadow-card hover-card-effect">
        <div className="w-10 h-10 rounded-xl bg-surface-base/10 border border-border flex items-center justify-center text-lg flex-shrink-0 opacity-50">
          ✨
        </div>
        <div>
          <h4 className="text-xs font-bold text-text-1 mb-0.5">Semilla Diaria no disponible</h4>
          <p className="text-[10px] text-text-3">No hay contenido programado para hoy.</p>
        </div>
      </div>
    );
  }

  const isYoutube = seed.video_url?.includes("youtube") || seed.video_url?.includes("youtu.be");
  const ytMatch = seed.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  const ytId = ytMatch ? ytMatch[1] : null;

  return (
    <div className="relative glass border border-border shadow-card hover-card-effect rounded-2xl p-4 lg:p-5 overflow-hidden mb-4 animate-[fadeUp_0.5s_ease_both]">
      {/* Glow decorativo */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] bg-brand/10 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-[60px] bg-brand-dark/10 pointer-events-none" />

      {/* Header — título clickeable → /dashboard/semillas */}
      <div className="relative flex items-center justify-between mb-3.5">
        <Link href="/dashboard/semillas" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-sm flex-shrink-0 shadow-brand/10 group-hover:bg-brand/20 transition-colors">
            ✨
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand uppercase tracking-[0.12em] leading-none mb-1 group-hover:opacity-80 transition-opacity">
              Semilla del Día
            </p>
            <p className="text-[9px] text-text-3 leading-none">
              {new Date().toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </Link>
      </div>

      {/* Versículo — tipografía delicada, no bold */}
      <div className="relative pl-3 border-l-[1.5px] border-brand mb-2.5">
        <blockquote className="text-sm font-normal leading-relaxed m-0 text-text-1 italic">
          &ldquo;{seed.verse}&rdquo;
        </blockquote>
        <cite className="text-[11px] font-medium text-brand/80 not-italic block mt-1.5">
          — {seed.verse_reference}
        </cite>
      </div>

      {/* Contenido expandible */}
      {expanded && (
        <div className="pt-3.5 border-t border-border space-y-3.5">
          {seed.reflection && (
            <p className="text-[13px] text-text-2 leading-relaxed font-normal">
              {seed.reflection}
            </p>
          )}
          {seed.video_url && (
            <div className="rounded-xl overflow-hidden shadow-lg border border-border">
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
            <div className="bg-surface-base/40 p-3 rounded-xl border border-border">
              <p className="text-[9px] font-bold text-brand-dark uppercase tracking-widest mb-1.5 leading-none">
                Caso de Éxito
              </p>
              <p className="text-[13px] text-text-2 leading-relaxed font-normal">
                {seed.case_story}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer — acciones */}
      <div className="flex items-center justify-between mt-2.5 gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:opacity-80 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Ver menos</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Leer reflexión</>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Me bendijo — corazón que se rellena */}
          <button
            onClick={handleBless}
            disabled={blessed}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all
              ${blessed
                ? "text-rose-500 bg-rose-50 border border-rose-200 cursor-default"
                : "text-text-3 bg-surface-base/40 border border-border hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
              }`}
          >
            <Heart className={`w-3.5 h-3.5 transition-all ${blessed ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
            {blessed ? "¡Me bendijo!" : "Me bendijo"}
            {blessCount > 0 && <span className="text-[9px] opacity-60">{blessCount}</span>}
          </button>

          {/* Compartir */}
          <button
            onClick={() => {
              const text = encodeURIComponent(
                `✨ Semilla del Día\n\n"${seed.verse}"\n— ${seed.verse_reference}\n\n${seed.reflection ? seed.reflection.substring(0, 150) + "..." : ""}\n\n_Vía LUMIS_`,
              );
              window.open(`https://wa.me/?text=${text}`, "_blank");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#25D366] bg-[rgba(37,211,102,0.05)] border border-[rgba(37,211,102,0.1)] hover:bg-[rgba(37,211,102,0.1)] transition-all"
          >
            <Share2 className="w-3 h-3" />
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
