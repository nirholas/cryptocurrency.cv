import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/crypto-news";

const BOOKMARK_BTN =
  "absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity";

/* ------------------------------------------------
   FEATURED OPINION — large hero card
   ------------------------------------------------ */

export function FeaturedOpinionCard({ article }: { article: NewsArticle }) {
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
          {article.imageUrl && (
            <div className="overflow-hidden rounded-xl bg-[var(--color-surface-tertiary)] aspect-[16/10] w-full shadow-lg">
              <img
                src={article.imageUrl}
                alt={article.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
          )}
          <div className={cn("flex flex-col gap-4", !article.imageUrl && "md:col-span-2")}>
            <Badge variant="opinion" className="w-fit">
              Opinion
            </Badge>
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold italic leading-[1.15] tracking-tight group-hover:text-[var(--color-accent)] transition-colors duration-200">
              &ldquo;{article.title}&rdquo;
            </h2>
            {article.description && (
              <p className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed line-clamp-3">
                {article.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm">
              {article.author && (
                <span className="font-semibold text-[var(--color-text-primary)]">
                  By {article.author}
                </span>
              )}
              <span className="text-[var(--color-text-tertiary)]">&middot;</span>
              <span className="text-[var(--color-text-tertiary)]">{article.source}</span>
              <span className="text-[var(--color-text-tertiary)]">&middot;</span>
              <span className="text-[var(--color-text-tertiary)]">{article.timeAgo}</span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

/* ------------------------------------------------
   DEFAULT OPINION — card with prominent author
   ------------------------------------------------ */

export function OpinionCard({ article }: { article: NewsArticle }) {
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
          {article.imageUrl && (
            <div className="overflow-hidden rounded-lg bg-[var(--color-surface-tertiary)] aspect-[16/10] w-full">
              <img
                src={article.imageUrl}
                alt={article.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Badge variant="opinion" className="w-fit">
              Opinion
            </Badge>
            <h3 className="font-serif text-lg font-bold italic leading-snug tracking-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-3">
              &ldquo;{article.title}&rdquo;
            </h3>
            {article.description && (
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                {article.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-xs">
              {article.author && (
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {article.author}
                </span>
              )}
              <span className="text-[var(--color-text-tertiary)]">&middot;</span>
              <span className="text-[var(--color-text-tertiary)]">{article.source}</span>
              <span className="text-[var(--color-text-tertiary)]">&middot;</span>
              <span className="text-[var(--color-text-tertiary)]">{article.timeAgo}</span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

export default OpinionCard;
