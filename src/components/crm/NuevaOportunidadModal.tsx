"use client";

import { useState, useEffect } from "react";
import { X, Save, Search, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface NuevaOportunidadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NuevaOportunidadModal({ open, onClose, onSuccess }: NuevaOportunidadModalProps) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchCliente, setSearchCliente] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: "", phone: "", rif: "" });
  const [creatingClientLoading, setCreatingClientLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: "",
    monto_estimado: 0,
    etapa: "prospecto",
    score: 50,
    notas: ""
  });

  const { user } = useUser();
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      setSearchCliente("");
      setSelectedCliente(null);
      setIsCreatingClient(false);
      setNewClientData({ name: "", phone: "", rif: "" });
      setFormData({
        titulo: "",
        monto_estimado: 0,
        etapa: "prospecto",
        score: 50,
        notas: ""
      });
      fetchClientes();
    }
  }, [open]);

  const fetchClientes = async (term?: string) => {
    if (!user?.company_id) return;
    
    let query = supabase
      .from("partners")
      .select("id, name, rif, phone")
      .eq("company_id", user.company_id)
      .limit(5);

    if (term) {
      query = query.ilike("name", `%${term}%`);
    }

    const { data } = await query;
    if (data) setClientes(data);
  };

  const handleCreateClient = async () => {
    if (!newClientData.name || !user?.company_id) return;
    setCreatingClientLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .insert({
        company_id: user.company_id,
        name: newClientData.name,
        phone: newClientData.phone,
        rif: newClientData.rif || null,
        status: "prospect"
      })
      .select()
      .single();
    
    setCreatingClientLoading(false);
    
    if (error) {
      toast.error("Error al crear el prospecto");
    } else if (data) {
      toast.success("Prospecto añadido");
      setSelectedCliente(data);
      setIsCreatingClient(false);
      setSearchCliente("");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchCliente) fetchClientes(searchCliente);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchCliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.company_id || !user?.id) return;
    if (!selectedCliente) {
      toast.error("Debes seleccionar un cliente");
      return;
    }
    if (!formData.titulo) {
      toast.error("El título es requerido");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("crm_oportunidades")
      .insert({
        company_id: user.company_id,
        cliente_id: selectedCliente.id,
        agente_id: user.id,
        titulo: formData.titulo,
        monto_estimado: formData.monto_estimado,
        etapa: formData.etapa,
        score: formData.score,
        notas: formData.notas
      });

    setLoading(false);

    if (error) {
      toast.error("Error al crear la oportunidad");
      console.error(error);
    } else {
      toast.success("Oportunidad creada exitosamente");
      onSuccess();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-base">
          <h2 className="text-xl font-display font-bold text-text-1">Nueva Oportunidad</h2>
          <button
            onClick={onClose}
            className="p-2 bg-surface-base rounded-full hover:bg-surface-hover/10 text-text-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form id="op-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Cliente Search */}
            <div>
              <label className="block text-sm font-bold text-text-2 mb-2 uppercase tracking-wide">
                Cliente
              </label>
              {!selectedCliente ? (
                <div className="relative">
                  {!isCreatingClient ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre..."
                          value={searchCliente}
                          onChange={(e) => setSearchCliente(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-surface-base border border-border rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-text-1"
                        />
                      </div>
                      
                      {/* Resultados del buscador */}
                      {searchCliente && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border rounded-xl shadow-lg z-10 p-2 overflow-hidden flex flex-col gap-1">
                          {clientes.length > 0 ? (
                            clientes.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelectedCliente(c)}
                                className="w-full text-left p-3 hover:bg-surface-base rounded-lg transition-colors flex justify-between items-center group"
                              >
                                <div>
                                  <p className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{c.name}</p>
                                  <p className="text-xs text-text-3 font-mono">{c.rif || "Sin RIF"}</p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-sm text-text-3 text-center">No se encontraron resultados en tu base de datos.</div>
                          )}
                          <div className="border-t border-border my-1"></div>
                          <button
                            type="button"
                            onClick={() => { setIsCreatingClient(true); setNewClientData(prev => ({ ...prev, name: searchCliente })); }}
                            className="w-full text-left p-3 bg-brand/5 hover:bg-brand/10 text-brand rounded-lg transition-colors flex justify-between items-center group text-sm font-bold border border-brand/20"
                          >
                            + Guardar a "{searchCliente}" como nuevo prospecto
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 border border-brand/50 bg-brand/5 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-brand uppercase tracking-wider">Registrar Prospecto Exprés</h3>
                        <button type="button" onClick={() => setIsCreatingClient(false)} className="text-xs text-text-3 hover:text-text-1 font-bold">Cancelar</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre completo o Empresa"
                        value={newClientData.name}
                        onChange={(e) => setNewClientData(p => ({...p, name: e.target.value}))}
                        className="w-full px-4 py-3 bg-surface-base border border-border rounded-xl text-sm text-text-1 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Teléfono (Opc.)"
                          value={newClientData.phone}
                          onChange={(e) => setNewClientData(p => ({...p, phone: e.target.value}))}
                          className="w-full px-4 py-3 bg-surface-base border border-border rounded-xl text-sm text-text-1 outline-none focus:border-brand"
                        />
                        <input
                          type="text"
                          placeholder="RIF (Opc.)"
                          value={newClientData.rif}
                          onChange={(e) => setNewClientData(p => ({...p, rif: e.target.value}))}
                          className="w-full px-4 py-3 bg-surface-base border border-border rounded-xl text-sm text-text-1 uppercase outline-none focus:border-brand"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateClient}
                        disabled={creatingClientLoading || !newClientData.name}
                        className="w-full py-3 bg-brand text-white rounded-xl text-sm font-bold shadow-brand-lg hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {creatingClientLoading ? "Guardando prospecto..." : "Guardar y Asociar a Oportunidad"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border border-brand/50 bg-brand/10 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-text-1">{selectedCliente.name}</p>
                    <p className="text-xs text-text-3 font-mono mt-0.5">{selectedCliente.rif || "Prospecto CRM sin RIF"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCliente(null)}
                    className="text-xs font-bold text-status-danger uppercase px-3 py-1.5 hover:bg-status-danger/10 rounded-lg transition-all"
                  >
                    Desvincular
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-text-2 mb-2 uppercase tracking-wide">
                  Título de la Oportunidad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Renovación de licencias"
                  value={formData.titulo}
                  onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-base border border-border rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-text-1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-2 mb-2 uppercase tracking-wide">
                  Etapa Inicial
                </label>
                <select
                  value={formData.etapa}
                  onChange={(e) => setFormData(p => ({ ...p, etapa: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-base border border-border rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-text-1 text-transform uppercase"
                >
                  <option value="prospecto">Prospecto</option>
                  <option value="cotizado">Cotizado</option>
                  <option value="por_cobrar">Por Cobrar</option>
                  <option value="cerrado_ganado">Cerrado Ganado</option>
                  <option value="cerrado_perdido">Cerrado Perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-2 mb-2 uppercase tracking-wide">
                  Monto Estimado ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monto_estimado || ""}
                  onChange={(e) => setFormData(p => ({ ...p, monto_estimado: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-surface-base border border-border rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all text-brand font-bold font-syne text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-2 mb-2 uppercase tracking-wide flex justify-between">
                  <span>Score (Temperatura)</span>
                  <span className={formData.score > 70 ? "text-status-warning" : "text-text-3"}>{formData.score}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData(p => ({ ...p, score: parseInt(e.target.value) }))}
                  className="w-full mt-4 h-2 bg-surface-base rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-2 mb-2 uppercase tracking-wide">
                Notas iniciales (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Detalles sobre qué requiere el cliente..."
                value={formData.notas}
                onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-base border border-border rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all resize-none text-text-1"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-surface-base flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-text-2 hover:bg-surface-hover/10 rounded-xl transition-all"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="op-form"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-bold shadow-brand-lg hover:opacity-90 disabled:opacity-50 transition-all font-outfit"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? "Creando..." : "Crear Oportunidad"}
          </button>
        </div>
      </div>
    </div>
  );
}
