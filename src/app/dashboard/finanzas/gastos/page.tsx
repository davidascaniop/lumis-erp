"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { useTreasuryAccounts, registerTreasuryMovement } from "@/hooks/use-treasury";
import { motion, AnimatePresence } from "framer-motion";
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
  Filter,
  DollarSign,
  Receipt,
  Download,
  Building2,
  CreditCard,
  History,
  X,
  FileText,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
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
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- Tab Types ---
type GastoTab = "todos" | "proveedores" | "operativos" | "nomina" | "vencidos";

const EXPENSE_CATEGORIES = [
  "Proveedor/Compra",
  "Nómina",
  "Alquiler",
  "Servicios Básicos",
  "Internet/Telefonía",
  "Transporte",
  "Papelería/Insumos",
  "Préstamo/Financiamiento",
  "Impuestos",
  "Otro"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Proveedor/Compra": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Nómina": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Alquiler": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "Servicios Básicos": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "Internet/Telefonía": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  "Transporte": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  "Papelería/Insumos": "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "Préstamo/Financiamiento": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Impuestos": "bg-red-500/10 text-red-500 border-red-500/20",
  "Otro": "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function GastosYPagosPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" /></div>}>
      <GastosContent />
    </Suspense>
  );
}

function GastosContent() {
  const supabase = createClient();
  const { user } = useUser();
  const { rate } = useBCV();
  const { accounts: treasuryAccounts } = useTreasuryAccounts(user?.company_id);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GastoTab>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    partner_id: "none",
    beneficiary_name: "",
    category: "",
    reference: "",
    amount_usd: "",
    amount_bs: "",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(), "yyyy-MM-dd"),
    is_recurring: false,
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "Transferencia",
    date: format(new Date(), "yyyy-MM-dd"),
    receipt: null as File | null,
    treasury_account_id: "",
  });

  const fetchData = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const { data: expData, error: expErr } = await supabase
        .from("expenses")
        .select("*, partners(name, rif)")
        .eq("company_id", user.company_id)
        .order("due_date", { ascending: true });
      
      const { data: partData } = await supabase
        .from("partners")
        .select("id, name, rif, type")
        .eq("company_id", user.company_id)
        .order("name");

      if (expErr) throw expErr;
      setExpenses(expData || []);
      setPartners(partData || []);
    } catch (err: any) {
      toast.error("Error al cargar datos", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.company_id]);

  // Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const gastosMes = expenses.filter(e => {
      const d = new Date(e.issue_date);
      return d >= start && d <= end;
    }).reduce((acc, e) => acc + Number(e.amount_usd || 0), 0);

    const pendientes = expenses.filter(e => e.status !== "paid")
      .reduce((acc, e) => acc + Number(e.balance_usd || 0), 0);

    const vencidos = expenses.filter(e => e.status !== "paid" && differenceInDays(now, new Date(e.due_date)) > 0)
      .reduce((acc, e) => acc + Number(e.balance_usd || 0), 0);

    const proximos = expenses.filter(e => {
      const diff = differenceInDays(new Date(e.due_date), now);
      return e.status !== "paid" && diff >= 0 && diff <= 7;
    }).reduce((acc, e) => acc + Number(e.balance_usd || 0), 0);

    return { gastosMes, pendientes, vencidos, proximos };
  }, [expenses]);

  // In-form logic: Auto BCV
  useEffect(() => {
    if (formData.amount_usd && rate) {
      const bs = (Number(formData.amount_usd) * rate).toFixed(2);
      setFormData(prev => ({ ...prev, amount_bs: bs }));
    }
  }, [formData.amount_usd, rate]);

  // Filtering
  const filteredExpenses = useMemo(() => {
    let base = expenses;
    const now = new Date();

    if (activeTab === "proveedores") base = base.filter(e => e.category === "Proveedor/Compra");
    if (activeTab === "operativos") base = base.filter(e => !["Proveedor/Compra", "Nómina"].includes(e.category));
    if (activeTab === "nomina") base = base.filter(e => e.category === "Nómina");
    if (activeTab === "vencidos") base = base.filter(e => e.status !== "paid" && differenceInDays(now, new Date(e.due_date)) > 0);

    return base.filter(e => 
      e.reference?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.beneficiary_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, activeTab, searchQuery]);

  const handleSaveExpense = async () => {
    if (!formData.category || !formData.amount_usd) {
      toast.error("Faltan campos obligatorios");
      return;
    }
    setSaving(true);
    try {
      if (formData.is_recurring) {
         toast.info("Redirigiendo a Gastos Recurrentes...");
         // We would normally pass state here or just redirect
         router.push("/dashboard/finanzas/recurrentes");
         return;
      }

      const payload = {
        company_id: user.company_id,
        partner_id: formData.partner_id === "none" ? null : formData.partner_id,
        beneficiary_name: formData.partner_id === "none" ? formData.beneficiary_name : null,
        category: formData.category,
        reference: formData.reference,
        amount_usd: Number(formData.amount_usd),
        balance_usd: Number(formData.amount_usd),
        amount_bs: Number(formData.amount_bs),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes,
        status: "pending",
        paid_usd: 0
      };

      const { error } = await supabase.from("expenses").insert(payload);
      if (error) throw error;

      toast.success("Gasto registrado");
      setCreateOpen(false);
      resetExpenseForm();
      fetchData();
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedExpense || !paymentData.amount) return;
    setSaving(true);
    try {
      const amt = Number(paymentData.amount);
      const newPaid = Number(selectedExpense.paid_usd || 0) + amt;
      const newBalance = Math.max(0, Number(selectedExpense.amount_usd || 0) - newPaid);
      const newStatus = newBalance <= 0 ? "paid" : "partial";

      // 1. Update Expense
      const { error: expErr } = await supabase.from("expenses").update({
        paid_usd: newPaid,
        balance_usd: newBalance,
        status: newStatus
      }).eq("id", selectedExpense.id);
      if (expErr) throw expErr;

      // 2. Register Transaction (Cash Flow Outflow)
      const beneficiary = selectedExpense.partners?.name || selectedExpense.beneficiary_name || "Gasto Genérico";
      const { error: txErr } = await supabase.from("transactions").insert({
        company_id: user.company_id,
        type: "outflow",
        category: selectedExpense.category,
        amount_usd: amt,
        reference: `Pago Gasto: ${selectedExpense.reference || ''} (${beneficiary})`,
        date: paymentData.date,
        payment_method: paymentData.method,
        expense_id: selectedExpense.id,
        user_id: user.id
      });
      if (txErr) console.warn("Error transaction log:", txErr);

      // 3. Register in Treasury
      if (paymentData.treasury_account_id) {
        try {
          const result = await registerTreasuryMovement({
            companyId: user.company_id,
            accountId: paymentData.treasury_account_id,
            type: "salida",
            amount: amt,
            currency: "usd",
            description: `Pago Gasto: ${selectedExpense.reference || ""} (${beneficiary})`,
            category: selectedExpense.category || "Gasto",
            originModule: "gastos",
            referenceId: selectedExpense.id,
            bcvRate: rate || undefined,
          });
          if (result.isNegativeOrZero) {
            toast.error(`${result.accountName} ha quedado en $0 o negativo`);
          } else if (result.isLowBalance) {
            toast.warning(`${result.accountName} tiene saldo bajo: $${result.newBalance.toFixed(2)}`);
          }
        } catch (err) {
          console.warn("Error registrando en tesorería:", err);
        }
      }

      toast.success("Pago registrado con éxito");
      setPayOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Error al pagar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const resetExpenseForm = () => {
    setFormData({
      partner_id: "none",
      beneficiary_name: "",
      category: "",
      reference: "",
      amount_usd: "",
      amount_bs: "",
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(), "yyyy-MM-dd"),
      is_recurring: false,
      notes: "",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Gastos y Pagos</h1>
          <p className="text-text-2 mt-1 text-sm font-medium">Registra y controla todos los pagos y gastos de tu negocio</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-6 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Registrar Gasto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand"><Receipt className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Total este mes</p><p className="text-xl font-bold text-text-1">{formatCurrency(stats.gastosMes)}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Clock className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Pendientes</p><p className="text-xl font-bold text-text-1">{formatCurrency(stats.pendientes)}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4 border-status-danger/30">
          <div className="w-12 h-12 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger"><AlertCircle className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Vencidos</p><p className="text-xl font-bold text-status-danger">{formatCurrency(stats.vencidos)}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><CalendarClock className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Próx. 7 días</p><p className="text-xl font-bold text-text-1">{formatCurrency(stats.proximos)}</p></div>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex p-1 bg-surface-card border border-border rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(["todos", "proveedores", "operativos", "nomina", "vencidos"] as GastoTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize min-w-[80px]", activeTab === tab ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1 hover:bg-surface-base")}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <Input placeholder="Buscar por concepto o proveedor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-surface-card border-border shadow-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Descripción / Concepto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Beneficiario</th>
                <th className="px-6 py-4 text-center">Fec. Venc.</th>
                <th className="px-6 py-4 text-right">Monto (USD/Bs)</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" /></td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-text-3">No se encontraron gastos.</td></tr>
              ) : (
                filteredExpenses.map((e, idx) => {
                  const isOverdue = e.status !== "paid" && differenceInDays(new Date(), new Date(e.due_date)) > 0;
                  return (
                    <motion.tr key={e.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="hover:bg-surface-hover/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-text-1">{e.reference || "S/Ref"}</span>
                          <span className="text-[10px] text-text-3 line-clamp-1">{e.notes || "Sin descripción"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest", CATEGORY_COLORS[e.category] || CATEGORY_COLORS["Otro"])}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Building2 className="w-3.5 h-3.5 text-text-3" />
                           <span className="font-medium text-text-2">{e.partners?.name || e.beneficiary_name || "Genérico"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("font-bold", isOverdue ? "text-status-danger" : "text-text-2")}>
                          {format(new Date(e.due_date), "dd MMM yy", { locale: es })}
                        </span>
                        {isOverdue && <span className="block text-[8px] uppercase tracking-tighter text-status-danger font-black">Vencido</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-mono font-bold text-text-1">{formatCurrency(e.amount_usd)}</p>
                        <p className="text-[10px] text-text-3 font-mono leading-none">Bs. {Number(e.amount_bs || 0).toLocaleString()}</p>
                        {e.status === "partial" && <p className="text-[9px] text-orange-500 font-bold mt-0.5 italic">Saldo: {formatCurrency(e.balance_usd)}</p>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={isOverdue ? "overdue" : e.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setSelectedExpense(e); setViewOpen(true); }} className="p-2 hover:bg-brand/10 text-brand rounded-lg transition-colors" title="Ver Detalles"><Eye className="w-4 h-4" /></button>
                          {e.status !== "paid" && (
                            <button onClick={() => { 
                              setSelectedExpense(e); 
                              setPaymentData(p=>({...p, amount: e.balance_usd?.toString() || e.amount_usd?.toString()})); 
                              setPayOpen(true); 
                            }} className="px-3 py-1.5 bg-brand text-white rounded-lg text-[10px] font-bold hover:shadow-brand transition-all">Pagar</button>
                          )}
                          <button onClick={() => handleDelete(e.id)} className="p-2 hover:bg-status-danger/10 text-status-danger rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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

      {/* DIALOG: REGISTRAR GASTO */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface-card border-border sm:max-w-2xl text-text-1">
          <DialogHeader>
             <DialogTitle className="text-xl font-montserrat font-bold">Registrar Nuevo Gasto</DialogTitle>
             <DialogDescription className="text-text-3 text-xs">Carga un nuevo comprobante de salida o compromiso de pago.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
             <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Categoría</label>
                <Select value={formData.category} onValueChange={val => setFormData(p=>({...p, category: val}))}>
                   <SelectTrigger className="h-12 bg-surface-input border-border/50"><SelectValue placeholder="Selecciona categoría..." /></SelectTrigger>
                   <SelectContent className="bg-surface-card border-border text-black">
                      {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Beneficiario / Proveedor</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <Select value={formData.partner_id} onValueChange={val => setFormData(p=>({...p, partner_id: val}))}>
                      <SelectTrigger className="h-11 bg-surface-input border-border/50"><SelectValue placeholder="Seleccionar del directorio..." /></SelectTrigger>
                      <SelectContent className="bg-surface-card border-border text-black">
                         <SelectItem value="none">-- Texto Libre --</SelectItem>
                         {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                   {formData.partner_id === "none" ? (
                      <Input placeholder="Escribir nombre..." value={formData.beneficiary_name} onChange={e => setFormData(p=>({...p, beneficiary_name: e.target.value}))} className="h-11 bg-surface-input" />
                   ) : (
                      <div className="flex items-center px-3 h-11 bg-surface-base border border-border/40 rounded-lg text-text-3 text-sm italic">
                         Vinculado al directorio
                      </div>
                   )}
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Factura / Referencia</label>
                <Input placeholder="Ej: F-1002" value={formData.reference} onChange={e => setFormData(p=>({...p, reference: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider text-brand">Monto USD ($)</label>
                <Input type="number" step="0.01" placeholder="0.00" value={formData.amount_usd} onChange={e => setFormData(p=>({...p, amount_usd: e.target.value}))} className="h-11 bg-surface-input text-lg font-bold font-mono" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto Bs. (Tasa: {rate})</label>
                <Input type="number" readOnly value={formData.amount_bs} className="h-11 bg-surface-base border-dashed border-border text-text-3 font-mono cursor-not-allowed" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha de Emisión</label>
                <Input type="date" value={formData.issue_date} onChange={e => setFormData(p=>({...p, issue_date: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha de Vencimiento</label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData(p=>({...p, due_date: e.target.value}))} className="h-11 bg-surface-input border-brand/30" />
             </div>

             <div className="space-y-3 sm:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-brand/5 border border-brand/20 rounded-xl">
                   <input type="checkbox" checked={formData.is_recurring} onChange={e => setFormData(p=>({...p, is_recurring: e.target.checked}))} className="w-5 h-5 accent-brand" />
                   <div>
                      <p className="text-sm font-bold text-brand">¿Es un gasto recurrente?</p>
                      <p className="text-[10px] text-text-3">Si marcas esto, definiremos la frecuencia (quincenal, mensual, etc.)</p>
                   </div>
                </label>
             </div>

             <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Notas / Concepto</label>
                <textarea rows={2} value={formData.notes} onChange={(e: any) => setFormData(p=>({...p, notes: e.target.value}))} className="w-full bg-surface-input border border-border/50 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-brand" />
             </div>
          </div>
          <DialogFooter>
             <button onClick={() => setCreateOpen(false)} className="px-6 py-2 text-text-3 font-bold">Cancelar</button>
             <button disabled={saving} onClick={handleSaveExpense} className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Guardar Gasto</>}
             </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: REGISTRAR PAGO */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="bg-surface-card border-border text-text-1">
          <DialogHeader>
             <DialogTitle className="text-xl font-bold font-montserrat">Confirmar Pago</DialogTitle>
             <DialogDescription className="text-text-3 text-xs">Registrando pago para: <span className="text-text-1 font-bold">{selectedExpense?.reference}</span></DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
             <div className="p-4 bg-surface-base border border-border rounded-xl">
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] text-text-3 font-bold uppercase tracking-widest">Saldo Pendiente</p>
                   <p className="text-xl font-black text-brand font-mono">${Number(selectedExpense?.balance_usd || 0).toFixed(2)}</p>
                </div>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto a Pagar ($)</label>
                <Input type="number" step="0.01" value={paymentData.amount} onChange={e => setPaymentData(p=>({...p, amount: e.target.value}))} className="h-12 bg-surface-input text-xl font-bold text-text-1 font-mono" />
             </div>

             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Método de Pago</label>
                <Select value={paymentData.method} onValueChange={val => setPaymentData(p=>({...p, method: val}))}>
                   <SelectTrigger className="h-11 bg-surface-input border-border/50"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-surface-card border-border text-black">
                      {["Efectivo", "Transferencia", "Pago Móvil", "Zelle", "Binance"].map(m => (
                         <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>

             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">¿De qué cuenta sale el dinero? *</label>
                <Select value={paymentData.treasury_account_id} onValueChange={val => setPaymentData(p=>({...p, treasury_account_id: val}))}>
                   <SelectTrigger className="h-11 bg-surface-input border-border/50"><SelectValue placeholder="Selecciona cuenta..." /></SelectTrigger>
                   <SelectContent className="bg-surface-card border-border text-black">
                      {treasuryAccounts.map((a: any) => (
                         <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency?.toUpperCase()})</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>

             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha del Pago</label>
                <Input type="date" value={paymentData.date} onChange={e => setPaymentData(p=>({...p, date: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
          </div>
          <DialogFooter>
             <button onClick={() => setPayOpen(false)} className="px-6 py-2 text-text-3 font-bold">Cancelar</button>
             <button disabled={saving} onClick={handleConfirmPayment} className="px-8 py-3 bg-brand text-white rounded-xl font-black shadow-brand flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Pago"}
             </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog remains similar but with new categories... */}
    </div>
  );

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto permanentemente?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Gasto eliminado");
      fetchData();
    } catch (err: any) {
      toast.error("Error al eliminar", { description: err.message });
    }
  }
}
