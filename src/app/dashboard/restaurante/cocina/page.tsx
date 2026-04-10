"use client";

import { useState, useEffect } from "react";
import { Loader2, Maximize2, Minimize2, CookingPot } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useRealtimeKitchen } from "@/hooks/use-restaurant-realtime";
import { KitchenTicket } from "@/components/restaurant/kitchen-ticket";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CocinaPage() {
  const { user, loading: userLoading } = useUser();
  const companyId = user?.company_id;
  const { tickets, loading: ticketsLoading } = useRealtimeKitchen(companyId);
  const supabase = createClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [config, setConfig] = useState({ alert_minutes_yellow: 10, alert_minutes_red: 15 });

  // Load config
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await supabase
        .from("restaurant_config")
        .select("*")
        .eq("company_id", companyId)
        .single();
      if (data) {
        setConfig({
          alert_minutes_yellow: data.alert_minutes_yellow || 10,
          alert_minutes_red: data.alert_minutes_red || 15,
        });
      }
    })();
  }, [companyId, supabase]);

  // Categorize tickets by status
  const pendingTickets = tickets.filter((t) => {
    const items = t.restaurant_order_items || [];
    return items.some((i: any) => i.status === "pendiente");
  });

  const inProgressTickets = tickets.filter((t) => {
    const items = t.restaurant_order_items || [];
    return items.some((i: any) => i.status === "en_preparacion") &&
           !items.some((i: any) => i.status === "pendiente");
  });

  const readyTickets = tickets.filter((t) => {
    const items = t.restaurant_order_items || [];
    return items.every((i: any) => i.status === "listo" || i.status === "entregado") &&
           items.some((i: any) => i.status === "listo");
  });

  const handleStartPreparation = async (orderId: string, itemIds: string[]) => {
    try {
      const now = new Date().toISOString();
      await Promise.all(
        itemIds.map((id) =>
          supabase
            .from("restaurant_order_items")
            .update({ status: "en_preparacion", sent_to_kitchen_at: now })
            .eq("id", id)
        )
      );
      toast.success("Preparación iniciada");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleMarkReady = async (orderId: string, itemIds: string[]) => {
    try {
      const now = new Date().toISOString();
      await Promise.all(
        itemIds.map((id) =>
          supabase
            .from("restaurant_order_items")
            .update({ status: "listo", ready_at: now })
            .eq("id", id)
        )
      );

      // Update order status
      await supabase
        .from("restaurant_orders")
        .update({ status: "lista" })
        .eq("id", orderId);

      toast.success("¡Platos listos! Mesero notificado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleMarkDelivered = async (orderId: string, itemIds: string[]) => {
    try {
      await Promise.all(
        itemIds.map((id) =>
          supabase
            .from("restaurant_order_items")
            .update({ status: "entregado" })
            .eq("id", id)
        )
      );
      toast.success("Ticket cerrado — entregado");
    } catch {
      toast.error("Error");
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Toggle sidebar/header visibility
    const sidebar = document.querySelector("aside");
    const main = document.querySelector("main");
    if (sidebar) sidebar.style.display = isFullscreen ? "" : "none";
    if (main) {
      main.style.padding = isFullscreen ? "" : "0";
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const sidebar = document.querySelector("aside");
      const main = document.querySelector("main");
      if (sidebar) sidebar.style.display = "";
      if (main) main.style.padding = "";
    };
  }, []);

  if (userLoading || ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-all duration-300",
      isFullscreen ? "fixed inset-0 z-[9999] p-4" : "",
      "bg-[#0D0D1A] rounded-2xl"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A3E]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30">
            <CookingPot className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-montserrat">Cocina KDS</h1>
            <p className="text-xs text-gray-400">
              {pendingTickets.length + inProgressTickets.length + readyTickets.length} tickets activos
            </p>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-xl bg-[#1E1E2E] border border-[#2A2A3E] text-gray-400 hover:text-white hover:border-brand/30 transition-all"
          title={isFullscreen ? "Salir de pantalla completa" : "Modo Cocina (pantalla completa)"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-3 gap-4 p-4 h-[calc(100vh-120px)] overflow-hidden">
        {/* PENDIENTE */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Pendiente</h2>
            <span className="text-xs font-bold text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded-full ml-auto">
              {pendingTickets.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {pendingTickets.map((t) => (
              <KitchenTicket
                key={t.id}
                order={t}
                alertYellow={config.alert_minutes_yellow}
                alertRed={config.alert_minutes_red}
                onStartPreparation={handleStartPreparation}
                onMarkReady={handleMarkReady}
                onMarkDelivered={handleMarkDelivered}
              />
            ))}
            {pendingTickets.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">Sin tickets</div>
            )}
          </div>
        </div>

        {/* EN PREPARACIÓN */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">En Preparación</h2>
            <span className="text-xs font-bold text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded-full ml-auto">
              {inProgressTickets.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {inProgressTickets.map((t) => (
              <KitchenTicket
                key={t.id}
                order={t}
                alertYellow={config.alert_minutes_yellow}
                alertRed={config.alert_minutes_red}
                onStartPreparation={handleStartPreparation}
                onMarkReady={handleMarkReady}
                onMarkDelivered={handleMarkDelivered}
              />
            ))}
            {inProgressTickets.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">Sin tickets</div>
            )}
          </div>
        </div>

        {/* LISTO PARA ENTREGAR */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Listo para Entregar</h2>
            <span className="text-xs font-bold text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-auto">
              {readyTickets.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {readyTickets.map((t) => (
              <KitchenTicket
                key={t.id}
                order={t}
                alertYellow={config.alert_minutes_yellow}
                alertRed={config.alert_minutes_red}
                onStartPreparation={handleStartPreparation}
                onMarkReady={handleMarkReady}
                onMarkDelivered={handleMarkDelivered}
              />
            ))}
            {readyTickets.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">Sin tickets</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
