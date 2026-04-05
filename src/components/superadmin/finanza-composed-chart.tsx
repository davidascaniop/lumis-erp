"use client";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export function FinanzaComposedChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
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
          <Bar dataKey="ingreso" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="costo" name="Costos" fill="#F43F5E" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="ganancia" name="Ganancia Neta" stroke="#E040FB" strokeWidth={3} dot={{ fill: "#E040FB" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
