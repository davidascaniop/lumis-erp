"use client";

import { useState, useEffect } from "react";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
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
  TrendingUp,
  Heart,
  Flame,
  Users
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: "bg-surface-hover", text: "text-text-3", label: "Borrador" },
  scheduled: {
    bg: "bg-[#FFF4E5]",
    text: "text-[#FFB800]",
    label: "Programado",
  },
  published: {
    bg: "bg-[#E6FDF9]",
    text: "text-[#00E5CC]",
    label: "Publicado",
  },
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function SemillasPage() {
  const supabase = createSuperadminClient();
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

  if (user && user.role !== "superadmin") {
    return (
      <div className="flex items-center justify-center h-[60vh] bg-surface-base">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-text-1">Acceso Restringido</h2>
          <p className="text-text-2 mt-2">
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
      toast.success("Estado actualizado exitosamente");
      fetchSeeds();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta semilla permanentemente?")) return;
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
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );

  // Derive Stats
  const totalViews = seeds.reduce((acc, s) => acc + (s.views_count || 0), 0);
  const totalReactions = seeds.reduce((acc, s) => acc + (s.blessings_count || 0), 0);
  const totalShares = seeds.reduce((acc, s) => acc + (s.shares_count || 0), 0);
  const connectionRate = totalViews > 0 ? Math.round((totalReactions / totalViews) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-1 flex items-center gap-2">
            <span className="text-brand">✨</span> Centro de Impacto Espiritual
          </h1>
          <p className="text-sm font-medium text-text-2 mt-1">
            Gestión y redacción de la Semilla Diaria
          </p>
        </div>
        <Link
          href="/superadmin/semillas/nueva"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white
                               bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]
                               shadow-lg shadow-[#E040FB]/20
                               hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Semilla
        </Link>
      </div>

      {/* METRICAS SUPERIORES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-sm hover:border-brand/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-brand/10 text-brand rounded-xl group-hover:bg-brand/15 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xs font-bold text-text-3 uppercase tracking-wider mb-1">Impacto Total</h3>
          <p className="font-heading text-3xl font-black text-text-1">
            {totalViews}
          </p>
        </div>

        <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-sm hover:border-status-ok/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-status-ok/10 text-status-ok rounded-xl group-hover:bg-status-ok/15 transition-colors">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xs font-bold text-text-3 uppercase tracking-wider mb-1">Tasa de Conexión</h3>
          <p className="font-heading text-3xl font-black text-text-1">
            {connectionRate}%
          </p>
        </div>

        <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-sm hover:border-status-warn/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-status-warn/10 text-status-warn rounded-xl group-hover:bg-status-warn/15 transition-colors">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xs font-bold text-text-3 uppercase tracking-wider mb-1">Racha Comunidad</h3>
          <p className="font-heading text-3xl font-black text-text-1">
            12 <span className="text-base text-text-3 font-semibold">días</span>
          </p>
        </div>

        <div className="bg-surface-card border border-border rounded-2xl p-5 shadow-sm hover:border-brand/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-brand/10 text-brand rounded-xl group-hover:bg-brand/15 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-status-ok bg-status-ok/10 px-1.5 py-0.5 rounded-md border border-status-ok/20">
              +15%
            </span>
          </div>
          <h3 className="text-xs font-bold text-text-3 uppercase tracking-wider mb-1">Crecimiento</h3>
          <p className="font-heading text-3xl font-black text-text-1">
            Lectores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* ─── CALENDARIO VISUAL MINIMALISTA ─── */}
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <button
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear((y) => y - 1);
                } else setCalMonth((m) => m - 1);
              }}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-text-2 transition-colors border border-transparent hover:border-border"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-base font-bold text-text-1 uppercase tracking-widest font-heading">
              {MONTHS[calMonth]} {calYear}
            </p>
            <button
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear((y) => y + 1);
                } else setCalMonth((m) => m + 1);
              }}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-text-2 transition-colors border border-transparent hover:border-border"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full">
            {/* Días header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[11px] font-bold text-text-3 uppercase py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Días */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
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

                let dotColor = "text-text-3 bg-surface-base border border-border hover:bg-surface-hover"; // Gris/Vacío
                if (seed?.status === "published") dotColor = "bg-[#E6FDF9] text-[#00E5CC] border border-[#00E5CC]/20 hover:bg-[#00E5CC]/20 shadow-sm"; // Cyan
                else if (seed?.status === "scheduled") dotColor = "bg-[#FFF4E5] text-[#FFB800] border border-[#FFB800]/20 hover:bg-[#FFB800]/20 shadow-sm"; // Naranja

                return (
                  <div
                    key={day}
                    className={`relative aspect-square flex items-center justify-center rounded-xl text-xs
                                          font-bold cursor-default transition-all ${dotColor}
                                          ${isToday ? "ring-2 ring-brand ring-offset-2 ring-offset-white" : ""}`}
                    title={seed ? `${seed.verse_reference} — ${seed.status}` : "Día sin semilla programada"}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center justify-center gap-5 mt-8 pt-6 border-t border-border w-full">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00E5CC]/20 border border-[#00E5CC]" />
              <span className="text-[11px] font-semibold text-text-2 uppercase tracking-wider">Publicado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FFB800]/20 border border-[#FFB800]" />
              <span className="text-[11px] font-semibold text-text-2 uppercase tracking-wider">Planificado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-surface-base border border-border" />
              <span className="text-[11px] font-semibold text-text-2 uppercase tracking-wider">Vacío</span>
            </div>
          </div>
        </div>

        {/* ─── FEED DE SEMILLAS ─── */}
        <div className="space-y-4">
          {seeds.length === 0 ? (
             <div className="bg-surface-card border border-border rounded-3xl p-16 text-center h-full flex flex-col justify-center items-center shadow-sm">
                <div className="w-16 h-16 bg-surface-base rounded-2xl flex items-center justify-center border border-border mb-4 shadow-sm">
                  <span className="text-3xl text-brand">✨</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-text-1 mb-2">
                  No hay semillas creadas
                </h3>
                <p className="text-sm font-medium text-text-3 max-w-sm mb-6">
                  Comienza a escribir el contenido espiritual estableciendo tu primera semilla para bendecir a la comunidad.
                </p>
                <Link
                  href="/superadmin/semillas/nueva"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white
                                      bg-[#E040FB] hover:bg-[#C236D9] shadow-lg shadow-[#E040FB]/20 hover:-translate-y-0.5 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" /> Escribir Primera Semilla
                </Link>
             </div>
          ) : (
            seeds.map((seed) => {
              const st = STATUS_COLORS[seed.status] ?? STATUS_COLORS.draft;
              return (
                <div
                  key={seed.id}
                  className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm
                                                hover:border-brand/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-base border border-border flex items-center justify-center shadow-sm">
                        <Calendar className="w-4 h-4 text-text-2" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-text-1 capitalize">
                          {seed.scheduled_date
                            ? new Date(seed.scheduled_date + "T12:00:00").toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })
                            : "Fecha Sin Asignar"}
                        </span>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {seed.status !== "published" && (
                        <button
                          onClick={() => handleStatusChange(seed.id, "published")}
                          title="Publicar Ahora"
                          className="p-2 rounded-lg bg-surface-base border border-border hover:bg-[#E6FDF9] text-text-2 hover:text-[#00E5CC] hover:border-[#00E5CC]/30 transition-all shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {seed.status === "published" && (
                        <button
                          onClick={() => handleStatusChange(seed.id, "draft")}
                          title="Retirar (Mover a Borrador)"
                          className="p-2 rounded-lg bg-surface-base border border-border hover:bg-[#FFF4E5] text-text-2 hover:text-[#FFB800] hover:border-[#FFB800]/30 transition-all shadow-sm"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(seed.id)}
                        title="Eliminar Permanente"
                        className="p-2 rounded-lg bg-surface-base border border-border hover:bg-status-danger/10 text-text-2 hover:text-status-danger hover:border-status-danger/30 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Versículo / Extracto */}
                  <div className="pl-4 border-l-[3px] border-brand/40 mb-5 relative">
                    <p className="text-[15px] font-semibold text-text-2 leading-relaxed">
                      &ldquo;{seed.verse}&rdquo;
                    </p>
                    <p className="text-sm font-bold text-brand mt-1.5 font-heading">
                      {seed.verse_reference}
                    </p>
                  </div>

                  {/* Meta Píldoras */}
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-3">
                    {seed.reflection && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-text-3" /> Reflexión</span>}
                    {seed.video_url && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-text-3" /> Video Intro</span>}
                    {seed.case_story && <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-text-3" /> Caso Base</span>}
                    
                    <div className="ml-auto flex items-center gap-3">
                       <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-base border border-border text-text-2 font-bold shadow-sm group-hover:border-[#E040FB]/30 transition-colors">
                          <Heart className="w-3.5 h-3.5 text-text-3 group-hover:text-[#E040FB] transition-colors" /> {seed.blessings_count ?? 0}
                       </span>
                       <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-base border border-border text-text-2 font-bold shadow-sm group-hover:border-brand/30 transition-colors">
                          <Send className="w-3.5 h-3.5 text-text-3 group-hover:text-brand transition-colors" /> {seed.shares_count ?? 0}
                       </span>
                    </div>
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
