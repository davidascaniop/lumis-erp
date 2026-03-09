"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Download,
    Filter,
    TrendingUp,
    CreditCard,
    Target,
    BarChart3,
    Calendar,
} from "lucide-react"
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"

import { Button } from "@/components/ui/button"

// --- Mock Data ---

const revenueData = [
    { name: "Lun", total: 1200 },
    { name: "Mar", total: 2100 },
    { name: "Mié", total: 800 },
    { name: "Jue", total: 1600 },
    { name: "Vie", total: 2800 },
    { name: "Sáb", total: 3400 },
    { name: "Dom", total: 1900 },
]

const categoryData = [
    { name: "Eléctricos", value: 45 },
    { name: "Plomería", value: 25 },
    { name: "Construcción", value: 20 },
    { name: "Pinturas", value: 10 },
]

const salesrepData = [
    { name: "Carlos R.", ventas: 45000 },
    { name: "Ana M.", ventas: 38000 },
    { name: "Pedro H.", ventas: 32000 },
    { name: "Laura P.", ventas: 28000 },
]

const COLORS = ["#E040FB", "#7C4DFF", "#00D4AA", "#FFB800"]

const summaryCards = [
    { title: "Ingresos Brutos", value: "$124,500.00", change: "+14.5%", icon: TrendingUp, color: "#E040FB" },
    { title: "Ticket Promedio", value: "$425.50", change: "+5.2%", icon: CreditCard, color: "#7C4DFF" },
    { title: "Meta de Ventas", value: "85%", change: "En camino", icon: Target, color: "#00D4AA" },
]

export default function ReportesPage() {
    const [dateRange, setDateRange] = useState("Esta Semana")

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#F5EEFF] tracking-tight">
                        Reportes y Analíticas
                    </h1>
                    <p className="text-[#B8A0D0] mt-1">
                        Visualiza el rendimiento financiero y operativo de tu empresa.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-[#E040FB]/15 text-[#B8A0D0] hover:bg-[#E040FB]/5 hover:text-[#F5EEFF] cursor-pointer">
                        <Calendar className="w-4 h-4 mr-2" />
                        {dateRange}
                    </Button>
                    <Button className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:from-[#E040FB]/90 hover:to-[#7C4DFF]/90 text-white shadow-glow cursor-pointer">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {summaryCards.map((card, i) => {
                    const Icon = card.icon
                    return (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-6 rounded-2xl relative overflow-hidden group hover:shadow-glow transition-all duration-300 border-[#E040FB]/10"
                        >
                            <div
                                className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-bl opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"
                                style={{ backgroundImage: `linear-gradient(to bottom left, ${card.color}, transparent)` }}
                            />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md"
                                    style={{ backgroundColor: `${card.color}15`, color: card.color }}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium text-[#00D4AA] bg-[#00D4AA]/10 px-2.5 py-1 rounded-full border border-[#00D4AA]/20">
                                    {card.change}
                                </span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-[#B8A0D0] mb-1">{card.title}</p>
                                <p className="text-3xl font-bold text-[#F5EEFF]">{card.value}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Revenue Area Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-6 rounded-2xl border-[#E040FB]/10 col-span-1 lg:col-span-2 hover:shadow-glow transition-shadow duration-300"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-heading font-semibold text-[#F5EEFF]">Ingresos Diarios</h2>
                            <p className="text-[#6B5280] text-sm">Rendimiento de ventas por día</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-[#E040FB]" />
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E040FB" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6B5280" opacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8585A8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8585A8', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1220', border: '1px solid rgba(224,64,251,0.2)', borderRadius: '12px', color: '#F5EEFF' }}
                                    itemStyle={{ color: '#E040FB', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#E040FB" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, fill: "#F8C0FF", stroke: "#E040FB", strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Sales by Category Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-6 rounded-2xl border-[#E040FB]/10 hover:shadow-glow transition-shadow duration-300"
                >
                    <div className="mb-6">
                        <h2 className="text-xl font-heading font-semibold text-[#F5EEFF]">Ventas por Categoría</h2>
                        <p className="text-[#6B5280] text-sm">Distribución del ingreso (%)</p>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1220', border: '1px solid rgba(224,64,251,0.2)', borderRadius: '8px', color: '#F5EEFF' }}
                                    itemStyle={{ color: '#F5EEFF', fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#B8A0D0' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Sales Reps Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-6 rounded-2xl border-[#E040FB]/10 hover:shadow-glow transition-shadow duration-300"
                >
                    <div className="mb-6">
                        <h2 className="text-xl font-heading font-semibold text-[#F5EEFF]">Top Vendedores</h2>
                        <p className="text-[#6B5280] text-sm">Mejores vendedores del periodo</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesrepData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#6B5280" opacity={0.2} />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#8585A8', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#F5EEFF', fontSize: 12 }} width={70} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(224,64,251,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1A1220', border: '1px solid rgba(124,77,255,0.2)', borderRadius: '8px', color: '#F5EEFF' }}
                                />
                                <Bar dataKey="ventas" fill="#7C4DFF" radius={[0, 4, 4, 0]} barSize={24}>
                                    {salesrepData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "#E040FB" : "#7C4DFF"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

        </div>
    )
}
