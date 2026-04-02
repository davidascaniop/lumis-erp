"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Building2, Phone, Mail, MapPin, User,
  Package, DollarSign, Search, ArrowUpDown,
  Loader2, TrendingUp, TrendingDown, Minus, Calendar,
  ClipboardList, Hash,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier {
  id: string;
  company_id: string;
  name: string;
  rif: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
  is_active: boolean;
}

interface PriceHistoryItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  last_qty: number;
  last_price_usd: number;
  last_price_bs: number;
  prev_price_usd: number | null;
  variation_pct: number | null;
  last_purchase: string;
}

type SortField = "product" | "date" | "price";
type SortDir = "asc" | "desc";

// ─── Variation Badge ──────────────────────────────────────────────────────────
function VariationBadge({ pct }: { pct: number | null }) {
  if (pct === null)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
        <Minus className="w-3 h-3" /> Primera compra
      </span>
    );
  if (Math.abs(pct) < 0.01)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-base text-text-3 border border-border">
        <Minus className="w-3 h-3" /> Sin cambio
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
        up
          ? "bg-status-danger/10 text-status-danger border-status-danger/20"
          : "bg-status-ok/10 text-status-ok border-status-ok/20"
      )}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Supplier info
      const { data: sup, error: supErr } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();
      if (supErr) throw supErr;
      setSupplier(sup as Supplier);

      // 2. Orders summary
      const { data: orders } = await supabase
        .from("purchases")
        .select("id, total_usd")
        .eq("supplier_id", id);
      setTotalOrders(orders?.length ?? 0);
      setTotalSpent((orders ?? []).reduce((s: number, o: any) => s + (o.total_usd ?? 0), 0));

      // 3. Price history per product
      const { data: phData } = await supabase
        .from("purchase_price_history")
        .select("product_id, unit_price_usd, unit_price_bs, quantity, purchased_at, products(name, sku)")
        .eq("supplier_id", id)
        .order("purchased_at", { ascending: true });

      // Group by product
      const productMap = new Map<
        string,
        { name: string; sku: string; records: { price_usd: number; price_bs: number; qty: number; date: string }[] }
      >();
      ((phData as any[]) || []).forEach((r) => {
        if (!productMap.has(r.product_id)) {
          productMap.set(r.product_id, {
            name: r.products?.name ?? "–",
            sku: r.products?.sku ?? "–",
            records: [],
          });
        }
        productMap.get(r.product_id)!.records.push({
          price_usd: r.unit_price_usd,
          price_bs: r.unit_price_bs,
          qty: r.quantity,
          date: r.purchased_at,
        });
      });

      const items: PriceHistoryItem[] = [];
      productMap.forEach((val, product_id) => {
        const sorted = [...val.records].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const last = sorted[sorted.length - 1];
        const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
        const variation =
          prev && prev.price_usd > 0
            ? ((last.price_usd - prev.price_usd) / prev.price_usd) * 100
            : null;

        items.push({
          product_id,
          product_name: val.name,
          product_sku: val.sku,
          last_qty: last.qty,
          last_price_usd: last.price_usd,
          last_price_bs: last.price_bs,
          prev_price_usd: prev?.price_usd ?? null,
          variation_pct: variation,
          last_purchase: last.date,
        });
      });

      setPriceHistory(items);
    } catch (err: any) {
      toast.error("Error al cargar ficha de proveedor", { description: err.message });
      router.push("/dashboard/compras/proveedores");
    } finally {
      setLoading(false);
    }
  }, [id, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Sort & Filter ─────────────────────────────────────────────────────────
  const filteredHistory = priceHistory
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.product_name.toLowerCase().includes(q) ||
        item.product_sku.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "product") cmp = a.product_name.localeCompare(b.product_name);
      else if (sortField === "date")
        cmp = new Date(a.last_purchase).getTime() - new Date(b.last_purchase).getTime();
      else if (sortField === "price") cmp = a.last_price_usd - b.last_price_usd;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={cn(
        "w-3 h-3 ml-1 inline transition-colors",
        sortField === field ? "text-brand" : "text-text-3"
      )}
    />
  );

  if (loading)
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );

  if (!supplier) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-surface-card border border-border text-text-3 hover:text-text-1 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-montserrat font-bold text-text-1">
                {supplier.name}
              </h1>
              <p className="text-xs text-text-3 font-mono">{supplier.rif}</p>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-[11px] font-bold border",
            supplier.is_active
              ? "bg-status-ok/10 text-status-ok border-status-ok/20"
              : "bg-text-3/10 text-text-3 border-border"
          )}
        >
          {supplier.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: User, label: "Contacto", value: supplier.contact_name ?? "–" },
          { icon: Phone, label: "Teléfono", value: supplier.phone ?? "–" },
          { icon: Mail, label: "Email", value: supplier.email ?? "–" },
          { icon: MapPin, label: "Dirección", value: supplier.address ?? "–" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-3.5 bg-surface-card border-border space-y-1.5">
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-brand" />
              {label}
            </p>
            <p className="text-xs text-text-2 truncate" title={value}>
              {value}
            </p>
          </Card>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-brand/10 to-surface-card border-brand/20">
          <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ClipboardList className="w-3 h-3 text-brand" />
            Total Órdenes
          </p>
          <p className="text-3xl font-montserrat font-bold text-brand">{totalOrders}</p>
        </Card>
        <Card className="p-5 bg-surface-card border-border">
          <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-status-ok" />
            Comprado Total
          </p>
          <p className="text-3xl font-montserrat font-bold text-status-ok">
            ${totalSpent.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-5 bg-surface-card border-border">
          <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Package className="w-3 h-3 text-[#7C4DFF]" />
            Productos Distintos
          </p>
          <p className="text-3xl font-montserrat font-bold text-[#7C4DFF]">
            {priceHistory.length}
          </p>
        </Card>
      </div>

      {/* Price History Section */}
      <Card className="overflow-hidden bg-surface-card border-border">
        <div className="p-4 bg-surface-base/40 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-montserrat font-bold text-text-1 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" />
              Historial de Precios por Producto
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
              <Input
                placeholder="Buscar producto o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-surface-base border-border h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-text-3">
            <Package className="w-12 h-12 opacity-20" />
            <p className="text-sm">
              {priceHistory.length === 0
                ? "Aún no hay historial de precios con este proveedor"
                : "Sin resultados para la búsqueda"}
            </p>
            <p className="text-xs opacity-60">
              Los datos se generan automáticamente al emitir Órdenes de Compra
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
                <tr>
                  <th
                    className="px-5 py-3 cursor-pointer hover:text-text-1 transition-colors"
                    onClick={() => handleSort("product")}
                  >
                    Producto <SortIcon field="product" />
                  </th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-right">Últ. Cant.</th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer hover:text-text-1 transition-colors"
                    onClick={() => handleSort("price")}
                  >
                    Precio USD <SortIcon field="price" />
                  </th>
                  <th className="px-5 py-3 text-right">Precio Bs.</th>
                  <th className="px-5 py-3 text-center">Variación</th>
                  <th
                    className="px-5 py-3 cursor-pointer hover:text-text-1 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    Última Compra <SortIcon field="date" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistory.map((item) => (
                  <motion.tr
                    key={item.product_id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-surface-hover/20 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-text-1">{item.product_name}</p>
                      {item.prev_price_usd !== null && (
                        <p className="text-[10px] text-text-3 mt-0.5">
                          Anterior: <span className="font-mono">${item.prev_price_usd.toFixed(4)}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-surface-base px-2 py-0.5 rounded-md text-text-3">
                        {item.product_sku}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-text-1 font-mono">
                      {item.last_qty}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold font-mono text-text-1">
                        ${item.last_price_usd.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-mono text-xs text-text-2">
                        Bs. {item.last_price_bs.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <VariationBadge pct={item.variation_pct} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-text-2">
                        {format(new Date(item.last_purchase), "dd MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-[10px] text-text-3 mt-0.5">
                        {formatDistanceToNow(new Date(item.last_purchase), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
