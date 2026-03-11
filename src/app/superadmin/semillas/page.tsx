"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { updateSeedStatus, deleteSeed } from "@/lib/actions/seeds";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Calendar,
  Trash2,
  Eye,
  EyeOff,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: "bg-white/[0.06]", text: "text-[#9585B8]", label: "Borrador" },
  scheduled: {
    bg: "bg-[rgba(255,184,0,0.10)]",
    text: "text-[#FFB800]",
    label: "Programado",
  },
  published: {
    bg: "bg-[rgba(0,229,204,0.10)]",
    text: "text-[#00E5CC]",
    label: "Publicado",
  },
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function SemillasPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [seeds, setSeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const fetchSeeds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_seeds")
      .select("*")
      .order("scheduled_date", { ascending: false });

    setSeeds(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSeeds();
  }, []);

  // Verificar acceso superadmin
  if (user && user.role !== "superadmin") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-[#9585B8] mt-2">
            Solo superadmins pueden gestionar semillas
          </p>
        </div>
      </div>
    );
  }

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getSeedForDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return seeds.find((s) => s.scheduled_date === dateStr);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "draft" | "scheduled" | "published",
  ) => {
    try {
      await updateSeedStatus(id, newStatus);
      toast.success("Estado actualizado");
      fetchSeeds();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta semilla?")) return;
    try {
      await deleteSeed(id);
      toast.success("Semilla eliminada");
      fetchSeeds();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#E040FB] animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            ✨ Semilla Diaria — CMS
          </h1>
          <p className="text-sm text-[#9585B8] mt-1">
            Gestiona el contenido espiritual diario para todos los usuarios
          </p>
        </div>
        <Link
          href="/superadmin/semillas/nueva"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white
                               bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                               shadow-[0_4px_20px_rgba(224,64,251,0.30)]
                               hover:opacity-90 transition-all active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Semilla
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── CALENDARIO VISUAL ─── */}
        <div className="lg:col-span-1 bg-[#18102A] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear((y) => y - 1);
                } else setCalMonth((m) => m - 1);
              }}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#9585B8]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-white">
              {MONTHS[calMonth]} {calYear}
            </p>
            <button
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear((y) => y + 1);
                } else setCalMonth((m) => m + 1);
              }}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#9585B8]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Días header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-bold text-[#4A3A6A] uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Días */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios vacíos al inicio */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calDays.map((day) => {
              const seed = getSeedForDay(day);
              const isToday = (() => {
                const now = new Date();
                return (
                  day === now.getDate() &&
                  calMonth === now.getMonth() &&
                  calYear === now.getFullYear()
                );
              })();
              let dotColor = "bg-[rgba(255,45,85,0.15)]"; // sin seed = rojo suave
              if (seed?.status === "published")
                dotColor = "bg-[rgba(0,229,204,0.30)]";
              else if (seed?.status === "scheduled")
                dotColor = "bg-[rgba(255,184,0,0.25)]";
              else if (seed?.status === "draft")
                dotColor = "bg-[rgba(255,184,0,0.12)]";

              return (
                <div
                  key={day}
                  className={`relative aspect-square flex items-center justify-center rounded-lg text-xs
                                        font-semibold cursor-default transition-all ${dotColor}
                                        ${isToday ? "ring-2 ring-[#E040FB] ring-offset-1 ring-offset-[#18102A]" : ""}
                                        ${seed ? "text-white" : "text-[#4A3A6A]"}`}
                  title={
                    seed
                      ? `${seed.verse_reference} — ${seed.status}`
                      : "Sin semilla"
                  }
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[rgba(0,229,204,0.50)]" />
              <span className="text-[10px] text-[#9585B8]">Publicado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,184,0,0.40)]" />
              <span className="text-[10px] text-[#9585B8]">Programado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,45,85,0.25)]" />
              <span className="text-[10px] text-[#9585B8]">Vacío</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
              <p className="text-2xl font-display font-bold text-[#E040FB]">
                {seeds.reduce((acc, s) => acc + (s.views_count || 0), 0)}
              </p>
              <p className="text-[10px] text-[#9585B8] uppercase font-bold tracking-wider mt-1">
                Visualizaciones Totales
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1 content-center">
              <div className="flex justify-between items-center text-[11px] bg-white/[0.02] px-2 py-1 rounded">
                <span className="text-[#9585B8]">Publicados</span>
                <span className="font-bold text-[#00E5CC]">{seeds.filter((s) => s.status === "published").length}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-white/[0.02] px-2 py-1 rounded">
                <span className="text-[#9585B8]">Programados</span>
                <span className="font-bold text-[#FFB800]">{seeds.filter((s) => s.status === "scheduled").length}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-white/[0.02] px-2 py-1 rounded">
                <span className="text-[#9585B8]">Borradores</span>
                <span className="font-bold text-[#9585B8]">{seeds.filter((s) => s.status === "draft").length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── LISTA DE SEMILLAS ─── */}
        <div className="lg:col-span-2 space-y-3">
          {seeds.length === 0 ? (
            <div className="bg-[#18102A] border border-white/[0.06] rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-bold text-white mb-2">
                No hay semillas aún
              </h3>
              <p className="text-sm text-[#9585B8] mb-4">
                Crea tu primera semilla del día
              </p>
              <Link
                href="/superadmin/semillas/nueva"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white
                                           bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-sm"
              >
                <Plus className="w-4 h-4" /> Crear Semilla
              </Link>
            </div>
          ) : (
            seeds.map((seed) => {
              const st = STATUS_COLORS[seed.status] ?? STATUS_COLORS.draft;
              return (
                <div
                  key={seed.id}
                  className="bg-[#18102A] border border-white/[0.06] rounded-2xl p-5
                                                hover:border-[rgba(224,64,251,0.15)] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#9585B8]" />
                      <span className="text-xs font-mono text-[#9585B8]">
                        {seed.scheduled_date
                          ? new Date(
                              seed.scheduled_date + "T12:00:00",
                            ).toLocaleDateString("es-VE", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })
                          : "Sin fecha"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {seed.status !== "published" && (
                        <button
                          onClick={() =>
                            handleStatusChange(seed.id, "published")
                          }
                          title="Publicar"
                          className="p-1.5 rounded-lg hover:bg-[rgba(0,229,204,0.10)] text-[#9585B8] hover:text-[#00E5CC] transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {seed.status === "published" && (
                        <button
                          onClick={() => handleStatusChange(seed.id, "draft")}
                          title="Despublicar"
                          className="p-1.5 rounded-lg hover:bg-[rgba(255,184,0,0.10)] text-[#9585B8] hover:text-[#FFB800] transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(seed.id)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg hover:bg-[rgba(255,45,85,0.10)] text-[#9585B8] hover:text-[#FF2D55] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Versículo */}
                  <div className="pl-4 border-l-2 border-[rgba(224,64,251,0.40)] mb-3">
                    <p className="text-sm font-semibold text-[#F4EDFF] italic leading-relaxed">
                      &ldquo;{seed.verse}&rdquo;
                    </p>
                    <p className="text-xs font-bold text-[#E040FB] mt-1">
                      — {seed.verse_reference}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[10px] text-[#4A3A6A]">
                    {seed.reflection && <span>📝 Reflexión</span>}
                    {seed.video_url && <span>🎬 Video</span>}
                    {seed.case_story && <span>💼 Caso</span>}
                    <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(224,64,251,0.08)] text-[#E040FB] font-bold border border-[rgba(224,64,251,0.15)]">
                      <Eye className="w-3 h-3" /> {seed.views_count ?? 0} vistas
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
