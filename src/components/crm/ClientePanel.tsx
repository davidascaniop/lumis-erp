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
      toast.success("Actividad registrada");
      setNuevaNota("");
      setAddingNote(false);
      fetchInteracciones();
    } else {
      toast.error("Error al guardar actividad");
    }
  };

  const score = oportunidad.score || 0;
  const scoreTextColor = score < 40 ? "text-danger" : score < 70 ? "text-warn" : "text-ok";
  const scoreBgColor = score < 40 ? "bg-danger" : score < 70 ? "bg-warn" : "bg-ok";

  return (
    <div className="h-full flex flex-col bg-[#F8F9FA] border-l border-border/60 animate-in slide-in-from-right-1 duration-300 overflow-hidden relative">
      
      {/* Cabecera Limpia */}
      <div className="flex items-center justify-between p-10 pb-6">
        <div className="space-y-1">
          <span className="text-[11px] font-montserrat font-black uppercase tracking-widest text-text-3">Detalles del Prospecto</span>
          <h3 className="text-2xl font-montserrat font-black text-text-1">
            {oportunidad.partners?.name || "Sin nombre"}
          </h3>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-surface-hover rounded-xl text-text-3 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-10 pb-10 space-y-8">
        
        {/* Contacto */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {oportunidad.partners?.phone && (
              <a href={`tel:${oportunidad.partners.phone}`} className="flex items-center gap-2 bg-white border border-border/40 px-3 py-1.5 rounded-lg text-[12px] font-bold text-text-2 hover:border-brand transition-colors">
                <Phone className="w-3.5 h-3.5 text-brand" /> 
                {oportunidad.partners.phone}
              </a>
            )}
            {oportunidad.partners?.email && (
              <a href={`mailto:${oportunidad.partners.email}`} className="flex items-center justify-center p-2 bg-white border border-border/40 rounded-lg text-text-3 hover:text-brand transition-colors">
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

        {/* Score y Calificación Simplificados */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-border/40 shadow-sm">
            <span className="text-[10px] font-black text-text-3 uppercase tracking-wider block mb-4">Puntuación</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${scoreTextColor}`}>{score}</span>
              <span className="text-[10px] font-bold text-text-3 opacity-40">pts</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
               <div className={`h-full ${scoreBgColor}`} style={{ width: `${score}%` }} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-border/40 shadow-sm">
             <span className="text-[10px] font-black text-text-3 uppercase tracking-wider block mb-4">Calificación</span>
             <div className="flex items-center gap-1">
               {[1, 2, 3, 4, 5].map((s) => (
                 <button key={s} onClick={() => handleUpdateCalificacion(s)}>
                   <Star className={`w-5 h-5 ${s <= (oportunidad.calificacion || 0) ? "text-warn fill-warn" : "text-border/40"}`} />
                 </button>
               ))}
             </div>
             <p className="text-[9px] font-bold text-text-3 opacity-40 mt-4 uppercase">Calidad Verificada</p>
          </div>
        </div>

        {/* Valor de Negocio - CORREGIDO PARA VISIBILIDAD */}
        <div className="p-6 rounded-2xl bg-brand/5 border border-brand/20 flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <div className="space-y-1">
               <span className="text-[10px] font-black text-brand uppercase tracking-widest block">Valor del Negocio</span>
               <span className="text-3xl font-montserrat font-black text-text-1">
                  {formatCurrency(oportunidad.monto_estimado)}
               </span>
             </div>
             <div className="px-3 py-1 bg-brand text-white text-[9px] font-black uppercase rounded-lg">
               {oportunidad.etapa.replace('_', ' ')}
             </div>
          </div>
        </div>

        {/* Actividades */}
        <div className="space-y-6 flex-1">
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-brand" />
              <h4 className="text-[12px] font-black text-text-1 uppercase tracking-widest">Historial</h4>
            </div>
            <button 
              onClick={() => setAddingNote(!addingNote)} 
              className="px-3 py-1.5 rounded-lg border border-border/60 text-[10px] font-black uppercase text-text-3 hover:text-brand hover:border-brand transition-all flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> Evento
            </button>
          </div>

          {addingNote && (
            <div className="p-5 rounded-xl border border-brand/3 bg-white shadow-lg space-y-4">
              <select 
                value={notaOpcion} 
                onChange={e => setNotaOpcion(e.target.value)}
                className="w-full bg-gray-50 border border-border/30 rounded-lg px-3 py-2 text-[11px] font-black uppercase text-text-2"
              >
                <option value="nota">Nota</option>
                <option value="llamada">Llamada</option>
                <option value="reunion">Reunión</option>
                <option value="correo">Correo</option>
              </select>
              <textarea 
                value={nuevaNota}
                onChange={e => setNuevaNota(e.target.value)}
                placeholder="Detalles de la actividad..."
                className="w-full bg-gray-50 border border-border/30 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:border-brand text-text-1"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setAddingNote(false)} className="px-4 py-2 text-[10px] font-black uppercase text-text-3">Cancelar</button>
                <button onClick={handleSaveNota} className="px-5 py-2 bg-brand text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-brand/20">Guardar</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand/30" />
              <span className="text-[10px] font-black text-text-3 opacity-40 uppercase">Cargando...</span>
            </div>
          ) : interacciones.length === 0 ? (
            <div className="py-10 text-center opacity-30">
              <p className="text-[10px] font-black uppercase">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-px before:bg-border/30 pt-2">
              {interacciones.map(i => (
                <div key={i.id} className="relative flex items-start gap-5 z-10 group">
                  <div className="w-8 h-8 rounded-lg bg-white border border-border/40 flex items-center justify-center flex-shrink-0 z-20 shadow-sm mt-1">
                    {i.tipo === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" /> :
                     i.tipo === 'llamada' ? <Phone className="w-3.5 h-3.5 text-brand" /> :
                     i.tipo === 'correo' ? <Mail className="w-3.5 h-3.5 text-danger" /> :
                     i.tipo === 'reunion' ? <Calendar className="w-3.5 h-3.5 text-warn" /> :
                     <MessageSquare className="w-3.5 h-3.5 text-text-3" />}
                  </div>
                  <div className="flex-1 bg-white border border-border/30 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-text-2 uppercase bg-gray-100 px-2 py-0.5 rounded border border-border/20">{i.tipo}</span>
                      <span className="text-[9px] text-text-3 font-mono opacity-50">{format(new Date(i.created_at), 'dd/MM HH:mm')}</span>
                    </div>
                    <p className="text-[13px] text-text-1 leading-relaxed">{i.contenido}</p>
                    {i.agente?.full_name && (
                      <div className="mt-3 pt-2 border-t border-border/10 flex justify-end items-center gap-1.5">
                         <span className="text-[8px] font-black text-text-3 opacity-40 uppercase">Por</span>
                         <span className="text-[9px] font-black text-brand">{i.agente.full_name}</span>
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
