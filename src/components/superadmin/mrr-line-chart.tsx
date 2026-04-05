"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MrrLineChart({ data }: { data: any[] }) {
  // If last MRR is less than previous, color is red, else primary
  const isUp = data.length < 2 || data[data.length - 1].count >= data[data.length - 2].count;
  const color = isUp ? "#E040FB" : "#F43F5E";

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
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18102A",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
            }}
            itemStyle={{
              color,
              fontSize: "12px",
              fontWeight: "bold",
            }}
            labelStyle={{
              color: "#9585B8",
              fontSize: "10px",
              marginBottom: "4px",
            }}
            formatter={(value: any) => [`$${value.toLocaleString()}`, "MRR"]}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="MRR"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
