"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  User,
  Package,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Semaforo } from "@/components/ui/semaforo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

export default function OrderDetailsPage({ params }: { params: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  // Payment confirmation state
  const [paymentType, setPaymentType] = useState<"contado" | "credito">(
    "contado",
  );
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [amountPaid, setAmountPaid] = useState(0);

  const fetchOrder = async () => {
    const resolvedParams = await params;
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
                *,
                users ( full_name ),
                partners ( id, name, rif, credit_status, current_balance, credit_limit ),
                order_items ( id, qty, price_usd, subtotal, product_id, products (name) )
            `,
      )
      .eq("id", resolvedParams.id)
      .single();

    if (error || !data) {
      toast.error("No se encontró el pedido");
      router.push("/dashboard/ventas");
      return;
    }

    // Cargar historial de pagos si existe CxC
    const { data: cxc } = await supabase
      .from("receivables")
      .select("id, payments(*)")
      .eq("order_id", data.id)
      .maybeSingle();

    if (cxc && cxc.payments) {
      setPayments(cxc.payments);
    }

    setOrder(data);
    setAmountPaid(data.total_usd); // Default to full pay for cash
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  const handleConfirmOrder = async () => {
    setSaving(true);
    try {
      const amountDue = order.total_usd - amountPaid;
      const isFullyPaid = amountDue <= 0;

      // 1. Actualizar Orden
      const { error: orderErr } = await supabase
        .from("orders")
        .update({
          status: isFullyPaid ? "completed" : "confirmed",
          payment_type: paymentType,
          payment_method: paymentMethod,
          amount_paid: amountPaid,
          amount_due: amountDue,
        } as any)
        .eq("id", order.id);

      if (orderErr) throw orderErr;

      // 2. Si hay deuda, crear o actualizar la CxC (Receivable)
      if (!isFullyPaid) {
        const { data: existingCxC } = await supabase
          .from("receivables")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();

        if (existingCxC) {
          await supabase
            .from("receivables")
            .update({
              balance_usd: amountDue,
              amount_usd: order.total_usd,
              status: amountPaid > 0 ? "partial" : "open",
            } as any)
            .eq("id", existingCxC.id);
        } else {
          const { error: cxcErr } = await supabase.from("receivables").insert({
            company_id: order.company_id,
            partner_id: order.partners.id,
            order_id: order.id,
            invoice_number: `INV-${order.order_number.split("-")[1]}`,
            amount_usd: order.total_usd,
            amount_bs: order.total_bs,
            balance_usd: amountDue,
            status: amountPaid > 0 ? "partial" : "open",
            due_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          } as any);

          if (cxcErr) throw cxcErr;
        }
      }

      toast.success("Pedido confirmado exitosamente");
      setConfirmOpen(false);
      fetchOrder();
    } catch (error: any) {
      toast.error("Error al confirmar", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" />
      </div>
    );

  const progress =
    Math.min(
      100,
      (Number(order.partners?.current_balance) /
        Number(order.partners?.credit_limit)) *
        100,
    ) || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* VOLVER */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-text-3 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Ventas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* HEADER */}
          <Card className="p-6 bg-surface-card border-border-brand shadow-brand flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-mono font-bold text-brand">
                  {order.order_number}
                </h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm text-text-3 mt-1">
                Emitido:{" "}
                {format(new Date(order.created_at), "dd MMM yyyy, p", {
                  locale: es,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-3 uppercase tracking-widest font-bold">
                Vendedor
              </p>
              <p className="font-semibold text-white">
                {order.users?.full_name}
              </p>
            </div>
          </Card>

          {/* CLIENTE */}
          <Card className="p-6 bg-surface-card border-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-syne font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-brand" /> Información del Cliente
              </h2>
              <Semaforo
                status={order.partners?.credit_status || "green"}
                showLabel
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="font-bold text-white text-lg">
                  {order.partners?.name}
                </p>
                <p className="text-sm text-text-3 font-mono">
                  {order.partners?.rif}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-xs text-text-3 uppercase font-bold mb-1">
                  Estatus Crediticio
                </p>
                <p className="text-white font-mono font-bold">
                  ${Number(order.partners?.current_balance).toFixed(2)} / $
                  {Number(order.partners?.credit_limit).toFixed(2)}
                </p>
                <div className="w-32 h-1 bg-surface-base rounded-full mt-2 ml-auto overflow-hidden">
                  <div
                    className="bg-brand h-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* PRODUCTOS */}
          <Card className="p-6 bg-surface-card border-border shadow-card overflow-hidden">
            <h3 className="text-lg font-syne font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" /> Líneas de Pedido
            </h3>
            <table className="w-full text-sm">
              <thead className="text-text-3 border-b border-white/5">
                <tr>
                  <th className="pb-3 text-left font-semibold">Producto</th>
                  <th className="pb-3 text-center font-semibold text-xs">
                    CANT
                  </th>
                  <th className="pb-3 text-right font-semibold text-xs">
                    P. UNIT ($)
                  </th>
                  <th className="pb-3 text-right font-semibold text-xs text-brand">
                    SUBTOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {order.order_items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-4 text-white font-medium">
                      {item.products?.name}
                    </td>
                    <td className="py-4 text-center text-text-2">{item.qty}</td>
                    <td className="py-4 text-right text-text-2">
                      ${Number(item.price_usd).toFixed(2)}
                    </td>
                    <td className="py-4 text-right text-white font-mono font-bold">
                      ${Number(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 flex flex-col items-end gap-2 border-t border-white/5 pt-6">
              <div className="flex justify-between w-full md:w-64 text-text-3 text-sm">
                <span>Total Neto</span>
                <span className="text-white font-bold">
                  ${Number(order.total_usd).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between w-full md:w-64 text-lg font-syne font-black text-brand bg-brand/5 p-3 rounded-xl border border-brand/20">
                <span>TOTAL</span>
                <span>${Number(order.total_usd).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-text-3 font-mono">
                Factor BCV: Bs. {order.total_bs / order.total_usd} | Eq: Bs.{" "}
                {Number(order.total_bs).toLocaleString()}
              </p>
            </div>
          </Card>

          <div className="flex gap-4">
            {order.status === "draft" && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="px-8 py-4 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirmar y Cerrar Venta
              </button>
            )}
            <button className="px-8 py-4 bg-surface-card border border-border text-text-3 rounded-xl hover:text-white transition-all">
              <Link href={`/dashboard/ventas/${order.id}/nota-entrega`}>
                Imprimir Comprobante
              </Link>
            </button>
          </div>
        </div>

        {/* RESUMEN DE PAGO (LATER) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 bg-surface-card border-brand/20 shadow-brand border flex flex-col gap-4">
            <h3 className="text-lg font-syne font-bold text-white">
              Resumen de Pago
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-text-3">Condición</span>
                <span
                  className={`font-bold capitalize ${order.payment_type === "credito" ? "text-status-warning" : "text-status-ok"}`}
                >
                  {order.payment_type || "Pendiente"}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-text-3">Método Inicial</span>
                <span className="text-white font-medium">
                  {order.payment_method || "-"}
                </span>
              </div>
              <div className="p-4 bg-surface-base rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-text-3">
                  <span>Pagado ($)</span>
                  <span className="text-status-ok font-bold">
                    ${Number(order.amount_paid || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-text-3">
                  <span>Deuda Restante ($)</span>
                  <span className="text-status-danger font-bold">
                    ${Number(order.amount_due || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* HISTORIAL DE PAGOS */}
          {order.payment_type === "credito" && (
            <Card className="p-6 bg-surface-card border-border shadow-card flex flex-col gap-4">
              <h3 className="text-lg font-syne font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand" /> Historial de
                Cobros
              </h3>
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <p className="text-xs text-text-3 text-center py-4">
                    No hay abonos adicionales registrados para esta deuda.
                  </p>
                ) : (
                  payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 bg-surface-base border border-border rounded-xl"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-text-3">
                          {format(new Date(p.created_at), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </p>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {p.payment_method}
                          </p>
                          {p.reference && (
                            <p className="text-[10px] text-text-3 uppercase">
                              Ref: {p.reference}
                            </p>
                          )}
                        </div>
                        <p className="font-mono font-bold text-status-ok">
                          +${Number(p.amount_usd).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* DIALOGO DE CONFIRMACIÓN DE PAGO */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-surface-base border-border sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-syne text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-brand" /> Cierre de Venta
            </DialogTitle>
            <DialogDescription className="text-text-3">
              Define cómo registrarás el cobro de este pedido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* CONDICION */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-text-2 uppercase tracking-widest">
                Condición de Pago
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setPaymentType("contado");
                    setAmountPaid(order.total_usd);
                  }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border ${paymentType === "contado" ? "bg-brand/20 border-brand text-brand shadow-glow-sm" : "bg-surface-card border-border text-text-3"}`}
                >
                  <Banknote className="w-4 h-4" /> Contado
                </button>
                <button
                  onClick={() => setPaymentType("credito")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border ${paymentType === "credito" ? "bg-status-warning/20 border-status-warning text-status-warning shadow-glow-sm" : "bg-surface-card border-border text-text-3"}`}
                >
                  <CreditCard className="w-4 h-4" /> Crédito
                </button>
              </div>
            </div>

            {/* METODO */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-text-2 uppercase tracking-widest">
                Método de Recibo
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full bg-surface-card border-border text-white h-12 rounded-xl focus:ring-brand/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-white">
                  <SelectItem value="Efectivo">Efectivo ($/Bs)</SelectItem>
                  <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                  <SelectItem value="Transferencia">
                    Transferencia Bancaria
                  </SelectItem>
                  <SelectItem value="Punto de Venta">Punto de Venta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ABONO */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-2 uppercase tracking-widest">
                  Monto Pagado / Abono ($)
                </label>
                {paymentType === "credito" && (
                  <span className="text-[10px] text-brand font-mono">
                    Restante: ${(order.total_usd - amountPaid).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="pl-10 bg-surface-card border-border h-12 rounded-xl text-lg font-bold text-white focus:ring-brand"
                />
              </div>
            </div>

            {paymentType === "credito" && (
              <div className="flex gap-2 p-3 bg-status-warning/10 border border-status-warning/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-status-warning shrink-0" />
                <p className="text-[10px] text-status-warning leading-tight">
                  Se generará una cuenta por cobrar de{" "}
                  <strong>${(order.total_usd - amountPaid).toFixed(2)}</strong>{" "}
                  asociada a este cliente.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-6 py-3 rounded-xl text-sm font-medium text-text-3 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={handleConfirmOrder}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Cierre
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
