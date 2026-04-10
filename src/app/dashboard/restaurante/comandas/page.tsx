"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Plus, Clock, UtensilsCrossed, Users as UsersIcon } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useRealtimeOrders, useRealtimeOrderItems } from "@/hooks/use-restaurant-realtime";
import { OrderEditor } from "@/components/restaurant/order-editor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ComandasContent() {
  const { user, loading: userLoading } = useUser();
  const companyId = user?.company_id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesaId = searchParams.get("mesa");
  const mesaName = searchParams.get("mesa_name");
  const orderId = searchParams.get("order");
  const supabase = createClient();

  const { orders, loading: ordersLoading } = useRealtimeOrders(companyId);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(orderId);
  const { items: activeItems, refetch: refetchItems } = useRealtimeOrderItems(activeOrderId);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [guestsCount, setGuestsCount] = useState(1);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [activeTable, setActiveTable] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Load products
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const [prRes, catRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("company_id", companyId)
          .eq("status", "active"),
        supabase
          .from("product_categories")
          .select("name")
          .eq("company_id", companyId)
          .order("name"),
      ]);
      setProducts(prRes.data || []);
      setCategories((catRes.data || []).map((c: any) => c.name));
    })();
  }, [companyId, supabase]);

  // If coming from mesas with a table but no order, start new order flow
  useEffect(() => {
    if (mesaId && !orderId) {
      setShowNewOrderForm(true);
      // Load table info
      (async () => {
        const { data } = await supabase
          .from("restaurant_tables")
          .select("*")
          .eq("id", mesaId)
          .single();
        if (data) setActiveTable(data);
      })();
    }
  }, [mesaId, orderId, supabase]);

  // If coming with an existing order, load it
  useEffect(() => {
    if (orderId) {
      setActiveOrderId(orderId);
      (async () => {
        const { data } = await supabase
          .from("restaurant_orders")
          .select("*, restaurant_tables(name), users!restaurant_orders_waiter_id_fkey(full_name)")
          .eq("id", orderId)
          .single();
        if (data) {
          setActiveOrder(data);
          setGuestsCount(data.guests_count || 1);
        }
      })();
    }
  }, [orderId, supabase]);

  // Sync Realtime items to local state
  useEffect(() => {
    setLocalItems(activeItems);
  }, [activeItems]);

  // Create new order for table
  const handleCreateOrder = async () => {
    if (!mesaId || !companyId || !user?.id) return;
    setIsSending(true);
    try {
      const { data: newOrder, error } = await supabase
        .from("restaurant_orders")
        .insert({
          company_id: companyId,
          table_id: mesaId,
          waiter_id: user.id,
          status: "abierta",
          guests_count: guestsCount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update table status
      await supabase
        .from("restaurant_tables")
        .update({ status: "ocupada", current_order_id: newOrder.id })
        .eq("id", mesaId);

      setActiveOrderId(newOrder.id);
      setActiveOrder(newOrder);
      setShowNewOrderForm(false);
      toast.success("Comanda abierta");
    } catch (err: any) {
      toast.error("Error al crear comanda", { description: err.message });
    } finally {
      setIsSending(false);
    }
  };

  // Add item to active order
  const handleAddItem = async (product: any, modifications?: string) => {
    if (!activeOrderId) return;

    // Check if already exists as pending
    const existing = localItems.find(
      (i) => i.product_id === product.id && i.status === "pendiente" && i.modifications === (modifications || null)
    );

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from("restaurant_order_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
      if (error) toast.error("Error al actualizar");
    } else {
      const { error } = await supabase.from("restaurant_order_items").insert({
        company_id: companyId,
        order_id: activeOrderId,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price_usd || 0,
        modifications: modifications || null,
        status: "pendiente",
      });
      if (error) toast.error("Error al agregar item");
    }

    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  };

  // Update item quantity
  const handleUpdateItemQty = async (itemId: string, delta: number) => {
    const item = localItems.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    await supabase.from("restaurant_order_items").update({ quantity: newQty }).eq("id", itemId);
  };

  // Remove item
  const handleRemoveItem = async (itemId: string) => {
    await supabase.from("restaurant_order_items").delete().eq("id", itemId);
  };

  // Send pending items to kitchen
  const handleSendToKitchen = async () => {
    const pending = localItems.filter((i) => i.status === "pendiente");
    if (pending.length === 0) {
      toast.error("No hay items pendientes para enviar");
      return;
    }

    setIsSending(true);
    try {
      const now = new Date().toISOString();
      await Promise.all(
        pending.map((item) =>
          supabase
            .from("restaurant_order_items")
            .update({ status: "en_preparacion", sent_to_kitchen_at: now })
            .eq("id", item.id)
        )
      );

      // Update order status
      if (activeOrderId) {
        await supabase
          .from("restaurant_orders")
          .update({ status: "en_cocina" })
          .eq("id", activeOrderId);
      }

      toast.success(`${pending.length} item(s) enviados a cocina`);
    } catch (err: any) {
      toast.error("Error al enviar a cocina", { description: err.message });
    } finally {
      setIsSending(false);
    }
  };

  // Request bill
  const handleRequestBill = async () => {
    if (!activeOrderId || !activeOrder?.table_id) return;
    try {
      await supabase
        .from("restaurant_tables")
        .update({ status: "cuenta_pedida" })
        .eq("id", activeOrder.table_id);

      toast.success("Cuenta solicitada — notificando a caja");
    } catch (err: any) {
      toast.error("Error al pedir cuenta");
    }
  };

  if (userLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  // New order form (when clicking free table)
  if (showNewOrderForm && !activeOrderId) {
    return (
      <div className="max-w-lg mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-text-3 hover:text-text-1 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a Mesas
        </button>
        <div className="bg-surface-card rounded-3xl border border-border p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-brand/10 border border-brand/20">
              <UtensilsCrossed className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-1 font-montserrat">
                Abrir Comanda
              </h2>
              <p className="text-sm text-text-2">{mesaName || activeTable?.name || "Mesa"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-1 uppercase tracking-wider">Número de Comensales</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                  className="w-10 h-10 rounded-xl bg-surface-base border border-border flex items-center justify-center hover:bg-surface-hover transition-colors font-bold text-lg"
                >
                  −
                </button>
                <span className="text-2xl font-black text-text-1 w-12 text-center">{guestsCount}</span>
                <button
                  onClick={() => setGuestsCount(guestsCount + 1)}
                  className="w-10 h-10 rounded-xl bg-surface-base border border-border flex items-center justify-center hover:bg-surface-hover transition-colors font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold">
                <UsersIcon className="w-4 h-4" />
                Mesero: {user?.full_name || "Sin asignar"}
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={isSending}
              className="w-full py-3.5 rounded-xl bg-brand-gradient text-white font-bold shadow-brand hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Abrir Comanda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main: Order editor or order list
  if (activeOrderId) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              setActiveOrderId(null);
              setActiveOrder(null);
              router.push("/dashboard/restaurante/comandas");
            }}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-3" />
          </button>
          <h1 className="text-xl font-bold text-text-1 font-montserrat">
            Comanda {activeOrder?.restaurant_tables?.name || mesaName || ""}
          </h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <OrderEditor
            products={products}
            categories={categories}
            items={localItems}
            onAddItem={handleAddItem}
            onUpdateItemQty={handleUpdateItemQty}
            onRemoveItem={handleRemoveItem}
            onSendToKitchen={handleSendToKitchen}
            onRequestBill={handleRequestBill}
            tableName={activeOrder?.restaurant_tables?.name || mesaName || "Mesa"}
            guestsCount={activeOrder?.guests_count || guestsCount}
            waiterName={activeOrder?.users?.full_name || user?.full_name || "Mesero"}
            canSendToKitchen={localItems.some((i) => i.status === "pendiente")}
            isSending={isSending}
          />
        </div>
      </div>
    );
  }

  // Default: List of active orders
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20">
            <UtensilsCrossed className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-1 font-montserrat">Comandas</h1>
            <p className="text-sm text-text-2">Vista de mesero — comandas activas</p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-surface-card rounded-2xl border border-border">
          <UtensilsCrossed className="w-12 h-12 text-text-3/30 mx-auto mb-3" />
          <p className="text-text-3 font-medium">No hay comandas activas</p>
          <p className="text-xs text-text-3 mt-1">Abre una comanda desde la vista de Mesas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const elapsed = Math.floor(
              (Date.now() - new Date(order.created_at).getTime()) / 60000
            );
            return (
              <button
                key={order.id}
                onClick={() => {
                  setActiveOrderId(order.id);
                  setActiveOrder(order);
                  router.push(`/dashboard/restaurante/comandas?order=${order.id}`);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-card border border-border hover:border-brand/30 hover:shadow-card transition-all text-left group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                  order.status === "abierta" ? "bg-blue-50 border-blue-200 text-blue-600" :
                  order.status === "en_cocina" ? "bg-amber-50 border-amber-200 text-amber-600" :
                  "bg-emerald-50 border-emerald-200 text-emerald-600"
                )}>
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-text-1">
                      {order.restaurant_tables?.name || "Mesa"}
                    </p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                      order.status === "abierta" ? "bg-blue-50 text-blue-600 border-blue-200" :
                      order.status === "en_cocina" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-emerald-50 text-emerald-600 border-emerald-200"
                    )}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-text-3 mt-0.5">
                    Mesero: {order.users?.full_name || "—"} • {order.guests_count || 1} comensales
                  </p>
                </div>
                <div className="flex items-center gap-1 text-text-3 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{elapsed}m</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ComandasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      }
    >
      <ComandasContent />
    </Suspense>
  );
}
