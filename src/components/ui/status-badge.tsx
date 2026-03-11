import { cn } from "@/lib/utils";

const BADGE_CONFIG: Record<string, { label: string; cls: string }> = {
  // Pedidos
  draft: { label: "Borrador", cls: "bg-white/6 text-[#9585B8] border-white/8" },
  confirmed: {
    label: "Confirmado",
    cls: "bg-[rgba(79,195,247,0.10)] text-[#4FC3F7] border-[rgba(79,195,247,0.20)]",
  },
  dispatched: {
    label: "Despachado",
    cls: "bg-[rgba(255,184,0,0.10)] text-[#FFB800] border-[rgba(255,184,0,0.20)]",
  },
  delivered: {
    label: "Entregado",
    cls: "bg-[rgba(0,229,204,0.10)] text-[#00E5CC] border-[rgba(0,229,204,0.20)]",
  },
  cancelled: {
    label: "Cancelado",
    cls: "bg-[rgba(255,45,85,0.10)] text-[#FF2D55] border-[rgba(255,45,85,0.20)]",
  },
  pending: {
    label: "Pendiente",
    cls: "bg-[rgba(255,184,0,0.10)] text-[#FFB800] border-[rgba(255,184,0,0.20)]",
  },
  completed: {
    label: "Pagado",
    cls: "bg-[rgba(0,229,204,0.10)] text-[#00E5CC] border-[rgba(0,229,204,0.20)]",
  },
  // Cobranza
  open: {
    label: "Abierta",
    cls: "bg-[rgba(79,195,247,0.10)] text-[#4FC3F7] border-[rgba(79,195,247,0.20)]",
  },
  partial: {
    label: "Con Abono",
    cls: "bg-[rgba(255,184,0,0.10)] text-[#FFB800] border-[rgba(255,184,0,0.20)]",
  },
  paid: {
    label: "Pagado",
    cls: "bg-[rgba(0,229,204,0.10)] text-[#00E5CC] border-[rgba(0,229,204,0.20)]",
  },
  overdue: {
    label: "Vencida",
    cls: "bg-[rgba(255,45,85,0.10)] text-[#FF2D55] border-[rgba(255,45,85,0.20)]",
  },
  // Pagos
  verified: {
    label: "Verificado",
    cls: "bg-[rgba(0,229,204,0.10)] text-[#00E5CC] border-[rgba(0,229,204,0.20)]",
  },
  rejected: {
    label: "Rechazado",
    cls: "bg-[rgba(255,45,85,0.10)] text-[#FF2D55] border-[rgba(255,45,85,0.20)]",
  },
};

type StatusKey = keyof typeof BADGE_CONFIG;

export function StatusBadge({ status }: { status: string }) {
  const c = BADGE_CONFIG[status as StatusKey] ?? {
    label: status,
    cls: "bg-white/6 text-[#9585B8] border-white/8",
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
