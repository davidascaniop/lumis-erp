"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createSuperadminClient } from "@/lib/supabase/superadmin-client";
import { toast } from "sonner";
import {
  ListOrdered,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  TrendingUp,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { HorizontalBarChart } from "@/components/superadmin/horizontal-bar-chart";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Categoria =
  | "Marketing / Publicidad"
  | "Comisiones"
  | "Soporte técnico extra"
  | "APIs de terceros"
  | "Servicios puntuales"
  | "Otro";

const CATEGORIAS: Categoria[] = [
  "Marketing / Publicidad",
  "Comisiones",
  "Soporte técnico extra",
  "APIs de terceros",
  "Servicios puntuales",
  "Otro",
];

const today = () => new Date().toISOString().split("T")[0];

const EMPTY_FORM = {
  description: "",
  category: "Marketing / Publicidad" as Categoria,
  amount_usd: "",
  date: today(),
  notes: "",
};

export default function CostosVariablesPage() {
  const supabase = createSuperadminClient();
  const [costos, setCostos] = useState<any[]>([]);
  const [activeClients, setActiveClients] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCostos = useCallback(async () => {
    setLoading(true);
    const { data: cv } = await supabase
      .from("admin_variable_costs")
      .select("*")
      .order("date", { ascending: false });
    const { count } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active");

    setCostos(cv || []);
    setActiveClients(count || 1);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCostos();
  }, [fetchCostos]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.description.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    const amount = Number(form.amount_usd);
    if (!amount || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    if (!form.date) {
      toast.error("Selecciona una fecha");
      return;
    }

    setSaving(true);
    try {
      // Upload receipt if provided
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const ext = receiptFile.name.split(".").pop() || "dat";
        const filename = `admin-var-${Date.now()}.${ext}`;
        const { data: upload, error: upErr } = await supabase.storage
          .from("receipts")
          .upload(filename, receiptFile);
        if (upErr) {
          console.error("Upload fallido, continuando sin comprobante:", upErr);
        } else if (upload) {
          const { data: pub } = supabase.storage.from("receipts").getPublicUrl(upload.path);
          receiptUrl = pub.publicUrl;
        }
      }

      const { data: authData } = await supabase.auth.getUser();

      const { error } = await supabase.from("admin_variable_costs").insert({
        description: form.description.trim(),
        category: form.category,
        amount_usd: amount,
        date: new Date(form.date + "T00:00:00").toISOString(),
        notes: form.notes.trim() || null,
        receipt_url: receiptUrl,
        created_by: authData.user?.id || null,
      } as any);

      if (error) throw error;

      toast.success("Gasto registrado correctamente");
      setShowModal(false);
      setForm(EMPTY_FORM);
      setReceiptFile(null);
      await fetchCostos();
    } catch (err: any) {
      toast.error("No se pudo guardar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (costo: any) => {
    if (!window.confirm(`¿Eliminar el gasto "${costo.description}"?`)) return;
    try {
      const { error } = await supabase
        .from("admin_variable_costs")
        .delete()
        .eq("id", costo.id);
      if (error) throw error;
      toast.success("Gasto eliminado");
      await fetchCostos();
    } catch (err: any) {
      toast.error("No se pudo eliminar", { description: err.message });
    }
  };

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthVars = costos.filter((c) => new Date(c.date) >= currentMonthStart);
  const lastMonthVars = costos.filter(
    (c) => new Date(c.date) >= lastMonthStart && new Date(c.date) <= lastMonthEnd,
  );

  const totalThisMonth = thisMonthVars.reduce((s, c) => s + Number(c.amount_usd || 0), 0);
  const totalLastMonth = lastMonthVars.reduce((s, c) => s + Number(c.amount_usd || 0), 0);

  const momChange = totalLastMonth ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;
  const avgPerClient = totalThisMonth / activeClients;

  const categories = thisMonthVars.reduce((acc: any, c) => {
    acc[c.category] = (acc[c.category] || 0) + Number(c.amount_usd || 0);
    return acc;
  }, {});
  const chartData = Object.entries(categories).map(([name, val]) => ({
    name,
    meses: Number(val),
  }));

  const catStyles: Record<string, string> = {
    "Marketing / Publicidad": "bg-[#E040FB]/10 text-[#E040FB]",
    Comisiones: "bg-[#00E5CC]/10 text-[#00AF9C]",
    "Soporte técnico extra": "bg-[#F43F5E]/10 text-[#F43F5E]",
    "APIs de terceros": "bg-[#0288D1]/10 text-[#0288D1]",
    "Servicios puntuales": "bg-[#FFB300]/10 text-[#FFB300]",
    Otro: "bg-surface-hover text-text-2",
  };

  return (
    <div className="space-y-6 page-enter pb-10 max-w-7xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-1">Costos Variables</h1>
          <p className="text-sm font-medium text-text-2 mt-1">Gastos que cambian según la actividad</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4FC3F7] text-[#01579B] text-sm font-bold rounded-xl hover:bg-[#4FC3F7]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 text-status-danger relative z-10">
            <ListOrdered className="w-5 h-5 text-status-danger" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Variable (Mes)</span>
          </div>
          <div className="font-heading text-4xl font-black tracking-tight relative z-10 text-text-1">
            ${totalThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-[#E040FB] relative z-10">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Costo x Cliente Activo</span>
          </div>
          <div className="font-heading text-4xl font-black tracking-tight relative z-10 text-text-1">
            ${avgPerClient.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-brand relative z-10">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Variación MoM</span>
          </div>
          <div
            className={`flex items-center gap-2 font-heading text-4xl font-black tracking-tight relative z-10 ${
              momChange > 0 ? "text-status-danger" : "text-status-ok"
            }`}
          >
            {momChange > 0 ? (
              <ArrowUpRight className="w-6 h-6" />
            ) : (
              <ArrowDownRight className="w-6 h-6" />
            )}
            {Math.abs(momChange).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* CHART & TABLE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-heading font-bold text-text-1">Historial de Gastos</h2>
              <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
                Últimos registros
              </p>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-base/50">
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Fecha</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Descripción</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Categoría</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider">Monto</th>
                  <th className="p-3 text-[10px] font-bold text-text-3 uppercase tracking-wider text-right">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center">
                      <Loader2 className="w-5 h-5 animate-spin text-brand mx-auto" />
                    </td>
                  </tr>
                ) : costos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm text-text-3">
                      No hay gastos registrados. Registra el primero arriba.
                    </td>
                  </tr>
                ) : (
                  costos.slice(0, 20).map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-surface-hover/20 transition-colors">
                      <td className="p-3 text-xs font-medium text-text-2 whitespace-nowrap">
                        {format(new Date(c.date), "dd MMM, yy", { locale: es })}
                      </td>
                      <td className="p-3 text-sm font-bold text-text-1 max-w-[240px] truncate">
                        {c.description}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            catStyles[c.category] || catStyles.Otro
                          }`}
                        >
                          {c.category}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-bold text-status-danger font-mono">
                        ${Number(c.amount_usd).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.receipt_url && (
                            <a
                              href={c.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:underline text-[10px] uppercase font-bold tracking-wider"
                            >
                              Ver comprobante
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-text-3 hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-1">Por Categoría</h2>
            <p className="text-xs font-semibold text-text-3 mt-1 uppercase tracking-wider">
              Distribución del gasto (Este mes)
            </p>
          </div>
          <div className="flex-1 min-h-[300px]">
            {chartData.length > 0 ? (
              <HorizontalBarChart data={chartData} />
            ) : (
              <p className="text-sm text-text-3 text-center py-10">Sin gastos este mes.</p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-surface-card border-border text-text-1 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold">Registrar Gasto Variable</DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Ads, comisiones, APIs o cualquier gasto puntual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                Descripción *
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ej: Campaña FB Ads Marzo"
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
                  className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 text-sm text-text-1 font-mono focus:outline-none focus:border-brand/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                Fecha del gasto *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full h-11 bg-surface-base border border-border rounded-xl px-4 text-sm text-text-1 focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                Notas (Opcional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Cualquier detalle adicional…"
                className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:border-brand/40 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest">
                Comprobante (Opcional)
              </label>
              <input
                type="file"
                accept=".jpg,.png,.jpeg,.pdf"
                ref={fileInputRef}
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                  receiptFile
                    ? "border-brand bg-brand/5"
                    : "border-border bg-surface-base/50 hover:border-brand/40 hover:bg-surface-base"
                }`}
              >
                {receiptFile ? (
                  <>
                    <FileText className="w-5 h-5 text-brand shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand truncate">{receiptFile.name}</p>
                      <p className="text-[10px] text-text-3">Click para cambiar</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-text-3 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-text-2">Subir archivo</p>
                      <p className="text-[10px] text-text-3">JPG, PNG o PDF</p>
                    </div>
                  </>
                )}
              </div>
            </div>
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
              className="px-6 py-2.5 bg-[#4FC3F7] text-[#01579B] rounded-xl text-sm font-bold hover:bg-[#4FC3F7]/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Guardando…" : "Guardar Gasto"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
