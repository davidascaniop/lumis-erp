"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export function IncomeBarChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="month"
            stroke="#9585B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9585B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18102A",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
            }}
            itemStyle={{
              fontSize: "12px",
              fontWeight: "bold",
            }}
            labelStyle={{
              color: "#9585B8",
              fontSize: "10px",
              marginBottom: "4px",
            }}
            formatter={(value: any, name: any) => [`$${Number(value).toLocaleString()}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
          <Bar dataKey="cobrados" name="Ingresos Cobrados" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="proyectados" name="Ingresos Proyectados" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
