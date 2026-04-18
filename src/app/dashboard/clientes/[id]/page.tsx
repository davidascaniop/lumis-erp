"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { notFound, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Semaforo } from "@/components/ui/semaforo";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ArrowLeft, Edit2, Loader2, SendHorizonal, Briefcase, Flame, 
  ShoppingBag, DollarSign, Eye, FileText, Search,
  Phone, MapPin, User as UserIcon, Send, Download
} from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";
import { formatCurrency } from "@/lib/utils";
import { generatePortalToken } from "@/lib/actions/portal";
import { toast } from "sonner";

export default function ClientDetailsPage({ params }: { params: any }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [sendingPortal, setSendingPortal] = useState(false);
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

    // Una sola query a orders con count + data completa (antes eran 2)
    const [ordersRes, recesRes, opsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("partner_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("receivables")
        .select("*")
        .eq("partner_id", id),
      supabase
        .from("crm_oportunidades")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false }),
    ]);

    const ordersData = ordersRes.data || [];
    setOrderCount(ordersRes.count ?? ordersData.length);
    setTotalVentas(
      ordersData.reduce(
        (acc: number, cur: any) => acc + Number(cur.total_usd || 0),
        0,
      ),
    );
    const currentDebt =
      recesRes.data?.reduce(
        (acc: number, cur: any) => acc + Number(cur.balance_usd),
        0,
      ) || 0;
    setTotalDebt(currentDebt);
    setReceivables(recesRes.data || []);
    setOportunidades(opsRes.data || []);
    setOrders(ordersData);
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

  const phoneRaw = (clientData.whatsapp ?? clientData.phone ?? "").replace(/\D/g, "");

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-20 px-4 lg:px-0">
      <ClientForm
        open={editOpen}
        setOpen={setEditOpen}
        client={clientData}
        onSuccess={fetchData}
      />

      {/* NAVEGACIÓN SUPERIOR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-3 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xs font-bold text-text-3 uppercase tracking-[0.2em]">
            Expediente del Cliente
          </h2>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-text-2 rounded-xl text-sm font-semibold hover:text-white hover:bg-white/10 transition-all shadow-sm"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Editar Perfil
        </button>
      </div>

      {/* 1. CABECERA DE ACCIÓN */}
      <Card className="p-6 bg-surface-card border-border shadow-card relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-3xl font-syne font-bold text-white shadow-brand/30 shadow-xl border border-white/10">
              {clientData.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-primary text-text-1">
                  {clientData.name}
                </h1>
                <span className="px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md text-[10px] text-brand font-mono font-bold tracking-wider">
                  {clientData.rif}
                </span>
              </div>
              <p className="text-text-3 text-sm font-medium mt-1">
                {clientData.trade_name || "Comercio Registrado"} • <span className="text-text-2">{clientData.city || "Sin ciudad"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {clientData.whatsapp && (
              <a
                href={`https://wa.me/${phoneRaw}?text=Hola%20${encodeURIComponent(clientData.name)},%20te%20escribimos%20de%20LUMIS...`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="bg-white/20 p-1 rounded-md">
                   <Send className="w-3 h-3" />
                </div>
                WhatsApp
              </a>
            )}
            <button
              onClick={() => router.push(`/dashboard/ventas/nueva?partner_id=${clientData.id}`)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-brand-gradient text-white rounded-xl text-sm font-bold shadow-brand hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Nuevo Pedido
            </button>
            <button
              onClick={() => router.push(`/dashboard/cobranza?search=${clientData.rif}`)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/5 border border-border text-text-1 rounded-xl text-sm font-bold hover:bg-white/10 hover:border-text-3 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              Registrar Cobro
            </button>
          </div>
        </div>
      </Card>

      {/* 2. LAS CIFRAS DE ORO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        <Card className="p-6 bg-surface-card border-border shadow-card hover:border-status-danger/20 transition-all border-l-4 border-l-status-danger group">
          <p className="text-[10px] text-text-1 font-bold font-outfit uppercase tracking-[0.2em] mb-2 transition-colors">Deuda Pendiente</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-status-danger">
              {formatCurrency(totalDebt)}
            </span>
          </div>
        </Card>
        
        <Card className="p-6 bg-surface-card border-border shadow-card hover:border-blue-500/20 transition-all border-l-4 border-l-blue-500 group">
          <p className="text-[10px] text-text-1 font-bold font-outfit uppercase tracking-[0.2em] mb-2 transition-colors">Saldo a Favor</p>
          <p className="text-3xl font-bold text-blue-500">
            {formatCurrency(clientData.current_balance < 0 ? Math.abs(clientData.current_balance) : 0)}
          </p>
        </Card>

        <Card className="p-6 bg-surface-card border-border shadow-card hover:border-brand/20 transition-all border-l-4 border-l-brand group">
          <p className="text-[10px] text-text-1 font-bold font-outfit uppercase tracking-[0.2em] mb-2 transition-colors">Total Comprado</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-text-1">
              {formatCurrency(totalVentas)}
            </p>
            {totalVentas > 1000 && (
              <span className="px-2 py-0.5 bg-brand/10 text-brand text-[9px] font-black rounded-md border border-brand/20 animate-pulse">
                CLIENTE VIP
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* 3. CONTENIDO PRINCIPAL (DUE COLUMN LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LADO IZQUIERDO: INFORMACIÓN DE CONTACTO */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-surface-card border-border shadow-card">
            <h3 className="text-sm font-bold text-text-1 font-outfit uppercase tracking-widest mb-6 border-b border-border pb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-brand" />
              Información de Enlace
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-surface-base border border-border">
                  <Phone className="w-4 h-4 text-text-3" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-3 uppercase mb-0.5">Teléfono Movil</p>
                  <p className="text-sm font-semibold text-text-1">{clientData.phone || "No registrado"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-surface-base border border-border">
                  <MapPin className="w-4 h-4 text-text-3" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-3 uppercase mb-0.5">Dirección de Entrega</p>
                  <p className="text-sm text-text-2 leading-relaxed">{clientData.address || "No registrada"}</p>
                  {clientData.zone && (
                    <span className="mt-2 inline-block px-2 py-0.5 bg-surface-base border border-border rounded text-[10px] text-text-3 font-medium uppercase">
                      Zona: {clientData.zone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-border">
                <div className="p-2 rounded-lg bg-brand/10 border border-brand/20">
                  <Briefcase className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-3 uppercase mb-0.5">Vendedor Asignado</p>
                  <p className="text-sm font-bold text-brand uppercase">{clientData.users?.full_name || "Sin asignar"}</p>
                </div>
              </div>
            </div>
          </Card>

          <button
            onClick={handleSendPortal}
            disabled={sendingPortal}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-sm
                     bg-surface-card border border-border text-text-1 hover:border-brand/50 hover:bg-brand/5 transition-all
                     disabled:opacity-50 group"
          >
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-brand group-hover:text-white transition-all">
              <SendHorizonal className="w-4 h-4" />
            </div>
            {sendingPortal ? "Procesando..." : "Enviar Portal de Pagos"}
          </button>
        </div>

        {/* LADO DERECHO: HISTORIAL CRONOLÓGICO */}
        <div className="lg:col-span-8">
          <Card className="bg-surface-card border-border shadow-card overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-base/30">
              <h3 className="text-sm font-bold text-text-1 font-outfit uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand" />
                Historial de Pedidos
              </h3>
              <span className="text-[10px] font-bold text-text-3 bg-surface-base px-2 py-1 rounded">
                Total registros: {orders.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-base/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-text-3 uppercase tracking-widest border-b border-border">Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-3 uppercase tracking-widest border-b border-border">Pedido</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-3 uppercase tracking-widest border-b border-border">Monto</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-3 uppercase tracking-widest border-b border-border text-center">Estatus</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-3 uppercase tracking-widest border-b border-border text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-3">
                        Este cliente aún no registra pedidos.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const receivable = receivables.find(r => r.order_id === order.id);
                      
                      let statusLabel = "⚪ Borrador";
                      let statusClass = "bg-white/5 text-text-3 border-white/10";
                      
                      if (receivable) {
                        switch(receivable.status) {
                          case 'paid':
                            statusLabel = "🟢 Pagado";
                            statusClass = "bg-status-ok/10 text-status-ok border-status-ok/20";
                            break;
                          case 'partial':
                            statusLabel = "🟡 Abonado";
                            statusClass = "bg-status-warning/10 text-status-warning border-status-warning/20";
                            break;
                          case 'overdue':
                            statusLabel = "🔴 Vencido";
                            statusClass = "bg-status-danger/10 text-status-danger border-status-danger/20";
                            break;
                          default:
                            statusLabel = "🔴 Pendiente";
                            statusClass = "bg-status-danger/10 text-status-danger border-status-danger/20";
                        }
                      } else if (order.status === 'cancelled') {
                        statusLabel = "⚪ Anulado";
                      } else if (order.status === 'confirmed' || order.status === 'delivered') {
                        statusLabel = "🟡 Pendiente";
                        statusClass = "bg-status-danger/10 text-status-danger border-status-danger/20";
                      }

                      return (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-all group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-bold text-text-1">{format(new Date(order.created_at), "dd/MM/yy")}</p>
                            <p className="text-[10px] text-text-3 tracking-tight">{format(new Date(order.created_at), "HH:mm")}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono font-bold text-brand bg-brand/5 px-2 py-1 rounded border border-brand/10 group-hover:bg-brand/10 transition-colors">
                              #{order.order_number}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-syne font-bold text-sm text-text-1">
                            {formatCurrency(order.total_usd)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={cn(
                              "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              statusClass
                            )}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => router.push(`/dashboard/ventas/${order.id}/nota-entrega`)}
                                className="p-2 rounded-lg bg-surface-base border border-border text-text-3 hover:text-brand hover:border-brand/40 transition-all shadow-sm"
                                title="Ver Detalle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                className="p-2 rounded-lg bg-surface-base border border-border text-text-3 hover:text-text-1 hover:border-text-1 transition-all shadow-sm"
                                title="Descargar PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-surface-base/30 border-t border-border flex justify-center">
              <span className="text-[10px] font-bold text-text-3 uppercase tracking-widest italic grayscale opacity-50">
                Límite de registros alcanzado • Lumis ERP
              </span>
            </div>
          </Card>
          
          {/* CRM PREVIEW SI EXISTE */}
          {oportunidades.length > 0 && (
            <Card className="mt-6 p-5 border-dashed border-2 border-border bg-transparent shadow-none grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" onClick={() => router.push("/dashboard/crm")}>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-status-warning/10 text-status-warning">
                       <Flame className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-text-1">Oportunidad Activa Detectada</p>
                       <p className="text-[10px] text-text-3">Este cliente tiene {oportunidades.length} negociaciones en curso.</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
               </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
