'use client';
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
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const alertCount = countActiveAlerts({
    lowStockProducts: data.lowStockProducts,
    overdueReceivables: data.overdueReceivables,
    activeRecurringAlerts: data.activeRecurringAlerts,
    inactiveClients: data.inactiveClients,
  });

return (
            <div
              key={d.month}
              className="flex-1 flex flex-col items-center gap-2 group"
            >
              {/* Valor al hover (siempre visible si hay datos) */}
              <span
                className={`text-[10px] font-primary transition-opacity ${
                  hasValue
                    ? "text-brand opacity-100"
                    : "text-text-3 opacity-0 group-hover:opacity-100"
                }`}
              >
                {hasValue ? formatCurrency(d.total) : "$0"}
              </span>
              <div
                className={`w-full relative rounded-t-lg transition-all duration-200
                                            group-hover:opacity-80 cursor-default`}
                style={{
                  height: `${heightPct}%`,
                  background: hasValue
                    ? isLast
                      ? "linear-gradient(180deg, var(--brand), var(--brand-dark))"
                      : "linear-gradient(180deg, var(--brand-glow), var(--bg-card-hover))"
                    : "var(--bg-card-hover)",
                  boxShadow:
                    hasValue && isLast
                      ? "var(--shadow-brand)"
                      : "none",
                  borderRadius: "6px 6px 0 0",
                }}
              />
              <span
                className={`text-[10px] font-semibold ${
                  isLast
                    ? "text-brand"
                    : hasValue
                      ? "text-text-2"
                      : "text-text-3"
                }`}
              >
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Aging Calculator ─── */
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
