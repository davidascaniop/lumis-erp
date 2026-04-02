"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Search, Filter,
  Download, ChevronDown, ChevronUp, Package, Building2,
  BarChart3, Loader2, Calendar, DollarSign, ArrowRight,
} from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PriceHistoryRow {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  supplier_id: string;
  supplier_name: string;
  unit_price_usd: number;
  unit_price_bs: number;
  bcv_rate: number;
  quantity: number;
  purchased_at: string;
}

interface AggregatedRow {
  key: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  supplier_id: string;
  supplier_name: string;
  latest_price_usd: number;
  latest_price_bs: number;
  min_price_usd: number;
  max_price_usd: number;
  variation_pct: number | null;
  last_purchase: string;
  history: PriceHistoryRow[];
}

const PERIOD_OPTIONS = [
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Último trimestre" },
  { value: "year", label: "Este año" },
];

const LINE_COLORS = [
  "#E040FB", "#00E5CC", "#FFB800", "#4FC3F7", "#FF6B6B", "#69D483",
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-border rounded-xl p-3 shadow-elevated text-xs">
      <p className="text-text-3 font-bold mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-2 truncate max-w-[120px]">{p.name}:</span>
          <span className="font-bold text-text-1">${Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Variation Badge ──────────────────────────────────────────────────────────
function VariationBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-text-3 text-xs">–</span>;
  if (pct === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
      <Minus className="w-3 h-3" /> Sin cambio
    </span>
  );
  const up = pct > 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
      up
        ? "bg-status-danger/10 text-status-danger border-status-danger/20"
        : "bg-status-ok/10 text-status-ok border-status-ok/20"
    )}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalisisPreciosPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<PriceHistoryRow[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("quarter");

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Chart product selection
  const [chartProductId, setChartProductId] = useState<string>("");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const now = new Date();
      let fromDate: Date;
      if (filterPeriod === "month") fromDate = startOfMonth(now);
      else if (filterPeriod === "quarter") fromDate = subMonths(now, 3);
      else fromDate = new Date(now.getFullYear(), 0, 1);

      const { data, error } = await supabase
        .from("purchase_price_history")
        .select(`
          id, product_id, supplier_id, unit_price_usd, unit_price_bs,
          bcv_rate, quantity, purchased_at,
          products(name, sku),
          suppliers(name)
        `)
        .eq("company_id", user.company_id)
        .gte("purchased_at", fromDate.toISOString())
        .order("purchased_at", { ascending: true });

      if (error) throw error;

      const mapped: PriceHistoryRow[] = ((data as any[]) || []).map((r) => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.products?.name ?? "–",
        product_sku: r.products?.sku ?? "–",
        supplier_id: r.supplier_id,
        supplier_name: r.suppliers?.name ?? "–",
        unit_price_usd: r.unit_price_usd,
        unit_price_bs: r.unit_price_bs,
        bcv_rate: r.bcv_rate,
        quantity: r.quantity,
        purchased_at: r.purchased_at,
      }));

      setRawData(mapped);

      // Extract unique products & suppliers for filters
      const prodMap = new Map<string, { id: string; name: string; sku: string }>();
      const supMap = new Map<string, { id: string; name: string }>();
      mapped.forEach((r) => {
        prodMap.set(r.product_id, { id: r.product_id, name: r.product_name, sku: r.product_sku });
        supMap.set(r.supplier_id, { id: r.supplier_id, name: r.supplier_name });
      });
      setProducts([...prodMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
      setSuppliers([...supMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      toast.error("Error al cargar historial de precios", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [user, filterPeriod, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Aggregation ───────────────────────────────────────────────────────────
  const aggregated = useMemo<AggregatedRow[]>(() => {
    const map = new Map<string, PriceHistoryRow[]>();
    rawData.forEach((r) => {
      const key = `${r.product_id}___${r.supplier_id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    const rows: AggregatedRow[] = [];
    map.forEach((history, key) => {
      const sorted = [...history].sort((a, b) =>
        new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime()
      );
      const latest = sorted[sorted.length - 1];
      const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      const minPrice = Math.min(...sorted.map((r) => r.unit_price_usd));
      const maxPrice = Math.max(...sorted.map((r) => r.unit_price_usd));
      let variation: number | null = null;
      if (prev) {
        variation = prev.unit_price_usd > 0
          ? ((latest.unit_price_usd - prev.unit_price_usd) / prev.unit_price_usd) * 100
          : null;
      }
      rows.push({
        key,
        product_id: latest.product_id,
        product_name: latest.product_name,
        product_sku: latest.product_sku,
        supplier_id: latest.supplier_id,
        supplier_name: latest.supplier_name,
        latest_price_usd: latest.unit_price_usd,
        latest_price_bs: latest.unit_price_bs,
        min_price_usd: minPrice,
        max_price_usd: maxPrice,
        variation_pct: variation,
        last_purchase: latest.purchased_at,
        history: sorted,
      });
    });
    return rows.sort((a, b) => a.product_name.localeCompare(b.product_name));
  }, [rawData]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = aggregated;
    if (filterProduct !== "all") rows = rows.filter((r) => r.product_id === filterProduct);
    if (filterSupplier !== "all") rows = rows.filter((r) => r.supplier_id === filterSupplier);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.product_name.toLowerCase().includes(q) ||
          r.product_sku.toLowerCase().includes(q) ||
          r.supplier_name.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [aggregated, filterProduct, filterSupplier, searchQuery]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!chartProductId) return { series: [], timeLabels: [] };
    const bySupplier = new Map<string, { name: string; points: { date: string; price: number }[] }>();

    rawData
      .filter((r) => r.product_id === chartProductId)
      .forEach((r) => {
        if (!bySupplier.has(r.supplier_id)) {
          bySupplier.set(r.supplier_id, { name: r.supplier_name, points: [] });
        }
        bySupplier.get(r.supplier_id)!.points.push({
          date: format(new Date(r.purchased_at), "dd/MM/yy"),
          price: r.unit_price_usd,
        });
      });

    // Build unified x-axis
    const allDates = new Set<string>();
    bySupplier.forEach((s) => s.points.forEach((p) => allDates.add(p.date)));
    const timeLabels = [...allDates].sort((a, b) =>
      a.localeCompare(b)
    );

    const series = [...bySupplier.entries()].map(([, s]) => ({
      name: s.name,
      data: timeLabels.map((date) => {
        const pt = s.points.find((p) => p.date === date);
        return pt?.price ?? null;
      }),
    }));

    return { series, timeLabels };
  }, [rawData, chartProductId]);

  const chartProduct = products.find((p) => p.id === chartProductId);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (filtered.length === 0) return toast.error("No hay datos para exportar");
    const header = "Producto,SKU,Proveedor,Precio USD,Precio Bs.,Min Histórico,Max Histórico,Variación %,Última Compra";
    const rows = filtered.map((r) =>
      [
        `"${r.product_name}"`,
        r.product_sku,
        `"${r.supplier_name}"`,
        r.latest_price_usd.toFixed(4),
        r.latest_price_bs.toFixed(4),
        r.min_price_usd.toFixed(4),
        r.max_price_usd.toFixed(4),
        r.variation_pct !== null ? r.variation_pct.toFixed(2) : "N/A",
        format(new Date(r.last_purchase), "dd/MM/yyyy"),
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analisis-precios-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">
            Análisis de Precios
          </h1>
          <p className="text-text-2 mt-1 text-sm">
            Compara precios históricos por producto y proveedor
          </p>
        </div>
        <button
          onClick={handleExport}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-surface-card border border-border rounded-xl text-sm font-bold text-text-1 hover:bg-surface-base transition-all"
        >
          <Download className="w-4 h-4 text-brand" />
          Exportar Excel
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-surface-card border-border">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar producto, SKU o proveedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface-base border-border"
            />
          </div>

          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-[200px] bg-surface-base border-border">
              <Package className="w-3.5 h-3.5 mr-2 text-text-3" />
              <SelectValue placeholder="Por producto" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border">
              <SelectItem value="all">Todos los productos</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSupplier} onValueChange={setFilterSupplier}>
            <SelectTrigger className="w-[200px] bg-surface-base border-border">
              <Building2 className="w-3.5 h-3.5 mr-2 text-text-3" />
              <SelectValue placeholder="Por proveedor" />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border">
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[180px] bg-surface-base border-border">
              <Calendar className="w-3.5 h-3.5 mr-2 text-text-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border">
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Price Evolution Chart */}
      <Card className="p-6 bg-surface-card border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand" />
            <h2 className="font-montserrat font-bold text-text-1 text-sm">
              Evolución de Precios
            </h2>
            {chartProduct && (
              <span className="text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
                {chartProduct.name} ({chartProduct.sku})
              </span>
            )}
          </div>
          <Select
            value={chartProductId || "none"}
            onValueChange={(v) => setChartProductId(v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-[240px] bg-surface-base border-border">
              <SelectValue placeholder="Seleccionar producto para graficar..." />
            </SelectTrigger>
            <SelectContent className="bg-surface-card border-border">
              <SelectItem value="none">Seleccionar producto...</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!chartProductId ? (
          <div className="h-48 flex flex-col items-center justify-center text-text-3 gap-2 border border-dashed border-border rounded-xl">
            <BarChart3 className="w-10 h-10 opacity-20" />
            <p className="text-sm">Selecciona un producto para ver la evolución de precios</p>
          </div>
        ) : chartData.timeLabels.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-text-3 text-sm">
            Sin datos para este producto en el período seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={chartData.timeLabels.map((date, i) => {
                const point: Record<string, string | number | null> = { date };
                chartData.series.forEach((s) => { point[s.name] = s.data[i]; });
                return point;
              })}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text-3)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-3)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: "8px" }}
                formatter={(value) => <span style={{ color: "var(--text-2)" }}>{value}</span>}
              />
              {chartData.series.map((series, idx) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: LINE_COLORS[idx % LINE_COLORS.length] }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Main Table */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-border bg-surface-base/40 flex items-center justify-between">
          <h2 className="font-montserrat font-bold text-text-1 text-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand" />
            Tabla de Precios
          </h2>
          <span className="text-xs text-text-3">
            {filtered.length} combinación{filtered.length !== 1 ? "es" : ""} producto-proveedor
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-text-3">
            <BarChart3 className="w-12 h-12 opacity-20" />
            <p className="text-sm">No hay historial de precios para los filtros seleccionados</p>
            <p className="text-xs opacity-60">Los datos se generan al emitir Órdenes de Compra</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Proveedor</th>
                  <th className="px-5 py-3 text-right">Precio Reciente</th>
                  <th className="px-5 py-3 text-right">Min Hist.</th>
                  <th className="px-5 py-3 text-right">Max Hist.</th>
                  <th className="px-5 py-3 text-center">Variación</th>
                  <th className="px-5 py-3">Última Compra</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row) => {
                  const isExpanded = expandedRows.has(row.key);
                  return (
                    <>
                      <tr
                        key={row.key}
                        onClick={() => toggleRow(row.key)}
                        className="hover:bg-surface-hover/20 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-text-1">{row.product_name}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-text-3">{row.product_sku}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center">
                              <Building2 className="w-3 h-3 text-brand" />
                            </div>
                            <span className="text-text-2 text-xs">{row.supplier_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-bold font-mono text-text-1">${row.latest_price_usd.toFixed(4)}</p>
                          <p className="text-[10px] text-text-3 font-mono">Bs. {row.latest_price_bs.toFixed(2)}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-xs text-status-ok font-bold">${row.min_price_usd.toFixed(4)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-xs text-status-danger font-bold">${row.max_price_usd.toFixed(4)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <VariationBadge pct={row.variation_pct} />
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-text-2">
                            {format(new Date(row.last_purchase), "dd MMM yyyy", { locale: es })}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                            isExpanded ? "bg-brand/10 text-brand" : "text-text-3 group-hover:text-text-1"
                          )}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded history */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr key={`${row.key}-expanded`}>
                            <td colSpan={9} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 py-4 bg-surface-base/30 border-t border-border">
                                  <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-3">
                                    Historial completo — {row.product_name} con {row.supplier_name}
                                  </p>
                                  <div className="space-y-1.5">
                                    {[...row.history].reverse().map((h, idx) => {
                                      const prev = row.history[row.history.length - 2 - idx];
                                      let varPct: number | null = null;
                                      if (prev) {
                                        varPct = prev.unit_price_usd > 0
                                          ? ((h.unit_price_usd - prev.unit_price_usd) / prev.unit_price_usd) * 100
                                          : null;
                                      }
                                      return (
                                        <div
                                          key={h.id}
                                          className="flex items-center justify-between p-3 bg-surface-card border border-border rounded-xl text-xs"
                                        >
                                          <div className="flex items-center gap-3">
                                            <ArrowRight className="w-3.5 h-3.5 text-text-3 flex-shrink-0" />
                                            <span className="text-text-2">
                                              {format(new Date(h.purchased_at), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                                            </span>
                                            <span className="text-text-3">·</span>
                                            <span className="text-text-3">Cant: <span className="font-bold text-text-1">{h.quantity}</span></span>
                                            <span className="text-text-3">·</span>
                                            <span className="text-text-3">Tasa BCV: <span className="font-mono text-text-2">{h.bcv_rate.toFixed(2)}</span></span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <VariationBadge pct={varPct} />
                                            <span className="font-bold font-mono text-text-1">${h.unit_price_usd.toFixed(4)}</span>
                                            <span className="text-text-3 font-mono">Bs. {h.unit_price_bs.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
