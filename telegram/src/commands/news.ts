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
import { escHtml, articleLine } from '../format.js';

// ---------------------------------------------------------------------------
// /news [category] — Latest crypto news headlines
// ---------------------------------------------------------------------------

interface NewsResponse {
  articles: Array<{
    title: string;
    link: string;
    source: string;
    timeAgo?: string;
    pubDate?: string;
    category?: string;
  }>;
  totalCount: number;
}

export async function newsCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? '';
  const parts = text.split(/\s+/).slice(1);
  const category = parts[0] || undefined;

  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<NewsResponse>('/api/news', {
      limit: 8,
      category,
    });

    if (!data.articles?.length) {
      await ctx.reply('No news articles found. Try again shortly.');
      return;
    }

    const catLabel = category ? ` · ${escHtml(category)}` : '';
    const lines = [
      `📰 <b>Latest Crypto News</b>${catLabel}`,
      '',
      ...data.articles.map(a => articleLine(a)),
      '',
      `<i>${data.totalCount} articles available · cryptocurrency.cv</i>`,
    ];

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('news command error:', err);
    await ctx.reply('⚠️ Failed to fetch news. Please try again later.');
  }
}
