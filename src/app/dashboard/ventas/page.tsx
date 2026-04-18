"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Loader2,
  Plus,
  MoreHorizontal,
  FileText,
  Printer,
  FileClock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/status-badge";
import { Semaforo } from "@/components/ui/semaforo";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThermalInvoiceModal, type InvoiceOrderData } from "@/components/ventas/thermal-invoice-modal";
import { useCompanyProfile } from "@/hooks/use-company-profile";

import { useUser } from "@/hooks/use-user";
import { useDataCache } from "@/lib/data-cache";

export default function VentasPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const companyId = user?.company_id || null;

  // ── Print Modal State ──────────────────────────────────
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [reprintOrder, setReprintOrder] = useState<InvoiceOrderData | null>(null);
  const [ivaPercent, setIvaPercent] = useState(16);

  const { company } = useCompanyProfile(companyId);

  const fetchOrders = useCallback(async () => {
    if (!companyId) return;

    const cacheKey = `ventas_${companyId}`;
    const cached = useDataCache.getState().get(cacheKey);
    if (cached) {
      setOrders(cached.orders);
      if (cached.ivaPercent !== undefined) setIvaPercent(cached.ivaPercent);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [{ data: companyData }, { data }] = await Promise.all([
      supabase.from("companies").select("settings").eq("id", companyId).single(),
      supabase
        .from("orders")
        .select(
          `*,
          partners (name, credit_status, rif, phone),
          order_items (qty, price_usd, products(name))`,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (companyData?.settings?.iva_percent !== undefined) {
      setIvaPercent(Number(companyData.settings.iva_percent));
    }

    setOrders(data || []);
    useDataCache.getState().set(cacheKey, { orders: data || [], ivaPercent: companyData?.settings?.iva_percent });
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Open reprint modal ─────────────────────────────────
  const handleReprint = (order: any) => {
    const items = (order.order_items ?? []).map((oi: any) => ({
      name: oi.products?.name ?? "Producto",
      qty: oi.qty,
      price_usd: oi.price_usd,
    }));

    const orderData: InvoiceOrderData = {
      id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      paymentMethod: order.payment_method ?? "efectivo_usd",
      paymentType: order.payment_type ?? "contado",
      totalUsd: order.total_usd ?? 0,
      totalBs: order.total_bs ?? 0,
      bcvRate: order.total_usd > 0 && order.total_bs > 0
        ? order.total_bs / order.total_usd
        : 0,
      items,
      client: order.partners
        ? {
            name: order.partners.name,
            rif: order.partners.rif ?? undefined,
            phone: order.partners.phone ?? undefined,
          }
        : null,
      invoiceNumber: order.invoice_number ?? undefined,
    };

    setReprintOrder(orderData);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto min-h-[80vh] flex flex-col animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-primary text-text-1">Ventas y Pedidos</h1>
          <p className="text-text-2 mt-1 text-xs sm:text-sm">
            Registro centralizado de cotizaciones y despachos.
          </p>
        </div>
        <Link
          href="/dashboard/ventas/nueva"
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-brand-gradient text-white font-bold rounded-xl text-xs sm:text-sm shadow-brand hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Venta
        </Link>
      </div>

      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card flex flex-col flex-1 min-h-[500px]">
        <div className="p-3 sm:p-4 border-b border-border bg-surface-base/50 flex justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar por número o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE LIST — cards apiladas (< md)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="md:hidden overflow-y-auto flex-1 no-scrollbar divide-y divide-border">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-6 text-text-2 text-sm">
              No hay pedidos registrados con esos filtros.
            </div>
          ) : (
            filtered.map((o) => {
              const isPaid =
                o.status === "completed" || o.status === "paid" || o.status === "despachado";
              const isContado = o.payment_type === "contado";
              const legacyBug = isPaid && isContado && Number(o.amount_paid || 0) === 0;
              const displayDue = legacyBug ? 0 : Number(o.amount_due || 0);
              return (
                <Link
                  key={o.id}
                  href={`/dashboard/ventas/${o.id}`}
                  className="block p-3 hover:bg-surface-hover/50 active:bg-surface-hover/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-brand text-sm">
                          {o.order_number}
                        </span>
                        <StatusBadge status={o.status || "draft"} />
                      </div>
                      {o.invoice_number && (
                        <div className="text-[10px] text-text-3 font-mono mt-0.5">
                          {o.invoice_number}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-text-1 text-sm">
                        {formatCurrency(o.total_usd)}
                      </div>
                      <div className="text-[10px] text-text-3 font-semibold">
                        Bs. {formatCurrency(o.total_bs, "")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Semaforo status={o.partners?.credit_status || "green"} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-1 text-sm truncate">
                        {o.partners?.name}
                      </p>
                      <p className="text-[10px] text-text-3 truncate">
                        {o.partners?.rif}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-text-3">
                      {format(new Date(o.created_at), "dd MMM yyyy", { locale: es })}
                    </span>
                    {displayDue > 0 && (
                      <span className="font-bold text-status-danger">
                        Debe {formatCurrency(displayDue)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReprint(o);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand/10 text-brand text-xs font-bold active:scale-95 transition-transform"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir
                    </button>
                    <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-base text-text-2 text-xs font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      Ver detalles
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            DESKTOP TABLE — tabla tradicional (md+)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="hidden md:block overflow-y-auto flex-1 no-scrollbar p-0">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base/80 text-text-2 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest"># Pedido</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Clte / Razón Social</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Fecha Emisión</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Total Monto</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Deuda</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <div className="space-y-0">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 border-b border-border/30 flex items-center gap-6">
                          <div className="skeleton h-4 w-24 rounded" />
                          <div className="flex items-center gap-2 flex-1"><div className="skeleton w-3 h-3 rounded-full" /><div className="skeleton h-4 w-32 rounded" /></div>
                          <div className="skeleton h-4 w-20 rounded" />
                          <div className="skeleton h-4 w-16 rounded" />
                          <div className="skeleton h-4 w-16 rounded" />
                          <div className="skeleton h-6 w-20 rounded-full" />
                          <div className="skeleton h-8 w-8 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-24 text-text-2">
                    No hay pedidos registrados con esos filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((o, idx) => (
                  <tr
                    key={o.id}
                    className="hover:bg-surface-hover/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/ventas/${o.id}`}
                        className="font-mono font-bold text-brand hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      {o.invoice_number && (
                        <div className="text-[9px] text-text-3 font-mono">{o.invoice_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Semaforo status={o.partners?.credit_status || "green"} />
                        <div>
                          <p className="font-semibold text-text-1">{o.partners?.name}</p>
                          <p className="text-xs text-text-3">{o.partners?.rif}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-2">
                      {format(new Date(o.created_at), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-text-1 block">{formatCurrency(o.total_usd)}</span>
                      <span className="text-[10px] text-text-3 block font-semibold">
                        Bs. {formatCurrency(o.total_bs, "")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(() => {
                        const isPaid =
                          o.status === "completed" || o.status === "paid" || o.status === "despachado";
                        const isContado = o.payment_type === "contado";
                        const legacyBug = isPaid && isContado && Number(o.amount_paid || 0) === 0;
                        const displayDue = legacyBug ? 0 : Number(o.amount_due || 0);
                        const displayPaid = legacyBug ? Number(o.total_usd) : Number(o.amount_paid || 0);
                        return (
                          <>
                            <span
                              className={`font-bold text-sm block ${
                                displayDue > 0 ? "text-status-danger" : "text-status-ok"
                              }`}
                            >
                              {formatCurrency(displayDue)}
                            </span>
                            <span className="text-[10px] text-text-3 block font-semibold transition-colors">
                              Abono {formatCurrency(displayPaid)}
                            </span>
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={o.status || "draft"} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* ── REPRINT BUTTON ── */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReprint(o);
                          }}
                          title="Reimprimir documento"
                          className="p-2 hover:bg-brand/10 rounded-xl transition-colors text-text-3 hover:text-brand group-hover:opacity-100"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-2 hover:bg-surface-base rounded-xl transition-colors text-text-3 hover:text-text-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-5 h-5 mx-auto" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-surface-elevated border border-border w-56 text-sm shadow-brand p-1"
                          >
                            {(o.status === "draft" || o.status === "pending") && (
                              <DropdownMenuItem
                                asChild
                                className="hover:bg-brand/10 focus:bg-brand/10 cursor-pointer rounded-lg mb-1"
                              >
                                <Link
                                  href={`/dashboard/ventas/nueva?edit=${o.id}`}
                                  className="flex items-center gap-2 text-text-1 w-full"
                                >
                                  <FileText className="w-4 h-4 text-brand" /> Editar Presupuesto
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              asChild
                              className="hover:bg-brand/10 focus:bg-brand/10 cursor-pointer rounded-lg mb-1"
                            >
                              <Link
                                href={`/dashboard/ventas/${o.id}`}
                                className="flex items-center gap-2 text-text-1 w-full"
                              >
                                <FileText className="w-4 h-4 text-text-3" /> Ver Detalles de Venta
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                              className="hover:bg-brand/10 focus:bg-brand/10 cursor-pointer rounded-lg mb-1"
                            >
                              <Link
                                href={`/dashboard/ventas/${o.id}`}
                                className="flex items-center gap-2 text-text-1 w-full"
                              >
                                <FileClock className="w-4 h-4 text-text-3" /> Historial de Venta
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                              className="hover:bg-brand/10 focus:bg-brand/10 cursor-pointer rounded-lg"
                            >
                              <Link
                                href={`/dashboard/ventas/${o.id}/nota-entrega`}
                                className="flex items-center gap-2 text-text-1 w-full"
                              >
                                <Printer className="w-4 h-4 text-text-3" /> Descargar Nota
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── REPRINT MODAL ── */}
      {printModalOpen && reprintOrder && (
        <ThermalInvoiceModal
          open={printModalOpen}
          onClose={() => {
            setPrintModalOpen(false);
            setReprintOrder(null);
          }}
          order={reprintOrder}
          company={company}
        />
      )}
    </div>
  );
}
