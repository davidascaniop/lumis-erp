"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User as UserIcon, DollarSign, ShoppingBag, ArrowRight, AlertTriangle,
  CreditCard, ExternalLink
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Chat } from "@/hooks/use-chats";

interface ClientContextProps {
  chat: Chat;
}

export function ClientContext({ chat }: ClientContextProps) {
  const router = useRouter();
  const supabase = createClient();
  const partner = chat.partner as any;

  const [financials, setFinancials] = useState<{
    totalDebt: number;
    totalBought: number;
    orders: any[];
    creditLimit: number;
  }>({ totalDebt: 0, totalBought: 0, orders: [], creditLimit: 0 });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner?.id) {
      setLoading(false);
      return;
    }

    async function loadFinancials() {
      setLoading(true);
      const [recRes, ordRes] = await Promise.all([
        supabase.from("receivables").select("balance_usd, status").eq("partner_id", partner.id),
        supabase
          .from("orders")
          .select("id, order_number, total_usd, status, created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const totalDebt = (recRes.data || []).reduce(
        (acc: number, r: any) => acc + Number(r.balance_usd),
        0
      );
      const totalBought = (ordRes.data || []).reduce(
        (acc: number, o: any) => acc + Number(o.total_usd),
        0
      );

      setFinancials({
        totalDebt,
        totalBought,
        orders: ordRes.data || [],
        creditLimit: (partner as any).credit_limit || 0,
      });
      setLoading(false);
    }

    loadFinancials();
  }, [partner?.id]);

  const hasDebt = financials.totalDebt > 0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 overflow-y-auto">
      {/* Profile Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-brand/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-bold text-lg shrink-0">
            {partner ? partner.name?.substring(0, 2).toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">
              {partner?.name || chat.contact_name || "Cliente desconocido"}
            </h3>
            {partner?.rif && (
              <p className="text-[11px] text-gray-500 font-mono">{partner.rif}</p>
            )}
            {partner?.id && (
              <button
                onClick={() => router.push(`/dashboard/clientes/${partner.id}`)}
                className="mt-1 text-[10px] text-brand font-semibold flex items-center gap-1 hover:underline"
              >
                Ver ficha completa <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Financial Widget */}
      <div className="p-4 space-y-3 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Cifras Clave
        </p>

        {/* Debt */}
        <div
          className={`rounded-xl p-3 border flex items-center gap-3 ${
            hasDebt ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
          }`}
        >
          <AlertTriangle className={`w-4 h-4 shrink-0 ${hasDebt ? "text-red-500" : "text-green-500"}`} />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Deuda Total</p>
            <p className={`text-lg font-bold ${hasDebt ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(financials.totalDebt)}
            </p>
          </div>
        </div>

        {/* Credit limit */}
        <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 flex items-center gap-3">
          <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Comprado</p>
            <p className="text-base font-bold text-gray-800">{formatCurrency(financials.totalBought)}</p>
          </div>
        </div>
      </div>

      {/* Last 3 Orders */}
      <div className="p-4 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Últimos Pedidos
        </p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : financials.orders.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin pedidos registrados</p>
        ) : (
          <div className="space-y-2">
            {financials.orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/dashboard/ventas/${order.id}`)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-brand/5 hover:border-brand/20 transition-all group"
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-brand font-mono">#{order.order_number}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(order.created_at).toLocaleDateString("es", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-800">{formatCurrency(order.total_usd)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Acciones Rápidas
        </p>
        <button
          onClick={() =>
            router.push(`/dashboard/ventas/nueva${partner?.id ? `?partner_id=${partner.id}` : ""}`)
          }
          className="w-full flex items-center justify-between px-4 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-brand"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Crear Venta
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            router.push(`/dashboard/cobranza${partner?.rif ? `?search=${partner.rif}` : ""}`)
          }
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <span className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Registrar Cobro
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
