import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Developers — API Documentation — Free Crypto News",
    description:
      "API documentation for Free Crypto News. Endpoints for news, search, trending, breaking, RSS feeds, and more. No API key required.",
    path: "/developers",
    locale,
    tags: ["API docs", "developer", "REST API", "crypto news API", "endpoints"],
  });
}

const endpoints = [
  {
    method: "GET",
    path: "/api/news",
    description: "Fetch the latest crypto news from 300+ sources.",
    params: "?limit=10&offset=0&source=coindesk",
    example: `curl "https://cryptocurrency.cv/api/news?limit=5"`,
    response: `{
  "articles": [
    {
      "title": "Bitcoin Hits New All-Time High",
      "source": "CoinDesk",
      "link": "https://...",
      "pubDate": "2026-03-01T12:00:00Z",
      "category": "bitcoin",
      "description": "...",
      "imageUrl": "https://..."
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/rss",
    description: "Get an RSS/Atom feed of aggregated crypto news.",
    params: "?limit=20&category=bitcoin",
    example: `curl "https://cryptocurrency.cv/api/rss"`,
    response: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Free Crypto News</title>
    ...
  </channel>
</rss>`,
  },
  {
    method: "GET",
    path: "/api/trending",
    description: "Discover currently trending topics and keywords in crypto.",
    params: "?limit=10",
    example: `curl "https://cryptocurrency.cv/api/trending"`,
    response: `{
  "topics": [...],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/breaking",
    description: "Get breaking news from the last 2 hours.",
    params: "?limit=5",
    example: `curl "https://cryptocurrency.cv/api/breaking?limit=5"`,
    response: `{
  "articles": [...],
  "totalCount": 3,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
  },
];

export default async function DevelopersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          API Documentation
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-4 max-w-2xl">
          Free Crypto News provides a simple REST API. No API key required. No
          rate limits. Just fetch and go.
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-10">
          Base URL:{" "}
          <code className="rounded bg-[var(--color-surface-tertiary)] px-2 py-0.5 font-mono text-[var(--color-text-primary)]">
            https://cryptocurrency.cv
          </code>
        </p>

        <div className="space-y-12">
          {endpoints.map((ep) => (
            <section
              key={ep.path}
              className="rounded-lg border border-[var(--color-border)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-5 py-3">
                <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-[var(--color-text-primary)]">
                  {ep.path}
                </code>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-[var(--color-text-secondary)]">
                  {ep.description}
                </p>

                {ep.params && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1">
                      Query Parameters
                    </h4>
                    <code className="block rounded bg-[var(--color-surface-tertiary)] p-3 font-mono text-sm text-[var(--color-text-secondary)] overflow-x-auto">
                      {ep.params}
                    </code>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1">
                    Example
                  </h4>
                  <pre className="rounded bg-[var(--color-surface-tertiary)] p-3 font-mono text-sm text-[var(--color-text-secondary)] overflow-x-auto">
                    {ep.example}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1">
                    Response
                  </h4>
                  <pre className="rounded bg-[var(--color-surface-tertiary)] p-3 font-mono text-sm text-[var(--color-text-secondary)] overflow-x-auto">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
