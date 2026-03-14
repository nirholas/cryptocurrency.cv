import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageShareSection from '@/components/PageShareSection';
import { FeaturedCard, NewsCardDefault } from '@/components/NewsCard';
import { TagChip } from '@/components/TagChip';
import {
  getTagBySlug,
  getAllTags,
  getRelatedTags,
  extractTagsFromArticle,
  generateTagStructuredData,
} from '@/lib/tags';
import { getLatestNews } from '@/lib/crypto-news';
import { generateSEOMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tag = getTagBySlug(slug);
  if (!tag) return {};

  return generateSEOMetadata({
    title: `${tag.name} Crypto News — Latest ${tag.name} Updates`,
    description: tag.description,
    path: `/tags/${tag.slug}`,
    locale,
    tags: [tag.name, 'cryptocurrency', 'crypto news', ...(tag.relatedTags ?? [])],
  });
}

export default async function TagPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tag = getTagBySlug(slug);
  if (!tag) notFound();

  const relatedTags = getRelatedTags(slug);

  // Fetch articles and filter by tag keywords
  let articles: Awaited<ReturnType<typeof getLatestNews>>['articles'] = [];
  try {
    const data = await getLatestNews(50);
    articles = data.articles.filter((article) => {
      const matched = extractTagsFromArticle(article);
      return matched.some((t) => t.slug === tag.slug);
    });
  } catch {
    // Render empty state
  }

  const featuredArticle = articles[0] ?? null;
  const remainingArticles = articles.slice(1, 21);
  const totalCount = articles.length;

  // Structured data for SEO
  const structuredData = generateTagStructuredData(tag, totalCount);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-text-tertiary mb-6 text-sm">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/tags" className="hover:text-accent transition-colors">
                Topics
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-text-primary font-medium">{tag.name}</li>
          </ol>
        </nav>

        {/* Tag Header */}
        <div className="mb-10">
          <div className="bg-accent mb-4 h-1 w-16 rounded-full" aria-hidden="true" />
          <h1 className="text-text-primary mb-2 font-serif text-3xl font-bold md:text-4xl">
            <span className="mr-2">{tag.icon}</span>
            {tag.name}
          </h1>
          <p className="text-text-secondary mb-4 max-w-2xl">{tag.description}</p>
          <p className="text-text-tertiary text-sm">
            {totalCount} {totalCount === 1 ? 'article' : 'articles'}
          </p>
        </div>

        {/* Related Tags */}
        {relatedTags.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-text-tertiary mr-1 text-xs font-semibold tracking-wider uppercase">
              Related
            </span>
            {relatedTags.map((related) => (
              <TagChip key={related.slug} tag={related} />
            ))}
          </div>
        )}

        {totalCount === 0 ? (
          <p className="text-text-tertiary py-12 text-center">
            No articles found for this topic yet.
          </p>
        ) : (
          <div className="flex gap-10">
            {/* Main content */}
            <div className="min-w-0 flex-1">
              {/* Featured Article */}
              {featuredArticle && (
                <div className="border-border mb-10 border-b pb-10">
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
            </div>

            {/* Sidebar (desktop) */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24">
                <h2 className="text-text-primary mb-4 font-serif text-lg font-bold">
                  Related Topics
                </h2>
                <nav aria-label="Related topics">
                  <ul className="space-y-1">
                    {relatedTags.map((related) => (
                      <li key={related.slug}>
                        <Link
                          href={`/tags/${related.slug}`}
                          className="text-text-secondary hover:bg-surface-secondary hover:text-text-primary flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                        >
                          <span>{related.icon}</span>
                          <span>{related.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Tag info */}
                <div className="bg-surface-secondary mt-8 rounded-lg p-4">
                  <h3 className="text-text-primary mb-2 text-sm font-semibold">About this topic</h3>
                  <p className="text-text-tertiary text-xs leading-relaxed">{tag.description}</p>
                  <div className="text-text-tertiary mt-3 flex items-center gap-2 text-xs">
                    <span className="capitalize">{tag.category}</span>
                    <span>&middot;</span>
                    <span>Priority {tag.priority}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <PageShareSection
        title={`${tag.name} Crypto News`}
        description={tag.description}
        url={`https://cryptocurrency.cv/${locale}/tags/${slug}`}
      />
      <Footer />
    </>
  );
}
