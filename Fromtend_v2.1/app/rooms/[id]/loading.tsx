import { Skeleton } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-void pt-24 pb-32">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-[4/3] skeleton-shimmer" />
          <div className="space-y-4">
            <div className="h-8 w-1/3 skeleton-shimmer" />
            <div className="h-4 w-2/3 skeleton-shimmer" />
            <div className="h-64 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
