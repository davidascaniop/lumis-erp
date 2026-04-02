"use client";

import { Building2, Globe, MapPin } from "lucide-react";

export function GeoDistribution({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
       <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-base/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
             <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-1">Venezuela</p>
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Mercado principal</p>
          </div>
          <div className="ml-auto text-sm font-black text-text-1">100%</div>
       </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-base/50 border border-border/50 hover:bg-white hover:border-brand/40 transition-all">
          <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center font-bold text-brand shadow-sm">
             {item.flag ? <span className="text-sm">{item.flag}</span> : <MapPin className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-text-1">{item.location || 'Venezuela'}</h4>
            <div className="w-full h-1 bg-surface-hover rounded-full mt-1.5 overflow-hidden">
               <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${item.percentage}%` }} />
            </div>
          </div>
          <div className="text-right ml-2 shrink-0">
            <p className="text-sm font-black text-text-1">{item.count}</p>
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">{item.percentage}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}
