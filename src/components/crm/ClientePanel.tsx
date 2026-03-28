"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Phone, Mail, Star, Flame, Loader2, MessageSquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { WhatsAppButton } from "./WhatsAppButton";

interface ClientePanelProps {
  oportunidad: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function ClientePanel({ oportunidad, onClose, onUpdate }: ClientePanelProps) {
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [notaOpcion, setNotaOpcion] = useState("nota");
  const [nuevaNota, setNuevaNota] = useState("");
  const supabase = createClient();
  const { user } = useUser();

  useEffect(() => {
    fetchInteracciones();
  }, [oportunidad.id]);

  const fetchInteracciones = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_interacciones")
      .select("*, agente:agente_id(full_name)")
      .eq("cliente_id", oportunidad.cliente_id)
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (data) setInteracciones(data);
    setLoading(false);
  };

  const handleUpdateCalificacion = async (rating: number) => {
    const { error } = await supabase
      .from("crm_oportunidades")
      .update({ calificacion: rating })
      .eq("id", oportunidad.id);
      
    if (!error) onUpdate();
    else toast.error("Error al calificar");
  };

  const handleSaveNota = async () => {
    if (!nuevaNota.trim() || !user) return;
    
    const { error } = await supabase
      .from("crm_interacciones")
      .insert({
        company_id: user.company_id,
        cliente_id: oportunidad.cliente_id,
        oportunidad_id: oportunidad.id,
        tipo: notaOpcion,
        contenido: nuevaNota,
        agente_id: user.id
      });
      
    if (!error) {
      toast.success("Evento guardado");
      setNuevaNota("");
      setAddingNote(false);
      fetchInteracciones();
    } else {
      toast.error("Error al guardar");
    }
  };

  const score = oportunidad.score || 0;
  const scoreTextColor = score < 40 ? "text-danger" : score < 70 ? "text-warn" : "text-ok";
  const scoreBgColor = score < 40 ? "bg-danger" : score < 70 ? "bg-warn" : "bg-ok";

  return (
    <div className="h-full flex flex-col bg-surface-base/80 backdrop-blur-3xl animate-in slide-in-from-right-1 duration-500 overflow-hidden relative shadow-nav border-l border-border/10">
      
      {/* Dynamic Background Hints (Silicon Valley Style) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 blur-[120px] -mr-40 -mt-40 pointer-events-none opacity-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand/5 blur-[120px] -ml-40 -mb-40 pointer-events-none opacity-40" />

      {/* Modern Slim Header */}
      <div className="flex items-center justify-between p-12 py-10 relative z-10">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 mb-1.5 opacity-60">
             <div className="w-1 h-1 rounded-full bg-brand" />
             <span className="text-[10px] font-montserrat font-black uppercase tracking-[0.25em] text-text-2">Lead details</span>
          </div>
          <h3 className="text-2xl font-montserrat font-black text-text-1 tracking-tight leading-tight max-w-[320px]">
            {oportunidad.partners?.name || "No name"}
          </h3>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 bg-surface-base border border-border/50 rounded-2xl hover:bg-surface-hover/10 text-text-3 hover:text-text-1 transition-all hover:scale-105 active:scale-95 shadow-sm ml-4 group"
        >
          <X className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-12 pb-12 pt-2 relative z-10 flex flex-col gap-12">
        
        {/* Simplified Action Strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {oportunidad.partners?.phone && (
              <a href={`tel:${oportunidad.partners.phone}`} className="flex items-center gap-2 font-mono bg-surface-card border border-border/40 px-3.5 py-2 rounded-xl text-[10px] font-bold text-text-2 hover:border-brand/40 hover:text-text-1 transition-all shadow-sm group">
                <Phone className="w-3 h-3 text-brand/60 group-hover:text-brand transition-colors" /> 
                {oportunidad.partners.phone}
              </a>
            )}
            {oportunidad.partners?.email && (
              <a href={`mailto:${oportunidad.partners.email}`} className="flex items-center justify-center p-2.5 bg-surface-card border border-border/40 rounded-xl text-text-3 hover:text-brand transition-all hover:border-brand/40 shadow-sm border-dashed">
                <Mail className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {oportunidad.partners?.phone && (
             <WhatsAppButton 
               telefono={oportunidad.partners.phone} 
               nombre={oportunidad.partners.name} 
               clienteId={oportunidad.cliente_id}
               oportunidadId={oportunidad.id}
             />
          )}
        </div>

        {/* Sublime Simplified Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-[1.5rem] border border-border/30 bg-surface-card/30 backdrop-blur-sm shadow-card hover:shadow-elevated transition-shadow group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <Flame className={`w-10 h-10 ${scoreTextColor} opacity-40`} />
            </div>
            <span className="text-[9px] font-montserrat font-black text-text-3 uppercase tracking-widest block mb-1.5 opacity-60">Lead Score</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-montserrat font-black ${scoreTextColor} tracking-tighter`}>{score}</span>
              <span className="text-[10px] font-black text-text-3/40">pts</span>
            </div>
            <div className="w-full h-1 bg-surface-base/50 rounded-full overflow-hidden mt-6">
              <div className={`h-full ${scoreBgColor} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
            </div>
          </div>

          <div className="p-6 rounded-[1.5rem] border border-border/30 bg-surface-card/30 backdrop-blur-sm shadow-card hover:shadow-elevated transition-shadow relative overflow-hidden">
             <span className="text-[9px] font-montserrat font-black text-text-3 uppercase tracking-widest block mb-4 opacity-60">Qualification</span>
             <div className="flex items-center gap-1">
               {[1, 2, 3, 4, 5].map((s) => (
                 <button key={s} onClick={() => handleUpdateCalificacion(s)} className="p-0.5 transition-transform hover:scale-125 active:scale-95">
                   <Star className={`w-5 h-5 ${s <= (oportunidad.calificacion || 0) ? "text-warn fill-warn drop-shadow-[0_0_8px_rgba(255,184,0,0.3)]" : "text-border/40"}`} />
                 </button>
               ))}
             </div>
             <p className="text-[9px] font-bold text-text-3/40 mt-6 uppercase tracking-widest">Verified quality</p>
          </div>
        </div>

        {/* Minimalist Stage Banner */}
        <div className="p-7 px-8 rounded-[2rem] border border-border/20 bg-surface-card/20 backdrop-blur relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-brand/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 w-full">
            <div className="space-y-1">
               <span className="text-[9px] font-montserrat font-black text-text-3 uppercase tracking-[0.2em] block">Deal value</span>
               <span className="text-3xl font-montserrat font-black text-text-1 tracking-tighter transition-all">
                  {formatCurrency(oportunidad.monto_estimado)}
               </span>
            </div>
            <div className="px-5 py-2.5 bg-brand/10 border border-brand/20 text-brand text-[9px] font-montserrat font-black uppercase tracking-widest rounded-xl shadow-brand-sm group-hover:bg-brand group-hover:text-white transition-all transform hover:scale-105 active:scale-95">
              {oportunidad.etapa.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Refined Timeline */}
        <div className="space-y-10 pt-4 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:bg-brand group-hover:border-brand transition-all">
                <MessageSquare className="w-3.5 h-3.5 text-brand group-hover:text-white transition-colors" />
              </div>
              <div>
                <h4 className="text-[11px] font-montserrat font-black text-text-1 uppercase tracking-widest leading-none">Activity log</h4>
                <p className="text-[9px] text-text-3/60 font-semibold uppercase tracking-tighter mt-1">Timeline events</p>
              </div>
            </div>
            <button 
              onClick={() => setAddingNote(!addingNote)} 
              className="px-5 h-9 rounded-xl bg-surface-base border border-border/40 text-[9px] font-montserrat font-black uppercase tracking-widest text-text-3 hover:text-brand hover:border-brand/40 transition-all flex items-center gap-2 group shadow-sm active:scale-95"
            >
              <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Event
            </button>
          </div>

          {addingNote && (
            <div className="p-6 rounded-[1.5rem] border border-brand/40 bg-brand/5 animate-in zoom-in-95 duration-300">
              <div className="flex gap-2 mb-4">
                <select 
                  value={notaOpcion} 
                  onChange={e => setNotaOpcion(e.target.value)}
                  className="bg-surface-card border border-border/30 font-montserrat font-black uppercase tracking-wider text-[9px] rounded-xl px-3.5 py-1.5 focus:outline-none focus:border-brand/40 shadow-sm text-text-2 group"
                >
                  <option value="nota">Note</option>
                  <option value="llamada">Call</option>
                  <option value="reunion">Meeting</option>
                  <option value="correo">Email</option>
                </select>
              </div>
              <textarea 
                value={nuevaNota}
                onChange={e => setNuevaNota(e.target.value)}
                placeholder="Log activity details..."
                className="w-full bg-surface-base/50 border border-border/30 rounded-xl p-4 text-[13px] font-outfit focus:outline-none focus:ring-1 focus:ring-brand/20 resize-none min-h-[100px] text-text-1 placeholder:opacity-30"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setAddingNote(false)} className="px-5 py-2 text-[9px] uppercase font-montserrat font-black text-text-3 hover:text-danger opacity-60 hover:opacity-100 transition-all tracking-widest">Cancel</button>
                <button 
                  onClick={handleSaveNota} 
                  className="px-7 py-2 text-[9px] uppercase font-montserrat font-black bg-brand text-white rounded-xl shadow-brand-lg hover:opacity-90 transition-all tracking-widest"
                >
                  Log Event
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand/30" />
              <span className="text-[9px] font-montserrat font-black text-text-3/40 uppercase tracking-[0.2em] animate-pulse">Syncing events</span>
            </div>
          ) : interacciones.length === 0 ? (
            <div className="py-20 text-center bg-surface-card/10 rounded-[1.5rem] border border-dashed border-border/30">
              <MessageSquare className="w-10 h-10 text-text-3/10 mx-auto mb-3" />
              <p className="text-[9px] text-text-3/40 uppercase tracking-[0.25em] font-black">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-10 relative before:absolute before:inset-0 before:ml-[18px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-brand/10 before:via-border/40 before:to-transparent pt-2">
              {interacciones.map(i => (
                <div key={i.id} className="relative flex items-start gap-10 z-10 group">
                  <div className="w-9 h-9 rounded-xl bg-surface-base border border-border/50 flex items-center justify-center flex-shrink-0 z-20 shadow-sm mt-1 group-hover:bg-brand group-hover:border-brand group-hover:scale-105 transition-all duration-300">
                    {i.tipo === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5 text-[#25D366] group-hover:text-white" /> :
                     i.tipo === 'llamada' ? <Phone className="w-3.5 h-3.5 text-brand group-hover:text-white" /> :
                     i.tipo === 'correo' ? <Mail className="w-3.5 h-3.5 text-danger group-hover:text-white" /> :
                     i.tipo === 'reunion' ? <Calendar className="w-3.5 h-3.5 text-warn group-hover:text-white" /> :
                     <MessageSquare className="w-3.5 h-3.5 text-text-3 group-hover:text-white" />}
                  </div>
                  <div className="flex-1 bg-surface-card/10 backdrop-blur-sm border border-border/30 p-5 pl-7 rounded-[1.5rem] rounded-tl-sm shadow-sm hover:border-brand/10 transition-all hover:bg-surface-card/30">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[8px] font-montserrat uppercase font-black text-text-1 tracking-[0.1em] border border-border/40 px-3 py-0.5 rounded-full group-hover:border-brand/40 group-hover:text-brand transition-colors bg-surface-base/50">{i.tipo}</span>
                      <span className="text-[9px] text-text-3 font-mono font-bold opacity-30">{format(new Date(i.created_at), 'dd MMM, HH:mm')}</span>
                    </div>
                    <p className="text-[13px] text-text-1 font-outfit leading-7 opacity-90">{i.contenido}</p>
                    {i.agente?.full_name && (
                      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border/10">
                         <span className="text-[8px] font-montserrat uppercase font-black text-text-3 tracking-[0.15em] opacity-40">Handled by</span>
                         <span className="text-[9px] font-montserrat font-black text-brand tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{i.agente.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
