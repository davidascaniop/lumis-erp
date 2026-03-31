"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie
} from "recharts";
import {
  Package, Search, Download, Calendar as CalendarIcon, Loader2, AlertTriangle, AlertCircle, DollarSign, ArrowUpDown, ChevronDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const supabase = createClient();

type Period = "week" | "month" | "year" | "custom";
type TopMetric = "qty" | "total";

export default function ProductosReportePage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [topMetric, setTopMetric] = useState<TopMetric>("qty");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ud } = await supabase.from("users").select("company_id").eq("auth_id", user.id).single();
      if (!ud) return;
      setCompanyId(ud.company_id);

      const oneYearAgo = subYears(new Date(), 1).toISOString();
      const [prodRes, itemRes] = await Promise.all([
        supabase.from("products")
          .select("*")
          .eq("company_id", ud.company_id)
          .eq("is_active", true),
        supabase.from("order_items")
          .select("id, product_id, qty, subtotal, created_at, orders!inner(status)")
          .in("orders.status", ["confirmed", "dispatched", "delivered"])
          .gte("created_at", oneYearAgo)
      ]);

      setProducts(prodRes.data || []);
      // Filter out canceled orders if any slipped through, but we used inner join
      setOrderItems(itemRes.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { currentStart, currentEnd } = useMemo(() => {
    const now = new Date();
    let cStart, cEnd;
    switch (period) {
      case "week":
        cStart = startOfDay(subDays(now, 7)); cEnd = endOfDay(now); break;
      case "year":
        cStart = startOfDay(subYears(now, 1)); cEnd = endOfDay(now); break;
      case "month":
      default:
        cStart = startOfDay(subMonths(now, 1)); cEnd = endOfDay(now); break;
    }
    return { currentStart: cStart, currentEnd: cEnd };
  }, [period]);

  const currentOrderItems = useMemo(() => {
    return orderItems.filter(item => {
      const d = parseISO(item.created_at);
      return isWithinInterval(d, { start: currentStart, end: currentEnd });
    });
  }, [orderItems, currentStart, currentEnd]);

  // Aggregate product stats
  const productStats = useMemo(() => {
    const pMap = new Map<string, any>();
    
    // Initialize with all products
    products.forEach(p => {
      const cost = Number(p.cost_usd) || 0;
      const price = Number(p.price_usd) || 0;
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
      
      pMap.set(p.id, {
        ...p,
        qtySold: 0,
        revenue: 0,
        margin,
        lastSale: null,
      });
    });

    // We process ALL order items to find last sale date, not just the period
    orderItems.forEach(item => {
      const p = pMap.get(item.product_id);
      if (p) {
        const d = parseISO(item.created_at);
        if (!p.lastSale || d > p.lastSale) p.lastSale = d;
      }
    });

    // Add period specific data
    currentOrderItems.forEach(item => {
      const p = pMap.get(item.product_id);
      if (p) {
        p.qtySold += item.qty;
        p.revenue += Number(item.subtotal);
      }
    });

    return Array.from(pMap.values());
  }, [products, orderItems, currentOrderItems]);

  // KPIs
  const totalActiveProducts = products.length;
  
  const now = new Date();
  const deadProducts = productStats.filter(p => !p.lastSale || differenceInDays(now, p.lastSale) > 30);
  const deadProductsCount = deadProducts.length;

  const criticalStockProducts = products.filter(p => (p.stock_qty || 0) <= (p.min_stock || 0));
  
  const totalInventoryValue = products.reduce((acc, p) => acc + (Number(p.stock_qty || 0) * Number(p.cost_usd || 0)), 0);

  // Categories for select
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [products]);

  // Chart 1: Top 10 Productos
  const top10 = useMemo(() => {
    return [...productStats]
      .filter(p => p[topMetric === "qty" ? "qtySold" : "revenue"] > 0)
      .sort((a, b) => b[topMetric === "qty" ? "qtySold" : "revenue"] - a[topMetric === "qty" ? "qtySold" : "revenue"])
      .slice(0, 10);
  }, [productStats, topMetric]);

  // Chart 2: Margen de Ganancia (Top 20 or subset to not overload chart)
  const marginData = useMemo(() => {
    return [...productStats]
      .filter(p => p.margin > 0) // Only positive margins to keep chart clean
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 20); // Top 20 for readability
  }, [productStats]);

  const getMarginColor = (margin: number) => {
    if (margin >= 40) return "#00E5CC"; // Alta
    if (margin >= 20) return "#FFB800"; // Medio
    return "#FF2D55"; // Bajo
  };

  // Chart 4: Rotación Donut
  const rotationData = useMemo(() => {
    let alta = 0, media = 0, baja = 0, nula = 0;
    
    productStats.forEach(p => {
      // Very naive rotation calculation based on period sales vs stock
      // En una app real de SaaS se dividiria ventas / stock promedio
      const qty = p.qtySold;
      if (qty === 0) nula++;
      else if (qty > 50) alta++;
      else if (qty > 10) media++;
      else baja++;
    });

    return [
      { name: "Alta Rotación", value: alta, color: "#6C63FF" },
      { name: "Media Rotación", value: media, color: "#FFB800" },
      { name: "Baja Rotación", value: baja, color: "#FF2D55" },
      { name: "Sin Movimiento", value: nula, color: "var(--text-3)" },
    ].filter(d => d.value > 0);
  }, [productStats]);

  // Table Data
  const tableData = useMemo(() => {
    return productStats.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [productStats, search, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Productos e Inventario</h1>
          <p className="text-text-2 mt-1 text-sm">Descubre qué productos te generan dinero y cuáles te lo están comiendo</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
            <SelectTrigger className="w-[180px] bg-surface-card border-border text-text-1 font-montserrat">
              <CalendarIcon className="w-4 h-4 mr-2 text-text-3" />
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent className="bg-surface-elevated border-border z-[9999]" position="popper">
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <button className="px-4 py-2 border border-border bg-surface-card text-text-1 rounded-xl text-sm font-bold font-montserrat hover:bg-surface-hover transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Productos Activos", val: totalActiveProducts, icon: Package, col: "text-brand", bg: "bg-brand/10" },
          { label: "Sin Movimiento (30d)", val: deadProductsCount, icon: AlertCircle, col: "text-status-warn", bg: "bg-status-warn/10" },
          { label: "Stock Crítico", val: criticalStockProducts.length, icon: AlertTriangle, col: "text-status-danger", bg: "bg-status-danger/10" },
          { label: "Valor de Inventario", val: `$${totalInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign, col: "text-status-ok", bg: "bg-status-ok/10" },
        ].map((c, idx) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}>
            <Card className="p-5 bg-surface-card shadow-card border-border/50 flex items-center gap-4 hover-card-effect transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg}`}>
                <c.icon className={`w-5 h-5 ${c.col}`} />
              </div>
              <div>
                <p className="text-[11px] font-montserrat font-bold text-text-3 mb-0.5 uppercase tracking-wide">{c.label}</p>
                <p className="text-2xl font-montserrat font-bold text-text-1">{c.val}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Gráfica 1: Productos más vendidos */}
        <Card className="p-5 bg-surface-card shadow-card border-border/50 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-montserrat font-bold text-text-1 tracking-tight">Top 10 Productos Más Vendidos</h3>
            <div className="bg-surface-input p-1 rounded-lg flex gap-1">
              <button onClick={() => setTopMetric("qty")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${topMetric === "qty" ? "bg-brand text-white shadow" : "text-text-3 hover:text-text-1"}`}>
                Unidades
              </button>
              <button onClick={() => setTopMetric("total")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${topMetric === "total" ? "bg-brand text-white shadow" : "text-text-3 hover:text-text-1"}`}>
                Monto
              </button>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.4} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} 
                  tickFormatter={v => topMetric === "total" ? `$${v}` : v} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-1)', width: 120 }} width={130} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  formatter={(val: any) => [topMetric === "total" ? `$${Number(val).toFixed(2)}` : val, topMetric === "total" ? "Ingresos" : "Unidades"]}
                />
                <Bar dataKey={topMetric === "qty" ? "qtySold" : "revenue"} fill="var(--brand)" radius={[0, 4, 4, 0]} barSize={16}>
                  {top10.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? "var(--brand)" : "var(--brand-dark)"} opacity={index < 3 ? 1 : 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfica 4: Rotación de Inventario (Donut) */}
        <Card className="p-5 bg-surface-card shadow-card border-border/50 lg:col-span-2">
          <h3 className="font-montserrat font-bold text-text-1 tracking-tight mb-6">Rotación de Inventario</h3>
          <div className="h-[200px] w-full flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={rotationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {rotationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] text-text-3 font-bold font-montserrat uppercase">Dinámica</p>
              <p className="text-xl font-bold text-text-1 font-montserrat">{totalActiveProducts}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4">
            {rotationData.map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] text-text-2">{c.name} ({Math.round(c.value / totalActiveProducts * 100)}%)</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Lista visual destacada: Productos sin movimiento */}
        <Card className="p-0 bg-surface-card shadow-card border-border/50 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 bg-status-danger/5 border-b border-status-danger/10">
            <h3 className="font-montserrat font-bold text-status-danger tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Productos Sin Movimiento (30d)
            </h3>
            <p className="text-xs text-status-danger/70 mt-1">Stock inmovilizado; requiere acción comercial inmediata.</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] p-2">
            {deadProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-3 text-sm py-10">Todo el inventario tiene movimiento 🎉</div>
            ) : (
              <div className="space-y-1">
                {deadProducts.slice(0, 10).map((p) => {
                  const lockedValue = Number(p.stock_qty || 0) * Number(p.cost_usd || 0);
                  const days = p.lastSale ? differenceInDays(now, p.lastSale) : "Más de 30";
                  return (
                    <div key={p.id} className="p-3 bg-surface-base hover:bg-surface-hover/50 rounded-lg flex items-center justify-between transition-colors border-l-2 border-transparent hover:border-status-danger">
                      <div>
                        <p className="text-sm font-bold text-text-1 truncate max-w-[150px]">{p.name}</p>
                        <p className="text-[10px] text-text-3 font-mono">{p.sku || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-status-danger font-mono">${lockedValue.toFixed(2)}</p>
                        <p className="text-[10px] text-text-3">{p.stock_qty} en stock • {days} días sin ventas</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Gráfica 3: Margen de Ganancia */}
        <Card className="p-5 bg-surface-card shadow-card border-border/50 lg:col-span-3">
          <h3 className="font-montserrat font-bold text-text-1 tracking-tight mb-6">Margen de Ganancia por Producto (%)</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData} margin={{ top: 10, right: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickFormatter={v => `${v}%`} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)}%`, "Margen"]}
                  labelStyle={{ color: 'var(--text-1)', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="margin" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {marginData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getMarginColor(entry.margin)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-text-3">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00E5CC]" />Alto (&gt;40%)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FFB800]" />Medio (20-40%)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF2D55]" />Bajo (&lt;20%)</div>
          </div>
        </Card>

      </div>

      {/* Report Table */}
      <Card className="bg-surface-card border-border overflow-hidden rounded-2xl flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-border bg-surface-base/50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <h3 className="font-montserrat font-bold text-text-1 tracking-tight">Detalle de Inventario</h3>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] bg-surface-input border-border/40 text-text-1">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-surface-elevated border-border z-[9999]" position="popper">
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
              <Input placeholder="Buscar SKU, Nombre..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 h-10 transition-all shadow-sm" />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>
                {["Producto", "Categoría", "Stock", "Vendidos (Período)", "Margen", "Rotación"].map(h => (
                  <th key={h} className="px-5 py-4 font-bold font-montserrat text-[11px] text-text-1 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableData.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-text-3">No hay datos para mostrar</td></tr>
              ) : tableData.map((p, idx) => {
                const rotacionTxt = p.qtySold === 0 ? "Sin Mov." : p.qtySold > 50 ? "Alta" : p.qtySold > 10 ? "Media" : "Baja";
                const rotCls = rotacionTxt === "Sin Mov." ? "text-text-3 bg-text-3/10" : rotacionTxt === "Alta" ? "text-[#6C63FF] bg-[#6C63FF]/10" : rotacionTxt === "Media" ? "text-status-warn bg-status-warn/10" : "text-status-danger bg-status-danger/10";
                
                return (
                  <motion.tr key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                    className="hover:bg-surface-hover/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-text-1 text-sm">{p.name}</p>
                      <p className="text-[10px] text-text-3 font-mono">{p.sku || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-text-2">{p.category || "General"}</td>
                    <td className="px-5 py-4">
                      <span className={`font-bold ${p.stock_qty <= p.min_stock ? "text-status-danger" : "text-text-1"}`}>{p.stock_qty || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-text-2 font-bold">{p.qtySold}</td>
                    <td className="px-5 py-4 text-xs font-mono font-bold" style={{ color: getMarginColor(p.margin) }}>
                      {p.margin.toFixed(1)}%
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rotCls}`}>{rotacionTxt}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  );
}
