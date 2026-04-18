"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { useTreasuryAccounts, registerTreasuryMovement } from "@/hooks/use-treasury";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  Calendar,
  AlertCircle,
  Home,
  Users,
  Lightbulb,
  Globe,
  Truck,
  FileText,
  CreditCard,
  Settings,
  MoreVertical,
  History,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Briefcase,
  Layers,
  Search,
  ChevronRight,
  Trash2,
  Pause,
  Play,
  X,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { format, addDays, isBefore, isAfter, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { formatCurrency, cn } from "@/lib/utils";
import { useDataCache } from "@/lib/data-cache";

// --- Types ---
type Frequency = "Semanal" | "Quincenal" | "Mensual" | "Bimestral" | "Anual";

const CATEGORY_ICONS: Record<string, any> = {
  "Alquiler": { icon: Home, color: "text-orange-500", bg: "bg-orange-500/10" },
  "Nómina": { icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
  "Servicios Básicos": { icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  "Internet/Telefonía": { icon: Globe, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  "Préstamo": { icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  "Otro": { icon: Layers, color: "text-slate-500", bg: "bg-slate-500/10" },
};

export default function GastosRecurrentesPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" /></div>}>
      <RecurrentesContent />
    </Suspense>
  );
}

function RecurrentesContent() {
  const supabase = createClient();
  const { user } = useUser();
  const { rate } = useBCV();
  const { accounts: treasuryAccounts } = useTreasuryAccounts(user?.company_id);

  const [recurrentes, setRecurrentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [payAccountId, setPayAccountId] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRecurrente, setSelectedRecurrente] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    category: "Otro",
    beneficiary_name: "",
    amount_usd: "",
    frequency: "Mensual" as Frequency,
    due_day: "1",
    alert_days: "3",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    notes: "",
  });

  const fetchData = async () => {
    if (!user?.company_id) return;

    const cacheKey = `finanzas_recurrentes_${user.company_id}`;
    const cached = useDataCache.getState().get(cacheKey);
    if (cached) {
      setRecurrentes(cached.recurrentes);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecurrentes(data || []);
      useDataCache.getState().set(cacheKey, { recurrentes: data || [] });
    } catch (err: any) {
      console.error("Fetch recurrentes error:", err);
      // Fail gracefully if table doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchHistory() {
      if (!selectedRecurrente) return;
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("recurring_expense_id", selectedRecurrente.id)
        .order("issue_date", { ascending: false });
      if (data) setHistory(data);
    }
    if (historyOpen) fetchHistory();
  }, [historyOpen, selectedRecurrente, supabase]);

  useEffect(() => { fetchData(); }, [user?.company_id]);

  // Statistics
  const stats = useMemo(() => {
    const totalComprometido = recurrentes
      .filter(r => r.is_active)
      .reduce((acc, r) => acc + Number(r.amount_usd || 0), 0);
    
    // Próximos (lógica simplificada: vence esta semana)
    // En un sistema real usaríamos la fecha exacta de vencimiento calculada
    return { totalComprometido, pagadosEsteMes: 0 }; 
  }, [recurrentes]);

  // Handle Save
  const handleSave = async () => {
    if (!formData.name || !formData.amount_usd) {
       toast.error("Nombre y Monto son obligatorios");
       return;
    }
    setSaving(true);
    try {
      const payload = {
        company_id: user.company_id,
        name: formData.name,
        category: formData.category,
        beneficiary_name: formData.beneficiary_name,
        amount_usd: Number(formData.amount_usd),
        frequency: formData.frequency,
        due_day: Number(formData.due_day),
        alert_days: Number(formData.alert_days),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes,
        is_active: true
      };

      const { error } = await supabase.from("recurring_expenses").insert(payload);
      if (error) throw error;

      toast.success("Gasto recurrente programado");
      setCreateOpen(false);
      resetForm();
      useDataCache.getState().invalidatePrefix("finanzas_");
      fetchData();
    } catch (err: any) {
      toast.error("Error al guardar", { description: "Verifica que la tabla de base de datos exista." });
    } finally {
      setSaving(false);
    }
  };

  const registerPayment = async (recurrente: any) => {
    setSaving(true);
    try {
      const now = new Date();
      const amount_bs = rate ? (Number(recurrente.amount_usd) * rate).toFixed(2) : null;
      
      // 1. Create a regular expense entry marked as paid
      const { data: exp, error: expErr } = await supabase.from("expenses").insert({
        company_id: user.company_id,
        recurring_expense_id: recurrente.id,
        category: recurrente.category,
        reference: `Pago Recurrente: ${recurrente.name}`,
        amount_usd: recurrente.amount_usd,
        amount_bs: amount_bs,
        paid_usd: recurrente.amount_usd,
        balance_usd: 0,
        status: "paid",
        issue_date: format(now, "yyyy-MM-dd"),
        due_date: format(now, "yyyy-MM-dd"),
        notes: `Pago automático de gasto recurrente: ${recurrente.notes || ''}`,
        beneficiary_name: recurrente.beneficiary_name
      }).select().single();
      
      if (expErr) throw expErr;

      // 2. Register in Transactions (Flujo de Caja)
      const { error: txErr } = await supabase.from("transactions").insert({
        company_id: user.company_id,
        type: "outflow",
        category: recurrente.category,
        amount_usd: recurrente.amount_usd,
        reference: `Pago Recurrente: ${recurrente.name}`,
        date: format(now, "yyyy-MM-dd"),
        payment_method: "Transferencia", // Default or user chosen
        expense_id: exp.id,
        recurring_expense_id: recurrente.id,
        user_id: user.id
      });

      // 3. Register in Treasury
      if (payAccountId) {
        try {
          const result = await registerTreasuryMovement({
            companyId: user.company_id,
            accountId: payAccountId,
            type: "salida",
            amount: Number(recurrente.amount_usd),
            currency: "usd",
            description: `Pago Recurrente: ${recurrente.name}`,
            category: recurrente.category || "Recurrente",
            originModule: "recurrentes",
            referenceId: exp?.id || recurrente.id,
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

      toast.success("Pago registrado y descontado del flujo de caja");
      useDataCache.getState().invalidatePrefix("finanzas_");
      fetchData();
    } catch (err: any) {
      toast.error("Error al registrar pago", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
     try {
       await supabase.from("recurring_expenses").update({ is_active: !current }).eq("id", id);
       useDataCache.getState().invalidatePrefix("finanzas_");
       fetchData();
     } catch (err) {}
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Otro",
      beneficiary_name: "",
      amount_usd: "",
      frequency: "Mensual",
      due_day: "1",
      alert_days: "3",
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: "",
      notes: "",
    });
  };

  const getUrgency = (recurrente: any) => {
    // Basic logic for visual demo (should use real next date)
    const day = Number(recurrente.due_day);
    const today = new Date().getDate();
    const diff = day - today;
    
    if (diff < 0) return { label: "Vencido", color: "text-status-danger", bg: "bg-status-danger/10", icon: AlertCircle };
    if (diff < 3) return { label: `Vence en ${diff} días`, color: "text-status-danger", bg: "bg-status-danger/10", icon: Clock };
    if (diff < 7) return { label: `Vence en ${diff} días`, color: "text-orange-500", bg: "bg-orange-500/10", icon: Clock };
    return { label: `Vence en ${diff} días`, color: "text-status-success", bg: "bg-status-success/10", icon: CheckCircle2 };
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-20 font-montserrat">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-1">Gastos Recurrentes</h1>
          <p className="text-text-2 mt-1 text-sm font-medium">Programa tus pagos fijos y recibe alertas antes de cada vencimiento</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-6 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo Gasto Recurrente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand"><TrendingUp className="w-6 h-6" /></div>
           <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Total Comprometido</p><p className="text-xl font-bold text-text-1">{formatCurrency(stats.totalComprometido)}</p><p className="text-[10px] text-brand font-bold mt-0.5">Base mensual est.</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Clock className="w-6 h-6" /></div>
           <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Próximos esta semana</p><p className="text-xl font-bold text-text-1">--</p><p className="text-[10px] text-orange-500 font-bold mt-0.5">Ver debajo</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
           <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Pagados este mes</p><p className="text-xl font-bold text-text-1">--</p><p className="text-[10px] text-emerald-500 font-bold mt-0.5">Historial activo</p></div>
        </Card>
      </div>

      {/* Filters */}
      <div className="relative w-full md:w-96">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
         <Input placeholder="Buscar por nombre o beneficiario..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-12 bg-surface-card border-border shadow-md" />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-3"><Loader2 className="w-10 h-10 animate-spin text-brand mb-4" /><p>Cargando programación...</p></div>
      ) : recurrentes.length === 0 ? (
        <div className="text-center py-32 bg-surface-card/40 border-2 border-dashed border-border rounded-3xl"><Calendar className="w-16 h-16 text-text-3 mx-auto mb-4 opacity-20" /><h3 className="text-xl font-bold text-text-2">No tienes gastos recurrentes</h3><p className="text-text-3 max-w-sm mx-auto mt-2">Registra servicios, alquileres o nóminas que se repiten periódicamente.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recurrentes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.beneficiary_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((recurrente) => {
            const cat = CATEGORY_ICONS[recurrente.category] || CATEGORY_ICONS["Otro"];
            const urgency = getUrgency(recurrente);
            const Icon = cat.icon;
            const UrgencyIcon = urgency.icon;

            return (
              <motion.div key={recurrente.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className={cn("p-6 bg-surface-card border-border shadow-elevation hover:shadow-xl transition-all relative overflow-hidden group", !recurrente.is_active && "opacity-60 grayscale-[50%]")}>
                  {!recurrente.is_active && <div className="absolute inset-0 bg-surface-base/40 z-10 flex items-center justify-center"><Pause className="w-12 h-12 text-text-3/40" /></div>}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cat.bg, cat.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>toggleActive(recurrente.id, recurrente.is_active)} className="p-2 hover:bg-surface-base rounded-lg text-text-3 transition-colors">{recurrente.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                      <button onClick={() => { setSelectedRecurrente(recurrente); setHistoryOpen(true); }} className="p-2 hover:bg-surface-base rounded-lg text-text-3 transition-colors"><History className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="font-black text-lg text-text-1 leading-tight group-hover:text-brand transition-colors">{recurrente.name}</h3>
                    <p className="text-xs text-text-3 font-medium flex items-center gap-1.5"><Users className="w-3 h-3" /> {recurrente.beneficiary_name || "Sin beneficiario"}</p>
                    <p className="text-[10px] font-bold text-brand uppercase tracking-tighter">{recurrente.frequency} · Día {recurrente.due_day}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-surface-base rounded-xl border border-border/50 mb-6 font-mono">
                    <div>
                      <p className="text-[9px] text-text-3 font-bold uppercase leading-none">Monto Fijo</p>
                      <p className="text-xl font-black text-text-1">${Number(recurrente.amount_usd).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] text-text-3 font-bold uppercase leading-none">Base Bs.</p>
                       <p className="text-sm font-bold text-text-2">Bs. {(Number(recurrente.amount_usd) * (rate || 0)).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className={cn("flex items-center gap-2 p-2 rounded-lg mb-6", urgency.bg)}>
                    <UrgencyIcon className={cn("w-4 h-4", urgency.color)} />
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", urgency.color)}>{urgency.label}</span>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={payAccountId}
                      onChange={e => setPayAccountId(e.target.value)}
                      className="w-full py-2 px-3 bg-surface-base border border-border rounded-lg text-[10px] text-text-2 font-bold"
                    >
                      <option value="">Cuenta de origen...</option>
                      {treasuryAccounts.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.currency?.toUpperCase()})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => registerPayment(recurrente)}
                      disabled={saving}
                      className="w-full py-3 bg-surface-base border border-border hover:bg-brand hover:border-brand hover:text-white text-text-1 text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> REGISTRAR PAGO</>}
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface-card border-border sm:max-w-xl text-text-1 flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
             <DialogTitle className="text-xl font-bold font-montserrat tracking-tight">Programar Gasto Recurrente</DialogTitle>
             <DialogDescription className="text-text-3 text-xs">Define el ciclo de pago y los montos base.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Nombre del Gasto</label>
                <Input placeholder="Ej: Alquiler Local Central" value={formData.name} onChange={e => setFormData(p=>({...p, name: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Categoría</label>
                <Select value={formData.category} onValueChange={val => setFormData(p=>({...p, category: val}))}>
                   <SelectTrigger className="h-11 bg-surface-input"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-surface-card border-border text-black">
                      {Object.keys(CATEGORY_ICONS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Beneficiario</label>
                <Input placeholder="Nombre o Empresa..." value={formData.beneficiary_name} onChange={e => setFormData(p=>({...p, beneficiary_name: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Frecuencia</label>
                <Select value={formData.frequency} onValueChange={(val: any) => setFormData(p=>({...p, frequency: val}))}>
                   <SelectTrigger className="h-11 bg-surface-input"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-surface-card border-border text-black">
                      {["Semanal", "Quincenal", "Mensual", "Bimestral", "Anual"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Día de Cobro/Mes</label>
                <Input type="number" min="1" max="31" value={formData.due_day} onChange={e => setFormData(p=>({...p, due_day: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto en USD ($)</label>
                <Input type="number" step="0.01" value={formData.amount_usd} onChange={e => setFormData(p=>({...p, amount_usd: e.target.value}))} className="h-11 bg-surface-input text-lg font-bold font-mono" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Alertar con (días de antelación)</label>
                <Select value={formData.alert_days} onValueChange={val => setFormData(p=>({...p, alert_days: val}))}>
                   <SelectTrigger className="h-11 bg-surface-input"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-surface-card border-border text-black">
                      {["1", "3", "5", "7"].map(d => <SelectItem key={d} value={d}>{d} días antes</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha de Inicio</label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData(p=>({...p, start_date: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha de Fin (Opcional)</label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData(p=>({...p, end_date: e.target.value}))} className="h-11 bg-surface-input" />
             </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border flex-shrink-0 flex justify-end gap-3 bg-surface-card sticky bottom-0">
             <button onClick={() => setCreateOpen(false)} className="px-6 py-2 text-text-3 font-bold">Cancelar</button>
             <button disabled={saving} onClick={handleSave} className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Programación"}
             </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: HISTORIAL DE PAGOS */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
         <DialogContent className="bg-surface-card border-border sm:max-w-md text-text-1">
            <DialogHeader>
               <DialogTitle className="font-bold flex items-center gap-2"><History className="w-5 h-5 text-brand" /> Historial de Pagos</DialogTitle>
               <DialogDescription className="text-xs">Registro cronológico para: {selectedRecurrente?.name}</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
               {history.length === 0 ? (
                  <div className="text-center py-10 text-text-3">
                     <p className="text-xs italic">No se han registrado pagos para este gasto aún.</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {history.map((h) => (
                        <div key={h.id} className="p-3 bg-surface-base rounded-xl border border-border flex justify-between items-center">
                           <div>
                              <p className="text-[10px] text-text-3 font-bold uppercase">{format(new Date(h.issue_date), "MMMM yyyy", { locale: es })}</p>
                              <p className="text-sm font-bold text-text-1">{format(new Date(h.issue_date), "dd MMM yy")}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-mono font-bold text-brand">{formatCurrency(h.amount_usd)}</p>
                              <span className="text-[8px] bg-status-success/10 text-status-success px-1.5 py-0.5 rounded-full font-black uppercase">Pagado</span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            <DialogFooter>
               <button onClick={() => setHistoryOpen(false)} className="w-full px-6 py-3 bg-surface-base border border-border rounded-xl font-bold">Cerrar</button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
