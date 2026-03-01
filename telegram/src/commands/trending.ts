/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import type { Context } from 'grammy';
import { apiFetch } from '../api.js';
import { escHtml, sentimentEmoji } from '../format.js';

// ---------------------------------------------------------------------------
// /trending — Trending topics
// ---------------------------------------------------------------------------

interface TrendingResponse {
  trending: Array<{
    topic: string;
    count: number;
    sentiment: string;
    recentHeadlines: string[];
  }>;
  timeWindow: string;
  articlesAnalyzed: number;
}

export async function trendingCommand(ctx: Context): Promise<void> {
  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<TrendingResponse>('/api/trending', {
      limit: 8,
      hours: 24,
    });

    if (!data.trending?.length) {
      await ctx.reply('No trending topics found right now.');
      return;
    }

    const lines = [
      '🔥 <b>Trending in Crypto</b> (24h)',
      '',
    ];

    for (let i = 0; i < data.trending.length; i++) {
      const t = data.trending[i];
      const rank = i + 1;
      const emoji = sentimentEmoji(t.sentiment);
      lines.push(
        `<b>${rank}.</b> ${escHtml(t.topic)} ${emoji}  <i>(${t.count} mentions)</i>`,
      );
      if (t.recentHeadlines?.[0]) {
        lines.push(`   └ ${escHtml(t.recentHeadlines[0].slice(0, 100))}`);
      }
    }

    lines.push('', `<i>${data.articlesAnalyzed} articles analyzed · cryptocurrency.cv</i>`);

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('trending command error:', err);
    await ctx.reply('⚠️ Failed to fetch trending topics.');
  }
}
