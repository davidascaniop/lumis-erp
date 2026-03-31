"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDailySeed } from "@/lib/actions/seeds";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Loader2, Sparkles, Smartphone, PlayCircle } from "lucide-react";

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
  const [videoType, setVideoType] = useState<"none" | "link" | "upload">("none");

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

  const handleAIInspiration = () => {
    if (!verse) {
      toast.error("Por favor ingresa un versículo primero para que la IA se inspire.");
      return;
    }
    toast.info("Generando inspiración con IA...");
    setTimeout(() => {
      setReflection(prev => prev + (prev ? "\n\n" : "") + "La sabiduría de este versículo nos invita a reflexionar sobre nuestro propósito como líderes corporativos, entendiendo que cada decisión tiene un impacto espiritual profundo en nuestro entorno.");
      toast.success("¡Texto generado por IA!");
    }, 1500);
  };

  const inputStyle =
    "w-full bg-surface-base border border-border rounded-xl px-4 py-3 text-text-1 text-sm outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-text-3 font-medium";
  const labelStyle =
    "block text-[11px] font-bold text-text-2 uppercase tracking-wide mb-2";

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-surface-base border border-border hover:bg-surface-hover text-text-2 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-1">
            Redactar Semilla
          </h1>
          <p className="text-sm font-medium text-text-2 mt-1">Diseña el contenido espiritual para nutrir a los usuarios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* Versículo */}
          <div>
            <label className={labelStyle}>Versículo Base *</label>
            <textarea
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              placeholder="Escribe el texto sagrado literal aquí..."
              rows={3}
              className={inputStyle + " resize-none"}
            />
          </div>

          {/* Reflexión */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-text-2 uppercase tracking-wide">Reflexión Diaria</label>
              <button 
                onClick={handleAIInspiration}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Inspiración IA
              </button>
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="¿Qué significa este versículo para un líder, CEO o emprendedor?"
              rows={5}
              className={inputStyle + " resize-none leading-relaxed"}
            />
          </div>

          {/* Caso de éxito */}
          <div>
            <label className={labelStyle}>Caso Práctico / Analogía Corp.</label>
            <textarea
              value={caseStory}
              onChange={(e) => setCaseStory(e.target.value)}
              placeholder="Añade una historia empresarial breve para asentar la idea..."
              rows={3}
              className={inputStyle + " resize-none"}
            />
          </div>

          {/* Video */}
          <div className="pt-2">
            <label className={labelStyle}>Material Audiovisual</label>
            <div className="flex gap-2 mb-3">
              {[
                { id: "none", label: "Sin Video" },
                { id: "link", label: "YouTube / Vimeo" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setVideoType(opt.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    videoType === opt.id
                      ? "bg-brand text-white shadow-md shadow-brand/20"
                      : "bg-surface-base border border-border text-text-2 hover:bg-surface-hover"
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
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-border mt-8">
            <button
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold
                                     bg-surface-base border border-border text-text-2 hover:bg-surface-hover transition-all
                                     disabled:opacity-50 flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4" />
              Borrador
            </button>
            <button
              onClick={() => handleSubmit("scheduled")}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold
                                     bg-[#FFF4E5] text-[#FFB800] border border-[#FFB800]/20 hover:bg-[#FFB800]/20 transition-all 
                                     disabled:opacity-50 flex-1 sm:flex-none"
            >
              <Send className="w-4 h-4" />
              Programar
            </button>
            <button
              onClick={() => handleSubmit("published")}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white
                                     bg-gradient-to-r from-brand to-brand-hover
                                     shadow-lg shadow-brand/20
                                     hover:-translate-y-0.5 transition-all disabled:opacity-50 w-full sm:w-auto sm:ml-auto"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Publicar Ahora
            </button>
          </div>
        </div>


        {/* LADO DERECHO: VISTA PREVIA MÓVIL */}
        <div className="hidden lg:flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 text-text-2">
                <Smartphone className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Vista Previa App</span>
            </div>

            {/* Marco de Celular */}
            <div className="w-[320px] h-[650px] bg-white rounded-[3rem] border-[10px] border-surface-card shadow-2xl relative overflow-hidden flex flex-col">
                {/* Dynamic Island */}
                <div className="w-24 h-6 bg-surface-card rounded-full absolute top-2 left-1/2 -translate-x-1/2 z-10" />
                
                {/* Header App */}
                <div className="bg-brand text-white pt-10 pb-4 px-5 relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand to-[#7C4DFF] opacity-90" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Semilla del Día</p>
                        <h2 className="text-lg font-bold">Lumis Feed</h2>
                    </div>
                </div>

                {/* Contenido App Scrollable */}
                <div className="flex-1 bg-[#F9FAFB] p-4 overflow-y-auto pb-8 relative">
                    {/* Card de Semilla */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        
                        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-4">
                            <Sparkles className="w-5 h-5" />
                        </div>

                        <p className="text-base font-medium text-gray-800 leading-relaxed min-h-[4rem] italic">
                            "{verse || 'Escribe un versículo para verlo aquí...'}"
                        </p>
                        <p className="text-xs font-bold text-brand mt-2 mb-4">
                            — {verseRef || 'Referencia'}
                        </p>

                        {reflection && (
                             <div className="mt-4 pt-4 border-t border-gray-100">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Reflexión</h4>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{reflection}</p>
                             </div>
                        )}

                        {caseStory && (
                             <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Caso Corp.</h4>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{caseStory}</p>
                             </div>
                        )}

                        {videoType === 'link' && videoUrl && (
                             <div className="mt-4 relative rounded-xl overflow-hidden aspect-video bg-gray-900 flex items-center justify-center group cursor-pointer border border-gray-100 shadow-sm">
                                <img src={`https://img.youtube.com/vi/${videoUrl.split('v=')[1]?.substring(0, 11)}/maxresdefault.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-60" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <PlayCircle className="w-10 h-10 text-white relative z-10 opacity-90 drop-shadow-md group-hover:scale-110 transition-transform" />
                             </div>
                        )}

                    </div>

                    {/* Falsas Interacciones */}
                    <div className="flex items-center justify-center gap-6 mt-4 opacity-50 pointer-events-none">
                        <div className="flex flex-col items-center gap-1.5"><Heart className="w-5 h-5 text-gray-400" /><span className="text-[10px] font-bold text-gray-400">Me bendijo</span></div>
                        <div className="flex flex-col items-center gap-1.5"><Send className="w-5 h-5 text-gray-400" /><span className="text-[10px] font-bold text-gray-400">Compartir</span></div>
                    </div>
                </div>

                {/* Bottom Bar App */}
                <div className="h-16 bg-white border-t border-gray-100 flex items-center justify-around shrink-0 px-2 pb-2">
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-300 rounded-sm" /></div>
                     <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-300 rounded-full" /></div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
