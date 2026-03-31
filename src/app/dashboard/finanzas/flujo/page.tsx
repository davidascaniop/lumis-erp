"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { format, differenceInDays, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
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
  balance?: number;
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
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<FlowMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
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
    date: format(new Date(), "yyyy-MM-dd"),
    reference: "",
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

      // 1. Fetch Transactions (Gastos + Manuales)
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("company_id", userData.company_id);

      // 2. Fetch Payments (Cobranza / Ventas)
      const { data: payData, error: payError } = await supabase
        .from("payments")
        .select("*, partners(name), receivables(invoice_number)")
        .eq("company_id", userData.company_id)
        .in("status", ["verified", "completed", "paid", "approved"]);

      const mappedTx: FlowMovement[] = (txData || []).map((tx) => ({
        id: tx.id,
        date: tx.date || tx.created_at,
        description: tx.reference || (tx.type === "inflow" ? "Entrada Manual" : "Salida Manual"),
        type: tx.type === "inflow" ? "Entrada" : "Salida",
        category: tx.category || "Ajuste manual",
        amount_usd: Number(tx.amount_usd || 0),
        source: tx.expense_id ? "Gastos" : "Manual",
      }));

      const mappedPay: FlowMovement[] = (payData || []).map((p) => ({
        id: p.id,
        date: p.verified_at || p.created_at || new Date().toISOString(),
        description: `Cobro Factura ${p.receivables?.invoice_number || p.reference || "S/N"} - ${p.partners?.name || ""}`,
        type: "Entrada",
        category: "Cobro",
        amount_usd: Number(p.amount_usd || 0),
        source: "Cobranza",
      }));

      // Unificar, ordenar cronológicamente y calcular saldo acumulado
      let runningBalance = 0;
      const combined = [...mappedTx, ...mappedPay]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((item) => {
          if (item.type === "Entrada") runningBalance += item.amount_usd;
          else runningBalance -= item.amount_usd;
          return { ...item, balance: runningBalance };
        });

      // Para mostrar en la tabla, más recientes primero
      setMovements(combined.reverse());
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-primary">Flujo de Caja</h1>
          <p className="text-text-2 mt-1 text-sm">
            Visualiza el movimiento real de dinero de tu negocio
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => { /* Implementar CSV export */ toast.info("Exportación pronto habilitada"); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-card border border-border/40 text-text-1 rounded-xl font-bold shadow-sm hover:bg-surface-hover/10 transition-all w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setManualOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Movimiento Manual
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 stagger">
        <Card className="p-6 bg-surface-card shadow-card flex items-center gap-4 transition-all hover-card-effect ring-2 ring-brand ring-offset-2 ring-offset-surface-base border-brand">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand/15 text-brand">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-2 font-medium">Saldo Actual</p>
            <p className="text-2xl font-primary">
              {loading ? "-" : formatCurrency(currentBalance)}
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-surface-card shadow-card flex items-center gap-4 transition-all hover-card-effect border-status-ok/20">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-status-ok/15 text-status-ok relative z-10">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-status-ok font-medium">Entradas del Período</p>
            <p className="text-2xl font-primary text-text-1">
              {loading ? "-" : formatCurrency(totalIn)}
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-surface-card shadow-card flex items-center gap-4 transition-all hover-card-effect border-status-danger/20">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-status-danger/15 text-status-danger relative z-10">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-status-danger font-medium">Salidas del Período</p>
            <p className="text-2xl font-primary text-text-1">
              {loading ? "-" : formatCurrency(totalOut)}
            </p>
          </div>
        </Card>
      </div>

      {/* CHART & TABLE */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* CHART PORTION */}
        <div className="lg:col-span-3 bg-surface-card border border-border rounded-2xl p-6 shadow-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="font-syne text-lg text-text-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" /> Tendencia de Flujo
            </h3>
            <div className="flex items-center gap-2 bg-surface-input p-1 rounded-xl border border-border/40">
              <button
                onClick={() => setTimeFilter("semana")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === "semana" ? "bg-brand text-white shadow-sm" : "text-text-2 hover:text-text-1"}`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => setTimeFilter("mes")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === "mes" ? "bg-brand text-white shadow-sm" : "text-text-2 hover:text-text-1"}`}
              >
                Este Mes
              </button>
              <button
                onClick={() => setTimeFilter("todo")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === "todo" ? "bg-brand text-white shadow-sm" : "text-text-2 hover:text-text-1"}`}
              >
                Histórico
              </button>
            </div>
          </div>
          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-3">
                <CheckCircle2 className="w-10 h-10 opacity-20 mb-2" />
                <p className="text-sm">No hay datos en este período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val}`} tick={{ fill: "var(--text-3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", borderRadius: "12px", color: "var(--text-1)" }}
                    formatter={(value: number) => [formatCurrency(value), ""]} 
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Bar dataKey="Entradas" fill="var(--ok)" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="Salidas" fill="var(--danger)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* TABLA DE MOVIMIENTOS */}
        <div className="lg:col-span-3 bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col h-[65vh]">
          <div className="p-4 border-b border-border/40 bg-surface-card/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
              <Input
                placeholder="Buscar descripción o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-surface-input border border-border/40 text-text-1 h-11 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger className="w-32 bg-surface-input border border-border/40 text-text-1 h-11 focus:border-brand/40 outline-none">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-text-1">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Entrada">Entradas</SelectItem>
                  <SelectItem value="Salida">Salidas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                <SelectTrigger className="w-40 bg-surface-input border border-border/40 text-text-1 h-11 focus:border-brand/40 outline-none">
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

          <div className="overflow-y-auto flex-1 no-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-base/80 text-text-2 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">Fecha</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Descripción</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Categoría / Tipo</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Origen</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right whitespace-nowrap">Monto</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right whitespace-nowrap">Saldo Acumulado</th>
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
                      No hay transacciones guardadas.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m, idx) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-surface-hover/10 transition-colors"
                    >
                      <td className="px-6 py-4 text-text-2 font-medium whitespace-nowrap">
                        {format(new Date(m.date), "dd/MM/yy HH:mm", { locale: es })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-text-1">{m.description || 'Sin Descripción'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <p className="font-semibold text-text-2 text-xs">{m.category}</p>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${m.type === "Entrada" ? "bg-status-ok/10 text-status-ok" : "bg-status-danger/10 text-status-danger"}`}>
                            {m.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-full font-bold">
                          {m.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`font-mono font-black ${m.type === "Entrada" ? "text-status-ok" : "text-status-danger"}`}>
                          {m.type === "Entrada" ? "+" : "-"}{formatCurrency(m.amount_usd)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-mono font-bold text-text-1">
                          {formatCurrency(m.balance || 0)}
                        </p>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DIALOGO: MANUAL */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-syne text-xl text-text-1">Registrar Movimiento Manual</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Tipo</label>
              <Select value={formData.type} onValueChange={(val) => setFormData((p) => ({ ...p, type: val }))}>
                <SelectTrigger className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 bg-transparent outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-text-1">
                  <SelectItem value="inflow">Entrada</SelectItem>
                  <SelectItem value="outflow">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Categoría</label>
              <Input
                placeholder="Ej: Aporte de capital..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Descripción</label>
              <Input
                placeholder="Motivo del movimiento..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha</label>
              <Input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-surface-input border border-border/40 h-12 text-text-1 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all outline-none"
              />
            </div>
          </div>
          <DialogFooter>
             <button
              onClick={() => setManualOpen(false)}
              className="px-6 py-2 text-text-3 font-bold text-sm bg-transparent hover:text-text-1"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={handleRegisterManual}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-black shadow-brand hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
