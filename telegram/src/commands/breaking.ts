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
import { articleLine } from '../format.js';

// ---------------------------------------------------------------------------
// /breaking — Breaking crypto news
// ---------------------------------------------------------------------------

interface BreakingResponse {
  articles: Array<{
    title: string;
    link: string;
    source: string;
    timeAgo?: string;
    pubDate?: string;
  }>;
  totalCount: number;
}

export async function breakingCommand(ctx: Context): Promise<void> {
  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<BreakingResponse>('/api/breaking', {
      limit: 5,
      priority: 'high',
    });

    if (!data.articles?.length) {
      await ctx.reply('No breaking news right now. Things are quiet! 🤫');
      return;
    }

    const lines = [
      '🚨 <b>Breaking News</b>',
      '',
      ...data.articles.map(a => articleLine(a)),
      '',
      `<i>${data.totalCount} breaking stories · cryptocurrency.cv</i>`,
    ];

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('breaking command error:', err);
    await ctx.reply('⚠️ Failed to fetch breaking news. Please try again later.');
  }
}
