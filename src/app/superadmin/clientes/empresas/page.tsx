"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Eye, Loader2, Search, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit2, Save } from "lucide-react";

export default function EmpresasPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    plan_type: "starter",
    subscription_status: "active",
    grace_period_days: 0,
  });

  const fetchCompanies = async () => {
    setIsLoading(true);
    let query = supabase
      .from("companies")
      .select(`id, name, plan_type, subscription_status, created_at, owner_email, settings`)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (statusFilter !== "all") {
      query = query.eq("subscription_status", statusFilter);
    }

    const { data } = await query;
    setCompanies(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, [search, statusFilter]);

  const handleImpersonate = (companyId: string) => {
    alert(`Modo Dios: Iniciando sesión en la empresa ${companyId}... \n(Requiere integración de Custom Claims en Backend)`);
  };

  const handleEdit = (company: any) => {
    const gracePeriod = company.settings?.grace_period_days || 0;
    setEditForm({
      plan_type: company.plan_type || "starter",
      subscription_status: company.subscription_status || "active",
      grace_period_days: gracePeriod,
    });
    setEditingCompany(company);
  };

  const saveCompany = async () => {
    if (!editingCompany) return;
    setIsSaving(true);
    try {
      const newSettings = { ...editingCompany.settings, grace_period_days: editForm.grace_period_days };
      const { error } = await supabase
        .from("companies")
        .update({
          plan_type: editForm.plan_type,
          subscription_status: editForm.subscription_status,
          settings: newSettings,
        } as any)
        .eq("id", editingCompany.id);

      if (error) throw error;
      toast.success("Empresa actualizada");
      setEditingCompany(null);
      fetchCompanies();
    } catch (err: any) {
      toast.error("Error al actualizar la empresa: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-1">Directorio Operativo</h1>
          <p className="text-sm font-medium text-text-2 mt-1">
            Gestión de empresas registradas ({companies.length})
          </p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-4 py-2 bg-surface-base border border-border rounded-xl text-sm focus:outline-none focus:border-brand/40 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
           {["all", "active", "trial", "pending_verification", "suspended"].map((st) => (
             <button
               key={st}
               onClick={() => setStatusFilter(st)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                 statusFilter === st 
                   ? "bg-brand text-white shadow-md shadow-brand/20" 
                   : "bg-surface-base border border-border text-text-2 hover:bg-surface-hover hover:text-text-1"
               }`}
             >
               {st === "all" ? "Todas" : st === "pending_verification" ? "Pendientes" : st}
             </button>
           ))}
           {search && (
             <button onClick={() => setSearch("")} className="p-1 text-text-3 hover:text-status-danger transition-colors">
               <X className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-surface-base border-b border-border/50">
              <tr>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider w-16">Logo</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Empresa</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Plan</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Estatus</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 whitespace-nowrap text-xs uppercase tracking-wider">Registro</th>
                <th className="px-5 py-4 text-right font-bold text-text-1 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-text-3 italic font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-brand" />
                      <p>Cargando directorio...</p>
                    </div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-text-3 font-medium">
                    No se encontraron empresas con esos criterios.
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-hover/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-brand/80 to-brand">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-text-1 text-sm">{c.name}</div>
                      <div className="text-xs text-text-3 font-medium mt-0.5">{c.owner_email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className="bg-brand/5 text-brand border-brand/20 uppercase font-black text-[9px] tracking-widest px-2">
                        {c.plan_type || 'Básico'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {c.subscription_status === "active" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-ok/10 text-status-ok text-[10px] font-bold uppercase tracking-wider border border-status-ok/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-ok" /> Activa
                        </span>
                      )}
                      {c.subscription_status === "trial" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-warn/10 text-status-warn text-[10px] font-bold uppercase tracking-wider border border-status-warn/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-warn" /> Trial
                        </span>
                      )}
                      {c.subscription_status === "pending_verification" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-info/10 text-[#0288D1] text-[10px] font-bold uppercase tracking-wider border border-[#0288D1]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1] animate-pulse" /> Pendiente
                        </span>
                      )}
                      {c.subscription_status === "suspended" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-danger/10 text-status-danger text-[10px] font-bold uppercase tracking-wider border border-status-danger/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-danger" /> Morosa
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-text-2 font-medium whitespace-nowrap">
                      {format(new Date(c.created_at), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Editar suscripción y plan"
                          onClick={() => handleEdit(c)}
                          className="h-9 w-9 flex items-center justify-center bg-surface-base border border-border hover:border-brand text-text-2 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Modo Dios (Impersonate)"
                          onClick={() => handleImpersonate(c.id)}
                          className="h-9 w-9 flex items-center justify-center bg-surface-base border border-border hover:border-brand text-text-2 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editingCompany} onOpenChange={(val) => !val && setEditingCompany(null)}>
        <DialogContent className="bg-surface-base border-border rounded-2xl w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Empresa: {editingCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">Plan de Suscripción</label>
              <select
                value={editForm.plan_type}
                onChange={(e) => setEditForm(prev => ({...prev, plan_type: e.target.value}))}
                className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none"
              >
                <option value="starter">Lumis Starter ($19.99)</option>
                <option value="pro">Lumis Pro Business ($79.99)</option>
                <option value="enterprise">Lumis Enterprise ($119.99)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">Estado de la cuenta</label>
              <select
                value={editForm.subscription_status}
                onChange={(e) => setEditForm(prev => ({...prev, subscription_status: e.target.value}))}
                className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none"
              >
                <option value="active">Activa (App operando normal)</option>
                <option value="suspended">Suspendida (Bloqueo de login)</option>
                <option value="trial">Trial (Prueba gratuita)</option>
                <option value="pending_verification">Pendiente Verificación</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-2 uppercase">Días Extra de Gracia</label>
              <input
                type="number"
                value={editForm.grace_period_days}
                onChange={(e) => setEditForm(prev => ({...prev, grace_period_days: Number(e.target.value)}))}
                className="w-full px-3 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none"
                min="0"
                step="1"
              />
              <p className="text-[10px] text-text-3">Permitir entrada a la app sin pago confirmado este # de días extra.</p>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditingCompany(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-2 hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={saveCompany}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand text-white hover:opacity-90 flex items-center gap-2 transition-opacity disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
