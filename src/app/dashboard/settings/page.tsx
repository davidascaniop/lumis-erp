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
import { Suspense } from "react";
import { CommissionRulesEditor } from "@/components/users/commission-rules-editor";
import { Percent } from "lucide-react";

function SettingsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();

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

  // Create use modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    role: "vendedor",
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
              .select("id, name, name_comercial, rif, plan_type, subscription_status")
              .eq("id", uData.company_id)
              .single();

            if (companyData) setCompany(companyData as any);

            // Load team members
            const { data: teamData } = await supabase
              .from("users")
              .select("id, full_name, email, role")
              .eq("company_id", uData.company_id);

            if (teamData) setTeamMembers(teamData);
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
      // 1. Update Company if changed
      if (company && profile?.company_id) {
        await supabase
          .from("companies")
          .update({ 
            name: company.name,
            name_comercial: company.name_comercial 
          })
          .eq("id", profile.company_id);
      }

      toast.success("Perfil y Empresa actualizados correctamente");
    } catch (err) {
      toast.error("Error al guardar cambios");
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

    setIsLoading(true);

    // Simular invitación (en un entorno real requeriría enviar un magic link o crearlo en Supabase Auth Admin)
    setTimeout(() => {
      const newUser = {
        id: Math.random().toString(), // fake ID
        full_name: inviteData.name,
        email: inviteData.email,
        role: inviteData.role,
        isPending: true, // Flag local
      };

      setTeamMembers([...teamMembers, newUser]);
      setShowInviteModal(false);
      setInviteData({ name: "", email: "", role: "vendedor" });
      setIsLoading(false);
      toast.success(`Invitación enviada a ${inviteData.email}`);
    }, 1500);
  };

  const handleRemoveUser = (email: string) => {
    // En una app real esto llamaría a Supabase DELETE
    setTeamMembers(teamMembers.filter((m) => m.email !== email));
    toast.success("Usuario removido del equipo");
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
          <button
            onClick={() => setActiveTab("variables")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === "variables" ? "bg-[#E040FB]/10 text-[#E040FB] border border-[#E040FB]/30" : "text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#1A1220] border border-transparent"}`}
          >
            <Building2 className="w-5 h-5" />
            Variables Globales
          </button>
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
                      defaultValue={profile?.full_name || ""}
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
                    <Label className="text-xs font-bold font-montserrat text-brand flex items-center gap-1.5">
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
                  <DialogContent className="bg-surface-base border-border text-text-1 rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-montserrat font-bold text-text-1">Invitar al equipo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold font-montserrat text-text-1">Nombre del empleado</Label>
                        <Input
                          value={inviteData.name}
                          onChange={(e) =>
                            setInviteData({
                              ...inviteData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Ej. Ana Pérez"
                          className="bg-surface-input border border-border/40 text-text-1 rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold font-montserrat text-text-1">Correo Electrónico</Label>
                        <Input
                          value={inviteData.email}
                          onChange={(e) =>
                            setInviteData({
                              ...inviteData,
                              email: e.target.value,
                            })
                          }
                          type="email"
                          placeholder="ana@empresa.com"
                          className="bg-surface-input border border-border/40 text-text-1 rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold font-montserrat text-text-1">Rol en el Sistema</Label>
                        <Select
                          value={inviteData.role}
                          onValueChange={(val) =>
                            setInviteData({ ...inviteData, role: val })
                          }
                        >
                          <SelectTrigger className="w-full h-11 px-3 py-2 rounded-xl bg-surface-input border border-border/40 text-text-1 outline-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-elevated border-border text-text-1 z-[9999]" position="popper">
                            <SelectItem
                              value="vendedor"
                              className="focus:bg-surface-hover focus:text-text-1 cursor-pointer"
                            >
                              Representante de Ventas
                            </SelectItem>
                            <SelectItem
                              value="cobranza"
                              className="focus:bg-surface-hover focus:text-text-1 cursor-pointer"
                            >
                              Analista de Cobranza (CxC)
                            </SelectItem>
                            <SelectItem
                              value="admin"
                              className="focus:bg-surface-hover focus:text-text-1 cursor-pointer"
                            >
                              Administrador General
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-text-3 mt-1">
                          {inviteData.role === "admin" &&
                            "Control total sobre configuración y roles."}
                          {inviteData.role === "vendedor" &&
                            "Solo visualiza y crea clientes, y registrar notas de entrega."}
                          {inviteData.role === "cobranza" &&
                            "Accede a modulo de cuentas por cobrar y registra pagos."}
                        </p>
                      </div>
                      <Button
                        className="w-full bg-brand-gradient hover:opacity-90 text-white font-bold shadow-brand rounded-xl h-11"
                        onClick={handleInviteUser}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        Enviar Invitación
                      </Button>
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
                          <Badge className="bg-brand/10 text-brand border border-brand/20 uppercase font-bold tracking-widest text-[10px] hover:bg-brand/20 transition-colors">
                            {member.role || "USUARIO"}
                          </Badge>
                          {(member.role === "vendedor" || member.role === "admin") && (
                            <button
                              onClick={() => { setSelectedMember(member); setShowCommissionModal(true); }}
                              className="text-brand hover:bg-brand/10 p-2 rounded-lg transition-colors border border-transparent hover:border-brand/20"
                              title="Configurar Comisiones"
                            >
                              <Percent className="w-4 h-4" />
                            </button>
                          )}
                          {profile?.email !== member.email && (
                            <button
                              onClick={() => handleRemoveUser(member.email)}
                              className="text-status-danger hover:bg-status-danger/10 p-2 rounded-lg transition-colors border border-transparent hover:border-status-danger/20"
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
                 <div className="bg-gradient-to-br from-[#1A1220] to-[#011B16] backdrop-blur-xl border border-[#00E5CC]/30 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00E5CC]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 bg-[#00E5CC]/20 rounded-2xl flex items-center justify-center p-0.5 border border-[#00E5CC]/30">
                        <Sparkles className="w-8 h-8 text-[#00E5CC]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#F5EEFF]">Cuenta Demo</h2>
                        <p className="text-[#00E5CC] font-bold text-lg mt-1 flex items-center gap-2">
                           Acceso completo habilitado
                           <Shield className="w-5 h-5" />
                        </p>
                        <p className="text-[#B8A0D0] mt-3 max-w-md text-sm leading-relaxed">
                          Esta cuenta tiene privilegios especiales para demostración. Disfrutas de todas las funcionalidades del <strong>Plan Enterprise</strong> de forma ilimitada.
                        </p>
                      </div>
                    </div>
                 </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-[#1A1220] to-[#0A1A17] backdrop-blur-xl border border-[#00D4AA]/30 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00D4AA]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-[#F5EEFF]">
                            Plan Actual
                          </h2>
                          <Badge className="bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/30 px-3 py-1 uppercase tracking-widest">
                            {company?.plan_type || "BASIC"}
                          </Badge>
                        </div>
                        <p className="text-[#B8A0D0] max-w-md">
                          Estás utilizando las cuotas y funcionalidades asignadas al
                          plan de inicio. Potencia tu empresa escalando a Pro.
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-3xl font-bold text-[#00D4AA] mb-1">
                          $29{" "}
                          <span className="text-lg text-[#6B5280] font-normal">
                            / mes
                          </span>
                        </p>
                        <p className="text-xs text-[#00D4AA]">
                          Próximo cobro: 15 de Oct, 2026
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-[#00D4AA]/10">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#B8A0D0]">
                            Usuarios de Sistema
                          </span>
                          <span className="text-[#F5EEFF] font-medium">1 / 2</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#0F0A12] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00D4AA] w-[50%]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#B8A0D0]">
                            Almacenamiento (Docs)
                          </span>
                          <span className="text-[#F5EEFF] font-medium">
                            20 MB / 5 GB
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#0F0A12] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00D4AA] w-[1%]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#B8A0D0]">Emisiones PDF</span>
                          <span className="text-[#F5EEFF] font-medium">
                            Ilimitado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1A1220]/50 backdrop-blur-xl border border-[#E040FB]/20 rounded-2xl p-6 hover:border-[#E040FB]/50 transition-colors">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] rounded-xl flex items-center justify-center p-0.5 shadow-glow">
                          <div className="w-full h-full bg-[#1A1220] rounded-[10px] flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-[#E040FB]" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#F5EEFF]">
                            Mejora a Plan Profesional
                          </h3>
                          <p className="text-sm text-[#B8A0D0]">
                            Hasta 10 usuarios, reportes avanzados, Multi-moneda y
                            KPIs sin bloqueo.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleUpgradePlan}
                        className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white hover:opacity-90 w-full md:w-auto shadow-glow font-bold"
                      >
                        Actualizar al Plan Pro
                      </Button>
                    </div>
                  </div>
                </>
              )}
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
