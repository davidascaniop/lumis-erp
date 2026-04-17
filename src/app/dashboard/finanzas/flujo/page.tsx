"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBCV } from "@/hooks/use-bcv";
import { useUser } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Plus, Loader2, Wallet, ArrowUpRight, ArrowDownRight,
  TrendingUp, Search, CheckCircle2, AlertTriangle, Calendar,
  Building2, CreditCard, Banknote, Globe, Coins, ChevronRight,
  FileText, Clock, DollarSign, Landmark, Bitcoin, Filter,
} from "lucide-react";
import {
  format, differenceInDays, startOfMonth, startOfWeek, endOfMonth,
  endOfWeek, isWithinInterval, parseISO, addDays, isSameDay, startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import Papa from "papaparse";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import Link from "next/link";

const ACCOUNT_TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  banco: { icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10" },
  efectivo: { icon: Banknote, color: "text-orange-500", bg: "bg-orange-500/10" },
  digital: { icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  crypto: { icon: Bitcoin, color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

const CURRENCY_LABELS: Record<string, string> = { bs: "Bs", usd: "USD", usdt: "USDT" };

const ORIGIN_COLORS: Record<string, string> = {
  ventas: "bg-emerald-500/10 text-emerald-500",
  cxc: "bg-blue-500/10 text-blue-500",
  gastos: "bg-red-500/10 text-red-500",
  compras: "bg-orange-500/10 text-orange-500",
  recurrentes: "bg-purple-500/10 text-purple-500",
  manual: "bg-brand/10 text-brand",
  transferencia: "bg-cyan-500/10 text-cyan-500",
};

export default function FlujoCajaPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" /></div>}>
      <FlujoContent />
    </Suspense>
  );
}

function FlujoContent() {
  const supabase = createClient();
  const { rate: bcvRate } = useBCV();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [upcomingInflows, setUpcomingInflows] = useState<any[]>([]);
  const [upcomingOutflows, setUpcomingOutflows] = useState<any[]>([]);
  const [projection, setProjection] = useState<any[]>([]);

  // Filters
  const [timeFilter, setTimeFilter] = useState<"semana" | "mes" | "todo">("mes");
  const [typeFilter, setTypeFilter] = useState<"all" | "entrada" | "salida">("all");
  const [accountFilter, setAccountFilter] = useState<"all" | string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Manual movement modal
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: "entrada" as "entrada" | "salida",
    account_id: "",
    amount: "",
    description: "",
    category: "Ajuste manual",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const companyId = user?.company_id;

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Fetch treasury accounts
      const { data: acctData } = await supabase
        .from("treasury_accounts")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");

      // Fetch treasury movements
      const { data: mvData } = await supabase
        .from("treasury_movements")
        .select("*, treasury_accounts(name, type, currency)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(500);

      // Fetch upcoming inflows (CxC pending)
      const { data: recvData } = await supabase
        .from("receivables")
        .select("*, partners(name)")
        .eq("company_id", companyId)
        .neq("status", "paid")
        .order("due_date", { ascending: true });

      // Fetch upcoming outflows (expenses pending)
      const { data: expData } = await supabase
        .from("expenses")
        .select("*, partners(name)")
        .eq("company_id", companyId)
        .neq("status", "paid")
        .order("due_date", { ascending: true });

      // Fetch recurring expenses (active)
      const { data: recurData } = await supabase
        .from("recurring_expenses")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);

      setAccounts(acctData || []);
      setMovements(mvData || []);

      // Map upcoming inflows
      const upIn = (recvData || []).map(r => ({
        id: r.id,
        date: r.due_date,
        description: `Factura ${r.invoice_number || "S/N"}`,
        amount_usd: Number(r.balance_usd || r.total_usd || 0),
        category: "Cuentas por Cobrar",
        source: "cxc",
        partner_name: r.partners?.name,
      }));

      // Map upcoming outflows from expenses
      const upOut = (expData || []).map(e => ({
        id: e.id,
        date: e.due_date,
        description: e.reference || "Gasto Pendiente",
        amount_usd: Number(e.balance_usd || e.amount_usd || 0),
        category: e.category,
        source: "gastos",
        partner_name: e.partners?.name || e.beneficiary_name,
      }));

      // Map upcoming from recurring
      const recurOut = (recurData || []).map(r => ({
        id: r.id,
        date: null,
        due_day: r.due_day,
        description: r.name,
        amount_usd: Number(r.amount_usd || 0),
        category: r.category,
        source: "recurrentes",
        partner_name: r.beneficiary_name,
      }));

      setUpcomingInflows(upIn);
      setUpcomingOutflows([...upOut, ...recurOut]);

      // 30-day projection
      const totalBalance = (acctData || []).reduce((sum: number, a: any) => {
        const bal = Number(a.current_balance || 0);
        if (a.currency === "usd" || a.currency === "usdt") return sum + bal;
        if (a.currency === "bs" && bcvRate) return sum + bal / bcvRate;
        return sum;
      }, 0);

      const projData: any[] = [];
      let projBal = totalBalance;
      const today = startOfDay(new Date());

      for (let i = 0; i < 30; i++) {
        const currentDate = addDays(today, i);
        const dateStr = format(currentDate, "yyyy-MM-dd");
        let dayInflow = 0;
        let dayOutflow = 0;

        upIn.forEach(item => {
          if (item.date && isSameDay(parseISO(item.date), currentDate)) {
            dayInflow += item.amount_usd;
          }
        });

        upOut.forEach(item => {
          if (item.date && isSameDay(parseISO(item.date), currentDate)) {
            dayOutflow += item.amount_usd;
          }
        });

        (recurData || []).forEach((r: any) => {
          if (currentDate.getDate() === Number(r.due_day)) {
            dayOutflow += Number(r.amount_usd || 0);
          }
        });

        projBal += (dayInflow - dayOutflow);
        projData.push({ date: dateStr, balance: projBal, inflow: dayInflow, outflow: dayOutflow });
      }
      setProjection(projData);

    } catch (error) {
      console.error("Error fetching flow data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [companyId]);

  // ─── DERIVED DATA ───

  const totalBalanceUsd = useMemo(() => {
    return accounts.reduce((sum, a) => {
      const bal = Number(a.current_balance || 0);
      if (a.currency === "usd" || a.currency === "usdt") return sum + bal;
      if (a.currency === "bs" && bcvRate) return sum + bal / bcvRate;
      return sum;
    }, 0);
  }, [accounts, bcvRate]);

  const deficitPoint = useMemo(() => projection.find(p => p.balance < 0), [projection]);

  const deficitWeek = useMemo(() => {
    if (!deficitPoint) return null;
    const days = differenceInDays(parseISO(deficitPoint.date), new Date());
    return Math.ceil(days / 7);
  }, [deficitPoint]);

  const filteredMovements = useMemo(() => {
    const today = new Date();
    let start: Date | undefined;
    let end: Date | undefined;
    if (timeFilter === "mes") { start = startOfMonth(today); end = endOfMonth(today); }
    else if (timeFilter === "semana") { start = startOfWeek(today, { weekStartsOn: 1 }); end = endOfWeek(today, { weekStartsOn: 1 }); }

    return movements.filter(m => {
      if (start && end) {
        const mDate = parseISO(m.created_at);
        if (!isWithinInterval(mDate, { start, end })) return false;
      }
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (accountFilter !== "all" && m.account_id !== accountFilter) return false;
      if (categoryFilter !== "all" && m.origin_module !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.description?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [movements, timeFilter, typeFilter, accountFilter, categoryFilter, searchQuery]);

  const { totalIn, totalOut } = useMemo(() => {
    return filteredMovements.reduce(
      (acc, m) => {
        const amt = Number(m.amount || 0);
        if (m.type === "entrada") acc.totalIn += amt;
        else if (m.type === "salida") acc.totalOut += amt;
        return acc;
      },
      { totalIn: 0, totalOut: 0 }
    );
  }, [filteredMovements]);

  const totalEntradas = useMemo(() => upcomingInflows.reduce((s, i) => s + i.amount_usd, 0), [upcomingInflows]);
  const totalSalidas = useMemo(() => upcomingOutflows.reduce((s, i) => s + i.amount_usd, 0), [upcomingOutflows]);

  const uniqueOrigins = Array.from(new Set(movements.map(m => m.origin_module)));

  // ─── HANDLERS ───

  const handleRegisterManual = async () => {
    if (!formData.account_id || !formData.amount || !formData.description) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setSaving(true);
    try {
      const account = accounts.find(a => a.id === formData.account_id);
      if (!account) throw new Error("Cuenta no encontrada");
      const amount = Number(formData.amount);

      let newBalance: number;
      if (formData.type === "entrada") {
        newBalance = Number(account.current_balance) + amount;
      } else {
        newBalance = Number(account.current_balance) - amount;
      }

      // Update account balance
      const { error: e1 } = await supabase
        .from("treasury_accounts")
        .update({ current_balance: newBalance })
        .eq("id", account.id);
      if (e1) throw e1;

      // Insert movement
      const { error: e2 } = await supabase.from("treasury_movements").insert({
        company_id: companyId,
        account_id: account.id,
        type: formData.type,
        amount,
        currency: account.currency,
        description: formData.description,
        category: formData.category,
        origin_module: "manual",
        balance_after: newBalance,
      });
      if (e2) throw e2;

      // Check alerts
      if (account.min_alert_balance > 0 && newBalance < account.min_alert_balance) {
        toast.warning(`${account.name} tiene saldo bajo: ${formatCurrency(newBalance)}`);
      }

      toast.success("Movimiento registrado");
      setManualOpen(false);
      setFormData({ type: "entrada", account_id: "", amount: "", description: "", category: "Ajuste manual", date: format(new Date(), "yyyy-MM-dd") });
      fetchData();
    } catch (err: any) {
      toast.error("Error al registrar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (filteredMovements.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    const exportData = filteredMovements.map(m => ({
      Fecha: format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
      Descripcion: m.description,
      Tipo: m.type,
      Categoria: m.category,
      Origen: m.origin_module,
      Cuenta: m.treasury_accounts?.name || "",
      Monto: m.amount,
      Saldo_Despues: m.balance_after,
    }));
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `flujo_caja_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Archivo CSV exportado");
  };

  const netBalance = totalIn - totalOut;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Flujo de Caja</h1>
          <p className="text-text-2 mt-1 text-sm font-medium">Posición actual y proyección de liquidez de tu negocio</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-card border border-border p-1 rounded-xl shadow-sm">
            {(["semana", "mes", "todo"] as const).map(f => (
              <button key={f} onClick={() => setTimeFilter(f)} className={cn("px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase", timeFilter === f ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1")}>
                {f === "semana" ? "Esta Semana" : f === "mes" ? "Este Mes" : "Histórico"}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-5 py-3 bg-surface-card border border-border text-text-1 rounded-xl font-bold shadow-sm hover:bg-surface-hover/10 transition-all">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => setManualOpen(true)} className="px-6 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" /> Movimiento Manual
          </button>
        </div>
      </div>

      {/* ─── SECCIÓN 1: POSICIÓN ACTUAL ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand"><Wallet className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Saldo Total USD</p><p className="text-xl font-bold text-text-1">{loading ? "---" : formatCurrency(totalBalanceUsd)}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ArrowUpRight className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Entradas del Período</p><p className="text-xl font-bold text-emerald-500">{formatCurrency(totalIn)}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger"><ArrowDownRight className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Salidas del Período</p><p className="text-xl font-bold text-status-danger">{formatCurrency(totalOut)}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", netBalance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-status-danger/10 text-status-danger")}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Balance Neto</p><p className={cn("text-xl font-bold", netBalance >= 0 ? "text-emerald-500" : "text-status-danger")}>{netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}</p></div>
        </Card>
      </div>

      {/* ─── SECCIÓN 2: MIS CUENTAS (RESUMEN VISUAL) ─── */}
      {accounts.length > 0 && (
        <div>
          <h3 className="text-lg font-montserrat font-bold text-text-1 mb-4 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-brand" /> Mis Cuentas
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {accounts.map(account => {
              const typeConf = ACCOUNT_TYPE_ICONS[account.type] || ACCOUNT_TYPE_ICONS.banco;
              const TypeIcon = typeConf.icon;
              const equivUsd = account.currency === "usd" || account.currency === "usdt"
                ? Number(account.current_balance)
                : bcvRate ? Number(account.current_balance) / bcvRate : 0;

              return (
                <Link key={account.id} href="/dashboard/finanzas/cuentas" className="block min-w-[220px]">
                  <Card className="p-5 bg-surface-card border-border shadow-sm hover:border-brand/30 hover:shadow-elevation transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeConf.bg, typeConf.color)}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors truncate">{account.name}</p>
                        <p className="text-[10px] text-text-3 uppercase font-bold">{ACCOUNT_TYPE_ICONS[account.type]?.color ? account.type : "banco"}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-text-1 font-mono">
                        {account.currency === "bs" ? "Bs. " : account.currency === "usdt" ? "USDT " : "$"}
                        {Number(account.current_balance || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-brand font-bold">{formatCurrency(equivUsd)} USD</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── SECCIÓN 3: PROYECCIÓN 30 DÍAS ─── */}
      <Card className="p-6 bg-surface-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-montserrat font-bold text-text-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" /> Proyección Próximos 30 Días
            </h3>
            <p className="text-text-3 text-xs font-medium mt-1">Simulación basada en cuentas por cobrar, gastos recurrentes y compromisos pendientes</p>
          </div>
          <AnimatePresence>
            {deficitPoint && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-status-danger/10 border border-status-danger/30 p-3 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-status-danger/20 flex items-center justify-center text-status-danger">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-status-danger text-[10px] font-bold uppercase tracking-wider">Déficit Proyectado</p>
                  <p className="text-text-1 text-xs font-bold">{formatCurrency(Math.abs(deficitPoint.balance))} en la semana {deficitWeek}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-[400px] w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>
          ) : projection.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-3">
              <CheckCircle2 className="w-10 h-10 opacity-20 mb-2" />
              <p className="text-sm">No hay datos para proyectar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={(str) => format(parseISO(str), "dd MMM")} tick={{ fill: "var(--text-3)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `$${val > 1000 ? (val / 1000).toFixed(1) + 'k' : val}`} tick={{ fill: "var(--text-3)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", borderRadius: "16px", color: "var(--text-1)", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  labelFormatter={(label) => format(parseISO(label), "PPPP", { locale: es })}
                  formatter={(value: any, name: any) => {
                    const labels: Record<string, string> = { balance: "Saldo Proyectado", inflow: "Entradas Esperadas", outflow: "Salidas Comprometidas" };
                    return [formatCurrency(Number(value || 0)), labels[String(name)] || String(name)];
                  }}
                />
                <Legend formatter={(val: any) => ({ balance: "Saldo Proyectado", inflow: "Entradas", outflow: "Salidas" } as any)[val] || val} />
                <Area type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorInflow)" />
                <Area type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOutflow)" />
                <Area type="monotone" dataKey="balance" stroke="var(--brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* ─── SECCIÓN 4 & 5: ENTRADAS Y SALIDAS ESPERADAS ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Entradas esperadas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-montserrat font-bold text-text-1 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Entradas Esperadas
            </h3>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg uppercase tracking-wider">
              Total: {formatCurrency(totalEntradas)}
            </span>
          </div>
          <div className="space-y-3">
            {upcomingInflows.length === 0 ? (
              <p className="text-center py-10 text-text-3 text-sm bg-surface-card rounded-2xl border border-dashed border-border italic">No hay cobros pendientes próximos</p>
            ) : (
              upcomingInflows.slice(0, 6).map(item => (
                <Card key={item.id} className="p-4 bg-surface-card border-border hover:border-brand/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{item.partner_name || "Cliente"}</p>
                      <p className="text-[10px] text-text-3 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" /> Vence {item.date ? format(parseISO(item.date), "dd MMM", { locale: es }) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-text-1">{formatCurrency(item.amount_usd)}</p>
                    {item.date && (
                      <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-1 inline-block",
                        differenceInDays(parseISO(item.date), new Date()) < 3 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {differenceInDays(parseISO(item.date), new Date()) <= 0 ? "Vencido" : `En ${differenceInDays(parseISO(item.date), new Date())} días`}
                      </span>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Salidas comprometidas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-montserrat font-bold text-text-1 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-status-danger" /> Salidas Comprometidas
            </h3>
            <span className="text-[10px] font-bold bg-status-danger/10 text-status-danger px-2 py-1 rounded-lg uppercase tracking-wider">
              Total: {formatCurrency(totalSalidas)}
            </span>
          </div>
          <div className="space-y-3">
            {upcomingOutflows.length === 0 ? (
              <p className="text-center py-10 text-text-3 text-sm bg-surface-card rounded-2xl border border-dashed border-border italic">No hay pagos pendientes próximos</p>
            ) : (
              upcomingOutflows.slice(0, 6).map((item, i) => (
                <Card key={item.id + "-" + i} className="p-4 bg-surface-card border-border hover:border-brand/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{item.description}</p>
                      <p className="text-[10px] text-text-3 font-medium flex items-center gap-1.5 mt-0.5">
                        <Coins className="w-3 h-3" /> {item.category} · {item.partner_name || ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-text-1">{formatCurrency(item.amount_usd)}</p>
                    {item.date ? (
                      <p className="text-[10px] text-text-3 font-bold mt-1">Vence {format(parseISO(item.date), "dd MMM", { locale: es })}</p>
                    ) : item.due_day ? (
                      <p className="text-[10px] text-text-3 font-bold mt-1">Día {item.due_day} c/mes</p>
                    ) : null}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── SECCIÓN 6: HISTORIAL DE MOVIMIENTOS ─── */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col" style={{ maxHeight: "70vh" }}>
        <div className="p-6 border-b border-border/40 bg-surface-card/40 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input placeholder="Buscar por descripción..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-surface-input border border-border/40 text-text-1 h-11 rounded-xl" />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-32 bg-surface-input border border-border/40 h-11 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent className="bg-surface-card border-border text-text-1">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="salida">Salidas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={accountFilter} onValueChange={(v: any) => setAccountFilter(v)}>
              <SelectTrigger className="w-40 bg-surface-input border border-border/40 h-11 rounded-xl"><SelectValue placeholder="Cuenta" /></SelectTrigger>
              <SelectContent className="bg-surface-card border-border text-text-1">
                <SelectItem value="all">Todas</SelectItem>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
              <SelectTrigger className="w-36 bg-surface-input border border-border/40 h-11 rounded-xl"><SelectValue placeholder="Origen" /></SelectTrigger>
              <SelectContent className="bg-surface-card border-border text-text-1">
                <SelectItem value="all">Todos</SelectItem>
                {uniqueOrigins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 no-scrollbar">
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead className="bg-surface-base/80 text-text-3 sticky top-0 z-10 backdrop-blur-xl border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Fecha</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Descripción</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Categoría</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Cuenta</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Origen</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-right border-b border-border/50">Monto</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-right border-b border-border/50">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" /></td></tr>
              ) : filteredMovements.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center text-text-3 font-medium">No hay movimientos registrados.</td></tr>
              ) : (
                filteredMovements.map((m, idx) => (
                  <motion.tr key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.01 }} className="hover:bg-surface-hover/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-text-1 font-bold">{format(new Date(m.created_at), "dd/MM/yy")}</span>
                        <span className="text-[10px] text-text-3">{format(new Date(m.created_at), "HH:mm")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-text-1 group-hover:text-brand transition-colors">{m.description || "Sin descripción"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-3 text-[10px] font-bold uppercase">{m.category || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-2 text-xs font-medium">{m.treasury_accounts?.name || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest", ORIGIN_COLORS[m.origin_module] || "bg-brand/10 text-brand")}>
                        {m.origin_module}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={cn("font-mono font-black text-base", m.type === "entrada" ? "text-emerald-500" : "text-red-500")}>
                        {m.type === "entrada" ? "+" : "-"}{formatCurrency(Number(m.amount || 0))}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-mono font-bold text-text-1">{formatCurrency(Number(m.balance_after || 0))}</p>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── DIALOG: MOVIMIENTO MANUAL ─── */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="bg-surface-card border-border text-text-1 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-montserrat font-bold">Nuevo Movimiento Manual</DialogTitle>
            <p className="text-text-3 text-xs">Registra entradas o salidas manuales a una cuenta específica.</p>
          </DialogHeader>
          <div className="space-y-5 px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Tipo</label>
                <div className="flex p-1 bg-surface-input rounded-xl border border-border/40">
                  <button onClick={() => setFormData(f => ({ ...f, type: "entrada" }))} className={cn("flex-1 py-2 text-[10px] font-black rounded-lg transition-all", formData.type === "entrada" ? "bg-white text-brand shadow-sm" : "text-text-3")}>ENTRADA</button>
                  <button onClick={() => setFormData(f => ({ ...f, type: "salida" }))} className={cn("flex-1 py-2 text-[10px] font-black rounded-lg transition-all", formData.type === "salida" ? "bg-white text-red-500 shadow-sm" : "text-text-3")}>SALIDA</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Cuenta *</label>
                <Select value={formData.account_id} onValueChange={val => setFormData(f => ({ ...f, account_id: val }))}>
                  <SelectTrigger className="bg-surface-input border-border/40 h-11 rounded-xl"><SelectValue placeholder="Selecciona cuenta..." /></SelectTrigger>
                  <SelectContent className="bg-surface-card border-border text-text-1">
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({CURRENCY_LABELS[a.currency]})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Descripción *</label>
                <Input placeholder="Ej: Aporte de socios, Ajuste de caja..." value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} className="bg-surface-input border border-border/40 h-11 rounded-xl font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider text-brand">Monto *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                  <Input type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} className="pl-10 bg-surface-input border border-border/40 h-12 rounded-xl font-black text-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha</label>
                <Input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} className="bg-surface-input border border-border/40 h-12 rounded-xl font-bold" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setManualOpen(false)} className="px-6 py-2 text-text-3 font-bold">Cancelar</button>
            <button disabled={saving} onClick={handleRegisterManual} className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Registro"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
