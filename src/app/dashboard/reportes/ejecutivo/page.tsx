"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBCV } from "@/hooks/use-bcv";
import {
  subDays, subMonths, subQuarters, subYears,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  isWithinInterval, differenceInDays, format
} from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart,
  Package, Users, Clock, ArrowUpRight, ArrowDownRight,
  Download, Loader2, DollarSign, Target, Activity,
  CreditCard, Truck, Star, AlertCircle, CheckCircle2,
  ChevronRight, Landmark, Receipt, BarChart3
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Papa from "papaparse";

type PeriodKey = "week" | "month" | "quarter" | "year";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Esta semana",
  month: "Este mes",
  quarter: "Este trimestre",
  year: "Este año",
};

function getPeriodRange(period: PeriodKey) {
  const now = new Date();
  switch (period) {
    case "week":   return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":  return { start: startOfMonth(now), end: endOfMonth(now) };
    case "quarter":return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "year":   return { start: startOfYear(now), end: endOfYear(now) };
  }
}

function getPrevPeriodRange(period: PeriodKey) {
  const now = new Date();
  switch (period) {
    case "week":   { const s = startOfWeek(subDays(now, 7), { weekStartsOn: 1 }); return { start: s, end: endOfWeek(s, { weekStartsOn: 1 }) }; }
    case "month":  { const s = startOfMonth(subMonths(now, 1)); return { start: s, end: endOfMonth(s) }; }
    case "quarter":{ const s = startOfQuarter(subQuarters(now, 1)); return { start: s, end: endOfQuarter(s) }; }
    case "year":   { const s = startOfYear(subYears(now, 1)); return { start: s, end: endOfYear(s) }; }
  }
}

function inRange(dateStr: string, range: { start: Date; end: Date }) {
  try { return isWithinInterval(new Date(dateStr), range); }
  catch { return false; }
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function TrafficLight({ value, warn, danger }: { value: number; warn: number; danger: number }) {
  const color = value <= danger ? "bg-status-danger" : value <= warn ? "bg-yellow-400" : "bg-emerald-400";
  return <span className={cn("inline-block w-2.5 h-2.5 rounded-full", color)} />;
}

function Delta({ pct }: { pct: number }) {
  const pos = pct >= 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-bold", pos ? "text-emerald-500" : "text-status-danger")}>
      {pos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function ResumenEjecutivoPage() {
  const supabase = createClient();
  const { rate: bcv } = useBCV();
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [loading, setLoading] = useState(true);

  // Raw data
  const [orders, setOrders]         = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payments, setPayments]     = useState<any[]>([]);
  const [products, setProducts]     = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [treasuryMoves, setTreasuryMoves]       = useState<any[]>([]);
  const [purchases, setPurchases]   = useState<any[]>([]);
  const [expenses, setExpenses]     = useState<any[]>([]);
  const [recurringExp, setRecurringExp] = useState<any[]>([]);
  const [sellers, setSellers]       = useState<any[]>([]);
  const [crmOpps, setCrmOpps]       = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: ud } = await supabase.from("users").select("company_id").eq("auth_id", user.id).single();
        if (!ud) return;
        const cid = ud.company_id;

        const oneYearAgo = subYears(new Date(), 1).toISOString();

        const [
          ordRes, recvRes, payRes, prodRes, itemRes,
          tacRes, tmRes, purRes, expRes, recurRes, selRes, crmRes
        ] = await Promise.all([
          supabase.from("orders").select("id,total_usd,amount_paid,amount_due,status,created_at,user_id,partner_id,partners(name)").eq("company_id", cid).gte("created_at", oneYearAgo),
          supabase.from("receivables").select("*").eq("company_id", cid),
          supabase.from("payments").select("amount_usd,created_at,verified_at").eq("company_id", cid).in("status", ["verified","completed","paid","approved"]),
          supabase.from("products").select("id,name,price_usd,cost_usd,stock_qty,min_stock,is_active,category").eq("company_id", cid).eq("is_active", true),
          supabase.from("order_items").select("order_id,qty,subtotal,product_id,products(name)").eq("company_id" as any, cid).gte("created_at" as any, oneYearAgo),
          supabase.from("treasury_accounts").select("*").eq("company_id", cid).eq("is_active", true),
          supabase.from("treasury_movements").select("type,amount,currency,created_at,origin_module").eq("company_id", cid).gte("created_at", oneYearAgo),
          supabase.from("purchases").select("id,total_usd,status,created_at,suppliers(name)").eq("company_id", cid).gte("created_at", oneYearAgo),
          supabase.from("expenses").select("amount_usd,status,due_date,created_at,category").eq("company_id", cid).gte("created_at", oneYearAgo),
          supabase.from("recurring_expenses").select("amount_usd,due_day,is_active,name,category").eq("company_id", cid).eq("is_active", true),
          supabase.from("users").select("id,full_name").eq("company_id", cid).eq("is_active" as any, true),
          supabase.from("crm_oportunidades").select("id,etapa,score,created_at").eq("company_id" as any, cid),
        ]);

        setOrders(ordRes.data || []);
        setReceivables(recvRes.data || []);
        setPayments(payRes.data || []);
        setProducts(prodRes.data || []);
        setOrderItems(itemRes.data || []);
        setTreasuryAccounts(tacRes.data || []);
        setTreasuryMoves(tmRes.data || []);
        setPurchases(purRes.data || []);
        setExpenses(expRes.data || []);
        setRecurringExp(recurRes.data || []);
        setSellers(selRes.data || []);
        setCrmOpps(crmRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const range     = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPrevPeriodRange(period), [period]);

  // ── KPI 1: CAJA DISPONIBLE ──────────────────────────────────────────────────
  const cajaTotal = useMemo(() => {
    if (!bcv) return 0;
    return treasuryAccounts.reduce((acc, a) => {
      const bal = Number(a.current_balance || 0);
      if (a.currency === "usd" || a.currency === "usdt") return acc + bal;
      if (a.currency === "bs") return acc + (bal / (bcv || 1));
      return acc + bal;
    }, 0);
  }, [treasuryAccounts, bcv]);

  // ── KPI 2: VENTAS DEL PERÍODO ───────────────────────────────────────────────
  const validStatuses = ["completed", "confirmed", "dispatched", "delivered", "paid", "despachado"];
  const ventasPeriodo = useMemo(() =>
    orders.filter(o => validStatuses.includes(o.status) && inRange(o.created_at, range))
          .reduce((acc, o) => acc + Number(o.total_usd || 0), 0),
  [orders, range]);
  const ventasPrev = useMemo(() =>
    orders.filter(o => validStatuses.includes(o.status) && inRange(o.created_at, prevRange))
          .reduce((acc, o) => acc + Number(o.total_usd || 0), 0),
  [orders, prevRange]);

  // ── KPI 3: CXC VENCIDO ─────────────────────────────────────────────────────
  const today = new Date();
  const cxcVencido = useMemo(() =>
    receivables.filter(r => r.status !== "paid" && new Date(r.due_date) < today)
               .reduce((acc, r) => acc + Number(r.balance_usd || 0), 0),
  [receivables]);
  const cxcTotal = useMemo(() =>
    receivables.filter(r => r.status !== "paid")
               .reduce((acc, r) => acc + Number(r.balance_usd || 0), 0),
  [receivables]);

  // ── KPI 4: COMPROMISOS DE COMPRA ────────────────────────────────────────────
  const comprasComprometidas = useMemo(() =>
    purchases.filter(p => ["confirmed", "partial"].includes(p.status))
             .reduce((acc, p) => acc + Number(p.total_usd || 0), 0),
  [purchases]);

  // ── COBROS EFECTIVOS DEL PERÍODO ────────────────────────────────────────────
  const cobrosEfectivos = useMemo(() =>
    payments.filter(p => inRange(p.verified_at || p.created_at, range))
            .reduce((acc, p) => acc + Number(p.amount_usd || 0), 0),
  [payments, range]);

  // ── AGING CXC ───────────────────────────────────────────────────────────────
  const aging = useMemo(() => {
    const pending = receivables.filter(r => r.status !== "paid");
    const buckets = { al_dia: 0, d1_15: 0, d16_30: 0, mas30: 0 };
    pending.forEach(r => {
      const days = differenceInDays(today, new Date(r.due_date));
      const bal = Number(r.balance_usd || 0);
      if (days <= 0)       buckets.al_dia += bal;
      else if (days <= 15) buckets.d1_15  += bal;
      else if (days <= 30) buckets.d16_30 += bal;
      else                 buckets.mas30  += bal;
    });
    return buckets;
  }, [receivables]);

  const dso = useMemo(() => {
    const paidRecv = receivables.filter(r => r.status === "paid" && r.paid_at);
    if (!paidRecv.length) {
      // Estimate from order creation → payment
      const paidOrders = orders.filter(o => ["completed","paid"].includes(o.status));
      if (!paidOrders.length) return 0;
      const avgDays = paidOrders.reduce((acc, o) => {
        return acc + Math.max(0, differenceInDays(today, new Date(o.created_at)));
      }, 0) / paidOrders.length;
      return Math.round(avgDays);
    }
    return 0;
  }, [receivables, orders]);

  // ── VENTAS DIARIAS (gráfica de área) ────────────────────────────────────────
  const dailyChart = useMemo(() => {
    const map: Record<string, { ventas: number; cobros: number }> = {};
    orders.filter(o => validStatuses.includes(o.status) && inRange(o.created_at, range)).forEach(o => {
      const d = format(new Date(o.created_at), "dd MMM", { locale: es });
      if (!map[d]) map[d] = { ventas: 0, cobros: 0 };
      map[d].ventas += Number(o.total_usd || 0);
    });
    payments.filter(p => inRange(p.verified_at || p.created_at, range)).forEach(p => {
      const d = format(new Date(p.verified_at || p.created_at), "dd MMM", { locale: es });
      if (!map[d]) map[d] = { ventas: 0, cobros: 0 };
      map[d].cobros += Number(p.amount_usd || 0);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }));
  }, [orders, payments, range]);

  // ── INVENTARIO ──────────────────────────────────────────────────────────────
  const inventoryValue = useMemo(() =>
    products.reduce((acc, p) => acc + Number(p.price_usd || 0) * Number(p.stock_qty || 0), 0),
  [products]);
  const criticalStock  = useMemo(() => products.filter(p => Number(p.stock_qty) <= Number(p.min_stock)).length, [products]);
  const soldProductIds = useMemo(() => {
    const cutoff = subDays(today, 30);
    return new Set(orderItems.filter(i => new Date(i.created_at || today) >= cutoff).map(i => i.product_id));
  }, [orderItems]);
  const deadStock = useMemo(() => products.filter(p => !soldProductIds.has(p.id) && Number(p.stock_qty) > 0).length, [products, soldProductIds]);
  const deadStockValue = useMemo(() =>
    products.filter(p => !soldProductIds.has(p.id) && Number(p.stock_qty) > 0)
            .reduce((acc, p) => acc + Number(p.cost_usd || 0) * Number(p.stock_qty || 0), 0),
  [products, soldProductIds]);

  // Top 5 productos más rentables del período
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; qty: number }> = {};
    const periodOrders = new Set(orders.filter(o => validStatuses.includes(o.status) && inRange(o.created_at, range)).map(o => o.id));
    orderItems.filter(i => periodOrders.has(i.order_id)).forEach(i => {
      const name = (i.products as any)?.name || "Producto";
      if (!map[i.product_id]) map[i.product_id] = { name, revenue: 0, qty: 0 };
      map[i.product_id].revenue += Number(i.subtotal || 0);
      map[i.product_id].qty     += Number(i.qty || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders, orderItems, range]);

  // ── RANKING VENDEDORES ──────────────────────────────────────────────────────
  const sellerRanking = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    orders.filter(o => validStatuses.includes(o.status) && inRange(o.created_at, range)).forEach(o => {
      const uid = o.user_id || "unknown";
      const seller = sellers.find(s => s.id === uid);
      const name = seller?.full_name || `Vendedor ${uid.slice(-4)}`;
      if (!map[uid]) map[uid] = { name, total: 0, count: 0 };
      map[uid].total += Number(o.total_usd || 0);
      map[uid].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders, sellers, range]);

  // ── CRM PIPELINE ─────────────────────────────────────────────────────────────
  const pipeline = useMemo(() => {
    const hot  = crmOpps.filter(o => Number(o.score) >= 70).length;
    const total = crmOpps.length;
    const periodClosed = crmOpps.filter(o => o.etapa?.toLowerCase().includes("cerrad") && inRange(o.created_at, range)).length;
    return { hot, total, periodClosed };
  }, [crmOpps, range]);

  // ── GASTOS DEL PERÍODO ──────────────────────────────────────────────────────
  const gastosPeriodo = useMemo(() =>
    expenses.filter(e => inRange(e.created_at, range)).reduce((acc, e) => acc + Number(e.amount_usd || 0), 0),
  [expenses, range]);
  const gastosPrev = useMemo(() =>
    expenses.filter(e => inRange(e.created_at, prevRange)).reduce((acc, e) => acc + Number(e.amount_usd || 0), 0),
  [expenses, prevRange]);
  const monthlyRecurring = useMemo(() =>
    recurringExp.reduce((acc, r) => acc + Number(r.amount_usd || 0), 0),
  [recurringExp]);
  const upcomingRecurring = useMemo(() => {
    const todayDay = today.getDate();
    return recurringExp.filter(r => {
      const due = Number(r.due_day);
      return due >= todayDay && due <= todayDay + 7;
    });
  }, [recurringExp]);

  // ── FLUJO NETO DIARIO (entradas vs salidas treasury) ────────────────────────
  const flujoChart = useMemo(() => {
    const map: Record<string, { entradas: number; salidas: number }> = {};
    treasuryMoves.filter(m => inRange(m.created_at, range)).forEach(m => {
      const d = format(new Date(m.created_at), "dd MMM", { locale: es });
      if (!map[d]) map[d] = { entradas: 0, salidas: 0 };
      const amt = Number(m.amount || 0);
      if (m.type === "entrada") map[d].entradas += amt;
      else                      map[d].salidas  += amt;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }));
  }, [treasuryMoves, range]);

  // ── EXPORT ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      { metric: "Caja Disponible (USD)", value: cajaTotal.toFixed(2) },
      { metric: "Ventas del Período (USD)", value: ventasPeriodo.toFixed(2) },
      { metric: "CxC Total Pendiente (USD)", value: cxcTotal.toFixed(2) },
      { metric: "CxC Vencido (USD)", value: cxcVencido.toFixed(2) },
      { metric: "Compromisos Compras (USD)", value: comprasComprometidas.toFixed(2) },
      { metric: "Cobros Efectivos (USD)", value: cobrosEfectivos.toFixed(2) },
      { metric: "Valor Inventario (USD)", value: inventoryValue.toFixed(2) },
      { metric: "Productos Stock Crítico", value: criticalStock },
      { metric: "Productos Sin Movimiento (30d)", value: deadStock },
      { metric: "Capital Dormido en Inventario (USD)", value: deadStockValue.toFixed(2) },
      { metric: "Gastos del Período (USD)", value: gastosPeriodo.toFixed(2) },
      { metric: "Recurrentes Mensuales (USD)", value: monthlyRecurring.toFixed(2) },
      { metric: "Oportunidades CRM", value: pipeline.total },
      { metric: "Oportunidades Calientes (score≥70)", value: pipeline.hot },
    ];
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen-ejecutivo-${period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) return (
    <div className="p-20 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto mb-3" />
      <p className="text-text-3 text-sm font-medium">Cargando datos de todos los módulos...</p>
    </div>
  );

  const ventasDelta = pctChange(ventasPeriodo, ventasPrev);
  const gastosDelta = pctChange(gastosPeriodo, gastosPrev);
  const agedTotal   = aging.al_dia + aging.d1_15 + aging.d16_30 + aging.mas30;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-3xl font-montserrat font-bold text-text-1">Resumen Ejecutivo</h1>
          </div>
          <p className="text-text-2 text-sm font-medium">Vista consolidada de todo el negocio para toma de decisiones</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period pills */}
          <div className="flex p-1 bg-surface-card border border-border rounded-xl overflow-x-auto no-scrollbar">
            {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                  period === p ? "bg-brand text-white shadow-brand" : "text-text-3 hover:text-text-1")}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-card border border-border text-text-1 rounded-xl font-bold text-sm shadow-sm hover:bg-surface-hover/10 transition-all">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* ── SECCIÓN 1: PULSO DEL NEGOCIO ── */}
      <section>
        <h2 className="text-xs font-bold text-text-3 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-brand" /> Pulso del Negocio
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Caja */}
          <Card className="p-5 bg-surface-card border-border shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <Wallet className="w-5 h-5" />
              </div>
              <TrafficLight value={cajaTotal} warn={500} danger={100} />
            </div>
            <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider mb-1">Caja Disponible</p>
            <p className="text-2xl font-black text-text-1 font-mono">{formatCurrency(cajaTotal)}</p>
            <p className="text-[10px] text-text-3 mt-1">{treasuryAccounts.length} cuenta{treasuryAccounts.length !== 1 ? "s" : ""} activa{treasuryAccounts.length !== 1 ? "s" : ""}</p>
          </Card>

          {/* Ventas */}
          <Card className="p-5 bg-surface-card border-border shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <Delta pct={ventasDelta} />
            </div>
            <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider mb-1">Ventas del Período</p>
            <p className="text-2xl font-black text-text-1 font-mono">{formatCurrency(ventasPeriodo)}</p>
            <p className="text-[10px] text-text-3 mt-1">
              {orders.filter(o => validStatuses.includes(o.status) && inRange(o.created_at, range)).length} órdenes · Cobrado: {formatCurrency(cobrosEfectivos)}
            </p>
          </Card>

          {/* CxC Vencido */}
          <Card className={cn("p-5 border shadow-sm", cxcVencido > 0 ? "bg-red-50/50 border-status-danger/30" : "bg-surface-card border-border")}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cxcVencido > 0 ? "bg-status-danger/10 text-status-danger" : "bg-orange-500/10 text-orange-500")}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <TrafficLight value={cxcVencido} warn={cxcTotal * 0.1} danger={cxcTotal * 0.3} />
            </div>
            <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider mb-1">CxC Vencido</p>
            <p className={cn("text-2xl font-black font-mono", cxcVencido > 0 ? "text-status-danger" : "text-text-1")}>{formatCurrency(cxcVencido)}</p>
            <p className="text-[10px] text-text-3 mt-1">De {formatCurrency(cxcTotal)} total por cobrar</p>
          </Card>

          {/* Compras comprometidas */}
          <Card className="p-5 bg-surface-card border-border shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {purchases.filter(p => ["confirmed","partial"].includes(p.status)).length} órdenes
              </span>
            </div>
            <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider mb-1">Compromisos de Compra</p>
            <p className="text-2xl font-black text-text-1 font-mono">{formatCurrency(comprasComprometidas)}</p>
            <p className="text-[10px] text-text-3 mt-1">Pendientes de recibir o pagar</p>
          </Card>
        </div>
      </section>

      {/* ── SECCIÓN 2: VENTAS Y COBRANZA ── */}
      <section>
        <h2 className="text-xs font-bold text-text-3 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Ventas y Cobranza
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Gráfica de área */}
          <Card className="lg:col-span-2 p-5 bg-surface-card border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-text-1 text-sm">Ventas vs Cobros</h3>
                <p className="text-[10px] text-text-3">Gap = crédito pendiente de cobrar</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-brand"><span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" /> Ventas</span>
                <span className="flex items-center gap-1 text-emerald-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Cobros</span>
              </div>
            </div>
            {dailyChart.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-text-3 text-sm">Sin datos para el período</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={dailyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E040FB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#E040FB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCobros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="ventas" stroke="#E040FB" strokeWidth={2} fill="url(#gVentas)" />
                  <Area type="monotone" dataKey="cobros" stroke="#10b981" strokeWidth={2} fill="url(#gCobros)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Aging CxC */}
          <Card className="p-5 bg-surface-card border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-1 text-sm">Envejecimiento CxC</h3>
              {dso > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-brand/10 text-brand rounded-full">
                  DSO: {dso}d
                </span>
              )}
            </div>
            <div className="space-y-3">
              {[
                { label: "Al día", value: aging.al_dia,  color: "bg-emerald-400" },
                { label: "1-15 días", value: aging.d1_15, color: "bg-yellow-400" },
                { label: "16-30 días", value: aging.d16_30, color: "bg-orange-400" },
                { label: "+30 días",  value: aging.mas30, color: "bg-status-danger" },
              ].map(b => {
                const pct = agedTotal > 0 ? (b.value / agedTotal) * 100 : 0;
                return (
                  <div key={b.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text-2 font-medium">{b.label}</span>
                      <span className="font-bold text-text-1">{formatCurrency(b.value)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-base rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", b.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-border flex justify-between text-xs font-bold">
                <span className="text-text-3">Total CxC</span>
                <span className="text-text-1">{formatCurrency(cxcTotal)}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── SECCIÓN 3: INVENTARIO ── */}
      <section>
        <h2 className="text-xs font-bold text-text-3 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-blue-500" /> Inventario y Productos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Valor Inventario</p>
              <p className="text-xl font-black text-text-1">{formatCurrency(inventoryValue)}</p>
              <p className="text-[10px] text-text-3">{products.length} productos activos</p>
            </div>
          </Card>
          <Card className={cn("p-5 border shadow-sm flex items-center gap-4", criticalStock > 0 ? "bg-red-50/30 border-status-danger/20" : "bg-surface-card border-border")}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", criticalStock > 0 ? "bg-status-danger/10 text-status-danger" : "bg-emerald-500/10 text-emerald-500")}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Stock Crítico</p>
              <p className={cn("text-xl font-black", criticalStock > 0 ? "text-status-danger" : "text-text-1")}>{criticalStock}</p>
              <p className="text-[10px] text-text-3">bajo mínimo configurado</p>
            </div>
          </Card>
          <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Capital Dormido</p>
              <p className="text-xl font-black text-orange-500">{formatCurrency(deadStockValue)}</p>
              <p className="text-[10px] text-text-3">{deadStock} productos sin ventas 30d</p>
            </div>
          </Card>
        </div>

        {/* Top 5 productos */}
        {topProducts.length > 0 && (
          <Card className="p-5 bg-surface-card border-border shadow-sm">
            <h3 className="font-bold text-text-1 text-sm mb-4">Top 5 Productos del Período</h3>
            <div className="space-y-2.5">
              {topProducts.map((p, i) => {
                const maxRev = topProducts[0]?.revenue || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-text-3 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-bold text-text-1 truncate">{p.name}</span>
                        <span className="font-bold text-text-1 flex-shrink-0 ml-2">{formatCurrency(p.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-surface-base rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-brand/60 transition-all" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-text-3 w-14 text-right flex-shrink-0">{p.qty} uds</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>

      {/* ── SECCIÓN 4: EQUIPO Y PIPELINE ── */}
      <section>
        <h2 className="text-xs font-bold text-text-3 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-purple-500" /> Equipo y Pipeline CRM
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Ranking vendedores */}
          <Card className="p-5 bg-surface-card border-border shadow-sm">
            <h3 className="font-bold text-text-1 text-sm mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> Ranking Vendedores
            </h3>
            {sellerRanking.length === 0 ? (
              <p className="text-text-3 text-sm py-4 text-center">Sin datos de ventas en el período</p>
            ) : (
              <div className="space-y-3">
                {sellerRanking.map((s, i) => {
                  const totalPeriod = sellerRanking.reduce((a, b) => a + b.total, 0);
                  const pct = totalPeriod > 0 ? (s.total / totalPeriod) * 100 : 0;
                  const medals = ["🥇", "🥈", "🥉", "4°", "5°"];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm w-6 flex-shrink-0">{medals[i] || `${i+1}°`}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-bold text-text-1 truncate">{s.name}</span>
                          <span className="font-bold text-text-1 flex-shrink-0 ml-2">{formatCurrency(s.total)}</span>
                        </div>
                        <div className="h-1.5 bg-surface-base rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-purple-500/60 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[9px] text-text-3 mt-0.5">{s.count} venta{s.count !== 1 ? "s" : ""} · {pct.toFixed(0)}% del total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pipeline CRM */}
          <Card className="p-5 bg-surface-card border-border shadow-sm">
            <h3 className="font-bold text-text-1 text-sm mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand" /> Pipeline CRM
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-surface-base rounded-xl">
                <p className="text-2xl font-black text-text-1">{pipeline.total}</p>
                <p className="text-[9px] text-text-3 font-bold uppercase mt-0.5">Total opps</p>
              </div>
              <div className="text-center p-3 bg-status-danger/5 border border-status-danger/10 rounded-xl">
                <p className="text-2xl font-black text-brand">{pipeline.hot}</p>
                <p className="text-[9px] text-brand font-bold uppercase mt-0.5">🔥 Calientes</p>
              </div>
              <div className="text-center p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <p className="text-2xl font-black text-emerald-500">{pipeline.periodClosed}</p>
                <p className="text-[9px] text-emerald-500 font-bold uppercase mt-0.5">Cerradas</p>
              </div>
            </div>
            {pipeline.total === 0 && (
              <p className="text-text-3 text-xs text-center py-2">Sin oportunidades registradas en CRM</p>
            )}
            {pipeline.total > 0 && (
              <div className="p-3 bg-surface-base rounded-xl">
                <p className="text-[10px] text-text-3 font-bold mb-1">Tasa de conversión del período</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${pipeline.total > 0 ? (pipeline.periodClosed / pipeline.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-bold text-text-1">
                    {pipeline.total > 0 ? ((pipeline.periodClosed / pipeline.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ── SECCIÓN 5: GASTOS Y FLUJO ── */}
      <section>
        <h2 className="text-xs font-bold text-text-3 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
          <Receipt className="w-3.5 h-3.5 text-orange-500" /> Gastos y Flujo de Caja
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Cards gastos */}
          <div className="space-y-4">
            <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Gastos del Período</p>
                <p className="text-xl font-black text-text-1">{formatCurrency(gastosPeriodo)}</p>
                <Delta pct={gastosDelta} />
              </div>
            </Card>
            <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Recurrentes / mes</p>
                <p className="text-xl font-black text-text-1">{formatCurrency(monthlyRecurring)}</p>
                <p className="text-[10px] text-text-3">{recurringExp.length} gastos fijos activos</p>
              </div>
            </Card>
            {upcomingRecurring.length > 0 && (
              <Card className="p-4 bg-yellow-50/50 border border-yellow-400/20 shadow-sm">
                <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-2">⏰ Vencen esta semana</p>
                <div className="space-y-1.5">
                  {upcomingRecurring.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span className="text-text-2 font-medium truncate">{r.name}</span>
                      <span className="font-bold text-text-1 flex-shrink-0 ml-2">{formatCurrency(r.amount_usd)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Flujo entradas vs salidas */}
          <Card className="lg:col-span-2 p-5 bg-surface-card border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-text-1 text-sm">Entradas vs Salidas (Tesorería)</h3>
                <p className="text-[10px] text-text-3">Flujo real de caja por día</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-emerald-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Entradas</span>
                <span className="flex items-center gap-1 text-status-danger"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Salidas</span>
              </div>
            </div>
            {flujoChart.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-text-3 text-sm">
                Sin movimientos de tesorería en el período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={flujoChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="entradas" fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} />
                  <Bar dataKey="salidas"  fill="#ef4444" radius={[4,4,0,0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[10px] text-text-3 font-medium">
          Datos consolidados de Ventas · Finanzas · Inventario · Compras · CRM · Tesorería — Actualizado en tiempo real
        </p>
      </div>
    </div>
  );
}
