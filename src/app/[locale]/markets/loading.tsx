import { Skeleton } from "@/components/ui/Skeleton";

export default function MarketsLoading() {
  return (
    <div className="container-main py-10">
      {/* Page heading skeleton */}
      <Skeleton className="h-10 w-40 mb-2" />
      <Skeleton className="h-5 w-96 max-w-full mb-8" />

      {/* Stats bar skeleton — 6 cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-(--color-surface) p-5"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </div>
        ))}
      </section>

      {/* Table heading skeleton */}
      <Skeleton className="h-7 w-52 mb-4" />

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-(--color-surface) overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-surface-secondary">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-b-0"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1 w-32">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-5 w-24 ml-auto" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
