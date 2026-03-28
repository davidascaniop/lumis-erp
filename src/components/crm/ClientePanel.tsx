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
    <div className="h-full flex flex-col bg-surface-card w-full">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-display font-bold text-text-1 uppercase tracking-wider">Detalle del Lead</h2>
        <button onClick={onClose} className="p-2 bg-surface-base rounded-full hover:bg-surface-hover/10 text-text-3 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-display font-bold text-text-1 mb-1">{oportunidad.partners?.name || "Sin cliente"}</h3>
            <div className="flex items-center gap-3 text-sm text-text-3">
              {oportunidad.partners?.phone && (
                <span className="flex items-center gap-1 font-mono bg-surface-base px-2 py-0.5 rounded-md"><Phone className="w-3 h-3" /> {oportunidad.partners.phone}</span>
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
          <div className="p-4 rounded-xl border border-border bg-surface-base">
            <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-1 block">Temperatura (Score)</span>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold font-syne ${scoreColor.replace("bg-", "text-")}`}>{score}</span>
              <div className="flex-1 h-2 bg-surface-hover/10 rounded-full overflow-hidden">
                <div className={`h-full ${scoreColor} rounded-full transition-all`} style={{ width: `${score}%` }} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface-base">
             <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-1 block">Calificación</span>
             <div className="flex items-center gap-1 mt-1">
               {[1, 2, 3, 4, 5].map((s) => (
                 <button key={s} onClick={() => handleUpdateCalificacion(s)} className="p-1 hover:scale-110 hover:bg-surface-hover/10 rounded-md transition-all">
                   <Star className={`w-5 h-5 ${s <= (oportunidad.calificacion || 0) ? "text-status-warning fill-status-warning drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" : "text-border"}`} />
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-base flex justify-between items-center">
          <div>
             <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest block">Monto y Etapa</span>
             <span className="text-lg font-bold text-brand font-syne">{formatCurrency(oportunidad.monto_estimado)}</span>
          </div>
          <div className="text-right">
             <span className="text-[11px] font-bold text-text-3 font-mono uppercase bg-surface-elevated px-2 py-1 rounded-md">{oportunidad.etapa.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-sm font-bold text-text-1 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-brand" /> Timeline de Interacciones</h4>
            <button onClick={() => setAddingNote(!addingNote)} className="text-xs font-bold font-outfit text-brand hover:opacity-80 flex items-center gap-1 bg-brand/10 px-2 py-1 rounded-md">
              <Plus className="w-3 h-3" /> Añadir
            </button>
          </div>

          {addingNote && (
            <div className="p-4 rounded-xl border border-brand bg-brand/5 animate-in slide-in-from-top-2">
              <div className="flex gap-2 mb-3">
                <select 
                  value={notaOpcion} 
                  onChange={e => setNotaOpcion(e.target.value)}
                  className="bg-surface-base border border-border text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand"
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
                className="w-full bg-surface-base border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none min-h-[80px]"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setAddingNote(false)} className="px-3 py-1.5 text-xs text-text-3 hover:bg-surface-base rounded-lg font-semibold">Cancelar</button>
                <button onClick={handleSaveNota} className="px-3 py-1.5 text-xs bg-brand text-white rounded-lg font-semibold shadow-brand-lg">Guardar</button>
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
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pt-4">
              {interacciones.map(i => (
                <div key={i.id} className="relative flex items-start gap-4 z-10">
                  <div className="w-10 h-10 rounded-xl bg-surface-base border-2 border-border flex items-center justify-center flex-shrink-0 z-20 shadow-sm mt-1">
                    {i.tipo === 'whatsapp' ? <MessageSquare className="w-4 h-4 text-[#25D366]" /> :
                     i.tipo === 'llamada' ? <Phone className="w-4 h-4 text-brand" /> :
                     i.tipo === 'correo' ? <Mail className="w-4 h-4 text-[#EA4335]" /> :
                     i.tipo === 'reunion' ? <Calendar className="w-4 h-4 text-status-warning" /> :
                     <MessageSquare className="w-4 h-4 text-text-3" />}
                  </div>
                  <div className="flex-1 bg-surface-base border border-border p-3.5 rounded-xl rounded-tl-sm shadow-sm">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-text-3 tracking-widest bg-surface-hover/10 px-1.5 py-0.5 rounded">{i.tipo}</span>
                      <span className="text-[10px] text-text-3 font-mono">{format(new Date(i.created_at), 'dd MMM HH:mm')}</span>
                    </div>
                    <p className="text-sm text-text-1">{i.contenido}</p>
                    {i.agente?.full_name && <p className="text-[10px] text-text-3 mt-2 text-right opacity-60 font-semibold">— {i.agente.full_name}</p>}
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
