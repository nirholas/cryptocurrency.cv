import { Skeleton } from "@/components/ui/Skeleton";

export default function CoinLoading() {
  return (
    <div className="container-main py-10">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Coin header skeleton */}
      <div className="flex items-start gap-4 mb-8">
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-7 w-10 rounded-full" />
          </div>
          <div className="flex items-baseline gap-4">
            <Skeleton className="h-12 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Chart placeholder skeleton */}
      <div className="mb-10">
        <Skeleton className="h-92.5 w-full rounded-xl" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-(--color-surface) p-4"
          >
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Description skeleton */}
      <div className="mb-10 space-y-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Related news skeleton */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-16/10 w-full rounded-lg" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
