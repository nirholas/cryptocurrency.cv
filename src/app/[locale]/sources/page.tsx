import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSources, type SourceInfo } from "@/lib/crypto-news";
import { generateSEOMetadata } from "@/lib/seo";
import SourcesGrid from "@/components/SourcesGrid";

export const metadata = generateSEOMetadata({
  title: "News Sources",
  description:
    "Browse 300+ cryptocurrency news sources aggregated by Crypto Vision News. Covering Bitcoin, Ethereum, DeFi, NFTs, trading, and more.",
  path: "/sources",
  tags: ["crypto sources", "news sources", "bitcoin news", "crypto feeds"],
});

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SourcesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let sources: SourceInfo[] = [];
  try {
    const data = await getSources();
    sources = data.sources ?? [];
  } catch {
    // Render empty state on failure
  }

  const activeCount = sources.filter((s) => s.status === "active").length;
  const unavailableCount = sources.filter((s) => s.status === "unavailable").length;
  const unknownCount = sources.length - activeCount - unavailableCount;

  // Category breakdown
  const categoryMap: Record<string, { total: number; active: number }> = {};
  for (const s of sources) {
    const cat = s.category || "other";
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, active: 0 };
    categoryMap[cat].total++;
    if (s.status === "active") categoryMap[cat].active++;
  }
  const sortedCats = Object.entries(categoryMap).sort(
    (a, b) => b[1].total - a[1].total
  );
  const categories = new Set(sources.map((s) => s.category || "other"));
  const healthPercent =
    sources.length > 0 ? Math.round((activeCount / sources.length) * 100) : 0;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-[var(--color-text-primary)]">
            {sources.length}+ News Sources
          </h1>
          <p className="text-[var(--color-text-secondary)] max-w-2xl text-base leading-relaxed">
            Crypto Vision News aggregates headlines from {sources.length}+ sources
            across {categories.size} categories in the crypto ecosystem —
            updated in real-time, with intelligent health monitoring.
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-[var(--color-text-primary)]">
              {sources.length}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Total Sources
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-green-500">
              {activeCount}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Active
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-red-500">
              {unavailableCount}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Unavailable
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-[var(--color-accent)]">
              {categories.size}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Categories
            </div>
          </div>
        </div>

        {/* Health Ring + Category Distribution */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Overall Health Ring */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Source Health
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--color-surface-tertiary)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={healthPercent >= 90 ? "#22c55e" : healthPercent >= 70 ? "#eab308" : "#ef4444"}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${healthPercent * 2.64} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {healthPercent}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Active — {activeCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Unavailable — {unavailableCount}
                  </span>
                </div>
                {unknownCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-500 shrink-0" />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Unknown — {unknownCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Category Distribution
            </h2>
            <div className="space-y-2.5">
              {sortedCats.slice(0, 7).map(([cat, { total, active }]) => {
                const pct =
                  sources.length > 0
                    ? Math.round((total / sources.length) * 100)
                    : 0;
                const healthPct =
                  total > 0 ? Math.round((active / total) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize text-[var(--color-text-primary)] font-medium">
                        {cat}
                      </span>
                      <span className="text-[var(--color-text-tertiary)] text-xs">
                        {total} ({pct}%) · {healthPct}% healthy
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {sortedCats.length > 7 && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  + {sortedCats.length - 7} more categories
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="divider mb-8" />

        {sources.length === 0 ? (
          <div className="py-20 text-center">
            <svg
              className="mx-auto h-12 w-12 text-[var(--color-text-tertiary)] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-[var(--color-text-tertiary)] text-lg">
              Unable to load sources.
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm mt-1">
              Please try again later.
            </p>
          </div>
        ) : (
          <SourcesGrid sources={sources} />
        )}
      </main>
      <Footer />
    </>
  );
}
