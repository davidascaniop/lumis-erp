"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  PackageSearch,
  X,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AjustesStockPage() {
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);

  // Mock data
  const adjustments = [
    {
      id: "1",
      productName: "Laptop Dell XPS 13",
      sku: "DELL-XPS-13",
      type: "Entrada",
      qty: 10,
      oldStock: 15,
      newStock: 25,
      reason: "Compra a proveedor",
      user: "Admin",
      date: "2026-03-30T10:00:00Z"
    },
    {
      id: "2",
      productName: "Mouse Logitech MX Master 3",
      sku: "LOG-MX3",
      type: "Salida",
      qty: 2,
      oldStock: 50,
      newStock: 48,
      reason: "Producto dañado",
      user: "Admin",
      date: "2026-03-29T14:30:00Z"
    },
    {
      id: "3",
      productName: "Teclado Mecánico Keychron",
      sku: "KEYC-K2",
      type: "Corrección",
      qty: 5,
      oldStock: 20,
      newStock: 25,
      reason: "Conteo físico",
      user: "Admin",
      date: "2026-03-28T09:15:00Z"
    }
  ];

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.productName.toLowerCase().includes(search.toLowerCase()) ||
      a.sku.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: adjustments.length,
    entradas: adjustments.filter((a) => a.type === "Entrada").reduce((acc, a) => acc + a.qty, 0),
    salidas: adjustments.filter((a) => a.type === "Salida").reduce((acc, a) => acc + a.qty, 0),
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Entrada":
        return <ArrowUpRight className="w-4 h-4" />;
      case "Salida":
        return <ArrowDownRight className="w-4 h-4" />;
      default:
        return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "Entrada":
        return "bg-status-ok/10 text-status-ok border-status-ok/20";
      case "Salida":
        return "bg-status-danger/10 text-status-danger border-status-danger/20";
      default:
        return "bg-brand/10 text-brand border-brand/20";
    }
  };

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
              Total Ajustes del Mes
            </p>
            <p className="text-2xl font-primary text-black dark:text-white">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4 hover:border-status-ok/30 transition-colors cursor-default">
          <div className="w-12 h-12 rounded-xl bg-status-ok/10 flex items-center justify-center text-status-ok">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Unidades Ingresadas
            </p>
            <p className="text-2xl font-primary text-black dark:text-white">{stats.entradas}</p>
          </div>
        </Card>
        <Card className="p-4 bg-surface-card border-border flex items-center gap-4 hover:border-status-danger/30 transition-colors cursor-default">
          <div className="w-12 h-12 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-3 font-bold uppercase tracking-wider">
              Unidades Retiradas
            </p>
            <p className="text-2xl font-primary text-black dark:text-white">{stats.salidas}</p>
          </div>
        </Card>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-3" />
          <Input
            placeholder="Buscar por producto o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-surface-card border-border h-12 rounded-xl focus:ring-brand/30 text-black dark:text-white"
          />
        </div>
        <button className="p-3 bg-surface-card border border-border rounded-xl text-text-3 hover:text-black dark:hover:text-white transition-all">
          <Filter className="w-6 h-6" />
        </button>
      </div>

      {/* TABLE */}
      <Card className="bg-surface-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-3 uppercase bg-surface-base border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Producto</th>
                <th className="px-6 py-4 font-bold tracking-wider">Tipo</th>
                <th className="px-6 py-4 font-bold tracking-wider">Cantidad</th>
                <th className="px-6 py-4 font-bold tracking-wider">Stock Anterior → Nuevo</th>
                <th className="px-6 py-4 font-bold tracking-wider">Motivo</th>
                <th className="px-6 py-4 font-bold tracking-wider">Usuario</th>
                <th className="px-6 py-4 font-bold tracking-wider">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-3">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 opacity-20" />
                      <p>No se encontraron ajustes de stock.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adjustment) => (
                  <tr
                    key={adjustment.id}
                    className="border-b border-border/50 hover:bg-surface-base/50 transition-colors"
                  >
                    <td className="px-6 py-4 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-base flex items-center justify-center border border-border group-hover:border-brand/40 transition-colors shrink-0">
                          <PackageSearch className="w-5 h-5 text-brand opacity-80" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-black dark:text-white truncate">
                            {adjustment.productName}
                          </p>
                          <p className="text-xs text-text-3 font-mono mt-0.5">
                            {adjustment.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border \${getTypeStyle(
                          adjustment.type
                        )}\`}
                      >
                        {getTypeIcon(adjustment.type)}
                        {adjustment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base font-primary font-bold text-black dark:text-white">
                        {adjustment.type === "Entrada" ? "+" : (adjustment.type === "Salida" ? "-" : "")}{adjustment.qty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-text-3 line-through opacity-70">{adjustment.oldStock}</span>
                        <ArrowRightLeft className="w-4 h-4 text-text-3/50" />
                        <span className="font-bold text-brand">
                          {adjustment.newStock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-3 font-medium">
                        {adjustment.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-base rounded-md text-xs font-bold text-text-3 border border-border shadow-sm">
                        {adjustment.user}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-3 text-xs font-mono">
                      {new Date(adjustment.date).toLocaleString('es-ES', { 
                        year: 'numeric', month: 'short', day: '2-digit', 
                        hour: '2-digit', minute:'2-digit' 
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
                  <p className="text-xs text-text-3 mt-1">Registra una modificación manual de existencias.</p>
                </div>
                <button 
                  onClick={() => setOpenAdd(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-text-3 hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                    Producto <span className="text-status-danger">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
                    <Input 
                      placeholder="Buscar por nombre o SKU..." 
                      className="pl-9 bg-surface-base border-border focus:ring-brand/30 text-black dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                      Tipo <span className="text-status-danger">*</span>
                    </label>
                    <select className="flex h-11 w-full rounded-xl border border-border bg-surface-base px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 text-black dark:text-white appearance-none cursor-pointer">
                      <option value="Entrada">Entrada (+)</option>
                      <option value="Salida">Salida (-)</option>
                      <option value="Corrección">Corrección (=)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                      Cantidad <span className="text-status-danger">*</span>
                    </label>
                    <Input 
                      type="number" 
                      placeholder="Ej. 10" 
                      className="bg-surface-base border-border focus:ring-brand/30 h-11 text-black dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                    Motivo <span className="text-status-danger">*</span>
                  </label>
                  <select className="flex h-11 w-full rounded-xl border border-border bg-surface-base px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 text-black dark:text-white appearance-none cursor-pointer">
                    <option value="">Seleccionar motivo...</option>
                    <option value="merma">Merma</option>
                    <option value="dano">Daño</option>
                    <option value="conteo">Conteo físico</option>
                    <option value="devolucion">Devolución interna</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                    Notas (Opcional)
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Detalles adicionales sobre este ajuste..."
                    className="flex w-full rounded-xl border border-border bg-surface-base px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 text-black dark:text-white resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-surface-card border-t border-border flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setOpenAdd(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-text-3 hover:bg-black/5 dark:hover:bg-white/5 shadow-sm transition-colors border border-border"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setOpenAdd(false)}
                  className="px-6 py-2.5 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 transition-all flex items-center gap-2 active:scale-95"
                >
                  Guardar Ajuste
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
