import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShareSection from "@/components/PageShareSection";
import { getAllTags, getTagsByCategory, type Tag } from "@/lib/tags";
import { generateSEOMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { TagChip } from "@/components/TagChip";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return generateSEOMetadata({
    title: "Topics — Browse Crypto News by Topic",
    description:
      "Browse cryptocurrency news by topic. Explore Bitcoin, Ethereum, DeFi, NFTs, regulation, and 100+ more crypto topics.",
    path: "/tags",
    locale,
    tags: ["crypto topics", "cryptocurrency tags", "bitcoin news", "ethereum news", "defi", "nft"],
  });
}

const CATEGORY_LABELS: Record<Tag["category"], { label: string; icon: string }> = {
  asset: { label: "Assets", icon: "💰" },
  topic: { label: "Topics", icon: "📰" },
  event: { label: "Events", icon: "📅" },
  technology: { label: "Technology", icon: "⚙️" },
  entity: { label: "Entities & People", icon: "🏢" },
  sentiment: { label: "Sentiment", icon: "📊" },
};

const CATEGORY_ORDER: Tag["category"][] = [
  "asset",
  "topic",
  "event",
  "technology",
  "entity",
  "sentiment",
];

export default async function TagsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const allTags = getAllTags();

  // Top tags by priority for the tag cloud
  const topTags = allTags.slice(0, 30);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm text-[var(--color-text-tertiary)]"
        >
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-[var(--color-accent)]"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-[var(--color-text-primary)]">
              Topics
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-10">
          <div
            className="mb-4 h-1 w-16 rounded-full bg-[var(--color-accent)]"
            aria-hidden="true"
          />
          <h1 className="mb-2 font-serif text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
            🏷️ Topics
          </h1>
          <p className="max-w-2xl text-[var(--color-text-secondary)]">
            Browse all cryptocurrency news topics. Discover trending tags and
            explore articles by subject.
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            {allTags.length} topics
          </p>
        </div>

        {/* Tag Cloud — Top Tags */}
        <section className="mb-12">
          <h2 className="mb-4 font-serif text-xl font-bold text-[var(--color-text-primary)]">
            Popular Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag, index) => {
              // Scale font size based on priority rank
              const scale = Math.max(0.75, 1 - index * 0.015);
              return (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-secondary)] px-4 py-2 font-medium text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] hover:shadow-sm"
                  style={{ fontSize: `${scale}rem` }}
                >
                  <span>{tag.icon}</span>
                  {tag.name}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Tags by Category */}
        {CATEGORY_ORDER.map((category) => {
          const tags = getTagsByCategory(category);
          const meta = CATEGORY_LABELS[category];

          if (tags.length === 0) return null;

          return (
            <section key={category} className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold text-[var(--color-text-primary)]">
                <span>{meta.icon}</span>
                {meta.label}
                <span className="ml-2 text-sm font-normal text-[var(--color-text-tertiary)]">
                  ({tags.length})
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/tags/${tag.slug}`}
                    className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-primary)] p-3 transition-all hover:border-[var(--color-accent)] hover:shadow-sm"
                  >
                    <span className="text-xl">{tag.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                        {tag.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] line-clamp-1">
                        {tag.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* All Tags A-Z */}
        <section className="mt-12">
          <h2 className="mb-4 font-serif text-xl font-bold text-[var(--color-text-primary)]">
            All Topics A–Z
          </h2>
          <div className="columns-1 gap-8 sm:columns-2 md:columns-3 lg:columns-4">
            {(() => {
              const sorted = [...allTags].sort((a, b) =>
                a.name.localeCompare(b.name)
              );
              const grouped: Record<string, typeof sorted> = {};
              for (const tag of sorted) {
                const letter = tag.name[0].toUpperCase();
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(tag);
              }

              return Object.entries(grouped).map(([letter, tags]) => (
                <div key={letter} className="mb-4 break-inside-avoid">
                  <h3 className="mb-1 text-sm font-bold text-[var(--color-accent)]">
                    {letter}
                  </h3>
                  <ul className="space-y-0.5">
                    {tags.map((tag) => (
                      <li key={tag.slug}>
                        <Link
                          href={`/tags/${tag.slug}`}
                          className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
                        >
                          {tag.icon} {tag.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ));
            })()}
          </div>
        </section>
      </main>
      <PageShareSection
        title="Crypto News Topics"
        description="Browse cryptocurrency news by topic."
        url={`https://cryptocurrency.cv/${locale}/tags`}
      />
      <Footer />
    </>
  );
}
