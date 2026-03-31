"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Plus,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  MapPin,
  Calendar,
  RefreshCw,
  FileText,
  AlertCircle,
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
interface Dispatch {
  id: string;
  dispatch_number: string;
  order_id: string;
  partner_id: string;
  delivery_address: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  status: DispatchStatus;
  notes: string | null;
  created_at: string;
  orders?: { order_number: string; total_usd: number };
  partners?: { name: string; rif: string };
}

interface DispatchItem {
  id: string;
  product_id: string;
  product_name: string;
  qty: number;
}

interface StatusLogEntry {
  id: string;
  status: DispatchStatus;
  notes: string | null;
  created_at: string;
}

type DispatchStatus =
  | "pending_dispatch"
  | "preparing"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "returned";

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  DispatchStatus,
  { label: string; cls: string; dot: string }
> = {
  pending_dispatch: {
    label: "Pendiente",
    cls: "bg-surface-base text-text-3 border-border",
    dot: "bg-text-3",
  },
  preparing: {
    label: "Preparando",
    cls: "bg-status-warn/10 text-status-warn border-status-warn/20",
    dot: "bg-status-warn",
  },
  dispatched: {
    label: "Despachado",
    cls: "bg-status-info/10 text-status-info border-status-info/20",
    dot: "bg-status-info",
  },
  in_transit: {
    label: "En Tránsito",
    cls: "bg-[#7C4DFF]/10 text-[#7C4DFF] border-[#7C4DFF]/20",
    dot: "bg-[#7C4DFF]",
  },
  delivered: {
    label: "Entregado",
    cls: "bg-status-ok/10 text-status-ok border-status-ok/20",
    dot: "bg-status-ok",
  },
  returned: {
    label: "Devuelto",
    cls: "bg-status-danger/10 text-status-danger border-status-danger/20",
    dot: "bg-status-danger",
  },
};

// ─── Timeline Steps ───────────────────────────────────────────────────────────
const TIMELINE_STEPS: { key: DispatchStatus; label: string; icon: any }[] = [
  { key: "pending_dispatch", label: "Pedido\nConfirmado", icon: FileText },
  { key: "preparing", label: "Preparando", icon: Package },
  { key: "dispatched", label: "Despachado", icon: Truck },
  { key: "in_transit", label: "En Tránsito", icon: Truck },
  { key: "delivered", label: "Entregado", icon: CheckCircle2 },
];

const STATUS_ORDER: DispatchStatus[] = [
  "pending_dispatch",
  "preparing",
  "dispatched",
  "in_transit",
  "delivered",
];

function getStepIndex(status: DispatchStatus) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function DispatchBadge({ status }: { status: DispatchStatus }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_dispatch;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border ${c.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DespachosPage() {
  const supabase = createClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [statusLog, setStatusLog] = useState<StatusLogEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // New dispatch form
  const [form, setForm] = useState({
    order_id: "",
    partner_name: "",
    delivery_address: "",
    carrier: "",
    estimated_delivery: "",
    notes: "",
  });

  // Update status
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updatingDispatch, setUpdatingDispatch] = useState<Dispatch | null>(null);
  const [newStatus, setNewStatus] = useState<DispatchStatus>("preparing");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        .from("dispatches")
        .select(
          `*, orders(order_number, total_usd), partners(name, rif)`
        )
        .eq("company_id", userData.company_id)
        .order("created_at", { ascending: false });

      setDispatches((data as Dispatch[]) || []);
    } catch (error) {
      console.error("Error fetching dispatches:", error);
      toast.error("Error al cargar despachos");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Computed Stats ─────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonth = dispatches.filter((d) => {
    const created = new Date(d.created_at);
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  });
  const inTransit = dispatches.filter((d) =>
    ["dispatched", "in_transit"].includes(d.status)
  );
  const delivered = dispatches.filter((d) => d.status === "delivered");
  const pending = dispatches.filter((d) => d.status === "pending_dispatch");

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = dispatches.filter(
    (d) =>
      d.dispatch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.orders?.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Detail View ────────────────────────────────────────────────────────────
  const openDetail = async (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const [itemsRes, logRes] = await Promise.all([
        supabase
          .from("dispatch_items")
          .select("*")
          .eq("dispatch_id", dispatch.id),
        supabase
          .from("dispatch_status_log")
          .select("*")
          .eq("dispatch_id", dispatch.id)
          .order("created_at", { ascending: false }),
      ]);
      setDispatchItems((itemsRes.data as DispatchItem[]) || []);
      setStatusLog((logRes.data as StatusLogEntry[]) || []);
    } catch (err) {
      console.error("Error loading detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Load Available Orders ──────────────────────────────────────────────────
  const loadAvailableOrders = async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, partner_id, partners(name, address)")
        .eq("company_id", companyId)
        .in("status", ["confirmed", "pending", "completed"])
        .order("created_at", { ascending: false });
      setAvailableOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  const handleOpenNew = async () => {
    await loadAvailableOrders();
    setForm({
      order_id: "",
      partner_name: "",
      delivery_address: "",
      carrier: "",
      estimated_delivery: "",
      notes: "",
    });
    setNewOpen(true);
  };

  // ── On Order Select ────────────────────────────────────────────────────────
  const handleOrderSelect = (orderId: string) => {
    const order = availableOrders.find((o) => o.id === orderId);
    if (!order) return;
    setForm((prev) => ({
      ...prev,
      order_id: orderId,
      partner_name: (order.partners as any)?.name || "",
      delivery_address: (order.partners as any)?.address || "",
    }));
  };

  // ── Create Dispatch ────────────────────────────────────────────────────────
  const handleCreateDispatch = async () => {
    if (!form.order_id) {
      toast.error("Selecciona un pedido vinculado");
      return;
    }
    if (!companyId || !userId) return;

    setSaving(true);
    try {
      const order = availableOrders.find((o) => o.id === form.order_id);
      if (!order) throw new Error("Pedido no encontrado");

      const dispatchNumber = `DSP-${Date.now().toString().slice(-6)}`;

      // Create dispatch
      const { data: dispatch, error: dErr } = await supabase
        .from("dispatches")
        .insert({
          company_id: companyId,
          dispatch_number: dispatchNumber,
          order_id: form.order_id,
          partner_id: order.partner_id,
          delivery_address: form.delivery_address || null,
          carrier: form.carrier || null,
          estimated_delivery: form.estimated_delivery || null,
          notes: form.notes || null,
          status: "preparing",
          created_by: userId,
        } as any)
        .select()
        .single();

      if (dErr) throw dErr;

      // Copy order items into dispatch_items
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, qty, products(name)")
        .eq("order_id", form.order_id);

      if (orderItems && orderItems.length > 0) {
        const dispatchItems = orderItems.map((item: any) => ({
          dispatch_id: (dispatch as any).id,
          product_id: item.product_id,
          product_name: item.products?.name || "Producto",
          qty: item.qty,
        }));
        await supabase.from("dispatch_items").insert(dispatchItems as any);
      }

      // Log initial status
      await supabase.from("dispatch_status_log").insert({
        dispatch_id: (dispatch as any).id,
        status: "preparing",
        changed_by: userId,
        notes: "Despacho creado",
      } as any);

      // Update order status to dispatched
      await supabase
        .from("orders")
        .update({ status: "dispatched" } as any)
        .eq("id", form.order_id);

      toast.success(`Despacho ${dispatchNumber} creado`);
      setNewOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error al crear despacho", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Update Status ──────────────────────────────────────────────────────────
  const handleOpenUpdateStatus = (dispatch: Dispatch) => {
    setUpdatingDispatch(dispatch);
    setNewStatus(dispatch.status);
    setStatusNote("");
    setUpdateOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!updatingDispatch || !userId) return;
    setUpdating(true);
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === "delivered") {
        updates.actual_delivery = new Date().toISOString();
      }

      const { error: dErr } = await supabase
        .from("dispatches")
        .update(updates)
        .eq("id", updatingDispatch.id);
      if (dErr) throw dErr;

      // Log status change
      await supabase.from("dispatch_status_log").insert({
        dispatch_id: updatingDispatch.id,
        status: newStatus,
        changed_by: userId,
        notes: statusNote || null,
      } as any);

      // If delivered, update order status
      if (newStatus === "delivered") {
        await supabase
          .from("orders")
          .update({ status: "delivered", delivered_at: new Date().toISOString() } as any)
          .eq("id", updatingDispatch.order_id);
      }

      toast.success("Estado actualizado");
      setUpdateOpen(false);
      fetchData();

      // Refresh detail if open
      if (detailOpen && selectedDispatch?.id === updatingDispatch.id) {
        const updated = { ...selectedDispatch, status: newStatus };
        setSelectedDispatch(updated as Dispatch);
        openDetail(updated as Dispatch);
      }
    } catch (error: any) {
      toast.error("Error al actualizar estado", { description: error.message });
    } finally {
      setUpdating(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">
            Despachos y Envíos
          </h1>
          <p className="text-text-2 mt-1 text-sm">
            Controla y rastrea cada envío hacia tus clientes
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="px-6 py-3 bg-brand-gradient text-white font-bold rounded-xl text-sm shadow-brand hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Despacho
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total del Mes",
            value: thisMonth.length,
            icon: Truck,
            color: "text-brand",
            bg: "bg-brand/10",
          },
          {
            label: "En Tránsito",
            value: inTransit.length,
            icon: RefreshCw,
            color: "text-[#7C4DFF]",
            bg: "bg-[#7C4DFF]/10",
          },
          {
            label: "Entregados",
            value: delivered.length,
            icon: CheckCircle2,
            color: "text-status-ok",
            bg: "bg-status-ok/10",
          },
          {
            label: "Pendientes",
            value: pending.length,
            icon: Clock,
            color: "text-status-warn",
            bg: "bg-status-warn/10",
          },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <Card className="p-5 bg-surface-card shadow-card border-border/50 flex items-center gap-4 hover-card-effect transition-all">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bg}`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-1 font-montserrat font-bold">{card.label}</p>
                <p className="text-2xl font-montserrat font-bold text-text-1">
                  {loading ? "–" : card.value}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-surface-base/50 flex justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar por número, cliente o pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 text-text-2 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>
                {[
                  "Nº Despacho",
                  "Cliente",
                  "Pedido",
                  "Dirección",
                  "Transportista",
                  "F. Estimada",
                  "Estado",
                  "Acciones",
                ].map((h) => (
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
                      <Truck className="w-12 h-12 opacity-30" />
                      <p className="font-medium text-sm">
                        No hay despachos registrados
                      </p>
                      <p className="text-xs opacity-70">
                        Crea un nuevo despacho para empezar
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((d, idx) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-surface-hover/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-brand text-sm">
                        {d.dispatch_number}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-text-1 text-sm">
                        {d.partners?.name ?? "–"}
                      </p>
                      <p className="text-[10px] text-text-3 font-mono">
                        {d.partners?.rif}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-mono text-text-2 text-xs">
                      {d.orders?.order_number ?? "–"}
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="text-text-2 text-xs truncate">
                        {d.delivery_address ?? "–"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-text-2 text-xs">
                      {d.carrier ?? "–"}
                    </td>
                    <td className="px-5 py-4 text-text-2 text-xs">
                      {d.estimated_delivery
                        ? format(
                            new Date(d.estimated_delivery + "T00:00:00"),
                            "dd MMM yyyy",
                            { locale: es }
                          )
                        : "–"}
                    </td>
                    <td className="px-5 py-4">
                      <DispatchBadge status={d.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(d)}
                          className="px-3 py-1.5 text-[11px] font-bold bg-brand/10 text-brand border border-brand/20 rounded-lg hover:bg-brand hover:text-white transition-all"
                        >
                          Ver detalle
                        </button>
                        <button
                          onClick={() => handleOpenUpdateStatus(d)}
                          className="px-3 py-1.5 text-[11px] font-bold bg-surface-base text-text-2 border border-border rounded-lg hover:bg-surface-hover/30 transition-all"
                        >
                          Estado
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

      {/* ── MODAL: Detail View ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-xl text-text-1 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand" />
              {selectedDispatch?.dispatch_number}
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Detalle completo del despacho y seguimiento en tiempo real
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* ── Timeline ── */}
              <div className="bg-surface-card border border-border rounded-2xl p-5">
                <p className="text-xs font-bold text-text-1 font-montserrat mb-5">
                  Progreso del Envío
                </p>
                <div className="flex items-start justify-between relative">
                  {/* Line */}
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
                  <div
                    className="absolute top-4 left-0 h-0.5 bg-brand-gradient transition-all duration-700"
                    style={{
                      width: `${
                        (getStepIndex(selectedDispatch?.status || "pending_dispatch") /
                          (TIMELINE_STEPS.length - 1)) *
                        100
                      }%`,
                    }}
                  />

                  {TIMELINE_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(
                      selectedDispatch?.status || "pending_dispatch"
                    );
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;

                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center gap-2 z-10 flex-1"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted
                              ? "bg-brand border-brand"
                              : isActive
                              ? "bg-brand/20 border-brand ring-4 ring-brand/10"
                              : "bg-surface-base border-border"
                          }`}
                        >
                          <step.icon
                            className={`w-3.5 h-3.5 ${
                              isCompleted
                                ? "text-white"
                                : isActive
                                ? "text-brand"
                                : "text-text-3"
                            }`}
                          />
                        </div>
                        <p
                          className={`text-[10px] font-semibold text-center whitespace-pre-line leading-tight ${
                            isActive
                              ? "text-brand"
                              : isCompleted
                              ? "text-text-1"
                              : "text-text-3"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Client & Address ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-card border border-border rounded-xl p-4 space-y-1">
                  <p className="text-[11px] text-text-1 font-montserrat font-bold mb-1">
                    Cliente
                  </p>
                  <p className="font-bold text-text-1">
                    {selectedDispatch?.partners?.name ?? "–"}
                  </p>
                  <p className="text-xs text-text-3 font-mono">
                    {selectedDispatch?.partners?.rif}
                  </p>
                </div>
                <div className="bg-surface-card border border-border rounded-xl p-4 space-y-1">
                  <p className="text-[11px] text-text-1 font-montserrat font-bold mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Dirección de Entrega
                  </p>
                  <p className="text-sm text-text-1">
                    {selectedDispatch?.delivery_address ?? "Sin dirección"}
                  </p>
                </div>
                <div className="bg-surface-card border border-border rounded-xl p-4 space-y-1">
                  <p className="text-[11px] text-text-1 font-montserrat font-bold mb-1">
                    Transportista
                  </p>
                  <p className="text-sm text-text-1">
                    {selectedDispatch?.carrier ?? "–"}
                  </p>
                </div>
                <div className="bg-surface-card border border-border rounded-xl p-4 space-y-1">
                  <p className="text-[11px] text-text-1 font-montserrat font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> F. Estimada Entrega
                  </p>
                  <p className="text-sm text-text-1">
                    {selectedDispatch?.estimated_delivery
                      ? format(
                          new Date(
                            selectedDispatch.estimated_delivery + "T00:00:00"
                          ),
                          "dd 'de' MMMM yyyy",
                          { locale: es }
                        )
                      : "–"}
                  </p>
                </div>
              </div>

              {/* ── Products ── */}
              <div>
                <p className="text-xs font-bold text-text-1 font-montserrat mb-3">
                  Productos incluidos
                </p>
                {dispatchItems.length === 0 ? (
                  <p className="text-text-3 text-sm py-4 text-center">
                    Sin productos registrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dispatchItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-surface-card border border-border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-brand" />
                          </div>
                          <p className="text-sm font-medium text-text-1">
                            {item.product_name}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-text-2 bg-surface-base border border-border px-2.5 py-1 rounded-full">
                          x{item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Status Log ── */}
              <div>
                <p className="text-xs font-bold text-text-1 font-montserrat mb-3">
                  Historial de actualizaciones
                </p>
                {statusLog.length === 0 ? (
                  <p className="text-text-3 text-sm py-4 text-center">
                    Sin historial
                  </p>
                ) : (
                  <div className="space-y-2">
                    {statusLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 bg-surface-card border border-border rounded-xl"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <DispatchBadge status={entry.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {entry.notes && (
                            <p className="text-xs text-text-2 truncate">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] text-text-3 flex-shrink-0">
                          {format(new Date(entry.created_at), "dd MMM · HH:mm", {
                            locale: es,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Nuevo Despacho ── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-xl text-text-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand" />
              Nuevo Despacho
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Vincula un pedido confirmado y configura los datos de envío
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Pedido vinculado */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-1 font-montserrat">
                Pedido vinculado *
              </label>
              <Select
                value={form.order_id}
                onValueChange={handleOrderSelect}
              >
                <SelectTrigger className="w-full bg-surface-input border-border/40 h-11 text-text-1 font-montserrat">
                  <SelectValue placeholder="Buscar pedido confirmado..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-elevated border-border">
                  {availableOrders.length === 0 ? (
                    <div className="py-4 px-3 text-center text-xs text-text-3">
                      No hay pedidos confirmados disponibles
                    </div>
                  ) : (
                    availableOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        <span className="font-mono font-bold text-brand">
                          {order.order_number}
                        </span>
                        <span className="text-text-2 ml-2 text-xs">
                          — {(order.partners as any)?.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Cliente (auto-completa) */}
            {form.partner_name && (
              <div className="flex items-center gap-2 p-3 bg-brand/5 border border-brand/10 rounded-xl">
                <AlertCircle className="w-4 h-4 text-brand flex-shrink-0" />
                <p className="text-xs text-brand font-medium">
                  Cliente:{" "}
                  <span className="font-bold">{form.partner_name}</span>
                </p>
              </div>
            )}

            {/* Dirección */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-1 font-montserrat">
                Dirección de entrega
              </label>
              <Input
                placeholder="Ej: Av. Libertador, Local 12, Caracas"
                value={form.delivery_address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, delivery_address: e.target.value }))
                }
                className="bg-surface-input border-border/40 h-11 text-text-1"
              />
            </div>

            {/* Transportista */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-1 font-montserrat">
                Transportista
              </label>
              <Input
                placeholder="Nombre del transportista o empresa"
                value={form.carrier}
                onChange={(e) =>
                  setForm((p) => ({ ...p, carrier: e.target.value }))
                }
                className="bg-surface-input border-border/40 h-11 text-text-1"
              />
            </div>

            {/* Fecha estimada */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-1 font-montserrat">
                Fecha estimada de entrega
              </label>
              <Input
                type="date"
                value={form.estimated_delivery}
                onChange={(e) =>
                  setForm((p) => ({ ...p, estimated_delivery: e.target.value }))
                }
                className="bg-surface-input border-border/40 h-11 text-text-1"
              />
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-1 font-montserrat">
                Notas de entrega (opcional)
              </label>
              <textarea
                placeholder="Instrucciones especiales, referencias, etc."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2.5 bg-surface-input border border-border/40 rounded-xl text-sm text-text-1 placeholder:text-text-3 resize-none focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setNewOpen(false)}
              className="px-5 py-2 text-text-3 font-montserrat font-bold text-sm hover:text-text-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={saving || !form.order_id}
              onClick={handleCreateDispatch}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-montserrat font-bold shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              Crear Despacho
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Actualizar Estado ── */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="bg-surface-base border-border text-text-1 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-bold text-lg text-text-1 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand" />
              Actualizar Estado
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              {updatingDispatch?.dispatch_number} —{" "}
              {updatingDispatch?.partners?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-1 font-montserrat">
                Nuevo estado
              </label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as DispatchStatus)}
              >
                <SelectTrigger className="bg-surface-input border-border/40 h-11 text-text-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-elevated border-border">
                  {(
                    Object.entries(STATUS_CONFIG) as [
                      DispatchStatus,
                      (typeof STATUS_CONFIG)[DispatchStatus]
                    ][]
                  ).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-1 font-montserrat">
                Nota (opcional)
              </label>
              <Input
                placeholder="Ej: El paquete llegó a la ciudad de destino"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="bg-surface-input border-border/40 h-11 text-text-1"
              />
            </div>

            {newStatus === "delivered" && (
              <div className="p-3 bg-status-ok/10 border border-status-ok/20 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-ok flex-shrink-0" />
                <p className="text-xs text-status-ok font-medium">
                  Al marcar como Entregado, el pedido vinculado también se
                  actualizará automáticamente.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setUpdateOpen(false)}
              className="px-5 py-2 text-text-3 font-bold text-sm hover:text-text-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={updating}
              onClick={handleUpdateStatus}
              className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-black shadow-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Actualizar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
