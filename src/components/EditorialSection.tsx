/**
 * Editorial Section Components
 *
 * Newspaper-style section dividers, date headers, and editorial layout blocks
 * that give the homepage the feel of a professional news publication.
 */

import { Link } from "@/i18n/navigation";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/BookmarkButton";
import type { NewsArticle } from "@/lib/crypto-news";

/* ------------------------------------------------------------------ */
/*  Section Header — editorial-style divider with title + "See all →" */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
  href,
  icon,
  className = "",
}: {
  title: string;
  href?: string;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <h2 className="flex items-center gap-2 font-serif text-xl md:text-2xl font-bold text-text-primary">
        {icon && <span className="text-lg">{icon}</span>}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors whitespace-nowrap"
        >
          See all →
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Date Header — "Sunday, March 1, 2026"                             */
/* ------------------------------------------------------------------ */

export function DateHeader() {
  const today = new Date();
  const formatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border-b-2 border-text-primary mb-1">
      <div className="container-main flex items-center justify-between py-2">
        <p className="text-sm font-medium text-text-secondary tracking-wide">
          {formatted}
        </p>
        <p className="text-xs text-text-tertiary hidden sm:block">
          Your trusted source for crypto news & analysis
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor's Picks — horizontal strip of curated stories              */
/* ------------------------------------------------------------------ */

export function EditorsPicks({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface-secondary">
      <div className="container-main py-6 lg:py-8">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-white text-xs font-bold uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
            Editor&apos;s Picks
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <EditorsPickCard key={article.link} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorsPickCard({ article }: { article: NewsArticle }) {
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton
        article={article}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
      />
      <Link
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <article className="flex gap-4 items-start">
          {article.imageUrl && (
            <div className="overflow-hidden rounded-md bg-surface-tertiary shrink-0 w-24 h-24">
              <img
                src={article.imageUrl}
                alt={article.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5 min-w-0">
            <Badge variant={categoryToBadgeVariant(article.category)} className="w-fit text-[10px]">
              {article.category}
            </Badge>
            <h3 className="font-serif text-base font-bold leading-snug tracking-tight group-hover:text-accent transition-colors line-clamp-3">
              {article.title}
            </h3>
            <span className="text-xs text-text-tertiary">
              <Link href={`/source/${article.sourceKey}`} className="font-medium text-text-secondary hover:text-accent transition-colors">{article.source}</Link> · {article.timeAgo}
            </span>
          </div>
        </article>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category Section — 2-col editorial block for a news category      */
/* ------------------------------------------------------------------ */

export function CategorySection({
  title,
  href,
  icon,
  articles,
}: {
  title: string;
  href: string;
  icon: string;
  articles: NewsArticle[];
}) {
  if (articles.length === 0) return null;

  const lead = articles[0];
  const rest = articles.slice(1, 4);

  return (
    <section className="border-b border-border">
      <div className="container-main py-8 lg:py-10">
        <SectionHeader title={title} href={href} icon={icon} />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Lead story */}
          <div className="group relative" role="article" aria-label={lead.title}>
            <BookmarkButton
              article={lead}
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
            />
            <Link
              href={lead.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <article>
                {lead.imageUrl && (
                  <div className="overflow-hidden rounded-md bg-surface-tertiary mb-4">
                    <img
                      src={lead.imageUrl}
                      alt={lead.title}
                      loading="lazy"
                      className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <Badge variant={categoryToBadgeVariant(lead.category)} className="mb-2">
                  {lead.category}
                </Badge>
                <h3 className="font-serif text-xl md:text-2xl font-bold leading-snug tracking-tight mb-2 group-hover:text-accent transition-colors">
                  {lead.title}
                </h3>
                {lead.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                    {lead.description}
                  </p>
                )}
                <span className="text-xs text-text-tertiary">
                  <Link href={`/source/${lead.sourceKey}`} className="font-medium text-text-secondary hover:text-accent transition-colors">{lead.source}</Link> · {lead.timeAgo}
                </span>
              </article>
            </Link>
          </div>

          {/* Secondary stories */}
          <div className="flex flex-col divide-y divide-border">
            {rest.map((article) => (
              <div key={article.link} className="group relative py-4 first:pt-0 last:pb-0">
                <BookmarkButton
                  article={article}
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                />
                <Link
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <article className="flex gap-4 items-start">
                    {article.imageUrl && (
                      <div className="overflow-hidden rounded-md bg-surface-tertiary shrink-0 w-20 h-20">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                      <h4 className="text-sm font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <span className="text-xs text-text-tertiary">
                        <Link href={`/source/${article.sourceKey}`} className="font-medium text-text-secondary hover:text-accent transition-colors">{article.source}</Link> · {article.timeAgo}
                      </span>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Most Read — numbered list widget for sidebar                      */
/* ------------------------------------------------------------------ */

export function MostRead({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b-2 border-accent">
        Most Read
      </h3>
      <div className="space-y-0">
        {articles.slice(0, 5).map((article, i) => (
          <Link
            key={article.link}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <article className="flex gap-3 items-start py-3 border-b border-border last:border-b-0">
              <span className="text-3xl font-bold text-accent tabular-nums shrink-0 leading-none mt-0.5 opacity-60">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-sm font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <span className="text-xs text-text-tertiary">
                  {article.source} · {article.timeAgo}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Opinion Banner — visual distinction for analysis/opinion content  */
/* ------------------------------------------------------------------ */

export function OpinionSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="border-b border-border bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="container-main py-8 lg:py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-amber-500 rounded-full" />
          <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary">
            Analysis & Opinion
          </h2>
          <Link
            href="/category/trading"
            className="ml-auto text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            More analysis →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <div key={article.link} className="group relative" role="article" aria-label={article.title}>
              <Link
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <article className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      Opinion
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold leading-snug tracking-tight group-hover:text-accent transition-colors line-clamp-3">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <span className="text-xs text-text-tertiary">
                    <Link href={`/source/${article.sourceKey}`} className="font-medium text-text-secondary hover:text-accent transition-colors">{article.source}</Link> · {article.timeAgo}
                  </span>
                </article>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
