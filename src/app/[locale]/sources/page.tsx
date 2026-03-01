import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSources, type SourceInfo } from "@/lib/crypto-news";

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

  // Group sources by category
  const grouped = sources.reduce<Record<string, SourceInfo[]>>((acc, s) => {
    const cat = s.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          News Sources
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-2xl">
          Free Crypto News aggregates headlines from {sources.length}+ sources
          across the crypto ecosystem. Here is the full list.
        </p>

        {sources.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)] py-12 text-center">
            Unable to load sources. Please try again later.
          </p>
        ) : (
          <div className="space-y-10">
            {sortedCategories.map((cat) => (
              <section key={cat}>
                <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)] capitalize">
                  {cat}
                  <span className="ml-2 text-sm font-normal text-[var(--color-text-tertiary)]">
                    ({grouped[cat].length})
                  </span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[cat].map((source) => (
                    <div
                      key={source.key}
                      className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-3"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          source.status === "active"
                            ? "bg-green-500"
                            : source.status === "unavailable"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {source.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                          {source.url}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
