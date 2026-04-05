"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export function MrrBreakdownChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
            tickFormatter={(value) => `$${value}`}
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
            formatter={(value: any, name: any) => [`$${value.toLocaleString()}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
          <Line type="monotone" dataKey="neto" name="MRR Neto" stroke="#E040FB" strokeWidth={3} dot={{ fill: "#E040FB" }} />
          <Line type="monotone" dataKey="nuevo" name="MRR Nuevo" stroke="#10B981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="cancelado" name="MRR Cancelado" stroke="#F43F5E" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
