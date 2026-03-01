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
import type { InlineQueryResult } from 'grammy/types';
import { apiFetch } from './api.js';
import { escHtml, truncate, timeAgo } from './format.js';

// ---------------------------------------------------------------------------
// Inline mode — type @BotName <query> in any chat to share headlines
// ---------------------------------------------------------------------------

interface NewsResponse {
  articles: Array<{
    title: string;
    link: string;
    description?: string;
    source: string;
    pubDate?: string;
    timeAgo?: string;
    imageUrl?: string;
  }>;
}

export async function handleInlineQuery(ctx: Context): Promise<void> {
  const query = ctx.inlineQuery?.query?.trim() || '';

  try {
    // Fetch news, optionally filtered by query as search
    let articles: NewsResponse['articles'];

    if (query.length >= 2) {
      const data = await apiFetch<{ articles: NewsResponse['articles'] }>('/api/search', {
        q: query,
        limit: 10,
      });
      articles = data.articles || [];
    } else {
      const data = await apiFetch<NewsResponse>('/api/news', { limit: 10 });
      articles = data.articles || [];
    }

    const results: InlineQueryResult[] = articles.map((a, i) => {
      const time = a.timeAgo || (a.pubDate ? timeAgo(a.pubDate) : '');
      const desc = a.description
        ? truncate(a.description, 200)
        : `${a.source}${time ? ' · ' + time : ''}`;

      const messageText =
        `📰 <b>${escHtml(a.title)}</b>\n\n` +
        (a.description ? `${escHtml(truncate(a.description, 300))}\n\n` : '') +
        `🔗 <a href="${a.link}">Read more</a> · ${escHtml(a.source)}${time ? ' · ' + time : ''}\n\n` +
        `<i>via Free Crypto News · cryptocurrency.cv</i>`;

      return {
        type: 'article' as const,
        id: String(i),
        title: truncate(a.title, 120),
        description: desc,
        thumbnail_url: a.imageUrl || 'https://cryptocurrency.cv/icon-192x192.png',
        input_message_content: {
          message_text: messageText,
          parse_mode: 'HTML' as const,
          link_preview_options: { is_disabled: true },
        },
      };
    });

    await ctx.answerInlineQuery(results, {
      cache_time: 60,
      is_personal: false,
    });
  } catch (err) {
    console.error('inline query error:', err);
    await ctx.answerInlineQuery([], { cache_time: 10 });
  }
}
