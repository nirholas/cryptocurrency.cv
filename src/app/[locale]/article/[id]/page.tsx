import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReadingProgressBar } from "@/components/ReadingProgress";
import { getArticleById, getRelatedArticles, toNewsArticle, type EnrichedArticle } from "@/lib/archive-v2";
import { generateArticleMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import NewsCard from "@/components/NewsCard";
import ShareBar from "@/components/ShareBar";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;

  let article: EnrichedArticle | null = null;
  try {
    article = await getArticleById(id);
  } catch {
    // fall through
  }

  if (!article) {
    return generateArticleMetadata({
      title: "Article Not Found",
      description: "The requested article could not be found.",
      slug: id,
      locale,
      publishedTime: new Date().toISOString(),
    });
  }

  return generateArticleMetadata({
    title: article.title,
    description: article.description || `${article.title} — from ${article.source}`,
    slug: article.slug ?? id,
    locale,
    publishedTime: article.pub_date ?? article.first_seen,
    category: article.category,
    tags: [...article.tickers, ...article.tags].slice(0, 6),
  });
}

function sentimentBadge(label: string): { text: string; className: string } {
  switch (label) {
    case "very_positive":
    case "positive":
      return { text: "Bullish", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    case "very_negative":
    case "negative":
      return { text: "Bearish", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    default:
      return { text: "Neutral", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
  }
}

function estimateReadingTime(wordCount: number | undefined, description: string): number {
  if (wordCount && wordCount > 0) return Math.ceil(wordCount / 200);
  // Estimate from description length
  const words = description?.split(/\s+/).length ?? 0;
  return Math.max(1, Math.ceil(words / 200));
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

export default async function ArticlePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  let article: EnrichedArticle | null = null;
  try {
    article = await getArticleById(id);
  } catch {
    // fall through
  }

  if (!article) {
    return (
      <>
        <Header />
        <main className="container-main py-10">
          <h1 className="font-serif text-3xl font-bold mb-4 text-[var(--color-text-primary)]">
            Article not found
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            The requested article could not be found. It may have been removed or the link is incorrect.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const sentiment = sentimentBadge(article.sentiment?.label ?? "neutral");
  const pubDate = article.pub_date ?? article.first_seen;
  const readingTime = estimateReadingTime(article.meta?.word_count, article.description);
  const articleUrl = `https://cryptocurrency.cv/${locale}/article/${article.slug ?? id}`;

  // Fetch related articles
  let relatedArticles: EnrichedArticle[] = [];
  try {
    relatedArticles = await getRelatedArticles(article, 4);
  } catch {
    // fall through — related articles are optional
  }

  return (
    <>
      <ReadingProgressBar />
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 max-w-[720px] mx-auto">
          <ol className="flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)]">
            <li>
              <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link href={`/?category=${article.category}`} className="hover:text-[var(--color-accent)] transition-colors capitalize">
                {article.category}
              </Link>
            </li>
            <li aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </li>
            <li className="text-[var(--color-text-secondary)] truncate max-w-[200px]">
              {truncate(article.title, 50)}
            </li>
          </ol>
        </nav>

        <article className="max-w-[720px] mx-auto">
          {/* ── Article Header ── */}
          <header className="mb-8">
            {/* Category, sentiment & breaking badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant={categoryToBadgeVariant(article.category)}>
                {article.category}
              </Badge>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${sentiment.className}`}>
                {sentiment.text}
              </span>
              {article.meta?.is_breaking && (
                <Badge variant="breaking">Breaking</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-[var(--color-text-primary)] leading-tight">
              {article.title}
            </h1>

            {/* Source, date & reading time */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
              <a
                href={article.canonical_link || article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-accent)] hover:underline"
              >
                {article.source}
              </a>
              <span>·</span>
              <time dateTime={pubDate}>
                {new Date(pubDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{readingTime} min read</span>
            </div>
          </header>

          {/* ── AI Summary Box ── */}
          {article.description && article.description.length > 100 && (
            <div className="mb-8 p-5 rounded-lg border border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/40">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600 dark:text-blue-400">
                  <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272z" />
                </svg>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  AI Summary
                </span>
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                {article.description}
              </p>
            </div>
          )}

          {/* ── Content Area (prose) ── */}
          <div className="mb-8">
            {article.description && (
              <div className="prose dark:prose-invert prose-headings:font-serif max-w-none mb-6">
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-base">
                  {article.description}
                </p>
              </div>
            )}

            {/* Read full article CTA */}
            <div className="mt-6">
              <a
                href={article.canonical_link || article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] font-medium hover:opacity-90 transition-opacity"
              >
                Read full article on {article.source}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* ── Share Bar ── */}
          <div className="mb-8 pt-6 border-t border-[var(--color-border)]">
            <ShareBar url={articleUrl} title={article.title} />
          </div>

          {/* ── Tickers & Tags ── */}
          {(article.tickers.length > 0 || article.tags.length > 0) && (
            <div className="mb-8 pt-6 border-t border-[var(--color-border)]">
              {/* Tickers */}
              {article.tickers.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
                    Related Assets
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {article.tickers.map((ticker) => (
                      <Link
                        key={ticker}
                        href={`/coin/${ticker.toLowerCase()}`}
                        className="px-2.5 py-1 text-sm font-mono font-medium rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        ${ticker}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Market Context ── */}
          {article.market_context && (
            <div className="mb-8 pt-6 border-t border-[var(--color-border)]">
              <h2 className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
                Market Context at Publication
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {article.market_context.btc_price != null && (
                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <p className="text-xs text-[var(--color-text-tertiary)]">BTC Price</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      ${article.market_context.btc_price.toLocaleString()}
                    </p>
                  </div>
                )}
                {article.market_context.eth_price != null && (
                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <p className="text-xs text-[var(--color-text-tertiary)]">ETH Price</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      ${article.market_context.eth_price.toLocaleString()}
                    </p>
                  </div>
                )}
                {article.market_context.fear_greed_index != null && (
                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <p className="text-xs text-[var(--color-text-tertiary)]">Fear & Greed</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {article.market_context.fear_greed_index}/100
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Entities ── */}
          {article.entities && (
            <div className="mb-8">
              {article.entities.people?.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
                    People Mentioned
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {article.entities.people.map((person) => (
                      <span key={person} className="px-2 py-0.5 text-sm rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {article.entities.companies?.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
                    Companies
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {article.entities.companies.map((company) => (
                      <span key={company} className="px-2 py-0.5 text-sm rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {article.entities.protocols?.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
                    Protocols
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {article.entities.protocols.map((protocol) => (
                      <span key={protocol} className="px-2 py-0.5 text-sm rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                        {protocol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata footer */}
          <p className="mt-6 text-xs text-[var(--color-text-tertiary)]">
            First seen: {new Date(article.first_seen).toLocaleString()} · ID: {article.id}
          </p>
        </article>

        {/* ── Related Articles ── */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 pt-8 border-t border-[var(--color-border)]">
            <h2 className="font-serif text-2xl font-bold mb-6 text-[var(--color-text-primary)]">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedArticles.map((related) => (
                <NewsCard
                  key={related.id}
                  article={toNewsArticle(related)}
                  variant="default"
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
