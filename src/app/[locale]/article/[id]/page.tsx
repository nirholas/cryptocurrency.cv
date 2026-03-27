/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReadingProgressBar } from "@/components/ReadingProgress";
import { getArticleById, getRelatedArticles, toNewsArticle, type EnrichedArticle } from "@/lib/archive-v2";
import { generateArticleMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import NewsCard from "@/components/NewsCard";
import ShareBar from "@/components/ShareBar";
import { ArticleStructuredData } from "@/components/StructuredData";
import { getUnsplashFallback } from "@/lib/unsplash-fallback";
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
  const words = description?.split(/\s+/).length ?? 0;
  return Math.max(1, Math.ceil(words / 200));
}

function FearGreedGauge({ value }: { value: number }) {
  const label =
    value <= 25 ? "Extreme Fear" :
    value <= 45 ? "Fear" :
    value <= 55 ? "Neutral" :
    value <= 75 ? "Greed" :
    "Extreme Greed";
  const color =
    value <= 25 ? "text-red-500" :
    value <= 45 ? "text-orange-500" :
    value <= 55 ? "text-yellow-500" :
    value <= 75 ? "text-green-500" :
    "text-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <div className="flex flex-col">
        <span className="text-xs text-text-tertiary">/ 100</span>
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>
    </div>
  );
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
        <main className="container-main py-16">
          <div className="max-w-xl mx-auto text-center">
            <div className="mb-6 text-6xl">404</div>
            <h1 className="font-serif text-3xl font-bold mb-4 text-text-primary">
              Article not found
            </h1>
            <p className="text-text-secondary mb-8">
              The requested article could not be found. It may have been removed or the link is incorrect.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to homepage
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const sentiment = sentimentBadge(article.sentiment?.label ?? "neutral");
  const pubDate = article.pub_date ?? article.first_seen;
  const readingTime = estimateReadingTime(article.meta?.word_count, article.description);
  const articleUrl = `https://cryptocurrency.cv/${locale}/article/${article.slug ?? id}`;
  const heroImage = getUnsplashFallback(article.title || article.source || "crypto", 1200, 630);
  const ogImage = `https://cryptocurrency.cv/api/og?title=${encodeURIComponent(article.title)}&tags=${encodeURIComponent([...article.tickers, ...article.tags].slice(0, 3).join(","))}&source=${encodeURIComponent(article.source)}`;

  // Fetch related articles
  let relatedArticles: EnrichedArticle[] = [];
  try {
    relatedArticles = await getRelatedArticles(article, 6);
  } catch {
    // fall through
  }

  const hasMarketContext = article.market_context &&
    (article.market_context.btc_price != null ||
     article.market_context.eth_price != null ||
     article.market_context.fear_greed_index != null);

  const hasEntities = article.entities &&
    ((article.entities.people?.length ?? 0) > 0 ||
     (article.entities.companies?.length ?? 0) > 0 ||
     (article.entities.protocols?.length ?? 0) > 0);

  return (
    <>
      <ReadingProgressBar />
      <Header />
      <ArticleStructuredData
        headline={article.title}
        description={article.description || `${article.title} — from ${article.source}`}
        url={articleUrl}
        image={ogImage}
        datePublished={pubDate}
        dateModified={article.last_seen || pubDate}
        author={article.source}
        section={article.category}
        keywords={[...article.tickers, ...article.tags].slice(0, 10)}
      />

      <main>
        {/* ── Hero Section ── */}
        <div className="relative w-full bg-black">
          <div className="relative h-[300px] sm:h-[400px] md:h-[480px] w-full">
            <Image
              src={heroImage}
              alt={article.title}
              fill
              sizes="100vw"
              quality={85}
              priority
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>

          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container-main pb-8 md:pb-12">
              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center gap-1.5 text-sm text-white/60">
                  <li>
                    <Link href="/" className="hover:text-white transition-colors">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </li>
                  <li>
                    <Link href={`/category/${article.category}`} className="hover:text-white transition-colors capitalize">
                      {article.category}
                    </Link>
                  </li>
                </ol>
              </nav>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant={categoryToBadgeVariant(article.category)}>
                  {article.category}
                </Badge>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${sentiment.className}`}>
                  {sentiment.text}
                </span>
                {article.meta?.is_breaking && (
                  <Badge variant="breaking">Breaking</Badge>
                )}
                {article.meta?.is_opinion && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    Opinion
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-4xl">
                {article.title}
              </h1>

              {/* Byline */}
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <Link
                  href={`/source/${article.source_key}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white font-bold text-sm shrink-0 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                    {article.source.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white group-hover:text-white/80 transition-colors">
                      {article.source}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <time dateTime={pubDate}>
                        {new Date(pubDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                      <span>&middot;</span>
                      <span>{readingTime} min read</span>
                    </div>
                  </div>
                </Link>

                {/* Share icons in hero */}
                <div className="ml-auto hidden md:block">
                  <ShareBar url={articleUrl} title={article.title} compact className="[&_a]:bg-white/10 [&_a]:text-white/80 [&_a]:hover:bg-white/20 [&_button]:bg-white/10 [&_button]:text-white/80 [&_button]:hover:bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="container-main py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12">
            {/* ── Left Column — Article Content ── */}
            <article className="min-w-0">
              {/* Mobile share bar */}
              <div className="mb-6 md:hidden">
                <ShareBar url={articleUrl} title={article.title} compact />
              </div>

              {/* AI Summary Box */}
              {article.description && article.description.length > 100 && (
                <div className="mb-8 p-6 rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/40">
                  <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-600 dark:text-blue-400">
                      <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272z" />
                    </svg>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                      AI Summary
                    </span>
                  </div>
                  <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
                    {article.description}
                  </p>
                </div>
              )}

              {/* Article Body / Description */}
              {article.description && (
                <div className="prose dark:prose-invert prose-headings:font-serif prose-lg max-w-none mb-8">
                  <p className="text-text-primary leading-relaxed text-lg first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-accent">
                    {article.description}
                  </p>
                </div>
              )}

              {/* Tickers mentioned */}
              {article.tickers.length > 0 && (
                <div className="mb-8 p-5 rounded-xl bg-surface-secondary border border-border">
                  <h2 className="text-sm font-bold text-text-tertiary mb-3 uppercase tracking-wide flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    Assets Mentioned
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {article.tickers.map((ticker) => (
                      <Link
                        key={ticker}
                        href={`/coin/${ticker.toLowerCase()}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-mono font-semibold rounded-lg bg-white dark:bg-surface border border-border text-text-primary hover:border-accent hover:text-accent transition-colors shadow-sm"
                      >
                        <span className="text-accent">$</span>{ticker}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-text-tertiary">
                          <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Read Full Article CTA */}
              <div className="mb-8 p-6 md:p-8 rounded-xl bg-gradient-to-r from-surface-secondary to-surface-tertiary border border-border text-center">
                <p className="text-text-secondary text-sm mb-4">
                  This article was originally published by <strong className="text-text-primary">{article.source}</strong>. Read the complete story on their website.
                </p>
                <a
                  href={article.canonical_link || article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
                >
                  Read full article on {article.source}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>

              {/* Entities */}
              {hasEntities && (
                <div className="mb-8 p-5 rounded-xl bg-surface-secondary border border-border">
                  <h2 className="text-sm font-bold text-text-tertiary mb-4 uppercase tracking-wide">
                    Mentioned In This Article
                  </h2>
                  <div className="space-y-4">
                    {(article.entities.people?.length ?? 0) > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-text-tertiary mb-2 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                          </svg>
                          People
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {article.entities.people!.map((person) => (
                            <span key={person} className="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-surface border border-border text-text-secondary font-medium">
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(article.entities.companies?.length ?? 0) > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-text-tertiary mb-2 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm4.5-.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zM7 9.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1A.5.5 0 017 10.5v-1zm4.5-.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z" clipRule="evenodd" />
                          </svg>
                          Companies
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {article.entities.companies!.map((company) => (
                            <span key={company} className="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-surface border border-border text-text-secondary font-medium">
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(article.entities.protocols?.length ?? 0) > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-text-tertiary mb-2 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path fillRule="evenodd" d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.101 3.046 3.046 0 01-1.6-1.6.454.454 0 01.1-.493l2.69-2.69c.243-.244.175-.65-.148-.754A4.5 4.5 0 005.5 5.5c0 .474.073.936.213 1.37a.981.981 0 01-.227.958l-6.16 6.16a2.25 2.25 0 003.182 3.182l6.16-6.16a.981.981 0 01.958-.228c.434.14.896.213 1.37.213z" clipRule="evenodd" />
                          </svg>
                          Protocols
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {article.entities.protocols!.map((protocol) => (
                            <span key={protocol} className="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-surface border border-border text-text-secondary font-medium">
                              {protocol}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mb-8">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm rounded-full bg-surface-tertiary text-text-secondary hover:text-text-primary transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Bar (desktop, bottom of article) */}
              <div className="mb-8 pt-6 border-t border-border hidden md:block">
                <ShareBar url={articleUrl} title={article.title} />
              </div>

              {/* Article Footer */}
              <div className="pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/source/${article.source_key}`}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent font-bold text-lg shrink-0 hover:bg-accent/20 transition-colors"
                    >
                      {article.source.charAt(0).toUpperCase()}
                    </Link>
                    <div>
                      <p className="text-xs text-text-tertiary">Originally published by</p>
                      <Link
                        href={`/source/${article.source_key}`}
                        className="font-semibold text-text-primary hover:text-accent transition-colors"
                      >
                        {article.source}
                      </Link>
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    First indexed: {new Date(article.first_seen).toLocaleString()}
                  </p>
                </div>
              </div>
            </article>

            {/* ── Right Column — Sidebar ── */}
            <aside className="space-y-6 lg:space-y-8">
              {/* Market Context Widget */}
              {hasMarketContext && (
                <div className="rounded-xl border border-border bg-surface-secondary p-5 sticky top-20">
                  <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    Market at Publication
                  </h3>
                  <div className="space-y-4">
                    {article.market_context!.btc_price != null && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-surface border border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-orange-500">{"\u20BF"}</span>
                          <span className="text-sm font-medium text-text-primary">Bitcoin</span>
                        </div>
                        <span className="font-bold text-text-primary tabular-nums">
                          ${article.market_context!.btc_price.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {article.market_context!.eth_price != null && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-surface border border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-500">{"\u039E"}</span>
                          <span className="text-sm font-medium text-text-primary">Ethereum</span>
                        </div>
                        <span className="font-bold text-text-primary tabular-nums">
                          ${article.market_context!.eth_price.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {article.market_context!.fear_greed_index != null && (
                      <div className="p-3 rounded-lg bg-white dark:bg-surface border border-border">
                        <p className="text-xs text-text-tertiary mb-2">Fear & Greed Index</p>
                        <FearGreedGauge value={article.market_context!.fear_greed_index} />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-3 text-center">
                    Prices at time of publication
                  </p>
                </div>
              )}

              {/* Sentiment Analysis Widget */}
              <div className="rounded-xl border border-border bg-surface-secondary p-5">
                <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wide">
                  Sentiment Analysis
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${sentiment.className}`}>
                    {sentiment.text}
                  </span>
                  {article.sentiment?.confidence != null && (
                    <span className="text-xs text-text-tertiary">
                      {Math.round(article.sentiment.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                {article.sentiment?.score != null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
                      <span>Bearish</span>
                      <span>Bullish</span>
                    </div>
                    <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-gray-300 to-green-400 relative">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-text-primary shadow-md"
                        style={{ left: `${Math.max(5, Math.min(95, ((article.sentiment.score + 1) / 2) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Article Info Widget */}
              <div className="rounded-xl border border-border bg-surface-secondary p-5">
                <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wide">
                  Article Info
                </h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-text-tertiary">Source</dt>
                    <dd>
                      <Link href={`/source/${article.source_key}`} className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">
                        {article.source}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-text-tertiary">Category</dt>
                    <dd>
                      <Link href={`/category/${article.category}`} className="text-sm font-medium text-text-primary capitalize hover:text-accent transition-colors">
                        {article.category}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-text-tertiary">Published</dt>
                    <dd className="text-sm text-text-primary">
                      {new Date(pubDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-text-tertiary">Reading Time</dt>
                    <dd className="text-sm text-text-primary">{readingTime} min</dd>
                  </div>
                  {article.meta?.word_count ? (
                    <div className="flex justify-between">
                      <dt className="text-sm text-text-tertiary">Word Count</dt>
                      <dd className="text-sm text-text-primary">{article.meta.word_count.toLocaleString()}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <dt className="text-sm text-text-tertiary">Times Seen</dt>
                    <dd className="text-sm text-text-primary">{article.fetch_count}x</dd>
                  </div>
                </dl>
              </div>

              {/* Related Assets sidebar (if tickers exist) */}
              {article.tickers.length > 0 && (
                <div className="rounded-xl border border-border bg-surface-secondary p-5">
                  <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wide">
                    Related Assets
                  </h3>
                  <div className="space-y-2">
                    {article.tickers.slice(0, 6).map((ticker) => (
                      <Link
                        key={ticker}
                        href={`/coin/${ticker.toLowerCase()}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-surface border border-border hover:border-accent transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-text-primary">{ticker}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-text-tertiary group-hover:text-accent transition-colors">
                          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter CTA */}
              <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-blue-500/5 p-5">
                <h3 className="font-serif text-lg font-bold text-text-primary mb-2">
                  Stay Informed
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Get the latest crypto news delivered to your feed. No signup required.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M3.75 3a.75.75 0 00-.75.75v.5c0 .414.336.75.75.75H4c6.075 0 11 4.925 11 11v.25c0 .414.336.75.75.75h.5a.75.75 0 00.75-.75V16C17 8.82 11.18 3 3.75 3z" />
                    <path d="M3 8.75A.75.75 0 013.75 8H4a8 8 0 018 8v.25a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V16a6 6 0 00-6-6h-.25A.75.75 0 013 9.25v-.5zM7 15a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Browse Latest News
                </Link>
              </div>
            </aside>
          </div>

          {/* ── Related Articles ── */}
          {relatedArticles.length > 0 && (
            <section className="mt-12 pt-10 border-t-2 border-text-primary">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-text-primary">
                  Read More
                </h2>
                <Link
                  href={`/category/${article.category}`}
                  className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
                >
                  More in {article.category} &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.slice(0, 6).map((related) => (
                  <NewsCard
                    key={related.id}
                    article={toNewsArticle(related)}
                    variant="default"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
