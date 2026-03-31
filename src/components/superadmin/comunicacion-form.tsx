"use client";
import { useState, useEffect } from "react";
import { createBroadcast } from "@/lib/actions/superadmin";
import { toast } from "sonner";
import { Send, Clock, Layout, Smartphone, Bell, AlertTriangle, Info, CheckCircle, Settings, X, Loader2 } from "lucide-react";

interface ComunicacionFormProps {
  planCounts: Record<string, number>;
}

export function ComunicacionForm({ planCounts }: ComunicacionFormProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "maintenance">("info");
  const [target, setTarget] = useState("all");
  const [channel, setChannel] = useState("app"); // app o email
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const getTargetLabel = () => {
    switch(target) {
      case 'all': return `Todas las empresas (${planCounts.all})`;
      case 'emprendedor': return `Plan Emprendedor (${planCounts.emprendedor})`;
      case 'crecimiento': return `Plan Crecimiento (${planCounts.crecimiento})`;
      case 'corporativo': return `Plan Corporativo (${planCounts.corporativo})`;
      default: return target;
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    try {
      await createBroadcast({ 
        title, 
        message, 
        type, 
        target,
        channel,
        scheduled_for: isScheduled ? scheduledAt : null 
      });
      toast.success(
        isScheduled 
          ? `Anuncio programado para ${new Date(scheduledAt).toLocaleString()}`
          : `Anuncio enviado a ${getTargetLabel()}`
      );
      setTitle("");
      setMessage("");
      setShowConfirmModal(false);
    } catch {
      toast.error("Error procesando la comunicación");
    } finally {
      setLoading(false);
    }
  };

  const TYPE_CONFIG = {
    info: { color: "text-blue-500", bg: "bg-blue-50", icon: Info, label: "Info" },
    warning: { color: "text-orange-500", bg: "bg-orange-50", icon: AlertTriangle, label: "Aviso" },
    success: { color: "text-emerald-500", bg: "bg-emerald-50", icon: CheckCircle, label: "Novedad" },
    maintenance: { color: "text-gray-500", bg: "bg-gray-100", icon: Settings, label: "Mantenimiento" },
  };

  const currentType = TYPE_CONFIG[type];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8">
        
        {/* COLUMNA IZQUIERDA: EDITOR */}
        <div className="bg-surface-card border border-border rounded-[2rem] p-8 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
             <h2 className="font-heading text-xl font-bold text-text-1">Redactar Comunicado</h2>
             <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setChannel("app")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${channel === "app" ? "bg-brand text-white border-brand shadow-md shadow-brand/20" : "bg-surface-base text-text-2 border-border hover:bg-surface-hover"}`}>
                    Banner en App
                 </button>
                 <button 
                  onClick={() => setChannel("email")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${channel === "email" ? "bg-brand text-white border-brand shadow-md shadow-brand/20" : "bg-surface-base text-text-2 border-border hover:bg-surface-hover"}`}>
                    Correo Electrónico
                 </button>
             </div>
          </div>

          <div className="space-y-6">
            {/* Título + Destinatarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-bold text-text-2 uppercase tracking-widest pl-1">Asunto / Título *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Actualización de sistema"
                    className="w-full bg-surface-base border border-border rounded-xl px-4 py-3 text-sm text-text-1 focus:ring-4 focus:ring-brand/10 transition-all outline-none"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-bold text-text-2 uppercase tracking-widest pl-1">Destinatarios</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-surface-base border border-border rounded-xl px-4 py-3 text-sm text-text-1 focus:ring-4 focus:ring-brand/10 transition-all outline-none cursor-pointer"
                  >
                    <option value="all">Todas las empresas ({planCounts.all})</option>
                    <option value="emprendedor">Plan Emprendedor ({planCounts.emprendedor})</option>
                    <option value="crecimiento">Plan Crecimiento ({planCounts.crecimiento})</option>
                    <option value="corporativo">Plan Corporativo ({planCounts.corporativo})</option>
                  </select>
               </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-widest pl-1">Tipo de Mensaje</label>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => setType(key as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${type === key ? `${cfg.bg} ${cfg.color} border-current/20 shadow-sm` : "bg-surface-base text-text-2 border-border hover:bg-surface-hover"}`}
                        >
                          <cfg.icon className="w-4 h-4" />
                          {cfg.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
                 <label className="text-[11px] font-bold text-text-2 uppercase tracking-widest pl-1">Mensaje Central *</label>
                 <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Escribe el contenido detallado de tu anuncio..."
                    className="w-full bg-surface-base border border-border rounded-xl px-4 py-4 text-sm text-text-1 focus:ring-4 focus:ring-brand/10 transition-all outline-none resize-none leading-relaxed"
                 />
            </div>

            {/* Programación */}
            <div className="p-5 bg-surface-base border border-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${isScheduled ? 'bg-orange-50 text-orange-600' : 'bg-surface-hover text-text-2'}`}>
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-1">Programar Envío</p>
                        <p className="text-xs font-medium text-text-3">Elige una fecha futura para disparar el mensaje</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setIsScheduled(!isScheduled)}
                        className={`w-12 h-6 rounded-full relative transition-all shadow-inner border shadow-[#0000000a] ${isScheduled ? 'bg-orange-500 border-orange-600' : 'bg-gray-200 border-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isScheduled ? 'left-[26px]' : 'left-1'}`} />
                     </button>
                     {isScheduled && (
                        <input
                           type="datetime-local"
                           value={scheduledAt}
                           onChange={(e) => setScheduledAt(e.target.value)}
                           className="bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-text-1 outline-none"
                        />
                     )}
                 </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!title.trim() || !message.trim() || loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white
                                   bg-gradient-to-r from-brand to-brand-hover
                                   shadow-lg shadow-brand/20
                                   hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isScheduled ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {isScheduled ? "Confirmar Programación" : "Lanzar Comunicación"}
                </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        <div className="hidden lg:flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 text-text-2">
                <Smartphone className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider text-center">Vista Previa Dashboard Cliente</span>
            </div>

            {/* Simulación Dashboard */}
            <div className="w-full h-[650px] bg-slate-50 rounded-[2.5rem] border-[12px] border-surface-card shadow-xl relative overflow-hidden flex flex-col p-6 space-y-6">
                
                {/* Header Mockup */}
                <div className="flex items-center justify-between mb-2">
                    <div className="w-24 h-6 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                    </div>
                </div>

                {/* Grid Mockup */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100" />
                    <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100" />
                </div>

                {/* EL ANUNCIO REAL */}
                {channel === "app" ? (
                   <div className={`p-5 rounded-2xl border-2 transition-all shadow-lg animate-bounce-subtle
                                   ${type === 'warning' ? 'bg-orange-50 border-orange-200' :
                                     type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                                     type === 'maintenance' ? 'bg-gray-100 border-gray-200' :
                                     'bg-blue-50 border-blue-200'}`}>
                       <div className="flex items-start gap-4">
                           <div className={`p-2.5 rounded-xl ${currentType.bg} ${currentType.color} border border-current/10`}>
                               <currentType.icon className="w-6 h-6" />
                           </div>
                           <div className="flex-1">
                               <h4 className={`text-sm font-black mb-1 truncate ${currentType.color}`}>
                                    {title || "Título del Anuncio"}
                               </h4>
                               <p className="text-xs font-semibold text-slate-600 leading-relaxed line-clamp-3">
                                    {message || "El mensaje que escribas a la izquierda aparecerá aquí en tiempo real para simular la experiencia del usuario final..."}
                               </p>
                           </div>
                       </div>
                   </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[300px]">
                        <div className="bg-slate-800 p-4 shrink-0 flex justify-center">
                            <div className="h-6 w-20 bg-white/20 rounded" />
                        </div>
                        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                            <h4 className="text-lg font-black text-slate-800 leading-tight">
                                {title || "Asunto del Correo"}
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                                {message || "Contenido del correo electrónico..."}
                            </p>
                            <div className="pt-4">
                                <div className="bg-brand h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Feed Mockup */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                     <div className="h-3 w-1/2 bg-slate-100 rounded" />
                     <div className="h-3 w-full bg-slate-100 rounded" />
                     <div className="h-3 w-4/5 bg-slate-100 rounded" />
                </div>
            </div>
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
               <div className="p-8 pb-4">
                   <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <AlertTriangle className="w-10 h-10 text-orange-600" />
                   </div>
                   <h3 className="text-2xl font-black text-text-1 text-center mb-2">Confirmar Envío</h3>
                   <p className="text-center text-text-2 font-medium">
                      Estás a punto de enviar este comunicado por el canal <span className="font-bold text-brand">{channel === 'app' ? 'BANNER APP' : 'CORREO'}</span> a:
                   </p>
                   <div className="mt-4 p-3 bg-surface-base rounded-2xl border border-border flex items-center justify-center gap-3">
                       <Layout className="w-5 h-5 text-brand" />
                       <span className="font-black text-lg text-text-1">{getTargetLabel()}</span>
                   </div>
                   {isScheduled && (
                      <p className="mt-4 text-center text-orange-600 font-bold bg-orange-50 py-2 rounded-xl border border-orange-100">
                         🗓️ Programado para: {new Date(scheduledAt).toLocaleString()}
                      </p>
                   )}
               </div>

               <div className="p-8 pt-6 flex gap-3">
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold bg-surface-base hover:bg-surface-hover text-text-2 transition-all">
                        Cancelar
                    </button>
                    <button 
                      onClick={handleSend}
                      disabled={loading}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Enviar"}
                    </button>
               </div>
               
               <button 
                 onClick={() => setShowConfirmModal(false)}
                 className="absolute top-4 right-4 p-2 text-text-3 hover:text-text-1 transition-colors">
                  <X className="w-5 h-5" />
               </button>
           </div>
        </div>
      )}
    </>
  );
}
