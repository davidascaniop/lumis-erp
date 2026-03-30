"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { 
  TrendingUp, Search, MessageSquare, 
  DollarSign, Clock, Users, Loader2, ArrowRight, Sparkles, 
  Wallet, Target, ShoppingBag 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  parseWhitelabelTemplate, 
  FOLLOWUP_TEMPLATES, 
  generateWhatsAppLink 
} from "@/lib/utils/branding-utils";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type FollowupType = "ventas" | "cobranza" | "fidelizacion";

export default function SeguimientoPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FollowupType>("ventas");
  const [data, setData] = useState<any[]>([]);
  const [businessName, setBusinessName] = useState<string>("");

  useEffect(() => {
    async function loadConfig() {
      if (!user?.company_id) return;
      const { data: company } = await supabase
        .from("companies")
        .select("name, name_comercial")
        .eq("id", user.company_id)
        .single();
      
      setBusinessName(company?.name_comercial || company?.name || "Nuestra Empresa");
    }
    loadConfig();
  }, [user?.company_id]);

  useEffect(() => {
    async function fetchData() {
      if (!user?.company_id) return;
      setLoading(true);
      
      try {
        if (filter === "ventas") {
          // Fetch pending quotes
          const { data: quotes } = await supabase
            .from("quotes")
            .select(`
              id, 
              total_usd, 
              created_at, 
              partners:partner_id (id, name, phone, whatsapp)
            `)
            .eq("company_id", user.company_id)
            .eq("status", "open")
            .limit(50);
          
          setData(quotes || []);
        } else if (filter === "cobranza") {
          // Fetch overdue receivables — only real open/overdue records
          const { data: receivables } = await supabase
            .from("receivables")
            .select(`
              id, 
              balance_usd, 
              due_date, 
              status,
              partners:partner_id (id, name, phone, whatsapp)
            `)
            .eq("company_id", user.company_id)
            .gt("balance_usd", 0)
            .in("status", ["open", "overdue", "partial"])
            .limit(50);
          
          setData(receivables || []);
        } else {
          // Fidelización: only real partners who have placed orders before
          const { data: partners } = await supabase
            .from("partners")
            .select("id, name, phone, whatsapp, last_order_at")
            .eq("company_id", user.company_id)
            .eq("status", "active")
            .not("last_order_at", "is", null)
            .order("last_order_at", { ascending: true })
            .limit(50);
          
          setData(partners?.map(p => ({ ...p, partners: p })) || []);
        }
      } catch (error) {
        console.error("Error fetching followup data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filter, user?.company_id]);

  const totals = {
    ventas: data.reduce((acc, curr) => acc + (curr.total_usd || 0), 0),
    cobranza: data.reduce((acc, curr) => acc + (curr.balance_usd || 0), 0),
    count: data.length
  };

  const handleFollowup = (item: any) => {
    const contact = item.partners;
    const phone = contact?.whatsapp || contact?.phone;
    
    if (!phone) {
      toast.error("El cliente no tiene teléfono registrado");
      return;
    }

    let template = "";
    const templateData: any = {
      Nombre_Cliente: contact.name,
      User_Business_Name: businessName,
      Nombre_Vendedor: user?.full_name?.split(" ")[0] || "Tu asesor",
    };

    if (filter === "ventas") {
      template = FOLLOWUP_TEMPLATES.SALES;
      templateData.Monto = formatCurrency(item.total_usd);
    } else if (filter === "cobranza") {
      template = FOLLOWUP_TEMPLATES.COLLECTION;
      templateData.Monto = formatCurrency(item.balance_usd);
    } else {
      template = FOLLOWUP_TEMPLATES.LOYALTY;
      templateData.Producto_Habitual = "mercancía";
    }

    const message = parseWhitelabelTemplate(template, templateData);
    const link = generateWhatsAppLink(phone, message);
    window.open(link, "_blank");
  };

  return (
    <div className="h-full flex flex-col pt-6 px-6 animate-fade-in bg-gray-50/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-outfit font-bold text-text-1 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand" />
            Seguimiento de Negocio
          </h1>
          <p className="text-sm text-text-3 font-outfit mt-1">
            Branding Activo: <span className="text-brand font-bold bg-brand/10 px-2 py-0.5 rounded-full">{businessName}</span>
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Ventas por Cerrar", value: totals.ventas, icon: Target, color: "text-brand", bg: "bg-brand/10" },
          { label: "Deuda Recuperable", value: totals.cobranza, icon: Wallet, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Oportunidades", value: totals.count, isRaw: true, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white rounded-2xl border border-border shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-outfit font-bold text-text-1">
                {stat.isRaw ? stat.value : formatCurrency(stat.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        {(["ventas", "cobranza", "fidelizacion"] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold font-outfit uppercase tracking-wider transition-all border shadow-sm ${
              filter === t 
                ? "bg-brand text-white border-brand shadow-brand/20" 
                : "bg-white text-text-3 border-border hover:text-text-1 hover:bg-gray-50"
            }`}
          >
            {t === "ventas" && "Ventas Pendientes"}
            {t === "cobranza" && "Cobranza Vencida"}
            {t === "fidelizacion" && "Fidelización"}
          </button>
        ))}
      </div>

      {/* List Container */}
      <div className="flex-1 bg-white rounded-3xl border border-border shadow-sm p-6 overflow-y-auto mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <p className="text-xs font-outfit animate-pulse">Cargando oportunidades…</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-full">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-outfit max-w-[200px]">
              No hay acciones pendientes en este segmento por ahora.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {data.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="group p-5 rounded-2xl bg-white border border-border hover:border-brand/40 hover:shadow-lg transition-all relative overflow-hidden"
                >
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    {filter === "ventas" && <TrendingUp className="w-12 h-12" />}
                    {filter === "cobranza" && <DollarSign className="w-12 h-12" />}
                    {filter === "fidelizacion" && <Users className="w-12 h-12" />}
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold">
                        {item.partners?.name?.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-text-1 truncate max-w-[150px]">
                          {item.partners?.name}
                        </h3>
                        <p className="text-[10px] text-text-3 font-mono">
                          {item.partners?.whatsapp || item.partners?.phone || "Sin teléfono"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-dashed border-border pt-4">
                      <div>
                        <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider mb-1">
                          {filter === "fidelizacion" ? "Estatus" : "Importe"}
                        </p>
                        <p className={`text-lg font-bold font-outfit ${filter === "cobranza" ? "text-red-500" : "text-text-1"}`}>
                          {filter === "fidelizacion" 
                            ? "Activo" 
                            : formatCurrency(item.total_usd || item.balance_usd)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleFollowup(item)}
                        className="flex items-center justify-center gap-2 w-12 h-12 rounded-xl bg-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <MessageSquare className="w-5 h-5 fill-white/20" />
                      </button>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-text-3">
                      <Clock className="w-3 h-3" />
                      {filter === "cobranza" ? "Vencido el: " : "Creado el: "}
                      {new Date(item.due_date || item.created_at || new Date()).toLocaleDateString("es")}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Marca Blanca Footer Notice */}
      <div className="mb-6 flex items-center justify-center gap-2 p-3 bg-brand/5 border border-dashed border-brand/20 rounded-2xl">
        <ArrowRight className="w-3.5 h-3.5 text-brand" />
        <p className="text-[11px] text-brand/80 font-bold font-outfit italic">
          Los mensajes de WhatsApp se enviarán firmados como "{businessName}" eliminando menciones a Lumis.
        </p>
      </div>
    </div>
  );
}
