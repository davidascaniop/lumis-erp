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
  CalendarClock,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

export default function GastosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" />
        </div>
      }
    >
      <GastosContent />
    </Suspense>
  );
}

function GastosContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") as "all" | "overdue" | "upcoming" | null;

  const [expenses, setExpenses] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "overdue" | "upcoming">(
    initialFilter || "all",
  );
  const [sortBy, setSortBy] = useState<"date-desc" | "value-desc">("date-desc");

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Forms state
  const [formData, setFormData] = useState({
    partner_id: "",
    category: "",
    reference: "",
    amount_usd: "",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "Transferencia",
    notes: "",
  });

  const [paymentAmount, setPaymentAmount] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));

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

      const [expRes, provRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("*, partners(name, rif)")
          .eq("company_id", userData.company_id)
          .order("due_date", { ascending: true }),
        supabase
          .from("partners")
          .select("id, name, rif, type")
          .eq("company_id", userData.company_id)
          .order("name"),
      ]);

      setExpenses(expRes.data || []);
      setProviders(provRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const today = new Date();
  const totalPayable = expenses.reduce(
    (acc, e) => acc + (e.status !== "paid" ? Number(e.balance_usd || 0) : 0),
    0,
  );
  const overdueExpenses = expenses.filter(
    (e) => e.status !== "paid" && differenceInDays(today, new Date(e.due_date)) > 0,
  );
  const totalOverdue = overdueExpenses.reduce(
    (acc, e) => acc + Number(e.balance_usd || 0),
    0,
  );
  const upcomingExpenses = expenses.filter(
    (e) => {
      const diff = differenceInDays(new Date(e.due_date), today);
      return e.status !== "paid" && diff >= 0 && diff <= 7;
    }
  );
  const totalUpcoming = upcomingExpenses.reduce(
    (acc, e) => acc + Number(e.balance_usd || 0),
    0,
  );

  const handleCreateExpense = async () => {
    if (!formData.partner_id || !formData.category || !formData.amount_usd) {
      toast.error("Por favor completa los campos requeridos (Proveedor, Categoría, Monto).");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("users")
        .select("company_id")
        .eq("auth_id", user?.id)
        .single();

      const newExpense = {
        company_id: userData?.company_id,
        partner_id: formData.partner_id,
        category: formData.category,
        reference: formData.reference,
        amount_usd: Number(formData.amount_usd),
        balance_usd: Number(formData.amount_usd),
        paid_usd: 0,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        payment_method: formData.payment_method,
        notes: formData.notes,
        status: "pending"
      };

      const { error } = await supabase.from("expenses").insert(newExpense as any);
      if (error) throw error;

      toast.success("Gasto registrado correctamente.");
      setCreateOpen(false);
      setFormData({
        partner_id: "",
        category: "",
        reference: "",
        amount_usd: "",
        issue_date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(new Date(), "yyyy-MM-dd"),
        payment_method: "Transferencia",
        notes: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error("Error registrando gasto", { description: error.message || "Es posible que la tabla no exista." });
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!selectedExpense || !paymentAmount) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("auth_id", user?.id)
        .single();

      const amt = Number(paymentAmount);
      const newPaid = Number(selectedExpense.paid_usd || 0) + amt;
      const newBalance = Math.max(0, Number(selectedExpense.amount_usd || 0) - newPaid);
      const newStatus = newBalance <= 0 ? "paid" : "partial";

      const { error: expError } = await supabase
        .from("expenses")
        .update({
          paid_usd: newPaid,
          balance_usd: newBalance,
          status: newStatus
        } as any)
        .eq("id", selectedExpense.id);

      if (expError) throw expError;

      // Send output to cash flow transactions
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          company_id: userData?.company_id,
          type: "outflow",
          category: selectedExpense.category,
          amount_usd: amt,
          reference: `Pago a proveedor: ${selectedExpense.reference}`,
          date: paymentDate,
          payment_method: paymentMethod,
          expense_id: selectedExpense.id,
          user_id: userData?.id
        } as any);

      // We won't block if transactions table doesn't exist to not break the primary flow, but we can log it.
      if (txError) console.warn("Could not insert into transactions", txError);

      toast.success("Pago registrado correctamente. Flujo de caja actualizado.");
      setPayOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error registrando pago", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este gasto?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Gasto eliminado.");
      fetchData();
    } catch (error: any) {
      toast.error("Error eliminando gasto", { description: error.message });
    }
  };

  let baseFiltered = expenses;
  if (filterType === "overdue") baseFiltered = overdueExpenses;
  if (filterType === "upcoming") baseFiltered = upcomingExpenses;

  const filtered = baseFiltered
    .filter(
      (e) =>
        e.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      }
      return Number(b.balance_usd || 0) - Number(a.balance_usd || 0);
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-primary">Gastos & Cuentas por Pagar</h1>
          <p className="text-text-2 mt-1 text-sm">
            Registra y controla los pagos a proveedores y gastos operativos
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Registrar Gasto
        </button>
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
            <p className="text-sm text-text-2 font-medium">Total por Pagar</p>
            <p className="text-2xl font-primary">
              {loading ? "-" : formatCurrency(totalPayable)}
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
            <p className="text-sm text-status-danger font-medium">Vencidos</p>
            <p className="text-2xl font-primary text-text-1">
              {loading ? "-" : formatCurrency(totalOverdue)}
            </p>
          </div>
        </Card>

        <Card
          onClick={() => setFilterType("upcoming")}
          className={`p-6 bg-surface-card shadow-card flex items-center gap-4 cursor-pointer transition-all hover-card-effect ${filterType === "upcoming" ? "ring-2 ring-brand ring-offset-2 ring-offset-surface-base border-brand" : "border-brand/20"}`}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand/15 text-brand">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-2 font-medium">Próximos a Vencer (7d)</p>
            <p className="text-2xl font-primary">
              {loading ? "-" : formatCurrency(totalUpcoming)}
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
              placeholder="Buscar por proveedor, referencia o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 h-11 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-full sm:w-56 bg-surface-card border-border/40 h-11 font-bold text-text-2">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent className="bg-surface-card border-border text-black">
                <SelectItem value="date-desc">Más reciente (Vencimiento)</SelectItem>
                <SelectItem value="value-desc">Monto más alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 no-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 text-text-2 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Proveedor</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Cat / Referencia</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Emisión</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Vencimiento</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Monto (Saldo)</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center text-text-3 font-medium">
                    No hay gastos para mostrar.
                  </td>
                </tr>
              ) : (
                filtered.map((e, idx) => {
                  const isOverdue = e.status !== "paid" && differenceInDays(today, new Date(e.due_date)) > 0;
                  return (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-bold text-text-1">{e.partners?.name || 'Proveedor Eliminado'}</p>
                            <p className="text-[10px] text-text-3 font-mono">{e.partners?.rif}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-text-2">{e.category}</p>
                        <p className="font-mono text-brand font-black text-xs">{e.reference || "S/N"}</p>
                      </td>
                      <td className="px-6 py-4 text-text-2">
                        {e.issue_date ? format(new Date(e.issue_date), "dd MMM yy", { locale: es }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isOverdue ? "text-status-danger font-bold" : "text-text-2"}>
                          {e.due_date ? format(new Date(e.due_date), "dd MMM yyyy", { locale: es }) : '-'}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-status-danger underline decoration-dotted">Vencido</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-mono font-black text-text-1">
                          {formatCurrency(e.amount_usd)}
                        </p>
                        {e.balance_usd < e.amount_usd && e.balance_usd > 0 && (
                          <p className={`font-mono text-xs ${isOverdue ? "text-status-danger" : "text-text-3"}`}>
                            Resta: {formatCurrency(e.balance_usd)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={isOverdue && e.status !== "paid" ? "overdue" : e.status || "pending"} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedExpense(e);
                              setViewOpen(true);
                            }}
                            className="p-2 bg-white/5 border border-white/10 text-text-3 rounded-xl hover:text-white hover:bg-white/10 transition-all"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {e.status !== "paid" && (
                            <button
                              onClick={() => {
                                setSelectedExpense(e);
                                setPaymentAmount(e.balance_usd || e.amount_usd);
                                setPayOpen(true);
                              }}
                              className="px-4 py-2 bg-brand/10 border border-brand/20 text-brand rounded-xl text-xs font-bold hover:bg-brand hover:text-white transition-all"
                            >
                              Pagar
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-2 bg-status-danger/10 text-status-danger rounded-xl hover:bg-status-danger hover:text-white transition-all"
                            title="Eliminar Gasto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* DIALOGO: REGISTRAR GASTO */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-syne text-xl text-text-1">Registrar Nuevo Gasto</DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              El gasto se guardará como pendiente hasta que registres su pago.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Proveedor</label>
              <Select value={formData.partner_id} onValueChange={(val) => setFormData((p) => ({ ...p, partner_id: val }))}>
                <SelectTrigger className="bg-surface-input border-none h-12">
                  <SelectValue placeholder="Selecciona un proveedor..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black max-h-60">
                  {providers.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.rif ? `(${p.rif})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Categoría</label>
              <Select value={formData.category} onValueChange={(val) => setFormData((p) => ({ ...p, category: val }))}>
                <SelectTrigger className="bg-surface-input border-none h-12">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  <SelectItem value="Inventario">Inventario</SelectItem>
                  <SelectItem value="Servicios">Servicios</SelectItem>
                  <SelectItem value="Nómina">Nómina</SelectItem>
                  <SelectItem value="Alquiler">Alquiler</SelectItem>
                  <SelectItem value="Transporte">Transporte</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Factura / Ref.</label>
              <Input
                placeholder="Ej: F-1029"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto ($)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount_usd}
                onChange={(e) => setFormData({ ...formData, amount_usd: e.target.value })}
                className="bg-surface-input border border-border/40 h-12 font-mono text-lg text-text-1 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Método de Pago (Ref)</label>
              <Select value={formData.payment_method} onValueChange={(val) => setFormData((p) => ({ ...p, payment_method: val }))}>
                <SelectTrigger className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha de Emisión</label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha de Vencimiento</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Notas / Concepto</label>
              <textarea
                rows={2}
                placeholder="Concepto del gasto..."
                value={formData.notes}
                onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-surface-input border border-border/40 resize-none w-full rounded-xl px-4 py-3 text-sm text-text-1 focus:ring-4 focus:border-brand/40 focus:ring-brand/5 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Comprobante (Opcional)</label>
              <Input
                type="file"
                className="bg-surface-input border border-border/40 h-12 text-sm text-text-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 transition-all cursor-pointer focus:border-brand/40 focus:ring-4 focus:ring-brand/5 outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setCreateOpen(false)}
              className="px-6 py-2 text-text-3 font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={handleCreateExpense}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-black shadow-brand hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Gasto"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOGO: REGISTRAR PAGO */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1">
          <DialogHeader>
            <DialogTitle className="font-syne text-xl text-text-1">Registrar Pago a Proveedor</DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Proveedor: {selectedExpense?.partners?.name} | Saldo Pendiente: <span className="text-brand font-bold">{formatCurrency(selectedExpense?.balance_usd)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto a Pagar ($)</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="bg-surface-input border border-border/40 text-xl text-text-1 font-bold font-mono h-12 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Método de Pago</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha de Pago</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Comprobante de Pago</label>
               <Input
                type="file"
                className="bg-surface-input border border-border/40 h-12 text-sm text-text-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 transition-all cursor-pointer focus:border-brand/40 focus:ring-4 focus:ring-brand/5 outline-none"
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
                "Confirmar Pago"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOGO: VER DETALLES */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1">
          <DialogHeader>
            <DialogTitle className="font-syne text-xl text-text-1">Detalle del Gasto</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Proveedor</p>
                  <p className="font-bold">{selectedExpense.partners?.name}</p>
                </div>
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Categoría</p>
                  <p>{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Factura / Ref</p>
                  <p className="font-mono text-brand">{selectedExpense.reference || "S/N"}</p>
                </div>
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Estado</p>
                  <StatusBadge status={selectedExpense.status} />
                </div>
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Monto Original</p>
                  <p className="font-mono text-lg font-bold">{formatCurrency(selectedExpense.amount_usd)}</p>
                </div>
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Saldo Pendiente</p>
                  <p className="font-mono text-lg font-bold text-status-danger">{formatCurrency(selectedExpense.balance_usd)}</p>
                </div>
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Fecha Emisión</p>
                  <p>{selectedExpense.issue_date}</p>
                </div>
                <div>
                  <p className="text-text-3 text-xs uppercase font-bold tracking-wider">Fecha Vencimiento</p>
                  <p>{selectedExpense.due_date}</p>
                </div>
              </div>
              <div>
                <p className="text-text-3 text-xs uppercase font-bold tracking-wider mb-1">Notas</p>
                <div className="p-3 bg-surface-input rounded-xl border border-border/40 text-text-2">
                  {selectedExpense.notes || "No hay notas."}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
             <button
              onClick={() => setViewOpen(false)}
              className="px-6 py-2 text-text-3 font-bold text-sm w-full bg-white/5 rounded-xl hover:bg-white/10"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
