const fs = require('fs');

const pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const returnIndex = pageContent.lastIndexOf('return (');

let dashboardViewCode = `'use client';
import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Wallet, CheckCircle, ShoppingCart, Loader2, Target, UserPlus, Package, BarChart3, DollarSign, ShieldCheck, Clock, AlertTriangle, ChevronRight, Bell } from 'lucide-react';
import { KpiCardWithSparkline } from '@/components/dashboard/kpi-card-sparkline';
import { formatCurrency } from '@/lib/utils';
import { countActiveAlerts } from '@/components/dashboard/active-alerts-panel';

const AgingChart = dynamic(() => import('@/components/dashboard/aging-chart').then(m => ({ default: m.AgingChart })), { ssr: false });
const AlertsPanel = dynamic(() => import('@/components/dashboard/alerts-panel').then(m => ({ default: m.AlertsPanel })), { ssr: false });
const ActiveAlertsPanel = dynamic(() => import('@/components/dashboard/active-alerts-panel').then(m => ({ default: m.ActiveAlertsPanel })), { ssr: false });
const RecentActivity = dynamic(() => import('@/components/dashboard/recent-activity').then(m => ({ default: m.RecentActivity })), { ssr: false });
const PortalPaymentsAlert = dynamic(() => import('@/components/dashboard/portal-payments-alert').then(m => ({ default: m.PortalPaymentsAlert })), { ssr: false });
const BroadcastBanner = dynamic(() => import('@/components/dashboard/broadcast-banner').then(m => ({ default: m.BroadcastBanner })), { ssr: false });
const DailySeed = dynamic(() => import('@/components/dashboard/daily-seed').then(m => ({ default: m.DailySeed })), { ssr: false });

export function DashboardView({ data, firstName, user }: {data: any, firstName: string, user: any}) {
  const [period, setPeriod] = useState('mes');
  
  const getGreetingEmoji = () => { const h = new Date().getHours(); return h < 12 ? '🌅' : h < 18 ? '☀️' : '🌙'; };
  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'; };
  const formatDateEs = (d: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return \`\${days[d.getDay()]}, \${d.getDate()} de \${months[d.getMonth()]} \${d.getFullYear()}\`;
  };

  const alertCount = countActiveAlerts({
    lowStockProducts: data.lowStockProducts,
    overdueReceivables: data.overdueReceivables,
    activeRecurringAlerts: data.activeRecurringAlerts,
    inactiveClients: data.inactiveClients,
  });

` + pageContent.substring(returnIndex);

dashboardViewCode = dashboardViewCode.replace(/animate-ping/g, '');
dashboardViewCode = dashboardViewCode.replace(/animate-pulse/g, '');
dashboardViewCode = dashboardViewCode.replace(/hover-card-effect/g, 'hover:shadow-md transition-shadow duration-150');
dashboardViewCode = dashboardViewCode.replace(/<button[\s\S]*?className=\"px-4 py-1\.5 rounded-lg text-xs font-semibold capitalize transition-all text-text-2\">([\s\S]*?)<\/button>/g, '<button onClick={() => setPeriod("$1")} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${period === "$1" ? "bg-gradient-to-r from-brand to-brand-dark text-white shadow-brand" : "text-text-2 hover:text-text-1"}`}>$1</button>');

fs.writeFileSync('src/components/dashboard/dashboard-view.tsx', dashboardViewCode);

let serverCode = `import { createClient } from '@/lib/supabase/server';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { Suspense } from 'react';

` + pageContent.substring(pageContent.indexOf('export default async function DashboardPage'), returnIndex);

serverCode += `
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#9585B8]">Cargando dashboard...</div>}>
      <DashboardView data={data} firstName={firstName} user={user} />
    </Suspense>
  );
}

function calcAging(receivables: any[], today: Date) {
  const r = { corriente: 0, d1_7: 0, d8_15: 0, d16_30: 0, mas30: 0 };
  receivables.forEach(({ balance_usd, due_date }) => {
    const days = Math.ceil(
      (today.getTime() - new Date(due_date).getTime()) / 86400000,
    );
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

function groupByDay(
  rows: any[],
  dateField: string,
  valueField: string,
): { v: number }[] {
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
    const key = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}\`;
    map.set(key, (map.get(key) ?? 0) + (Number(r[valueField]) || 0));
  });
  const months = [ "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" ];
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      month: months[parseInt(key.split("-")[1]) - 1],
      total: Math.round(total * 100) / 100,
    }));
}
`;

fs.writeFileSync('src/app/dashboard/page.tsx', serverCode);
console.log('Split completed');
