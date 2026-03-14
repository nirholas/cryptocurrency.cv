import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <section className="border-b border-border">
        <div className="container-main py-8 lg:py-10">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[16/10] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* Top stories grid skeleton */}
      <section className="border-b border-border">
        <div className="container-main py-8 lg:py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets snapshot skeleton */}
      <section className="border-b border-border">
        <div className="container-main py-6">
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest + Sidebar skeleton */}
      <section className="container-main py-8 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Latest feed skeleton */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 pb-6 border-b border-border"
                >
                  <Skeleton className="aspect-square w-20 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <aside className="space-y-8">
            <div>
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-3 pb-4 border-b border-border"
                  >
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="h-6 w-28 mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            </div>

            <Skeleton className="h-48 w-full rounded-lg" />
          </aside>
        </div>
      </section>
    </div>
  );
}
