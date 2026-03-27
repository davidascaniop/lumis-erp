"use client";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export function AlertsPanel({ clients }: { clients: any[] }) {
  if (!clients || clients.length === 0) {
    return (
      <Card className="p-6 bg-surface-card border-border shadow-card">
        <h3 className="text-lg font-syne font-bold text-text-1 mb-4">
          Requieren Atención
        </h3>
        <p className="text-sm text-text-3">
          Sin clientes en riesgo reportados.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-surface-card border-border shadow-card no-scrollbar overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-status-danger" />
        <h3 className="text-lg font-syne font-bold text-text-1">
          Riesgo Alto (Mora)
        </h3>
      </div>
      <div className="space-y-3">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/clientes/${c.id}`}
            className="block"
          >
            <div className="flex justify-between items-center p-3 rounded-xl bg-surface-base border border-border hover:border-status-danger/30 transition-colors">
              <div>
                <p className="text-sm font-semibold text-text-1">{c.name}</p>
                <p className="text-xs text-text-3">
                  {c.assigned_user?.full_name ?? "Sin Vendedor"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-status-danger">
                  ${Number(c.current_balance).toFixed(2)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
