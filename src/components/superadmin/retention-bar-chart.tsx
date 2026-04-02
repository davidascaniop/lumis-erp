"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1125] border border-border/50 rounded-xl p-3 shadow-xl">
        <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-1">
           {payload.map((p: any) => (
              <div key={p.name} className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                 <span className="text-xs font-bold text-white">{p.name}: {p.value}</span>
              </div>
           ))}
        </div>
      </div>
    );
  }
  return null;
};

export function RetentionBarChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
          barGap={6}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis
            dataKey="month"
            stroke="#9585B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#9585B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="renewed" 
            name="Renovaciones" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]} 
            barSize={12}
          />
          <Bar 
            dataKey="cancelled" 
            name="Cancelaciones" 
            fill="#EF4444" 
            radius={[4, 4, 0, 0]} 
            barSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
