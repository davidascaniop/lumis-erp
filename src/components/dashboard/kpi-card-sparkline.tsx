"use client";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

interface KpiCardWithSparklineProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  glowColor: string;
  value: string;
  label: string;
  sublabel?: string;
  delta?: number;
  sparkData?: { v: number }[];
  sparkColor?: string;
  href?: string;
}

export function KpiCardWithSparkline({
  icon,
  iconBg,
  iconColor,
  glowColor,
  value,
  label,
  sublabel,
  delta,
  sparkData,
  sparkColor = "#E040FB",
}: KpiCardWithSparklineProps) {
  const gradientId = `sg-${label.replace(/\s/g, "-")}`;

  return (
    <div
      className="relative bg-[#18102A] border border-white/[0.06] rounded-2xl p-4 overflow-hidden
                        hover:border-[rgba(224,64,251,0.20)] hover:-translate-y-0.5
                        transition-all duration-200 group card-enter h-[140px] flex flex-col justify-between"
    >
      {/* Glow en hover */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: glowColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-2 relative">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {delta !== undefined && delta !== 0 && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              delta >= 0
                ? "bg-[rgba(0,229,204,0.10)] text-[#00E5CC]"
                : "bg-[rgba(255,45,85,0.10)] text-[#FF2D55]"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Valor */}
      <div className="font-primary text-2xl leading-tight mb-0.5 relative">
        {value}
      </div>
      <p className="text-[11px] text-[#9585B8] relative">
        {label}{" "}
        {sublabel && <span className="text-[#3D2D5C]">· {sublabel}</span>}
      </p>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div className="mt-3 h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={true}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div
                      className="bg-[#1F1535] border border-white/10 rounded-lg
                                                        px-2 py-1 text-[10px] font-mono text-white shadow-elevated"
                    >
                      {payload[0].value}
                    </div>
                  ) : null
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Línea inferior hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-b-2xl
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, ${sparkColor}, transparent)`,
        }}
      />
    </div>
  );
}
