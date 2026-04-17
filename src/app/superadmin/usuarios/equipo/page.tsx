"use client";

import { useEffect, useState } from "react";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
import { 
  Shield, 
  Search, 
  Mail, 
  Loader2, 
  Plus, 
  Trash2, 
  Check, 
  Settings2,
  X 
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inviteAdminUser, updateUserPermissions } from "@/lib/actions/invitations";

export default function EquipoAdminPage() {
  const supabase = createSuperadminClient();
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Formulario de Invitación
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Permisos Específicos (alineados con el Sidebar del Super Admin)
  const [permissions, setPermissions] = useState({
    command_center: false,
    finances: false,
    reports: false,
    clients: false,
    daily_seed: false,
    communication: false,
    users: false,
    configuration: false
  });

  const PERMISSION_CONFIG = [
    { key: 'command_center', label: 'Command Center', color: 'bg-indigo-500 border-indigo-500', textHover: 'group-hover:text-indigo-500', badgeColor: 'bg-indigo-500' },
    { key: 'finances', label: 'Finanzas', color: 'bg-emerald-500 border-emerald-500', textHover: 'group-hover:text-emerald-500', badgeColor: 'bg-emerald-500' },
    { key: 'reports', label: 'Reportes', color: 'bg-sky-500 border-sky-500', textHover: 'group-hover:text-sky-500', badgeColor: 'bg-sky-500' },
    { key: 'clients', label: 'Clientes', color: 'bg-amber-500 border-amber-500', textHover: 'group-hover:text-amber-500', badgeColor: 'bg-amber-500' },
    { key: 'daily_seed', label: 'Semillas', color: 'bg-fuchsia-500 border-fuchsia-500', textHover: 'group-hover:text-fuchsia-500', badgeColor: 'bg-fuchsia-500' },
    { key: 'communication', label: 'Comunicación', color: 'bg-brand border-brand', textHover: 'group-hover:text-brand', badgeColor: 'bg-brand' },
    { key: 'users', label: 'Usuarios', color: 'bg-violet-500 border-violet-500', textHover: 'group-hover:text-violet-500', badgeColor: 'bg-violet-500' },
    { key: 'configuration', label: 'Config', color: 'bg-gray-600 border-gray-600', textHover: 'group-hover:text-gray-600', badgeColor: 'bg-gray-600' },
  ] as const;

  type PermissionKey = typeof PERMISSION_CONFIG[number]['key'];

  const togglePermission = (key: PermissionKey) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllPermissions = (val: boolean) => {
    setPermissions({
      command_center: val,
      finances: val,
      reports: val,
      clients: val,
      daily_seed: val,
      communication: val,
      users: val,
      configuration: val
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
        .in("role", ["superadmin", "system_admin", "soporte", "finanzas"])
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
    if (editingUserId) {
      return handleUpdatePermissions();
    }

    if (!inviteName || !inviteEmail) {
      toast.error("Completa el nombre y correo del invitado");
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await inviteAdminUser({
        name: inviteName,
        email: inviteEmail,
        permissions: permissions
      });

      if (res.success) {
        toast.success("Invitación enviada", { description: `Se ha enviado el acceso a ${inviteEmail}.` });
        await fetchTeam();
        setIsInviteModalOpen(false);
        resetForm();
      } else {
        toast.error("Error al invitar", { description: res.error || "Ocurrió un fallo inesperado." });
      }
    } catch (error: any) {
      toast.error("Error crítico", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingUserId) return;
    setIsProcessing(true);
    try {
      const res = await updateUserPermissions(editingUserId, permissions);
      if (res.success) {
         toast.success("Permisos actualizados correctamente");
         await fetchTeam();
         setIsInviteModalOpen(false);
         resetForm();
      } else {
         toast.error("No se pudieron actualizar los permisos", { description: res.error });
      }
    } catch (error: any){
      toast.error("Error crítico", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setInviteName("");
    setInviteEmail("");
    setEditingUserId(null);
    toggleAllPermissions(false);
  };

  const openEditModal = (member: any) => {
    setInviteName(member.full_name || "");
    setInviteEmail(member.email);
    setEditingUserId(member.id);
    if (member.permissions_json) {
       setPermissions({
         command_center: !!member.permissions_json.command_center,
         finances: !!member.permissions_json.finances,
         reports: !!member.permissions_json.reports,
         clients: !!member.permissions_json.clients,
         daily_seed: !!member.permissions_json.daily_seed,
         communication: !!member.permissions_json.communication,
         users: !!member.permissions_json.users,
         configuration: !!member.permissions_json.configuration,
       });
    } else {
       toggleAllPermissions(false);
    }
    setIsInviteModalOpen(true);
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
            onClick={() => { resetForm(); setIsInviteModalOpen(true); }}
            className="h-9 px-4 rounded-xl text-sm font-bold bg-brand text-white hover:opacity-90 flex items-center justify-center gap-2 transition-opacity whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Invitar Especialista</span>
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
                            {isSuperadminOwner ? 'Root' : 'Colaborador'}
                          </Badge>
                          {member.status === "pending_invite" && (
                            <div className="mt-1 text-[9px] text-status-warn font-bold uppercase flex items-center gap-1">
                              Pendiente
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 min-w-[200px]">
                          {isSuperadminOwner ? (
                             <span className="text-[10px] font-bold text-[#E040FB] flex items-center gap-1.5 bg-[#E040FB]/10 px-2 py-1 rounded w-max border border-[#E040FB]/20">
                               <Shield className="w-3 h-3" /> Acceso Total
                             </span>
                          ) : (
                             <div className="flex flex-wrap gap-1">
                               {PERMISSION_CONFIG.map(p => (
                                 member.permissions_json?.[p.key] && (
                                   <span key={p.key} className={`text-[9px] px-1.5 py-0.5 ${p.badgeColor} text-white rounded font-bold`}>{p.label}</span>
                                 )
                               ))}
                               {!Object.values(member.permissions_json || {}).some(Boolean) && (
                                 <span className="text-[9px] text-text-3 italic border border-border px-1.5 py-0.5 rounded bg-surface-base">Sin Accesos</span>
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
                              <button
                                onClick={() => openEditModal(member)}
                                title="Editar Permisos"
                                className="h-8 w-8 flex items-center justify-center bg-surface-base border border-border text-text-2 hover:text-brand hover:border-brand/40 rounded-lg transition-all"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
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
            <DialogTitle>{editingUserId ? 'Editar Permisos' : 'Invitar Miembro al Equipo'}</DialogTitle>
            <DialogDescription>
              {editingUserId 
                ? 'Actualiza el acceso granular a los módulos para este colaborador.'
                : 'El usuario recibirá un correo con un enlace seguro para establecer su propia contraseña y cuenta.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Nombre Completo</label>
              <Input 
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="bg-surface-card border-border"
                disabled={!!editingUserId}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Correo Electrónico</label>
              <Input 
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="juan.perez@empresa.com"
                className="bg-surface-card border-border"
                disabled={!!editingUserId}
              />
            </div>

            <div className="mt-2 p-4 bg-surface-card border border-border rounded-xl space-y-4">
               <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                 <label className="text-xs font-bold text-text-2 uppercase tracking-wider flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-brand" /> Matriz de Permisos</label>
                 <button 
                   type="button"
                   onClick={() => toggleAllPermissions(!Object.values(permissions).every(Boolean))}
                   className="text-[10px] font-bold uppercase tracking-wider text-brand hover:underline"
                 >
                    {Object.values(permissions).every(Boolean) ? "Desactivar Todo" : "Activar Todo"}
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 {PERMISSION_CONFIG.map(p => (
                   <button
                     key={p.key}
                     type="button"
                     onClick={() => togglePermission(p.key)}
                     className="flex items-center gap-3 cursor-pointer group text-left p-1 rounded-lg hover:bg-surface-base/50 transition-colors"
                   >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-200 ${permissions[p.key] ? p.color : 'bg-surface-base border-text-3'}`}>
                        {permissions[p.key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium text-text-1 ${p.textHover} transition-colors`}>{p.label}</span>
                   </button>
                 ))}
               </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-2 hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInvite}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-brand text-white hover:opacity-90 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingUserId ? <Shield className="w-4 h-4"/> : <Mail className="w-4 h-4" />)}
              {editingUserId ? 'Guardar Permisos' : 'Crear y Enviar Accesos'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
