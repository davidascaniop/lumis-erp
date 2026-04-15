import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="skeleton h-8 w-40 rounded-lg mb-2" />
        <div className="skeleton h-4 w-80 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-card border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div>
              <div className="skeleton h-3 w-24 rounded mb-2" />
              <div className="skeleton h-7 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
      <TableSkeleton columns={6} rows={8} />
    </div>
  );
}
