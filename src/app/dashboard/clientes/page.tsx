"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Loader2 } from "lucide-react";
import { Semaforo } from "@/components/ui/semaforo";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientForm } from "@/components/clients/client-form";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

export default function ClientesPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const fetchPartners = async () => {
    const companyId = user?.company_id;
    if (!companyId) return;
    setLoading(true);

    const { data } = await supabase
      .from("partners")
      .select(
        `
                id, name, rif, phone, whatsapp, zone, credit_status, assigned_user_id,
                users (full_name),
                receivables (balance_usd)
            `,
      )
      .eq("company_id", companyId)
      .order("name", { ascending: true });

    const partnersWithBalance = (data || []).map((p: any) => ({
      ...p,
      total_debt:
        p.receivables?.reduce(
          (acc: number, r: any) => acc + Number(r.balance_usd),
          0,
        ) || 0,
    }));

    setPartners(partnersWithBalance);
    setLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, [user?.company_id]);

  const filtered = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.rif && p.rif.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-[80vh] flex flex-col pb-8">
      <ClientForm
        open={formOpen}
        setOpen={setFormOpen}
        onSuccess={fetchPartners}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-primary">
            Directorio de Clientes
          </h1>
          <p className="text-text-2 mt-1 text-sm">
            Fichas 360° de comercios y distribuidores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-brand-gradient text-white font-semibold rounded-xl text-sm shadow-brand hover:opacity-90 transition-opacity"
          >
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card transition-all flex flex-col flex-1 min-h-[500px]">
        <div className="p-4 border-b border-white/5 bg-surface-card/40 flex justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Buscar por nombre o RIF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border border-border/40 bg-surface-input text-text-1 placeholder:text-text-3 focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 no-scrollbar p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-base/80 text-text-2 sticky top-0 z-10 backdrop-blur-lg border-b-2 border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase text-xs">
                  Clte / Razón Social
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs">
                  Contacto
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs">
                  Zona / Vendedor
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs text-right">
                  Deuda Total
                </th>
                <th className="px-6 py-4 font-semibold uppercase text-xs text-center">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-24 text-text-2">
                    No hay clientes registrados con esos filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-hover hover:border-brand/15 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Semaforo status={p.credit_status || "green"} />
                        <Avatar className="h-10 w-10 border border-brand/20 shadow-brand">
                          <AvatarFallback className="bg-surface-card text-brand font-bold text-sm">
                            {p.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/dashboard/clientes/${p.id}`}
                            className="font-semibold text-text-1 hover:text-brand transition-colors block"
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-text-3">{p.rif}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.whatsapp && (
                        <a
                          href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-status-ok hover:underline block mb-1"
                        >
                          {p.whatsapp}
                        </a>
                      )}
                      <span className="text-text-2 text-xs">{p.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-text-1">{p.zone || "Sin Zona"}</p>
                      <p className="text-xs text-text-3">
                        {p.users?.full_name || "Sin asignar"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-bold text-base ${p.total_debt > 0 ? "text-status-danger" : "text-status-ok"}`}
                      >
                        {formatCurrency(p.total_debt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/clientes/${p.id}`}
                          className="px-4 py-2 bg-surface-base border border-border text-text-2 rounded-lg hover:bg-surface-base hover:text-text-1 hover:border-text-1 transition-all text-xs font-bold"
                        >
                          Ver Ficha
                        </Link>
                        <Link
                          href={`/dashboard/ventas/nueva?partner_id=${p.id}`}
                          className="px-4 py-2 bg-brand/10 text-brand border border-brand/20 rounded-lg hover:bg-brand hover:text-white transition-all text-xs font-bold"
                        >
                          Facturar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
