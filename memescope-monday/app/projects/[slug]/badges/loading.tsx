export default function BadgesLoading() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center">
      <div className="w-full max-w-4xl px-2 py-6 sm:px-4 sm:py-10">
        <div className="mb-6">
          <div className="bg-muted/50 h-5 w-32 animate-pulse rounded-md"></div>
        </div>

        <div className="bg-card flex flex-col gap-6 rounded-lg border p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-muted/50 h-8 w-72 animate-pulse rounded-md"></div>
          </div>

          <div className="space-y-2">
            <div className="bg-muted/50 h-4 w-full animate-pulse rounded-md"></div>
            <div className="bg-muted/50 h-4 w-3/4 animate-pulse rounded-md"></div>
          </div>

          <div className="space-y-8 pt-4">
            <div className="space-y-3">
              <div className="bg-muted/50 h-6 w-32 animate-pulse rounded-md"></div>
              <div className="bg-muted/30 border-muted/50 flex h-32 animate-pulse items-center justify-center rounded-md border p-6 sm:h-40">
                <div className="bg-muted/50 h-16 w-48 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
