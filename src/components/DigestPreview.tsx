'use client';

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrors AiDigestResponse from the digest route)
// ---------------------------------------------------------------------------

interface TopArticle {
  title: string;
  url: string;
}

interface DigestSection {
  tag: string;
  headline: string;
  summary: string;
  article_count: number;
  top_articles: TopArticle[];
}

interface AiDigest {
  date: string;
  sections: DigestSection[];
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Tag badge colour map
// ---------------------------------------------------------------------------

const TAG_COLOURS: Record<string, string> = {
  bitcoin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ethereum: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  defi: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  nft: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  regulation: 'bg-red-500/20 text-red-400 border-red-500/30',
  solana: 'bg-green-500/20 text-green-400 border-green-500/30',
  altcoins: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  market: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function tagClass(tag: string): string {
  return (
    TAG_COLOURS[tag.toLowerCase()] ??
    'bg-slate-500/20 text-slate-400 border-slate-500/30'
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function DigestSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Loading digest…">
      {/* Header skeleton */}
      <div className="h-6 w-48 bg-slate-700 rounded" />
      <div className="h-3 w-32 bg-slate-800 rounded" />

      {/* Card skeletons */}
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-3"
        >
          <div className="h-4 w-20 bg-slate-700 rounded-full" />
          <div className="h-4 w-3/4 bg-slate-700 rounded" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-700 rounded" />
            <div className="h-3 bg-slate-700 rounded w-5/6" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full bg-slate-800 rounded" />
            <div className="h-3 w-4/5 bg-slate-800 rounded" />
            <div className="h-3 w-3/4 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

function SectionCard({ section }: { section: DigestSection }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/60 transition-colors">
      {/* Tag badge + article count */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${tagClass(section.tag)}`}
        >
          {section.tag}
        </span>
        <span className="text-xs text-slate-500">{section.article_count} articles</span>
      </div>

      {/* Headline */}
      <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2">
        {section.headline}
      </h3>

      {/* AI-generated summary */}
      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-4">
        {section.summary}
      </p>

      {/* Top 3 linked headlines */}
      <ul className="space-y-1.5">
        {section.top_articles.slice(0, 3).map(article => (
          <li key={article.url}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors line-clamp-1 flex items-start gap-1"
            >
              <span className="mt-0.5 shrink-0 text-slate-600">›</span>
              <span>{article.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DigestPreview() {
  const [digest, setDigest] = useState<AiDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/digest?format=ai-digest');
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data: AiDigest = await res.json();
        if (!cancelled) setDigest(data);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/60 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl" aria-hidden>🗞</span>
            <h2 className="text-base font-bold text-white">AI Daily Digest</h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              AI
            </span>
          </div>
          {digest?.date && (
            <p className="text-xs text-slate-500">{digest.date}</p>
          )}
        </div>

        <a
          href="/newsletter"
          className="shrink-0 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-white text-xs font-semibold whitespace-nowrap"
        >
          Subscribe for daily email
        </a>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        {loading && <DigestSkeleton />}

        {!loading && error && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-1">Could not load digest</p>
            <p className="text-slate-600 text-xs">{error}</p>
          </div>
        )}

        {!loading && !error && digest && (
          <>
            {digest.sections.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                No digest sections available yet. Check back soon.
              </p>
            ) : (
              <div className="space-y-4">
                {digest.sections.map(section => (
                  <SectionCard key={section.tag} section={section} />
                ))}
              </div>
            )}

            <p className="mt-4 text-center text-[10px] text-slate-700">
              Generated {new Date(digest.generated_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
