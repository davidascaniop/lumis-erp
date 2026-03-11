"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function SaasLineChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18102A",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
            }}
            itemStyle={{
              color: "#E040FB",
              fontSize: "12px",
              fontWeight: "bold",
            }}
            labelStyle={{
              color: "#9585B8",
              fontSize: "10px",
              marginBottom: "4px",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Nuevas empresas"
            stroke="#E040FB"
            strokeWidth={3}
            dot={{ fill: "#E040FB", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
