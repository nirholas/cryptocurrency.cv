/**
 * Loading skeleton for coin detail page
 */

export default function CoinPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb skeleton */}
        <div className="h-5 w-48 bg-gray-800 rounded animate-pulse mb-6" />

        {/* Header section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Coin header */}
          <div className="lg:col-span-2 bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-gray-700 rounded-full animate-pulse" />
              <div className="h-8 w-24 bg-gray-700 rounded-full animate-pulse" />
              <div className="h-8 w-24 bg-gray-700 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Price box */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="h-10 w-48 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-6 w-24 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="flex justify-between">
              <div className="h-5 w-20 bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tab navigation skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-8 w-12 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-80 bg-gray-700/30 rounded-xl animate-pulse" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-6 w-28 bg-gray-700 rounded animate-pulse mb-1" />
              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Price statistics skeleton */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 mb-8">
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Two column section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Info section */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="h-6 w-24 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Converter section */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-12 bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* About section skeleton */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 mb-8">
          <div className="h-6 w-36 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Developer stats skeleton */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 mb-8">
          <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mx-auto mb-2" />
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* News skeleton */}
        <div className="mb-8">
          <div className="h-6 w-36 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                <div className="h-40 bg-gray-700 rounded-lg animate-pulse mb-3" />
                <div className="h-5 w-full bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
