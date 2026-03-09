"use client"

import { motion } from "framer-motion"
import {
    TrendingUp,
    Users,
    ShoppingBag,
    Wallet,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

const chartData = [
    { name: "Ene", total: 4000 },
    { name: "Feb", total: 3000 },
    { name: "Mar", total: 5000 },
    { name: "Abr", total: 4500 },
    { name: "May", total: 6000 },
    { name: "Jun", total: 8000 },
    { name: "Jul", total: 7500 },
]

const stats = [
    {
        title: "Ingresos Totales",
        value: "$45,231.89",
        change: "+20.1%",
        trend: "up",
        icon: Wallet,
        color: "#E040FB",
    },
    {
        title: "Cuentas por Cobrar",
        value: "$12,302.00",
        change: "-4.5%",
        trend: "down",
        icon: TrendingUp,
        color: "#7C4DFF",
    },
    {
        title: "Pedidos Activos",
        value: "145",
        change: "+12.2%",
        trend: "up",
        icon: ShoppingBag,
        color: "#F8C0FF",
    },
    {
        title: "Nuevos Clientes",
        value: "+34",
        change: "+8.4%",
        trend: "up",
        icon: Users,
        color: "#00D4AA",
    },
]

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-[#F5EEFF] tracking-tight">
                    Panel General
                </h1>
                <p className="text-[#B8A0D0] mt-1">
                    Resumen de la actividad y métricas clave de tu distribuidora.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-6 rounded-2xl relative overflow-hidden group hover:shadow-glow transition-all duration-300 border-[#E040FB]/10"
                        >
                            <div
                                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:opacity-20 transition-opacity"
                                style={{ backgroundImage: `linear-gradient(to bottom right, ${stat.color}, transparent)` }}
                            />
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-[#B8A0D0]">
                                    {stat.title}
                                </span>
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-10 backdrop-blur-sm"
                                    style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-3xl font-bold text-[#F5EEFF]">
                                    {stat.value}
                                </span>
                                <div className="flex items-center text-sm font-medium">
                                    {stat.trend === "up" ? (
                                        <span className="flex items-center text-[#00D4AA]">
                                            <ArrowUpRight className="w-4 h-4 mr-1" />
                                            {stat.change}
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-[#FF4757]">
                                            <ArrowDownRight className="w-4 h-4 mr-1" />
                                            {stat.change}
                                        </span>
                                    )}
                                    <span className="text-[#6B5280] ml-2 text-xs">vs mes anterior</span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Main Chart */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-6 rounded-2xl lg:col-span-2 border-[#E040FB]/10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-heading font-semibold text-[#F5EEFF]">
                                Evolución de Ingresos
                            </h2>
                            <p className="text-[#6B5280] text-sm">Ingresos brutos en los últimos 7 meses</p>
                        </div>
                        <select className="bg-[#1A1220]/80 border border-[#E040FB]/20 text-[#B8A0D0] text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#E040FB]/40">
                            <option>Este Año</option>
                            <option>Últimos 30 días</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E040FB" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6B5280" opacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8585A8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8585A8', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1A1220',
                                        border: '1px solid rgba(224,64,251,0.2)',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                        color: '#F5EEFF'
                                    }}
                                    itemStyle={{ color: '#E040FB', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#E040FB"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    activeDot={{ r: 6, fill: "#F8C0FF", stroke: "#E040FB", strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Real-time Activity */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-6 rounded-2xl border-[#E040FB]/10 flex flex-col"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-heading font-semibold text-[#F5EEFF]">
                            Actividad Reciente
                        </h2>
                        <div className="w-2 h-2 rounded-full bg-[#E040FB] animate-pulse shadow-glow" />
                    </div>

                    <div className="flex-1 space-y-4">
                        {[
                            { title: "Nuevo Pedido #1024", desc: "Cliente: Distribuidora Sol", amt: "+$1,200", time: "Hace 5 min" },
                            { title: "Pago Recibido", desc: "Factura #0988 cancelada", amt: "+$850", time: "Hace 12 min" },
                            { title: "Stock Crítico", desc: "Producto: Cable 12AWG (Quedan 5)", amt: "", time: "Hace 1 hora", alert: true },
                            { title: "Nuevo Pedido #1023", desc: "Cliente: Ferretería Central", amt: "+$4,300", time: "Hace 2 horas" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#E040FB]/5 transition-colors cursor-pointer border border-transparent hover:border-[#E040FB]/10">
                                <div className={`w-2 h-2 rounded-full mt-2 ${item.alert ? 'bg-[#FF4757]' : 'bg-[#7C4DFF]'}`} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <p className={`text-sm font-medium ${item.alert ? 'text-[#FF4757]' : 'text-[#F5EEFF]'}`}>
                                            {item.title}
                                        </p>
                                        <span className="text-xs text-[#6B5280]">{item.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-[#B8A0D0]">{item.desc}</p>
                                        {item.amt && <span className="text-xs font-bold text-[#00D4AA]">{item.amt}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-4 py-2 text-sm text-[#E040FB] hover:text-[#F8C0FF] font-medium transition-colors border-t border-[#E040FB]/10 pt-4">
                        Ver todas las actividades
                    </button>
                </motion.div>
            </div>

        </div>
    )
}
