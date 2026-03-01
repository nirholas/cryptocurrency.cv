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
import { escHtml, fmtUsd } from '../format.js';

// ---------------------------------------------------------------------------
// /whales — Recent whale transactions
// ---------------------------------------------------------------------------

interface WhaleAlert {
  id: string;
  blockchain: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  from: { address: string; owner?: string; ownerType: string };
  to: { address: string; owner?: string; ownerType: string };
  hash: string;
  timestamp: number;
  transactionType: string;
  significance: string;
}

interface WhaleResponse {
  alerts: WhaleAlert[];
  summary: {
    totalTransactions: number;
    totalValueUsd: number;
    exchangeDeposits: number;
    exchangeWithdrawals: number;
  };
  lastUpdated: string;
}

const TYPE_EMOJI: Record<string, string> = {
  exchange_deposit: '📥',
  exchange_withdrawal: '📤',
  whale_transfer: '🐋',
  unknown: '❓',
};

const SIG_EMOJI: Record<string, string> = {
  massive: '🔴',
  notable: '🟡',
  normal: '⚪',
};

export async function whalesCommand(ctx: Context): Promise<void> {
  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<WhaleResponse>('/api/whale-alerts', {
      limit: 6,
      minValue: 500_000,
    });

    if (!data.alerts?.length) {
      await ctx.reply('🐋 No whale movements detected recently. The ocean is calm.');
      return;
    }

    const lines = [
      '🐋 <b>Whale Alerts</b>',
      '',
    ];

    for (const a of data.alerts) {
      const typeE = TYPE_EMOJI[a.transactionType] || '❓';
      const sigE = SIG_EMOJI[a.significance] || '⚪';
      const from = a.from.owner ? escHtml(a.from.owner) : 'Unknown';
      const to = a.to.owner ? escHtml(a.to.owner) : 'Unknown';

      lines.push(
        `${sigE}${typeE} <b>${fmtUsd(a.amountUsd)}</b> ${escHtml(a.symbol)} · ${escHtml(a.blockchain)}`,
      );
      lines.push(`   ${from} → ${to}`);
    }

    if (data.summary) {
      const s = data.summary;
      lines.push(
        '',
        `<b>Summary:</b> ${s.totalTransactions} txns · ${fmtUsd(s.totalValueUsd)} total`,
        `📥 ${s.exchangeDeposits} deposits · 📤 ${s.exchangeWithdrawals} withdrawals`,
      );
    }

    lines.push('', '<i>On-chain whale tracking · cryptocurrency.cv</i>');

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('whales command error:', err);
    await ctx.reply('⚠️ Failed to fetch whale alerts.');
  }
}
