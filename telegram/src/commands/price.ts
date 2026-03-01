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
import { escHtml, fmtUsd, fmtPct } from '../format.js';

// ---------------------------------------------------------------------------
// /price <coin> — Check crypto prices
// ---------------------------------------------------------------------------

/** CoinGecko ID mapping for common tickers */
const TICKER_MAP: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  xrp: 'ripple',
  ada: 'cardano',
  doge: 'dogecoin',
  dot: 'polkadot',
  avax: 'avalanche-2',
  matic: 'matic-network',
  pol: 'matic-network',
  link: 'chainlink',
  uni: 'uniswap',
  atom: 'cosmos',
  near: 'near',
  apt: 'aptos',
  sui: 'sui',
  arb: 'arbitrum',
  op: 'optimism',
  pepe: 'pepe',
  shib: 'shiba-inu',
  ltc: 'litecoin',
  bch: 'bitcoin-cash',
  etc: 'ethereum-classic',
  fil: 'filecoin',
  ton: 'the-open-network',
  trx: 'tron',
};

type PriceResponse = Record<string, { usd: number; usd_24h_change: number }>;

export async function priceCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? '';
  const parts = text.split(/\s+/).slice(1);

  if (!parts.length) {
    // Default: show BTC, ETH, SOL
    parts.push('btc', 'eth', 'sol');
  }

  // Map tickers → CoinGecko IDs
  const coinIds = parts
    .map(p => TICKER_MAP[p.toLowerCase()] || p.toLowerCase())
    .slice(0, 10);

  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<PriceResponse>('/api/prices', {
      coins: coinIds.join(','),
    });

    const lines = ['💰 <b>Crypto Prices</b>', ''];

    for (const id of coinIds) {
      const info = data[id];
      if (!info) {
        lines.push(`• <b>${escHtml(id)}</b>: not found`);
        continue;
      }
      const name = id.charAt(0).toUpperCase() + id.slice(1);
      const ticker = Object.entries(TICKER_MAP).find(([, v]) => v === id)?.[0]?.toUpperCase() || id.toUpperCase();
      lines.push(
        `• <b>${escHtml(name)}</b> (${escHtml(ticker)}): ${fmtUsd(info.usd)}  ${fmtPct(info.usd_24h_change)}`,
      );
    }

    lines.push('', '<i>Data via CoinGecko · cryptocurrency.cv</i>');

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('price command error:', err);
    await ctx.reply('⚠️ Failed to fetch prices. Please try again later.');
  }
}
