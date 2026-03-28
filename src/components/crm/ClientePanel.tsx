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
      toast.success("Nota agregada");
      setNuevaNota("");
      setAddingNote(false);
      fetchInteracciones();
    } else {
      toast.error("Error al guardar nota");
    }
  };

  const score = oportunidad.score || 0;
  const scoreColor = score < 40 ? "bg-status-danger" : score < 70 ? "bg-status-warning" : "bg-status-ok";

  return (
    <div className="h-full flex flex-col w-full bg-surface-base">
      <div className="flex items-center justify-between p-8 pb-4 relative z-10">
        <h2 className="text-[13px] font-display font-black text-text-1 uppercase tracking-[0.2em] opacity-80">Detalle del Lead</h2>
        <button onClick={onClose} className="p-2.5 bg-surface-card shadow-sm border border-border/50 rounded-full hover:bg-surface-hover/10 text-text-2 hover:text-text-1 transition-all hover:scale-105 active:scale-95">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8 space-y-6 pt-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-3xl font-display font-black text-text-1 mb-3 tracking-tight">{oportunidad.partners?.name || "Sin cliente"}</h3>
            <div className="flex items-center gap-3">
              {oportunidad.partners?.phone && (
                <span className="flex items-center gap-1.5 font-mono bg-surface-card border border-border/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-2 shadow-sm">
                  <Phone className="w-3.5 h-3.5" /> {oportunidad.partners.phone}
                </span>
              )}
            </div>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl border border-border/60 bg-surface-card shadow-sm hover:border-brand/30 transition-all">
            <span className="text-[10px] font-black font-display text-text-3 uppercase tracking-widest mb-2 block">Temperatura (Score)</span>
            <div className="flex flex-col gap-2 mt-4">
              <span className={`text-4xl font-black font-display ${scoreColor.replace("bg-", "text-")} tracking-tighter`}>{score}°</span>
              <div className="w-full h-1.5 bg-surface-hover/10 rounded-full overflow-hidden mt-1">
                <div className={`h-full ${scoreColor} rounded-full transition-all`} style={{ width: `${score}%` }} />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl border border-border/60 bg-surface-card shadow-sm hover:border-brand/30 transition-all">
             <span className="text-[10px] font-black font-display text-text-3 uppercase tracking-widest mb-2 block">Calificación</span>
             <div className="flex items-center gap-1 mt-6">
               {[1, 2, 3, 4, 5].map((s) => (
                 <button key={s} onClick={() => handleUpdateCalificacion(s)} className="p-1 hover:scale-110 hover:bg-surface-hover/10 rounded-xl transition-all">
                   <Star className={`w-6 h-6 ${s <= (oportunidad.calificacion || 0) ? "text-status-warning fill-status-warning drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" : "text-border"}`} />
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-brand/20 bg-brand/5 flex justify-between items-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
             <span className="text-[10px] font-black font-display text-brand uppercase tracking-widest block mb-1">Monto y Etapa</span>
             <span className="text-3xl font-black text-brand font-display tracking-tight">{formatCurrency(oportunidad.monto_estimado)}</span>
          </div>
          <div className="text-right relative z-10">
             <span className="text-[10px] font-black font-display text-text-2 bg-surface-card px-3 py-2 rounded-xl uppercase tracking-widest shadow-sm border border-border/50">{oportunidad.etapa.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <h4 className="text-[13px] font-display font-black text-text-1 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand" /> Timeline de Interacciones
            </h4>
            <button onClick={() => setAddingNote(!addingNote)} className="text-[10px] uppercase tracking-widest font-black font-display text-text-1 hover:text-white flex items-center gap-1.5 bg-brand/10 hover:bg-brand text-brand hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-sm">
              <Plus className="w-3 h-3" /> Añadir
            </button>
          </div>

          {addingNote && (
            <div className="p-4 rounded-2xl border border-brand bg-brand/5 shadow-brand-lg animate-in slide-in-from-top-4">
              <div className="flex gap-2 mb-3">
                <select 
                  value={notaOpcion} 
                  onChange={e => setNotaOpcion(e.target.value)}
                  className="bg-surface-card border border-border/50 font-outfit font-bold uppercase tracking-wider text-[11px] rounded-xl px-3 py-2 focus:outline-none focus:border-brand shadow-sm text-text-1"
                >
                  <option value="nota">📝 Nota interna</option>
                  <option value="llamada">📞 Llamada</option>
                  <option value="reunion">🤝 Reunión</option>
                  <option value="correo">📧 Correo</option>
                </select>
              </div>
              <textarea 
                value={nuevaNota}
                onChange={e => setNuevaNota(e.target.value)}
                placeholder="Escribe el detalle de la interacción..."
                className="w-full bg-surface-card border border-border/50 rounded-xl p-4 text-sm font-outfit focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none min-h-[100px] shadow-inner text-text-1"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setAddingNote(false)} className="px-5 py-2 text-[11px] uppercase tracking-wider font-black font-display text-text-3 hover:text-text-1 hover:bg-surface-hover/10 rounded-xl transition-all">Cancelar</button>
                <button onClick={handleSaveNota} className="px-5 py-2 text-[11px] uppercase tracking-wider font-black font-display bg-brand text-white rounded-xl shadow-brand-lg hover:opacity-90 transition-all">Guardar</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-text-3 mx-auto" /></div>
          ) : interacciones.length === 0 ? (
            <div className="py-8 text-center bg-surface-base rounded-xl border border-dashed border-border">
              <MessageSquare className="w-8 h-8 text-text-3/40 mx-auto mb-2" />
              <p className="text-xs text-text-3 uppercase tracking-widest font-bold">Sin interacciones previas</p>
            </div>
          ) : (
            <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[26px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pt-4">
              {interacciones.map(i => (
                <div key={i.id} className="relative flex items-start gap-5 z-10 group">
                  <div className="w-12 h-12 rounded-2xl bg-surface-card border-2 border-border/50 flex items-center justify-center flex-shrink-0 z-20 shadow-sm mt-1 transition-transform group-hover:scale-110 group-hover:border-brand/40">
                    {i.tipo === 'whatsapp' ? <MessageSquare className="w-5 h-5 text-[#25D366]" /> :
                     i.tipo === 'llamada' ? <Phone className="w-5 h-5 text-brand" /> :
                     i.tipo === 'correo' ? <Mail className="w-5 h-5 text-[#EA4335]" /> :
                     i.tipo === 'reunion' ? <Calendar className="w-5 h-5 text-status-warning" /> :
                     <MessageSquare className="w-5 h-5 text-text-3" />}
                  </div>
                  <div className="flex-1 bg-surface-card border border-border/50 p-5 rounded-3xl rounded-tl-sm shadow-sm hover:border-border transition-colors group-hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-display uppercase font-black text-text-1 tracking-widest bg-surface-base border border-border/50 px-2.5 py-1 rounded-md">{i.tipo}</span>
                      <span className="text-[10px] text-text-3 font-mono font-semibold">{format(new Date(i.created_at), 'dd MMM HH:mm')}</span>
                    </div>
                    <p className="text-[13px] text-text-1 font-outfit leading-relaxed">{i.contenido}</p>
                    {i.agente?.full_name && <p className="text-[9px] font-display uppercase font-black text-text-3 mt-4 text-right opacity-60">— {i.agente.full_name}</p>}
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
