"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft, FileText, CheckCircle, Clock, XCircle,
  User, Calendar, Package, Send, Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_CONFIG = {
  open:      { label: "Vigente",    Icon: Clock,        color: "text-status-ok border-status-ok/30 bg-status-ok/10" },
  expired:   { label: "Vencida",   Icon: XCircle,      color: "text-status-danger border-status-danger/30 bg-status-danger/10" },
  converted: { label: "Convertida", Icon: CheckCircle,  color: "text-brand border-brand/30 bg-brand/10" },
};

export default function QuoteDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [id, setId] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve dynamic params
  useEffect(() => {
    async function resolve() {
      const resolved = await params;
      setId(resolved.id);
    }
    resolve();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function fetchQuote() {
      setLoading(true);
      try {
        const [quoteRes, itemsRes] = await Promise.all([
          supabase
            .from("quotes")
            .select(`*, partners(name, rif, phone, whatsapp, city), users(full_name)`)
            .eq("id", id!)
            .single(),
          supabase
            .from("quote_items")
            .select(`*, products(name, sku)`)
            .eq("quote_id", id!),
        ]);

        if (quoteRes.error || !quoteRes.data) {
          toast.error("No se encontró el presupuesto.");
          router.back();
          return;
        }

        setQuote(quoteRes.data);
        setItems(itemsRes.data || []);
      } catch {
        toast.error("Error al cargar el presupuesto.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [id]);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" />
      </div>
    );
  }

  if (!quote) return null;

  const { label, Icon: StatusIcon, color } = STATUS_CONFIG[quote.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open;
  const partner = quote.partners;
  const seller = quote.users;
  const phoneRaw = (partner?.whatsapp ?? partner?.phone ?? "").replace(/\D/g, "");

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-20 px-4 lg:px-0">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-1 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xs font-bold text-text-2 font-outfit uppercase tracking-[0.2em]">
              Detalle de Cotización
            </h2>
            <p className="text-text-1 font-primary font-bold text-2xl leading-tight">{quote.quote_number}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {label}
        </span>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client */}
        <Card className="p-5 bg-surface-card border-border shadow-card space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-2 font-outfit flex items-center gap-1.5">
            <User className="w-3 h-3" /> Cliente
          </p>
          <p className="text-text-1 font-bold text-lg font-primary">{partner?.name ?? "—"}</p>
          <p className="text-xs text-text-1 font-mono">{partner?.rif ?? ""}</p>
          {partner?.city && <p className="text-xs text-text-2 font-outfit">{partner.city}</p>}
        </Card>

        {/* Seller */}
        <Card className="p-5 bg-surface-card border-border shadow-card space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-2 font-outfit flex items-center gap-1.5">
            <User className="w-3 h-3" /> Vendedor
          </p>
          <p className="text-text-1 font-bold text-lg font-primary">{seller?.full_name ?? "—"}</p>
        </Card>

        {/* Dates */}
        <Card className="p-5 bg-surface-card border-border shadow-card space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-2 font-outfit flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Fechas
          </p>
          <p className="text-xs text-text-2 font-outfit">
            Creado:{" "}
            <span className="text-text-1 font-bold">
              {format(new Date(quote.created_at), "dd MMM yyyy", { locale: es })}
            </span>
          </p>
          <p className="text-xs text-text-2 font-outfit">
            Vence:{" "}
            <span className="text-text-1 font-bold">
              {format(new Date(quote.expires_at), "dd MMM yyyy", { locale: es })}
            </span>
          </p>
        </Card>
      </div>

      {/* Items table */}
      <Card className="bg-surface-card border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Package className="w-4 h-4 text-brand" />
          <h3 className="font-bold text-text-1 text-sm font-primary">Productos Cotizados</h3>
          <span className="ml-auto text-xs text-text-1 font-mono bg-brand/5 px-2 py-0.5 rounded-md">{items.length} ítem(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-base/60 text-text-2 text-[10px] font-outfit uppercase tracking-widest">
              <tr>
                <th className="px-5 py-3 text-left font-bold">Producto</th>
                <th className="px-5 py-3 text-left font-bold">SKU</th>
                <th className="px-5 py-3 text-right font-bold">Cant.</th>
                <th className="px-5 py-3 text-right font-bold">Precio Unit.</th>
                <th className="px-5 py-3 text-right font-bold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-text-2 font-outfit">
                    Sin productos registrados.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="px-5 py-3 text-text-1 font-bold font-primary">
                      {item.product_name ?? item.products?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-text-2 font-mono text-xs">
                      {item.product_sku ?? item.products?.sku ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-text-1 font-bold">{item.qty}</td>
                    <td className="px-5 py-3 text-right text-text-1 font-outfit">{formatCurrency(item.price_usd)}</td>
                    <td className="px-5 py-3 text-right font-bold text-text-1 font-primary text-base">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals footer */}
        <div className="p-5 border-t border-border/60 bg-surface-base/30 flex justify-end">
          <div className="space-y-1 text-right">
            <p className="text-xs text-text-2 font-bold font-outfit uppercase tracking-tighter">Total USD</p>
            <p className="text-4xl font-bold text-text-1 font-primary tracking-tight">{formatCurrency(quote.total_usd)}</p>
            <p className="text-sm text-text-2 font-mono font-bold">Bs. {formatCurrency(quote.total_bs, "")}</p>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card className="p-5 bg-surface-card border-border shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-2 font-outfit mb-2">Observaciones</p>
          <p className="text-text-1 text-sm leading-relaxed font-outfit">{quote.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/ventas/presupuestos/${quote.id}/pdf`}
          target="_blank"
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-border text-text-1 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all"
        >
          <FileText className="w-4 h-4" />
          Ver PDF
        </Link>

        {phoneRaw && (
          <a
            href={`https://wa.me/${phoneRaw}?text=${encodeURIComponent(`Hola ${partner?.name ?? ""} 👋, adjunto tu cotización ${quote.quote_number} por ${formatCurrency(quote.total_usd)}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Send className="w-4 h-4" />
            Enviar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
