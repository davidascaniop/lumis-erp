"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Plus, MoreHorizontal, Filter, Package, Eye, FileDown, Clock, CheckCircle2, Truck, DollarSign, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { pdf } from '@react-pdf/renderer'
import { DeliveryNotePDF } from "@/components/pdf/DeliveryNotePDF"

const orderStatusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "magenta"; icon: any }> = {
    draft: { label: "Borrador", variant: "warning", icon: Clock },
    confirmed: { label: "Confirmado", variant: "info", icon: Package },
    dispatched: { label: "Despachado", variant: "magenta", icon: Truck },
    delivered: { label: "Entregado", variant: "success", icon: CheckCircle2 },
}

export default function VentasPage() {
    const supabase = createClient()
    const [orders, setOrders] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [company, setCompany] = useState<any>(null)

    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Form State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [selectedClient, setSelectedClient] = useState("")
    const [cart, setCart] = useState<{ product_id: string, qty: number, price: number, name: string }[]>([])

    const fetchInitialData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userData } = await supabase.from("users").select("company_id").eq("auth_id", user.id).single()
        if (!userData) return

        // Fetch company info for the PDF
        const { data: cData } = await supabase.from("companies").select("*").eq("id", userData.company_id).single()
        setCompany(cData)

        // Fetch clients & products for the dropdowns
        const { data: c } = await supabase.from("partners").select("id, name").eq("company_id", userData.company_id)
        const { data: p } = await supabase.from("products").select("id, name, price_usd, stock_qty").eq("company_id", userData.company_id)
        if (c) setClients(c)
        if (p) setProducts(p)

        await fetchOrders(userData.company_id)
    }

    const fetchOrders = async (companyId: string) => {
        const { data, error } = await supabase
            .from("orders")
            .select(`
        *,
        partners (name, rif, city, phone, email)
      `)
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })

        if (!error && data) {
            setOrders(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchInitialData()
    }, [])

    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prodId = e.target.value
        if (!prodId) return
        const prod = products.find(p => p.id === prodId)
        if (prod && !cart.find(c => c.product_id === prodId)) {
            setCart([...cart, { product_id: prod.id, name: prod.name, qty: 1, price: prod.price_usd }])
        }
        e.target.value = "" // reset select
    }

    const handleSaveOrder = async () => {
        if (!selectedClient) return toast.error("Selecciona un cliente")
        if (cart.length === 0) return toast.error("Agrega al menos un producto al pedido")

        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: userData } = await supabase.from("users").select("id, company_id").eq("auth_id", user?.id).single()

            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0)
            const orderNumber = `PED-${Math.floor(1000 + Math.random() * 9000)}`

            // 1. Insert Order
            const { data: orderData, error: orderError } = await supabase.from("orders").insert({
                company_id: userData?.company_id,
                user_id: userData?.id,
                partner_id: selectedClient,
                order_number: orderNumber,
                status: "confirmed",
                subtotal_usd: total,
                total_usd: total,
            }).select().single()

            if (orderError) throw orderError

            // 2. Insert Order Items
            const itemsToInsert = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.product_id,
                qty: item.qty,
                unit_price: item.price,
                subtotal: item.price * item.qty
            }))

            const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert)
            if (itemsError) throw itemsError

            toast.success(`Pedido ${orderNumber} creado exitosamente`)
            setIsAddOpen(false)
            setCart([])
            setSelectedClient("")
            fetchOrders(userData?.company_id)
        } catch (e: any) {
            toast.error("Error al crear pedido", { description: e.message })
        } finally {
            setIsSaving(false)
        }
    }

    const downloadPDF = async (order: any) => {
        toast.loading("Generando Nota de Entrega...", { id: "pdf-gen" })
        try {
            // fetch items
            const { data: items } = await supabase.from("order_items").select(`*, products(name, sku)`).eq("order_id", order.id)

            const blob = await pdf(<DeliveryNotePDF order={order} items={items || []} company={company} partner={order.partners} />).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Nota_Entrega_${order.order_number}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()

            toast.success("Descarga iniciada", { id: "pdf-gen" })
        } catch (e: any) {
            toast.error("Error al generar PDF", { id: "pdf-gen", description: e.message })
        }
    }

    const filtered = orders.filter(o => o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) || o.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    const cartTotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#F5EEFF]">Ventas & Pedidos</h1>
                    <p className="text-[#B8A0D0] mt-1">Control de pedidos, entregas y facturación.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-glow cursor-pointer">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Pedido
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] border-[#E040FB]/20 bg-[#1A1220]/95 backdrop-blur-2xl">
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Pedido</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="space-y-2">
                                <label className="text-xs text-[#B8A0D0]">Cliente *</label>
                                <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                                    className="w-full h-10 rounded-md border border-[#E040FB]/10 bg-[#0F0A12]/80 px-3 text-[#F5EEFF] focus:outline-none focus:ring-2 focus:ring-[#E040FB]/40">
                                    <option value="">Seleccione un cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-[#B8A0D0]">Agregar Producto al carrito</label>
                                <select onChange={handleProductSelect}
                                    className="w-full h-10 rounded-md border border-[#E040FB]/10 bg-[#0F0A12]/80 px-3 text-[#F5EEFF] focus:outline-none focus:ring-2 focus:ring-[#E040FB]/40">
                                    <option value="">Buscar y seleccionar producto...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price_usd} (Disp: {p.stock_qty})</option>)}
                                </select>
                            </div>

                            {/* Cart Table */}
                            <div className="border border-[#E040FB]/10 rounded-xl overflow-hidden mt-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#E040FB]/5">
                                        <tr>
                                            <th className="text-left px-3 py-2 text-[#B8A0D0]">Producto</th>
                                            <th className="text-center px-3 py-2 text-[#B8A0D0]">Cant.</th>
                                            <th className="text-right px-3 py-2 text-[#B8A0D0]">Prep. Und</th>
                                            <th className="text-right px-3 py-2 text-[#B8A0D0]">Subtotal</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item, idx) => (
                                            <tr key={idx} className="border-t border-[#E040FB]/5">
                                                <td className="px-3 py-2 text-[#F5EEFF]">{item.name}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <Input type="number" min="1" value={item.qty}
                                                        onChange={(e) => {
                                                            const newCart = [...cart]
                                                            newCart[idx].qty = parseInt(e.target.value) || 1
                                                            setCart(newCart)
                                                        }}
                                                        className="w-16 h-8 text-center mx-auto bg-[#0F0A12] border-[#E040FB]/20 text-[#F5EEFF]" />
                                                </td>
                                                <td className="px-3 py-2 text-right text-[#B8A0D0]">${item.price}</td>
                                                <td className="px-3 py-2 text-right font-bold text-[#E040FB]">${(item.price * item.qty).toFixed(2)}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <Button variant="ghost" size="sm" onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                                        className="text-[#FF4757] hover:bg-[#FF4757]/10 hover:text-[#FF4757] h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-[#6B5280]">Carrito vacío. Agrega productos arriba.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-right text-xl font-bold text-[#F5EEFF]">
                                Total: <span className="text-[#00D4AA]">${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-[#6B5280] hover:text-[#F5EEFF]">Cancelar</Button>
                            <Button onClick={handleSaveOrder} disabled={isSaving || cart.length === 0 || !selectedClient} className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generar Pedido"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative w-full sm:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5280]" />
                <Input placeholder="Buscar por # pedido o cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-[#1A1220]/50 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] rounded-xl" />
            </div>

            <motion.div className="glass rounded-2xl overflow-hidden border-[#E040FB]/10">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#E040FB]/10">
                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Pedido</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Cliente</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Fecha</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Total</th>
                                <th className="text-center px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Estado</th>
                                <th className="text-center px-4 py-4 text-xs font-semibold uppercase text-[#6B5280]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 text-[#E040FB] animate-spin mx-auto" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-[#6B5280]">No hay pedidos registrados.</td></tr>
                            ) : filtered.map((order, idx) => {
                                const osm = orderStatusMap[order.status] || orderStatusMap.draft
                                const StatusIcon = osm.icon
                                return (
                                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-[#E040FB]/5 hover:bg-[#E040FB]/5 transition-colors group">
                                        <td className="px-6 py-4"><span className="text-sm font-bold text-[#E040FB]">{order.order_number}</span></td>
                                        <td className="px-6 py-4"><p className="text-sm font-medium text-[#F5EEFF] group-hover:text-[#E040FB]">{order.partners?.name || 'Invitado'}</p></td>
                                        <td className="px-6 py-4"><span className="text-sm text-[#B8A0D0]">{new Date(order.created_at).toLocaleDateString()}</span></td>
                                        <td className="px-6 py-4 text-right"><span className="text-sm font-bold text-[#F5EEFF]">${Number(order.total_usd).toFixed(2)}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={osm.variant as "success" | "warning" | "danger" | "info" | "magenta"} className="gap-1">
                                                <StatusIcon className="w-3 h-3" /> {osm.label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B5280] hover:text-[#F5EEFF] cursor-pointer"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#1A1220]/95 backdrop-blur-xl border-[#E040FB]/20 text-[#F5EEFF]">
                                                    <DropdownMenuItem onClick={() => downloadPDF(order)} className="focus:bg-[#E040FB]/10 cursor-pointer">
                                                        <FileDown className="w-4 h-4 mr-2" /> Nota de Entrega (PDF)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
