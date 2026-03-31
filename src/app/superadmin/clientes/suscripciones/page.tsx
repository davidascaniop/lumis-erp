"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, Loader2, FileText, Search, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function SuscripcionesPage({ searchParams }: { searchParams?: { filter?: string } }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams?.filter || "all");
  
  // Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, search]); // Re-fetch or filter client side, but server filter is better. 
  // Let's implement full server fetch since Supabase allows it.

  const fetchPayments = async () => {
    setIsLoading(true);
    let query = supabase
      .from("subscription_payments")
      .select("*, companies(name, id)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      // Map filters if needed ('vencidos' is likely mapped to suspended on companies, but for payments let's just use payment status)
      // Wait, 'Vencidos' in payments doesn't exist natively. A payment can be 'pending', 'approved', 'rejected'.
      // If user wants 'Vencido', we might check companies. But let's assume 'rejected' matches 'vencido' for now, or 'pending', 'approved', 'rejected' directly.
      if (statusFilter === "vencidos") {
         query = query.in("status", ["rejected", "failed"]);
      } else if (statusFilter === "pending") {
         query = query.eq("status", "pending");
      } else if (statusFilter === "approved") {
         query = query.eq("status", "approved");
      }
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar pagos", { description: error.message });
    } else {
      let result = data || [];
      if (search) {
         result = result.filter((p: any) => p.companies?.name?.toLowerCase().includes(search.toLowerCase()));
      }
      setPayments(result);
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
          .update({ subscription_status: "suspended" }) // suspended roughly means vencido/rejected here
          .eq("id", companyId);

        if (companyError) throw companyError;
      }

      toast.success(
        newStatus === "approved"
          ? "Pago aprobado exitosamente. Empresa activada."
          : "Pago rechazado / suscripción suspendida."
      );
      
      // Update local state
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
      );
      
      // Close modal if open
      if (selectedReceipt?.id === paymentId) {
        setSelectedReceipt(null);
      }
      
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
        <div className="space-y-0.5">
          <p><strong>Ref:</strong> {data.ref}</p>
          <p className="text-text-3">Banco: {data.bank} - Céd: {data.dni}</p>
        </div>
      );
    }
    if (payment.method === "zinli" || payment.method === "zelle") {
      return (
        <div className="space-y-0.5">
          <p><strong>{payment.method.toUpperCase()}:</strong> {data.name}</p>
          <p className="text-text-3">{data.email}</p>
        </div>
      );
    }
    return <span className="text-text-3 text-[10px]">No ref</span>;
  };

  // Pricing helper
  const planPrices: Record<string, string> = { "basic": "$19.99", "pro": "$79.99", "enterprise": "$119.99" };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-1">Panel Financiero</h1>
          <p className="text-sm font-medium text-text-2 mt-1">
            Gestión y verificación de transacciones
          </p>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <input
            type="text"
            placeholder="Filtrar empresa..."
            className="w-full pl-9 pr-4 py-2 bg-surface-base border border-border rounded-xl text-sm focus:outline-none focus:border-brand/40 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
           {[
             { id: "all", label: "Todos" },
             { id: "pending", label: "Pendientes", color: "text-[#0288D1]" },
             { id: "approved", label: "Aprobados", color: "text-status-ok" },
             { id: "vencidos", label: "Vencidos", color: "text-status-danger" }
           ].map((st) => (
             <button
               key={st.id}
               onClick={() => setStatusFilter(st.id)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                 statusFilter === st.id 
                   ? "bg-text-1 text-white shadow-md shadow-black/10" 
                   : "bg-surface-base border border-border text-text-2 hover:bg-surface-hover hover:text-text-1"
               }`}
             >
               {st.label}
             </button>
           ))}
           {search && (
             <button onClick={() => setSearch("")} className="p-1 text-text-3 hover:text-status-danger transition-colors">
               <X className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-surface-base border-b border-border/50">
              <tr>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Empresa</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Transacción</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Monto</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 whitespace-nowrap text-xs uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-4 text-left font-bold text-text-1 text-xs uppercase tracking-wider">Estatus</th>
                <th className="px-5 py-4 text-right font-bold text-text-1 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-text-3 italic font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-brand" />
                      <p>Consultando registros financieros...</p>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-text-3 font-medium">
                    No se encontraron pagos con esos filtros.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-surface-hover/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-bold text-text-1 text-sm">{payment.companies?.name || "Empresa eliminada"}</div>
                      <Badge variant="outline" className="bg-brand/5 text-brand border-brand/20 uppercase font-black text-[9px] tracking-widest px-2 mt-1">
                        {payment.plan_type}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <div className="font-bold uppercase text-text-2 tracking-wider mb-1">
                        {payment.method === "pago_movil" ? "Pago Móvil" : payment.method}
                      </div>
                      {renderRefData(payment)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-heading font-black text-lg text-text-1">
                        {payment.amount_usd > 0 ? `$${payment.amount_usd}` : (planPrices[payment.plan_type] || "$0.00")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-text-2 font-medium whitespace-nowrap">
                      {format(new Date(payment.created_at), "dd MMM yyyy, p", { locale: es })}
                    </td>
                    <td className="px-5 py-4">
                      {payment.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-info/10 text-[#0288D1] text-[10px] font-bold uppercase tracking-wider border border-[#0288D1]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1] animate-pulse" /> Pendiente
                        </span>
                      )}
                      {payment.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-ok/10 text-status-ok text-[10px] font-bold uppercase tracking-wider border border-status-ok/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-ok" /> Pagado
                        </span>
                      )}
                      {payment.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-danger/10 text-status-danger text-[10px] font-bold uppercase tracking-wider border border-status-danger/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-danger" /> Vencido/Rechazado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {payment.receipt_url && payment.status === "pending" ? (
                          <button
                            onClick={() => setSelectedReceipt(payment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 rounded-lg transition-all text-xs font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" /> Ver Comprobante
                          </button>
                        ) : payment.receipt_url ? (
                          <button
                            onClick={() => setSelectedReceipt(payment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-base border border-border text-text-2 hover:bg-surface-hover hover:text-text-1 rounded-lg transition-all text-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" /> Recibo
                          </button>
                        ) : (
                          <span className="text-xs text-text-3 font-medium">Sin archivo</span>
                        )}
                        
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Visor de Comprobante */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)} />
          <div className="relative bg-surface-base rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-card">
              <div>
                <h3 className="font-bold text-text-1">Verificación de Comprobante</h3>
                <p className="text-xs text-text-2">{selectedReceipt.companies?.name} - Plan {selectedReceipt.plan_type.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="p-1.5 bg-surface-base hover:bg-surface-hover border border-border rounded-lg text-text-3 hover:text-text-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-surface-hover/30 flex justify-center items-center">
              {selectedReceipt.receipt_url?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedReceipt.receipt_url} className="w-full h-[60vh] rounded-xl border border-border bg-white" />
              ) : selectedReceipt.receipt_url ? (
                <img src={selectedReceipt.receipt_url} alt="Comprobante" className="max-w-full rounded-xl shadow-sm border border-border object-contain max-h-[60vh]" />
              ) : (
                <div className="text-center p-10"><CreditCard className="w-10 h-10 text-text-3 mx-auto mb-2" /><p className="text-text-2">El comprobante no existe o no tiene formato válido.</p></div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-surface-card flex justify-end gap-3 items-center">
              {processingId === selectedReceipt.id && <Loader2 className="w-5 h-5 animate-spin text-brand mr-2" />}
              
              <Button 
                variant="outline" 
                onClick={() => setSelectedReceipt(null)} 
                className="border-border text-text-2 hover:bg-surface-hover"
                disabled={processingId === selectedReceipt.id}
              >
                Cerrar
              </Button>
              
              {selectedReceipt.status === 'pending' && (
                <>
                  <Button 
                    variant="outline"
                    className="border-status-danger/30 text-status-danger hover:bg-status-danger hover:text-white"
                    onClick={() => handleAction(selectedReceipt.id, selectedReceipt.company_id, "rejected")}
                    disabled={processingId === selectedReceipt.id}
                  >
                    <X className="w-4 h-4 mr-1.5" /> Rechazar
                  </Button>
                  <Button 
                    className="bg-status-ok hover:bg-status-ok/90 text-white border-0 shadow-lg shadow-status-ok/20" 
                    onClick={() => handleAction(selectedReceipt.id, selectedReceipt.company_id, "approved")}
                    disabled={processingId === selectedReceipt.id}
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Aprobar Pago
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
