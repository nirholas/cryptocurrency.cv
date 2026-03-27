/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useCallback } from "react";
import { NewsCardDefault } from "@/components/NewsCard";
import { Button } from "@/components/ui/Button";
import type { NewsArticle } from "@/lib/crypto-news";

interface LoadMoreButtonProps {
  slug: string;
  initialPage?: number;
}

export function LoadMoreButton({ slug, initialPage = 2 }: LoadMoreButtonProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/news?category=${encodeURIComponent(slug)}&page=${page}&limit=20`
      );
      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const data = await res.json();
      const newArticles: NewsArticle[] = data.articles ?? [];

      if (newArticles.length === 0) {
        setHasMore(false);
        return;
      }

      setArticles((prev) => [...prev, ...newArticles]);
      setPage((prev) => prev + 1);

      // Disable if fewer than requested
      if (newArticles.length < 20) {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

  return (
    <div className="w-full">
      {articles.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {articles.map((article) => (
            <NewsCardDefault key={article.link} article={article} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
