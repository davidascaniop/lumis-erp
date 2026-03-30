"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MovementHistoryTable } from "@/components/inventory/movement-history-table";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import { StockTransferForm } from "@/components/inventory/stock-transfer-form";
import { BulkStockForm } from "@/components/inventory/bulk-stock-form";
import {
  ClipboardList,
  ArrowUpDown,
  ArrowRightLeft,
  FileSpreadsheet,
  Package,
  AlertCircle,
  TrendingUp,
  Warehouse,
} from "lucide-react";

export default function InventarioPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalMovements: 0,
    entriesThisMonth: 0,
    exitsThisMonth: 0,
    transfersThisMonth: 0,
  });

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // ─── Stats de movimientos ──────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!user?.company_id) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalRes, entriesRes, exitsRes, transfersRes] = await Promise.all([
      supabase
        .from("stock_movements")
        .select("id", { count: "exact", head: true })
        .eq("company_id", user.company_id),
      supabase
        .from("stock_movements")
        .select("id", { count: "exact", head: true })
        .eq("company_id", user.company_id)
        .eq("type", "IN")
        .gte("created_at", startOfMonth.toISOString()),
      supabase
        .from("stock_movements")
        .select("id", { count: "exact", head: true })
        .eq("company_id", user.company_id)
        .eq("type", "OUT")
        .gte("created_at", startOfMonth.toISOString()),
      supabase
        .from("stock_movements")
        .select("id", { count: "exact", head: true })
        .eq("company_id", user.company_id)
        .eq("type", "TRANSFER")
        .gte("created_at", startOfMonth.toISOString()),
    ]);

    setStats({
      totalMovements: totalRes.count ?? 0,
      entriesThisMonth: entriesRes.count ?? 0,
      exitsThisMonth: exitsRes.count ?? 0,
      transfersThisMonth: transfersRes.count ?? 0,
    });
  }, [user?.company_id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  // ─── KPI Cards ──────────────────────────────────────────────────────────────

  const kpis = [
    {
      label: "Total Movimientos",
      value: stats.totalMovements,
      icon: ClipboardList,
      iconBg: "bg-brand/10",
      iconColor: "text-brand",
    },
    {
      label: "Entradas este Mes",
      value: stats.entriesThisMonth,
      icon: TrendingUp,
      iconBg: "bg-status-ok/10",
      iconColor: "text-status-ok",
    },
    {
      label: "Salidas este Mes",
      value: stats.exitsThisMonth,
      icon: AlertCircle,
      iconBg: "bg-status-danger/10",
      iconColor: "text-status-danger",
    },
    {
      label: "Transferencias este Mes",
      value: stats.transfersThisMonth,
      icon: ArrowRightLeft,
      iconBg: "bg-status-info/10",
      iconColor: "text-status-info",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-primary">Ajustes de Stock</h1>
        <p className="text-text-3 font-medium">
          Controla cada entrada, salida y transferencia de tu inventario.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="p-4 bg-surface-card border-border flex items-center gap-4 hover:border-brand/20 transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${kpi.iconBg} flex items-center justify-center ${kpi.iconColor}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-text-3 font-bold uppercase tracking-wider font-montserrat">
                {kpi.label}
              </p>
              <p className="text-2xl font-primary">{kpi.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* TABS PRINCIPALES */}
      <Tabs defaultValue="historial" className="w-full">
        <TabsList className="bg-surface-card border border-border rounded-xl p-1 h-auto gap-1 w-full sm:w-auto">
          <TabsTrigger
            value="historial"
            className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-montserrat transition-all gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger
            value="ajuste"
            className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-montserrat transition-all gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            Ajuste Manual
          </TabsTrigger>
          <TabsTrigger
            value="transferencia"
            className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-montserrat transition-all gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transferencia
          </TabsTrigger>
          <TabsTrigger
            value="masiva"
            className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-montserrat transition-all gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Carga Masiva
          </TabsTrigger>
        </TabsList>

        {/* Tab: Historial */}
        <TabsContent value="historial" className="mt-6">
          <MovementHistoryTable refreshKey={refreshKey} />
        </TabsContent>

        {/* Tab: Ajuste Manual */}
        <TabsContent value="ajuste" className="mt-6">
          <div className="max-w-xl mx-auto">
            <Card className="p-8 bg-surface-card border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                  <ArrowUpDown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-1 font-montserrat">
                    Ajuste Manual
                  </h2>
                  <p className="text-xs text-text-3">
                    Suma o resta unidades a un producto con motivo obligatorio.
                  </p>
                </div>
              </div>
              <StockAdjustmentForm onSuccess={triggerRefresh} />
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Transferencia */}
        <TabsContent value="transferencia" className="mt-6">
          <div className="max-w-xl mx-auto">
            <Card className="p-8 bg-surface-card border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center text-status-info">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-1 font-montserrat">
                    Transferencia entre Depósitos
                  </h2>
                  <p className="text-xs text-text-3">
                    Mueve mercancía de un almacén a otro sin afectar el stock global.
                  </p>
                </div>
              </div>
              <StockTransferForm onSuccess={triggerRefresh} />
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Carga Masiva */}
        <TabsContent value="masiva" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 bg-surface-card border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-1 font-montserrat">
                    Carga Masiva de Stock
                  </h2>
                  <p className="text-xs text-text-3">
                    Actualiza el stock de cientos de productos con un solo CSV.
                  </p>
                </div>
              </div>
              <BulkStockForm onSuccess={triggerRefresh} />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
