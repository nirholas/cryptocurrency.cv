/**
 * Inngest Functions — Background Job Definitions
 *
 * Each function mirrors an existing Vercel Cron route. The original API routes
 * remain as fallback — these Inngest functions are the preferred execution path
 * for reliability, retries, and observability.
 *
 * Schedules use Inngest cron (same syntax as Vercel / standard cron).
 *
 * @see src/app/api/cron/* for the original implementations
 */

import { NonRetriableError } from 'inngest';
import { inngest } from './client';

/** Lightweight article shape passed between enrichment steps. */
interface ArticleStub {
  link: string;
  title: string;
  description?: string;
  source: string;
}

// ---------------------------------------------------------------------------
// 1. archive-kv — Hourly archive news to Vercel KV
// ---------------------------------------------------------------------------

export const archiveKv = inngest.createFunction(
  {
    id: 'archive-kv',
    name: 'Archive News to KV',
    retries: 3,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 * * * *' }, // every hour
  async ({ step, logger }) => {
    const result = await step.run('archive-news', async () => {
      const { archiveNews } = await import('@/lib/archive-service');
      return archiveNews();
    });

    const stats = await step.run('get-stats', async () => {
      const { getArchiveStats } = await import('@/lib/archive-service');
      return getArchiveStats();
    });

    logger.info('Archive complete', {
      articlesArchived: result.articlesArchived,
      duplicatesSkipped: result.duplicatesSkipped,
      totalArticles: stats?.totalArticles ?? null,
    });

    return {
      success: result.success,
      articlesProcessed: result.articlesProcessed,
      articlesArchived: result.articlesArchived,
      duplicatesSkipped: result.duplicatesSkipped,
      totalArticles: stats?.totalArticles ?? null,
    };
  },
);

// ---------------------------------------------------------------------------
// 2. digest — Daily AI digest at 8 AM UTC
// ---------------------------------------------------------------------------

export const digest = inngest.createFunction(
  {
    id: 'daily-digest',
    name: 'AI Daily Digest',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 8 * * *' }, // daily at 08:00 UTC
  async ({ step, logger }) => {
    // Step 1 — Determine base URL
    const baseUrl = await step.run('resolve-base-url', async () => {
      if (process.env.NEXTAUTH_URL)
        return process.env.NEXTAUTH_URL.replace(/\/$/, '');
      if (process.env.VERCEL_URL)
        return `https://${process.env.VERCEL_URL}`;
      return 'http://localhost:3000';
    });

    // Step 2 — Fetch digest from internal API
    const digestPayload = await step.run('fetch-digest', async () => {
      const res = await fetch(`${baseUrl}/api/digest?format=ai-digest`, {
        headers: { 'x-internal-cron': '1' },
        cache: 'no-store',
      });
      if (!res.ok) {
        const details = await res.text().catch(() => String(res.status));
        throw new Error(`Digest fetch failed (${res.status}): ${details}`);
      }
      return res.json();
    });

    // Step 3 — Persist to archive/meta/
    const savedPath = await step.run('persist-archive', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      const date: string =
        digestPayload.date ?? new Date().toISOString().slice(0, 10);
      const filename = `daily-digest-${date}.json`;
      const filepath = path.join(process.cwd(), 'archive', 'meta', filename);
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(
        filepath,
        JSON.stringify(digestPayload, null, 2),
        'utf-8',
      );
      return `archive/meta/${filename}`;
    });

    // Step 4 — Optional newsletter webhook
    const webhookUrl = process.env.NEWSLETTER_WEBHOOK;
    if (webhookUrl) {
      await step.run('notify-webhook', async () => {
        const date =
          digestPayload.date ?? new Date().toISOString().slice(0, 10);
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'daily-digest',
            date,
            sections_generated: digestPayload.sections?.length ?? 0,
            digest_url: `${baseUrl}/api/digest?format=ai-digest`,
            generated_at: digestPayload.generated_at,
          }),
        });
      });
    }

    logger.info('Digest persisted', { savedPath });

    return {
      success: true,
      sections_generated: digestPayload.sections?.length ?? 0,
      saved_to: savedPath,
    };
  },
);

// ---------------------------------------------------------------------------
// 3. x-sentiment — Daily X/Twitter sentiment analysis
// ---------------------------------------------------------------------------

export const xSentiment = inngest.createFunction(
  {
    id: 'x-sentiment',
    name: 'X Sentiment Analysis',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 0 * * *' }, // daily at midnight UTC
  async ({ step, logger }) => {
    const ALERT_THRESHOLD = 0.2;

    // Step 1 — Enumerate influencer lists
    const lists = await step.run('get-influencer-lists', async () => {
      const { getAllInfluencerLists } = await import('@/lib/x-scraper');
      return getAllInfluencerLists();
    });

    // Step 2 — Process each list as its own sub-step for isolation
    const results: Array<{
      listId: string;
      success: boolean;
      sentiment?: number;
      previousSentiment?: number;
      alertSent?: boolean;
      error?: string;
    }> = [];

    for (const list of lists) {
      const listResult = await step.run(
        `process-list-${list.id}`,
        async () => {
          try {
            const { kv } = await import('@vercel/kv');
            const { fetchListSentiment, sendSentimentAlert } = await import(
              '@/lib/x-scraper'
            );

            // Previous sentiment
            const previousKey = `x:sentiment:${list.id}:previous`;
            let previousSentiment: number | null = null;
            try {
              previousSentiment = await kv.get<number>(previousKey);
            } catch {
              /* KV optional */
            }

            // Fetch fresh sentiment
            const sentiment = await fetchListSentiment(list.id, {
              forceRefresh: true,
              tweetsPerUser: 15,
            });

            if (!sentiment) {
              return {
                listId: list.id,
                success: false,
                error: 'Failed to fetch sentiment',
              };
            }

            // Store for next comparison
            try {
              await kv.set(previousKey, sentiment.aggregateSentiment, {
                ex: 86400,
              });
            } catch {
              /* KV optional */
            }

            // Check alert threshold
            const change =
              previousSentiment !== null
                ? Math.abs(sentiment.aggregateSentiment - previousSentiment)
                : 0;

            let alertSent = false;
            if (change >= ALERT_THRESHOLD) {
              const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
              if (discordWebhook) {
                alertSent = await sendSentimentAlert(
                  discordWebhook,
                  sentiment,
                  previousSentiment ?? undefined,
                );
              }
            }

            return {
              listId: list.id,
              success: true,
              sentiment: sentiment.aggregateSentiment,
              previousSentiment: previousSentiment ?? undefined,
              alertSent,
            };
          } catch (err) {
            return {
              listId: list.id,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            };
          }
        },
      );
      results.push(listResult);
    }

    logger.info('X sentiment complete', {
      listsProcessed: results.length,
      successful: results.filter((r) => r.success).length,
    });

    return {
      success: true,
      listsProcessed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      alertsSent: results.filter((r) => r.alertSent).length,
    };
  },
);

// ---------------------------------------------------------------------------
// 4. coverage-gap — Every 6 hours
// ---------------------------------------------------------------------------

export const coverageGap = inngest.createFunction(
  {
    id: 'coverage-gap',
    name: 'Coverage Gap Detection',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 */6 * * *' }, // every 6 hours
  async ({ step, logger }) => {
    // Step 1 — Load indexes
    const indexes = await step.run('load-indexes', async () => {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const root = path.join(process.cwd(), 'archive');

      let byDate: Record<string, string[]> = {};
      let byTicker: Record<string, string[]> = {};

      try {
        byDate = JSON.parse(
          await fs.readFile(
            path.join(root, 'indexes', 'by-date.json'),
            'utf-8',
          ),
        );
      } catch {
        /* empty */
      }

      try {
        byTicker = JSON.parse(
          await fs.readFile(
            path.join(root, 'indexes', 'by-ticker.json'),
            'utf-8',
          ),
        );
      } catch {
        /* empty */
      }

      return { byDate, byTicker };
    });

    // Step 2 — Analyse gaps (CPU-bound, no I/O)
    const gaps = await step.run('analyze-gaps', async () => {
      const { byDate, byTicker } = indexes;

      function lastNDays(days: number): string[] {
        const result: string[] = [];
        const now = new Date();
        for (let i = 0; i < days; i++) {
          const d = new Date(now);
          d.setUTCDate(d.getUTCDate() - i);
          result.push(d.toISOString().slice(0, 10));
        }
        return result;
      }

      const days7 = new Set(lastNDays(7));
      const days2 = new Set(lastNDays(2));
      const idsIn7d = new Set<string>();
      const idsIn48h = new Set<string>();

      for (const [date, ids] of Object.entries(byDate)) {
        if (days7.has(date)) ids.forEach((id) => idsIn7d.add(id));
        if (days2.has(date)) ids.forEach((id) => idsIn48h.add(id));
      }

      interface TagStat {
        tag: string;
        ids48h: number;
        historicalTotal: number;
        lastArticleDate: string | null;
      }

      const allDates = Object.keys(byDate).sort();
      const oldestDate = allDates[0];
      const newestDate = allDates[allDates.length - 1];
      let totalWeeks = 1;
      if (oldestDate && newestDate) {
        const ms =
          new Date(newestDate).getTime() - new Date(oldestDate).getTime();
        totalWeeks = Math.max(1, ms / (7 * 24 * 60 * 60 * 1000));
      }

      const idToDate = new Map<string, string>();
      for (const [date, ids] of Object.entries(byDate)) {
        for (const id of ids) {
          const existing = idToDate.get(id);
          if (!existing || date > existing) idToDate.set(id, date);
        }
      }

      const tagStats: TagStat[] = [];
      for (const [tag, allIds] of Object.entries(byTicker)) {
        const normalised = tag.toLowerCase();
        let ids48hCount = 0;
        for (const id of allIds) {
          if (idsIn48h.has(id)) ids48hCount++;
        }

        let lastDate: string | null = null;
        for (const id of allIds) {
          const d = idToDate.get(id) ?? null;
          if (d && (!lastDate || d > lastDate)) lastDate = d;
        }

        const avgPerWeek = allIds.length / totalWeeks;
        if (ids48hCount < 2 && avgPerWeek > 10) {
          tagStats.push({
            tag: normalised,
            ids48h: ids48hCount,
            historicalTotal: allIds.length,
            lastArticleDate: lastDate,
          });
        }
      }

      tagStats.sort((a, b) => {
        const scoreA =
          a.historicalTotal / totalWeeks / Math.max(1, a.ids48h);
        const scoreB =
          b.historicalTotal / totalWeeks / Math.max(1, b.ids48h);
        return scoreB - scoreA;
      });

      return tagStats.slice(0, 20).map((s) => {
        const avgPerWeek = s.historicalTotal / totalWeeks;
        return {
          tag: s.tag,
          gap_score: Math.round(
            (avgPerWeek / Math.max(1, s.ids48h)) * 10,
          ),
          last_article_date: s.lastArticleDate,
          suggested_headline: `Coverage gap: "${s.tag}" — ${s.ids48h} article${s.ids48h === 1 ? '' : 's'} in last 48 h (avg ${avgPerWeek.toFixed(1)}/week)`,
        };
      });
    });

    // Step 3 — Persist report
    const reportPath = await step.run('persist-report', async () => {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const today = new Date().toISOString().slice(0, 10);
      const report = {
        generated_at: new Date().toISOString(),
        date: today,
        window_days: 7,
        gaps,
      };
      const metaDir = path.join(process.cwd(), 'archive', 'meta');
      await fs.mkdir(metaDir, { recursive: true });
      const filePath = path.join(metaDir, `coverage-gaps-${today}.json`);
      await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
      return `archive/meta/coverage-gaps-${today}.json`;
    });

    logger.info('Coverage gap report written', {
      gaps: gaps.length,
      reportPath,
    });

    return { success: true, gaps_found: gaps.length, report_path: reportPath };
  },
);

// ---------------------------------------------------------------------------
// 5. predictions — Daily AI price predictions
// ---------------------------------------------------------------------------

export const predictions = inngest.createFunction(
  {
    id: 'predictions',
    name: 'AI Price Predictions',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 0 * * *' }, // daily at midnight UTC
  async ({ step, logger }) => {
    const COINS = [
      { id: 'bitcoin', symbol: 'BTC' },
      { id: 'ethereum', symbol: 'ETH' },
      { id: 'solana', symbol: 'SOL' },
      { id: 'ripple', symbol: 'XRP' },
    ];

    const today = new Date().toISOString().slice(0, 10);

    // Step 1 — Fetch current prices
    const prices = await step.run('fetch-prices', async () => {
      const { COINGECKO_BASE } = await import('@/lib/constants');
      const ids = COINS.map((c) => c.id).join(',');
      const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
      const data = (await res.json()) as Record<string, { usd: number }>;
      return Object.fromEntries(
        Object.entries(data).map(([id, v]) => [id, v.usd]),
      );
    });

    // Step 2 — Score yesterday's predictions
    await step.run('score-yesterday', async () => {
      const { promises: fs } = await import('fs');
      const pathMod = await import('path');
      const archiveDir = pathMod.join(
        process.cwd(),
        'archive',
        'predictions',
      );
      const yesterday = new Date(Date.now() - 86_400_000)
        .toISOString()
        .slice(0, 10);
      const filePath = pathMod.join(archiveDir, `${yesterday}.json`);

      let file: { date: string; predictions: Array<Record<string, unknown>>; results?: unknown[] } | null = null;
      try {
        file = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      } catch {
        return; // no file to score
      }
      if (!file || (file.results && (file.results as unknown[]).length > 0)) return;

      const scoredAt = new Date().toISOString();
      const results = (file.predictions as Array<{
        coin: string;
        coingecko_id: string;
        predicted_24h: number;
        current_price: number;
      }>)
        .filter((p) => prices[p.coingecko_id] !== undefined)
        .map((p) => {
          const actual = prices[p.coingecko_id];
          const delta_pct =
            ((actual - p.predicted_24h) / p.predicted_24h) * 100;
          const predictedUp = p.predicted_24h > p.current_price;
          const actualUp = actual > p.current_price;
          return {
            coin: p.coin,
            coingecko_id: p.coingecko_id,
            predicted_price_24h: p.predicted_24h,
            actual_price: actual,
            delta_pct: Math.round(delta_pct * 100) / 100,
            direction_correct: predictedUp === actualUp,
            scored_at: scoredAt,
          };
        });

      file.results = results;
      await fs.mkdir(pathMod.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(file, null, 2), 'utf-8');
    });

    // Step 3 — Check idempotency
    const existing = await step.run('check-existing', async () => {
      const { promises: fs } = await import('fs');
      const pathMod = await import('path');
      const filePath = pathMod.join(
        process.cwd(),
        'archive',
        'predictions',
        `${today}.json`,
      );
      try {
        const raw = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        if (raw?.predictions?.length > 0) return raw;
      } catch {
        /* file doesn't exist yet */
      }
      return null;
    });

    if (existing) {
      logger.info('Predictions already exist for today', { date: today });
      return {
        success: true,
        date: today,
        message: 'Predictions already written for today',
        predictions: existing.predictions.length,
      };
    }

    // Step 4 — Generate AI predictions
    const predictionsData = await step.run('generate-predictions', async () => {
      const { getAIConfigOrNull, aiComplete } = await import(
        '@/lib/ai-provider'
      );
      const aiConfig = getAIConfigOrNull(true); // prefer Groq
      if (!aiConfig) {
        throw new NonRetriableError('No AI provider configured');
      }

      const now = new Date().toISOString();
      const priceLines = COINS.map(
        (c) =>
          `${c.symbol} (${c.id}): $${prices[c.id]?.toLocaleString() ?? 'N/A'}`,
      ).join('\n');

      const systemPrompt =
        'You are a quantitative crypto analyst. Your task is to produce short-term price predictions. Reply ONLY with valid JSON — no markdown, no commentary. The JSON must be an array of prediction objects.';

      const userPrompt = `Current prices (UTC ${now}):\n${priceLines}\n\nFor each coin, predict:\n- predicted_24h: price after 24 hours\n- predicted_7d: price after 7 days\n- reasoning: 1-2 sentences of technical/macro rationale\n- confidence: float 0.0–1.0\n\nRespond ONLY with this JSON array (no markdown):\n[\n  {\n    "coin": "BTC",\n    "coingecko_id": "bitcoin",\n    "current_price": 0,\n    "predicted_24h": 0,\n    "predicted_7d": 0,\n    "reasoning": "...",\n    "confidence": 0.0\n  },\n  ...\n]`;

      const raw = await aiComplete(systemPrompt, userPrompt, {
        maxTokens: 800,
        temperature: 0.4,
        jsonMode: true,
      });

      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch)
        throw new Error(`AI returned non-JSON: ${raw.slice(0, 200)}`);
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        coin: string;
        coingecko_id: string;
        current_price: number;
        predicted_24h: number;
        predicted_7d: number;
        reasoning: string;
        confidence: number;
      }>;

      return parsed.map((p) => ({
        coin: p.coin,
        coingecko_id: p.coingecko_id,
        current_price: prices[p.coingecko_id] ?? p.current_price,
        predicted_24h: p.predicted_24h,
        predicted_7d: p.predicted_7d,
        reasoning: p.reasoning,
        confidence: Math.min(1, Math.max(0, p.confidence ?? 0.5)),
        model: aiConfig.model,
        timestamp: now,
      }));
    });

    // Step 5 — Persist predictions
    await step.run('persist-predictions', async () => {
      const { promises: fs } = await import('fs');
      const pathMod = await import('path');
      const archiveDir = pathMod.join(
        process.cwd(),
        'archive',
        'predictions',
      );
      await fs.mkdir(archiveDir, { recursive: true });
      await fs.writeFile(
        pathMod.join(archiveDir, `${today}.json`),
        JSON.stringify({ date: today, predictions: predictionsData }, null, 2),
        'utf-8',
      );
    });

    logger.info('Predictions generated', {
      date: today,
      coins: predictionsData.map((p) => p.coin),
    });

    return {
      success: true,
      date: today,
      predictions: predictionsData.length,
      coins: predictionsData.map((p) => p.coin),
    };
  },
);

// ---------------------------------------------------------------------------
// 6. tag-scores — Every 6 hours
// ---------------------------------------------------------------------------

export const tagScores = inngest.createFunction(
  {
    id: 'tag-scores',
    name: 'Tag Score Computation',
    retries: 3,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 */6 * * *' }, // every 6 hours
  async ({ step, logger }) => {
    const result = await step.run('compute-scores', async () => {
      const { computeAllTagScores } = await import('@/lib/tagScoring');
      const scores = await computeAllTagScores();

      const tagCount = Object.keys(scores).length;
      const values = Object.values(scores);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      // Persist to KV
      try {
        const { kv } = await import('@vercel/kv');
        await kv.set(
          'tag_scores:all',
          { scores, computed_at: new Date().toISOString() },
          { ex: 6 * 60 * 60 },
        );
      } catch {
        // KV not configured — scores still cached per-tag
      }

      return {
        tagCount,
        stats: {
          min: Math.min(...values).toFixed(3),
          max: Math.max(...values).toFixed(3),
          avg: avg.toFixed(3),
        },
      };
    });

    logger.info('Tag scores computed', result);

    return { success: true, ...result };
  },
);

// ---------------------------------------------------------------------------
// 7. enrich-articles — Every 5 minutes
// ---------------------------------------------------------------------------

export const enrichArticles = inngest.createFunction(
  {
    id: 'enrich-articles',
    name: 'AI Article Enrichment',
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: '*/5 * * * *' }, // every 5 minutes
  async ({ step, logger }) => {
    // Step 1 — Fetch latest articles
    const articles: ArticleStub[] = await step.run('fetch-articles', async () => {
      const { getLatestNews } = await import('@/lib/crypto-news');
      const { articles } = await getLatestNews(200);
      return articles.map((a) => ({
        link: a.link,
        title: a.title,
        description: a.description,
        source: a.source,
      }));
    });

    // Step 2 — Find unenriched articles
    const needsEnrichment: ArticleStub[] = await step.run('filter-enriched', async () => {
      const { getBulkEnrichment } = await import('@/lib/article-enrichment');
      const urls = articles.map((a: ArticleStub) => a.link);
      const existing = await getBulkEnrichment(urls);
      return articles.filter((a: ArticleStub) => existing.get(a.link) === null);
    });

    if (needsEnrichment.length === 0) {
      logger.info('All articles already enriched', {
        total: articles.length,
      });
      return {
        success: true,
        stats: {
          total: articles.length,
          alreadyEnriched: articles.length,
          enriched: 0,
          failed: 0,
          batches: 0,
        },
      };
    }

    // Step 3 — Process batches (each as its own step for retry isolation)
    const { BATCH_SIZE } = await import('@/lib/article-enrichment');
    const stats = { enriched: 0, failed: 0, batches: 0 };

    const batchCount = Math.ceil(needsEnrichment.length / BATCH_SIZE);
    for (let i = 0; i < batchCount; i++) {
      const batch = needsEnrichment.slice(
        i * BATCH_SIZE,
        (i + 1) * BATCH_SIZE,
      );

      const batchResult = await step.run(
        `enrich-batch-${i}`,
        async () => {
          const { enrichArticlesBatch, saveEnrichments } = await import(
            '@/lib/article-enrichment'
          );

          try {
            const enrichmentMap = await enrichArticlesBatch(
              batch.map((a) => ({
                url: a.link,
                title: a.title,
                description: a.description,
                source: a.source,
              })),
            );

            const toSave = Array.from(enrichmentMap.entries()).map(
              ([url, enrichment]) => ({ url, enrichment }),
            );
            await saveEnrichments(toSave);

            return {
              enriched: toSave.length,
              failed: batch.length - toSave.length,
            };
          } catch {
            return { enriched: 0, failed: batch.length };
          }
        },
      );

      stats.enriched += batchResult.enriched;
      stats.failed += batchResult.failed;
      stats.batches++;
    }

    logger.info('Enrichment complete', {
      total: articles.length,
      alreadyEnriched: articles.length - needsEnrichment.length,
      ...stats,
    });

    return {
      success: true,
      stats: {
        total: articles.length,
        alreadyEnriched: articles.length - needsEnrichment.length,
        ...stats,
      },
    };
  },
);

// ---------------------------------------------------------------------------
// Export all functions for the Inngest serve handler
// ---------------------------------------------------------------------------

export const allFunctions = [
  archiveKv,
  digest,
  xSentiment,
  coverageGap,
  predictions,
  tagScores,
  enrichArticles,
];
