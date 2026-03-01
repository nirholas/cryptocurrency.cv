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
import { escHtml } from '../format.js';

// ---------------------------------------------------------------------------
// /ask <question> — AI-powered Q&A about crypto news
// ---------------------------------------------------------------------------

interface AskResponse {
  question: string;
  answer: string;
  sourcesUsed: number;
  answeredAt: string;
}

export async function askCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? '';
  const question = text.replace(/^\/ask\s*/i, '').trim();

  if (!question) {
    await ctx.reply(
      '💡 <b>Ask me anything about crypto!</b>\n\n' +
        'Usage: <code>/ask your question here</code>\n\n' +
        'Examples:\n' +
        '• <code>/ask What happened with Bitcoin today?</code>\n' +
        '• <code>/ask Is Ethereum bullish right now?</code>\n' +
        '• <code>/ask Latest SEC crypto regulation news</code>',
      { parse_mode: 'HTML' },
    );
    return;
  }

  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<AskResponse>('/api/ask', {
      q: question,
    });

    const lines = [
      `🤖 <b>Q:</b> ${escHtml(question)}`,
      '',
      escHtml(data.answer),
      '',
      `<i>${data.sourcesUsed} sources analyzed · cryptocurrency.cv</i>`,
    ];

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('ask command error:', err);
    await ctx.reply('⚠️ AI Q&A is temporarily unavailable. Please try again later.');
  }
}
