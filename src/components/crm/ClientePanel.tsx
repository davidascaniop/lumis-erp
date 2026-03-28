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
      toast.success("Nota añadida");
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
    <div className="h-full flex flex-col bg-surface-base border-l border-border/50 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden relative shadow-2xl">
      {/* Dynamic Background Blur Effects (Silicon Valley Style) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand/5 blur-[100px] -ml-32 -mb-32 pointer-events-none" />

      {/* Header Section */}
      <div className="flex items-start justify-between p-10 pb-6 relative z-10">
        <div className="space-y-1">
          <h2 className="text-[10px] font-montserrat font-black uppercase tracking-[0.3em] text-text-3 opacity-60">Lead Information</h2>
          <h3 className="text-4xl font-montserrat font-black text-text-1 tracking-tight leading-none group cursor-default">
            {oportunidad.partners?.name || "No Name"}
            <span className="block h-1 w-0 bg-brand group-hover:w-full transition-all duration-500 rounded-full mt-2" />
          </h3>
        </div>
        <button onClick={onClose} className="p-3 bg-surface-card border border-border/50 rounded-2xl hover:bg-surface-hover/20 text-text-2 hover:text-text-1 transition-all hover:scale-110 active:scale-95 shadow-lg group">
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-10 pb-8 space-y-10 pt-2 relative z-10">
        
        {/* Contact Strip */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {oportunidad.partners?.phone && (
              <a href={`tel:${oportunidad.partners.phone}`} className="flex items-center gap-2 font-mono bg-surface-card border border-border/40 px-4 py-2 rounded-2xl text-[11px] font-bold text-text-2 hover:border-brand/40 hover:text-text-1 transition-all group shadow-sm">
                <Phone className="w-3.5 h-3.5 text-brand group-hover:scale-110 transition-transform" /> 
                {oportunidad.partners.phone}
              </a>
            )}
            {oportunidad.partners?.email && (
              <a href={`mailto:${oportunidad.partners.email}`} className="flex items-center justify-center p-2 bg-surface-card border border-border/40 rounded-2xl text-text-3 hover:text-brand transition-all hover:border-brand/40 shadow-sm">
                <Mail className="w-4 h-4" />
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

        {/* Dynamic Score Cards */}
        <div className="grid grid-cols-2 gap-5">
          <div className="group relative">
            <div className="absolute inset-0 bg-brand/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="p-6 rounded-[2rem] border border-border/50 bg-surface-card/40 backdrop-blur-md shadow-sm relative z-10 transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[9px] font-montserrat font-black text-text-3 uppercase tracking-widest pl-1">Lead Score</span>
                <Flame className={`w-4 h-4 ${scoreTextColor} opacity-60`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-montserrat font-black ${scoreTextColor} tracking-tighter`}>{score}</span>
                <span className="text-sm font-black text-text-3 opacity-30">/100</span>
              </div>
              <div className="w-full h-1 bg-surface-base/50 rounded-full overflow-hidden mt-6">
                <div className={`h-full ${scoreBgColor} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-status-warn/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="p-6 rounded-[2rem] border border-border/50 bg-surface-card/40 backdrop-blur-md shadow-sm relative z-10 transition-all hover:-translate-y-1">
              <span className="text-[9px] font-montserrat font-black text-text-3 uppercase tracking-widest pl-1 block mb-6">Qualification</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => handleUpdateCalificacion(s)} className="p-0.5 transition-transform hover:scale-125 active:scale-90">
                    <Star className={`w-6 h-6 ${s <= (oportunidad.calificacion || 0) ? "text-status-warn fill-status-warn drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" : "text-border/40"}`} />
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-text-3 mt-6 opacity-40 uppercase tracking-tighter">Verified Lead Quality</p>
            </div>
          </div>
        </div>

        {/* Deal Banner */}
        <div className="p-8 rounded-[2.5rem] border border-brand/10 bg-gradient-to-br from-brand/5 to-transparent relative overflow-hidden shadow-inner group">
          <div className="absolute top-0 right-0 p-10 -mr-10 -mt-10 bg-brand/10 blur-3xl rounded-full opacity-40 animate-pulse" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div className="space-y-1">
               <span className="text-[10px] font-montserrat font-black text-brand uppercase tracking-[0.2em] block mb-2 opacity-80">Deal Value & Stage</span>
               <div className="flex flex-col">
                 <span className="text-4xl font-montserrat font-black text-brand tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">
                    {formatCurrency(oportunidad.monto_estimado)}
                 </span>
               </div>
            </div>
            <div className="flex items-center justify-center px-6 py-2.5 bg-brand text-white text-[10px] font-montserrat font-black uppercase tracking-widest rounded-2xl shadow-brand transform hover:rotate-2 transition-transform">
              {oportunidad.etapa.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8 pt-4">
          <div className="flex items-center justify-between border-b border-border/20 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h4 className="text-[12px] font-montserrat font-black text-text-1 uppercase tracking-widest">Lead Timeline</h4>
                <p className="text-[11px] text-text-3 font-semibold opacity-50">Recent engagement events</p>
              </div>
            </div>
            <button onClick={() => setAddingNote(!addingNote)} className="h-10 px-6 rounded-2xl bg-surface-card border border-border/40 text-[10px] font-montserrat font-black uppercase tracking-wider text-text-1 hover:bg-brand hover:text-white hover:border-brand transition-all shadow-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>

          {addingNote && (
            <div className="p-6 rounded-[2rem] border border-brand bg-brand/5 shadow-brand-lg animate-in zoom-in-95 duration-300">
              <div className="flex gap-2 mb-4">
                <select 
                  value={notaOpcion} 
                  onChange={e => setNotaOpcion(e.target.value)}
                  className="bg-surface-card border border-border/30 font-montserrat font-black uppercase tracking-wider text-[10px] rounded-xl px-4 py-2 focus:outline-none focus:border-brand shadow-sm text-text-1"
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
                placeholder="Type the interaction details..."
                className="w-full bg-surface-card border border-border/30 rounded-2xl p-5 text-sm font-outfit focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none min-h-[120px] shadow-inner text-text-1"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setAddingNote(false)} className="px-6 py-2.5 text-[10px] uppercase font-montserrat font-black text-text-3 hover:text-text-1 transition-all">Cancel</button>
                <button onClick={handleSaveNota} className="px-8 py-2.5 text-[11px] uppercase font-montserrat font-black bg-brand text-white rounded-xl shadow-brand-lg hover:opacity-90 transition-all">Save Event</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand/20" />
              <span className="text-[10px] font-montserrat font-black text-text-3 uppercase tracking-widest animate-pulse">Synchronizing Data</span>
            </div>
          ) : interacciones.length === 0 ? (
            <div className="py-20 text-center bg-surface-card/20 rounded-[2rem] border border-dashed border-border/40">
              <MessageSquare className="w-12 h-12 text-text-3/10 mx-auto mb-4" />
              <p className="text-[10px] text-text-3 uppercase tracking-[0.2em] font-black opacity-30">Quiet pipeline - No events recorded yet</p>
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[25px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-brand/20 before:via-border/40 before:to-transparent pt-4">
              {interacciones.map(i => (
                <div key={i.id} className="relative flex items-start gap-8 z-10 group">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-surface-card border border-border/40 flex items-center justify-center flex-shrink-0 z-20 shadow-xl mt-1 transition-all group-hover:bg-brand group-hover:border-brand group-hover:scale-110">
                    {i.tipo === 'whatsapp' ? <MessageSquare className="w-5 h-5 text-[#25D366] group-hover:text-white" /> :
                     i.tipo === 'llamada' ? <Phone className="w-5 h-5 text-brand group-hover:text-white" /> :
                     i.tipo === 'correo' ? <Mail className="w-5 h-5 text-status-danger group-hover:text-white" /> :
                     i.tipo === 'reunion' ? <Calendar className="w-5 h-5 text-status-warn group-hover:text-white" /> :
                     <MessageSquare className="w-5 h-5 text-text-3 group-hover:text-white" />}
                  </div>
                  <div className="flex-1 bg-surface-card/40 backdrop-blur-sm border border-border/40 p-6 rounded-[2rem] rounded-tl-sm shadow-sm hover:border-brand/20 transition-all group-hover:-translate-y-1">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[9px] font-montserrat uppercase font-black text-text-1 tracking-[0.2em] border border-border/40 px-3 py-1 rounded-full group-hover:border-brand/40 group-hover:text-brand transition-colors">{i.tipo}</span>
                      <span className="text-[10px] text-text-3 font-mono font-black opacity-40">{format(new Date(i.created_at), 'MMM dd, HH:mm')}</span>
                    </div>
                    <p className="text-[14px] text-text-1 font-outfit leading-7">{i.contenido}</p>
                    {i.agente?.full_name && (
                      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border/20">
                         <span className="text-[9px] font-montserrat uppercase font-black text-text-3 tracking-widest opacity-60">Handled by</span>
                         <span className="text-[10px] font-montserrat font-black text-brand tracking-tight">{i.agente.full_name}</span>
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
