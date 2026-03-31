"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, Loader2, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function SuperadminSubscriptionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("subscription_payments")
      .select("*, companies(name, id)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar pagos", { description: error.message });
    } else {
      setPayments(data || []);
    }
    setIsLoading(false);
  };

  const handleAction = async (paymentId: string, companyId: string, newStatus: "approved" | "rejected") => {
    setProcessingId(paymentId);
    try {
      // 1. Update payment status
      const { error: paymentError } = await supabase
        .from("subscription_payments")
        .update({ status: newStatus })
        .eq("id", paymentId);

      if (paymentError) throw paymentError;

      // 2. Update company status if approved
      if (newStatus === "approved") {
        const { error: companyError } = await supabase
          .from("companies")
          .update({ subscription_status: "active" })
          .eq("id", companyId);

        if (companyError) throw companyError;
      } else if (newStatus === "rejected") {
        const { error: companyError } = await supabase
          .from("companies")
          .update({ subscription_status: "rejected" })
          .eq("id", companyId);

        if (companyError) throw companyError;
      }

      toast.success(
        newStatus === "approved"
          ? "Pago aprobado exitosamente. Empresa activada."
          : "Pago rechazado."
      );
      
      // Update local state
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
      );
    } catch (error: any) {
      toast.error("Error al procesar", { description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  const renderRefData = (payment: any) => {
    const data = payment.reference_data;
    if (!data) return "N/A";
    
    if (payment.method === "pago_movil") {
      return (
        <div className="text-xs space-y-0.5">
          <p><strong>Banco:</strong> {data.bank}</p>
          <p><strong>Ref:</strong> {data.ref}</p>
          <p><strong>Cédula:</strong> {data.dni}</p>
        </div>
      );
    }
    if (payment.method === "zinli") {
      return (
        <div className="text-xs space-y-0.5">
          <p><strong>Titular:</strong> {data.name}</p>
          <p><strong>Últimos 4:</strong> {data.last4}</p>
          <p><strong>Correo:</strong> {data.email}</p>
        </div>
      );
    }
    if (payment.method === "zelle") {
      return (
        <div className="text-xs space-y-0.5">
          <p><strong>Titular:</strong> {data.name}</p>
          <p><strong>Emisor:</strong> {data.email}</p>
          {data.last4 && <p><strong>Últimos 4:</strong> {data.last4}</p>}
        </div>
      );
    }
    return JSON.stringify(data);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-1 mb-2">
          Suscripciones y Pagos
        </h1>
        <p className="text-text-2">
          Valida los comprobantes de pago de las nuevas empresas para habilitar su acceso al ERP.
        </p>
      </div>

      <Card className="bg-surface-card border-border shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-surface-base">
          <CardTitle className="text-xl font-bold font-montserrat flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-brand" />
            Pagos Pendientes de Verificación
          </CardTitle>
          <CardDescription>
            Mostrando el historial de pagos de las empresas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-surface-base border-b border-border/50">
                <tr>
                  <th className="px-5 py-4 text-left font-bold text-text-1 whitespace-nowrap text-xs uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Empresa</th>
                  <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Plan</th>
                  <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Método</th>
                  <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Referencias</th>
                  <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Comprobante</th>
                  <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-4 text-right font-bold text-text-1 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-text-3 italic font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        <p>Cargando registros de pago...</p>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-text-3 font-medium">
                      No hay pagos registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-surface-hover/30 transition-colors group">
                      <td className="px-5 py-4 text-xs text-text-2 font-medium whitespace-nowrap">
                        {format(new Date(payment.created_at), "dd MMM yyyy, p", { locale: es })}
                      </td>
                      <td className="px-5 py-4 font-bold text-text-1 text-sm">
                        {payment.companies?.name || "Empresa eliminada"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="bg-brand/5 text-brand border-brand/20 uppercase font-black text-[9px] tracking-widest px-2">
                          {payment.plan_type}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="bg-surface-base text-text-2 border-border/60 uppercase font-bold text-[9px] tracking-wide px-2">
                          {payment.method === "pago_movil" ? "Pago Móvil" : payment.method}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {renderRefData(payment)}
                      </td>
                      <td className="px-5 py-4">
                        {payment.receipt_url ? (
                          <a 
                            href={payment.receipt_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all text-xs font-bold shadow-sm"
                          >
                            <Eye className="w-4 h-4" /> Comprobante
                          </a>
                        ) : (
                          <span className="text-xs text-text-3 flex items-center gap-1">
                            <X className="w-3 h-3" /> Sin archivo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {payment.status === "pending" && (
                          <Badge variant="outline" className="bg-status-warn/10 text-status-warn border-status-warn/20 uppercase font-bold text-[10px] px-2 py-0.5">
                            Pendiente
                          </Badge>
                        )}
                        {payment.status === "approved" && (
                          <Badge variant="outline" className="bg-status-ok/10 text-status-ok border-status-ok/20 uppercase font-bold text-[10px] px-2 py-0.5">
                            Aprobado
                          </Badge>
                        )}
                        {payment.status === "rejected" && (
                          <Badge variant="outline" className="bg-status-danger/10 text-status-danger border-status-danger/20 uppercase font-bold text-[10px] px-2 py-0.5">
                            Rechazado
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {payment.status === "pending" && (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-9 w-9 p-0 border-status-danger/30 text-status-danger hover:bg-status-danger hover:text-white rounded-lg transition-all"
                              onClick={() => handleAction(payment.id, payment.company_id, "rejected")}
                              disabled={processingId === payment.id}
                              title="Rechazar Pago"
                            >
                              {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-9 w-9 p-0 bg-status-ok hover:bg-status-ok/90 text-white shadow-lg shadow-status-ok/20 rounded-lg transition-all"
                              onClick={() => handleAction(payment.id, payment.company_id, "approved")}
                              disabled={processingId === payment.id}
                              title="Aprobar Pago e Iniciar Empresa"
                            >
                              {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
