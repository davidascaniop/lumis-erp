"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  Package,
  ShoppingBag,
  DollarSign,
  X,
  ChevronRight,
  Edit2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier {
  id: string;
  company_id: string;
  name: string;
  rif: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  last_purchase_at?: string | null;
  _total_orders?: number;
}

interface Purchase {
  id: string;
  purchase_number: string | null;
  total_usd: number | null;
  status: string;
  created_at: string;
}

const CATEGORIES = [
  "Alimentos",
  "Tecnología",
  "Servicios",
  "Insumos",
  "Transporte",
  "Otro",
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-surface-base text-text-3 border-border" },
  confirmed: { label: "Confirmada", cls: "bg-status-info/10 text-status-info border-status-info/20" },
  received: { label: "Recibida", cls: "bg-status-ok/10 text-status-ok border-status-ok/20" },
  cancelled: { label: "Cancelada", cls: "bg-status-danger/10 text-status-danger border-status-danger/20" },
};

function PurchaseStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] ?? STATUS_LABELS.draft;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

const INITIAL_FORM = {
  name: "",
  rif: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  category: "",
  notes: "",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProveedoresPage() {
  const supabase = createClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // KPI stats
  const [purchasesThisMonth, setPurchasesThisMonth] = useState(0);
  const [totalThisMonth, setTotalThisMonth] = useState(0);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Detail sheet
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);

  // ── Fetch Suppliers ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("auth_id", user.id)
        .single();
      if (!userData) return;

      setCompanyId(userData.company_id);
      setUserId(userData.id);

      const { data } = await supabase
        .from("suppliers")
        .select("*")
        .eq("company_id", userData.company_id)
        .order("name", { ascending: true });

      const { data: ordersData } = await supabase
        .from("purchases")
        .select("supplier_id")
        .eq("company_id", userData.company_id);
      
      const orderCounts: Record<string, number> = {};
      (ordersData ?? []).forEach(o => {
        if (o.supplier_id) orderCounts[o.supplier_id] = (orderCounts[o.supplier_id] ?? 0) + 1;
      });

      setSuppliers(((data as Supplier[]) ?? []).map(s => ({
        ...s,
        _total_orders: orderCounts[s.id] ?? 0
      })));

      // Purchases stats this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: monthPurchases } = await supabase
        .from("purchases")
        .select("id, total_usd")
        .eq("company_id", userData.company_id)
        .gte("created_at", startOfMonth);

      setPurchasesThisMonth(monthPurchases?.length ?? 0);
      setTotalThisMonth(
        (monthPurchases ?? []).reduce((sum, p) => sum + (p.total_usd ?? 0), 0)
      );
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const activeSuppliers = suppliers.filter((s) => s.is_active);
  const filtered = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.rif.toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.category ?? "").toLowerCase().includes(q)
    );
  });

  // ── Open Create ────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  // ── Open Edit ──────────────────────────────────────────────────────────────
  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      rif: supplier.rif,
      contact_name: supplier.contact_name ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      category: supplier.category ?? "",
      notes: supplier.notes ?? "",
    });
    setModalOpen(true);
  };

  // ── Save Supplier ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !form.rif.trim()) {
      toast.error("Nombre y RIF son obligatorios");
      return;
    }
    if (!companyId) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        rif: form.rif.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        category: form.category || null,
        notes: form.notes.trim() || null,
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from("suppliers")
          .update(payload as any)
          .eq("id", editingSupplier.id);
        if (error) throw error;
        toast.success("Proveedor actualizado");
      } else {
        const { error } = await supabase
          .from("suppliers")
          .insert({ ...payload, company_id: companyId, is_active: true } as any);
        if (error) throw error;
        toast.success("Proveedor registrado correctamente");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Error al guardar proveedor", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from("suppliers")
        .update({ is_active: !supplier.is_active } as any)
        .eq("id", supplier.id);
      if (error) throw error;
      toast.success(supplier.is_active ? "Proveedor desactivado" : "Proveedor activado");
      fetchData();
    } catch (err: any) {
      toast.error("Error al cambiar estado", { description: err.message });
    }
  };

  // ── Open Detail ────────────────────────────────────────────────────────────
  const openDetail = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailOpen(true);
    setLoadingPurchases(true);
    try {
      const { data } = await supabase
        .from("purchases")
        .select("id, purchase_number, total_usd, status, created_at")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false });

      const list = (data as Purchase[]) || [];
      setPurchases(list);
      setTotalSpent(list.reduce((s, p) => s + (p.total_usd ?? 0), 0));
    } catch (err) {
      console.error("Error loading purchases:", err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">
            Proveedores
          </h1>
          <p className="text-text-2 mt-1 text-sm">
            Gestiona tu red de proveedores y su historial de compras
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-6 py-3 bg-brand-gradient text-white font-bold font-montserrat rounded-xl text-sm shadow-brand hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proveedor
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Proveedores Activos",
            value: loading ? "–" : activeSuppliers.length,
            icon: Building2,
            color: "text-brand",
            bg: "bg-brand/10",
          },
          {
            label: "Órdenes este Mes",
            value: loading ? "–" : purchasesThisMonth,
            icon: ClipboardList,
            color: "text-[#7C4DFF]",
            bg: "bg-[#7C4DFF]/10",
          },
          {
            label: "Compras este Mes",
            value: loading ? "–" : `$${totalThisMonth.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-status-ok",
            bg: "bg-status-ok/10",
          },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
          >
            <Card className="p-5 bg-surface-card shadow-card border-border/50 flex items-center gap-4 hover-card-effect transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-montserrat font-bold text-text-1">{card.label}</p>
                <p className="text-2xl font-montserrat font-bold text-text-1">{card.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-surface-base/50 flex items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar por nombre, RIF, email o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 text-text-1 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>
                {["Proveedor", "RIF", "Órdenes", "Teléfono", "Categoría", "Última Compra", "Estado", "Acciones"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 font-bold font-montserrat text-[11px] text-text-1"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3 text-text-3">
                      <Building2 className="w-12 h-12 opacity-30" />
                      <p className="font-medium text-sm">No hay proveedores registrados</p>
                      <p className="text-xs opacity-70">Crea tu primer proveedor con el botón de arriba</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-surface-hover/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-1 text-sm">{s.name}</p>
                          {s.contact_name && (
                            <p className="text-[10px] text-text-3">{s.contact_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-text-2 text-xs">{s.rif}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-brand shadow-sm bg-brand/5 px-2 py-1 rounded-lg border border-brand/10">
                        {s._total_orders ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text-2 text-xs">{s.phone ?? "–"}</td>
                    <td className="px-5 py-4">
                      {s.category ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#7C4DFF]/10 text-[#7C4DFF] border border-[#7C4DFF]/20">
                          {s.category}
                        </span>
                      ) : (
                        <span className="text-text-3 text-xs">–</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-text-2 text-xs">
                      {s.last_purchase_at
                        ? format(new Date(s.last_purchase_at), "dd MMM yyyy", { locale: es })
                        : "Sin compras"}
                    </td>
                    <td className="px-5 py-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-ok/10 text-status-ok border border-status-ok/20">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-text-3/10 text-text-3 border border-border">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openDetail(s)}
                          className="px-3 py-1.5 text-[11px] font-bold font-montserrat bg-brand/10 text-brand border border-brand/20 rounded-lg hover:bg-brand hover:text-white transition-all"
                        >
                          Ver ficha
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-text-3 hover:text-brand hover:bg-brand/10 transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`p-1.5 rounded-lg transition-all ${s.is_active ? "text-status-ok hover:text-status-danger hover:bg-status-danger/10" : "text-text-3 hover:text-status-ok hover:bg-status-ok/10"}`}
                          title={s.is_active ? "Desactivar" : "Activar"}
                        >
                          {s.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Create / Edit ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-xl text-text-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" />
              {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              {editingSupplier
                ? "Modifica la información del proveedor"
                : "Completa los datos para registrar un nuevo proveedor"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">
                Nombre de la empresa *
              </label>
              <Input
                placeholder="Ej: Distribuidora López C.A."
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="bg-surface-input border-border/40 h-11 text-text-1"
              />
            </div>

            {/* RIF */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">
                RIF / Identificación fiscal *
              </label>
              <Input
                placeholder="Ej: J-12345678-9"
                value={form.rif}
                onChange={(e) => setForm((p) => ({ ...p, rif: e.target.value }))}
                className="bg-surface-input border-border/40 h-11 text-text-1 font-mono"
              />
            </div>

            {/* Persona de contacto */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">
                Persona de contacto
              </label>
              <Input
                placeholder="Nombre del representante"
                value={form.contact_name}
                onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))}
                className="bg-surface-input border-border/40 h-11 text-text-1"
              />
            </div>

            {/* Teléfono + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-montserrat text-text-1">
                  Teléfono
                </label>
                <Input
                  placeholder="0414-0000000"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-surface-input border-border/40 h-11 text-text-1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-montserrat text-text-1">
                  Email
                </label>
                <Input
                  placeholder="contacto@empresa.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="bg-surface-input border-border/40 h-11 text-text-1"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">
                Dirección
              </label>
              <Input
                placeholder="Av. Principal, Local #5, Ciudad"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="bg-surface-input border-border/40 h-11 text-text-1"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">
                Categoría de productos que provee
              </label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger className="w-full bg-surface-input border-border/40 h-11 text-text-1 font-montserrat">
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-elevated border-border z-[9999]" position="popper" sideOffset={5}>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-montserrat text-text-1">
                Notas opcionales
              </label>
              <textarea
                placeholder="Condiciones especiales, tiempo de entrega, etc."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 bg-surface-input border border-border/40 rounded-xl text-sm text-text-1 placeholder:text-text-3 resize-none focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2 text-text-3 font-montserrat font-bold text-sm hover:text-text-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={saving || !form.name.trim() || !form.rif.trim()}
              onClick={handleSave}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-montserrat font-bold shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {editingSupplier ? "Guardar Cambios" : "Guardar Proveedor"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Detail / Ficha ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-xl text-text-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" />
              {selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Ficha completa del proveedor e historial de órdenes de compra
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-6 py-2">
              {/* Info General */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: ClipboardList, label: "RIF", value: selectedSupplier.rif },
                  { icon: User, label: "Contacto", value: selectedSupplier.contact_name ?? "–" },
                  { icon: Phone, label: "Teléfono", value: selectedSupplier.phone ?? "–" },
                  { icon: Mail, label: "Email", value: selectedSupplier.email ?? "–" },
                  { icon: MapPin, label: "Dirección", value: selectedSupplier.address ?? "–" },
                  { icon: Package, label: "Categoría", value: selectedSupplier.category ?? "–" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-surface-card border border-border rounded-xl p-3 space-y-1">
                    <p className="text-[11px] font-montserrat font-bold text-text-1 flex items-center gap-1">
                      <Icon className="w-3 h-3 text-brand" />
                      {label}
                    </p>
                    <p className="text-xs text-text-2 truncate" title={value}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Total acumulado */}
              <div className="flex items-center justify-between p-4 bg-brand/5 border border-brand/15 rounded-2xl">
                <div>
                  <p className="text-xs font-montserrat font-bold text-text-1 mb-0.5">
                    Total acumulado comprado
                  </p>
                  <p className="text-3xl font-montserrat font-bold text-brand">
                    ${totalSpent.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-brand" />
                </div>
              </div>

              {/* Historial de órdenes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold font-montserrat text-text-1">
                    Historial de Órdenes de Compra
                  </p>
                  <button
                    onClick={() => {
                      setDetailOpen(false);
                      window.location.href = `/dashboard/compras?supplier=${selectedSupplier.id}`;
                    }}
                    className="text-[10px] font-montserrat font-bold text-brand hover:underline flex items-center gap-1"
                  >
                    + Nueva Orden de Compra
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {loadingPurchases ? (
                  <div className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-border rounded-xl">
                    <ShoppingBag className="w-8 h-8 text-text-3 opacity-30 mx-auto mb-2" />
                    <p className="text-text-3 text-sm">Sin órdenes de compra registradas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {purchases.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3.5 bg-surface-card border border-border rounded-xl hover:border-brand/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#7C4DFF]/10 flex items-center justify-center">
                            <ClipboardList className="w-3.5 h-3.5 text-[#7C4DFF]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-1 font-mono">
                              {p.purchase_number ?? "OC-SIN-NRO"}
                            </p>
                            <p className="text-[10px] text-text-3">
                              {format(new Date(p.created_at), "dd 'de' MMMM yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <PurchaseStatusBadge status={p.status} />
                          <p className="text-sm font-bold text-text-1 font-montserrat">
                            ${(p.total_usd ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas */}
              {selectedSupplier.notes && (
                <div className="p-4 bg-surface-card border border-border rounded-xl">
                  <p className="text-[11px] font-montserrat font-bold text-text-1 mb-1">Notas</p>
                  <p className="text-xs text-text-2 leading-relaxed">{selectedSupplier.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
