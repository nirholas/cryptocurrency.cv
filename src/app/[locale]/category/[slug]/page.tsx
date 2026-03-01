import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShareSection from "@/components/PageShareSection";
import { FeaturedCard, NewsCardDefault } from "@/components/NewsCard";
import { getNewsByCategory, type NewsResponse } from "@/lib/crypto-news";
import { getCategoryBySlug, categories } from "@/lib/categories";
import { generateCategoryMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LoadMoreButton } from "@/components/LoadMoreButton";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = getCategoryBySlug(slug);
  const name = category?.name ?? slug;

  return generateCategoryMetadata({
    category: name,
    description: category?.description ?? `Latest ${name} cryptocurrency news and updates.`,
    locale,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const category = getCategoryBySlug(slug);
  const name = category?.name ?? slug;

  let data: NewsResponse | null = null;
  try {
    data = await getNewsByCategory(slug, 20);
  } catch {
    // Render empty state on failure
  }

  const articles = data?.articles ?? [];
  const featuredArticle = articles[0] ?? null;
  const remainingArticles = articles.slice(1);
  const totalCount = data?.totalCount ?? 0;
  const hasMore = articles.length < totalCount;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--color-text-tertiary)]">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[var(--color-text-primary)] font-medium">
              {name}
            </li>
          </ol>
        </nav>

        {/* Category Header */}
        <div className="mb-10">
          <div
            className="h-1 w-16 rounded-full mb-4"
            style={{
              backgroundColor: category?.color
                ? `var(--tw-${category.color.replace("text-", "")}, currentColor)`
                : "var(--color-accent)",
            }}
            aria-hidden="true"
          />
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
            {category?.icon && <span className="mr-2">{category.icon}</span>}
            {name} News
          </h1>
          {category?.description && (
            <p className="text-[var(--color-text-secondary)] max-w-2xl">
              {category.description}
            </p>
          )}
        </div>

        {articles.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)] py-12 text-center">
            No articles found for this category.
          </p>
        ) : (
          <div className="flex gap-10">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Featured Article */}
              {featuredArticle && (
                <div className="mb-10 pb-10 border-b border-[var(--color-border)]">
                  <FeaturedCard article={featuredArticle} />
                </div>
              )}

              {/* News Grid */}
              {remainingArticles.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingArticles.map((article) => (
                    <NewsCardDefault key={article.link} article={article} />
                  ))}
                </div>
              )}

              {/* Load More */}
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <LoadMoreButton slug={slug} initialPage={2} />
                </div>
              )}
            </div>

            {/* Category Sidebar (desktop) */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <h2 className="font-serif text-lg font-bold mb-4 text-[var(--color-text-primary)]">
                  Categories
                </h2>
                <nav aria-label="Categories">
                  <ul className="space-y-1">
                    {categories.map((cat) => (
                      <li key={cat.slug}>
                        <Link
                          href={`/category/${cat.slug}`}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                            cat.slug === slug
                              ? "bg-[var(--color-surface-secondary)] text-[var(--color-accent)] font-medium"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
                          )}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          </div>
        )}
      </main>
      <PageShareSection
        title={`${name} Crypto News`}
        description={`Latest ${name} cryptocurrency news and updates.`}
        url={`https://cryptocurrency.cv/${locale}/category/${slug}`}
      />
      <Footer />
    </>
  );
}
