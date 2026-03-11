"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  PlayCircle,
  BookOpen,
  Briefcase,
  Calendar,
  Share2,
  Sparkles,
} from "lucide-react";

export default function SemillasAppPage() {
  const supabase = createClient();
  const [seeds, setSeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeeds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_seeds")
      .select("*")
      .eq("status", "published")
      .order("scheduled_date", { ascending: false });

    setSeeds(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSeeds();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#E040FB] animate-spin" />
      </div>
    );
  }

  if (seeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-[#E040FB] opacity-80" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Aún no hay Semillas publicadas
        </h2>
        <p className="text-[#9585B8]">
          El contenido espiritual diario de LUMIS aparecerá aquí muy pronto.
        </p>
      </div>
    );
  }

  const latestSeed = seeds[0];
  const previousSeeds = seeds.slice(1);

  // Función para extraer ID de youtube
  const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    return match ? match[1] : null;
  };

  const latestYtId = getYoutubeId(latestSeed.video_url);

  const shareSeed = (seed: any) => {
    const text = encodeURIComponent(
      `✨ Semilla del Día\n\n"${seed.verse}"\n— ${seed.verse_reference}\n\n${seed.reflection ? seed.reflection.substring(0, 150) + "..." : ""}\n\n_Vía LUMIS_`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
      {/* Header de página */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] 
                                flex items-center justify-center shadow-[0_0_24px_rgba(224,64,251,0.40)]"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Semilla Diaria
          </h1>
          <p className="text-[#9585B8] text-sm">
            Devocionales y principios bíblicos para tus negocios
          </p>
        </div>
      </div>

      {/* HERO: Semilla Más Reciente */}
      <div
        className="relative bg-[#120D1A] border border-white/[0.06] rounded-3xl overflow-hidden
                            shadow-[0_24px_64px_rgba(0,0,0,0.60)]"
      >
        {/* Background Glow */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] 
                                bg-[rgba(224,64,251,0.06)] pointer-events-none"
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-[100px] 
                                bg-[rgba(124,77,255,0.06)] pointer-events-none"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
          {/* Panel Izquierdo: Versículo y Compartir */}
          <div className="p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-white/[0.04] flex flex-col justify-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(224,64,251,0.10)] 
                                        border border-[rgba(224,64,251,0.20)] text-[#E040FB] text-xs font-bold mb-8 w-max"
            >
              <Sparkles className="w-3.5 h-3.5" />
              NUEVO HOY
            </div>

            <blockquote className="text-2xl lg:text-3xl font-bold text-white leading-tight italic m-0 mb-6 font-display">
              &ldquo;{latestSeed.verse}&rdquo;
            </blockquote>
            <cite className="text-lg font-bold text-[#E040FB] not-italic block mb-10">
              — {latestSeed.verse_reference}
            </cite>

            <div className="mt-auto">
              <button
                onClick={() => shareSeed(latestSeed)}
                className="flex items-center gap-2 w-max px-6 py-3 rounded-xl font-bold text-white
                                           bg-gradient-to-r from-[#25D366] to-[#1DA853] shadow-[0_4px_20px_rgba(37,211,102,0.30)]
                                           hover:opacity-90 transition-all hover:-translate-y-0.5"
              >
                <Share2 className="w-4 h-4" />
                Compartir por WhatsApp
              </button>
            </div>
          </div>

          {/* Panel Derecho: Todo el contenido enriquecido (Video, Reflexión, Negocios) */}
          <div className="p-8 lg:p-10 bg-white/[0.02] flex flex-col gap-8 h-full">
            {/* Video */}
            {latestSeed.video_url && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#E040FB] font-bold text-xs uppercase tracking-widest">
                  <PlayCircle className="w-4 h-4" /> Video Devocional
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] relative">
                  {latestYtId ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${latestYtId}?rel=0`}
                        className="absolute inset-0 w-full h-full border-none"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      controls
                      className="w-full aspect-video bg-black rounded-2xl"
                    >
                      <source src={latestSeed.video_url} />
                    </video>
                  )}
                </div>
              </div>
            )}

            {/* Reflexión (Devocional) */}
            {latestSeed.reflection && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#7C4DFF] font-bold text-xs uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" /> Reflexión
                </div>
                <p className="text-sm text-[#B4A5D0] leading-relaxed">
                  {latestSeed.reflection}
                </p>
              </div>
            )}

            {/* Ejemplos a los negocios */}
            {latestSeed.case_story && (
              <div
                className="p-5 rounded-2xl bg-gradient-to-br from-[rgba(255,184,0,0.08)] to-[rgba(255,184,0,0.02)]
                                            border border-[rgba(255,184,0,0.15)] relative"
              >
                <div className="absolute top-0 right-0 p-5 opacity-10">
                  <Briefcase className="w-12 h-12 text-[#FFB800]" />
                </div>
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2 text-[#FFB800] font-bold text-xs uppercase tracking-widest">
                    <Briefcase className="w-4 h-4" /> Caso en los Negocios
                  </div>
                  <p className="text-sm text-[#F4EDFF] leading-relaxed relative z-10 whitespace-pre-wrap">
                    {latestSeed.case_story}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listado de Semillas Anteriores */}
      {previousSeeds.length > 0 && (
        <div className="space-y-6 pt-10">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#9585B8]" />
            Semillas Anteriores
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previousSeeds.map((seed) => {
              const dateStr = seed.scheduled_date
                ? new Date(
                    seed.scheduled_date + "T12:00:00",
                  ).toLocaleDateString("es-VE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "";

              return (
                <div
                  key={seed.id}
                  className="bg-[#120D1A] border border-white/[0.06] rounded-2xl p-6 flex flex-col
                                                hover:border-[rgba(224,64,251,0.20)] hover:bg-[#181124] transition-all group"
                >
                  <p className="text-[10px] uppercase font-bold text-[#E040FB] tracking-widest mb-3">
                    {dateStr}
                  </p>
                  <blockquote className="text-[15px] font-semibold text-white italic leading-relaxed mb-4 flex-1">
                    &ldquo;{seed.verse}&rdquo;
                  </blockquote>
                  <div>
                    <cite className="text-xs font-bold text-[#9585B8] not-italic block mb-4">
                      — {seed.verse_reference}
                    </cite>
                    <button
                      onClick={() => shareSeed(seed)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                                                       bg-white/[0.04] text-[#B4A5D0] text-xs font-bold
                                                       hover:bg-[rgba(37,211,102,0.15)] hover:text-[#25D366] transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Compartir
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
