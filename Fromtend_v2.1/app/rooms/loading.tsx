import { Skeleton } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-void pt-24 pb-32">
      <div className="container-custom">
        <div className="h-8 w-1/3 skeleton-shimmer mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] skeleton-shimmer" />
              <div className="h-4 w-2/3 skeleton-shimmer" />
              <div className="h-4 w-1/3 skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
