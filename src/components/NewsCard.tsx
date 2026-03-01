import { Link } from "@/i18n/navigation";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/crypto-news";

/* ------------------------------------------------
   Shared helpers
   ------------------------------------------------ */

function ArticleImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <div className={cn("overflow-hidden rounded-md bg-[var(--color-surface-tertiary)]", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}

function SourceMeta({ source, timeAgo }: { source: string; timeAgo: string }) {
  return (
    <span className="text-xs text-[var(--color-text-tertiary)]">
      {source} &middot; {timeAgo}
    </span>
  );
}

/* ------------------------------------------------
   FEATURED — large hero card (top of homepage)
   ------------------------------------------------ */

export function FeaturedCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article className="grid gap-5 md:grid-cols-2 md:gap-8 items-center">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          className="aspect-[16/10] w-full"
        />
        <div className="flex flex-col gap-3">
          <Badge variant={categoryToBadgeVariant(article.category)}>
            {article.category}
          </Badge>
          <h2 className="font-serif text-2xl md:text-3xl font-bold leading-tight tracking-tight group-hover:text-[var(--color-accent)] transition-colors">
            {article.title}
          </h2>
          {article.description && (
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base line-clamp-3">
              {article.description}
            </p>
          )}
          <SourceMeta source={article.source} timeAgo={article.timeAgo} />
        </div>
      </article>
    </Link>
  );
}

/* ------------------------------------------------
   DEFAULT — vertical card with image on top
   ------------------------------------------------ */

export function NewsCardDefault({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article className="flex flex-col gap-3">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          className="aspect-[16/10] w-full"
        />
        <div className="flex flex-col gap-2">
          <Badge variant={categoryToBadgeVariant(article.category)}>
            {article.category}
          </Badge>
          <h3 className="font-serif text-lg font-bold leading-snug tracking-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
            {article.title}
          </h3>
          {article.description && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {article.description}
            </p>
          )}
          <SourceMeta source={article.source} timeAgo={article.timeAgo} />
        </div>
      </article>
    </Link>
  );
}

/* ------------------------------------------------
   COMPACT — horizontal card (sidebar / list)
   ------------------------------------------------ */

export function NewsCardCompact({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article className="flex gap-4 items-start">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          className="aspect-square w-20 shrink-0"
        />
        <div className="flex flex-col gap-1.5 min-w-0">
          <Badge variant={categoryToBadgeVariant(article.category)} className="w-fit">
            {article.category}
          </Badge>
          <h3 className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <SourceMeta source={article.source} timeAgo={article.timeAgo} />
        </div>
      </article>
    </Link>
  );
}

/* ------------------------------------------------
   HEADLINE — text-only for dense lists
   ------------------------------------------------ */

export function NewsCardHeadline({
  article,
  index,
}: {
  article: NewsArticle;
  index?: number;
}) {
  return (
    <Link
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article className="flex gap-3 items-baseline">
        {typeof index === "number" && (
          <span className="text-2xl font-bold text-[var(--color-text-tertiary)] tabular-nums shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <SourceMeta source={article.source} timeAgo={article.timeAgo} />
        </div>
      </article>
    </Link>
  );
}

/* ------------------------------------------------
   DEFAULT EXPORT (backwards compat)
   ------------------------------------------------ */

export default function NewsCard({
  article,
  variant = "default",
}: {
  article: NewsArticle;
  variant?: "featured" | "default" | "compact" | "headline";
}) {
  switch (variant) {
    case "featured":
      return <FeaturedCard article={article} />;
    case "compact":
      return <NewsCardCompact article={article} />;
    case "headline":
      return <NewsCardHeadline article={article} />;
    default:
      return <NewsCardDefault article={article} />;
  }
}
