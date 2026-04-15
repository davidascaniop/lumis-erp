export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div>
          <div className="skeleton h-7 w-48 rounded-lg mb-1" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
      </div>

      {/* Main grid: Products + Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Products grid */}
        <div className="space-y-4">
          {/* Search + Categories */}
          <div className="flex gap-3">
            <div className="skeleton h-11 flex-1 rounded-xl" />
            <div className="skeleton h-11 w-32 rounded-xl" />
          </div>
          {/* Category pills */}
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-20 rounded-full" />
            ))}
          </div>
          {/* Product cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-surface-card border border-border rounded-xl overflow-hidden">
                <div className="skeleton h-24 w-full" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-5 w-16 rounded" />
                  <div className="skeleton h-2 w-12 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart panel */}
        <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-4 h-fit">
          <div className="skeleton h-6 w-32 rounded" />
          {/* Client selector */}
          <div className="skeleton h-11 w-full rounded-xl" />
          {/* Empty cart items */}
          <div className="space-y-3 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton h-3 w-24 rounded mb-1" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
                <div className="skeleton h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="skeleton h-4 w-12 rounded" />
              <div className="skeleton h-6 w-24 rounded" />
            </div>
          </div>
          {/* Submit button */}
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
