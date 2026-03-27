"use client";
import { Card } from "@/components/ui/card";

export function AgingChart({ data }: { data: any[] }) {
  // A simple representation of an aging chart since recharts component causes size bloat initially.
  // I will implement a visual flex-bar for now to keep it lightweight, or basic Recharts if requested.
  return (
    <Card className="p-6 bg-surface-card border-border shadow-card">
      <h3 className="text-lg font-syne font-bold text-text-1 mb-4">
        Aging de Cartera
      </h3>
      <div className="flex h-48 items-end gap-2">
        {data.map((d, i) => {
          const height =
            Math.max(10, Math.min(100, (d.value / 1000) * 100)) + "%";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-text-3">
                ${d.value.toFixed(0)}
              </span>
              <div
                className="w-full rounded-t-sm transition-all hover:opacity-80"
                style={{ height, backgroundColor: d.color }}
              />
              <span className="text-xs text-text-2 font-medium">{d.name}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
