"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function PlanDonutChart({ data }: { data: any[] }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-[200px] w-full relative">
      <div className="h-full w-full absolute inset-0 pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18102A",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
              }}
              itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
              labelStyle={{ display: "none" }}
              // @ts-ignore
              formatter={(val: number) => [`${val} empresas`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute inset-0 pb-6 flex items-center justify-center flex-col pointer-events-none">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-[10px] text-[#9585B8]">Total</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 flex-wrap">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[10px] text-[#9585B8]">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
