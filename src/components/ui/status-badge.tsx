import { cn } from "@/lib/utils";

const BADGE_CONFIG: Record<string, { label: string; cls: string }> = {
  // Pedidos / Órdenes
  draft: { label: "Borrador", cls: "bg-surface-base text-text-3 border-border" },
  confirmed: {
    label: "Confirmado",
    cls: "bg-status-info/10 text-status-info border-status-info/20",
  },
  dispatched: {
    label: "Despachado",
    cls: "bg-status-info/10 text-status-info border-status-info/20",
  },
  delivered: {
    label: "Entregado",
    cls: "bg-status-ok/10 text-status-ok border-status-ok/20",
  },
  cancelled: {
    label: "Cancelado",
    cls: "bg-status-danger/10 text-status-danger border-status-danger/20",
  },
  pending: {
    label: "Pendiente",
    cls: "bg-status-warn/10 text-status-warn border-status-warn/20",
  },
  completed: {
    label: "Pagado",
    cls: "bg-status-ok/10 text-status-ok border-status-ok/20",
  },
  // Cobranza
  open: {
    label: "Abierta",
    cls: "bg-status-info/10 text-status-info border-status-info/20",
  },
  partial: {
    label: "Con Abono",
    cls: "bg-status-warn/10 text-status-warn border-status-warn/20",
  },
  paid: {
    label: "Pagado",
    cls: "bg-status-ok/10 text-status-ok border-status-ok/20",
  },
  overdue: {
    label: "Vencida",
    cls: "bg-status-danger/10 text-status-danger border-status-danger/20",
  },
  // Pagos
  verified: {
    label: "Verificado",
    cls: "bg-status-ok/10 text-status-ok border-status-ok/20",
  },
  rejected: {
    label: "Rechazado",
    cls: "bg-status-danger/10 text-status-danger border-status-danger/20",
  },
  // Despachos
  pending_dispatch: {
    label: "Pendiente",
    cls: "bg-surface-base text-text-3 border-border",
  },
  preparing: {
    label: "Preparando",
    cls: "bg-status-warn/10 text-status-warn border-status-warn/20",
  },
  in_transit: {
    label: "En Tránsito",
    cls: "bg-[#7C4DFF]/10 text-[#7C4DFF] border-[#7C4DFF]/20",
  },
  returned: {
    label: "Devuelto",
    cls: "bg-status-danger/10 text-status-danger border-status-danger/20",
  },
};

type StatusKey = keyof typeof BADGE_CONFIG;

export function StatusBadge({ status }: { status: string }) {
  const c = BADGE_CONFIG[status as StatusKey] ?? {
    label: status,
    cls: "bg-surface-base text-text-3 border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-semibold border",
        c.cls,
      )}
    >
      {c.label}
    </span>
  );
}
