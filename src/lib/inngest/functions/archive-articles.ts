/**
 * Archive Articles — Inngest Function
 *
 * Triggers:
 *   - Cron: every hour (batch archive)
 *   - Event: article/published (real-time archive on publish)
 *
 * Migrated from /api/cron/archive-kv
 */

import { inngest } from '../client';

// ---------------------------------------------------------------------------
// Cron-triggered batch archive (hourly)
// ---------------------------------------------------------------------------

export const archiveArticlesCron = inngest.createFunction(
  {
    id: 'archive-articles-cron',
    name: 'Archive News to KV (Cron)',
    retries: 3,
    concurrency: [{ limit: 1 }],
  },
  { cron: '0 * * * *' },
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
// Event-triggered real-time archive (on article publish)
// ---------------------------------------------------------------------------

export const archiveArticleOnPublish = inngest.createFunction(
  {
    id: 'archive-article-on-publish',
    name: 'Archive Single Article (Event)',
    retries: 3,
    concurrency: [{ limit: 5 }],
  },
  { event: 'article/published' },
  async ({ event, step, logger }) => {
    const { articleId, title, source } = event.data;

    const result = await step.run('archive-single', async () => {
      try {
        const { kv } = await import('@vercel/kv');
        const existing = await kv.get(`article:${articleId}`);
        if (existing) return { skipped: true, reason: 'duplicate' };

        await kv.set(
          `article:${articleId}`,
          { ...event.data, archivedAt: new Date().toISOString() },
          { ex: 30 * 24 * 60 * 60 }, // 30 day TTL
        );
        return { skipped: false, archived: true };
      } catch {
        // KV not available — degrade gracefully
        return { skipped: true, reason: 'kv-unavailable' };
      }
    });

    // Emit enrichment event for newly published articles
    if (!result.skipped) {
      await step.sendEvent('request-enrichment', {
        name: 'article/needs-enrichment',
        data: {
          articleId,
          link: event.data.link,
          title,
          source,
          priority: 'normal' as const,
        },
      });
    }

    logger.info('Article archive event processed', {
      articleId,
      title: title?.slice(0, 60),
      source,
      ...result,
    });

    return result;
  },
);
