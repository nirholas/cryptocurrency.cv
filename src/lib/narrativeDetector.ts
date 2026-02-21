/**
 * Narrative Trend Detector
 *
 * Detects emerging market narratives from social + news article data using AI.
 * Groups articles by semantic theme, computes velocity, and assigns momentum.
 */

import { aiComplete, getAIConfigOrNull } from './ai-provider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Narrative = {
  id: string;
  label: string;
  description: string;
  momentum: 'rising' | 'peaked' | 'fading';
  coins: string[];
  article_count: number;
  first_seen: string;
  velocity: number;
};

export type ArticleInput = {
  title: string;
  summary: string;
  tags: string[];
  date: string;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Coin / ticker mentions we look for when tagging narratives to coins. */
const KNOWN_COINS = [
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC',
  'LINK', 'UNI', 'AAVE', 'OP', 'ARB', 'TON', 'DOGE', 'SHIB', 'SUI',
  'APT', 'INJ', 'TIA', 'PYTH', 'JTO', 'WIF', 'BONK', 'PEPE',
];

/** Rough keyword-based coin extractor for fallback / enrichment. */
function extractCoins(texts: string[]): string[] {
  const joined = texts.join(' ').toUpperCase();
  return KNOWN_COINS.filter((coin) => {
    const pattern = new RegExp(`\\b${coin}\\b`);
    return pattern.test(joined);
  });
}

/** Generates a slug-style id from a narrative label. */
function labelToId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Returns ISO date string for `daysAgo` days before `now`. */
function daysAgo(daysAgoN: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgoN);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Core: detectNarratives
// ---------------------------------------------------------------------------

/**
 * Groups `articles` into 3-7 semantic market narratives via AI,
 * computes per-narrative velocity, and assigns momentum.
 */
export async function detectNarratives(
  articles: ArticleInput[]
): Promise<Narrative[]> {
  if (articles.length === 0) return [];

  // Build compact headline list for the AI prompt (cap at 200 articles)
  const headlines = articles
    .slice(0, 200)
    .map((a, i) => `${i + 1}. [${a.date.slice(0, 10)}] ${a.title}`)
    .join('\n');

  const systemPrompt =
    'You are a crypto market analyst specialising in narrative and theme detection. ' +
    'Respond only with valid JSON — no markdown, no explanation.';

  const userPrompt =
    `Identify 3-7 distinct market narratives from these crypto news headlines.\n\n${headlines}\n\n` +
    'For each narrative provide a JSON object with:\n' +
    '  "label": short name (2-4 words, e.g. "Bitcoin ETF Inflows"),\n' +
    '  "description": one sentence describing the theme,\n' +
    '  "coins": array of crypto ticker symbols relevant to this narrative,\n' +
    '  "headline_indices": array of 1-based indices from the list above that belong to this narrative.\n\n' +
    'Return a JSON array of these objects. Example:\n' +
    '[{"label":"Bitcoin ETF Inflows","description":"...","coins":["BTC"],"headline_indices":[1,4,7]}]';

  const now = new Date();
  const cutoff24h = daysAgo(1, now);
  const cutoff7d = daysAgo(7, now);

  // AI-powered grouping (falls back to single generic narrative when no provider)
  let rawNarratives: Array<{
    label: string;
    description: string;
    coins: string[];
    headline_indices: number[];
  }> = [];

  const aiAvailable = getAIConfigOrNull() !== null;

  if (aiAvailable) {
    try {
      const response = await aiComplete(systemPrompt, userPrompt, {
        maxTokens: 1000,
        temperature: 0.3,
        jsonMode: false,
      });

      // Strip possible markdown code fence
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        rawNarratives = parsed;
      }
    } catch {
      // Fall through to keyword-based fallback
    }
  }

  // Fallback: single "General Market" narrative with all articles
  if (rawNarratives.length === 0) {
    rawNarratives = [
      {
        label: 'General Market',
        description: 'Broad crypto market activity across all segments.',
        coins: extractCoins(articles.map((a) => a.title + ' ' + a.tags.join(' '))),
        headline_indices: articles.map((_, i) => i + 1),
      },
    ];
  }

  // Build Narrative objects
  const narratives: Narrative[] = rawNarratives.map((raw) => {
    const indices = (raw.headline_indices || []).map((i) => i - 1); // 0-based
    const relatedArticles = indices
      .filter((i) => i >= 0 && i < articles.length)
      .map((i) => articles[i]);

    // Velocity: (articles in last 24 h / articles in last 7 d) * 7
    const last24h = relatedArticles.filter((a) => a.date >= cutoff24h).length;
    const last7d = relatedArticles.filter((a) => a.date >= cutoff7d).length;
    const velocity =
      last7d > 0 ? parseFloat(((last24h / last7d) * 7).toFixed(2)) : last24h > 0 ? 7 : 0;

    // Momentum thresholds
    const momentum: Narrative['momentum'] =
      velocity > 1.5 ? 'rising' : velocity < 0.5 ? 'fading' : 'peaked';

    // Earliest article date in this narrative
    const dates = relatedArticles.map((a) => a.date).filter(Boolean).sort();
    const first_seen = dates[0] ?? new Date().toISOString();

    // Coin extraction: prefer AI-supplied list, then enrich from article text
    const articleTexts = relatedArticles
      .map((a) => `${a.title} ${a.tags.join(' ')}`)
      .concat(raw.coins || []);
    const coins =
      raw.coins && raw.coins.length > 0
        ? raw.coins
        : extractCoins(articleTexts);

    return {
      id: labelToId(raw.label),
      label: raw.label,
      description: raw.description || '',
      momentum,
      coins: [...new Set(coins)],
      article_count: relatedArticles.length,
      first_seen,
      velocity,
    };
  });

  // Sort by velocity descending
  return narratives.sort((a, b) => b.velocity - a.velocity);
}

// ---------------------------------------------------------------------------
// Core: getNarrativeSummary
// ---------------------------------------------------------------------------

/**
 * Returns a 2-sentence AI summary explaining why the narrative is trending
 * and what to watch for.
 *
 * Falls back to a deterministic string when no AI provider is available.
 */
export async function getNarrativeSummary(
  narrative: Narrative,
  articles: string[]
): Promise<string> {
  const aiAvailable = getAIConfigOrNull() !== null;

  if (!aiAvailable) {
    return (
      `The "${narrative.label}" narrative is currently ${narrative.momentum} ` +
      `with a velocity score of ${narrative.velocity.toFixed(1)}. ` +
      `Watch ${narrative.coins.slice(0, 3).join(', ')} for continued price and volume impact.`
    );
  }

  const snippets = articles.slice(0, 10).join('\n');
  const systemPrompt =
    'You are a concise crypto analyst. Respond with exactly 2 sentences. No bullet points.';
  const userPrompt =
    `Narrative: "${narrative.label}" (momentum: ${narrative.momentum}, velocity: ${narrative.velocity})\n\n` +
    `Recent headlines:\n${snippets}\n\n` +
    'In 2 sentences, explain why this narrative is trending and what traders should watch for.';

  try {
    const text = await aiComplete(systemPrompt, userPrompt, {
      maxTokens: 120,
      temperature: 0.4,
    });
    return text.trim();
  } catch {
    return (
      `The "${narrative.label}" narrative shows ${narrative.momentum} momentum. ` +
      `Track ${narrative.coins.slice(0, 3).join(', ')} for further developments.`
    );
  }
}
