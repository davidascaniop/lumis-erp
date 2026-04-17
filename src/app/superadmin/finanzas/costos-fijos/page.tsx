"use client";
import { useState, useEffect, useCallback } from "react";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
import { toast } from "sonner";
import {
  Calculator,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Categoria = "Infraestructura" | "Herramientas SaaS" | "Personal" | "Oficina" | "Otro";

const CATEGORIAS: Categoria[] = [
  "Infraestructura",
  "Herramientas SaaS",
  "Personal",
  "Oficina",
  "Otro",
];

const EMPTY_FORM = {
  name: "",
  category: "Infraestructura" as Categoria,
  amount_usd: "",
  due_day: "",
  alerts_enabled: true,
  alert_days: 3,
};

export default function CostosFijosPage() {
  const supabase = createSuperadminClient();
  const [costos, setCostos] = useState<any[]>([]);
  const [paymentsThisMonth, setPaymentsThisMonth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [registeringPaymentFor, setRegisteringPaymentFor] = useState<string | null>(null);

  const fetchCostos = useCallback(async () => {
    setLoading(true);
    const { data: fc } = await supabase
      .from("admin_fixed_costs")
      .select("*")
      .order("created_at", { ascending: false });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: payments } = await supabase
      .from("admin_fixed_cost_payments")
      .select("*")
      .gte("paid_at", currentMonthStart);

    setCostos(fc || []);
    setPaymentsThisMonth(payments || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCostos();
  }, [fetchCostos]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSave = async () => {
    // Validación
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const amount = Number(form.amount_usd);
    if (!amount || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    const dueDay = Number(form.due_day);
    if (!dueDay || dueDay < 1 || dueDay > 31) {
      toast.error("El día de cobro debe estar entre 1 y 31");
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();

      const { error } = await supabase.from("admin_fixed_costs").insert({
        name: form.name.trim(),
        category: form.category,
        amount_usd: amount,
        due_day: dueDay,
        alerts_enabled: form.alerts_enabled,
        alert_days: form.alert_days,
        created_by: authData.user?.id || null,
      } as any);

      if (error) throw error;

      toast.success(`"${form.name}" agregado correctamente`);
      setShowModal(false);
      setForm(EMPTY_FORM);
      await fetchCostos();
    } catch (err: any) {
      toast.error("No se pudo guardar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterPayment = async (costo: any) => {
    setRegisteringPaymentFor(costo.id);
    try {
      const { error } = await supabase.from("admin_fixed_cost_payments").insert({
        fixed_cost_id: costo.id,
        amount_usd: costo.amount_usd,
        paid_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
      toast.success(`Pago de "${costo.name}" registrado`);
      await fetchCostos();
    } catch (err: any) {
      toast.error("No se pudo registrar el pago", { description: err.message });
    } finally {
      setRegisteringPaymentFor(null);
    }
  };

  const handleDelete = async (costo: any) => {
    if (!window.confirm(`¿Eliminar "${costo.name}"? Los pagos asociados también se borrarán.`)) {
      return;
    }
    try {
      const { error } = await supabase.from("admin_fixed_costs").delete().eq("id", costo.id);
      if (error) throw error;
      toast.success(`"${costo.name}" eliminado`);
      setMenuOpenId(null);
      await fetchCostos();
    } catch (err: any) {
      toast.error("No se pudo eliminar", { description: err.message });
    }
  };

  const totalCostosMes = costos.reduce((sum, c) => sum + Number(c.amount_usd || 0), 0);

  const catStyles: Record<string, string> = {
    Infraestructura: "bg-[#4FC3F7]/10 text-[#0288D1]",
    "Herramientas SaaS": "bg-[#E040FB]/10 text-[#E040FB]",
    Personal: "bg-[#FFB300]/10 text-[#FFB300]",
    Oficina: "bg-[#10B981]/10 text-[#10B981]",
    Otro: "bg-surface-hover text-text-2",
  };

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Costos Fijos</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Gastos que se repiten cada mes</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Agregar Costo Fijo
        </button>
      </div>

      {/* RESUMEN */}
      <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden max-w-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="p-3 bg-status-danger/10 border border-status-danger/20 rounded-2xl text-status-danger">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-sm font-bold text-text-3 mb-1 uppercase tracking-widest relative z-10">
          Total Costos Fijos Mensuales
        </h3>
        <div className="font-heading text-4xl font-black tracking-tight relative z-10 text-text-1">
          ${totalCostosMes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        ) : costos.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border rounded-3xl">
            <Calculator className="w-10 h-10 text-text-3 mx-auto mb-4" />
            <p className="text-text-2 font-bold mb-2">No hay costos fijos registrados</p>
            <p className="text-text-3 text-sm mb-4">Empieza agregando tu hosting o herramientas.</p>
            <button onClick={openNew} className="text-brand font-bold hover:underline">
              Añadir el primero
            </button>
          </div>
        ) : (
          costos.map((c) => {
            const isPaid = paymentsThisMonth.some((p) => p.fixed_cost_id === c.id);
            const isOverdue = !isPaid && new Date().getDate() > c.due_day;
            const isRegistering = registeringPaymentFor === c.id;

            return (
              <div
                key={c.id}
                className="bg-surface-card border border-border rounded-3xl p-5 shadow-sm flex flex-col items-center text-center relative group"
              >
                {/* 3-dot menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() =>
                      setMenuOpenId((prev) => (prev === c.id ? null : c.id))
                    }
                    className="text-text-3 hover:text-text-1 bg-surface-base p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpenId === c.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-8 z-20 w-40 bg-surface-card border border-border rounded-xl shadow-xl p-1">
                        <button
                          onClick={() => handleDelete(c)}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-surface-base border border-border flex items-center justify-center mb-4 shadow-sm">
                  <span className="text-2xl font-bold text-text-2">{c.name.charAt(0)}</span>
                </div>

                <h3 className="text-sm font-bold text-text-1 mb-1 line-clamp-1">{c.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-4 ${
                    catStyles[c.category] || catStyles.Otro
                  }`}
                >
                  {c.category}
                </span>

                <div className="text-3xl font-heading font-black text-text-1 mb-1">
                  ${Number(c.amount_usd).toLocaleString()}
                </div>
                <div className="text-[#00AF9C] text-[10px] font-bold uppercase tracking-widest bg-[#00E5CC]/10 px-2 py-1 rounded-md mb-6">
                  Día {c.due_day} de cada mes
                </div>

                <div className="mt-auto w-full">
                  {isPaid ? (
                    <div className="flex items-center justify-center gap-2 text-status-ok bg-status-ok/10 py-2.5 rounded-xl text-xs font-bold w-full uppercase tracking-wider border border-status-ok/20">
                      <CheckCircle2 className="w-4 h-4" /> Pagado
                    </div>
                  ) : (
                    <div className="space-y-2 w-full">
                      <div
                        className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          isOverdue ? "text-status-danger" : "text-status-warn"
                        }`}
                      >
                        {isOverdue ? (
                          <>
                            <XCircle className="w-4 h-4" /> Vencido
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" /> Pendiente
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleRegisterPayment(c)}
                        disabled={isRegistering}
                        className="w-full py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isRegistering ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : null}
                        Registrar Pago
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL NUEVO COSTO */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-surface-card border-border text-text-1 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold">Nuevo Costo Fijo</DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Agrega un gasto recurrente de tu SaaS (hosting, herramientas, salarios…)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                Nombre *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Vercel, Supabase, Alquiler…"
                className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 text-sm text-text-1 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                  Categoría *
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as Categoria }))
                  }
                  className="w-full h-11 bg-surface-base border border-border rounded-xl px-3 text-sm text-text-1 focus:outline-none focus:border-brand/40"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                  Monto USD *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount_usd}
                  onChange={(e) => setForm((f) => ({ ...f, amount_usd: e.target.value }))}
                  placeholder="0.00"
                  className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 text-sm text-text-1 font-mono focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                Día de cobro (1-31) *
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={form.due_day}
                onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))}
                placeholder="Ej: 5"
                className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 text-sm text-text-1 focus:outline-none focus:border-brand/40"
              />
            </div>

            <label className="flex items-center gap-3 p-4 border border-border rounded-xl bg-surface-base/50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.alerts_enabled}
                onChange={(e) =>
                  setForm((f) => ({ ...f, alerts_enabled: e.target.checked }))
                }
                className="w-4 h-4 rounded border-border text-brand focus:ring-brand accent-brand"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-text-1">Generar alerta</p>
                <p className="text-[10px] text-text-3 uppercase tracking-wider">
                  Avisar antes del vencimiento
                </p>
              </div>
              <select
                value={form.alert_days}
                onChange={(e) =>
                  setForm((f) => ({ ...f, alert_days: Number(e.target.value) }))
                }
                disabled={!form.alerts_enabled}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface-card border border-border rounded-lg px-2 py-1 text-xs text-text-1 disabled:opacity-40"
              >
                <option value={3}>3 días antes</option>
                <option value={5}>5 días antes</option>
                <option value={10}>10 días antes</option>
              </select>
            </label>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={saving}
              className="px-5 py-2 text-sm font-bold text-text-3 hover:text-text-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Guardando…" : "Guardar Costo Fijo"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
