"use client";

import { useTranslations } from "next-intl";
import { useBookmarks } from "@/components/BookmarksProvider";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  article: {
    link: string;
    title: string;
    source: string;
    category: string;
    imageUrl?: string;
  };
  className?: string;
}

export function BookmarkButton({ article, className }: BookmarkButtonProps) {
  const t = useTranslations("bookmarkButton");
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { addToast } = useToast();

  const bookmarked = isBookmarked(article.link);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (bookmarked) {
      removeBookmark(article.link);
      addToast(t("removed"), "info");
    } else {
      addBookmark(article);
      addToast(t("added"), "success");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={bookmarked ? t("remove") : t("add")}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
        "bg-(--color-surface)/80 backdrop-blur-sm border border-border",
        "hover:bg-accent hover:text-white",
        bookmarked && "text-accent",
        !bookmarked && "text-text-tertiary",
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
        />
      </svg>
    </button>
  );
}
