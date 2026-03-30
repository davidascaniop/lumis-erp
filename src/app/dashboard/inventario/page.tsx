"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { MovementHistoryTable } from "@/components/inventory/movement-history-table";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import {
  Plus,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";

export default function InventarioPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [refreshKey, setRefreshKey] = useState(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [stats, setStats] = useState({
    totalMovements: 0,
    entriesThisMonth: 0,
    exitsThisMonth: 0,
  });

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // ─── Stats de movimientos ──────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!user?.company_id) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalRes, entriesRes, exitsRes] = await Promise.all([
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
    ]);

    setStats({
      totalMovements: totalRes.count ?? 0,
      entriesThisMonth: entriesRes.count ?? 0,
      exitsThisMonth: exitsRes.count ?? 0,
    });
  }, [user?.company_id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary text-black dark:text-white">Ajustes de Stock</h1>
          <p className="text-text-3 font-medium">
            Registra entradas, salidas y correcciones de inventario
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setOpenAdd(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nuevo Ajuste
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4 hover:border-brand/30 transition-colors cursor-default">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Total Movimientos
            </p>
            <p className="text-2xl font-primary text-black dark:text-white">{stats.totalMovements}</p>
          </div>
        </Card>
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4 hover:border-status-ok/30 transition-colors cursor-default">
          <div className="w-12 h-12 rounded-xl bg-status-ok/10 flex items-center justify-center text-status-ok">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Entradas del Mes
            </p>
            <p className="text-2xl font-primary text-black dark:text-white">{stats.entriesThisMonth}</p>
          </div>
        </Card>
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4 hover:border-status-danger/30 transition-colors cursor-default">
          <div className="w-12 h-12 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Salidas del Mes
            </p>
            <p className="text-2xl font-primary text-black dark:text-white">{stats.exitsThisMonth}</p>
          </div>
        </Card>
      </div>

      {/* TABLE */}
      <div className="mt-8">
        <MovementHistoryTable refreshKey={refreshKey} />
      </div>

      {/* Modal / Drawer para Nuevo Ajuste */}
      <AnimatePresence>
        {openAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenAdd(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-surface-base/30">
                <div>
                  <h2 className="text-xl font-primary text-black dark:text-white">
                    Nuevo Ajuste
                  </h2>
                  <p className="text-xs text-text-3 mt-1">Suma o resta unidades a un producto con motivo obligatorio.</p>
                </div>
                <button 
                  onClick={() => setOpenAdd(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-text-3 hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                <StockAdjustmentForm 
                  onSuccess={() => {
                    setOpenAdd(false);
                    triggerRefresh();
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
