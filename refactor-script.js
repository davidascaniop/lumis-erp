const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Quitar use client
code = code.replace(/\"use client\";\n/g, '');
code = code.replace(/import { useState, useEffect } from \"react\";\n/g, '');
code = code.replace(/import { useUser } from \"@\/hooks\/use-user\";\n/g, '');
code = code.replace(/import { useDataCache } from \"@\/lib\/data-cache\";\n/g, '');
code = code.replace(/import { createClient } from \"@\/lib\/supabase\/client\";\n/g, 'import { createClient } from \"@/lib/supabase/server\";\n');

// Cambiar def de funcion
code = code.replace('export default function DashboardPage() {', 'export default async function DashboardPage() {\n  const [period, setPeriod] = ["mes", () => {}];\n');

// Cortar el cuerpo
const startStr = "const supabase = createClient();";
const endStr = "if (!data)\n    return <div className=\"p-8 text-[#9585B8]\">Falta configurar empresa.</div>;";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

const newLogic = `
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return <div className="p-8 text-[#9585B8]">Falta configurar empresa.</div>;

  const { data: userData } = await supabase.from('users').select('company_id, full_name').eq('auth_id', user.id).single();
  const companyId = userData?.company_id;
  if (!companyId) return <div className="p-8 text-[#9585B8]">Falta configurar empresa.</div>;

  const today = new Date();
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
  ] = await Promise.all([
    supabase.from("receivables").select("id, invoice_number, partner_id, balance_usd, amount_usd, due_date, status, created_at, partners(name)").eq("company_id", companyId).neq("status", "paid"),
    supabase.from("payments").select("id, amount_usd, status, verified_at, created_at").eq("company_id", companyId).in("status", ["verified", "pending"]),
    supabase.from("partners").select("id, name, current_balance, credit_status, created_at, last_order_at, users(full_name)").eq("company_id", companyId),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["draft", "confirmed", "dispatched", "pending"]),
    supabase.from("orders").select("total_usd, created_at").eq("company_id", companyId).gte("created_at", eightMonthsAgo).order("created_at", { ascending: true }),
    supabase.from("products").select("id, name, stock, unit, min_stock").eq("company_id", companyId).not("min_stock", "is", null).order("stock", { ascending: true }).limit(5),
    supabase.from("order_items").select("product_id, qty, subtotal, products(name, unit), orders!inner(company_id, created_at)").eq("orders.company_id", companyId).gte("orders.created_at", startMonth),
    supabase.from("recurring_expenses").select("*").eq("company_id", companyId).eq("is_active", true),
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

  const totalCartera = allReceivables.reduce((s, r) => s + (r.balance_usd ?? 0), 0);
  const totalMora = allReceivables.filter((r) => new Date(r.due_date) < today).reduce((s, r) => s + (r.balance_usd ?? 0), 0);
  const recaudadoMes = pays.reduce((s, p) => s + (p.amount_usd ?? 0), 0);

  const activeRecurringAlerts = recurringAlerts.filter(r => { const day = Number(r.due_day); const todayNum = today.getDate(); return (day - todayNum) >= 0 && (day - todayNum) <= (r.alert_days || 3); });
  const porcentajeMora = totalCartera > 0 ? +((totalMora / totalCartera) * 100).toFixed(1) : 0;
  const collectionRate = recaudadoMes + totalCartera > 0 ? Math.round((recaudadoMes / (recaudadoMes + totalCartera)) * 100) : 0;

  const receivableSpark = groupByDay(allReceivables, "created_at", "balance_usd");
  const collectedSpark = groupByDay(pays, "verified_at", "amount_usd");
  const ordersSpark = groupByDay(ordersTrend, "created_at", "total_usd");
  const salesByMonth = groupByMonth(ordersTrend, "created_at", "total_usd");

  const lowStockProducts = lowStockRaw.filter((p) => p.min_stock && p.stock <= p.min_stock);
  const creditsDueToday = creditsDueRaw.map((r) => ({ id: r.id, client_name: r.partners?.name ?? "Sin nombre", amount: r.balance_usd ?? 0 }));

  const clientMap = new Map();
  topClientsRaw.forEach((r) => { const id = r.partner_id; const existing = clientMap.get(id); if (existing) { existing.total += r.balance_usd ?? 0; } else { clientMap.set(id, { name: r.partners?.name ?? "Sin nombre", total: r.balance_usd ?? 0 }); } });
  const topClients = [...clientMap.entries()].map(([id, v]) => ({ partner_id: id, ...v })).sort((a, b) => b.total - a.total).slice(0, 5);

  const productMap = new Map();
  topProductsRaw.forEach((r) => { const id = r.product_id; const existing = productMap.get(id); if (existing) { existing.qty += r.qty ?? 0; existing.revenue += r.subtotal ?? 0; } else { productMap.set(id, { name: r.products?.name ?? "Sin nombre", unit: r.products?.unit ?? "und", qty: r.qty ?? 0, revenue: r.subtotal ?? 0 }); } });
  const topProducts = [...productMap.entries()].map(([id, v]) => ({ product_id: id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const data = {
    companyId, totalCartera, totalMora, recaudadoMes, porcentajeMora, pendingOrders: pendingOrdersCount,
    pendingVerifications: pendingVerifCount, newClients: newClientsCount, collectionRate,
    aging: calcAging(allReceivables, today), mappedRiskClients: risks.map((r) => ({ ...r, assigned_user: r.users })),
    receivableSpark, collectedSpark, ordersSpark, salesByMonth, lowStockProducts, creditsDueToday,
    topClients, topProducts, activeRecurringAlerts, inactiveClients: inactiveClientsRaw, overdueReceivables: overdueReceivablesRaw
  };
`;

code = code.substring(0, startIndex) + newLogic + code.substring(endIndex);

// Replace firstName mapping
code = code.replace(/const firstName = user\?\.full_name\?\.split\(" "\)\[0\] \|\| "Usuario";/, 'const firstName = userData?.full_name?.split(" ")[0] || "Usuario";');

fs.writeFileSync('src/app/dashboard/page.tsx', code);
console.log('Successfully refactored src/app/dashboard/page.tsx');
