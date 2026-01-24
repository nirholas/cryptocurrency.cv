/**
 * X Sentiment Cron Job
 * 
 * Automatically fetches and caches sentiment from all influencer lists.
 * Sends alerts to configured webhooks when sentiment changes significantly.
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/x-sentiment",
 *     "schedule": "0,30 * * * *"
 *   }]
 * }
 * 
 * Environment variables:
 * - CRON_SECRET: Secret to authenticate cron requests
 * - DISCORD_WEBHOOK_URL: Discord webhook for alerts
 * - SLACK_WEBHOOK_URL: Slack webhook for alerts
 * - TELEGRAM_BOT_TOKEN: Telegram bot for alerts
 * - TELEGRAM_CHAT_ID: Telegram chat ID for alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import {
  getAllInfluencerLists,
  fetchListSentiment,
  sendSentimentAlert,
  SentimentResult,
} from '@/lib/x-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for full refresh

// Threshold for sending alerts (20% sentiment change)
const ALERT_THRESHOLD = 0.2;

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow in development or if no secret configured
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const startTime = Date.now();
  const results: {
    listId: string;
    success: boolean;
    sentiment?: number;
    previousSentiment?: number;
    alertSent?: boolean;
    error?: string;
  }[] = [];

  try {
    // Get all lists
    const lists = await getAllInfluencerLists();
    
    for (const list of lists) {
      try {
        // Get previous sentiment for comparison
        const previousKey = `x:sentiment:${list.id}:previous`;
        let previousSentiment: number | null = null;
        
        try {
          previousSentiment = await kv.get<number>(previousKey);
        } catch {
          // Ignore KV errors
        }

        // Fetch fresh sentiment
        const sentiment = await fetchListSentiment(list.id, {
          forceRefresh: true,
          tweetsPerUser: 15,
        });

        if (!sentiment) {
          results.push({
            listId: list.id,
            success: false,
            error: 'Failed to fetch sentiment',
          });
          continue;
        }

        // Store current sentiment for next comparison
        try {
          await kv.set(previousKey, sentiment.aggregateSentiment, { ex: 86400 }); // 24h TTL
        } catch {
          // Ignore KV errors
        }

        // Check if we should send alert
        const sentimentChange = previousSentiment !== null
          ? Math.abs(sentiment.aggregateSentiment - previousSentiment)
          : 0;

        let alertSent = false;

        if (sentimentChange >= ALERT_THRESHOLD) {
          // Send Discord alert
          const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
          if (discordWebhook) {
            alertSent = await sendSentimentAlert(
              discordWebhook,
              sentiment,
              previousSentiment || undefined
            );
          }

          // Send Slack alert
          const slackWebhook = process.env.SLACK_WEBHOOK_URL;
          if (slackWebhook) {
            await sendSlackAlert(slackWebhook, sentiment, previousSentiment);
          }

          // Send Telegram alert
          const telegramBot = process.env.TELEGRAM_BOT_TOKEN;
          const telegramChat = process.env.TELEGRAM_CHAT_ID;
          if (telegramBot && telegramChat) {
            await sendTelegramAlert(telegramBot, telegramChat, sentiment, previousSentiment);
          }
        }

        results.push({
          listId: list.id,
          success: true,
          sentiment: sentiment.aggregateSentiment,
          previousSentiment: previousSentiment || undefined,
          alertSent,
        });
      } catch (error) {
        console.error(`Error processing list ${list.id}:`, error);
        results.push({
          listId: list.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        listsProcessed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        alertsSent: results.filter((r) => r.alertSent).length,
        results,
        durationMs: duration,
      },
      meta: {
        schedule: 'Every 30 minutes (0,30 * * * *)',
        alertThreshold: `${ALERT_THRESHOLD * 100}% sentiment change`,
        nextRun: getNextCronRun(),
      },
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

async function sendSlackAlert(
  webhookUrl: string,
  result: SentimentResult,
  previousSentiment: number | null
): Promise<boolean> {
  const sentimentChange = previousSentiment !== null
    ? result.aggregateSentiment - previousSentiment
    : 0;

  const emoji = result.sentimentLabel === 'bullish' ? ':chart_with_upwards_trend:' : 
                result.sentimentLabel === 'bearish' ? ':chart_with_downwards_trend:' : ':bar_chart:';

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} X Sentiment Update: ${result.listName}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Sentiment:*\n${(result.aggregateSentiment * 100).toFixed(1)}% ${result.sentimentLabel}`,
          },
          {
            type: 'mrkdwn',
            text: `*Change:*\n${sentimentChange >= 0 ? '+' : ''}${(sentimentChange * 100).toFixed(1)}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Tweets Analyzed:*\n${result.tweetCount}`,
          },
          {
            type: 'mrkdwn',
            text: `*Confidence:*\n${(result.confidence * 100).toFixed(0)}%`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Top Tickers:* ${result.topTickers.slice(0, 5).map((t) => t.ticker).join(', ')}`,
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function sendTelegramAlert(
  botToken: string,
  chatId: string,
  result: SentimentResult,
  previousSentiment: number | null
): Promise<boolean> {
  const sentimentChange = previousSentiment !== null
    ? result.aggregateSentiment - previousSentiment
    : 0;

  const emoji = result.sentimentLabel === 'bullish' ? '🟢' : 
                result.sentimentLabel === 'bearish' ? '🔴' : '🟡';
  const changeEmoji = sentimentChange > 0 ? '📈' : sentimentChange < 0 ? '📉' : '';

  const message = `
${emoji} *X Sentiment Update: ${result.listName}* ${changeEmoji}

*Sentiment:* ${(result.aggregateSentiment * 100).toFixed(1)}% ${result.sentimentLabel.toUpperCase()}
*Change:* ${sentimentChange >= 0 ? '+' : ''}${(sentimentChange * 100).toFixed(1)}%
*Confidence:* ${(result.confidence * 100).toFixed(0)}%

📊 *Tweets Analyzed:* ${result.tweetCount}

🏷️ *Top Tickers:*
${result.topTickers.slice(0, 5).map((t) => 
  `• ${t.ticker}: ${t.mentions} mentions (${(t.sentiment * 100).toFixed(0)}%)`
).join('\n')}

🔥 *Recent Notable Tweet:*
${result.recentTweets[0] ? `@${result.recentTweets[0].username}: "${result.recentTweets[0].content.slice(0, 150)}..."` : 'None'}
`.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

function getNextCronRun(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextMinutes = minutes < 30 ? 30 : 60;
  const next = new Date(now);
  next.setMinutes(nextMinutes % 60);
  next.setSeconds(0);
  next.setMilliseconds(0);
  if (nextMinutes === 60) {
    next.setHours(next.getHours() + 1);
  }
  return next.toISOString();
}
