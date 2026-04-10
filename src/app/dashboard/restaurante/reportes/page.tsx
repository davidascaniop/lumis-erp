"use client";

import { useState } from "react";
import { Download, CalendarDays, DollarSign, Clock, ListOrdered, ChefHat, Users, UtensilsCrossed, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock Data
const kpis = {
  totalSalesUSD: 1450.25,
  totalSalesBS: 87015.00,
  avgTicket: 34.50,
  avgKitchenTime: 18,
  totalPlates: 156,
};

const paymentMethods = [
  { name: "Punto de Venta", value: 65, color: "#7C4DFF" },
  { name: "Divisas (Efectivo)", value: 20, color: "#00E5CC" },
  { name: "Zelle", value: 10, color: "#E040FB" },
  { name: "Pago Móvil", value: 5, color: "#FFB800" },
];

const peakHours = [
  { hour: "12:00", sales: 200 },
  { hour: "13:00", sales: 450 },
  { hour: "14:00", sales: 800 },
  { hour: "15:00", sales: 500 },
  { hour: "19:00", sales: 650 },
  { hour: "20:00", sales: 1200 },
  { hour: "21:00", sales: 900 },
  { hour: "22:00", sales: 300 },
];

const topWaiters = [
  { id: 1, name: "Yessica Tovar", tables: 15, sales: 450, avgTime: "45m" },
  { id: 2, name: "Carlos Sanchez", tables: 12, sales: 320, avgTime: "52m" },
  { id: 3, name: "Daniel Perez", tables: 10, sales: 280, avgTime: "48m" },
];

const topDishes = [
  { id: 1, name: "Pizza Margarita", category: "Pizzas", qty: 45 },
  { id: 2, name: "Hamburguesa Clásica", category: "Principales", qty: 38 },
  { id: 3, name: "Tequaños (12uds)", category: "Entradas", qty: 30 },
  { id: 4, name: "Mojito Tradicional", category: "Bebidas", qty: 25 },
];

const voidedItems = [
  { id: 1, time: "14:23", item: "Pasta Carbonara", reason: "Cliente cambió de opinión", user: "Yessica Tovar" },
  { id: 2, time: "15:01", item: "Ensalada César", reason: "Largo tiempo de espera", user: "Carlos Sanchez" },
];

export default function RestaurantReportsPage() {
  const [dateRange, setDateRange] = useState("Hoy");

  const handleExportPDF = () => {
    alert("Generando PDF de Cierre de Caja...");
    // Future PDF implementation
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-1 font-montserrat tracking-tight">Reportes Operativos</h1>
          <p className="text-sm text-text-3 mt-1">Análisis de rendimiento y operación del restaurante</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card border border-border text-sm font-semibold text-text-2 hover:bg-surface-hover hover:text-text-1 transition-all">
            <CalendarDays className="w-4 h-4" />
            {dateRange}
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-bold shadow-brand hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Cierre
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Ventas Totales</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-text-1 font-montserrat">${kpis.totalSalesUSD.toFixed(2)}</h3>
            <p className="text-xs font-semibold text-text-3 mt-1">Bs. {kpis.totalSalesBS.toFixed(2)}</p>
          </div>
        </div>

        {/* Avg Ticket */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Ticket Promedio</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
              <ListOrdered className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-text-1 font-montserrat">${kpis.avgTicket.toFixed(2)}</h3>
            <p className="text-xs font-semibold text-text-3 mt-1">Por mesa</p>
          </div>
        </div>

        {/* Avg Kitchen Time */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Tiempo Cocina</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-50 border border-orange-100">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-1">
              <h3 className="text-2xl font-black text-text-1 font-montserrat">{kpis.avgKitchenTime}</h3>
              <span className="text-sm font-semibold text-text-2 mb-1">min</span>
            </div>
            <p className="text-xs font-semibold text-text-3 mt-1">Promedio de entrega</p>
          </div>
        </div>

        {/* Total Plates */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Platos Servidos</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-100">
              <ChefHat className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-text-1 font-montserrat">{kpis.totalPlates}</h3>
            <p className="text-xs font-semibold text-text-3 mt-1">En el día de hoy</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods (Donut) */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-surface-card border border-border shadow-sm">
          <h3 className="text-sm font-bold text-text-1 mb-4">Flujo de Ingresos</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {paymentMethods.map((pm, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pm.color }} />
                <span className="text-xs font-medium text-text-2 truncate">{pm.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours (BarChart) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-surface-card border border-border shadow-sm">
          <h3 className="text-sm font-bold text-text-1 mb-4">Horas Pico (Carga de Trabajo)</h3>
          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748B' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748B' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value}`, 'Ventas']}
                />
                <Bar dataKey="sales" fill="#7C4DFF" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Waiters */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-text-1">Rendimiento del Personal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider">Mesero</th>
                  <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider text-center">Mesas</th>
                  <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider text-center">T. Promedio</th>
                  <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider text-right">Generado</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {topWaiters.map((waiter) => (
                  <tr key={waiter.id} className="border-b border-border/20 last:border-0 hover:bg-surface-hover/30 transition-colors">
                    <td className="py-3 font-semibold text-text-1">{waiter.name}</td>
                    <td className="py-3 text-center font-medium text-text-2">{waiter.tables}</td>
                    <td className="py-3 text-center text-text-3">{waiter.avgTime}</td>
                    <td className="py-3 text-right font-bold text-text-1">${waiter.sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Dishes */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-text-1">Ingeniería del Menú (Top)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider">Plato</th>
                  <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider">Categoría</th>
                  <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider text-right">Cant.</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {topDishes.map((dish) => (
                  <tr key={dish.id} className="border-b border-border/20 last:border-0 hover:bg-surface-hover/30 transition-colors">
                    <td className="py-3 font-semibold text-text-1">{dish.name}</td>
                    <td className="py-3 text-text-3">
                      <span className="px-2 py-0.5 rounded-md bg-surface-base border border-border/50 text-xs">
                        {dish.category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-text-1">{dish.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Control de Fugas / Anulaciones */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-1">Control de Fugas y Anulaciones</h3>
            <p className="text-xs text-text-3 mt-0.5">Platos cancelados posterior a su envío a cocina</p>
          </div>
        </div>
        
        {voidedItems.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-red-100">
            <table className="w-full text-left border-collapse bg-red-50/10">
              <thead>
                <tr className="border-b border-red-100 bg-red-50/50">
                  <th className="py-2.5 px-4 text-[11px] font-bold text-red-700 uppercase tracking-wider">Hora</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-red-700 uppercase tracking-wider">Mesa / Item</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-red-700 uppercase tracking-wider">Motivo</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-red-700 uppercase tracking-wider">Responsable</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {voidedItems.map((voided) => (
                  <tr key={voided.id} className="border-b border-red-100/50 last:border-0 hover:bg-red-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-red-900/70">{voided.time}</td>
                    <td className="py-3 px-4 font-bold text-red-900">{voided.item}</td>
                    <td className="py-3 px-4 text-red-800/80 italic text-xs">{voided.reason}</td>
                    <td className="py-3 px-4 font-medium text-text-2">{voided.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-border rounded-xl">
            <p className="text-sm font-semibold text-emerald-600">No hay anulaciones en el período seleccionado</p>
          </div>
        )}
      </div>

    </div>
  );
}
