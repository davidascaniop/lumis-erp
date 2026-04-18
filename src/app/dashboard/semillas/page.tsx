"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, PlayCircle, BookOpen, Briefcase, Calendar,
  Sparkles, Heart, Send
} from "lucide-react";
import { toast } from "sonner";
import { recordSeedBlessing, recordSeedShare } from "@/lib/actions/seeds";
import { useDataCache } from "@/lib/data-cache";

export default function SemillasAppPage() {
  const supabase = createClient();
  const [seeds, setSeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blessedSeeds, setBlessedSeeds] = useState<Set<string>>(new Set());

  const fetchSeeds = async () => {
    const cacheKey = `semillas_global`;
    const cached = useDataCache.getState().get(cacheKey);
    if (cached) {
      setSeeds(cached.seeds);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("daily_seeds")
      .select("*")
      .eq("status", "published")
      .order("scheduled_date", { ascending: false });

    setSeeds(data || []);
    useDataCache.getState().set(cacheKey, { seeds: data || [] });
    setLoading(false);
  };

  useEffect(() => {
    fetchSeeds();
    const saved = localStorage.getItem("lumis_blessed_seeds");
    if (saved) {
      try { setBlessedSeeds(new Set(JSON.parse(saved))); } catch { /* ignore */ }
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  if (seeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brand/5 border border-brand/20 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-brand opacity-80" />
        </div>
        <h2 className="text-2xl font-montserrat font-bold text-text-1 mb-2">
          Aún no hay Semillas publicadas
        </h2>
        <p className="text-text-3">El contenido espiritual diario de LUMIS aparecerá aquí muy pronto.</p>
      </div>
    );
  }

  const latestSeed   = seeds[0];
  const previousSeeds = seeds.slice(1);

  const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    return match ? match[1] : null;
  };
  const latestYtId = getYoutubeId(latestSeed.video_url);

  const handleShare = async (seed: any) => {
    const text = `✨ Semilla del Día en LUMIS\n\n"${seed.verse}"\n— ${seed.verse_reference}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("¡Versículo copiado al portapapeles!");
      await recordSeedShare(seed.id);
    } catch { toast.error("No se pudo copiar el texto"); }
  };

  const handleBless = async (seedId: string) => {
    if (blessedSeeds.has(seedId)) return;
    const newBlessed = new Set(blessedSeeds).add(seedId);
    setBlessedSeeds(newBlessed);
    localStorage.setItem("lumis_blessed_seeds", JSON.stringify(Array.from(newBlessed)));
    toast.success("¡Amén! Nos alegra que esta palabra te haya bendecido 🙏");
    try { await recordSeedBlessing(seedId); } catch { /* ignore */ }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("es-VE", {
      weekday: "long", day: "numeric", month: "long",
    });

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-16">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] flex items-center justify-center shadow-[0_0_24px_rgba(224,64,251,0.35)]">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Semilla Diaria</h1>
          <p className="text-text-2 text-sm mt-0.5">Devocionales y principios bíblicos para tus negocios</p>
        </div>
      </div>

      {/* ── HERO: SEMILLA DE HOY ── */}
      <div className="relative bg-white border border-border rounded-3xl overflow-hidden shadow-card">
        {/* Glow decorativo sutil */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] bg-brand/8 pointer-events-none" />

        <div className="relative p-8 lg:p-12 space-y-8">

          {/* Badge HOY */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold w-max">
            <Sparkles className="w-3 h-3" />
            ✨ HOY · {latestSeed.scheduled_date ? formatDate(latestSeed.scheduled_date) : ""}
          </div>

          {/* Versículo principal */}
          <div className="relative">
            {/* Comilla decorativa watermark */}
            <span className="absolute -top-4 -left-2 text-[120px] leading-none text-brand/8 font-serif select-none pointer-events-none">"</span>
            <blockquote
              className="relative text-xl lg:text-2xl font-montserrat font-normal leading-relaxed pl-2"
              style={{ color: "#111111" }}
            >
              {latestSeed.verse}
            </blockquote>
            <cite
              className="block mt-4 text-base font-montserrat font-bold not-italic text-brand"
            >
              — {latestSeed.verse_reference}
            </cite>
          </div>

          {/* Divider */}
          {(latestSeed.reflection || latestSeed.video_url || latestSeed.case_story) && (
            <div className="border-t border-border" />
          )}

          {/* Video */}
          {latestSeed.video_url && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-bold text-brand uppercase tracking-widest">
                <PlayCircle className="w-4 h-4" /> Video Devocional
              </p>
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                {latestYtId ? (
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${latestYtId}?rel=0`}
                      className="absolute inset-0 w-full h-full border-none"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video controls className="w-full aspect-video rounded-2xl bg-black">
                    <source src={latestSeed.video_url} />
                  </video>
                )}
              </div>
            </div>
          )}

          {/* Reflexión */}
          {latestSeed.reflection && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-bold text-brand uppercase tracking-widest">
                <BookOpen className="w-4 h-4" /> Reflexión
              </p>
              <p className="text-base text-text-2 leading-loose font-normal whitespace-pre-wrap">
                {latestSeed.reflection}
              </p>
            </div>
          )}

          {/* Caso en los negocios */}
          {latestSeed.case_story && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-5 opacity-10">
                <Briefcase className="w-12 h-12 text-amber-500" />
              </div>
              <p className="flex items-center gap-2 text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-3">
                <Briefcase className="w-4 h-4" /> Caso en los Negocios
              </p>
              <p className="text-sm text-amber-900 leading-relaxed font-normal whitespace-pre-wrap">
                {latestSeed.case_story}
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-3">
            <p className="text-[11px] text-text-3 font-medium">
              {blessedSeeds.has(latestSeed.id) ? "✓ Ya dijiste ¡Amén! a esta semilla" : "¿Esta palabra te bendijo hoy?"}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBless(latestSeed.id)}
                disabled={blessedSeeds.has(latestSeed.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                  blessedSeeds.has(latestSeed.id)
                    ? "bg-rose-50 text-rose-500 border-rose-200 cursor-default"
                    : "bg-white text-text-2 border-border hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                }`}
              >
                <Heart className={`w-4 h-4 transition-all ${blessedSeeds.has(latestSeed.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                {blessedSeeds.has(latestSeed.id) ? "¡Amén!" : "Me bendijo"}
              </button>
              <button
                onClick={() => handleShare(latestSeed)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border border-border bg-white text-text-2 hover:bg-surface-hover/10 transition-all"
              >
                <Send className="w-4 h-4" /> Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEMILLAS ANTERIORES ── */}
      {previousSeeds.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-montserrat font-bold text-text-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand" />
            Semillas Anteriores
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {previousSeeds.map((seed) => {
              const isBlessed = blessedSeeds.has(seed.id);
              const dateStr = seed.scheduled_date ? formatDate(seed.scheduled_date) : "";

              return (
                <div
                  key={seed.id}
                  className="bg-white border border-border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Fecha */}
                  <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-3">
                    {dateStr}
                  </p>

                  {/* Versículo con borde izquierdo */}
                  <div className="border-l-2 border-brand pl-4 mb-4 flex-1">
                    <p
                      className="text-sm font-montserrat font-normal leading-relaxed line-clamp-4"
                      style={{ color: "#111111" }}
                    >
                      &ldquo;{seed.verse}&rdquo;
                    </p>
                    <p className="text-xs font-montserrat font-semibold text-brand mt-2">
                      — {seed.verse_reference}
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center gap-2 border-t border-border pt-4 mt-auto">
                    <button
                      onClick={() => handleBless(seed.id)}
                      disabled={isBlessed}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isBlessed
                          ? "bg-rose-50 text-rose-500 border-rose-200 cursor-default"
                          : "bg-surface-base/50 text-text-3 border-border hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isBlessed ? "fill-rose-500 text-rose-500" : ""}`} />
                      {isBlessed ? "¡Amén!" : "Me bendijo"}
                    </button>
                    <button
                      onClick={() => handleShare(seed)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-border bg-surface-base/50 text-text-3 hover:bg-surface-hover/10 hover:text-text-1 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Compartir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
