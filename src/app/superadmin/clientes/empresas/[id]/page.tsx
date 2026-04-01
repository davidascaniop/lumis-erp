"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Building2, Calendar, CreditCard, Download, FileText, Mail, Phone, User, Wallet, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const router = useRouter();
  
  const [company, setCompany] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleStatusChange = async (newStatus: "active" | "suspended") => {
    setIsProcessing(true);
    try {
      const { data: updatedData, error } = await supabase
        .from("companies")
        .update({ subscription_status: newStatus })
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
  
  // Try to match BCV rate if not explicitely saved (fallback to ref data or assume current, but since prompt says show if available)
  const bcvRate = payment?.reference_data?.bcv_rate || 0; 
  const amountBs = currentPrice * bcvRate;

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
                {adminUser?.phone || payment?.reference_data?.source || "No registrado"}
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
                <Badge variant="outline" className="bg-brand/5 text-brand border-brand/20 uppercase font-black tracking-widest px-3 py-1 text-xs">
                  {company.plan_type || 'Básico'}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-text-1">${currentPrice.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-text-3 uppercase">/ mensuales</p>
              </div>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-xs font-bold text-text-3 uppercase">Inicio:</span>
              <span className="text-sm font-medium text-text-1">
                {company.created_at ? format(new Date(company.created_at), "dd/MM/yyyy") : "N/A"}
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-border hover:border-brand text-text-2 hover:text-brand bg-surface-base transition-colors shadow-sm">
                Cambiar plan
              </button>
              <button className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-border hover:border-brand text-text-2 hover:text-brand bg-surface-base transition-colors shadow-sm">
                Extender período
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Datos del pago */}
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
                     <span className="text-sm font-medium text-text-1">{payment.reference_data?.name || "Desconocido"}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                     <span className="text-xs font-bold text-text-3 uppercase flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Correo/Tlf emisor:</span>
                     <span className="text-sm font-medium text-text-1">{payment.reference_data?.source || "Desconocido"}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                     <span className="text-xs font-bold text-text-3 uppercase flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5"/> 4 Dig / Banco:</span>
                     <span className="text-sm font-medium text-text-1">{payment.reference_data?.bank_last4 || "Desconocido"}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                     <span className="text-xs font-bold text-text-3 uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Fecha de pago:</span>
                     <span className="text-sm font-medium text-text-1">{format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
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

        {/* Section 4: Acciones */}
        <div className="md:col-span-2 bg-gradient-to-br from-surface-card to-surface-base border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-1 flex items-center gap-2 mb-4">
            Acciones de la cuenta
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
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
    </div>
  );
}
