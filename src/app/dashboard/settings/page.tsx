"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Save,
  User,
  Building2,
  Bell,
  Shield,
  KeyRound,
  Loader2,
  CreditCard,
  Sparkles,
  AlertCircle,
  Users,
  Plus,
  Trash2,
  Mail,
  CheckCircle2,
  X,
  Zap,
  UtensilsCrossed,
  Puzzle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Suspense } from "react";
import { CommissionRulesEditor } from "@/components/users/commission-rules-editor";
import { Percent } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { updateUserFullName } from "@/lib/actions/profile";
import { inviteCompanyUser, deleteCompanyUser } from "@/lib/actions/users";
import { INVITE_ROLES, ROLE_DEFINITIONS, AppRole, ROLE_SECTION_ACCESS } from "@/lib/constants/roles";

function SettingsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useUser();
  const currentModules: string[] = user?.companies?.modules_enabled || [];

  // Setup initial tab from URL if present
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profile, setProfile] = useState<{
    full_name: string;
    email: string;
    role: string;
    company_id: string;
  } | null>(null);
  const [company, setCompany] = useState<{
    id: string;
    name: string;
    name_comercial: string;
    rif: string;
    plan_type: string;
    subscription_status: string;
  } | null>(null);
  const [bcvRate, setBcvRate] = useState("56.42");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Force active tab for non-admins
  useEffect(() => {
    if (user && user.role !== "admin" && activeTab !== "variables") {
      setActiveTab("variables");
    }
  }, [user, activeTab]);

  // Create use modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState<{
    name: string;
    email: string;
    role: string;
    permissions: string[];
  }>({
    name: "",
    email: "",
    role: "vendedor",
    permissions: [],
  });

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      // Fetch Global BCV
      const { data: bcvData } = await supabase
        .from("exchange_rates")
        .select("rate_bs")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single();
      if (bcvData) setBcvRate(bcvData.rate_bs.toString());
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("full_name, email, role, company_id")
          .eq("auth_id", user.id)
          .single();

        if (userData) {
          const uData = userData as any;
          setProfile(uData);

          if (uData.company_id) {
            const { data: companyData } = await supabase
              .from("companies")
              .select("id, name, name_comercial, rif, plan_type, subscription_status, billing_day, modules_enabled")
              .eq("id", uData.company_id)
              .single();

            if (companyData) {
              setCompany(companyData as any);
            }

            // Load team members
            const { data: teamData } = await supabase
              .from("users")
              .select("id, auth_id, full_name, email, role")
              .eq("company_id", uData.company_id);

            const { data: pendingData } = await supabase
              .from("company_invitations")
              .select("id, email, role, status, permissions")
              .eq("company_id", uData.company_id)
              .eq("status", "pendiente");

            const combined = [
              ...(teamData || []).map((m: any) => ({ ...m, isPending: false })),
              ...(pendingData || []).map((m: any) => ({
                id: m.id,
                full_name: m.email.split("@")[0],
                email: m.email,
                role: m.role,
                isPending: true,
                auth_id: null,
                permissions: m.permissions || []
              }))
            ];

            setTeamMembers(combined as any);
          }
        }
      }
      setIsFetching(false);
    }
    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // 1. Update full_name via server action (bypasses client-side RLS restrictions)
      if (profile?.full_name) {
        const result = await updateUserFullName(profile.full_name);
        if (!result.success) {
          throw new Error(result.error ?? "No se pudo actualizar el nombre");
        }
      }

      // 2. Update Company name fields if changed
      if (company && profile?.company_id) {
        const { error: companyError } = await supabase
          .from("companies")
          .update({
            name: company.name,
            name_comercial: company.name_comercial,
          })
          .eq("id", profile.company_id);

        if (companyError) throw companyError;
      }

      // 3. Refresh user context so sidebar name updates instantly
      await refreshUser();

      toast.success("Perfil y Empresa actualizados correctamente");
    } catch (err: any) {
      toast.error("Error al guardar cambios", { description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVariables = async () => {
    if (!bcvRate || isNaN(Number(bcvRate))) {
      toast.error("Por favor ingresa una tasa válida");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from("exchange_rates").insert({
        rate_bs: Number(bcvRate),
      });
      if (error) throw error;

      toast.success("Tasa BCV actualizada globalmente");
      window.dispatchEvent(new Event("bcv-update"));
      // Optional: force reload next time or let polling take over.
    } catch (error: any) {
      toast.error("Error guardando tasa: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    toast.info("Conectando con pasarela de pagos...", {
      description: "Funcionalidad de Stripe próximamente.",
    });
  };

  const handleInviteUser = async () => {
    if (!inviteData.name || !inviteData.email) {
      toast.error("Completa todos los campos");
      return;
    }

    if (!profile?.company_id) {
      toast.error("No tienes una compañía asociada para invitar usuarios");
      return;
    }

    setIsLoading(true);

    const res = await inviteCompanyUser(
      inviteData.email,
      inviteData.name,
      inviteData.role,
      profile.company_id,
      user?.id || "",
      inviteData.permissions
    );

    setIsLoading(false);

    if (res.success) {
      setShowInviteModal(false);
      
      // Añadimos al estado local para evitar recargar toda la página (optimistic UI)
      const newUser = {
        id: Math.random().toString(), 
        full_name: inviteData.name,
        email: inviteData.email,
        role: inviteData.role,
        isPending: true, // Flag local
      };
      setTeamMembers([...teamMembers, newUser]);
      setInviteData({ name: "", email: "", role: "vendedor", permissions: [] });
      
      toast.success(`Invitación oficial enviada a ${inviteData.email}`);
    } else {
      toast.error(res.error || "Error al invitar usuario");
    }
  };

  const handleResendInvite = async (member: any) => {
    setIsLoading(true);
    const res = await inviteCompanyUser(
      member.email,
      member.full_name,
      member.role,
      profile?.company_id || "",
      user?.id || "",
      member.permissions || []
    );
    setIsLoading(false);

    if (res.success) {
      toast.success(`Reenviada la invitación a ${member.email}`);
    } else {
      toast.error(res.error || "Error al reenviar invitación");
    }
  };

  const handleRemoveUser = async (member: any) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${member.full_name}?`)) return;
    
    setIsLoading(true);
    try {
      const res = await deleteCompanyUser(
        member.auth_id,
        member.id,
        profile?.company_id || "",
        user?.auth_id || ""
      );

      if (res.success) {
        setTeamMembers(teamMembers.filter((m) => m.id !== member.id));
        toast.success("Usuario eliminado correctamente");
      } else {
        toast.error(res.error || "Error al eliminar usuario");
      }
    } catch (error: any) {
      toast.error("Error inesperado: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComingSoon = () => {
    toast.info("Próximamente", {
      description:
        "Esta sección estará disponible en la próxima actualización.",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-1 mb-2">
          Configuración
        </h1>
        <p className="text-text-2">
          Administra tu perfil, la imagen de tu empresa y preferencias del
          sistema.
        </p>
      </div>

      <CommissionRulesEditor 
        open={showCommissionModal}
        onOpenChange={setShowCommissionModal}
        user={selectedMember}
        onSuccess={() => {
          // Re-fetch users to get updated rules
          window.location.reload(); 
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar para Settings */}
        <div className="space-y-2">
          {user?.role === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === "profile" ? "bg-[#E040FB]/10 text-[#E040FB] border border-[#E040FB]/30" : "text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] border border-transparent"}`}
              >
                <User className="w-5 h-5" />
                Perfil y Empresa
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === "users" ? "bg-[#E040FB]/10 text-[#E040FB] border border-[#E040FB]/30" : "text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] border border-transparent"}`}
              >
                <Users className="w-5 h-5" />
                Usuarios y Roles
              </button>
            </>
          )}
          
          <button
            onClick={() => setActiveTab("variables")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === "variables" ? "bg-[#E040FB]/10 text-[#E040FB] border border-[#E040FB]/30" : "text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] border border-transparent"}`}
          >
            <Building2 className="w-5 h-5" />
            Variables Globales
          </button>

          {user?.role === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("subscription")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === "subscription" ? "bg-[#E040FB]/10 text-[#E040FB] border border-[#E040FB]/30" : "text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] border border-transparent"}`}
              >
                <CreditCard className="w-5 h-5" />
                Suscripción y Planes
              </button>
              <button
                onClick={handleComingSoon}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] transition-colors font-medium border border-transparent"
              >
                <Bell className="w-5 h-5" />
                Notificaciones
              </button>
              <button
                onClick={handleComingSoon}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] transition-colors font-medium border border-transparent"
              >
                <Shield className="w-5 h-5" />
                Seguridad
              </button>
              <button
                onClick={() => setActiveTab("modules")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === "modules" ? "bg-[#E040FB]/10 text-[#E040FB] border border-[#E040FB]/30" : "text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] border border-transparent"}`}
              >
                <Puzzle className="w-5 h-5" />
                Módulos
              </button>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB: PROFILE */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-surface-card border border-border/50 shadow-card rounded-2xl p-6">
                <h2 className="text-xl font-bold font-montserrat text-text-1 mb-6">
                  Logo de tu Empresa
                </h2>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-surface-base border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-brand transition-colors overflow-hidden relative shadow-sm">
                    <Upload className="w-6 h-6 text-brand group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] text-text-3 font-bold uppercase tracking-wider">
                      Subir logo
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-text-1 font-bold font-montserrat">
                      Sube el logotipo de tu organización.
                    </p>
                    <p className="text-xs text-text-2 font-medium">
                      Se recomienda un formato .PNG cuadrado (ej. 512x512) sin
                      fondo. Este logo aparecerá en el dashboard y en las
                      facturas/notas de entrega.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2 bg-white border-border/60 text-text-2 hover:bg-surface-base font-bold rounded-xl px-6"
                    >
                      Seleccionar Archivo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-surface-card border border-border/50 shadow-card rounded-2xl p-6">
                <h2 className="text-xl font-bold font-montserrat text-text-1 mb-6">
                  Información General
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold font-montserrat text-text-1">Nombre Completo</Label>
                    <Input
                      value={profile?.full_name || ""}
                      onChange={(e) =>
                        setProfile((prev) => prev ? { ...prev, full_name: e.target.value } : null)
                      }
                      placeholder={isFetching ? "Cargando..." : "Juan Pérez"}
                      className="bg-surface-input border border-border/40 text-text-1 focus-visible:ring-brand/50 rounded-xl h-11 font-medium shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold font-montserrat text-text-1">
                      Correo Electrónico (Solo lectura)
                    </Label>
                    <Input
                      defaultValue={profile?.email || ""}
                      placeholder={
                        isFetching ? "Cargando..." : "admin@empresa.com"
                      }
                      disabled
                      className="bg-surface-base border border-border/40 text-text-3 font-medium opacity-70 rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold font-montserrat text-text-1">
                      Nombre de la Empresa (Legal)
                    </Label>
                    <Input
                      value={company?.name || ""}
                      onChange={(e) => setCompany(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      placeholder={
                        isFetching ? "Cargando..." : "LUMIS Technologies"
                      }
                      className="bg-surface-input border border-border/40 text-text-1 focus-visible:ring-brand/50 rounded-xl h-11 font-medium shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold font-montserrat text-text-1">
                      Nombre Comercial (Marca Blanca WhatsApp)
                    </Label>
                    <Input
                      value={company?.name_comercial || ""}
                      onChange={(e) => setCompany(prev => prev ? ({ ...prev, name_comercial: e.target.value }) : null)}
                      placeholder="Ej. Mi Tienda Express"
                      className="bg-surface-input border border-brand/40 text-text-1 focus-visible:ring-brand border-2 shadow-[0_0_10px_rgba(224,64,251,0.05)] rounded-xl h-11 font-bold"
                    />
                    <p className="text-[10px] text-text-3 italic font-medium">
                      Este nombre se usará en todos los mensajes de seguimiento automáticos.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold font-montserrat text-text-1">Rol Administrativo</Label>
                    <div className="relative">
                      <Input
                        defaultValue={profile?.role?.toUpperCase() || ""}
                        disabled
                        className="bg-surface-base border border-border/40 text-status-ok font-bold opacity-80 rounded-xl h-11 pl-4"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                         <Badge className="bg-status-ok/10 text-status-ok border-status-ok/20 text-[10px] uppercase font-bold tracking-widest">
                           {profile?.role || "USER"}
                         </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-brand-gradient hover:opacity-90 text-white shadow-brand rounded-xl font-bold px-8 h-11"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: USERS */}
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-1">
                    Equipo de Trabajo
                  </h2>
                  <p className="text-text-2 text-sm">
                    Administra los accesos y roles de tu personal.
                  </p>
                </div>
                <Dialog
                  open={showInviteModal}
                  onOpenChange={setShowInviteModal}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-brand-gradient hover:opacity-90 text-white font-bold shadow-brand rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Invitar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-surface-base border-border text-text-1 rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold font-heading text-text-1">Invitar Miembro al Equipo</DialogTitle>
                      <p className="text-sm text-text-3 font-medium">
                        El usuario recibirá un correo con un enlace seguro para establecer su propia contraseña y cuenta.
                      </p>
                    </DialogHeader>
                    
                    <div className="space-y-6 pt-4 px-6 overflow-y-auto flex-1 pb-4">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6]">
                          Nombre Completo
                        </Label>
                        <Input
                          value={inviteData.name}
                          onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                          placeholder="Ej. Juan Pérez"
                          className="bg-surface-base border-2 border-border/40 focus-visible:border-[#8B5CF6] focus-visible:ring-0 text-text-1 rounded-xl h-12 font-medium transition-colors"
                        />
                      </div>
                      
                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6]">
                          Correo Electrónico
                        </Label>
                        <Input
                          value={inviteData.email}
                          onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                          type="email"
                          placeholder="juan.perez@empresa.com"
                          className="bg-surface-base border-2 border-border/40 focus-visible:border-[#8B5CF6] focus-visible:ring-0 text-text-1 rounded-xl h-12 font-medium transition-colors"
                        />
                      </div>
                      
                      {/* Role Preset */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6]">
                          Rol Predefinido
                        </Label>
                        <Select
                          value={inviteData.role}
                          onValueChange={(val) => {
                            setInviteData({ 
                              ...inviteData, 
                              role: val,
                              permissions: ROLE_SECTION_ACCESS[val as AppRole] || []
                            });
                          }}
                        >
                          <SelectTrigger className="w-full h-12 px-4 rounded-xl bg-surface-base border-2 border-border/40 focus-visible:border-[#8B5CF6] focus:ring-0 text-text-1 font-medium transition-colors">
                            <SelectValue placeholder="Selecciona un rol predefinido" />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-elevated border-border text-text-1 z-[9999]" position="popper">
                            {INVITE_ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="focus:bg-surface-hover focus:text-text-1 cursor-pointer font-medium">
                                {ROLE_DEFINITIONS[r].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-text-3 font-medium mt-1">
                          {ROLE_DEFINITIONS[inviteData.role as AppRole]?.description}
                        </p>
                      </div>

                      {/* Permissions Matrix */}
                      <div className="bg-surface-input border border-border/40 rounded-2xl p-5 space-y-5">
                        <div className="flex items-center justify-between border-b border-border/40 pb-3">
                          <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6]">
                            <Shield className="w-3.5 h-3.5" />
                            Matriz de Permisos
                          </h4>
                          <button 
                            type="button" 
                            onClick={() => {
                              const allPerms = ["ventas", "compras", "clientes", "productos", "finanzas", "operaciones", "reportes", "settings"];
                              setInviteData({ ...inviteData, role: "admin", permissions: allPerms });
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6] hover:opacity-80 transition-opacity"
                          >
                            Activar Todo
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: "ventas", label: "Ventas" },
                            { id: "compras", label: "Compras" },
                            { id: "clientes", label: "Clientes & CRM" },
                            { id: "productos", label: "Inventario" },
                            { id: "finanzas", label: "Finanzas" },
                            { id: "operaciones", label: "Logística" },
                            { id: "reportes", label: "Reportes" },
                            { id: "settings", label: "Configuración" },
                          ].map((mod) => (
                            <div key={mod.id} className="flex items-center space-x-3">
                              <Checkbox 
                                id={`perm-${mod.id}`}
                                checked={(inviteData.permissions || []).includes(mod.id)}
                                onCheckedChange={(checked) => {
                                  const current = inviteData.permissions || [];
                                  if (checked) {
                                    setInviteData({ ...inviteData, role: "custom", permissions: [...current, mod.id] });
                                  } else {
                                    setInviteData({ ...inviteData, role: "custom", permissions: current.filter(p => p !== mod.id) });
                                  }
                                }}
                                className="border-[#8B5CF6]/50 data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6]"
                              />
                              <Label 
                                htmlFor={`perm-${mod.id}`}
                                className="text-sm font-medium text-text-1 cursor-pointer"
                              >
                                {mod.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                          variant="ghost"
                          className="hover:bg-transparent text-text-3 hover:text-text-1 font-medium px-4 h-11"
                          onClick={() => setShowInviteModal(false)}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="bg-[#D946EF] hover:bg-[#C026D3] text-white shadow-brand rounded-xl h-11 font-bold px-6"
                          onClick={handleInviteUser}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4 mr-2" />
                          )}
                          Crear y Enviar Accesos
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-surface-card border border-border/50 shadow-card rounded-2xl overflow-hidden">
                <div className="divide-y divide-border">
                  {isFetching ? (
                    <div className="p-8 text-center text-text-3 font-medium">
                      Cargando usuarios...
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="p-8 text-center text-text-3 font-medium">
                      Solo tú estás en el equipo. ¡Agrega a un colega!
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-base hover:bg-surface-hover/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg border border-brand/20">
                            {member.full_name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold font-montserrat text-text-1">
                                {member.full_name}
                              </p>
                              {member.isPending && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-status-warn/10 text-status-warn border-status-warn/20 font-bold"
                                >
                                  Pendiente
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-text-2 font-medium">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            className={`uppercase font-bold tracking-widest text-[10px] ${
                              ROLE_DEFINITIONS[member.role as AppRole]?.badgeClass || "bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20"
                            }`}
                          >
                            {ROLE_DEFINITIONS[member.role as AppRole]?.label || member.role || "USUARIO"}
                          </Badge>
                          {(member.role === "vendedor" || member.role === "admin") && !member.isPending && (
                            <button
                              onClick={() => { setSelectedMember(member); setShowCommissionModal(true); }}
                              className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors border border-transparent hover:border-brand/20"
                              title="Configurar Comisiones"
                            >
                              <Percent className="w-4 h-4" />
                            </button>
                          )}
                          {member.isPending && (
                            <button
                              onClick={() => handleResendInvite(member)}
                              disabled={isLoading}
                              className="text-brand hover:bg-brand/10 px-3 py-1.5 rounded-lg transition-colors border border-brand/20 text-xs font-bold uppercase tracking-wider"
                            >
                              Reenviar
                            </button>
                          )}
                          {profile?.email !== member.email && (
                            <button
                              onClick={() => handleRemoveUser(member)}
                              disabled={isLoading}
                              className="text-status-danger hover:bg-status-danger/10 p-2 rounded-lg transition-colors border border-transparent hover:border-status-danger/20 disabled:opacity-50"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: VARIABLES GLOBALES */}
          {activeTab === "variables" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-surface-card border border-border/50 shadow-card rounded-2xl p-6">
                <h2 className="text-xl font-bold font-montserrat text-text-1 mb-2">
                  Tasa de Cambio BCV
                </h2>
                <p className="text-text-2 text-sm mb-6">
                  Configura la tasa de cambio oficial. Esto afectará los
                  cálculos de facturación y cobranzas en todo el sistema.
                </p>

                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold font-montserrat text-text-1">
                      Tasa Actual (Bs/USD)
                    </Label>
                    <div className="flex gap-4">
                      <Input
                        type="number"
                        value={bcvRate}
                        onChange={(e) => setBcvRate(e.target.value)}
                        className="bg-surface-input border border-border/60 text-2xl font-bold font-mono text-text-1 focus-visible:ring-brand/50 h-14 rounded-xl shadow-inner"
                      />
                      <Button
                        onClick={handleSaveVariables}
                        disabled={isLoading}
                        className="bg-brand-gradient hover:opacity-90 text-white h-14 px-6 font-bold font-montserrat shadow-brand rounded-xl"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "ACTUALIZAR"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-brand/10 rounded-lg border border-brand/20 flex gap-3 text-sm text-brand font-medium">
                    <AlertCircle className="w-5 h-5 text-brand shrink-0" />
                    <p>
                      En el futuro, esta tasa se sincronizará automáticamente
                      mediante el API del Banco Central a las 8:00 AM.
                    </p>
                  </div>
                </div>
              </div>

              {user?.role === "admin" && (
                <div className="bg-surface-card border border-border/50 shadow-card rounded-2xl p-6">
                  <h2 className="text-xl font-bold font-montserrat text-text-1 mb-2">
                    Impuestos
                  </h2>
                  <p className="text-text-2 text-sm mb-6">
                    Configura el porcentaje de IVA base para las transacciones.
                  </p>

                  <div className="max-w-xs space-y-2">
                    <Label className="text-xs font-bold font-montserrat text-text-1">IVA Nacional (%)</Label>
                    <Input
                      defaultValue="16"
                      disabled
                      className="bg-surface-input border border-border/60 text-text-1 opacity-60 font-bold font-mono rounded-xl h-11 shadow-inner"
                    />
                    <p className="text-[10px] text-text-3 font-semibold">
                      Configuración avanzada bloqueada en plan actual.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: SUSCRIPTION */}
          {activeTab === "subscription" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {company?.subscription_status === 'demo' ? (
                /* ── DEMO ACCOUNT ── */
                <div className="bg-white border border-emerald-200 rounded-2xl p-8 flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200 flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-montserrat font-bold text-text-1">Cuenta Demo</h2>
                    <p className="text-emerald-600 font-bold text-base mt-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Acceso Enterprise completo habilitado
                    </p>
                    <p className="text-text-2 mt-2 max-w-md text-sm leading-relaxed">
                      Esta cuenta tiene privilegios especiales para demostración. Disfrutas de todas las funcionalidades del <strong>Plan Enterprise</strong> de forma ilimitada.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── ESTADO ACTUAL (dinámico según plan_type) ── */}
                  {(() => {
                    const pt = (company?.plan_type || "basic").toLowerCase();
                    const isPro = pt === "pro";
                    const isEnterprise = pt === "enterprise";
                    const price = isEnterprise ? "$119.99" : isPro ? "$79.99" : "$19.99";
                    const planLabel = isEnterprise ? "Enterprise" : isPro ? "Pro Business" : "Starter";
                    const maxUsers = isEnterprise ? "∞" : isPro ? "10" : "2";
                    const storage = isEnterprise ? "Ilimitado" : isPro ? "50 GB" : "5 GB";
                    const isUnlimited = isEnterprise;
                    // Calcular próximo cobro desde billing_day (día de registro)
                    const nextBilling = (() => {
                      const today = new Date();
                      const day = (company as any)?.billing_day || today.getDate();
                      let next = new Date(today.getFullYear(), today.getMonth(), day);
                      if (next <= today) next = new Date(today.getFullYear(), today.getMonth() + 1, day);
                      return next.toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });
                    })();
                    return (
                      <div className="bg-white border border-border rounded-2xl p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h2 className="text-lg font-montserrat font-bold text-text-1">Tu Plan Actual</h2>
                              <span className="px-2.5 py-0.5 bg-brand/10 text-brand border border-brand/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {planLabel}
                              </span>
                            </div>
                            <p className="text-text-3 text-sm">
                              {isEnterprise
                                ? "Tienes acceso completo a todos los módulos y funcionalidades."
                                : isPro
                                ? "Acceso completo al ERP+CRM. Potencia máxima para tu negocio."
                                : "Estás utilizando las cuotas asignadas al plan de inicio."}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-montserrat font-black text-text-1">{price} <span className="text-sm font-normal text-text-3">/ mes</span></p>
                            <p className="text-[10px] text-text-3 mt-0.5">Próximo cobro: {nextBilling}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-border">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-text-3">Usuarios del Sistema</span>
                              <span className="text-text-1 font-bold">1 / {maxUsers}</span>
                            </div>
                            {!isUnlimited && (
                              <div className="h-1.5 w-full bg-surface-base rounded-full overflow-hidden">
                                <div className="h-full bg-brand rounded-full" style={{ width: isPro ? "10%" : "50%" }} />
                              </div>
                            )}
                            {isUnlimited && <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sin límite</p>}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-text-3">Almacenamiento</span>
                              <span className="text-text-1 font-bold">{isUnlimited ? "Ilimitado" : `20 MB / ${storage}`}</span>
                            </div>
                            {!isUnlimited && (
                              <div className="h-1.5 w-full bg-surface-base rounded-full overflow-hidden">
                                <div className="h-full bg-brand rounded-full w-[1%]" />
                              </div>
                            )}
                            {isUnlimited && <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sin límite</p>}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-3 font-medium">Emisiones PDF</span>
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ilimitado</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── COMPARACION DE PLANES ── */}
                  <div>
                    <h3 className="text-sm font-bold text-text-3 uppercase tracking-wider mb-4">Comparar Planes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {/* LUMIS STARTER */}
                      {(() => {
                        const isActive = !company?.plan_type || ['starter','basic'].includes(company?.plan_type?.toLowerCase());
                        return (
                          <div className={`rounded-2xl border p-6 flex flex-col ${isActive ? 'bg-brand/5 border-brand/30' : 'bg-white border-border'}`}>
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Lumis Starter</p>
                                {isActive && <span className="text-[9px] font-bold px-2 py-0.5 bg-brand/10 text-brand rounded-full border border-brand/20">PLAN ACTUAL</span>}
                              </div>
                              <p className="text-2xl font-montserrat font-black text-text-1">$19.99 <span className="text-xs font-normal text-text-3">/ mes</span></p>
                              <p className="text-[10px] text-text-3 mt-0.5">Se acabó el desorden de facturas y el Excel manual</p>
                            </div>
                            <ul className="space-y-2.5 flex-1 text-xs mb-5">
                              {[
                                { label: "Hasta 2 usuarios", ok: true },
                                { label: "Ventas completo: POS, Presupuestos, Historial", ok: true },
                                { label: "Inventario y Ajuste de Stock", ok: true },
                                { label: "Categorías, Atributos de Productos", ok: true },
                                { label: "Directorio de Clientes", ok: true },
                                { label: "Compras: módulo Fiscal", ok: true },
                                { label: "Reporte de Ventas básico", ok: true },
                                { label: "Semilla Diaria", ok: true },
                                { label: "Finanzas: CxC, Gastos, Tesorería, Flujo de Caja", ok: false },
                                { label: "CRM: Oportunidades, Mensajería, Prospectos", ok: false },
                                { label: "Compras: OC, RFQ, Proveedores, Análisis, Despachos", ok: false },
                                { label: "Reportes Avanzados + Resumen Ejecutivo", ok: false },
                                { label: "Kits & Ensambles", ok: false },
                              ].map((f, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  {f.ok
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    : <X className="w-3.5 h-3.5 text-text-3 flex-shrink-0 mt-0.5" />}
                                  <span className={f.ok ? "text-text-2" : "text-text-3"}>{f.label}</span>
                                </li>
                              ))}
                            </ul>
                            {isActive ? (
                              <div className="py-2.5 w-full rounded-xl bg-brand/10 text-brand text-sm font-bold text-center border border-brand/20">
                                Plan Activo
                              </div>
                            ) : (
                              <button onClick={handleUpgradePlan} className="mt-auto w-full py-2.5 bg-white border border-border text-text-1 rounded-xl font-bold text-sm hover:bg-surface-hover/10 transition-all">
                                Cambiar a Starter
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* LUMIS PRO BUSINESS */}
                      {(() => {
                        const isActive = company?.plan_type?.toLowerCase() === 'pro';
                        return (
                          <div className={`rounded-2xl border p-6 flex flex-col relative ${isActive ? 'bg-brand/5 border-brand/30' : 'bg-white border-brand shadow-sm'}`}>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-full shadow-brand">
                                ⭐ Recomendado
                              </span>
                            </div>
                            <div className="mb-4 mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-brand uppercase tracking-wider">Lumis Pro Business</p>
                                {isActive && <span className="text-[9px] font-bold px-2 py-0.5 bg-brand/10 text-brand rounded-full border border-brand/20">PLAN ACTUAL</span>}
                              </div>
                              <p className="text-2xl font-montserrat font-black text-text-1">$79.99 <span className="text-xs font-normal text-text-3">/ mes</span></p>
                              <p className="text-[10px] text-text-3 mt-0.5">Multiplica tus ventas con WhatsApp y CRM integrado</p>
                            </div>
                            <ul className="space-y-2.5 flex-1 text-xs mb-5">
                              {[
                                "Hasta 10 usuarios",
                                "Ventas completo: POS, Presupuestos, Historial",
                                "Inventario, Stock, Categorías, Kits & Ensambles",
                                "Directorio de Clientes",
                                "Finanzas completo: CxC, Gastos, Recurrentes, Mis Cuentas, Flujo de Caja",
                                "CRM: Oportunidades, Mensajería, Seguimiento de Prospectos",
                                "Compras completo: OC, RFQ, Proveedores, Análisis de Precios, Despachos",
                                "Reportes Avanzados: Productos, Inventario, Equipo de Ventas",
                                "Resumen Ejecutivo (Dashboard CEO)",
                                "Semilla Diaria",
                                "Soporte prioritario",
                              ].map((label, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-text-2">{label}</span>
                                </li>
                              ))}
                            </ul>
                            {isActive ? (
                              <div className="py-2.5 w-full rounded-xl bg-brand/10 text-brand text-sm font-bold text-center border border-brand/20">
                                Plan Activo
                              </div>
                            ) : (
                              <button onClick={handleUpgradePlan} className="mt-auto w-full py-2.5 bg-brand-gradient text-white rounded-xl font-bold text-sm shadow-brand hover:opacity-90 active:scale-95 transition-all">
                                Actualizar a Pro Business
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* LUMIS ENTERPRISE */}
                      {(() => {
                        const isActive = company?.plan_type?.toLowerCase() === 'enterprise';
                        return (
                          <div className={`rounded-2xl border p-6 flex flex-col ${isActive ? 'bg-brand/5 border-brand/30' : 'bg-white border-border'}`}>
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Lumis Enterprise</p>
                                {isActive && <span className="text-[9px] font-bold px-2 py-0.5 bg-brand/10 text-brand rounded-full border border-brand/20">PLAN ACTUAL</span>}
                              </div>
                              <p className="text-2xl font-montserrat font-black text-text-1">$119.99 <span className="text-xs font-normal text-text-3">/ mes</span></p>
                              <p className="text-[10px] text-text-3 mt-0.5">Control total de todas tus sedes y distribuidores</p>
                            </div>
                            <ul className="space-y-2.5 flex-1 text-xs mb-5">
                              {[
                                "Usuarios ilimitados",
                                "Ventas, Inventario, CRM y Finanzas completo",
                                "Compras completo: OC, RFQ, Proveedores, Análisis, Despachos",
                                "Todos los Reportes + Resumen Ejecutivo CEO",
                                "Kits & Ensambles, Categorías avanzadas",
                                "Multi-empresa (varias sedes y distribuidores)",
                                "Almacenamiento ilimitado",
                                "API Access para integraciones externas",
                                "Onboarding y capacitación dedicada",
                                "Soporte 24/7 con agente asignado",
                                "SLA de respuesta garantizado",
                                "Personalización y desarrollo a medida",
                              ].map((label, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-text-2">{label}</span>
                                </li>
                              ))}
                            </ul>
                            {isActive ? (
                              <div className="py-2.5 w-full rounded-xl bg-brand/10 text-brand text-sm font-bold text-center border border-brand/20">
                                Plan Activo
                              </div>
                            ) : (
                              <a href="https://wa.me/584141234567" target="_blank" rel="noopener noreferrer"
                                className="mt-auto w-full py-2.5 bg-white border border-border text-text-1 rounded-xl font-bold text-sm hover:bg-surface-hover/10 transition-all text-center block">
                                Contactar Ventas
                              </a>
                            )}
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
          {/* TAB: MODULES */}
          {activeTab === "modules" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-text-1 font-montserrat">Módulos Opcionales</h2>
                <p className="text-text-2 text-sm mt-1">Activa o desactiva módulos adicionales para tu empresa.</p>
              </div>

              {/* Restaurant Module Card */}
              <div className="bg-surface-card border border-border/50 shadow-card rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-amber-100 border border-amber-200">
                      <UtensilsCrossed className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-1 font-montserrat">Módulo Restaurante</h3>
                      <p className="text-sm text-text-2 mt-1 max-w-md">
                        Gestiona mesas, comandas, cocina y caja para tu negocio gastronómico.
                        Incluye vista KDS para cocina en tiempo real.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Disponible desde Starter</span>
                        {currentModules.includes('restaurante') && (
                          <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const companyId = user?.company_id || profile?.company_id;
                      if (!companyId) {
                        toast.error("Error crítico: company_id no está disponible. Por favor recarga.");
                        return;
                      }
                      
                      const isActive = currentModules.includes('restaurante');
                      const newModules = isActive
                        ? currentModules.filter((m: string) => m !== 'restaurante')
                        : [...currentModules, 'restaurante'];

                      try {
                        const { data, error } = await supabase
                          .from('companies')
                          .update({ modules_enabled: newModules })
                          .eq('id', companyId)
                          .select()
                          .single();
                          
                        if (error) throw error;
                        if (!data) throw new Error("No se pudo actualizar la empresa (posible restricción de seguridad RLS).");
                        

                        await refreshUser();

                        // Create default zones if activating for first time
                        if (!isActive) {
                          const { data: existingZones } = await supabase
                            .from('restaurant_zones')
                            .select('id')
                            .eq('company_id', companyId)
                            .limit(1);

                          if (!existingZones || existingZones.length === 0) {
                            await supabase.from('restaurant_zones').insert([
                              { company_id: companyId, name: 'Salón', color: '#10B981' },
                              { company_id: companyId, name: 'Terraza', color: '#F59E0B' },
                              { company_id: companyId, name: 'Barra', color: '#3B82F6' },
                              { company_id: companyId, name: 'VIP', color: '#8B5CF6' },
                            ]);
                          }

                          // Create default config
                          await supabase.from('restaurant_config').upsert({
                            company_id: companyId,
                            alert_minutes_yellow: 10,
                            alert_minutes_red: 15,
                            require_guests: true,
                            allow_multiple_sends: true,
                            notify_waiter_on_ready: true,
                          }, { onConflict: 'company_id' });
                        }

                        toast.success(isActive ? 'Módulo Restaurante desactivado' : '🍽️ Módulo Restaurante activado');
                      } catch (err: any) {
                        toast.error('Error al actualizar módulo', { description: err.message });
                        // Re-fetch to guarantee sync with DB since it failed
                        refreshUser();
                      }
                    }}
                    className={`w-14 h-8 rounded-full transition-all duration-200 relative shrink-0 ${currentModules.includes('restaurante') ? 'bg-brand' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${currentModules.includes('restaurante') ? 'left-7.5' : 'left-1.5'}`} />
                  </button>
                </div>

                {currentModules.includes('restaurante') && (
                  <div className="mt-6 p-4 rounded-xl bg-brand/5 border border-brand/15">
                    <p className="text-xs font-bold text-brand mb-2">Submódulos incluidos:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Mesas del Salón', desc: 'Estado en tiempo real' },
                        { label: 'Comandas (Mesero)', desc: 'Interfaz táctil optimizada' },
                        { label: 'Cocina KDS', desc: 'Kanban oscuro para cocina' },
                        { label: 'Config. Restaurante', desc: 'Zonas, alertas, comportamiento' },
                      ].map((sub) => (
                        <div key={sub.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-text-1">{sub.label}</p>
                            <p className="text-[10px] text-text-3">{sub.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center text-[#E040FB]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
