"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
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

export default function VentasPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rawUserData } = await supabase
      .from("users")
      .select("company_id")
      .eq("auth_id", user.id)
      .single();
    if (!rawUserData) return;
    const userData = rawUserData as any;

    const { data } = await supabase
      .from("orders")
      .select(
        `
                *,
                partners (name, credit_status, rif)
            `,
      )
      .eq("company_id", userData.company_id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.partners?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary">
            Ventas y Pedidos
          </h1>
          <p className="text-text-2 mt-1text-sm">
            Registro centralizado de cotizaciones y despachos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ventas/nueva"
            className="px-6 py-3 bg-brand-gradient text-white font-bold rounded-xl text-sm shadow-brand hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Link>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-card flex flex-col h-[70vh]">
        <div className="p-4 border-b border-white/5 bg-surface-card/40 flex justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar por número o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-none bg-surface-input text-white placeholder:text-text-3"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 no-scrollbar p-0">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-card/80 text-text-3 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">
                  # Pedido
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">
                  Clte / Razón Social
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">
                  Fecha Emisión
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">
                  Total Monto
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">
                  Deuda
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">
                  Estado
                </th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-center">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
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
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-surface-hover hover:border-brand/15 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/ventas/${o.id}`}
                        className="font-mono font-bold text-brand hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Semaforo
                          status={o.partners?.credit_status || "green"}
                        />
                        <div>
                          <p className="font-semibold text-text-1">
                            {o.partners?.name}
                          </p>
                          <p className="text-xs text-text-3">
                            {o.partners?.rif}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-2">
                      {format(new Date(o.created_at), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-white block">
                        {formatCurrency(o.total_usd)}
                      </span>
                      <span className="currency-bs">
                        Bs. {formatCurrency(o.total_bs, "")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-bold text-sm block ${Number(o.amount_due) > 0 ? "text-status-danger" : "text-status-ok"}`}
                      >
                        {formatCurrency(o.amount_due)}
                      </span>
                      <span className="currency-bs">
                        Abono: {formatCurrency(o.amount_paid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={o.status || "draft"} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-3 hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-5 h-5 mx-auto" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-surface-card border-border w-56 text-sm shadow-brand p-1"
                        >
                          <DropdownMenuItem
                            asChild
                            className="hover:bg-brand/20 focus:bg-brand/20 cursor-pointer rounded-lg mb-1"
                          >
                            <Link
                              href={`/dashboard/ventas/${o.id}`}
                              className="flex items-center gap-2 text-white w-full"
                            >
                              <FileText className="w-4 h-4 text-brand" /> Ver
                              Detalles de Venta
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="hover:bg-brand/20 focus:bg-brand/20 cursor-pointer rounded-lg mb-1"
                          >
                            <Link
                              href={`/dashboard/ventas/${o.id}`}
                              className="flex items-center gap-2 text-white w-full"
                            >
                              <FileClock className="w-4 h-4 text-text-3 group-hover:text-brand" />{" "}
                              Historial de Compra
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="hover:bg-brand/20 focus:bg-brand/20 cursor-pointer rounded-lg"
                          >
                            <Link
                              href={`/dashboard/ventas/${o.id}/nota-entrega`}
                              className="flex items-center gap-2 text-white w-full"
                            >
                              <Printer className="w-4 h-4 text-text-3 group-hover:text-brand" />{" "}
                              Descargar Nota de Entrega
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
