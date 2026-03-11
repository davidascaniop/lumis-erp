"use client";
import { useState } from "react";
import { createBroadcast } from "@/lib/actions/superadmin";
import { toast } from "sonner";
import { Send } from "lucide-react";

export function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<
    "info" | "warning" | "success" | "maintenance"
  >("info");
  const [target, setTarget] = useState("all");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    try {
      await createBroadcast({ title, message, type, target });
      toast.success(
        `Anuncio enviado a ${target === "all" ? "todas las empresas" : target}`,
      );
      setTitle("");
      setMessage("");
    } catch {
      toast.error("Error enviando el anuncio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#18102A] border border-white/6 rounded-2xl p-6">
      <h2 className="font-display text-base font-bold text-white mb-5">
        Nuevo Anuncio
      </h2>

      <div className="space-y-4">
        {/* Tipo + Target */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest block mb-2">
              Tipo
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: "info", emoji: "ℹ️", label: "Info" },
                { id: "warning", emoji: "⚠️", label: "Aviso" },
                { id: "success", emoji: "✅", label: "Novedad" },
                { id: "maintenance", emoji: "🔧", label: "Mantenimiento" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    type === t.id
                      ? "bg-[rgba(224,64,251,0.15)] text-[#E040FB] border border-[rgba(224,64,251,0.25)]"
                      : "bg-white/4 text-[#9585B8] border border-white/6 hover:text-white"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto">
            <label className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest block mb-2">
              Destinatarios
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-[#0F0818] border border-white/8 rounded-xl px-4 py-2
                               text-sm text-white focus:outline-none focus:border-[rgba(224,64,251,0.45)]"
            >
              <option value="all">Todas las empresas</option>
              <option value="emprendedor">Solo Emprendedor</option>
              <option value="crecimiento">Solo Crecimiento</option>
              <option value="corporativo">Solo Corporativo</option>
            </select>
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest block mb-2">
            Título *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Nueva funcionalidad disponible"
            className="w-full bg-[#0F0818] border border-white/8 rounded-xl px-4 py-3
                            text-sm text-white placeholder-[#3D2D5C]
                            focus:outline-none focus:border-[rgba(224,64,251,0.45)]
                            focus:shadow-[0_0_0_3px_rgba(224,64,251,0.10)] transition-all"
          />
        </div>

        {/* Mensaje */}
        <div>
          <label className="text-[10px] font-semibold text-[#3D2D5C] uppercase tracking-widest block mb-2">
            Mensaje *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Escribe el mensaje que verán tus clientes al abrir LUMIS..."
            className="w-full bg-[#0F0818] border border-white/8 rounded-xl px-4 py-3
                               text-sm text-white placeholder-[#3D2D5C] resize-none
                               focus:outline-none focus:border-[rgba(224,64,251,0.45)]
                               focus:shadow-[0_0_0_3px_rgba(224,64,251,0.10)] transition-all"
          />
        </div>

        {/* Preview */}
        {(title || message) && (
          <div
            className={`p-4 rounded-xl border ${
              type === "warning"
                ? "bg-[rgba(255,184,0,0.06)] border-[rgba(255,184,0,0.20)]"
                : type === "success"
                  ? "bg-[rgba(0,229,204,0.06)] border-[rgba(0,229,204,0.20)]"
                  : type === "maintenance"
                    ? "bg-white/4 border-white/10"
                    : "bg-[rgba(79,195,247,0.06)] border-[rgba(79,195,247,0.20)]"
            }`}
          >
            <p className="text-[10px] font-semibold text-[#9585B8] uppercase tracking-widest mb-1">
              Preview — así lo verán tus clientes:
            </p>
            <p className="text-sm font-semibold text-white">{title}</p>
            {message && (
              <p className="text-xs text-[#9585B8] mt-1">{message}</p>
            )}
          </div>
        )}

        {/* Botón */}
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={!title.trim() || !message.trim() || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                             bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                             shadow-[0_6px_20px_rgba(224,64,251,0.25)]
                             hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
            {loading ? "Enviando..." : "Enviar a clientes"}
          </button>
        </div>
      </div>
    </div>
  );
}
