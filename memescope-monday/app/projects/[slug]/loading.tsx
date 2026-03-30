export default function ProjectLoading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content - 2 colonnes */}
          <div className="lg:col-span-2">
            {/* Modern Clean Header Skeleton */}
            <div className="py-6">
              {/* Version Desktop */}
              <div className="hidden items-center justify-between md:flex">
                {/* Left side: Logo + Title + Categories */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {/* Logo */}
                  <div className="bg-muted h-16 w-16 flex-shrink-0 animate-pulse rounded-lg"></div>

                  {/* Title and info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="bg-muted h-6 w-48 animate-pulse rounded-md"></div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1">
                      <div className="bg-muted h-5 w-16 animate-pulse rounded-md"></div>
                      <div className="bg-muted h-5 w-20 animate-pulse rounded-md"></div>
                      <div className="bg-muted h-5 w-14 animate-pulse rounded-md"></div>
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="ml-6 flex items-center gap-3">
                  <div className="bg-muted h-9 w-20 animate-pulse rounded-lg"></div>
                  <div className="bg-muted h-9 w-28 animate-pulse rounded-lg"></div>
                </div>
              </div>

              {/* Version Mobile */}
              <div className="space-y-4 md:hidden">
                {/* Logo + Titre */}
                <div className="flex flex-col items-start gap-3">
                  <div className="bg-muted h-16 w-16 flex-shrink-0 animate-pulse rounded-lg"></div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="bg-muted h-6 w-48 animate-pulse rounded-md"></div>
                    <div className="flex flex-wrap gap-1">
                      <div className="bg-muted h-5 w-16 animate-pulse rounded-md"></div>
                      <div className="bg-muted h-5 w-20 animate-pulse rounded-md"></div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <div className="bg-muted h-9 w-20 animate-pulse rounded-lg"></div>
                  <div className="bg-muted h-9 flex-1 animate-pulse rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 pb-12">
              {/* Product Image / Banner Skeleton */}
              <div className="bg-muted h-80 w-full animate-pulse rounded-xl"></div>

              {/* Description - No title, direct content */}
              <div className="w-full space-y-3">
                <div className="bg-muted h-4 w-full animate-pulse rounded-md"></div>
                <div className="bg-muted h-4 w-full animate-pulse rounded-md"></div>
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded-md"></div>
                <div className="bg-muted h-4 w-5/6 animate-pulse rounded-md"></div>
                <div className="bg-muted h-4 w-2/3 animate-pulse rounded-md"></div>
              </div>

              {/* Edit Button Skeleton */}
              <div className="bg-muted h-9 w-40 animate-pulse rounded-md"></div>

              {/* Comments */}
              <div>
                <div className="bg-muted mb-4 h-6 w-20 animate-pulse rounded-md"></div>

                {/* Comment 1 */}
                <div className="mb-6 flex gap-4">
                  <div className="bg-muted h-10 w-10 animate-pulse rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="bg-muted h-4 w-32 animate-pulse rounded-md"></div>
                    <div className="space-y-2">
                      <div className="bg-muted h-4 w-full animate-pulse rounded-md"></div>
                      <div className="bg-muted h-4 w-5/6 animate-pulse rounded-md"></div>
                    </div>
                  </div>
                </div>

                {/* Comment 2 */}
                <div className="mb-6 flex gap-4">
                  <div className="bg-muted h-10 w-10 animate-pulse rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="bg-muted h-4 w-28 animate-pulse rounded-md"></div>
                    <div className="space-y-2">
                      <div className="bg-muted h-4 w-full animate-pulse rounded-md"></div>
                      <div className="bg-muted h-4 w-3/4 animate-pulse rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 colonne */}
          <div className="lg:sticky lg:top-14 lg:h-fit">
            <div className="space-y-6 py-6">
              {/* Publisher */}
              <div className="space-y-3">
                <div className="bg-muted h-4 w-16 animate-pulse rounded-md"></div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted h-10 w-10 animate-pulse rounded-full"></div>
                  <div className="min-w-0 flex-1">
                    <div className="bg-muted h-4 w-24 animate-pulse rounded-md"></div>
                  </div>
                </div>
              </div>

              {/* Launch Date */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="bg-muted h-4 w-20 animate-pulse rounded-md"></div>
                  <div className="border-muted-foreground/30 mx-3 flex-1 border-b border-dotted"></div>
                  <div className="bg-muted h-4 w-24 animate-pulse rounded-md"></div>
                </div>
              </div>

              {/* Platform */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="bg-muted h-4 w-16 animate-pulse rounded-md"></div>
                  <div className="border-muted-foreground/30 mx-3 flex-1 border-b border-dotted"></div>
                  <div className="bg-muted h-4 w-12 animate-pulse rounded-md"></div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="bg-muted h-4 w-14 animate-pulse rounded-md"></div>
                  <div className="border-muted-foreground/30 mx-3 flex-1 border-b border-dotted"></div>
                  <div className="bg-muted h-4 w-12 animate-pulse rounded-md"></div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="bg-muted h-4 w-12 animate-pulse rounded-md"></div>
                  <div className="border-muted-foreground/30 mx-3 flex-1 border-b border-dotted"></div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-4 w-4 animate-pulse rounded"></div>
                    <div className="bg-muted h-4 w-4 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-3">
                <div className="bg-muted h-4 w-20 animate-pulse rounded-md"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-muted h-6 w-12 animate-pulse rounded-md"></div>
                  <div className="bg-muted h-6 w-16 animate-pulse rounded-md"></div>
                  <div className="bg-muted h-6 w-14 animate-pulse rounded-md"></div>
                  <div className="bg-muted h-6 w-18 animate-pulse rounded-md"></div>
                </div>
              </div>

              {/* Share */}
              <div className="border-border border-t pt-4">
                <div className="bg-muted h-9 w-full animate-pulse rounded-md"></div>
              </div>

              {/* Sponsors */}
              <div className="space-y-3">
                <div className="bg-muted h-4 w-16 animate-pulse rounded-md"></div>
                <div className="bg-muted h-24 w-full animate-pulse rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
