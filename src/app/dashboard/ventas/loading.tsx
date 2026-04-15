import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="skeleton h-8 w-48 rounded-lg mb-2" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>
      <TableSkeleton columns={7} rows={8} />
    </div>
  );
}
