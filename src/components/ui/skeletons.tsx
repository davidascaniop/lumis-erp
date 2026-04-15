"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-64 rounded-lg mb-2" />
          <div className="skeleton h-4 w-48 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-20 rounded-full" />
          <div className="skeleton h-9 w-20 rounded-full" />
          <div className="skeleton h-9 w-20 rounded-full" />
        </div>
      </div>

      {/* Broadcast banner */}
      <div className="skeleton h-14 w-full rounded-2xl" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-card border border-border rounded-2xl p-5 space-y-3"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
            <div className="skeleton h-7 w-20 rounded" />
            <div className="skeleton h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-surface-card border border-border rounded-2xl p-6">
          <div className="skeleton h-5 w-32 rounded mb-6" />
          <div className="flex items-end gap-3 h-48">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className="skeleton w-full rounded-t-lg"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
                <div className="skeleton h-3 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          <div className="skeleton h-5 w-32 rounded mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-20 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
          <div className="skeleton h-5 w-40 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-6 h-6 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-3 w-32 rounded mb-1" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
              <div className="skeleton h-4 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
          <div className="skeleton h-5 w-40 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-5 h-5 rounded" />
              <div className="flex-1">
                <div className="skeleton h-3 w-40 rounded mb-1" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
              <div className="skeleton h-4 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card animate-fade-in">
      {/* Search bar skeleton */}
      <div className="p-4 border-b border-border bg-surface-base/50">
        <div className="skeleton h-10 w-96 rounded-lg" />
      </div>
      {/* Table header */}
      <div className="px-6 py-3 border-b border-border bg-surface-base/80 flex gap-6">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton h-3 rounded flex-1" style={{ maxWidth: i === 0 ? 120 : 80 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 border-b border-border/30 flex items-center gap-6"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="flex-1" style={{ maxWidth: j === 0 ? 120 : j === columns - 1 ? 60 : 100 }}>
              <div className="skeleton h-4 w-full rounded" />
              {j === 0 && <div className="skeleton h-3 w-16 rounded mt-1" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-48 rounded-lg mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="skeleton h-11 w-40 rounded-xl" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div>
              <div className="skeleton h-3 w-16 rounded mb-2" />
              <div className="skeleton h-6 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Search */}
      <div className="skeleton h-12 w-full rounded-xl" />
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-surface-card border border-border rounded-xl overflow-hidden">
            <div className="skeleton h-40 w-full" />
            <div className="p-5 space-y-3">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
              <div className="flex justify-between pt-3 border-t border-border">
                <div className="skeleton h-6 w-16 rounded" />
                <div className="skeleton h-4 w-12 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
