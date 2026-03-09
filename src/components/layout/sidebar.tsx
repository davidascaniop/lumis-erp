"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
    LayoutDashboard,
    Users,
    Briefcase,
    ShoppingCart,
    FileText,
    Settings,
    Sparkles,
    LogOut,
    ChevronRight,
    Menu
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
    { icon: ShoppingCart, label: "Ventas", href: "/dashboard/ventas" },
    { icon: Briefcase, label: "Productos", href: "/dashboard/productos" },
    { icon: FileText, label: "Reportes", href: "/dashboard/reportes" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="sticky top-0 h-screen w-64 bg-[#0F0A12]/80 backdrop-blur-xl border-r border-[#E040FB]/10 hidden lg:flex flex-col z-40 transition-all duration-300">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-[#E040FB]/5 mb-4">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-heading font-bold text-xl tracking-tight bg-gradient-to-r from-[#E040FB] via-[#F8C0FF] to-[#7C4DFF] bg-clip-text text-transparent">
                        LUMIS
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group overflow-hidden",
                                    isActive
                                        ? "text-[#F5EEFF]"
                                        : "text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#E040FB]/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute inset-0 bg-[#E040FB]/10 border border-[#E040FB]/20 rounded-lg -z-10 shadow-glow"
                                    />
                                )}
                                <Icon
                                    className={cn(
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-[#E040FB]" : "text-[#6B5280] group-hover:text-[#7C4DFF]"
                                    )}
                                />
                                <span>{item.label}</span>
                                {isActive && (
                                    <ChevronRight className="w-4 h-4 ml-auto text-[#E040FB] opacity-70" />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[#E040FB]/5 space-y-2">
                <Link href="/dashboard/settings">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#B8A0D0] hover:text-[#F5EEFF] hover:bg-[#E040FB]/5 transition-all">
                        <Settings className="w-5 h-5 text-[#6B5280]" />
                        <span>Configuración</span>
                    </div>
                </Link>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF4757] hover:bg-[#FF4757]/10 transition-all cursor-pointer">
                    <LogOut className="w-5 h-5 opacity-80" />
                    <span>Cerrar Sesión</span>
                </div>
            </div>
        </aside>
    )
}
