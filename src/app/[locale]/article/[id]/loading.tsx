import { Skeleton } from "@/components/ui/Skeleton";

export default function ArticleLoading() {
  return (
    <div className="container-main py-10">
      {/* Breadcrumb skeleton */}
      <nav className="mb-6 max-w-[720px] mx-auto">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
      </nav>

      <article className="max-w-[720px] mx-auto">
        {/* Header skeleton */}
        <header className="mb-8">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>

          {/* Title */}
          <div className="space-y-3 mb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
          </div>

          {/* Meta — source, date, reading time */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-1" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </header>

        {/* AI Summary skeleton */}
        <div className="mb-8 p-5 rounded-lg border border-border bg-surface-secondary">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Content paragraphs skeleton */}
        <div className="mb-8 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          {/* CTA button skeleton */}
          <Skeleton className="h-11 w-64 rounded-lg mt-6" />
        </div>

        {/* Share bar skeleton */}
        <div className="mb-8 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded" />
            ))}
          </div>
        </div>

        {/* Tags skeleton */}
        <div className="mb-8 pt-6 border-t border-border">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        </div>

        {/* Related articles skeleton */}
        <div className="pt-8 border-t border-border">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
