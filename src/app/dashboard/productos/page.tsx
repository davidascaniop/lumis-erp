"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search, Plus, Package, Eye, Pencil, Filter, AlertTriangle, Boxes, DollarSign, ArrowUpDown, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

function stockStatus(stock: number, min: number) {
    if (stock === 0) return { label: "Agotado", variant: "danger" as const }
    if (stock <= min) return { label: "Bajo", variant: "warning" as const }
    return { label: "Óptimo", variant: "success" as const }
}

export default function ProductosPage() {
    const supabase = createClient()
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: "", sku: "", category: "", price_usd: "", cost_usd: "", stock_qty: "0", min_stock: "5", unit: "Unidad"
    })
    const [isSaving, setIsSaving] = useState(false)

    const fetchProducts = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userData } = await supabase.from("users").select("company_id").eq("auth_id", user.id).single()
        if (!userData) return

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("company_id", userData.company_id)
            .order("created_at", { ascending: false })

        if (error) {
            toast.error("Error al cargar productos", { description: error.message })
        } else {
            setProducts(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleSave = async () => {
        if (!formData.name || !formData.sku || !formData.price_usd) {
            toast.error("Por favor completa los campos obligatorios (Nombre, SKU, Precio)")
            return
        }

        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: userData } = await supabase.from("users").select("company_id").eq("auth_id", user?.id).single()

            const { error } = await supabase.from("products").insert({
                company_id: userData?.company_id,
                name: formData.name,
                sku: formData.sku,
                category: formData.category,
                price_usd: parseFloat(formData.price_usd),
                cost_usd: parseFloat(formData.cost_usd || "0"),
                stock_qty: parseInt(formData.stock_qty),
                min_stock: parseInt(formData.min_stock),
                unit: formData.unit
            })

            if (error) throw error

            toast.success("Producto creado exitosamente")
            setIsAddOpen(false)
            setFormData({ name: "", sku: "", category: "", price_usd: "", cost_usd: "", stock_qty: "0", min_stock: "5", unit: "Unidad" })
            fetchProducts() // refresh
        } catch (error: any) {
            toast.error("Error al guardar producto", { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))

    const totalProducts = products.length
    const criticalStock = products.filter(p => p.stock_qty <= p.min_stock).length
    const inventoryValue = products.reduce((acc, p) => acc + (p.price_usd * p.stock_qty), 0)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#F5EEFF]">Productos & Inventario</h1>
                    <p className="text-[#B8A0D0] mt-1">Control de stock, precios y categorías.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-glow cursor-pointer">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Registrar Producto</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Nombre *</label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">SKU / Código *</label>
                                    <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Categoría</label>
                                    <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Unidad de Medida</label>
                                    <Input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Precio Venta (USD) *</label>
                                    <Input type="number" step="0.01" value={formData.price_usd} onChange={e => setFormData({ ...formData, price_usd: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Costo Unitario (USD)</label>
                                    <Input type="number" step="0.01" value={formData.cost_usd} onChange={e => setFormData({ ...formData, cost_usd: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Stock Inicial</label>
                                    <Input type="number" value={formData.stock_qty} onChange={e => setFormData({ ...formData, stock_qty: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Stock Mínimo</label>
                                    <Input type="number" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" className="text-[#6B5280] hover:text-[#F5EEFF]" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Guardar Producto"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { title: "Total Productos", value: loading ? "-" : totalProducts.toString(), icon: Boxes, color: "#E040FB" },
                    { title: "Stock Crítico", value: loading ? "-" : criticalStock.toString(), icon: AlertTriangle, color: "#FF4757" },
                    { title: "Valor Inventario (USD)", value: loading ? "-" : `$${inventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "#7C4DFF" },
                ].map((c, i) => {
                    const Icon = c.icon
                    return (
                        <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="glass p-5 rounded-2xl flex items-center gap-4 border-[#E040FB]/10">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15`, color: c.color }}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-[#B8A0D0]">{c.title}</p>
                                <p className="text-2xl font-bold text-[#F5EEFF]">{c.value}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5280]" />
                    <Input placeholder="Buscar por nombre o SKU..." value={q} onChange={e => setQ(e.target.value)}
                        className="pl-10 h-10 bg-[#1A1220]/50 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/30 rounded-xl" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#E040FB] animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-[#6B5280]">No hay productos registrados. ¡Crea el primero!</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((p, idx) => {
                        const ss = stockStatus(p.stock_qty, p.min_stock)
                        return (
                            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * idx }}
                                className="glass rounded-2xl overflow-hidden border-[#E040FB]/10 group hover:shadow-glow transition-all duration-300">
                                <div className="h-28 bg-gradient-to-br from-[#1A1220] to-[#0F0A12] flex items-center justify-center relative">
                                    <Package className="w-10 h-10 text-[#E040FB]/20 group-hover:text-[#E040FB]/40 transition-colors" />
                                    <div className="absolute top-3 right-3"><Badge variant={ss.variant}>{ss.label}</Badge></div>
                                    <span className="absolute top-3 left-3 text-[10px] font-mono bg-[#0F0A12]/80 px-2 py-0.5 rounded text-[#6B5280]">{p.sku}</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#F5EEFF] group-hover:text-[#E040FB] transition-colors line-clamp-2">{p.name}</p>
                                        <p className="text-xs text-[#6B5280] mt-1">{p.category || "Sin categoría"}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-[#E040FB]">${Number(p.price_usd).toFixed(2)}</span>
                                        <span className="text-xs text-[#6B5280]">/{p.unit}</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-[#B8A0D0]">Stock</span>
                                            <span className="text-[#F5EEFF] font-medium">{p.stock_qty} / {p.min_stock} min</span>
                                        </div>
                                        <div className="h-1.5 bg-[#0F0A12] rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${p.stock_qty === 0 ? "bg-[#FF4757]" : p.stock_qty <= p.min_stock ? "bg-[#FFB800]" : "bg-[#00D4AA]"}`}
                                                style={{ width: `${Math.min((p.stock_qty / (p.min_stock * 3)) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
