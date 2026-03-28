"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { notFound, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Semaforo } from "@/components/ui/semaforo";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Edit2, Loader2, SendHorizonal, Briefcase, Flame } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";
import { formatCurrency } from "@/lib/utils";
import { generatePortalToken } from "@/lib/actions/portal";
import { toast } from "sonner";

export default function ClientDetailsPage({ params }: { params: any }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [sendingPortal, setSendingPortal] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const supabase = createClient();

  const handleSendPortal = async () => {
    if (!clientData) return;
    setSendingPortal(true);
    try {
      const { url } = await generatePortalToken(clientData.id);
      const phone = (clientData.whatsapp ?? clientData.phone ?? "").replace(
        /\D/g,
        "",
      );
      const msg = encodeURIComponent(
        `Hola ${clientData.name} 👋\n\nAquí puedes ver y registrar tus pagos pendientes:\n\n${url}\n\n_El link es válido por 30 días._`,
      );
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
      toast.success("¡Link de portal generado!");
    } catch {
      toast.error("No se pudo generar el link");
    } finally {
      setSendingPortal(false);
    }
  };

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    }
    resolveParams();
  }, [params]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    const { data: rawClient, error } = await supabase
      .from("partners")
      .select(`*, users (full_name)`)
      .eq("id", id)
      .single();

    if (error || !rawClient) {
      setLoading(false);
      return;
    }
    setClientData(rawClient);

    // Buscar historial
    const [ordersRes, recesRes, opsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("total_usd", { count: "exact" })
        .eq("partner_id", id),
      supabase
        .from("receivables")
        .select("*")
        .eq("partner_id", id)
        .neq("status", "paid"),
      supabase
        .from("crm_oportunidades")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false })
    ]);

    setOrderCount(ordersRes.count || 0);
    setTotalVentas(
      ordersRes.data?.reduce(
        (acc: number, cur: any) => acc + Number(cur.total_usd),
        0,
      ) || 0,
    );
    const currentDebt =
      recesRes.data?.reduce(
        (acc: number, cur: any) => acc + Number(cur.balance_usd),
        0,
      ) || 0;
    setTotalDebt(currentDebt);
    setReceivables(recesRes.data || []);
    setOportunidades(opsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" />
      </div>
    );
  if (!clientData) return notFound();

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      <ClientForm
        open={editOpen}
        setOpen={setEditOpen}
        client={clientData}
        onSuccess={fetchData}
      />

      {/* BARRA DE NAVEGACION SUPERIOR */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-3 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-medium text-text-3 uppercase tracking-widest">
            Ficha de Cliente
          </h2>
        </div>
      </div>

      {/* 1. HEADER FICHA 360 */}
      <Card className="p-8 bg-surface-card border-border-brand shadow-brand flex flex-col md:flex-row justify-between items-start gap-6 relative overflow-hidden">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-4xl font-syne font-bold text-white shadow-brand-lg">
            {clientData.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-primary">
                {clientData.name}
              </h1>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-text-3 font-mono">
                {clientData.rif}
              </span>
            </div>
            <p className="text-text-2 mt-1 font-medium">
              {clientData.trade_name || "Comercio / Distribuidor"}
            </p>

            <div className="mt-3 flex items-center gap-4 bg-surface-base px-4 py-2 border border-border rounded-xl w-fit">
              <Semaforo status={clientData.credit_status} showLabel />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Editar Ficha
            </button>
            {clientData.whatsapp && (
              <a
                href={`https://wa.me/${clientData.whatsapp.replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(clientData.name)},%20te%20escribimos%20de%20LUMIS...`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 md:flex-none flex items-center justify-center p-3 bg-[#25D366] text-white rounded-xl shadow-[0_0_15px_rgba(37,211,102,0.4)] hover:opacity-90"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            )}
          </div>
          <button
            onClick={() =>
              router.push(`/dashboard/ventas/nueva?partner_id=${clientData.id}`)
            }
            className="w-full px-6 py-3 bg-brand-gradient text-white rounded-xl shadow-brand font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Nuevo Pedido Rápido
          </button>
          <button
            onClick={handleSendPortal}
            disabled={sendingPortal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                                   bg-[rgba(37,211,102,0.08)] border border-[rgba(37,211,102,0.20)]
                                   text-[#25D366] hover:bg-[rgba(37,211,102,0.15)] transition-all
                                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="w-4 h-4" />
            {sendingPortal ? "Generando..." : "💬 Enviar Portal de Pago"}
          </button>
        </div>
      </Card>

      {/* 2. SMART BUTTONS / KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Card className="p-5 bg-surface-card border-border shadow-card hover:border-brand/20 transition-all">
          <p className="text-sm text-text-3 mb-1">Ventas Históricas</p>
          <p className="text-2xl font-bold font-syne text-white">
            {formatCurrency(totalVentas)}
          </p>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-card hover:border-status-danger/20 transition-all">
          <p className="text-sm text-text-3 mb-1">Deuda Actual</p>
          <p
            className={`text-2xl font-bold font-syne ${totalDebt > 0 ? "text-status-danger" : "text-status-ok"}`}
          >
            {formatCurrency(totalDebt)}
          </p>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-card hover:border-brand/20 transition-all">
          <p className="text-sm text-text-3 mb-1">Total Pedidos</p>
          <p className="text-2xl font-bold font-syne text-white">
            {orderCount}
          </p>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-card hover:border-brand/20 transition-all">
          <p className="text-sm text-text-3 mb-1">Última Compra</p>
          <p className="text-lg font-bold text-white">
            {clientData.last_order_at
              ? format(new Date(clientData.last_order_at), "dd MMM yyyy", {
                  locale: es,
                })
              : "Bajo"}
          </p>
        </Card>
      </div>

      <div className="flex border-b border-white/10 gap-6 mt-4">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 font-semibold uppercase tracking-widest text-sm transition-all border-b-2 ${
            activeTab === "general"
              ? "border-brand text-brand"
              : "border-transparent text-text-3 hover:text-text-2"
          }`}
        >
          Información General
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={`pb-3 font-semibold uppercase tracking-widest text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "crm"
              ? "border-brand text-brand"
              : "border-transparent text-text-3 hover:text-text-2"
          }`}
        >
          <Briefcase className="w-4 h-4" /> CRM
        </button>
      </div>

      {/* 3. CONTENIDO DE PESTAÑAS */}
      {activeTab === "general" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
        <div className="lg:col-span-2">
          <Card className="p-6 bg-surface-card border-border shadow-card h-full">
            <h3 className="text-xl font-primary mb-4">
              Información de Contacto
            </h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3">
                <span className="text-text-3">Teléfono / Celular</span>
                <span className="text-white col-span-2 font-medium">
                  {clientData.phone || "No registrado"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3">
                <span className="text-text-3">Correo Electrónico</span>
                <span className="text-brand col-span-2 font-medium">
                  {clientData.email || "No registrado"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3">
                <span className="text-text-3">Dirección</span>
                <span className="text-white col-span-2">
                  {clientData.address || "No registrado"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3">
                <span className="text-text-3">Zona / Ubicación</span>
                <span className="text-white col-span-2">
                  {clientData.zone || "No registrado"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 pb-1">
                <span className="text-text-3">Vendedor</span>
                <span className="text-brand font-semibold col-span-2">
                  {clientData.users?.full_name || "No registrado"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 bg-surface-card border-border shadow-card h-full">
            <h3 className="text-lg font-primary mb-4 flex justify-between items-center">
              Facturas Pen.
              <span className="bg-status-danger/10 text-status-danger px-2 py-0.5 rounded-md text-xs">
                {receivables.length}
              </span>
            </h3>
            <div className="space-y-4">
              {receivables.length === 0 ? (
                <p className="text-sm text-text-3">
                  No hay facturas pendientes.
                </p>
              ) : (
                receivables.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center hover:border-brand/20 transition-all"
                  >
                    <div>
                      <p className="text-sm text-text-1 font-mono font-bold">
                        {r.invoice_number}
                      </p>
                      <p className="text-xs text-status-danger mt-1">
                        Vence: {format(new Date(r.due_date), "dd/MM/yy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {formatCurrency(r.balance_usd)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
      )}

      {activeTab === "crm" && (
        <div className="animate-in slide-in-from-bottom-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-primary">Oportunidades Abiertas</h3>
            <button 
              onClick={() => router.push("/dashboard/crm")}
              className="text-brand text-sm font-semibold hover:underline"
            >
              Ir al Kanban →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oportunidades.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-surface-card border border-border border-dashed rounded-xl text-text-3">
                No hay oportunidades registradas para este cliente.
              </div>
            ) : (
              oportunidades.map(op => {
                const scoreColor = op.score < 40 ? "text-status-danger" : op.score < 70 ? "text-status-warning" : "text-status-ok";
                return (
                  <Card key={op.id} className="p-5 bg-surface-card border-border hover:border-brand/40 transition-colors cursor-pointer" onClick={() => router.push("/dashboard/crm")}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase font-bold text-text-3 tracking-widest bg-surface-hover/10 px-2 py-1 rounded-md">
                        {op.etapa.replace('_', ' ')}
                      </span>
                      <span className={`flex items-center gap-1 font-bold text-xs ${scoreColor}`}>
                        <Flame className="w-3 h-3" /> {op.score}
                      </span>
                    </div>
                    <h4 className="text-text-1 font-bold text-sm mb-3 min-h-[40px]">{op.titulo}</h4>
                    <div className="flex items-end justify-between border-t border-border pt-3 mt-auto">
                      <div>
                        <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest block">Monto</span>
                        <span className="font-syne font-bold text-lg text-brand">{formatCurrency(op.monto_estimado)}</span>
                      </div>
                      <div className="bg-surface-elevated text-text-3 px-2 py-0.5 rounded text-[10px] font-mono">
                        {format(new Date(op.created_at), "dd MMM")}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
