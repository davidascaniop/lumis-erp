"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBCV } from "@/hooks/use-bcv";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Plus,
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Calendar,
  Building2,
  CreditCard,
  Banknote,
  Globe,
  Coins,
  ChevronRight,
  FileText,
  Clock,
  Filter,
  DollarSign,
} from "lucide-react";
import { 
  format, 
  differenceInDays, 
  startOfMonth, 
  startOfWeek, 
  endOfMonth, 
  endOfWeek, 
  isWithinInterval, 
  parseISO, 
  addDays,
  isSameDay,
  isAfter,
  startOfDay
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import Papa from "papaparse";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StatusBadge } from "@/components/ui/status-badge";

type FlowMovement = {
  id: string;
  date: string;
  description: string;
  type: "Entrada" | "Salida";
  category: string;
  amount_usd: number;
  source: "Ventas" | "Cobranza" | "Gastos" | "Manual";
  payment_method?: string;
  balance?: number;
};

type UpcomingItem = {
  id: string;
  date: string;
  description: string;
  amount_usd: number;
  category: string;
  source: string;
  partner_name?: string;
};

type ProjectionPoint = {
  date: string;
  balance: number;
  inflow: number;
  outflow: number;
};

export default function FlujoCajaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" />
        </div>
      }
    >
      <FlujoContent />
    </Suspense>
  );
}

function FlujoContent() {
  const supabase = createClient();
  const { rate: bcvRate } = useBCV();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<FlowMovement[]>([]);
  const [upcomingInflows, setUpcomingInflows] = useState<UpcomingItem[]>([]);
  const [upcomingOutflows, setUpcomingOutflows] = useState<UpcomingItem[]>([]);
  const [projection, setProjection] = useState<ProjectionPoint[]>([]);
  const [balanceByMethod, setBalanceByMethod] = useState<Record<string, number>>({
    "Efectivo": 0,
    "Bancos": 0,
    "Digital/Divisas": 0
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<"USD" | "Bs">("USD");
  
  // Filters
  const [timeFilter, setTimeFilter] = useState<"mes" | "semana" | "todo">("mes");
  const [typeFilter, setTypeFilter] = useState<"all" | "Entrada" | "Salida">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");

  // Modal State
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: "inflow",
    category: "Ajuste manual",
    amount_usd: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    description: "",
    payment_method: "Efectivo",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("auth_id", user.id)
        .single();
      if (!userData) return;

      const company_id = userData.company_id;

      // 1. Fetch Historical Transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("company_id", company_id);

      // 2. Fetch Payments (Completed)
      const { data: payData } = await supabase
        .from("payments")
        .select("*, partners(name), receivables(invoice_number)")
        .eq("company_id", company_id)
        .in("status", ["verified", "completed", "paid", "approved"]);

      // 3. Fetch Upcoming Inflows (Receivables Pending)
      const { data: recvData } = await supabase
        .from("receivables")
        .select("*, partners(name)")
        .eq("company_id", company_id)
        .neq("status", "paid")
        .order("due_date", { ascending: true });

      // 4. Fetch Upcoming Outflows (Expenses Pending)
      const { data: expData } = await supabase
        .from("expenses")
        .select("*, partners(name)")
        .eq("company_id", company_id)
        .neq("status", "paid")
        .order("due_date", { ascending: true });

      // 5. Fetch Recurring Expenses
      const { data: recurData } = await supabase
        .from("recurring_expenses")
        .select("*")
        .eq("company_id", company_id)
        .eq("is_active", true);

      // Mapping History
      const mappedTx: FlowMovement[] = (txData || []).map((tx) => ({
        id: tx.id,
        date: tx.date || tx.created_at,
        description: tx.reference || (tx.type === "inflow" ? "Entrada Manual" : "Salida Manual"),
        type: tx.type === "inflow" ? "Entrada" : "Salida",
        category: tx.category || "Ajuste manual",
        amount_usd: Number(tx.amount_usd || 0),
        source: tx.expense_id ? "Gastos" : "Manual",
        payment_method: tx.payment_method || "Efectivo"
      }));

      const mappedPay: FlowMovement[] = (payData || []).map((p) => ({
        id: p.id,
        date: p.verified_at || p.created_at || new Date().toISOString(),
        description: `Cobro Factura ${p.receivables?.invoice_number || p.reference || "S/N"} - ${p.partners?.name || ""}`,
        type: "Entrada",
        category: "Cobro",
        amount_usd: Number(p.amount_usd || 0),
        source: "Cobranza",
        payment_method: p.method || "Transferencia"
      }));

      // Calculate running balance and grouping by method
      const combined = [...mappedTx, ...mappedPay]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let runningBalance = 0;
      const methods: Record<string, number> = {
        "Efectivo": 0,
        "Bancos": 0,
        "Digital/Divisas": 0
      };

      const historyWithBalance = combined.map((item) => {
        const amt = item.type === "Entrada" ? item.amount_usd : -item.amount_usd;
        runningBalance += amt;
        
        // Group by requested categories
        const method = item.payment_method || "Efectivo";
        if (method === "Efectivo" || method === "Cash") {
          methods["Efectivo"] += amt;
        } else if (["Zelle", "Binance", "Zinli", "PayPal"].includes(method)) {
          methods["Digital/Divisas"] += amt;
        } else {
          methods["Bancos"] += amt;
        }
        
        return { ...item, balance: runningBalance };
      });

      setMovements(historyWithBalance.reverse());
      setBalanceByMethod(methods);

      // Upcoming Items Mapping
      const upcomingIn: UpcomingItem[] = (recvData || []).map(r => ({
        id: r.id,
        date: r.due_date,
        description: `Factura ${r.invoice_number}`,
        amount_usd: Number(r.balance_usd || r.total_usd || 0),
        category: "Cuentas por Cobrar",
        source: "Ventas",
        partner_name: r.partners?.name
      }));

      const upcomingOut: UpcomingItem[] = (expData || []).map(e => ({
        id: e.id,
        date: e.due_date,
        description: e.reference || "Gasto Pendiente",
        amount_usd: Number(e.balance_usd || e.amount_usd || 0),
        category: e.category,
        source: "Gastos",
        partner_name: e.partners?.name || e.beneficiary_name
      }));

      setUpcomingInflows(upcomingIn);
      setUpcomingOutflows(upcomingOut);

      // --- 30-DAY PROJECTION LOGIC ---
      const projectionData: ProjectionPoint[] = [];
      let projectedBalance = runningBalance;
      const today = startOfDay(new Date());

      for (let i = 0; i < 30; i++) {
        const currentDate = addDays(today, i);
        const dateStr = format(currentDate, "yyyy-MM-dd");
        
        let dayInflow = 0;
        let dayOutflow = 0;

        // Inflows from Receivables
        upcomingIn.forEach(item => {
          if (isSameDay(parseISO(item.date), currentDate)) {
            dayInflow += item.amount_usd;
          }
        });

        // Outflows from Expenses
        upcomingOut.forEach(item => {
          if (isSameDay(parseISO(item.date), currentDate)) {
            dayOutflow += item.amount_usd;
          }
        });

        // Outflows from Recurring
        (recurData || []).forEach(r => {
          const dueDay = Number(r.due_day);
          if (currentDate.getDate() === dueDay) {
            dayOutflow += Number(r.amount_usd || 0);
          }
        });

        projectedBalance += (dayInflow - dayOutflow);
        
        projectionData.push({
          date: dateStr,
          balance: projectedBalance,
          inflow: dayInflow,
          outflow: dayOutflow
        });
      }
      setProjection(projectionData);

    } catch (error) {
      console.error("Error fetching flow data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- DERIVADOS Y FILTROS ---
  const currentBalance = movements.length > 0 ? movements[0].balance || 0 : 0;
  
  // Alert for deficit in projection
  const deficitPoint = useMemo(() => {
    return projection.find(p => p.balance < 0);
  }, [projection]);

  const filteredMovements = useMemo(() => {
    const today = new Date();
    let start: Date | undefined;
    let end: Date | undefined;
    if (timeFilter === "mes") {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else if (timeFilter === "semana") {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
    }

    return movements.filter((m) => {
      // Date filter
      if (start && end) {
        const mDate = parseISO(m.date);
        if (!isWithinInterval(mDate, { start, end })) return false;
      }
      // Type/Category filter
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.description.toLowerCase().includes(q) && !m.category.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [movements, timeFilter, typeFilter, categoryFilter, searchQuery]);

  // Cálculos para las Cards de Resumen basado en los movimientos filtrados por fecha
  const { totalIn, totalOut } = useMemo(() => {
    return filteredMovements.reduce(
      (acc, m) => {
        if (m.type === "Entrada") acc.totalIn += m.amount_usd;
        else acc.totalOut += m.amount_usd;
        return acc;
      },
      { totalIn: 0, totalOut: 0 }
    );
  }, [filteredMovements]);

  // Chart Data: Agrupar por fecha formateada
  const chartData = useMemo(() => {
    // Al agrupar revertimos de nuevo para ordenar cronológicamente en el gráfico
    const chartMap = new Map<string, { Entradas: number; Salidas: number }>();
    const toChart = [...filteredMovements].reverse();
    
    toChart.forEach((m) => {
      const dateLabel = format(new Date(m.date), "dd MMM", { locale: es });
      const current = chartMap.get(dateLabel) || { Entradas: 0, Salidas: 0 };
      if (m.type === "Entrada") current.Entradas += m.amount_usd;
      else current.Salidas += m.amount_usd;
      chartMap.set(dateLabel, current);
    });

    return Array.from(chartMap.entries()).map(([date, vals]) => ({
      date,
      Entradas: vals.Entradas,
      Salidas: vals.Salidas,
    }));
  }, [filteredMovements]);

  const uniqueCategories = Array.from(new Set(movements.map((m) => m.category)));

  const handleRegisterManual = async () => {
    if (!formData.amount_usd || !formData.date || !formData.description) {
      toast.error("Llena todos los campos obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase.from("users").select("id, company_id").eq("auth_id", user?.id).single();

      const { error } = await supabase.from("transactions").insert({
        company_id: userData?.company_id,
        user_id: userData?.id,
        type: formData.type,
        category: formData.category,
        amount_usd: Number(formData.amount_usd),
        reference: formData.description,
        date: formData.date,
        payment_method: formData.payment_method,
        notes: formData.notes,
      } as any);

      if (error) throw error;
      toast.success("Movimiento registrado con éxito.");
      setManualOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Error al registrar movimiento", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (filteredMovements.length === 0) {
      toast.error("No hay datos para exportar en el período seleccionado.");
      return;
    }

    const exportData = filteredMovements.map(m => ({
      Fecha: format(new Date(m.date), "dd/MM/yyyy HH:mm"),
      Descripción: m.description,
      Tipo: m.type,
      Categoría: m.category,
      Monto: m.amount_usd,
      Saldo_Acumulado: m.balance,
      Origen: m.source,
      Metodo: m.payment_method
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
    toast.success("Archivo CSV generado correctamente.");
  };

  const formatWithCurrency = (val: number) => {
    if (currencyFilter === "Bs" && bcvRate) {
      return `Bs. ${(val * bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatCurrency(val);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-20 font-montserrat">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-1 tracking-tight">Centro de Proyección Financiera</h1>
          <p className="text-text-2 mt-2 text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand" /> Inteligencia predictiva y salud de caja en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-surface-card border border-border p-1 rounded-xl shadow-sm">
             <button onClick={()=>setCurrencyFilter("USD")} className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg transition-all", currencyFilter === "USD" ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1")}>USD</button>
             <button onClick={()=>setCurrencyFilter("Bs")} className={cn("px-4 py-1.5 text-[10px] font-black rounded-lg transition-all", currencyFilter === "Bs" ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1")}>BS</button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-card border border-border/40 text-text-1 rounded-xl font-bold shadow-sm hover:bg-surface-hover/10 transition-all flex-1 lg:flex-none justify-center"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => setManualOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all flex-1 lg:flex-none justify-center"
          >
            <Plus className="w-5 h-5" /> Movimiento Manual
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: POSICIÓN DE LIQUIDEZ ACTUAL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Card Principal: Saldo Total */}
        <Card className="lg:col-span-2 p-8 bg-surface-card border-brand/50 border-2 relative overflow-hidden group shadow-elevation">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Wallet className="w-32 h-32 text-brand" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> Saldo Total Disponible
            </p>
            <h2 className="text-5xl font-black text-text-1 font-mono tracking-tighter">
              {loading ? "---" : formatWithCurrency(currentBalance)}
            </h2>
            <div className="mt-6 flex items-center gap-4">
               <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-brand/20 border-2 border-surface-card flex items-center justify-center text-brand"><Banknote className="w-4 h-4" /></div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-surface-card flex items-center justify-center text-emerald-500"><Globe className="w-4 h-4" /></div>
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-surface-card flex items-center justify-center text-blue-500"><CreditCard className="w-4 h-4" /></div>
               </div>
               <p className="text-xs text-text-3 font-medium">Sincronizado con todas las fuentes</p>
            </div>
          </div>
        </Card>

        {/* Desglose por Método */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
           {[
             { label: "Efectivo", icon: Banknote, color: "text-orange-500", bg: "bg-orange-500/10", val: balanceByMethod["Efectivo"] },
             { label: "Bancos", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10", val: balanceByMethod["Bancos"] },
             { label: "Digital/Divisas", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10", val: balanceByMethod["Digital/Divisas"] }
           ].map((item, idx) => (
             <Card key={idx} className="p-5 bg-surface-card border-border shadow-sm flex lg:flex-row xl:flex-col items-center xl:items-start gap-4 hover:border-brand/30 transition-all cursor-default">
               <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                 <item.icon className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-[9px] text-text-3 font-black uppercase tracking-widest">{item.label}</p>
                 <p className="text-lg font-black text-text-1 font-mono">{formatWithCurrency(item.val)}</p>
               </div>
             </Card>
           ))}
        </div>
      </div>

      {/* SECCIÓN 2: EL 'CASH 360' - PROYECCIÓN A 30 DÍAS */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-8 bg-surface-card border border-border rounded-3xl shadow-elevation relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h3 className="text-xl font-black text-text-1 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-brand" /> Cash 360: Proyección a 30 Días
              </h3>
              <p className="text-text-3 text-xs font-medium mt-1">Simulación basada en compromisos de pago y cobranza pendiente</p>
            </div>
            
            {/* Indicador de Alerta de Liquidez */}
            <AnimatePresence>
              {deficitPoint && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-status-danger/10 border border-status-danger/30 p-4 rounded-2xl flex items-center gap-4 animate-pulse-slow"
                >
                  <div className="w-10 h-10 rounded-full bg-status-danger/20 flex items-center justify-center text-status-danger">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-status-danger text-[10px] font-black uppercase tracking-widest">Riesgo de Déficit</p>
                    <p className="text-text-1 text-xs font-bold mt-0.5">
                      En {differenceInDays(parseISO(deficitPoint.date), new Date())} días por {formatWithCurrency(Math.abs(deficitPoint.balance))}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-[400px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand" />
              </div>
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
                      <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => format(parseISO(str), "dd MMM")}
                    tick={{ fill: "var(--text-3)", fontSize: 10, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tickFormatter={(val) => `$${val > 1000 ? (val/1000).toFixed(1) + 'k' : val}`} 
                    tick={{ fill: "var(--text-3)", fontSize: 10, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "var(--bg-card)", 
                      borderColor: "var(--border)", 
                      borderRadius: "16px", 
                      color: "var(--text-1)",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    labelFormatter={(label) => format(parseISO(label), "PPPP", { locale: es })}
                    formatter={(value: any) => [formatWithCurrency(Number(value || 0)), "Saldo Proyectado"]} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="var(--brand)" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* SECCIÓN 3: ENTRADAS Y SALIDAS PRÓXIMAS (PANELES COMPARATIVOS) */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Entradas Esperadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-text-1 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-status-ok" /> Entradas Esperadas (CxC)
            </h3>
            <span className="text-[10px] font-black bg-status-ok/10 text-status-ok px-2 py-1 rounded-lg uppercase tracking-widest">
              PRÓX. 15 DÍAS
            </span>
          </div>
          <div className="space-y-3">
            {upcomingInflows.slice(0, 5).length === 0 ? (
              <p className="text-center py-10 text-text-3 text-sm bg-surface-card rounded-2xl border border-dashed border-border italic">No hay cobros pendientes próximos</p>
            ) : (
              upcomingInflows.slice(0, 5).map((item) => (
                <Card key={item.id} className="p-4 bg-surface-card border-border hover:border-brand/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-ok/10 flex items-center justify-center text-status-ok">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{item.partner_name || "Cliente Genérico"}</p>
                      <p className="text-[10px] text-text-3 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" /> Vence el {format(parseISO(item.date), "dd MMM")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-text-1">{formatWithCurrency(item.amount_usd)}</p>
                    <span className={cn(
                      "text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-1 inline-block",
                      differenceInDays(parseISO(item.date), new Date()) < 3 ? "bg-status-danger/10 text-status-danger" : "bg-status-ok/10 text-status-ok"
                    )}>
                      {differenceInDays(parseISO(item.date), new Date()) <= 0 ? "Vencido" : `En ${differenceInDays(parseISO(item.date), new Date())} días`}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Salidas Comprometidas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-text-1 flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-status-danger" /> Salidas Comprometidas (CxP)
            </h3>
            <span className="text-[10px] font-black bg-status-danger/10 text-status-danger px-2 py-1 rounded-lg uppercase tracking-widest">
              GASTOS Y ÓRDENES
            </span>
          </div>
          <div className="space-y-3">
            {upcomingOutflows.slice(0, 5).length === 0 ? (
              <p className="text-center py-10 text-text-3 text-sm bg-surface-card rounded-2xl border border-dashed border-border italic">No hay pagos pendientes próximos</p>
            ) : (
              upcomingOutflows.slice(0, 5).map((item) => (
                <Card key={item.id} className="p-4 bg-surface-card border-border hover:border-brand/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{item.partner_name || "Proveedor Genérico"}</p>
                      <p className="text-[10px] text-text-3 font-medium flex items-center gap-1.5 mt-0.5">
                        <Coins className="w-3 h-3" /> {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-text-1">{formatWithCurrency(item.amount_usd)}</p>
                    <p className="text-[10px] text-text-3 font-bold mt-1 lowercase first-letter:uppercase">Vence {format(parseISO(item.date), "dd MMM")}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS */}
        <div className="bg-surface-card border border-border rounded-3xl overflow-hidden shadow-elevation flex flex-col h-[70vh]">
          <div className="p-6 border-b border-border/40 bg-surface-card/40 flex flex-col xl:flex-row justify-between items-center gap-6">
            <div className="relative w-full xl:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
              <Input
                placeholder="Buscar descripción o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-surface-input border border-border/40 text-text-1 h-12 rounded-xl focus:border-brand/40 transition-all outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="flex items-center gap-2 bg-surface-input p-1 rounded-xl border border-border/40">
                {(["todo", "mes", "semana"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest",
                      timeFilter === f ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger className="w-32 bg-surface-input border border-border/40 text-text-1 h-12 rounded-xl focus:border-brand/40 outline-none">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-text-1">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Entrada">Entradas</SelectItem>
                  <SelectItem value="Salida">Salidas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                <SelectTrigger className="w-40 bg-surface-input border border-border/40 text-text-1 h-12 rounded-xl focus:border-brand/40 outline-none">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-text-1">
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueCategories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 no-scrollbar">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="bg-surface-base/80 text-text-3 sticky top-0 z-10 backdrop-blur-xl border-b border-border/50">
                <tr>
                  <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest whitespace-nowrap border-b border-border/50">Fecha</th>
                  <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Concepto / Descripción</th>
                  <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Método / Categoría</th>
                  <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-border/50">Origen</th>
                  <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-right whitespace-nowrap border-b border-border/50">Monto</th>
                  <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-right whitespace-nowrap border-b border-border/50">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center text-text-3 font-medium">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m, idx) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      className="hover:bg-surface-hover/5 transition-colors group"
                    >
                      <td className="px-6 py-5 text-text-2 font-medium whitespace-nowrap">
                        <div className="flex flex-col">
                           <span className="text-text-1 font-bold">{format(new Date(m.date), "dd/MM/yy", { locale: es })}</span>
                           <span className="text-[10px] opacity-50">{format(new Date(m.date), "HH:mm")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-text-1 group-hover:text-brand transition-colors">{m.description || 'Sin Descripción'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-1.5">
                              <span className="text-text-1 font-black text-[10px] uppercase">{m.payment_method || 'Efectivo'}</span>
                           </div>
                           <span className="text-text-3 text-[9px] font-bold uppercase tracking-tighter">{m.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest",
                          m.source === "Ventas" || m.source === "Cobranza" ? "bg-status-ok/10 text-status-ok" : "bg-brand/10 text-brand"
                        )}>
                          {m.source}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className={`font-mono font-black text-base ${m.type === "Entrada" ? "text-status-ok" : "text-status-danger"}`}>
                          {m.type === "Entrada" ? "+" : "-"}{formatWithCurrency(m.amount_usd)}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="font-mono font-bold text-text-1">
                          {formatWithCurrency(m.balance || 0)}
                        </p>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* DIÁLOGO: MOVIMIENTO MANUAL REDISEÑADO */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="bg-surface-card border-border text-text-1 sm:max-w-xl p-0 overflow-hidden rounded-3xl">
          <div className="bg-brand-gradient p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Nuevo Ajuste de Caja</DialogTitle>
              <p className="text-white/70 text-xs font-medium mt-1">Registra entradas o salidas manuales para cuadrar tu balance.</p>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-3 uppercase tracking-widest">Tipo de Movimiento</label>
                <div className="flex p-1 bg-surface-input rounded-xl border border-border/40">
                   <button 
                    onClick={()=>setFormData({...formData, type: "inflow"})}
                    className={cn("flex-1 py-2 text-[10px] font-black rounded-lg transition-all", formData.type === "inflow" ? "bg-white text-brand shadow-sm" : "text-text-3")}
                   >ENTRADA</button>
                   <button 
                    onClick={()=>setFormData({...formData, type: "outflow"})}
                    className={cn("flex-1 py-2 text-[10px] font-black rounded-lg transition-all", formData.type === "outflow" ? "bg-white text-status-danger shadow-sm" : "text-text-3")}
                   >SALIDA</button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-3 uppercase tracking-widest">Método de Pago</label>
                <Select value={formData.payment_method} onValueChange={(val) => setFormData((p) => ({ ...p, payment_method: val }))}>
                  <SelectTrigger className="bg-surface-input border-border/40 h-11 rounded-xl text-text-1 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-card border-border text-text-1">
                    {["Efectivo", "Banesco", "Mercantil", "Zelle", "Binance", "Otros"].map(m => (
                       <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-text-3 uppercase tracking-widest">Descripción / Concepto</label>
                <Input
                  placeholder="Ej: Aporte inicial de socios..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-surface-input border border-border/40 h-12 rounded-xl text-text-1 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-3 uppercase tracking-widest text-brand">Monto (USD)</label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                   <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount_usd}
                    onChange={(e) => setFormData({ ...formData, amount_usd: e.target.value })}
                    className="pl-10 bg-surface-input border border-border/40 h-12 rounded-xl font-black text-lg text-text-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-3 uppercase tracking-widest">Fecha y Hora</label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-surface-input border border-border/40 h-12 rounded-xl text-text-1 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-surface-base flex justify-end gap-3">
             <button
              onClick={() => setManualOpen(false)}
              className="px-6 py-2 text-text-3 font-black text-xs uppercase tracking-widest hover:text-text-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={handleRegisterManual}
              className="px-10 py-3 bg-brand-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-brand hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Registro"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
