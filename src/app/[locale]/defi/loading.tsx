import { Skeleton } from "@/components/ui/Skeleton";

export default function DefiLoading() {
  return (
    <div className="container-main py-10">
      {/* Page heading skeleton */}
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-5 w-120 max-w-full mb-8" />

      {/* Stats row skeleton — 6 cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-(--color-surface) p-4 md:p-5"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-5" />
            </div>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </section>

      {/* Chain distribution + category row */}
      <div className="grid gap-6 lg:grid-cols-2 mb-10">
        <div className="rounded-lg border border-border bg-(--color-surface) p-6">
          <Skeleton className="h-7 w-40 mb-4" />
          <Skeleton className="h-48 w-full rounded" />
        </div>
        <div className="rounded-lg border border-border bg-(--color-surface) p-6">
          <Skeleton className="h-7 w-44 mb-4" />
          <Skeleton className="h-48 w-full rounded" />
        </div>
      </div>

      {/* Table section heading */}
      <Skeleton className="h-8 w-52 mb-4" />

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-(--color-surface) overflow-hidden mb-10">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-surface-secondary">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-b-0"
          >
            <Skeleton className="h-4 w-6" />
            <div className="space-y-1 w-40">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24 ml-auto" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* News section skeleton */}
      <Skeleton className="h-7 w-36 mb-4" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-16/10 w-full rounded-lg" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
