import { createClient } from "@/lib/supabase/server";
import { ComunicacionForm } from "@/components/superadmin/comunicacion-form";
import { Megaphone, Copy, Trash2, Send, Clock, Eye } from "lucide-react";

export default async function ComunicacionPage() {
  const supabase = await createClient();

  // Obtener conteos por plan para la segmentación en el form
  const { data: companies } = await supabase.from("companies").select("plan");
  
  const planCounts: Record<string, number> = {
    all: (companies || []).length,
    emprendedor: (companies || []).filter(c => c.plan === 'emprendedor').length,
    crecimiento: (companies || []).filter(c => c.plan === 'crecimiento').length,
    corporativo: (companies || []).filter(c => c.plan === 'corporativo').length,
  };

  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8 page-enter animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">
            Comunicación
          </h1>
          <p className="text-sm font-medium text-text-2 mt-1">
            Gestiona la difusión de anuncios y novedades para tus empresas
          </p>
        </div>
      </div>

      {/* Editor de Comunicación */}
      <ComunicacionForm planCounts={planCounts} />

      {/* Historial de Comunicaciones */}
      <div className="bg-surface-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-text-1">
            Historial de Envíos
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-hover/50">
                <th className="px-8 py-4 text-left text-[11px] font-bold text-text-3 uppercase tracking-widest border-b border-border">Anuncio</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-text-3 uppercase tracking-widest border-b border-border text-center">Estado</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-text-3 uppercase tracking-widest border-b border-border text-center">Canal</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-text-3 uppercase tracking-widest border-b border-border text-center">Alcance</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-text-3 uppercase tracking-widest border-b border-border text-center">Lecturas</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-text-3 uppercase tracking-widest border-b border-border text-center">Fecha</th>
                <th className="px-8 py-4 text-right text-[11px] font-bold text-text-3 uppercase tracking-widest border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(broadcasts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <Megaphone className="w-12 h-12 text-text-3 opacity-20 mb-4" />
                       <p className="text-sm font-semibold text-text-3">No hay historial de envíos todavía</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (broadcasts ?? []).map((b: any) => {
                  const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
                    info: { bg: "bg-blue-50", text: "text-blue-600", icon: "ℹ️" },
                    warning: { bg: "bg-orange-50", text: "text-orange-600", icon: "⚠️" },
                    success: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "✅" },
                    maintenance: { bg: "bg-gray-100", text: "text-gray-600", icon: "🔧" },
                  };
                  const cfg = TYPE_COLORS[b.type] ?? TYPE_COLORS.info;
                  const isScheduled = b.scheduled_for && new Date(b.scheduled_for) > new Date();

                  return (
                    <tr key={b.id} className="hover:bg-surface-base/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-xl shrink-0">{cfg.icon}</span>
                          <div className="min-w-0">
                            <p className="text-[15px] font-bold text-text-1 truncate">{b.title}</p>
                            <p className="text-xs font-medium text-text-3 truncate max-w-[200px]">{b.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                          ${isScheduled ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isScheduled ? <Clock className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                          {isScheduled ? 'Programado' : 'Enviado'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[11px] font-bold text-text-2 uppercase bg-surface-base border border-border px-2.5 py-1 rounded-lg">
                          {b.channel || 'App Banner'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-text-1 text-sm">
                        {b.target === 'all' ? planCounts.all : planCounts[b.target] || 0}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                           <Eye className="w-3.5 h-3.5 text-text-3" />
                           <span className="font-bold text-text-2 text-sm">{b.reads_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-text-2">
                        {new Date(b.created_at).toLocaleDateString("es-VE", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2.5 rounded-xl bg-surface-base border border-border hover:bg-surface-hover text-text-2 transition-all">
                                <Copy className="w-4 h-4" />
                            </button>
                            <button className="p-2.5 rounded-xl bg-surface-base border border-border hover:bg-red-50 hover:border-red-200 text-text-2 hover:text-red-600 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
