/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Tag Score Recalculation — Inngest Function
 *
 * Triggers:
 *   - Cron: every 6 hours
 *
 * Logic: Recalculates relevance scores for all tags based on recent data.
 *
 * Migrated from /api/cron/tag-scores
 */

import { inngest } from '../client';

export const tagScoreRecalculation = inngest.createFunction(
  {
    id: 'tag-score-recalculation',
    name: 'Tag Score Computation',
    retries: 3,
    concurrency: [{ limit: 1 }],
    triggers: { cron: '0 */6 * * *' },
  },
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
