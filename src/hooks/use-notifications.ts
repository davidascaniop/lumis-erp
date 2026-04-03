"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { differenceInMinutes, differenceInHours, differenceInDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";

export type NotificationType =
  | "payment" | "order" | "alert" | "success"
  | "stock" | "treasury" | "recurring" | "plan";

export type NotificationPriority = "high" | "medium" | "low";

export interface AppNotification {
  id: string;
  type: NotificationType;
  read: boolean;
  title: string;
  description: string;
  time: string;
  href: string;
  priority: NotificationPriority;
  createdAt: Date;
}

function relativeTime(date: Date): string {
  const now = new Date();
  const mins = differenceInMinutes(now, date);
  if (mins < 1)   return "Ahora";
  if (mins < 60)  return `Hace ${mins} min`;
  const hrs = differenceInHours(now, date);
  if (hrs < 24)   return `Hace ${hrs}h`;
  const days = differenceInDays(now, date);
  if (days < 2)   return "Ayer";
  return format(date, "dd MMM", { locale: es });
}

function formatCurrency(amount: number) {
  return `$${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}

export function useNotifications(companyId?: string, userCompanies?: any) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const today     = new Date().toISOString().split("T")[0];
      const yesterday = subDays(new Date(), 1).toISOString();
      const todayDay  = new Date().getDate();

      const [
        paymentsRes, receivablesRes, ordersRes,
        productsRes, treasuryRes, recurringRes, priceRes,
      ] = await Promise.all([
        // Pagos pendientes de verificar
        supabase.from("payments")
          .select("id,amount_usd,created_at,partners(name)")
          .eq("company_id", companyId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),

        // CxC vencidas
        supabase.from("receivables")
          .select("id,balance_usd,due_date,partners(name)")
          .eq("company_id", companyId)
          .neq("status", "paid")
          .lt("due_date", today)
          .order("due_date", { ascending: true })
          .limit(5),

        // Órdenes nuevas (últimas 24h)
        supabase.from("orders")
          .select("id,order_number,created_at,users(full_name)")
          .eq("company_id", companyId)
          .eq("status", "confirmed")
          .gte("created_at", yesterday)
          .order("created_at", { ascending: false })
          .limit(5),

        // Productos con stock crítico
        supabase.from("products")
          .select("id,name,stock_qty,min_stock")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .limit(100),

        // Cuentas de tesorería con saldo bajo
        supabase.from("treasury_accounts")
          .select("id,name,current_balance,min_alert_balance,currency")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .gt("min_alert_balance", 0),

        // Gastos recurrentes próximos a vencer (±3 días del due_day)
        supabase.from("recurring_expenses")
          .select("id,name,amount_usd,due_day,alert_days")
          .eq("company_id", companyId)
          .eq("is_active", true),

        // Alertas de precio sin leer
        (supabase.from("price_alerts") as any)
          .select("id,alert_type,old_price,new_price,created_at,products(name)")
          .eq("company_id", companyId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const notifs: AppNotification[] = [];

      // ── PAGOS PENDIENTES ──────────────────────────────────────────────────
      const pendingPayments = paymentsRes.data || [];
      if (pendingPayments.length > 1) {
        notifs.push({
          id: "pay-grouped",
          type: "payment",
          read: false,
          title: `${pendingPayments.length} pagos pendientes de verificar`,
          description: "Revisa los comprobantes en Cuentas por Cobrar",
          time: relativeTime(new Date(pendingPayments[0].created_at)),
          href: "/dashboard/cobranza",
          priority: "high",
          createdAt: new Date(pendingPayments[0].created_at),
        });
      } else if (pendingPayments.length === 1) {
        const p = pendingPayments[0];
        const partnerName = (p.partners as any)?.name || "Un cliente";
        notifs.push({
          id: `pay-${p.id}`,
          type: "payment",
          read: false,
          title: "Pago pendiente de verificar",
          description: `${partnerName} registró un pago de ${formatCurrency(Number(p.amount_usd))}`,
          time: relativeTime(new Date(p.created_at)),
          href: "/dashboard/cobranza",
          priority: "high",
          createdAt: new Date(p.created_at),
        });
      }

      // ── CXC VENCIDAS ──────────────────────────────────────────────────────
      const overdueRecv = receivablesRes.data || [];
      if (overdueRecv.length > 2) {
        const totalOverdue = overdueRecv.reduce((acc, r) => acc + Number(r.balance_usd || 0), 0);
        notifs.push({
          id: "cxc-grouped",
          type: "alert",
          read: false,
          title: `${overdueRecv.length} facturas vencidas`,
          description: `${formatCurrency(totalOverdue)} pendientes de cobro en mora`,
          time: relativeTime(new Date(overdueRecv[0].due_date)),
          href: "/dashboard/cobranza",
          priority: "high",
          createdAt: new Date(overdueRecv[0].due_date),
        });
      } else {
        overdueRecv.forEach((r) => {
          const partnerName = (r.partners as any)?.name || "Cliente";
          const days = differenceInDays(new Date(), new Date(r.due_date));
          notifs.push({
            id: `cxc-${r.id}`,
            type: "alert",
            read: false,
            title: "Crédito vencido",
            description: `${partnerName} tiene ${formatCurrency(Number(r.balance_usd))} vencido (+${days} día${days !== 1 ? "s" : ""})`,
            time: relativeTime(new Date(r.due_date)),
            href: "/dashboard/cobranza",
            priority: "high",
            createdAt: new Date(r.due_date),
          });
        });
      }

      // ── NUEVAS ÓRDENES ────────────────────────────────────────────────────
      const newOrders = ordersRes.data || [];
      if (newOrders.length > 2) {
        notifs.push({
          id: "order-grouped",
          type: "order",
          read: false,
          title: `${newOrders.length} nuevos pedidos recibidos`,
          description: "Órdenes confirmadas en las últimas 24h",
          time: relativeTime(new Date(newOrders[0].created_at)),
          href: "/dashboard/ventas",
          priority: "medium",
          createdAt: new Date(newOrders[0].created_at),
        });
      } else {
        newOrders.forEach((o) => {
          const sellerName = (o.users as any)?.full_name || "Vendedor";
          notifs.push({
            id: `ord-${o.id}`,
            type: "order",
            read: false,
            title: "Nuevo pedido recibido",
            description: `${o.order_number} creado por ${sellerName}`,
            time: relativeTime(new Date(o.created_at)),
            href: "/dashboard/ventas",
            priority: "medium",
            createdAt: new Date(o.created_at),
          });
        });
      }

      // ── STOCK CRÍTICO ─────────────────────────────────────────────────────
      const allProducts = productsRes.data || [];
      const criticalProducts = allProducts
        .filter(p => Number(p.stock_qty) <= Number(p.min_stock))
        .sort((a, b) => Number(a.stock_qty) - Number(b.stock_qty))
        .slice(0, 5);

      if (criticalProducts.length > 2) {
        notifs.push({
          id: "stock-grouped",
          type: "stock",
          read: false,
          title: `${criticalProducts.length} productos con stock crítico`,
          description: "Revisa el inventario antes de recibir nuevos pedidos",
          time: "Ahora",
          href: "/dashboard/productos?filter=stock_critico",
          priority: "medium",
          createdAt: new Date(),
        });
      } else {
        criticalProducts.forEach((p) => {
          const isZero = Number(p.stock_qty) === 0;
          notifs.push({
            id: `stock-${p.id}`,
            type: "stock",
            read: false,
            title: isZero ? "Producto sin stock" : "Stock crítico",
            description: `${p.name}: ${p.stock_qty} unidades (mín. ${p.min_stock})`,
            time: "Ahora",
            href: "/dashboard/productos?filter=stock_critico",
            priority: isZero ? "high" : "medium",
            createdAt: new Date(),
          });
        });
      }

      // ── TESORERÍA BAJA ────────────────────────────────────────────────────
      const treasuryAccounts = treasuryRes.data || [];
      const lowBalanceAccounts = treasuryAccounts.filter(
        a => Number(a.current_balance) <= Number(a.min_alert_balance)
      );
      lowBalanceAccounts.forEach((a) => {
        const isZeroOrNeg = Number(a.current_balance) <= 0;
        notifs.push({
          id: `treasury-${a.id}`,
          type: "treasury",
          read: false,
          title: isZeroOrNeg ? "Cuenta en cero o negativa" : "Saldo bajo en cuenta",
          description: `${a.name}: ${a.currency?.toUpperCase()} ${Number(a.current_balance).toFixed(2)}`,
          time: "Ahora",
          href: "/dashboard/finanzas/cuentas",
          priority: isZeroOrNeg ? "high" : "medium",
          createdAt: new Date(),
        });
      });

      // ── RECURRENTES PRÓXIMOS ──────────────────────────────────────────────
      const recurringList = recurringRes.data || [];
      const upcomingRecurring = recurringList.filter((r) => {
        const alertDays = Number(r.alert_days || 3);
        const due = Number(r.due_day);
        const diff = due - todayDay;
        return diff >= 0 && diff <= alertDays;
      });

      if (upcomingRecurring.length > 2) {
        const totalAmt = upcomingRecurring.reduce((acc, r) => acc + Number(r.amount_usd || 0), 0);
        notifs.push({
          id: "recurring-grouped",
          type: "recurring",
          read: false,
          title: `${upcomingRecurring.length} gastos recurrentes próximos`,
          description: `${formatCurrency(totalAmt)} por pagar esta semana`,
          time: "Esta semana",
          href: "/dashboard/finanzas/recurrentes",
          priority: "medium",
          createdAt: new Date(),
        });
      } else {
        upcomingRecurring.forEach((r) => {
          const diff = Number(r.due_day) - todayDay;
          notifs.push({
            id: `recur-${r.id}`,
            type: "recurring",
            read: false,
            title: diff === 0 ? "Gasto recurrente vence hoy" : `Gasto recurrente en ${diff} día${diff !== 1 ? "s" : ""}`,
            description: `${r.name}: ${formatCurrency(Number(r.amount_usd))}`,
            time: diff === 0 ? "Hoy" : `En ${diff} días`,
            href: "/dashboard/finanzas/recurrentes",
            priority: diff === 0 ? "high" : "low",
            createdAt: new Date(),
          });
        });
      }

      // ── ALERTAS DE PRECIO ─────────────────────────────────────────────────
      const priceAlerts = priceRes.data || [];
      priceAlerts.forEach((a: any) => {
        const productName = a.products?.name || "Producto";
        const isUp = a.alert_type === "precio_subida";
        const pct = Math.abs(((Number(a.new_price) - Number(a.old_price)) / Number(a.old_price)) * 100).toFixed(0);
        notifs.push({
          id: `price-${a.id}`,
          type: "order",
          read: false,
          title: isUp ? "Precio de proveedor subió" : "Precio de proveedor bajó",
          description: `${productName}: ${isUp ? "+" : "-"}${pct}% (${formatCurrency(Number(a.old_price))} → ${formatCurrency(Number(a.new_price))})`,
          time: relativeTime(new Date(a.created_at)),
          href: "/dashboard/compras/analisis",
          priority: "low",
          createdAt: new Date(a.created_at),
        });
      });

      // ── ALERTA DE PLAN ────────────────────────────────────────────────────
      if (userCompanies) {
        const status = userCompanies.subscription_status || userCompanies.plan_status;
        const trialEndsAt = userCompanies.trial_ends_at;
        const isDemoOrEnterprise = status === "demo" || userCompanies.plan_type === "enterprise";

        if (!isDemoOrEnterprise && trialEndsAt) {
          const daysLeft = differenceInDays(new Date(trialEndsAt), new Date());
          if (daysLeft >= 0 && daysLeft <= 7) {
            notifs.push({
              id: "plan-trial",
              type: "plan",
              read: false,
              title: daysLeft === 0 ? "Tu período de prueba vence hoy" : `Tu prueba vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`,
              description: "Actualiza tu plan para no perder el acceso a LUMIS",
              time: daysLeft === 0 ? "Hoy" : `En ${daysLeft} días`,
              href: "/dashboard/settings",
              priority: daysLeft <= 1 ? "high" : "medium",
              createdAt: new Date(),
            });
          }
        }
      }

      // ── ORDENAR ───────────────────────────────────────────────────────────
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = notifs
        .filter(n => !n.read)
        .sort((a, b) => {
          const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (pd !== 0) return pd;
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .slice(0, 20);

      setNotifications(sorted);
    } catch (err) {
      console.error("useNotifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [companyId, userCompanies]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // cada 5 min
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllRead, refetch: fetchNotifications };
}
