"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDailySeed } from "@/lib/actions/seeds";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";

export default function NuevaSemillaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [verse, setVerse] = useState("");
  const [verseRef, setVerseRef] = useState("");
  const [reflection, setReflection] = useState("");
  const [caseStory, setCaseStory] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState<"none" | "link" | "upload">(
    "none",
  );

  const handleSubmit = async (status: "draft" | "scheduled" | "published") => {
    if (!verse || !verseRef || !scheduledDate) {
      toast.error(
        "Completa los campos obligatorios: versículo, referencia y fecha",
      );
      return;
    }
    setLoading(true);
    try {
      await createDailySeed({
        verse,
        verse_reference: verseRef,
        reflection: reflection || undefined,
        case_story: caseStory || undefined,
        scheduled_date: scheduledDate,
        video_url: videoType === "link" ? videoUrl : undefined,
        status,
      });
      toast.success(
        status === "published"
          ? "¡Semilla publicada!"
          : status === "scheduled"
            ? "Semilla programada"
            : "Borrador guardado",
      );
      router.push("/superadmin/semillas");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-[#120D1A] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E040FB]/40 transition-colors placeholder:text-[#4A3A6A]";
  const labelStyle =
    "block text-[11px] font-bold text-[#4A3A6A] uppercase tracking-[0.10em] mb-2";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-white/[0.06] text-[#9585B8] hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-primary">
            Nueva Semilla
          </h1>
          <p className="text-xs text-[#9585B8]">Contenido espiritual diario</p>
        </div>
      </div>

      <div className="bg-[#18102A] border border-white/[0.06] rounded-2xl p-6 space-y-6">
        {/* Fecha */}
        <div>
          <label className={labelStyle}>Fecha Programada *</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className={inputStyle}
          />
        </div>

        {/* Versículo */}
        <div>
          <label className={labelStyle}>Versículo *</label>
          <textarea
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
            placeholder="Escribe el versículo bíblico aquí..."
            rows={3}
            className={inputStyle + " resize-none"}
          />
        </div>

        {/* Referencia */}
        <div>
          <label className={labelStyle}>Referencia Bíblica *</label>
          <input
            value={verseRef}
            onChange={(e) => setVerseRef(e.target.value)}
            placeholder="Ej: Proverbios 3:5-6"
            className={inputStyle}
          />
        </div>

        {/* Reflexión */}
        <div>
          <label className={labelStyle}>Reflexión</label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="¿Qué significa este versículo para el emprendedor?"
            rows={4}
            className={inputStyle + " resize-none"}
          />
        </div>

        {/* Caso de éxito */}
        <div>
          <label className={labelStyle}>Caso de Éxito</label>
          <textarea
            value={caseStory}
            onChange={(e) => setCaseStory(e.target.value)}
            placeholder="Historia inspiradora relacionada..."
            rows={3}
            className={inputStyle + " resize-none"}
          />
        </div>

        {/* Video */}
        <div>
          <label className={labelStyle}>Video</label>
          <div className="flex gap-2 mb-3">
            {[
              { id: "none", label: "Sin video" },
              { id: "link", label: "Link YouTube/Vimeo" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setVideoType(opt.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  videoType === opt.id
                    ? "bg-[rgba(224,64,251,0.15)] text-[#E040FB] border border-[rgba(224,64,251,0.30)]"
                    : "bg-white/[0.04] text-[#9585B8] border border-transparent hover:bg-white/[0.06]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {videoType === "link" && (
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={inputStyle}
            />
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => handleSubmit("draft")}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                                   bg-white/[0.06] text-[#9585B8] hover:bg-white/[0.10] transition-all
                                   disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Guardar Borrador
          </button>
          <button
            onClick={() => handleSubmit("scheduled")}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                                   bg-[rgba(255,184,0,0.10)] text-[#FFB800] border border-[rgba(255,184,0,0.20)]
                                   hover:bg-[rgba(255,184,0,0.15)] transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Programar
          </button>
          <button
            onClick={() => handleSubmit("published")}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white
                                   bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                                   shadow-[0_4px_16px_rgba(224,64,251,0.25)]
                                   hover:opacity-90 transition-all disabled:opacity-50 ml-auto"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publicar Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
