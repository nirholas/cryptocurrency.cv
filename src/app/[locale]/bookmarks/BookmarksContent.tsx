/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useMemo } from "react";
import { useBookmarks } from "@/components/BookmarksProvider";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";

export default function BookmarksPage() {
  const { bookmarks, clearAll } = useBookmarks();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  /* Unique categories from bookmarks */
  const categories = useMemo(() => {
    const cats = new Set(bookmarks.map((b) => b.category));
    return Array.from(cats).sort();
  }, [bookmarks]);

  /* Filtered bookmarks */
  const filtered = useMemo(() => {
    let result = bookmarks;

    if (activeCategory) {
      result = result.filter((b) => b.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.source.toLowerCase().includes(q),
      );
    }

    return result;
  }, [bookmarks, activeCategory, search]);

  return (
    <>
      <Header />
      <main className="container-main py-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              Bookmarks
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {bookmarks.length} saved article{bookmarks.length !== 1 ? "s" : ""}
            </p>
          </div>

          {bookmarks.length > 0 && (
            <div className="relative">
              {showConfirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">
                    Clear all bookmarks?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearAll();
                      setShowConfirmClear(false);
                    }}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(false)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-(--color-surface) transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(true)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {bookmarks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-16 w-16 text-text-tertiary mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
            <p className="text-text-secondary max-w-md">
              Bookmark articles while browsing to save them here for later reading.
              Click the bookmark icon on any article card to get started.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Browse articles
            </Link>
          </div>
        ) : (
          <>
            {/* Search + category filters */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Search */}
              <div className="relative max-w-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search bookmarks…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-border bg-(--color-surface) pl-9 pr-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Category pills */}
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                      !activeCategory
                        ? "bg-accent text-white border-transparent"
                        : "border-border text-text-secondary hover:border-accent",
                    )}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setActiveCategory(activeCategory === cat ? null : cat)
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        activeCategory === cat
                          ? "bg-accent text-white border-transparent"
                          : "border-border text-text-secondary hover:border-accent",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {filtered.length === 0 ? (
              <p className="text-center py-12 text-text-secondary">
                No bookmarks match your search.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((article) => (
                  <div
                    key={article.link}
                    className="group relative flex flex-col gap-3 rounded-lg border border-border bg-(--color-surface) p-4 transition-colors hover:border-accent/40"
                  >
                    {/* Bookmark remove button */}
                    <div className="absolute top-3 right-3 z-10">
                      <BookmarkButton article={article} />
                    </div>

                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-3"
                    >
                      {article.imageUrl && (
                        <div className="overflow-hidden rounded-md bg-surface-tertiary aspect-16/10">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <Badge
                          variant={categoryToBadgeVariant(article.category)}
                          className="w-fit"
                        >
                          {article.category}
                        </Badge>
                        <h3 className="font-serif text-base font-bold leading-snug tracking-tight group-hover:text-accent transition-colors line-clamp-3">
                          {article.title}
                        </h3>
                        <span className="text-xs text-text-tertiary">
                          {article.source} &middot; Saved{" "}
                          {new Date(article.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
