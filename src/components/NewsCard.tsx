import { Link } from "@/i18n/navigation";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { TagChip } from "@/components/TagChip";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/crypto-news";
import { extractTagsFromArticle } from "@/lib/tags";

const BOOKMARK_BTN =
  "absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity";

/* ------------------------------------------------
   Opinion badge (shown on opinion/analysis articles)
   ------------------------------------------------ */

function ContentTypeBadge({ contentType }: { contentType?: NewsArticle["contentType"] }) {
  if (!contentType || contentType === "news") return null;
  const labels: Record<string, string> = {
    opinion: "Opinion",
    analysis: "Analysis",
    "press-release": "Press Release",
  };
  return (
    <Badge variant="opinion" className="w-fit">
      {labels[contentType] ?? contentType}
    </Badge>
  );
}

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
    <div className={cn("overflow-hidden rounded-lg bg-[var(--color-surface-tertiary)]", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}

function SourceMeta({ source, sourceKey, timeAgo, author, authorSlug }: { source: string; sourceKey?: string; timeAgo: string; author?: string; authorSlug?: string }) {
  return (
    <span className="text-xs text-[var(--color-text-tertiary)]">
      {sourceKey ? (
        <Link
          href={`/source/${sourceKey}`}
          className="font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          {source}
        </Link>
      ) : (
        source
      )}
      {author && authorSlug && (
        <>
          {" "}&middot;{" "}
          <Link
            href={`/author/${authorSlug}`}
            className="font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {author}
          </Link>
        </>
      )}
      {" "}&middot; {timeAgo}
    </span>
  );
}

/* ------------------------------------------------
   FEATURED — large hero card (top of homepage)
   ------------------------------------------------ */

export function FeaturedCard({ article }: { article: NewsArticle }) {
  const tags = extractTagsFromArticle(article).slice(0, 3);
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <article className="grid gap-6 md:grid-cols-2 md:gap-10 items-center">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          className="aspect-[16/10] w-full shadow-lg rounded-xl"
        />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={categoryToBadgeVariant(article.category)}>
              {article.category}
            </Badge>
            <ContentTypeBadge contentType={article.contentType} />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.15] tracking-tight group-hover:text-[var(--color-accent)] transition-colors duration-200">
            {article.title}
          </h2>
          {article.description && (
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed line-clamp-3">
              {article.description}
            </p>
          )}          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <TagChip key={tag.slug} tag={tag} size="sm" />
              ))}
            </div>
          <SourceMeta source={article.source} sourceKey={article.sourceKey} timeAgo={article.timeAgo} author={article.author} authorSlug={article.authorSlug} />
        </div>
      </article>
    </Link>
    </div>
  );
}

/* ------------------------------------------------
   DEFAULT — vertical card with image on top
   ------------------------------------------------ */

export function NewsCardDefault({ article }: { article: NewsArticle }) {
  const tags = extractTagsFromArticle(article).slice(0, 2);
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <article className="flex flex-col gap-3">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          className="aspect-[16/10] w-full"
        />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={categoryToBadgeVariant(article.category)}>
              {article.category}
            </Badge>
            <ContentTypeBadge contentType={article.contentType} />
          </div>
          <h3 className="font-serif text-lg font-bold leading-snug tracking-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
            {article.title}
          </h3>
          {article.description && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {article.description}
            </p>
          )}          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <TagChip key={tag.slug} tag={tag} size="sm" />
              ))}
            </div>
          <SourceMeta source={article.source} sourceKey={article.sourceKey} timeAgo={article.timeAgo} author={article.author} authorSlug={article.authorSlug} />
        </div>
      </article>
    </Link>
    </div>
  );
}

/* ------------------------------------------------
   COMPACT — horizontal card (sidebar / list)
   ------------------------------------------------ */

export function NewsCardCompact({ article }: { article: NewsArticle }) {
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <article className="flex gap-4 items-start">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          className="aspect-square w-20 shrink-0"
        />
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={categoryToBadgeVariant(article.category)} className="w-fit">
              {article.category}
            </Badge>
            <ContentTypeBadge contentType={article.contentType} />
          </div>
          <h3 className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <SourceMeta source={article.source} sourceKey={article.sourceKey} timeAgo={article.timeAgo} author={article.author} authorSlug={article.authorSlug} />
        </div>
      </article>
    </Link>
    </div>
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
          <span className="text-2xl font-bold font-serif text-[var(--color-accent)]/30 tabular-nums shrink-0 leading-none">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <SourceMeta source={article.source} sourceKey={article.sourceKey} timeAgo={article.timeAgo} author={article.author} authorSlug={article.authorSlug} />
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
