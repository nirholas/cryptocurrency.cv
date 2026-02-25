/**
 * Sentiment Analysis — Inngest Function
 *
 * Triggers:
 *   - Cron: daily at midnight UTC
 *   - Event: sentiment/refresh (manual or chained trigger)
 *
 * Fan-out: processes each influencer list as a parallel sub-step.
 *
 * Migrated from /api/cron/x-sentiment
 */

import { inngest } from '../client';

export const sentimentAnalysis = inngest.createFunction(
  {
    id: 'sentiment-analysis',
    name: 'X Sentiment Analysis',
    retries: 2,
    concurrency: [{ limit: 2 }],
  },
  [
    { cron: '0 0 * * *' },     // daily at midnight UTC
    { event: 'sentiment/refresh' }, // on-demand refresh
  ],
  async ({ event, step, logger }) => {
    const ALERT_THRESHOLD = 0.2;
    const isEventDriven = event?.name === 'sentiment/refresh';
    const forceSources = isEventDriven ? (event.data?.sources ?? null) : null;

    // Step 1 — Enumerate influencer lists
    const lists = await step.run('get-influencer-lists', async () => {
      const { getAllInfluencerLists } = await import('@/lib/x-scraper');
      const allLists = await getAllInfluencerLists();

      // If event specifies sources, filter to those
      if (forceSources && forceSources.length > 0) {
        const sourceSet = new Set(forceSources.map((s: string) => s.toLowerCase()));
        return allLists.filter(
          (l: { id: string }) => sourceSet.has(l.id.toLowerCase()),
        );
      }
      return allLists;
    });

    // Step 2 — Process each list (fan-out via parallel step.run calls)
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
      eventDriven: isEventDriven,
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
