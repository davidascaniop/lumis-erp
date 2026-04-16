"use client";
import CountUp from "react-countup";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delta?: number;
  icon: LucideIcon;
  variant?: "default" | "danger" | "success" | "warn";
}

const variantMap = {
  default: {
    iconBg: "bg-[rgba(224,64,251,0.08)]",
    iconColor: "text-[#E040FB]",
    glowColor: "rgba(224,64,251,0.08)",
    accentGradient: "linear-gradient(90deg, #E040FB, #7C4DFF)",
  },
  danger: {
    iconBg: "bg-[rgba(255,45,85,0.08)]",
    iconColor: "text-[#FF2D55]",
    glowColor: "rgba(255,45,85,0.08)",
    accentGradient: "linear-gradient(90deg, #FF2D55, #FF6B8A)",
  },
  success: {
    iconBg: "bg-[rgba(0,229,204,0.08)]",
    iconColor: "text-[#00E5CC]",
    glowColor: "rgba(0,229,204,0.08)",
    accentGradient: "linear-gradient(90deg, #00E5CC, #4FC3F7)",
  },
  warn: {
    iconBg: "bg-[rgba(255,184,0,0.08)]",
    iconColor: "text-[#FFB800]",
    glowColor: "rgba(255,184,0,0.08)",
    accentGradient: "linear-gradient(90deg, #FFB800, #FF8C00)",
  },
};

export function KpiCard({
  label,
  value,
  prefix = "$",
  suffix = "",
  decimals = 2,
  delta,
  icon: Icon,
  variant = "default",
}: KpiCardProps) {
  const v = variantMap[variant];
  return (
    <div
      className={cn(
        "relative rounded-2xl p-5 overflow-hidden",
        "bg-[#18102A] border border-white/[0.06]",
        "hover:border-[rgba(224,64,251,0.20)] hover:-translate-y-0.5",
        "transition-all duration-200 card-enter group cursor-default",
      )}
    >
      {/* Glow fondo en hover */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-2xl pointer-events-none"
        style={{ background: v.glowColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className={cn("p-2.5 rounded-xl", v.iconBg)}>
          <Icon className={cn("w-4 h-4", v.iconColor)} strokeWidth={2} />
        </div>
        {delta !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full",
              delta >= 0
                ? "bg-[rgba(0,229,204,0.08)] text-[#00E5CC]"
                : "bg-[rgba(255,45,85,0.08)] text-[#FF2D55]",
            )}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Valor */}
      <CountUp
        end={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        duration={1.4}
        separator="."
        decimal=","
        className="font-mono text-3xl font-bold text-white tracking-tight block mb-1 relative"
      />
      <p className="text-xs text-[#9585B8] font-medium relative">{label}</p>

      {/* Línea inferior en hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-b-2xl
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: v.accentGradient }}
      />
    </div>
  );
}
