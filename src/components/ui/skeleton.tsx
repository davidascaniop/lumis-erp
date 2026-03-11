import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-white/5 via-white/8 to-white/5",
        "bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]",
        className,
      )}
    />
  );
}

// Para tablas
export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4 rounded-xl bg-white/3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className={`h-4 flex-1 ${j === 0 ? "max-w-[80px]" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
