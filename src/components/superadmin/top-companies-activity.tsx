"use client";

import { Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function TopCompaniesActivity({ companies }: { companies: any[] }) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-10 bg-surface-base rounded-2xl border border-dashed border-border px-4">
        <p className="text-sm font-medium text-text-3">No hay actividad registrada este mes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <Link
          key={company.id}
          href={`/superadmin/clientes/empresas/${company.id}`}
          className="flex items-center justify-between p-3 rounded-2xl bg-surface-base/50 border border-border/50 hover:bg-white hover:border-brand/40 group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/10 flex items-center justify-center font-bold text-brand shadow-sm">
              {company.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{company.name}</h4>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 h-4 border-brand/20 bg-brand/5 text-brand mt-1">
                {company.plan_type || "BASIC"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-text-1">{company.activityCount || 0}</p>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Órdenes</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-3 group-hover:text-brand group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  );
}
