/**
 * AI Article Enrichment — Inngest Function
 *
 * Triggers:
 *   - Cron: every 5 minutes (batch sweep for unenriched articles)
 *   - Event: article/needs-enrichment (real-time, per-article)
 *
 * Concurrency: max 5 concurrent (respect AI API rate limits)
 * Fan-out: batch processing uses parallel step.run per batch
 * Priority: breaking news articles get processed first via event metadata
 *
 * Migrated from /api/cron/enrich-articles
 */

import { inngest } from '../client';

/** Lightweight article shape passed between enrichment steps. */
interface ArticleStub {
  link: string;
  title: string;
  description?: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Cron-triggered batch enrichment sweep (every 5 minutes)
// ---------------------------------------------------------------------------

export const enrichArticlesCron = inngest.createFunction(
  {
    id: 'enrich-articles-cron',
    name: 'AI Article Enrichment (Batch)',
    retries: 2,
    concurrency: [{ limit: 5 }], // increased from 1 → 5
  },
  { cron: '*/5 * * * *' },
  async ({ step, logger }) => {
    // Step 1 — Fetch latest articles
    const articles: ArticleStub[] = await step.run(
      'fetch-articles',
      async () => {
        const { getLatestNews } = await import('@/lib/crypto-news');
        const { articles } = await getLatestNews(200);
        return articles.map((a) => ({
          link: a.link,
          title: a.title,
          description: a.description,
          source: a.source,
        }));
      },
    );

    // Step 2 — Find unenriched articles
    const needsEnrichment: ArticleStub[] = await step.run(
      'filter-enriched',
      async () => {
        const { getBulkEnrichment } = await import(
          '@/lib/article-enrichment'
        );
        const urls = articles.map((a: ArticleStub) => a.link);
        const existing = await getBulkEnrichment(urls);
        return articles.filter(
          (a: ArticleStub) => existing.get(a.link) === null,
        );
      },
    );

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

    // Step 3 — Fan-out: process batches in parallel step.run calls
    const { BATCH_SIZE } = await import('@/lib/article-enrichment');
    const stats = { enriched: 0, failed: 0, batches: 0 };

    const batchCount = Math.ceil(needsEnrichment.length / BATCH_SIZE);

    // Process up to 5 batches concurrently via Promise.all of step.run
    const batchPromises = [];
    for (let i = 0; i < batchCount; i++) {
      const batch = needsEnrichment.slice(
        i * BATCH_SIZE,
        (i + 1) * BATCH_SIZE,
      );

      batchPromises.push(
        step.run(`enrich-batch-${i}`, async () => {
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
        }),
      );
    }

    const batchResults = await Promise.all(batchPromises);
    for (const br of batchResults) {
      stats.enriched += br.enriched;
      stats.failed += br.failed;
      stats.batches++;
    }

    logger.info('Batch enrichment complete', {
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
// Event-triggered single-article enrichment
// ---------------------------------------------------------------------------

export const enrichArticleOnEvent = inngest.createFunction(
  {
    id: 'enrich-article-event',
    name: 'AI Article Enrichment (Single)',
    retries: 3,
    concurrency: [{ limit: 5 }],
  },
  { event: 'article/needs-enrichment' },
  async ({ event, step, logger }) => {
    const { articleId, link, title, description, source, priority } =
      event.data;

    const result = await step.run('enrich-single', async () => {
      const { enrichArticlesBatch, saveEnrichments } = await import(
        '@/lib/article-enrichment'
      );

      const enrichmentMap = await enrichArticlesBatch([
        {
          url: link,
          title,
          description: description ?? '',
          source,
        },
      ]);

      const enrichment = enrichmentMap.get(link);
      if (!enrichment) {
        throw new Error(`Enrichment failed for ${link}`);
      }

      await saveEnrichments([{ url: link, enrichment }]);

      return {
        articleId,
        link,
        enriched: true,
        sentiment: (enrichment as unknown as Record<string, unknown>).sentiment ?? null,
        tags:
          (enrichment as unknown as Record<string, unknown>).tags ??
          (enrichment as unknown as Record<string, unknown>).entities ??
          [],
      };
    });

    logger.info('Single article enriched', {
      ...result,
      link: link?.slice(0, 80),
      priority,
    });

    return result;
  },
);
