"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { NewsCardCompact } from "@/components/NewsCard";
import type { NewsArticle } from "@/lib/crypto-news";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/news?search=${encodeURIComponent(searchQuery.trim())}&limit=30`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.articles ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-[var(--color-text-primary)]">
          Search News
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-3 mb-8 max-w-xl"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for crypto news…"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {loading && (
          <p className="text-[var(--color-text-tertiary)]">Searching…</p>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-[var(--color-text-tertiary)] py-12 text-center">
            No results found for &ldquo;{query}&rdquo;. Try a different search term.
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((article) => (
              <NewsCardCompact key={article.link} article={article} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
