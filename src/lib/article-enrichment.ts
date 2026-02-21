/**
 * Article Enrichment — AI-powered per-article metadata
 *
 * Uses Groq to batch-enrich up to BATCH_SIZE articles per call, producing:
 *  - tldr         : One-sentence summary
 *  - sentiment    : 'bullish' | 'bearish' | 'neutral'
 *  - tickers      : Mentioned crypto tickers, e.g. ['BTC', 'ETH']
 *  - impactScore  : 0–10 market-significance score
 *
 * Enrichment is cached in Vercel KV (key: `enrich:v1:<url-hash>`) with a
 * 24-hour TTL so the cron job only re-enriches stale or new articles.
 *
 * The KV store is optional — all functions degrade gracefully when KV or
 * Groq are not configured.
 */

const KV_PREFIX = 'enrich:v1:';
const KV_TTL_SECONDS = 86400; // 24 hours
export const BATCH_SIZE = 20; // articles per Groq call

export interface ArticleEnrichment {
  tldr: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tickers: string[];
  impactScore: number; // 0-10
  enrichedAt: string;
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

/**
 * Deterministic, KV-safe key for an article URL.
 * Uses a small polynomial hash to keep keys short and ASCII-safe.
 */
function linkKey(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h) ^ url.charCodeAt(i);
    h = h >>> 0; // keep 32-bit unsigned
  }
  return `${KV_PREFIX}${h.toString(36)}`;
}

// ─── KV access ────────────────────────────────────────────────────────────────

async function getKV() {
  try {
    const mod = await import('@vercel/kv');
    return mod.kv;
  } catch {
    return null;
  }
}

/** Read a single enrichment record. Returns null when missing or KV unavailable. */
export async function getEnrichment(url: string): Promise<ArticleEnrichment | null> {
  const kv = await getKV();
  if (!kv) return null;
  try {
    return await kv.get<ArticleEnrichment>(linkKey(url));
  } catch {
    return null;
  }
}

/** Read enrichment for many URLs in one KV round-trip. Missing keys return null. */
export async function getBulkEnrichment(
  urls: string[]
): Promise<Map<string, ArticleEnrichment | null>> {
  const result = new Map<string, ArticleEnrichment | null>(urls.map(u => [u, null]));
  if (urls.length === 0) return result;
  const kv = await getKV();
  if (!kv) return result;
  try {
    const keys = urls.map(linkKey);
    const values = await kv.mget<Array<ArticleEnrichment | null>>(...keys);
    for (let i = 0; i < urls.length; i++) {
      result.set(urls[i], values[i] ?? null);
    }
  } catch {
    // KV error — return nulls
  }
  return result;
}

/** Persist a batch of enrichments. */
export async function saveEnrichments(
  entries: Array<{ url: string; enrichment: ArticleEnrichment }>
): Promise<void> {
  const kv = await getKV();
  if (!kv || entries.length === 0) return;
  try {
    const pipeline = kv.pipeline();
    for (const { url, enrichment } of entries) {
      pipeline.set(linkKey(url), enrichment, { ex: KV_TTL_SECONDS });
    }
    await pipeline.exec();
  } catch {
    // Non-fatal — enrichment will be retried next run
  }
}

// ─── AI enrichment ────────────────────────────────────────────────────────────

interface ArticleInput {
  url: string;
  title: string;
  description?: string;
  source?: string;
}

interface BatchResultItem {
  n: number;
  tldr: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tickers: string[];
  impactScore: number;
}

const ENRICH_SYSTEM_PROMPT = `You are a crypto news analyst. For each article I give you, produce a compact JSON record.

Rules:
- tldr: one-sentence summary, max 120 chars, plain text
- sentiment: "bullish", "bearish", or "neutral" based on market implications
- tickers: array of crypto ticker symbols mentioned or clearly implied (e.g. "BTC", "ETH", "SOL"). Empty array if none.
- impactScore: integer 0-10. 0 = noise, 5 = notable, 8+ = major market event

Respond ONLY with a JSON array, one object per article, preserving the "n" index:
[{"n":0,"tldr":"...","sentiment":"bullish","tickers":["BTC"],"impactScore":6}, ...]`;

/**
 * Enrich a batch of articles with one Groq API call.
 * Returns a map of article URL → enrichment, or an empty map on failure.
 */
export async function enrichArticlesBatch(
  articles: ArticleInput[]
): Promise<Map<string, ArticleEnrichment>> {
  const result = new Map<string, ArticleEnrichment>();
  if (articles.length === 0) return result;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return result;

  const articleList = articles
    .map((a, i) =>
      `[${i}] ${a.title}${a.description ? ' — ' + a.description.slice(0, 200) : ''}${a.source ? ' (via ' + a.source + ')' : ''}`
    )
    .join('\n');

  const userPrompt = `Enrich these ${articles.length} crypto news articles:\n\n${articleList}`;

  let raw: string;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: ENRICH_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: articles.length * 80 + 100,
        response_format: { type: 'json_object' },
      }),
    });
    if (!response.ok) return result;
    const data = await response.json();
    raw = data.choices?.[0]?.message?.content ?? '';
  } catch {
    return result;
  }

  // The model may return { "articles": [...] } or a bare array
  let items: BatchResultItem[] = [];
  try {
    const parsed = JSON.parse(raw);
    items = Array.isArray(parsed) ? parsed : (parsed.articles ?? parsed.results ?? []);
  } catch {
    // Try to extract a JSON array from the raw text
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        items = JSON.parse(match[0]);
      } catch {
        return result;
      }
    }
  }

  const now = new Date().toISOString();
  for (const item of items) {
    const article = articles[item.n];
    if (!article) continue;
    result.set(article.url, {
      tldr: String(item.tldr || '').slice(0, 200),
      sentiment: (['bullish', 'bearish', 'neutral'] as const).includes(item.sentiment)
        ? item.sentiment
        : 'neutral',
      tickers: (Array.isArray(item.tickers) ? item.tickers : [])
        .map((t: unknown) => String(t).toUpperCase())
        .filter((t: string) => /^[A-Z0-9]{2,10}$/.test(t))
        .slice(0, 10),
      impactScore: Math.min(10, Math.max(0, Math.round(Number(item.impactScore) || 0))),
      enrichedAt: now,
    });
  }

  return result;
}
