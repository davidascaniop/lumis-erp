"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Loader2, Plus, FileText, CheckCircle, Clock, XCircle, Send, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

type Quote = {
  id: string;
  quote_number: string;
  status: "open" | "expired" | "converted";
  total_usd: number;
  total_bs: number;
  created_at: string;
  expires_at: string;
  partners: { name: string; rif: string } | null;
  partner_id?: string;
  company_id?: string;
  notes?: string;
};

const STATUS_CONFIG = {
  open: { label: "Vigente", icon: Clock, color: "text-status-ok bg-status-ok/10 border-status-ok/20" },
  expired: { label: "Vencida", icon: XCircle, color: "text-status-danger bg-status-danger/10 border-status-danger/20" },
  converted: { label: "Convertida", icon: CheckCircle, color: "text-brand bg-brand/10 border-brand/20" },
};

export default function PresupuestosPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, quote: Quote | null }>({
    isOpen: false,
    quote: null
  });

  async function fetchQuotes() {
    const companyId = currentUser?.company_id;
    if (!companyId) return;
    setLoading(true);

    const { data } = await supabase
      .from("quotes")
      .select("*, partners(name, rif)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100);

    setQuotes((data as Quote[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchQuotes();
  }, [currentUser?.company_id]);

  const handleConvertToSale = async (quote: Quote) => {
    setConfirmModal({ isOpen: false, quote: null });
    setConvertingId(quote.id);

    const toastId = toast.loading("Convirtiendo presupuesto...");

    try {
      // 1+2. Obtener presupuesto e items en paralelo
      const [
        { data: fullQuote, error: qError },
        { data: items, error: iError },
      ] = await Promise.all([
        supabase.from("quotes").select("*").eq("id", quote.id).single(),
        supabase.from("quote_items").select("*").eq("quote_id", quote.id),
      ]);

      if (qError) throw qError;
      if (iError) throw iError;

      // 3. Obtener el usuario ID interno desde contexto
      const userId = currentUser?.id;
      if (!userId) throw new Error("Usuario no autenticado");

      // 4. Crear el Pedido (Order)
      const orderNumber = `PED-${Date.now().toString().slice(-6)}`;

      const { data: newOrder, error: oError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          partner_id: fullQuote.partner_id,
          company_id: fullQuote.company_id,
          user_id: userId,
          status: "pending",
          total_usd: fullQuote.total_usd,
          total_bs: fullQuote.total_bs,
          subtotal_usd: fullQuote.total_usd,
          tax_usd: 0,
          tax_bs: 0,
          currency: "USD",
          payment_type: "contado",
          payment_method: "Efectivo",
          amount_paid: 0,
          amount_due: fullQuote.total_usd,
          exchange_rate: fullQuote.total_bs > 0 && fullQuote.total_usd > 0
            ? fullQuote.total_bs / fullQuote.total_usd
            : 1,
          notes: `Convertido del presupuesto ${fullQuote.quote_number}. ${fullQuote.notes || ""}`
        })
        .select()
        .single();

      if (oError) throw oError;


      // 4. Crear los items del pedido y actualizar stock (en paralelo por item)
      await Promise.all(
        (items ?? []).map(async (item: any) => {
          await supabase.from("order_items").insert({
            order_id: newOrder.id,
            product_id: item.product_id,
            qty: item.qty,
            price_usd: item.price_usd,
            subtotal: item.subtotal,
          });
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (product) {
            await supabase
              .from("products")
              .update({ stock: product.stock - item.qty })
              .eq("id", item.product_id);
          }
        })
      );

      // 5. Marcar presupuesto como convertido
      await supabase
        .from("quotes")
        .update({
          status: "converted",
          converted_order_id: newOrder.id
        })
        .eq("id", quote.id);

      toast.success("¡Presupuesto convertido a venta con éxito!", { id: toastId });
      fetchQuotes();
    } catch (error: any) {
      console.error("Error converting quote:", error);
      toast.error("Error al convertir: " + error.message, { id: toastId });
    } finally {
      setConvertingId(null);
    }
  };

  const filtered = quotes.filter((q) => {
    const matchSearch =
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-[80vh] flex flex-col animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary text-text-1">Presupuestos & Cotizaciones</h1>
          <p className="text-text-2 mt-1 text-sm">Genera presupuestos profesionales y conviértelos en ventas en un clic.</p>
        </div>
        <Link
          href="/dashboard/ventas/presupuestos/nuevo"
          className="px-6 py-3 bg-brand-gradient text-white font-bold rounded-xl text-sm shadow-brand hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Presupuesto
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col flex-1 min-h-[500px]">
        {/* Barra de filtros */}
        <div className="p-4 border-b border-border bg-surface-base/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar por número o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "open", "converted", "expired"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${statusFilter === s
                    ? "bg-brand text-white border-brand shadow-sm"
                    : "text-text-2 border-border hover:border-brand/30 hover:bg-brand/5"
                  }`}
              >
                {s === "all" ? "Todos" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="overflow-y-auto flex-1 no-scrollbar p-0">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 text-text-2 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest"># Cotización</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Cliente</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Fecha Creación</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Vence</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Total</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-20"><Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-24">
                    <FileText className="w-12 h-12 text-text-3 mx-auto mb-3 opacity-40" />
                    <p className="text-text-2 font-medium">No hay presupuestos con esos filtros.</p>
                    <Link href="/dashboard/ventas/presupuestos/nuevo" className="mt-3 inline-flex items-center gap-1.5 text-brand text-sm font-semibold hover:underline">
                      <Plus className="w-4 h-4" /> Crear primer presupuesto
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => {
                  const { label, icon: Icon, color } = STATUS_CONFIG[q.status];
                  return (
                    <tr
                      key={q.id}
                      onClick={() => router.push(`/dashboard/ventas/presupuestos/${q.id}`)}
                      className="hover:bg-surface-hover/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-brand">
                          {q.quote_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-text-1">{q.partners?.name ?? "—"}</p>
                        <p className="text-xs text-text-3">{q.partners?.rif ?? ""}</p>
                      </td>
                      <td className="px-6 py-4 text-text-2">
                        {format(new Date(q.created_at), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-4 text-text-2">
                        {format(new Date(q.expires_at), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-text-1 block">{formatCurrency(q.total_usd)}</span>
                        <span className="text-[10px] text-text-3 block font-semibold">Bs. {formatCurrency(q.total_bs, "")}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${color}`}>
                          <Icon className="w-3 h-3" />{label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/dashboard/ventas/presupuestos/${q.id}/pdf`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-brand/10 text-text-3 hover:text-brand transition-colors"
                            title="Ver PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          {q.status === "open" && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, quote: q }); }}
                                disabled={convertingId !== null}
                                className="p-1.5 rounded-lg hover:bg-status-ok/10 text-text-3 hover:text-status-ok transition-colors disabled:opacity-50"
                                title="Convertir en venta"
                              >
                                {convertingId === q.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <Link
                                href={`/dashboard/ventas/presupuestos/nuevo?edit=${q.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg hover:bg-brand/10 text-text-3 hover:text-brand transition-colors"
                                title="Editar presupuesto"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </>
                          )}
                          <a
                            href={`https://wa.me/?text=Hola, adjunto su presupuesto ${q.quote_number} por ${formatCurrency(q.total_usd)}. Puedes verlo aquí: ${window.location.origin}/dashboard/ventas/presupuestos/${q.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-green-500/10 text-text-3 hover:text-green-500 transition-colors"
                            title="Enviar por WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, quote: null })}
        onConfirm={() => confirmModal.quote && handleConvertToSale(confirmModal.quote)}
        title="¿Convertir en Venta?"
        description={`Estás a punto de convertir el presupuesto ${confirmModal.quote?.quote_number} en una venta real. Se generará un pedido y se descontará el stock de los productos.`}
        confirmText="Sí, convertir ahora"
        cancelText="Volver profesional"
        variant="brand"
        loading={convertingId !== null}
      />
    </div>

  );
}
