"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  Search,
  Loader2,
  Wallet,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Printer,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Semaforo } from "@/components/ui/semaforo";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CobranzaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" />
        </div>
      }
    >
      <CobranzaContent />
    </Suspense>
  );
}

function CobranzaContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") as "all" | "overdue" | null;

  const [receivables, setReceivables] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "overdue">(
    initialFilter || "all",
  );
  const [sortBy, setSortBy] = useState<"date-desc" | "value-desc">("date-desc");

  useEffect(() => {
    if (initialFilter) setFilterType(initialFilter);
  }, [initialFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("company_id")
        .eq("auth_id", user.id)
        .single();
      if (!userData) return;

      const [recesRes, paymentsRes] = await Promise.all([
        supabase
          .from("receivables")
          .select("*, partners(name, credit_status, rif)")
          .eq("company_id", userData.company_id)
          .neq("status", "paid")
          .order("due_date", { ascending: true }),
        supabase
          .from("payments")
          .select("*")
          .eq("company_id", userData.company_id)
          .eq("status", "pending"),
      ]);

      setReceivables(recesRes.data || []);
      setPendingVerifications(paymentsRes.data || []);
    } catch (error) {
      console.error("Error fetching collections data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const today = new Date();
  const totalReceivable = receivables.reduce(
    (acc, r) => acc + Number(r.balance_usd),
    0,
  );
  const overdueReceivables = receivables.filter(
    (r) => differenceInDays(today, new Date(r.due_date)) > 0,
  );
  const totalOverdue = overdueReceivables.reduce(
    (acc, r) => acc + Number(r.balance_usd),
    0,
  );
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
  const [verifOpen, setVerifOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Payment Form state
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentRef, setPaymentRef] = useState("");

  const handleRegisterPayment = async () => {
    if (!selectedReceivable) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("auth_id", user?.id)
        .single();

      const { error: payErr } = await supabase.from("payments").insert({
        company_id: userData?.company_id,
        receivable_id: selectedReceivable.id,
        partner_id: selectedReceivable.partner_id,
        collected_by: userData?.id,
        amount_usd: paymentAmount,
        payment_method: paymentMethod,
        reference: paymentRef,
        status: "pending",
      } as any);

      if (payErr) throw payErr;

      toast.success("Pago registrado. Pendiente por verificación.");
      setPayOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error registrando pago", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPayment = async (
    paymentId: string,
    status: "verified" | "rejected",
  ) => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user?.id)
        .single();

      // 1. Actualizar el pago
      const { error: payErr } = await supabase
        .from("payments")
        .update({
          status,
          verified_by: userData?.id,
          verified_at: new Date().toISOString(),
        } as any)
        .eq("id", paymentId);

      if (payErr) throw payErr;

      // 2. Si fue verificado, actualizar el saldo de la CxC y del Pedido
      if (status === "verified") {
        const payment = pendingVerifications.find((p) => p.id === paymentId);
        const receivable = receivables.find(
          (r) => r.id === payment.receivable_id,
        );

        if (receivable) {
          const newBalance =
            Number(receivable.balance_usd) - Number(payment.amount_usd);
          const newPaid =
            Number(receivable.paid_usd) + Number(payment.amount_usd);
          const newStatus = newBalance <= 0 ? "paid" : "partial";

          // Actualizar CxC
          await supabase
            .from("receivables")
            .update({
              balance_usd: newBalance,
              paid_usd: newPaid,
              status: newStatus,
            } as any)
            .eq("id", receivable.id);

          // Actualizar Order asociada
          if (receivable.order_id) {
            const { data: orderData } = await supabase
              .from("orders")
              .select("amount_paid, amount_due")
              .eq("id", receivable.order_id)
              .single();
            if (orderData) {
              const newOrderPaid =
                Number(orderData.amount_paid || 0) + Number(payment.amount_usd);
              const newOrderDue = Math.max(
                0,
                Number(orderData.amount_due || receivable.amount_usd) -
                  Number(payment.amount_usd),
              );
              const newOrderStatus = newOrderDue <= 0 ? "completed" : "pending";

              await supabase
                .from("orders")
                .update({
                  amount_paid: newOrderPaid,
                  amount_due: newOrderDue,
                  status: newOrderStatus,
                } as any)
                .eq("id", receivable.order_id);
            }
          }
        }
      }

      toast.success(
        `Pago ${status === "verified" ? "verificado" : "rechazado"}`,
      );
      fetchData();
    } catch (error: any) {
      toast.error("Error en verificación", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const baseFiltered =
    filterType === "overdue" ? overdueReceivables : receivables;

  const filtered = baseFiltered
    .filter(
      (r) =>
        r.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.partners?.rif?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "date-desc") {
        return (
          new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        );
      }
      return Number(b.balance_usd) - Number(a.balance_usd);
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-primary">
          Cobranza & CxC
        </h1>
        <p className="text-text-2 mt-1 text-sm">
          Gestión de cartera, registro de abonos y verificación.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 stagger">
        <Card
          onClick={() => setFilterType("all")}
          className={`p-6 bg-surface-card shadow-card flex items-center gap-4 cursor-pointer transition-all hover-card-effect ${filterType === "all" ? "ring-2 ring-brand ring-offset-2 ring-offset-surface-base border-brand" : "border-brand/20"}`}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand/15 text-brand">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-2 font-medium">Total por Cobrar</p>
            <p className="text-2xl font-primary">
              {loading ? "-" : formatCurrency(totalReceivable)}
            </p>
          </div>
        </Card>

        <Card
          onClick={() => setFilterType("overdue")}
          className={`p-6 bg-surface-card shadow-card flex items-center gap-4 relative overflow-hidden cursor-pointer transition-all hover-card-effect ${filterType === "overdue" ? "ring-2 ring-status-danger ring-offset-2 ring-offset-surface-base border-status-danger" : "border-status-danger/20"}`}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-status-danger/10 rounded-full blur-[40px] pointer-events-none" />
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-status-danger/15 text-status-danger relative z-10">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-status-danger font-medium">
              Cartera Vencida
            </p>
            <p className="text-2xl font-primary text-text-1">
              {loading ? "-" : formatCurrency(totalOverdue)}
            </p>
          </div>
        </Card>

        <Card
          onClick={() => setVerifOpen(true)}
          className="p-6 bg-surface-card shadow-card flex items-center gap-4 cursor-pointer transition-all hover-card-effect border-brand/20"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand/15 text-brand">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-2 font-medium">Verificación Pendiente</p>
            <p className="text-2xl font-primary">
              {pendingVerifications.length}
            </p>
          </div>
        </Card>
      </div>

      {/* TABLA DINAMICA */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card transition-all flex flex-col h-[65vh]">
        <div className="p-4 border-b border-white/5 bg-surface-card/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar por factura, cliente o RIF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 h-11 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={sortBy}
              onValueChange={(val: any) => setSortBy(val)}
            >
              <SelectTrigger className="w-full sm:w-56 bg-surface-card border-border/40 h-11 font-bold text-text-2">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent className="bg-surface-card border-border text-black">
                <SelectItem value="date-desc">Más reciente (Fecha)</SelectItem>
                <SelectItem value="value-desc">Deuda más alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 no-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 text-text-2 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">
                  Clte / Deudor
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">
                  Factura N°
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">
                  Vencimiento
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">
                  Saldo Deuda
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">
                  Estado
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-24 text-center text-text-3 font-medium"
                  >
                    No hay registros pendientes para mostrar.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const isOverdue =
                    r.status !== "paid" &&
                    differenceInDays(today, new Date(r.due_date)) > 0;
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Semaforo
                            status={r.partners?.credit_status || "green"}
                          />
                          <div>
                            <p className="font-bold text-text-1">
                              {r.partners?.name}
                            </p>
                            <p className="text-[10px] text-text-3 font-mono">
                              {r.partners?.rif}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-brand font-black">
                        {r.invoice_number || "S/N"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            isOverdue
                              ? "text-status-danger font-bold"
                              : "text-text-2"
                          }
                        >
                          {format(new Date(r.due_date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-status-danger underline decoration-dotted">
                            Vencida
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-mono text-lg font-black ${isOverdue ? "text-status-danger" : "text-text-1"}`}
                        >
                          {formatCurrency(r.balance_usd)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge
                          status={isOverdue ? "overdue" : r.status || "open"}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReceivable(r);
                              setPaymentAmount(r.balance_usd);
                              setPayOpen(true);
                            }}
                            className="px-4 py-2 bg-brand/10 border border-brand/20 text-brand rounded-xl text-xs font-bold hover:bg-brand hover:text-white transition-all"
                          >
                            Cobrar
                          </button>
                          {r.order_id && (
                            <Link
                              href={`/dashboard/ventas/${r.order_id}/nota-entrega`}
                              className="p-2 bg-white/5 border border-white/10 text-text-3 rounded-xl hover:text-white hover:bg-white/10 transition-all"
                              title="Imprimir Nota"
                            >
                              <Printer className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOGO: REGISTRAR COBRO */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="bg-surface-base border-border text-white">
          <DialogHeader>
            <DialogTitle className="font-syne text-xl">
              Registrar Abono/Pago
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Cliente: {selectedReceivable?.partners?.name} | Saldo:{" "}
              {formatCurrency(selectedReceivable?.balance_usd)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                Monto a Abonar
              </label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="bg-surface-input border-none text-xl font-bold font-mono h-12"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                Método de Pago
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-surface-input border-none h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  <SelectItem value="Efectivo">Efectivo ($/Bs)</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                  <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                Referencia (Opcional)
              </label>
              <Input
                placeholder="Ej: #9928"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="bg-surface-input border-none h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setPayOpen(false)}
              className="px-6 py-2 text-text-3 font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={handleRegisterPayment}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-black shadow-brand hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "REGISTRAR PAGO"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOGO: VERIFICACIONES PENDIENTES */}
      <Dialog open={verifOpen} onOpenChange={setVerifOpen}>
        <DialogContent className="bg-surface-base border-border text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-syne text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand" /> Verificaciones de
              Pago
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Acepta o rechaza los reportes de pago de los vendedores.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-3 py-4 pr-2 no-scrollbar">
            {pendingVerifications.length === 0 ? (
              <div className="py-10 text-center text-text-3 font-medium">
                No hay pagos pendientes de verificación.
              </div>
            ) : (
              pendingVerifications.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center gap-4"
                >
                  <div>
                    <p className="font-bold text-white">
                      {formatCurrency(p.amount_usd)}
                    </p>
                    <p className="text-xs text-text-3">
                      {p.payment_method} - Ref: {p.reference || "S/N"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyPayment(p.id, "rejected")}
                      className="px-3 py-1.5 bg-status-danger/10 text-status-danger rounded-lg text-[11px] font-bold hover:bg-status-danger/20 transition-all border border-status-danger/20"
                    >
                      RECHAZAR
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(p.id, "verified")}
                      className="px-3 py-1.5 bg-status-ok/10 text-status-ok rounded-lg text-[11px] font-bold hover:bg-status-ok/20 transition-all border border-status-ok/20"
                    >
                      VERIFICAR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
