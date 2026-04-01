"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Shield, 
  Search, 
  Mail, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  UserCheck, 
  UserX,
  X
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function EquipoAdminPage() {
  const supabase = createClient();
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Formulario de Invitación
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("soporte");
  
  // Permisos
  const [permissions, setPermissions] = useState({
    view_companies: false,
    manage_payments: false,
    toggle_accounts: false,
    view_reports: false
  });

  const toggleAllPermissions = (val: boolean) => {
    setPermissions({
      view_companies: val,
      manage_payments: val,
      toggle_accounts: val,
      view_reports: val
    });
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", "5a888a7b-aa3d-47f7-a517-37d94e9b4d45")
        .order("created_at", { ascending: true }); // Ascanio usually created first

      if (error) throw error;
      
      // Parse permissions if they are saved as string/JSON or default to Empty
      const parsedTeam = (data || []).map(u => ({
        ...u,
        permissions_json: typeof u.permissions === 'string' ? JSON.parse(u.permissions || '{}') : (u.permissions || {})
      }));

      // Forzar que David Ascanio esté de primero
      const sortedTeam = parsedTeam.sort((a, b) => {
        if (a.email === 'davidascaniop@gmail.com') return -1;
        if (b.email === 'davidascaniop@gmail.com') return 1;
        return 0;
      });

      setTeam(sortedTeam);
    } catch (error: any) {
      toast.error("Error al cargar el equipo", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail) {
      toast.error("Completa el nombre y correo del invitado");
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Inserción directa en public.users para que aparezca funcional en el panel.
      let { data, error } = await supabase
        .from("users")
        .insert({
          company_id: "5a888a7b-aa3d-47f7-a517-37d94e9b4d45",
          full_name: inviteName,
          email: inviteEmail.toLowerCase(),
          role: inviteRole,
          status: "pending_invite",
          is_active: true,
          permissions: permissions // Requiere que la DB tenga columna permissions (JSONB)
        })
        .select()
        .single();
        
      if (error) {
        // En caso de que no exista la columna permissions (Fallback)
        if (error.code === '42703') {
           const { data: d2, error: e2 } = await supabase
            .from("users")
            .insert({
              company_id: "5a888a7b-aa3d-47f7-a517-37d94e9b4d45",
              full_name: inviteName,
              email: inviteEmail.toLowerCase(),
              role: inviteRole,
              status: "pending_invite",
              is_active: true
            })
            .select()
            .single();
           if (e2) throw e2;
           data = d2;
        } else {
           throw error;
        }
      }

      toast.success("Invitación enviada", { description: `Se ha enviado el acceso a ${inviteEmail}` });
      setTeam([...team, { ...data, permissions_json: permissions }]);
      setIsInviteModalOpen(false);
      
      // Clear form
      setInviteName("");
      setInviteEmail("");
      setInviteRole("soporte");
      toggleAllPermissions(false);
      
    } catch (error: any) {
      toast.error("Error al invitar", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (userId: string, email: string) => {
    if (email === 'davidascaniop@gmail.com') return;
    
    if (!window.confirm("¿Seguro que deseas revocar el acceso y eliminar a este miembro del equipo?")) return;
    
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
      toast.success("Miembro eliminado exitosamente");
      setTeam(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      toast.error("Error al eliminar", { description: error.message });
    }
  };

  const filteredTeam = team.filter(member => {
    const term = search.toLowerCase();
    const fullName = (member.full_name || "").toLowerCase();
    return fullName.includes(term) || member.email?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Equipo Admin</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Gestiona los accesos y permisos de tu equipo de administración</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar miembro..."
              className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:border-brand/40 text-text-1 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="h-9 px-4 rounded-xl text-sm font-bold bg-brand text-white hover:opacity-90 flex items-center justify-center gap-2 transition-opacity whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Invitar al equipo</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
          <p className="text-sm font-medium text-text-2">Cargando equipo de administración...</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#f8f9fa] border-b border-border/50">
                <tr>
                  <th className="px-5 py-4 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider w-12">Avatar</th>
                  <th className="px-5 py-4 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Nombre y Email</th>
                  <th className="px-5 py-4 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Rol</th>
                  <th className="px-5 py-4 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Permisos</th>
                  <th className="px-5 py-4 text-left font-bold text-text-2 text-[10px] uppercase tracking-wider">Último acceso</th>
                  <th className="px-5 py-4 text-right font-bold text-text-2 text-[10px] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-text-3 italic">
                      No hay miembros registrados en el equipo.
                    </td>
                  </tr>
                ) : (
                  filteredTeam.map((member: any) => {
                    const isSuperadminOwner = member.email === 'davidascaniop@gmail.com';
                    const initials = member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase();
                    
                    return (
                      <tr key={member.id} className="hover:bg-white transition-colors">
                        <td className="px-5 py-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                            ${isSuperadminOwner ? 'bg-gradient-to-br from-brand to-[#7C4DFF] text-white' : 'bg-brand/10 text-brand'}`}
                          >
                            {initials}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-text-1">{member.full_name || "Usuario de Equipo"}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-text-3 text-xs font-medium">
                            <Mail className="w-3 h-3 text-text-3/70" /> {member.email}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider border
                            ${isSuperadminOwner 
                              ? 'bg-brand/10 text-brand border-brand/20' 
                              : 'bg-surface-base text-text-2 border-border'}`}
                          >
                            {isSuperadminOwner ? 'Superadmin' : member.role || 'Admin'}
                          </Badge>
                          {member.status === "pending_invite" && (
                            <div className="mt-1 text-[9px] text-status-warn font-bold uppercase flex items-center gap-1">
                              Invitado
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 min-w-[200px]">
                          {isSuperadminOwner ? (
                             <span className="text-[10px] font-bold text-[#E040FB] flex items-center gap-1.5 bg-[#E040FB]/10 px-2 py-1 rounded w-max border border-[#E040FB]/20">
                               <Shield className="w-3 h-3" /> Acceso Total Ilimitado
                             </span>
                          ) : (
                             <div className="flex flex-wrap gap-1">
                               {member.permissions_json?.view_companies && <span className="text-[9px] px-1.5 py-0.5 bg-surface-base border border-border rounded text-text-2">Ver Empresas</span>}
                               {member.permissions_json?.manage_payments && <span className="text-[9px] px-1.5 py-0.5 bg-surface-base border border-border rounded text-text-2">Pagos</span>}
                               {member.permissions_json?.toggle_accounts && <span className="text-[9px] px-1.5 py-0.5 bg-surface-base border border-border rounded text-text-2">Estados</span>}
                               {member.permissions_json?.view_reports && <span className="text-[9px] px-1.5 py-0.5 bg-surface-base border border-border rounded text-text-2">Reportes</span>}
                               {!Object.values(member.permissions_json || {}).some(Boolean) && (
                                 <span className="text-[9px] text-text-3 italic">Sin permisos esp.</span>
                               )}
                             </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-text-2">
                          {member.last_sign_in_at || member.updated_at 
                            ? format(new Date(member.last_sign_in_at || member.updated_at), "dd MMM, HH:mm", { locale: es }) 
                            : "Nunca"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {!isSuperadminOwner && (
                            <div className="flex items-center justify-end gap-2">
                              {/* Ocultamos edición visual por simplicidad, pero mostramos el botón gris inactivo/activo si se requiere o borrar */}
                              <button
                                onClick={() => handleDelete(member.id, member.email)}
                                title="Eliminar del equipo"
                                className="h-8 w-8 flex items-center justify-center bg-surface-base border border-border hover:border-status-danger text-text-2 hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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

      {/* Modal Invitar */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="bg-surface-base border-border rounded-2xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invitar Miembro del Equipo</DialogTitle>
            <DialogDescription>
              El usuario recibirá un email para crear su contraseña y acceder al panel Superadmin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Nombre Completo</label>
              <Input 
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ej. Yessica Tovar"
                className="bg-surface-card border-border"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Correo Electrónico</label>
              <Input 
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="yessica@empresa.com"
                className="bg-surface-card border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Rol Administrativo</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:border-brand/40 text-text-1"
              >
                <option value="admin">Administrador General</option>
                <option value="soporte">Agente de Soporte</option>
                <option value="finanzas">Analista de Finanzas</option>
              </select>
            </div>

            <div className="mt-2 p-4 bg-surface-card border border-border rounded-xl space-y-3">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-bold text-text-2 uppercase tracking-wider flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-brand" /> Permisos Específicos</label>
                 <button 
                   onClick={() => toggleAllPermissions(!permissions.view_companies)}
                   className="text-[10px] font-bold uppercase tracking-wider text-brand hover:underline"
                 >
                    {permissions.view_companies ? "Desactivar Todo" : "Acceso Total"}
                 </button>
               </div>
               
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${permissions.view_companies ? 'bg-brand border-brand' : 'bg-surface-base border-text-3'}`}>
                    {permissions.view_companies && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-text-1 group-hover:text-brand transition-colors">Ver empresas y usuarios</span>
               </label>

               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${permissions.manage_payments ? 'bg-brand border-brand' : 'bg-surface-base border-text-3'}`}>
                    {permissions.manage_payments && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-text-1 group-hover:text-brand transition-colors">Gestionar pagos y suscripciones</span>
               </label>
               
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${permissions.toggle_accounts ? 'bg-brand border-brand' : 'bg-surface-base border-text-3'}`}>
                    {permissions.toggle_accounts && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-text-1 group-hover:text-brand transition-colors">Suspender / activar cuentas</span>
               </label>

               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${permissions.view_reports ? 'bg-brand border-brand' : 'bg-surface-base border-text-3'}`}>
                    {permissions.view_reports && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-text-1 group-hover:text-brand transition-colors">Ver reportes del Command Center</span>
               </label>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-2 hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInvite}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand text-white hover:opacity-90 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar Invitación
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
