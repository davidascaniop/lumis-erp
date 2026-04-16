"use client";

import { useEffect, useState } from "react";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
import { 
  Building2, 
  Search, 
  User, 
  Mail, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  UserX,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function EmpresasUsuariosPage() {
  const supabase = createSuperadminClient();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch companies with their users
      const { data: compData, error: compErr } = await supabase
        .from("companies")
        .select(`
          *,
          users (
            id,
            full_name,
            email,
            role,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (compErr) throw compErr;
      
      setCompanies(compData || []);
    } catch (error: any) {
      toast.error("Error al cargar datos", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanLimit = (planType: string) => {
    switch (planType?.toLowerCase()) {
      case "basic":
      case "starter": return 2;
      case "pro": return 10;
      case "enterprise": return 50;
      default: return 1;
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string | boolean) => {
    setProcessingUser(userId);
    try {
      // Determine what to toggle. We will try both just to be safe if we don't know the schema,
      // but typically we can just show a toast if no column works, or we can assume `is_active` exists.
      // Wait, let's just use `is_active` parameter.
      const userIsCurrentlyActive = typeof currentStatus === 'boolean' ? currentStatus : (currentStatus === 'active');
      const newStatusValue = !userIsCurrentlyActive;
      
      const updatePayload = { is_active: newStatusValue };

      const { error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", userId);

      if (error) throw error;

      toast.success("Estado de usuario actualizado");
      
      // Update local state
      setCompanies(prev => prev.map(comp => ({
        ...comp,
        users: comp.users.map((u: any) => 
          u.id === userId 
            ? { ...u, ...updatePayload }
            : u
        )
      })));
      
    } catch (error: any) {
      toast.error("Error al actualizar usuario", { description: error.message });
    } finally {
      setProcessingUser(null);
    }
  };

  // Filtrado de lado del cliente
  const filteredData = companies.filter(c => {
    const term = search.toLowerCase();
    const matchCompany = c.name?.toLowerCase().includes(term);
    const matchUser = c.users?.some((u: any) => 
      (u.full_name || "").toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
    return matchCompany || matchUser;
  });

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Empresas y sus Usuarios</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Directorio completo de usuarios por empresa</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar empresa, usuario o email..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:border-brand/40 text-text-1 placeholder:text-text-3 shadow-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
          <p className="text-sm font-medium text-text-2 text-center">Cargando directorio...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 bg-surface-base border border-dashed border-border rounded-2xl">
          <Building2 className="w-12 h-12 text-text-3/50 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-2">No se encontraron resultados</h3>
          <p className="text-sm font-medium text-text-3 mt-1">Intenta con otro término de búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((company) => {
            const users = company.users || [];
            const planLimit = getPlanLimit(company.plan_type);
            const userCount = users.length;
            const isLimitReached = userCount >= planLimit;
            const isExpanded = expandedId === company.id;

            return (
              <div 
                key={company.id} 
                className={`bg-surface-card border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${isExpanded ? 'border-brand/40 shadow-md shadow-brand/5' : 'border-border hover:border-brand/20'}`}
              >
                {/* Accordion Header */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : company.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors hover:bg-surface-hover/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm bg-gradient-to-br from-brand/80 to-brand shrink-0">
                      {company.name?.substring(0, 2).toUpperCase() || "C"}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-text-1 text-base">{company.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {company.subscription_status !== "demo" && (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-border text-text-2">
                            {company.plan_type || "Básico"}
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${
                          company.subscription_status === "active" ? "text-status-ok border-status-ok/20 bg-status-ok/5" : 
                          company.subscription_status === "trial" ? "text-status-warn border-status-warn/20 bg-status-warn/5" : 
                          company.subscription_status === "suspended" ? "text-status-danger border-status-danger/20 bg-status-danger/5" : 
                          company.subscription_status === "demo" ? "text-[#1E88E5] border-[#1E88E5]/20 bg-[#1E88E5]/5" :
                          "text-[#0288D1] border-[#0288D1]/20 bg-[#0288D1]/5"
                        }`}>
                          {company.subscription_status || "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-6 mt-4 md:mt-0">
                    <div className="flex flex-col items-center md:items-end">
                      <span className="text-[10px] font-bold text-text-3 uppercase tracking-wider mb-1">Usuarios</span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold text-sm ${
                        isLimitReached ? "bg-status-danger/10 border-status-danger/20 text-status-danger" : "bg-surface-base border-border text-text-1"
                      }`}>
                        <User className="w-4 h-4" />
                        {userCount}/{planLimit}
                      </div>
                    </div>
                    
                    {isLimitReached && (
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-danger/10 border border-status-danger/20 text-status-danger">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Límite Alcanzado</span>
                      </div>
                    )}

                    <div className="p-2 bg-surface-base border border-border rounded-lg text-text-2 transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Accordion Body: Users Table */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-surface-base">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-[#f8f9fa] border-b border-border/50">
                          <tr>
                            <th className="px-6 py-3 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Registro</th>
                            <th className="px-6 py-3 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right font-bold text-text-2 text-[10px] uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-text-3 italic">
                                Esta empresa no tiene usuarios registrados aún.
                              </td>
                            </tr>
                          ) : (
                            users.map((user: any) => {
                              const isActive = user.status ? user.status === 'active' : (user.is_active !== false);
                              
                              const isProcessingThis = processingUser === user.id;

                              return (
                                <tr key={user.id} className="hover:bg-white transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                                        {(user.full_name || user.email || "U")?.[0]?.toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-text-1">{user.full_name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-text-3 text-xs">
                                          <Mail className="w-3 h-3" /> {user.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-border text-text-2">
                                      {user.role || 'user'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-text-2">
                                    {user.created_at ? format(new Date(user.created_at), "dd/MMM/yyyy", { locale: es }) : "N/D"}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                      isActive 
                                        ? "bg-status-ok/10 text-status-ok border-status-ok/20" 
                                        : "bg-surface-card text-text-3 border-border"
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-status-ok' : 'bg-text-3'}`} />
                                      {isActive ? "Activo" : "Inactivo"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => toggleUserStatus(user.id, isActive)}
                                      disabled={isProcessingThis}
                                      title={isActive ? "Desactivar usuario" : "Activar usuario"}
                                      className={`h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all border ${
                                        isActive 
                                          ? "bg-surface-base border-border text-text-2 hover:border-status-danger hover:text-status-danger hover:bg-status-danger/5" 
                                          : "bg-surface-base border-border text-text-2 hover:border-status-ok hover:text-status-ok hover:bg-status-ok/5"
                                      }`}
                                    >
                                      {isProcessingThis ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : isActive ? (
                                        <><UserX className="w-3.5 h-3.5" /> Suspender</>
                                      ) : (
                                        <><UserCheck className="w-3.5 h-3.5" /> Activar</>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
