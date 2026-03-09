"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search, Plus, MoreHorizontal, Phone, MapPin, Eye, Trash2, UserPlus, Users, TrendingUp, Star, Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const statusMap: Record<string, { label: string; variant: "success" | "danger" | "warning" | "info" }> = {
    active: { label: "Activo", variant: "success" },
    blocked: { label: "Bloqueado", variant: "danger" },
    prospect: { label: "Prospecto", variant: "info" },
}

export default function ClientesPage() {
    const supabase = createClient()
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form
    const [formData, setFormData] = useState({
        name: "", rif: "", city: "", phone: "", email: "", status: "active"
    })

    const fetchClients = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userData } = await supabase.from("users").select("company_id").eq("auth_id", user.id).single()
        if (!userData) return

        const { data, error } = await supabase
            .from("partners")
            .select("*")
            .eq("company_id", userData.company_id)
            .order("created_at", { ascending: false })

        if (error) {
            toast.error("Error al cargar clientes")
        } else {
            setClients(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchClients()
    }, [])

    const handleSave = async () => {
        if (!formData.name || !formData.rif) {
            toast.error("Nombre y RIF son obligatorios")
            return
        }
        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: userData } = await supabase.from("users").select("company_id").eq("auth_id", user?.id).single()

            const { error } = await supabase.from("partners").insert({
                company_id: userData?.company_id,
                name: formData.name,
                rif: formData.rif,
                city: formData.city,
                phone: formData.phone,
                email: formData.email,
                status: formData.status
            })

            if (error) throw error

            toast.success("Cliente registrado con éxito")
            setIsAddOpen(false)
            setFormData({ name: "", rif: "", city: "", phone: "", email: "", status: "active" })
            fetchClients()
        } catch (err: any) {
            toast.error("Error al registrar", { description: err.message })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from("partners").delete().eq("id", id)
            if (error) throw error
            toast.success("Cliente eliminado")
            fetchClients()
        } catch (err: any) {
            toast.error("Error al eliminar", { description: err.message })
        }
    }

    const filtered = clients.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.rif?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#F5EEFF]">Clientes comerciales</h1>
                    <p className="text-[#B8A0D0] mt-1">Gestiona tu cartera de clientes y prospectos.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white shadow-glow cursor-pointer">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Razón Social *</label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">RIF *</label>
                                    <Input value={formData.rif} onChange={e => setFormData({ ...formData, rif: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] uppercase" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Teléfono principal</label>
                                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Email</label>
                                    <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Ciudad</label>
                                    <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[#B8A0D0]">Estado de Negocio</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-[#E040FB]/10 bg-[#0F0A12]/80 px-3 py-2 text-sm text-[#F5EEFF] focus:outline-none focus:ring-2 focus:ring-[#E040FB]/40"
                                    >
                                        <option value="active">Activo</option>
                                        <option value="prospect">Prospecto</option>
                                        <option value="blocked">Bloqueado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-[#6B5280] hover:text-[#F5EEFF]">Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Guardar Cliente"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { title: "Total Clientes", value: loading ? "-" : clients.length.toString(), icon: Users, color: "#E040FB" },
                    { title: "Activos", value: loading ? "-" : clients.filter(c => c.status === 'active').length.toString(), icon: TrendingUp, color: "#00D4AA" },
                    { title: "Prospectos", value: loading ? "-" : clients.filter(c => c.status === 'prospect').length.toString(), icon: UserPlus, color: "#7C4DFF" },
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

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5280]" />
                <Input placeholder="Buscar por nombre o RIF..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-[#1A1220]/50 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] rounded-xl" />
            </div>

            {/* Table */}
            <motion.div className="glass rounded-2xl overflow-hidden border-[#E040FB]/10">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#E040FB]/10">
                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Cliente</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Contacto</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Ubicación</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Estado</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold uppercase text-[#6B5280]">Deuda / Saldo</th>
                                <th className="text-center px-4 py-4 text-xs font-semibold uppercase text-[#6B5280]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 text-[#E040FB] animate-spin mx-auto" /></td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-[#6B5280]">No hay clientes registrados o tu búsqueda no dio resultados.</td>
                                </tr>
                            ) : filtered.map((client, idx) => (
                                <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-[#E040FB]/5 hover:bg-[#E040FB]/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-[#F5EEFF] group-hover:text-[#E040FB] transition-colors">{client.name}</p>
                                            <p className="text-xs text-[#6B5280] mt-0.5">{client.rif}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-[#F5EEFF]">{client.email || 'Sin email'}</p>
                                            <div className="flex items-center gap-3 text-xs text-[#6B5280]">
                                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#B8A0D0]">
                                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#7C4DFF]" /> {client.city || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={statusMap[client.status]?.variant || "info"}>{statusMap[client.status]?.label || client.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-semibold text-[#F5EEFF]">${Number(client.current_balance || 0).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B5280] hover:text-[#F5EEFF] cursor-pointer"><MoreHorizontal className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#1A1220]/95 backdrop-blur-xl border-[#E040FB]/20 text-[#F5EEFF]">
                                                <DropdownMenuItem className="focus:bg-[#E040FB]/10 cursor-pointer"><Eye className="w-4 h-4 mr-2" /> Ver Detalle</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-[#FF4757] focus:bg-[#FF4757]/10 focus:text-[#FF4757] cursor-pointer">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
