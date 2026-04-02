"use client";

import { Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      {companies.map((company) => {
        const isMamiDeCompras = company.name.toLowerCase().includes("mami de compras");
        const showDemoBadge = company.subscription_status === 'demo' || isMamiDeCompras;

        return (
          <Link
            key={company.id}
            href={`/superadmin/clientes/empresas/${company.id}`}
            className="flex items-center justify-between p-4 rounded-[20px] bg-surface-base/40 border border-border/40 hover:bg-white hover:shadow-xl hover:shadow-brand/5 hover:border-brand/30 group transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/10 flex items-center justify-center font-black text-brand shadow-sm group-hover:scale-105 transition-transform">
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-black text-text-1 group-hover:text-brand transition-colors leading-none">{company.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2.5 py-0 h-5 border-2 transition-all",
                      showDemoBadge 
                        ? "border-status-info/30 bg-status-info/5 text-status-info" 
                        : "border-brand/20 bg-brand/5 text-brand"
                    )}
                  >
                    {showDemoBadge ? "DEMO" : (company.plan_type || "BASIC")}
                  </Badge>
                  {company.subscription_status === 'trial' && (
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 h-5 border-status-warn/20 bg-status-warn/5 text-status-warn">
                      TRIAL
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="font-heading text-lg font-black text-text-1 tabular-nums transition-all group-hover:text-brand group-hover:scale-110">{company.activityCount || 0}</p>
                <p className="text-[9px] font-black text-text-3 uppercase tracking-widest -mt-1 group-hover:text-brand/50">Órdenes</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-base border border-border/50 flex items-center justify-center group-hover:bg-brand/10 group-hover:border-brand/20 transition-all">
                <ChevronRight className="w-4 h-4 text-text-3 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  );
}
