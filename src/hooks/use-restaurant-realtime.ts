"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type RealtimePayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
};

/**
 * Hook for real-time restaurant tables subscription
 */
export function useRealtimeTables(companyId: string | null | undefined) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTables = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("company_id", companyId)
      .order("name");
    setTables(data || []);
    setLoading(false);
  }, [companyId, supabase]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel("restaurant_tables_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
          filter: `company_id=eq.${companyId}`,
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          setTables((prev) => {
            if (eventType === "INSERT") {
              return [...prev, newRecord].sort((a, b) => a.name.localeCompare(b.name));
            }
            if (eventType === "UPDATE") {
              return prev.map((t) => (t.id === newRecord.id ? newRecord : t));
            }
            if (eventType === "DELETE") {
              return prev.filter((t) => t.id !== oldRecord.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, supabase]);

  return { tables, loading, refetch: fetchTables };
}

/**
 * Hook for real-time restaurant orders subscription
 */
export function useRealtimeOrders(companyId: string | null | undefined) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from("restaurant_orders")
      .select("*, restaurant_tables(name), users!restaurant_orders_waiter_id_fkey(full_name)")
      .eq("company_id", companyId)
      .in("status", ["abierta", "en_cocina", "lista"])
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, [companyId, supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel("restaurant_orders_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_orders",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          // Refetch for relations
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, supabase, fetchOrders]);

  return { orders, loading, refetch: fetchOrders };
}

/**
 * Hook for real-time order items subscription
 */
export function useRealtimeOrderItems(orderId: string | null | undefined) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    const { data } = await supabase
      .from("restaurant_order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at");
    setItems(data || []);
    setLoading(false);
  }, [orderId, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`restaurant_order_items_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_order_items",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          setItems((prev) => {
            if (eventType === "INSERT") return [...prev, newRecord];
            if (eventType === "UPDATE") return prev.map((i) => (i.id === newRecord.id ? newRecord : i));
            if (eventType === "DELETE") return prev.filter((i) => i.id !== oldRecord.id);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  return { items, loading, refetch: fetchItems };
}

/**
 * Hook for kitchen-specific realtime — listens to ALL order items for a company
 */
export function useRealtimeKitchen(companyId: string | null | undefined) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTickets = useCallback(async () => {
    if (!companyId) return;
    // Get all active orders with their items
    const { data: orders } = await supabase
      .from("restaurant_orders")
      .select(`
        *,
        restaurant_tables(name),
        users!restaurant_orders_waiter_id_fkey(full_name),
        restaurant_order_items(*)
      `)
      .eq("company_id", companyId)
      .in("status", ["abierta", "en_cocina", "lista"])
      .order("created_at");

    setTickets(orders || []);
    setLoading(false);
  }, [companyId, supabase]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!companyId) return;

    // Listen to both orders and order_items
    const channel = supabase
      .channel("kitchen_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_orders", filter: `company_id=eq.${companyId}` },
        () => fetchTickets()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_order_items" },
        () => fetchTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, supabase, fetchTickets]);

  return { tickets, loading, refetch: fetchTickets };
}
