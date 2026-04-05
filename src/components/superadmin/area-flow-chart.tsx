"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export function AreaFlowChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEgreso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E040FB" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#E040FB" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10B981" fillOpacity={1} fill="url(#colorIngreso)" strokeWidth={2} />
          <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#F43F5E" fillOpacity={1} fill="url(#colorEgreso)" strokeWidth={2} />
          <Area type="monotone" dataKey="neto" name="Saldo Neto" stroke="#E040FB" fillOpacity={1} fill="url(#colorNeto)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
