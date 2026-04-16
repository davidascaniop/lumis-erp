"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
import { ArrowLeft, Building2, Calendar, CreditCard, Download, FileText, Mail, Phone, User, Wallet, Loader2, CheckCircle2, AlertTriangle, XCircle, Save, Clock, Sparkles } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createSuperadminClient();
  const router = useRouter();
  
  const [company, setCompany] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState("");
  const [extendValue, setExtendValue] = useState<string>("7");
  const [customDate, setCustomDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Company
      const { data: compData, error: compErr } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();
        
      if (compErr) throw compErr;
      setCompany(compData);

      // 2. Fetch Admin User
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", id)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      
      if (userData) setAdminUser(userData);

      // 3. Fetch latest payment
      const { data: payData } = await supabase
        .from("subscription_payments")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payData) setPayment(payData);

    } catch (error: any) {
      toast.error("Error al cargar detalles: " + error.message);
      router.push("/superadmin/clientes/empresas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "active" | "suspended" | "demo") => {
    setIsProcessing(true);
    try {
      const updates: any = { subscription_status: newStatus };
      if (newStatus === "demo") {
        updates.plan_type = null;
        updates.plan = null;
      }
      
      const { data: updatedData, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase Update Error:", error);
        throw new Error(error.message + " (Posible problema de permisos RLS)");
      }
      
      toast.success(`Cuenta ${newStatus === "active" ? "activada" : "suspendida"} exitosamente`);
      setCompany({ ...company, subscription_status: newStatus });
    } catch (error: any) {
      toast.error("Error al actualizar estado: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ plan_type: selectedPlan, plan: selectedPlan })
        .eq("id", id);
      if (error) throw error;
      toast.success("Plan actualizado correctamente");
      setCompany({ ...company, plan_type: selectedPlan, plan: selectedPlan });
      setIsPlanModalOpen(false);
    } catch (error: any) {
      toast.error("Error al cambiar plan: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExtendPeriod = async () => {
    setIsUpdating(true);
    try {
      let newDate: Date;
      if (extendValue === "custom") {
        if (!customDate) throw new Error("Debes seleccionar una fecha");
        newDate = new Date(customDate);
      } else {
        newDate = addDays(new Date(), parseInt(extendValue));
      }

      const { error } = await supabase
        .from("companies")
        .update({ 
           trial_ends_at: newDate.toISOString(),
           subscription_status: company.subscription_status === 'suspended' ? 'trial' : company.subscription_status
        })
        .eq("id", id);
        
      if (error) throw error;
      
      // Log extensión logic en broadcast o notas:
      // Lo dejaremos simple: sólo actualizamos company
      toast.success("Período extendido correctamente");
      setCompany({ 
         ...company, 
         trial_ends_at: newDate.toISOString(),
         subscription_status: company.subscription_status === 'suspended' ? 'trial' : company.subscription_status
      });
      setIsExtendModalOpen(false);
    } catch (error: any) {
      toast.error("Error al extender período: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
        <p className="text-text-2 font-medium">Cargando detalles de la empresa...</p>
      </div>
    );
  }

  if (!company) return null;

  // Plan Pricing Map
  const planPrices: Record<string, number> = { "basic": 19.99, "starter": 19.99, "pro": 79.99, "enterprise": 119.99 };
  const currentPrice = planPrices[company.plan_type] || 0;
  
  const bcvRate = payment?.bcv_rate || 0; 
  const amountBs = payment?.amount_bs || (currentPrice * bcvRate);

  return (
    <div className="space-y-6 page-enter pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border/50 pb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-surface-base border border-border hover:border-brand/30 hover:bg-surface-hover rounded-xl text-text-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-lg bg-gradient-to-br from-brand/80 to-brand">
            {company.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-text-1 flex items-center gap-3">
              {company.name}
              
              {company.subscription_status === "active" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-ok/10 text-status-ok text-xs font-bold uppercase tracking-wider border border-status-ok/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-ok" /> Activa
                </span>
              )}
              {company.subscription_status === "pending_verification" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-info/10 text-[#0288D1] text-xs font-bold uppercase tracking-wider border border-[#0288D1]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1] animate-pulse" /> Pendiente
                </span>
              )}
              {company.subscription_status === "suspended" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-danger/10 text-status-danger text-xs font-bold uppercase tracking-wider border border-status-danger/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-danger" /> Suspendida
                </span>
              )}
              {company.subscription_status === "trial" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-warn/10 text-status-warn text-xs font-bold uppercase tracking-wider border border-status-warn/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-warn" /> Trial
                </span>
              )}
              {company.subscription_status === "demo" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E88E5]/10 text-[#1E88E5] text-xs font-bold uppercase tracking-wider border border-[#1E88E5]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E88E5]" /> Demo
                </span>
              )}
            </h1>
            <p className="text-sm font-medium text-text-3 mt-1 uppercase tracking-wider">ID: {company.id?.split('-')[0]}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Datos de la empresa */}
        <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-1 flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
            <Building2 className="w-5 h-5 text-brand" />
            Datos de la empresa
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-xs font-bold text-text-3 uppercase">Nombre:</span>
              <span className="text-sm font-medium text-text-1">{company.name}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-xs font-bold text-text-3 uppercase">RIF:</span>
              <span className="text-sm font-medium text-text-1">{company.rif || "No registrado"}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-xs font-bold text-text-3 uppercase">Email Admin:</span>
              <span className="text-sm font-medium text-text-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand" /> {adminUser?.email || company.owner_email || "No registrado"}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-xs font-bold text-text-3 uppercase">Teléfono:</span>
              <span className="text-sm font-medium text-text-1 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-text-2" /> 
                {adminUser?.phone || payment?.contact_info || "No registrado"}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-xs font-bold text-text-3 uppercase">Registro:</span>
              <span className="text-sm font-medium text-text-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-text-2" /> 
                {company.created_at ? format(new Date(company.created_at), "dd 'de' MMMM, yyyy - p", { locale: es }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Plan y suscripción */}
        <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-1 flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
            <CreditCard className="w-5 h-5 text-brand" />
            Plan y suscripción
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-base rounded-xl border border-border">
              <div>
                <p className="text-xs font-bold text-text-3 uppercase mb-1">Plan Actual</p>
                {company.subscription_status === "demo" ? (
                  <Badge variant="outline" className="bg-[#1E88E5]/10 text-[#1E88E5] border-[#1E88E5]/30 uppercase font-black tracking-widest px-3 py-1 text-xs">
                    CUENTA DEMO
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-brand/5 text-brand border-brand/20 uppercase font-black tracking-widest px-3 py-1 text-xs">
                    {company.plan_type || 'Básico'}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                {company.subscription_status === "demo" ? (
                  <p className="text-xl font-black text-[#1E88E5] tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">ACCESO TOTAL</p>
                ) : company.subscription_status === "trial" ? (
                  <>
                    <p className="text-lg font-black text-status-warn tracking-tight overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">TRIAL ACTIVO</p>
                    <p className="text-sm sm:hidden font-black text-status-warn tracking-tight">TRIAL</p>
                    <p className="text-[10px] font-bold text-text-3 uppercase mt-1">
                      Vence: {company.trial_ends_at ? format(new Date(company.trial_ends_at), "dd/MMM/yyyy") : "N/D"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-black text-text-1">${currentPrice.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-text-3 uppercase">/ mensuales</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-xs font-bold text-text-3 uppercase">Inicio:</span>
              <span className="text-sm font-medium text-text-1">
                {company.created_at ? format(new Date(company.created_at), "dd/MM/yyyy") : "N/A"}
              </span>
            </div>

            {company.subscription_status !== "demo" && (
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setSelectedPlan(company.plan_type || "basic"); setIsPlanModalOpen(true); }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-border hover:border-brand text-text-2 hover:text-brand bg-surface-base transition-colors shadow-sm"
                >
                  Cambiar plan
                </button>
                <button 
                  onClick={() => { setIsExtendModalOpen(true); }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-border hover:border-brand text-text-2 hover:text-brand bg-surface-base transition-colors shadow-sm"
                >
                  Extender período
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Datos del pago */}
        {company.subscription_status !== "demo" && (
          <div className="md:col-span-2 bg-surface-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-1 flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
            <Wallet className="w-5 h-5 text-brand" />
            Datos del último pago
          </h2>
          
          {!payment ? (
            <p className="text-sm text-text-3 italic p-4 text-center bg-surface-base rounded-xl">No hay registros de pago disponibles.</p>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-base rounded-xl border border-border">
                    <p className="text-[10px] font-bold text-text-3 uppercase">Método</p>
                    <p className="text-sm font-bold text-text-1 uppercase mt-1">{payment.method?.replace("_", " ") || "Desconocido"}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-status-ok/10 to-transparent rounded-xl border border-status-ok/20">
                    <p className="text-[10px] font-bold text-status-ok uppercase">Monto Pagado (USD)</p>
                    <p className="text-lg font-black text-status-ok mt-0.5">${currentPrice.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-surface-base rounded-xl border border-border">
                    <p className="text-[10px] font-bold text-text-3 uppercase">Monto Equivalente (Bs)</p>
                    <p className="text-sm font-bold text-text-1 mt-1">{amountBs > 0 ? `Bs. ${amountBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}` : "N/D"}</p>
                  </div>
                  <div className="p-3 bg-surface-base rounded-xl border border-border">
                    <p className="text-[10px] font-bold text-brand uppercase">Tasa BCV Usada</p>
                    <p className="text-sm font-bold text-brand mt-1">{bcvRate > 0 ? `Bs. ${bcvRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })}` : "No registrada"}</p>
                  </div>
                </div>

                <div className="bg-surface-base rounded-xl border border-border p-4 space-y-3">
                   <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                     <span className="text-xs font-bold text-text-3 uppercase flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Titular:</span>
                     <span className="text-sm font-medium text-text-1">{payment.holder_name || "Desconocido"}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                     <span className="text-xs font-bold text-text-3 uppercase flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Correo/Tlf emisor:</span>
                     <span className="text-sm font-medium text-text-1">{payment.contact_info || "Desconocido"}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                     <span className="text-xs font-bold text-text-3 uppercase flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5"/> 4 Dig / Banco:</span>
                     <span className="text-sm font-medium text-text-1">{payment.last_digits || "Desconocido"}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                     <span className="text-xs font-bold text-text-3 uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Fecha de pago:</span>
                     <span className="text-sm font-medium text-text-1">{payment.paid_at ? format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm", { locale: es }) : format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                   </div>
                </div>
              </div>

              {/* Receipt Area */}
              <div className="w-full lg:w-72 flex flex-col items-center justify-center p-6 bg-surface-base rounded-xl border-2 border-dashed border-border text-center">
                <FileText className="w-12 h-12 text-brand/50 mb-3" />
                <h3 className="text-sm font-bold text-text-1 mb-1">Comprobante Anexo</h3>
                <p className="text-[10px] font-medium text-text-3 mb-4">
                  Subido el {format(new Date(payment.created_at), "dd MMM, yyyy", { locale: es })}
                </p>
                {payment.receipt_url ? (
                   <div className="flex flex-col gap-2 w-full">
                     <a 
                       href={payment.receipt_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full py-2 bg-brand text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 shadow-md shadow-brand/20 transition-opacity"
                     >
                       <FileText className="w-4 h-4" /> Ver comprobante
                     </a>
                     <a 
                       href={payment.receipt_url} 
                       download
                       className="w-full py-2 bg-white text-brand border border-brand/20 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand/5 transition-colors"
                     >
                       <Download className="w-4 h-4" /> Descargar
                     </a>
                   </div>
                ) : (
                  <p className="text-xs text-status-warn bg-status-warn/10 px-3 py-2 rounded-lg font-bold">Sin archivo anexo</p>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Section 4: Acciones */}
        <div className="md:col-span-2 bg-gradient-to-br from-surface-card to-surface-base border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-1 flex items-center gap-2 mb-4">
            Acciones de la cuenta
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleStatusChange("demo")}
              disabled={isProcessing || company.subscription_status === "demo"}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#1E88E5] hover:bg-[#1E88E5]/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1E88E5]/20"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Hacer Demo
            </button>
            <button
              onClick={() => handleStatusChange("active")}
              disabled={isProcessing || company.subscription_status === "active"}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold uppercase tracking-wider bg-status-ok hover:bg-status-ok/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-status-ok/20"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Activar cuenta
            </button>
            <button
              onClick={() => handleStatusChange("suspended")}
              disabled={isProcessing || company.subscription_status === "suspended"}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold uppercase tracking-wider bg-status-danger hover:bg-status-danger/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-status-danger/20"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              Suspender cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Cambiar Plan Modal */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="bg-surface-base border-border rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Plan</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo plan para {company.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {[
              { id: "basic", name: "Lumis Starter", price: "$19.99/mes", feat: "Facturación, CRM esencial" },
              { id: "pro", name: "Lumis Pro Business", price: "$79.99/mes", feat: "CRM avanzado, WhatsApp Integration" },
              { id: "enterprise", name: "Lumis Enterprise", price: "$119.99/mes", feat: "Multi-sucursal, Distribuidores" }
            ].map(plan => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === plan.id ? "border-brand bg-brand/5" : "border-border hover:border-brand/50 bg-surface-card"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-text-1">{plan.name}</h3>
                  <span className="font-black text-brand">{plan.price}</span>
                </div>
                <p className="text-xs text-text-3 font-medium">{plan.feat}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-2 hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangePlan}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-brand text-white hover:opacity-90 flex items-center gap-2 transition-all disabled:opacity-50 inline-flex"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Confirmar Cambio
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extender Modal */}
      <Dialog open={isExtendModalOpen} onOpenChange={setIsExtendModalOpen}>
        <DialogContent className="bg-surface-base border-border rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extender Período / Trial</DialogTitle>
            <DialogDescription>
              Añade días extra de acceso a la plataforma sin requerir un pago confirmado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <label className="text-xs font-bold text-text-2 uppercase">Opción de extensión</label>
            <select
              value={extendValue}
              onChange={(e) => setExtendValue(e.target.value)}
              className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-brand/40"
            >
              <option value="7">7 Días extra</option>
              <option value="15">15 Días extra</option>
              <option value="30">30 Días extra</option>
              <option value="custom">Fecha personalizada...</option>
            </select>
            
            {extendValue === "custom" && (
              <div className="mt-2 space-y-1">
                <label className="text-xs font-bold text-text-2 uppercase">Seleccionar Fecha Extendida</label>
                <Input 
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-surface-card border-border"
                />
              </div>
            )}
            
            <div className="mt-4 p-4 bg-brand/5 border border-brand/20 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-brand shrink-0" />
              <div>
                <p className="text-xs font-bold text-brand uppercase mb-0.5">Nuevo ingreso límite</p>
                <p className="text-sm font-bold text-text-1">
                  {extendValue === "custom" 
                    ? (customDate ? format(new Date(customDate), "dd 'de' MMMM yyyy", { locale: es }) : "Seleccione una fecha")
                    : format(addDays(new Date(), parseInt(extendValue)), "dd 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsExtendModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-2 hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExtendPeriod}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-brand text-white hover:opacity-90 flex items-center gap-2 transition-all disabled:opacity-50 inline-flex"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Extender Acceso
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
