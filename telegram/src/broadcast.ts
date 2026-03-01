/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import type { Bot, Context } from 'grammy';
import { apiFetch } from './api.js';
import { escHtml, articleLine } from './format.js';
import { CHANNEL_ID, BROADCAST_INTERVAL_MS } from './config.js';

// ---------------------------------------------------------------------------
// Channel broadcast — auto-post breaking news to a Telegram channel
// ---------------------------------------------------------------------------

interface BreakingResponse {
  articles: Array<{
    title: string;
    link: string;
    source: string;
    timeAgo?: string;
    pubDate?: string;
    description?: string;
  }>;
}

/** Track posted article links to avoid duplicates */
const postedLinks = new Set<string>();
const MAX_POSTED_CACHE = 500;

function pruneCache(): void {
  if (postedLinks.size > MAX_POSTED_CACHE) {
    const entries = [...postedLinks];
    for (let i = 0; i < entries.length - MAX_POSTED_CACHE / 2; i++) {
      postedLinks.delete(entries[i]);
    }
  }
}

async function broadcastOnce(bot: Bot<Context>): Promise<void> {
  if (!CHANNEL_ID) return;

  try {
    const data = await apiFetch<BreakingResponse>('/api/breaking', {
      limit: 5,
      priority: 'high',
    });

    const newArticles = (data.articles || []).filter(a => !postedLinks.has(a.link));

    for (const article of newArticles.slice(0, 3)) {
      const desc = article.description
        ? `\n${escHtml(article.description.slice(0, 200))}\n`
        : '';

      const message =
        `🚨 <b>BREAKING</b>\n\n` +
        `<b>${escHtml(article.title)}</b>\n` +
        desc +
        `\n🔗 <a href="${article.link}">Read more</a> · ${escHtml(article.source)}\n\n` +
        `<i>Free Crypto News · cryptocurrency.cv</i>`;

      await bot.api.sendMessage(CHANNEL_ID, message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });

      postedLinks.add(article.link);

      // Small delay between messages to avoid flood
      await new Promise(r => setTimeout(r, 1000));
    }

    pruneCache();
  } catch (err) {
    console.error('broadcast error:', err);
  }
}

let broadcastTimer: ReturnType<typeof setInterval> | null = null;

/** Start the periodic channel broadcast */
export function startBroadcast(bot: Bot<Context>): void {
  if (!CHANNEL_ID) {
    console.log('ℹ️  No TELEGRAM_CHANNEL_ID set — channel broadcast disabled');
    return;
  }

  console.log(`📡 Channel broadcast → ${CHANNEL_ID} every ${BROADCAST_INTERVAL_MS / 1000}s`);

  // Run once immediately, then on interval
  broadcastOnce(bot);
  broadcastTimer = setInterval(() => broadcastOnce(bot), BROADCAST_INTERVAL_MS);
}

/** Stop the broadcast */
export function stopBroadcast(): void {
  if (broadcastTimer) {
    clearInterval(broadcastTimer);
    broadcastTimer = null;
  }
}
