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
    rif: string;
    plan_type: string;
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
              .select("id, name, rif, plan_type")
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

  const handleSaveProfile = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Perfil y Empresa actualizados");
    }, 1500);
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
        <h1 className="text-3xl font-heading font-bold text-[#F5EEFF] mb-2">
          Configuración
        </h1>
        <p className="text-[#B8A0D0]">
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
              <div className="bg-[#1A1220]/50 backdrop-blur-xl border border-[#E040FB]/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#F5EEFF] mb-6">
                  Logo de tu Empresa
                </h2>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-[#0F0A12] border-2 border-dashed border-[#E040FB]/30 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-[#E040FB] transition-colors overflow-hidden relative">
                    <Upload className="w-6 h-6 text-[#E040FB] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] text-[#B8A0D0]">
                      Subir logo
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-[#F5EEFF] font-medium">
                      Sube el logotipo de tu organización.
                    </p>
                    <p className="text-xs text-[#B8A0D0]">
                      Se recomienda un formato .PNG cuadrado (ej. 512x512) sin
                      fondo. Este logo aparecerá en el dashboard y en las
                      facturas/notas de entrega.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2 bg-transparent border-[#E040FB]/20 text-[#F5EEFF] hover:bg-[#E040FB]/10"
                    >
                      Seleccionar Archivo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1220]/50 backdrop-blur-xl border border-[#E040FB]/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#F5EEFF] mb-6">
                  Información General
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#B8A0D0]">Nombre Completo</Label>
                    <Input
                      defaultValue={profile?.full_name || ""}
                      placeholder={isFetching ? "Cargando..." : "Juan Pérez"}
                      className="bg-[#0F0A12] border-[#E040FB]/10 text-[#F5EEFF] focus-visible:ring-[#E040FB]/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8A0D0]">
                      Correo Electrónico (Solo lectura)
                    </Label>
                    <Input
                      defaultValue={profile?.email || ""}
                      placeholder={
                        isFetching ? "Cargando..." : "admin@empresa.com"
                      }
                      disabled
                      className="bg-[#0F0A12] border-[#E040FB]/10 text-[#6B5280] opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8A0D0]">
                      Nombre de la Empresa
                    </Label>
                    <Input
                      defaultValue={company?.name || ""}
                      placeholder={
                        isFetching ? "Cargando..." : "LUMIS Technologies"
                      }
                      className="bg-[#0F0A12] border-[#E040FB]/10 text-[#F5EEFF] focus-visible:ring-[#E040FB]/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B8A0D0]">Rol Administrativo</Label>
                    <Input
                      defaultValue={profile?.role?.toUpperCase() || ""}
                      disabled
                      className="bg-[#0F0A12] border-[#E040FB]/10 text-[#00D4AA] font-bold opacity-80"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-[#E040FB] hover:bg-[#C511E0] text-white shadow-[0_0_15px_rgba(224,64,251,0.4)]"
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
                  <h2 className="text-xl font-bold text-[#F5EEFF]">
                    Equipo de Trabajo
                  </h2>
                  <p className="text-[#B8A0D0] text-sm">
                    Administra los accesos y roles de tu personal.
                  </p>
                </div>
                <Dialog
                  open={showInviteModal}
                  onOpenChange={setShowInviteModal}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-[#00D4AA] hover:bg-[#00B48A] text-[#0F0A12] font-semibold">
                      <Plus className="w-4 h-4 mr-2" />
                      Invitar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1A1220] border border-[#E040FB]/20 text-[#F5EEFF]">
                    <DialogHeader>
                      <DialogTitle>Invitar al equipo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Nombre del empleado</Label>
                        <Input
                          value={inviteData.name}
                          onChange={(e) =>
                            setInviteData({
                              ...inviteData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Ej. Ana Pérez"
                          className="bg-[#0F0A12] border-[#E040FB]/20 text-[#F5EEFF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Correo Electrónico</Label>
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
                          className="bg-[#0F0A12] border-[#E040FB]/20 text-[#F5EEFF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol en el Sistema</Label>
                        <Select
                          value={inviteData.role}
                          onValueChange={(val) =>
                            setInviteData({ ...inviteData, role: val })
                          }
                        >
                          <SelectTrigger className="w-full h-10 px-3 py-2 rounded-md bg-[#0F0A12] border border-[#E040FB]/20 text-[#F5EEFF] outline-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1220]/95 backdrop-blur-xl border-[#E040FB]/20 text-[#F5EEFF]">
                            <SelectItem
                              value="vendedor"
                              className="focus:bg-[#E040FB]/10 focus:text-white cursor-pointer"
                            >
                              Representante de Ventas
                            </SelectItem>
                            <SelectItem
                              value="cobranza"
                              className="focus:bg-[#E040FB]/10 focus:text-white cursor-pointer"
                            >
                              Analista de Cobranza (CxC)
                            </SelectItem>
                            <SelectItem
                              value="admin"
                              className="focus:bg-[#E040FB]/10 focus:text-white cursor-pointer"
                            >
                              Administrador General
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-[#B8A0D0] mt-1">
                          {inviteData.role === "admin" &&
                            "Control total sobre configuración y roles."}
                          {inviteData.role === "vendedor" &&
                            "Solo visualiza y crea clientes, y registrar notas de entrega."}
                          {inviteData.role === "cobranza" &&
                            "Accede a modulo de cuentas por cobrar y registra pagos."}
                        </p>
                      </div>
                      <Button
                        className="w-full bg-[#E040FB] hover:bg-[#C511E0]"
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

              <div className="bg-[#1A1220]/50 backdrop-blur-xl border border-[#E040FB]/10 rounded-2xl overflow-hidden">
                <div className="divide-y divide-[#E040FB]/10">
                  {isFetching ? (
                    <div className="p-8 text-center text-[#B8A0D0]">
                      Cargando usuarios...
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="p-8 text-center text-[#B8A0D0]">
                      Solo tú estás en el equipo. ¡Agrega a un colega!
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#E040FB]/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#7C4DFF]/20 flex items-center justify-center text-[#F5EEFF] font-bold border border-[#7C4DFF]/30">
                            {member.full_name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#F5EEFF]">
                                {member.full_name}
                              </p>
                              {member.isPending && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                >
                                  Pendiente de ingreso
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#B8A0D0]">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className="bg-[#0F0A12] text-[#00D4AA] border-[#00D4AA]/20 uppercase">
                            {member.role || "USUARIO"}
                          </Badge>
                          {(member.role === "vendedor" || member.role === "admin") && (
                            <button
                              onClick={() => { setSelectedMember(member); setShowCommissionModal(true); }}
                              className="text-[#E040FB] hover:bg-[#E040FB]/10 p-2 rounded-lg transition-colors"
                              title="Configurar Comisiones"
                            >
                              <Percent className="w-4 h-4" />
                            </button>
                          )}
                          {profile?.email !== member.email && (
                            <button
                              onClick={() => handleRemoveUser(member.email)}
                              className="text-[#FF4757] hover:bg-[#FF4757]/10 p-2 rounded-lg transition-colors"
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
              <div className="bg-[#1A1220]/50 backdrop-blur-xl border border-[#E040FB]/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#F5EEFF] mb-2">
                  Tasa de Cambio BCV
                </h2>
                <p className="text-[#B8A0D0] text-sm mb-6">
                  Configura la tasa de cambio oficial. Esto afectará los
                  cálculos de facturación y cobranzas en todo el sistema.
                </p>

                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#B8A0D0]">
                      Tasa Actual (Bs/USD)
                    </Label>
                    <div className="flex gap-4">
                      <Input
                        type="number"
                        value={bcvRate}
                        onChange={(e) => setBcvRate(e.target.value)}
                        className="bg-[#0F0A12] border-[#E040FB]/30 text-2xl font-bold text-[#F5EEFF] focus-visible:ring-[#E040FB] h-14"
                      />
                      <Button
                        onClick={handleSaveVariables}
                        disabled={isLoading}
                        className="bg-[#00D4AA] hover:bg-[#00B48A] text-[#0F0A12] h-14 px-6 font-bold shadow-[0_0_15px_rgba(0,212,170,0.3)]"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "ACTUALIZAR"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-[#E040FB]/10 rounded-lg border border-[#E040FB]/20 flex gap-3 text-sm text-[#F5EEFF]">
                    <AlertCircle className="w-5 h-5 text-[#E040FB] shrink-0" />
                    <p>
                      En el futuro, esta tasa se sincronizará automáticamente
                      mediante el API del Banco Central a las 8:00 AM.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1220]/50 backdrop-blur-xl border border-[#E040FB]/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#F5EEFF] mb-2">
                  Impuestos
                </h2>
                <p className="text-[#B8A0D0] text-sm mb-6">
                  Configura el porcentaje de IVA base para las transacciones.
                </p>

                <div className="max-w-xs space-y-2">
                  <Label className="text-[#B8A0D0]">IVA Nacional (%)</Label>
                  <Input
                    defaultValue="16"
                    disabled
                    className="bg-[#0F0A12] border-[#E040FB]/10 text-[#6B5280] opacity-50"
                  />
                  <p className="text-[10px] text-[#6B5280]">
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
