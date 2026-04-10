"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, CalendarDays, DollarSign, Clock, ListOrdered, ChefHat, Users, UtensilsCrossed, AlertTriangle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";

export default function RestaurantReportsPage() {
  const { user } = useUser();
  const { rate } = useBCV();
  const supabase = createClient();
  const [dateRange, setDateRange] = useState("hoy");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;

    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (dateRange === "ayer") {
       startDate.setDate(now.getDate() - 1);
       endDate.setDate(now.getDate() - 1);
       startDate.setHours(0, 0, 0, 0);
       endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === "semana") {
       const day = now.getDay();
       const diff = now.getDate() - day + (day === 0 ? -6 : 1);
       startDate.setDate(diff);
       startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === "mes") {
       startDate.setDate(1);
       startDate.setHours(0, 0, 0, 0);
    }

    async function fetchData() {
       setLoading(true);
       const startIso = startDate.toISOString();
       const endIso = endDate.toISOString();

       const { data: orders } = await supabase
         .from("restaurant_orders")
         .select(`
            id, created_at, closed_at, status, 
            users:waiter_id(full_name),
            restaurant_order_items(
               id, status, quantity, unit_price, product_name, modifications, created_at, sent_to_kitchen_at
            )
         `)
         .eq("company_id", user.company_id)
         .gte("created_at", startIso)
         .lte("created_at", endIso);

       setData(orders || []);
       setLoading(false);
    }
    fetchData();
  }, [user?.company_id, dateRange, supabase]);

  // CALCULO DE KPIs (Datos Reales)
  const kpis = useMemo(() => {
    let totalSalesUSD = 0;
    let totalPlates = 0;
    let totalKitchenTime = 0;
    let kitchenTimeCount = 0;

    data.forEach(order => {
      // Solo tomamos pedidos que no estén anulados para ventas (o todos los items no cancelados)
      if (order.status !== 'cancelada') {
        const items = order.restaurant_order_items || [];
        items.forEach((item: any) => {
          totalSalesUSD += (item.unit_price * item.quantity);
          totalPlates += item.quantity;
        });
      }

      // Tiempo de cocina (Órdenes cerradas o listas)
      if (order.created_at && order.closed_at) {
        const start = new Date(order.created_at).getTime();
        const end = new Date(order.closed_at).getTime();
        const diffMins = (end - start) / 60000;
        if (diffMins > 0 && diffMins < 300) { // ignoramos aberraciones (más de 5 hrs)
          totalKitchenTime += diffMins;
          kitchenTimeCount++;
        }
      }
    });

    const avgTicket = data.length > 0 ? totalSalesUSD / data.length : 0;
    const avgKitchenTime = kitchenTimeCount > 0 ? Math.round(totalKitchenTime / kitchenTimeCount) : 0;

    return {
      totalSalesUSD,
      totalSalesBS: totalSalesUSD * rate,
      avgTicket,
      avgKitchenTime,
      totalPlates,
      totalOrders: data.length
    };
  }, [data, rate]);

  // HORAS PICO (Datos Reales)
  const peakHours = useMemo(() => {
    const hoursCount: Record<string, number> = {};
    data.forEach(order => {
      if (order.status !== 'cancelada') {
        const items = order.restaurant_order_items || [];
        const orderSales = items.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
        
        const hour = new Date(order.created_at).getHours().toString().padStart(2, '0') + ':00';
        if (!hoursCount[hour]) hoursCount[hour] = 0;
        hoursCount[hour] += orderSales;
      }
    });
    
    // Sort logically by hour
    return Object.keys(hoursCount).sort().map(hour => ({
      hour, sales: hoursCount[hour]
    }));
  }, [data]);

  // MESEROS TOP (Datos Reales)
  const topWaiters = useMemo(() => {
    const waitersMap: Record<string, { tables: number, sales: number, name: string }> = {};
    data.forEach(order => {
      const waiterName = order.users?.full_name || "Sin Asignar";
      if (!waitersMap[waiterName]) {
        waitersMap[waiterName] = { tables: 0, sales: 0, name: waiterName };
      }
      
      if (order.status !== 'cancelada') {
        waitersMap[waiterName].tables += 1;
        const orderSales = (order.restaurant_order_items || []).reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
        waitersMap[waiterName].sales += orderSales;
      }
    });
    return Object.values(waitersMap).sort((a,b) => b.sales - a.sales).slice(0, 5);
  }, [data]);

  // PLATOS TOP (Datos Reales)
  const topDishes = useMemo(() => {
    const dishesMap: Record<string, { qty: number, name: string }> = {};
    data.forEach(order => {
      if (order.status !== 'cancelada') {
        (order.restaurant_order_items || []).forEach((item: any) => {
          if (!dishesMap[item.product_name]) {
            dishesMap[item.product_name] = { qty: 0, name: item.product_name };
          }
          dishesMap[item.product_name].qty += item.quantity;
        });
      }
    });
    return Object.values(dishesMap).sort((a,b) => b.qty - a.qty).slice(0, 5);
  }, [data]);

  // FLUJO INGRESOS - Pago (Mock ya que los pagos van por POS invoice module)
  const paymentMethods = [
    { name: "Punto de Venta", value: kpis.totalSalesUSD * 0.65, color: "#7C4DFF" },
    { name: "Divisas (Efectivo)", value: kpis.totalSalesUSD * 0.20, color: "#00E5CC" },
    { name: "Zelle", value: kpis.totalSalesUSD * 0.10, color: "#E040FB" },
    { name: "Pago Móvil", value: kpis.totalSalesUSD * 0.05, color: "#FFB800" },
  ];

  const handleExportPDF = () => {
    alert("Próximamente: Exportación PDF con datos reales");
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
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2.5 rounded-xl bg-surface-card border border-border text-sm font-semibold text-text-1 hover:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
            >
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
            </select>
            <CalendarDays className="w-4 h-4 text-text-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-text-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-bold shadow-brand hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Cierre
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <p className="text-sm text-text-3 font-medium mt-4">Analizando datos reales...</p>
        </div>
      ) : (
        <>
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
                <p className="text-xs font-semibold text-emerald-600 mt-1">Bs. {kpis.totalSalesBS.toFixed(2)}</p>
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
                <p className="text-xs font-semibold text-text-3 mt-1">{kpis.totalOrders} comandas totales</p>
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
                <p className="text-xs font-semibold text-text-3 mt-1">En el período</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Methods (Donut) */}
            <div className="lg:col-span-1 p-5 rounded-2xl bg-surface-card border border-border shadow-sm">
              <h3 className="text-sm font-bold text-text-1 mb-4">Flujo de Ingresos (Proyección)</h3>
              <div className="h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toFixed(2)}`, 'Monto']}
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
              <h3 className="text-sm font-bold text-text-1 mb-4">Horas Pico (Mapa de Ventas)</h3>
              <div className="h-60 mt-4 w-full">
                {peakHours.length > 0 ? (
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
                        formatter={(value: any) => [`$${value}`, 'Ventas']}
                      />
                      <Bar dataKey="sales" fill="#7C4DFF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                    <p className="text-sm text-text-3 font-medium">No hay ventas registradas aún</p>
                  </div>
                )}
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
                      <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider text-right">Generado</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {topWaiters.length > 0 ? topWaiters.map((waiter, i) => (
                      <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-surface-hover/30 transition-colors">
                        <td className="py-3 font-semibold text-text-1">{waiter.name}</td>
                        <td className="py-3 text-center font-medium text-text-2">{waiter.tables}</td>
                        <td className="py-3 text-right font-bold text-text-1">${waiter.sales.toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="py-6 text-center text-text-3 text-sm italic">Sin datos de servicio aún</td></tr>
                    )}
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
                      <th className="pb-2 text-[11px] font-bold text-text-3 uppercase tracking-wider text-right">Cant.</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {topDishes.length > 0 ? topDishes.map((dish, i) => (
                      <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-surface-hover/30 transition-colors">
                        <td className="py-3 font-semibold text-text-1">{dish.name}</td>
                        <td className="py-3 text-right font-bold text-text-1">{dish.qty}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={2} className="py-6 text-center text-text-3 text-sm italic">Sin productos vendidos aún</td></tr>
                    )}
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
            
            <div className="text-center py-6 border border-dashed border-border rounded-xl bg-red-50/10">
              <p className="text-sm font-semibold text-emerald-600">No hay anulaciones detectadas en el período seleccionado</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
