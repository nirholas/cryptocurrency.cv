import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { getNewsByCategory, type NewsResponse } from "@/lib/crypto-news";
import { getCategoryBySlug } from "@/lib/categories";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = getCategoryBySlug(slug);
  const name = category?.name ?? slug;

  return generateSEOMetadata({
    title: `${name} News — Free Crypto News`,
    description: category?.description ?? `Latest ${name} cryptocurrency news and updates.`,
    path: `/category/${slug}`,
    locale,
    tags: [name.toLowerCase(), "crypto news", "cryptocurrency", ...(category?.keywords?.slice(0, 4) ?? [])],
  });
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const category = getCategoryBySlug(slug);
  const name = category?.name ?? slug;

  let data: NewsResponse | null = null;
  try {
    data = await getNewsByCategory(slug, 30);
  } catch {
    // Render empty state on failure
  }

  const articles = data?.articles ?? [];

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          {category?.icon && <span className="mr-2">{category.icon}</span>}
          {name} News
        </h1>
        {category?.description && (
          <p className="text-[var(--color-text-secondary)] mb-8 max-w-2xl">
            {category.description}
          </p>
        )}

        {articles.length === 0 ? (
          <p className="text-[var(--color-text-tertiary)] py-12 text-center">
            No articles found for this category.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard key={article.link} article={article} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
