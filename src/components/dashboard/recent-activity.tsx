"use client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ShoppingCart, DollarSign, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function RecentActivity({ companyId }: { companyId: string }) {
  // En un entorno real, haríamos un fetch real de 'activity_log'.
  // Por ahora mockeamos para mostrar el layout
  const mockActivities = [
    {
      id: 1,
      type: "order_created",
      user: "Vendedor 1",
      entity: "Pedido #2478",
      time: new Date(),
    },
    {
      id: 2,
      type: "payment",
      user: "Cobranza",
      entity: "Factura FAC-0012",
      time: new Date(Date.now() - 3600000),
    },
    {
      id: 3,
      type: "note",
      user: "Admin",
      entity: "Cliente Megamart",
      time: new Date(Date.now() - 7200000),
    },
  ];

  return (
    <Card className="p-6 bg-surface-card border-border-brand shadow-card no-scrollbar">
      <h3 className="text-lg font-syne font-bold text-white mb-6">
        Actividad Reciente
      </h3>
      <div className="space-y-4">
        {mockActivities.map((act) => (
          <div
            key={act.id}
            className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0"
          >
            <div className="w-10 h-10 rounded-full flex-shrink-0 bg-brand-gradient flex items-center justify-center">
              {act.type === "order_created" && (
                <ShoppingCart className="w-5 h-5 text-white" />
              )}
              {act.type === "payment" && (
                <DollarSign className="w-5 h-5 text-white" />
              )}
              {act.type === "note" && <Edit className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-text-1">
                <span className="font-bold text-brand">{act.user}</span> ha
                actuado sobre {act.entity}
              </p>
              <p className="text-xs text-text-3 mt-1">
                {formatDistanceToNow(act.time, { addSuffix: true, locale: es })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
