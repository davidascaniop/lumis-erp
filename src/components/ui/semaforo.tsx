import { cn } from "@/lib/utils";

type Status = "green" | "yellow" | "red";

const map = {
  green: { label: "Al día" },
  yellow: { label: "Por vencer" },
  red: { label: "Mora vencida" },
};

export function Semaforo({
  status,
  showLabel,
}: {
  status: Status;
  showLabel?: boolean;
}) {
  const s = map[status] ?? map.green;

  return (
    <div className="flex items-center gap-2">
      {status === "red" ? (
        /* Rojo con ping doble animado */
        <div className="relative w-2 h-2 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-[#FF2D55]" />
          <div className="absolute inset-0 rounded-full bg-[#FF2D55] animate-ping opacity-60" />
        </div>
      ) : status === "yellow" ? (
        /* Amarillo con glow */
        <div
          className="w-2 h-2 rounded-full bg-[#FFB800] flex-shrink-0
                                shadow-[0_0_8px_rgba(255,184,0,0.60)]"
        />
      ) : (
        /* Verde con glow */
        <div
          className="w-2 h-2 rounded-full bg-[#00E5CC] flex-shrink-0
                                shadow-[0_0_8px_rgba(0,229,204,0.60)]"
        />
      )}
      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold",
            status === "green"
              ? "text-[#00E5CC]"
              : status === "yellow"
                ? "text-[#FFB800]"
                : "text-[#FF2D55]",
          )}
        >
          {s.label}
        </span>
      )}
    </div>
  );
}
