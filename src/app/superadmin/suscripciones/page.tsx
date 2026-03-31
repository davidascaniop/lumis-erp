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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
            <Table>
              <TableHeader className="bg-surface-hover/20">
                <TableRow className="border-border">
                  <TableHead className="font-bold text-text-1 whitespace-nowrap">Fecha</TableHead>
                  <TableHead className="font-bold text-text-1">Empresa</TableHead>
                  <TableHead className="font-bold text-text-1">Plan</TableHead>
                  <TableHead className="font-bold text-text-1">Método</TableHead>
                  <TableHead className="font-bold text-text-1">Referencias</TableHead>
                  <TableHead className="font-bold text-text-1">Comprobante</TableHead>
                  <TableHead className="font-bold text-text-1">Estado</TableHead>
                  <TableHead className="font-bold text-text-1 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-text-3">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Cargando pagos...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-text-3 font-medium">
                      No hay pagos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id} className="border-border hover:bg-surface-hover/10 transition-colors">
                      <TableCell className="text-xs text-text-2 font-medium whitespace-nowrap">
                        {format(new Date(payment.created_at), "dd MMM yyyy, p", { locale: es })}
                      </TableCell>
                      <TableCell className="font-bold text-text-1">
                        {payment.companies?.name || "Empresa eliminada"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-brand/10 text-brand border-brand/20 uppercase font-bold text-[10px]">
                          {payment.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-surface-base text-text-1 border-border uppercase font-bold text-[10px]">
                          {payment.method === "pago_movil" ? "Pago Móvil" : payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renderRefData(payment)}
                      </TableCell>
                      <TableCell>
                        {payment.receipt_url ? (
                          <a 
                            href={payment.receipt_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/5 border border-brand/20 text-brand hover:bg-brand/10 transition-colors text-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver PDF/Img
                          </a>
                        ) : (
                          <span className="text-xs text-text-3">Sin archivo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.status === "pending" && (
                          <Badge variant="outline" className="bg-status-warn/10 text-status-warn border-status-warn/20 uppercase font-bold text-[10px]">
                            Pendiente
                          </Badge>
                        )}
                        {payment.status === "approved" && (
                          <Badge variant="outline" className="bg-status-ok/10 text-status-ok border-status-ok/20 uppercase font-bold text-[10px]">
                            Aprobado
                          </Badge>
                        )}
                        {payment.status === "rejected" && (
                          <Badge variant="outline" className="bg-status-danger/10 text-status-danger border-status-danger/20 uppercase font-bold text-[10px]">
                            Rechazado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 border-status-danger text-status-danger hover:bg-status-danger hover:text-white"
                              onClick={() => handleAction(payment.id, payment.company_id, "rejected")}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 w-8 p-0 bg-status-ok hover:bg-status-ok/90 text-white shadow-sm"
                              onClick={() => handleAction(payment.id, payment.company_id, "approved")}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
