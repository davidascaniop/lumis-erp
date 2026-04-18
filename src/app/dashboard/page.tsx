import { createClient } from '@/lib/supabase/server';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { Suspense } from 'react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return <div className="p-8 text-[#9585B8]">Falta configurar empresa.</div>;

  const { data: userData } = await supabase.from('users').select('id, company_id, full_name').eq('auth_id', user.id).single();
  const companyId = userData?.company_id;
  if (!companyId) return <div className="p-8 text-[#9585B8]">Falta configurar empresa.</div>;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString();
  const eightMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 7, 1).toISOString();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const [
    allReceivablesRes,
    allPaymentsRes,
    allPartnersRes,
    ordersActiveRes,
    ordersTrendRes,
    lowStockRes,
    topProductsRes,
    recurringRes,
    portalPaymentsRes,
    dailySeedRes,
    broadcastsRes,
    broadcastReadsRes,
  ] = await Promise.all([
    supabase.from("receivables").select("id, invoice_number, partner_id, balance_usd, amount_usd, due_date, status, created_at, partners(name)").eq("company_id", companyId).neq("status", "paid"),
    supabase.from("payments").select("id, amount_usd, status, verified_at, created_at").eq("company_id", companyId).in("status", ["verified", "pending"]),
    supabase.from("partners").select("id, name, current_balance, credit_status, created_at, last_order_at, users(full_name)").eq("company_id", companyId),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["draft", "confirmed", "dispatched", "pending"]),
    supabase.from("orders").select("total_usd, created_at").eq("company_id", companyId).gte("created_at", eightMonthsAgo).order("created_at", { ascending: true }),
    supabase.from("products").select("id, name, stock, unit, min_stock").eq("company_id", companyId).not("min_stock", "is", null).order("stock", { ascending: true }).limit(5),
    supabase.from("order_items").select("product_id, qty, subtotal, products(name, unit), orders!inner(company_id, created_at)").eq("orders.company_id", companyId).gte("orders.created_at", startMonth),
    supabase.from("recurring_expenses").select("*").eq("company_id", companyId).eq("is_active", true),
    // FIX #1: Mover re-fetches de cliente a SSR
    supabase.from("activity_log").select("id, content, created_at, entity_id, metadata").eq("company_id", companyId).eq("type", "client_payment").order("created_at", { ascending: false }).limit(10),
    supabase.from("daily_seeds").select("id, verse, verse_reference, reflection, scheduled_date, blessings_count, status").eq("scheduled_date", todayStr).eq("status", "published").maybeSingle(),
    supabase.from("broadcasts").select("id, title, message, type, is_active, expires_at, created_at").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("broadcast_reads").select("broadcast_id").eq("user_id", userData?.id ?? ""),
  ]);

  const allReceivables = allReceivablesRes.data || [];
  let creditsDueRaw = allReceivables.filter((r) => { const d = r.due_date; return d && d >= todayStart && d < todayEnd; });
  let topClientsRaw = allReceivables;
  let overdueReceivablesRaw = allReceivables.filter((r) => r.due_date && r.due_date < todayStart).sort((a, b) => (a.due_date > b.due_date ? 1 : -1)).slice(0, 10);

  const allPayments = allPaymentsRes.data || [];
  let pays = allPayments.filter((p) => p.status === "verified" && p.verified_at && p.verified_at >= startMonth);
  let pendingVerifCount = allPayments.filter((p) => p.status === "pending").length;

  const allPartners = allPartnersRes.data || [];
  let risks = allPartners.filter((p) => p.credit_status === "red").sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0)).slice(0, 6);
  let newClientsCount = allPartners.filter((p) => p.created_at && p.created_at >= startMonth).length;
  let inactiveClientsRaw = allPartners.filter((p) => p.last_order_at && p.last_order_at < thirtyDaysAgo).sort((a, b) => (a.last_order_at > b.last_order_at ? 1 : -1)).slice(0, 10);

  let ordersTrend = ordersTrendRes.data || [];
  let lowStockRaw = lowStockRes.data || [];
  let topProductsRaw = topProductsRes.data || [];
  let recurringAlerts = recurringRes.data || [];
  let pendingOrdersCount = ordersActiveRes.count ?? 0;

  // Single-pass sobre allReceivables: antes eran 2 iteraciones (reduce + filter+reduce)
  const { totalCartera, totalMora } = allReceivables.reduce(
    (acc, r) => {
      const balance = r.balance_usd ?? 0;
      acc.totalCartera += balance;
      if (new Date(r.due_date) < today) acc.totalMora += balance;
      return acc;
    },
    { totalCartera: 0, totalMora: 0 },
  );
  const recaudadoMes = pays.reduce((s, p) => s + (p.amount_usd ?? 0), 0);

  const activeRecurringAlerts = recurringAlerts.filter(r => { const day = Number(r.due_day); const todayNum = today.getDate(); return (day - todayNum) >= 0 && (day - todayNum) <= (r.alert_days || 3); });
  const porcentajeMora = totalCartera > 0 ? +((totalMora / totalCartera) * 100).toFixed(1) : 0;
  const collectionRate = recaudadoMes + totalCartera > 0 ? Math.round((recaudadoMes / (recaudadoMes + totalCartera)) * 100) : 0;

  const receivableSpark = groupByDay(allReceivables, "created_at", "balance_usd");
  const collectedSpark = groupByDay(pays, "verified_at", "amount_usd");
  const ordersSpark = groupByDay(ordersTrend, "created_at", "total_usd");
  const salesByMonth = groupByMonth(ordersTrend, "created_at", "total_usd");

  const lowStockProducts = lowStockRaw.filter((p) => p.min_stock && p.stock <= p.min_stock);
  const creditsDueToday = creditsDueRaw.map((r) => ({ id: r.id, client_name: (r.partners as any)?.name ?? "Sin nombre", amount: r.balance_usd ?? 0 }));

  const clientMap = new Map();
  topClientsRaw.forEach((r) => { const id = r.partner_id; const existing = clientMap.get(id); if (existing) { existing.total += r.balance_usd ?? 0; } else { clientMap.set(id, { name: (r.partners as any)?.name ?? "Sin nombre", total: r.balance_usd ?? 0 }); } });
  const topClients = [...clientMap.entries()].map(([id, v]) => ({ partner_id: id, ...v })).sort((a, b) => b.total - a.total).slice(0, 5);

  const productMap = new Map();
  topProductsRaw.forEach((r) => { const id = r.product_id; const existing = productMap.get(id); if (existing) { existing.qty += r.qty ?? 0; existing.revenue += r.subtotal ?? 0; } else { productMap.set(id, { name: (r.products as any)?.name ?? "Sin nombre", unit: (r.products as any)?.unit ?? "und", qty: r.qty ?? 0, revenue: r.subtotal ?? 0 }); } });
  const topProducts = [...productMap.entries()].map(([id, v]) => ({ product_id: id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const firstName = userData?.full_name?.split(" ")[0] || "Usuario";

  // FIX #1: Procesar datos SSR para componentes de cliente
  const portalPayments = portalPaymentsRes.data || [];
  const dailySeed = dailySeedRes.data ?? null;
  const broadcastReadIds = new Set((broadcastReadsRes.data || []).map((r: any) => r.broadcast_id));
  const initialBroadcasts = (broadcastsRes.data || []).filter((b: any) => {
    if (broadcastReadIds.has(b.id)) return false;
    if (b.expires_at && new Date(b.expires_at) <= new Date()) return false;
    return true;
  });

  const data = {
    companyId, totalCartera, totalMora, recaudadoMes, porcentajeMora, pendingOrders: pendingOrdersCount,
    pendingVerifications: pendingVerifCount, newClients: newClientsCount, collectionRate,
    aging: calcAging(allReceivables, today), mappedRiskClients: risks.map((r) => ({ ...r, assigned_user: r.users })),
    receivableSpark, collectedSpark, ordersSpark, salesByMonth, lowStockProducts, creditsDueToday,
    topClients, topProducts, activeRecurringAlerts, inactiveClients: inactiveClientsRaw, overdueReceivables: overdueReceivablesRaw
  };

  return (
    <Suspense fallback={<div className="p-8 text-center text-[#9585B8]">Cargando dashboard...</div>}>
      <DashboardView
        data={data}
        firstName={firstName}
        user={user}
        portalPayments={portalPayments}
        dailySeed={dailySeed}
        broadcasts={initialBroadcasts}
      />
    </Suspense>
  );
}

function calcAging(receivables: any[], today: Date) {
  const r = { corriente: 0, d1_7: 0, d8_15: 0, d16_30: 0, mas30: 0 };
  receivables.forEach(({ balance_usd, due_date }) => {
    const days = Math.ceil((today.getTime() - new Date(due_date).getTime()) / 86400000);
    if (days <= 0) r.corriente += balance_usd ?? 0;
    else if (days <= 7) r.d1_7 += balance_usd ?? 0;
    else if (days <= 15) r.d8_15 += balance_usd ?? 0;
    else if (days <= 30) r.d16_30 += balance_usd ?? 0;
    else r.mas30 += balance_usd ?? 0;
  });
  return [
    { name: "Corriente", value: r.corriente, color: "#00E5CC" },
    { name: "1–7d", value: r.d1_7, color: "#7C4DFF" },
    { name: "8–15d", value: r.d8_15, color: "#FFB800" },
    { name: "16–30d", value: r.d16_30, color: "#FF8C00" },
    { name: "+30d", value: r.mas30, color: "#FF2D55" },
  ];
}

function groupByDay(rows: any[], dateField: string, valueField: string): { v: number }[] {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const day = r[dateField]?.substring(0, 10) ?? "";
    map.set(day, (map.get(day) ?? 0) + (Number(r[valueField]) || 0));
  });
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([, v]) => ({ v: Math.round(v * 100) / 100 }));
}

function groupByMonth(rows: any[], dateField: string, valueField: string) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = new Date(r[dateField]);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + (Number(r[valueField]) || 0));
  });
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      month: months[parseInt(key.split("-")[1]) - 1],
      total: Math.round(total * 100) / 100,
    }));
}
